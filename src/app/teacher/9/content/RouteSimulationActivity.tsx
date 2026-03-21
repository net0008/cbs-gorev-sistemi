"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// KESİN KALİBRASYON — QGIS SVG + resim doğrulaması
// SVG viewBox: 841 × 595
// Grid çizgileri: 30° aralıklı (hem enlem hem boylam)
// Ölçek: 30° / 74.970 inner-px = 0.400159 °/inner-px
// ═══════════════════════════════════════════════════════════════════════════════
const MAP = {
  SVG_W: 841,
  SVG_H: 595,
  OX: 57.5051,
  OY: 95.8146,
  SC: 0.998943,
  DEG_PX: 0.400159,
  LON_L: -147.8003,
  LAT_T: 84.0073,
  // Clip değerleri — harita çerçevesi / viewBox boyutu
  // Etiketlerin görünmesi için biraz daha geniş tutuyoruz
  CLIP_T: 12.5,   // % (harita üstü = 16.1%, etiket marjı için -3.6%)
  CLIP_B: 14.5,   // % (harita altı = 17.9%, etiket marjı için -3.4%)
  CLIP_L: 2.0,    // % (harita solu = 6.8%, etiket marjı için geniş)
  CLIP_R: 2.0,    // % (harita sağı = 6.8%)
} as const;

function geoToSVG(lon: number, lat: number) {
  return {
    x: MAP.OX + ((lon - MAP.LON_L) / MAP.DEG_PX) * MAP.SC,
    y: MAP.OY + ((MAP.LAT_T - lat) / MAP.DEG_PX) * MAP.SC,
  };
}

function svgToRender(svgX: number, svgY: number, cw: number, ch: number) {
  return { x: (svgX / MAP.SVG_W) * cw, y: (svgY / MAP.SVG_H) * ch };
}

// ─── Koordinat seçenekleri (30°'nin katları) ──────────────────────────────────
const LON_OPTIONS: number[] = [];
for (let l = -120; l <= 120; l += 30) LON_OPTIONS.push(l);

const LAT_OPTIONS: number[] = [];
for (let l = 60; l >= -60; l -= 30) LAT_OPTIONS.push(l);

type Coord = { lon: number; lat: number };
const ALL_TARGETS: Coord[] = [];
for (const lat of LAT_OPTIONS)
  for (const lon of LON_OPTIONS)
    ALL_TARGETS.push({ lon, lat });

