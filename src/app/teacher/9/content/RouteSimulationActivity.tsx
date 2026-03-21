"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// KESİN KALİBRASYON — QGIS SVG grid çizgilerinden ölçüldü + resimle doğrulandı
//
// SVG viewBox: 0 0 841 595
// Harita transform: matrix(0.998943, 0, 0, 0.998943, 57.5051, 95.8146)
// İç harita boyutu: 727 × 393 piksel
//
// Grid çizgileri (resimden okundu):
//   Dikey (boylam): -120°,-90°,-60°,-30°,0°,30°,60°,90°,120° → 30° aralık
//   Yatay (enlem):   60°N, 30°N, 0°, 30°S, 60°S              → 30° aralık
//
// İç koordinatlar (SVG dosyasından ölçüldü):
//   v_inner = [69.473, 144.443, 219.414, 294.384, 369.354, 444.324, 519.295, 594.265, 669.235]
//   h_inner = [59.994, 134.965, 209.935, 284.905, 359.875]
//
// Ölçek:  30° / 74.970px = 0.400159°/px  (hem enlem hem boylam — kare projeksiyon)
//
// Sol kenar boylamı  = -120° - 69.473px × 0.400159°/px = -147.800°
// Üst kenar enlemi   =  60°N + 59.994px × 0.400159°/px =  84.007°N
//
// DOĞRULAMA:
//   0°,0°  → inner(369.35, 209.94) → SVG(426.47, 305.53) ✓
//   30°E,30°N → inner(444.32, 134.97) → SVG(501.36, 230.64) ✓
//   -120°W,60°N → inner(69.47, 59.99) → SVG(126.90, 155.75) ✓
//   -120°W,-60°S → inner(69.47, 359.88) → SVG(126.90, 455.31) ✓
// ═══════════════════════════════════════════════════════════════════════════════

const MAP = {
  SVG_W: 841,
  SVG_H: 595,
  OX: 57.5051,      // harita sol-üst SVG x
  OY: 95.8146,      // harita sol-üst SVG y
  SC: 0.998943,     // ölçek faktörü
  DEG_PX: 0.400159, // °/inner-piksel (30° / 74.970px)
  LON_L: -147.8003, // harita sol kenar boylamı
  LAT_T: 84.0073,   // harita üst kenar enlemi
} as const;

/**
 * Coğrafi koordinat → SVG viewBox koordinatı (841×595 içinde)
 */
function geoToSVG(lon: number, lat: number): { x: number; y: number } {
  const ix = (lon - MAP.LON_L) / MAP.DEG_PX;          // inner x piksel
  const iy = (MAP.LAT_T - lat) / MAP.DEG_PX;          // inner y piksel
  return {
    x: MAP.OX + ix * MAP.SC,   // SVG x
    y: MAP.OY + iy * MAP.SC,   // SVG y
  };
}

/**
 * SVG koordinat (841×595) → container render piksel
 * Container boyutu değişkendir (responsive).
 */
function svgToRender(
  svgX: number, svgY: number,
  cw: number, ch: number
): { x: number; y: number } {
  return {
    x: (svgX / MAP.SVG_W) * cw,
    y: (svgY / MAP.SVG_H) * ch,
  };
}

// ─── Combobox seçenekleri (30°'nin katları, harita içi değerler) ──────────────
// Boylam: 120°B → 120°D, 30° adım
const LON_OPTIONS: number[] = [];
for (let l = -120; l <= 120; l += 30) LON_OPTIONS.push(l);
// → [-120, -90, -60, -30, 0, 30, 60, 90, 120]

// Enlem: 60°K → 60°G, 30° adım (tüm değerler harita içinde ✓)
const LAT_OPTIONS: number[] = [];
for (let l = 60; l >= -60; l -= 30) LAT_OPTIONS.push(l);
// → [60, 30, 0, -30, -60]

// Hedef havuzu: tüm kesişim noktaları
type Coord = { lon: number; lat: number };
const ALL_TARGETS: Coord[] = [];
for (const lat of LAT_OPTIONS) {
  for (const lon of LON_OPTIONS) {
    ALL_TARGETS.push({ lon, lat });
  }
}

