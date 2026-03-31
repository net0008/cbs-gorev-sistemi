﻿'use client';

import React, { useState } from 'react';
import { Map, Navigation, Layers, Maximize, Database, Mountain, Compass, Clock, ChevronDown, BookOpen } from 'lucide-react';
import CografyaBilimiActivity from '../1_Unite/Cografyabilimiactivity';
import RouteSimulationActivity from '../2_Unite/RouteSimulationActivity';
import ProjectionActivity from '../2_Unite/Projectionactivity';
import ScaleActivity from '../2_Unite/Scaleactivity';
import MapTypesActivity from '../2_Unite/MapTypesActivity';
import TopoActivity from '../2_Unite/Topoactivity';
import LocationActivity from '../2_Unite/Locationactivity';
import MekanBilgiActivity from '../2_Unite/Mekanbilgiactivity';
import TimeZonesActivity from '../2_Unite/TimeZonesActivity';
import DistributionMethodsActivity from '../2_Unite/DistributionMethodsActivity';

type ActivityType = null | 'cografya-bilimi' | 'activity2' | 'projections' | 'scale' | 'mapTypes' | 'topoactivity' | 'location' | 'mekanBilgi' | 'time-zones' | 'map-literacy';

const units = [
  {
    id: 'unit1',
    title: '1. Ünite: COĞRAFYANIN DOĞASI',
    color: 'gray',
    activities: [
      {
        id: 'cografya-bilimi',
        title: '1. Etkinlik: Coğrafya Bilimi',
        icon: BookOpen,
        color: 'green',
        description: 'Coğrafya biliminin konusu, bölümleri ve tarihsel gelişimi.',
      },
    ],
  },
  {
    id: 'unit2',
    title: '2. Ünite: MEKÂNSAL BİLGİ TEKNOLOJİLERİ',
    color: 'teal',
    activities: [
      {
        id: 'map-literacy',
        title: '1. Etkinlik: Harita Okuryazarlığı',
        icon: Map,
        color: 'lime',
        description: 'Haritanın temel özelliklerini, elemanlarını ve coğrafi koordinat sistemini kavrar.',
      },
      {
        id: 'activity2',
        title: '2. Etkinlik: Coğrafi Koordinatlar',
        icon: Navigation,
        color: 'blue',
        description: 'COĞ.9.2.1. Harita uygulamaları yapabilme. Haritaya ait bileşenlerden yararlanarak haritaları okur.',
      },
      {
        id: 'time-zones',
        title: '3. Etkinlik: Yerel ve Ulusal Saat Hesaplamaları',
        icon: Clock,
        color: 'cyan',
        description: 'COĞ.9.2.2. Dünya’nın günlük hareketine bağlı olarak yerel saat farklarını analiz eder.',
      },
      {
        id: 'projections',
        title: '4. Etkinlik: Harita Projeksiyonları',
        icon: Layers,
        color: 'purple',
        description: 'Mekânsal Çıkarım ve İlişkilendirme. Orta zorluk.',
      },
      {
        id: 'scale',
        title: '5. Etkinlik: Harita Ölçeği ve Okuma',
        icon: Maximize,
        color: 'amber',
        description: 'Harita Bileşenlerini Analiz Etme. Kolay zorluk.',
      },
      {
        id: 'mapTypes',
        title: '6. Etkinlik: Harita Türleri',
        icon: Layers,
        color: 'violet',
        description: 'Harita Bileşenlerini Analiz Etme. Harita araç seti.',
      },
      {
        id: 'topoactivity',
        title: '7. Etkinlik: Haritada Yükselti ve Yer Şekilleri',
        icon: Mountain,
        color: 'orange',
        description: 'COĞ.9.2.1. Olay, olgu ve mekânlar arası ilişkileri çözümler.',
      },
      {
        id: 'location',
        title: '8. Etkinlik: Türkiye’nin Coğrafi Konumu',
        icon: Compass,
        color: 'indigo',
        description: 'COĞ.9.2.2. Türkiye’nin konum özelliklerini algılayabilme.',
      },
      {
        id: 'mekanBilgi',
        title: '9. Etkinlik: Mekânsal Bilgi Teknolojileri',
        icon: Database,
        color: 'pink',
        description: 'COĞ.9.2.1. Olay, olgu ve mekânlar arası ilişkileri çözümler.',
      },
    ],
  },
  { id: 'unit3', title: '3. Ünite: DOĞAL SİSTEMLER VE SÜREÇLER', color: 'gray', activities: [] },
  { id: 'unit4', title: '4. Ünite: BEŞERÎ SİSTEMLER VE SÜREÇLER', color: 'gray', activities: [] },
  { id: 'unit5', title: '5. Ünite: EKONOMİK FAALİYETLER VE ETKİLERİ', color: 'gray', activities: [] },
  { id: 'unit6', title: '6. Ünite: AFETLER VE SÜRDÜRÜLEBİLİR ÇEVRE', color: 'gray', activities: [] },
  { id: 'unit7', title: '7. Ünite: BÖLGELER, ÜLKELER VE KÜRESEL BAĞLANTILAR', color: 'gray', activities: [] },
];

