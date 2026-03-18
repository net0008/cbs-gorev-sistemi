'use client';
import React from 'react';
import { Map, Toolbox, Target, ArrowRight, Info } from 'lucide-react';

// 2. Teknik Hata Giderimi: TypeScript çakışmalarını önlemek için veri tipini (interface) Activity yerine ActivityItem olarak tanımla.
interface ActivityItem {
  id: number;
  title: string;
  skill: string;
  tools: string[]; // 2. Teknik Hata Giderimi: `tools` alanı tanımlı.
}

// 4. Uygulama: 'Bergama Ovası Yerleşme Analizi' örneği
const activities: ActivityItem[] = [
  {
    id: 1,
    title: "Bergama Ovası Yerleşme Analizi",
    skill: "KB2.12 - Mekânsal Çıkarım ve Tahmin Etme",
    tools: ["Poligon Aracı", "Nokta İşaretleme", "Tematik Katmanlar"],
  },
  // Buraya yeni etkinlikler eklenebilir
];

export default function Grade9Content() {
  return (
    // Ana konteyner, tema renklerini kullanıyor
    <div className="min-h-screen bg-background p-8">
      {/* Sayfa Başlığı */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          {/* 3. Tasarım Notları: Topo-Yeşil Vurgusu (müfredat rengi) */}
          <div className="p-2 bg-[var(--color-topo-landuse)] rounded-lg text-white">
            <Map size={28} />
          </div>
          9. Sınıf Hazır Etkinlikler
        </h1>
        <p className="text-foreground/70 mt-2 ml-12">
          Müfredata uygun, CBS tabanlı hazır uygulama içerikleri.
        </p>
      </div>

      {/* Etkinlik Kartları Grid Yapısı */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activities.map((activity) => (
          <div 
            key={activity.id}
            // 3. Tasarım Notları: Glassmorphism, Yumuşak Geçişler ve Etkileşim
            className="group relative bg-card/40 backdrop-blur-md rounded-3xl border border-border/10 
                       border-l-8 border-l-[var(--color-topo-landuse)] p-6 shadow-sm shadow-foreground/5
                       hover:-translate-y-2 hover:shadow-lg hover:shadow-[var(--color-accent-primary)]/15
                       transition-all duration-300 ease-out"
          >
            {/* 1. Kart Yapısı: Etkinlik Adı */}
            <h2 className="text-xl font-bold text-foreground mb-4 group-hover:text-[var(--color-topo-landuse)] transition-colors">
              {activity.title}
            </h2>

            {/* Bilgi Alanları */}
            <div className="space-y-4 mb-8">
              {/* 1. Kart Yapısı: Hedef Beceri */}
              <div className="flex items-start gap-3">
                {/* 3. Tasarım Notları: Simge Dili */}
                <Target size={18} className="text-[var(--color-topo-landuse)] mt-1 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-[var(--color-topo-landuse)]/80 uppercase tracking-wider">Hedef Beceri</span>
                  <p className="text-sm text-foreground/80 leading-relaxed">{activity.skill}</p>
                </div>
              </div>

              {/* 1. Kart Yapısı: Araç Seti */}
              <div className="flex items-start gap-3">
                {/* 3. Tasarım Notları: Simge Dili */}
                <Toolbox size={18} className="text-[var(--color-accent-primary)] mt-1 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-[var(--color-accent-primary)]/80 uppercase tracking-wider">Araç Seti</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {activity.tools.map((tool, index) => (
                      <span key={index} className="text-[11px] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] px-2 py-0.5 rounded-full border border-[var(--color-accent-primary)]/20">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex items-center gap-3 mt-auto">
              <button className="flex-1 bg-[var(--color-topo-landuse)] hover:bg-opacity-90 hover:bg-[var(--color-topo-landuse)] text-white py-2.5 rounded-2xl 
                               text-sm font-medium flex items-center justify-center gap-2 transition-colors active:scale-95">
                Etkinliği Başlat <ArrowRight size={16} />
              </button>
              <button className="p-2.5 border border-border/20 rounded-2xl text-foreground/60 
                               hover:bg-card/60 hover:text-foreground transition-all" title="Detayları Gör">
                <Info size={20} />
              </button>
            </div>
          </div>
        ))}

        {/* Yeni Etkinlik Ekleme Taslağı */}
        <div className="border-2 border-dashed border-border/20 rounded-3xl flex flex-col items-center justify-center p-6 text-foreground/40 hover:border-[var(--color-topo-landuse)]/30 hover:text-[var(--color-topo-landuse)] transition-all cursor-pointer">
           <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center mb-2">
              <span className="text-2xl font-light">+</span>
           </div>
           <span className="text-sm font-medium">Yeni İçerik Ekle</span>
        </div>
      </div>
    </div>
  );
}