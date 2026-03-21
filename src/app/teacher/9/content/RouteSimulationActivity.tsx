"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// HArita KALİBRASYON SABİTLERİ
// SVG viewBox: 0 0 841 595
// Harita çerçevesi: transform matrix(0.998943, 0, 0, 0.998943, 57.5051, 95.8146)
// İç harita boyutu: 727 × 393 piksel (harita koordinat sistemi)
//
// Ölçek analizi (grid çizgilerinden ölçüldü):
//   Dikey çizgiler (boylam) iç koordinatları: 69.47, 144.44, 219.41 ... 669.24
//   Yatay çizgiler (enlem) iç koordinatları: 59.99, 134.97, 209.94, 284.91, 359.88
//   Her iki yönde de eşit aralık: 74.97 iç piksel
//
//   Boylam ölçeği: 5. çizgi (x=369.35) = 0° Meridyen (Greenwich)
//   → lon_per_inner_px = 36°/74.97px = 0.48019°/px  (360°/10 bölme)
//   → Harita sol boylam = 0° - 369.35 × 0.48019 = -177.36°W
//
//   Enlem ölçeği: 1. çizgi (y=59.99) = 40°N, spacing = 20°/74.97px
//   → lat_per_inner_px = 20°/74.97px = 0.26677°/px
//   → Harita üst enlemi = 40° + 59.99 × 0.26677 = 56.00°N
// ═══════════════════════════════════════════════════════════════════════════════

const C = {
  SVG_W: 841,
  SVG_H: 595,
  MAP_OX: 57.5051,    // harita offset X (SVG koordinat)
  MAP_OY: 95.8146,    // harita offset Y (SVG koordinat)
  MAP_SC: 0.998943,   // harita ölçek faktörü
  MAP_IW: 727.0,      // iç genişlik (inner px)
  MAP_IH: 393.0,      // iç yükseklik (inner px)
  LON_PX: 0.48019,    // derece/inner piksel (boylam)
  LAT_PX: 0.26677,    // derece/inner piksel (enlem)
  LON_L: -177.3609,   // harita sol kenar boylamı
  LAT_T: 56.0048,     // harita üst kenar enlemi
} as const;

/** Coğrafi koordinat → SVG piksel (viewBox koordinatında) */
function geoToSVG(lon: number, lat: number): { x: number; y: number } {
  const ix = (lon - C.LON_L) / C.LON_PX;
  const iy = (C.LAT_T - lat) / C.LAT_PX;
  return {
    x: C.MAP_OX + ix * C.MAP_SC,
    y: C.MAP_OY + iy * C.MAP_SC,
  };
}

/** SVG piksel → render piksel (container'a göre) */
function svgToRender(
  svgX: number,
  svgY: number,
  containerW: number,
  containerH: number
): { x: number; y: number } {
  return {
    x: (svgX / C.SVG_W) * containerW,
    y: (svgY / C.SVG_H) * containerH,
  };
}

// ─── Oyun koordinat seçenekleri ───────────────────────────────────────────────
// Boylam: 120°W - 120°E, 20° adım
const LON_OPTIONS: number[] = [];
for (let l = -120; l <= 120; l += 20) LON_OPTIONS.push(l);

// Enlem: 40°S - 40°N, 20° adım (60° harita dışında kalıyor)
const LAT_OPTIONS: number[] = [];
for (let l = -40; l <= 40; l += 20) LAT_OPTIONS.push(l);

// Hedef havuzu: tüm geçerli kesişimler
type Coord = { lon: number; lat: number };
const TARGETS: Coord[] = [];
for (const lat of LAT_OPTIONS) {
  for (const lon of LON_OPTIONS) {
    TARGETS.push({ lon, lat });
  }
}

