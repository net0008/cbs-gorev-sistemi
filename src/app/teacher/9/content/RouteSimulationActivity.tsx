'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Ship, Plane, Radar } from 'lucide-react';

interface RouteSimulationActivityProps {
  onClose: () => void;
}

type RouteId = 'ship' | 'plane';

// Görev verileri: Harita üzerindeki x,y değerleri yüzde (%) cinsinden tanımlanmıştır.
const routes = {
  ship: {
    id: 'ship' as RouteId,
    title: "Kargo Gemisi: Mersin Limanı'na Seyret",
    coords: "01° 16' 26'' K - 103° 48' 01'' D",
    start: { x: 5, y: 75 },
    end: { x: 75, y: 88 },
    icon: Ship,
    color: '#3b82f6', // Mavi
  },
  plane: {
    id: 'plane' as RouteId,
    title: "Kargo Uçağı: Samsun Havalimanı'na Uç",
    coords: "46° 56' 43'' K - 150° 13' 49'' D",
    start: { x: 10, y: 35 },
    end: { x: 60, y: 15 },
    icon: Plane,
    color: '#f59e0b', // Turuncu
  }
};

export default function RouteSimulationActivity({ onClose }: RouteSimulationActivityProps) {
  const [activeRoute, setActiveRoute] = useState<RouteId | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const activityAreaRef = useRef<HTMLDivElement>(null);

  // 🔊 Sinyal ve Başarı Sesleri (Harici dosya gerektirmez)
  const playSound = (type: 'start' | 'arrive') => {
    if (typeof window === 'undefined') return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'start') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }
  };

  const startSimulation = (id: RouteId) => {
    if (isAnimating) return;
    playSound('start');
    setActiveRoute(id);
    setIsAnimating(true);
    setHasArrived(false);
  };

  const handleArrival = () => {
    setIsAnimating(false);
    setHasArrived(true);
    playSound('arrive');
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

  const activeRouteData = activeRoute ? routes[activeRoute] : null;

  return (
    <div ref={activityAreaRef} className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden select-none touch-none">
      {/* Header */}
      <div className="p-3 px-6 flex justify-between items-center bg-black/60 border-b border-white/10 flex-shrink-0 z-50">
        <div className="text-white">
          <h2 className="font-bold text-lg text-blue-400 leading-tight">Rota ve Koordinat Simülasyonu</h2>
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mt-0.5">Uygulamalı Navigasyon</span>
        </div>
        <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white px-6 py-1.5 rounded-full font-bold text-sm transition-all active:scale-95">
          KAPAT
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center p-1 bg-[#0a0a0a] overflow-hidden">
        {/* Harita Alanı */}
        <div className="relative w-full h-full max-w-7xl aspect-video shadow-2xl overflow-hidden border border-white/5 bg-[#1a1c18]">
          <Image src="/9/harita/map-sicaklik.svg" alt="Harita" fill priority className="object-contain pointer-events-none" />
          
          {/* Animasyon Katmanı */}
          {activeRouteData && (
            <>
              {/* Çizgi (Route Path) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <motion.line
                  x1={`${activeRouteData.start.x}%`} y1={`${activeRouteData.start.y}%`}
                  x2={`${activeRouteData.end.x}%`} y2={`${activeRouteData.end.y}%`}
                  stroke={activeRouteData.color} strokeWidth="3" strokeDasharray="10 10" strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={isAnimating || hasArrived ? { pathLength: 1 } : { pathLength: 0 }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                />
              </svg>

              {/* Araç İkonu */}
              <motion.div
                initial={{ left: `${activeRouteData.start.x}%`, top: `${activeRouteData.start.y}%` }}
                animate={isAnimating || hasArrived ? { left: `${activeRouteData.end.x}%`, top: `${activeRouteData.end.y}%` } : {}}
                transition={{ duration: 4, ease: "easeInOut" }}
                onAnimationComplete={() => { if (isAnimating) handleArrival(); }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
              >
                <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
                  <activeRouteData.icon size={28} color={activeRouteData.color} />
                </div>
              </motion.div>

              {/* Varış Noktası (Radar Pulse) */}
              {hasArrived && (
                <div className="absolute z-10" style={{ left: `${activeRouteData.end.x}%`, top: `${activeRouteData.end.y}%` }}>
                  <motion.div initial={{ scale: 0, opacity: 1 }} animate={{ scale: [1, 2.5, 4], opacity: [1, 0.5, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-4" style={{ width: 30, height: 30, borderColor: activeRouteData.color }} />
                  <div className="absolute top-5 -translate-x-1/2 bg-green-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap border border-green-400/50">Hedefe Ulaşıldı!</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Görev Kontrol Paneli (HUD Overlay) */}
        <div className="absolute bottom-6 right-6 z-30 w-80 bg-black/80 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl">
          <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider"><Radar size={18} /> Seyrüsefer Paneli</h3>
          <div className="space-y-3">
            {Object.values(routes).map(r => (
              <button key={r.id} onClick={() => startSimulation(r.id)} disabled={isAnimating && activeRoute !== r.id} className={`w-full text-left p-3 rounded-xl border transition-all ${activeRoute === r.id ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/10 hover:bg-white/10'} ${(isAnimating && activeRoute !== r.id) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="font-bold text-sm text-white flex items-center gap-2"><r.icon size={16} className={activeRoute === r.id ? 'text-blue-400' : 'text-slate-400'} /> {r.title}</div>
                <div className="text-[11px] text-slate-400 mt-1.5 pl-6 font-mono bg-black/50 py-1 rounded w-max px-2">HDF: {r.coords}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}