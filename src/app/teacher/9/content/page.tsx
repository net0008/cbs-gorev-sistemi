'use client';

import React, { useState } from 'react';
import { Map, Navigation, Layers, Maximize, Database, Mountain, Compass, Clock } from 'lucide-react';
import MapReadingActivity from './MapReadingActivity';
import RouteSimulationActivity from './RouteSimulationActivity';
import ProjectionActivity from './Projectionactivity';
import ScaleActivity from './Scaleactivity';
import MapTypesActivity from './MapTypesActivity';
import Topoactivity from './Topoactivity';
import LocationActivity from './Locationactivity';
import MekanBilgiActivity from './Mekanbilgiactivity';
import TimeZonesActivity from './TimeZonesActivity';
import DistributionMethodsActivity from './DistributionMethodsActivity';

type ActivityType = null | 'activity1' | 'activity2' | 'projections' | 'scale' | 'mapTypes' | 'topoactivity' | 'location' | 'mekanBilgi' | 'time-zones' | 'map-literacy';

export default function ContentCatalogPage() {
  const [activeActivity, setActiveActivity] = useState<ActivityType>(null);

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] bg-slate-950/50 p-6 md:p-12 rounded-3xl text-slate-100 flex flex-col">
      {/* BaÅŸlÄ±k ve AÃ§Ä±klama BÃ¶lÃ¼mÃ¼ */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">9. SÄ±nÄ±f Etkinlik KataloÄŸu</h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          LÃ¼tfen baÅŸlamak istediÄŸiniz etkileÅŸimli harita gÃ¶revini seÃ§iniz.
        </p>
      </div>

      {/* CSS Grid - Etkinlik KartlarÄ± AlanÄ± */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">
        
        {/* 1. Kutu: Haritalar NasÄ±l Okunur? */}
        <div 
          onClick={() => setActiveActivity('activity1')}
          className="group cursor-pointer bg-slate-900 border-2 border-slate-800 hover:border-emerald-500 rounded-3xl p-8 transition-all duration-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-600 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 bg-emerald-950 border border-emerald-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <Map size={36} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-400 mb-4">1. Etkinlik: Haritalar NasÄ±l Okunur?</h2>
          <div className="text-sm text-slate-400 leading-relaxed font-medium text-left w-full bg-slate-950/50 p-4 rounded-xl space-y-2">
            <p><strong className="text-slate-300">Ã–ÄŸrenme Ã‡Ä±ktÄ±larÄ±:</strong> COÄ.9.2.1. Harita uygulamalarÄ± yapabilme</p>
            <p><strong className="text-slate-300">SÃ¼reÃ§ BileÅŸeni:</strong> a) Haritaya ait bileÅŸenlerden yararlanarak haritalarÄ± okur.</p>
            <p><strong className="text-slate-300">AraÃ§ Seti:</strong> Harita</p>
          </div>
        </div>

        {/* 2. Kutu: CoÄŸrafi Koordinatlar */}
        <div 
          onClick={() => setActiveActivity('activity2')}
          className="group cursor-pointer bg-slate-900 border-2 border-slate-800 hover:border-blue-500 rounded-3xl p-8 transition-all duration-300 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 bg-blue-950 border border-blue-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <Navigation size={36} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-blue-400 mb-4">2. Etkinlik: CoÄŸrafi Koordinatlar</h2>
          <div className="text-sm text-slate-400 leading-relaxed font-medium text-left w-full bg-slate-950/50 p-4 rounded-xl space-y-2">
            <p><strong className="text-slate-300">Ã–ÄŸrenme Ã‡Ä±ktÄ±larÄ±:</strong> COÄ.9.2.1. Harita uygulamalarÄ± yapabilme</p>
            <p><strong className="text-slate-300">SÃ¼reÃ§ BileÅŸeni:</strong> a) Haritaya ait bileÅŸenlerden yararlanarak haritalarÄ± okur.</p>
            <p><strong className="text-slate-300">AraÃ§ Seti:</strong> Harita</p>
          </div>
        </div>

        {/* 3. Kutu: Yerel ve Ulusal Saat HesaplamalarÄ± */}
        <div 
          onClick={() => setActiveActivity('time-zones')}
          className="group cursor-pointer bg-slate-900 border-2 border-slate-800 hover:border-cyan-500 rounded-3xl p-8 transition-all duration-300 hover:shadow-[0_0_40px_rgba(6,182,212,0.15)] hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-600 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 bg-cyan-950 border border-cyan-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <Clock size={36} className="text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">3. Etkinlik: Yerel ve Ulusal Saat HesaplamalarÄ±</h2>
          <div className="text-sm text-slate-400 leading-relaxed font-medium text-left w-full bg-slate-950/50 p-4 rounded-xl space-y-2">
            <p><strong className="text-slate-300">Ã–ÄŸrenme Ã‡Ä±ktÄ±larÄ±:</strong> COÄ.9.2.2. DÃ¼nyaâ€™nÄ±n gÃ¼nlÃ¼k hareketine baÄŸlÄ± olarak yerel saat farklarÄ±nÄ± analiz eder.</p>
            <p><strong className="text-slate-300">AraÃ§ Seti:</strong> DÃ¼nya Saati</p>
            <p><strong className="text-slate-300">AÃ§Ä±klama:</strong> Meridyenler arasÄ± zaman farkÄ±nÄ± ve uluslararasÄ± saat dilimlerini interaktif olarak hesaplayÄ±n.</p>
          </div>
        </div>

        {/* 3. Kutu: Harita ProjeksiyonlarÄ± */}
        <div 
          onClick={() => setActiveActivity('projections')}
          className="group cursor-pointer bg-slate-900 border-2 border-slate-800 hover:border-purple-500 rounded-3xl p-8 transition-all duration-300 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-600 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 bg-purple-950 border border-purple-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <Layers size={36} className="text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-purple-400 mb-4">4. Etkinlik: Harita ProjeksiyonlarÄ±</h2>
          <div className="text-sm text-slate-400 leading-relaxed font-medium text-left w-full bg-slate-950/50 p-4 rounded-xl space-y-2">
            <p><strong className="text-slate-300">Ã–ÄŸrenme Ã‡Ä±ktÄ±larÄ±:</strong> COÄ.9.2.1</p>
            <p><strong className="text-slate-300">SÃ¼reÃ§ BileÅŸeni:</strong> MekÃ¢nsal Ã‡Ä±karÄ±m ve Ä°liÅŸkilendirme</p>
            <p><strong className="text-slate-300">Zorluk:</strong> Orta</p>
          </div>
        </div>

        {/* 4. Kutu: Harita Ã–lÃ§eÄŸi */}
        <div 
          onClick={() => setActiveActivity('scale')}
          className="group cursor-pointer bg-slate-900 border-2 border-slate-800 hover:border-amber-500 rounded-3xl p-8 transition-all duration-300 hover:shadow-[0_0_40px_rgba(245,158,11,0.15)] hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 bg-amber-950 border border-amber-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <Maximize size={36} className="text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-amber-400 mb-4">5. Etkinlik: Harita Ã–lÃ§eÄŸi ve Okuma</h2>
          <div className="text-sm text-slate-400 leading-relaxed font-medium text-left w-full bg-slate-950/50 p-4 rounded-xl space-y-2">
            <p><strong className="text-slate-300">Ã–ÄŸrenme Ã‡Ä±ktÄ±larÄ±:</strong> COÄ.9.2.1.a</p>
            <p><strong className="text-slate-300">SÃ¼reÃ§ BileÅŸeni:</strong> Harita BileÅŸenlerini Analiz Etme</p>
            <p><strong className="text-slate-300">Zorluk:</strong> Kolay</p>
          </div>
        </div>

        {/* 6. Kutu: Harita TÃ¼rleri */}
        <div 
          onClick={() => setActiveActivity('mapTypes')}
          className="group cursor-pointer bg-slate-900 border-2 border-slate-800 hover:border-violet-500 rounded-3xl p-8 transition-all duration-300 hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 bg-violet-950 border border-violet-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <Layers size={36} className="text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-violet-400 mb-4">6. Etkinlik: Harita TÃ¼rleri</h2>
          <div className="text-sm text-slate-400 leading-relaxed font-medium text-left w-full bg-slate-950/50 p-4 rounded-xl space-y-2">
            <p><strong className="text-slate-300">Ã–ÄŸrenme Ã‡Ä±ktÄ±larÄ±:</strong> COÄ.9.2.1.a</p>
            <p><strong className="text-slate-300">SÃ¼reÃ§ BileÅŸeni:</strong> Harita BileÅŸenlerini Analiz Etme</p>
            <p><strong className="text-slate-300">AraÃ§ Seti:</strong> Harita</p>
          </div>
        </div>

        {/* 7. Kutu: Haritada YÃ¼kselti ve Yer Åekilleri */}
        <div 
          onClick={() => setActiveActivity('topoactivity')}
          className="group cursor-pointer bg-slate-900 border-2 border-slate-800 hover:border-orange-500 rounded-3xl p-8 transition-all duration-300 hover:shadow-[0_0_40px_rgba(249,115,22,0.15)] hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-600 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 bg-orange-950 border border-orange-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <Mountain size={36} className="text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-orange-400 mb-4">7. Etkinlik: Haritada YÃ¼kselti ve Yer Åekilleri</h2>
          <div className="text-sm text-slate-400 leading-relaxed font-medium text-left w-full bg-slate-950/50 p-4 rounded-xl space-y-2">
            <p><strong className="text-slate-300">Ã–ÄŸrenme Ã‡Ä±ktÄ±larÄ±:</strong> COÄ.9.2.1. Harita uygulamalarÄ± yapabilme</p>
            <p><strong className="text-slate-300">SÃ¼reÃ§ BileÅŸeni:</strong> a) Haritaya ait bileÅŸenlerden yararlanarak haritalarÄ± okur.</p>
            <p><strong className="text-slate-300">SÃ¼reÃ§ BileÅŸeni:</strong> b) Haritaya ait bileÅŸenlerden yararlanarak haritadaki olay, olgu ve mekÃ¢nlar arasÄ± iliÅŸkileri Ã§Ã¶zÃ¼mler.</p>
            <p><strong className="text-slate-300">AraÃ§ Seti:</strong> Harita</p>
          </div>
        </div>

        {/* 8. Kutu: TÃ¼rkiye'nin CoÄŸrafi Konumu */}
        <div 
          onClick={() => setActiveActivity('location')}
          className="group cursor-pointer bg-slate-900 border-2 border-slate-800 hover:border-indigo-500 rounded-3xl p-8 transition-all duration-300 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)] hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 bg-indigo-950 border border-indigo-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <Compass size={36} className="text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-indigo-400 mb-4">8. Etkinlik: TÃ¼rkiyeâ€™nin CoÄŸrafi Konumu</h2>
          <div className="text-sm text-slate-400 leading-relaxed font-medium text-left w-full bg-slate-950/50 p-4 rounded-xl space-y-2">
            <p><strong className="text-slate-300">Ã–ÄŸrenme Ã‡Ä±ktÄ±larÄ±:</strong> COÄ.9.2.2. TÃ¼rkiyeâ€™nin konum Ã¶zelliklerini algÄ±layabilme</p>
            <p><strong className="text-slate-300">SÃ¼reÃ§ BileÅŸeni:</strong> a) TÃ¼rkiyeâ€™nin konum Ã¶zelliklerini belirler.</p>
            <p><strong className="text-slate-300">SÃ¼reÃ§ BileÅŸeni:</strong> b) TÃ¼rkiyeâ€™nin konum Ã¶zelliklerini gÃ¶rselleÅŸtirir.</p>
            <p><strong className="text-slate-300">SÃ¼reÃ§ BileÅŸeni:</strong> c) TÃ¼rkiyeâ€™nin konum Ã¶zelliklerini Ã¶zetler.</p>
            <p><strong className="text-slate-300">AraÃ§ Seti:</strong> Harita</p>
          </div>
        </div>

        {/* 9. Kutu: MekÃ¢nsal Bilgi Teknolojileri */}
        <div 
          onClick={() => setActiveActivity('mekanBilgi')}
          className="group cursor-pointer bg-slate-900 border-2 border-slate-800 hover:border-pink-500 rounded-3xl p-8 transition-all duration-300 hover:shadow-[0_0_40px_rgba(236,72,153,0.15)] hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-600 to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 bg-pink-950 border border-pink-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <Database size={36} className="text-pink-400" />
          </div>
          <h2 className="text-2xl font-bold text-pink-400 mb-4">9. Etkinlik: MekÃ¢nsal Bilgi Teknolojileri</h2>
          <div className="text-sm text-slate-400 leading-relaxed font-medium text-left w-full bg-slate-950/50 p-4 rounded-xl space-y-2">
            <p><strong className="text-slate-300">Ã–ÄŸrenme Ã‡Ä±ktÄ±larÄ±:</strong> COÄ.9.2.1. Harita uygulamalarÄ± yapabilme</p>
            <p><strong className="text-slate-300">SÃ¼reÃ§ BileÅŸeni:</strong> b) Haritaya ait bileÅŸenlerden yararlanarak haritadaki olay, olgu ve mekÃ¢nlar arasÄ± iliÅŸkileri Ã§Ã¶zÃ¼mler.</p>
            <p><strong className="text-slate-300">AraÃ§ Seti:</strong> Harita</p>
          </div>
        </div>

        {/* 10. Kutu: Harita Okuryazarligi */}
        <div 
          onClick={() => setActiveActivity('map-literacy')}
          className="group cursor-pointer bg-slate-900 border-2 border-slate-800 hover:border-lime-500 rounded-3xl p-8 transition-all duration-300 hover:shadow-[0_0_40px_rgba(132,204,22,0.15)] hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-lime-600 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 bg-lime-950 border border-lime-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <Map size={36} className="text-lime-400" />
          </div>
          <h2 className="text-2xl font-bold text-lime-400 mb-4">10. Etkinlik: Harita Okuryazarligi</h2>
          <div className="text-sm text-slate-400 leading-relaxed font-medium text-left w-full bg-slate-950/50 p-4 rounded-xl space-y-2">
            <p><strong className="text-slate-300">Ogrenme Ciktisi:</strong> Haritanin temel ozelliklerini, elemanlarini ve cografi koordinat sistemini kavrar.</p>
            <p><strong className="text-slate-300">Icerik Akisi:</strong> Konu anlatimi + etkilesimli etkinlik + olcme ve degerlendirme testi</p>
            <p><strong className="text-slate-300">Odak:</strong> Harita tanimi, harita elemanlari, harita turleri ve koordinatlar</p>
          </div>
        </div>
      </div>

      {/* --- Aktif Modal / Tam Ekran Render AlanÄ± --- */}
      {activeActivity === 'activity1' && (
        <MapReadingActivity onClose={() => setActiveActivity(null)} />
      )}
      {activeActivity === 'activity2' && (
        <RouteSimulationActivity onClose={() => setActiveActivity(null)} />
      )}
      {activeActivity === 'projections' && (
        <ProjectionActivity onClose={() => setActiveActivity(null)} />
      )}
      {activeActivity === 'scale' && (
        <ScaleActivity onClose={() => setActiveActivity(null)} />
      )}
      {activeActivity === 'mapTypes' && (
        <MapTypesActivity onClose={() => setActiveActivity(null)} />
      )}
      {activeActivity === 'topoactivity' && (
        <Topoactivity onClose={() => setActiveActivity(null)} />
      )}
      {activeActivity === 'location' && (
        <LocationActivity onClose={() => setActiveActivity(null)} />
      )}
      {activeActivity === 'mekanBilgi' && (
        <MekanBilgiActivity onClose={() => setActiveActivity(null)} />
      )}
      {activeActivity === 'time-zones' && (
        <TimeZonesActivity onClose={() => setActiveActivity(null)} />
      )}
      {activeActivity === 'map-literacy' && (
        <DistributionMethodsActivity onClose={() => setActiveActivity(null)} />
      )}
    </div>
  );
}
