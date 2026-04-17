"use client";

import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Globe, Loader2, Info, BookOpen } from 'lucide-react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * 1. TAM İKLİM SÖZLÜĞÜ (Beck et al. 2023)
 * Tüm 30 sınıf ve RGB renkleri eklendi.
 */
const climateLegend: Record<number, { code: string; name: string; color: string }> = {
  1: { code: 'Af', name: 'Tropical, rainforest', color: 'rgb(0, 0, 255)' },
  2: { code: 'Am', name: 'Tropical, monsoon', color: 'rgb(0, 120, 255)' },
  3: { code: 'Aw', name: 'Tropical, savannah', color: 'rgb(70, 170, 250)' },
  4: { code: 'BWh', name: 'Arid, desert, hot', color: 'rgb(255, 0, 0)' },
  5: { code: 'BWk', name: 'Arid, desert, cold', color: 'rgb(255, 150, 150)' },
  6: { code: 'BSh', name: 'Arid, steppe, hot', color: 'rgb(245, 165, 0)' },
  7: { code: 'BSk', name: 'Arid, steppe, cold', color: 'rgb(255, 220, 100)' },
  8: { code: 'Csa', name: 'Temperate, dry summer, hot summer', color: 'rgb(255, 255, 0)' },
  9: { code: 'Csb', name: 'Temperate, dry summer, warm summer', color: 'rgb(200, 200, 0)' },
  10: { code: 'Csc', name: 'Temperate, dry summer, cold summer', color: 'rgb(150, 150, 0)' },
  11: { code: 'Cwa', name: 'Temperate, dry winter, hot summer', color: 'rgb(150, 255, 150)' },
  12: { code: 'Cwb', name: 'Temperate, dry winter, warm summer', color: 'rgb(100, 200, 100)' },
  13: { code: 'Cwc', name: 'Temperate, dry winter, cold summer', color: 'rgb(50, 150, 50)' },
  14: { code: 'Cfa', name: 'Temperate, no dry season, hot summer', color: 'rgb(200, 255, 80)' },
  15: { code: 'Cfb', name: 'Temperate, no dry season, warm summer', color: 'rgb(100, 255, 80)' },
  16: { code: 'Cfc', name: 'Temperate, no dry season, cold summer', color: 'rgb(50, 200, 0)' },
  17: { code: 'Dsa', name: 'Cold, dry summer, hot summer', color: 'rgb(255, 0, 255)' },
  18: { code: 'Dsb', name: 'Cold, dry summer, warm summer', color: 'rgb(200, 0, 200)' },
  19: { code: 'Dsc', name: 'Cold, dry summer, cold summer', color: 'rgb(150, 50, 150)' },
  20: { code: 'Dsd', name: 'Cold, dry summer, very cold winter', color: 'rgb(150, 100, 150)' },
  21: { code: 'Dwa', name: 'Cold, dry winter, hot summer', color: 'rgb(170, 175, 255)' },
  22: { code: 'Dwb', name: 'Cold, dry winter, warm summer', color: 'rgb(90, 120, 220)' },
  23: { code: 'Dwc', name: 'Cold, dry winter, cold summer', color: 'rgb(75, 80, 180)' },
  24: { code: 'Dwd', name: 'Cold, dry winter, very cold winter', color: 'rgb(50, 0, 135)' },
  25: { code: 'Dfa', name: 'Cold, no dry season, hot summer', color: 'rgb(0, 255, 255)' },
  26: { code: 'Dfb', name: 'Cold, no dry season, warm summer', color: 'rgb(55, 200, 255)' },
  27: { code: 'Dfc', name: 'Cold, no dry season, cold summer', color: 'rgb(0, 125, 125)' },
  28: { code: 'Dfd', name: 'Cold, no dry season, very cold winter', color: 'rgb(0, 70, 95)' },
  29: { code: 'ET', name: 'Polar, tundra', color: 'rgb(178, 178, 178)' },
  30: { code: 'EF', name: 'Polar, frost', color: 'rgb(102, 102, 102)' }
};

/**
 * HARİTA KARŞILAŞTIRMA SLIDER BİLEŞENİ
 */
function ComparisonControl({ layerLeft, layerRight }: { layerLeft: any, layerRight: any }) {
  const map = useMap();
  const controlRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !layerLeft || !layerRight) return;

    layerLeft.addTo(map);
    layerRight.addTo(map);

    import('leaflet-side-by-side').then(() => {
      if (!controlRef.current) {
        // @ts-ignore
        controlRef.current = L.control.sideBySide(layerLeft, layerRight).addTo(map);
      }
    });

    return () => {
      if (controlRef.current) { controlRef.current.remove(); controlRef.current = null; }
      if (map.hasLayer(layerLeft)) map.removeLayer(layerLeft);
      if (map.hasLayer(layerRight)) map.removeLayer(layerRight);
    };
  }, [map, layerLeft, layerRight]);

  return null;
}