// ─── Ses ─────────────────────────────────────────────────────────────────────
function beep(f: number, d: number, t: OscillatorType = "sine", v = 0.2) {
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
const sndFlag   = () => { beep(880,0.07,"square",0.09); setTimeout(()=>beep(1100,0.1,"square",0.07),90); };
const sndOK     = () => [440,554,660,880].forEach((f,i)=>setTimeout(()=>beep(f,0.28,"sine",0.18),i*110));
const sndFail   = () => { beep(220,0.4,"sawtooth",0.16); setTimeout(()=>beep(150,0.32,"sawtooth",0.12),130); };
const sndLaunch = () => { beep(280,0.08,"square",0.12); setTimeout(()=>beep(560,0.12,"square",0.09),70); setTimeout(()=>beep(840,0.16,"square",0.07),165); };

type Phase = "idle" | "flying" | "success" | "fail" | "done";
interface TrailPt { x: number; y: number }

function fmtLon(l: number) {
  if (l === 0) return "0° — Başlangıç Meridyeni";
  return `${Math.abs(l)}° ${l < 0 ? "Batı (W)" : "Doğu (E)"}`;
}
function fmtLat(l: number) {
  if (l === 0) return "0° — Ekvator";
  return `${Math.abs(l)}° ${l > 0 ? "Kuzey (N)" : "Güney (S)"}`;
}
function shortCoord(lon: number, lat: number) {
  const lo = lon === 0 ? "0°" : `${Math.abs(lon)}°${lon < 0 ? "B" : "D"}`;
  const la = lat === 0 ? "0°" : `${Math.abs(lat)}°${lat > 0 ? "K" : "G"}`;
  return `${la} — ${lo}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function RouteSimulationActivity({ onClose }: { onClose: () => void }) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(0);
  const [ch, setCh] = useState(0);
  const animRef = useRef<number | null>(null);
  const initialized = useRef(false);

  const [phase, setPhase]     = useState<Phase>("idle");
  const [mission, setMission] = useState(0);
  const [score, setScore]     = useState(0);
  const [history, setHistory] = useState<Array<"ok"|"fail">>([]);
  const [target, setTarget]   = useState<Coord>({ lon: 0, lat: 0 });
  const [selLon, setSelLon]   = useState("");
  const [selLat, setSelLat]   = useState("");
  const [feedback, setFeedback] = useState("");
  const [droneX, setDroneX]   = useState(0);
  const [droneY, setDroneY]   = useState(0);
  const [droneAngle, setDroneAngle] = useState(0);
  const [trail, setTrail]     = useState<TrailPt[]>([]);
  const [propA, setPropA]     = useState(0);
  const [pulse, setPulse]     = useState(1.0);

  const measure = useCallback(() => {
    if (mapDivRef.current) { setCw(mapDivRef.current.clientWidth); setCh(mapDivRef.current.clientHeight); }
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (mapDivRef.current) ro.observe(mapDivRef.current);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    let id: number;
    const t = () => { setPropA((a) => (a + 20) % 360); id = requestAnimationFrame(t); };
    id = requestAnimationFrame(t);
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    let dir = 1;
    const t = setInterval(() => {
      setPulse((p) => { const n = p + dir * 0.04; if (n >= 1.65) dir = -1; if (n <= 1.0) dir = 1; return n; });
    }, 33);
    return () => clearInterval(t);
  }, []);

  const startMission = useCallback((idx: number) => {
    if (!cw || !ch) return;
    const t = ALL_TARGETS[Math.floor(Math.random() * ALL_TARGETS.length)];
    setTarget(t); setSelLon(""); setSelLat(""); setFeedback(""); setTrail([]);
    setPhase("idle"); setMission(idx); sndFlag();
    const h = geoToSVG(-100, -45);
    const r = svgToRender(h.x, h.y, cw, ch);
    setDroneX(r.x); setDroneY(r.y); setDroneAngle(0);
  }, [cw, ch]);

  useEffect(() => {
    if (cw > 0 && ch > 0 && !initialized.current) { initialized.current = true; startMission(0); }
  }, [cw, ch, startMission]);

  const sendDrone = useCallback(() => {
    if (phase === "flying" || !selLon || !selLat) return;
    const gLon = Number(selLon), gLat = Number(selLat);
    const dSVG = geoToSVG(gLon, gLat);
    const dR   = svgToRender(dSVG.x, dSVG.y, cw, ch);
    const angle = (Math.atan2(dR.y - droneY, dR.x - droneX) * 180) / Math.PI;
    setDroneAngle(angle); setPhase("flying"); sndLaunch();
    const sx = droneX, sy = droneY, STEPS = 100;
    let step = 0; const pts: TrailPt[] = [];
    const tick = () => {
      step++;
      const t = step / STEPS;
      const e = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
      const cx = sx+(dR.x-sx)*e, cy = sy+(dR.y-sy)*e;
      setDroneX(cx); setDroneY(cy); pts.push({x:cx,y:cy}); setTrail([...pts]);
      if (step < STEPS) { animRef.current = requestAnimationFrame(tick); return; }
      setDroneX(dR.x); setDroneY(dR.y);
      const ok = gLon===target.lon && gLat===target.lat;
      if (ok) { setPhase("success"); setScore(s=>s+20); setHistory(h=>[...h,"ok"]); setFeedback(`✓ Harika! ${shortCoord(gLon,gLat)} doğru koordinat!`); sndOK(); }
      else { setPhase("fail"); setScore(s=>Math.max(0,s-5)); setHistory(h=>[...h,"fail"]); setFeedback(`✗ Yanlış! Drone ${shortCoord(gLon,gLat)}'ye gitti. Bayrağı tekrar incele.`); sndFail(); }
    };
    animRef.current = requestAnimationFrame(tick);
  }, [phase, selLon, selLat, cw, ch, droneX, droneY, target]);

  const nextMission = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (mission >= 4) { setPhase("done"); return; }
    startMission(mission + 1);
  }, [mission, startMission]);

  const tSVG = geoToSVG(target.lon, target.lat);
  const tR   = cw > 0 ? svgToRender(tSVG.x, tSVG.y, cw, ch) : { x: 0, y: 0 };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#060c18", display: "flex", flexDirection: "column", fontFamily: "'Courier New', monospace", touchAction: "none", userSelect: "none", WebkitUserSelect: "none", overscrollBehavior: "none" }}
      onWheel={(e) => e.preventDefault()}
    >
      {/* ── Üst bar ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: "60px", borderBottom: "1px solid rgba(0,200,255,0.1)", background: "rgba(2,6,16,0.6)", flexShrink: 0, gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#00c8ff", opacity: 0.55 }}>COĞRAFİ KOORDİNAT</div>
            <div style={{ fontSize: "17px", fontWeight: "800", color: "#c8e0ff" }}>Drone Simülasyonu</div>
          </div>
          {/* Görev barı */}
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            {[0,1,2,3,4].map((i) => (
              <div key={i} style={{ width: "28px", height: "5px", borderRadius: "3px", transition: "background 0.3s",
                background: i<history.length ? (history[i]==="ok"?"#00ff88":"#ff4444") : i===mission&&phase!=="idle" ? "rgba(0,200,255,0.45)" : "rgba(255,255,255,0.07)" }} />
            ))}
            <span style={{ fontSize: "11px", color: "#4a7a9a", marginLeft: "6px", letterSpacing: "1px", fontWeight: "600" }}>
              {mission+1} / 5
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#4a7a9a", fontWeight: "700" }}>PUAN</div>
            <div style={{ fontSize: "28px", fontWeight: "800", lineHeight: 1, color: score > 0 ? "#00ff88" : "#c8e0ff", transition: "color 0.3s" }}>{score}</div>
          </div>
          <button onClick={onClose}
            style={{ padding: "8px 18px", background: "transparent", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "7px", color: "#ff7070", fontSize: "12px", fontWeight: "700", letterSpacing: "1.5px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s" }}
            onMouseEnter={(e)=>{e.currentTarget.style.background="rgba(255,80,80,0.1)";e.currentTarget.style.borderColor="#ff7070";}}
            onMouseLeave={(e)=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="rgba(255,80,80,0.3)";}}>
            ✕ KAPAT
          </button>
        </div>
      </div>

      {/* ── Ana içerik ───────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* Harita alanı */}
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 4px 8px 8px", background: "#060c18", overflow: "hidden" }}>
          {/*
            Harita wrapper:
            - aspect ratio 841:595 korunur
            - clip-path ile SVG'nin beyaz margin'ları kesilir
            - Kalibrasyon bozulmaz çünkü render boyutu aynı kalır
          */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: `min(100%, calc((100vh - 76px) * ${MAP.SVG_W / MAP.SVG_H}))`,
              aspectRatio: `${MAP.SVG_W} / ${MAP.SVG_H}`,
              // Dış wrapper: kalibrasyonu tutan gerçek boyut
            }}
          >
            {/* Clip kapsayıcı: beyaz kenarları gizler ama SVG boyutu bozulmaz */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                // clip-path: harita çerçevesi + etiket alanı
                // Harita çerçevesi: sol %6.84, sağ %6.81, üst %16.10, alt %17.92
                // Etiketler için ~%4 pay bıraktık üst+solda, %2 sağ+alt
                clipPath: `inset(${MAP.CLIP_T}% ${MAP.CLIP_R}% ${MAP.CLIP_B}% ${MAP.CLIP_L}%)`,
                borderRadius: "4px",
                boxShadow: "0 0 40px rgba(0,80,180,0.15), 0 0 0 1px rgba(0,200,255,0.12)",
              }}
            >
              {/* SVG harita resmi */}
              <img
                src="/9/harita/dunya_koordinat.svg"
                alt="Dünya koordinat haritası"
                draggable={false}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", display: "block", pointerEvents: "none" }}
              />
            </div>

            {/* Oyun SVG katmanı — clip'siz, tam harita boyutunda */}
            <div ref={mapDivRef} style={{ position: "absolute", inset: 0 }}>
              {cw > 0 && (
                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }} viewBox={`0 0 ${cw} ${ch}`}>
                  {trail.length > 1 && (
                    <polyline
                      points={trail.map(p=>`${p.x},${p.y}`).join(" ")}
                      fill="none" stroke="#00aaff" strokeWidth="1.6"
                      strokeDasharray="5,4" strokeLinecap="round" opacity="0.65"
                    />
                  )}
                  <TargetMarker x={tR.x} y={tR.y} pulse={pulse} hit={phase==="success"} />
                  <DroneMarker x={droneX} y={droneY} heading={droneAngle} propA={propA} />
                </svg>
              )}
            </div>

            {/* Tamamlama ekranı */}
            {phase === "done" && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(4,10,22,0.94)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", zIndex: 10, borderRadius: "4px" }}>
                <div style={{ fontSize: "52px" }}>🎯</div>
                <div style={{ fontSize: "22px", fontWeight: "800", color: "#00ff88" }}>TÜM GÖREVLER TAMAMLANDI</div>
                <div style={{ fontSize: "44px", fontWeight: "800", color: "#00c8ff" }}>{score} PUAN</div>
                <div style={{ fontSize: "14px", color: "#2a4a65", textAlign: "center", maxWidth: "340px" }}>
                  {score>=80?"🏆 MÜKEMMEL — Koordinat ustası!":score>=50?"👍 İYİ — Biraz daha pratik yap.":"📚 TEKRAR DENEYELİM — Haritayı dikkatli incele!"}
                </div>
                <button onClick={onClose} style={{ marginTop: "8px", padding: "12px 30px", background: "linear-gradient(90deg,#00c8ff,#0055ff)", border: "none", borderRadius: "8px", color: "#000", fontSize: "14px", fontWeight: "800", letterSpacing: "1.5px", cursor: "pointer", fontFamily: "inherit" }}>
                  ANA MENÜYE DÖN
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Sağ kontrol paneli ─────────────────────────────────────────── */}
        <RightPanel
          selLon={selLon} selLat={selLat}
          onLon={setSelLon} onLat={setSelLat}
          phase={phase} feedback={feedback}
          mission={mission} score={score} history={history}
          onSend={sendDrone} onNext={nextMission}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAĞ PANEL
