import { Monitor, Video, VideoOff as VideoOffIcon, Mic, MicOff, Settings2, RefreshCcw, ChevronDown, Check, Lock, Unlock } from 'lucide-react';
import { useState } from 'react';

interface ControlBarProps {
    roomId: string;
    onStartWebcam: (cinemaMode: boolean, resolution: '720p' | '1080p' | '1440p') => void;
    onStartScreenShare: (res: '1080p' | '1440p' | '4k') => void;
    isReconnecting?: boolean;
    hasLocalStream?: boolean;
    hasScreenStream?: boolean;
    isMuted?: boolean;
    isVideoOff?: boolean;
    onToggleAudio?: () => void;
    onToggleVideo?: () => void;
    onStopScreenShare?: () => void;
    onStopWebcam?: () => void;
    netStats?: { upload: string; download: string; ping: string };
    qualityWarning?: boolean;
    isAdmin?: boolean;
    isLocked?: boolean;
    onToggleLock?: (locked: boolean) => void;
    onOpenSettings?: () => void;
    participantCount?: number;
}

export function ControlBar({ roomId, onStartWebcam, onStartScreenShare, isReconnecting = false, hasLocalStream = false, hasScreenStream = false, isMuted = false, isVideoOff = false, onToggleAudio, onToggleVideo, onStopScreenShare, onStopWebcam, netStats, qualityWarning = false, isAdmin = false, isLocked = false, onToggleLock, onOpenSettings, participantCount = 1 }: ControlBarProps) {
    const [isCinemaMode, setIsCinemaMode] = useState(false);
    const [showResMenu, setShowResMenu] = useState(false);
    const [activeRes, setActiveRes] = useState<'1080p' | '1440p' | '4k' | null>(null);
    const [showCamMenu, setShowCamMenu] = useState(false);
    const [activeCamRes, setActiveCamRes] = useState<'720p' | '1080p' | '1440p' | null>(null);

    const handleShare = (res: '1080p' | '1440p' | '4k') => {
        setActiveRes(res);
        setShowResMenu(false);
        onStartScreenShare(res);
    };

    return (
        <div className="w-full flex items-center justify-center lg:justify-between pt-4 pb-2 px-4 md:px-6 z-50 shrink-0 relative">

            {/* Left Side: Room Status & Network */}
            <div className="hidden lg:flex items-center gap-4 bg-black/40 backdrop-blur-2xl border border-white/5 rounded-2xl px-4 py-2.5 shadow-lg">
                <div className="flex items-center gap-2 pr-4 border-r border-white/5">
                    <div className="relative flex items-center justify-center w-3 h-3">
                        <div className={`absolute w-full h-full rounded-full ${isReconnecting ? 'bg-amber-500' : 'bg-[#A855F7]'} animate-ping opacity-75`}></div>
                        <div className={`relative w-2 h-2 rounded-full ${isReconnecting ? 'bg-amber-500' : 'bg-[#A855F7]'}`}></div>
                    </div>
                    <span className="text-[11px] font-bold text-white tracking-wider uppercase">{roomId}</span>
                </div>

                {isReconnecting && (
                    <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-1.5 glass-strong px-2 py-1 rounded-full border-r border-white/5 pr-4">
                        <RefreshCcw className="animate-spin" size={12} /> Bağlanıyor...
                    </span>
                )}

                {netStats && (
                    <div className="hidden lg:flex items-center gap-3 text-[10px] font-semibold text-white/50 tracking-wide">
                        <div className="flex items-center gap-1" title="İndirme (Download) Hızı">
                            <span>↓ {netStats.download}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Yükleme (Upload) Hızı">
                            <span>↑ {netStats.upload}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Gecikme (Ping)">
                            <span className={Number(netStats.ping) > 150 ? 'text-[#ff5555]' : 'text-white/50'}>{netStats.ping}ms</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#A855F7] ml-2" title="Katılımcı Sayısı">
                            <span>👤 {participantCount}</span>
                        </div>
                    </div>
                )}
            </div>

            {qualityWarning && (
                <div className="hidden md:flex absolute top-20 left-6 items-center gap-2 px-3 py-1 bg-[#ff5555]/10 border border-[#ff5555]/20 rounded-full text-[#ff5555] text-[11px] font-bold backdrop-blur-md">
                    ⚠️ Bağlantı Zayıf
                </div>
            )}

            {/* Center: Floating Toolbelt */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-[#111111]/80 backdrop-blur-[32px] border border-white/10 rounded-[32px] px-3 sm:px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] lg:absolute lg:left-1/2 lg:-translate-x-1/2">
                {!hasLocalStream ? (
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button
                                onClick={() => setShowCamMenu(!showCamMenu)}
                                className="group btn-primary flex items-center gap-2 text-sm font-semibold !px-4 sm:!px-5 !py-2 sm:!py-2.5 active:scale-95"
                            >
                                <Video size={16} className="group-hover:scale-110 transition-transform" />
                                <span className="hidden sm:inline">{activeCamRes ? activeCamRes.toUpperCase() : 'Kamera'}</span>
                                <ChevronDown size={14} className={`transition-transform ${showCamMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showCamMenu && (
                                <div className="absolute left-0 sm:right-0 sm:left-auto bottom-full mb-4 w-48 bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden shadow-2xl z-50">
                                    <div className="px-3 py-2 text-[10px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/5 bg-black/20">
                                        Kamera Kalitesi
                                    </div>
                                    <button
                                        onClick={() => { onStartWebcam(isCinemaMode, '720p'); setActiveCamRes('720p'); setShowCamMenu(false); }}
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors flex items-center justify-between text-white/70 hover:text-white"
                                    >
                                        <span className="flex flex-col">
                                            <span className="font-semibold text-white">720p HD</span>
                                            <span className="text-[10px] text-white/40">Normal / 30fps</span>
                                        </span>
                                        {activeCamRes === '720p' && <Check size={16} className="text-[#A855F7]" />}
                                    </button>
                                    <button
                                        onClick={() => { onStartWebcam(isCinemaMode, '1080p'); setActiveCamRes('1080p'); setShowCamMenu(false); }}
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors flex items-center justify-between text-white/70 hover:text-white"
                                    >
                                        <span className="flex flex-col">
                                            <span className="font-semibold text-white">1080p FHD</span>
                                            <span className="text-[10px] text-white/40">Yüksek / 30fps</span>
                                        </span>
                                        {activeCamRes === '1080p' && <Check size={16} className="text-[#A855F7]" />}
                                    </button>
                                    <button
                                        onClick={() => { onStartWebcam(isCinemaMode, '1440p'); setActiveCamRes('1440p'); setShowCamMenu(false); }}
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors flex items-center justify-between text-white/70 hover:text-white"
                                    >
                                        <span className="flex flex-col">
                                            <span className="font-semibold text-white">1440p QHD</span>
                                            <span className="text-[10px] text-white/40">Ultra / 30fps</span>
                                        </span>
                                        {activeCamRes === '1440p' && <Check size={16} className="text-[#A855F7]" />}
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onOpenSettings}
                            className="flex items-center justify-center w-11 h-11 rounded-full bg-white hover:bg-zinc-100 text-[#111114] shadow-[0_4px_15px_rgba(255,255,255,0.1)] transition-all active:scale-95"
                            title="Oda Ayarları"
                        >
                            <Settings2 size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-1.5 bg-black/20 rounded-full p-1 border border-white/5 shadow-inner">
                        <button
                            onClick={onToggleAudio}
                            className={`flex items-center justify-center w-11 h-11 rounded-full transition-all active:scale-95 border ${isMuted ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/20' : 'bg-white/5 hover:bg-white/10 text-white border-white/5'}`}
                            title={isMuted ? "Mikrofonu Aç" : "Mikrofonu Kapat"}
                        >
                            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                        </button>
                        <button
                            onClick={onToggleVideo}
                            className={`flex items-center justify-center w-11 h-11 rounded-full transition-all active:scale-95 border ${isVideoOff ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/20' : 'bg-white/5 hover:bg-white/10 text-white border-white/5'}`}
                            title={isVideoOff ? "Kamerayı Aç" : "Kamerayı Beklet"}
                        >
                            {isVideoOff ? <VideoOffIcon size={16} /> : <Video size={16} />}
                        </button>
                        <div className="w-px h-6 bg-white/10 self-center mx-1"></div>
                        <button
                            onClick={onStopWebcam}
                            className="flex items-center justify-center w-11 h-11 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all active:scale-95"
                            title="Kamerayı Tamamen Kapat"
                        >
                            <VideoOffIcon size={16} />
                        </button>
                        <div className="w-px h-6 bg-white/10 self-center mx-1"></div>
                        <button
                            onClick={onOpenSettings}
                            className="flex items-center justify-center w-11 h-11 rounded-full bg-white hover:bg-zinc-100 text-[#111114] shadow-[0_4px_15px_rgba(255,255,255,0.1)] transition-all active:scale-95"
                            title="Oda Ayarları"
                        >
                            <Settings2 size={16} />
                        </button>
                    </div>
                )}

                <div className="w-px h-8 bg-white/10 mx-1"></div>

                <div className="relative">
                    {!hasScreenStream ? (
                        <button
                            onClick={() => setShowResMenu(!showResMenu)}
                            className="group btn-primary flex items-center gap-2 text-sm font-semibold !px-4 sm:!px-5 !py-2 sm:py-2.5 active:scale-95 rounded-full"
                        >
                            <Monitor size={16} className="group-hover:scale-110 transition-transform" />
                            <span className="hidden sm:inline">{activeRes ? `${activeRes.toUpperCase()}` : 'Paylaş'}</span>
                            <ChevronDown size={14} className={`transition-transform ${showResMenu ? 'rotate-180' : ''}`} />
                        </button>
                    ) : (
                        <button
                            onClick={onStopScreenShare}
                            className="group flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-[0_4px_14px_rgba(239,68,68,0.4)] transition-all active:scale-95"
                        >
                            <Monitor size={16} />
                            <span className="hidden sm:inline">Durdur</span>
                        </button>
                    )}

                    {showResMenu && !hasScreenStream && (
                        <div className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 bottom-full mb-4 w-48 bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden shadow-2xl z-50">
                            <div className="px-3 py-2 text-[10px] font-semibold text-white/40 uppercase tracking-wider border-b border-white/5 bg-black/20">
                                Kalite Ayarı
                            </div>
                            <button
                                onClick={() => handleShare('1080p')}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors flex items-center justify-between text-white/70 hover:text-white"
                            >
                                <span className="flex flex-col">
                                    <span className="font-semibold text-white">1080p FHD</span>
                                    <span className="text-[10px] text-white/40">Normal / 60fps</span>
                                </span>
                                {activeRes === '1080p' && <Check size={16} className="text-[#A855F7]" />}
                            </button>
                            <button
                                onClick={() => handleShare('1440p')}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors flex items-center justify-between text-white/70 hover:text-white"
                            >
                                <span className="flex flex-col">
                                    <span className="font-semibold text-white">1440p QHD</span>
                                    <span className="text-[10px] text-white/40">Yüksek / 60fps</span>
                                </span>
                                {activeRes === '1440p' && <Check size={16} className="text-[#A855F7]" />}
                            </button>
                            <button
                                onClick={() => handleShare('4k')}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors flex items-center justify-between text-white/70 hover:text-white"
                            >
                                <span className="flex flex-col">
                                    <span className="font-semibold text-white">2160p 4K UHD</span>
                                    <span className="text-[10px] text-white/40">Ultra / 60fps</span>
                                </span>
                                {activeRes === '4k' && <Check size={16} className="text-[#A855F7]" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Admin Controls */}
            {isAdmin && (
                <div className="hidden lg:flex items-center gap-2 bg-black/40 backdrop-blur-2xl border border-white/5 rounded-full px-1.5 py-1.5 shadow-lg">
                    <button
                        onClick={() => onToggleLock && onToggleLock(!isLocked)}
                        className={`group flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full transition-all border active:scale-95 ${isLocked ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-white/5 text-white/80 border-white/5 hover:bg-white/10 hover:text-white'}`}
                        title="Gizli Oda (Sadece Davetliler)"
                    >
                        {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                        <span>{isLocked ? 'Gizli' : 'Açık'}</span>
                    </button>
                </div>
            )}
        </div>
    );
}
