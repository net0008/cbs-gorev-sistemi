'use client';
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { X, CheckCircle } from 'lucide-react';

interface MapReadingActivityProps {
  onClose: () => void;
}

export default function MapReadingActivity({ onClose }: MapReadingActivityProps) {
  const [solved, setSolved] = useState<string[]>([]);
  const dropZoneRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Fiziki haritadaki öğelerin gerçek yerlerine göre optimize edilmiş koordinatlar
  const elements = [
    { id: 'title', label: 'Başlık', pos: { top: '2%', left: '25%', width: '50%', height: '8%' } },
    { id: 'legend', label: 'Lejant', pos: { bottom: '4%', right: '2%', width: '18%', height: '24%' } },
    { id: 'scale', label: 'Ölçek', pos: { bottom: '4%', left: '2%', width: '22%', height: '10%' } },
    { id: 'compass', label: 'Yön Oku', pos: { top: '2%', right: '2%', width: '12%', height: '18%' } },
    { id: 'coords', label: 'Koordinatlar', pos: { top: '0%', left: '0%', width: '100%', height: '100%', border: '20px solid transparent' } }
  ];

  const handleDragEnd = (id: string, info: any) => {
    const zone = dropZoneRefs.current[id]?.getBoundingClientRect();
    if (dropZone) {
    if (zone) {
      if (
        info.point.x > zone.left && info.point.x < zone.right &&
        info.point.y > zone.top && info.point.y < zone.bottom
      ) {
        setSolved(prev => [...prev, id]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* Üst Bar */}
      <div className="p-4 flex justify-between items-center bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="text-white">
          <h2 className="font-bold text-xl text-emerald-400">Haritalar Nasıl Okunur?</h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest">Kazanım: COĞ.9.2.1</p>
        </div>
        <button 
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-full font-bold transition-all active:scale-90 shadow-lg shadow-red-900/40 flex items-center gap-2"
        >
          <X size={18} /> KAPAT
        </button>
      </div>

      {/* Harita Alanı */}
      <div className="relative flex-1 flex items-center justify-center p-6 bg-[#0a0a0a]">
        <div className="relative w-full h-full max-w-6xl aspect-[16/9] shadow-2xl rounded-xl overflow-hidden border border-white/5">
          <Image 
            src="/9/harita/turkiye-fiziki.jpg" 
            alt="Türkiye Fiziki Haritası" 
            fill
            priority
            className="object-contain"
          />

          {elements.map((el) => (
            <div
              key={el.id}
              ref={(ref) => { dropZoneRefs.current[el.id] = ref; }}
              style={el.pos}
              className={`absolute transition-all duration-1000 
                ${solved.includes(el.id) ? 'blur-none bg-transparent' : 'blur-2xl bg-white/5 backdrop-blur-xl border border-white/10'}
              `}
            />
          ))}
        </div>
      </div>

      {/* Sürükle-Bırak Paneli */}
      <div className="bg-[#1a1d18] p-8 flex flex-wrap justify-center gap-4 border-t border-white/5">
        {elements.filter(e => !solved.includes(e.id)).map((el) => (
          <motion.div
            key={el.id}
            drag
            dragSnapToOrigin
            onDragEnd={(_, info) => handleDragEnd(el.id, info)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-7 py-3 rounded-xl cursor-grab active:cursor-grabbing font-bold shadow-xl border border-emerald-400/20"
          >
            {el.label}
          </motion.div>
        ))}

        {solved.length === elements.length && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-3 bg-emerald-100 text-emerald-900 px-10 py-3 rounded-xl font-black shadow-2xl border-2 border-emerald-500">
            <CheckCircle className="text-emerald-600" /> ETKİNLİK BAŞARIYLA TAMAMLANDI!
          </motion.div>
        )}
      </div>
    </div>
  );
}