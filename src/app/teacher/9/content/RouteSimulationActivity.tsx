"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── SVG harita kalibrasyon sabitleri (QGIS verilerinden) ────────────────────
// viewBox: 0 0 841 595
// Harita çerçevesi sol-üst köşesi: (57.5051, 95.8146) — QGIS transform offseti
// Harita çerçevesi boyutu: 727 x 393 (scale ≈ 0.998943, ihmal edilebilir)
// Haritada gösterilen boylam aralığı: 0°W → 180°E  (toplam 18 "10°'lik" segment)
// Yani 0° = x:0,  180° = x:727 içinde (harita koordinat sistemi)
//
// Haritada gösterilen enlem aralığı: 90°N üst → 0° Ekvator alt
//  Ama haritada sadece 60°N → Ekvator (0°) görünüyor — 6 segment × 74.7 px/segment
// Grid çizgileri (harita-iç koordinat):
//   Boylam (dikey): x = 74.85 aralıklarla, 10° basamakla (10E, 20E ... 90E)
//   Enlem (yatay): y = 74.85 aralıklarla (60N, 50N, 40N, 30N, 20N, 10N, Ekvator)
//
// Gerçek SVG koordinatı = offset + harita_iç_koordinat * scale
//   SVG_x = 57.5051 + harita_x * 0.998943
//   SVG_y = 95.8146 + harita_y * 0.998943

// Haritanın SVG içindeki gerçek sınırları
const MAP = {
  svgW: 841,
  svgH: 595,
  // Harita content'in SVG'deki sol-üst noktası
  offsetX: 57.5051,
  offsetY: 95.8146,
  // Harita içi çerçeve boyutu
  innerW: 727,
  innerH: 393,
  // Scale (≈1, görmezden gelebiliriz ama dahil edelim)
  scale: 0.998943,

  // Haritada gösterilen coğrafi aralıklar
  // Grid çizgisi analizinden:
  // Dikey çizgiler x = 69.47, 144.44, 219.41, 294.38, 369.35, 444.32, 519.29, 594.26, 669.23
  // Bunlar 10E, 20E, 30E, 40E, 50E, 60E, 70E, 80E, 90E
  // Sol kenara 0°W = x:0, sağ kenar 180°E → 180° = 727px → 1° = 727/180 ≈ 4.039px
  lonMin: 0,    // 0°W = 0°E (başlangıç boylamı)
  lonMax: 180,  // 180°E (bitiş)
  // Yatay çizgiler y = 59.99, 134.96, 209.93, 284.90, 359.87
  // Bunlar 50N, 40N, 30N, 20N, 10N
  // Yani 0° (Ekvator) = y: 392.948 → üst 60°N = y:0
  latMin: 0,    // 0°N (Ekvator) = alt
  latMax: 60,   // 60°N = üst
};

// Geçerli koordinat ızgara noktaları (sadece tam 10'ar derece kesişimler)
const VALID_LONS = [10, 20, 30, 40, 50, 60, 70, 80, 90]; // °E
const VALID_LATS = [10, 20, 30, 40, 50];                  // °N (Ekvator olmadan)

// Koordinat → SVG piksel dönüşümü
function coordToSVG(lon: number, lat: number, rect: DOMRect): { x: number; y: number } {
  // Harita içi piksel pozisyonu (harita koordinat sistemi, scale dahil)
  const mapInnerX = (lon / 180) * MAP.innerW;
  const mapInnerY = ((MAP.latMax - lat) / MAP.latMax) * MAP.innerH;

  // SVG koordinatı
  const svgX = MAP.offsetX + mapInnerX * MAP.scale;
  const svgY = MAP.offsetY + mapInnerY * MAP.scale;

  // Render edilen SVG boyutuna oranla piksel
  const scaleX = rect.width / MAP.svgW;
  const scaleY = rect.height / MAP.svgH;

  return {
    x: svgX * scaleX,
    y: svgY * scaleY,
  };
}

// Web Audio API ses fonksiyonları
function playBeep(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as Record<string, unknown>).webkitAudioContext as typeof AudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close(), duration * 1000 + 100);
  } catch (_) {}
}

function playSuccess() {
  [440, 554, 660, 880].forEach((f, i) => setTimeout(() => playBeep(f, 0.3, "sine", 0.25), i * 120));
}

function playError() {
  playBeep(200, 0.5, "sawtooth", 0.2);
  setTimeout(() => playBeep(150, 0.4, "sawtooth", 0.15), 150);
}

function playLaunch() {
  playBeep(300, 0.1, "square", 0.15);
  setTimeout(() => playBeep(600, 0.15, "square", 0.12), 80);
  setTimeout(() => playBeep(900, 0.2, "square", 0.1), 180);
}

