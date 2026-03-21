"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Tipler ──────────────────────────────────────────────────────────────────
type ProjType = "cylindrical" | "conic" | "planar";
type AppPhase = "explore" | "quiz" | "done";

interface QuizQuestion {
  id: number;
  image: ProjType;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

// ─── Quiz soruları ────────────────────────────────────────────────────────────
const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    image: "cylindrical",
    question: "Bu projeksiyon yönteminde yerküre bir silindir ile sarılır. Ekvator çevresinde doğru, kutuplara doğru bozulma artar. Hangi projeksiyon yöntemidir?",
    options: ["Düzlem Projeksiyon", "Silindirik Projeksiyon", "Konik Projeksiyon", "Polar Projeksiyon"],
    correct: 1,
    explanation: "Silindirik projeksiyonda yerküre bir silindir içine alınır. Ekvator çevresinde bozulma en az, kutuplara gidildikçe şekil ve alan bozulması artar.",
  },
  {
    id: 2,
    image: "conic",
    question: "Bu yöntemde iz düşümü yapılacak yüzey yerküreyi koni biçiminde sarar. Orta enlemlerde bozulma az, Ekvator ve kutuplara doğru artar. Bu hangi yöntemdir?",
    options: ["Silindirik Projeksiyon", "Düzlem Projeksiyon", "Konik Projeksiyon", "Mercator Projeksiyonu"],
    correct: 2,
    explanation: "Konik projeksiyonda yerküre bir koni içine alınır. Orta enlemler (30°–60°) en az bozulmanın yaşandığı bölgedir. Türkiye gibi orta enlemlerdeki ülkeler için uygundur.",
  },
  {
    id: 3,
    image: "planar",
    question: "Bu projeksiyonda harita yapılacak yüzey küreye düz olarak yerleştirilir. Genellikle kutup noktasından dokunur. Bu hangi projeksiyon yöntemidir?",
    options: ["Konik Projeksiyon", "Silindirik Projeksiyon", "Mercator Projeksiyonu", "Düzlem Projeksiyon"],
    correct: 3,
    explanation: "Düzlem projeksiyonda düz bir yüzey genellikle kutup noktasına teğet gelir. Kutup çevresi doğru, Ekvator'a doğru gidildikçe bozulma artar. Kutup haritaları için idealdir.",
  },
  {
    id: 4,
    image: "cylindrical",
    question: "Dünya Haritası çiziminde en yaygın kullanılan projeksiyon yöntemi hangisidir? Bu yöntemle çizilen haritalarda Grönland Afrika'dan büyük görünür.",
    options: ["Konik Projeksiyon", "Silindirik Projeksiyon", "Düzlem Projeksiyon", "Eş Alanlı Projeksiyon"],
    correct: 1,
    explanation: "Mercator projeksiyonu (silindirik) en yaygın dünya haritası yöntemidir. Şekilleri korur fakat kutuplara yakın alanlarda büyük alan bozulmalarına yol açar — Grönland Afrika'dan büyük görünür.",
  },
  {
    id: 5,
    image: "planar",
    question: "Antarktika ve Arktika'yı gösteren haritalarda hangi projeksiyon yöntemi tercih edilir?",
    options: ["Silindirik Projeksiyon", "Konik Projeksiyon", "Düzlem Projeksiyon", "Silindirik ve Konik birlikte"],
    correct: 2,
    explanation: "Düzlem (azimuthal) projeksiyon kutup noktasından uygulandığında kutup çevresini en az bozulmayla gösterir. Bu nedenle Kuzey ve Güney Kutup haritaları bu yöntemle çizilir.",
  },
];

// ─── Ses ─────────────────────────────────────────────────────────────────────
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
const sndOK   = () => [440, 554, 660].forEach((f, i) => setTimeout(() => beep(f, 0.25, "sine", 0.16), i * 90));
const sndFail = () => { beep(200, 0.35, "sawtooth", 0.14); };
const sndNext = () => beep(600, 0.1, "square", 0.08);

