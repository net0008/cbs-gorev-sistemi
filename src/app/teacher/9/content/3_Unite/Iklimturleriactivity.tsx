"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, Loader2, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const climateLegend: Record<number, { code: string; name: string; color: string }> = {
  1:  { code: 'Af',  name: 'Tropikal, yağmur ormanı',               color: 'rgb(0, 0, 255)'      },
  2:  { code: 'Am',  name: 'Tropikal, muson',                        color: 'rgb(0, 120, 255)'    },
  3:  { code: 'Aw',  name: 'Tropikal, savan',                        color: 'rgb(70, 170, 250)'   },
  4:  { code: 'BWh', name: 'Kurak, çöl, sıcak',                      color: 'rgb(255, 0, 0)'      },
  5:  { code: 'BWk', name: 'Kurak, çöl, soğuk',                      color: 'rgb(255, 150, 150)'  },
  6:  { code: 'BSh', name: 'Kurak, step, sıcak',                     color: 'rgb(245, 165, 0)'    },
  7:  { code: 'BSk', name: 'Kurak, step, soğuk',                     color: 'rgb(255, 220, 100)'  },
  8:  { code: 'Csa', name: 'Ilıman, yazı kurak ve sıcak (Akdeniz)',  color: 'rgb(255, 255, 0)'    },
  9:  { code: 'Csb', name: 'Ilıman, yazı kurak ve ılık',             color: 'rgb(200, 200, 0)'    },
  10: { code: 'Csc', name: 'Ilıman, yazı kurak ve soğuk',            color: 'rgb(150, 150, 0)'    },
  11: { code: 'Cwa', name: 'Ilıman, kışı kurak, yazı sıcak',         color: 'rgb(150, 255, 150)'  },
  12: { code: 'Cwb', name: 'Ilıman, kışı kurak, yazı ılık',          color: 'rgb(100, 200, 100)'  },
  13: { code: 'Cwc', name: 'Ilıman, kışı kurak, yazı soğuk',         color: 'rgb(50, 150, 50)'    },
  14: { code: 'Cfa', name: 'Ilıman, her mevsim yağışlı, yazı sıcak', color: 'rgb(200, 255, 80)'  },
  15: { code: 'Cfb', name: 'Ilıman, her mevsim yağışlı, yazı ılık',  color: 'rgb(100, 255, 80)'  },
  16: { code: 'Cfc', name: 'Ilıman, her mevsim yağışlı, yazı soğuk', color: 'rgb(50, 200, 0)'    },
  17: { code: 'Dsa', name: 'Soğuk, yazı kurak ve sıcak',             color: 'rgb(255, 0, 255)'    },
  18: { code: 'Dsb', name: 'Soğuk, yazı kurak ve ılık',              color: 'rgb(200, 0, 200)'    },
  19: { code: 'Dsc', name: 'Soğuk, yazı kurak ve soğuk',             color: 'rgb(150, 50, 150)'   },
  20: { code: 'Dsd', name: 'Soğuk, yazı kurak, çok soğuk kış',       color: 'rgb(150, 100, 150)'  },
  21: { code: 'Dwa', name: 'Soğuk, kışı kurak, yazı sıcak',          color: 'rgb(170, 175, 255)'  },
  22: { code: 'Dwb', name: 'Soğuk, kışı kurak, yazı ılık',           color: 'rgb(90, 120, 220)'   },
  23: { code: 'Dwc', name: 'Soğuk, kışı kurak, yazı soğuk',          color: 'rgb(75, 80, 180)'    },
  24: { code: 'Dwd', name: 'Soğuk, kışı kurak, çok soğuk kış',       color: 'rgb(50, 0, 135)'     },
  25: { code: 'Dfa', name: 'Soğuk, her mevsim yağışlı, yazı sıcak',  color: 'rgb(0, 255, 255)'   },
  26: { code: 'Dfb', name: 'Soğuk, her mevsim yağışlı, yazı ılık',   color: 'rgb(55, 200, 255)'  },
  27: { code: 'Dfc', name: 'Soğuk, her mevsim yağışlı, yazı soğuk',  color: 'rgb(0, 125, 125)'   },
  28: { code: 'Dfd', name: 'Soğuk, her mevsim yağışlı, çok soğuk kış', color: 'rgb(0, 70, 95)'  },
  29: { code: 'ET',  name: 'Kutup, tundra',                           color: 'rgb(178, 178, 178)'  },
  30: { code: 'EF',  name: 'Kutup, buzul',                            color: 'rgb(102, 102, 102)'  },
};

