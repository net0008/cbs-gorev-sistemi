'use client';
import React, { useState, useRef, useCallback, CSSProperties } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import Image from 'next/image';
import { X, CheckCircle } from 'lucide-react';

interface MapReadingActivityProps {
  onClose: () => void;
}

const coordinatesBlock = {
  title: { centerX: 52.14, centerY: 11.26, width: 65.06, height: 15.82 },
  legend: { centerX: 91.1, centerY: 90.35, width: 15.77, height: 15.95 },
  scale: { centerX: 13.76, centerY: 94.25, width: 20.99, height: 13.8 },
  compass: { centerX: 93.46, centerY: 17.45, width: 11.43, height: 25.59 },
  coords: { centerX: 1.45, centerY: 45.43, width: 3.16, height: 64.39 },
};

const convertCoordsToCSS = (coords: typeof coordinatesBlock[keyof typeof coordinatesBlock]): CSSProperties => {
  return {
    top: `${coords.centerY - coords.height / 2}%`,
    left: `${coords.centerX - coords.width / 2}%`,
    width: `${coords.width}%`,
    height: `${coords.height}%`,
  };
};

export default function MapReadingActivity({ onClose }: MapReadingActivityProps) {
  const [solved, setSolved] = useState<string[]>([]);
  const dropZoneRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const activityAreaRef = useRef<HTMLDivElement>(null);
  const SNAP_DISTANCE = 60; // Mıknatıs hassasiyeti

  const elements = [
    { id: 'title', label: 'Başlık', pos: convertCoordsToCSS(coordinatesBlock.title) },
    { id: 'legend', label: 'Lejant', pos: convertCoordsToCSS(coordinatesBlock.legend) },
    { id: 'scale', label: 'Ölçek', pos: convertCoordsToCSS(coordinatesBlock.scale) },
    { id: 'compass', label: 'Yön Oku', pos: convertCoordsToCSS(coordinatesBlock.compass) },
    { id: 'coords', label: 'Koordinatlar', pos: convertCoordsToCSS(coordinatesBlock.coords) },
  ];

  const handleDragEnd = useCallback((id: string, info: PanInfo) => {
    const dropZone = dropZoneRefs.current[id];
    if (!dropZone) return;
    const zoneRect = dropZone.getBoundingClientRect();
    const zoneCenterX = zoneRect.left + zoneRect.width / 2;
    const zoneCenterY = zoneRect.top + zoneRect.height / 2;
    const distance = Math.sqrt(Math.pow(info.point.x - zoneCenterX, 2) + Math.pow(info.point.y - zoneCenterY, 2));

    if (distance < SNAP_DISTANCE) {
      if (!solved.includes(id)) setSolved(prev => [...prev, id]);
    }
  }, [solved]);

  return (
    <div ref={activityAreaRef} className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* Üst Bar - Daha ince (p-3) */}
      <div className="p-3 px-6 flex justify-between items-center bg-black/60 backdrop-blur-md border-b border-white/10 flex-shrink-0">
        <div className="text-white">
          <h2 className="font-bold text-lg text-emerald-400 leading-tight">Haritalar Nasıl Okunur?</h2>
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">Öğrenme Çıktıları ve Süreç Bileşenleri</span>
        </div>
        <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white px-6 py-1.5 rounded-full font-bold text-sm transition-all active:scale-95 shadow-lg">
          <X size={16} className="inline mr-1" /> KAPAT
        </button>
      </div>

      {/* Harita Alanı - Boşluklar azaltıldı (p-2) */}
      <div className="relative flex-1 flex items-center justify-center p-2 bg-[#0a0a0a] overflow-hidden">
        <div className="relative w-full h-full max-w-7xl aspect-video shadow-2xl rounded-lg overflow-hidden border border-white/5">
          <Image src="/9/harita/map-sicaklik.jpg" alt="Harita" fill priority className="object-contain" />
          
          {elements.map((el) => {
            const isSolved = solved.includes(el.id);
            return (
              <div
                key={el.id}
                ref={(ref) => { dropZoneRefs.current[el.id] = ref; }}
                style={el.pos}
                className={`absolute transition-all duration-700 flex items-center justify-center
                  ${isSolved ? 'blur-none bg-emerald-500/10 border-2 border-emerald-500/50' : 'blur-2xl bg-white/5 border-white/10 backdrop-blur-xl rounded-md'}
                `}
              >
                {isSolved && (
                  <motion.div initial={{scale:0}} animate={{scale:1}} className="bg-emerald-600/90 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-xl border border-emerald-400/30">
                    {el.label}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Alt Bant - Küçültüldü ve Boşluk Azaltıldı */}
      <div className="bg-[#2D3328]/95 p-3 flex flex-wrap justify-center items-center gap-3 border-t border-white/5 flex-shrink-0 min-h-[80px]">
        <AnimatePresence>
          {elements.filter(e => !solved.includes(e.id)).map((el) => (
            <motion.div
              key={el.id}
              layoutId={el.id}
              drag
              dragConstraints={activityAreaRef}
              dragSnapToOrigin
              onDragEnd={(_, info) => handleDragEnd(el.id, info)}
              whileDrag={{ scale: 1.1, zIndex: 100 }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg cursor-grab active:cursor-grabbing font-bold shadow-md border border-emerald-400/20 text-xs uppercase tracking-wider"
            >
              {el.label}
            </motion.div>
          ))}
        </AnimatePresence>

        {solved.length === elements.length && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 bg-white text-emerald-900 px-6 py-2 rounded-lg font-black shadow-2xl border-2 border-emerald-500 text-sm">
            <CheckCircle className="text-emerald-600" size={20} /> ETKİNLİK BAŞARIYLA TAMAMLANDI!
          </motion.div>
        )}
      </div>
    </div>
  );
}