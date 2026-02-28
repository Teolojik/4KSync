import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../shared/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export type PeerState = {
    [peerId: string]: {
        connection: RTCPeerConnection;
        stream?: MediaStream;
        screenStream?: MediaStream;
        nickname?: string;
        transceivers?: {
            mic: RTCRtpTransceiver;
            cam: RTCRtpTransceiver;
            screenVideo: RTCRtpTransceiver;
            screenAudio: RTCRtpTransceiver;
        };
    };
};

export interface ChatMessage {
    id: string;
    senderId: string;
    senderNickname?: string;
    text: string;
    timestamp: Date;
}

const mungeSDP = (sdp: string) => {
    let newSdp = sdp;
    if (newSdp.includes('111 minptime=10;useinbandfec=1')) {
        newSdp = newSdp.replace(
            '111 minptime=10;useinbandfec=1',
            '111 minptime=10;useinbandfec=1;stereo=1;sprop-stereo=1;maxaveragebitrate=510000'
        );
    } else if (newSdp.includes('a=fmtp:111')) {
        newSdp = newSdp.replace(/a=fmtp:111(.*)/g, 'a=fmtp:111$1;stereo=1;sprop-stereo=1;maxaveragebitrate=510000');
    }
    return newSdp;
};

export const useWebRTC = (roomId: string, userId: string, nickname: string = 'Guest', shouldConnect: boolean = true) => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const [peers, setPeers] = useState<PeerState>({});
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [netStats, setNetStats] = useState({ upload: '0.00', download: '0.00', ping: '0' });
    const [qualityWarning, setQualityWarning] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [adminId, setAdminId] = useState<string | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedVideoId, setSelectedVideoId] = useState<string>('');
    const [selectedAudioId, setSelectedAudioId] = useState<string>('');
    const [participantCount, setParticipantCount] = useState(shouldConnect ? 1 : 0);

    const peersRef = useRef<PeerState>({});
    const channelRef = useRef<RealtimeChannel | null>(null);
    const statsRef = useRef({ lastBytesSent: 0, lastBytesReceived: 0, lastTime: Date.now() });

    const localStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);

    useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
    useEffect(() => { screenStreamRef.current = screenStream; }, [screenStream]);

    // Network Stats Polling
    useEffect(() => {
        const interval = setInterval(async () => {
            let currentBytesSent = 0;
            let currentBytesReceived = 0;
            let highestPing = 0;
            let highestLoss = 0;

            for (const peerId of Object.keys(peersRef.current)) {
                const pc = peersRef.current[peerId]?.connection;
                if (!pc) continue;
                try {
                    const stats = await pc.getStats();
                    stats.forEach((report) => {
                        // outbound-rtp matches exactly what we send
                        if (report.type === 'outbound-rtp') {
                            currentBytesSent += report.bytesSent || 0;
                        }
                        // inbound-rtp matches what we receive
                        else if (report.type === 'inbound-rtp') {
                            currentBytesReceived += report.bytesReceived || 0;
                        }
                        // Network latency (Ping/Ms)
                        else if (report.type === 'candidate-pair' && report.state === 'succeeded' && report.currentRoundTripTime !== undefined) {
                            const pingMs = report.currentRoundTripTime * 1000;
                            if (pingMs > highestPing) highestPing = pingMs;
                        }
                        // Packet loss
                        else if (report.type === 'remote-inbound-rtp' && report.fractionLost !== undefined) {
                            if (report.fractionLost > highestLoss) highestLoss = report.fractionLost;
                        }
                    });
                } catch (e) {
                    console.error('Error fetching stats', e);
                }
            }

            const now = Date.now();
            const timeDiff = (now - statsRef.current.lastTime) / 1000;

            if (timeDiff > 0) {
                const sentDiffBits = (currentBytesSent - statsRef.current.lastBytesSent) * 8;
                const recvDiffBits = (currentBytesReceived - statsRef.current.lastBytesReceived) * 8;

                // Mbps calculation
                let uploadMbps = (sentDiffBits / 1000000 / timeDiff).toFixed(2);
                let downloadMbps = (recvDiffBits / 1000000 / timeDiff).toFixed(2);

                if (Number(uploadMbps) < 0) uploadMbps = '0.00';
                if (Number(downloadMbps) < 0) downloadMbps = '0.00';

                setNetStats({ upload: uploadMbps, download: downloadMbps, ping: highestPing.toFixed(0) });

                // If packet loss > 5% or ping > 200ms, trigger warning
                const isPoorNetwork = highestLoss > 0.05 || highestPing > 200;
                setQualityWarning(isPoorNetwork);

                // ABR (Adaptive Bitrate) Motoru
                Object.values(peersRef.current).forEach(({ transceivers }) => {
                    const senders = [transceivers?.cam?.sender, transceivers?.screenVideo?.sender];
                    senders.forEach(sender => {
                        if (sender && sender.track) {
                            try {
                                const params = sender.getParameters();
                                let changed = false;
                                if (params.encodings && params.encodings.length > 0) {
                                    let enc = params.encodings[0];
                                    if (isPoorNetwork) {
                                        // Ağ zayıfsa: Çözünürlüğü yarıya indir, FPS'yi 15'e sabitle
                                        if (enc.scaleResolutionDownBy !== 2) {
                                            enc.scaleResolutionDownBy = 2;
                                            enc.maxFramerate = 15;
                                            changed = true;
                                        }
                                    } else if (highestLoss === 0 && highestPing < 100) {
                                        // Ağ çok iyiyse: Kısıtlamaları kaldır (Tam kalite dönsün)
                                        if (enc.scaleResolutionDownBy === 2) {
                                            enc.scaleResolutionDownBy = 1;
                                            delete enc.maxFramerate;
                                            changed = true;
                                        }
                                    }
                                }
                                if (changed) {
                                    sender.setParameters(params).catch(e => console.error('ABR update failed', e));
                                }
                            } catch (error) {
                                // Bazı tarayıcı state koşullarında getParameters hata fırlatabilir, göz ardı et
                            }
                        }
                    });
                });
            }

            statsRef.current = { lastBytesSent: currentBytesSent, lastBytesReceived: currentBytesReceived, lastTime: now };
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Check ban status immediately
    useEffect(() => {
        if (typeof window !== 'undefined' && localStorage.getItem(`banned_${roomId}`)) {
            window.location.href = '/?reason=banned';
        }
    }, [roomId]);

    const kickUser = (targetId: string) => {
        if (!isAdmin) return;
        broadcastSignal(targetId, 'admin-action', { action: 'kick' });
    };

    const banUser = (targetId: string) => {
        if (!isAdmin) return;
        broadcastSignal(targetId, 'admin-action', { action: 'ban' });
    };

    const toggleRoomLock = async (locked: boolean) => {
        if (!isAdmin) return;
        setIsLocked(locked);
        // Persist to DB
        const { error } = await supabase
            .from('rooms')
            .update({ is_locked: locked })
            .eq('id', roomId);

        if (error) {
            // If room doesn't exist, insert it
            await supabase.from('rooms').insert({
                id: roomId,
                is_locked: locked,
                admin_id: userId
            });
        }
        broadcastSignal(null, 'admin-action', { action: 'lock', locked });
    };

    const remoteMuteUser = (targetId: string) => {
        if (!isAdmin) return;
        broadcastSignal(targetId, 'admin-action', { action: 'remote-mute' });
    };

    const remoteCloseVideo = (targetId: string) => {
        if (!isAdmin) return;
        broadcastSignal(targetId, 'admin-action', { action: 'remote-video-off' });
    };

    // Device Management
    useEffect(() => {
        const getDevices = async () => {
            try {
                const devs = await navigator.mediaDevices.enumerateDevices();
                setDevices(devs);

                // Set defaults if not set
                const videoDev = devs.find(d => d.kind === 'videoinput');
                const audioDev = devs.find(d => d.kind === 'audioinput');
                if (videoDev && !selectedVideoId) setSelectedVideoId(videoDev.deviceId);
                if (audioDev && !selectedAudioId) setSelectedAudioId(audioDev.deviceId);
            } catch (err) {
                console.error("Error enumerating devices", err);
            }
        };
        getDevices();
        navigator.mediaDevices.addEventListener('devicechange', getDevices);
        return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    }, [selectedVideoId, selectedAudioId]);

    const updatePeers = (peerId: string, data: Partial<PeerState['string']>) => {
        peersRef.current = {
            ...peersRef.current,
            [peerId]: {
                ...peersRef.current[peerId],
                ...data,
            } as any,
        };
        setPeers({ ...peersRef.current });
    };

    const removePeer = (peerId: string) => {
        if (peersRef.current[peerId]) {
            peersRef.current[peerId].connection.close();
            const updatedPeers = { ...peersRef.current };
            delete updatedPeers[peerId];
            peersRef.current = updatedPeers;
            setPeers(updatedPeers);
        }
    };

    const broadcastSignal = (targetId: string | null, type: string, payload: any) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'signal',
                payload: {
                    senderId: userId,
                    targetId,
                    type,
                    data: payload,
                },
            });
        }
    };

    const sendChatMessage = async (text: string) => {
        // We write to DB, and listen via postgres_changes for UI update
        const { error } = await supabase.from('messages').insert({
            room_id: roomId,
            sender_id: userId,
            nickname: nickname,
            content: text
        });

        if (error) {
            console.error('Mesaj kaydedilemedi:', error);
            // Fallback: update UI locally if DB fail
            const msg: ChatMessage = {
                id: self.crypto.randomUUID(),
                senderId: userId,
                senderNickname: nickname,
                text,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, msg]);
        }
    };

    const createPeerConnection = (peerId: string, isInitiator: boolean) => {
        if (peersRef.current[peerId]) return peersRef.current[peerId].connection;

        const pc = new RTCPeerConnection(ICE_SERVERS);

        const micTrack = localStreamRef.current?.getAudioTracks()[0];
        const camTrack = localStreamRef.current?.getVideoTracks()[0];
        const screenVideoTrack = screenStreamRef.current?.getVideoTracks()[0];
        const screenAudioTrack = screenStreamRef.current?.getAudioTracks()[0];

        // B. Simulcast (Çoklu Kalite Katmanı) altyapısı - 3 farklı kalite yollar (sunucu uyumlu)
        const videoEncodings = [
            { rid: 'q', active: true, scaleResolutionDownBy: 4, maxBitrate: 500000 },
            { rid: 'h', active: true, scaleResolutionDownBy: 2, maxBitrate: 1500000 },
            { rid: 'f', active: true, maxBitrate: 8000000 }
        ];

        const micTc = pc.addTransceiver(micTrack || 'audio', { direction: 'sendrecv' });
        const camTc = pc.addTransceiver(camTrack || 'video', {
            direction: 'sendrecv',
            sendEncodings: videoEncodings
        });
        const screenVideoTc = pc.addTransceiver(screenVideoTrack || 'video', {
            direction: 'sendrecv',
            sendEncodings: videoEncodings
        });
        const screenAudioTc = pc.addTransceiver(screenAudioTrack || 'audio', { direction: 'sendrecv' });

        // C. VP9/AV1 Codec Önceliği (Daha düşük bitrate ile daha yüksek kalite)
        const applyVP9Preference = (tc: RTCRtpTransceiver) => {
            if (typeof RTCRtpReceiver !== 'undefined' && RTCRtpReceiver.getCapabilities && 'setCodecPreferences' in tc) {
                const caps = RTCRtpReceiver.getCapabilities('video');
                if (caps && caps.codecs) {
                    const vp9 = caps.codecs.filter(c => c.mimeType.toLowerCase() === 'video/vp9');
                    if (vp9.length > 0) {
                        const others = caps.codecs.filter(c => c.mimeType.toLowerCase() !== 'video/vp9');
                        try {
                            // VP9'u listenin başına koyuyoruz
                            tc.setCodecPreferences([...vp9, ...others]);
                        } catch (e) {
                            console.error('VP9 önceliklendirme başarısız:', e);
                        }
                    }
                }
            }
        };

        applyVP9Preference(camTc);
        applyVP9Preference(screenVideoTc);

        const remoteCamStream = new MediaStream();
        const remoteScreenStream = new MediaStream();

        updatePeers(peerId, {
            connection: pc,
            stream: remoteCamStream,
            screenStream: remoteScreenStream,
            transceivers: { mic: micTc, cam: camTc, screenVideo: screenVideoTc, screenAudio: screenAudioTc }
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                broadcastSignal(peerId, 'ice-candidate', event.candidate);
            }
        };

        pc.ontrack = (event) => {
            if (event.transceiver === micTc || event.transceiver === camTc) {
                remoteCamStream.addTrack(event.track);
            } else if (event.transceiver === screenVideoTc || event.transceiver === screenAudioTc) {
                remoteScreenStream.addTrack(event.track);
            }
            updatePeers(peerId, {});
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
                removePeer(peerId);
            }
        };

        pc.onnegotiationneeded = async () => {
            if (isInitiator) {
                const offer = await pc.createOffer();
                offer.sdp = mungeSDP(offer.sdp || '');
                await pc.setLocalDescription(offer);
                broadcastSignal(peerId, 'offer', pc.localDescription);
            }
        };

        return pc;
    };

    const syncVideoConstraints = async (sender: RTCRtpSender, maxBitrate?: number) => {
        if (!sender.track || sender.track.kind !== 'video') return;
        const params = sender.getParameters();

        if (params.encodings && params.encodings.length > 1) {
            // Simulcast devredeyse, en üst kalite katmanına sınırı uygula
            if (maxBitrate) {
                params.encodings[2].maxBitrate = maxBitrate; // f (Full)
                params.encodings[1].maxBitrate = maxBitrate / 2; // h (Half)
                params.encodings[0].maxBitrate = maxBitrate / 4; // q (Quarter)
            }
        } else {
            if (!params.encodings) params.encodings = [{}];
            if (maxBitrate) {
                params.encodings[0].maxBitrate = maxBitrate;
            }
        }

        try {
            await sender.setParameters(params);
        } catch (err) {
            console.error('Video kısıtlamaları ayarlanamadı', err);
        }
    };

    useEffect(() => {
        if (!shouldConnect) return;

        const channel = supabase.channel(`room-${roomId}`);
        channelRef.current = channel;

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                let masterAdminId = null;

                // Priority 1: Check if 'Teolojik' is present
                for (const id in state) {
                    const presence = state[id][0] as any;
                    if (presence && presence.nickname === 'Teolojik') {
                        masterAdminId = presence.userId;
                        break; // Boss found
                    }
                }

                // If no Teolojik, we could fallback to oldest, but user said "başka admin olmasın"
                // which suggests Teolojik is the only valid admin name.

                if (masterAdminId === userId) {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
                setAdminId(masterAdminId);
                const count = Object.keys(state).length;
                setParticipantCount(count >= 1 ? count : 1);
            })
            .on('presence', { event: 'join' }, ({ newPresences }: { newPresences: any[] }) => {
                newPresences.forEach((presence: any) => {
                    if (presence.userId !== userId) {
                        if (isAdmin && isLocked) {
                            kickUser(presence.userId);
                            return;
                        }

                        if (!peersRef.current[presence.userId]) {
                            updatePeers(presence.userId, { nickname: presence.nickname || 'Guest' });
                            createPeerConnection(presence.userId, true);
                        }
                    }
                });
                const count = Object.keys(channel.presenceState()).length;
                setParticipantCount(count >= 1 ? count : 1);
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences: any[] }) => {
                leftPresences.forEach((presence: any) => {
                    removePeer(presence.userId);
                });
                const count = Object.keys(channel.presenceState()).length;
                setParticipantCount(count >= 1 ? count : 1);
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `room_id=eq.${roomId}`
            }, (payload) => {
                const newMsg = payload.new;
                // Avoid double adding if somehow broadcast was also used
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, {
                        id: newMsg.id,
                        senderId: newMsg.sender_id,
                        senderNickname: newMsg.nickname,
                        text: newMsg.content,
                        timestamp: new Date(newMsg.created_at)
                    }];
                });
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'rooms',
                filter: `id=eq.${roomId}`
            }, (payload) => {
                if (payload.new && payload.new.is_locked !== undefined) {
                    setIsLocked(payload.new.is_locked);
                }
            })
            // Deleted broadcast/chat listener as we use postgres_changes now
            .on('broadcast', { event: 'signal' }, async ({ payload }: { payload: any }) => {
                const { senderId, targetId, type, data } = payload;

                if (senderId === userId) return;

                if (type === 'admin-action') {
                    if (data.action === 'lock') {
                        setIsLocked(data.locked);
                    } else if (targetId === userId) {
                        if (data.action === 'kick') {
                            window.location.href = '/?reason=kicked';
                        } else if (data.action === 'ban') {
                            localStorage.setItem(`banned_${roomId}`, 'true');
                            window.location.href = '/?reason=banned';
                        } else if (data.action === 'remote-mute') {
                            if (localStreamRef.current) {
                                localStreamRef.current.getAudioTracks().forEach(t => t.enabled = false);
                                setIsMuted(true);
                            }
                        } else if (data.action === 'remote-video-off') {
                            if (localStreamRef.current) {
                                localStreamRef.current.getVideoTracks().forEach(t => t.enabled = false);
                                setIsVideoOff(true);
                            }
                        }
                    }
                    return;
                }

                if (targetId && targetId !== userId) return;

                let pc = peersRef.current[senderId]?.connection;
                if (!pc) {
                    pc = createPeerConnection(senderId, false);
                }

                if (type === 'offer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(data));
                    const answer = await pc.createAnswer();
                    answer.sdp = mungeSDP(answer.sdp || '');
                    await pc.setLocalDescription(answer);
                    broadcastSignal(senderId, 'answer', pc.localDescription);

                    const screenVideoSender = peersRef.current[senderId]?.transceivers?.screenVideo.sender;
                    if (screenVideoSender) {
                        syncVideoConstraints(screenVideoSender);
                    }
                } else if (type === 'answer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(data));
                    const screenVideoSender = peersRef.current[senderId]?.transceivers?.screenVideo.sender;
                    if (screenVideoSender) {
                        syncVideoConstraints(screenVideoSender);
                    }
                } else if (type === 'ice-candidate') {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(data));
                    } catch (e) {
                        console.error('Error adding received ice candidate', e);
                    }
                }
            })
            .subscribe(async (status: any) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ userId, nickname, onlineAt: new Date().toISOString() });

                    // Initial Room State Fetch
                    const { data: roomData } = await supabase
                        .from('rooms')
                        .select('*')
                        .eq('id', roomId)
                        .single();

                    if (roomData) {
                        setIsLocked(roomData.is_locked);
                    }

                    // Initial Message History Fetch
                    const { data: history } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('room_id', roomId)
                        .order('created_at', { ascending: true })
                        .limit(50);

                    if (history) {
                        setMessages(history.map(m => ({
                            id: m.id,
                            senderId: m.sender_id,
                            senderNickname: m.nickname,
                            text: m.content,
                            timestamp: new Date(m.created_at)
                        })));
                    }
                }
            });

        return () => {
            Object.keys(peersRef.current).forEach(removePeer);
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, userId, shouldConnect]);

    // We don't use a bulk replaceTracks anymore, we replace specific transceiver tracks directly
    const updateCamTracks = (newStream: MediaStream | null, maxBitrate?: number) => {
        Object.values(peersRef.current).forEach(({ transceivers }) => {
            if (transceivers) {
                const videoTrack = newStream?.getVideoTracks()[0] || null;
                const audioTrack = newStream?.getAudioTracks()[0] || null;
                transceivers.cam.sender.replaceTrack(videoTrack);
                transceivers.mic.sender.replaceTrack(audioTrack);

                // Apply bitrate constraint on camera video sender
                if (maxBitrate && videoTrack) {
                    const params = transceivers.cam.sender.getParameters();
                    if (!params.encodings || params.encodings.length === 0) {
                        params.encodings = [{}];
                    }
                    params.encodings[0].maxBitrate = maxBitrate;
                    transceivers.cam.sender.setParameters(params).catch(console.error);
                }
            }
        });
    };

    const updateScreenTracks = (newStream: MediaStream | null, maxBitrate?: number) => {
        Object.values(peersRef.current).forEach(({ transceivers }) => {
            if (transceivers) {
                const videoTrack = newStream?.getVideoTracks()[0] || null;
                const audioTrack = newStream?.getAudioTracks()[0] || null;
                transceivers.screenVideo.sender.replaceTrack(videoTrack);
                transceivers.screenAudio.sender.replaceTrack(audioTrack);
                syncVideoConstraints(transceivers.screenVideo.sender, maxBitrate);
            }
        });
    };

    const stopScreenShare = () => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            setScreenStream(null);
            updateScreenTracks(null);
        }
    };

    const startScreenShare = async (resolution: '1080p' | '1440p' | '4k' = '1080p') => {
        let width, height, maxBitrate, frameRate;

        switch (resolution) {
            case '4k':
                width = 3840; height = 2160; maxBitrate = 20000000; frameRate = 60;
                break;
            case '1440p':
                width = 2560; height = 1440; maxBitrate = 8000000; frameRate = 60;
                break;
            case '1080p':
            default:
                width = 1920; height = 1080; maxBitrate = 4000000; frameRate = 60;
                break;
        }

        try {
            const stream = await (navigator.mediaDevices as any).getDisplayMedia({
                video: {
                    width: { ideal: width },
                    height: { ideal: height },
                    frameRate: { ideal: frameRate },
                    displaySurface: 'monitor'
                },
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                },
                systemAudio: 'include'
            });
            setScreenStream(stream);

            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack && 'contentHint' in videoTrack) {
                videoTrack.contentHint = 'detail'; // Metinlerin/videonun bulanıklaşmasını engeller
            }

            videoTrack.onended = stopScreenShare;

            updateScreenTracks(stream, maxBitrate);
        } catch (err) {
            console.error("Screen sharing failed", err);
        }
    };

    const stopWebcam = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            setLocalStream(null);
            updateCamTracks(null);
        }
    };

    const startWebcam = async (isCinemaMode = false, resolution: '720p' | '1080p' | '1440p' = '720p') => {
        let width, height, maxBitrate, frameRate;

        switch (resolution) {
            case '1440p':
                width = 2560; height = 1440; maxBitrate = 8000000; frameRate = 30;
                break;
            case '1080p':
                width = 1920; height = 1080; maxBitrate = 4000000; frameRate = 30;
                break;
            case '720p':
            default:
                width = 1280; height = 720; maxBitrate = 2500000; frameRate = 30;
                break;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: selectedVideoId ? { exact: selectedVideoId } : undefined,
                    width: { ideal: width },
                    height: { ideal: height },
                    frameRate: { ideal: frameRate }
                },
                audio: isCinemaMode
                    ? {
                        deviceId: selectedAudioId ? { exact: selectedAudioId } : undefined,
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                        channelCount: 2
                    }
                    : {
                        deviceId: selectedAudioId ? { exact: selectedAudioId } : undefined,
                    }
            });
            setLocalStream(stream);
            updateCamTracks(stream, maxBitrate);
        } catch (err) {
            console.error("Webcam failed", err);
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!localStream.getAudioTracks()[0]?.enabled);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!localStream.getVideoTracks()[0]?.enabled);
        }
    };

    return {
        localStream,
        screenStream,
        peers,
        messages,
        isReconnecting,
        isMuted,
        isVideoOff,
        netStats,
        qualityWarning,
        isAdmin,
        isLocked,
        adminId,
        devices,
        selectedVideoId,
        selectedAudioId,
        setSelectedVideoId,
        setSelectedAudioId,
        participantCount,
        kickUser,
        banUser,
        remoteMuteUser,
        remoteCloseVideo,
        toggleRoomLock,
        sendChatMessage,
        startScreenShare,
        stopScreenShare,
        startWebcam,
        stopWebcam,
        toggleAudio,
        toggleVideo
    };
};