// ═══════════════════════════════════════════════════════════════════════════════
// ANA BİLEŞEN
// ═══════════════════════════════════════════════════════════════════════════════
export default function ProjectionActivity({ onClose }: { onClose: () => void }) {
  const [phase, setPhase]       = useState<AppPhase>("explore");
  const [activeProj, setActiveProj] = useState<ProjType>("cylindrical");
  const [wrapProgress, setWrapProgress] = useState(0); // 0→1 sarma animasyonu
  const [wrapAnim, setWrapAnim] = useState(false);
  const animRef = useRef<number | null>(null);

  // Quiz state
  const [qIdx, setQIdx]         = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore]       = useState(0);
  const [answers, setAnswers]   = useState<boolean[]>([]);
  const [showExp, setShowExp]   = useState(false);

  // Globe döndürme
  const [globeAngle, setGlobeAngle] = useState(0);
  useEffect(() => {
    let id: number;
    const tick = () => { setGlobeAngle(a => (a + 0.4) % 360); id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  // Sarma animasyonu
  const triggerWrap = useCallback((type: ProjType) => {
    setActiveProj(type);
    setWrapProgress(0);
    setWrapAnim(true);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    let p = 0;
    const tick = () => {
      p += 0.018;
      setWrapProgress(Math.min(p, 1));
      if (p < 1) { animRef.current = requestAnimationFrame(tick); }
      else { setWrapAnim(false); }
    };
    animRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => { triggerWrap("cylindrical"); }, [triggerWrap]);

  // Quiz cevap
  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowExp(true);
    const ok = idx === QUESTIONS[qIdx].correct;
    if (ok) { setScore(s => s + 20); sndOK(); } else { sndFail(); }
    setAnswers(a => [...a, ok]);
  };

  const nextQ = () => {
    sndNext();
    if (qIdx >= QUESTIONS.length - 1) { setPhase("done"); return; }
    setQIdx(i => i + 1);
    setSelected(null);
    setShowExp(false);
  };

  const proj = PROJECTIONS[activeProj];

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#08101e", display: "flex", flexDirection: "column", fontFamily: "'Courier New', monospace", touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
      onWheel={e => e.preventDefault()}
    >
      {/* ── Üst bar ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: "60px", borderBottom: "1px solid rgba(124,58,237,0.2)", background: "rgba(4,6,18,0.7)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "3px", color: "#a78bfa", opacity: 0.7 }}>HARİTA PROJEKSİYONLARI</div>
            <div style={{ fontSize: "17px", fontWeight: "800", color: "#e0d4ff" }}>3B İnteraktif Simülasyon</div>
          </div>
          {/* Faz seçici */}
          <div style={{ display: "flex", gap: "4px", background: "rgba(0,0,0,0.3)", padding: "4px", borderRadius: "8px" }}>
            {(["explore", "quiz"] as AppPhase[]).map(p => (
              <button key={p} onClick={() => { setPhase(p); if(p==="quiz"){setQIdx(0);setSelected(null);setShowExp(false);setScore(0);setAnswers([]);} }}
                style={{ padding: "6px 14px", borderRadius: "6px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", transition: "all 0.18s",
                  background: phase === p ? "#7c3aed" : "transparent",
                  color: phase === p ? "#fff" : "#5a4a7a",
                }}>
                {p === "explore" ? "🔍 KEŞFEDİN" : "✏️ QUIZ"}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {phase === "quiz" && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "9px", letterSpacing: "2px", color: "#5a4a7a", fontWeight: "700" }}>PUAN</div>
              <div style={{ fontSize: "26px", fontWeight: "800", color: score > 0 ? "#a78bfa" : "#c0b8e0" }}>{score}</div>
            </div>
          )}
          <button onClick={onClose}
            style={{ padding: "7px 16px", background: "transparent", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "7px", color: "#ff7070", fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,80,80,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            ✕ KAPAT
          </button>
        </div>
      </div>

      {/* ── İçerik ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", minHeight: 0 }}>

        {phase === "explore" && (
          <ExplorePanel
            activeProj={activeProj}
            globeAngle={globeAngle}
            wrapProgress={wrapProgress}
            onSelect={triggerWrap}
          />
        )}

        {phase === "quiz" && (
          <QuizPanel
            question={QUESTIONS[qIdx]}
            qIdx={qIdx}
            total={QUESTIONS.length}
            selected={selected}
            showExp={showExp}
            answers={answers}
            onAnswer={handleAnswer}
            onNext={nextQ}
          />
        )}

        {phase === "done" && (
          <DonePanel score={score} total={QUESTIONS.length * 20} onClose={onClose} onRetry={() => { setPhase("quiz"); setQIdx(0); setSelected(null); setShowExp(false); setScore(0); setAnswers([]); }} />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// KEŞFET PANELİ
// ═══════════════════════════════════════════════════════════════════════════════

const PROJECTIONS = {
  cylindrical: {
    label: "Silindirik Projeksiyon",
    number: "1",
    color: "#06b6d4",
    desc: "Yerküre bir silindir içine alınarak iz düşümü yapılır. Ekvator çevresinde doğru sonuçlar verir; kutuplara doğru şekil ve alan bozulmaları artar.",
    usage: "Deniz haritaları, navigasyon, Mercator projeksiyonu",
    distortion: [
      { region: "Ekvator", level: 1, label: "Çok az" },
      { region: "Orta Enlemler (30–60°)", level: 2, label: "Orta" },
      { region: "Kutuplar (60–90°)", level: 5, label: "Çok fazla" },
    ],
    icon: "🔵",
  },
  conic: {
    label: "Konik Projeksiyon",
    number: "2",
    color: "#f59e0b",
    desc: "Yerküre bir koni içine alınır. Koni genellikle orta enlemlere teğet gelir. Orta enlemlerde bozulma azdır, Ekvator ve kutuplara gidildikçe artar.",
    usage: "Hava ve meteoroloji haritaları, orta enlem ülkeleri, Türkiye haritaları",
    distortion: [
      { region: "Ekvator", level: 3, label: "Orta" },
      { region: "Orta Enlemler (30–60°)", level: 1, label: "Çok az" },
      { region: "Kutuplar (60–90°)", level: 4, label: "Fazla" },
    ],
    icon: "🟡",
  },
  planar: {
    label: "Düzlem Projeksiyon",
    number: "3",
    color: "#10b981",
    desc: "Düz bir yüzey küreye teğet olarak yerleştirilir; genellikle kutup noktasına dokunur. Kutup çevresi doğru, Ekvator'a yaklaştıkça bozulma artar.",
    usage: "Kutup bölgesi haritaları, Arktika, Antarktika haritaları",
    distortion: [
      { region: "Ekvator", level: 5, label: "Çok fazla" },
      { region: "Orta Enlemler (30–60°)", level: 3, label: "Orta" },
      { region: "Kutuplar (60–90°)", level: 1, label: "Çok az" },
    ],
    icon: "🟢",
  },
} as const;

function ExplorePanel({ activeProj, globeAngle, wrapProgress, onSelect }: {
  activeProj: ProjType; globeAngle: number; wrapProgress: number; onSelect: (p: ProjType) => void;
}) {
  const proj = PROJECTIONS[activeProj];
  return (
    <div style={{ display: "flex", flex: 1, gap: 0, overflow: "hidden" }}>

      {/* Sol: Projeksiyon seçici + bilgi */}
      <div style={{ width: "320px", flexShrink: 0, borderRight: "1px solid rgba(124,58,237,0.15)", background: "rgba(4,6,18,0.5)", display: "flex", flexDirection: "column", overflowY: "auto" }}>

        <div style={{ padding: "20px 20px 0" }}>
          <PLabel>PROJEKSİYON TİPİ SEÇ</PLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
            {(Object.keys(PROJECTIONS) as ProjType[]).map(k => {
              const p = PROJECTIONS[k];
              const active = activeProj === k;
              return (
                <button key={k} onClick={() => onSelect(k)}
                  style={{ width: "100%", padding: "14px 16px", background: active ? `${p.color}18` : "rgba(0,0,0,0.2)", border: `2px solid ${active ? p.color : "rgba(255,255,255,0.06)"}`, borderRadius: "10px", cursor: "pointer", textAlign: "left", transition: "all 0.22s", fontFamily: "inherit" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "20px" }}>{p.icon}</span>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "800", color: active ? p.color : "#6a8aaa", letterSpacing: "0.3px" }}>
                        {p.number}. {p.label}
                      </div>
                      <div style={{ fontSize: "11px", color: active ? `${p.color}bb` : "#2a4060", marginTop: "2px" }}>
                        {k === "cylindrical" ? "Silindir · Ekvator odaklı" : k === "conic" ? "Koni · Orta enlem odaklı" : "Düzlem · Kutup odaklı"}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <PDivider />

        {/* Bilgi kartı */}
        <div style={{ padding: "0 20px" }}>
          <PLabel>AÇIKLAMA</PLabel>
          <div style={{ marginTop: "10px", padding: "14px 16px", background: `${proj.color}10`, border: `1.5px solid ${proj.color}30`, borderRadius: "10px" }}>
            <p style={{ fontSize: "13px", color: "#9ab8d0", lineHeight: "1.8", margin: 0, fontWeight: "500" }}>{proj.desc}</p>
          </div>
        </div>

        <PDivider />

        {/* Kullanım alanı */}
        <div style={{ padding: "0 20px" }}>
          <PLabel>KULLANIM ALANI</PLabel>
          <div style={{ marginTop: "10px", padding: "12px 14px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px" }}>
            <p style={{ fontSize: "13px", color: "#7ab0cc", lineHeight: "1.7", margin: 0 }}>📍 {proj.usage}</p>
          </div>
        </div>

        <PDivider />

        {/* Bozulma ısı haritası */}
        <div style={{ padding: "0 20px 22px" }}>
          <PLabel>BOZULMA ANALİZİ</PLabel>
          <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {proj.distortion.map(d => (
              <DistortionRow key={d.region} region={d.region} level={d.level} label={d.label} color={proj.color} />
            ))}
          </div>
          <div style={{ marginTop: "12px", display: "flex", gap: "4px", alignItems: "center" }}>
            {[1,2,3,4,5].map(n => (
              <div key={n} style={{ flex: 1, height: "10px", borderRadius: "3px", background: distortionColor(n), opacity: 0.85 }} />
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", position: "absolute", pointerEvents: "none" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
            <span style={{ fontSize: "10px", color: "#2a5a3a" }}>Az bozulma</span>
            <span style={{ fontSize: "10px", color: "#7a2a2a" }}>Çok bozulma</span>
          </div>
        </div>
      </div>

      {/* Orta: 3B Animasyon Sahnesi */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", padding: "24px", background: "radial-gradient(ellipse at center, #0d1a30 0%, #06101e 100%)", position: "relative" }}>
        {/* Arka plan yıldızlar */}
        <Stars />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "11px", letterSpacing: "3px", color: proj.color, opacity: 0.7, marginBottom: "8px" }}>
            {proj.number}. {proj.label.toUpperCase()}
          </div>

          {/* Ana animasyon canvas */}
          <ProjectionCanvas
            type={activeProj}
            globeAngle={globeAngle}
            wrapProgress={wrapProgress}
            color={proj.color}
          />

          {/* Alt açıklama */}
          <div style={{ marginTop: "20px", maxWidth: "480px", padding: "14px 20px", background: "rgba(0,0,0,0.4)", border: `1px solid ${proj.color}30`, borderRadius: "10px" }}>
            <div style={{ fontSize: "12px", color: proj.color, fontWeight: "700", marginBottom: "6px", letterSpacing: "1px" }}>
              NASIL ÇALIŞIR?
            </div>
            <div style={{ fontSize: "13px", color: "#7a9ab8", lineHeight: "1.75" }}>
              {activeProj === "cylindrical" && "Küreye teğet bir silindir oluşturulur → Işık kaynağından gölgeler silindirin yüzeyine düşer → Silindir açılarak düz harita elde edilir."}
              {activeProj === "conic" && "Kürenin üzerine bir koni yerleştirilir → Koni orta enlemlere teğettir → Gölgeler koni yüzeyine düşer → Koni açılarak harita elde edilir."}
              {activeProj === "planar" && "Kutup noktasına düz bir yüzey teğet getirilir → Kürenin merkez noktasından ışıklar yayılır → Gölgeler düzleme düşer → Düzlem doğrudan harita olur."}
            </div>
          </div>
        </div>
      </div>

      {/* Sağ: Karşılaştırma tablosu */}
      <div style={{ width: "280px", flexShrink: 0, borderLeft: "1px solid rgba(124,58,237,0.15)", background: "rgba(4,6,18,0.5)", display: "flex", flexDirection: "column", overflowY: "auto", padding: "20px" }}>
        <PLabel>3 PROJEKSİYON KARŞILAŞTIRMA</PLabel>

        <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {(Object.keys(PROJECTIONS) as ProjType[]).map(k => {
            const p = PROJECTIONS[k];
            const isActive = activeProj === k;
            return (
              <div key={k} onClick={() => onSelect(k)}
                style={{ padding: "14px", background: isActive ? `${p.color}12` : "rgba(0,0,0,0.15)", border: `1.5px solid ${isActive ? p.color : "rgba(255,255,255,0.05)"}`, borderRadius: "10px", cursor: "pointer", transition: "all 0.2s" }}>

                <div style={{ fontSize: "12px", fontWeight: "800", color: p.color, marginBottom: "10px" }}>
                  {p.number}. {p.label}
                </div>

                {/* Mini küçük SVG görseli */}
                <MiniProjectionSVG type={k} color={p.color} />

                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {[
                    { label: "Ekvator bozulması", val: k === "cylindrical" ? "✓ Az" : k === "conic" ? "〜 Orta" : "✗ Fazla", ok: k === "cylindrical" },
                    { label: "Orta enlem bozulması", val: k === "cylindrical" ? "〜 Orta" : k === "conic" ? "✓ Az" : "〜 Orta", ok: k === "conic" },
                    { label: "Kutup bozulması", val: k === "cylindrical" ? "✗ Çok" : k === "conic" ? "✗ Fazla" : "✓ Az", ok: k === "planar" },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                      <span style={{ color: "#3a5a7a" }}>{row.label}</span>
                      <span style={{ color: row.val.startsWith("✓") ? "#00cc66" : row.val.startsWith("✗") ? "#ff6666" : "#ffaa33", fontWeight: "700" }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <PDivider />

        <div style={{ padding: "12px 14px", background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "8px" }}>
          <div style={{ fontSize: "11px", color: "#7c3aed", fontWeight: "700", marginBottom: "6px" }}>💡 BİLGİ</div>
          <p style={{ fontSize: "12px", color: "#5a4a7a", lineHeight: "1.7", margin: 0 }}>
            Hiçbir projeksiyon yöntemi dünyayı <strong style={{ color: "#a78bfa" }}>tamamen doğru</strong> gösteremez. Her yöntem farklı özellikleri korur, farklı bölgelerde bozulma yaşar.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Quiz Paneli ──────────────────────────────────────────────────────────────
function QuizPanel({ question, qIdx, total, selected, showExp, answers, onAnswer, onNext }: {
  question: QuizQuestion; qIdx: number; total: number; selected: number | null;
  showExp: boolean; answers: boolean[]; onAnswer: (i: number) => void; onNext: () => void;
}) {
  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

      {/* Sol: ilerleme */}
      <div style={{ width: "220px", flexShrink: 0, borderRight: "1px solid rgba(124,58,237,0.15)", background: "rgba(4,6,18,0.5)", padding: "24px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <PLabel>SORULAR</PLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          {Array.from({ length: total }).map((_, i) => {
            const done = i < answers.length;
            const current = i === qIdx;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: current ? "rgba(124,58,237,0.15)" : "rgba(0,0,0,0.15)", border: `1.5px solid ${current ? "#7c3aed" : done ? (answers[i] ? "rgba(0,200,100,0.3)" : "rgba(255,80,80,0.3)") : "rgba(255,255,255,0.05)"}`, borderRadius: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: done ? (answers[i] ? "#00cc66" : "#ff5555") : current ? "#7c3aed" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800", color: done || current ? "#fff" : "#2a4060", flexShrink: 0 }}>
                  {done ? (answers[i] ? "✓" : "✗") : i + 1}
                </div>
                <div style={{ fontSize: "11px", color: current ? "#a78bfa" : done ? (answers[i] ? "#44cc88" : "#ff7777") : "#2a4060", fontWeight: current ? "700" : "500" }}>
                  Soru {i + 1}
                </div>
              </div>
            );
          })}
        </div>

        <PDivider />

        <div style={{ padding: "12px", background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "8px" }}>
          <div style={{ fontSize: "11px", color: "#5a4a7a", marginBottom: "4px", letterSpacing: "1px", fontWeight: "700" }}>TOPLAM PUAN</div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#a78bfa" }}>{answers.filter(Boolean).length * 20}</div>
          <div style={{ fontSize: "11px", color: "#3a3060", marginTop: "2px" }}>/ {total * 20}</div>
        </div>
      </div>

      {/* Orta: Soru içeriği */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "32px 40px", overflowY: "auto", gap: "24px" }}>

        {/* İlerleme */}
        <div style={{ width: "100%", maxWidth: "680px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", color: "#4a3a6a", letterSpacing: "1px", fontWeight: "700" }}>SORU {qIdx + 1} / {total}</span>
            <span style={{ fontSize: "11px", color: "#7c3aed" }}>{Math.round(((qIdx) / total) * 100)}% tamamlandı</span>
          </div>
          <div style={{ height: "5px", background: "rgba(124,58,237,0.15)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(qIdx / total) * 100}%`, background: "linear-gradient(90deg,#7c3aed,#a78bfa)", borderRadius: "3px", transition: "width 0.4s ease" }} />
          </div>
        </div>

        {/* Projeksiyon illüstrasyonu */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <QuizIllustration type={question.image} />
        </div>

        {/* Soru metni */}
        <div style={{ maxWidth: "680px", width: "100%", padding: "20px 24px", background: "rgba(124,58,237,0.08)", border: "1.5px solid rgba(124,58,237,0.2)", borderRadius: "12px" }}>
          <p style={{ fontSize: "15px", color: "#c0b0e8", lineHeight: "1.8", margin: 0, fontWeight: "600" }}>{question.question}</p>
        </div>

        {/* Şıklar */}
        <div style={{ maxWidth: "680px", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {question.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === question.correct;
            const showResult = selected !== null;
            let bg = "rgba(0,0,0,0.25)";
            let border = "rgba(255,255,255,0.07)";
            let color = "#6a8aaa";
            if (showResult) {
              if (isCorrect) { bg = "rgba(0,200,100,0.12)"; border = "#00cc66"; color = "#44ff99"; }
              else if (isSelected) { bg = "rgba(255,80,80,0.1)"; border = "#ff5555"; color = "#ff8888"; }
            } else if (isSelected) {
              bg = "rgba(124,58,237,0.15)"; border = "#7c3aed"; color = "#a78bfa";
            }
            return (
              <button key={i} onClick={() => onAnswer(i)} disabled={selected !== null}
                style={{ padding: "14px 16px", background: bg, border: `2px solid ${border}`, borderRadius: "10px", cursor: selected !== null ? "default" : "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.18s" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: showResult && isCorrect ? "#00cc66" : showResult && isSelected ? "#ff5555" : "rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800", color: "#fff", flexShrink: 0, marginTop: "1px" }}>
                    {showResult && isCorrect ? "✓" : showResult && isSelected && !isCorrect ? "✗" : String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ fontSize: "13px", color, fontWeight: "600", lineHeight: "1.5" }}>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Açıklama */}
        {showExp && (
          <div style={{ maxWidth: "680px", width: "100%", padding: "16px 20px", background: selected === question.correct ? "rgba(0,200,100,0.08)" : "rgba(255,80,80,0.08)", border: `2px solid ${selected === question.correct ? "rgba(0,200,100,0.25)" : "rgba(255,80,80,0.25)"}`, borderRadius: "12px" }}>
            <div style={{ fontSize: "13px", fontWeight: "800", color: selected === question.correct ? "#44ff99" : "#ff8888", marginBottom: "8px" }}>
              {selected === question.correct ? "✅ DOĞRU!" : "❌ YANLIŞ!"}
            </div>
            <p style={{ fontSize: "13px", color: "#8aa8c0", lineHeight: "1.8", margin: 0, fontWeight: "500" }}>{question.explanation}</p>
          </div>
        )}

        {/* İleri butonu */}
        {selected !== null && (
          <button onClick={onNext}
            style={{ padding: "14px 36px", background: "linear-gradient(90deg,#6d28d9,#7c3aed,#8b5cf6)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: "800", letterSpacing: "1.5px", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(124,58,237,0.35)", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(124,58,237,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.35)"; }}>
            {qIdx >= QUESTIONS.length - 1 ? "🏁 SONUÇLARI GÖR" : "⏭ SONRAKİ SORU"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Sonuç ekranı ─────────────────────────────────────────────────────────────
function DonePanel({ score, total, onClose, onRetry }: { score: number; total: number; onClose: () => void; onRetry: () => void }) {
  const pct = Math.round((score / total) * 100);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", background: "radial-gradient(ellipse at center,#120a2a 0%,#06101e 100%)" }}>
      <div style={{ fontSize: "60px" }}>🗺️</div>
      <div style={{ fontSize: "26px", fontWeight: "800", color: "#a78bfa" }}>QUIZ TAMAMLANDI!</div>
      <div style={{ fontSize: "52px", fontWeight: "800", color: pct >= 80 ? "#44ff99" : pct >= 50 ? "#a78bfa" : "#ff8888" }}>{score} PUAN</div>
      <div style={{ fontSize: "14px", color: "#4a3a6a", letterSpacing: "1px" }}>Toplam: {score}/{total} · {pct}% başarı</div>
      <div style={{ fontSize: "15px", color: "#7a6a9a", textAlign: "center", maxWidth: "380px", lineHeight: "1.7" }}>
        {pct >= 80 ? "🏆 Mükemmel! Projeksiyon yöntemlerini çok iyi anladın." : pct >= 50 ? "👍 İyi iş! Keşfet bölümünü tekrar incelersen daha iyi anlayabilirsin." : "📚 Tekrar dene! Keşfet bölümündeki bozulma analizini dikkatli incele."}
      </div>
      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
        <button onClick={onRetry}
          style={{ padding: "12px 28px", background: "transparent", border: "2px solid rgba(124,58,237,0.4)", borderRadius: "9px", color: "#a78bfa", fontSize: "13px", fontWeight: "800", letterSpacing: "1.5px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.1)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          🔄 TEKRAR DENE
        </button>
        <button onClick={onClose}
          style={{ padding: "12px 28px", background: "linear-gradient(90deg,#6d28d9,#7c3aed)", border: "none", borderRadius: "9px", color: "#fff", fontSize: "13px", fontWeight: "800", letterSpacing: "1.5px", cursor: "pointer", fontFamily: "inherit" }}>
          ANA MENÜYE DÖN
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SVG ANIMASYON BİLEŞENLERİ
// ═══════════════════════════════════════════════════════════════════════════════

/** Ana projeksiyon animasyon canvas */
function ProjectionCanvas({ type, globeAngle, wrapProgress, color }: {
  type: ProjType; globeAngle: number; wrapProgress: number; color: string;
}) {
  const W = 560, H = 340;
  const cx = 140, cy = 170, R = 100; // küre merkezi ve yarıçapı

  // Küre üzerinde dönen meridyen çizgileri
  const meridians = Array.from({ length: 12 }, (_, i) => i * 30);
  const parallels = [-60, -30, 0, 30, 60];

  // Kıta rengi: açık turuncu/bej
  const landColor = "#e8c470";
  const seaColor  = "#2a5a8a";

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.5))" }}>
      <defs>
        <radialGradient id="globeGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#3a7acc" />
          <stop offset="60%" stopColor="#1a4a80" />
          <stop offset="100%" stopColor="#0a1a30" />
        </radialGradient>
        <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="transparent" />
          <stop offset="100%" stopColor={`${color}20`} />
        </radialGradient>
        <clipPath id="globeClip">
          <circle cx={cx} cy={cy} r={R} />
        </clipPath>
      </defs>

      {/* ── KÜRE ── */}
      <circle cx={cx} cy={cy} r={R} fill="url(#globeGrad)" />

      {/* Grid çizgileri */}
      <g clipPath="url(#globeClip)" opacity="0.4">
        {meridians.map(lon => {
          const angle = ((lon + globeAngle) % 360) - 180;
          const x = cx + R * Math.sin((angle * Math.PI) / 180) * Math.cos(0);
          return (
            <ellipse key={lon} cx={cx} cy={cy}
              rx={Math.abs(R * Math.cos((angle * Math.PI) / 180))}
              ry={R} fill="none" stroke={color} strokeWidth="0.6" opacity="0.5" />
          );
        })}
        {parallels.map(lat => {
          const y = cy - R * Math.sin((lat * Math.PI) / 180);
          const rx = R * Math.cos((lat * Math.PI) / 180);
          return <ellipse key={lat} cx={cx} cy={y} rx={rx} ry={rx * 0.15} fill="none" stroke={color} strokeWidth="0.6" opacity="0.5" />;
        })}
      </g>

      {/* Kara parçaları (basit şekil) */}
      <g clipPath="url(#globeClip)">
        <GlobeContinent angle={globeAngle} cx={cx} cy={cy} R={R} />
      </g>

      {/* Küre parlak kenar */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />
      <circle cx={cx - R * 0.3} cy={cy - R * 0.3} r={R * 0.25} fill="white" opacity="0.06" />

      {/* ── PROJEKSIYON YÜZEYI + SARMA ANİMASYONU ── */}
      {type === "cylindrical" && <CylindricalWrap cx={cx} cy={cy} R={R} progress={wrapProgress} color={color} W={W} H={H} />}
      {type === "conic"       && <ConicWrap       cx={cx} cy={cy} R={R} progress={wrapProgress} color={color} W={W} H={H} />}
      {type === "planar"      && <PlanarWrap       cx={cx} cy={cy} R={R} progress={wrapProgress} color={color} W={W} H={H} />}

      {/* Ok: küre → harita */}
      <g opacity={wrapProgress}>
        <line x1={cx+R+20} y1={cy} x2={cx+R+50} y2={cy} stroke={color} strokeWidth="2" strokeDasharray="4,3" />
        <polygon points={`${cx+R+52},${cy} ${cx+R+46},${cy-5} ${cx+R+46},${cy+5}`} fill={color} />
        <text x={cx+R+35} y={cy-8} fontSize="9" fill={color} textAnchor="middle" opacity="0.7">açıl</text>
      </g>

      {/* Etiketler */}
      <text x={cx} y={cy + R + 18} textAnchor="middle" fontSize="11" fill={color} fontFamily="Courier New" opacity="0.7">KÜRE</text>
    </svg>
  );
}

function GlobeContinent({ angle, cx, cy, R }: { angle: number; cx: number; cy: number; R: number }) {
  // Basit kıta lekesi - dönen açıya göre
  const a = ((angle % 360) + 360) % 360;
  const continents = [
    { lon: 20, lat: 30, w: 28, h: 35, label: "Avrupa/Afrika" },
    { lon: 80, lat: 25, w: 35, h: 40, label: "Asya" },
    { lon: -80, lat: 15, w: 30, h: 40, label: "Amerika" },
  ];
  return (
    <>
      {continents.map(c => {
        const relAngle = ((c.lon + a) % 360 + 360) % 360;
        if (relAngle > 90 && relAngle < 270) return null; // arka yüz
        const px = cx + R * Math.sin((relAngle * Math.PI) / 180) * 0.9;
        const py = cy - R * Math.sin((c.lat * Math.PI) / 180) * 0.9;
        const scale = Math.cos((relAngle * Math.PI) / 180);
        if (scale < 0.1) return null;
        return (
          <ellipse key={c.label} cx={px} cy={py}
            rx={c.w * scale * 0.5} ry={c.h * 0.5}
            fill="#d4a82a" opacity={0.55 * scale} />
        );
      })}
    </>
  );
}

function CylindricalWrap({ cx, cy, R, progress, color, W }: {
  cx: number; cy: number; R: number; progress: number; color: string; W: number; H: number;
}) {
  const mapX = cx + R + 70;
  const mapW = 200 * progress;
  const mapH = 130 * progress;
  const mapY = cy - mapH / 2;

  return (
    <g>
      {/* Silindir çerçevesi */}
      <g opacity={progress}>
        {/* Silindir üst oval */}
        <ellipse cx={cx} cy={cy - R - 10} rx={R * 0.3} ry={R * 0.08} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray={progress > 0.3 ? "none" : "4,3"} opacity="0.5" />
        {/* Sol kenar */}
        <line x1={cx - R * 0.3} y1={cy - R - 10} x2={cx - R * 0.3} y2={cy + R + 10} stroke={color} strokeWidth="1.5" opacity="0.4" />
        {/* Sağ kenar */}
        <line x1={cx + R * 0.3} y1={cy - R - 10} x2={cx + R * 0.3} y2={cy + R + 10} stroke={color} strokeWidth="1.5" opacity="0.4" />
        {/* Alt oval */}
        <ellipse cx={cx} cy={cy + R + 10} rx={R * 0.3} ry={R * 0.08} fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />
        <text x={cx} y={cy - R - 22} textAnchor="middle" fontSize="10" fill={color} fontFamily="Courier New" opacity="0.6">Silindir</text>
      </g>

      {/* Açılan harita */}
      {progress > 0.4 && (
        <g>
          <rect x={mapX} y={mapY} width={mapW} height={mapH} fill={`${color}08`} stroke={color} strokeWidth="1.5" rx="2" />
          {/* Grid */}
          {[0.25, 0.5, 0.75].map(t => (
            <g key={t}>
              <line x1={mapX + mapW * t} y1={mapY} x2={mapX + mapW * t} y2={mapY + mapH} stroke={color} strokeWidth="0.5" opacity="0.3" />
              <line x1={mapX} y1={mapY + mapH * t} x2={mapX + mapW} y2={mapY + mapH * t} stroke={color} strokeWidth="0.5" opacity="0.3" />
            </g>
          ))}
          {/* Kıta şekilleri */}
          <rect x={mapX + mapW * 0.55} y={mapY + mapH * 0.1} width={mapW * 0.25} height={mapH * 0.55} fill="#d4a82a" opacity="0.35" rx="3" />
          <rect x={mapX + mapW * 0.1}  y={mapY + mapH * 0.15} width={mapW * 0.2}  height={mapH * 0.5}  fill="#d4a82a" opacity="0.35" rx="3" />
          <text x={mapX + mapW / 2} y={mapY + mapH + 16} textAnchor="middle" fontSize="10" fill={color} fontFamily="Courier New" opacity="0.6">Düz Harita</text>
          {/* Bozulma göstergesi */}
          <rect x={mapX + mapW * 0.55} y={mapY - 2} width={mapW * 0.25} height={4} fill="#ff4444" opacity="0.5" rx="2" />
          <text x={mapX + mapW * 0.67} y={mapY - 6} textAnchor="middle" fontSize="9" fill="#ff6666" fontFamily="Courier New">Kutup bozulması !</text>
        </g>
      )}
    </g>
  );
}

function ConicWrap({ cx, cy, R, progress, color, W }: {
  cx: number; cy: number; R: number; progress: number; color: string; W: number; H: number;
}) {
  const apexX = cx + 10;
  const apexY = cy - R - 50 * progress;
  const mapX = cx + R + 70;

  return (
    <g opacity={progress}>
      {/* Koni kenarları */}
      <line x1={apexX} y1={apexY} x2={cx - R * 0.8} y2={cy + R * 0.4} stroke={color} strokeWidth="1.5" opacity="0.4" />
      <line x1={apexX} y1={apexY} x2={cx + R * 0.8} y2={cy + R * 0.4} stroke={color} strokeWidth="1.5" opacity="0.4" />
      <ellipse cx={cx} cy={cy + R * 0.4} rx={R * 0.8} ry={R * 0.12} fill="none" stroke={color} strokeWidth="1.5" opacity="0.35" />
      <text x={apexX} y={apexY - 12} textAnchor="middle" fontSize="10" fill={color} fontFamily="Courier New" opacity="0.6">Koni</text>

      {/* Açılan harita (yelpaze şekli) */}
      {progress > 0.5 && (
        <g>
          {/* Yelpaze */}
          <path d={`M${mapX+10},${cy} L${mapX+10+180*progress},${cy-80*progress} A${180*progress},${80*progress} 0 0,0 ${mapX+10+180*progress},${cy+80*progress} Z`}
            fill={`${color}08`} stroke={color} strokeWidth="1.5" />
          {/* Yay çizgileri */}
          {[0.4, 0.7].map(t => (
            <path key={t} d={`M${mapX+10+180*progress*t*0.5},${cy} A${180*progress*t*0.5},${80*progress*t*0.5} 0 0,0 ${mapX+10+180*progress*t*0.5},${cy}`}
              fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" />
          ))}
          <text x={mapX + 10 + 180 * progress * 0.5} y={cy + 80 * progress + 16} textAnchor="middle" fontSize="10" fill={color} fontFamily="Courier New" opacity="0.6">Yelpaze Harita</text>
          {/* Orta enlem az bozulma göstergesi */}
          <text x={mapX + 10 + 180 * progress * 0.55} y={cy + 80 * progress * 0.3} textAnchor="middle" fontSize="9" fill="#44ff99" fontFamily="Courier New" opacity="0.7">✓ Az bozulma</text>
        </g>
      )}
    </g>
  );
}

function PlanarWrap({ cx, cy, R, progress, color }: {
  cx: number; cy: number; R: number; progress: number; color: string; W: number; H: number;
}) {
  const mapX = cx + R + 70;
  const mapR  = 100 * progress;
  const mapCy = cy;
  const mapCx = mapX + mapR;

  return (
    <g opacity={progress}>
      {/* Teğet düzlem */}
      <line x1={cx + R} y1={cy - R * 1.3} x2={cx + R} y2={cy + R * 1.3} stroke={color} strokeWidth="2" opacity="0.5" strokeDasharray="6,4" />
      <text x={cx + R + 8} y={cy - R * 1.3 + 14} fontSize="10" fill={color} fontFamily="Courier New" opacity="0.6">Düzlem</text>

      {/* Işın çizgileri (merkezden dışa) */}
      {[30, 90, 150, 210, 270, 330].map(a => {
        const r = (a * Math.PI) / 180;
        const ex = cx + R * 1.4 * Math.cos(r);
        const ey = cy + R * 1.1 * Math.sin(r);
        return <line key={a} x1={cx} y1={cy} x2={ex} y2={ey} stroke={color} strokeWidth="0.6" opacity="0.2" strokeDasharray="3,4" />;
      })}

      {/* Açılan dairesel harita */}
      {progress > 0.4 && (
        <g>
          <circle cx={mapCx} cy={mapCy} r={mapR} fill={`${color}08`} stroke={color} strokeWidth="1.5" />
          {/* Polar grid */}
          {[0.33, 0.66].map(t => (
            <circle key={t} cx={mapCx} cy={mapCy} r={mapR * t} fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" />
          ))}
          {[0, 45, 90, 135].map(a => {
            const r = (a * Math.PI) / 180;
            return (
              <line key={a} x1={mapCx + mapR * Math.cos(r)} y1={mapCy + mapR * Math.sin(r)}
                x2={mapCx - mapR * Math.cos(r)} y2={mapCy - mapR * Math.sin(r)}
                stroke={color} strokeWidth="0.5" opacity="0.3" />
            );
          })}
          {/* Kutup noktası */}
          <circle cx={mapCx} cy={mapCy} r={4} fill={color} opacity="0.8" />
          <text x={mapCx} y={mapCy - 14} textAnchor="middle" fontSize="9" fill={color} fontFamily="Courier New" opacity="0.7">Kutup</text>
          <text x={mapCx} y={mapCy + mapR + 16} textAnchor="middle" fontSize="10" fill={color} fontFamily="Courier New" opacity="0.6">Polar Harita</text>
          {/* Az bozulma merkez */}
          <text x={mapCx} y={mapCy + 6} textAnchor="middle" fontSize="8" fill="#44ff99" fontFamily="Courier New" opacity="0.7">✓ Az</text>
          {/* Çok bozulma dış */}
          <text x={mapCx + mapR * 0.75} y={mapCy + mapR * 0.75} textAnchor="middle" fontSize="8" fill="#ff6666" fontFamily="Courier New" opacity="0.7">✗ Fazla</text>
        </g>
      )}
    </g>
  );
}

/** Quiz sorusu için büyük illüstrasyon */
function QuizIllustration({ type }: { type: ProjType }) {
  const W = 420, H = 200;
  const colors = { cylindrical: "#06b6d4", conic: "#f59e0b", planar: "#10b981" };
  const c = colors[type];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.4))" }}>
      <defs>
        <radialGradient id={`qGlobe_${type}`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#3a7acc" />
          <stop offset="100%" stopColor="#0a1a30" />
        </radialGradient>
      </defs>

      {/* Küre */}
      <circle cx={80} cy={100} r={65} fill={`url(#qGlobe_${type})`} />
      <ellipse cx={80} cy={100} rx={65} ry={65} fill="none" stroke={c} strokeWidth="1" opacity="0.4" />
      {/* Basit grid */}
      <ellipse cx={80} cy={100} rx={65} ry={20} fill="none" stroke={c} strokeWidth="0.7" opacity="0.3" />
      <ellipse cx={80} cy={75}  rx={55} ry={17} fill="none" stroke={c} strokeWidth="0.7" opacity="0.3" />
      <ellipse cx={80} cy={125} rx={55} ry={17} fill="none" stroke={c} strokeWidth="0.7" opacity="0.3" />
      <line x1={80} y1={35} x2={80} y2={165} stroke={c} strokeWidth="0.7" opacity="0.3" />
      <line x1={45} y1={45} x2={115} y2={155} stroke={c} strokeWidth="0.7" opacity="0.2" />

      {/* Projeksiyon yüzeyi */}
      {type === "cylindrical" && (
        <g>
          <line x1={56} y1={32} x2={56} y2={168} stroke={c} strokeWidth="1.8" opacity="0.6" />
          <line x1={104} y1={32} x2={104} y2={168} stroke={c} strokeWidth="1.8" opacity="0.6" />
          <ellipse cx={80} cy={32} rx={24} ry={7} fill="none" stroke={c} strokeWidth="1.8" opacity="0.5" />
          <ellipse cx={80} cy={168} rx={24} ry={7} fill="none" stroke={c} strokeWidth="1.8" opacity="0.5" />
          <text x={80} y={195} textAnchor="middle" fontSize="13" fill={c} fontFamily="Courier New" fontWeight="700">SİLİNDİRİK PROJEKSİYON</text>
        </g>
      )}
      {type === "conic" && (
        <g>
          <line x1={80} y1={10} x2={30} y2={140} stroke={c} strokeWidth="1.8" opacity="0.6" />
          <line x1={80} y1={10} x2={130} y2={140} stroke={c} strokeWidth="1.8" opacity="0.6" />
          <ellipse cx={80} cy={140} rx={50} ry={12} fill="none" stroke={c} strokeWidth="1.8" opacity="0.5" />
          <text x={80} y={195} textAnchor="middle" fontSize="13" fill={c} fontFamily="Courier New" fontWeight="700">KONİK PROJEKSİYON</text>
        </g>
      )}
      {type === "planar" && (
        <g>
          <line x1={20} y1={35} x2={140} y2={35} stroke={c} strokeWidth="1.8" opacity="0.6" />
          <line x1={80} y1={100} x2={40} y2={35} stroke={c} strokeWidth="0.8" opacity="0.3" strokeDasharray="3,3" />
          <line x1={80} y1={100} x2={80} y2={35} stroke={c} strokeWidth="0.8" opacity="0.3" strokeDasharray="3,3" />
          <line x1={80} y1={100} x2={120} y2={35} stroke={c} strokeWidth="0.8" opacity="0.3" strokeDasharray="3,3" />
          <circle cx={80} cy={35} r={4} fill={c} opacity="0.8" />
          <text x={80} y={195} textAnchor="middle" fontSize="13" fill={c} fontFamily="Courier New" fontWeight="700">DÜZLEM PROJEKSİYON</text>
        </g>
      )}

      {/* Açılan harita */}
      <g transform="translate(200,20)">
        {type === "cylindrical" && (
          <>
            <rect width="200" height="130" fill={`${c}12`} stroke={c} strokeWidth="1.5" rx="3" />
            {[0.25,0.5,0.75].map(t=><g key={t}><line x1={200*t} y1={0} x2={200*t} y2={130} stroke={c} strokeWidth="0.5" opacity="0.25"/><line x1={0} y1={130*t} x2={200} y2={130*t} stroke={c} strokeWidth="0.5" opacity="0.25"/></g>)}
            <rect x="110" y="15" width="55" height="75" fill="#d4a82a" opacity="0.3" rx="2" />
            <rect x="20"  y="20" width="42" height="65" fill="#d4a82a" opacity="0.3" rx="2" />
            <rect x="0"  y="0" width="200" height="10"  fill="#ff4444" opacity="0.2" />
            <rect x="0"  y="120" width="200" height="10" fill="#ff4444" opacity="0.2" />
          </>
        )}
        {type === "conic" && (
          <>
            <path d="M100,0 L0,160 A160,160 0 0,0 200,160 Z" fill={`${c}12`} stroke={c} strokeWidth="1.5" />
            <path d="M100,0 L20,110 A110,110 0 0,0 180,110 Z" fill="none" stroke={c} strokeWidth="0.5" opacity="0.3" />
            <path d="M100,0 L55,155 A100,100 0 0,0 145,155 Z" fill="#d4a82a" opacity="0.25" />
          </>
        )}
        {type === "planar" && (
          <>
            <circle cx={100} cy={75} r={75} fill={`${c}12`} stroke={c} strokeWidth="1.5" />
            {[0.35,0.65].map(t=><circle key={t} cx={100} cy={75} r={75*t} fill="none" stroke={c} strokeWidth="0.5" opacity="0.25"/>)}
            {[0,60,120].map(a=>{const r=(a*Math.PI)/180;return<line key={a} x1={100} y1={75} x2={100+75*Math.cos(r)} y2={75+75*Math.sin(r)} stroke={c} strokeWidth="0.5" opacity="0.25"/>;})}
            <circle cx={100} cy={75} r={5} fill={c} opacity="0.7" />
          </>
        )}
      </g>

      {/* Ok */}
      <line x1={155} y1={100} x2={192} y2={100} stroke={c} strokeWidth="2" />
      <polygon points={`194,100 188,96 188,104`} fill={c} />
    </svg>
  );
}

/** Karşılaştırma paneli için küçük SVG */
function MiniProjectionSVG({ type, color }: { type: string; color: string }) {
  return (
    <svg width="100%" height="70" viewBox="0 0 220 70" style={{ borderRadius: "6px", background: "rgba(0,0,0,0.15)" }}>
      {/* Küçük küre */}
      <circle cx={35} cy={35} r={25} fill="#1a3a60" stroke={color} strokeWidth="1" opacity="0.6" />
      <ellipse cx={35} cy={35} rx={25} ry={8} fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" />

      {/* Ok */}
      <line x1={65} y1={35} x2={82} y2={35} stroke={color} strokeWidth="1.5" />
      <polygon points={`84,35 80,32 80,38`} fill={color} opacity="0.7" />

      {/* Projeksiyon yüzeyi */}
      {type === "cylindrical" && <>
        <rect x={90} y={8} width={120} height={54} fill={`${color}10`} stroke={color} strokeWidth="1" rx="2" opacity="0.7" />
        {[0.33,0.67].map(t=><g key={t}><line x1={90+120*t} y1={8} x2={90+120*t} y2={62} stroke={color} strokeWidth="0.4" opacity="0.25"/><line x1={90} y1={8+54*t} x2={210} y2={8+54*t} stroke={color} strokeWidth="0.4" opacity="0.25"/></g>)}
      </>}
      {type === "conic" && <>
        <path d={`M150,5 L90,65 A60,60 0 0,0 210,65 Z`} fill={`${color}10`} stroke={color} strokeWidth="1" opacity="0.7" />
      </>}
      {type === "planar" && <>
        <circle cx={150} cy={35} r={30} fill={`${color}10`} stroke={color} strokeWidth="1" opacity="0.7" />
        {[0.4,0.7].map(t=><circle key={t} cx={150} cy={35} r={30*t} fill="none" stroke={color} strokeWidth="0.4" opacity="0.25"/>)}
      </>}
    </svg>
  );
}

/** Arka plan yıldızlar */
function Stars() {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    x: (i * 137.5) % 100,
    y: (i * 97.3) % 100,
    r: i % 3 === 0 ? 1.2 : 0.6,
  }));
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} preserveAspectRatio="none">
      {stars.map((s, i) => (
        <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" opacity={0.25 + (i % 4) * 0.1} />
      ))}
    </svg>
  );
}

/** Bozulma satır bileşeni */
function DistortionRow({ region, level, label, color }: { region: string; level: number; label: string; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "#5a8aaa", fontWeight: "600" }}>{region}</span>
        <span style={{ fontSize: "11px", color: distortionColor(level), fontWeight: "700" }}>{label}</span>
      </div>
      <div style={{ height: "7px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(level / 5) * 100}%`, background: `linear-gradient(90deg, ${distortionColor(1)}, ${distortionColor(level)})`, borderRadius: "4px", transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

function distortionColor(level: number): string {
  const colors = ["", "#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444"];
  return colors[Math.min(5, Math.max(1, level))];
}

// ─── Panel yardımcıları ───────────────────────────────────────────────────────
function PLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: "11px", letterSpacing: "2px", color: "#5a4a8a", fontWeight: "800" }}>{children}</div>;
}
function PDivider() {
  return <div style={{ height: "1px", background: "rgba(124,58,237,0.1)", margin: "18px 0" }} />;
}