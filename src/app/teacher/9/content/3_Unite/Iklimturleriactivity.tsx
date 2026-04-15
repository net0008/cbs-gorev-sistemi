"use client";

import React, { useEffect, useState, useRef } from "react";
import { ArrowLeft, Globe, Loader2, AlertTriangle, Play, Pause, Info } from "lucide-react";
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * 1. İKLİM GÖSTERGESİ (LEGEND)
 */
const climateLegend: Record<number, { code: string; name: string; color: string }> = {
  1: { code: 'Af', name: 'Tropikal, Yağmur Ormanı', color: 'rgb(0, 0, 255)' },
  2: { code: 'Am', name: 'Tropikal, Muson', color: 'rgb(0, 120, 255)' },
  3: { code: 'Aw', name: 'Tropikal, Savan', color: 'rgb(70, 170, 250)' },
  4: { code: 'BWh', name: 'Kurak, Çöl, Sıcak', color: 'rgb(255, 0, 0)' },
  5: { code: 'BWk', name: 'Kurak, Çöl, Soğuk', color: 'rgb(255, 150, 150)' },
  6: { code: 'BSh', name: 'Kurak, Bozkır, Sıcak', color: 'rgb(245, 165, 0)' },
  7: { code: 'BSk', name: 'Kurak, Bozkır, Soğuk', color: 'rgb(255, 220, 100)' },
  8: { code: 'Csa', name: 'Ilıman, Kurak Yaz, Sıcak Yaz (Akdeniz)', color: 'rgb(255, 255, 0)' },
  9: { code: 'Csb', name: 'Ilıman, Kurak Yaz, Ilık Yaz', color: 'rgb(200, 200, 0)' },
  10: { code: 'Csc', name: 'Ilıman, Kurak Yaz, Soğuk Yaz', color: 'rgb(150, 150, 0)' },
  11: { code: 'Cwa', name: 'Ilıman, Kurak Kış, Sıcak Yaz', color: 'rgb(150, 255, 150)' },
  12: { code: 'Cwb', name: 'Ilıman, Kurak Kış, Ilık Yaz', color: 'rgb(100, 200, 100)' },
  13: { code: 'Cwc', name: 'Ilıman, Kurak Kış, Soğuk Yaz', color: 'rgb(50, 150, 50)' },
  14: { code: 'Cfa', name: 'Ilıman, Kurak Mevsim Yok, Sıcak Yaz', color: 'rgb(200, 255, 80)' },
  15: { code: 'Cfb', name: 'Ilıman, Kurak Mevsim Yok, Ilık Yaz', color: 'rgb(100, 255, 80)' },
  16: { code: 'Cfc', name: 'Ilıman, Kurak Mevsim Yok, Soğuk Yaz', color: 'rgb(50, 200, 0)' },
  17: { code: 'Dsa', name: 'Soğuk, Kurak Yaz, Sıcak Yaz', color: 'rgb(255, 0, 255)' },
  18: { code: 'Dsb', name: 'Soğuk, Kurak Yaz, Ilık Yaz', color: 'rgb(200, 0, 200)' },
  19: { code: 'Dsc', name: 'Soğuk, Kurak Yaz, Soğuk Yaz', color: 'rgb(150, 50, 150)' },
  20: { code: 'Dsd', name: 'Soğuk, Kurak Yaz, Çok Soğuk Kış', color: 'rgb(150, 100, 150)' },
  21: { code: 'Dwa', name: 'Soğuk, Kurak Kış, Sıcak Yaz', color: 'rgb(170, 175, 255)' },
  22: { code: 'Dwb', name: 'Soğuk, Kurak Kış, Ilık Yaz', color: 'rgb(90, 120, 220)' },
  23: { code: 'Dwc', name: 'Soğuk, Kurak Kış, Soğuk Yaz', color: 'rgb(75, 80, 180)' },
  24: { code: 'Dwd', name: 'Soğuk, Kurak Kış, Çok Soğuk Kış', color: 'rgb(50, 0, 135)' },
  25: { code: 'Dfa', name: 'Soğuk, Kurak Mevsim Yok, Sıcak Yaz', color: 'rgb(0, 255, 255)' },
  26: { code: 'Dfb', name: 'Soğuk, Kurak Mevsim Yok, Ilık Yaz', color: 'rgb(55, 200, 255)' },
  27: { code: 'Dfc', name: 'Soğuk, Kurak Mevsim Yok, Soğuk Yaz', color: 'rgb(0, 125, 125)' },
  28: { code: 'Dfd', name: 'Soğuk, Kurak Mevsim Yok, Çok Soğuk Kış', color: 'rgb(0, 70, 95)' },
  29: { code: 'ET', name: 'Polar, Tundra', color: 'rgb(178, 178, 178)' },
  30: { code: 'EF', name: 'Polar, Buzul', color: 'rgb(102, 102, 102)' }
};

const AVAILABLE_YEARS = ['1930', '1960', '1990', '2020', '2070', '2099'];

function MultiLayerControl({ layers, activeYear }: { layers: Record<string, any>, activeYear: string }) {
  const map = useMap();

  // 1. Tüm katmanları haritaya BİR KERE ekle
  // (Katmanların üst üste binip silinmeme hatasını önler)
  useEffect(() => {
    if (!map || !layers) return;

    Object.values(layers).forEach(layer => {
      if (!map.hasLayer(layer)) {
        layer.setOpacity(0); // Başlangıçta görünmez yap
        layer.addTo(map);
      }
    });

    return () => {
      Object.values(layers).forEach(layer => {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      });
    };
  }, [map, layers]);

  // 2. Sadece aktif olan yılı görünür yap, diğerlerini saydam (görünmez) yap
  useEffect(() => {
    if (!layers) return;

    Object.entries(layers).forEach(([year, layer]) => {
      layer.setOpacity(year === activeYear ? 0.7 : 0);
    });
  }, [layers, activeYear]);

  return null;
}