const colorClasses: { [key: string]: { border: string, text: string, bg: string, iconBorder: string } } = {
  lime: { border: 'hover:border-lime-500', text: 'text-lime-400', bg: 'bg-lime-950', iconBorder: 'border-lime-800' },
  blue: { border: 'hover:border-blue-500', text: 'text-blue-400', bg: 'bg-blue-950', iconBorder: 'border-blue-800' },
  cyan: { border: 'hover:border-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-950', iconBorder: 'border-cyan-800' },
  green: { border: 'hover:border-green-500', text: 'text-green-400', bg: 'bg-green-950', iconBorder: 'border-green-800' },
  purple: { border: 'hover:border-purple-500', text: 'text-purple-400', bg: 'bg-purple-950', iconBorder: 'border-purple-800' },
  amber: { border: 'hover:border-amber-500', text: 'text-amber-400', bg: 'bg-amber-950', iconBorder: 'border-amber-800' },
  violet: { border: 'hover:border-violet-500', text: 'text-violet-400', bg: 'bg-violet-950', iconBorder: 'border-violet-800' },
  orange: { border: 'hover:border-orange-500', text: 'text-orange-400', bg: 'bg-orange-950', iconBorder: 'border-orange-800' },
  indigo: { border: 'hover:border-indigo-500', text: 'text-indigo-400', bg: 'bg-indigo-950', iconBorder: 'border-indigo-800' },
  pink: { border: 'hover:border-pink-500', text: 'text-pink-400', bg: 'bg-pink-950', iconBorder: 'border-pink-800' },
  gray: { border: 'border-gray-500', text: 'text-gray-400', bg: 'bg-gray-950', iconBorder: 'border-gray-800' },
  teal: { border: 'border-teal-500', text: 'text-teal-400', bg: 'bg-teal-950', iconBorder: 'border-teal-800' },
};

export default function ContentCatalogPage() {
  const [activeActivity, setActiveActivity] = useState<ActivityType>(null);
  const [expandedUnit, setExpandedUnit] = useState<string | null>('unit2');

  const handleUnitClick = (unitId: string) => {
    setExpandedUnit(prev => (prev === unitId ? null : unitId));
  };

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] bg-slate-950/50 p-6 md:p-12 rounded-3xl text-slate-100 flex flex-col">
      {/* Başlık ve Açıklama Bölümü */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">9. Sınıf Etkinlik Kataloğu</h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Lütfen başlamak istediğiniz üniteyi seçerek ilgili etkileşimli harita görevine ulaşınız.
        </p>
      </div>

      {/* Ünite Listesi */}
      <div className="max-w-6xl mx-auto w-full space-y-4">
        {units.map(unit => {
          const isExpanded = expandedUnit === unit.id;
          const unitColors = colorClasses[unit.color] || colorClasses.gray;
          return (
            <div key={unit.id} className={`bg-slate-900 border-2 ${isExpanded ? unitColors.border : 'border-slate-800'} rounded-3xl transition-all duration-500`}>
              <div
                onClick={() => handleUnitClick(unit.id)}
                className="cursor-pointer p-6 flex justify-between items-center"
              >
                <h2 className={`text-2xl font-bold ${isExpanded ? unitColors.text : 'text-white'}`}>{unit.title}</h2>
                <ChevronDown className={`w-8 h-8 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
              {isExpanded && (
                <div className="px-6 pb-6 animate-in fade-in-50 slide-in-from-top-5 duration-500">
                  {unit.activities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {unit.activities.map(activity => {
                        const activityColors = colorClasses[activity.color] || colorClasses.gray;
                        const Icon = activity.icon;
                        return (
                          <div
                            key={activity.id}
                            onClick={() => setActiveActivity(activity.id as ActivityType)}
                            className={`group cursor-pointer bg-slate-800/50 border border-slate-700 ${activityColors.border} rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col items-center text-center`}
                          >
                            <div className={`w-16 h-16 ${activityColors.bg} border ${activityColors.iconBorder} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                              <Icon size={28} className={activityColors.text} />
                            </div>
                            <h3 className={`text-lg font-semibold ${activityColors.text} mb-2`}>{activity.title}</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">{activity.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-center py-8">
                      Bu ünite için henüz etkinlik eklenmemiştir.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- Aktif Modal / Tam Ekran Render Alanı --- */}
      {activeActivity === 'cografya-bilimi' && (
        <CografyaBilimiActivity onClose={() => setActiveActivity(null)} />
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
        <TopoActivity onClose={() => setActiveActivity(null)} />
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
