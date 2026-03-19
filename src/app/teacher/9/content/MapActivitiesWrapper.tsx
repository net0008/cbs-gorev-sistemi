'use client';

import React, { useState } from 'react';
import MapReadingActivity from './MapReadingActivity';
import RouteSimulationActivity from './RouteSimulationActivity';
import { Map, PlaneTakeoff } from 'lucide-react';

export default function MapActivitiesWrapper() {
  const [activeTab, setActiveTab] = useState<'reading' | 'route'>('reading');

  // Ana sayfa artık bu bileşeni doğrudan render ettiği için, onClose çağrıldığında
  // tarayıcı geçmişinde bir önceki sayfaya (kataloğa/menüye) dönmesini sağlıyoruz.
  const handleClose = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Ortak Sekme Navigasyonu (Üst Merkezde, Her İki Etkinliğin Üzerinde Süzülür) */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] flex items-center p-1 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
        <button
          onClick={() => setActiveTab('reading')}
          className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${
            activeTab === 'reading' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Map size={16} />
          Harita Okuma
        </button>
        <button
          onClick={() => setActiveTab('route')}
          className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${
            activeTab === 'route' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <PlaneTakeoff size={16} />
          Rota Çizici
        </button>
      </div>

      {/* Aktif sekmeye göre ilgili etkinliği render ediyoruz */}
      {activeTab === 'reading' ? (
        <MapReadingActivity onClose={handleClose} />
      ) : (
        <RouteSimulationActivity onClose={handleClose} />
      )}
    </div>
  );
}