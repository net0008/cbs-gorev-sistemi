"use client";

import { useState, useRef, useEffect } from "react";

// ─── Tipler ───────────────────────────────────────────────────────────────────
type Tab       = "learn" | "measure" | "convert" | "test";
type ScaleType = "fraction" | "line";

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
const sndOK    = () => [440, 554, 660].forEach((f, i) => setTimeout(() => beep(f, 0.25, "sine", 0.15), i * 90));
const sndFail  = () => beep(200, 0.35, "sawtooth", 0.13);
const sndClick = () => beep(600, 0.08, "square", 0.07);

// ─── Veri ────────────────────────────────────────────────────────────────────
const SCALES = [
  { label: "1/25.000",    value: 25000,    desc: "1 cm = 250 m"  },
  { label: "1/50.000",    value: 50000,    desc: "1 cm = 500 m"  },
  { label: "1/100.000",   value: 100000,   desc: "1 cm = 1 km"   },
  { label: "1/500.000",   value: 500000,   desc: "1 cm = 5 km"   },
  { label: "1/1.000.000", value: 1000000,  desc: "1 cm = 10 km"  },
];

interface QItem { q: string; opts: string[]; correct: number; exp: string; type: "concept"|"calc"|"compare"; }
const TEST_ITEMS: QItem[] = [
  { type:"concept",  q:"1/100.000 ölçekli bir haritada 1 cm, gerçekte kaç km'ye karşılık gelir?",              opts:["10 km","100 km","1 km","0,1 km"],                           correct:2, exp:"1/100.000 ölçeğinde: 1 cm × 100.000 = 100.000 cm = 1 km. Paydaki rakam doğrudan küçültme oranını verir." },
  { type:"calc",     q:"1/500.000 ölçekli haritada iki şehir arası 3 cm ölçülmüştür. Gerçek mesafe kaç km?",   opts:["150 km","500 km","50 km","1500 km"],                         correct:0, exp:"3 cm × 500.000 = 1.500.000 cm = 15.000 m = 150 km." },
  { type:"compare",  q:"Aşağıdakilerden hangisi en büyük ölçeklidir? (En fazla ayrıntı gösterir.)",             opts:["1/1.000.000","1/500.000","1/100.000","1/25.000"],            correct:3, exp:"Payda küçüldükçe ölçek büyür. 1/25.000 en büyük ölçektir; daha az alan, daha fazla ayrıntı gösterir." },
  { type:"calc",     q:"İki nokta arası gerçek mesafe 240 km'dir. 1/1.000.000 ölçekli haritada kaç cm olur?",  opts:["24 cm","2,4 cm","240 cm","0,24 cm"],                         correct:0, exp:"240 km = 24.000.000 cm. 24.000.000 ÷ 1.000.000 = 24 cm. Gerçek uzunluğu ölçek paydasına böleriz." },
  { type:"concept",  q:"Kesir ölçekte payda neyi ifade eder?",                                                 opts:["Haritanın boyutunu","Gerçek uzunluğu","Küçültme oranını","Harita alanını"], correct:2, exp:"Kesir ölçekte pay=1 (haritada 1 cm), payda ise yapılan küçültme oranını gösterir. 1/100.000 → 100.000 kat küçültme." },
];

// ─── Stil sabitleri ───────────────────────────────────────────────────────────
// Okunabilir font ailesi: sistem fontlarından seç (web-safe + modern)
const FONT_BODY   = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const FONT_MONO   = "'Courier New', Courier, monospace";
const C_GOLD      = "#fbbf24";
const C_GOLD_DIM  = "#d97706";
const C_GOLD_DARK = "#92400e";
const C_GREEN     = "#10b981";
const C_RED       = "#ef4444";
const C_BG        = "#07111e";
const C_PANEL     = "rgba(4,9,22,0.75)";

function formatNum(cm: number): string {
  if (cm >= 100000) return (cm / 100000).toFixed(cm % 100000 === 0 ? 0 : 1) + " km";
  if (cm >= 100)    return (cm / 100).toFixed(0) + " m";
  return cm.toFixed(0) + " cm";
}

// ─── Ortak alt bileşenler ─────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "13px", fontWeight: "800", letterSpacing: "2px",
      color: "#9a7a30", fontFamily: FONT_BODY, textTransform: "uppercase",
      paddingBottom: "6px", borderBottom: "1px solid rgba(251,191,36,0.12)",
    }}>{children}</div>
  );
}
function SDivider() {
  return <div style={{ height: "1px", background: "rgba(251,191,36,0.1)", margin: "20px 0" }} />;
}
function InfoBox({ children, accent = C_GOLD }: { children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ padding: "14px 16px", background: `${accent}10`, border: `1.5px solid ${accent}25`, borderRadius: "10px" }}>
      {children}
    </div>
  );
}
function BodyText({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ fontSize: "14px", color: "#a08060", lineHeight: "1.85", margin: 0, fontWeight: "500", fontFamily: FONT_BODY, ...style }}>
      {children}
    </p>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANA BİLEŞEN
