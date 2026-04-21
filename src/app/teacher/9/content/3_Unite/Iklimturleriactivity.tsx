"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, Loader2, Map as MapIcon, Calendar } from 'lucide-react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ─── Köppen-Geiger Türkçe Renk Tablosu (Tam Liste) ─── */
const klimaRenk: Record<number, { kod: string; ad: string; color: string }> = {
  1:  { kod: 'Af',  ad: 'Tropikal, yağmur ormanı',            color: 'rgb(0, 0, 255)' },
  2:  { kod: 'Am',  ad: 'Tropikal, muson',                    color: 'rgb(0, 120, 255)' },
  3:  { kod: 'Aw',  ad: 'Tropikal, savan',                    color: 'rgb(70, 170, 250)' },
  4:  { kod: 'BWh', ad: 'Kurak, çöl, sıcak',                  color: 'rgb(255, 0, 0)' },
  5:  { kod: 'BWk', ad: 'Kurak, çöl, soğuk',                  color: 'rgb(255, 150, 150)' },
  6:  { kod: 'BSh', ad: 'Kurak, step, sıcak',                 color: 'rgb(245, 165, 0)' },
  7:  { kod: 'BSk', ad: 'Kurak, step, soğuk',                 color: 'rgb(255, 220, 100)' },
  8:  { kod: 'Csa', ad: 'Ilıman, yazı kurak-sıcak (Akdeniz)',     color: 'rgb(255, 255, 0)' },
  9:  { kod: 'Csb', ad: 'Ilıman, yazı kurak-ılık',                color: 'rgb(200, 200, 0)' },
  10: { kod: 'Csc', ad: 'Ilıman, yazı kurak-soğuk',               color: 'rgb(150, 150, 0)' },
  11: { kod: 'Cwa', ad: 'Ilıman, kışı kurak, yazı sıcak',         color: 'rgb(150, 255, 150)' },
  12: { kod: 'Cwb', ad: 'Ilıman, kışı kurak, yazı ılık',          color: 'rgb(100, 200, 100)' },
  13: { kod: 'Cwc', ad: 'Ilıman, kışı kurak, yazı soğuk',         color: 'rgb(50, 150, 50)' },
  14: { kod: 'Cfa', ad: 'Ilıman, her mevsim yağışlı, yazı sıcak', color: 'rgb(200, 255, 80)' },
  15: { kod: 'Cfb', ad: 'Ilıman, her mevsim yağışlı, yazı ılık',  color: 'rgb(100, 255, 80)' },
  16: { kod: 'Cfc', ad: 'Ilıman, her mevsim yağışlı, yazı soğuk', color: 'rgb(50, 200, 0)' },
  17: { kod: 'Dsa', ad: 'Soğuk, yazı kurak-sıcak',                color: 'rgb(255, 0, 255)' },
  18: { kod: 'Dsb', ad: 'Soğuk, yazı kurak-ılık',                 color: 'rgb(200, 0, 200)' },
  19: { kod: 'Dsc', ad: 'Soğuk, yazı kurak-soğuk',                color: 'rgb(150, 50, 150)' },
  20: { kod: 'Dsd', ad: 'Soğuk, yazı kurak, çok soğuk kış',       color: 'rgb(150, 100, 150)' },
  21: { kod: 'Dwa', ad: 'Soğuk, kışı kurak, yazı sıcak',          color: 'rgb(170, 175, 255)' },
  22: { kod: 'Dwb', ad: 'Soğuk, kışı kurak, yazı ılık',           color: 'rgb(90, 120, 220)' },
  23: { kod: 'Dwc', ad: 'Soğuk, kışı kurak, yazı soğuk',          color: 'rgb(75, 80, 180)' },
  24: { kod: 'Dwd', ad: 'Soğuk, kışı kurak, çok soğuk kış',       color: 'rgb(50, 0, 135)' },
  25: { kod: 'Dfa', ad: 'Soğuk, her mevsim yağışlı, yazı sıcak',  color: 'rgb(0, 255, 255)' },
  26: { kod: 'Dfb', ad: 'Soğuk, her mevsim yağışlı, yazı ılık',   color: 'rgb(55, 200, 255)' },
  27: { kod: 'Dfc', ad: 'Soğuk, her mevsim yağışlı, yazı soğuk',  color: 'rgb(0, 125, 125)' },
  28: { kod: 'Dfd', ad: 'Soğuk, her mevsim yağışlı, çok soğuk kış', color: 'rgb(0, 70, 95)' },
  29: { kod: 'ET',  ad: 'Kutup, tundra',                          color: 'rgb(178, 178, 178)' },
  30: { kod: 'EF',  ad: 'Kutup, buzul',                           color: 'rgb(102, 102, 102)' },
};