// ─── Ses ─────────────────────────────────────────────────────────────────────
function beep(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.22) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.frequency.value = freq; osc.type = type;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
    setTimeout(() => ctx.close(), dur * 1000 + 200);
  } catch (_) {}
}
const sndFlag   = () => { beep(880, 0.07, "square", 0.09); setTimeout(() => beep(1100, 0.1, "square", 0.07), 90); };
const sndOK     = () => [440, 554, 660, 880].forEach((f, i) => setTimeout(() => beep(f, 0.28, "sine", 0.18), i * 110));
const sndFail   = () => { beep(220, 0.4, "sawtooth", 0.16); setTimeout(() => beep(150, 0.32, "sawtooth", 0.12), 130); };
const sndLaunch = () => { beep(280, 0.08, "square", 0.12); setTimeout(() => beep(560, 0.12, "square", 0.09), 70); setTimeout(() => beep(840, 0.16, "square", 0.07), 165); };

// ─── Tipler ──────────────────────────────────────────────────────────────────
type Phase = "idle" | "flying" | "success" | "fail" | "done";
interface TrailPt { x: number; y: number; }

// ─── Yardımcı: koordinat etiket formatı ──────────────────────────────────────
function fmtLon(l: number) {
  if (l === 0) return "0°";
  return `${Math.abs(l)}° ${l < 0 ? "Batı (W)" : "Doğu (E)"}`;
}
function fmtLat(l: number) {
  if (l === 0) return "0° (Ekvator)";
  return `${Math.abs(l)}° ${l > 0 ? "Kuzey (N)" : "Güney (S)"}`;
}
function shortLon(l: number) { return l === 0 ? "0°" : `${Math.abs(l)}°${l < 0 ? "B" : "D"}`; }
function shortLat(l: number) { return l === 0 ? "0°" : `${Math.abs(l)}°${l > 0 ? "K" : "G"}`; }