// ─── Web Audio Ses ─────────────────────────────────────────────────────────────
function beep(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.25) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start();
    osc.stop(ctx.currentTime + dur);
    setTimeout(() => ctx.close(), dur * 1000 + 200);
  } catch (_) {}
}
const sndFlag  = () => { beep(880, 0.08, "square", 0.1); setTimeout(() => beep(1100, 0.12, "square", 0.08), 90); };
const sndOK    = () => [440, 554, 660, 880].forEach((f, i) => setTimeout(() => beep(f, 0.3, "sine", 0.2), i * 110));
const sndFail  = () => { beep(220, 0.45, "sawtooth", 0.18); setTimeout(() => beep(160, 0.35, "sawtooth", 0.14), 140); };
const sndLaunch = () => { beep(300, 0.09, "square", 0.13); setTimeout(() => beep(600, 0.13, "square", 0.1), 75); setTimeout(() => beep(900, 0.18, "square", 0.08), 180); };

// ─── Tür tanımları ────────────────────────────────────────────────────────────
type Phase = "idle" | "flying" | "success" | "fail" | "done";

interface TrailPt { x: number; y: number }

// ─── Ana bileşen ──────────────────────────────────────────────────────────────
export default function RouteSimulationActivity({ onClose }: { onClose: () => void }) {
  // Container ref — harita SVG'nin render edildiği div
  const mapDivRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(0);
  const [ch, setCh] = useState(0);
  const animRef = useRef<number | null>(null);

  // Oyun state
  const [phase, setPhase] = useState<Phase>("idle");
  const [mission, setMission] = useState(0);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<Array<"ok" | "fail">>([]);
  const [target, setTarget] = useState<Coord>({ lon: 0, lat: 0 });
  const [selLon, setSelLon] = useState("");
  const [selLat, setSelLat] = useState("");
  const [feedback, setFeedback] = useState("");

  // Drone animasyon state
  const [droneRX, setDroneRX] = useState(0); // render piksel x
  const [droneRY, setDroneRY] = useState(0);
  const [droneAngle, setDroneAngle] = useState(0);
  const [trail, setTrail] = useState<TrailPt[]>([]);
  const [propA, setPropA] = useState(0); // pervane açısı

  // Pulse state
  const [pulse, setPulse] = useState(1.0);

  // Container boyutunu ölç
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

  // Pervane sürekli dönsün
  useEffect(() => {
    let id: number;
    const tick = () => { setPropA((a) => (a + 18) % 360); id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  // Pulse efekti
  useEffect(() => {
    let dir = 1;
    const t = setInterval(() => {
      setPulse((p) => {
        const n = p + dir * 0.045;
        if (n >= 1.6) dir = -1;
        if (n <= 1.0) dir = 1;
        return n;
      });
    }, 35);
    return () => clearInterval(t);
  }, []);

  // Yeni görev
  const startMission = useCallback(
    (mIdx: number) => {
      if (!cw || !ch) return;

      // Rastgele hedef seç
      const t = TARGETS[Math.floor(Math.random() * TARGETS.length)];
      setTarget(t);
      setSelLon("");
      setSelLat("");
      setFeedback("");
      setTrail([]);
      setPhase("idle");
      setMission(mIdx);
      sndFlag();

      // Drone başlangıç: sol-alt köşe yakınında bir nokta (80°W, 30°S)
      const homeSVG = geoToSVG(-80, -25);
      const homeR = svgToRender(homeSVG.x, homeSVG.y, cw, ch);
      setDroneRX(homeR.x);
      setDroneRY(homeR.y);
    },
    [cw, ch]
  );

  // İlk görev başlat (cw/ch hazır olunca)
  const initialized = useRef(false);
  useEffect(() => {
    if (cw > 0 && ch > 0 && !initialized.current) {
      initialized.current = true;
      startMission(0);
    }
  }, [cw, ch, startMission]);

  // Drone gönder
  const sendDrone = useCallback(() => {
    if (phase === "flying" || !selLon || !selLat) return;

    const gLon = Number(selLon);
    const gLat = Number(selLat);

    const destSVG = geoToSVG(gLon, gLat);
    const destR = svgToRender(destSVG.x, destSVG.y, cw, ch);

    const dx = destR.x - droneRX;
    const dy = destR.y - droneRY;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    setDroneAngle(angle);
    setPhase("flying");
    sndLaunch();

    const sx = droneRX, sy = droneRY;
    const steps = 90;
    let step = 0;
    const trailPts: TrailPt[] = [];

    const animate = () => {
      step++;
      const t = step / steps;
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const cx = sx + (destR.x - sx) * ease;
      const cy = sy + (destR.y - sy) * ease;
      setDroneRX(cx);
      setDroneRY(cy);
      trailPts.push({ x: cx, y: cy });
      setTrail([...trailPts]);

      if (step < steps) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setDroneRX(destR.x);
        setDroneRY(destR.y);

        const correct = gLon === target.lon && gLat === target.lat;
        if (correct) {
          setPhase("success");
          setScore((s) => s + 20);
          setHistory((h) => [...h, "ok"]);
          setFeedback(`✓ Mükemmel! ${Math.abs(gLat)}°${gLat >= 0 ? "K" : "G"} — ${Math.abs(gLon)}°${gLon >= 0 ? "D" : "B"} doğru koordinat! +20 puan`);
          sndOK();
        } else {
          setPhase("fail");
          setScore((s) => Math.max(0, s - 5));
          setHistory((h) => [...h, "fail"]);
          setFeedback(
            `✗ Yanlış! Drone ${Math.abs(gLat)}°${gLat >= 0 ? "K" : "G"}-${Math.abs(gLon)}°${gLon >= 0 ? "D" : "B"}'ye gitti. Bayrağın yerini tekrar incele. −5 puan`
          );
          sndFail();
        }
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [phase, selLon, selLat, cw, ch, droneRX, droneRY, target]);

  const nextMission = useCallback(() => {
    if (mission >= 4) { setPhase("done"); return; }
    startMission(mission + 1);
  }, [mission, startMission]);

  // Hedef ve drone render piksel pozisyonu
  const targetSVG = geoToSVG(target.lon, target.lat);
  const targetR = cw > 0 ? svgToRender(targetSVG.x, targetSVG.y, cw, ch) : { x: 0, y: 0 };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "#060c18",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Courier New', monospace",
        // Zoom tamamen engelle
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        overscrollBehavior: "none",
      }}
      // Wheell + pinch zoom engelle
      onWheel={(e) => e.preventDefault()}
    >
      {/* ── Üst bar ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 22px",
          borderBottom: "1px solid rgba(0,200,255,0.1)",
          background: "rgba(0,0,0,0.35)",
          flexShrink: 0,
          gap: "16px",
        }}
      >
        {/* Sol: başlık + görev barı */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#00c8ff", opacity: 0.65 }}>
              COĞRAFİ KOORDİNAT
            </div>
            <div style={{ fontSize: "17px", fontWeight: "800", color: "#d8eeff", lineHeight: 1.2 }}>
              Drone Simülasyonu
            </div>
          </div>

          {/* 5 görev göstergesi */}
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                title={i < history.length ? (history[i] === "ok" ? "Doğru" : "Yanlış") : i === mission ? "Aktif" : "Bekliyor"}
                style={{
                  width: "26px",
                  height: "5px",
                  borderRadius: "3px",
                  background:
                    i < history.length
                      ? history[i] === "ok" ? "#00ff88" : "#ff4444"
                      : i === mission && phase !== "idle"
                      ? "rgba(0,200,255,0.5)"
                      : "rgba(255,255,255,0.07)",
                  transition: "background 0.3s",
                }}
              />
            ))}
            <span style={{ fontSize: "10px", color: "#2a4a65", marginLeft: "6px" }}>
              {mission + 1} / 5
            </span>
          </div>
        </div>

        {/* Sağ: puan + kapat */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#2a4a65" }}>PUAN</div>
            <div
              style={{
                fontSize: "26px",
                fontWeight: "800",
                color: score > 0 ? "#00ff88" : "#deeeff",
                lineHeight: 1,
                transition: "color 0.3s",
              }}
            >
              {score}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "7px 16px",
              background: "transparent",
              border: "1px solid rgba(255,80,80,0.35)",
              borderRadius: "7px",
              color: "#ff7070",
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "1.5px",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.18s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,80,80,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            ✕ KAPAT
          </button>
        </div>
      </div>

      {/* ── Orta: harita + sağ panel ─────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* Harita alanı */}
        <div
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px",
            overflow: "hidden",
          }}
        >
          {/* Harita konteyneri — SVG oranını koruyarak doldurur */}
          <div
            ref={mapDivRef}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: `${(C.SVG_W / C.SVG_H) * 100}%`,
              aspectRatio: `${C.SVG_W} / ${C.SVG_H}`,
              border: "1px solid rgba(0,200,255,0.18)",
              borderRadius: "6px",
              overflow: "hidden",
              boxShadow: "0 0 60px rgba(0,80,180,0.12)",
            }}
          >
            {/* SVG harita */}
            <img
              src="/9/harita/dunya_koordinat.svg"
              alt="Dünya koordinat haritası"
              draggable={false}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "fill",
                display: "block",
                pointerEvents: "none",
              }}
            />

            {/* Oyun katmanı — render piksellerinde çizim */}
            {cw > 0 && (
              <svg
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
                viewBox={`0 0 ${cw} ${ch}`}
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Trail çizgisi */}
                {trail.length > 1 && (
                  <polyline
                    points={trail.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke="#00aaff"
                    strokeWidth="1.5"
                    strokeDasharray="5,4"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                )}

                {/* Hedef işareti */}
                <TargetMarker x={targetR.x} y={targetR.y} pulse={pulse} phase={phase} />

                {/* Drone */}
                <DroneMarker x={droneRX} y={droneRY} angle={droneAngle} propA={propA} />
              </svg>
            )}

            {/* Tamamlandı overlay */}
            {phase === "done" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(4,10,22,0.93)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "16px",
                }}
              >
                <div style={{ fontSize: "56px" }}>🎯</div>
                <div style={{ fontSize: "22px", fontWeight: "800", color: "#00ff88", letterSpacing: "-0.5px" }}>
                  TÜM GÖREVLER TAMAMLANDI
                </div>
                <div style={{ fontSize: "42px", fontWeight: "800", color: "#00c8ff" }}>{score} PUAN</div>
                <div style={{ fontSize: "13px", color: "#2a4a65", letterSpacing: "1px", textAlign: "center", maxWidth: "360px" }}>
                  {score >= 80
                    ? "🏆 MÜKEMMEL — Koordinat ustası oluyorsun!"
                    : score >= 50
                    ? "👍 İYİ — Biraz daha pratik yap."
                    : "📚 TEKRAR DENEYELİM — Haritayı dikkatli incele!"}
                </div>
                <button
                  onClick={onClose}
                  style={{
                    marginTop: "8px",
                    padding: "11px 28px",
                    background: "linear-gradient(90deg, #00c8ff, #0055ff)",
                    border: "none",
                    borderRadius: "7px",
                    color: "#000",
                    fontSize: "13px",
                    fontWeight: "800",
                    letterSpacing: "1.5px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  ANA MENÜYE DÖN
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Sağ kontrol paneli ───────────────────────────────────────────── */}
        <div
          style={{
            width: "270px",
            flexShrink: 0,
            borderLeft: "1px solid rgba(0,200,255,0.08)",
            background: "rgba(0,0,0,0.22)",
            display: "flex",
            flexDirection: "column",
            padding: "18px",
            gap: "14px",
            overflowY: "auto",
          }}
        >
          {/* Talimat kutusu */}
          <InfoBox accent="#00c8ff">
            <Label>GÖREV TALİMATI</Label>
            <p style={{ fontSize: "12px", color: "#2a4a6a", lineHeight: "1.75", margin: 0 }}>
              Haritadaki <span style={{ color: "#ff4444" }}>kırmızı bayrağı</span> bul.
              Hangi enlem ve boylamın kesişiminde olduğunu analiz et.
              Aşağıdan seç ve drone'u gönder.
            </p>
          </InfoBox>

          {/* Boylam */}
          <div>
            <Label>BOYLAM</Label>
            <StyledSelect
              value={selLon}
              onChange={(v) => setSelLon(v)}
              disabled={phase === "flying"}
              placeholder="— Boylam seç —"
              options={LON_OPTIONS.map((l) => ({
                value: String(l),
                label: `${Math.abs(l)}° ${l < 0 ? "Batı (W)" : l > 0 ? "Doğu (E)" : "Meridyen (0°)"}`,
              }))}
            />
          </div>

          {/* Enlem */}
          <div>
            <Label>ENLEM</Label>
            <StyledSelect
              value={selLat}
              onChange={(v) => setSelLat(v)}
              disabled={phase === "flying"}
              placeholder="— Enlem seç —"
              options={[...LAT_OPTIONS].reverse().map((l) => ({
                value: String(l),
                label: `${Math.abs(l)}° ${l < 0 ? "Güney (S)" : l > 0 ? "Kuzey (N)" : "Ekvator (0°)"}`,
              }))}
            />
          </div>

          {/* Gönder */}
          <button
            onClick={sendDrone}
            disabled={phase === "flying" || !selLon || !selLat}
            style={{
              width: "100%",
              padding: "13px",
              background:
                phase === "flying" || !selLon || !selLat
                  ? "rgba(0,40,70,0.3)"
                  : "linear-gradient(90deg, #005af0, #00c8ff)",
              border: "none",
              borderRadius: "8px",
              color: phase === "flying" || !selLon || !selLat ? "#1a3040" : "#000",
              fontSize: "12px",
              fontWeight: "800",
              letterSpacing: "2px",
              cursor: phase === "flying" || !selLon || !selLat ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
          >
            {phase === "flying" ? "🚁 UÇUŞTA..." : "🚁 DRONE'U GÖNDER"}
          </button>

          {/* Geri bildirim */}
          {feedback && (
            <div
              style={{
                padding: "11px 13px",
                background:
                  phase === "success"
                    ? "rgba(0,255,136,0.06)"
                    : phase === "fail"
                    ? "rgba(255,60,60,0.06)"
                    : "rgba(255,180,0,0.06)",
                border: `1px solid ${phase === "success" ? "rgba(0,255,136,0.2)" : phase === "fail" ? "rgba(255,60,60,0.2)" : "rgba(255,180,0,0.2)"}`,
                borderRadius: "7px",
                fontSize: "11px",
                color: phase === "success" ? "#00ff88" : phase === "fail" ? "#ff7070" : "#ffc040",
                lineHeight: "1.65",
              }}
            >
              {feedback}
            </div>
          )}

          {/* Sonraki görev */}
          {(phase === "success" || phase === "fail") && (
            <button
              onClick={nextMission}
              style={{
                width: "100%",
                padding: "11px",
                background: "transparent",
                border: "1px solid rgba(0,200,255,0.28)",
                borderRadius: "7px",
                color: "#00c8ff",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "1.5px",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,200,255,0.07)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              {mission >= 4 ? "SONUÇLARI GÖR →" : "SONRAKI GÖREV →"}
            </button>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Puan tablosu */}
          <InfoBox accent="rgba(255,255,255,0.04)">
            <Label>PUAN SİSTEMİ</Label>
            <div style={{ fontSize: "11px", lineHeight: "2.1", color: "#1e3a52" }}>
              <div>✓ Doğru koordinat: <span style={{ color: "#00ff88" }}>+20 puan</span></div>
              <div>✗ Yanlış hamle: <span style={{ color: "#ff7070" }}>−5 puan</span></div>
              <div>📍 Maks. puan: <span style={{ color: "#00c8ff" }}>100 puan</span></div>
            </div>
          </InfoBox>

          {/* Aralık notu */}
          <div style={{ fontSize: "10px", color: "#162535", lineHeight: "1.5", letterSpacing: "0.3px" }}>
            Boylam: 120°B–120°D · Enlem: 40°G–40°K
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALT BİLEŞENLER
// ═══════════════════════════════════════════════════════════════════════════════

/** Hedef bayrak + radar pulse */
function TargetMarker({ x, y, pulse, phase }: { x: number; y: number; pulse: number; phase: Phase }) {
  const hit = phase === "success";
  return (
    <g>
      {/* Dış pulse halkaları */}
      <circle cx={x} cy={y} r={22 * pulse} fill="none" stroke="#ff3333" strokeWidth="0.8" opacity={0.35 / pulse} />
      <circle cx={x} cy={y} r={14 * pulse} fill="none" stroke="#ff5555" strokeWidth="1.2" opacity={0.55 / pulse} />
      {/* Çapraz nişan çizgileri */}
      <line x1={x - 10} y1={y} x2={x - 4} y2={y} stroke={hit ? "#00ff88" : "#ff4444"} strokeWidth="1.5" />
      <line x1={x + 4}  y1={y} x2={x + 10} y2={y} stroke={hit ? "#00ff88" : "#ff4444"} strokeWidth="1.5" />
      <line x1={x} y1={y - 10} x2={x} y2={y - 4} stroke={hit ? "#00ff88" : "#ff4444"} strokeWidth="1.5" />
      <line x1={x} y1={y + 4}  x2={x} y2={y + 10} stroke={hit ? "#00ff88" : "#ff4444"} strokeWidth="1.5" />
      {/* Merkez nokta */}
      <circle cx={x} cy={y} r={3.5} fill={hit ? "#00ff88" : "#ff3333"} />
      {/* Bayrak direği */}
      <line x1={x} y1={y} x2={x} y2={y - 24} stroke={hit ? "#00ff88" : "#ff4444"} strokeWidth="1.8" strokeLinecap="round" />
      {/* Bayrak üçgeni */}
      <polygon
        points={`${x},${y - 24} ${x + 14},${y - 17} ${x},${y - 10}`}
        fill={hit ? "#00ff88" : "#ff3333"}
        opacity={0.92}
      />
      {/* Başarı ışıması */}
      {hit && (
        <>
          <circle cx={x} cy={y} r={18} fill="none" stroke="#00ff88" strokeWidth="2" opacity="0.4" />
          <circle cx={x} cy={y} r={26} fill="none" stroke="#00ff88" strokeWidth="1" opacity="0.2" />
        </>
      )}
    </g>
  );
}

/** Drone — gerçekçi multi-rotor tasarım */
function DroneMarker({ x, y, angle, propA }: { x: number; y: number; angle: number; propA: number }) {
  // Drone gövdesini uçuş açısına döndür
  // Pervane 4 kolda (+45°, +135°, +225°, +315° konumlarında)
  const armAngle = angle; // gövde dönüş açısı

  return (
    <g transform={`translate(${x},${y}) rotate(${armAngle})`}>
      {/* ── Drone gövdesi ── */}
      {/* Merkez gövde (top-down görünüm) */}
      <ellipse rx="7" ry="5" fill="#0e1e36" stroke="#00c8ff" strokeWidth="1.5" />
      {/* Merkez kamera göz */}
      <circle r="2.5" fill="#00c8ff" opacity="0.5" />
      <circle r="1" fill="#ffffff" opacity="0.6" />

      {/* ── 4 pervane kolu ── */}
      {[45, 135, 225, 315].map((armDeg, i) => {
        const rad = (armDeg * Math.PI) / 180;
        const ax = Math.cos(rad) * 13;
        const ay = Math.sin(rad) * 13;
        // Motor evi rengi: ön 2 = mavi, arka 2 = kırmızı (yön göstergesi)
        const motorColor = i < 2 ? "#0088ff" : "#ff3333";
        // Pervane dönüş yönü: alternatif
        const pRot = i % 2 === 0 ? propA : -propA;
        return (
          <g key={i}>
            {/* Kol */}
            <line
              x1={0} y1={0}
              x2={ax} y2={ay}
              stroke="#1a3050"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Motor evi (küçük daire) */}
            <circle cx={ax} cy={ay} r="4" fill="#0c1826" stroke={motorColor} strokeWidth="1.2" />
            {/* Pervane bıçakları (dönen ellipsler) */}
            <g transform={`translate(${ax},${ay}) rotate(${pRot})`}>
              <ellipse rx="7" ry="1.4" fill="#ff3333" opacity="0.82" />
              <ellipse rx="1.4" ry="7" fill="#ff3333" opacity="0.82" />
            </g>
          </g>
        );
      })}

      {/* ── İniş takımı ── */}
      <line x1="-5" y1="4" x2="-5" y2="7" stroke="#1a3050" strokeWidth="1" />
      <line x1="5" y1="4"  x2="5"  y2="7" stroke="#1a3050" strokeWidth="1" />
      <line x1="-7" y1="7" x2="7"  y2="7" stroke="#1a3050" strokeWidth="1.5" strokeLinecap="round" />

      {/* ── LED ışıkları ── */}
      {/* Ön (mavi) */}
      <circle cx={Math.cos((45 * Math.PI) / 180) * 13} cy={Math.sin((45 * Math.PI) / 180) * 13} r="1.2" fill="#00aaff" opacity="0.9" />
      <circle cx={Math.cos((135 * Math.PI) / 180) * 13} cy={Math.sin((135 * Math.PI) / 180) * 13} r="1.2" fill="#00aaff" opacity="0.9" />
      {/* Arka (kırmızı) */}
      <circle cx={Math.cos((225 * Math.PI) / 180) * 13} cy={Math.sin((225 * Math.PI) / 180) * 13} r="1.2" fill="#ff3333" opacity="0.9" />
      <circle cx={Math.cos((315 * Math.PI) / 180) * 13} cy={Math.sin((315 * Math.PI) / 180) * 13} r="1.2" fill="#ff3333" opacity="0.9" />

      {/* Gölge (harita üzerinde derinlik hissi) */}
      <ellipse rx="10" ry="6" fill="rgba(0,0,0,0.25)" transform="translate(2,16)" />
    </g>
  );
}

// ─── Küçük yardımcı bileşenler ────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "9px", letterSpacing: "2.5px", color: "#1e3a52", marginBottom: "8px" }}>
      {children}
    </div>
  );
}

function InfoBox({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div
      style={{
        padding: "12px 13px",
        background: "rgba(0,0,0,0.15)",
        border: `1px solid ${accent === "#00c8ff" ? "rgba(0,200,255,0.1)" : accent}`,
        borderRadius: "7px",
      }}
    >
      {children}
    </div>
  );
}

function StyledSelect({
  value, onChange, disabled, placeholder, options,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "9px 11px",
        background: "rgba(0,8,20,0.8)",
        border: `1px solid ${value ? "rgba(0,200,255,0.35)" : "rgba(0,200,255,0.1)"}`,
        borderRadius: "7px",
        color: value ? "#cde4ff" : "#1e3a52",
        fontSize: "12px",
        fontFamily: "'Courier New', monospace",
        cursor: disabled ? "not-allowed" : "pointer",
        outline: "none",
        transition: "border-color 0.2s",
        appearance: "auto",
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: "#0a1628", color: "#cde4ff" }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}