'use client';
import React, { useState, useRef, useCallback, CSSProperties } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import Image from 'next/image';
import { X, CheckCircle } from 'lucide-react';

interface MapReadingActivityProps {
  // Katalog sayfasına geri dönmek için kullanılacak fonksiyon
  onClose: () => void;
}

// 3. Optimize Edilmiş Yüzde Koordinat Data Bloğu
// Base Dims: G: 2816 px, Y: 1536 px
const coordinatesBlock = {
  title: { centerX: 50.07, centerY: 10.61, width: 65.06, height: 15.82 },
  legend: { centerX: 87.5, centerY: 87.17, width: 15.77, height: 15.95 },
  scale: { centerX: 13.64, centerY: 89.65, width: 20.99, height: 13.8 },
  compass: { centerX: 89.35, centerY: 17.45, width: 11.43, height: 25.59 },
  coords: { centerX: 1.56, centerY: 63.67, width: 3.16, height: 64.39 },
};

// Helper to convert center-based percentages to top/left-based CSS properties
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

  // Mıknatıs etkisi için piksel cinsinden maksimum mesafe
  const SNAP_DISTANCE = 50;

  // Fiziki haritadaki öğelerin gerçek yerlerine göre optimize edilmiş koordinatlar
  const elements = [
    { id: 'title', label: 'Başlık', pos: convertCoordsToCSS(coordinatesBlock.title) },
    { id: 'legend', label: 'Lejant', pos: convertCoordsToCSS(coordinatesBlock.legend) },
    { id: 'scale', label: 'Ölçek', pos: convertCoordsToCSS(coordinatesBlock.scale) },
    { id: 'compass', label: 'Yön Oku', pos: convertCoordsToCSS(coordinatesBlock.compass) },
    { id: 'coords', label: 'Koordinatlar', pos: convertCoordsToCSS(coordinatesBlock.coords) },
  ];

  // 2. Hassas Mıknatıs (Homing Snap) Mekanizması
  const handleDragEnd = useCallback((id: string, info: PanInfo) => {
    const dropZone = dropZoneRefs.current[id];
    if (!dropZone) return;
 
    const zoneRect = dropZone.getBoundingClientRect();
    const zoneCenterX = zoneRect.left + zoneRect.width / 2;
    const zoneCenterY = zoneRect.top + zoneRect.height / 2;
 
    const dropPointX = info.point.x;
    const dropPointY = info.point.y;
 
    const distance = Math.sqrt(
      Math.pow(dropPointX - zoneCenterX, 2) + Math.pow(dropPointY - zoneCenterY, 2)
    );
 
    if (distance < SNAP_DISTANCE) {
      if (!solved.includes(id)) {
        setSolved(prev => [...prev, id]);
      }
    }
  }, [solved]);

  return (
    <div ref={activityAreaRef} className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* Üst Bar */}
      <div className="p-4 flex justify-between items-center bg-black/40 backdrop-blur-md border-b border-white/10 flex-shrink-0">
        <div className="text-white">
          <h2 className="font-bold text-xl text-emerald-400">Haritalar Nasıl Okunur?</h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest">Kazanım: COĞ.9.2.1</p>
        </div>
        {/* Estetik: KAPAT Butonu */}
        <button 
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-full font-bold transition-all active:scale-95 shadow-lg shadow-red-900/40 flex items-center gap-2"
        >
          <X size={18} /> KAPAT
        </button>
      </div>

      {/* Harita Alanı */}
      <div className="relative flex-1 flex items-center justify-center p-6 bg-[#0a0a0a]">
        <div className="relative w-full h-full max-w-6xl aspect-[16/9] shadow-2xl rounded-xl overflow-hidden border border-white/5">
          {/* 1. Altlık ve Görüntü Mimarisi */}
          <Image 
            src="/9/harita/map-sicaklik.jpg" 
            alt="Türkiye Sıcaklık Haritası" 
            fill
            priority
            className="object-contain"
          />
          <Image 
            src="/9/harita/map-sicaklik-altlik.jpg" 
            alt="Türkiye Sıcaklık Haritası Altlık" 
            fill
            priority
            className="object-contain opacity-0 pointer-events-none"
          />

          {elements.map((el) => {
            const isSolved = solved.includes(el.id);
            return (
              <div
                key={el.id}
                ref={(ref) => { dropZoneRefs.current[el.id] = ref; }}
                style={el.pos}
                className={`absolute transition-all duration-700 
                  ${isSolved ? 'blur-none bg-transparent' : 'blur-xl bg-white/5 backdrop-blur-md border border-white/10 rounded-lg'}
                `}
              >
                {isSolved && (
                  <motion.div
                    layoutId={el.id}
                    className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm bg-emerald-600/80 rounded-lg"
                  >
                    {el.label}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sürükle-Bırak Paneli */}
      <div className="bg-[#2D3328]/95 p-8 flex flex-wrap justify-center items-center gap-4 border-t border-white/5 flex-shrink-0">
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
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-7 py-3 rounded-xl cursor-grab active:cursor-grabbing font-bold shadow-xl border border-emerald-400/20 transition-colors active:scale-95"
            >
              {el.label}
            </motion.div>
          ))}
        </AnimatePresence>

        {solved.length === elements.length && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-3 bg-emerald-100 text-emerald-900 px-10 py-3 rounded-xl font-black shadow-2xl border-2 border-emerald-500">
            <CheckCircle className="text-emerald-600" /> ETKİNLİK BAŞARIYLA TAMAMLANDI!
          </motion.div>
        )}
      </div>
    </div>
  );
}