function playFlag() {
  playBeep(800, 0.08, "square", 0.1);
  setTimeout(() => playBeep(1000, 0.12, "square", 0.08), 100);
}

// ─── Tür tanımlamaları ───────────────────────────────────────────────────────
type GamePhase = "idle" | "flying" | "arrived" | "wrong" | "complete";

interface Target {
  lon: number;
  lat: number;
}

interface DronePos {
  x: number;
  y: number;
}

interface TrailPoint {
  x: number;
  y: number;
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────
export default function RouteSimulationActivity({ onClose }: { onClose: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const animRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<GamePhase>("idle");
  const [score, setScore] = useState(0);
  const [mission, setMission] = useState(0); // 0-indexed, 5 toplam
  const [target, setTarget] = useState<Target>({ lon: 40, lat: 30 });
  const [drone, setDrone] = useState<DronePos>({ x: 0, y: 0 });
  const [droneAngle, setDroneAngle] = useState(0);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [homePos, setHomePos] = useState<DronePos>({ x: 0, y: 0 });
  const [targetPos, setTargetPos] = useState<DronePos>({ x: 0, y: 0 });
  const [selectedLon, setSelectedLon] = useState<string>("");
  const [selectedLat, setSelectedLat] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [propAngle, setPropAngle] = useState(0);
  const [pulseScale, setPulseScale] = useState(1);
  const [svgReady, setSvgReady] = useState(false);
  const [resultHistory, setResultHistory] = useState<("correct" | "wrong")[]>([]);

  // SVG boyut takibi
  const [svgRect, setSvgRect] = useState<DOMRect | null>(null);

  const updateSvgRect = useCallback(() => {
    if (svgRef.current) {
      setSvgRect(svgRef.current.getBoundingClientRect());
    }
  }, []);

  useEffect(() => {
    updateSvgRect();
    window.addEventListener("resize", updateSvgRect);
    return () => window.removeEventListener("resize", updateSvgRect);
  }, [updateSvgRect]);

  // Pervane animasyonu
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setPropAngle((a) => (a + 15) % 360);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Pulse animasyonu
  useEffect(() => {
    let dir = 1;
    const timer = setInterval(() => {
      setPulseScale((s) => {
        const next = s + dir * 0.04;
        if (next >= 1.5) dir = -1;
        if (next <= 1.0) dir = 1;
        return next;
      });
    }, 40);
    return () => clearInterval(timer);
  }, []);

  // İlk yükleme & yeni görev başlatma
  const startMission = useCallback(
    (missionNum: number) => {
      if (!svgRect) return;

      const lon = VALID_LONS[Math.floor(Math.random() * VALID_LONS.length)];
      const lat = VALID_LATS[Math.floor(Math.random() * VALID_LATS.length)];
      setTarget({ lon, lat });
      playFlag();

      // Drone başlangıç pozisyonu — sol alt köşe yakını (0°lon, 10°lat)
      const startLon = 5;
      const startLat = 5;
      const home = coordToSVG(startLon, startLat, svgRect);
      setHomePos(home);
      setDrone(home);
      setTrail([]);
      setSelectedLon("");
      setSelectedLat("");
      setFeedback("");
      setPhase("idle");

      const tPos = coordToSVG(lon, lat, svgRect);
      setTargetPos(tPos);
      setSvgReady(true);
      setMission(missionNum);
    },
    [svgRect]
  );

  useEffect(() => {
    if (svgRect) {
      startMission(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgRect]);

  // Drone'u gönder
  const sendDrone = useCallback(() => {
    if (phase === "flying" || !svgRect) return;
    if (!selectedLon || !selectedLat) {
      setFeedback("⚠ Önce enlem ve boylam seçmelisin!");
      return;
    }

    const guessLon = parseInt(selectedLon);
    const guessLat = parseInt(selectedLat);

    // Hedef SVG pozisyonu
    const dest = coordToSVG(guessLon, guessLat, svgRect);

    // Uçuş açısı
    const dx = dest.x - drone.x;
    const dy = dest.y - drone.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    setDroneAngle(angle);
    setPhase("flying");
    playLaunch();

    const startX = drone.x;
    const startY = drone.y;
    const steps = 80;
    let step = 0;
    const newTrail: TrailPoint[] = [];

    const animate = () => {
      step++;
      const t = step / steps;
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const cx = startX + (dest.x - startX) * ease;
      const cy = startY + (dest.y - startY) * ease;
      setDrone({ x: cx, y: cy });
      newTrail.push({ x: cx, y: cy });
      setTrail([...newTrail]);

      if (step < steps) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Varış
        setDrone(dest);
        const correct = guessLon === target.lon && guessLat === target.lat;
        if (correct) {
          setPhase("arrived");
          setScore((s) => s + 20);
          setResultHistory((h) => [...h, "correct"]);
          setFeedback(`✓ Mükemmel! ${guessLat}°K - ${guessLon}°D doğru koordinat!`);
          playSuccess();
        } else {
          setPhase("wrong");
          setScore((s) => Math.max(0, s - 5));
          setResultHistory((h) => [...h, "wrong"]);
          setFeedback(
            `✗ Yanlış! Drone ${guessLat}°K-${guessLon}°D'ye gitti ama hedef farklıydı. -5 puan`
          );
          playError();
        }
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [phase, svgRect, selectedLon, selectedLat, drone, target]);

  // Sonraki görev
  const nextMission = useCallback(() => {
    if (mission >= 4) {
      setPhase("complete");
      return;
    }
    startMission(mission + 1);
  }, [mission, startMission]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "linear-gradient(135deg, #060b16 0%, #0a1220 100%)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Courier New', monospace",
      }}
    >
      {/* ── Üst bar ─────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px",
          borderBottom: "1px solid rgba(0,200,255,0.1)",
          background: "rgba(0,0,0,0.3)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* Logo/başlık */}
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#00c8ff", opacity: 0.7 }}>
              COĞRAFİ KOORDİNAT
            </div>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#e8f4ff" }}>
              Drone Simülasyonu
            </div>
          </div>

          {/* Görev sayacı */}
          <div style={{ display: "flex", gap: "6px" }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  width: "28px",
                  height: "6px",
                  borderRadius: "3px",
                  background:
                    i < resultHistory.length
                      ? resultHistory[i] === "correct"
                        ? "#00ff88"
                        : "#ff4444"
                      : i === mission && phase !== "idle" && svgReady
                      ? "rgba(0,200,255,0.4)"
                      : "rgba(255,255,255,0.08)",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: "11px", color: "#4a7aa0" }}>
            GÖREV {mission + 1} / 5
          </div>
        </div>

        {/* Skor */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#4a7aa0" }}>PUAN</div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: score >= 0 ? "#00ff88" : "#ff4444",
                lineHeight: 1,
                transition: "color 0.3s",
              }}
            >
              {score}
            </div>
          </div>

          {/* Kapat butonu */}
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              background: "transparent",
              border: "1px solid rgba(255,60,60,0.4)",
              borderRadius: "8px",
              color: "#ff6060",
              fontSize: "12px",
              letterSpacing: "2px",
              cursor: "pointer",
              fontFamily: "'Courier New', monospace",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,60,60,0.15)";
              e.currentTarget.style.borderColor = "#ff6060";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(255,60,60,0.4)";
            }}
          >
            ✕ KAPAT
          </button>
        </div>
      </div>

