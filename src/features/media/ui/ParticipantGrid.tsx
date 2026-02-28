import { useEffect, useRef } from 'react';
import { VideoOff, Maximize2, UserMinus, Ban, Crown, MicOff, CameraOff } from 'lucide-react';

export interface GridItem {
    id: string;
    stream: MediaStream;
    nickname: string;
    isLocal: boolean;
    type: 'screen' | 'cam';
}

interface ParticipantGridProps {
    items: GridItem[];
    layout?: 'sidebar' | 'gallery';
    isAdmin?: boolean;
    adminId?: string | null;
    onFocus?: (id: string) => void;
    onKick?: (userId: string) => void;
    onBan?: (userId: string) => void;
    onRemoteMute?: (userId: string) => void;
    onRemoteVideoOff?: (userId: string) => void;
    totalParticipants?: number;
}

export function ParticipantGrid({ items, layout = 'sidebar', isAdmin = false, adminId, onFocus, onKick, onBan, onRemoteMute, onRemoteVideoOff, totalParticipants = 0 }: ParticipantGridProps) {
    const isGallery = layout === 'gallery';

    return (
        <div className={`flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar ${isGallery ? 'w-full h-full' : 'w-full lg:w-80'}`}>
            <div className={`flex items-center justify-between px-2 pt-2 ${isGallery ? 'absolute top-6 left-8 z-10' : ''}`}>
                <h2 className="text-[#A855F7] uppercase tracking-[0.2em] text-[10px] sm:text-xs font-black">
                    {isGallery ? 'GALERİ' : 'KATILIMCILAR'}
                </h2>
                <span className="bg-[#18181b] border border-white/5 text-white/40 text-[10px] sm:text-xs px-3 py-1 rounded-full font-bold">{totalParticipants} KATILDI</span>
            </div>

            <div className={`grid gap-3 sm:gap-4 ${isGallery ? 'grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-fr h-full p-4 pt-16 content-start justify-items-center' : 'grid-cols-2 lg:grid-cols-1'}`}>
                {items.map(item => (
                    <PeerVideo key={item.id} item={item} isGallery={isGallery} onFocus={onFocus} isAdmin={isAdmin} adminId={adminId} onKick={onKick} onBan={onBan} onRemoteMute={onRemoteMute} onRemoteVideoOff={onRemoteVideoOff} />
                ))}

                {totalParticipants <= 1 && (
                    <div className="bg-[#18181b] border border-white/5 rounded-[32px] p-10 text-center text-white/20 text-sm w-full col-span-full flex flex-col items-center gap-4 group">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-[#A855F7]/10 group-hover:border-[#A855F7]/20 transition-all duration-500">
                            <UserMinus size={24} className="opacity-40 group-hover:text-[#A855F7] group-hover:opacity-100 transition-all duration-500" />
                        </div>
                        <span className="max-w-[180px] mx-auto leading-relaxed">Başka katılımcı yok. URL üzerinden arkadaşını davet et.</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function PeerVideo({ item, isGallery, onFocus, isAdmin, adminId, onKick, onBan, onRemoteMute, onRemoteVideoOff }: {
    item: GridItem,
    isGallery: boolean,
    onFocus?: (id: string) => void,
    isAdmin?: boolean,
    adminId?: string | null,
    onKick?: (userId: string) => void,
    onBan?: (userId: string) => void,
    onRemoteMute?: (userId: string) => void,
    onRemoteVideoOff?: (userId: string) => void
}) {
    const ref = useRef<HTMLVideoElement>(null);

    const hasActiveTracks = item.stream && item.stream.getTracks().length > 0;

    useEffect(() => {
        if (ref.current && item.stream && item.stream.getTracks().length > 0) {
            if (ref.current.srcObject !== item.stream) {
                ref.current.srcObject = item.stream;
            }
        }
    }, [item.stream, hasActiveTracks]);

    // Listen for tracks being added to the stream after initial render
    useEffect(() => {
        if (!item.stream) return;
        const onTrackAdded = () => {
            if (ref.current && item.stream) {
                if (ref.current.srcObject !== item.stream) {
                    ref.current.srcObject = item.stream;
                }
                ref.current.play().catch(() => { });
            }
        };
        item.stream.addEventListener('addtrack', onTrackAdded);
        return () => {
            item.stream?.removeEventListener('addtrack', onTrackAdded);
        };
    }, [item.stream]);

    const isCam = item.type === 'cam';
    // In Gallery mode, we enforce a consistent aspect ratio (16:9) for all items
    const containerClasses = `aspect-video rounded-[32px] overflow-hidden border-2 shadow-xl relative group transition-all duration-300 flex items-center justify-center bg-[#111111] w-full ${item.isLocal ? 'border-[#A855F7] shadow-[0_0_40px_rgba(168,85,247,0.25)]' : 'border-white/5 hover:border-white/20'}`;

    const realUserId = item.id.replace('-cam', '').replace('-screen', '');
    const isOwnerAdmin = adminId === realUserId;

    return (
        <div className={containerClasses} onClick={() => onFocus && onFocus(item.id)}>
            {item.stream ? (
                <video
                    ref={ref}
                    autoPlay
                    playsInline
                    muted={item.isLocal}
                    className="w-full h-full object-cover"
                    onLoadedMetadata={(e) => {
                        (e.target as HTMLVideoElement).play().catch(() => { });
                    }}
                />
            ) : (
                <div className="flex items-center justify-center h-full text-zinc-600">
                    <VideoOff size={24} />
                </div>
            )}

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity flex items-center justify-center gap-2 cursor-pointer">
                {onFocus && (
                    <button
                        onClick={() => onFocus(item.id)}
                        className="bg-black/60 hover:bg-black p-3 rounded-full text-white backdrop-blur-md transition-all shadow-xl hover:scale-110 mb-2"
                        title="Ana Ekrana Büyüt"
                    >
                        <Maximize2 size={18} />
                    </button>
                )}

                {isAdmin && !item.isLocal && (
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <button
                                onClick={() => onRemoteMute && onRemoteMute(realUserId)}
                                className="bg-amber-500/80 hover:bg-amber-500 p-2 rounded-full text-white backdrop-blur-md transition-all shadow-xl hover:scale-110"
                                title="Kullanıcıyı Sustur (Mute)"
                            >
                                <MicOff size={14} />
                            </button>
                            <button
                                onClick={() => onRemoteVideoOff && onRemoteVideoOff(realUserId)}
                                className="bg-zinc-100/10 hover:bg-zinc-100/20 p-2 rounded-full text-white backdrop-blur-md transition-all shadow-xl hover:scale-110"
                                title="Kamerayı Kapat"
                            >
                                <CameraOff size={14} />
                            </button>
                        </div>
                        <div className="flex gap-2 justify-center">
                            <button
                                onClick={() => onKick && onKick(realUserId)}
                                className="bg-red-500/80 hover:bg-red-500 p-2 rounded-full text-white backdrop-blur-md transition-all shadow-xl hover:scale-110"
                                title="Kullanıcıyı At (Kick)"
                            >
                                <UserMinus size={14} />
                            </button>
                            <button
                                onClick={() => onBan && onBan(realUserId)}
                                className="bg-zinc-800/80 hover:bg-zinc-700 p-2 rounded-full text-white backdrop-blur-md transition-all shadow-xl hover:scale-110"
                                title="Kullanıcıyı Engelle (Ban)"
                            >
                                <Ban size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className={`absolute ${isCam ? 'bottom-4' : 'bottom-4 left-4'} bg-[#0a0a0a]/60 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide backdrop-blur-xl shadow-lg flex items-center gap-2 z-10 border border-white/10`}>
                <div className={`w-2 h-2 rounded-full ${item.isLocal ? 'bg-[#A855F7] shadow-[0_0_10px_rgba(168,85,247,0.8)]' : 'bg-blue-500'}`}></div>
                <span className="truncate max-w-[100px] text-white/90">{item.nickname}</span>
                {isOwnerAdmin && <Crown size={12} className="text-amber-400 fill-amber-400/20" />}
            </div>
        </div>
    );
}
