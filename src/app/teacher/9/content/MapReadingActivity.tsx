'use client';
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, CheckCircle, Info } from 'lucide-react';

// 🎯 Hasbi Hocam, Optimize Edilmiş Yeni % Koordinatları (Başlık Sabit)
const coordinatesBlock = {
  title:   { centerX: 52.14, centerY: 11.26, width: 65.06, height: 14.00 }, // Başlık sabit
  legend:  { centerX: 91.10, centerY: 90.35, width: 18.00, height: 18.00 }, // Kutu formu optimize edildi
  scale:   { centerX: 13.76, centerY: 94.25, width: 24.00, height: 10.00 }, // Yatay genişlik artırıldı
  compass: { centerX: 93.46, centerY: 17.45, width: 12.00, height: 20.00 }, // Dikey form optimize edildi
  coords:  { centerX: 1.45,  centerY: 50.00, width: 3.50,  height: 85.00 }, // Tüm sol kenarı kapsayacak şekilde optimize edildi
};

export default function MapReadingActivity({ onClose }: { onClose: () => void }) {
  const [solved, setSolved] = useState<string[]>([]);
  const dropZoneRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleDragEnd = (id: string, info: any) => {
    const dropZone = dropZoneRefs.current[id];
    if (!dropZone) return;

    const zoneRect = dropZone.getBoundingClientRect();
    const zoneCenterX = zoneRect.left + zoneRect.width / 2;
    const zoneCenterY = zoneRect.top + zoneRect.height / 2;

    const distance = Math.sqrt(
      Math.pow(info.point.x - zoneCenterX, 2) + Math.pow(info.point.y - zoneCenterY, 2)
    );

    // Mıknatıs mesafesi: 65px (Öğrenci dostu tolerans)
    if (distance < 65) {
      setSolved(prev => prev.includes(id) ? prev : [...prev, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* 1. ÜST BAR */}
      <header className="p-3 px-8 flex justify-between items-center bg-black/70 border-b border-white/10 backdrop-blur-xl z-20">
        <div className="flex flex-col">
          <h2 className="font-bold text-lg text-emerald-400 leading-none">Haritalar Nasıl Okunur?</h2>
          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1 block">Öğrenme Çıktıları ve Süreç Bileşenleri</span>
        </div>
        <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-bold transition-all active:scale-90 shadow-lg text-sm">
          KAPAT
        </button>
      </header>

      {/* 2. SÜRÜKLENECEK ÖĞELER (ÜSTTE - FİT BANT) */}
      <div className="bg-[#2D3328]/95 p-3 flex flex-wrap justify-center gap-3 border-b border-white/5 z-10 shadow-2xl min-h-[70px]">
        <AnimatePresence>
          {Object.keys(coordinatesBlock).filter(id => !solved.includes(id)).map(id => (
            <motion.div
              key={id}
              drag
              dragSnapToOrigin
              onDragEnd={(_, info) => handleDragEnd(id, info)}
              whileDrag={{ scale: 1.1, zIndex: 100 }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl cursor-grab active:cursor-grabbing font-bold shadow-xl border border-emerald-400/20 uppercase text-[10px] tracking-widest"
            >
              {id === 'title' ? 'Başlık' : id === 'legend' ? 'Lejant' : id === 'scale' ? 'Ölçek' : id === 'compass' ? 'Yön Oku' : 'Koordinat'}
            </motion.div>
          ))}
        </AnimatePresence>

        {solved.length === 5 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 bg-white text-emerald-900 px-8 py-2 rounded-xl font-black shadow-2xl border-2 border-emerald-500 text-xs">
            <CheckCircle className="text-emerald-600" size={18} /> ETKİNLİK TAMAMLANDI!
          </motion.div>
        )}
      </div>

      {/* 3. HARİTA ALANI (MAXİMUM SPACE) */}
      <main className="flex-1 relative flex items-center justify-center p-2 bg-[#0a0a0a]">
        <div className="relative w-full h-full max-w-7xl aspect-video bg-slate-900 shadow-2xl rounded-xl overflow-hidden border border-white/5">
          <Image src="/9/harita/map-sicaklik.jpg" alt="Harita" fill className="object-contain" priority />
          
          {Object.entries(coordinatesBlock).map(([id, geo]) => (
            <div
              key={id}
              ref={el => { dropZoneRefs.current[id] = el; }}
              style={{
                position: 'absolute',
                top: `${geo.centerY - geo.height / 2}%`,
                left: `${geo.centerX - geo.width / 2}%`,
                width: `${geo.width}%`,
                height: `${geo.height}%`
              }}
              className={`transition-all duration-1000 border flex items-center justify-center
                ${solved.includes(id) 
                  ? 'blur-none bg-emerald-500/10 border-emerald-500/50' 
                  : id === 'coords' 
                    ? 'blur-sm bg-blue-500/10 border-blue-500/40 border-dashed animate-pulse ring-2 ring-blue-500/20' // KOORDİNAT EKSTRA BELİRGİN
                    : 'blur-3xl bg-white/5 border-white/10' 
                }
              `}
            >
              {!solved.includes(id) && id === 'coords' && <Info size={16} className="text-blue-400/50" />}
              {solved.includes(id) && (
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-tighter bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/20">
                  {id === 'title' ? 'Başlık' : id === 'legend' ? 'Lejant' : id === 'scale' ? 'Ölçek' : id === 'compass' ? 'Yön Oku' : 'Koordinat'}
                </span>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}