'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, PanInfo, Variants } from 'framer-motion';
import { CheckCircle, Lightbulb, X } from 'lucide-react';

interface MapReadingActivityProps {
  onClose: () => void;
}

interface MapElement {
  id: string;
  name: string;
  hint: string;
  position: {
    top: string;
    left: string;
    width: string;
    height: string;
  };
}

const MAP_ELEMENTS: MapElement[] = [
  { id: 'baslik', name: 'Başlık', hint: 'Haritanın konusunu ve amacını belirtir.', position: { top: '4%', left: '30%', width: '40%', height: '10%' } },
  { id: 'lejant', name: 'Lejant', hint: 'Haritadaki sembollerin ve renklerin anlamını açıklar.', position: { top: '60%', left: '72%', width: '23%', height: '35%' } },
  { id: 'olcek', name: 'Ölçek', hint: 'Haritadaki mesafelerin gerçekteki karşılığını gösterir.', position: { top: '88%', left: '5%', width: '30%', height: '10%' } },
  { id: 'yon_oku', name: 'Yön Oku', hint: 'Haritanın yönünü, genellikle kuzeyi gösterir.', position: { top: '15%', left: '80%', width: '10%', height: '15%' } },
  { id: 'koordinatlar', name: 'Koordinatlar', hint: 'Enlem ve boylam çizgileriyle konum belirlemeyi sağlar.', position: { top: '35%', left: '2%', width: '10%', height: '50%' } },
];

