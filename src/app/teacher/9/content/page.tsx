'use client';

import { useState } from 'react';
import MapReadingActivity from './MapReadingActivity';

const activities = [
  {
    id: 'map-reading',
    name: 'Harita Okuryazarlığı: Haritanın Elemanları',
    learningOutcome: 'COĞ.9.2.1. Harita uygulamaları yapabilme. a) Haritaya ait bileşenlerden yararlanarak haritaları okur.',
    toolset: 'Harita',
    component: (onClose: () => void) => <MapReadingActivity onClose={onClose} />,
  },
  // Gelecekteki etkinlikler buraya eklenebilir.
];

export default function ContentCatalogPage() {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  const activity = activities.find(act => act.id === selectedActivity);

  // Eğer bir etkinlik seçilmişse, o etkinliği ve "Geri Dön" butonunu göster
  if (activity) {
    return (
      <div className="w-full animate-fade-in">        
        {activity.component(() => setSelectedActivity(null))}
      </div>
    );
  }

  // Varsayılan olarak etkinlik kataloğunu göster
  return (
    <div className="w-full animate-fade-in">
      <h1 className="text-3xl font-bold mb-6 text-foreground">9. Sınıf Etkinlik Kataloğu</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activities.map((act) => (
          <div
            key={act.id}
            onClick={() => setSelectedActivity(act.id)}
            className="cursor-pointer group bg-emerald-950/20 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-emerald-500/20 transition-all duration-300 transform hover:-translate-y-1.5"
          >
            <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-4">{act.name}</h2>
            <div className="space-y-4 text-sm text-foreground/80">
              <p>
                <strong className="font-semibold text-foreground/90 block mb-1">Öğrenme Çıktıları ve Süreç Bileşenleri:</strong> {act.learningOutcome}
              </p>
              <p>
                <strong className="font-semibold text-foreground/90">Araç Seti:</strong> {act.toolset}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}