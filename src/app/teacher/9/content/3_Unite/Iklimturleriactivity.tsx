"use client";
import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
// --- Harita Kütüphaneleri (Gerekli) ---
// Bu kütüphanelerin projeye eklenmesi gerekir:
// npm install deck.gl react-map-gl maplibre-gl georaster georaster-layer-for-deck.gl parse-georaster
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import parseGeoraster from 'georaster';
import { GeoRasterLayer } from 'georaster-layer-for-deck.gl';

/**
 * 1. CLIMATE LEGEND OBJESİ (Bileşenin Dışında Olmalı)
 * legend.txt dosyasındaki tüm sayısal değerler ve RGB karşılıkları buradadır.
 */
const climateLegend: Record<number, { code: string; name: string; color: string }> = {
  1: { code: 'Af', name: 'Tropikal, Yağmur Ormanı', color: 'rgb(0, 0, 255)' },
  2: { code: 'Am', name: 'Tropikal, Muson', color: 'rgb(0, 120, 255)' },
  3: { code: 'Aw', name: 'Tropikal, Savan', color: 'rgb(70, 170, 250)' },
  4: { code: 'BWh', name: 'Kurak, Çöl, Sıcak', color: 'rgb(255, 0, 0)' },
  5: { code: 'BWk', name: 'Kurak, Çöl, Soğuk', color: 'rgb(255, 150, 150)' },
  6: { code: 'BSh', name: 'Kurak, Step, Sıcak', color: 'rgb(245, 165, 0)' },
  7: { code: 'BSk', name: 'Kurak, Step, Soğuk', color: 'rgb(255, 220, 100)' },
  8: { code: 'Csa', name: 'Ilıman, Yazı Kurak ve Sıcak (Akdeniz)', color: 'rgb(255, 255, 0)' },
  9: { code: 'Csb', name: 'Ilıman, Yazı Kurak ve Ilık', color: 'rgb(200, 200, 0)' },
  10: { code: 'Csc', name: 'Ilıman, Yazı Kurak ve Soğuk', color: 'rgb(150, 150, 0)' },
  11: { code: 'Cwa', name: 'Ilıman, Kışı Kurak, Yazı Sıcak', color: 'rgb(150, 255, 150)' },
  12: { code: 'Cwb', name: 'Ilıman, Kışı Kurak, Yazı Ilık', color: 'rgb(100, 200, 100)' },
  13: { code: 'Cwc', name: 'Ilıman, Kışı Kurak, Yazı Soğuk', color: 'rgb(50, 150, 50)' },
  14: { code: 'Cfa', name: 'Ilıman, Her Mevsim Yağışlı, Yazı Sıcak', color: 'rgb(200, 255, 80)' },
  15: { code: 'Cfb', name: 'Ilıman, Her Mevsim Yağışlı, Yazı Ilık', color: 'rgb(100, 255, 80)' },
  16: { code: 'Cfc', name: 'Ilıman, Her Mevsim Yağışlı, Yazı Soğuk', color: 'rgb(50, 200, 0)' },
  17: { code: 'Dsa', name: 'Soğuk, Yazı Kurak ve Sıcak', color: 'rgb(255, 0, 255)' },
  18: { code: 'Dsb', name: 'Soğuk, Yazı Kurak ve Ilık', color: 'rgb(200, 0, 200)' },
  19: { code: 'Dsc', name: 'Soğuk, Yazı Kurak ve Soğuk', color: 'rgb(150, 50, 150)' },
  20: { code: 'Dsd', name: 'Soğuk, Yazı Kurak, Çok Soğuk Kış', color: 'rgb(150, 100, 150)' },
  21: { code: 'Dwa', name: 'Soğuk, Kışı Kurak, Yazı Sıcak', color: 'rgb(170, 175, 255)' },
  22: { code: 'Dwb', name: 'Soğuk, Kışı Kurak, Yazı Ilık', color: 'rgb(90, 120, 220)' },
  23: { code: 'Dwc', name: 'Soğuk, Kışı Kurak, Yazı Soğuk', color: 'rgb(75, 80, 180)' },
  24: { code: 'Dwd', name: 'Soğuk, Kışı Kurak, Çok Soğuk Kış', color: 'rgb(50, 0, 135)' },
  25: { code: 'Dfa', name: 'Soğuk, Her Mevsim Yağışlı, Yazı Sıcak', color: 'rgb(0, 255, 255)' },
  26: { code: 'Dfb', name: 'Soğuk, Her Mevsim Yağışlı, Yazı Ilık', color: 'rgb(55, 200, 255)' },
  27: { code: 'Dfc', name: 'Soğuk, Her Mevsim Yağışlı, Yazı Soğuk', color: 'rgb(0, 125, 125)' },
  28: { code: 'Dfd', name: 'Soğuk, Her Mevsim Yağışlı, Çok Soğuk Kış', color: 'rgb(0, 70, 70)' },
  29: { code: 'ET', name: 'Polar, Tundra', color: 'rgb(178, 178, 178)' },
  30: { code: 'EF', name: 'Polar, Buzul', color: 'rgb(102, 102, 102)' }
};