// ═══════════════════════════════════════════════════════════════════════════════
// ANA BİLEŞEN
// ═══════════════════════════════════════════════════════════════════════════════
export default function RouteSimulationActivity({ onClose }: { onClose: () => void }) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(0);
  const [ch, setCh] = useState(0);
  const animRef = useRef<number | null>(null);
  const initialized = useRef(false);

  // Oyun state
  const [phase, setPhase]     = useState<Phase>("idle");
  const [mission, setMission] = useState(0);
  const [score, setScore]     = useState(0);
  const [history, setHistory] = useState<Array<"ok" | "fail">>([]);
  const [target, setTarget]   = useState<Coord>({ lon: 0, lat: 0 });
  const [selLon, setSelLon]   = useState("");
  const [selLat, setSelLat]   = useState("");
  const [feedback, setFeedback] = useState("");

  // Drone render pikselleri
  const [droneX, setDroneX] = useState(0);
  const [droneY, setDroneY] = useState(0);
  const [droneAngle, setDroneAngle] = useState(0);
  const [trail, setTrail]   = useState<TrailPt[]>([]);

  // Animasyon
  const [propA, setPropA]   = useState(0);
  const [pulse, setPulse]   = useState(1.0);

  // Container boyut ölçümü (ResizeObserver)
  const measure = useCallback(() => {
    if (mapDivRef.current) {
      setCw(mapDivRef.current.clientWidth);
      setCh(mapDivRef.current.clientHeight);
    }
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (mapDivRef.current) ro.observe(mapDivRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // Pervane dönsün
  useEffect(() => {
    let id: number;
    const tick = () => { setPropA((a) => (a + 20) % 360); id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  // Pulse efekti
  useEffect(() => {
    let dir = 1;
    const t = setInterval(() => {
      setPulse((p) => {
        const n = p + dir * 0.04;
        if (n >= 1.65) dir = -1;
        if (n <= 1.0)  dir = 1;
        return n;
      });
    }, 33);
    return () => clearInterval(t);
  }, []);

  // ── Yeni görev başlat ─────────────────────────────────────────────────────
  const startMission = useCallback((idx: number) => {
    if (!cw || !ch) return;

    // Rastgele hedef seç
    const t = ALL_TARGETS[Math.floor(Math.random() * ALL_TARGETS.length)];
    setTarget(t);
    setSelLon("");
    setSelLat("");
    setFeedback("");
    setTrail([]);
    setPhase("idle");
    setMission(idx);
    sndFlag();

    // Drone başlangıç konumu: sol-alt bölgede sabit bir nokta (-100°W, -45°S)
    const homeSVG = geoToSVG(-100, -45);
    const homeR   = svgToRender(homeSVG.x, homeSVG.y, cw, ch);
    setDroneX(homeR.x);
    setDroneY(homeR.y);
    setDroneAngle(0);
  }, [cw, ch]);

  // İlk görev — cw/ch hazır olunca
  useEffect(() => {
    if (cw > 0 && ch > 0 && !initialized.current) {
      initialized.current = true;
      startMission(0);
    }
  }, [cw, ch, startMission]);

  // ── Drone'u gönder ────────────────────────────────────────────────────────
  const sendDrone = useCallback(() => {
    if (phase === "flying" || !selLon || !selLat) return;

    const gLon = Number(selLon);
    const gLat = Number(selLat);

    // Hedef render pikseli
    const destSVG = geoToSVG(gLon, gLat);
    const destR   = svgToRender(destSVG.x, destSVG.y, cw, ch);

    // Uçuş açısı
    const dx = destR.x - droneX;
    const dy = destR.y - droneY;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    setDroneAngle(angle);
    setPhase("flying");
    sndLaunch();

    const sx = droneX, sy = droneY;
    const STEPS = 100;
    let step = 0;
    const pts: TrailPt[] = [];

    const tick = () => {
      step++;
      const t = step / STEPS;
      // ease in-out cubic
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const cx = sx + (destR.x - sx) * e;
      const cy = sy + (destR.y - sy) * e;
      setDroneX(cx);
      setDroneY(cy);
      pts.push({ x: cx, y: cy });
      setTrail([...pts]);

      if (step < STEPS) {
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      // Varış
      setDroneX(destR.x);
      setDroneY(destR.y);

      const correct = gLon === target.lon && gLat === target.lat;
      if (correct) {
        setPhase("success");
        setScore((s) => s + 20);
        setHistory((h) => [...h, "ok"]);
        setFeedback(`✓ Harika! ${shortLat(gLat)} — ${shortLon(gLon)} doğru koordinat! +20 puan`);
        sndOK();
      } else {
        setPhase("fail");
        setScore((s) => Math.max(0, s - 5));
        setHistory((h) => [...h, "fail"]);
        setFeedback(`✗ Yanlış! Drone ${shortLat(gLat)}-${shortLon(gLon)}'ye gitti. Bayrağı tekrar incele. −5 puan`);
        sndFail();
      }
    };

    animRef.current = requestAnimationFrame(tick);
  }, [phase, selLon, selLat, cw, ch, droneX, droneY, target]);

  // ── Sonraki görev ─────────────────────────────────────────────────────────
  const nextMission = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (mission >= 4) { setPhase("done"); return; }
    startMission(mission + 1);
  }, [mission, startMission]);

  // Hedef render pikseli
  const tSVG = geoToSVG(target.lon, target.lat);
  const tR   = cw > 0 ? svgToRender(tSVG.x, tSVG.y, cw, ch) : { x: 0, y: 0 };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "#060c18",
        display: "flex", flexDirection: "column",
        fontFamily: "'Courier New', monospace",
        touchAction: "none", userSelect: "none",
        WebkitUserSelect: "none", overscrollBehavior: "none",
      }}
      onWheel={(e) => e.preventDefault()}
    >
      {/* ── Üst bar ──────────────────────────────────────────────────────── */}
      <TopBar
        mission={mission} history={history} phase={phase}
        score={score} onClose={onClose}
      />

      {/* ── Orta: harita + sağ panel ─────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* Harita alanı */}
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "10px", overflow: "hidden" }}>
          {/*
            Container div: aspect ratio = 841/595 = 1.4134
            Haritanın oranını koruyarak maks boyuta gerilir.
          */}
          <div
            ref={mapDivRef}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: `min(100%, calc((100vh - 80px) * ${MAP.SVG_W / MAP.SVG_H}))`,
              aspectRatio: `${MAP.SVG_W} / ${MAP.SVG_H}`,
              border: "1px solid rgba(0,200,255,0.15)",
              borderRadius: "6px",
              overflow: "hidden",
              boxShadow: "0 0 50px rgba(0,80,180,0.1)",
            }}
          >
            {/* SVG harita resmi */}
            <img
              src="/9/harita/dunya_koordinat.svg"
              alt="Dünya koordinat haritası"
              draggable={false}
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: "fill", display: "block",
                pointerEvents: "none",
              }}
            />

            {/* Oyun katmanı — render piksel koordinatlarında */}
            {cw > 0 && (
              <svg
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
                viewBox={`0 0 ${cw} ${ch}`}
              >
                {/* Trail */}
                {trail.length > 1 && (
                  <polyline
                    points={trail.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke="#00aaff"
                    strokeWidth="1.6"
                    strokeDasharray="5,4"
                    strokeLinecap="round"
                    opacity="0.65"
                  />
                )}

                {/* Hedef */}
                <TargetMarker x={tR.x} y={tR.y} pulse={pulse} hit={phase === "success"} />

                {/* Drone */}
                <DroneMarker x={droneX} y={droneY} heading={droneAngle} propA={propA} />
              </svg>
            )}

            {/* Tamamlama ekranı */}
            {phase === "done" && <DoneOverlay score={score} onClose={onClose} />}
          </div>
        </div>

        {/* ── Sağ kontrol paneli ─────────────────────────────────────────── */}
        <ControlPanel
          selLon={selLon} selLat={selLat}
          onLonChange={setSelLon} onLatChange={setSelLat}
          phase={phase} feedback={feedback}
          mission={mission}
          onSend={sendDrone} onNext={nextMission}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALT BİLEŞENLER
// ═══════════════════════════════════════════════════════════════════════════════

function TopBar({ mission, history, phase, score, onClose }: {
  mission: number; history: Array<"ok"|"fail">; phase: Phase; score: number; onClose: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 20px", borderBottom: "1px solid rgba(0,200,255,0.09)", background: "rgba(0,0,0,0.32)", flexShrink: 0, gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#00c8ff", opacity: 0.6 }}>COĞRAFİ KOORDİNAT</div>
          <div style={{ fontSize: "16px", fontWeight: "800", color: "#d0e8ff", lineHeight: 1.2 }}>Drone Simülasyonu</div>
        </div>
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ width: "24px", height: "5px", borderRadius: "3px", transition: "background 0.3s", background: i < history.length ? (history[i] === "ok" ? "#00ff88" : "#ff4444") : i === mission && phase !== "idle" ? "rgba(0,200,255,0.45)" : "rgba(255,255,255,0.07)" }} />
          ))}
          <span style={{ fontSize: "10px", color: "#1e3a52", marginLeft: "5px" }}>{mission + 1} / 5</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#1e3a52" }}>PUAN</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: score > 0 ? "#00ff88" : "#d0e8ff", lineHeight: 1, transition: "color 0.3s" }}>{score}</div>
        </div>
        <button
          onClick={onClose}
          style={{ padding: "6px 14px", background: "transparent", border: "1px solid rgba(255,80,80,0.32)", borderRadius: "6px", color: "#ff7070", fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,80,80,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >✕ KAPAT</button>
      </div>
    </div>
  );
}

