'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import MapReadingActivity from './MapReadingActivity';

const activities = [
  {
    id: 'map-reading',
    name: 'Harita Okuryazarlığı: Haritanın Elemanları',
    kazanim: 'COĞ.9.2.1. Harita uygulamaları yapabilme.',
    surec: 'a) Haritaya ait bileşenlerden yararlanarak haritaları okur.',
    toolset: 'Harita',
    component: (onClose: () => void) => <MapReadingActivity onClose={onClose} />,
  },
  // Gelecekteki etkinlikler buraya eklenebilir.
];

export default function ContentCatalogPage() {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  const activity = activities.find(act => act.id === selectedActivity);

  return (
    // 1. Global Layout: Sayfanın kaydırma çubuğu layout.tsx'e taşındığı için burası tam ekranı doldurur.
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-6 text-foreground">9. Sınıf Etkinlik Kataloğu</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activities.map((act) => (
          // 3. Katalog Kart Tasarımı: Pardus'tan ilhamla sol dikey renk şeridi, yeni başlık rengi ve artırılmış okunabilirlik.
          <div
            key={act.id}
            onClick={() => setSelectedActivity(act.id)}
            className="cursor-pointer group bg-card/60 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-border/20 border-l-8 border-emerald-600 hover:border-emerald-500 hover:shadow-emerald-500/10 transition-all duration-300 transform hover:-translate-y-1"
          >
            <h2 className="text-xl font-extrabold text-emerald-900 dark:text-emerald-400 mb-4">{act.name}</h2>
            <div className="space-y-4 text-sm leading-relaxed text-foreground/70">
              <div>
                <strong className="font-semibold text-foreground/90 block mb-1">Kazanım:</strong>
                <ul className="list-disc list-inside space-y-1">
                  <li>{act.kazanim}</li>
                </ul>
              </div>
              <div>
                <strong className="font-semibold text-foreground/90 block mb-1">Süreç:</strong>
                <ul className="list-disc list-inside space-y-1">
                  <li>{act.surec}</li>
                </ul>
              </div>
              <p>
                <strong className="font-semibold text-foreground/90">Araç:</strong> {act.toolset}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Etkinlik Sayfası: Etkinlik, AnimatePresence ile yumuşak bir geçişle tam ekran bir katman olarak açılır. */}
      <AnimatePresence>
        {activity && activity.component(() => setSelectedActivity(null))}
      </AnimatePresence>
    </div>
  );
}