interface Props {
  onClose: () => void;
}

export default function IklimTurleriActivity({ onClose }: Props) {
  const [allLayers, setAllLayers] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeYear, setActiveYear] = useState(AVAILABLE_YEARS[0]);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveYear(current => {
          const currentIndex = AVAILABLE_YEARS.indexOf(current);
          const nextIndex = (currentIndex + 1) % AVAILABLE_YEARS.length;
          return AVAILABLE_YEARS[nextIndex];
        });
      }, 1500); // 1.5 saniyede bir değiştir
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const initRasters = async () => {
      try {
        setLoading(true);
        setError(null);
        // Kütüphaneleri sadece tarayıcıda dinamik olarak yüklüyoruz (SSR Hatasını önler)
        const parseGeoraster = (await import('georaster')).default;
        const GeoRasterLayerModule = await import('georaster-layer-for-leaflet');
        const GeoRasterLayer = GeoRasterLayerModule.default || GeoRasterLayerModule;

        const responses = await Promise.all(
          AVAILABLE_YEARS.map(year => fetch(`/maps/climate/${year}Koppen_geiger.tif`))
        );

        const buffers = await Promise.all(responses.map(res => {
          if (!res.ok) throw new Error(`Failed to fetch ${res.url}: ${res.statusText}`);
          return res.arrayBuffer();
        }));

        const georasters = await Promise.all(buffers.map(buf => parseGeoraster(buf)));

        const layers = georasters.reduce((acc, georaster, index) => {
          const year = AVAILABLE_YEARS[index];
          acc[year] = new (GeoRasterLayer as any)({
            georaster,
            opacity: 0, // İlk başta saydam başlat, MultiLayerControl yönetecek
            pixelValuesToColorFn: (v: number[]) => climateLegend[v[0]]?.color || 'transparent',
            resolution: 256
          });
          return acc;
        }, {} as Record<string, any>);

        setAllLayers(layers);

      } catch (err) {
        console.error("Raster yükleme hatası:", err);
        setError(
          "Harita verileri yüklenirken bir hata oluştu. Lütfen dosya yollarını ve internet bağlantınızı kontrol edin."
        );
      } finally {
        setLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      initRasters();
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Üst Başlık Paneli */}
      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">3.1.3. İklim Türleri Analizi (1930 - 2099)</h1>
            <p className="text-xs text-slate-500">Veri: Beck et al. (2023) | 1km Çözünürlüklü Projeksiyon</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1 ${isPlaying ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            title={isPlaying ? "Animasyonu Durdur" : "Yılları Otomatik Oynat"}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <div className="w-px h-6 bg-white/10 mx-1"></div>
          {AVAILABLE_YEARS.map(year => (
            <button
              key={year}
              onClick={() => setActiveYear(year)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${activeYear === year
                ? 'bg-indigo-500 text-white'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Harita Alanı */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-slate-950/80 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <p className="text-slate-400 animate-pulse text-lg">Raster verileri haritaya işleniyor...</p>
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 z-[1000] bg-slate-950/80 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="text-red-500 bg-red-500/10 p-4 rounded-full">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-red-400">Harita Yüklenemedi</h3>
            <p className="text-slate-400">{error}</p>
            <p className="text-xs text-slate-500 mt-4">
              Geliştirici Notu: Tarayıcınızın geliştirici konsolunu (F12)
              kontrol ederek ağ (network) hatalarını veya diğer detaylı hata mesajlarını görebilirsiniz. Dosyaların `public/maps/climate/` klasöründe doğru isimlerle (`YYYYKoppen_geiger.tif`) bulunduğundan emin olun.
            </p>
          </div>
        )}

        {typeof window !== 'undefined' && (
          <MapContainer center={[39, 35]} zoom={5} className="h-full w-full">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            {allLayers && (
              <MultiLayerControl layers={allLayers} activeYear={activeYear} />
            )}
          </MapContainer>
        )}

        {/* İpucu Kutusu */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[2000] bg-slate-900/90 px-5 py-2.5 rounded-full border border-indigo-500/30 backdrop-blur-xl text-[13px] text-indigo-100 flex items-center gap-3 shadow-xl shadow-indigo-500/10 w-max max-w-[90%]">
          <Info size={16} className="text-indigo-400 flex-shrink-0" />
          <span>
            <strong>İpucu:</strong> İklim sınırları yavaş değişir. Net bir fark görmek için <strong>Oynat</strong> butonuna basarak izleyin veya <strong>1930</strong> ile <strong>2099</strong> yılları arasında geçiş yapın. (Örn: Kuzey Rusya / Kanada buzulları)
          </span>
        </div>

        {/* Gösterge (Floating Legend) */}
        <div className="absolute bottom-10 right-10 z-[2000] bg-slate-900/90 p-5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl max-w-[300px]">
          <h4 className="text-xs font-bold mb-4 text-indigo-400 border-b border-white/10 pb-2">İKLİM TİPLERİ</h4>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(climateLegend).map(([val, info]) => (
              <div key={val} className="flex items-center gap-3 text-[11px] group cursor-help">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: info.color }} />
                <span className="text-slate-300 font-mono w-6">{info.code}</span>
                <span className="text-slate-500 group-hover:text-slate-200 transition-colors truncate">{info.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}