// ─── Hedef işareti ────────────────────────────────────────────────────────────
function TargetMarker({ x, y, pulse, hit }: { x: number; y: number; pulse: number; hit: boolean }) {
  const c = hit ? "#00ff88" : "#ff3333";
  const c2 = hit ? "#00cc66" : "#ff5555";
  return (
    <g>
      {/* Dışa yayılan radar halkaları */}
      <circle cx={x} cy={y} r={26 * pulse} fill="none" stroke={c} strokeWidth="0.7" opacity={0.3 / pulse} />
      <circle cx={x} cy={y} r={16 * pulse} fill="none" stroke={c} strokeWidth="1.1" opacity={0.5 / pulse} />
      {/* Artı nişan */}
      <line x1={x-14} y1={y}    x2={x-5}  y2={y}    stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <line x1={x+5}  y1={y}    x2={x+14} y2={y}    stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <line x1={x}    y1={y-14} x2={x}    y2={y-5}  stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <line x1={x}    y1={y+5}  x2={x}    y2={y+14} stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      {/* Merkez daire */}
      <circle cx={x} cy={y} r={4} fill={c} opacity="0.9" />
      {/* Bayrak direği */}
      <line x1={x} y1={y} x2={x} y2={y - 28} stroke={c2} strokeWidth="1.8" strokeLinecap="round" />
      {/* Bayrak */}
      <polygon points={`${x},${y-28} ${x+16},${y-21} ${x},${y-14}`} fill={c} opacity="0.93" />
      {/* Başarı parlama */}
      {hit && <>
        <circle cx={x} cy={y} r={20} fill="none" stroke="#00ff88" strokeWidth="2" opacity="0.35" />
        <circle cx={x} cy={y} r={30} fill="none" stroke="#00ff88" strokeWidth="1" opacity="0.18" />
      </>}
    </g>
  );
}

