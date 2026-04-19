"use client";

import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 1. TÜRKÇE İKLİM LEJANDI (Beck et al. 2023)
const climateLegend: Record<number, { code: string; name: string; color: string }> = {
  1: { code: 'Af', name: 'Tropikal, yağmur ormanı', color: 'rgb(0, 0, 255)' },
  2: { code: 'Am', name: 'Tropikal, muson', color: 'rgb(0, 120, 255)' },
  3: { code: 'Aw', name: 'Tropikal, savan', color: 'rgb(70, 170, 250)' },
  4: { code: 'BWh', name: 'Kurak, çöl, sıcak', color: 'rgb(255, 0, 0)' },
  5: { code: 'BWk', name: 'Kurak, çöl, soğuk', color: 'rgb(255, 150, 150)' },
  6: { code: 'BSh', name: 'Kurak, step, sıcak', color: 'rgb(245, 165, 0)' },
  7: { code: 'BSk', name: 'Kurak, step, soğuk', color: 'rgb(255, 220, 100)' },
  8: { code: 'Csa', name: 'Ilıman, yazı kurak ve sıcak (Akdeniz)', color: 'rgb(255, 255, 0)' },
  9: { code: 'Csb', name: 'Ilıman, yazı kurak ve ılık', color: 'rgb(200, 200, 0)' },
  10: { code: 'Csc', name: 'Ilıman, yazı kurak ve soğuk', color: 'rgb(150, 150, 0)' },
  11: { code: 'Cwa', name: 'Ilıman, kışı kurak, yazı sıcak', color: 'rgb(150, 255, 150)' },
  12: { code: 'Cwb', name: 'Ilıman, kışı kurak, yazı ılık', color: 'rgb(100, 200, 100)' },
  13: { code: 'Cwc', name: 'Ilıman, kışı kurak, yazı soğuk', color: 'rgb(50, 150, 50)' },
  14: { code: 'Cfa', name: 'Ilıman, her mevsim yağışlı, yazı sıcak', color: 'rgb(200, 255, 80)' },
  15: { code: 'Cfb', name: 'Ilıman, her mevsim yağışlı, yazı ılık', color: 'rgb(100, 255, 80)' },
  16: { code: 'Cfc', name: 'Ilıman, her mevsim yağışlı, yazı soğuk', color: 'rgb(50, 200, 0)' },
  17: { code: 'Dsa', name: 'Soğuk, yazı kurak ve sıcak', color: 'rgb(255, 0, 255)' },
  18: { code: 'Dsb', name: 'Soğuk, yazı kurak ve ılık', color: 'rgb(200, 0, 200)' },
  19: { code: 'Dsc', name: 'Soğuk, yazı kurak ve soğuk', color: 'rgb(150, 50, 150)' },
  20: { code: 'Dsd', name: 'Soğuk, yazı kurak, çok soğuk kış', color: 'rgb(150, 100, 150)' },
  21: { code: 'Dwa', name: 'Soğuk, kışı kurak, yazı sıcak', color: 'rgb(170, 175, 255)' },
  22: { code: 'Dwb', name: 'Soğuk, kışı kurak, yazı ılık', color: 'rgb(90, 120, 220)' },
  23: { code: 'Dwc', name: 'Soğuk, kışı kurak, yazı soğuk', color: 'rgb(75, 80, 180)' },
  24: { code: 'Dwd', name: 'Soğuk, kışı kurak, çok soğuk kış', color: 'rgb(50, 0, 135)' },
  25: { code: 'Dfa', name: 'Soğuk, her mevsim yağışlı, yazı sıcak', color: 'rgb(0, 255, 255)' },
  26: { code: 'Dfb', name: 'Soğuk, her mevsim yağışlı, yazı ılık', color: 'rgb(55, 200, 255)' },
  27: { code: 'Dfc', name: 'Soğuk, her mevsim yağışlı, yazı soğuk', color: 'rgb(0, 125, 125)' },
  28: { code: 'Dfd', name: 'Soğuk, her mevsim yağışlı, çok soğuk kış', color: 'rgb(0, 70, 95)' },
  29: { code: 'ET', name: 'Polar, tundra', color: 'rgb(178, 178, 178)' },
  30: { code: 'EF', name: 'Polar, buzul', color: 'rgb(102, 102, 102)' }
};

const years = [1930, 1960, 1990, 2020, 2070, 2099];

// Harita katmanını yöneten yardımcı bileşen
function GeoRasterTile({ georaster }: { georaster: any }) {
  const map = useMap();
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (!georaster || !map) return;

    const loadLayer = async () => {
      const GeoRasterLayer = (await import('georaster-layer-for-leaflet')).default;
      
      if (layerRef.current) map.removeLayer(layerRef.current);

      layerRef.current = new (GeoRasterLayer as any)({
        georaster: georaster,
        opacity: 0.8,
        pixelValuesToColorFn: (v: number[]) => climateLegend[v[0]]?.color || 'transparent',
        resolution: 256
      });

      layerRef.current.addTo(map);
    };

    loadLayer();

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [georaster, map]);

  return null;
}

export default function IklimTurleriActivity({ onClose }: { onClose: () => void }) {
  const [activeYear, setActiveYear] = useState(1930);
  const [currentRaster, setCurrentRaster] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchAndSetRaster = async (year: number) => {
    setLoading(true);
    try {
      const parseGeoraster = (await import('georaster')).default;
      const response = await fetch(`/maps/climate/${year}Koppen_geiger.tif`);
      const arrayBuffer = await response.arrayBuffer();
      const georaster = await parseGeoraster(arrayBuffer);
      setCurrentRaster(georaster);
      setActiveYear(year);
    } catch (err) {
      console.error("Yükleme hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetchAndSetRaster(1930);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col bg-slate-950 text-slate-100 animate-in fade-in duration-300">
      {/* Üst Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-white/10 bg-slate-900/90 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-all">
            <ArrowLeft className="text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold">3.1.3. İklim Türleri Değişimi</h1>
            <p className="text-[10px] text-indigo-400 font-medium">Veri Kaynağı: Beck et al. (2023)</p>
          </div>
        </div>

        {/* Yıl Butonları */}
        <div className="flex flex-wrap justify-center gap-2">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => fetchAndSetRaster(year)}
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeYear === year 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Calendar size={14} />
              {year}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 relative bg-slate-900 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-[11000] bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-sm font-mono tracking-widest text-indigo-300 uppercase italic">Veriler İşleniyor {activeYear}...</p>
          </div>
        )}

        {typeof window !== 'undefined' && (
          <MapContainer center={[39, 35]} zoom={5} className="h-full w-full outline-none">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            {currentRaster && <GeoRasterTile georaster={currentRaster} />}
          </MapContainer>
        )}

        {/* Türkçe Legend (Lejand) - Sağ Altta */}
        <div className="absolute bottom-6 right-6 z-[2000] w-64 md:w-80 bg-slate-900/95 border border-white/10 rounded-2xl flex flex-col shadow-2xl max-h-[70%] backdrop-blur-md">
          <div className="p-3 border-b border-white/5 font-bold text-[10px] text-indigo-400 uppercase tracking-widest bg-indigo-500/5 rounded-t-2xl">
            Köppen-Geiger İklim Sınıflandırması
          </div>
          <div className="p-3 overflow-y-auto custom-scrollbar space-y-2">
            {Object.entries(climateLegend).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 group">
                <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: v.color }} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-slate-200">{v.code}</span>
                  <span className="text-[9px] text-slate-500 group-hover:text-slate-300 transition-colors leading-tight">
                    {v.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}