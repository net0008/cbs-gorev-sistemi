"use client";

import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Globe, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * 1. CLIMATE LEGEND - İklim Tipleri ve Renkleri
 * Beck et al. (2023) verilerine dayalı standart renkler
 */
const climateLegend: Record<number, { code: string; name: string; color: string }> = {
  1: { code: 'Af', name: 'Tropikal, Yağmur Ormanı', color: 'rgb(0, 0, 255)' },
  2: { code: 'Am', name: 'Tropikal, Muson', color: 'rgb(0, 120, 255)' },
  3: { code: 'Aw', name: 'Tropikal, Savan', color: 'rgb(70, 170, 250)' },
  4: { code: 'BWh', name: 'Kurak, Çöl, Sıcak', color: 'rgb(255, 0, 0)' },
  5: { code: 'BWk', name: 'Kurak, Çöl, Soğuk', color: 'rgb(255, 150, 150)' },
  6: { code: 'BSh', name: 'Kurak, Step, Sıcak', color: 'rgb(245, 165, 0)' },
  7: { code: 'BSk', name: 'Kurak, Step, Soğuk', color: 'rgb(255, 220, 100)' },
  8: { code: 'Csa', name: 'Ilıman, Akdeniz İklimi (Sıcak Yaz)', color: 'rgb(255, 255, 0)' },
  29: { code: 'ET', name: 'Polar, Tundra', color: 'rgb(178, 178, 178)' },
  30: { code: 'EF', name: 'Polar, Buzul', color: 'rgb(102, 102, 102)' }
};

/**
 * SLIDER KONTROL BİLEŞENİ
 * İki katmanı (1930 vs 2099) yan yana karşılaştırır.
 */
function ComparisonControl({ layerLeft, layerRight }: { layerLeft: any, layerRight: any }) {
  const map = useMap();
  const controlRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !layerLeft || !layerRight) return;

    // Katmanları haritaya ekle
    layerLeft.addTo(map);
    layerRight.addTo(map);

    // leaflet-side-by-side'ı dinamik olarak yükle (SSR Hatasını engeller)
    // @ts-ignore
    import('leaflet-side-by-side').then(() => {
      if (!controlRef.current) {
        // @ts-ignore
        controlRef.current = L.control.sideBySide(layerLeft, layerRight).addTo(map);
      }
    }).catch(err => console.error("Slider hatası:", err));

    return () => {
      if (controlRef.current) {
        controlRef.current.remove();
        controlRef.current = null;
      }
      if (map.hasLayer(layerLeft)) map.removeLayer(layerLeft);
      if (map.hasLayer(layerRight)) map.removeLayer(layerRight);
    };
  }, [map, layerLeft, layerRight]);

  return null;
}

interface IklimTurleriActivityProps {
  onClose: () => void;
}

export default function IklimTurleriActivity({ onClose }: IklimTurleriActivityProps) {
  const [layers, setLayers] = useState<{ left: any, right: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Tarayıcı tarafında çalıştığından emin ol
    if (typeof window === 'undefined') return;

    const initRasters = async () => {
      try {
        // SSR HATASI ÇÖZÜMÜ: Paketleri sadece tarayıcıda yükle
        const parseGeoraster = (await import('georaster')).default;
        const GeoRasterLayerModule = await import('georaster-layer-for-leaflet');
        const GeoRasterLayer = GeoRasterLayerModule.default || (GeoRasterLayerModule as any);

        // DOSYA ADLARI DÜZELTİLDİ: depondaki isimlerle birebir aynı yapıldı
        const [res1930, res2099] = await Promise.all([
          fetch('/maps/climate/1930Koppen_geiger.tif'),
          fetch('/maps/climate/2099Koppen_geiger.tif')
        ]);

        if (!res1930.ok || !res2099.ok) throw new Error("TIF dosyaları bulunamadı (404)");

        const [buf1930, buf2099] = await Promise.all([res1930.arrayBuffer(), res2099.arrayBuffer()]);
        const [georaster1930, georaster2099] = await Promise.all([
          parseGeoraster(buf1930), 
          parseGeoraster(buf2099)
        ]);

        const layerLeft = new GeoRasterLayer({
          georaster: georaster1930,
          opacity: 0.7,
          pixelValuesToColorFn: (v: number[]) => climateLegend[v[0]]?.color || 'transparent',
          resolution: 256
        });

        const layerRight = new GeoRasterLayer({
          georaster: georaster2099,
          opacity: 0.7,
          pixelValuesToColorFn: (v: number[]) => climateLegend[v[0]]?.color || 'transparent',
          resolution: 256
        });

        setLayers({ left: layerLeft, right: layerRight });
      } catch (err) {
        console.error("Raster yükleme hatası:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initRasters();
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 text-slate-100 min-h-[600px]">
      {/* Üst Panel */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">3.1.3. İklim Türleri Değişimi</h1>
            <p className="text-xs text-slate-500 italic">
              Veri Kaynağı: <a href="https://doi.org/10.1038/s41597-023-02549-6" target="_blank" className="underline">Beck et al. (2023)</a>
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 text-indigo-400">
          <Globe size={18} />
          <span className="text-sm font-semibold">1930 vs 2099 Tahmini</span>
        </div>
      </div>

      {/* Harita Konteynırı */}
      <div className="bg-slate-900 rounded-3xl border border-white/5 flex-1 overflow-hidden relative shadow-2xl">
        {isLoading && (
          <div className="absolute inset-0 z-[2000] bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-slate-300 animate-pulse">1km Çözünürlüklü Raster Veriler Yükleniyor...</p>
          </div>
        )}

        {typeof window !== 'undefined' && (
          <MapContainer center={[39, 35]} zoom={5} className="h-full w-full">
            <TileLayer 
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
              attribution="&copy; OpenStreetMap &copy; CARTO"
            />
            {layers && (
               <ComparisonControl layerLeft={layers.left} layerRight={layers.right} />
            )}
          </MapContainer>
        )}

        {/* Dinamik Legend (Gösterge) */}
        <div className="absolute bottom-6 right-6 z-[1000] bg-slate-900/95 p-5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl max-w-[240px]">
           <div className="text-xs font-bold mb-3 border-b border-white/10 pb-2 flex justify-between">
              <span>İKLİM TİPLERİ</span>
              <span className="text-indigo-400">1930 - 2099</span>
           </div>
           <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
             {Object.entries(climateLegend).map(([k, v]) => (
               <div key={k} className="flex items-center gap-3 text-[11px] group cursor-default">
                 <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: v.color }} />
                 <span className="text-slate-400 font-mono w-7">{v.code}</span>
                 <span className="text-slate-200 group-hover:text-white transition-colors">{v.name}</span>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}

