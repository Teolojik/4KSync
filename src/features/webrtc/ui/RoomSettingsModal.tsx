'use client';

import { X, Lock, Unlock, ShieldAlert, Users, Settings2, Volume2, UserCog } from 'lucide-react';
import { useState } from 'react';

interface RoomSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isAdmin: boolean;
    isLocked: boolean;
    onToggleLock: (locked: boolean) => void;
    nickname: string;
    onUpdateNickname: (name: string) => void;
    devices?: MediaDeviceInfo[];
    selectedVideoId?: string;
    selectedAudioId?: string;
    onSetVideoId?: (id: string) => void;
    onSetAudioId?: (id: string) => void;
}

export function RoomSettingsModal({ isOpen, onClose, isAdmin, isLocked, onToggleLock, nickname, onUpdateNickname, devices = [], selectedVideoId, selectedAudioId, onSetVideoId, onSetAudioId }: RoomSettingsModalProps) {
    const [tempNick, setTempNick] = useState(nickname);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop with stronger blur */}
            <div className="absolute inset-0 bg-[#09090b]/90 backdrop-blur-2xl" onClick={onClose} />

            {/* Modal — Dark Bento */}
            <div className="relative w-full max-w-md bg-[#18181b] border border-white/5 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl animate-slideUp sm:animate-fadeIn max-h-[85vh] sm:max-h-[90vh] flex flex-col">
                {/* Mobile Handle */}
                <div className="w-full flex justify-center pt-3 pb-1 sm:hidden absolute top-0 left-0">
                    <div className="w-12 h-1.5 bg-white/10 rounded-full" />
                </div>
                {/* Header */}
                <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                            <Settings2 className="text-white" size={18} />
                        </div>
                        <h2 className="text-base font-black text-white tracking-tight uppercase">ODA AYARLARI</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all active:scale-90">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar bg-[#18181b]">
                    {/* Admin Section */}
                    {isAdmin && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] px-1">
                                <ShieldAlert size={12} className="text-zinc-500" /> YÖNETİCİ KONTROLLERİ
                            </div>

                            <div className="flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-[24px] shadow-inner">
                                <div className="space-y-1">
                                    <div className="text-sm font-black text-white tracking-tight leading-none">GİZLİ ODA</div>
                                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Sadece linke sahip olanlar</div>
                                </div>
                                <button
                                    onClick={() => onToggleLock(!isLocked)}
                                    className={`w-14 h-8 rounded-full transition-all flex items-center px-1.5 ${isLocked ? 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-white/10'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full shadow-xl transition-all duration-300 ${isLocked ? 'translate-x-6 bg-[#111114]' : 'translate-x-0 bg-white/40'}`} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Hardware Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] px-1">
                            <Volume2 size={12} /> DONANIM AYARLARI
                        </div>

                        <div className="space-y-5 bg-black/20 border border-white/5 rounded-[24px] p-5 shadow-inner">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-white/60 ml-1 uppercase tracking-widest">KAMERA GİRİŞİ</label>
                                <div className="relative group">
                                    <select
                                        value={selectedVideoId}
                                        onChange={(e) => onSetVideoId && onSetVideoId(e.target.value)}
                                        className="w-full bg-[#18181b] border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-[#A855F7]/40 transition-all appearance-none cursor-pointer shadow-lg"
                                    >
                                        {devices.filter(d => d.kind === 'videoinput').map(d => (
                                            <option key={d.deviceId} value={d.deviceId} className="bg-[#18181b]">{d.label || `Kamera ${d.deviceId.substring(0, 4)}`}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-white transition-colors">
                                        <Settings2 size={14} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-white/60 ml-1 uppercase tracking-widest">MİKROFON GİRİŞİ</label>
                                <div className="relative group">
                                    <select
                                        value={selectedAudioId}
                                        onChange={(e) => onSetAudioId && onSetAudioId(e.target.value)}
                                        className="w-full bg-[#18181b] border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-[#A855F7]/40 transition-all appearance-none cursor-pointer shadow-lg"
                                    >
                                        {devices.filter(d => d.kind === 'audioinput').map(d => (
                                            <option key={d.deviceId} value={d.deviceId} className="bg-[#18181b]">{d.label || `Mikrofon ${d.deviceId.substring(0, 4)}`}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-[#A855F7] transition-colors">
                                        <Volume2 size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Personal Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] px-1">
                            <UserCog size={12} /> KİŞİSEL AYARLAR
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-white/60 ml-1 uppercase tracking-widest">TAKMA ADIN</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={tempNick}
                                    onChange={(e) => setTempNick(e.target.value)}
                                    className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 text-white text-sm focus:outline-none focus:border-[#A855F7]/40 placeholder-white/10 shadow-inner"
                                    placeholder="Adını değiştir..."
                                />
                                <button
                                    onClick={() => onUpdateNickname(tempNick)}
                                    className="bg-white hover:bg-zinc-100 text-[#111114] rounded-2xl px-6 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[0_8px_20px_rgba(255,255,255,0.1)]"
                                >
                                    GÜNCELLE
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Room Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] px-1">
                            <Users size={12} /> SİSTEM BİLGİSİ
                        </div>
                        <div className="p-5 bg-black/20 border border-white/5 rounded-[24px] text-[11px] text-white/40 space-y-4 shadow-inner">
                            <div className="flex justify-between items-center">
                                <span className="font-bold uppercase tracking-wider">Bağlantı Türü:</span>
                                <span className="text-white bg-white/5 border border-white/5 px-3 py-1.5 rounded-full text-[10px] font-black">WEBRTC P2P (E2EE)</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-bold uppercase tracking-wider">Sunucu Bölgesi:</span>
                                <span className="text-white bg-white/5 border border-white/5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest">GLOBAL CLUSTER</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex items-center justify-between shrink-0 bg-black/40 z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">v2.5.0-Bento</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-white/5 hover:bg-white/10 border border-white/5 text-white/60 hover:text-white py-3 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                        KAPAT
                    </button>
                </div>
            </div>
        </div>
    );
}
