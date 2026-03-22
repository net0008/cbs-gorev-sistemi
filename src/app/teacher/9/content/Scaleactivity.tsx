"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Tipler ───────────────────────────────────────────────────────────────────
type Tab       = "learn" | "measure" | "convert" | "test";
type ScaleType = "fraction" | "line";

// ─── Ses (Beep Yardımcıları) ──────────────────────────────────────────────────
function beep(f: number, d: number, t: OscillatorType = "sine", v = 0.18) {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = f; o.type = t;
    g.gain.setValueAtTime(v, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d);
    o.start(); o.stop(ctx.currentTime + d);
    setTimeout(() => ctx.close(), d * 1000 + 200);
  } catch (_) {}
}
const sndClick = () => beep(600, 0.08, "square", 0.07);

// ─── Veri (Ölçekler ve Şehirler) ──────────────────────────────────────────────
const SCALES = [
  { label: "1/25.000",    value: 25000,    desc: "1 cm = 250 m"  },
  { label: "1/100.000",   value: 100000,   desc: "1 cm = 1 km"   },
  { label: "1/500.000",   value: 500000,   desc: "1 cm = 5 km"   },
  { label: "1/1.000.000", value: 1000000,  desc: "1 cm = 10 km"  },
];

// Şehir listesi (Ölçüm Yap sekmesi için)
interface City { id: string; name: string; lon: number; lat: number; }
const CITIES: City[] = [
  { id: "ankara", name: "Ankara", lon: 32.8597, lat: 39.9334 },
  { id: "istanbul", name: "İstanbul", lon: 28.9784, lat: 41.0082 },
  { id: "izmir", name: "İzmir", lon: 27.1428, lat: 38.4237 },
  { id: "antalya", name: "Antalya", lon: 30.7133, lat: 36.8841 },
  { id: "erzurum", name: "Erzurum", lon: 41.2707, lat: 39.9043 },
];

export default function ScaleActivity({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("learn");
  const [selScale, setSelScale] = useState(1000000);
  const [cityA, setCityA] = useState<City | null>(null);
  const [cityB, setCityB] = useState<City | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const lineRef = useRef<any>(null);

  // ─── Leaflet Harita Başlatma ───────────────────────────────────────────────
  useEffect(() => {
    // Leaflet kütüphanesini dinamik olarak yükle
    const linkEl = document.createElement("link");
    linkEl.rel = "stylesheet";
    linkEl.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(linkEl);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [39.0, 35.5], // Türkiye merkezi
        zoom: 6,
        zoomControl: false, // UI üzerine binmesin diye kapalı
        scrollWheelZoom: false,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      // Şehirleri işaretle
      CITIES.forEach(city => {
        const marker = L.circleMarker([city.lat, city.lon], {
          radius: 8, color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.8
        }).addTo(map);
        
        marker.on("click", () => handleCityClick(city));
        markersRef.current.push(marker);
      });
    };
    document.head.appendChild(script);

    return () => {
      if (mapRef.current) mapRef.current.remove();
    };
  }, []);

  const handleCityClick = (city: City) => {
    sndClick();
    if (!cityA || (cityA && cityB)) {
      setCityA(city);
      setCityB(null);
    } else {
      setCityB(city);
      drawLine(cityA, city);
    }
  };

  const drawLine = (a: City, b: City) => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;
    if (lineRef.current) lineRef.current.remove();
    lineRef.current = L.polyline([[a.lat, a.lon], [b.lat, b.lon]], {
      color: "#fbbf24", weight: 3, dashArray: "10, 10"
    }).addTo(mapRef.current);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#07111e", display: "flex", flexDirection: "column" }}>
      
      {/* ─── ARKA PLAN HARİTASI (Leaflet) ─── */}
      <div ref={mapContainerRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />

      {/* ─── ÜST BAR (Overlay) ─── */}
      <header style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: "64px", background: "rgba(3,7,18,0.85)", backdropFilter: "blur(4px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <h2 style={{ color: "#fbbf24", fontSize: "18px", fontWeight: "800" }}>HARİTA ÖLÇEĞİ</h2>
          <div style={{ display: "flex", gap: "5px", background: "rgba(0,0,0,0.5)", padding: "4px", borderRadius: "8px" }}>
            {["learn", "measure", "convert", "test"].map(t => (
              <button key={t} onClick={() => setTab(t as Tab)} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: tab === t ? "#d97706" : "transparent", color: "white", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}>
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose} style={{ color: "#ff7070", background: "transparent", border: "1px solid #ff7070", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" }}>✕ KAPAT</button>
      </header>

      {/* ─── ETKİLEŞİM PANELLERİ (Overlay) ─── */}
      <main style={{ position: "relative", zIndex: 5, flex: 1, display: "flex", pointerEvents: "none" }}>
        
        {/* Sol Panel: Kontroller */}
        <div style={{ width: "320px", background: "rgba(4,9,22,0.9)", margin: "20px", borderRadius: "16px", padding: "24px", pointerEvents: "auto", border: "1px solid rgba(251,191,36,0.2)" }}>
           {tab === "measure" ? (
             <div>
               <h3 style={{ color: "#fbbf24", marginBottom: "16px" }}>Mesafe Ölçümü</h3>
               <p style={{ color: "#a08060", fontSize: "14px", marginBottom: "20px" }}>Harita üzerinde iki şehir seçerek gerçek mesafeyi hesaplayın.</p>
               
               <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                 {SCALES.map(s => (
                   <button key={s.value} onClick={() => setSelScale(s.value)} style={{ padding: "10px", textAlign: "left", borderRadius: "8px", border: "1px solid", borderColor: selScale === s.value ? "#fbbf24" : "#333", background: selScale === s.value ? "#fbbf2422" : "transparent", color: "white", cursor: "pointer" }}>
                     {s.label}
                   </button>
                 ))}
               </div>

               {cityA && cityB && (
                 <div style={{ marginTop: "20px", padding: "15px", background: "#10b98122", borderRadius: "10px", border: "1px solid #10b98155" }}>
                   <div style={{ color: "#10b981", fontWeight: "700" }}>SONUÇ</div>
                   <div style={{ color: "white", fontSize: "20px" }}>{cityA.name} - {cityB.name}</div>
                   <div style={{ color: "#fbbf24", fontSize: "24px", fontWeight: "800" }}>~ 450 km</div>
                 </div>
               )}
             </div>
           ) : (
             <div style={{ color: "white" }}>Diğer sekmeler burada görüntülenecek...</div>
           )}
        </div>
      </main>

    </div>
  );
}