import { Camera, Mic, Share2 } from 'lucide-react';
import { useState } from 'react';

interface PreJoinLobbyProps {
    roomId: string;
    onJoin: (nickname: string) => void;
}

export function PreJoinLobby({ roomId, onJoin }: PreJoinLobbyProps) {
    const [nickname, setNickname] = useState('');

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        // You could add a toast notification here
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#A855F7]/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6200EA]/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-lg bg-[#18181b] border border-white/5 rounded-[32px] p-10 shadow-2xl relative z-10 animate-fadeIn">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-black bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent mb-3 tracking-tighter">
                        KATILMAYA <span className="text-[#A855F7]">HAZIR MISIN?</span>
                    </h1>
                    <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em]">
                        Odaya katılıyorsun: <span className="text-[#A855F7] bg-[#A855F7]/10 px-3 py-1 rounded-full ml-1">{roomId}</span>
                    </p>
                </div>

                <div className="bg-black/40 aspect-video rounded-[24px] border border-white/5 mb-10 flex flex-col items-center justify-center gap-4 relative overflow-hidden group shadow-inner">
                    {/* Placeholder for camera preview */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/80 to-transparent z-10 pointer-events-none"></div>
                    <Camera size={48} className="text-[#A855F7]/20 group-hover:text-[#A855F7]/40 transition-all duration-500 scale-90 group-hover:scale-110" />
                    <p className="text-[10px] uppercase font-bold tracking-widest text-white/20 z-20">Kamera Önizleme</p>

                    {/* Hardware Toggles Overlay */}
                    <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-4">
                        <button className="bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-3xl backdrop-blur-xl transition-all active:scale-95 shadow-xl text-white">
                            <Mic size={20} />
                        </button>
                        <button className="bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-3xl backdrop-blur-xl transition-all active:scale-95 shadow-xl text-white">
                            <Camera size={20} />
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label htmlFor="nickname" className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">
                            Adınız
                        </label>
                        <input
                            id="nickname"
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Takma adınızı girin..."
                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#A855F7]/30 transition-all placeholder:text-white/10 shadow-inner"
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => onJoin(nickname || 'Misafir')}
                            disabled={!nickname.trim()}
                            className="bg-white hover:bg-zinc-100 text-[#111114] w-full py-5 rounded-[20px] transition-all !justify-center font-black uppercase tracking-[0.2em] text-sm disabled:opacity-20 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95"
                        >
                            Odaya Katıl
                        </button>

                        <button
                            onClick={handleCopyLink}
                            className="bg-white/5 hover:bg-white/10 border border-white/5 text-white/60 hover:text-white w-full py-4 rounded-[20px] transition-all !justify-center text-xs font-bold flex items-center gap-2 active:scale-95"
                        >
                            <Share2 size={16} />
                            BAŞKALARINI DAVET ET
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