const MapReadingActivity = ({ onClose }: MapReadingActivityProps) => {
  const [completedElements, setCompletedElements] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const score = completedElements.length * 20;

  const dropZoneRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const activityAreaRef = useRef<HTMLDivElement>(null);

  const showFeedback = useCallback((message: string, type: 'success' | 'error') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 2000);
  }, []);

  const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };


  const handleDragEnd = useCallback((info: PanInfo, elementId: string) => {
    if (!activityAreaRef.current) return;
    const activityRect = activityAreaRef.current.getBoundingClientRect();

    const dropPoint = {
      x: info.point.x - activityRect.left,
      y: info.point.y - activityRect.top,
    };

    const targetElement = MAP_ELEMENTS.find(el => el.id === elementId);
    if (!targetElement) return;

    const dropZone = dropZoneRefs.current[targetElement.id];

    if (dropZone) {
      const zoneRect = dropZone.getBoundingClientRect();
      const relativeZoneRect = {
        left: zoneRect.left - activityRect.left,
        top: zoneRect.top - activityRect.top,
        right: zoneRect.right - activityRect.left,
        bottom: zoneRect.bottom - activityRect.top,
      };

      if (
        dropPoint.x >= relativeZoneRect.left &&
        dropPoint.x <= relativeZoneRect.right &&
        dropPoint.y >= relativeZoneRect.top &&
        dropPoint.y <= relativeZoneRect.bottom
      ) {
        if (!completedElements.includes(elementId)) {
          setCompletedElements(prev => [...prev, elementId]);
          showFeedback('Harika! Doğru yerleştirdin.', 'success');
        }
      } else {
        showFeedback(targetElement.hint, 'error');
      }
    }
  }, [completedElements, showFeedback]);

  return (
    // 4. Etkinlik Sayfası: Tam ekran, kaydırmasız bir katman olarak tasarlandı.
    <motion.div
      ref={activityAreaRef}
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      // Sayfa düzeni ve hız optimizasyonu: Tam ekran overlay, scrolling yok.
      // overflow-hidden zaten fixed inset-0 ile sağlanıyor.
      className="fixed inset-0 z-50 flex flex-col md:flex-row bg-slate-950" // Genel arka plan bg-slate-950 yapıldı
    >
      {/* 4. Etkinlik Sayfası: Belirgin, parlayan ve sabit 'KAPAT' butonu */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[100] flex items-center justify-center w-12 h-12 bg-red-600/80 text-white rounded-full shadow-lg shadow-red-500/30 transition-all duration-300 hover:bg-red-600 hover:scale-110 hover:shadow-red-500/50 active:scale-95"
        aria-label="Etkinliği Kapat"
      >
        <X size={24} />
      </button>

      {/* Harita Alanı - Ekranın %70'ini kaplar */}
      <div className="relative w-full md:w-[70%] h-1/2 md:h-full flex-shrink-0 bg-slate-200 dark:bg-slate-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full max-w-full max-h-full aspect-[4/3] m-auto">
            {/* 1. Hız ve Görüntü Optimizasyonu: Standart <img> yerine Next.js <Image /> bileşeni kullanıldı. */}
            <Image
              // Kritik Görüntü Yolu (src) güncellendi ve fill, priority, object-contain eklendi.
              src="/9/harita/map-sicaklik.jpg"
              alt="Türkiye Sıcaklık Haritası"
              fill
              priority
              className="w-full h-full object-contain"
            />

            {MAP_ELEMENTS.map((el) => (
              <div
                key={el.id}
                ref={(ref) => { dropZoneRefs.current[el.id] = ref; }}
                style={el.position}
                className="absolute transition-all duration-500"
              >
                <AnimatePresence>
                  {!completedElements.includes(el.id) && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-background/20 blur-xl backdrop-blur-md rounded-lg border-2 border-dashed border-white/30" // Blur efekti güncellendi
                    />
                  )}
                  {completedElements.includes(el.id) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center bg-emerald-600/80 rounded-lg text-white font-bold text-sm"
                    >
                      {el.name}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sağ Panel: Etiketler ve Bilgiler */}
      <div className="w-full md:w-[30%] h-1/2 md:h-full flex flex-col p-6 gap-4 overflow-y-auto">
        <h2 className="text-2xl font-bold text-foreground">Harita Okuryazarlığı: Haritanın Elemanları</h2>
        <p className="text-foreground/70">Aşağıdaki etiketleri harita üzerindeki doğru alanlara sürükleyerek yerleştirin.</p>

        <div className="my-4">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-foreground">Puan: {score}</span>
            <span className="text-sm font-medium text-emerald-500">{completedElements.length} / 5 Tamamlandı</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <motion.div
              className="bg-emerald-600 h-2.5 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
        </div>

        <div className="h-10 flex items-center justify-center">
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${feedback.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}
              >
                {feedback.type === 'success' ? <CheckCircle size={16} /> : <Lightbulb size={16} />}
                {feedback.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sürüklenebilir etiketler panelinin arka planı güncellendi */}
        <div className="flex flex-wrap justify-center items-center gap-4 mt-4 p-4 bg-[#2D3328]/95 rounded-2xl min-h-[160px]">
          {MAP_ELEMENTS.map(el => (
            <AnimatePresence key={el.id}>
              {!completedElements.includes(el.id) && (
                <motion.div
                  layoutId={el.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
                  drag
                  dragConstraints={activityAreaRef}
                  dragSnapToOrigin
                  onDragEnd={(_, info) => handleDragEnd(info, el.id)}
                  whileDrag={{ scale: 1.1, zIndex: 50, boxShadow: "0px 10px 30px rgba(0,0,0,0.2)" }} // Sürükleme efekti
                  className="px-5 py-2.5 bg-card border border-border/20 rounded-xl shadow-sm cursor-grab active:cursor-grabbing active:scale-95 hover:bg-white/10" // Hover/active efektleri eklendi
                >
                  <span className="font-semibold text-foreground select-none">{el.name}</span>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
          {completedElements.length === MAP_ELEMENTS.length && (
              <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center p-4"
              >
                  <h3 className="text-xl font-bold text-emerald-600">Tebrikler!</h3>
                  <p className="text-foreground/80">Haritanın tüm elemanlarını başarıyla yerleştirdin.</p>
              </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MapReadingActivity;