// ─── Drone — gerçekçi top-down multi-rotor ────────────────────────────────────
function DroneMarker({ x, y, heading, propA }: { x: number; y: number; heading: number; propA: number }) {
  // 4 kol: ön-sağ (+45°), ön-sol (+135°), arka-sol (+225°), arka-sağ (+315°)
  const arms = [45, 135, 225, 315];
  const ARM_LEN = 14;

  return (
    <g transform={`translate(${x},${y}) rotate(${heading})`}>
      {/* Gölge (zemin hissi) */}
      <ellipse rx="12" ry="7" fill="rgba(0,0,0,0.22)" transform="translate(2,18)" />

      {/* Kollar */}
      {arms.map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const ax = Math.cos(rad) * ARM_LEN;
        const ay = Math.sin(rad) * ARM_LEN;
        const motorColor = i < 2 ? "#1a6fff" : "#ff3333"; // ön mavi, arka kırmızı
        const rot = i % 2 === 0 ? propA : -propA;
        return (
          <g key={i}>
            {/* Kol gövdesi */}
            <line x1={0} y1={0} x2={ax} y2={ay} stroke="#162840" strokeWidth="3" strokeLinecap="round" />
            {/* Motor evi */}
            <circle cx={ax} cy={ay} r={4.5} fill="#0c1826" stroke={motorColor} strokeWidth="1.4" />
            {/* Pervane (dönen) */}
            <g transform={`translate(${ax},${ay}) rotate(${rot})`}>
              <ellipse rx="7.5" ry="1.8" fill={motorColor === "#1a6fff" ? "#2266cc" : "#cc2222"} opacity="0.78" />
              <ellipse rx="1.8" ry="7.5" fill={motorColor === "#1a6fff" ? "#2266cc" : "#cc2222"} opacity="0.78" />
            </g>
            {/* Motor LED */}
            <circle cx={ax} cy={ay} r={1.4} fill={motorColor} opacity="0.95" />
          </g>
        );
      })}

      {/* Ana gövde — hex şekli */}
      <polygon
        points="-9,0 -5,-8 5,-8 9,0 5,8 -5,8"
        fill="#0e1e38"
        stroke="#00c8ff"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Gövde iç detay */}
      <polygon points="-5,0 -3,-4 3,-4 5,0 3,4 -3,4" fill="#162840" />
      {/* Kamera / optik */}
      <circle r="2.8" fill="#00c8ff" opacity="0.55" />
      <circle r="1.2" fill="#ffffff" opacity="0.5" />
      {/* Ön göstergesi (küçük ok) */}
      <polygon points="0,-11 -3,-6 3,-6" fill="#00c8ff" opacity="0.6" />
      {/* İniş ayakları */}
      <line x1="-7" y1="7"  x2="-7" y2="11" stroke="#162840" strokeWidth="1.2" />
      <line x1="7"  y1="7"  x2="7"  y2="11" stroke="#162840" strokeWidth="1.2" />
      <line x1="-10" y1="11" x2="10" y2="11" stroke="#162840" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  );
}