// ═══════════════════════════════════════════════════════════════════════════════
export default function ScaleActivity({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("learn");

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: "learn",   icon: "📖", label: "ÖĞREN"    },
    { id: "measure", icon: "📐", label: "ÖLÇÜM YAP" },
    { id: "convert", icon: "🔄", label: "DÖNÜŞTÜR"  },
    { id: "test",    icon: "✏️", label: "TEST"      },
  ];

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: C_BG, display: "flex", flexDirection: "column", fontFamily: FONT_BODY, touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
      onWheel={e => e.preventDefault()}
    >
      {/* ── Üst bar ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: "64px", borderBottom: "1px solid rgba(251,191,36,0.18)", background: "rgba(3,7,18,0.8)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "4px", color: C_GOLD, opacity: 0.6, fontFamily: FONT_MONO }}>HARİTA ÖLÇEĞİ</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#fef3c7", letterSpacing: "-0.3px" }}>Kesir & Çizgi Ölçek</div>
          </div>
          {/* Tab bar */}
          <div style={{ display: "flex", gap: "3px", background: "rgba(0,0,0,0.4)", padding: "4px", borderRadius: "10px" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => { sndClick(); setTab(t.id); }}
                style={{ padding: "8px 18px", borderRadius: "7px", border: "none", cursor: "pointer", fontFamily: FONT_BODY, fontSize: "12px", fontWeight: "700", letterSpacing: "0.5px", transition: "all 0.18s",
                  background: tab === t.id ? C_GOLD_DIM : "transparent",
                  color:      tab === t.id ? "#fff"      : "#5a4a1a",
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose}
          style={{ padding: "8px 18px", background: "transparent", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "8px", color: "#ff7070", fontSize: "12px", fontWeight: "700", letterSpacing: "1px", cursor: "pointer", fontFamily: FONT_BODY, transition: "all 0.18s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,80,80,0.1)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          ✕ KAPAT
        </button>
      </div>

      {/* ── Sekme içeriği ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", minHeight: 0 }}>
        {tab === "learn"   && <LearnTab />}
        {tab === "measure" && <MeasureTab />}
        {tab === "convert" && <ConvertTab />}
        {tab === "test"    && <TestTab />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ÖĞREN SEKMESİ
// ═══════════════════════════════════════════════════════════════════════════════
function LearnTab() {
  const [activeType, setActiveType] = useState<ScaleType>("fraction");
  const [animScale, setAnimScale] = useState(100000);

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

      {/* ── Sol panel (geniş) ── */}
      <div style={{ width: "340px", flexShrink: 0, borderRight: "1px solid rgba(251,191,36,0.1)", background: C_PANEL, overflowY: "auto", padding: "26px" }}>
        <SectionTitle>Ölçek Türleri</SectionTitle>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
          {(["fraction", "line"] as ScaleType[]).map(t => (
            <button key={t} onClick={() => { sndClick(); setActiveType(t); }}
              style={{ padding: "16px 18px", background: activeType === t ? `${C_GOLD}12` : "rgba(0,0,0,0.25)", border: `2px solid ${activeType === t ? C_GOLD_DIM : "rgba(251,191,36,0.1)"}`, borderRadius: "12px", cursor: "pointer", textAlign: "left", fontFamily: FONT_BODY, transition: "all 0.2s" }}>
              <div style={{ fontSize: "15px", fontWeight: "800", color: activeType === t ? C_GOLD : "#5a4a2a" }}>
                {t === "fraction" ? "1 — Kesir Ölçek" : "2 — Çizgi Ölçek"}
              </div>
              <div style={{ fontSize: "13px", color: activeType === t ? "#92660a" : "#2a2010", marginTop: "4px", fontWeight: "500" }}>
                {t === "fraction" ? "Pay / Payda formatı · 1/100.000" : "Grafik / Görsel çizgi formatı"}
              </div>
            </button>
          ))}
        </div>

        <SDivider />

        {activeType === "fraction" ? (
          <>
            <SectionTitle>Kesir Ölçek Nedir?</SectionTitle>
            <div style={{ marginTop: "14px" }}>
              <InfoBox>
                <BodyText>
                  <span style={{ color: C_GOLD, fontWeight: "800" }}>Pay</span> ve{" "}
                  <span style={{ color: C_GOLD, fontWeight: "800" }}>paydadan</span> oluşan kesirli sayıyla gösterilen ölçektir.
                  Pay her zaman <span style={{ color: C_GOLD }}>1</span>'dir ve haritadaki uzunluğu, payda ise küçültme oranını gösterir.
                  Birim her zaman <span style={{ color: C_GOLD }}>santimetre (cm)</span>'dir.
                </BodyText>
              </InfoBox>
            </div>

            <SDivider />
            <SectionTitle>Örnek Hesaplama</SectionTitle>
            <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { s: 25000,   m: "1 cm", r: "250 m" },
                { s: 100000,  m: "1 cm", r: "1 km"  },
                { s: 500000,  m: "1 cm", r: "5 km"  },
                { s: 1000000, m: "1 cm", r: "10 km" },
              ].map(r => (
                <div key={r.s} style={{ padding: "11px 14px", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(251,191,36,0.1)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", color: C_GOLD, fontWeight: "800", fontFamily: FONT_MONO }}>1/{r.s.toLocaleString("tr")}</span>
                  <span style={{ fontSize: "13px", color: "#7a6040", fontWeight: "500" }}>{r.m} → {r.r}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <SectionTitle>Çizgi Ölçek Nedir?</SectionTitle>
            <div style={{ marginTop: "14px" }}>
              <InfoBox>
                <BodyText>
                  <span style={{ color: C_GOLD, fontWeight: "800" }}>Grafik olarak</span> gösterilen ölçektir. Harita dijital cihazlarla
                  çoğaltılıp ebatları değiştirildiğinde çizgi ölçek de orantılı değiştiği için{" "}
                  <span style={{ color: C_GOLD }}>tercih edilir</span>.
                </BodyText>
              </InfoBox>
            </div>
            <SDivider />
            <SectionTitle>Avantajları</SectionTitle>
            <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                "Fotokopi / dijital büyütmede oran bozulmaz",
                "Görsel olarak mesafeyi hemen gösterir",
                "Cetvel ile doğrudan ölçüm yapılır",
                "Kağıt parçasıyla iki nokta arası transfer edilir",
              ].map(tx => (
                <div key={tx} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 13px", background: "rgba(0,0,0,0.18)", borderRadius: "8px" }}>
                  <span style={{ color: C_GOLD_DIM, fontWeight: "800", fontSize: "14px", marginTop: "1px", flexShrink: 0 }}>✓</span>
                  <BodyText style={{ color: "#7a6040" }}>{tx}</BodyText>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Orta panel (dar) ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 20px", background: `radial-gradient(ellipse at center,#0e1a2e 0%,${C_BG} 100%)`, overflowY: "auto", gap: "24px" }}>
        {activeType === "fraction"
          ? <FractionViz scale={animScale} onScale={setAnimScale} />
          : <LineViz />}
      </div>

      {/* ── Sağ panel (geniş) ── */}
      <div style={{ width: "340px", flexShrink: 0, borderLeft: "1px solid rgba(251,191,36,0.1)", background: C_PANEL, overflowY: "auto", padding: "26px" }}>
        <SectionTitle>Büyük / Küçük Ölçek</SectionTitle>
        <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ padding: "16px 18px", background: "rgba(16,185,129,0.08)", border: "1.5px solid rgba(16,185,129,0.22)", borderRadius: "12px" }}>
            <div style={{ fontSize: "15px", fontWeight: "800", color: C_GREEN, marginBottom: "10px", fontFamily: FONT_BODY }}>📌 Büyük Ölçek</div>
            <div style={{ fontSize: "13px", color: "#0d7a56", lineHeight: "1.8", fontWeight: "500", fontFamily: FONT_BODY }}>
              <div>• Payda küçüktür → 1/25.000</div>
              <div>• Az alan, fazla ayrıntı</div>
              <div>• Şehir ve mahalle haritaları</div>
              <div>• Kadastro, imar planları</div>
            </div>
          </div>
          <div style={{ padding: "16px 18px", background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.22)", borderRadius: "12px" }}>
            <div style={{ fontSize: "15px", fontWeight: "800", color: C_RED, marginBottom: "10px", fontFamily: FONT_BODY }}>📌 Küçük Ölçek</div>
            <div style={{ fontSize: "13px", color: "#7a2020", lineHeight: "1.8", fontWeight: "500", fontFamily: FONT_BODY }}>
              <div>• Payda büyüktür → 1/1.000.000</div>
              <div>• Geniş alan, az ayrıntı</div>
              <div>• Dünya, kıta, ülke haritaları</div>
              <div>• Atlas ve coğrafya haritaları</div>
            </div>
          </div>
        </div>

        <SDivider />
        <SectionTitle>Hızlı Ölçek Tablosu</SectionTitle>
        <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {SCALES.map(s => (
            <div key={s.value} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(0,0,0,0.18)", border: "1px solid rgba(251,191,36,0.08)", borderRadius: "8px" }}>
              <span style={{ fontSize: "13px", color: C_GOLD, fontWeight: "700", fontFamily: FONT_MONO }}>{s.label}</span>
              <span style={{ fontSize: "13px", color: "#7a6040", fontWeight: "500" }}>{s.desc}</span>
            </div>
          ))}
        </div>

        <SDivider />
        <InfoBox>
          <div style={{ fontSize: "12px", color: C_GOLD_DIM, fontWeight: "800", marginBottom: "8px", letterSpacing: "1px" }}>💡 TEMEL KURAL</div>
          <BodyText style={{ color: "#6a5020" }}>
            Payda <strong style={{ color: C_GOLD }}>küçüldükçe</strong> ölçek{" "}
            <strong style={{ color: C_GREEN }}>büyür</strong> → ayrıntı artar.<br /><br />
            Payda <strong style={{ color: C_GOLD }}>büyüdükçe</strong> ölçek{" "}
            <strong style={{ color: C_RED }}>küçülür</strong> → kapsam genişler.
          </BodyText>
        </InfoBox>
      </div>
    </div>
  );
}

// ─── Kesir ölçek görseli ──────────────────────────────────────────────────────
function FractionViz({ scale, onScale }: { scale: number; onScale: (v: number) => void }) {
  const realKm = scale / 100000;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "22px", width: "100%", maxWidth: "480px" }}>
      <div style={{ fontSize: "12px", letterSpacing: "3px", color: C_GOLD_DIM, fontFamily: FONT_MONO }}>KESİR ÖLÇEK</div>

      {/* Ölçek butonları */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center" }}>
        {SCALES.map(s => (
          <button key={s.value} onClick={() => { sndClick(); onScale(s.value); }}
            style={{ padding: "8px 14px", background: scale === s.value ? C_GOLD_DIM : "rgba(0,0,0,0.3)", border: `1.5px solid ${scale === s.value ? C_GOLD_DIM : "rgba(251,191,36,0.15)"}`, borderRadius: "7px", color: scale === s.value ? "#000" : "#5a4010", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: FONT_MONO, transition: "all 0.18s" }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Büyük kesir gösterimi */}
      <div style={{ padding: "28px 44px", background: "rgba(0,0,0,0.4)", border: "2px solid rgba(251,191,36,0.22)", borderRadius: "16px", textAlign: "center" }}>
        <div style={{ fontSize: "11px", color: C_GOLD_DIM, letterSpacing: "3px", marginBottom: "10px", fontFamily: FONT_MONO }}>ÖLÇEK</div>
        <div style={{ fontSize: "52px", fontWeight: "900", color: C_GOLD, lineHeight: 1, fontFamily: FONT_MONO }}>1</div>
        <div style={{ width: "140px", height: "3px", background: C_GOLD_DIM, borderRadius: "2px", margin: "10px auto" }} />
        <div style={{ fontSize: "36px", fontWeight: "800", color: C_GOLD, fontFamily: FONT_MONO }}>{scale.toLocaleString("tr")}</div>
        <div style={{ marginTop: "12px", fontSize: "14px", color: "#7a6030", fontFamily: FONT_BODY }}>
          Haritada 1 cm = Gerçekte {scale.toLocaleString("tr")} cm
        </div>
      </div>

      {/* Karşılaştırma cetvelleri */}
      <div style={{ width: "100%", padding: "20px 24px", background: "rgba(0,0,0,0.28)", border: "1.5px solid rgba(251,191,36,0.12)", borderRadius: "14px" }}>
        <div style={{ fontSize: "11px", color: C_GOLD_DIM, letterSpacing: "3px", marginBottom: "16px", fontFamily: FONT_MONO }}>CETVEL KARŞILAŞTIRMASI</div>
        {/* Harita cetveli */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "13px", color: "#7a6030", marginBottom: "7px", fontWeight: "700", fontFamily: FONT_BODY }}>Haritada (cm)</div>
          <div style={{ display: "flex", alignItems: "center" }}>
            {[0, 1, 2, 3, 4].map(n => (
              <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: "54px", height: n % 2 === 0 ? "20px" : "12px", background: n % 2 === 0 ? C_GOLD : C_GOLD_DARK, borderRight: "1px solid #07111e" }} />
                <span style={{ fontSize: "11px", color: "#7a6030", marginTop: "4px", fontFamily: FONT_MONO }}>{n}</span>
              </div>
            ))}
            <span style={{ fontSize: "12px", color: "#5a4010", marginLeft: "5px", fontFamily: FONT_BODY }}>cm</span>
          </div>
        </div>
        {/* Gerçek cetvel */}
        <div>
          <div style={{ fontSize: "13px", color: C_GREEN, marginBottom: "7px", fontWeight: "700", fontFamily: FONT_BODY }}>Gerçekte ({realKm >= 1 ? "km" : "m"})</div>
          <div style={{ display: "flex", alignItems: "center" }}>
            {[0, 1, 2, 3, 4].map(n => (
              <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: "54px", height: n % 2 === 0 ? "20px" : "12px", background: n % 2 === 0 ? C_GREEN : "#065f46", borderRight: "1px solid #07111e" }} />
                <span style={{ fontSize: "11px", color: C_GREEN, marginTop: "4px", fontFamily: FONT_MONO }}>
                  {realKm >= 1 ? (n * realKm).toFixed(realKm % 1 === 0 ? 0 : 1) : (n * scale / 100).toFixed(0)}
                </span>
              </div>
            ))}
            <span style={{ fontSize: "12px", color: C_GREEN, marginLeft: "5px", fontFamily: FONT_BODY }}>{realKm >= 1 ? "km" : "m"}</span>
          </div>
        </div>
        <div style={{ marginTop: "16px", padding: "12px 14px", background: `${C_GOLD}08`, borderRadius: "8px", fontSize: "14px", color: "#a08050", lineHeight: "1.7", fontFamily: FONT_BODY, fontWeight: "500" }}>
          📐 <strong style={{ color: C_GOLD, fontFamily: FONT_MONO }}>1/{scale.toLocaleString("tr")}</strong> ölçeğinde haritadaki{" "}
          <strong style={{ color: C_GOLD }}>1 cm</strong> gerçekte{" "}
          <strong style={{ color: C_GREEN }}>{realKm >= 1 ? `${realKm} km` : `${scale / 100} m`}</strong>'ye karşılık gelir.
        </div>
      </div>
    </div>
  );
}

// ─── Çizgi ölçek görseli ──────────────────────────────────────────────────────
function LineViz() {
  const [mapCm, setMapCm] = useState(3);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "22px", width: "100%", maxWidth: "500px" }}>
      <div style={{ fontSize: "12px", letterSpacing: "3px", color: C_GOLD_DIM, fontFamily: FONT_MONO }}>ÇİZGİ ÖLÇEK</div>

      <div style={{ width: "100%", padding: "22px 26px", background: "rgba(0,0,0,0.4)", border: "2px solid rgba(251,191,36,0.22)", borderRadius: "14px" }}>
        <div style={{ fontSize: "12px", color: C_GOLD_DIM, letterSpacing: "2px", marginBottom: "16px", fontFamily: FONT_MONO }}>ÇİZGİ ÖLÇEK (1/100.000)</div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          {[0, 1, 2, 3, 4, 5].map(n => (
            <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div style={{ width: "70px", height: "22px", background: n % 2 === 0 ? C_GOLD : "#1a1000", border: "1px solid #d97706", boxSizing: "border-box" }} />
              <div style={{ fontSize: "12px", color: C_GOLD, marginTop: "5px", marginLeft: "-3px", fontFamily: FONT_MONO }}>{n}</div>
            </div>
          ))}
          <span style={{ fontSize: "12px", color: "#7a6030", marginLeft: "8px", marginBottom: "3px", fontFamily: FONT_BODY }}>km</span>
        </div>
        <div style={{ marginTop: "14px", fontSize: "14px", color: "#7a6030", lineHeight: "1.7", fontFamily: FONT_BODY }}>
          Haritada 1 cm = Gerçekte <strong style={{ color: C_GOLD }}>1 km</strong> (100.000 cm). Kesir ölçek karşılığı: <strong style={{ color: C_GOLD, fontFamily: FONT_MONO }}>1/100.000</strong>
        </div>
      </div>

      <div style={{ width: "100%", padding: "22px 26px", background: "rgba(0,0,0,0.28)", border: "1.5px solid rgba(251,191,36,0.12)", borderRadius: "14px" }}>
        <div style={{ fontSize: "12px", color: C_GOLD_DIM, letterSpacing: "2px", marginBottom: "14px", fontFamily: FONT_MONO }}>İNTERAKTİF HESAPLAMA</div>
        <label style={{ fontSize: "14px", color: "#7a6030", fontWeight: "700", display: "block", marginBottom: "10px", fontFamily: FONT_BODY }}>
          Haritada ölçülen mesafe: <span style={{ color: C_GOLD, fontFamily: FONT_MONO }}>{mapCm} cm</span>
        </label>
        <input type="range" min={1} max={10} value={mapCm} onChange={e => setMapCm(Number(e.target.value))}
          style={{ width: "100%", accentColor: C_GOLD_DIM, cursor: "pointer" }} />
        <div style={{ marginTop: "14px", height: "34px", position: "relative" }}>
          <div style={{ height: "30px", width: `${mapCm * 46}px`, maxWidth: "100%", background: `linear-gradient(90deg,${C_GOLD_DARK},${C_GOLD})`, borderRadius: "5px", transition: "width 0.3s ease", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "800", color: "#000", fontFamily: FONT_MONO }}>{mapCm} cm</span>
          </div>
        </div>
        <div style={{ marginTop: "12px", padding: "16px 18px", background: "rgba(16,185,129,0.07)", border: "1.5px solid rgba(16,185,129,0.22)", borderRadius: "10px" }}>
          <div style={{ fontSize: "12px", color: C_GREEN, fontWeight: "700", marginBottom: "5px", fontFamily: FONT_BODY, letterSpacing: "1px" }}>GERÇEK MESAFE</div>
          <div style={{ fontSize: "32px", fontWeight: "800", color: C_GREEN, fontFamily: FONT_MONO }}>{mapCm} km</div>
          <div style={{ fontSize: "13px", color: "#065f46", marginTop: "4px", fontFamily: FONT_BODY }}>{mapCm} cm × 100.000 = {(mapCm * 100000).toLocaleString("tr")} cm = {mapCm} km</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ÖLÇÜM YAP SEKMESİ — SVG Türkiye haritası (QGIS gelince güncellenecek)
// ═══════════════════════════════════════════════════════════════════════════════
interface City { id: string; name: string; x: number; y: number; }
// Koordinatlar: QGIS SVG'den (viewBox 3507×2480) normalize edilmiş
// x: 0=batı(Çanakkale) → 1=doğu(Iğdır)   y: 0=kuzey → 1=güney
const CITIES: City[] = [
  {id:"canakkale",   name:"Çanakkale",      x:0.1486,y:0.4129},
  {id:"kirklareli",  name:"Kırklareli",     x:0.1548,y:0.4835},
  {id:"izmir",       name:"İzmir",          x:0.1784,y:0.5768},
  {id:"edirne",      name:"Edirne",         x:0.1838,y:0.3872},
  {id:"balikesir",   name:"Balıkesir",      x:0.1839,y:0.4209},
  {id:"tekirdag",    name:"Tekirdağ",       x:0.2015,y:0.5061},
  {id:"mugla",       name:"Muğla",          x:0.2079,y:0.6202},
  {id:"manisa",      name:"Manisa",         x:0.2134,y:0.5602},
  {id:"aydin",       name:"Aydın",          x:0.2269,y:0.6633},
  {id:"istanbul",    name:"İstanbul",       x:0.2427,y:0.4187},
  {id:"yalova",      name:"Yalova",         x:0.2501,y:0.4801},
  {id:"bursa",       name:"Bursa",          x:0.2540,y:0.4522},
  {id:"denizli",     name:"Denizli",        x:0.2601,y:0.6213},
  {id:"usak",        name:"Uşak",           x:0.2643,y:0.5738},
  {id:"afyonkarahisar",name:"Afyonkarahisar",x:0.2737,y:0.5301},
  {id:"eskisehir",   name:"Eskişehir",      x:0.2866,y:0.4360},
  {id:"burdur",      name:"Burdur",         x:0.2949,y:0.6398},
  {id:"kutahya",     name:"Kütahya",        x:0.2960,y:0.4801},
  {id:"kocaeli",     name:"Kocaeli",        x:0.3136,y:0.4430},
  {id:"karabuk",     name:"Karabük",        x:0.3186,y:0.5686},
  {id:"antalya",     name:"Antalya",        x:0.3297,y:0.6768},
  {id:"isparta",     name:"Isparta",        x:0.3309,y:0.6101},
  {id:"bilecik",     name:"Bilecik",        x:0.3363,y:0.5107},
  {id:"zonguldak",   name:"Zonguldak",      x:0.3442,y:0.4339},
  {id:"sakarya",     name:"Sakarya",        x:0.3611,y:0.4512},
  {id:"bolu",        name:"Bolu",           x:0.3682,y:0.4126},
  {id:"ankara",      name:"Ankara",         x:0.3945,y:0.3951},
  {id:"yozgat",      name:"Yozgat",         x:0.4008,y:0.4990},
  {id:"kastamonu",   name:"Kastamonu",      x:0.4015,y:0.4177},
  {id:"konya",       name:"Konya",          x:0.4018,y:0.6032},
  {id:"karaman",     name:"Karaman",        x:0.4250,y:0.6622},
  {id:"sinop",       name:"Sinop",          x:0.4347,y:0.4460},
  {id:"cankiri",     name:"Çankırı",        x:0.4450,y:0.3985},
  {id:"kirsehir",    name:"Kırşehir",       x:0.4461,y:0.4999},
  {id:"mersin",      name:"Mersin",         x:0.4516,y:0.6831},
  {id:"aksaray",     name:"Aksaray",        x:0.4522,y:0.5835},
  {id:"kirikkale",   name:"Kırıkkale",      x:0.4659,y:0.5275},
  {id:"samsun",      name:"Samsun",         x:0.4866,y:0.4533},
  {id:"nevsehir",    name:"Nevşehir",       x:0.4878,y:0.5574},
  {id:"nigde",       name:"Niğde",          x:0.4898,y:0.6083},
  {id:"amasya",      name:"Amasya",         x:0.4959,y:0.3907},
  {id:"kayseri",     name:"Kayseri",        x:0.5113,y:0.5069},
  {id:"adana",       name:"Adana",          x:0.5257,y:0.6374},
  {id:"ordu",        name:"Ordu",           x:0.5310,y:0.4459},
  {id:"kahramanmaras",name:"Kahramanmaraş", x:0.5367,y:0.5653},
  {id:"bartin",      name:"Bartın",         x:0.5434,y:0.4150},
  {id:"sanliurfa",   name:"Şanlıurfa",      x:0.5531,y:0.6490},
  {id:"hatay",       name:"Hatay",          x:0.5535,y:0.6979},
  {id:"sivas",       name:"Sivas",          x:0.5681,y:0.4652},
  {id:"gaziantep",   name:"Gaziantep",      x:0.5840,y:0.6101},
  {id:"osmaniye",    name:"Osmaniye",       x:0.5906,y:0.6762},
  {id:"tokat",       name:"Tokat",          x:0.5980,y:0.5125},
  {id:"kilis",       name:"Kilis",          x:0.5991,y:0.6594},
  {id:"giresun",     name:"Giresun",        x:0.6071,y:0.4402},
  {id:"adiyaman",    name:"Adıyaman",       x:0.6315,y:0.5751},
  {id:"erzincan",    name:"Erzincan",       x:0.6407,y:0.6171},
  {id:"gumushane",   name:"Gümüşhane",      x:0.6513,y:0.4528},
  {id:"malatya",     name:"Malatya",        x:0.6729,y:0.6500},
  {id:"tunceli",     name:"Tunceli",        x:0.6819,y:0.5068},
  {id:"trabzon",     name:"Trabzon",        x:0.6859,y:0.4672},
  {id:"elazig",      name:"Elazığ",         x:0.6864,y:0.5654},
  {id:"duzce",       name:"Düzce",          x:0.6900,y:0.5350},
  {id:"erzurum",     name:"Erzurum",        x:0.7028,y:0.4397},
  {id:"rize",        name:"Rize",           x:0.7201,y:0.4729},
  {id:"diyarbakir",  name:"Diyarbakır",     x:0.7250,y:0.5975},
  {id:"bingol",      name:"Bingöl",         x:0.7408,y:0.5435},
  {id:"artvin",      name:"Artvin",         x:0.7469,y:0.4316},
  {id:"batman",      name:"Batman",         x:0.7482,y:0.6431},
  {id:"mardin",      name:"Mardin",         x:0.7696,y:0.6053},
  {id:"bayburt",     name:"Bayburt",        x:0.7761,y:0.4836},
  {id:"agri",        name:"Ağrı",           x:0.7866,y:0.4211},
  {id:"mus",         name:"Muş",            x:0.7895,y:0.5454},
  {id:"sirnak",      name:"Şırnak",         x:0.8021,y:0.6086},
  {id:"bitlis",      name:"Bitlis",         x:0.8112,y:0.5729},
  {id:"siirt",       name:"Siirt",          x:0.8202,y:0.6348},
  {id:"kars",        name:"Kars",           x:0.8264,y:0.4207},
  {id:"ardahan",     name:"Ardahan",        x:0.8391,y:0.4588},
  {id:"igdir",       name:"Iğdır",          x:0.8475,y:0.5121},
  {id:"hakkari",     name:"Hakkari",        x:0.8631,y:0.5773},
  {id:"van",         name:"Van",            x:0.8767,y:0.4926},
];
const REAL_KM: Record<string, number> = {
  "istanbul-ankara":450,"ankara-istanbul":450,
  "istanbul-izmir":480,"izmir-istanbul":480,
  "ankara-izmir":590,"izmir-ankara":590,
  "istanbul-bursa":150,"bursa-istanbul":150,
  "ankara-samsun":420,"samsun-ankara":420,
  "ankara-konya":260,"konya-ankara":260,
  "konya-adana":340,"adana-konya":340,
  "erzurum-trabzon":290,"trabzon-erzurum":290,
  "ankara-erzurum":925,"erzurum-ankara":925,
  "van-diyarbakir":390,"diyarbakir-van":390,
  "ankara-kayseri":320,"kayseri-ankara":320,
  "adana-gaziantep":195,"gaziantep-adana":195,
  "samsun-trabzon":160,"trabzon-samsun":160,
  "istanbul-edirne":230,"edirne-istanbul":230,
  "izmir-antalya":490,"antalya-izmir":490,
  "ankara-adana":490,"adana-ankara":490,
  "ankara-sivas":440,"sivas-ankara":440,
  "sivas-erzurum":480,"erzurum-sivas":480,
  "diyarbakir-sanliurfa":190,"sanliurfa-diyarbakir":190,
  "istanbul-bursa":150,"bursa-istanbul":150,
  "konya-antalya":220,"antalya-konya":220,
  "gaziantep-sanliurfa":145,"sanliurfa-gaziantep":145,
};

function MeasureTab() {
  const [selScale, setSelScale] = useState(1000000);
  const [cityA, setCityA]       = useState<City | null>(null);
  const [cityB, setCityB]       = useState<City | null>(null);
  const [step,  setStep]        = useState<"pickA" | "pickB" | "result">("pickA");
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize]   = useState({ w: 600, h: 380 });

  useEffect(() => {
    const update = () => {
      if (mapRef.current) setMapSize({ w: mapRef.current.clientWidth, h: mapRef.current.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    if (mapRef.current) ro.observe(mapRef.current);
    return () => ro.disconnect();
  }, []);

  const handleCity = (c: City) => {
    sndClick();
    if (step === "pickA")                          { setCityA(c); setCityB(null); setStep("pickB"); }
    else if (step === "pickB" && c.id !== cityA?.id) { setCityB(c); setStep("result"); }
  };
  const reset = () => { setCityA(null); setCityB(null); setStep("pickA"); };

  let mapCm = 0, realKm = 0, key = "";
  if (cityA && cityB && mapSize.w > 0) {
    const dx = (cityB.x - cityA.x) * mapSize.w;
    const dy = (cityB.y - cityA.y) * mapSize.h;
    const px = Math.sqrt(dx * dx + dy * dy);
    const mapWidthCm = (1500 * 100000) / selScale;
    mapCm  = px / (mapSize.w / mapWidthCm);
    realKm = (mapCm * selScale) / 100000;
    key    = `${cityA.id}-${cityB.id}`;
  }
  const knownReal = REAL_KM[key];

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

      {/* ── Sol panel ── */}
      <div style={{ width: "320px", flexShrink: 0, borderRight: "1px solid rgba(251,191,36,0.1)", background: C_PANEL, overflowY: "auto", padding: "26px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <SectionTitle>Ölçek Seç</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          {SCALES.map(s => (
            <button key={s.value} onClick={() => { sndClick(); setSelScale(s.value); reset(); }}
              style={{ padding: "11px 14px", background: selScale === s.value ? `${C_GOLD}12` : "rgba(0,0,0,0.22)", border: `1.5px solid ${selScale === s.value ? C_GOLD_DIM : "rgba(251,191,36,0.09)"}`, borderRadius: "9px", cursor: "pointer", textAlign: "left", fontFamily: FONT_BODY, transition: "all 0.18s", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", fontWeight: "700", color: selScale === s.value ? C_GOLD : "#5a4010", fontFamily: FONT_MONO }}>{s.label}</span>
              <span style={{ fontSize: "13px", color: "#3a2a08", fontFamily: FONT_BODY }}>{s.desc}</span>
            </button>
          ))}
        </div>

        <SDivider />
        <SectionTitle>Nasıl Kullanılır?</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            { n: "1", t: "Yukarıdan bir ölçek seçin" },
            { n: "2", t: "Haritada ilk şehre tıklayın" },
            { n: "3", t: "İkinci şehre tıklayın" },
            { n: "4", t: "Hesaplanan mesafeyi okuyun" },
          ].map(s => (
            <div key={s.n} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "10px 13px", background: "rgba(0,0,0,0.18)", borderRadius: "8px" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: C_GOLD_DIM, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800", color: "#000", flexShrink: 0, fontFamily: FONT_MONO }}>{s.n}</span>
              <BodyText style={{ color: "#7a6030" }}>{s.t}</BodyText>
            </div>
          ))}
        </div>

        <SDivider />
        {step === "pickA" && (
          <InfoBox>
            <div style={{ fontSize: "15px", color: C_GOLD, fontWeight: "700", fontFamily: FONT_BODY }}>📍 İlk şehri seçin</div>
            <div style={{ fontSize: "13px", color: "#5a4010", marginTop: "5px", fontFamily: FONT_BODY }}>Haritadaki herhangi bir şehir noktasına tıklayın.</div>
          </InfoBox>
        )}
        {step === "pickB" && (
          <InfoBox accent={C_GREEN}>
            <div style={{ fontSize: "15px", color: C_GREEN, fontWeight: "700", fontFamily: FONT_BODY }}>📍 {cityA?.name} seçildi</div>
            <div style={{ fontSize: "13px", color: "#0d5a38", marginTop: "5px", fontFamily: FONT_BODY }}>Şimdi ikinci şehri seçin.</div>
          </InfoBox>
        )}
        {step === "result" && cityA && cityB && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "16px 18px", background: `${C_GOLD}0d`, border: `1.5px solid ${C_GOLD}28`, borderRadius: "10px" }}>
              <div style={{ fontSize: "13px", color: C_GOLD_DIM, fontWeight: "700", marginBottom: "10px", letterSpacing: "1px", fontFamily: FONT_BODY }}>HESAPLAMA</div>
              <div style={{ fontSize: "14px", color: "#8a7040", lineHeight: "2", fontFamily: FONT_BODY }}>
                <div><strong style={{ color: C_GOLD }}>{cityA.name}</strong> → <strong style={{ color: C_GOLD }}>{cityB.name}</strong></div>
                <div>Haritada: <strong style={{ color: C_GOLD, fontFamily: FONT_MONO }}>{mapCm.toFixed(1)} cm</strong></div>
                <div>Ölçek: <strong style={{ color: C_GOLD, fontFamily: FONT_MONO }}>1/{selScale.toLocaleString("tr")}</strong></div>
                <div style={{ fontSize: "12px", color: "#3a2a08", marginTop: "4px", fontFamily: FONT_MONO }}>{mapCm.toFixed(1)} × {selScale.toLocaleString("tr")} = {(mapCm * selScale).toFixed(0)} cm</div>
              </div>
            </div>
            <div style={{ padding: "16px 18px", background: "rgba(16,185,129,0.08)", border: `1.5px solid ${C_GREEN}30`, borderRadius: "10px" }}>
              <div style={{ fontSize: "13px", color: C_GREEN, fontWeight: "700", marginBottom: "6px", letterSpacing: "1px", fontFamily: FONT_BODY }}>GERÇEK MESAFE</div>
              <div style={{ fontSize: "30px", fontWeight: "800", color: C_GREEN, fontFamily: FONT_MONO }}>{realKm.toFixed(0)} km</div>
              {knownReal && <div style={{ fontSize: "12px", color: "#065f46", marginTop: "4px", fontFamily: FONT_BODY }}>Gerçek: ~{knownReal} km</div>}
            </div>
            <button onClick={reset}
              style={{ padding: "11px", background: "transparent", border: `1.5px solid ${C_GOLD}30`, borderRadius: "8px", color: C_GOLD_DIM, fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: FONT_BODY, transition: "all 0.18s" }}
              onMouseEnter={e => { e.currentTarget.style.background = `${C_GOLD}0a`; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              🔄 Yeniden Ölçüm
            </button>
          </div>
        )}

        {/* Şehir sayısı */}
        <div style={{ marginTop: "auto", padding: "10px 12px", background: "rgba(0,0,0,0.2)", borderRadius: "7px", fontSize: "11px", color: "#3a2a08", lineHeight: "1.6", fontFamily: FONT_BODY }}>
          📍 {CITIES.length} il merkezi · QGIS SVG haritası
        </div>
      </div>

      {/* ── Harita ── */}
      <div style={{ flex: 1, position: "relative", padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", background: C_BG }}>
        <div ref={mapRef} style={{ position: "relative", width: "100%", height: "100%", maxWidth: "760px", maxHeight: "480px" }}>
          <TurkeyMapSVG />
          {cityA && cityB && (
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              <defs>
                <marker id="arrowM" markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto">
                  <path d="M0,0 L9,4.5 L0,9 Z" fill={C_GOLD} />
                </marker>
              </defs>
              <line x1={`${cityA.x * 100}%`} y1={`${cityA.y * 100}%`} x2={`${cityB.x * 100}%`} y2={`${cityB.y * 100}%`}
                stroke={C_GOLD} strokeWidth="2.5" strokeDasharray="9,5" markerEnd="url(#arrowM)" opacity="0.92" />
              {step === "result" && (
                <text x={`${(cityA.x + cityB.x) / 2 * 100}%`} y={`${(cityA.y + cityB.y) / 2 * 100 - 3}%`}
                  textAnchor="middle" fontSize="13" fontWeight="800" fill={C_GOLD} fontFamily={FONT_MONO}
                  style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.95))" }}>
                  {realKm.toFixed(0)} km
                </text>
              )}
            </svg>
          )}
          {CITIES.map(city => {
            const isA = cityA?.id === city.id, isB = cityB?.id === city.id;
            return (
              <div key={city.id} onClick={() => handleCity(city)}
                style={{ position: "absolute", left: `${city.x * 100}%`, top: `${city.y * 100}%`, transform: "translate(-50%,-50%)", cursor: "pointer", zIndex: 10, transition: "transform 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translate(-50%,-50%) scale(1.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translate(-50%,-50%)"; }}>
                <div style={{ width: "13px", height: "13px", borderRadius: "50%", background: isA ? C_GREEN : isB ? C_GOLD : "#ef4444", border: `2px solid ${isA ? "#00ff88" : isB ? "#fff" : "#ff8888"}`, boxShadow: `0 0 9px ${isA ? C_GREEN : isB ? C_GOLD : "#ef444488"}` }} />
                <div style={{ position: "absolute", left: "16px", top: "-5px", fontSize: "11px", fontWeight: "700", color: isA ? C_GREEN : isB ? C_GOLD : "#c8a060", whiteSpace: "nowrap", background: "rgba(7,17,30,0.9)", padding: "2px 6px", borderRadius: "4px", fontFamily: FONT_BODY }}>
                  {city.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TurkeyMapSVG() {
  // Gerçek QGIS SVG: viewBox="0 0 3507 2480"
  // Harita çerçevesi: offset(295, 259), boyut 2980×2097
  // clip-path ile beyaz marjinleri gizle
  // Şehir noktaları SVG'deki kırmızı circle merkezlerinden normalize edilmiştir
  return (
    <div style={{
      position: "absolute", inset: 0,
      clipPath: "inset(10.5% 8.5% 13.5% 8.5%)",
      borderRadius: "4px",
      overflow: "hidden",
    }}>
      <img
        src="/9/harita/Türkiye_Haritası6.svg"
        alt="Türkiye il haritası"
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "fill",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DÖNÜŞTÜR SEKMESİ
// ═══════════════════════════════════════════════════════════════════════════════
function ConvertTab() {
  const [mode, setMode]       = useState<"mapToReal" | "realToMap">("mapToReal");
  const [selScale, setSelScale] = useState(100000);
  const [inputVal, setInputVal] = useState("");
  const num = parseFloat(inputVal.replace(",", ".")) || 0;

  let resultBig = "", formulaText = "", resultSub = "";
  if (num > 0) {
    if (mode === "mapToReal") {
      const cm = num * selScale;
      formulaText = `${num} cm × ${selScale.toLocaleString("tr")} = ${cm.toLocaleString("tr")} cm`;
      resultBig   = formatNum(cm);
      resultSub   = `= ${(cm / 100000) % 1 === 0 ? (cm / 100000).toFixed(0) : (cm / 100000).toFixed(2)} km`;
    } else {
      const realCm = num * 100000;
      const mapCm  = realCm / selScale;
      formulaText  = `${num} km = ${realCm.toLocaleString("tr")} cm ÷ ${selScale.toLocaleString("tr")}`;
      resultBig    = `${mapCm % 1 === 0 ? mapCm.toFixed(0) : mapCm.toFixed(3)} cm`;
      resultSub    = "haritada";
    }
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", justifyContent: "center", padding: "36px 24px", background: `radial-gradient(ellipse at center,#0e1a2e 0%,${C_BG} 100%)` }}>
      <div style={{ width: "100%", maxWidth: "680px", display: "flex", flexDirection: "column", gap: "24px" }}>

        <div style={{ fontSize: "13px", letterSpacing: "3px", color: C_GOLD_DIM, textAlign: "center", fontFamily: FONT_MONO }}>ÖLÇEK DÖNÜŞTÜRÜCÜ</div>

        {/* Mod seçici */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          {([
            ["mapToReal", "📏 Harita → Gerçek", "Harita cm → Gerçek km"],
            ["realToMap", "🗺️ Gerçek → Harita",  "Gerçek km → Harita cm"],
          ] as const).map(([m, label, sub]) => (
            <button key={m} onClick={() => { sndClick(); setMode(m); setInputVal(""); }}
              style={{ flex: 1, padding: "16px 20px", background: mode === m ? `${C_GOLD}12` : "rgba(0,0,0,0.3)", border: `2px solid ${mode === m ? C_GOLD_DIM : `${C_GOLD}12`}`, borderRadius: "12px", cursor: "pointer", fontFamily: FONT_BODY, transition: "all 0.2s" }}>
              <div style={{ fontSize: "16px", fontWeight: "800", color: mode === m ? C_GOLD : "#5a4010" }}>{label}</div>
              <div style={{ fontSize: "13px", color: mode === m ? C_GOLD_DARK : "#2a1a00", marginTop: "4px" }}>{sub}</div>
            </button>
          ))}
        </div>

        {/* Ölçek seçici */}
        <div>
          <div style={{ fontSize: "13px", color: "#7a6030", fontWeight: "700", marginBottom: "10px", letterSpacing: "1px", fontFamily: FONT_BODY }}>ÖLÇEK</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {SCALES.map(s => (
              <button key={s.value} onClick={() => { sndClick(); setSelScale(s.value); }}
                style={{ padding: "10px 18px", background: selScale === s.value ? C_GOLD_DIM : "rgba(0,0,0,0.3)", border: `1.5px solid ${selScale === s.value ? C_GOLD_DIM : `${C_GOLD}15`}`, borderRadius: "8px", color: selScale === s.value ? "#000" : "#5a4010", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: FONT_MONO, transition: "all 0.18s" }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Giriş */}
        <div style={{ padding: "26px 30px", background: "rgba(0,0,0,0.32)", border: "2px solid rgba(251,191,36,0.16)", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={{ fontSize: "15px", color: "#7a6030", fontWeight: "700", display: "block", marginBottom: "12px", fontFamily: FONT_BODY }}>
              {mode === "mapToReal" ? "Harita üzerindeki ölçüm (cm)" : "Gerçek mesafe (km)"}
            </label>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input type="number" value={inputVal} onChange={e => setInputVal(e.target.value)}
                placeholder={mode === "mapToReal" ? "Örn: 3.5" : "Örn: 450"}
                style={{ flex: 1, padding: "16px 18px", background: "rgba(0,0,0,0.45)", border: "2px solid rgba(251,191,36,0.22)", borderRadius: "10px", color: C_GOLD, fontSize: "22px", fontFamily: FONT_MONO, fontWeight: "700", outline: "none" }} />
              <span style={{ fontSize: "18px", color: C_GOLD_DIM, fontWeight: "700", fontFamily: FONT_BODY }}>{mode === "mapToReal" ? "cm" : "km"}</span>
            </div>
          </div>

          {num > 0 && (
            <>
              <div style={{ padding: "14px 18px", background: `${C_GOLD}08`, borderRadius: "10px" }}>
                <div style={{ fontSize: "12px", color: "#7a6030", fontWeight: "600", marginBottom: "5px", fontFamily: FONT_BODY }}>FORMÜL</div>
                <div style={{ fontSize: "14px", color: C_GOLD_DIM, fontWeight: "700", fontFamily: FONT_MONO }}>{formulaText}</div>
              </div>
              <div style={{ textAlign: "center", fontSize: "22px" }}>⬇️</div>
              <div style={{ padding: "22px 26px", background: "rgba(16,185,129,0.08)", border: "2px solid rgba(16,185,129,0.25)", borderRadius: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "13px", color: C_GREEN, fontWeight: "700", marginBottom: "8px", letterSpacing: "1px", fontFamily: FONT_BODY }}>SONUÇ</div>
                <div style={{ fontSize: "42px", fontWeight: "800", color: C_GREEN, fontFamily: FONT_MONO }}>{resultBig}</div>
                <div style={{ fontSize: "14px", color: "#065f46", marginTop: "6px", fontFamily: FONT_BODY }}>{resultSub}</div>
              </div>
            </>
          )}
        </div>

        {/* Referans tablosu */}
        <div style={{ padding: "22px 26px", background: "rgba(0,0,0,0.22)", border: `1px solid ${C_GOLD}0d`, borderRadius: "14px" }}>
          <div style={{ fontSize: "13px", color: "#7a6030", fontWeight: "700", marginBottom: "14px", letterSpacing: "1px", fontFamily: FONT_BODY }}>
            HIZLI REFERANS — 1/{selScale.toLocaleString("tr")} ölçek
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
            {[1, 2, 3, 5, 10, 15].map(cm => (
              <div key={cm} style={{ display: "flex", justifyContent: "space-between", padding: "9px 14px", background: "rgba(0,0,0,0.18)", borderRadius: "6px" }}>
                <span style={{ fontSize: "14px", color: C_GOLD, fontWeight: "700", fontFamily: FONT_MONO }}>{cm} cm →</span>
                <span style={{ fontSize: "14px", color: C_GREEN, fontWeight: "700", fontFamily: FONT_MONO }}>{formatNum(cm * selScale)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SEKMESİ
// ═══════════════════════════════════════════════════════════════════════════════
function TestTab() {
  const [qIdx,     setQIdx]     = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score,    setScore]    = useState(0);
  const [answers,  setAnswers]  = useState<boolean[]>([]);
  const [done,     setDone]     = useState(false);
  const q = TEST_ITEMS[qIdx];

  const handleAnswer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    const ok = i === q.correct;
    if (ok) { setScore(s => s + 20); sndOK(); } else { sndFail(); }
    setAnswers(a => [...a, ok]);
  };
  const next  = () => { sndClick(); if (qIdx >= TEST_ITEMS.length - 1) { setDone(true); return; } setQIdx(i => i + 1); setSelected(null); };
  const retry = () => { setQIdx(0); setSelected(null); setScore(0); setAnswers([]); setDone(false); };

  if (done) {
    const pct = Math.round((score / (TEST_ITEMS.length * 20)) * 100);
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", background: `radial-gradient(ellipse at center,#1a1000 0%,${C_BG} 100%)` }}>
        <div style={{ fontSize: "60px" }}>📏</div>
        <div style={{ fontSize: "28px", fontWeight: "800", color: C_GOLD, fontFamily: FONT_BODY }}>TEST TAMAMLANDI!</div>
        <div style={{ fontSize: "52px", fontWeight: "800", color: pct >= 80 ? C_GREEN : pct >= 50 ? C_GOLD : C_RED, fontFamily: FONT_MONO }}>{score} PUAN</div>
        <div style={{ fontSize: "15px", color: "#5a4010", fontFamily: FONT_BODY }}>{answers.filter(Boolean).length}/{TEST_ITEMS.length} doğru · %{pct} başarı</div>
        <div style={{ fontSize: "15px", color: "#8a7040", textAlign: "center", maxWidth: "400px", lineHeight: "1.8", fontFamily: FONT_BODY }}>
          {pct >= 80 ? "🏆 Mükemmel! Harita ölçeğini çok iyi anladın." : pct >= 50 ? "👍 İyi! Dönüştür sekmesini tekrar incele." : "📚 Tekrar dene! Öğren sekmesinden başla."}
        </div>
        <button onClick={retry}
          style={{ padding: "14px 32px", background: `linear-gradient(90deg,${C_GOLD_DARK},${C_GOLD_DIM})`, border: "none", borderRadius: "10px", color: "#fff", fontSize: "15px", fontWeight: "800", letterSpacing: "1px", cursor: "pointer", fontFamily: FONT_BODY }}>
          🔄 Tekrar Dene
        </button>
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    concept: "📐 KAVRAM SORUSU",
    calc:    "🔢 HESAPLAMA SORUSU",
    compare: "⚖️ KARŞILAŞTIRMA SORUSU",
  };

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

      {/* ── Sol: ilerleme paneli ── */}
      <div style={{ width: "250px", flexShrink: 0, borderRight: "1px solid rgba(251,191,36,0.1)", background: C_PANEL, padding: "26px", display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto" }}>
        <SectionTitle>Sorular</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
          {TEST_ITEMS.map((item, i) => {
            const d = i < answers.length, cur = i === qIdx;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", background: cur ? `${C_GOLD}10` : "rgba(0,0,0,0.18)", border: `1.5px solid ${cur ? C_GOLD_DIM : d ? (answers[i] ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)") : "rgba(255,255,255,0.04)"}`, borderRadius: "9px" }}>
                <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: d ? (answers[i] ? C_GREEN : C_RED) : cur ? C_GOLD_DIM : "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800", color: "#fff", flexShrink: 0, fontFamily: FONT_MONO }}>
                  {d ? (answers[i] ? "✓" : "✗") : i + 1}
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: cur ? C_GOLD : d ? (answers[i] ? C_GREEN : C_RED) : "#2a1a00", fontFamily: FONT_BODY }}>Soru {i + 1}</div>
                  <div style={{ fontSize: "11px", color: "#2a1a00", fontFamily: FONT_BODY }}>
                    {item.type === "concept" ? "Kavram" : item.type === "calc" ? "Hesaplama" : "Karşılaştırma"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <SDivider />
        <div style={{ padding: "14px 16px", background: `${C_GOLD}0a`, border: `1px solid ${C_GOLD}15`, borderRadius: "10px" }}>
          <div style={{ fontSize: "12px", color: "#5a4010", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px", fontFamily: FONT_BODY }}>PUAN</div>
          <div style={{ fontSize: "36px", fontWeight: "800", color: C_GOLD, fontFamily: FONT_MONO }}>{score}</div>
          <div style={{ fontSize: "13px", color: "#3a2a00", fontFamily: FONT_BODY }}>/ {TEST_ITEMS.length * 20}</div>
        </div>
      </div>

      {/* ── Soru alanı ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "30px 40px", overflowY: "auto", gap: "20px" }}>

        {/* İlerleme çubuğu */}
        <div style={{ width: "100%", maxWidth: "660px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", color: "#5a4010", fontWeight: "700", letterSpacing: "1px", fontFamily: FONT_BODY }}>SORU {qIdx + 1} / {TEST_ITEMS.length}</span>
            <span style={{ fontSize: "13px", color: C_GOLD_DIM, fontFamily: FONT_BODY }}>{Math.round((qIdx / TEST_ITEMS.length) * 100)}% tamamlandı</span>
          </div>
          <div style={{ height: "6px", background: `${C_GOLD}15`, borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(qIdx / TEST_ITEMS.length) * 100}%`, background: `linear-gradient(90deg,${C_GOLD_DARK},${C_GOLD_DIM},${C_GOLD})`, borderRadius: "3px", transition: "width 0.4s ease" }} />
          </div>
        </div>

        {/* Tür rozeti */}
        <div style={{ alignSelf: "flex-start", maxWidth: "660px", width: "100%" }}>
          <span style={{ padding: "6px 14px", background: `${C_GOLD}12`, border: `1px solid ${C_GOLD}22`, borderRadius: "20px", fontSize: "12px", color: C_GOLD_DIM, fontWeight: "700", letterSpacing: "1px", fontFamily: FONT_BODY }}>
            {typeLabels[q.type]}
          </span>
        </div>

        {/* Soru metni */}
        <div style={{ maxWidth: "660px", width: "100%", padding: "22px 26px", background: `${C_GOLD}08`, border: `1.5px solid ${C_GOLD}20`, borderRadius: "14px" }}>
          <p style={{ fontSize: "16px", color: "#d4a84a", lineHeight: "1.9", margin: 0, fontWeight: "600", fontFamily: FONT_BODY }}>{q.q}</p>
        </div>

        {/* Şıklar */}
        <div style={{ maxWidth: "660px", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {q.opts.map((opt, i) => {
            const isSel = selected === i, isCorr = i === q.correct, show = selected !== null;
            let bg = "rgba(0,0,0,0.25)", border = "rgba(255,255,255,0.07)", color = "#6a5030";
            if (show) {
              if (isCorr)       { bg = "rgba(16,185,129,0.1)";  border = C_GREEN; color = C_GREEN; }
              else if (isSel)   { bg = "rgba(239,68,68,0.1)";   border = C_RED;   color = C_RED;   }
            } else if (isSel)   { bg = `${C_GOLD}12`;           border = C_GOLD_DIM; color = C_GOLD; }
            return (
              <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null}
                style={{ padding: "16px 18px", background: bg, border: `2px solid ${border}`, borderRadius: "12px", cursor: selected !== null ? "default" : "pointer", fontFamily: FONT_BODY, textAlign: "left", transition: "all 0.18s" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: show && isCorr ? C_GREEN : show && isSel ? C_RED : `${C_GOLD}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800", color: show ? "#fff" : C_GOLD_DIM, flexShrink: 0, marginTop: "1px", fontFamily: FONT_MONO }}>
                    {show && isCorr ? "✓" : show && isSel && !isCorr ? "✗" : String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ fontSize: "14px", color, fontWeight: "600", lineHeight: "1.6", fontFamily: FONT_BODY }}>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Açıklama */}
        {selected !== null && (
          <div style={{ maxWidth: "660px", width: "100%", padding: "18px 22px", background: selected === q.correct ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `2px solid ${selected === q.correct ? "rgba(16,185,129,0.28)" : "rgba(239,68,68,0.28)"}`, borderRadius: "14px" }}>
            <div style={{ fontSize: "16px", fontWeight: "800", color: selected === q.correct ? C_GREEN : C_RED, marginBottom: "10px", fontFamily: FONT_BODY }}>
              {selected === q.correct ? "✅ DOĞRU!" : "❌ YANLIŞ!"}
            </div>
            <p style={{ fontSize: "14px", color: "#8a7050", lineHeight: "1.85", margin: 0, fontWeight: "500", fontFamily: FONT_BODY }}>{q.exp}</p>
          </div>
        )}

        {/* İleri butonu */}
        {selected !== null && (
          <button onClick={next}
            style={{ padding: "15px 40px", background: `linear-gradient(90deg,${C_GOLD_DARK},${C_GOLD_DIM},${C_GOLD})`, border: "none", borderRadius: "12px", color: "#000", fontSize: "15px", fontWeight: "800", letterSpacing: "1.5px", cursor: "pointer", fontFamily: FONT_BODY, boxShadow: `0 4px 22px ${C_GOLD_DIM}55`, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}>
            {qIdx >= TEST_ITEMS.length - 1 ? "🏁 Sonuçları Gör" : "⏭ Sonraki Soru"}
          </button>
        )}
      </div>
    </div>
  );
}