const YILLAR = [1930, 1960, 1990, 2020, 2070, 2099];

/**
 * 📍 KAYMA VE YENİLENME SORUNUNU ÇÖZEN KRİTİK BİLEŞEN
 */
function RasterLayer({ georaster, yil }: { georaster: any, yil: number }) {
  const map = useMap();
  const layerRef = useRef<any>(null);

  useEffect(() => {
    // Önce haritadaki tüm eski raster katmanlarını zorla temizle
    map.eachLayer((l: any) => {
      if (l.options && l.options.georaster) {
        map.removeLayer(l);
      }
    });

    const addLayer = async () => {
      const GeoRasterLayer = (await import('georaster-layer-for-leaflet')).default;
      
      // Yeni katmanı oluştur
      layerRef.current = new (GeoRasterLayer as any)({
        georaster: georaster,
        opacity: 0.8,
        pixelValuesToColorFn: (v: number[]) => klimaRenk[v[0]]?.color || 'transparent',
        resolution: 128 // Geçiş hızı için ideal çözünürlük
      });

      layerRef.current.addTo(map);
    };

    addLayer();

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [georaster, map, yil]); // Yıl her değiştiğinde bu efekti tetikle

  return null;
}

export default function IklimTurleriActivity({ onClose }: { onClose: () => void }) {
  const [aktifRaster, setAktifRaster] = useState<any>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [aktifYil, setAktifYil] = useState<number>(1930);

  const yukleYil = useCallback(async (yil: number) => {
    setYukleniyor(true);
    setAktifYil(yil);
    try {
      const parseGeoraster = (await import('georaster')).default;
      // 'cache: no-store' tarayıcı takılmasını önler
      const response = await fetch(`/maps/climate/${yil}.tif`, { cache: 'no-store' });
      const arrayBuffer = await response.arrayBuffer();
      const georaster = await parseGeoraster(arrayBuffer);
      setAktifRaster(georaster);
    } catch (err) {
      console.error("Yükleme hatası:", err);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') yukleYil(1930);
  }, [yukleYil]);

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* Üst Panel */}
      <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b border-white/10 bg-slate-900/95 gap-4 z-20 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-all">
            <ArrowLeft className="text-white" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">İklim Türleri Analizi ({aktifYil})</h1>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {YILLAR.map((yil) => (
            <button
              key={yil}
              onClick={() => yukleYil(yil)}
              disabled={yukleniyor}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                aktifYil === yil
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                  : 'bg-slate-800 border-white/5 text-slate-400 hover:border-white/20'
              }`}
            >
              <Calendar size={14} className="inline mr-1" /> {yil}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 relative bg-slate-900">
        {yukleniyor && (
          <div className="absolute inset-0 z-[1000] bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest italic">
              {aktifYil} Haritası Hazırlanıyor...
            </p>
          </div>
        )}

        <MapContainer center={[20, 0]} zoom={2} className="h-full w-full outline-none" zoomControl={true}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; CartoDB" />

          {aktifRaster && (
            <RasterLayer 
              key={`raster-${aktifYil}`} // REACT'I SİLMEYE ZORLAR
              georaster={aktifRaster} 
              yil={aktifYil} // DEĞİŞİMİ TETİKLER
            />
          )}
        </MapContainer>

        {/* Lejand */}
        <div className="absolute bottom-6 right-6 z-[2000] w-72 md:w-80 bg-slate-950/90 border border-white/10 rounded-2xl flex flex-col shadow-2xl max-h-[70vh] backdrop-blur-md overflow-hidden">
          <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-2">
              <MapIcon size={14} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Lejand</span>
            </div>
            <span className="text-[10px] font-bold text-indigo-400">{aktifYil}</span>
          </div>
          <div className="p-3 overflow-y-auto space-y-1 custom-scrollbar">
            {Object.entries(klimaRenk).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 hover:bg-white/5 px-2 py-1 rounded-lg transition-colors group">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: v.color }} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-slate-200 group-hover:text-white">{v.kod}</span>
                  <span className="text-[9px] text-slate-500 group-hover:text-slate-400 leading-tight italic truncate">{v.ad}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}