// ─── Tamamlama ekranı ─────────────────────────────────────────────────────────
function DoneOverlay({ score, onClose }: { score: number; onClose: () => void }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(4,10,22,0.93)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px" }}>
      <div style={{ fontSize: "52px" }}>🎯</div>
      <div style={{ fontSize: "20px", fontWeight: "800", color: "#00ff88", letterSpacing: "-0.3px" }}>TÜM GÖREVLER TAMAMLANDI</div>
      <div style={{ fontSize: "40px", fontWeight: "800", color: "#00c8ff" }}>{score} PUAN</div>
      <div style={{ fontSize: "13px", color: "#2a4a65", letterSpacing: "0.5px", textAlign: "center", maxWidth: "340px" }}>
        {score >= 80 ? "🏆 MÜKEMMEL — Koordinat ustası!" : score >= 50 ? "👍 İYİ — Biraz daha pratik yap." : "📚 TEKRAR DENEYELİM — Haritayı dikkatli incele!"}
      </div>
      <button
        onClick={onClose}
        style={{ marginTop: "6px", padding: "10px 26px", background: "linear-gradient(90deg,#00c8ff,#0055ff)", border: "none", borderRadius: "7px", color: "#000", fontSize: "13px", fontWeight: "800", letterSpacing: "1.5px", cursor: "pointer", fontFamily: "inherit" }}
      >ANA MENÜYE DÖN</button>
    </div>
  );
}

