'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Hash, MonitorPlay, Gamepad2, Mic, MicOff, Video, VideoOff, Settings, Trash2, Menu, X } from 'lucide-react';
import { useUser } from '@/shared/providers/UserProvider';
import { useState, useEffect } from 'react';

const INITIAL_CHANNELS = [
    { id: 'general', name: 'Genel', icon: Hash, isPrivate: false },
    { id: 'movies', name: 'Filmler', icon: MonitorPlay, isPrivate: false },
    { id: 'gaming', name: 'Oyun', icon: Gamepad2, isPrivate: false }
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { nickname, userId } = useUser();

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [channels, setChannels] = useState(INITIAL_CHANNELS);
    const [isOpen, setIsOpen] = useState(false);
    const isAdmin = nickname === 'Teolojik';

    useEffect(() => {
        const storedChannels = localStorage.getItem('4ksync_dynamic_channels');
        if (storedChannels) {
            try {
                const parsed = JSON.parse(storedChannels);
                // Keep default icons
                const withIcons = parsed.map((c: any) => ({
                    ...c,
                    icon: c.isPrivate ? Hash : (c.id === 'movies' ? MonitorPlay : (c.id === 'gaming' ? Gamepad2 : Hash))
                }));
                setChannels(withIcons);
            } catch (e) {
                console.error("Error loading channels", e);
            }
        }
    }, []);

    const addChannel = () => {
        const name = prompt("Yeni Oda İsmi:");
        if (!name) return;
        const isHidden = confirm("Bu oda gizli olsun mu? (Sadece link ile katılım)");

        const newId = isHidden ? self.crypto.randomUUID() : name.toLowerCase().replace(/\s+/g, '-');
        const newChan = { id: newId, name, icon: Hash, isPrivate: isHidden };

        const updated = [...channels, newChan];
        setChannels(updated);
        localStorage.setItem('4ksync_dynamic_channels', JSON.stringify(updated.map(c => ({ ...c, icon: undefined }))));

        const roomLink = `${window.location.origin}/p/${newId}`;

        if (isHidden) {
            navigator.clipboard.writeText(roomLink).then(() => {
                alert(`Gizli Oda Oluşturuldu ve Link Kopyalandı!\n\nLink: ${roomLink}`);
                router.push(`/p/${newId}`);
            }).catch(() => {
                alert(`Gizli Oda Oluşturuldu!\n\nLink: ${roomLink}`);
                router.push(`/p/${newId}`);
            });
        } else {
            router.push(`/p/${newId}`);
        }
    };

    const removeChannel = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (INITIAL_CHANNELS.some(c => c.id === id)) {
            alert("Varsayılan odalar silinemez.");
            return;
        }

        if (confirm("Bu odayı silmek istediğinize emin misiniz?")) {
            const updated = channels.filter(c => c.id !== id);
            setChannels(updated);
            localStorage.setItem('4ksync_dynamic_channels', JSON.stringify(updated.map(c => ({ ...c, icon: undefined }))));

            if (pathname === `/p/${id}`) {
                router.push('/p/general');
            }
        }
    };

    useEffect(() => {
        const handleMicState = (e: any) => setIsMuted(e.detail);
        const handleVidState = (e: any) => setIsVideoOff(e.detail);

        window.addEventListener('webrtc-mic-state', handleMicState);
        window.addEventListener('webrtc-video-state', handleVidState);

        return () => {
            window.removeEventListener('webrtc-mic-state', handleMicState);
            window.removeEventListener('webrtc-video-state', handleVidState);
        };
    }, []);

    const toggleMic = () => window.dispatchEvent(new CustomEvent('webrtc-toggle-mic'));
    const toggleVideo = () => window.dispatchEvent(new CustomEvent('webrtc-toggle-video'));

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed bottom-6 left-6 z-[60] btn-primary !p-3.5 !shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-90 transition-all"
            >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[45]"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className={`
                flex h-screen flex-shrink-0 z-50 transition-transform duration-300
                fixed lg:relative
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>

                {/* 1. Tier: Outer Sidebar (Servers / Workspaces) */}
                <div className="w-[72px] bg-[#0A0A0A] border-r border-[#18181b] flex flex-col items-center py-4 gap-4 flex-shrink-0 z-20">
                    <div className="relative group w-12 h-12 flex items-center justify-center cursor-pointer">
                        {/* Active Pill Indicator */}
                        <div className="absolute -left-1 w-1.5 h-8 bg-[#A855F7] rounded-r-full transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />

                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center transition-all duration-500 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-hidden scale-95 group-hover:scale-100 group-hover:rounded-xl">
                            {/* Server Icon/Logo */}
                            <span className="text-[#111114] font-black text-[10px] tracking-tighter">4KSync</span>
                        </div>
                    </div>

                    <div className="w-8 h-[2px] bg-white/5 rounded-full my-1" />

                    <div className="w-12 h-12 bg-[#18181b] hover:bg-[#A855F7] text-white/50 hover:text-white rounded-[24px] hover:rounded-[16px] flex items-center justify-center transition-all duration-300 cursor-pointer border border-white/5">
                        <span className="text-2xl font-light">+</span>
                    </div>
                </div>

                {/* 2. Tier: Inner Sidebar (Channels) */}
                <div className="w-64 bg-[#111111] flex flex-col border-r border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.3)] z-10">
                    {/* Header */}
                    <div className="h-16 flex items-center px-6 border-b border-white/5 bg-[#0D0D0D]">
                        <h1 className="font-black text-white tracking-widest text-[10px] uppercase opacity-90">
                            ANA TOPLULUK
                        </h1>
                    </div>

                    {/* Channel List */}
                    <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1 custom-scrollbar">
                        <div className="px-3 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-3 flex justify-between items-center">
                            <span>Metin ve Ses Kanalları</span>
                            {isAdmin && (
                                <button
                                    onClick={addChannel}
                                    className="text-zinc-500 hover:text-violet-400 transition-colors p-1"
                                    title="Yeni Oda Ekle"
                                >
                                    <Settings size={14} />
                                </button>
                            )}
                        </div>
                        {channels.filter(c => !c.isPrivate || pathname === `/p/${c.id}` || isAdmin).map(channel => {
                            // Just basic matching for Active state
                            const isActive = pathname === `/p/${channel.id}`;
                            const Icon = channel.icon;

                            return (
                                <Link
                                    key={channel.id}
                                    href={`/p/${channel.id}`}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 group ${isActive ? 'glass-active text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/80'}`}
                                >
                                    <Icon size={18} className={isActive ? 'text-white' : 'text-white/30'} />
                                    <span className="font-medium truncate">{channel.name}</span>
                                    <div className="flex items-center gap-1 ml-auto">
                                        {channel.isPrivate && <Hash size={12} className="text-zinc-600" />}
                                        {isAdmin && !INITIAL_CHANNELS.some(c => c.id === channel.id) && (
                                            <button
                                                onClick={(e) => removeChannel(e, channel.id)}
                                                className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded"
                                                title="Odayı Sil"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Bottom User Panel (Discord Style) */}
                    <div className="h-16 bg-[#18181b]/50 border-t border-white/5 p-2 flex items-center justify-between mt-auto shrink-0">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-[#18181b] flex items-center justify-center flex-shrink-0 border border-white/10 shadow-lg relative">
                                <span className="text-white font-bold text-xs">
                                    {nickname.substring(0, 1).toUpperCase()}
                                </span>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#111111]"></div>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[13px] font-semibold text-white truncate">{nickname}</span>
                                <span className="text-[10px] text-zinc-500 truncate mt-0.5" style={{ lineHeight: 1 }}>Çevrimiçi</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={toggleMic}
                                className={`p-1.5 rounded-full transition-all active:scale-90 ${isMuted ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                                title={isMuted ? "Sesi Aç" : "Sustur"}
                            >
                                {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                            </button>
                            <button
                                onClick={toggleVideo}
                                className={`p-1.5 rounded-full transition-all active:scale-90 ${isVideoOff ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                                title={isVideoOff ? "Kamerayı Aç" : "Kamerayı Kapat"}
                            >
                                {isVideoOff ? <VideoOff size={14} /> : <Video size={14} />}
                            </button>
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('webrtc-open-settings'))}
                                className="p-1.5 hover:bg-white/5 hover:text-white text-zinc-400 rounded-full transition-all active:scale-90"
                                title="Ayarlar"
                            >
                                <Settings size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
