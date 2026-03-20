'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Navigation, Target, Send } from 'lucide-react';

interface RouteSimulationActivityProps {
  onClose: () => void;
}

// 🛑 KOORDİNAT VERİ TABANI
const boylamX: Record<string, number> = {
  '10W': 10.90, '0': 17.24, '10E': 23.58, '20E': 29.70, '30E': 35.82,
  '40E': 42.24, '50E': 48.28, '60E': 54.55, '70E': 60.97, '80E': 67.01,
  '90E': 73.51, '100E': 79.48, '110E': 85.60, '120E': 91.94
};

const enlemY: Record<string, number> = {
  '50N': 8.61, '40N': 20.56, '30N': 30.93, '20N': 40.46, '10N': 49.44,
  '0': 58.24, '10S': 67.04, '20S': 75.83, '30S': 85.56, '40S': 95.93
};

export default function RouteSimulationActivity({ onClose }: RouteSimulationActivityProps) {
  const [selectedEnlem, setSelectedEnlem] = useState<string>('0');
  const [selectedBoylam, setSelectedBoylam] = useState<string>('0');

  const [prevPos, setPrevPos] = useState({ x: boylamX['0'], y: enlemY['0'] });
  const [dronePos, setDronePos] = useState({ x: boylamX['0'], y: enlemY['0'] });
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);

  // 🔊 Hedefe Varış Sesi
  const playSuccessSound = () => {
    if (typeof window === 'undefined') return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  };

  const handleSendDrone = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setHasArrived(false);
    setPrevPos(dronePos); // Çizgi çizmek için önceki pozisyonu sakla
    setDronePos({ x: boylamX[selectedBoylam], y: enlemY[selectedEnlem] });

    // Animasyon süresi 1.5 saniye
    setTimeout(() => {
      setIsAnimating(false);
      setHasArrived(true);
      playSuccessSound();
    }, 1500);
  };

  // Drone'un gittiği yöne doğru burnunu (açısını) hesaplayan fonksiyon
  const getDroneRotation = () => {
    if (dronePos.x === prevPos.x && dronePos.y === prevPos.y) return 45; // Hareket yoksa varsayılan açı
    const dx = dronePos.x - prevPos.x;
    const dy = dronePos.y - prevPos.y;
    // Navigation ikonu normalde sağ-üste bakıyor, +45 derece ekleyerek tam yönü buluyoruz.
    return Math.atan2(dy, dx) * (180 / Math.PI) + 45; 
  };

  // 🚫 ZOOM VE KAYDIRMA ENGELLEYİCİ
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => { if (e.ctrlKey) e.preventDefault(); };
    const handleTouchMove = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault(); };
    
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden select-none font-sans">
      {/* Header */}
      <div className="p-4 px-6 flex justify-between items-center bg-black/80 border-b border-white/10 flex-shrink-0 z-50">
        <div className="text-white">
          <h2 className="font-extrabold text-xl text-blue-400 leading-tight">Dinamik Rota Simülasyonu</h2>
          <span className="text-xs text-slate-400 uppercase font-black tracking-widest block mt-1">Drone Navigasyon Oyunu</span>
        </div>
        <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white px-6 py-1.5 rounded-full font-bold text-sm transition-all active:scale-95">
          KAPAT
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center p-4 bg-[#050505] overflow-hidden">
        {/* Harita Alanı */}
        <div 
          className="relative w-full h-full shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden border-2 border-white/5 bg-[#0a0a0a] rounded-xl flex-shrink-0"
          style={{
             // Resmin bozulmaması ve x/y yüzdelerinin haritaya tam oturması için CSS kuralı
             maxWidth: 'min(100%, calc(100vh * 1340 / 1080))',
             maxHeight: 'min(100%, calc(100vw * 1080 / 1340))',
             aspectRatio: '1340 / 1080'
          }}
        >
          <Image 
            src="/9/harita/koordinat-01.svg" 
            alt="Koordinat Haritası" 
            fill 
            priority 
            className="object-contain pointer-events-none opacity-90" 
          />
          
          {/* Animasyon Katmanı */}
          
          {/* Gidiş Yolu (Path) Çizgisi */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
            <motion.line
              x1={`${prevPos.x}%`} y1={`${prevPos.y}%`}
              x2={`${dronePos.x}%`} y2={`${dronePos.y}%`}
              stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="8 8" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isAnimating || hasArrived ? { pathLength: 1, opacity: 0.6 } : { pathLength: 0, opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </svg>

          {/* Hedefe Varıldı Efekti (Ping) */}
          {hasArrived && (
            <motion.div
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-green-500 z-10 pointer-events-none"
              style={{ width: 40, height: 40, left: `${dronePos.x}%`, top: `${dronePos.y}%` }}
            />
          )}

          {/* Drone İkonu */}
          <motion.div
            initial={false}
            animate={{ left: `${dronePos.x}%`, top: `${dronePos.y}%` }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center pointer-events-none drop-shadow-2xl"
          >
            <div className="relative flex items-center justify-center bg-red-600/20 rounded-full p-2 border border-red-500/30 backdrop-blur-sm">
              <motion.div
                animate={{ rotate: getDroneRotation() }}
                transition={{ duration: 0.5 }} // Dönüş animasyonunu yumuşat
              >
                <Navigation size={28} className="text-red-500 fill-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              </motion.div>
            </div>
            
            {/* Varış Bilgisi Overlay */}
            {hasArrived && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="absolute top-12 bg-green-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow-xl whitespace-nowrap border border-green-400/50"
               >
                 Hedefe Varıldı!
               </motion.div>
            )}
          </motion.div>

        </div>

        {/* Görev Kontrol Paneli */}
        <div className="absolute bottom-6 right-6 lg:bottom-10 lg:right-10 z-30 w-[320px] bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <h3 className="text-blue-400 font-bold mb-5 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Target size={18} /> Drone Kontrol Merkezi
          </h3>
          
          <div className="space-y-4">
            {/* Enlem Seçimi */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Enlem (Latitude)</label>
              <select
                value={selectedEnlem}
                onChange={(e) => setSelectedEnlem(e.target.value)}
                disabled={isAnimating}
                className="bg-[#0f172a] border border-slate-700 text-white rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 appearance-none font-medium cursor-pointer"
              >
                {Object.keys(enlemY).map((key) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>

            {/* Boylam Seçimi */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Boylam (Longitude)</label>
              <select
                value={selectedBoylam}
                onChange={(e) => setSelectedBoylam(e.target.value)}
                disabled={isAnimating}
                className="bg-[#0f172a] border border-slate-700 text-white rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 appearance-none font-medium cursor-pointer"
              >
                {Object.keys(boylamX).map((key) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>

            {/* Gönder Butonu */}
            <button
              onClick={handleSendDrone}
              disabled={isAnimating}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/40 active:scale-95 border border-blue-500/50"
            >
              {isAnimating ? (
                <span className="flex items-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Target size={18} />
                  </motion.div>
                  Seyir Halinde...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send size={18} />
                  Drone'u Gönder
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}