// ─── Kontrol paneli ───────────────────────────────────────────────────────────
function ControlPanel({ selLon, selLat, onLonChange, onLatChange, phase, feedback, mission, onSend, onNext }: {
  selLon: string; selLat: string;
  onLonChange: (v: string) => void; onLatChange: (v: string) => void;
  phase: Phase; feedback: string; mission: number;
  onSend: () => void; onNext: () => void;
}) {
  const flying = phase === "flying";
  const fbColor = phase === "success" ? "#00ff88" : phase === "fail" ? "#ff7070" : "#ffc040";
  const fbBg    = phase === "success" ? "rgba(0,255,136,0.06)" : phase === "fail" ? "rgba(255,80,80,0.06)" : "rgba(255,180,0,0.06)";
  const fbBdr   = phase === "success" ? "rgba(0,255,136,0.18)" : phase === "fail" ? "rgba(255,80,80,0.18)" : "rgba(255,180,0,0.18)";

  return (
    <div style={{ width: "268px", flexShrink: 0, borderLeft: "1px solid rgba(0,200,255,0.07)", background: "rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", padding: "16px", gap: "13px", overflowY: "auto" }}>

      {/* Talimat */}
      <div style={{ padding: "11px 12px", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(0,200,255,0.09)", borderRadius: "7px" }}>
        <Lbl>GÖREV TALİMATI</Lbl>
        <p style={{ fontSize: "12px", color: "#2a4a6a", lineHeight: "1.75", margin: 0 }}>
          Haritadaki <span style={{ color: "#ff4444" }}>kırmızı bayrağı</span> bul. Hangi enlem ve boylamın kesişiminde olduğunu analiz et. Aşağıdan seç ve drone&apos;u gönder.
        </p>
      </div>

      {/* Boylam seçimi */}
      <div>
        <Lbl>BOYLAM</Lbl>
        <Sel
          value={selLon}
          onChange={onLonChange}
          disabled={flying}
          placeholder="— Boylam seç —"
          opts={LON_OPTIONS.map((l) => ({ v: String(l), label: fmtLon(l) }))}
        />
      </div>

      {/* Enlem seçimi */}
      <div>
        <Lbl>ENLEM</Lbl>
        <Sel
          value={selLat}
          onChange={onLatChange}
          disabled={flying}
          placeholder="— Enlem seç —"
          opts={LAT_OPTIONS.map((l) => ({ v: String(l), label: fmtLat(l) }))}
        />
      </div>

      {/* Gönder butonu */}
      <button
        onClick={onSend}
        disabled={flying || !selLon || !selLat}
        style={{
          width: "100%", padding: "12px",
          background: flying || !selLon || !selLat ? "rgba(0,30,60,0.3)" : "linear-gradient(90deg,#0050e0,#00c8ff)",
          border: "none", borderRadius: "8px",
          color: flying || !selLon || !selLat ? "#1a3040" : "#000",
          fontSize: "12px", fontWeight: "800", letterSpacing: "2px",
          cursor: flying || !selLon || !selLat ? "not-allowed" : "pointer",
          fontFamily: "inherit", transition: "all 0.2s",
        }}
      >
        {flying ? "🚁 UÇUŞTA..." : "🚁 DRONE'U GÖNDER"}
      </button>

      {/* Geri bildirim */}
      {feedback && (
        <div style={{ padding: "10px 12px", background: fbBg, border: `1px solid ${fbBdr}`, borderRadius: "7px", fontSize: "11px", color: fbColor, lineHeight: "1.65" }}>
          {feedback}
        </div>
      )}

      {/* Sonraki görev */}
      {(phase === "success" || phase === "fail") && (
        <button
          onClick={onNext}
          style={{ width: "100%", padding: "10px", background: "transparent", border: "1px solid rgba(0,200,255,0.25)", borderRadius: "7px", color: "#00c8ff", fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,200,255,0.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          {mission >= 4 ? "SONUÇLARI GÖR →" : "SONRAKI GÖREV →"}
        </button>
      )}

      <div style={{ flex: 1 }} />

      {/* Puan tablosu */}
      <div style={{ padding: "11px 12px", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "7px" }}>
        <Lbl>PUAN SİSTEMİ</Lbl>
        <div style={{ fontSize: "11px", lineHeight: "2.1", color: "#1e3a52" }}>
          <div>✓ Doğru koordinat: <span style={{ color: "#00ff88" }}>+20 puan</span></div>
          <div>✗ Yanlış hamle: <span style={{ color: "#ff7070" }}>−5 puan</span></div>
          <div>📍 Maks. puan: <span style={{ color: "#00c8ff" }}>100 puan</span></div>
        </div>
      </div>

      <div style={{ fontSize: "10px", color: "#12243a", lineHeight: "1.5" }}>
        Boylam: 120°B – 120°D · Enlem: 60°K – 60°G
        <br />Adım: 30° (harita grid çizgileri)
      </div>
    </div>
  );
}

// ─── Küçük stil yardımcıları ──────────────────────────────────────────────────
function Lbl({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: "9px", letterSpacing: "2.5px", color: "#1a3a52", marginBottom: "7px" }}>{children}</div>;
}

function Sel({ value, onChange, disabled, placeholder, opts }: {
  value: string; onChange: (v: string) => void; disabled: boolean;
  placeholder: string; opts: { v: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        width: "100%", padding: "8px 10px",
        background: "rgba(0,8,22,0.85)",
        border: `1px solid ${value ? "rgba(0,200,255,0.32)" : "rgba(0,200,255,0.1)"}`,
        borderRadius: "6px",
        color: value ? "#c8e0ff" : "#1a3a52",
        fontSize: "12px", fontFamily: "'Courier New', monospace",
        cursor: disabled ? "not-allowed" : "pointer",
        outline: "none", transition: "border-color 0.2s",
      }}
    >
      <option value="">{placeholder}</option>
      {opts.map((o) => (
        <option key={o.v} value={o.v} style={{ background: "#0a1628", color: "#c8e0ff" }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}