export default function IklimTurleriActivity({ onClose }: { onClose: () => void }) {
  const [layers, setLayers] = useState<{ left: any, right: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCitation, setShowCitation] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const parseGeoraster = (await import('georaster')).default;
        const GeoRasterLayer = (await import('georaster-layer-for-leaflet')).default;

        // Dosya yolları ve isimleri GitHub deponuzdakilerle eşleştirildi
        const [res1, res2] = await Promise.all([
          fetch('/maps/climate/1930Koppen_geiger.tif'),
          fetch('/maps/climate/2099Koppen_geiger.tif')
        ]);

        if (!res1.ok || !res2.ok) throw new Error("TIF dosyaları yüklenemedi!");

        const [buf1, buf2] = await Promise.all([res1.arrayBuffer(), res2.arrayBuffer()]);
        const [geo1, geo2] = await Promise.all([parseGeoraster(buf1), parseGeoraster(buf2)]);

        const config = (g: any) => ({
          georaster: g,
          opacity: 0.8,
          pixelValuesToColorFn: (v: number[]) => climateLegend[v[0]]?.color || 'transparent',
          resolution: 256
        });

        // @ts-ignore
        setLayers({ left: new GeoRasterLayer(config(geo1)), right: new GeoRasterLayer(config(geo2)) });
        setLoading(false);
      } catch (err) {
        console.error("Yükleme Hatası:", err);
        setLoading(false);
      }
    };
    if (typeof window !== 'undefined') init();
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col bg-slate-950 text-slate-100 animate-in fade-in duration-300">
      {/* Üst Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-all">
            <ArrowLeft className="text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold">3.1.3. İklim Türleri Değişimi (1930 vs 2099)</h1>
            <button 
              onClick={() => setShowCitation(!showCitation)}
              className="text-[10px] text-indigo-400 flex items-center gap-1 hover:text-indigo-300"
            >
              <BookOpen size={12} /> Kaynak: Beck et al. (2023)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] border border-indigo-500/30 items-center gap-2">
            <Globe size={14}/> 1930 (Mevcut) | 2099 (Projeksiyon)
          </div>
        </div>
      </div>

      {/* Ana Harita Alanı */}
      <div className="flex-1 relative bg-slate-900 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-[2000] bg-slate-950/90 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <p className="text-slate-300 font-medium">Küresel İklim Verileri Analiz Ediliyor...</p>
          </div>
        )}

        {/* Atıf Paneli (Toggle) */}
        {showCitation && (
          <div className="absolute top-4 left-4 right-4 z-[3000] p-4 bg-slate-900 border border-white/20 rounded-xl shadow-2xl text-xs leading-relaxed animate-in slide-in-from-top-2">
            <h3 className="font-bold mb-2 text-indigo-400 uppercase tracking-wider">Akademik Atıf</h3>
            <p className="text-slate-300 italic">
              Beck, H. E., T. R. McVicar, N. Vergopolan, A. Berg, N. J. Lutsko, A. Dufour,
              Z. Zeng, X. Jiang, A. I. J. M. van Dijk, and D. G. Miralles. High-resolution
              (1 km) Köppen-Geiger maps for 1901–2099 based on constrained CMIP6 
              projections, Scientific Data 10, 724 (2023).
            </p>
            <button 
              onClick={() => setShowCitation(false)}
              className="mt-2 text-slate-500 hover:text-white underline"
            >
              Kapat
            </button>
          </div>
        )}

        {typeof window !== 'undefined' && (
          <MapContainer center={[39, 35]} zoom={5} className="h-full w-full outline-none">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            {layers && <ComparisonControl layerLeft={layers.left} layerRight={layers.right} />}
          </MapContainer>
        )}

        {/* Dinamik ve Kaydırılabilir Legend (Gösterge) */}
        <div className="absolute bottom-6 left-6 z-[1000] w-[280px] bg-slate-900/95 border border-white/10 rounded-2xl backdrop-blur-md shadow-2xl flex flex-col max-h-[70%]">
           <div className="p-4 border-b border-white/5">
              <p className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase">Köppen-Geiger İklim Sınıfları</p>
           </div>
           <div className="p-4 overflow-y-auto custom-scrollbar space-y-2">
              {Object.entries(climateLegend).map(([k,v]) => (
                <div key={k} className="flex items-center gap-3 group">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{backgroundColor: v.color}}/>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-200 font-bold group-hover:text-white">{v.code}</span>
                    <span className="text-[9px] text-slate-500">{v.name}</span>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}