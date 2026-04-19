"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, Loader2, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer, ImageOverlay } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

/* ─── Köppen-Geiger Renk Tablosu ─── */
const klimaRenk: Record<number, { kod: string; ad: string; rgb: [number, number, number] }> = {
  1:  { kod: 'Af',  ad: 'Tropikal, yağmur ormanı',               rgb: [0,   0,   255] },
  2:  { kod: 'Am',  ad: 'Tropikal, muson',                        rgb: [0,   120, 255] },
  3:  { kod: 'Aw',  ad: 'Tropikal, savan',                        rgb: [70,  170, 250] },
  4:  { kod: 'BWh', ad: 'Kurak, çöl, sıcak',                      rgb: [255, 0,   0  ] },
  5:  { kod: 'BWk', ad: 'Kurak, çöl, soğuk',                      rgb: [255, 150, 150] },
  6:  { kod: 'BSh', ad: 'Kurak, step, sıcak',                     rgb: [245, 165, 0  ] },
  7:  { kod: 'BSk', ad: 'Kurak, step, soğuk',                     rgb: [255, 220, 100] },
  8:  { kod: 'Csa', ad: 'Ilıman, yazı kurak-sıcak (Akdeniz)',     rgb: [255, 255, 0  ] },
  9:  { kod: 'Csb', ad: 'Ilıman, yazı kurak-ılık',                rgb: [200, 200, 0  ] },
  10: { kod: 'Csc', ad: 'Ilıman, yazı kurak-soğuk',               rgb: [150, 150, 0  ] },
  11: { kod: 'Cwa', ad: 'Ilıman, kışı kurak, yazı sıcak',         rgb: [150, 255, 150] },
  12: { kod: 'Cwb', ad: 'Ilıman, kışı kurak, yazı ılık',          rgb: [100, 200, 100] },
  13: { kod: 'Cwc', ad: 'Ilıman, kışı kurak, yazı soğuk',         rgb: [50,  150, 50 ] },
  14: { kod: 'Cfa', ad: 'Ilıman, her mevsim yağışlı, yazı sıcak', rgb: [200, 255, 80 ] },
  15: { kod: 'Cfb', ad: 'Ilıman, her mevsim yağışlı, yazı ılık',  rgb: [100, 255, 80 ] },
  16: { kod: 'Cfc', ad: 'Ilıman, her mevsim yağışlı, yazı soğuk', rgb: [50,  200, 0  ] },
  17: { kod: 'Dsa', ad: 'Soğuk, yazı kurak-sıcak',                rgb: [255, 0,   255] },
  18: { kod: 'Dsb', ad: 'Soğuk, yazı kurak-ılık',                 rgb: [200, 0,   200] },
  19: { kod: 'Dsc', ad: 'Soğuk, yazı kurak-soğuk',                rgb: [150, 50,  150] },
  20: { kod: 'Dsd', ad: 'Soğuk, yazı kurak, çok soğuk kış',       rgb: [150, 100, 150] },
  21: { kod: 'Dwa', ad: 'Soğuk, kışı kurak, yazı sıcak',          rgb: [170, 175, 255] },
  22: { kod: 'Dwb', ad: 'Soğuk, kışı kurak, yazı ılık',           rgb: [90,  120, 220] },
  23: { kod: 'Dwc', ad: 'Soğuk, kışı kurak, yazı soğuk',          rgb: [75,  80,  180] },
  24: { kod: 'Dwd', ad: 'Soğuk, kışı kurak, çok soğuk kış',       rgb: [50,  0,   135] },
  25: { kod: 'Dfa', ad: 'Soğuk, her mevsim yağışlı, yazı sıcak',  rgb: [0,   255, 255] },
  26: { kod: 'Dfb', ad: 'Soğuk, her mevsim yağışlı, yazı ılık',   rgb: [55,  200, 255] },
  27: { kod: 'Dfc', ad: 'Soğuk, her mevsim yağışlı, yazı soğuk',  rgb: [0,   125, 125] },
  28: { kod: 'Dfd', ad: 'Soğuk, her mevsim yağışlı, çok soğuk kış', rgb: [0, 70,  95 ] },
  29: { kod: 'ET',  ad: 'Kutup, tundra',                           rgb: [178, 178, 178] },
  30: { kod: 'EF',  ad: 'Kutup, buzul',                            rgb: [102, 102, 102] },
};

const YILLAR = [1930, 1960, 1990, 2020, 2070, 2099];

/* ─────────────────────────────────────────────────────────────────────────────
   georaster → canvas → data URL
   
   georaster-layer-for-leaflet tamamen devre dışı.
   Piksel değerleri doğrudan canvas'a yazılıyor;
   ImageOverlay ile haritaya bindiriliyor.
   ───────────────────────────────────────────────────────────────────────────── */
