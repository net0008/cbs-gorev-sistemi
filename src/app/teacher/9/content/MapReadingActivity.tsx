'use client';
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import Image from 'next/image';
import { X, CheckCircle, Crosshair } from 'lucide-react';

// 🎯 Hasbi Hocam, Yeni % Koordinatlar (Tam istediğin değerler)
const coordinatesBlock = {
  title:   { centerX: 53.38, centerY: 10.51, width: 65.06, height: 15.82 },
  legend:  { centerX: 91.97, centerY: 90.84, width: 15.77, height: 15.95 },
  scale:   { centerX: 13.07, centerY: 94.41, width: 20.99, height: 13.80 },
  compass: { centerX: 93.54, centerY: 17.50, width: 11.43, height: 25.59 },
  coords:  { centerX: 1.43,  centerY: 45.75, width: 3.16,  height: 64.39 },
};

export default function MapReadingActivity({ onClose }: { onClose: () => void }) {
  const [solved, setSolved] = useState<string[]>([]);
  const [liveCoords, setLiveCoords] = useState<{x: number, y: number} | null>(null);
  const dropZoneRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const activityAreaRef = useRef<HTMLDivElement>(null);

  // Canlı koordinat yakalama ve kopyalama fonksiyonu
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(2));
    const y = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(2));
    setLiveCoords({ x, y });
    const coordString = `centerX: ${x}, centerY: ${y}`;
    if (navigator.clipboard) navigator.clipboard.writeText(coordString);
  };

  const handleDragEnd = useCallback((id: string, info: PanInfo) => {
    const zone = dropZoneRefs.current[id];
    if (!zone) return;
    const rect = zone.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.sqrt(Math.pow(info.point.x - centerX, 2) + Math.pow(info.point.y - centerY, 2));
    if (distance < 50) setSolved(prev => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  return (
    <div ref={activityAreaRef} className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden select-none">
      
      {/* 1. ÜST BAR */}
      <div className="p-3 px-6 flex justify-between items-center bg-black/60 border-b border-white/10 flex-shrink-0">
        <div className="text-white">
          <h2 className="font-bold text-lg text-emerald-400 leading-tight">Haritalar Nasıl Okunur?</h2>
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mt-0.5">Öğrenme Çıktıları ve Süreç Bileşenleri</span>
        </div>
        <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white px-6 py-1.5 rounded-full font-bold text-sm transition-all active:scale-95 shadow-lg">KAPAT</button>
      </div>

      {/* 2. SÜRÜKLENECEK ÖĞELER BANTI (Yukarıda ve Dar) */}
      <div className="bg-[#2D3328]/95 p-2 flex flex-wrap justify-center items-center gap-2 border-b border-white/5 flex-shrink-0 min-h-[55px] z-10">
        <AnimatePresence>
          {Object.keys(coordinatesBlock).filter(id => !solved.includes(id)).map((id) => (
            <motion.div
              key={id}
              layoutId={id}
              drag
              dragConstraints={activityAreaRef}
              dragSnapToOrigin
              onDragEnd={(_, info) => handleDragEnd(id, info)}
              whileDrag={{ scale: 1.1, zIndex: 100 }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg cursor-grab active:cursor-grabbing font-bold shadow-md border border-emerald-400/20 text-xs uppercase"
            >
              {id === 'title' ? 'Başlık' : id === 'legend' ? 'Lejant' : id === 'scale' ? 'Ölçek' : id === 'compass' ? 'Yön Oku' : id === 'coords' ? 'Koordinat' : id}
            </motion.div>
          ))}
        </AnimatePresence>
        {solved.length === 5 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 bg-white text-emerald-900 px-4 py-1 rounded-lg font-black text-xs border-2 border-emerald-500 shadow-xl">
            <CheckCircle size={16} /> TAMAMLANDI!
          </motion.div>
        )}
      </div>

      {/* 3. HARİTA ALANI (Tıklanabilir ve Tam Sığdırma) */}
      <div className="relative flex-1 flex items-center justify-center p-1 bg-[#0a0a0a] overflow-hidden">
        <div 
          onClick={handleMapClick}
          className="relative w-full h-full max-w-7xl aspect-video shadow-2xl overflow-hidden border border-white/5 cursor-crosshair"
        >
          <Image src="/9/harita/map-sicaklik.jpg" alt="Harita" fill priority className="object-contain pointer-events-none select-none" />
          
          {Object.entries(coordinatesBlock).map(([id, geo]) => (
            <div
              key={id}
              ref={(ref) => { dropZoneRefs.current[id] = ref; }}
              style={{
                position: 'absolute',
                top: `${geo.centerY - geo.height / 2}%`,
                left: `${geo.centerX - geo.width / 2}%`,
                width: `${geo.width}%`,
                height: `${geo.height}%`,
              }}
              className={`transition-all duration-700 flex items-center justify-center pointer-events-none
                ${solved.includes(id) ? 'blur-none bg-emerald-500/10 border-2 border-emerald-500/50' : 'blur-2xl bg-white/5 border-white/10 backdrop-blur-xl rounded-md'}
              `}
            >
              {solved.includes(id) && (
                <div className="bg-emerald-600/90 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-lg border border-emerald-400/30">
                  {id === 'title' ? 'Başlık' : id === 'legend' ? 'Lejant' : id === 'scale' ? 'Ölçek' : id === 'compass' ? 'Yön Oku' : id === 'coords' ? 'Koordinat' : id}
                </div>
              )}
            </div>
          ))}

          {/* Nişangah İşaretçisi */}
          {liveCoords && (
            <div className="absolute w-6 h-6 border-2 border-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                 style={{ left: `${liveCoords.x}%`, top: `${liveCoords.y}%` }} />
          )}
        </div>
      </div>

      {/* 🚀 CANLI KOORDİNAT BİLGİ KUTUSU */}
      {liveCoords && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black/95 text-emerald-400 px-6 py-3 rounded-2xl border border-emerald-500/30 shadow-2xl z-[999] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Crosshair size={18} className="animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-black text-slate-500">Kopyalandı</span>
            <code className="text-sm font-mono font-bold tracking-tighter">centerX: {liveCoords.x}, centerY: {liveCoords.y}</code>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setLiveCoords(null); }} className="ml-2 p-1 hover:bg-white/10 rounded-full text-slate-500"><X size={14} /></button>
        </div>
      )}
    </div>
  );
}