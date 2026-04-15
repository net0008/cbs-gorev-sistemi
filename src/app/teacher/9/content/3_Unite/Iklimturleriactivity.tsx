"use client";

import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Globe, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * 1. İKLİM GÖSTERGESİ (LEGEND)
 */
const climateLegend: Record<number, { code: string; name: string; color: string }> = {
  1: { code: 'Af', name: 'Tropikal, Yağmur Ormanı', color: 'rgb(0, 0, 255)' },
  4: { code: 'BWh', name: 'Kurak, Çöl, Sıcak', color: 'rgb(255, 0, 0)' },
  8: { code: 'Csa', name: 'Ilıman, Akdeniz İklimi (Sıcak Yaz)', color: 'rgb(255, 255, 0)' },
  29: { code: 'ET', name: 'Polar, Tundra', color: 'rgb(178, 178, 178)' },
  30: { code: 'EF', name: 'Polar, Buzul', color: 'rgb(102, 102, 102)' }
};

/**
 * KARŞILAŞTIRMA KONTROLÜ (SLIDER)
 */
function ComparisonControl({ layerLeft, layerRight }: { layerLeft: any, layerRight: any }) {
  const map = useMap();
  const controlRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !layerLeft || !layerRight) return;

    layerLeft.addTo(map);
    layerRight.addTo(map);

    // Dinamik import ile Side-by-side eklentisini yüklüyoruz
    // @ts-ignore
    import('leaflet-side-by-side').then(() => {
      if (!controlRef.current) {
        // @ts-ignore
        controlRef.current = L.control.sideBySide(layerLeft, layerRight).addTo(map);
      }
    });

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

interface Props {
  onClose: () => void;
}

export default function IklimTurleriActivity({ onClose }: Props) {
  const [layers, setLayers] = useState<{ left: any, right: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initRasters = async () => {
      try {
        // Kütüphaneleri sadece tarayıcıda dinamik olarak yüklüyoruz (SSR Hatasını önler)
        const parseGeoraster = (await import('georaster')).default;
        const GeoRasterLayerModule = await import('georaster-layer-for-leaflet');
        const GeoRasterLayer = GeoRasterLayerModule.default || GeoRasterLayerModule;

        // DİKKAT: public/maps/climate içindeki dosya isimlerinin 
        // buradakilerle birebir aynı olduğundan emin olun!
        const [res1930, res2099] = await Promise.all([
          fetch('/maps/climate/1930koppen_geiger_0p1.tif'),
          fetch('/maps/climate/2099_koppen_geiger_0p1.tif')
        ]);

        const [buf1930, buf2099] = await Promise.all([res1930.arrayBuffer(), res2099.arrayBuffer()]);
        const [georaster1930, georaster2099] = await Promise.all([
          parseGeoraster(buf1930), 
          parseGeoraster(buf2099)
        ]);

        const layerLeft = new (GeoRasterLayer as any)({
          georaster: georaster1930,
          opacity: 0.7,
          pixelValuesToColorFn: (v: number[]) => climateLegend[v[0]]?.color || 'transparent',
          resolution: 256
        });

        const layerRight = new (GeoRasterLayer as any)({
          georaster: georaster2099,
          opacity: 0.7,
          pixelValuesToColorFn: (v: number[]) => climateLegend[v[0]]?.color || 'transparent',
          resolution: 256
        });

        setLayers({ left: layerLeft, right: layerRight });
        setLoading(false);
      } catch (err) {
        console.error("Raster yükleme hatası:", err);
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
        <div className="flex items-center gap-2 bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 text-indigo-400">
          <Globe size={18} />
          <span className="text-sm font-semibold uppercase tracking-wider">Karşılaştırma Modu</span>
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

        {typeof window !== 'undefined' && (
          <MapContainer center={[39, 35]} zoom={5} className="h-full w-full">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            {layers && (
               <ComparisonControl layerLeft={layers.left} layerRight={layers.right} />
            )}
          </MapContainer>
        )}

        {/* Gösterge (Floating Legend) */}
        <div className="absolute bottom-10 right-10 z-[2000] bg-slate-900/90 p-5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl max-w-[260px]">
           <h4 className="text-xs font-bold mb-4 text-indigo-400 border-b border-white/10 pb-2">İKLİM TİPLERİ</h4>
           <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
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