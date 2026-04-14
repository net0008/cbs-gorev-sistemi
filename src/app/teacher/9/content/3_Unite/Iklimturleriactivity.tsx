"use client";
import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import parseGeoraster from 'georaster';
import GeoRasterLayer from 'georaster-layer-for-leaflet';

// NOT: Vercel'de hata almamak için terminalde şu komutu çalıştırın:
// npm install georaster georaster-layer-for-leaflet leaflet-side-by-side

/**
 * 1. CLIMATE LEGEND OBJESİ (Bileşenin Dışında Olmalı)
 * legend.txt dosyasındaki tüm sayısal değerler ve RGB karşılıkları buradadır.
 */
const climateLegend: Record<number, { code: string; name: string; color: string }> = {
  1: { code: 'Af', name: 'Tropikal, Yağmur Ormanı', color: 'rgb(0, 0, 255)' },
  4: { code: 'BWh', name: 'Kurak, Çöl, Sıcak', color: 'rgb(255, 0, 0)' },
  8: { code: 'Csa', name: 'Ilıman, Akdeniz İklimi (Sıcak Yaz)', color: 'rgb(255, 255, 0)' },
  29: { code: 'ET', name: 'Polar, Tundra', color: 'rgb(178, 178, 178)' },
  30: { code: 'EF', name: 'Polar, Buzul', color: 'rgb(102, 102, 102)' }
};

function ComparisonControl({ layerLeft, layerRight }: { layerLeft: any, layerRight: any }) {
  const map = useMap();
  const controlRef = useRef<any>(null);

  useEffect(() => {
    // leaflet-side-by-side kütüphanesini dinamik olarak çağırıyoruz
    // @ts-ignore
    import('leaflet-side-by-side').then(() => {
        if (!controlRef.current && layerLeft && layerRight) {
            // @ts-ignore
            controlRef.current = L.control.sideBySide(layerLeft, layerRight).addTo(map);
        }
    });

    return () => {
      if (controlRef.current) {
        controlRef.current.remove();
        controlRef.current = null;
      }
    };
  }, [map, layerLeft, layerRight]);

  return null;
}

interface IklimTurleriActivityProps {
  onClose: () => void;
}

export default function IklimTurleriActivity({ onClose }: IklimTurleriActivityProps) {
  const [layers, setLayers] = useState<{ left: any, right: any } | null>(null);

  // GeoTIFF dosyasını yüklemek ve katmanı oluşturmak için useEffect kullanılır.
  useEffect(() => {
    const initRasters = async () => {
      try {
        // Dosyaları fetch et (isimlerin public klasöründekilerle tam eşleştiğinden emin ol)
        const [res1930, res2099] = await Promise.all([
          fetch('/maps/climate/1930koppen_geiger_0p1.tif'),
          fetch('/maps/climate/2099_koppen_geiger_0p1.tif')
        ]);

        const [buf1930, buf2099] = await Promise.all([res1930.arrayBuffer(), res2099.arrayBuffer()]);
        const [georaster1930, georaster2099] = await Promise.all([parseGeoraster(buf1930), parseGeoraster(buf2099)]);

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
      }
    };

    initRasters();
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6 text-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="text-slate-400" />
          </button>
          <h1 className="text-2xl font-bold">İklim Türleri Değişimi (1930 - 2099)</h1>
        </div>
        <div className="text-[10px] text-slate-500 italic">Data: Beck et al. (2023)</div>
      </div>

      {/* Harita ve Slider Buraya Gelecek */}
      <div className="bg-slate-900 rounded-2xl border border-white/5 flex-1 overflow-hidden relative">
        <MapContainer center={[39, 35]} zoom={5} className="h-full w-full">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {layers && (
            <>
              <ComparisonControl layerLeft={layers.left} layerRight={layers.right} />
              <primitive object={layers.left} />
              <primitive object={layers.right} />
            </>
          )}
        </MapContainer>

        {/* Floating Legend */}
        <div className="absolute bottom-6 right-6 z-[1000] bg-slate-900/90 p-4 rounded-xl border border-white/10 backdrop-blur-md">
           <div className="text-xs font-bold mb-2">İklim Tipleri</div>
            {Object.entries(climateLegend).map(([val, info]) => (
              <div key={val} className="flex items-center gap-2 text-[10px]">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: info.color }} />
                <span className="text-slate-400">{info.code}:</span>
                <span className="text-slate-200">{info.name}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}