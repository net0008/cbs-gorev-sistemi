'use client';
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import Image from 'next/image';
import { X, CheckCircle } from 'lucide-react';

const coordinatesBlock = {
  title:   { centerX: 52.14, centerY: 11.26, width: 65.06, height: 15.82 },
  legend:  { centerX: 91.1,  centerY: 90.35, width: 15.77, height: 15.95 },
  scale:   { centerX: 13.76, centerY: 94.25, width: 20.99, height: 13.8 },
  compass: { centerX: 93.46, centerY: 17.45, width: 11.43, height: 25.59 },
  coords:  { centerX: 1.45,  centerY: 45.43, width: 4.00,  height: 64.39 }, // Koordinat alanı biraz genişletildi
};

export default function MapReadingActivity({ onClose }: { onClose: () => void }) {
  const [solved, setSolved] = useState<string[]>([]);
  const dropZoneRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // PERFORMANS: Sürükleme sonundaki mesafe kontrolü (Lag giderme)
  const handleDragEnd = useCallback((id: string, info: PanInfo) => {
    const zone = dropZoneRefs.current[id];
    if (!zone) return;

    const rect = zone.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distance = Math.sqrt(
      Math.pow(info.point.x - centerX, 2) + Math.pow(info.point.y - centerY, 2)
    );

    if (distance < 60) { // Mıknatıs mesafesi
      setSolved(prev => prev.includes(id) ? prev : [...prev, id]);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* 1. ÜST BAR (Logolar ve Kapat) */}
      <header className="p-4 px-8 flex justify-between items-center bg-black/60 border-b border-white/10 backdrop-blur-md z-20">
        <div>
          <h2 className="font-bold text-xl text-emerald-400">Haritalar Nasıl Okunur?</h2>
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1 block">Öğrenme Çıktıları ve Süreç Bileşenleri</span>
        </div>
        <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-full font-bold transition-all active:scale-90 shadow-lg">
          KAPAT
        </button>
      </header>

      {/* 2. SÜRÜKLENECEK ÖĞELER BANTI (YUKARI TAŞINDI) */}
      <div className="bg-[#2D3328]/90 p-6 flex flex-wrap justify-center gap-4 border-b border-white/5 z-10 shadow-2xl">
        <AnimatePresence>
          {Object.keys(coordinatesBlock).filter(id => !solved.includes(id)).map(id => (
            <motion.div
              key={id}
              drag
              dragSnapToOrigin
              onDragEnd={(_, info) => handleDragEnd(id, info)}
              whileDrag={{ scale: 1.1, zIndex: 100 }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl cursor-grab active:cursor-grabbing font-bold shadow-xl border border-emerald-400/20 uppercase text-xs tracking-widest"
            >
              {id === 'title' ? 'Başlık' : id === 'legend' ? 'Lejant' : id === 'scale' ? 'Ölçek' : id === 'compass' ? 'Yön Oku' : 'Koordinat'}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {solved.length === 5 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-3 bg-white text-emerald-900 px-8 py-2 rounded-xl font-black shadow-2xl border-2 border-emerald-500">
            <CheckCircle className="text-emerald-600" /> ETKİNLİK TAMAMLANDI!
          </motion.div>
        )}
      </div>

      {/* 3. HARİTA ALANI */}
      <main className="flex-1 relative flex items-center justify-center p-6 bg-[#0a0a0a]">
        <div className="relative w-full h-full max-w-6xl aspect-[16/9] bg-slate-900 shadow-2xl rounded-2xl overflow-hidden border border-white/5">
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
            className={`transition-all duration-700 border flex items-center justify-center
              ${solved.includes(id) 
                ? 'blur-none bg-emerald-500/10 border-emerald-500/50' 
                : id === 'coords' 
                  ? 'blur-md bg-red-500/10 border-red-500/40 border-dashed animate-pulse' // KOORDİNAT ÖZEL BELİRGİNLEŞTİRME
                  : 'blur-3xl bg-white/5 border-white/10 backdrop-blur-2xl' // DİĞERLERİ FLULAŞTIRILDI
              }
              `}
            >
              {solved.includes(id) && (
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter bg-slate-950/80 px-2 py-1 rounded border border-emerald-500/20">
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