async function georasterToDataURL(georaster: any): Promise<string> {
  const { width, height, values, noDataValue } = georaster;
  const band: number[] | Float32Array | Int16Array | Uint8Array = values[0];

  // Canvas oluştur — tam raster çözünürlüğünde
  const canvas = document.createElement('canvas');
  canvas.width  = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(width, height);
  const px = imageData.data; // Uint8ClampedArray, [R,G,B,A, R,G,B,A ...]

  for (let i = 0; i < band.length; i++) {
    const v = band[i];
    const p = i * 4;

    // Geçersiz değer → şeffaf
    if (v == null || v === noDataValue || v === 0 || v < 1 || v > 30) {
      px[p + 3] = 0;
      continue;
    }

    const entry = klimaRenk[v];
    if (!entry) { px[p + 3] = 0; continue; }

    px[p]     = entry.rgb[0];
    px[p + 1] = entry.rgb[1];
    px[p + 2] = entry.rgb[2];
    px[p + 3] = 204; // ~0.8 opacity
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/* ─── Her yıl için yüklenen veri ─── */
interface YilVerisi {
  yil: number;
  dataURL: string;   // canvas'tan üretilen PNG
  boyutMB: string;   // debug: yüklenen TIF boyutu
}

export default function IklimTurleriActivity({ onClose }: { onClose: () => void }) {
  const [aktifVeri,  setAktifVeri]  = useState<YilVerisi | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata,       setHata]       = useState<string | null>(null);
  const [aktifYil,   setAktifYil]   = useState<number>(1930);

  const abortRef = useRef<AbortController | null>(null);

  const yukleYil = useCallback(async (yil: number) => {
    // Zaten yüklüyse tekrar yükleme
    if (yil === aktifVeri?.yil) return;

    // Önceki isteği iptal et
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setAktifYil(yil);
    setYukleniyor(true);
    setHata(null);

    try {
      /* 1. TIF dosyasını indir ─────────────────────────────────────────── */
      const url = `/maps/climate/${yil}Koppen_geiger.tif`;
      const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });

      if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);

      const buf = await res.arrayBuffer();
      if (ctrl.signal.aborted) return;

      const boyutMB = (buf.byteLength / 1024 / 1024).toFixed(2);
      console.log(`[İklim] ${yil}: ${boyutMB} MB yüklendi`);

      /* 2. Georaster ile parse et ─────────────────────────────────────── */
      const parseGeoraster = (await import('georaster')).default;
      const georaster = await parseGeoraster(buf);
      if (ctrl.signal.aborted) return;

      console.log(`[İklim] ${yil}: raster ${georaster.width}×${georaster.height}, noData=${georaster.noDataValue}`);

      /* 3. Canvas → data URL ──────────────────────────────────────────── */
      const dataURL = await georasterToDataURL(georaster);
      if (ctrl.signal.aborted) return;

      /* 4. State güncelle — atomik ────────────────────────────────────── */
      setAktifVeri({ yil, dataURL, boyutMB });

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('[İklim] Hata:', err);
      setHata(err.message ?? 'Bilinmeyen hata');
    } finally {
      if (!ctrl.signal.aborted) setYukleniyor(false);
    }
  }, [aktifVeri?.yil]);

  // Uygulama açılınca 1930'u yükle
  useEffect(() => {
    yukleYil(1930);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col bg-slate-950 text-slate-100 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b border-white/10 bg-slate-900/95 gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-all">
            <ArrowLeft className="text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">İklim Türleri Analizi</h1>
            {/* Debug bilgisi — sorun çözülünce kaldırılabilir */}
            {aktifVeri && (
              <p className="text-[10px] text-slate-500 mt-0.5">
                {aktifVeri.yil} · {aktifVeri.boyutMB} MB
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {YILLAR.map((yil) => (
            <button
              key={yil}
              onClick={() => yukleYil(yil)}
              disabled={yukleniyor}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                aktifYil === yil
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]'
                  : 'bg-slate-800 border-white/5 text-slate-400 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {yil}
            </button>
          ))}
        </div>
      </div>

      {/* ── Harita Alanı ── */}
      <div className="flex-1 relative bg-slate-900">

        {yukleniyor && (
          <div className="absolute inset-0 z-[1000] bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 pointer-events-none">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-sm font-medium text-indigo-200 uppercase tracking-widest">
              {aktifYil} yükleniyor…
            </p>
          </div>
        )}

        {hata && !yukleniyor && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] bg-red-900/80 border border-red-500/40 text-red-200 text-xs px-4 py-2 rounded-xl backdrop-blur-sm max-w-sm text-center">
            ⚠️ {hata}
          </div>
        )}

        <MapContainer
          center={[20, 10]}
          zoom={2}
          className="h-full w-full outline-none"
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; CartoDB"
          />

          {/*
            ImageOverlay — georaster-layer-for-leaflet KULLANILMIYOR.
            key={aktifVeri.yil} garantisi: yıl değiştikçe overlay tamamen
            yeniden mount edilir, eski görüntü kesinlikle kaldırılır.
          */}
          {aktifVeri && (
            <ImageOverlay
              key={aktifVeri.yil}
              url={aktifVeri.dataURL}
              bounds={[[-90, -180], [90, 180]]}
              opacity={0.85}
              zIndex={10}
            />
          )}
        </MapContainer>

        {/* ── Lejand ── */}
        <div className="absolute bottom-6 right-6 z-[2000] w-72 md:w-80 bg-slate-950/90 border border-white/10 rounded-2xl flex flex-col shadow-2xl max-h-[70vh] backdrop-blur-md">
          <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <MapIcon size={14} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                Köppen Sınıflandırması
              </span>
            </div>
            <span className="text-[10px] font-bold text-indigo-400">{aktifYil}</span>
          </div>
          <div className="p-3 overflow-y-auto space-y-1">
            {Object.entries(klimaRenk).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 hover:bg-white/5 px-1 py-1 rounded-lg transition-colors group">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: `rgb(${v.rgb[0]},${v.rgb[1]},${v.rgb[2]})` }}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-slate-200 group-hover:text-white">{v.kod}</span>
                  <span className="text-[9px] text-slate-500 group-hover:text-slate-400 leading-tight">{v.ad}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}