// ═══════════════════════════════════════════════════════════════════════════════
function RightPanel({ selLon, selLat, onLon, onLat, phase, feedback, mission, score, history, onSend, onNext }: {
  selLon: string; selLat: string; onLon:(v:string)=>void; onLat:(v:string)=>void;
  phase: Phase; feedback: string; mission: number; score: number;
  history: Array<"ok"|"fail">; onSend:()=>void; onNext:()=>void;
}) {
  const flying = phase === "flying";
  const canSend = !flying && !!selLon && !!selLat;

  return (
    <div style={{
      width: "340px", flexShrink: 0,
      borderLeft: "1px solid rgba(0,200,255,0.12)",
      background: "linear-gradient(180deg, #0d1929 0%, #0a1520 100%)",
      display: "flex", flexDirection: "column",
      overflowY: "auto",
    }}>

      {/* ── Talimat bölümü ── */}
      <section style={{ padding: "22px 22px 0" }}>
        <SectionTitle icon="📋" label="GÖREV TALİMATI" />
        <div style={{ background: "rgba(0,200,255,0.07)", border: "1px solid rgba(0,200,255,0.18)", borderRadius: "10px", padding: "16px 18px", marginTop: "12px" }}>
          <p style={{ fontSize: "14px", color: "#a0c8e8", lineHeight: "1.85", margin: 0, fontWeight: "500" }}>
            Haritadaki{" "}
            <span style={{ color: "#ff6666", fontWeight: "800" }}>kırmızı bayrağı</span>{" "}
            bul ve hangi{" "}
            <span style={{ color: "#33ddff", fontWeight: "700" }}>enlem</span> &{" "}
            <span style={{ color: "#33ddff", fontWeight: "700" }}>boylam</span>{" "}
            kesişiminde olduğunu analiz et. Seçimlerini yap ve drone&apos;u gönder.
          </p>
        </div>
      </section>

      {/* Divider */}
      <Divider />

      {/* ── Koordinat seçimi ── */}
      <section style={{ padding: "0 22px" }}>
        <SectionTitle icon="🧭" label="KOORDİNAT SEÇİMİ" />

        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "12px" }}>
          {/* Boylam */}
          <div>
            <label style={{ fontSize: "12px", color: "#7ab0cc", letterSpacing: "1px", display: "block", marginBottom: "7px", fontWeight: "700" }}>
              BOYLAM (Doğu / Batı)
            </label>
            <select
              value={selLon}
              onChange={(e)=>onLon(e.target.value)}
              disabled={flying}
              style={{
                width: "100%", padding: "12px 14px",
                background: selLon ? "rgba(0,200,255,0.1)" : "rgba(5,15,35,0.8)",
                border: `2px solid ${selLon ? "#00c8ff" : "rgba(0,200,255,0.2)"}`,
                borderRadius: "9px",
                color: selLon ? "#e8f8ff" : "#3a6080",
                fontSize: "14px", fontFamily: "'Courier New', monospace", fontWeight: "600",
                cursor: flying ? "not-allowed" : "pointer",
                outline: "none", transition: "all 0.2s",
                appearance: "auto",
              }}
            >
              <option value="">— Boylam seç —</option>
              {LON_OPTIONS.map(l=>(
                <option key={l} value={String(l)} style={{background:"#0d1929",color:"#c8e8ff",fontSize:"14px"}}>{fmtLon(l)}</option>
              ))}
            </select>
          </div>

          {/* Enlem */}
          <div>
            <label style={{ fontSize: "12px", color: "#7ab0cc", letterSpacing: "1px", display: "block", marginBottom: "7px", fontWeight: "700" }}>
              ENLEM (Kuzey / Güney)
            </label>
            <select
              value={selLat}
              onChange={(e)=>onLat(e.target.value)}
              disabled={flying}
              style={{
                width: "100%", padding: "12px 14px",
                background: selLat ? "rgba(0,200,255,0.1)" : "rgba(5,15,35,0.8)",
                border: `2px solid ${selLat ? "#00c8ff" : "rgba(0,200,255,0.2)"}`,
                borderRadius: "9px",
                color: selLat ? "#e8f8ff" : "#3a6080",
                fontSize: "14px", fontFamily: "'Courier New', monospace", fontWeight: "600",
                cursor: flying ? "not-allowed" : "pointer",
                outline: "none", transition: "all 0.2s",
                appearance: "auto",
              }}
            >
              <option value="">— Enlem seç —</option>
              {LAT_OPTIONS.map(l=>(
                <option key={l} value={String(l)} style={{background:"#0d1929",color:"#c8e8ff",fontSize:"14px"}}>{fmtLat(l)}</option>
              ))}
            </select>
          </div>

          {/* Seçim önizleme */}
          {(selLon || selLat) && (
            <div style={{ padding: "10px 14px", background: "rgba(0,200,255,0.07)", border: "1.5px solid rgba(0,200,255,0.2)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "13px", color: "#5a8aaa", fontWeight: "600" }}>Seçilen:</span>
              <span style={{ color: "#33ddff", fontWeight: "800", fontSize: "14px" }}>
                {selLat ? fmtLat(Number(selLat)) : "??"} &nbsp;/&nbsp; {selLon ? fmtLon(Number(selLon)) : "??"}
              </span>
            </div>
          )}
        </div>
      </section>

      <Divider />

      {/* ── Gönder butonu ── */}
      <section style={{ padding: "0 22px" }}>
        <button
          onClick={onSend}
          disabled={!canSend}
          style={{
            width: "100%", padding: "16px",
            background: canSend
              ? "linear-gradient(90deg, #0050e0 0%, #00a8e8 50%, #00c8ff 100%)"
              : "rgba(0,25,55,0.6)",
            border: canSend ? "none" : "1.5px solid rgba(0,200,255,0.1)",
            borderRadius: "10px",
            color: canSend ? "#000" : "#2a4a62",
            fontSize: "14px", fontWeight: "800", letterSpacing: "2px",
            cursor: canSend ? "pointer" : "not-allowed",
            fontFamily: "inherit", transition: "all 0.2s",
            boxShadow: canSend ? "0 4px 24px rgba(0,150,255,0.35)" : "none",
          }}
        >
          {flying ? "🚁  UÇUŞTA..." : "🚁  DRONE'U GÖNDER"}
        </button>
      </section>

      {/* ── Geri bildirim ── */}
      {feedback && (
        <>
          <Divider />
          <section style={{ padding: "0 22px" }}>
            <FeedbackBox phase={phase} text={feedback} />
          </section>
        </>
      )}

      {/* ── Sonraki görev ── */}
      {(phase === "success" || phase === "fail") && (
        <section style={{ padding: "12px 22px 0" }}>
          <button
            onClick={onNext}
            style={{ width: "100%", padding: "14px", background: "rgba(0,200,255,0.08)", border: "2px solid rgba(0,200,255,0.3)", borderRadius: "9px", color: "#33ddff", fontSize: "13px", fontWeight: "800", letterSpacing: "1.5px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s" }}
            onMouseEnter={(e)=>{e.currentTarget.style.background="rgba(0,200,255,0.15)";e.currentTarget.style.borderColor="rgba(0,200,255,0.6)";}}
            onMouseLeave={(e)=>{e.currentTarget.style.background="rgba(0,200,255,0.08)";e.currentTarget.style.borderColor="rgba(0,200,255,0.3)";}}>
            {mission>=4 ? "🏁  SONUÇLARI GÖR" : "⏭  SONRAKI GÖREV"}
          </button>
        </section>
      )}

      {/* Spacer */}
      <div style={{ flex: 1, minHeight: "16px" }} />

      {/* ── Puan tablosu ── */}
      <Divider />
      <section style={{ padding: "0 22px 22px" }}>
        <SectionTitle icon="📊" label="PUAN SİSTEMİ" />
        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <ScoreRow icon="✓" label="Doğru koordinat" value="+20 puan" color="#00ff88" />
          <ScoreRow icon="✗" label="Yanlış hamle" value="−5 puan" color="#ff7070" />
          <ScoreRow icon="🎯" label="Maksimum puan" value="100 puan" color="#33ddff" />
        </div>

        {/* İlerleme */}
        <div style={{ marginTop: "16px", padding: "14px 16px", background: "rgba(0,200,255,0.05)", border: "1px solid rgba(0,200,255,0.12)", borderRadius: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "11px", color: "#4a7a9a", letterSpacing: "1px", fontWeight: "700" }}>TOPLAM İLERLEME</span>
            <span style={{ fontSize: "15px", color: "#33ddff", fontWeight: "800" }}>{score} / 100</span>
          </div>
          <div style={{ height: "7px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(100,score)}%`, background: score>=80?"#00ff88":score>=50?"#00c8ff":"#4a7aff", borderRadius: "4px", transition: "width 0.5s ease" }} />
          </div>
          <div style={{ fontSize: "11px", color: "#3a6080", marginTop: "8px", fontWeight: "500" }}>
            Grid: 30° · {LON_OPTIONS.length} boylam × {LAT_OPTIONS.length} enlem = {ALL_TARGETS.length} nokta
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Yardımcı bileşenler ──────────────────────────────────────────────────────
function SectionTitle({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
      <span style={{ fontSize: "16px" }}>{icon}</span>
      <span style={{ fontSize: "12px", letterSpacing: "2px", color: "#5a9abf", fontWeight: "800" }}>{label}</span>
    </div>
  );
}

function Divider() {
  return <div style={{ height: "1px", background: "rgba(0,200,255,0.1)", margin: "18px 0" }} />;
}

function ScoreRow({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(0,200,255,0.04)", border: "1px solid rgba(0,200,255,0.1)", borderRadius: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "14px", color, fontWeight: "800" }}>{icon}</span>
        <span style={{ fontSize: "13px", color: "#7ab0cc", fontWeight: "600" }}>{label}</span>
      </div>
      <span style={{ fontSize: "14px", color, fontWeight: "800" }}>{value}</span>
    </div>
  );
}

function FeedbackBox({ phase, text }: { phase: Phase; text: string }) {
  const ok   = phase === "success";
  const fail = phase === "fail";
  const c    = ok ? "#44ff99" : fail ? "#ff8080" : "#ffd060";
  const bg   = ok ? "rgba(0,220,100,0.1)"  : fail ? "rgba(255,80,80,0.1)"  : "rgba(255,180,0,0.08)";
  const br   = ok ? "rgba(0,220,100,0.28)" : fail ? "rgba(255,80,80,0.28)" : "rgba(255,180,0,0.25)";
  const ic   = ok ? "✅" : fail ? "❌" : "⚠️";
  const ttl  = ok ? "DOĞRU!" : fail ? "YANLIŞ!" : "UYARI";
  return (
    <div style={{ padding: "16px 18px", background: bg, border: `2px solid ${br}`, borderRadius: "10px" }}>
      <div style={{ fontSize: "14px", color: c, fontWeight: "800", marginBottom: "6px", letterSpacing: "0.5px" }}>
        {ic} &nbsp;{ttl}
      </div>
      <div style={{ fontSize: "13px", color: c, opacity: 0.9, lineHeight: "1.7", fontWeight: "500" }}>{text}</div>
    </div>
  );
}

// ─── Hedef işareti ────────────────────────────────────────────────────────────
function TargetMarker({ x, y, pulse, hit }: { x:number; y:number; pulse:number; hit:boolean }) {
  const c = hit ? "#00ff88" : "#ff3333";
  const c2 = hit ? "#00cc66" : "#ff5555";
  return (
    <g>
      <circle cx={x} cy={y} r={26*pulse} fill="none" stroke={c} strokeWidth="0.7" opacity={0.28/pulse} />
      <circle cx={x} cy={y} r={16*pulse} fill="none" stroke={c} strokeWidth="1.1" opacity={0.48/pulse} />
      <line x1={x-14} y1={y}    x2={x-5}  y2={y}    stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <line x1={x+5}  y1={y}    x2={x+14} y2={y}    stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <line x1={x}    y1={y-14} x2={x}    y2={y-5}  stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <line x1={x}    y1={y+5}  x2={x}    y2={y+14} stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx={x} cy={y} r={4} fill={c} opacity="0.9" />
      <line x1={x} y1={y} x2={x} y2={y-28} stroke={c2} strokeWidth="1.8" strokeLinecap="round" />
      <polygon points={`${x},${y-28} ${x+16},${y-21} ${x},${y-14}`} fill={c} opacity="0.93" />
      {hit&&<><circle cx={x} cy={y} r={20} fill="none" stroke="#00ff88" strokeWidth="2" opacity="0.35"/><circle cx={x} cy={y} r={30} fill="none" stroke="#00ff88" strokeWidth="1" opacity="0.18"/></>}
    </g>
  );
}

// ─── Drone ────────────────────────────────────────────────────────────────────
function DroneMarker({ x, y, heading, propA }: { x:number; y:number; heading:number; propA:number }) {
  const arms = [45, 135, 225, 315];
  const ARM_LEN = 14;
  return (
    <g transform={`translate(${x},${y}) rotate(${heading})`}>
      <ellipse rx="12" ry="7" fill="rgba(0,0,0,0.2)" transform="translate(2,18)" />
      {arms.map((deg,i) => {
        const rad=(deg*Math.PI)/180, ax=Math.cos(rad)*ARM_LEN, ay=Math.sin(rad)*ARM_LEN;
        const mc=i<2?"#1a6fff":"#ff3333", rot=i%2===0?propA:-propA;
        const pc=i<2?"#2266cc":"#cc2222";
        return (
          <g key={i}>
            <line x1={0} y1={0} x2={ax} y2={ay} stroke="#162840" strokeWidth="3" strokeLinecap="round" />
            <circle cx={ax} cy={ay} r={4.5} fill="#0c1826" stroke={mc} strokeWidth="1.4" />
            <g transform={`translate(${ax},${ay}) rotate(${rot})`}>
              <ellipse rx="7.5" ry="1.8" fill={pc} opacity="0.78" />
              <ellipse rx="1.8" ry="7.5" fill={pc} opacity="0.78" />
            </g>
            <circle cx={ax} cy={ay} r={1.4} fill={mc} opacity="0.95" />
          </g>
        );
      })}
      <polygon points="-9,0 -5,-8 5,-8 9,0 5,8 -5,8" fill="#0e1e38" stroke="#00c8ff" strokeWidth="1.6" strokeLinejoin="round" />
      <polygon points="-5,0 -3,-4 3,-4 5,0 3,4 -3,4" fill="#162840" />
      <circle r="2.8" fill="#00c8ff" opacity="0.55" />
      <circle r="1.2" fill="#ffffff" opacity="0.5" />
      <polygon points="0,-11 -3,-6 3,-6" fill="#00c8ff" opacity="0.6" />
      <line x1="-7" y1="7" x2="-7" y2="11" stroke="#162840" strokeWidth="1.2" />
      <line x1="7"  y1="7" x2="7"  y2="11" stroke="#162840" strokeWidth="1.2" />
      <line x1="-10" y1="11" x2="10" y2="11" stroke="#162840" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  );
}