      {/* ── Ana içerik ─────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Harita alanı */}
        <div
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          {/* SVG harita konteyneri */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "900px",
              border: "1px solid rgba(0,200,255,0.2)",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 0 60px rgba(0,100,200,0.1)",
            }}
          >
            {/* Orijinal SVG harita */}
            <svg
              ref={svgRef}
              viewBox="0 0 841 595"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "block", width: "100%" }}
              onLoad={updateSvgRect}
            >
              {/* Haritayı buraya inline embed ediyoruz — SVG image tag ile */}
              <image
                href="/harita/dunya_koordinat.svg"
                x="0"
                y="0"
                width="841"
                height="595"
                preserveAspectRatio="xMidYMid meet"
              />

              {svgReady && svgRect && (
                <>
                  {/* Trail çizgisi */}
                  {trail.length > 1 && (
                    <polyline
                      points={trail
                        .map((p) => {
                          // SVG koordinatına geri çevir
                          const scaleX = svgRect.width / MAP.svgW;
                          const scaleY = svgRect.height / MAP.svgH;
                          return `${p.x / scaleX},${p.y / scaleY}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#00aaff"
                      strokeWidth="1.5"
                      strokeDasharray="5,4"
                      opacity="0.7"
                    />
                  )}

                  {/* Hedef bayrak pulse halkaları */}
                  {(() => {
                    const scaleX = svgRect.width / MAP.svgW;
                    const scaleY = svgRect.height / MAP.svgH;
                    const tx = targetPos.x / scaleX;
                    const ty = targetPos.y / scaleY;
                    return (
                      <g>
                        <circle cx={tx} cy={ty} r={16 * pulseScale} fill="none" stroke="#ff4444" strokeWidth="1" opacity={0.5 / pulseScale} />
                        <circle cx={tx} cy={ty} r={10 * pulseScale} fill="none" stroke="#ff6666" strokeWidth="1.5" opacity={0.7 / pulseScale} />
                        <circle cx={tx} cy={ty} r={4} fill="#ff3333" />
                        {/* Bayrak direği */}
                        <line x1={tx} y1={ty} x2={tx} y2={ty - 20} stroke="#ff3333" strokeWidth="1.5" />
                        <polygon points={`${tx},${ty - 20} ${tx + 12},${ty - 14} ${tx},${ty - 8}`} fill="#ff3333" />
                      </g>
                    );
                  })()}

                  {/* Drone */}
                  {(() => {
                    const scaleX = svgRect.width / MAP.svgW;
                    const scaleY = svgRect.height / MAP.svgH;
                    const dx2 = drone.x / scaleX;
                    const dy2 = drone.y / scaleY;
                    return (
                      <g transform={`translate(${dx2},${dy2}) rotate(${droneAngle})`}>
                        {/* Drone gövde */}
                        <rect x="-10" y="-5" width="20" height="10" rx="3" fill="#1a2a4a" stroke="#00c8ff" strokeWidth="1.5" />
                        {/* Pervane kolları */}
                        {[[-8, -8], [8, -8], [8, 8], [-8, 8]].map(([px, py], i) => (
                          <g key={i} transform={`translate(${px},${py})`}>
                            <line x1="0" y1="0" x2={i % 2 === 0 ? -6 : 6} y2={i < 2 ? -6 : 6} stroke="#00c8ff" strokeWidth="1" />
                            {/* Pervane */}
                            <g transform={`rotate(${propAngle + i * 90})`}>
                              <ellipse rx="5" ry="1.5" fill="#ff3333" opacity="0.85" />
                            </g>
                          </g>
                        ))}
                        {/* Kamera göz */}
                        <circle cx="0" cy="0" r="3" fill="#00c8ff" opacity="0.6" />
                      </g>
                    );
                  })()}
                </>
              )}
            </svg>

            {/* Tamamlandı Overlay */}
            {phase === "complete" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,5,15,0.92)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "20px",
                }}
              >
                <div style={{ fontSize: "64px" }}>🎯</div>
                <div style={{ fontSize: "28px", fontWeight: "700", color: "#00ff88" }}>
                  TÜM GÖREVLER TAMAMLANDI
                </div>
                <div style={{ fontSize: "48px", fontWeight: "700", color: "#00c8ff" }}>
                  {score} PUAN
                </div>
                <div style={{ fontSize: "14px", color: "#4a7aa0", letterSpacing: "2px" }}>
                  {score >= 80
                    ? "MÜKEMMEL — Koordinat ustası oluyorsun!"
                    : score >= 50
                    ? "İYİ — Biraz daha pratik yapabilirsin."
                    : "TEKRAR DENEYELİM — Haritayı dikkatli incele!"}
                </div>
                <button
                  onClick={onClose}
                  style={{
                    marginTop: "12px",
                    padding: "12px 32px",
                    background: "linear-gradient(90deg, #00c8ff, #0050ff)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#000",
                    fontSize: "14px",
                    fontWeight: "700",
                    letterSpacing: "2px",
                    cursor: "pointer",
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  ANA MENÜYE DÖN
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Sağ panel ─────────────────────────────────── */}
        <div
          style={{
            width: "280px",
            flexShrink: 0,
            borderLeft: "1px solid rgba(0,200,255,0.1)",
            background: "rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            padding: "20px",
            gap: "16px",
            overflowY: "auto",
          }}
        >
          {/* Talimat */}
          <div
            style={{
              padding: "14px",
              background: "rgba(0,100,255,0.07)",
              border: "1px solid rgba(0,200,255,0.12)",
              borderRadius: "8px",
            }}
          >
            <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#00c8ff", marginBottom: "8px" }}>
              GÖREV TALİMATI
            </div>
            <p style={{ fontSize: "12px", color: "#3a6a8a", lineHeight: "1.7", margin: 0 }}>
              Haritadaki kırmızı bayrağın konumunu analiz et.
              Hangi enlem ve boylamın kesişiminde olduğunu bul,
              aşağıdaki menülerden seçimlerini yap ve drone'u gönder.
            </p>
          </div>

          {/* Boylam seçimi */}
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#4a7aa0", marginBottom: "8px" }}>
              BOYLAM (DOĞU)
            </div>
            <select
              value={selectedLon}
              onChange={(e) => setSelectedLon(e.target.value)}
              disabled={phase === "flying"}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "rgba(0,10,25,0.8)",
                border: `1px solid ${selectedLon ? "#00c8ff" : "rgba(0,200,255,0.2)"}`,
                borderRadius: "8px",
                color: selectedLon ? "#e8f4ff" : "#2a4a62",
                fontSize: "14px",
                fontFamily: "'Courier New', monospace",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="">— Boylam Seç —</option>
              {VALID_LONS.map((lon) => (
                <option key={lon} value={String(lon)}>
                  {lon}° Doğu
                </option>
              ))}
            </select>
          </div>

          {/* Enlem seçimi */}
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#4a7aa0", marginBottom: "8px" }}>
              ENLEM (KUZEY)
            </div>
            <select
              value={selectedLat}
              onChange={(e) => setSelectedLat(e.target.value)}
              disabled={phase === "flying"}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "rgba(0,10,25,0.8)",
                border: `1px solid ${selectedLat ? "#00c8ff" : "rgba(0,200,255,0.2)"}`,
                borderRadius: "8px",
                color: selectedLat ? "#e8f4ff" : "#2a4a62",
                fontSize: "14px",
                fontFamily: "'Courier New', monospace",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="">— Enlem Seç —</option>
              {VALID_LATS.slice()
                .reverse()
                .map((lat) => (
                  <option key={lat} value={String(lat)}>
                    {lat}° Kuzey
                  </option>
                ))}
            </select>
          </div>

          {/* Gönder butonu */}
          <button
            onClick={sendDrone}
            disabled={phase === "flying" || !selectedLon || !selectedLat}
            style={{
              width: "100%",
              padding: "14px",
              background:
                phase === "flying" || !selectedLon || !selectedLat
                  ? "rgba(0,50,80,0.3)"
                  : "linear-gradient(90deg, #0050ff, #00c8ff)",
              border: "none",
              borderRadius: "8px",
              color:
                phase === "flying" || !selectedLon || !selectedLat ? "#253a50" : "#000",
              fontSize: "13px",
              fontWeight: "700",
              letterSpacing: "2px",
              cursor:
                phase === "flying" || !selectedLon || !selectedLat
                  ? "not-allowed"
                  : "pointer",
              fontFamily: "'Courier New', monospace",
              transition: "all 0.2s",
            }}
          >
            {phase === "flying" ? "🚁 UÇUŞTA..." : "🚁 DRONE'U GÖNDER"}
          </button>

          {/* Geri bildirim */}
          {feedback && (
            <div
              style={{
                padding: "12px",
                background:
                  phase === "arrived"
                    ? "rgba(0,255,136,0.07)"
                    : phase === "wrong"
                    ? "rgba(255,68,68,0.07)"
                    : "rgba(255,200,0,0.07)",
                border: `1px solid ${
                  phase === "arrived"
                    ? "rgba(0,255,136,0.2)"
                    : phase === "wrong"
                    ? "rgba(255,68,68,0.2)"
                    : "rgba(255,200,0,0.2)"
                }`,
                borderRadius: "8px",
                fontSize: "12px",
                color:
                  phase === "arrived"
                    ? "#00ff88"
                    : phase === "wrong"
                    ? "#ff6666"
                    : "#ffcc00",
                lineHeight: "1.6",
              }}
            >
              {feedback}
            </div>
          )}

          {/* Sonraki görev butonu */}
          {(phase === "arrived" || phase === "wrong") && (
            <button
              onClick={nextMission}
              style={{
                width: "100%",
                padding: "12px",
                background: "transparent",
                border: "1px solid rgba(0,200,255,0.3)",
                borderRadius: "8px",
                color: "#00c8ff",
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "2px",
                cursor: "pointer",
                fontFamily: "'Courier New', monospace",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,200,255,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {mission >= 4 ? "SONUÇLARI GÖR →" : "SONRAKI GÖREV →"}
            </button>
          )}

          {/* Puan tablosu */}
          <div
            style={{
              marginTop: "auto",
              padding: "14px",
              background: "rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.04)",
              borderRadius: "8px",
            }}
          >
            <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#253a50", marginBottom: "10px" }}>
              PUAN SİSTEMİ
            </div>
            <div style={{ fontSize: "12px", color: "#2a4a62", lineHeight: "2" }}>
              <div>✓ Doğru koordinat: <span style={{ color: "#00ff88" }}>+20 puan</span></div>
              <div>✗ Yanlış hamle: <span style={{ color: "#ff6666" }}>−5 puan</span></div>
              <div>📍 Maks. puan: <span style={{ color: "#00c8ff" }}>100 puan</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}