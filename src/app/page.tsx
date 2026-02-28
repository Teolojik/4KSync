'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/shared/lib/supabase';
import { useState, useEffect, Suspense } from 'react';
import { Monitor, Wifi, Shield, Zap } from 'lucide-react';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'kicked') {
      setErrorMsg('Odadaki yönetici tarafından atıldınız.');
    } else if (reason === 'banned') {
      setErrorMsg('Bu odaya girişiniz yönetici tarafından kalıcı olarak engellenmiştir.');
    }
  }, [searchParams]);

  const createRoom = async () => {
    setIsCreating(true);
    router.push(`/p/general`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] text-white p-8 relative overflow-hidden">
      {/* Background Glows (Consistent with new theme) */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#A855F7]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6200EA]/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-2xl text-center">
        {/* Logo / Brand */}
        <div className="mb-8 animate-fadeIn">
          <div className="inline-flex items-center gap-3 bg-[#18181b] border border-white/5 px-5 py-2.5 rounded-full mb-8 shadow-xl">
            <div className="w-2.5 h-2.5 rounded-full bg-[#A855F7] shadow-[0_0_12px_rgba(168,85,247,0.6)] animate-pulse"></div>
            <span className="text-sm text-white/50 font-semibold tracking-wide uppercase text-[10px]">Aktif • Kayıt gerektirmez</span>
          </div>
        </div>

        <h1 className="text-7xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent leading-[0.9] animate-fadeIn">
          4KSYNC<br /><span className="text-[#A855F7]">STREAM</span>
        </h1>

        <p className="text-lg text-white/40 mb-12 leading-relaxed max-w-lg mx-auto animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          Senkronize film izleme ve 4K video görüşmeleri için Discord'a yüksek kaliteli bir alternatif.
        </p>

        {errorMsg && (
          <div className="mb-8 p-4 glass-card !border-red-500/20 text-red-400 rounded-2xl font-medium animate-fadeIn">
            {errorMsg}
          </div>
        )}

        <div className="animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={createRoom}
            disabled={isCreating}
            className="group btn-primary text-lg font-black px-12 py-5 rounded-3xl transition-all hover:scale-105 active:scale-95 shadow-[0_10px_40px_rgba(255,255,255,0.1)] flex items-center gap-3 mx-auto"
          >
            {isCreating ? 'Açılıyor...' : 'Oda Başlat'}
            <Zap size={20} className="group-hover:rotate-12 duration-300" />
          </button>
        </div>
      </div>

      {/* Feature Pills */}
      <div className="flex flex-wrap justify-center gap-3 mt-12 animate-fadeIn" style={{ animationDelay: '0.5s' }}>
        <div className="bg-[#18181b] border border-white/5 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg">
          <Monitor size={14} className="text-[#A855F7]" />
          <span className="text-[11px] text-white/60 font-bold uppercase tracking-wider">4K 60fps Paylaşım</span>
        </div>
        <div className="bg-[#18181b] border border-white/5 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg">
          <Shield size={14} className="text-[#A855F7]" />
          <span className="text-[11px] text-white/60 font-bold uppercase tracking-wider">P2P Şifreleme</span>
        </div>
        <div className="bg-[#18181b] border border-white/5 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg">
          <Zap size={14} className="text-[#A855F7]" />
          <span className="text-[11px] text-white/60 font-bold uppercase tracking-wider">Düşük Gecikme</span>
        </div>
        <div className="bg-[#18181b] border border-white/5 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg">
          <Wifi size={14} className="text-[#A855F7]" />
          <span className="text-[11px] text-white/60 font-bold uppercase tracking-wider">WebRTC</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
      <HomeContent />
    </Suspense>
  );
}