interface IklimTurleriActivityProps {
  onClose: () => void;
}

// Harita için başlangıç görünümü
const INITIAL_VIEW_STATE = {
  longitude: 35,
  latitude: 39,
  zoom: 4,
  pitch: 0,
  bearing: 0
};

export default function IklimTurleriActivity({ onClose }: IklimTurleriActivityProps) {
  // GeoRasterLayer'ı state içinde tutarak dinamik olarak yüklüyoruz.
  const [layer, setLayer] = useState<GeoRasterLayer | null>(null);

  // GeoTIFF dosyasını yüklemek ve katmanı oluşturmak için useEffect kullanılır.
  useEffect(() => {
    const loadRasterLayer = async () => {
      try {
        const response = await fetch('/koppen-geiger-map.tif');
        if (!response.ok) throw new Error('Raster dosyası yüklenemedi.');
        const georaster = await parseGeoraster(await response.arrayBuffer());

        const geoRasterLayer = new GeoRasterLayer({
          georaster: georaster,
          opacity: 0.7,
          pixelValuesToColorFn: values => climateLegend[values[0]]?.color || 'transparent',
          resolution: 256,
          attribution: 'Data: <a href="https://doi.org/10.1038/s41597-023-02549-6">Beck et al. (2023)</a> | CBS Görev Sistemi'
        });
        setLayer(geoRasterLayer);
      } catch (error) { console.error("Harita katmanı yüklenirken hata oluştu:", error); }
    };
    loadRasterLayer();
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-950 p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft className="text-slate-400" />
        </button>
        <h1 className="text-2xl font-bold text-slate-100">3.1.3. İklim Türleri Analizi</h1>
      </div>

      {/* Harita ve Slider Buraya Gelecek */}
      <div className="bg-slate-900 rounded-2xl border border-white/5 flex-1 overflow-hidden relative">
        <div className="absolute top-4 left-4 z-10 bg-black/60 p-3 rounded-lg text-xs backdrop-blur-sm border border-white/10">
          <p className="text-white font-semibold mb-2">İklim Göstergesi</p>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(climateLegend).map(([val, info]) => (
              <div key={val} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: info.color }} />
                <span className="text-slate-300 text-[10px]">{info.code}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Harita Bileşeni Buraya Yerleşecek */}
        <DeckGL
          initialViewState={INITIAL_VIEW_STATE}
          controller={true}
          layers={layer ? [layer] : []}
          style={{ width: '100%', height: '100%', position: 'relative' }}
        >
          <Map
            mapLib={import('maplibre-gl')}
            mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json"
          />
          {!layer && (
             <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-900/80">Harita Katmanları Yükleniyor...</div>
          )}
        </DeckGL>
      </div>
    </div>
  );
}