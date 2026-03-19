'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import Image from 'next/image';
import { X, CheckCircle } from 'lucide-react';

interface MapReadingActivityProps {
  onClose: () => void;
}

// 🎯 Hasbi Hocam, En Son Verdiğin Koordinatlar (Zerre şaşmaz)
const coordinatesBlock = {
  title:   { centerX: 53.38, centerY: 10.51, width: 65.06, height: 15.82 },
  legend:  { centerX: 91.97, centerY: 90.84, width: 15.77, height: 15.95 },
  scale:   { centerX: 13.07, centerY: 94.41, width: 20.99, height: 13.80 },
  compass: { centerX: 93.54, centerY: 17.50, width: 11.43, height: 25.59 },
  coords:  { centerX: 1.43,  centerY: 45.75, width: 3.16,  height: 64.39 },
};

export default function MapReadingActivity({ onClose }: MapReadingActivityProps) {
  const [solved, setSolved] = useState<string[]>([]);
  const dropZoneRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const activityAreaRef = useRef<HTMLDivElement>(null);

  // 🔊 MATEMATİKSEL SES ÜRETİCİ (Dosya gerektirmez)
  const playSound = (type: 'success' | 'complete' | 'error') => {
    if (typeof window === 'undefined') return;
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const g = context.createGain();
    g.connect(context.destination);
    g.gain.value = 0.05;

    const osc = context.createOscillator();
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.1);
      osc.connect(g);
      osc.start(); osc.stop(context.currentTime + 0.1);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, context.currentTime + 0.2);
      osc.connect(g);
      osc.start(); osc.stop(context.currentTime + 0.2);
    } else {
      [523, 659, 783, 1046].forEach((f, i) => {
        const o = context.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(f, context.currentTime + i * 0.1);
        o.connect(g); o.start(context.currentTime + i * 0.1); o.stop(context.currentTime + i * 0.1 + 0.2);
      });
    }
  };

  const handleDragEnd = useCallback((id: string, info: PanInfo) => {
    const zone = dropZoneRefs.current[id];
    if (!zone) return;
    const rect = zone.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.sqrt(Math.pow(info.point.x - centerX, 2) + Math.pow(info.point.y - centerY, 2));

    if (distance < 55) {
      if (!solved.includes(id)) {
        setSolved(prev => [...prev, id]);
        playSound('success');
      }
    } else {
      playSound('error');
    }
  }, [solved]);

  useEffect(() => { if (solved.length === 5) playSound('complete'); }, [solved]);

  return (
    <div ref={activityAreaRef} className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden select-none">
      <div className="p-3 px-6 flex justify-between items-center bg-black/60 border-b border-white/10 flex-shrink-0">
        <div className="text-white">
          <h2 className="font-bold text-lg text-emerald-400 leading-tight">Haritalar Nasıl Okunur?</h2>
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mt-0.5">Öğrenme Çıktıları ve Süreç Bileşenleri</span>
        </div>
        <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white px-6 py-1.5 rounded-full font-bold text-sm transition-all active:scale-95">KAPAT</button>
      </div>

      <div className="bg-[#2D3328]/95 p-2 flex flex-wrap justify-center items-center gap-2 border-b border-white/5 flex-shrink-0 min-h-[55px] z-10">
        <AnimatePresence>
          {Object.keys(coordinatesBlock).filter(id => !solved.includes(id)).map((id) => (
            <motion.div
              key={id} layoutId={id} drag dragConstraints={activityAreaRef} dragSnapToOrigin
              onDragEnd={(_, info) => handleDragEnd(id, info)} whileDrag={{ scale: 1.1, zIndex: 100 }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg cursor-grab active:cursor-grabbing font-bold shadow-md border border-emerald-400/20 text-xs uppercase"
            >
              {id === 'title' ? 'Başlık' : id === 'legend' ? 'Lejant' : id === 'scale' ? 'Ölçek' : id === 'compass' ? 'Yön Oku' : 'Koordinat'}
            </motion.div>
          ))}
        </AnimatePresence>
        {solved.length === 5 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 bg-white text-emerald-900 px-4 py-1 rounded-lg font-black text-xs border-2 border-emerald-500">
            <CheckCircle size={16} /> TAMAMLANDI!
          </motion.div>
        )}
      </div>

      <div className="relative flex-1 flex items-center justify-center p-1 bg-[#0a0a0a] overflow-hidden">
        <div className="relative w-full h-full max-w-7xl aspect-video shadow-2xl overflow-hidden border border-white/5">
          <Image src="/9/harita/map-sicaklik.jpg" alt="Harita" fill priority className="object-contain pointer-events-none select-none" />
          {Object.entries(coordinatesBlock).map(([id, geo]) => (
            <div
              key={id} ref={(ref) => { dropZoneRefs.current[id] = ref; }}
              style={{ position: 'absolute', top: `${geo.centerY - geo.height / 2}%`, left: `${geo.centerX - geo.width / 2}%`, width: `${geo.width}%`, height: `${geo.height}%` }}
              className={`transition-all duration-700 flex items-center justify-center pointer-events-none rounded-md
                ${solved.includes(id) ? 'blur-none bg-emerald-500/10 border-2 border-emerald-500/50' : 'bg-[#1a1c18] border-2 border-[#7F8D79]/70 backdrop-blur-2xl'}
              `}
            >
              {solved.includes(id) && (
                <div className="bg-emerald-600/90 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-lg border border-emerald-400/30">
                  {id === 'title' ? 'Başlık' : id === 'legend' ? 'Lejant' : id === 'scale' ? 'Ölçek' : id === 'compass' ? 'Yön Oku' : 'Koordinat'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}