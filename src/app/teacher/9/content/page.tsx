'use client';

import React, { useState } from 'react';
import { Map, Navigation, Layers } from 'lucide-react';
import MapReadingActivity from './MapReadingActivity';
import RouteSimulationActivity from './RouteSimulationActivity';
import ProjectionActivity from './Projectionactivity';

type ActivityType = null | 'activity1' | 'activity2' | 'projections';

export default function ContentCatalogPage() {
  const [activeActivity, setActiveActivity] = useState<ActivityType>(null);

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] bg-slate-950/50 p-6 md:p-12 rounded-3xl text-slate-100 flex flex-col">
      {/* Başlık ve Açıklama Bölümü */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">9. Sınıf Etkinlik Kataloğu</h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Lütfen başlamak istediğiniz etkileşimli harita görevini seçiniz.
        </p>
      </div>

      {/* CSS Grid - Etkinlik Kartları Alanı */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">
        
        {/* 1. Kutu: Haritalar Nasıl Okunur? */}
        <div 
          onClick={() => setActiveActivity('activity1')}
          className="group cursor-pointer bg-slate-900 border-2 border-slate-800 hover:border-emerald-500 rounded-3xl p-8 transition-all duration-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-600 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 bg-emerald-950 border border-emerald-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <Map size={36} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-400 mb-4">1. Etkinlik: Haritalar Nasıl Okunur?</h2>
          <div className="text-sm text-slate-400 leading-relaxed font-medium text-left w-full bg-slate-950/50 p-4 rounded-xl space-y-2">
            <p><strong className="text-slate-300">Öğrenme Çıktıları:</strong> COĞ.9.2.1. Harita uygulamaları yapabilme</p>
            <p><strong className="text-slate-300">Süreç Bileşeni:</strong> a) Haritaya ait bileşenlerden yararlanarak haritaları okur.</p>
            <p><strong className="text-slate-300">Araç Seti:</strong> Harita</p>
          </div>
        </div>

        {/* 2. Kutu: Coğrafi Koordinatlar */}
        <div 
          onClick={() => setActiveActivity('activity2')}
          className="group cursor-pointer bg-slate-900 border-2 border-slate-800 hover:border-blue-500 rounded-3xl p-8 transition-all duration-300 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 bg-blue-950 border border-blue-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <Navigation size={36} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-blue-400 mb-4">2. Etkinlik: Coğrafi Koordinatlar</h2>
          <div className="text-sm text-slate-400 leading-relaxed font-medium text-left w-full bg-slate-950/50 p-4 rounded-xl space-y-2">
            <p><strong className="text-slate-300">Öğrenme Çıktıları:</strong> COĞ.9.2.1. Harita uygulamaları yapabilme</p>
            <p><strong className="text-slate-300">Süreç Bileşeni:</strong> a) Haritaya ait bileşenlerden yararlanarak haritaları okur.</p>
            <p><strong className="text-slate-300">Araç Seti:</strong> Harita</p>
          </div>
        </div>

        {/* 3. Kutu: Harita Projeksiyonları */}
        <div 
          onClick={() => setActiveActivity('projections')}
          className="group cursor-pointer bg-slate-900 border-2 border-slate-800 hover:border-purple-500 rounded-3xl p-8 transition-all duration-300 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-600 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 bg-purple-950 border border-purple-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <Layers size={36} className="text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-purple-400 mb-4">3. Etkinlik: Harita Projeksiyonları</h2>
          <div className="text-sm text-slate-400 leading-relaxed font-medium text-left w-full bg-slate-950/50 p-4 rounded-xl space-y-2">
            <p><strong className="text-slate-300">Öğrenme Çıktıları:</strong> COĞ.9.2.1</p>
            <p><strong className="text-slate-300">Süreç Bileşeni:</strong> Mekânsal Çıkarım ve İlişkilendirme</p>
            <p><strong className="text-slate-300">Zorluk:</strong> Orta</p>
          </div>
        </div>

      </div>

      {/* --- Aktif Modal / Tam Ekran Render Alanı --- */}
      {activeActivity === 'activity1' && (
        <MapReadingActivity onClose={() => setActiveActivity(null)} />
      )}
      {activeActivity === 'activity2' && (
        <RouteSimulationActivity onClose={() => setActiveActivity(null)} />
      )}
      {activeActivity === 'projections' && (
        <ProjectionActivity onClose={() => setActiveActivity(null)} />
      )}
    </div>
  );
}