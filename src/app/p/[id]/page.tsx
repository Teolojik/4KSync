'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useWebRTC } from '@/features/webrtc/hooks/useWebRTC';
import { useMediaSync } from '@/features/sync/hooks/useMediaSync';
import { VideoOff, ExternalLink, Maximize } from 'lucide-react';
import { ControlBar } from '@/features/webrtc/ui/ControlBar';
import { ParticipantGrid, GridItem } from '@/features/media/ui/ParticipantGrid';
import { ChatBox } from '@/features/chat/ui/ChatBox';
import { useUser } from '@/shared/providers/UserProvider';
import { RoomSettingsModal } from '@/features/webrtc/ui/RoomSettingsModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: channelId } = use(params);
    const { userId, nickname, hasJoined, setNickname } = useUser();

    const { localStream, screenStream, peers, startScreenShare, stopScreenShare, startWebcam, stopWebcam, messages, sendChatMessage, isReconnecting, isMuted, isVideoOff, netStats, qualityWarning, toggleAudio, toggleVideo, isAdmin, isLocked, adminId, participantCount, devices, selectedVideoId, selectedAudioId, setSelectedVideoId, setSelectedAudioId, kickUser, banUser, remoteMuteUser, remoteCloseVideo, toggleRoomLock } = useWebRTC(channelId, userId, nickname, hasJoined);

    const mainVideoRef = useRef<HTMLVideoElement>(null);
    const mainStageRef = useRef<HTMLDivElement>(null);
    const { isHost } = useMediaSync(channelId, userId);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Sync media state with global window for Sidebar
    useEffect(() => {
        const handleOpenSettings = () => setIsSettingsOpen(true);
        window.addEventListener('webrtc-open-settings', handleOpenSettings);
        return () => window.removeEventListener('webrtc-open-settings', handleOpenSettings);
    }, []);

    useEffect(() => {
        const handleToggleMic = () => {
            if (!localStream) {
                startWebcam(false);
            } else {
                toggleAudio();
            }
        };
        const handleToggleVid = () => {
            if (!localStream) {
                startWebcam(false);
            } else {
                toggleVideo();
            }
        };

        window.addEventListener('webrtc-toggle-mic', handleToggleMic);
        window.addEventListener('webrtc-toggle-video', handleToggleVid);

        return () => {
            window.removeEventListener('webrtc-toggle-mic', handleToggleMic);
            window.removeEventListener('webrtc-toggle-video', handleToggleVid);
        };
    }, [toggleAudio, toggleVideo, localStream, startWebcam]);

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('webrtc-mic-state', { detail: isMuted }));
    }, [isMuted]);

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('webrtc-video-state', { detail: isVideoOff }));
    }, [isVideoOff]);

    // Collect all media streams into a unified array
    const allStreams: GridItem[] = [];

    if (localStream) {
        allStreams.push({ id: 'local-cam', stream: localStream, nickname: `${nickname || 'Sen'} (Kamera)`, type: 'cam', isLocal: true });
    }
    if (screenStream) {
        allStreams.push({ id: 'local-screen', stream: screenStream, nickname: `${nickname || 'Sen'} (Ekran)`, type: 'screen', isLocal: true });
    }

    // Helper: check if a MediaStream has at least one live, unmuted video track
    const hasActiveVideo = (stream?: MediaStream) => {
        if (!stream) return false;
        return stream.getVideoTracks().some(t => t.readyState === 'live' && !t.muted);
    };

    Object.entries(peers).forEach(([peerId, peer]) => {
        if (hasActiveVideo(peer.stream)) {
            allStreams.push({ id: `${peerId}-cam`, stream: peer.stream!, nickname: peer.nickname ? `${peer.nickname} (Kamera)` : 'Guest', type: 'cam', isLocal: false });
        }
        if (hasActiveVideo(peer.screenStream)) {
            allStreams.push({ id: `${peerId}-screen`, stream: peer.screenStream!, nickname: peer.nickname ? `${peer.nickname} (Ekran)` : 'Ekran', type: 'screen', isLocal: false });
        }
    });

    // Focus state for switching between streams
    const [focusedId, setFocusedId] = useState<string | null>(null);
    const [manuallyMinimized, setManuallyMinimized] = useState(false);
    const [mobileTab, setMobileTab] = useState<'chat' | 'participants'>('chat');

    // Reset manuallyMinimized when screen share starts or stops
    useEffect(() => {
        if (screenStream) {
            setManuallyMinimized(false); // New screen share → allow auto-focus
        }
    }, [screenStream]);

    // Custom focus handler
    const handleFocus = (id: string | null) => {
        if (id === null) {
            setManuallyMinimized(true); // User manually minimized
        } else {
            setManuallyMinimized(false);
        }
        setFocusedId(id);
    };

    // Determine what is currently focused
    let focusedItem = allStreams.find(s => s.id === focusedId);

    // Auto-focus logic: only if user hasn't manually minimized
    if (!focusedItem && !manuallyMinimized) {
        const anyScreen = allStreams.find(s => s.type === 'screen');
        if (anyScreen) {
            focusedItem = anyScreen;
        }
    }

    // Filter out the focused item from the sidebar grid
    const sidebarItems = allStreams.filter(s => s.id !== focusedItem?.id);

    useEffect(() => {
        if (mainVideoRef.current && focusedItem?.stream) {
            if (mainVideoRef.current.srcObject !== focusedItem.stream) {
                mainVideoRef.current.srcObject = focusedItem.stream;
                mainVideoRef.current.play().catch(err => console.error("Effect play blocked:", err));
            }
        }
    }, [focusedItem?.stream, focusedItem?.id]);

    const togglePiP = async () => {
        if (!mainVideoRef.current) return;
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await mainVideoRef.current.requestPictureInPicture();
            }
        } catch (error) {
            console.error("PiP error", error);
        }
    };

    const toggleFullscreen = () => {
        const el = mainStageRef.current as any;
        const videoEl = mainVideoRef.current as any;

        // Check if already fullscreen
        const isCurrentlyFullscreen = document.fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).msFullscreenElement;

        if (isCurrentlyFullscreen) {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen();
            } else if ((document as any).msExitFullscreen) {
                (document as any).msExitFullscreen();
            }
            return;
        }

        // Try container fullscreen first (works on desktop + Android Chrome)
        if (el) {
            if (el.requestFullscreen) {
                el.requestFullscreen().catch(() => {
                    // Fallback: try video element fullscreen (iOS Safari)
                    if (videoEl?.webkitEnterFullscreen) {
                        videoEl.webkitEnterFullscreen();
                    }
                });
                return;
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
                return;
            } else if (el.msRequestFullscreen) {
                el.msRequestFullscreen();
                return;
            }
        }

        // Final fallback: video element fullscreen (iOS Safari)
        if (videoEl) {
            if (videoEl.webkitEnterFullscreen) {
                videoEl.webkitEnterFullscreen();
            } else if (videoEl.requestFullscreen) {
                videoEl.requestFullscreen();
            }
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-[#0a0e1a] text-white font-sans w-full relative overflow-hidden">
            {/* Atmospheric Background */}
            <div className="atmospheric-bg">
                <div className="nebula-layer"></div>
                <div className="grain-overlay"></div>
            </div>

            {/* Content Layer */}
            <div className="relative z-10 flex flex-col h-full">
                <RoomSettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    isAdmin={isAdmin}
                    isLocked={isLocked}
                    onToggleLock={toggleRoomLock}
                    nickname={nickname}
                    onUpdateNickname={(name) => {
                        setNickname(name);
                        setIsSettingsOpen(false);
                    }}
                    devices={devices}
                    selectedVideoId={selectedVideoId}
                    selectedAudioId={selectedAudioId}
                    onSetVideoId={setSelectedVideoId}
                    onSetAudioId={setSelectedAudioId}
                />

                <main className="flex-1 flex flex-col lg:flex-row p-2 sm:p-4 lg:p-6 gap-3 sm:gap-4 lg:gap-6 min-h-0 overflow-y-auto lg:overflow-hidden relative w-full max-w-[100vw]">
                    {/* Main Stage & Gallery Toggle animated with Framer Motion (Card Stack Feel) */}
                    <AnimatePresence mode="wait">
                        {focusedId ? ( // Changed from focusedItem to focusedId for more stable check
                            <motion.div
                                key="main-stage"
                                initial={{ y: 200, scale: 0.9, opacity: 0 }}
                                animate={{ y: 0, scale: 1, opacity: 1 }}
                                exit={{ y: 340, scale: 0.95, opacity: 0 }}
                                transition={{ type: "spring", duration: 0.8, bounce: 0 }}
                                ref={mainStageRef as any}
                                className="flex-1 glass-bento flex items-center justify-center overflow-hidden relative group origin-bottom shadow-2xl z-10 bg-black min-h-[40vh] sm:min-h-[50vh] lg:min-h-0"
                            >
                                <video
                                    ref={(el) => {
                                        if (el) {
                                            (mainVideoRef as React.MutableRefObject<HTMLVideoElement>).current = el;
                                            if (el.srcObject !== focusedItem?.stream) {
                                                el.srcObject = focusedItem?.stream || null;
                                                el.play().catch(err => console.error("Ref play blocked:", err));
                                            }
                                        }
                                    }}
                                    autoPlay
                                    playsInline
                                    muted={focusedItem?.isLocal || (isHost && focusedItem?.type === 'screen')}
                                    controls={isHost && focusedItem?.type === 'screen'}
                                    onLoadedMetadata={(e) => {
                                        (e.target as HTMLVideoElement).play().catch(err => console.error("Auto-play blocked:", err));
                                    }}
                                    className={`w-full h-full object-contain`}
                                />

                                {/* Gamer/Presenter Overlay */}
                                {focusedItem?.type === 'screen' && (() => {
                                    const ownerId = focusedItem.id.replace('-screen', '');
                                    const ownerCam = allStreams.find(s => s.id === `${ownerId}-cam`);
                                    if (!ownerCam) return null;

                                    return (
                                        <div className="absolute bottom-6 right-6 w-40 h-28 md:w-64 md:h-36 rounded-2xl border-2 border-white/10 shadow-2xl overflow-hidden z-20 group/cam transition-all hover:scale-105 active:scale-95 bg-black">
                                            <video
                                                autoPlay
                                                playsInline
                                                muted={ownerCam.isLocal}
                                                className="w-full h-full object-cover"
                                                ref={(el) => {
                                                    if (el && el.srcObject !== ownerCam.stream) {
                                                        el.srcObject = ownerCam.stream;
                                                    }
                                                }}
                                                onLoadedMetadata={(e) => {
                                                    (e.target as HTMLVideoElement).play().catch(console.error);
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/cam:opacity-100 transition-opacity flex items-end justify-center pb-2">
                                                <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Canlı</span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className={`absolute bottom-6 left-6 bg-black/80 px-4 py-2 rounded-xl text-sm font-semibold tracking-wide backdrop-blur-md shadow-lg flex items-center gap-2 z-10 border border-zinc-700/50`}>
                                    <div className={`w-2 h-2 rounded-full ${focusedItem?.isLocal ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                    <span>{focusedItem?.nickname}</span>
                                </div>
                                <div className="absolute top-4 right-4 lg:top-6 lg:right-6 flex items-center gap-2 lg:gap-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-20">
                                    <button
                                        onClick={toggleFullscreen}
                                        className="bg-black/70 hover:bg-zinc-800 p-2.5 lg:p-2.5 rounded-xl text-white lg:text-zinc-300 text-sm font-medium backdrop-blur-md transition-all shadow-xl border border-white/10 lg:border-zinc-700/80"
                                        title="Tam Ekran"
                                    >
                                        <Maximize size={18} />
                                    </button>
                                    <button
                                        onClick={togglePiP}
                                        className="bg-black/70 hover:bg-zinc-800 p-2.5 rounded-xl text-white lg:text-zinc-300 text-sm font-medium backdrop-blur-md transition-all shadow-xl border border-white/10 lg:border-zinc-700/80 hidden sm:block"
                                        title="Resim içinde Resim (PiP)"
                                    >
                                        <ExternalLink size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleFocus(null)}
                                        className="bg-black/70 hover:bg-zinc-800 px-3 py-2 lg:px-4 rounded-xl text-white lg:text-zinc-300 text-xs lg:text-sm font-medium backdrop-blur-md transition-all shadow-xl border border-white/10 lg:border-zinc-700/80"
                                    >
                                        <span className="lg:hidden">Küçült</span>
                                        <span className="hidden lg:inline">Küçült (Galeriye Dön)</span>
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="gallery"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: "spring", duration: 0.8, bounce: 0 }}
                                className="flex-1 glass-bento overflow-hidden relative p-2"
                            >
                                <ParticipantGrid
                                    items={allStreams}
                                    layout="gallery"
                                    onFocus={handleFocus}
                                    isAdmin={isAdmin}
                                    adminId={adminId}
                                    onKick={kickUser}
                                    onBan={banUser}
                                    onRemoteMute={remoteMuteUser}
                                    onRemoteVideoOff={remoteCloseVideo}
                                    totalParticipants={participantCount}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Sidebar container for Participants & Chat */}
                    <div className="flex flex-col gap-3 sm:gap-4 w-full lg:w-96 min-h-0 shrink-0 pb-24 lg:pb-0">

                        {/* Mobile Tabs */}
                        {focusedId && (
                            <div className="flex lg:hidden bg-white/5 p-1 rounded-xl mx-0 shrink-0">
                                <button
                                    onClick={() => setMobileTab('chat')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mobileTab === 'chat' ? 'bg-white text-[#0a0e1a] shadow-md' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
                                >
                                    Sohbet
                                </button>
                                <button
                                    onClick={() => setMobileTab('participants')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mobileTab === 'participants' ? 'bg-white text-[#0a0e1a] shadow-md' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
                                >
                                    Katılımcılar
                                </button>
                            </div>
                        )}

                        {focusedId && (
                            <div className={`glass-bento overflow-hidden min-h-[180px] sm:min-h-[200px] lg:min-h-[50%] lg:flex-1 relative p-2 ${mobileTab === 'participants' ? 'flex' : 'hidden lg:flex'}`}>
                                <ParticipantGrid items={allStreams.filter(s => {
                                    if (s.id === focusedId) return false;
                                    if (focusedItem?.type === 'screen' && s.id === `${focusedId.replace('-screen', '')}-cam`) return false;
                                    return true;
                                })}
                                    layout="sidebar"
                                    onFocus={handleFocus}
                                    isAdmin={isAdmin}
                                    adminId={adminId}
                                    onKick={kickUser}
                                    onBan={banUser}
                                    onRemoteMute={remoteMuteUser}
                                    onRemoteVideoOff={remoteCloseVideo}
                                    totalParticipants={participantCount}
                                />
                            </div>
                        )}
                        <div className={`flex-1 glass-bento overflow-hidden min-h-[250px] lg:min-h-0 ${!focusedId ? 'flex h-full' : (mobileTab === 'chat' ? 'flex lg:min-h-[40%]' : 'hidden lg:flex lg:min-h-[40%]')}`}>
                            <ChatBox
                                messages={messages || []}
                                onSendMessage={sendChatMessage || (() => { })}
                                currentUserId={userId}
                            />
                        </div>
                    </div>
                </main>

                <ControlBar
                    roomId={channelId}
                    onStartWebcam={startWebcam}
                    onStartScreenShare={(res: '1080p' | '1440p' | '4k') => startScreenShare(res)}
                    isReconnecting={isReconnecting}
                    hasLocalStream={!!localStream}
                    hasScreenStream={!!screenStream}
                    isMuted={isMuted}
                    isVideoOff={isVideoOff}
                    onToggleAudio={toggleAudio}
                    onToggleVideo={toggleVideo}
                    onStopScreenShare={stopScreenShare}
                    onStopWebcam={stopWebcam}
                    netStats={netStats}
                    qualityWarning={qualityWarning}
                    isAdmin={isAdmin}
                    isLocked={isLocked}
                    onToggleLock={toggleRoomLock}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    participantCount={participantCount}
                />
            </div>
        </div>
    );
}