const YEARS = [1930, 1960, 1990, 2020, 2070, 2099];

/* ─────────────────────────────────────────────────────────────────────────────
   RasterLayer
   - useEffect dependency array intentionally EMPTY
   - key={raster.year} on parent guarantees full remount on year change
   - No race conditions possible: each mount creates exactly one layer
   ───────────────────────────────────────────────────────────────────────────── */
function RasterLayer({ georaster }: { georaster: any }) {
  const map = useMap();

  useEffect(() => {
    let addedLayer: any = null;
    let cancelled = false;

    (async () => {
      const GeoRasterLayer = (await import('georaster-layer-for-leaflet')).default;
      if (cancelled) return;

      addedLayer = new (GeoRasterLayer as any)({
        georaster,
        opacity: 0.8,
        pixelValuesToColorFn: (values: number[]) =>
          climateLegend[values[0]]?.color ?? 'transparent',
        resolution: 256,
      });
      addedLayer.addTo(map);
    })();

    return () => {
      cancelled = true;
      if (addedLayer) {
        map.removeLayer(addedLayer);
        addedLayer = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

/* ─── Atomic state: year + georaster always in sync ─── */
interface RasterState { year: number; georaster: any; }

export default function IklimTurleriActivity({ onClose }: { onClose: () => void }) {
  const [raster,     setRaster]     = useState<RasterState | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [activeYear, setActiveYear] = useState<number>(1930);

  const abortRef = useRef<AbortController | null>(null);

  const loadRaster = useCallback(async (year: number) => {
    if (year === raster?.year && !loading) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setActiveYear(year);
    setLoading(true);
    setError(null);

    try {
      const parseGeoraster = (await import('georaster')).default;

      const res = await fetch(
        `/maps/climate/${year}Koppen_geiger.tif`,
        { signal: ctrl.signal, cache: 'no-store' }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${year} verisi alınamadı`);

      const buf = await res.arrayBuffer();
      if (ctrl.signal.aborted) return;

      const georaster = await parseGeoraster(buf);
      if (ctrl.signal.aborted) return;

      // Atomic update: key and georaster change together
      setRaster({ year, georaster });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Raster yükleme hatası:', err);
      setError(err.message ?? 'Bilinmeyen hata');
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [raster?.year, loading]);

  useEffect(() => {
    loadRaster(1930);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col bg-slate-950 text-slate-100 overflow-hidden">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b border-white/10 bg-slate-900/95 gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-all">
            <ArrowLeft className="text-white" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">İklim Türleri Analizi</h1>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {YEARS.map((year) => (
            <button
              key={year}
              onClick={() => loadRaster(year)}
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeYear === year
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]'
                  : 'bg-slate-800 border-white/5 text-slate-400 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative bg-slate-900">

        {loading && (
          <div className="absolute inset-0 z-[1000] bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 pointer-events-none">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-sm font-medium text-indigo-200 uppercase tracking-widest">
              {activeYear} yükleniyor…
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] bg-red-900/80 border border-red-500/40 text-red-200 text-xs px-4 py-2 rounded-xl backdrop-blur-sm">
            ⚠️ {error}
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
            key={raster.year}:
            When year changes → old RasterLayer unmounts (cleanup removes layer)
                              → new RasterLayer mounts (adds new layer)
            Zero chance of the wrong layer staying on the map.
          */}
          {raster && <RasterLayer key={raster.year} georaster={raster.georaster} />}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-6 right-6 z-[2000] w-72 md:w-80 bg-slate-950/90 border border-white/10 rounded-2xl flex flex-col shadow-2xl max-h-[70vh] backdrop-blur-md">
          <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <MapIcon size={14} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                Köppen İklim Sınıflandırması
              </span>
            </div>
            <span className="text-[10px] font-bold text-indigo-400">{activeYear}</span>
          </div>
          <div className="p-3 overflow-y-auto space-y-1">
            {Object.entries(climateLegend).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 hover:bg-white/5 px-1 py-1 rounded-lg transition-colors group">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: v.color }} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-slate-200 group-hover:text-white">{v.code}</span>
                  <span className="text-[9px] text-slate-500 group-hover:text-slate-400 leading-tight">{v.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}