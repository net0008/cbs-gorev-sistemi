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
// Koordinatlar: PNG resim üzerinde coğrafi (WGS84 lon/lat) → normalize piksel
// Resim: 26°E-44°E, 36°N-42°N
const CITIES: City[] = [
  {id:"adana",name:"Adana",x:0.5349,y:0.7844},
  {id:"adiyaman",name:"Adıyaman",x:0.6828,y:0.6827},
  {id:"afyonkarahisar",name:"Afyonkarahisar",x:0.296,y:0.5496},
  {id:"agri",name:"Ağrı",x:0.9213,y:0.4222},
  {id:"aksaray",name:"Aksaray",x:0.4707,y:0.6018},
  {id:"amasya",name:"Amasya",x:0.5605,y:0.2986},
  {id:"ankara",name:"Ankara",x:0.412,y:0.3957},
  {id:"antalya",name:"Antalya",x:0.304,y:0.7984},
  {id:"ardahan",name:"Ardahan",x:0.9038,y:0.2371},
  {id:"artvin",name:"Artvin",x:0.8597,y:0.2277},
  {id:"aydin",name:"Aydın",x:0.1614,y:0.6705},
  {id:"balikesir",name:"Balıkesir",x:0.1633,y:0.4318},
  {id:"bartin",name:"Bartın",x:0.3858,y:0.167},
  {id:"batman",name:"Batman",x:0.8254,y:0.6672},
  {id:"bayburt",name:"Bayburt",x:0.78,y:0.3509},
  {id:"bilecik",name:"Bilecik",x:0.2679,y:0.3661},
  {id:"bingol",name:"Bingöl",x:0.7937,y:0.5335},
  {id:"bitlis",name:"Bitlis",x:0.8741,y:0.5981},
  {id:"bolu",name:"Bolu",x:0.3494,y:0.2863},
  {id:"burdur",name:"Burdur",x:0.2835,y:0.6885},
  {id:"bursa",name:"Bursa",x:0.222,y:0.3607},
  {id:"canakkale",name:"Çanakkale",x:0.0894,y:0.3644},
  {id:"cankiri",name:"Çankırı",x:0.4498,y:0.3051},
  {id:"corum",name:"Çorum",x:0.5166,y:0.3114},
  {id:"denizli",name:"Denizli",x:0.2237,y:0.6815},
  {id:"diyarbakir",name:"Diyarbakır",x:0.7802,y:0.663},
  {id:"duzce",name:"Düzce",x:0.3268,y:0.2728},
  {id:"edirne",name:"Edirne",x:0.0968,y:0.1617},
  {id:"elazig",name:"Elazığ",x:0.7299,y:0.5608},
  {id:"erzincan",name:"Erzincan",x:0.7434,y:0.4183},
  {id:"erzurum",name:"Erzurum",x:0.8325,y:0.397},
  {id:"eskisehir",name:"Eskişehir",x:0.295,y:0.4147},
  {id:"gaziantep",name:"Gaziantep",x:0.6378,y:0.7758},
  {id:"giresun",name:"Giresun",x:0.6885,y:0.2636},
  {id:"gumushane",name:"Gümüşhane",x:0.7428,y:0.3236},
  {id:"hakkari",name:"Hakkari",x:0.9557,y:0.7078},
  {id:"hatay",name:"Hatay",x:0.5769,y:0.8908},
  {id:"igdir",name:"Iğdır",x:0.9709,y:0.3958},
  {id:"isparta",name:"Isparta",x:0.2967,y:0.6827},
  {id:"istanbul",name:"İstanbul",x:0.2179,y:0.2501},
  {id:"izmir",name:"İzmir",x:0.1262,y:0.5956},
  {id:"kahramanmaras",name:"Kahramanmaraş",x:0.615,y:0.708},
  {id:"karabuk",name:"Karabük",x:0.4,y:0.2256},
  {id:"karaman",name:"Karaman",x:0.4297,y:0.7604},
  {id:"kars",name:"Kars",x:0.9236,y:0.3051},
  {id:"kastamonu",name:"Kastamonu",x:0.4577,y:0.2018},
  {id:"kayseri",name:"Kayseri",x:0.5431,y:0.5539},
  {id:"kilis",name:"Kilis",x:0.6247,y:0.8221},
  {id:"kirikkale",name:"Kırıkkale",x:0.4443,y:0.4057},
  {id:"kirklareli",name:"Kırklareli",x:0.1303,y:0.154},
  {id:"kirsehir",name:"Kırşehir",x:0.4768,y:0.4989},
  {id:"kocaeli",name:"Kocaeli",x:0.267,y:0.2831},
  {id:"konya",name:"Konya",x:0.3935,y:0.6682},
  {id:"kutahya",name:"Kütahya",x:0.2681,y:0.4617},
  {id:"malatya",name:"Malatya",x:0.6846,y:0.604},
  {id:"manisa",name:"Manisa",x:0.1405,y:0.5696},
  {id:"mardin",name:"Mardin",x:0.8055,y:0.743},
  {id:"mersin",name:"Mersin",x:0.501,y:0.8096},
  {id:"mugla",name:"Muğla",x:0.1875,y:0.7559},
  {id:"mus",name:"Muş",x:0.8435,y:0.5519},
  {id:"nevsehir",name:"Nevşehir",x:0.5046,y:0.5681},
  {id:"nigde",name:"Niğde",x:0.5029,y:0.6555},
  {id:"ordu",name:"Ordu",x:0.6628,y:0.2538},
  {id:"osmaniye",name:"Osmaniye",x:0.5812,y:0.7746},
  {id:"rize",name:"Rize",x:0.7949,y:0.2485},
  {id:"sakarya",name:"Sakarya",x:0.2887,y:0.2826},
  {id:"samsun",name:"Samsun",x:0.5854,y:0.2138},
  {id:"sanliurfa",name:"Şanlıurfa",x:0.7084,y:0.7634},
  {id:"siirt",name:"Siirt",x:0.866,y:0.6608},
  {id:"sinop",name:"Sinop",x:0.5065,y:0.1152},
  {id:"sirnak",name:"Şırnak",x:0.8916,y:0.7156},
  {id:"sivas",name:"Sivas",x:0.6196,y:0.4186},
  {id:"tekirdag",name:"Tekirdağ",x:0.1446,y:0.2548},
  {id:"tokat",name:"Tokat",x:0.5966,y:0.3429},
  {id:"trabzon",name:"Trabzon",x:0.7551,y:0.2512},
  {id:"tunceli",name:"Tunceli",x:0.7461,y:0.5038},
  {id:"usak",name:"Uşak",x:0.2392,y:0.5605},
  {id:"van",name:"Van",x:0.9377,y:0.5856},
  {id:"yalova",name:"Yalova",x:0.2328,y:0.2978},
  {id:"yozgat",name:"Yozgat",x:0.5092,y:0.409},
  {id:"zonguldak",name:"Zonguldak",x:0.3584,y:0.1911},
];
const REAL_KM: Record<string,number> = {
  "adana-adiyaman":337,"adana-afyonkarahisar":578,"adana-agri":978,"adana-aksaray":268,"adana-amasya":602,"adana-ankara":491,"adana-antalya":550,"adana-ardahan":1037,"adana-artvin":1001,"adana-aydin":879,"adana-balikesir":902,"adana-bartin":783,"adana-batman":628,"adana-bayburt":801,"adana-bilecik":785,"adana-bingol":631,"adana-bitlis":741,"adana-bolu":688,"adana-burdur":647,"adana-bursa":856,"adana-canakkale":1093,"adana-cankiri":590,"adana-corum":582,"adana-denizli":761,"adana-diyarbakir":537,"adana-duzce":734,"adana-edirne":1183,"adana-elazig":494,"adana-erzincan":676,"adana-erzurum":807,"adana-eskisehir":690,"adana-gaziantep":216,"adana-giresun":716,"adana-gumushane":780,"adana-hakkari":907,"adana-hatay":196,"adana-igdir":1076,"adana-isparta":618,"adana-istanbul":951,"adana-izmir":909,"adana-kahramanmaras":197,"adana-karabuk":714,"adana-karaman":292,"adana-kars":1012,"adana-kastamonu":696,"adana-kayseri":335,"adana-kilis":251,"adana-kirikkale":485,"adana-kirklareli":1159,"adana-kirsehir":376,"adana-kocaeli_(izmit)":840,"adana-konya":357,"adana-kutahya":675,"adana-malatya":396,"adana-manisa":889,"adana-mardin":549,"adana-mersin":70,"adana-mugla":858,"adana-mus":741,"adana-nevsehir":287,"adana-nigde":207,"adana-ordu":707,"adana-osmaniye":89,"adana-rize":911,"adana-sakarya":803,"adana-samsun":753,"adana-sanliurfa":354,"adana-siirt":714,"adana-sinop":866,"adana-sirnak":718,"adana-sivas":428,"adana-tekirdag":1081,"adana-tokat":492,"adana-trabzon":832,"adana-tunceli":630,"adana-usak":690,"adana-van":900,"adana-yalova":905,"adana-yozgat":489,"adana-zonguldak":764,
  "adiyaman-adana":337,"adiyaman-afyonkarahisar":916,"adiyaman-agri":637,"adiyaman-aksaray":573,"adiyaman-amasya":623,"adiyaman-ankara":732,"adiyaman-antalya":887,"adiyaman-ardahan":741,"adiyaman-artvin":705,"adiyaman-aydin":1217,"adiyaman-balikesir":1240,"adiyaman-bartin":1014,"adiyaman-batman":287,"adiyaman-bayburt":674,"adiyaman-bilecik":1032,"adiyaman-bingol":337,"adiyaman-bitlis":400,"adiyaman-bolu":920,"adiyaman-burdur":984,"adiyaman-bursa":1104,"adiyaman-canakkale":1383,"adiyaman-cankiri":762,"adiyaman-corum":697,"adiyaman-denizli":1098,"adiyaman-diyarbakir":196,"adiyaman-duzce":966,"adiyaman-edirne":1415,"adiyaman-elazig":283,"adiyaman-erzincan":546,"adiyaman-erzurum":511,"adiyaman-eskisehir":952,"adiyaman-gaziantep":151,"adiyaman-giresun":698,"adiyaman-gumushane":677,"adiyaman-hakkari":653,"adiyaman-hatay":316,"adiyaman-igdir":736,"adiyaman-isparta":956,"adiyaman-istanbul":1182,"adiyaman-izmir":1247,"adiyaman-kahramanmaras":162,"adiyaman-karabuk":945,"adiyaman-karaman":630,"adiyaman-kars":716,"adiyaman-kastamonu":868,"adiyaman-kayseri":414,"adiyaman-kilis":210,"adiyaman-kirikkale":658,"adiyaman-kirklareli":1391,"adiyaman-kirsehir":549,"adiyaman-kocaeli_(izmit)":1072,"adiyaman-konya":695,"adiyaman-kutahya":1012,"adiyaman-malatya":186,"adiyaman-manisa":1227,"adiyaman-mardin":294,"adiyaman-mersin":407,"adiyaman-mugla":1196,"adiyaman-mus":445,"adiyaman-nevsehir":497,"adiyaman-nigde":544,"adiyaman-ordu":728,"adiyaman-osmaniye":244,"adiyaman-rize":760,"adiyaman-sakarya":1035,"adiyaman-samsun":752,"adiyaman-sanliurfa":111,"adiyaman-siirt":374,"adiyaman-sinop":877,"adiyaman-sirnak":464,"adiyaman-sivas":410,"adiyaman-tekirdag":1313,"adiyaman-tokat":513,"adiyaman-trabzon":770,"adiyaman-tunceli":419,"adiyaman-usak":1027,"adiyaman-van":559,"adiyaman-yalova":1137,"adiyaman-yozgat":613,"adiyaman-zonguldak":996,
  "afyonkarahisar-adana":578,"afyonkarahisar-adiyaman":916,"afyonkarahisar-agri":1320,"afyonkarahisar-aksaray":358,"afyonkarahisar-amasya":595,"afyonkarahisar-ankara":255,"afyonkarahisar-antalya":287,"afyonkarahisar-ardahan":1361,"afyonkarahisar-artvin":1224,"afyonkarahisar-aydin":340,"afyonkarahisar-balikesir":324,"afyonkarahisar-bartin":517,"afyonkarahisar-batman":1197,"afyonkarahisar-bayburt":1079,"afyonkarahisar-bilecik":207,"afyonkarahisar-bingol":1087,"afyonkarahisar-bitlis":1278,"afyonkarahisar-bolu":417,"afyonkarahisar-burdur":166,"afyonkarahisar-bursa":278,"afyonkarahisar-canakkale":515,"afyonkarahisar-cankiri":398,"afyonkarahisar-corum":504,"afyonkarahisar-denizli":221,"afyonkarahisar-diyarbakir":1098,"afyonkarahisar-duzce":371,"afyonkarahisar-edirne":682,"afyonkarahisar-elazig":949,"afyonkarahisar-erzincan":955,"afyonkarahisar-erzurum":1140,"afyonkarahisar-eskisehir":140,"afyonkarahisar-gaziantep":794,"afyonkarahisar-giresun":865,"afyonkarahisar-gumushane":1027,"afyonkarahisar-hakkari":1486,"afyonkarahisar-hatay":774,"afyonkarahisar-igdir":1464,"afyonkarahisar-isparta":167,"afyonkarahisar-istanbul":450,"afyonkarahisar-izmir":331,"afyonkarahisar-kahramanmaras":772,"afyonkarahisar-karabuk":448,"afyonkarahisar-karaman":339,"afyonkarahisar-kars":1342,"afyonkarahisar-kastamonu":504,"afyonkarahisar-kayseri":513,"afyonkarahisar-kilis":830,"afyonkarahisar-kirikkale":338,"afyonkarahisar-kirklareli":659,"afyonkarahisar-kirsehir":425,"afyonkarahisar-kocaeli_(izmit)":340,"afyonkarahisar-konya":226,"afyonkarahisar-kutahya":97,"afyonkarahisar-malatya":852,"afyonkarahisar-manisa":311,"afyonkarahisar-mardin":1127,"afyonkarahisar-mersin":571,"afyonkarahisar-mugla":348,"afyonkarahisar-mus":1196,"afyonkarahisar-nevsehir":434,"afyonkarahisar-nigde":461,"afyonkarahisar-ordu":823,"afyonkarahisar-osmaniye":667,"afyonkarahisar-rize":1076,"afyonkarahisar-sakarya":302,"afyonkarahisar-samsun":676,"afyonkarahisar-sanliurfa":933,"afyonkarahisar-siirt":1285,"afyonkarahisar-sinop":674,"afyonkarahisar-sirnak":1297,"afyonkarahisar-sivas":706,"afyonkarahisar-tekirdag":581,"afyonkarahisar-tokat":645,"afyonkarahisar-trabzon":997,"afyonkarahisar-tunceli":1078,"afyonkarahisar-usak":112,"afyonkarahisar-van":1412,"afyonkarahisar-yalova":346,"afyonkarahisar-yozgat":479,"afyonkarahisar-zonguldak":483,
  "agri-adana":978,"agri-adiyaman":637,"agri-afyonkarahisar":1320,"agri-aksaray":964,"agri-amasya":740,"agri-ankara":1055,"agri-antalya":1424,"agri-ardahan":305,"agri-artvin":364,"agri-aydin":1624,"agri-balikesir":1579,"agri-bartin":1171,"agri-batman":370,"agri-bayburt":304,"agri-bilecik":1361,"agri-bingol":359,"agri-bitlis":237,"agri-bolu":1146,"agri-burdur":1391,"agri-bursa":1417,"agri-canakkale":1696,"agri-cankiri":985,"agri-corum":830,"agri-denizli":1505,"agri-diyarbakir":441,"agri-duzce":1192,"agri-edirne":1641,"agri-elazig":499,"agri-erzincan":370,"agri-erzurum":182,"agri-eskisehir":1298,"agri-gaziantep":762,"agri-giresun":542,"agri-gumushane":380,"agri-hakkari":428,"agri-hatay":956,"agri-igdir":144,"agri-isparta":1363,"agri-istanbul":1409,"agri-izmir":1651,"agri-kahramanmaras":815,"agri-karabuk":1106,"agri-karaman":1112,"agri-kars":214,"agri-kastamonu":990,"agri-kayseri":816,"agri-kilis":817,"agri-kirikkale":985,"agri-kirklareli":1617,"agri-kirsehir":940,"agri-kocaeli_(izmit)":1298,"agri-konya":1111,"agri-kutahya":1377,"agri-malatya":593,"agri-manisa":1631,"agri-mardin":518,"agri-mersin":1048,"agri-mugla":1632,"agri-mus":246,"agri-nevsehir":888,"agri-nigde":937,"agri-ordu":584,"agri-osmaniye":885,"agri-rize":429,"agri-sakarya":1261,"agri-samsun":731,"agri-sanliurfa":618,"agri-siirt":333,"agri-sinop":891,"agri-sirnak":429,"agri-sivas":618,"agri-tekirdag":1539,"agri-tokat":674,"agri-trabzon":474,"agri-tunceli":418,"agri-usak":1432,"agri-van":233,"agri-yalova":1363,"agri-yozgat":841,"agri-zonguldak":1205,
  "aksaray-adana":268,"aksaray-adiyaman":573,"aksaray-afyonkarahisar":358,"aksaray-agri":964,"aksaray-amasya":420,"aksaray-ankara":224,"aksaray-antalya":460,"aksaray-ardahan":1006,"aksaray-artvin":970,"aksaray-aydin":659,"aksaray-balikesir":682,"aksaray-bartin":515,"aksaray-batman":839,"aksaray-bayburt":724,"aksaray-bilecik":522,"aksaray-bingol":728,"aksaray-bitlis":919,"aksaray-bolu":420,"aksaray-burdur":427,"aksaray-bursa":594,"aksaray-canakkale":873,"aksaray-cankiri":322,"aksaray-corum":330,"aksaray-denizli":541,"aksaray-diyarbakir":740,"aksaray-duzce":466,"aksaray-edirne":915,"aksaray-elazig":591,"aksaray-erzincan":599,"aksaray-erzurum":785,"aksaray-eskisehir":442,"aksaray-gaziantep":484,"aksaray-giresun":690,"aksaray-gumushane":703,"aksaray-hakkari":1176,"aksaray-hatay":464,"aksaray-igdir":1108,"aksaray-isparta":398,"aksaray-istanbul":683,"aksaray-izmir":689,"aksaray-kahramanmaras":414,"aksaray-karabuk":446,"aksaray-karaman":212,"aksaray-kars":987,"aksaray-kastamonu":428,"aksaray-kayseri":155,"aksaray-kilis":520,"aksaray-kirikkale":218,"aksaray-kirklareli":891,"aksaray-kirsehir":108,"aksaray-kocaeli_(izmit)":572,"aksaray-konya":147,"aksaray-kutahya":455,"aksaray-malatya":494,"aksaray-manisa":669,"aksaray-mardin":817,"aksaray-mersin":261,"aksaray-mugla":668,"aksaray-mus":838,"aksaray-nevsehir":76,"aksaray-nigde":113,"aksaray-ordu":648,"aksaray-osmaniye":357,"aksaray-rize":834,"aksaray-sakarya":535,"aksaray-samsun":501,"aksaray-sanliurfa":623,"aksaray-siirt":926,"aksaray-sinop":599,"aksaray-sirnak":986,"aksaray-sivas":351,"aksaray-tekirdag":813,"aksaray-tokat":415,"aksaray-trabzon":755,"aksaray-tunceli":722,"aksaray-usak":470,"aksaray-van":1054,"aksaray-yalova":637,"aksaray-yozgat":222,"aksaray-zonguldak":496,
  "amasya-adana":602,"amasya-adiyaman":623,"amasya-afyonkarahisar":595,"amasya-agri":740,"amasya-aksaray":420,"amasya-ankara":330,"amasya-antalya":822,"amasya-ardahan":781,"amasya-artvin":679,"amasya-aydin":935,"amasya-balikesir":844,"amasya-bartin":436,"amasya-batman":803,"amasya-bayburt":457,"amasya-bilecik":626,"amasya-bingol":641,"amasya-bitlis":832,"amasya-bolu":411,"amasya-burdur":761,"amasya-bursa":682,"amasya-canakkale":962,"amasya-cankiri":245,"amasya-corum":91,"amasya-denizli":816,"amasya-diyarbakir":703,"amasya-duzce":458,"amasya-edirne":906,"amasya-elazig":535,"amasya-erzincan":375,"amasya-erzurum":560,"amasya-eskisehir":573,"amasya-gaziantep":576,"amasya-giresun":320,"amasya-gumushane":436,"amasya-hakkari":1168,"amasya-hatay":673,"amasya-igdir":884,"amasya-isparta":723,"amasya-istanbul":674,"amasya-izmir":926,"amasya-kahramanmaras":500,"amasya-karabuk":371,"amasya-karaman":621,"amasya-kars":762,"amasya-kastamonu":255,"amasya-kayseri":341,"amasya-kilis":639,"amasya-kirikkale":260,"amasya-kirklareli":883,"amasya-kirsehir":312,"amasya-kocaeli_(izmit)":563,"amasya-konya":509,"amasya-kutahya":652,"amasya-malatya":457,"amasya-manisa":906,"amasya-mardin":798,"amasya-mersin":635,"amasya-mugla":943,"amasya-mus":751,"amasya-nevsehir":355,"amasya-nigde":435,"amasya-ordu":278,"amasya-osmaniye":602,"amasya-rize":531,"amasya-sakarya":526,"amasya-samsun":131,"amasya-sanliurfa":706,"amasya-siirt":890,"amasya-sinop":256,"amasya-sirnak":996,"amasya-sivas":221,"amasya-tekirdag":805,"amasya-tokat":112,"amasya-trabzon":452,"amasya-tunceli":498,"amasya-usak":707,"amasya-van":972,"amasya-yalova":628,"amasya-yozgat":199,"amasya-zonguldak":471,
  "ankara-adana":491,"ankara-adiyaman":732,"ankara-afyonkarahisar":255,"ankara-agri":1055,"ankara-aksaray":224,"ankara-amasya":330,"ankara-antalya":542,"ankara-ardahan":1097,"ankara-artvin":960,"ankara-aydin":595,"ankara-balikesir":536,"ankara-bartin":285,"ankara-batman":998,"ankara-bayburt":815,"ankara-bilecik":314,"ankara-bingol":887,"ankara-bitlis":1078,"ankara-bolu":190,"ankara-burdur":421,"ankara-bursa":385,"ankara-canakkale":665,"ankara-cankiri":131,"ankara-corum":240,"ankara-denizli":476,"ankara-diyarbakir":898,"ankara-duzce":237,"ankara-edirne":685,"ankara-elazig":749,"ankara-erzincan":690,"ankara-erzurum":876,"ankara-eskisehir":233,"ankara-gaziantep":647,"ankara-giresun":601,"ankara-gumushane":763,"ankara-hakkari":1376,"ankara-hatay":688,"ankara-igdir":1199,"ankara-isparta":383,"ankara-istanbul":453,"ankara-izmir":586,"ankara-kahramanmaras":572,"ankara-karabuk":216,"ankara-karaman":370,"ankara-kars":1078,"ankara-kastamonu":237,"ankara-kayseri":315,"ankara-kilis":711,"ankara-kirikkale":74,"ankara-kirklareli":662,"ankara-kirsehir":183,"ankara-kocaeli_(izmit)":342,"ankara-konya":259,"ankara-kutahya":312,"ankara-malatya":652,"ankara-manisa":566,"ankara-mardin":980,"ankara-mersin":485,"ankara-mugla":604,"ankara-mus":997,"ankara-nevsehir":275,"ankara-nigde":337,"ankara-ordu":558,"ankara-osmaniye":581,"ankara-rize":811,"ankara-sakarya":305,"ankara-samsun":412,"ankara-sanliurfa":786,"ankara-siirt":1085,"ankara-sinop":407,"ankara-sirnak":1150,"ankara-sivas":442,"ankara-tekirdag":584,"ankara-tokat":380,"ankara-trabzon":733,"ankara-tunceli":813,"ankara-usak":367,"ankara-van":1212,"ankara-yalova":407,"ankara-yozgat":214,"ankara-zonguldak":266,
  "antalya-adana":550,"antalya-adiyaman":887,"antalya-afyonkarahisar":287,"antalya-agri":1424,"antalya-aksaray":460,"antalya-amasya":822,"antalya-ankara":542,"antalya-ardahan":1465,"antalya-artvin":1430,"antalya-aydin":345,"antalya-balikesir":505,"antalya-bartin":804,"antalya-batman":1178,"antalya-bayburt":1183,"antalya-bilecik":472,"antalya-bingol":1188,"antalya-bitlis":1291,"antalya-bolu":682,"antalya-burdur":121,"antalya-bursa":543,"antalya-canakkale":693,"antalya-cankiri":685,"antalya-corum":732,"antalya-denizli":226,"antalya-diyarbakir":1087,"antalya-duzce":636,"antalya-edirne":922,"antalya-elazig":1051,"antalya-erzincan":1059,"antalya-erzurum":1244,"antalya-eskisehir":421,"antalya-gaziantep":766,"antalya-giresun":1092,"antalya-gumushane":1163,"antalya-hakkari":1457,"antalya-hatay":746,"antalya-igdir":1568,"antalya-isparta":131,"antalya-istanbul":715,"antalya-izmir":447,"antalya-kahramanmaras":747,"antalya-karabuk":735,"antalya-karaman":376,"antalya-kars":1447,"antalya-kastamonu":790,"antalya-kayseri":615,"antalya-kilis":801,"antalya-kirikkale":562,"antalya-kirklareli":924,"antalya-kirsehir":568,"antalya-kocaeli_(izmit)":605,"antalya-konya":271,"antalya-kutahya":361,"antalya-malatya":953,"antalya-manisa":427,"antalya-mardin":1099,"antalya-mersin":469,"antalya-mugla":309,"antalya-mus":1298,"antalya-nevsehir":536,"antalya-nigde":541,"antalya-ordu":1050,"antalya-osmaniye":639,"antalya-rize":1303,"antalya-sakarya":567,"antalya-samsun":903,"antalya-sanliurfa":905,"antalya-siirt":1265,"antalya-sinop":961,"antalya-sirnak":1268,"antalya-sivas":811,"antalya-tekirdag":846,"antalya-tokat":872,"antalya-trabzon":1224,"antalya-tunceli":1182,"antalya-usak":290,"antalya-van":1450,"antalya-yalova":610,"antalya-yozgat":681,"antalya-zonguldak":748,
  "ardahan-adana":1037,"ardahan-adiyaman":741,"ardahan-afyonkarahisar":1361,"ardahan-agri":305,"ardahan-aksaray":1006,"ardahan-amasya":781,"ardahan-ankara":1097,"ardahan-antalya":1465,"ardahan-artvin":117,"ardahan-aydin":1665,"ardahan-balikesir":1563,"ardahan-bartin":1133,"ardahan-batman":599,"ardahan-bayburt":346,"ardahan-bilecik":1345,"ardahan-bingol":407,"ardahan-bitlis":484,"ardahan-bolu":1130,"ardahan-burdur":1433,"ardahan-bursa":1401,"ardahan-canakkale":1681,"ardahan-cankiri":990,"ardahan-corum":829,"ardahan-denizli":1546,"ardahan-diyarbakir":545,"ardahan-duzce":1177,"ardahan-edirne":1625,"ardahan-elazig":546,"ardahan-erzincan":412,"ardahan-erzurum":230,"ardahan-eskisehir":1339,"ardahan-gaziantep":881,"ardahan-giresun":468,"ardahan-gumushane":422,"ardahan-hakkari":639,"ardahan-hatay":1015,"ardahan-igdir":222,"ardahan-isparta":1404,"ardahan-istanbul":1393,"ardahan-izmir":1692,"ardahan-kahramanmaras":862,"ardahan-karabuk":1065,"ardahan-karaman":1154,"ardahan-kars":89,"ardahan-kastamonu":954,"ardahan-kayseri":857,"ardahan-kilis":920,"ardahan-kirikkale":1026,"ardahan-kirklareli":1602,"ardahan-kirsehir":981,"ardahan-kocaeli_(izmit)":1282,"ardahan-konya":1153,"ardahan-kutahya":1418,"ardahan-malatya":640,"ardahan-manisa":1672,"ardahan-mardin":639,"ardahan-mersin":1107,"ardahan-mugla":1674,"ardahan-mus":403,"ardahan-nevsehir":930,"ardahan-nigde":978,"ardahan-ordu":511,"ardahan-osmaniye":944,"ardahan-rize":257,"ardahan-sakarya":1245,"ardahan-samsun":657,"ardahan-sanliurfa":721,"ardahan-siirt":579,"ardahan-sinop":818,"ardahan-sirnak":676,"ardahan-sivas":659,"ardahan-tekirdag":1524,"ardahan-tokat":715,"ardahan-trabzon":336,"ardahan-tunceli":460,"ardahan-usak":1473,"ardahan-van":444,"ardahan-yalova":1347,"ardahan-yozgat":882,"ardahan-zonguldak":1166,
  "artvin-adana":1001,"artvin-adiyaman":705,"artvin-afyonkarahisar":1224,"artvin-agri":364,"artvin-aksaray":970,"artvin-amasya":679,"artvin-ankara":960,"artvin-antalya":1430,"artvin-ardahan":117,"artvin-aydin":1564,"artvin-balikesir":1454,"artvin-bartin":1024,"artvin-batman":563,"artvin-bayburt":310,"artvin-bilecik":1236,"artvin-bingol":371,"artvin-bitlis":545,"artvin-bolu":1021,"artvin-burdur":1390,"artvin-bursa":1292,"artvin-canakkale":1571,"artvin-cankiri":881,"artvin-corum":720,"artvin-denizli":1445,"artvin-diyarbakir":509,"artvin-duzce":1067,"artvin-edirne":1516,"artvin-elazig":511,"artvin-erzincan":376,"artvin-erzurum":194,"artvin-eskisehir":1202,"artvin-gaziantep":846,"artvin-giresun":359,"artvin-gumushane":312,"artvin-hakkari":753,"artvin-hatay":980,"artvin-igdir":336,"artvin-isparta":1352,"artvin-istanbul":1284,"artvin-izmir":1555,"artvin-kahramanmaras":827,"artvin-karabuk":956,"artvin-karaman":1118,"artvin-kars":203,"artvin-kastamonu":844,"artvin-kayseri":822,"artvin-kilis":885,"artvin-kirikkale":889,"artvin-kirklareli":1492,"artvin-kirsehir":941,"artvin-kocaeli_(izmit)":1173,"artvin-konya":1117,"artvin-kutahya":1281,"artvin-malatya":605,"artvin-manisa":1535,"artvin-mardin":604,"artvin-mersin":1072,"artvin-mugla":1572,"artvin-mus":464,"artvin-nevsehir":894,"artvin-nigde":943,"artvin-ordu":402,"artvin-osmaniye":909,"artvin-rize":148,"artvin-sakarya":1136,"artvin-samsun":548,"artvin-sanliurfa":686,"artvin-siirt":640,"artvin-sinop":709,"artvin-sirnak":737,"artvin-sivas":624,"artvin-tekirdag":1414,"artvin-tokat":616,"artvin-trabzon":227,"artvin-tunceli":424,"artvin-usak":1336,"artvin-van":558,"artvin-yalova":1238,"artvin-yozgat":828,"artvin-zonguldak":1057,
  "aydin-adana":879,"aydin-adiyaman":1217,"aydin-afyonkarahisar":340,"aydin-agri":1624,"aydin-aksaray":659,"aydin-amasya":935,"aydin-ankara":595,"aydin-antalya":345,"aydin-ardahan":1665,"aydin-artvin":1564,"aydin-balikesir":291,"aydin-bartin":856,"aydin-batman":1499,"aydin-bayburt":1383,"aydin-bilecik":525,"aydin-bingol":1388,"aydin-bitlis":1579,"aydin-bolu":735,"aydin-burdur":286,"aydin-bursa":441,"aydin-canakkale":448,"aydin-cankiri":737,"aydin-corum":844,"aydin-denizli":124,"aydin-diyarbakir":1399,"aydin-duzce":688,"aydin-edirne":667,"aydin-elazig":1250,"aydin-erzincan":1259,"aydin-erzurum":1444,"aydin-eskisehir":474,"aydin-gaziantep":1096,"aydin-giresun":1205,"aydin-gumushane":1367,"aydin-hakkari":1787,"aydin-hatay":1075,"aydin-igdir":1768,"aydin-isparta":288,"aydin-istanbul":681,"aydin-izmir":128,"aydin-kahramanmaras":1073,"aydin-karabuk":787,"aydin-karaman":640,"aydin-kars":1646,"aydin-kastamonu":843,"aydin-kayseri":814,"aydin-kilis":1131,"aydin-kirikkale":678,"aydin-kirklareli":682,"aydin-kirsehir":765,"aydin-kocaeli_(izmit)":569,"aydin-konya":527,"aydin-kutahya":414,"aydin-malatya":1153,"aydin-manisa":152,"aydin-mardin":1428,"aydin-mersin":814,"aydin-mugla":98,"aydin-mus":1497,"aydin-nevsehir":735,"aydin-nigde":762,"aydin-ordu":1162,"aydin-osmaniye":969,"aydin-rize":1416,"aydin-sakarya":620,"aydin-samsun":1016,"aydin-sanliurfa":1234,"aydin-siirt":1586,"aydin-sinop":1014,"aydin-sirnak":1598,"aydin-sivas":1010,"aydin-tekirdag":617,"aydin-tokat":984,"aydin-trabzon":1337,"aydin-tunceli":1382,"aydin-usak":272,"aydin-van":1713,"aydin-yalova":507,"aydin-yozgat":818,"aydin-zonguldak":801,
  "balikesir-adana":902,"balikesir-adiyaman":1240,"balikesir-afyonkarahisar":324,"balikesir-agri":1579,"balikesir-aksaray":682,"balikesir-amasya":844,"balikesir-ankara":536,"balikesir-antalya":505,"balikesir-ardahan":1563,"balikesir-artvin":1454,"balikesir-aydin":291,"balikesir-bartin":587,"balikesir-batman":1521,"balikesir-bayburt":1296,"balikesir-bilecik":257,"balikesir-bingol":1411,"balikesir-bitlis":1602,"balikesir-bolu":433,"balikesir-burdur":393,"balikesir-bursa":152,"balikesir-canakkale":192,"balikesir-cankiri":666,"balikesir-corum":785,"balikesir-denizli":285,"balikesir-diyarbakir":1422,"balikesir-duzce":387,"balikesir-edirne":419,"balikesir-elazig":1273,"balikesir-erzincan":1214,"balikesir-erzurum":1399,"balikesir-eskisehir":303,"balikesir-gaziantep":1118,"balikesir-giresun":1095,"balikesir-gumushane":1257,"balikesir-hakkari":1810,"balikesir-hatay":1098,"balikesir-igdir":1723,"balikesir-isparta":395,"balikesir-istanbul":393,"balikesir-izmir":175,"balikesir-kahramanmaras":1096,"balikesir-karabuk":567,"balikesir-karaman":663,"balikesir-kars":1601,"balikesir-kastamonu":680,"balikesir-kayseri":837,"balikesir-kilis":1154,"balikesir-kirikkale":619,"balikesir-kirklareli":434,"balikesir-kirsehir":706,"balikesir-kocaeli_(izmit)":280,"balikesir-konya":550,"balikesir-kutahya":227,"balikesir-malatya":1176,"balikesir-manisa":138,"balikesir-mardin":1451,"balikesir-mersin":895,"balikesir-mugla":389,"balikesir-mus":1520,"balikesir-nevsehir":758,"balikesir-nigde":785,"balikesir-ordu":1053,"balikesir-osmaniye":991,"balikesir-rize":1306,"balikesir-sakarya":318,"balikesir-samsun":906,"balikesir-sanliurfa":1257,"balikesir-siirt":1609,"balikesir-sinop":859,"balikesir-sirnak":1621,"balikesir-sivas":987,"balikesir-tekirdag":369,"balikesir-tokat":926,"balikesir-trabzon":1227,"balikesir-tunceli":1337,"balikesir-usak":224,"balikesir-van":1736,"balikesir-yalova":218,"balikesir-yozgat":760,"balikesir-zonguldak":499,
  "bartin-adana":783,"bartin-adiyaman":1014,"bartin-afyonkarahisar":517,"bartin-agri":1171,"bartin-aksaray":515,"bartin-amasya":436,"bartin-ankara":285,"bartin-antalya":804,"bartin-ardahan":1133,"bartin-artvin":1024,"bartin-aydin":856,"bartin-balikesir":587,"bartin-batman":1237,"bartin-bayburt":902,"bartin-bilecik":369,"bartin-bingol":1072,"bartin-bitlis":1263,"bartin-bolu":176,"bartin-burdur":682,"bartin-bursa":425,"bartin-canakkale":705,"bartin-cankiri":278,"bartin-corum":373,"bartin-denizli":738,"bartin-diyarbakir":1138,"bartin-duzce":201,"bartin-edirne":649,"bartin-elazig":970,"bartin-erzincan":806,"bartin-erzurum":991,"bartin-eskisehir":444,"bartin-gaziantep":930,"bartin-giresun":665,"bartin-gumushane":827,"bartin-hakkari":1598,"bartin-hatay":979,"bartin-igdir":1315,"bartin-isparta":645,"bartin-istanbul":417,"bartin-izmir":760,"bartin-kahramanmaras":855,"bartin-karabuk":86,"bartin-karaman":661,"bartin-kars":1193,"bartin-kastamonu":181,"bartin-kayseri":598,"bartin-kilis":994,"bartin-kirikkale":357,"bartin-kirklareli":625,"bartin-kirsehir":466,"bartin-kocaeli_(izmit)":306,"bartin-konya":550,"bartin-kutahya":475,"bartin-malatya":892,"bartin-manisa":723,"bartin-mardin":1232,"bartin-mersin":776,"bartin-mugla":865,"bartin-mus":1182,"bartin-nevsehir":558,"bartin-nigde":639,"bartin-ordu":623,"bartin-osmaniye":872,"bartin-rize":876,"bartin-sakarya":269,"bartin-samsun":476,"bartin-sanliurfa":1069,"bartin-siirt":1324,"bartin-sinop":360,"bartin-sirnak":1433,"bartin-sivas":655,"bartin-tekirdag":548,"bartin-tokat":546,"bartin-trabzon":797,"bartin-tunceli":929,"bartin-usak":629,"bartin-van":1403,"bartin-yalova":371,"bartin-yozgat":497,"bartin-zonguldak":88,
  "batman-adana":628,"batman-adiyaman":287,"batman-afyonkarahisar":1197,"batman-agri":370,"batman-aksaray":839,"batman-amasya":803,"batman-ankara":998,"batman-antalya":1178,"batman-ardahan":599,"batman-artvin":563,"batman-aydin":1499,"batman-balikesir":1521,"batman-bartin":1237,"batman-bayburt":494,"batman-bilecik":1298,"batman-bingol":195,"batman-bitlis":133,"batman-bolu":1186,"batman-burdur":1266,"batman-bursa":1370,"batman-canakkale":1649,"batman-cankiri":1028,"batman-corum":870,"batman-denizli":1380,"batman-diyarbakir":99,"batman-duzce":1232,"batman-edirne":1681,"batman-elazig":252,"batman-erzincan":467,"batman-erzurum":369,"batman-eskisehir":1218,"batman-gaziantep":412,"batman-giresun":731,"batman-gumushane":570,"batman-hakkari":456,"batman-hatay":607,"batman-igdir":469,"batman-isparta":1237,"batman-istanbul":1449,"batman-izmir":1528,"batman-kahramanmaras":450,"batman-karabuk":1172,"batman-karaman":921,"batman-kars":585,"batman-kastamonu":1056,"batman-kayseri":680,"batman-kilis":467,"batman-kirikkale":924,"batman-kirklareli":1657,"batman-kirsehir":815,"batman-kocaeli_(izmit)":1338,"batman-konya":986,"batman-kutahya":1294,"batman-malatya":346,"batman-manisa":1508,"batman-mardin":148,"batman-mersin":698,"batman-mugla":1507,"batman-mus":214,"batman-nevsehir":763,"batman-nigde":812,"batman-ordu":774,"batman-osmaniye":535,"batman-rize":618,"batman-sakarya":1301,"batman-samsun":932,"batman-sanliurfa":268,"batman-siirt":86,"batman-sinop":1057,"batman-sirnak":182,"batman-sivas":590,"batman-tekirdag":1579,"batman-tokat":693,"batman-trabzon":663,"batman-tunceli":340,"batman-usak":1309,"batman-van":292,"batman-yalova":1403,"batman-yozgat":810,"batman-zonguldak":1262,
  "bayburt-adana":801,"bayburt-adiyaman":674,"bayburt-afyonkarahisar":1079,"bayburt-agri":304,"bayburt-aksaray":724,"bayburt-amasya":457,"bayburt-ankara":815,"bayburt-antalya":1183,"bayburt-ardahan":346,"bayburt-artvin":310,"bayburt-aydin":1383,"bayburt-balikesir":1296,"bayburt-bartin":902,"bayburt-batman":494,"bayburt-bilecik":1078,"bayburt-bingol":302,"bayburt-bitlis":476,"bayburt-bolu":863,"bayburt-burdur":1151,"bayburt-bursa":1134,"bayburt-canakkale":1414,"bayburt-cankiri":703,"bayburt-corum":548,"bayburt-denizli":1264,"bayburt-diyarbakir":440,"bayburt-duzce":910,"bayburt-edirne":1358,"bayburt-elazig":395,"bayburt-erzincan":157,"bayburt-erzurum":125,"bayburt-eskisehir":1057,"bayburt-gaziantep":730,"bayburt-giresun":237,"bayburt-gumushane":76,"bayburt-hakkari":732,"bayburt-hatay":872,"bayburt-igdir":448,"bayburt-isparta":1122,"bayburt-istanbul":1126,"bayburt-izmir":1410,"bayburt-kahramanmaras":699,"bayburt-karabuk":834,"bayburt-karaman":872,"bayburt-kars":327,"bayburt-kastamonu":722,"bayburt-kayseri":575,"bayburt-kilis":793,"bayburt-kirikkale":744,"bayburt-kirklareli":1335,"bayburt-kirsehir":699,"bayburt-kocaeli_(izmit)":1015,"bayburt-konya":871,"bayburt-kutahya":1136,"bayburt-malatya":489,"bayburt-manisa":1390,"bayburt-mardin":535,"bayburt-mersin":871,"bayburt-mugla":1392,"bayburt-mus":395,"bayburt-nevsehir":648,"bayburt-nigde":696,"bayburt-ordu":280,"bayburt-osmaniye":801,"bayburt-rize":239,"bayburt-sakarya":978,"bayburt-samsun":426,"bayburt-sanliurfa":617,"bayburt-siirt":571,"bayburt-sinop":587,"bayburt-sirnak":667,"bayburt-sivas":377,"bayburt-tekirdag":1257,"bayburt-tokat":391,"bayburt-trabzon":169,"bayburt-tunceli":256,"bayburt-usak":1191,"bayburt-van":537,"bayburt-yalova":1080,"bayburt-yozgat":600,"bayburt-zonguldak":935,
  "bilecik-adana":785,"bilecik-adiyaman":1032,"bilecik-afyonkarahisar":207,"bilecik-agri":1361,"bilecik-aksaray":522,"bilecik-amasya":626,"bilecik-ankara":314,"bilecik-antalya":472,"bilecik-ardahan":1345,"bilecik-artvin":1236,"bilecik-aydin":525,"bilecik-balikesir":257,"bilecik-bartin":369,"bilecik-batman":1298,"bilecik-bayburt":1078,"bilecik-bingol":1187,"bilecik-bitlis":1378,"bilecik-bolu":215,"bilecik-burdur":351,"bilecik-bursa":95,"bilecik-canakkale":374,"bilecik-cankiri":447,"bilecik-corum":563,"bilecik-denizli":406,"bilecik-diyarbakir":1199,"bilecik-duzce":168,"bilecik-edirne":480,"bilecik-elazig":1050,"bilecik-erzincan":996,"bilecik-erzurum":1181,"bilecik-eskisehir":80,"bilecik-gaziantep":948,"bilecik-giresun":877,"bilecik-gumushane":1039,"bilecik-hakkari":1676,"bilecik-hatay":981,"bilecik-igdir":1505,"bilecik-isparta":352,"bilecik-istanbul":248,"bilecik-izmir":430,"bilecik-kahramanmaras":873,"bilecik-karabuk":349,"bilecik-karaman":546,"bilecik-kars":1383,"bilecik-kastamonu":462,"bilecik-kayseri":616,"bilecik-kilis":1011,"bilecik-kirikkale":397,"bilecik-kirklareli":457,"bilecik-kirsehir":483,"bilecik-kocaeli_(izmit)":138,"bilecik-konya":433,"bilecik-kutahya":110,"bilecik-malatya":953,"bilecik-manisa":393,"bilecik-mardin":1281,"bilecik-mersin":778,"bilecik-mugla":533,"bilecik-mus":1297,"bilecik-nevsehir":576,"bilecik-nigde":635,"bilecik-ordu":835,"bilecik-osmaniye":874,"bilecik-rize":1088,"bilecik-sakarya":100,"bilecik-samsun":688,"bilecik-sanliurfa":1087,"bilecik-siirt":1385,"bilecik-sinop":641,"bilecik-sirnak":1450,"bilecik-sivas":765,"bilecik-tekirdag":379,"bilecik-tokat":703,"bilecik-trabzon":1009,"bilecik-tunceli":1119,"bilecik-usak":249,"bilecik-van":1513,"bilecik-yalova":125,"bilecik-yozgat":537,"bilecik-zonguldak":281,
  "bingol-adana":631,"bingol-adiyaman":337,"bingol-afyonkarahisar":1087,"bingol-agri":359,"bingol-aksaray":728,"bingol-amasya":641,"bingol-ankara":887,"bingol-antalya":1188,"bingol-ardahan":407,"bingol-artvin":371,"bingol-aydin":1388,"bingol-balikesir":1411,"bingol-bartin":1072,"bingol-batman":195,"bingol-bayburt":302,"bingol-bilecik":1187,"bingol-bitlis":192,"bingol-bolu":1075,"bingol-burdur":1156,"bingol-bursa":1259,"bingol-canakkale":1538,"bingol-cankiri":918,"bingol-corum":759,"bingol-denizli":1269,"bingol-diyarbakir":141,"bingol-duzce":1122,"bingol-edirne":1570,"bingol-elazig":141,"bingol-erzincan":272,"bingol-erzurum":177,"bingol-eskisehir":1107,"bingol-gaziantep":476,"bingol-giresun":539,"bingol-gumushane":378,"bingol-hakkari":490,"bingol-hatay":610,"bingol-igdir":501,"bingol-isparta":1127,"bingol-istanbul":1338,"bingol-izmir":1418,"bingol-kahramanmaras":457,"bingol-karabuk":1007,"bingol-karaman":876,"bingol-kars":382,"bingol-kastamonu":892,"bingol-kayseri":569,"bingol-kilis":517,"bingol-kirikkale":813,"bingol-kirklareli":1547,"bingol-kirsehir":704,"bingol-kocaeli_(izmit)":1227,"bingol-konya":875,"bingol-kutahya":1183,"bingol-malatya":235,"bingol-manisa":1398,"bingol-mardin":236,"bingol-mersin":702,"bingol-mugla":1397,"bingol-mus":111,"bingol-nevsehir":652,"bingol-nigde":701,"bingol-ordu":582,"bingol-osmaniye":539,"bingol-rize":426,"bingol-sakarya":1190,"bingol-samsun":718,"bingol-sanliurfa":318,"bingol-siirt":287,"bingol-sinop":859,"bingol-sirnak":383,"bingol-sivas":479,"bingol-tekirdag":1469,"bingol-tokat":582,"bingol-trabzon":471,"bingol-tunceli":145,"bingol-usak":1199,"bingol-van":327,"bingol-yalova":1292,"bingol-yozgat":699,"bingol-zonguldak":1107,
  "bitlis-adana":741,"bitlis-adiyaman":400,"bitlis-afyonkarahisar":1278,"bitlis-agri":237,"bitlis-aksaray":919,"bitlis-amasya":832,"bitlis-ankara":1078,"bitlis-antalya":1291,"bitlis-ardahan":484,"bitlis-artvin":545,"bitlis-aydin":1579,"bitlis-balikesir":1602,"bitlis-bartin":1263,"bitlis-batman":133,"bitlis-bayburt":476,"bitlis-bilecik":1378,"bitlis-bingol":192,"bitlis-bolu":1266,"bitlis-burdur":1347,"bitlis-bursa":1450,"bitlis-canakkale":1729,"bitlis-cankiri":1109,"bitlis-corum":950,"bitlis-denizli":1460,"bitlis-diyarbakir":204,"bitlis-duzce":1313,"bitlis-edirne":1761,"bitlis-elazig":332,"bitlis-erzincan":463,"bitlis-erzurum":351,"bitlis-eskisehir":1298,"bitlis-gaziantep":525,"bitlis-giresun":713,"bitlis-gumushane":552,"bitlis-hakkari":323,"bitlis-hatay":719,"bitlis-igdir":336,"bitlis-isparta":1318,"bitlis-istanbul":1529,"bitlis-izmir":1609,"bitlis-kahramanmaras":562,"bitlis-karabuk":1198,"bitlis-karaman":1034,"bitlis-kars":452,"bitlis-kastamonu":1082,"bitlis-kayseri":760,"bitlis-kilis":580,"bitlis-kirikkale":1004,"bitlis-kirklareli":1738,"bitlis-kirsehir":895,"bitlis-kocaeli_(izmit)":1418,"bitlis-konya":1066,"bitlis-kutahya":1374,"bitlis-malatya":426,"bitlis-manisa":1589,"bitlis-mardin":281,"bitlis-mersin":811,"bitlis-mugla":1588,"bitlis-mus":81,"bitlis-nevsehir":843,"bitlis-nigde":892,"bitlis-ordu":756,"bitlis-osmaniye":648,"bitlis-rize":600,"bitlis-sakarya":1381,"bitlis-samsun":909,"bitlis-sanliurfa":381,"bitlis-siirt":95,"bitlis-sinop":1050,"bitlis-sirnak":191,"bitlis-sivas":670,"bitlis-tekirdag":1660,"bitlis-tokat":773,"bitlis-trabzon":646,"bitlis-tunceli":336,"bitlis-usak":1390,"bitlis-van":159,"bitlis-yalova":1483,"bitlis-yozgat":890,"bitlis-zonguldak":1298,
  "bolu-adana":688,"bolu-adiyaman":920,"bolu-afyonkarahisar":417,"bolu-agri":1146,"bolu-aksaray":420,"bolu-amasya":411,"bolu-ankara":190,"bolu-antalya":682,"bolu-ardahan":1130,"bolu-artvin":1021,"bolu-aydin":735,"bolu-balikesir":433,"bolu-bartin":176,"bolu-batman":1186,"bolu-bayburt":863,"bolu-bilecik":215,"bolu-bingol":1075,"bolu-bitlis":1266,"bolu-burdur":561,"bolu-bursa":271,"bolu-canakkale":551,"bolu-cankiri":233,"bolu-corum":348,"bolu-denizli":616,"bolu-diyarbakir":1086,"bolu-duzce":47,"bolu-edirne":495,"bolu-elazig":937,"bolu-erzincan":781,"bolu-erzurum":966,"bolu-eskisehir":290,"bolu-gaziantep":835,"bolu-giresun":662,"bolu-gumushane":824,"bolu-hakkari":1564,"bolu-hatay":884,"bolu-igdir":1290,"bolu-isparta":563,"bolu-istanbul":263,"bolu-izmir":606,"bolu-kahramanmaras":760,"bolu-karabuk":134,"bolu-karaman":566,"bolu-kars":1168,"bolu-kastamonu":247,"bolu-kayseri":504,"bolu-kilis":899,"bolu-kirikkale":262,"bolu-kirklareli":471,"bolu-kirsehir":371,"bolu-kocaeli_(izmit)":152,"bolu-konya":455,"bolu-kutahya":321,"bolu-malatya":840,"bolu-manisa":569,"bolu-mardin":1168,"bolu-mersin":681,"bolu-mugla":743,"bolu-mus":1185,"bolu-nevsehir":463,"bolu-nigde":544,"bolu-ordu":620,"bolu-osmaniye":777,"bolu-rize":873,"bolu-sakarya":115,"bolu-samsun":473,"bolu-sanliurfa":974,"bolu-siirt":1273,"bolu-sinop":426,"bolu-sirnak":1338,"bolu-sivas":630,"bolu-tekirdag":394,"bolu-tokat":521,"bolu-trabzon":794,"bolu-tunceli":904,"bolu-usak":459,"bolu-van":1378,"bolu-yalova":217,"bolu-yozgat":402,"bolu-zonguldak":158,
  "burdur-adana":647,"burdur-adiyaman":984,"burdur-afyonkarahisar":166,"burdur-agri":1391,"burdur-aksaray":427,"burdur-amasya":761,"burdur-ankara":421,"burdur-antalya":121,"burdur-ardahan":1433,"burdur-artvin":1390,"burdur-aydin":286,"burdur-balikesir":393,"burdur-bartin":682,"burdur-batman":1266,"burdur-bayburt":1151,"burdur-bilecik":351,"burdur-bingol":1156,"burdur-bitlis":1347,"burdur-bolu":561,"burdur-bursa":422,"burdur-canakkale":586,"burdur-cankiri":563,"burdur-corum":670,"burdur-denizli":167,"burdur-diyarbakir":1167,"burdur-duzce":514,"burdur-edirne":826,"burdur-elazig":1018,"burdur-erzincan":1026,"burdur-erzurum":1212,"burdur-eskisehir":300,"burdur-gaziantep":863,"burdur-giresun":1031,"burdur-gumushane":1130,"burdur-hakkari":1555,"burdur-hatay":843,"burdur-igdir":1535,"burdur-isparta":29,"burdur-istanbul":594,"burdur-izmir":388,"burdur-kahramanmaras":841,"burdur-karabuk":613,"burdur-karaman":408,"burdur-kars":1414,"burdur-kastamonu":669,"burdur-kayseri":582,"burdur-kilis":899,"burdur-kirikkale":504,"burdur-kirklareli":803,"burdur-kirsehir":536,"burdur-kocaeli_(izmit)":483,"burdur-konya":295,"burdur-kutahya":240,"burdur-malatya":921,"burdur-manisa":368,"burdur-mardin":1196,"burdur-mersin":578,"burdur-mugla":240,"burdur-mus":1265,"burdur-nevsehir":503,"burdur-nigde":530,"burdur-ordu":988,"burdur-osmaniye":736,"burdur-rize":1242,"burdur-sakarya":446,"burdur-samsun":842,"burdur-sanliurfa":1002,"burdur-siirt":1353,"burdur-sinop":840,"burdur-sirnak":1366,"burdur-sivas":778,"burdur-tekirdag":725,"burdur-tokat":810,"burdur-trabzon":1163,"burdur-tunceli":1150,"burdur-usak":169,"burdur-van":1481,"burdur-yalova":489,"burdur-yozgat":644,"burdur-zonguldak":627,
  "bursa-adana":856,"bursa-adiyaman":1104,"bursa-afyonkarahisar":278,"bursa-agri":1417,"bursa-aksaray":594,"bursa-amasya":682,"bursa-ankara":385,"bursa-antalya":543,"bursa-ardahan":1401,"bursa-artvin":1292,"bursa-aydin":441,"bursa-balikesir":152,"bursa-bartin":425,"bursa-batman":1370,"bursa-bayburt":1134,"bursa-bilecik":95,"bursa-bingol":1259,"bursa-bitlis":1450,"bursa-bolu":271,"bursa-burdur":422,"bursa-canakkale":270,"bursa-cankiri":504,"bursa-corum":634,"bursa-denizli":435,"bursa-diyarbakir":1270,"bursa-duzce":225,"bursa-edirne":428,"bursa-elazig":1121,"bursa-erzincan":1052,"bursa-erzurum":1237,"bursa-eskisehir":152,"bursa-gaziantep":1020,"bursa-giresun":933,"bursa-gumushane":1095,"bursa-hakkari":1748,"bursa-hatay":1052,"bursa-igdir":1561,"bursa-isparta":423,"bursa-istanbul":244,"bursa-izmir":325,"bursa-kahramanmaras":944,"bursa-karabuk":405,"bursa-karaman":617,"bursa-kars":1440,"bursa-kastamonu":518,"bursa-kayseri":688,"bursa-kilis":1083,"bursa-kirikkale":468,"bursa-kirklareli":443,"bursa-kirsehir":555,"bursa-kocaeli_(izmit)":131,"bursa-konya":504,"bursa-kutahya":182,"bursa-malatya":1024,"bursa-manisa":288,"bursa-mardin":1352,"bursa-mersin":849,"bursa-mugla":539,"bursa-mus":1369,"bursa-nevsehir":648,"bursa-nigde":706,"bursa-ordu":891,"bursa-osmaniye":945,"bursa-rize":1144,"bursa-sakarya":156,"bursa-samsun":744,"bursa-sanliurfa":1158,"bursa-siirt":1457,"bursa-sinop":697,"bursa-sirnak":1522,"bursa-sivas":836,"bursa-tekirdag":379,"bursa-tokat":775,"bursa-trabzon":1065,"bursa-tunceli":1175,"bursa-usak":320,"bursa-van":1585,"bursa-yalova":69,"bursa-yozgat":609,"bursa-zonguldak":337,
  "canakkale-adana":1093,"canakkale-adiyaman":1383,"canakkale-afyonkarahisar":515,"canakkale-agri":1696,"canakkale-aksaray":873,"canakkale-amasya":962,"canakkale-ankara":665,"canakkale-antalya":693,"canakkale-ardahan":1681,"canakkale-artvin":1571,"canakkale-aydin":448,"canakkale-balikesir":192,"canakkale-bartin":705,"canakkale-batman":1649,"canakkale-bayburt":1414,"canakkale-bilecik":374,"canakkale-bingol":1538,"canakkale-bitlis":1729,"canakkale-bolu":551,"canakkale-burdur":586,"canakkale-bursa":270,"canakkale-cankiri":783,"canakkale-corum":914,"canakkale-denizli":473,"canakkale-diyarbakir":1550,"canakkale-duzce":504,"canakkale-edirne":231,"canakkale-elazig":1401,"canakkale-erzincan":1331,"canakkale-erzurum":1517,"canakkale-eskisehir":431,"canakkale-gaziantep":1299,"canakkale-giresun":1212,"canakkale-gumushane":1374,"canakkale-hakkari":2027,"canakkale-hatay":1290,"canakkale-igdir":1840,"canakkale-isparta":588,"canakkale-istanbul":314,"canakkale-izmir":327,"canakkale-kahramanmaras":1224,"canakkale-karabuk":684,"canakkale-karaman":854,"canakkale-kars":1719,"canakkale-kastamonu":797,"canakkale-kayseri":967,"canakkale-kilis":1345,"canakkale-kirikkale":748,"canakkale-kirklareli":245,"canakkale-kirsehir":834,"canakkale-kocaeli_(izmit)":398,"canakkale-konya":741,"canakkale-kutahya":419,"canakkale-malatya":1304,"canakkale-manisa":328,"canakkale-mardin":1632,"canakkale-mersin":1087,"canakkale-mugla":547,"canakkale-mus":1648,"canakkale-nevsehir":927,"canakkale-nigde":986,"canakkale-ordu":1170,"canakkale-osmaniye":1183,"canakkale-rize":1423,"canakkale-sakarya":436,"canakkale-samsun":1023,"canakkale-sanliurfa":1438,"canakkale-siirt":1736,"canakkale-sinop":977,"canakkale-sirnak":1801,"canakkale-sivas":1116,"canakkale-tekirdag":181,"canakkale-tokat":1054,"canakkale-trabzon":1344,"canakkale-tunceli":1454,"canakkale-usak":418,"canakkale-van":1864,"canakkale-yalova":335,"canakkale-yozgat":888,"canakkale-zonguldak":617,
  "cankiri-adana":590,"cankiri-adiyaman":762,"cankiri-afyonkarahisar":398,"cankiri-agri":985,"cankiri-aksaray":322,"cankiri-amasya":245,"cankiri-ankara":131,"cankiri-antalya":685,"cankiri-ardahan":990,"cankiri-artvin":881,"cankiri-aydin":737,"cankiri-balikesir":666,"cankiri-bartin":278,"cankiri-batman":1028,"cankiri-bayburt":703,"cankiri-bilecik":447,"cankiri-bingol":918,"cankiri-bitlis":1109,"cankiri-bolu":233,"cankiri-burdur":563,"cankiri-bursa":504,"cankiri-canakkale":783,"cankiri-corum":155,"cankiri-denizli":619,"cankiri-diyarbakir":929,"cankiri-duzce":279,"cankiri-edirne":727,"cankiri-elazig":780,"cankiri-erzincan":620,"cankiri-erzurum":806,"cankiri-eskisehir":376,"cankiri-gaziantep":678,"cankiri-giresun":522,"cankiri-gumushane":684,"cankiri-hakkari":1406,"cankiri-hatay":776,"cankiri-igdir":1129,"cankiri-isparta":525,"cankiri-istanbul":495,"cankiri-izmir":729,"cankiri-kahramanmaras":603,"cankiri-karabuk":192,"cankiri-karaman":465,"cankiri-kars":1008,"cankiri-kastamonu":106,"cankiri-kayseri":346,"cankiri-kilis":741,"cankiri-kirikkale":104,"cankiri-kirklareli":704,"cankiri-kirsehir":214,"cankiri-kocaeli_(izmit)":385,"cankiri-konya":354,"cankiri-kutahya":455,"cankiri-malatya":683,"cankiri-manisa":709,"cankiri-mardin":1011,"cankiri-mersin":583,"cankiri-mugla":746,"cankiri-mus":1027,"cankiri-nevsehir":306,"cankiri-nigde":386,"cankiri-ordu":480,"cankiri-osmaniye":679,"cankiri-rize":733,"cankiri-sakarya":347,"cankiri-samsun":333,"cankiri-sanliurfa":817,"cankiri-siirt":1116,"cankiri-sinop":276,"cankiri-sirnak":1180,"cankiri-sivas":442,"cankiri-tekirdag":626,"cankiri-tokat":333,"cankiri-trabzon":654,"cankiri-tunceli":743,"cankiri-usak":510,"cankiri-van":1218,"cankiri-yalova":450,"cankiri-yozgat":245,"cankiri-zonguldak":292,
  "corum-adana":582,"corum-adiyaman":697,"corum-afyonkarahisar":504,"corum-agri":830,"corum-aksaray":330,"corum-amasya":91,"corum-ankara":240,"corum-antalya":732,"corum-ardahan":829,"corum-artvin":720,"corum-aydin":844,"corum-balikesir":785,"corum-bartin":373,"corum-batman":870,"corum-bayburt":548,"corum-bilecik":563,"corum-bingol":759,"corum-bitlis":950,"corum-bolu":348,"corum-burdur":670,"corum-bursa":634,"corum-canakkale":914,"corum-cankiri":155,"corum-denizli":725,"corum-diyarbakir":770,"corum-duzce":395,"corum-edirne":843,"corum-elazig":602,"corum-erzincan":465,"corum-erzurum":651,"corum-eskisehir":483,"corum-gaziantep":613,"corum-giresun":361,"corum-gumushane":523,"corum-hakkari":1248,"corum-hatay":711,"corum-igdir":974,"corum-isparta":632,"corum-istanbul":611,"corum-izmir":835,"corum-kahramanmaras":538,"corum-karabuk":308,"corum-karaman":530,"corum-kars":853,"corum-kastamonu":192,"corum-kayseri":281,"corum-kilis":676,"corum-kirikkale":169,"corum-kirklareli":820,"corum-kirsehir":221,"corum-kocaeli_(izmit)":501,"corum-konya":419,"corum-kutahya":561,"corum-malatya":524,"corum-manisa":815,"corum-mardin":865,"corum-mersin":575,"corum-mugla":853,"corum-mus":869,"corum-nevsehir":295,"corum-nigde":375,"corum-ordu":319,"corum-osmaniye":640,"corum-rize":572,"corum-sakarya":463,"corum-samsun":172,"corum-sanliurfa":752,"corum-siirt":957,"corum-sinop":265,"corum-sirnak":1063,"corum-sivas":287,"corum-tekirdag":742,"corum-tokat":178,"corum-trabzon":493,"corum-tunceli":589,"corum-usak":616,"corum-van":1063,"corum-yalova":566,"corum-yozgat":108,"corum-zonguldak":408,
  "denizli-adana":761,"denizli-adiyaman":1098,"denizli-afyonkarahisar":221,"denizli-agri":1505,"denizli-aksaray":541,"denizli-amasya":816,"denizli-ankara":476,"denizli-antalya":226,"denizli-ardahan":1546,"denizli-artvin":1445,"denizli-aydin":124,"denizli-balikesir":285,"denizli-bartin":738,"denizli-batman":1380,"denizli-bayburt":1264,"denizli-bilecik":406,"denizli-bingol":1269,"denizli-bitlis":1460,"denizli-bolu":616,"denizli-burdur":167,"denizli-bursa":435,"denizli-canakkale":473,"denizli-cankiri":619,"denizli-corum":725,"denizli-diyarbakir":1280,"denizli-duzce":570,"denizli-edirne":702,"denizli-elazig":1131,"denizli-erzincan":1140,"denizli-erzurum":1325,"denizli-eskisehir":355,"denizli-gaziantep":977,"denizli-giresun":1086,"denizli-gumushane":1248,"denizli-hakkari":1668,"denizli-hatay":957,"denizli-igdir":1649,"denizli-isparta":169,"denizli-istanbul":649,"denizli-izmir":226,"denizli-kahramanmaras":954,"denizli-karabuk":669,"denizli-karaman":522,"denizli-kars":1528,"denizli-kastamonu":724,"denizli-kayseri":696,"denizli-kilis":1012,"denizli-kirikkale":559,"denizli-kirklareli":716,"denizli-kirsehir":646,"denizli-kocaeli_(izmit)":539,"denizli-konya":409,"denizli-kutahya":296,"denizli-malatya":1034,"denizli-manisa":206,"denizli-mardin":1310,"denizli-mersin":695,"denizli-mugla":150,"denizli-mus":1379,"denizli-nevsehir":617,"denizli-nigde":643,"denizli-ordu":1044,"denizli-osmaniye":850,"denizli-rize":1297,"denizli-sakarya":501,"denizli-samsun":897,"denizli-sanliurfa":1116,"denizli-siirt":1467,"denizli-sinop":895,"denizli-sirnak":1479,"denizli-sivas":891,"denizli-tekirdag":652,"denizli-tokat":866,"denizli-trabzon":1218,"denizli-tunceli":1263,"denizli-usak":153,"denizli-van":1594,"denizli-yalova":501,"denizli-yozgat":700,"denizli-zonguldak":682,
  "diyarbakir-adana":537,"diyarbakir-adiyaman":196,"diyarbakir-afyonkarahisar":1098,"diyarbakir-agri":441,"diyarbakir-aksaray":740,"diyarbakir-amasya":703,"diyarbakir-ankara":898,"diyarbakir-antalya":1087,"diyarbakir-ardahan":545,"diyarbakir-artvin":509,"diyarbakir-aydin":1399,"diyarbakir-balikesir":1422,"diyarbakir-bartin":1138,"diyarbakir-batman":99,"diyarbakir-bayburt":440,"diyarbakir-bilecik":1199,"diyarbakir-bingol":141,"diyarbakir-bitlis":204,"diyarbakir-bolu":1086,"diyarbakir-burdur":1167,"diyarbakir-bursa":1270,"diyarbakir-canakkale":1550,"diyarbakir-cankiri":929,"diyarbakir-corum":770,"diyarbakir-denizli":1280,"diyarbakir-duzce":1133,"diyarbakir-edirne":1581,"diyarbakir-elazig":152,"diyarbakir-erzincan":407,"diyarbakir-erzurum":315,"diyarbakir-eskisehir":1119,"diyarbakir-gaziantep":321,"diyarbakir-giresun":677,"diyarbakir-gumushane":516,"diyarbakir-hakkari":527,"diyarbakir-hatay":515,"diyarbakir-igdir":540,"diyarbakir-isparta":1138,"diyarbakir-istanbul":1349,"diyarbakir-izmir":1429,"diyarbakir-kahramanmaras":358,"diyarbakir-karabuk":1073,"diyarbakir-karaman":829,"diyarbakir-kars":520,"diyarbakir-kastamonu":957,"diyarbakir-kayseri":581,"diyarbakir-kilis":375,"diyarbakir-kirikkale":824,"diyarbakir-kirklareli":1558,"diyarbakir-kirsehir":715,"diyarbakir-kocaeli_(izmit)":1239,"diyarbakir-konya":887,"diyarbakir-kutahya":1195,"diyarbakir-malatya":246,"diyarbakir-manisa":1409,"diyarbakir-mardin":94,"diyarbakir-mersin":607,"diyarbakir-mugla":1408,"diyarbakir-mus":249,"diyarbakir-nevsehir":664,"diyarbakir-nigde":713,"diyarbakir-ordu":720,"diyarbakir-osmaniye":444,"diyarbakir-rize":564,"diyarbakir-sakarya":1201,"diyarbakir-samsun":832,"diyarbakir-sanliurfa":177,"diyarbakir-siirt":187,"diyarbakir-sinop":957,"diyarbakir-sirnak":293,"diyarbakir-sivas":490,"diyarbakir-tekirdag":1480,"diyarbakir-tokat":594,"diyarbakir-trabzon":610,"diyarbakir-tunceli":280,"diyarbakir-usak":1210,"diyarbakir-van":363,"diyarbakir-yalova":1304,"diyarbakir-yozgat":710,"diyarbakir-zonguldak":1162,
  "duzce-adana":734,"duzce-adiyaman":966,"duzce-afyonkarahisar":371,"duzce-agri":1192,"duzce-aksaray":466,"duzce-amasya":458,"duzce-ankara":237,"duzce-antalya":636,"duzce-ardahan":1177,"duzce-artvin":1067,"duzce-aydin":688,"duzce-balikesir":387,"duzce-bartin":201,"duzce-batman":1232,"duzce-bayburt":910,"duzce-bilecik":168,"duzce-bingol":1122,"duzce-bitlis":1313,"duzce-bolu":47,"duzce-burdur":514,"duzce-bursa":225,"duzce-canakkale":504,"duzce-cankiri":279,"duzce-corum":395,"duzce-denizli":570,"duzce-diyarbakir":1133,"duzce-edirne":448,"duzce-elazig":984,"duzce-erzincan":827,"duzce-erzurum":1013,"duzce-eskisehir":244,"duzce-gaziantep":882,"duzce-giresun":708,"duzce-gumushane":870,"duzce-hakkari":1610,"duzce-hatay":931,"duzce-igdir":1336,"duzce-isparta":516,"duzce-istanbul":216,"duzce-izmir":560,"duzce-kahramanmaras":807,"duzce-karabuk":180,"duzce-karaman":613,"duzce-kars":1215,"duzce-kastamonu":293,"duzce-kayseri":550,"duzce-kilis":945,"duzce-kirikkale":308,"duzce-kirklareli":425,"duzce-kirsehir":418,"duzce-kocaeli_(izmit)":106,"duzce-konya":501,"duzce-kutahya":274,"duzce-malatya":887,"duzce-manisa":523,"duzce-mardin":1215,"duzce-mersin":727,"duzce-mugla":697,"duzce-mus":1231,"duzce-nevsehir":510,"duzce-nigde":590,"duzce-ordu":666,"duzce-osmaniye":824,"duzce-rize":919,"duzce-sakarya":68,"duzce-samsun":519,"duzce-sanliurfa":1021,"duzce-siirt":1320,"duzce-sinop":473,"duzce-sirnak":1384,"duzce-sivas":676,"duzce-tekirdag":347,"duzce-tokat":567,"duzce-trabzon":840,"duzce-tunceli":950,"duzce-usak":412,"duzce-van":1425,"duzce-yalova":171,"duzce-yozgat":449,"duzce-zonguldak":113,
  "edirne-adana":1183,"edirne-adiyaman":1415,"edirne-afyonkarahisar":682,"edirne-agri":1641,"edirne-aksaray":915,"edirne-amasya":906,"edirne-ankara":685,"edirne-antalya":922,"edirne-ardahan":1625,"edirne-artvin":1516,"edirne-aydin":667,"edirne-balikesir":419,"edirne-bartin":649,"edirne-batman":1681,"edirne-bayburt":1358,"edirne-bilecik":480,"edirne-bingol":1570,"edirne-bitlis":1761,"edirne-bolu":495,"edirne-burdur":826,"edirne-bursa":428,"edirne-canakkale":231,"edirne-cankiri":727,"edirne-corum":843,"edirne-denizli":702,"edirne-diyarbakir":1581,"edirne-duzce":448,"edirne-elazig":1432,"edirne-erzincan":1276,"edirne-erzurum":1461,"edirne-eskisehir":555,"edirne-gaziantep":1330,"edirne-giresun":1157,"edirne-gumushane":1319,"edirne-hakkari":2059,"edirne-hatay":1379,"edirne-igdir":1785,"edirne-isparta":828,"edirne-istanbul":232,"edirne-izmir":546,"edirne-kahramanmaras":1255,"edirne-karabuk":629,"edirne-karaman":1021,"edirne-kars":1663,"edirne-kastamonu":741,"edirne-kayseri":998,"edirne-kilis":1394,"edirne-kirikkale":757,"edirne-kirklareli":67,"edirne-kirsehir":866,"edirne-kocaeli_(izmit)":345,"edirne-konya":908,"edirne-kutahya":586,"edirne-malatya":1335,"edirne-manisa":556,"edirne-mardin":1663,"edirne-mersin":1176,"edirne-mugla":766,"edirne-mus":1679,"edirne-nevsehir":958,"edirne-nigde":1039,"edirne-ordu":1114,"edirne-osmaniye":1272,"edirne-rize":1368,"edirne-sakarya":380,"edirne-samsun":968,"edirne-sanliurfa":1469,"edirne-siirt":1768,"edirne-sinop":921,"edirne-sirnak":1833,"edirne-sivas":1125,"edirne-tekirdag":148,"edirne-tokat":1016,"edirne-trabzon":1289,"edirne-tunceli":1399,"edirne-usak":642,"edirne-van":1873,"edirne-yalova":410,"edirne-yozgat":897,"edirne-zonguldak":561,
  "elazig-adana":494,"elazig-adiyaman":283,"elazig-afyonkarahisar":949,"elazig-agri":499,"elazig-aksaray":591,"elazig-amasya":535,"elazig-ankara":749,"elazig-antalya":1051,"elazig-ardahan":546,"elazig-artvin":511,"elazig-aydin":1250,"elazig-balikesir":1273,"elazig-bartin":970,"elazig-batman":252,"elazig-bayburt":395,"elazig-bilecik":1050,"elazig-bingol":141,"elazig-bitlis":332,"elazig-bolu":937,"elazig-burdur":1018,"elazig-bursa":1121,"elazig-canakkale":1401,"elazig-cankiri":780,"elazig-corum":602,"elazig-denizli":1131,"elazig-diyarbakir":152,"elazig-duzce":984,"elazig-edirne":1432,"elazig-erzincan":267,"elazig-erzurum":317,"elazig-eskisehir":970,"elazig-gaziantep":338,"elazig-giresun":558,"elazig-gumushane":397,"elazig-hakkari":630,"elazig-hatay":472,"elazig-igdir":640,"elazig-isparta":989,"elazig-istanbul":1200,"elazig-izmir":1280,"elazig-kahramanmaras":319,"elazig-karabuk":905,"elazig-karaman":739,"elazig-kars":522,"elazig-kastamonu":789,"elazig-kayseri":432,"elazig-kilis":402,"elazig-kirikkale":675,"elazig-kirklareli":1409,"elazig-kirsehir":566,"elazig-kocaeli_(izmit)":1090,"elazig-konya":738,"elazig-kutahya":1046,"elazig-malatya":97,"elazig-manisa":1260,"elazig-mardin":247,"elazig-mersin":564,"elazig-mugla":1259,"elazig-mus":251,"elazig-nevsehir":515,"elazig-nigde":564,"elazig-ordu":601,"elazig-osmaniye":401,"elazig-rize":560,"elazig-sakarya":1052,"elazig-samsun":664,"elazig-sanliurfa":318,"elazig-siirt":339,"elazig-sinop":789,"elazig-sirnak":445,"elazig-sivas":322,"elazig-tekirdag":1331,"elazig-tokat":426,"elazig-trabzon":491,"elazig-tunceli":140,"elazig-usak":1061,"elazig-van":466,"elazig-yalova":1155,"elazig-yozgat":542,"elazig-zonguldak":1014,
  "erzincan-adana":676,"erzincan-adiyaman":546,"erzincan-afyonkarahisar":955,"erzincan-agri":370,"erzincan-aksaray":599,"erzincan-amasya":375,"erzincan-ankara":690,"erzincan-antalya":1059,"erzincan-ardahan":412,"erzincan-artvin":376,"erzincan-aydin":1259,"erzincan-balikesir":1214,"erzincan-bartin":806,"erzincan-batman":467,"erzincan-bayburt":157,"erzincan-bilecik":996,"erzincan-bingol":272,"erzincan-bitlis":463,"erzincan-bolu":781,"erzincan-burdur":1026,"erzincan-bursa":1052,"erzincan-canakkale":1331,"erzincan-cankiri":620,"erzincan-corum":465,"erzincan-denizli":1140,"erzincan-diyarbakir":407,"erzincan-duzce":827,"erzincan-edirne":1276,"erzincan-elazig":267,"erzincan-erzurum":191,"erzincan-eskisehir":933,"erzincan-gaziantep":602,"erzincan-giresun":297,"erzincan-gumushane":136,"erzincan-hakkari":798,"erzincan-hatay":748,"erzincan-igdir":514,"erzincan-isparta":998,"erzincan-istanbul":1044,"erzincan-izmir":1286,"erzincan-kahramanmaras":575,"erzincan-karabuk":741,"erzincan-karaman":747,"erzincan-kars":393,"erzincan-kastamonu":625,"erzincan-kayseri":451,"erzincan-kilis":665,"erzincan-kirikkale":620,"erzincan-kirklareli":1252,"erzincan-kirsehir":575,"erzincan-kocaeli_(izmit)":933,"erzincan-konya":746,"erzincan-kutahya":1012,"erzincan-malatya":361,"erzincan-manisa":1266,"erzincan-mardin":501,"erzincan-mersin":747,"erzincan-mugla":1267,"erzincan-mus":381,"erzincan-nevsehir":523,"erzincan-nigde":572,"erzincan-ordu":340,"erzincan-osmaniye":677,"erzincan-rize":299,"erzincan-sakarya":896,"erzincan-samsun":451,"erzincan-sanliurfa":573,"erzincan-siirt":558,"erzincan-sinop":593,"erzincan-sirnak":654,"erzincan-sivas":253,"erzincan-tekirdag":1174,"erzincan-tokat":309,"erzincan-trabzon":229,"erzincan-tunceli":128,"erzincan-usak":1067,"erzincan-van":603,"erzincan-yalova":998,"erzincan-yozgat":476,"erzincan-zonguldak":840,
  "erzurum-adana":807,"erzurum-adiyaman":511,"erzurum-afyonkarahisar":1140,"erzurum-agri":182,"erzurum-aksaray":785,"erzurum-amasya":560,"erzurum-ankara":876,"erzurum-antalya":1244,"erzurum-ardahan":230,"erzurum-artvin":194,"erzurum-aydin":1444,"erzurum-balikesir":1399,"erzurum-bartin":991,"erzurum-batman":369,"erzurum-bayburt":125,"erzurum-bilecik":1181,"erzurum-bingol":177,"erzurum-bitlis":351,"erzurum-bolu":966,"erzurum-burdur":1212,"erzurum-bursa":1237,"erzurum-canakkale":1517,"erzurum-cankiri":806,"erzurum-corum":651,"erzurum-denizli":1325,"erzurum-diyarbakir":315,"erzurum-duzce":1013,"erzurum-edirne":1461,"erzurum-elazig":317,"erzurum-erzincan":191,"erzurum-eskisehir":1118,"erzurum-gaziantep":652,"erzurum-giresun":362,"erzurum-gumushane":201,"erzurum-hakkari":610,"erzurum-hatay":786,"erzurum-igdir":326,"erzurum-isparta":1183,"erzurum-istanbul":1229,"erzurum-izmir":1471,"erzurum-kahramanmaras":633,"erzurum-karabuk":926,"erzurum-karaman":933,"erzurum-kars":205,"erzurum-kastamonu":810,"erzurum-kayseri":636,"erzurum-kilis":691,"erzurum-kirikkale":805,"erzurum-kirklareli":1438,"erzurum-kirsehir":760,"erzurum-kocaeli_(izmit)":1118,"erzurum-konya":932,"erzurum-kutahya":1197,"erzurum-malatya":411,"erzurum-manisa":1451,"erzurum-mardin":410,"erzurum-mersin":878,"erzurum-mugla":1453,"erzurum-mus":270,"erzurum-nevsehir":709,"erzurum-nigde":757,"erzurum-ordu":405,"erzurum-osmaniye":715,"erzurum-rize":249,"erzurum-sakarya":1081,"erzurum-samsun":551,"erzurum-sanliurfa":492,"erzurum-siirt":447,"erzurum-sinop":712,"erzurum-sirnak":543,"erzurum-sivas":438,"erzurum-tekirdag":1360,"erzurum-tokat":494,"erzurum-trabzon":294,"erzurum-tunceli":239,"erzurum-usak":1252,"erzurum-van":415,"erzurum-yalova":1184,"erzurum-yozgat":661,"erzurum-zonguldak":1026,
  "eskisehir-adana":690,"eskisehir-adiyaman":952,"eskisehir-afyonkarahisar":140,"eskisehir-agri":1298,"eskisehir-aksaray":442,"eskisehir-amasya":573,"eskisehir-ankara":233,"eskisehir-antalya":421,"eskisehir-ardahan":1339,"eskisehir-artvin":1202,"eskisehir-aydin":474,"eskisehir-balikesir":303,"eskisehir-bartin":444,"eskisehir-batman":1218,"eskisehir-bayburt":1057,"eskisehir-bilecik":80,"eskisehir-bingol":1107,"eskisehir-bitlis":1298,"eskisehir-bolu":290,"eskisehir-burdur":300,"eskisehir-bursa":152,"eskisehir-canakkale":431,"eskisehir-cankiri":376,"eskisehir-corum":483,"eskisehir-denizli":355,"eskisehir-diyarbakir":1119,"eskisehir-duzce":244,"eskisehir-edirne":555,"eskisehir-elazig":970,"eskisehir-erzincan":933,"eskisehir-erzurum":1118,"eskisehir-gaziantep":868,"eskisehir-giresun":843,"eskisehir-gumushane":1005,"eskisehir-hakkari":1596,"eskisehir-hatay":886,"eskisehir-igdir":1442,"eskisehir-isparta":301,"eskisehir-istanbul":323,"eskisehir-izmir":412,"eskisehir-kahramanmaras":792,"eskisehir-karabuk":426,"eskisehir-karaman":451,"eskisehir-kars":1321,"eskisehir-kastamonu":482,"eskisehir-kayseri":536,"eskisehir-kilis":931,"eskisehir-kirikkale":316,"eskisehir-kirklareli":532,"eskisehir-kirsehir":403,"eskisehir-kocaeli_(izmit)":213,"eskisehir-konya":337,"eskisehir-kutahya":79,"eskisehir-malatya":872,"eskisehir-manisa":392,"eskisehir-mardin":1200,"eskisehir-mersin":683,"eskisehir-mugla":482,"eskisehir-mus":1217,"eskisehir-nevsehir":496,"eskisehir-nigde":555,"eskisehir-ordu":801,"eskisehir-osmaniye":779,"eskisehir-rize":1054,"eskisehir-sakarya":176,"eskisehir-samsun":654,"eskisehir-sanliurfa":1006,"eskisehir-siirt":1305,"eskisehir-sinop":652,"eskisehir-sirnak":1370,"eskisehir-sivas":684,"eskisehir-tekirdag":454,"eskisehir-tokat":623,"eskisehir-trabzon":975,"eskisehir-tunceli":1056,"eskisehir-usak":217,"eskisehir-van":1433,"eskisehir-yalova":219,"eskisehir-yozgat":457,"eskisehir-zonguldak":356,
  "gaziantep-adana":216,"gaziantep-adiyaman":151,"gaziantep-afyonkarahisar":794,"gaziantep-agri":762,"gaziantep-aksaray":484,"gaziantep-amasya":576,"gaziantep-ankara":647,"gaziantep-antalya":766,"gaziantep-ardahan":881,"gaziantep-artvin":846,"gaziantep-aydin":1096,"gaziantep-balikesir":1118,"gaziantep-bartin":930,"gaziantep-batman":412,"gaziantep-bayburt":730,"gaziantep-bilecik":948,"gaziantep-bingol":476,"gaziantep-bitlis":525,"gaziantep-bolu":835,"gaziantep-burdur":863,"gaziantep-bursa":1020,"gaziantep-canakkale":1299,"gaziantep-cankiri":678,"gaziantep-corum":613,"gaziantep-denizli":977,"gaziantep-diyarbakir":321,"gaziantep-duzce":882,"gaziantep-edirne":1330,"gaziantep-elazig":338,"gaziantep-erzincan":602,"gaziantep-erzurum":652,"gaziantep-eskisehir":868,"gaziantep-giresun":689,"gaziantep-gumushane":754,"gaziantep-hakkari":691,"gaziantep-hatay":194,"gaziantep-igdir":860,"gaziantep-isparta":835,"gaziantep-istanbul":1098,"gaziantep-izmir":1125,"gaziantep-kahramanmaras":78,"gaziantep-karabuk":861,"gaziantep-karaman":509,"gaziantep-kars":857,"gaziantep-kastamonu":784,"gaziantep-kayseri":330,"gaziantep-kilis":63,"gaziantep-kirikkale":574,"gaziantep-kirklareli":1307,"gaziantep-kirsehir":464,"gaziantep-kocaeli_(izmit)":988,"gaziantep-konya":574,"gaziantep-kutahya":891,"gaziantep-malatya":241,"gaziantep-manisa":1106,"gaziantep-mardin":333,"gaziantep-mersin":286,"gaziantep-mugla":1075,"gaziantep-mus":586,"gaziantep-nevsehir":413,"gaziantep-nigde":423,"gaziantep-ordu":681,"gaziantep-osmaniye":123,"gaziantep-rize":884,"gaziantep-sakarya":950,"gaziantep-samsun":705,"gaziantep-sanliurfa":139,"gaziantep-siirt":499,"gaziantep-sinop":829,"gaziantep-sirnak":502,"gaziantep-sivas":402,"gaziantep-tekirdag":1229,"gaziantep-tokat":466,"gaziantep-trabzon":806,"gaziantep-tunceli":475,"gaziantep-usak":906,"gaziantep-van":684,"gaziantep-yalova":1053,"gaziantep-yozgat":529,"gaziantep-zonguldak":912,
  "giresun-adana":716,"giresun-adiyaman":698,"giresun-afyonkarahisar":865,"giresun-agri":542,"giresun-aksaray":690,"giresun-amasya":320,"giresun-ankara":601,"giresun-antalya":1092,"giresun-ardahan":468,"giresun-artvin":359,"giresun-aydin":1205,"giresun-balikesir":1095,"giresun-bartin":665,"giresun-batman":731,"giresun-bayburt":237,"giresun-bilecik":877,"giresun-bingol":539,"giresun-bitlis":713,"giresun-bolu":662,"giresun-burdur":1031,"giresun-bursa":933,"giresun-canakkale":1212,"giresun-cankiri":522,"giresun-corum":361,"giresun-denizli":1086,"giresun-diyarbakir":677,"giresun-duzce":708,"giresun-edirne":1157,"giresun-elazig":558,"giresun-erzincan":297,"giresun-erzurum":362,"giresun-eskisehir":843,"giresun-gaziantep":689,"giresun-gumushane":162,"giresun-hakkari":969,"giresun-hatay":787,"giresun-igdir":686,"giresun-isparta":993,"giresun-istanbul":925,"giresun-izmir":1196,"giresun-kahramanmaras":614,"giresun-karabuk":597,"giresun-karaman":787,"giresun-kars":564,"giresun-kastamonu":485,"giresun-kayseri":490,"giresun-kilis":753,"giresun-kirikkale":530,"giresun-kirklareli":1133,"giresun-kirsehir":582,"giresun-kocaeli_(izmit)":814,"giresun-konya":779,"giresun-kutahya":922,"giresun-malatya":532,"giresun-manisa":1176,"giresun-mardin":772,"giresun-mersin":786,"giresun-mugla":1213,"giresun-mus":632,"giresun-nevsehir":562,"giresun-nigde":611,"giresun-ordu":43,"giresun-osmaniye":716,"giresun-rize":211,"giresun-sakarya":777,"giresun-samsun":189,"giresun-sanliurfa":781,"giresun-siirt":808,"giresun-sinop":350,"giresun-sirnak":904,"giresun-sivas":292,"giresun-tekirdag":1055,"giresun-tokat":257,"giresun-trabzon":132,"giresun-tunceli":420,"giresun-usak":977,"giresun-van":774,"giresun-yalova":879,"giresun-yozgat":469,"giresun-zonguldak":698,
  "gumushane-adana":780,"gumushane-adiyaman":677,"gumushane-afyonkarahisar":1027,"gumushane-agri":380,"gumushane-aksaray":703,"gumushane-amasya":436,"gumushane-ankara":763,"gumushane-antalya":1163,"gumushane-ardahan":422,"gumushane-artvin":312,"gumushane-aydin":1367,"gumushane-balikesir":1257,"gumushane-bartin":827,"gumushane-batman":570,"gumushane-bayburt":76,"gumushane-bilecik":1039,"gumushane-bingol":378,"gumushane-bitlis":552,"gumushane-bolu":824,"gumushane-burdur":1130,"gumushane-bursa":1095,"gumushane-canakkale":1374,"gumushane-cankiri":684,"gumushane-corum":523,"gumushane-denizli":1248,"gumushane-diyarbakir":516,"gumushane-duzce":870,"gumushane-edirne":1319,"gumushane-elazig":397,"gumushane-erzincan":136,"gumushane-erzurum":201,"gumushane-eskisehir":1005,"gumushane-gaziantep":754,"gumushane-giresun":162,"gumushane-hakkari":808,"gumushane-hatay":851,"gumushane-igdir":524,"gumushane-isparta":1101,"gumushane-istanbul":1087,"gumushane-izmir":1358,"gumushane-kahramanmaras":678,"gumushane-karabuk":759,"gumushane-karaman":851,"gumushane-kars":403,"gumushane-kastamonu":647,"gumushane-kayseri":554,"gumushane-kilis":817,"gumushane-kirikkale":692,"gumushane-kirklareli":1295,"gumushane-kirsehir":678,"gumushane-kocaeli_(izmit)":976,"gumushane-konya":850,"gumushane-kutahya":1084,"gumushane-malatya":491,"gumushane-manisa":1338,"gumushane-mardin":611,"gumushane-mersin":850,"gumushane-mugla":1375,"gumushane-mus":471,"gumushane-nevsehir":627,"gumushane-nigde":676,"gumushane-ordu":205,"gumushane-osmaniye":780,"gumushane-rize":164,"gumushane-sakarya":939,"gumushane-samsun":351,"gumushane-sanliurfa":703,"gumushane-siirt":647,"gumushane-sinop":512,"gumushane-sirnak":743,"gumushane-sivas":356,"gumushane-tekirdag":1217,"gumushane-tokat":370,"gumushane-trabzon":94,"gumushane-tunceli":259,"gumushane-usak":1139,"gumushane-van":613,"gumushane-yalova":1041,"gumushane-yozgat":580,"gumushane-zonguldak":860,
  "hakkari-adana":907,"hakkari-adiyaman":653,"hakkari-afyonkarahisar":1486,"hakkari-agri":428,"hakkari-aksaray":1176,"hakkari-amasya":1168,"hakkari-ankara":1376,"hakkari-antalya":1457,"hakkari-ardahan":639,"hakkari-artvin":753,"hakkari-aydin":1787,"hakkari-balikesir":1810,"hakkari-bartin":1598,"hakkari-batman":456,"hakkari-bayburt":732,"hakkari-bilecik":1676,"hakkari-bingol":490,"hakkari-bitlis":323,"hakkari-bolu":1564,"hakkari-burdur":1555,"hakkari-bursa":1748,"hakkari-canakkale":2027,"hakkari-cankiri":1406,"hakkari-corum":1248,"hakkari-denizli":1668,"hakkari-diyarbakir":527,"hakkari-duzce":1610,"hakkari-edirne":2059,"hakkari-elazig":630,"hakkari-erzincan":798,"hakkari-erzurum":610,"hakkari-eskisehir":1596,"hakkari-gaziantep":691,"hakkari-giresun":969,"hakkari-gumushane":808,"hakkari-hatay":886,"hakkari-igdir":417,"hakkari-isparta":1526,"hakkari-istanbul":1827,"hakkari-izmir":1817,"hakkari-kahramanmaras":769,"hakkari-karabuk":1533,"hakkari-karaman":1200,"hakkari-kars":552,"hakkari-kastamonu":1418,"hakkari-kayseri":1058,"hakkari-kilis":746,"hakkari-kirikkale":1302,"hakkari-kirklareli":2035,"hakkari-kirsehir":1193,"hakkari-kocaeli_(izmit)":1716,"hakkari-konya":1265,"hakkari-kutahya":1582,"hakkari-malatya":724,"hakkari-manisa":1797,"hakkari-mardin":387,"hakkari-mersin":977,"hakkari-mugla":1766,"hakkari-mus":379,"hakkari-nevsehir":1141,"hakkari-nigde":1115,"hakkari-ordu":1012,"hakkari-osmaniye":815,"hakkari-rize":857,"hakkari-sakarya":1679,"hakkari-samsun":1158,"hakkari-sanliurfa":546,"hakkari-siirt":290,"hakkari-sinop":1319,"hakkari-sirnak":191,"hakkari-sivas":968,"hakkari-tekirdag":1957,"hakkari-tokat":1071,"hakkari-trabzon":902,"hakkari-tunceli":633,"hakkari-usak":1598,"hakkari-van":195,"hakkari-yalova":1781,"hakkari-yozgat":1188,"hakkari-zonguldak":1633,
  "hatay-adana":196,"hatay-adiyaman":316,"hatay-afyonkarahisar":774,"hatay-agri":956,"hatay-aksaray":464,"hatay-amasya":673,"hatay-ankara":688,"hatay-antalya":746,"hatay-ardahan":1015,"hatay-artvin":980,"hatay-aydin":1075,"hatay-balikesir":1098,"hatay-bartin":979,"hatay-batman":607,"hatay-bayburt":872,"hatay-bilecik":981,"hatay-bingol":610,"hatay-bitlis":719,"hatay-bolu":884,"hatay-burdur":843,"hatay-bursa":1052,"hatay-canakkale":1290,"hatay-cankiri":776,"hatay-corum":711,"hatay-denizli":957,"hatay-diyarbakir":515,"hatay-duzce":931,"hatay-edirne":1379,"hatay-elazig":472,"hatay-erzincan":748,"hatay-erzurum":786,"hatay-eskisehir":886,"hatay-gaziantep":194,"hatay-giresun":787,"hatay-gumushane":851,"hatay-hakkari":886,"hatay-igdir":1055,"hatay-isparta":814,"hatay-istanbul":1147,"hatay-izmir":1105,"hatay-kahramanmaras":176,"hatay-karabuk":910,"hatay-karaman":488,"hatay-kars":991,"hatay-kastamonu":882,"hatay-kayseri":428,"hatay-kilis":146,"hatay-kirikkale":671,"hatay-kirklareli":1355,"hatay-kirsehir":562,"hatay-kocaeli_(izmit)":1036,"hatay-konya":553,"hatay-kutahya":871,"hatay-malatya":375,"hatay-manisa":1085,"hatay-mardin":527,"hatay-mersin":266,"hatay-mugla":1055,"hatay-mus":719,"hatay-nevsehir":483,"hatay-nigde":403,"hatay-ordu":779,"hatay-osmaniye":127,"hatay-rize":982,"hatay-sakarya":999,"hatay-samsun":802,"hatay-sanliurfa":333,"hatay-siirt":693,"hatay-sinop":927,"hatay-sirnak":697,"hatay-sivas":499,"hatay-tekirdag":1278,"hatay-tokat":564,"hatay-trabzon":903,"hatay-tunceli":609,"hatay-usak":886,"hatay-van":878,"hatay-yalova":1101,"hatay-yozgat":626,"hatay-zonguldak":960,
  "igdir-adana":1076,"igdir-adiyaman":736,"igdir-afyonkarahisar":1464,"igdir-agri":144,"igdir-aksaray":1108,"igdir-amasya":884,"igdir-ankara":1199,"igdir-antalya":1568,"igdir-ardahan":222,"igdir-artvin":336,"igdir-aydin":1768,"igdir-balikesir":1723,"igdir-bartin":1315,"igdir-batman":469,"igdir-bayburt":448,"igdir-bilecik":1505,"igdir-bingol":501,"igdir-bitlis":336,"igdir-bolu":1290,"igdir-burdur":1535,"igdir-bursa":1561,"igdir-canakkale":1840,"igdir-cankiri":1129,"igdir-corum":974,"igdir-denizli":1649,"igdir-diyarbakir":540,"igdir-duzce":1336,"igdir-edirne":1785,"igdir-elazig":640,"igdir-erzincan":514,"igdir-erzurum":326,"igdir-eskisehir":1442,"igdir-gaziantep":860,"igdir-giresun":686,"igdir-gumushane":524,"igdir-hakkari":417,"igdir-hatay":1055,"igdir-isparta":1506,"igdir-istanbul":1552,"igdir-izmir":1795,"igdir-kahramanmaras":898,"igdir-karabuk":1250,"igdir-karaman":1256,"igdir-kars":135,"igdir-kastamonu":1134,"igdir-kayseri":960,"igdir-kilis":915,"igdir-kirikkale":1128,"igdir-kirklareli":1761,"igdir-kirsehir":1084,"igdir-kocaeli_(izmit)":1442,"igdir-konya":1255,"igdir-kutahya":1521,"igdir-malatya":734,"igdir-manisa":1775,"igdir-mardin":616,"igdir-mersin":1147,"igdir-mugla":1776,"igdir-mus":390,"igdir-nevsehir":1032,"igdir-nigde":1081,"igdir-ordu":728,"igdir-osmaniye":984,"igdir-rize":477,"igdir-sakarya":1405,"igdir-samsun":875,"igdir-sanliurfa":716,"igdir-siirt":431,"igdir-sinop":1035,"igdir-sirnak":527,"igdir-sivas":762,"igdir-tekirdag":1683,"igdir-tokat":818,"igdir-trabzon":556,"igdir-tunceli":562,"igdir-usak":1576,"igdir-van":222,"igdir-yalova":1507,"igdir-yozgat":985,"igdir-zonguldak":1349,
  "isparta-adana":618,"isparta-adiyaman":956,"isparta-afyonkarahisar":167,"isparta-agri":1363,"isparta-aksaray":398,"isparta-amasya":723,"isparta-ankara":383,"isparta-antalya":131,"isparta-ardahan":1404,"isparta-artvin":1352,"isparta-aydin":288,"isparta-balikesir":395,"isparta-bartin":645,"isparta-batman":1237,"isparta-bayburt":1122,"isparta-bilecik":352,"isparta-bingol":1127,"isparta-bitlis":1318,"isparta-bolu":563,"isparta-burdur":29,"isparta-bursa":423,"isparta-canakkale":588,"isparta-cankiri":525,"isparta-corum":632,"isparta-denizli":169,"isparta-diyarbakir":1138,"isparta-duzce":516,"isparta-edirne":828,"isparta-elazig":989,"isparta-erzincan":998,"isparta-erzurum":1183,"isparta-eskisehir":301,"isparta-gaziantep":835,"isparta-giresun":993,"isparta-gumushane":1101,"isparta-hakkari":1526,"isparta-hatay":814,"isparta-igdir":1506,"isparta-istanbul":595,"isparta-izmir":390,"isparta-kahramanmaras":812,"isparta-karabuk":576,"isparta-karaman":379,"isparta-kars":1385,"isparta-kastamonu":631,"isparta-kayseri":553,"isparta-kilis":870,"isparta-kirikkale":466,"isparta-kirklareli":804,"isparta-kirsehir":507,"isparta-kocaeli_(izmit)":485,"isparta-konya":266,"isparta-kutahya":242,"isparta-malatya":892,"isparta-manisa":370,"isparta-mardin":1167,"isparta-mersin":566,"isparta-mugla":269,"isparta-mus":1236,"isparta-nevsehir":474,"isparta-nigde":501,"isparta-ordu":951,"isparta-osmaniye":707,"isparta-rize":1204,"isparta-sakarya":448,"isparta-samsun":804,"isparta-sanliurfa":973,"isparta-siirt":1325,"isparta-sinop":802,"isparta-sirnak":1337,"isparta-sivas":749,"isparta-tekirdag":726,"isparta-tokat":772,"isparta-trabzon":1125,"isparta-tunceli":1121,"isparta-usak":170,"isparta-van":1452,"isparta-yalova":491,"isparta-yozgat":607,"isparta-zonguldak":629,
  "istanbul-adana":951,"istanbul-adiyaman":1182,"istanbul-afyonkarahisar":450,"istanbul-agri":1409,"istanbul-aksaray":683,"istanbul-amasya":674,"istanbul-ankara":453,"istanbul-antalya":715,"istanbul-ardahan":1393,"istanbul-artvin":1284,"istanbul-aydin":681,"istanbul-balikesir":393,"istanbul-bartin":417,"istanbul-batman":1449,"istanbul-bayburt":1126,"istanbul-bilecik":248,"istanbul-bingol":1338,"istanbul-bitlis":1529,"istanbul-bolu":263,"istanbul-burdur":594,"istanbul-bursa":244,"istanbul-canakkale":314,"istanbul-cankiri":495,"istanbul-corum":611,"istanbul-denizli":649,"istanbul-diyarbakir":1349,"istanbul-duzce":216,"istanbul-edirne":232,"istanbul-elazig":1200,"istanbul-erzincan":1044,"istanbul-erzurum":1229,"istanbul-eskisehir":323,"istanbul-gaziantep":1098,"istanbul-giresun":925,"istanbul-gumushane":1087,"istanbul-hakkari":1827,"istanbul-hatay":1147,"istanbul-igdir":1552,"istanbul-isparta":595,"istanbul-izmir":566,"istanbul-kahramanmaras":1023,"istanbul-karabuk":396,"istanbul-karaman":789,"istanbul-kars":1431,"istanbul-kastamonu":509,"istanbul-kayseri":766,"istanbul-kilis":1162,"istanbul-kirikkale":525,"istanbul-kirklareli":209,"istanbul-kirsehir":634,"istanbul-kocaeli_(izmit)":113,"istanbul-konya":676,"istanbul-kutahya":354,"istanbul-malatya":1103,"istanbul-manisa":529,"istanbul-mardin":1431,"istanbul-mersin":944,"istanbul-mugla":776,"istanbul-mus":1447,"istanbul-nevsehir":726,"istanbul-nigde":807,"istanbul-ordu":882,"istanbul-osmaniye":1040,"istanbul-rize":1135,"istanbul-sakarya":148,"istanbul-samsun":736,"istanbul-sanliurfa":1237,"istanbul-siirt":1536,"istanbul-sinop":689,"istanbul-sirnak":1601,"istanbul-sivas":893,"istanbul-tekirdag":131,"istanbul-tokat":784,"istanbul-trabzon":1057,"istanbul-tunceli":1167,"istanbul-usak":492,"istanbul-van":1641,"istanbul-yalova":178,"istanbul-yozgat":665,"istanbul-zonguldak":329,
  "izmir-adana":909,"izmir-adiyaman":1247,"izmir-afyonkarahisar":331,"izmir-agri":1651,"izmir-aksaray":689,"izmir-amasya":926,"izmir-ankara":586,"izmir-antalya":447,"izmir-ardahan":1692,"izmir-artvin":1555,"izmir-aydin":128,"izmir-balikesir":175,"izmir-bartin":760,"izmir-batman":1528,"izmir-bayburt":1410,"izmir-bilecik":430,"izmir-bingol":1418,"izmir-bitlis":1609,"izmir-bolu":606,"izmir-burdur":388,"izmir-bursa":325,"izmir-canakkale":327,"izmir-cankiri":729,"izmir-corum":835,"izmir-denizli":226,"izmir-diyarbakir":1429,"izmir-duzce":560,"izmir-edirne":546,"izmir-elazig":1280,"izmir-erzincan":1286,"izmir-erzurum":1471,"izmir-eskisehir":412,"izmir-gaziantep":1125,"izmir-giresun":1196,"izmir-gumushane":1358,"izmir-hakkari":1817,"izmir-hatay":1105,"izmir-igdir":1795,"izmir-isparta":390,"izmir-istanbul":566,"izmir-kahramanmaras":1103,"izmir-karabuk":740,"izmir-karaman":670,"izmir-kars":1673,"izmir-kastamonu":835,"izmir-kayseri":844,"izmir-kilis":1161,"izmir-kirikkale":669,"izmir-kirklareli":560,"izmir-kirsehir":756,"izmir-kocaeli_(izmit)":453,"izmir-konya":557,"izmir-kutahya":334,"izmir-malatya":1183,"izmir-manisa":37,"izmir-mardin":1458,"izmir-mersin":902,"izmir-mugla":226,"izmir-mus":1527,"izmir-nevsehir":765,"izmir-nigde":792,"izmir-ordu":1154,"izmir-osmaniye":998,"izmir-rize":1407,"izmir-sakarya":491,"izmir-samsun":1007,"izmir-sanliurfa":1264,"izmir-siirt":1616,"izmir-sinop":1005,"izmir-sirnak":1628,"izmir-sivas":1037,"izmir-tekirdag":496,"izmir-tokat":976,"izmir-trabzon":1328,"izmir-tunceli":1409,"izmir-usak":215,"izmir-van":1743,"izmir-yalova":391,"izmir-yozgat":810,"izmir-zonguldak":672,
  "kahramanmaras-adana":197,"kahramanmaras-adiyaman":162,"kahramanmaras-afyonkarahisar":772,"kahramanmaras-agri":815,"kahramanmaras-aksaray":414,"kahramanmaras-amasya":500,"kahramanmaras-ankara":572,"kahramanmaras-antalya":747,"kahramanmaras-ardahan":862,"kahramanmaras-artvin":827,"kahramanmaras-aydin":1073,"kahramanmaras-balikesir":1096,"kahramanmaras-bartin":855,"kahramanmaras-batman":450,"kahramanmaras-bayburt":699,"kahramanmaras-bilecik":873,"kahramanmaras-bingol":457,"kahramanmaras-bitlis":562,"kahramanmaras-bolu":760,"kahramanmaras-burdur":841,"kahramanmaras-bursa":944,"kahramanmaras-canakkale":1224,"kahramanmaras-cankiri":603,"kahramanmaras-corum":538,"kahramanmaras-denizli":954,"kahramanmaras-diyarbakir":358,"kahramanmaras-duzce":807,"kahramanmaras-edirne":1255,"kahramanmaras-elazig":319,"kahramanmaras-erzincan":575,"kahramanmaras-erzurum":633,"kahramanmaras-eskisehir":792,"kahramanmaras-gaziantep":78,"kahramanmaras-giresun":614,"kahramanmaras-gumushane":678,"kahramanmaras-hakkari":769,"kahramanmaras-hatay":176,"kahramanmaras-igdir":898,"kahramanmaras-isparta":812,"kahramanmaras-istanbul":1023,"kahramanmaras-izmir":1103,"kahramanmaras-karabuk":786,"kahramanmaras-karaman":490,"kahramanmaras-kars":837,"kahramanmaras-kastamonu":709,"kahramanmaras-kayseri":254,"kahramanmaras-kilis":141,"kahramanmaras-kirikkale":498,"kahramanmaras-kirklareli":1232,"kahramanmaras-kirsehir":389,"kahramanmaras-kocaeli_(izmit)":912,"kahramanmaras-konya":555,"kahramanmaras-kutahya":868,"kahramanmaras-malatya":222,"kahramanmaras-manisa":1083,"kahramanmaras-mardin":411,"kahramanmaras-mersin":268,"kahramanmaras-mugla":1056,"kahramanmaras-mus":566,"kahramanmaras-nevsehir":338,"kahramanmaras-nigde":386,"kahramanmaras-ordu":605,"kahramanmaras-osmaniye":105,"kahramanmaras-rize":809,"kahramanmaras-sakarya":875,"kahramanmaras-samsun":629,"kahramanmaras-sanliurfa":217,"kahramanmaras-siirt":536,"kahramanmaras-sinop":754,"kahramanmaras-sirnak":580,"kahramanmaras-sivas":326,"kahramanmaras-tekirdag":1154,"kahramanmaras-tokat":391,"kahramanmaras-trabzon":730,"kahramanmaras-tunceli":455,"kahramanmaras-usak":884,"kahramanmaras-van":721,"kahramanmaras-yalova":978,"kahramanmaras-yozgat":453,"kahramanmaras-zonguldak":836,
  "karabuk-adana":714,"karabuk-adiyaman":945,"karabuk-afyonkarahisar":448,"karabuk-agri":1106,"karabuk-aksaray":446,"karabuk-amasya":371,"karabuk-ankara":216,"karabuk-antalya":735,"karabuk-ardahan":1065,"karabuk-artvin":956,"karabuk-aydin":787,"karabuk-balikesir":567,"karabuk-bartin":86,"karabuk-batman":1172,"karabuk-bayburt":834,"karabuk-bilecik":349,"karabuk-bingol":1007,"karabuk-bitlis":1198,"karabuk-bolu":134,"karabuk-burdur":613,"karabuk-bursa":405,"karabuk-canakkale":684,"karabuk-cankiri":192,"karabuk-corum":308,"karabuk-denizli":669,"karabuk-diyarbakir":1073,"karabuk-duzce":180,"karabuk-edirne":629,"karabuk-elazig":905,"karabuk-erzincan":741,"karabuk-erzurum":926,"karabuk-eskisehir":426,"karabuk-gaziantep":861,"karabuk-giresun":597,"karabuk-gumushane":759,"karabuk-hakkari":1533,"karabuk-hatay":910,"karabuk-igdir":1250,"karabuk-isparta":576,"karabuk-istanbul":396,"karabuk-izmir":740,"karabuk-kahramanmaras":786,"karabuk-karaman":592,"karabuk-kars":1128,"karabuk-kastamonu":113,"karabuk-kayseri":529,"karabuk-kilis":925,"karabuk-kirikkale":288,"karabuk-kirklareli":605,"karabuk-kirsehir":397,"karabuk-kocaeli_(izmit)":286,"karabuk-konya":481,"karabuk-kutahya":454,"karabuk-malatya":826,"karabuk-manisa":703,"karabuk-mardin":1167,"karabuk-mersin":707,"karabuk-mugla":796,"karabuk-mus":1117,"karabuk-nevsehir":489,"karabuk-nigde":570,"karabuk-ordu":555,"karabuk-osmaniye":803,"karabuk-rize":808,"karabuk-sakarya":249,"karabuk-samsun":408,"karabuk-sanliurfa":1000,"karabuk-siirt":1259,"karabuk-sinop":292,"karabuk-sirnak":1364,"karabuk-sivas":590,"karabuk-tekirdag":527,"karabuk-tokat":481,"karabuk-trabzon":729,"karabuk-tunceli":864,"karabuk-usak":560,"karabuk-van":1338,"karabuk-yalova":351,"karabuk-yozgat":428,"karabuk-zonguldak":101,
  "karaman-adana":292,"karaman-adiyaman":630,"karaman-afyonkarahisar":339,"karaman-agri":1112,"karaman-aksaray":212,"karaman-amasya":621,"karaman-ankara":370,"karaman-antalya":376,"karaman-ardahan":1154,"karaman-artvin":1118,"karaman-aydin":640,"karaman-balikesir":663,"karaman-bartin":661,"karaman-batman":921,"karaman-bayburt":872,"karaman-bilecik":546,"karaman-bingol":876,"karaman-bitlis":1034,"karaman-bolu":566,"karaman-burdur":408,"karaman-bursa":617,"karaman-canakkale":854,"karaman-cankiri":465,"karaman-corum":530,"karaman-denizli":522,"karaman-diyarbakir":829,"karaman-duzce":613,"karaman-edirne":1021,"karaman-elazig":739,"karaman-erzincan":747,"karaman-erzurum":933,"karaman-eskisehir":451,"karaman-gaziantep":509,"karaman-giresun":787,"karaman-gumushane":851,"karaman-hakkari":1200,"karaman-hatay":488,"karaman-igdir":1256,"karaman-isparta":379,"karaman-istanbul":789,"karaman-izmir":670,"karaman-kahramanmaras":490,"karaman-karabuk":592,"karaman-kars":1135,"karaman-kastamonu":571,"karaman-kayseri":303,"karaman-kilis":544,"karaman-kirikkale":361,"karaman-kirklareli":998,"karaman-kirsehir":320,"karaman-kocaeli_(izmit)":679,"karaman-konya":118,"karaman-kutahya":436,"karaman-malatya":642,"karaman-manisa":650,"karaman-mardin":841,"karaman-mersin":233,"karaman-mugla":649,"karaman-mus":986,"karaman-nevsehir":256,"karaman-nigde":175,"karaman-ordu":848,"karaman-osmaniye":382,"karaman-rize":982,"karaman-sakarya":642,"karaman-samsun":702,"karaman-sanliurfa":647,"karaman-siirt":1007,"karaman-sinop":742,"karaman-sirnak":1011,"karaman-sivas":499,"karaman-tekirdag":920,"karaman-tokat":563,"karaman-trabzon":903,"karaman-tunceli":870,"karaman-usak":451,"karaman-van":1202,"karaman-yalova":685,"karaman-yozgat":433,"karaman-zonguldak":642,
  "kars-adana":1012,"kars-adiyaman":716,"kars-afyonkarahisar":1342,"kars-agri":214,"kars-aksaray":987,"kars-amasya":762,"kars-ankara":1078,"kars-antalya":1447,"kars-ardahan":89,"kars-artvin":203,"kars-aydin":1646,"kars-balikesir":1601,"kars-bartin":1193,"kars-batman":585,"kars-bayburt":327,"kars-bilecik":1383,"kars-bingol":382,"kars-bitlis":452,"kars-bolu":1168,"kars-burdur":1414,"kars-bursa":1440,"kars-canakkale":1719,"kars-cankiri":1008,"kars-corum":853,"kars-denizli":1528,"kars-diyarbakir":520,"kars-duzce":1215,"kars-edirne":1663,"kars-elazig":522,"kars-erzincan":393,"kars-erzurum":205,"kars-eskisehir":1321,"kars-gaziantep":857,"kars-giresun":564,"kars-gumushane":403,"kars-hakkari":552,"kars-hatay":991,"kars-igdir":135,"kars-isparta":1385,"kars-istanbul":1431,"kars-izmir":1673,"kars-kahramanmaras":837,"kars-karabuk":1128,"kars-karaman":1135,"kars-kastamonu":1012,"kars-kayseri":838,"kars-kilis":896,"kars-kirikkale":1007,"kars-kirklareli":1640,"kars-kirsehir":962,"kars-kocaeli_(izmit)":1321,"kars-konya":1134,"kars-kutahya":1399,"kars-malatya":615,"kars-manisa":1653,"kars-mardin":615,"kars-mersin":1082,"kars-mugla":1655,"kars-mus":347,"kars-nevsehir":911,"kars-nigde":960,"kars-ordu":607,"kars-osmaniye":919,"kars-rize":344,"kars-sakarya":1283,"kars-samsun":753,"kars-sanliurfa":697,"kars-siirt":547,"kars-sinop":914,"kars-sirnak":643,"kars-sivas":640,"kars-tekirdag":1562,"kars-tokat":696,"kars-trabzon":422,"kars-tunceli":441,"kars-usak":1454,"kars-van":357,"kars-yalova":1386,"kars-yozgat":864,"kars-zonguldak":1228,
  "kastamonu-adana":696,"kastamonu-adiyaman":868,"kastamonu-afyonkarahisar":504,"kastamonu-agri":990,"kastamonu-aksaray":428,"kastamonu-amasya":255,"kastamonu-ankara":237,"kastamonu-antalya":790,"kastamonu-ardahan":954,"kastamonu-artvin":844,"kastamonu-aydin":843,"kastamonu-balikesir":680,"kastamonu-bartin":181,"kastamonu-batman":1056,"kastamonu-bayburt":722,"kastamonu-bilecik":462,"kastamonu-bingol":892,"kastamonu-bitlis":1082,"kastamonu-bolu":247,"kastamonu-burdur":669,"kastamonu-bursa":518,"kastamonu-canakkale":797,"kastamonu-cankiri":106,"kastamonu-corum":192,"kastamonu-denizli":724,"kastamonu-diyarbakir":957,"kastamonu-duzce":293,"kastamonu-edirne":741,"kastamonu-elazig":789,"kastamonu-erzincan":625,"kastamonu-erzurum":810,"kastamonu-eskisehir":482,"kastamonu-gaziantep":784,"kastamonu-giresun":485,"kastamonu-gumushane":647,"kastamonu-hakkari":1418,"kastamonu-hatay":882,"kastamonu-igdir":1134,"kastamonu-isparta":631,"kastamonu-istanbul":509,"kastamonu-izmir":835,"kastamonu-kahramanmaras":709,"kastamonu-karabuk":113,"kastamonu-karaman":571,"kastamonu-kars":1012,"kastamonu-kayseri":452,"kastamonu-kilis":847,"kastamonu-kirikkale":210,"kastamonu-kirklareli":718,"kastamonu-kirsehir":319,"kastamonu-kocaeli_(izmit)":399,"kastamonu-konya":460,"kastamonu-kutahya":567,"kastamonu-malatya":711,"kastamonu-manisa":816,"kastamonu-mardin":1051,"kastamonu-mersin":689,"kastamonu-mugla":852,"kastamonu-mus":1001,"kastamonu-nevsehir":412,"kastamonu-nigde":492,"kastamonu-ordu":443,"kastamonu-osmaniye":785,"kastamonu-rize":696,"kastamonu-sakarya":361,"kastamonu-samsun":296,"kastamonu-sanliurfa":923,"kastamonu-siirt":1144,"kastamonu-sinop":181,"kastamonu-sirnak":1286,"kastamonu-sivas":474,"kastamonu-tekirdag":640,"kastamonu-tokat":365,"kastamonu-trabzon":617,"kastamonu-tunceli":748,"kastamonu-usak":615,"kastamonu-van":1223,"kastamonu-yalova":464,"kastamonu-yozgat":299,"kastamonu-zonguldak":213,
  "kayseri-adana":335,"kayseri-adiyaman":414,"kayseri-afyonkarahisar":513,"kayseri-agri":816,"kayseri-aksaray":155,"kayseri-amasya":341,"kayseri-ankara":315,"kayseri-antalya":615,"kayseri-ardahan":857,"kayseri-artvin":822,"kayseri-aydin":814,"kayseri-balikesir":837,"kayseri-bartin":598,"kayseri-batman":680,"kayseri-bayburt":575,"kayseri-bilecik":616,"kayseri-bingol":569,"kayseri-bitlis":760,"kayseri-bolu":504,"kayseri-burdur":582,"kayseri-bursa":688,"kayseri-canakkale":967,"kayseri-cankiri":346,"kayseri-corum":281,"kayseri-denizli":696,"kayseri-diyarbakir":581,"kayseri-duzce":550,"kayseri-edirne":998,"kayseri-elazig":432,"kayseri-erzincan":451,"kayseri-erzurum":636,"kayseri-eskisehir":536,"kayseri-gaziantep":330,"kayseri-giresun":490,"kayseri-gumushane":554,"kayseri-hakkari":1058,"kayseri-hatay":428,"kayseri-igdir":960,"kayseri-isparta":553,"kayseri-istanbul":766,"kayseri-izmir":844,"kayseri-kahramanmaras":254,"kayseri-karabuk":529,"kayseri-karaman":303,"kayseri-kars":838,"kayseri-kastamonu":452,"kayseri-kilis":393,"kayseri-kirikkale":242,"kayseri-kirklareli":975,"kayseri-kirsehir":133,"kayseri-kocaeli_(izmit)":656,"kayseri-konya":302,"kayseri-kutahya":610,"kayseri-malatya":335,"kayseri-manisa":824,"kayseri-mardin":663,"kayseri-mersin":328,"kayseri-mugla":823,"kayseri-mus":679,"kayseri-nevsehir":79,"kayseri-nigde":128,"kayseri-ordu":482,"kayseri-osmaniye":356,"kayseri-rize":685,"kayseri-sakarya":618,"kayseri-samsun":453,"kayseri-sanliurfa":468,"kayseri-siirt":767,"kayseri-sinop":544,"kayseri-sirnak":832,"kayseri-sivas":202,"kayseri-tekirdag":897,"kayseri-tokat":267,"kayseri-trabzon":606,"kayseri-tunceli":574,"kayseri-usak":625,"kayseri-van":895,"kayseri-yalova":721,"kayseri-yozgat":197,"kayseri-zonguldak":580,
  "kilis-adana":251,"kilis-adiyaman":210,"kilis-afyonkarahisar":830,"kilis-agri":817,"kilis-aksaray":520,"kilis-amasya":639,"kilis-ankara":711,"kilis-antalya":801,"kilis-ardahan":920,"kilis-artvin":885,"kilis-aydin":1131,"kilis-balikesir":1154,"kilis-bartin":994,"kilis-batman":467,"kilis-bayburt":793,"kilis-bilecik":1011,"kilis-bingol":517,"kilis-bitlis":580,"kilis-bolu":899,"kilis-burdur":899,"kilis-bursa":1083,"kilis-canakkale":1345,"kilis-cankiri":741,"kilis-corum":676,"kilis-denizli":1012,"kilis-diyarbakir":375,"kilis-duzce":945,"kilis-edirne":1394,"kilis-elazig":402,"kilis-erzincan":665,"kilis-erzurum":691,"kilis-eskisehir":931,"kilis-gaziantep":63,"kilis-giresun":753,"kilis-gumushane":817,"kilis-hakkari":746,"kilis-hatay":146,"kilis-igdir":915,"kilis-isparta":870,"kilis-istanbul":1162,"kilis-izmir":1161,"kilis-kahramanmaras":141,"kilis-karabuk":925,"kilis-karaman":544,"kilis-kars":896,"kilis-kastamonu":847,"kilis-kayseri":393,"kilis-kirikkale":637,"kilis-kirklareli":1370,"kilis-kirsehir":528,"kilis-kocaeli_(izmit)":1051,"kilis-konya":609,"kilis-kutahya":927,"kilis-malatya":304,"kilis-manisa":1141,"kilis-mardin":388,"kilis-mersin":322,"kilis-mugla":1110,"kilis-mus":624,"kilis-nevsehir":476,"kilis-nigde":459,"kilis-ordu":744,"kilis-osmaniye":159,"kilis-rize":948,"kilis-sakarya":1014,"kilis-samsun":768,"kilis-sanliurfa":193,"kilis-siirt":553,"kilis-sinop":893,"kilis-sirnak":557,"kilis-sivas":465,"kilis-tekirdag":1292,"kilis-tokat":529,"kilis-trabzon":869,"kilis-tunceli":538,"kilis-usak":942,"kilis-van":739,"kilis-yalova":1116,"kilis-yozgat":592,"kilis-zonguldak":975,
  "kirikkale-adana":485,"kirikkale-adiyaman":658,"kirikkale-afyonkarahisar":338,"kirikkale-agri":985,"kirikkale-aksaray":218,"kirikkale-amasya":260,"kirikkale-ankara":74,"kirikkale-antalya":562,"kirikkale-ardahan":1026,"kirikkale-artvin":889,"kirikkale-aydin":678,"kirikkale-balikesir":619,"kirikkale-bartin":357,"kirikkale-batman":924,"kirikkale-bayburt":744,"kirikkale-bilecik":397,"kirikkale-bingol":813,"kirikkale-bitlis":1004,"kirikkale-bolu":262,"kirikkale-burdur":504,"kirikkale-bursa":468,"kirikkale-canakkale":748,"kirikkale-cankiri":104,"kirikkale-corum":169,"kirikkale-denizli":559,"kirikkale-diyarbakir":824,"kirikkale-duzce":308,"kirikkale-edirne":757,"kirikkale-elazig":675,"kirikkale-erzincan":620,"kirikkale-erzurum":805,"kirikkale-eskisehir":316,"kirikkale-gaziantep":574,"kirikkale-giresun":530,"kirikkale-gumushane":692,"kirikkale-hakkari":1302,"kirikkale-hatay":671,"kirikkale-igdir":1128,"kirikkale-isparta":466,"kirikkale-istanbul":525,"kirikkale-izmir":669,"kirikkale-kahramanmaras":498,"kirikkale-karabuk":288,"kirikkale-karaman":361,"kirikkale-kars":1007,"kirikkale-kastamonu":210,"kirikkale-kayseri":242,"kirikkale-kilis":637,"kirikkale-kirklareli":733,"kirikkale-kirsehir":109,"kirikkale-kocaeli_(izmit)":414,"kirikkale-konya":249,"kirikkale-kutahya":395,"kirikkale-malatya":578,"kirikkale-manisa":649,"kirikkale-mardin":906,"kirikkale-mersin":479,"kirikkale-mugla":687,"kirikkale-mus":923,"kirikkale-nevsehir":201,"kirikkale-nigde":282,"kirikkale-ordu":488,"kirikkale-osmaniye":575,"kirikkale-rize":741,"kirikkale-sakarya":377,"kirikkale-samsun":341,"kirikkale-sanliurfa":712,"kirikkale-siirt":1011,"kirikkale-sinop":381,"kirikkale-sirnak":1076,"kirikkale-sivas":371,"kirikkale-tekirdag":655,"kirikkale-tokat":309,"kirikkale-trabzon":662,"kirikkale-tunceli":743,"kirikkale-usak":450,"kirikkale-van":1138,"kirikkale-yalova":479,"kirikkale-yozgat":143,"kirikkale-zonguldak":338,
  "kirklareli-adana":1159,"kirklareli-adiyaman":1391,"kirklareli-afyonkarahisar":659,"kirklareli-agri":1617,"kirklareli-aksaray":891,"kirklareli-amasya":883,"kirklareli-ankara":662,"kirklareli-antalya":924,"kirklareli-ardahan":1602,"kirklareli-artvin":1492,"kirklareli-aydin":682,"kirklareli-balikesir":434,"kirklareli-bartin":625,"kirklareli-batman":1657,"kirklareli-bayburt":1335,"kirklareli-bilecik":457,"kirklareli-bingol":1547,"kirklareli-bitlis":1738,"kirklareli-bolu":471,"kirklareli-burdur":803,"kirklareli-bursa":443,"kirklareli-canakkale":245,"kirklareli-cankiri":704,"kirklareli-corum":820,"kirklareli-denizli":716,"kirklareli-diyarbakir":1558,"kirklareli-duzce":425,"kirklareli-edirne":67,"kirklareli-elazig":1409,"kirklareli-erzincan":1252,"kirklareli-erzurum":1438,"kirklareli-eskisehir":532,"kirklareli-gaziantep":1307,"kirklareli-giresun":1133,"kirklareli-gumushane":1295,"kirklareli-hakkari":2035,"kirklareli-hatay":1355,"kirklareli-igdir":1761,"kirklareli-isparta":804,"kirklareli-istanbul":209,"kirklareli-izmir":560,"kirklareli-kahramanmaras":1232,"kirklareli-karabuk":605,"kirklareli-karaman":998,"kirklareli-kars":1640,"kirklareli-kastamonu":718,"kirklareli-kayseri":975,"kirklareli-kilis":1370,"kirklareli-kirikkale":733,"kirklareli-kirsehir":842,"kirklareli-kocaeli_(izmit)":321,"kirklareli-konya":885,"kirklareli-kutahya":562,"kirklareli-malatya":1312,"kirklareli-manisa":570,"kirklareli-mardin":1640,"kirklareli-mersin":1152,"kirklareli-mugla":780,"kirklareli-mus":1656,"kirklareli-nevsehir":935,"kirklareli-nigde":1015,"kirklareli-ordu":1091,"kirklareli-osmaniye":1249,"kirklareli-rize":1344,"kirklareli-sakarya":357,"kirklareli-samsun":944,"kirklareli-sanliurfa":1446,"kirklareli-siirt":1744,"kirklareli-sinop":898,"kirklareli-sirnak":1809,"kirklareli-sivas":1101,"kirklareli-tekirdag":124,"kirklareli-tokat":992,"kirklareli-trabzon":1265,"kirklareli-tunceli":1375,"kirklareli-usak":656,"kirklareli-van":1850,"kirklareli-yalova":387,"kirklareli-yozgat":874,"kirklareli-zonguldak":538,
  "kirsehir-adana":376,"kirsehir-adiyaman":549,"kirsehir-afyonkarahisar":425,"kirsehir-agri":940,"kirsehir-aksaray":108,"kirsehir-amasya":312,"kirsehir-ankara":183,"kirsehir-antalya":568,"kirsehir-ardahan":981,"kirsehir-artvin":941,"kirsehir-aydin":765,"kirsehir-balikesir":706,"kirsehir-bartin":466,"kirsehir-batman":815,"kirsehir-bayburt":699,"kirsehir-bilecik":483,"kirsehir-bingol":704,"kirsehir-bitlis":895,"kirsehir-bolu":371,"kirsehir-burdur":536,"kirsehir-bursa":555,"kirsehir-canakkale":834,"kirsehir-cankiri":214,"kirsehir-corum":221,"kirsehir-denizli":646,"kirsehir-diyarbakir":715,"kirsehir-duzce":418,"kirsehir-edirne":866,"kirsehir-elazig":566,"kirsehir-erzincan":575,"kirsehir-erzurum":760,"kirsehir-eskisehir":403,"kirsehir-gaziantep":464,"kirsehir-giresun":582,"kirsehir-gumushane":678,"kirsehir-hakkari":1193,"kirsehir-hatay":562,"kirsehir-igdir":1084,"kirsehir-isparta":507,"kirsehir-istanbul":634,"kirsehir-izmir":756,"kirsehir-kahramanmaras":389,"kirsehir-karabuk":397,"kirsehir-karaman":320,"kirsehir-kars":962,"kirsehir-kastamonu":319,"kirsehir-kayseri":133,"kirsehir-kilis":528,"kirsehir-kirikkale":109,"kirsehir-kirklareli":842,"kirsehir-kocaeli_(izmit)":523,"kirsehir-konya":255,"kirsehir-kutahya":482,"kirsehir-malatya":469,"kirsehir-manisa":736,"kirsehir-mardin":797,"kirsehir-mersin":369,"kirsehir-mugla":773,"kirsehir-mus":814,"kirsehir-nevsehir":92,"kirsehir-nigde":173,"kirsehir-ordu":540,"kirsehir-osmaniye":466,"kirsehir-rize":793,"kirsehir-sakarya":486,"kirsehir-samsun":393,"kirsehir-sanliurfa":603,"kirsehir-siirt":902,"kirsehir-sinop":490,"kirsehir-sirnak":967,"kirsehir-sivas":326,"kirsehir-tekirdag":765,"kirsehir-tokat":332,"kirsehir-trabzon":714,"kirsehir-tunceli":698,"kirsehir-usak":537,"kirsehir-van":1029,"kirsehir-yalova":588,"kirsehir-yozgat":113,"kirsehir-zonguldak":447,
  "kocaeli_(izmit)-adana":840,"kocaeli_(izmit)-adiyaman":1072,"kocaeli_(izmit)-afyonkarahisar":340,"kocaeli_(izmit)-agri":1298,"kocaeli_(izmit)-aksaray":572,"kocaeli_(izmit)-amasya":563,"kocaeli_(izmit)-ankara":342,"kocaeli_(izmit)-antalya":605,"kocaeli_(izmit)-ardahan":1282,"kocaeli_(izmit)-artvin":1173,"kocaeli_(izmit)-aydin":569,"kocaeli_(izmit)-balikesir":280,"kocaeli_(izmit)-bartin":306,"kocaeli_(izmit)-batman":1338,"kocaeli_(izmit)-bayburt":1015,"kocaeli_(izmit)-bilecik":138,"kocaeli_(izmit)-bingol":1227,"kocaeli_(izmit)-bitlis":1418,"kocaeli_(izmit)-bolu":152,"kocaeli_(izmit)-burdur":483,"kocaeli_(izmit)-bursa":131,"kocaeli_(izmit)-canakkale":398,"kocaeli_(izmit)-cankiri":385,"kocaeli_(izmit)-corum":501,"kocaeli_(izmit)-denizli":539,"kocaeli_(izmit)-diyarbakir":1239,"kocaeli_(izmit)-duzce":106,"kocaeli_(izmit)-edirne":345,"kocaeli_(izmit)-elazig":1090,"kocaeli_(izmit)-erzincan":933,"kocaeli_(izmit)-erzurum":1118,"kocaeli_(izmit)-eskisehir":213,"kocaeli_(izmit)-gaziantep":988,"kocaeli_(izmit)-giresun":814,"kocaeli_(izmit)-gumushane":976,"kocaeli_(izmit)-hakkari":1716,"kocaeli_(izmit)-hatay":1036,"kocaeli_(izmit)-igdir":1442,"kocaeli_(izmit)-isparta":485,"kocaeli_(izmit)-istanbul":113,"kocaeli_(izmit)-izmir":453,"kocaeli_(izmit)-kahramanmaras":912,"kocaeli_(izmit)-karabuk":286,"kocaeli_(izmit)-karaman":679,"kocaeli_(izmit)-kars":1321,"kocaeli_(izmit)-kastamonu":399,"kocaeli_(izmit)-kayseri":656,"kocaeli_(izmit)-kilis":1051,"kocaeli_(izmit)-kirikkale":414,"kocaeli_(izmit)-kirklareli":321,"kocaeli_(izmit)-kirsehir":523,"kocaeli_(izmit)-konya":566,"kocaeli_(izmit)-kutahya":243,"kocaeli_(izmit)-malatya":993,"kocaeli_(izmit)-manisa":417,"kocaeli_(izmit)-mardin":1321,"kocaeli_(izmit)-mersin":833,"kocaeli_(izmit)-mugla":666,"kocaeli_(izmit)-mus":1337,"kocaeli_(izmit)-nevsehir":616,"kocaeli_(izmit)-nigde":696,"kocaeli_(izmit)-ordu":772,"kocaeli_(izmit)-osmaniye":929,"kocaeli_(izmit)-rize":1025,"kocaeli_(izmit)-sakarya":37,"kocaeli_(izmit)-samsun":625,"kocaeli_(izmit)-sanliurfa":1126,"kocaeli_(izmit)-siirt":1425,"kocaeli_(izmit)-sinop":578,"kocaeli_(izmit)-sirnak":1490,"kocaeli_(izmit)-sivas":782,"kocaeli_(izmit)-tekirdag":243,"kocaeli_(izmit)-tokat":673,"kocaeli_(izmit)-trabzon":946,"kocaeli_(izmit)-tunceli":1056,"kocaeli_(izmit)-usak":381,"kocaeli_(izmit)-van":1531,"kocaeli_(izmit)-yalova":65,"kocaeli_(izmit)-yozgat":555,"kocaeli_(izmit)-zonguldak":218,
  "konya-adana":357,"konya-adiyaman":695,"konya-afyonkarahisar":226,"konya-agri":1111,"konya-aksaray":147,"konya-amasya":509,"konya-ankara":259,"konya-antalya":271,"konya-ardahan":1153,"konya-artvin":1117,"konya-aydin":527,"konya-balikesir":550,"konya-bartin":550,"konya-batman":986,"konya-bayburt":871,"konya-bilecik":433,"konya-bingol":875,"konya-bitlis":1066,"konya-bolu":455,"konya-burdur":295,"konya-bursa":504,"konya-canakkale":741,"konya-cankiri":354,"konya-corum":419,"konya-denizli":409,"konya-diyarbakir":887,"konya-duzce":501,"konya-edirne":908,"konya-elazig":738,"konya-erzincan":746,"konya-erzurum":932,"konya-eskisehir":337,"konya-gaziantep":574,"konya-giresun":779,"konya-gumushane":850,"konya-hakkari":1265,"konya-hatay":553,"konya-igdir":1255,"konya-isparta":266,"konya-istanbul":676,"konya-izmir":557,"konya-kahramanmaras":555,"konya-karabuk":481,"konya-karaman":118,"konya-kars":1134,"konya-kastamonu":460,"konya-kayseri":302,"konya-kilis":609,"konya-kirikkale":249,"konya-kirklareli":885,"konya-kirsehir":255,"konya-kocaeli_(izmit)":566,"konya-kutahya":323,"konya-malatya":641,"konya-manisa":537,"konya-mardin":906,"konya-mersin":350,"konya-mugla":536,"konya-mus":985,"konya-nevsehir":223,"konya-nigde":240,"konya-ordu":737,"konya-osmaniye":446,"konya-rize":990,"konya-sakarya":528,"konya-samsun":590,"konya-sanliurfa":712,"konya-siirt":1073,"konya-sinop":630,"konya-sirnak":1076,"konya-sivas":498,"konya-tekirdag":807,"konya-tokat":559,"konya-trabzon":911,"konya-tunceli":869,"konya-usak":338,"konya-van":1201,"konya-yalova":572,"konya-yozgat":368,"konya-zonguldak":531,
  "kutahya-adana":675,"kutahya-adiyaman":1012,"kutahya-afyonkarahisar":97,"kutahya-agri":1377,"kutahya-aksaray":455,"kutahya-amasya":652,"kutahya-ankara":312,"kutahya-antalya":361,"kutahya-ardahan":1418,"kutahya-artvin":1281,"kutahya-aydin":414,"kutahya-balikesir":227,"kutahya-bartin":475,"kutahya-batman":1294,"kutahya-bayburt":1136,"kutahya-bilecik":110,"kutahya-bingol":1183,"kutahya-bitlis":1374,"kutahya-bolu":321,"kutahya-burdur":240,"kutahya-bursa":182,"kutahya-canakkale":419,"kutahya-cankiri":455,"kutahya-corum":561,"kutahya-denizli":296,"kutahya-diyarbakir":1195,"kutahya-duzce":274,"kutahya-edirne":586,"kutahya-elazig":1046,"kutahya-erzincan":1012,"kutahya-erzurum":1197,"kutahya-eskisehir":79,"kutahya-gaziantep":891,"kutahya-giresun":922,"kutahya-gumushane":1084,"kutahya-hakkari":1582,"kutahya-hatay":871,"kutahya-igdir":1521,"kutahya-isparta":242,"kutahya-istanbul":354,"kutahya-izmir":334,"kutahya-kahramanmaras":868,"kutahya-karabuk":454,"kutahya-karaman":436,"kutahya-kars":1399,"kutahya-kastamonu":567,"kutahya-kayseri":610,"kutahya-kilis":927,"kutahya-kirikkale":395,"kutahya-kirklareli":562,"kutahya-kirsehir":482,"kutahya-kocaeli_(izmit)":243,"kutahya-konya":323,"kutahya-malatya":948,"kutahya-manisa":314,"kutahya-mardin":1224,"kutahya-mersin":668,"kutahya-mugla":423,"kutahya-mus":1293,"kutahya-nevsehir":531,"kutahya-nigde":558,"kutahya-ordu":880,"kutahya-osmaniye":764,"kutahya-rize":1133,"kutahya-sakarya":206,"kutahya-samsun":733,"kutahya-sanliurfa":1030,"kutahya-siirt":1381,"kutahya-sinop":747,"kutahya-sirnak":1393,"kutahya-sivas":763,"kutahya-tekirdag":484,"kutahya-tokat":702,"kutahya-trabzon":1054,"kutahya-tunceli":1135,"kutahya-usak":138,"kutahya-van":1509,"kutahya-yalova":249,"kutahya-yozgat":536,"kutahya-zonguldak":387,
  "malatya-adana":396,"malatya-adiyaman":186,"malatya-afyonkarahisar":852,"malatya-agri":593,"malatya-aksaray":494,"malatya-amasya":457,"malatya-ankara":652,"malatya-antalya":953,"malatya-ardahan":640,"malatya-artvin":605,"malatya-aydin":1153,"malatya-balikesir":1176,"malatya-bartin":892,"malatya-batman":346,"malatya-bayburt":489,"malatya-bilecik":953,"malatya-bingol":235,"malatya-bitlis":426,"malatya-bolu":840,"malatya-burdur":921,"malatya-bursa":1024,"malatya-canakkale":1304,"malatya-cankiri":683,"malatya-corum":524,"malatya-denizli":1034,"malatya-diyarbakir":246,"malatya-duzce":887,"malatya-edirne":1335,"malatya-elazig":97,"malatya-erzincan":361,"malatya-erzurum":411,"malatya-eskisehir":872,"malatya-gaziantep":241,"malatya-giresun":532,"malatya-gumushane":491,"malatya-hakkari":724,"malatya-hatay":375,"malatya-igdir":734,"malatya-isparta":892,"malatya-istanbul":1103,"malatya-izmir":1183,"malatya-kahramanmaras":222,"malatya-karabuk":826,"malatya-karaman":642,"malatya-kars":615,"malatya-kastamonu":711,"malatya-kayseri":335,"malatya-kilis":304,"malatya-kirikkale":578,"malatya-kirklareli":1312,"malatya-kirsehir":469,"malatya-kocaeli_(izmit)":993,"malatya-konya":641,"malatya-kutahya":948,"malatya-manisa":1163,"malatya-mardin":341,"malatya-mersin":467,"malatya-mugla":1162,"malatya-mus":344,"malatya-nevsehir":418,"malatya-nigde":467,"malatya-ordu":562,"malatya-osmaniye":304,"malatya-rize":654,"malatya-sakarya":955,"malatya-samsun":586,"malatya-sanliurfa":269,"malatya-siirt":433,"malatya-sinop":711,"malatya-sirnak":539,"malatya-sivas":244,"malatya-tekirdag":1234,"malatya-tokat":348,"malatya-trabzon":584,"malatya-tunceli":233,"malatya-usak":964,"malatya-van":560,"malatya-yalova":1058,"malatya-yozgat":464,"malatya-zonguldak":916,
  "manisa-adana":889,"manisa-adiyaman":1227,"manisa-afyonkarahisar":311,"manisa-agri":1631,"manisa-aksaray":669,"manisa-amasya":906,"manisa-ankara":566,"manisa-antalya":427,"manisa-ardahan":1672,"manisa-artvin":1535,"manisa-aydin":152,"manisa-balikesir":138,"manisa-bartin":723,"manisa-batman":1508,"manisa-bayburt":1390,"manisa-bilecik":393,"manisa-bingol":1398,"manisa-bitlis":1589,"manisa-bolu":569,"manisa-burdur":368,"manisa-bursa":288,"manisa-canakkale":328,"manisa-cankiri":709,"manisa-corum":815,"manisa-denizli":206,"manisa-diyarbakir":1409,"manisa-duzce":523,"manisa-edirne":556,"manisa-elazig":1260,"manisa-erzincan":1266,"manisa-erzurum":1451,"manisa-eskisehir":392,"manisa-gaziantep":1106,"manisa-giresun":1176,"manisa-gumushane":1338,"manisa-hakkari":1797,"manisa-hatay":1085,"manisa-igdir":1775,"manisa-isparta":370,"manisa-istanbul":529,"manisa-izmir":37,"manisa-kahramanmaras":1083,"manisa-karabuk":703,"manisa-karaman":650,"manisa-kars":1653,"manisa-kastamonu":816,"manisa-kayseri":824,"manisa-kilis":1141,"manisa-kirikkale":649,"manisa-kirklareli":570,"manisa-kirsehir":736,"manisa-kocaeli_(izmit)":417,"manisa-konya":537,"manisa-kutahya":314,"manisa-malatya":1163,"manisa-mardin":1438,"manisa-mersin":882,"manisa-mugla":251,"manisa-mus":1507,"manisa-nevsehir":745,"manisa-nigde":772,"manisa-ordu":1134,"manisa-osmaniye":978,"manisa-rize":1387,"manisa-sakarya":455,"manisa-samsun":987,"manisa-sanliurfa":1244,"manisa-siirt":1596,"manisa-sinop":985,"manisa-sirnak":1608,"manisa-sivas":1017,"manisa-tekirdag":506,"manisa-tokat":956,"manisa-trabzon":1308,"manisa-tunceli":1389,"manisa-usak":195,"manisa-van":1723,"manisa-yalova":354,"manisa-yozgat":790,"manisa-zonguldak":636,
  "mardin-adana":549,"mardin-adiyaman":294,"mardin-afyonkarahisar":1127,"mardin-agri":518,"mardin-aksaray":817,"mardin-amasya":798,"mardin-ankara":980,"mardin-antalya":1099,"mardin-ardahan":639,"mardin-artvin":604,"mardin-aydin":1428,"mardin-balikesir":1451,"mardin-bartin":1232,"mardin-batman":148,"mardin-bayburt":535,"mardin-bilecik":1281,"mardin-bingol":236,"mardin-bitlis":281,"mardin-bolu":1168,"mardin-burdur":1196,"mardin-bursa":1352,"mardin-canakkale":1632,"mardin-cankiri":1011,"mardin-corum":865,"mardin-denizli":1310,"mardin-diyarbakir":94,"mardin-duzce":1215,"mardin-edirne":1663,"mardin-elazig":247,"mardin-erzincan":501,"mardin-erzurum":410,"mardin-eskisehir":1200,"mardin-gaziantep":333,"mardin-giresun":772,"mardin-gumushane":611,"mardin-hakkari":387,"mardin-hatay":527,"mardin-igdir":616,"mardin-isparta":1167,"mardin-istanbul":1431,"mardin-izmir":1458,"mardin-kahramanmaras":411,"mardin-karabuk":1167,"mardin-karaman":841,"mardin-kars":615,"mardin-kastamonu":1051,"mardin-kayseri":663,"mardin-kilis":388,"mardin-kirikkale":906,"mardin-kirklareli":1640,"mardin-kirsehir":797,"mardin-kocaeli_(izmit)":1321,"mardin-konya":906,"mardin-kutahya":1224,"mardin-malatya":341,"mardin-manisa":1438,"mardin-mersin":619,"mardin-mugla":1408,"mardin-mus":362,"mardin-nevsehir":746,"mardin-nigde":756,"mardin-ordu":815,"mardin-osmaniye":456,"mardin-rize":659,"mardin-sakarya":1283,"mardin-samsun":927,"mardin-sanliurfa":188,"mardin-siirt":234,"mardin-sinop":1052,"mardin-sirnak":198,"mardin-sivas":585,"mardin-tekirdag":1562,"mardin-tokat":688,"mardin-trabzon":704,"mardin-tunceli":374,"mardin-usak":1239,"mardin-van":440,"mardin-yalova":1386,"mardin-yozgat":805,"mardin-zonguldak":1244,
  "mersin-adana":70,"mersin-adiyaman":407,"mersin-afyonkarahisar":571,"mersin-agri":1048,"mersin-aksaray":261,"mersin-amasya":635,"mersin-ankara":485,"mersin-antalya":469,"mersin-ardahan":1107,"mersin-artvin":1072,"mersin-aydin":814,"mersin-balikesir":895,"mersin-bartin":776,"mersin-batman":698,"mersin-bayburt":871,"mersin-bilecik":778,"mersin-bingol":702,"mersin-bitlis":811,"mersin-bolu":681,"mersin-burdur":578,"mersin-bursa":849,"mersin-canakkale":1087,"mersin-cankiri":583,"mersin-corum":575,"mersin-denizli":695,"mersin-diyarbakir":607,"mersin-duzce":727,"mersin-edirne":1176,"mersin-elazig":564,"mersin-erzincan":747,"mersin-erzurum":878,"mersin-eskisehir":683,"mersin-gaziantep":286,"mersin-giresun":786,"mersin-gumushane":850,"mersin-hakkari":977,"mersin-hatay":266,"mersin-igdir":1147,"mersin-isparta":566,"mersin-istanbul":944,"mersin-izmir":902,"mersin-kahramanmaras":268,"mersin-karabuk":707,"mersin-karaman":233,"mersin-kars":1082,"mersin-kastamonu":689,"mersin-kayseri":328,"mersin-kilis":322,"mersin-kirikkale":479,"mersin-kirklareli":1152,"mersin-kirsehir":369,"mersin-kocaeli_(izmit)":833,"mersin-konya":350,"mersin-kutahya":668,"mersin-malatya":467,"mersin-manisa":882,"mersin-mardin":619,"mersin-mugla":778,"mersin-mus":811,"mersin-nevsehir":280,"mersin-nigde":200,"mersin-ordu":777,"mersin-osmaniye":159,"mersin-rize":981,"mersin-sakarya":796,"mersin-samsun":746,"mersin-sanliurfa":425,"mersin-siirt":785,"mersin-sinop":859,"mersin-sirnak":788,"mersin-sivas":498,"mersin-tekirdag":1074,"mersin-tokat":562,"mersin-trabzon":902,"mersin-tunceli":700,"mersin-usak":683,"mersin-van":970,"mersin-yalova":898,"mersin-yozgat":482,"mersin-zonguldak":757,
  "mugla-adana":858,"mugla-adiyaman":1196,"mugla-afyonkarahisar":348,"mugla-agri":1632,"mugla-aksaray":668,"mugla-amasya":943,"mugla-ankara":604,"mugla-antalya":309,"mugla-ardahan":1674,"mugla-artvin":1572,"mugla-aydin":98,"mugla-balikesir":389,"mugla-bartin":865,"mugla-batman":1507,"mugla-bayburt":1392,"mugla-bilecik":533,"mugla-bingol":1397,"mugla-bitlis":1588,"mugla-bolu":743,"mugla-burdur":240,"mugla-bursa":539,"mugla-canakkale":547,"mugla-cankiri":746,"mugla-corum":853,"mugla-denizli":150,"mugla-diyarbakir":1408,"mugla-duzce":697,"mugla-edirne":766,"mugla-elazig":1259,"mugla-erzincan":1267,"mugla-erzurum":1453,"mugla-eskisehir":482,"mugla-gaziantep":1075,"mugla-giresun":1213,"mugla-gumushane":1375,"mugla-hakkari":1766,"mugla-hatay":1055,"mugla-igdir":1776,"mugla-isparta":269,"mugla-istanbul":776,"mugla-izmir":226,"mugla-kahramanmaras":1056,"mugla-karabuk":796,"mugla-karaman":649,"mugla-kars":1655,"mugla-kastamonu":852,"mugla-kayseri":823,"mugla-kilis":1110,"mugla-kirikkale":687,"mugla-kirklareli":780,"mugla-kirsehir":773,"mugla-kocaeli_(izmit)":666,"mugla-konya":536,"mugla-kutahya":423,"mugla-malatya":1162,"mugla-manisa":251,"mugla-mardin":1408,"mugla-mersin":778,"mugla-mus":1506,"mugla-nevsehir":744,"mugla-nigde":771,"mugla-ordu":1171,"mugla-osmaniye":948,"mugla-rize":1424,"mugla-sakarya":629,"mugla-samsun":1024,"mugla-sanliurfa":1213,"mugla-siirt":1594,"mugla-sinop":1022,"mugla-sirnak":1577,"mugla-sivas":1019,"mugla-tekirdag":716,"mugla-tokat":993,"mugla-trabzon":1345,"mugla-tunceli":1390,"mugla-usak":280,"mugla-van":1722,"mugla-yalova":605,"mugla-yozgat":827,"mugla-zonguldak":810,
  "mus-adana":741,"mus-adiyaman":445,"mus-afyonkarahisar":1196,"mus-agri":246,"mus-aksaray":838,"mus-amasya":751,"mus-ankara":997,"mus-antalya":1298,"mus-ardahan":403,"mus-artvin":464,"mus-aydin":1497,"mus-balikesir":1520,"mus-bartin":1182,"mus-batman":214,"mus-bayburt":395,"mus-bilecik":1297,"mus-bingol":111,"mus-bitlis":81,"mus-bolu":1185,"mus-burdur":1265,"mus-bursa":1369,"mus-canakkale":1648,"mus-cankiri":1027,"mus-corum":869,"mus-denizli":1379,"mus-diyarbakir":249,"mus-duzce":1231,"mus-edirne":1679,"mus-elazig":251,"mus-erzincan":381,"mus-erzurum":270,"mus-eskisehir":1217,"mus-gaziantep":586,"mus-giresun":632,"mus-gumushane":471,"mus-hakkari":379,"mus-hatay":719,"mus-igdir":390,"mus-isparta":1236,"mus-istanbul":1447,"mus-izmir":1527,"mus-kahramanmaras":566,"mus-karabuk":1117,"mus-karaman":986,"mus-kars":347,"mus-kastamonu":1001,"mus-kayseri":679,"mus-kilis":624,"mus-kirikkale":923,"mus-kirklareli":1656,"mus-kirsehir":814,"mus-kocaeli_(izmit)":1337,"mus-konya":985,"mus-kutahya":1293,"mus-malatya":344,"mus-manisa":1507,"mus-mardin":362,"mus-mersin":811,"mus-mugla":1506,"mus-nevsehir":762,"mus-nigde":811,"mus-ordu":675,"mus-osmaniye":648,"mus-rize":519,"mus-sakarya":1299,"mus-samsun":828,"mus-sanliurfa":426,"mus-siirt":177,"mus-sinop":969,"mus-sirnak":273,"mus-sivas":589,"mus-tekirdag":1578,"mus-tokat":692,"mus-trabzon":564,"mus-tunceli":254,"mus-usak":1308,"mus-van":216,"mus-yalova":1402,"mus-yozgat":809,"mus-zonguldak":1217,
  "nevsehir-adana":287,"nevsehir-adiyaman":497,"nevsehir-afyonkarahisar":434,"nevsehir-agri":888,"nevsehir-aksaray":76,"nevsehir-amasya":355,"nevsehir-ankara":275,"nevsehir-antalya":536,"nevsehir-ardahan":930,"nevsehir-artvin":894,"nevsehir-aydin":735,"nevsehir-balikesir":758,"nevsehir-bartin":558,"nevsehir-batman":763,"nevsehir-bayburt":648,"nevsehir-bilecik":576,"nevsehir-bingol":652,"nevsehir-bitlis":843,"nevsehir-bolu":463,"nevsehir-burdur":503,"nevsehir-bursa":648,"nevsehir-canakkale":927,"nevsehir-cankiri":306,"nevsehir-corum":295,"nevsehir-denizli":617,"nevsehir-diyarbakir":664,"nevsehir-duzce":510,"nevsehir-edirne":958,"nevsehir-elazig":515,"nevsehir-erzincan":523,"nevsehir-erzurum":709,"nevsehir-eskisehir":496,"nevsehir-gaziantep":413,"nevsehir-giresun":562,"nevsehir-gumushane":627,"nevsehir-hakkari":1141,"nevsehir-hatay":483,"nevsehir-igdir":1032,"nevsehir-isparta":474,"nevsehir-istanbul":726,"nevsehir-izmir":765,"nevsehir-kahramanmaras":338,"nevsehir-karabuk":489,"nevsehir-karaman":256,"nevsehir-kars":911,"nevsehir-kastamonu":412,"nevsehir-kayseri":79,"nevsehir-kilis":476,"nevsehir-kirikkale":201,"nevsehir-kirklareli":935,"nevsehir-kirsehir":92,"nevsehir-kocaeli_(izmit)":616,"nevsehir-konya":223,"nevsehir-kutahya":531,"nevsehir-malatya":418,"nevsehir-manisa":745,"nevsehir-mardin":746,"nevsehir-mersin":280,"nevsehir-mugla":744,"nevsehir-mus":762,"nevsehir-nigde":80,"nevsehir-ordu":614,"nevsehir-osmaniye":376,"nevsehir-rize":758,"nevsehir-sakarya":578,"nevsehir-samsun":467,"nevsehir-sanliurfa":552,"nevsehir-siirt":850,"nevsehir-sinop":582,"nevsehir-sirnak":915,"nevsehir-sivas":275,"nevsehir-tekirdag":857,"nevsehir-tokat":339,"nevsehir-trabzon":679,"nevsehir-tunceli":646,"nevsehir-usak":546,"nevsehir-van":978,"nevsehir-yalova":681,"nevsehir-yozgat":205,"nevsehir-zonguldak":540,
  "nigde-adana":207,"nigde-adiyaman":544,"nigde-afyonkarahisar":461,"nigde-agri":937,"nigde-aksaray":113,"nigde-amasya":435,"nigde-ankara":337,"nigde-antalya":541,"nigde-ardahan":978,"nigde-artvin":943,"nigde-aydin":762,"nigde-balikesir":785,"nigde-bartin":639,"nigde-batman":812,"nigde-bayburt":696,"nigde-bilecik":635,"nigde-bingol":701,"nigde-bitlis":892,"nigde-bolu":544,"nigde-burdur":530,"nigde-bursa":706,"nigde-canakkale":986,"nigde-cankiri":386,"nigde-corum":375,"nigde-denizli":643,"nigde-diyarbakir":713,"nigde-duzce":590,"nigde-edirne":1039,"nigde-elazig":564,"nigde-erzincan":572,"nigde-erzurum":757,"nigde-eskisehir":555,"nigde-gaziantep":423,"nigde-giresun":611,"nigde-gumushane":676,"nigde-hakkari":1115,"nigde-hatay":403,"nigde-igdir":1081,"nigde-isparta":501,"nigde-istanbul":807,"nigde-izmir":792,"nigde-kahramanmaras":386,"nigde-karabuk":570,"nigde-karaman":175,"nigde-kars":960,"nigde-kastamonu":492,"nigde-kayseri":128,"nigde-kilis":459,"nigde-kirikkale":282,"nigde-kirklareli":1015,"nigde-kirsehir":173,"nigde-kocaeli_(izmit)":696,"nigde-konya":240,"nigde-kutahya":558,"nigde-malatya":467,"nigde-manisa":772,"nigde-mardin":756,"nigde-mersin":200,"nigde-mugla":771,"nigde-mus":811,"nigde-nevsehir":80,"nigde-ordu":603,"nigde-osmaniye":296,"nigde-rize":806,"nigde-sakarya":659,"nigde-samsun":546,"nigde-sanliurfa":562,"nigde-siirt":899,"nigde-sinop":663,"nigde-sirnak":926,"nigde-sivas":324,"nigde-tekirdag":937,"nigde-tokat":388,"nigde-trabzon":728,"nigde-tunceli":695,"nigde-usak":573,"nigde-van":1027,"nigde-yalova":761,"nigde-yozgat":286,"nigde-zonguldak":620,
  "ordu-adana":707,"ordu-adiyaman":728,"ordu-afyonkarahisar":823,"ordu-agri":584,"ordu-aksaray":648,"ordu-amasya":278,"ordu-ankara":558,"ordu-antalya":1050,"ordu-ardahan":511,"ordu-artvin":402,"ordu-aydin":1162,"ordu-balikesir":1053,"ordu-bartin":623,"ordu-batman":774,"ordu-bayburt":280,"ordu-bilecik":835,"ordu-bingol":582,"ordu-bitlis":756,"ordu-bolu":620,"ordu-burdur":988,"ordu-bursa":891,"ordu-canakkale":1170,"ordu-cankiri":480,"ordu-corum":319,"ordu-denizli":1044,"ordu-diyarbakir":720,"ordu-duzce":666,"ordu-edirne":1114,"ordu-elazig":601,"ordu-erzincan":340,"ordu-erzurum":405,"ordu-eskisehir":801,"ordu-gaziantep":681,"ordu-giresun":43,"ordu-gumushane":205,"ordu-hakkari":1012,"ordu-hatay":779,"ordu-igdir":728,"ordu-isparta":951,"ordu-istanbul":882,"ordu-izmir":1154,"ordu-kahramanmaras":605,"ordu-karabuk":555,"ordu-karaman":848,"ordu-kars":607,"ordu-kastamonu":443,"ordu-kayseri":482,"ordu-kilis":744,"ordu-kirikkale":488,"ordu-kirklareli":1091,"ordu-kirsehir":540,"ordu-kocaeli_(izmit)":772,"ordu-konya":737,"ordu-kutahya":880,"ordu-malatya":562,"ordu-manisa":1134,"ordu-mardin":815,"ordu-mersin":777,"ordu-mugla":1171,"ordu-mus":675,"ordu-nevsehir":614,"ordu-nigde":603,"ordu-osmaniye":707,"ordu-rize":254,"ordu-sakarya":734,"ordu-samsun":147,"ordu-sanliurfa":811,"ordu-siirt":851,"ordu-sinop":307,"ordu-sirnak":947,"ordu-sivas":307,"ordu-tekirdag":1013,"ordu-tokat":215,"ordu-trabzon":175,"ordu-tunceli":463,"ordu-usak":935,"ordu-van":817,"ordu-yalova":837,"ordu-yozgat":427,"ordu-zonguldak":656,
  "osmaniye-adana":89,"osmaniye-adiyaman":244,"osmaniye-afyonkarahisar":667,"osmaniye-agri":885,"osmaniye-aksaray":357,"osmaniye-amasya":602,"osmaniye-ankara":581,"osmaniye-antalya":639,"osmaniye-ardahan":944,"osmaniye-artvin":909,"osmaniye-aydin":969,"osmaniye-balikesir":991,"osmaniye-bartin":872,"osmaniye-batman":535,"osmaniye-bayburt":801,"osmaniye-bilecik":874,"osmaniye-bingol":539,"osmaniye-bitlis":648,"osmaniye-bolu":777,"osmaniye-burdur":736,"osmaniye-bursa":945,"osmaniye-canakkale":1183,"osmaniye-cankiri":679,"osmaniye-corum":640,"osmaniye-denizli":850,"osmaniye-diyarbakir":444,"osmaniye-duzce":824,"osmaniye-edirne":1272,"osmaniye-elazig":401,"osmaniye-erzincan":677,"osmaniye-erzurum":715,"osmaniye-eskisehir":779,"osmaniye-gaziantep":123,"osmaniye-giresun":716,"osmaniye-gumushane":780,"osmaniye-hakkari":815,"osmaniye-hatay":127,"osmaniye-igdir":984,"osmaniye-isparta":707,"osmaniye-istanbul":1040,"osmaniye-izmir":998,"osmaniye-kahramanmaras":105,"osmaniye-karabuk":803,"osmaniye-karaman":382,"osmaniye-kars":919,"osmaniye-kastamonu":785,"osmaniye-kayseri":356,"osmaniye-kilis":159,"osmaniye-kirikkale":575,"osmaniye-kirklareli":1249,"osmaniye-kirsehir":466,"osmaniye-kocaeli_(izmit)":929,"osmaniye-konya":446,"osmaniye-kutahya":764,"osmaniye-malatya":304,"osmaniye-manisa":978,"osmaniye-mardin":456,"osmaniye-mersin":159,"osmaniye-mugla":948,"osmaniye-mus":648,"osmaniye-nevsehir":376,"osmaniye-nigde":296,"osmaniye-ordu":707,"osmaniye-rize":911,"osmaniye-sakarya":892,"osmaniye-samsun":731,"osmaniye-sanliurfa":262,"osmaniye-siirt":622,"osmaniye-sinop":856,"osmaniye-sirnak":626,"osmaniye-sivas":428,"osmaniye-tekirdag":1171,"osmaniye-tokat":492,"osmaniye-trabzon":832,"osmaniye-tunceli":537,"osmaniye-usak":779,"osmaniye-van":807,"osmaniye-yalova":994,"osmaniye-yozgat":555,"osmaniye-zonguldak":853,
  "rize-adana":911,"rize-adiyaman":760,"rize-afyonkarahisar":1076,"rize-agri":429,"rize-aksaray":834,"rize-amasya":531,"rize-ankara":811,"rize-antalya":1303,"rize-ardahan":257,"rize-artvin":148,"rize-aydin":1416,"rize-balikesir":1306,"rize-bartin":876,"rize-batman":618,"rize-bayburt":239,"rize-bilecik":1088,"rize-bingol":426,"rize-bitlis":600,"rize-bolu":873,"rize-burdur":1242,"rize-bursa":1144,"rize-canakkale":1423,"rize-cankiri":733,"rize-corum":572,"rize-denizli":1297,"rize-diyarbakir":564,"rize-duzce":919,"rize-edirne":1368,"rize-elazig":560,"rize-erzincan":299,"rize-erzurum":249,"rize-eskisehir":1054,"rize-gaziantep":884,"rize-giresun":211,"rize-gumushane":164,"rize-hakkari":857,"rize-hatay":982,"rize-igdir":477,"rize-isparta":1204,"rize-istanbul":1135,"rize-izmir":1407,"rize-kahramanmaras":809,"rize-karabuk":808,"rize-karaman":982,"rize-kars":344,"rize-kastamonu":696,"rize-kayseri":685,"rize-kilis":948,"rize-kirikkale":741,"rize-kirklareli":1344,"rize-kirsehir":793,"rize-kocaeli_(izmit)":1025,"rize-konya":990,"rize-kutahya":1133,"rize-malatya":654,"rize-manisa":1387,"rize-mardin":659,"rize-mersin":981,"rize-mugla":1424,"rize-mus":519,"rize-nevsehir":758,"rize-nigde":806,"rize-ordu":254,"rize-osmaniye":911,"rize-sakarya":988,"rize-samsun":400,"rize-sanliurfa":741,"rize-siirt":696,"rize-sinop":561,"rize-sirnak":792,"rize-sivas":487,"rize-tekirdag":1266,"rize-tokat":468,"rize-trabzon":79,"rize-tunceli":422,"rize-usak":1188,"rize-van":661,"rize-yalova":1090,"rize-yozgat":680,"rize-zonguldak":909,
  "sakarya-adana":803,"sakarya-adiyaman":1035,"sakarya-afyonkarahisar":302,"sakarya-agri":1261,"sakarya-aksaray":535,"sakarya-amasya":526,"sakarya-ankara":305,"sakarya-antalya":567,"sakarya-ardahan":1245,"sakarya-artvin":1136,"sakarya-aydin":620,"sakarya-balikesir":318,"sakarya-bartin":269,"sakarya-batman":1301,"sakarya-bayburt":978,"sakarya-bilecik":100,"sakarya-bingol":1190,"sakarya-bitlis":1381,"sakarya-bolu":115,"sakarya-burdur":446,"sakarya-bursa":156,"sakarya-canakkale":436,"sakarya-cankiri":347,"sakarya-corum":463,"sakarya-denizli":501,"sakarya-diyarbakir":1201,"sakarya-duzce":68,"sakarya-edirne":380,"sakarya-elazig":1052,"sakarya-erzincan":896,"sakarya-erzurum":1081,"sakarya-eskisehir":176,"sakarya-gaziantep":950,"sakarya-giresun":777,"sakarya-gumushane":939,"sakarya-hakkari":1679,"sakarya-hatay":999,"sakarya-igdir":1405,"sakarya-isparta":448,"sakarya-istanbul":148,"sakarya-izmir":491,"sakarya-kahramanmaras":875,"sakarya-karabuk":249,"sakarya-karaman":642,"sakarya-kars":1283,"sakarya-kastamonu":361,"sakarya-kayseri":618,"sakarya-kilis":1014,"sakarya-kirikkale":377,"sakarya-kirklareli":357,"sakarya-kirsehir":486,"sakarya-kocaeli_(izmit)":37,"sakarya-konya":528,"sakarya-kutahya":206,"sakarya-malatya":955,"sakarya-manisa":455,"sakarya-mardin":1283,"sakarya-mersin":796,"sakarya-mugla":629,"sakarya-mus":1299,"sakarya-nevsehir":578,"sakarya-nigde":659,"sakarya-ordu":734,"sakarya-osmaniye":892,"sakarya-rize":988,"sakarya-samsun":588,"sakarya-sanliurfa":1089,"sakarya-siirt":1388,"sakarya-sinop":541,"sakarya-sirnak":1453,"sakarya-sivas":745,"sakarya-tekirdag":279,"sakarya-tokat":636,"sakarya-trabzon":909,"sakarya-tunceli":1019,"sakarya-usak":344,"sakarya-van":1493,"sakarya-yalova":103,"sakarya-yozgat":517,"sakarya-zonguldak":181,
  "samsun-adana":753,"samsun-adiyaman":752,"samsun-afyonkarahisar":676,"samsun-agri":731,"samsun-aksaray":501,"samsun-amasya":131,"samsun-ankara":412,"samsun-antalya":903,"samsun-ardahan":657,"samsun-artvin":548,"samsun-aydin":1016,"samsun-balikesir":906,"samsun-bartin":476,"samsun-batman":932,"samsun-bayburt":426,"samsun-bilecik":688,"samsun-bingol":718,"samsun-bitlis":909,"samsun-bolu":473,"samsun-burdur":842,"samsun-bursa":744,"samsun-canakkale":1023,"samsun-cankiri":333,"samsun-corum":172,"samsun-denizli":897,"samsun-diyarbakir":832,"samsun-duzce":519,"samsun-edirne":968,"samsun-elazig":664,"samsun-erzincan":451,"samsun-erzurum":551,"samsun-eskisehir":654,"samsun-gaziantep":705,"samsun-giresun":189,"samsun-gumushane":351,"samsun-hakkari":1158,"samsun-hatay":802,"samsun-igdir":875,"samsun-isparta":804,"samsun-istanbul":736,"samsun-izmir":1007,"samsun-kahramanmaras":629,"samsun-karabuk":408,"samsun-karaman":702,"samsun-kars":753,"samsun-kastamonu":296,"samsun-kayseri":453,"samsun-kilis":768,"samsun-kirikkale":341,"samsun-kirklareli":944,"samsun-kirsehir":393,"samsun-kocaeli_(izmit)":625,"samsun-konya":590,"samsun-kutahya":733,"samsun-malatya":586,"samsun-manisa":987,"samsun-mardin":927,"samsun-mersin":746,"samsun-mugla":1024,"samsun-mus":828,"samsun-nevsehir":467,"samsun-nigde":546,"samsun-ordu":147,"samsun-osmaniye":731,"samsun-rize":400,"samsun-sakarya":588,"samsun-sanliurfa":835,"samsun-siirt":1019,"samsun-sinop":161,"samsun-sirnak":1125,"samsun-sivas":350,"samsun-tekirdag":866,"samsun-tokat":241,"samsun-trabzon":321,"samsun-tunceli":575,"samsun-usak":788,"samsun-van":963,"samsun-yalova":690,"samsun-yozgat":280,"samsun-zonguldak":509,
  "sanliurfa-adana":354,"sanliurfa-adiyaman":111,"sanliurfa-afyonkarahisar":933,"sanliurfa-agri":618,"sanliurfa-aksaray":623,"sanliurfa-amasya":706,"sanliurfa-ankara":786,"sanliurfa-antalya":905,"sanliurfa-ardahan":721,"sanliurfa-artvin":686,"sanliurfa-aydin":1234,"sanliurfa-balikesir":1257,"sanliurfa-bartin":1069,"sanliurfa-batman":268,"sanliurfa-bayburt":617,"sanliurfa-bilecik":1087,"sanliurfa-bingol":318,"sanliurfa-bitlis":381,"sanliurfa-bolu":974,"sanliurfa-burdur":1002,"sanliurfa-bursa":1158,"sanliurfa-canakkale":1438,"sanliurfa-cankiri":817,"sanliurfa-corum":752,"sanliurfa-denizli":1116,"sanliurfa-diyarbakir":177,"sanliurfa-duzce":1021,"sanliurfa-edirne":1469,"sanliurfa-elazig":318,"sanliurfa-erzincan":573,"sanliurfa-erzurum":492,"sanliurfa-eskisehir":1006,"sanliurfa-gaziantep":139,"sanliurfa-giresun":781,"sanliurfa-gumushane":703,"sanliurfa-hakkari":546,"sanliurfa-hatay":333,"sanliurfa-igdir":716,"sanliurfa-isparta":973,"sanliurfa-istanbul":1237,"sanliurfa-izmir":1264,"sanliurfa-kahramanmaras":217,"sanliurfa-karabuk":1000,"sanliurfa-karaman":647,"sanliurfa-kars":697,"sanliurfa-kastamonu":923,"sanliurfa-kayseri":468,"sanliurfa-kilis":193,"sanliurfa-kirikkale":712,"sanliurfa-kirklareli":1446,"sanliurfa-kirsehir":603,"sanliurfa-kocaeli_(izmit)":1126,"sanliurfa-konya":712,"sanliurfa-kutahya":1030,"sanliurfa-malatya":269,"sanliurfa-manisa":1244,"sanliurfa-mardin":188,"sanliurfa-mersin":425,"sanliurfa-mugla":1213,"sanliurfa-mus":426,"sanliurfa-nevsehir":552,"sanliurfa-nigde":562,"sanliurfa-ordu":811,"sanliurfa-osmaniye":262,"sanliurfa-rize":741,"sanliurfa-sakarya":1089,"sanliurfa-samsun":835,"sanliurfa-siirt":354,"sanliurfa-sinop":960,"sanliurfa-sirnak":357,"sanliurfa-sivas":493,"sanliurfa-tekirdag":1368,"sanliurfa-tokat":596,"sanliurfa-trabzon":796,"sanliurfa-tunceli":445,"sanliurfa-usak":1045,"sanliurfa-van":540,"sanliurfa-yalova":1192,"sanliurfa-yozgat":667,"sanliurfa-zonguldak":1050,
  "siirt-adana":714,"siirt-adiyaman":374,"siirt-afyonkarahisar":1285,"siirt-agri":333,"siirt-aksaray":926,"siirt-amasya":890,"siirt-ankara":1085,"siirt-antalya":1265,"siirt-ardahan":579,"siirt-artvin":640,"siirt-aydin":1586,"siirt-balikesir":1609,"siirt-bartin":1324,"siirt-batman":86,"siirt-bayburt":571,"siirt-bilecik":1385,"siirt-bingol":287,"siirt-bitlis":95,"siirt-bolu":1273,"siirt-burdur":1353,"siirt-bursa":1457,"siirt-canakkale":1736,"siirt-cankiri":1116,"siirt-corum":957,"siirt-denizli":1467,"siirt-diyarbakir":187,"siirt-duzce":1320,"siirt-edirne":1768,"siirt-elazig":339,"siirt-erzincan":558,"siirt-erzurum":447,"siirt-eskisehir":1305,"siirt-gaziantep":499,"siirt-giresun":808,"siirt-gumushane":647,"siirt-hakkari":290,"siirt-hatay":693,"siirt-igdir":431,"siirt-isparta":1325,"siirt-istanbul":1536,"siirt-izmir":1616,"siirt-kahramanmaras":536,"siirt-karabuk":1259,"siirt-karaman":1007,"siirt-kars":547,"siirt-kastamonu":1144,"siirt-kayseri":767,"siirt-kilis":553,"siirt-kirikkale":1011,"siirt-kirklareli":1744,"siirt-kirsehir":902,"siirt-kocaeli_(izmit)":1425,"siirt-konya":1073,"siirt-kutahya":1381,"siirt-malatya":433,"siirt-manisa":1596,"siirt-mardin":234,"siirt-mersin":785,"siirt-mugla":1594,"siirt-mus":177,"siirt-nevsehir":850,"siirt-nigde":899,"siirt-ordu":851,"siirt-osmaniye":622,"siirt-rize":696,"siirt-sakarya":1388,"siirt-samsun":1019,"siirt-sanliurfa":354,"siirt-sinop":1144,"siirt-sirnak":100,"siirt-sivas":677,"siirt-tekirdag":1666,"siirt-tokat":780,"siirt-trabzon":741,"siirt-tunceli":431,"siirt-usak":1396,"siirt-van":254,"siirt-yalova":1490,"siirt-yozgat":897,"siirt-zonguldak":1349,
  "sinop-adana":866,"sinop-adiyaman":877,"sinop-afyonkarahisar":674,"sinop-agri":891,"sinop-aksaray":599,"sinop-amasya":256,"sinop-ankara":407,"sinop-antalya":961,"sinop-ardahan":818,"sinop-artvin":709,"sinop-aydin":1014,"sinop-balikesir":859,"sinop-bartin":360,"sinop-batman":1057,"sinop-bayburt":587,"sinop-bilecik":641,"sinop-bingol":859,"sinop-bitlis":1050,"sinop-bolu":426,"sinop-burdur":840,"sinop-bursa":697,"sinop-canakkale":977,"sinop-cankiri":276,"sinop-corum":265,"sinop-denizli":895,"sinop-diyarbakir":957,"sinop-duzce":473,"sinop-edirne":921,"sinop-elazig":789,"sinop-erzincan":593,"sinop-erzurum":712,"sinop-eskisehir":652,"sinop-gaziantep":829,"sinop-giresun":350,"sinop-gumushane":512,"sinop-hakkari":1319,"sinop-hatay":927,"sinop-igdir":1035,"sinop-isparta":802,"sinop-istanbul":689,"sinop-izmir":1005,"sinop-kahramanmaras":754,"sinop-karabuk":292,"sinop-karaman":742,"sinop-kars":914,"sinop-kastamonu":181,"sinop-kayseri":544,"sinop-kilis":893,"sinop-kirikkale":381,"sinop-kirklareli":898,"sinop-kirsehir":490,"sinop-kocaeli_(izmit)":578,"sinop-konya":630,"sinop-kutahya":747,"sinop-malatya":711,"sinop-manisa":985,"sinop-mardin":1052,"sinop-mersin":859,"sinop-mugla":1022,"sinop-mus":969,"sinop-nevsehir":582,"sinop-nigde":663,"sinop-ordu":307,"sinop-osmaniye":856,"sinop-rize":561,"sinop-sakarya":541,"sinop-samsun":161,"sinop-sanliurfa":960,"sinop-siirt":1144,"sinop-sirnak":1250,"sinop-sivas":474,"sinop-tekirdag":820,"sinop-tokat":365,"sinop-trabzon":482,"sinop-tunceli":716,"sinop-usak":786,"sinop-van":1124,"sinop-yalova":644,"sinop-yozgat":371,"sinop-zonguldak":393,
  "sirnak-adana":718,"sirnak-adiyaman":464,"sirnak-afyonkarahisar":1297,"sirnak-agri":429,"sirnak-aksaray":986,"sirnak-amasya":996,"sirnak-ankara":1150,"sirnak-antalya":1268,"sirnak-ardahan":676,"sirnak-artvin":737,"sirnak-aydin":1598,"sirnak-balikesir":1621,"sirnak-bartin":1433,"sirnak-batman":182,"sirnak-bayburt":667,"sirnak-bilecik":1450,"sirnak-bingol":383,"sirnak-bitlis":191,"sirnak-bolu":1338,"sirnak-burdur":1366,"sirnak-bursa":1522,"sirnak-canakkale":1801,"sirnak-cankiri":1180,"sirnak-corum":1063,"sirnak-denizli":1479,"sirnak-diyarbakir":293,"sirnak-duzce":1384,"sirnak-edirne":1833,"sirnak-elazig":445,"sirnak-erzincan":654,"sirnak-erzurum":543,"sirnak-eskisehir":1370,"sirnak-gaziantep":502,"sirnak-giresun":904,"sirnak-gumushane":743,"sirnak-hakkari":191,"sirnak-hatay":697,"sirnak-igdir":527,"sirnak-isparta":1337,"sirnak-istanbul":1601,"sirnak-izmir":1628,"sirnak-kahramanmaras":580,"sirnak-karabuk":1364,"sirnak-karaman":1011,"sirnak-kars":643,"sirnak-kastamonu":1286,"sirnak-kayseri":832,"sirnak-kilis":557,"sirnak-kirikkale":1076,"sirnak-kirklareli":1809,"sirnak-kirsehir":967,"sirnak-kocaeli_(izmit)":1490,"sirnak-konya":1076,"sirnak-kutahya":1393,"sirnak-malatya":539,"sirnak-manisa":1608,"sirnak-mardin":198,"sirnak-mersin":788,"sirnak-mugla":1577,"sirnak-mus":273,"sirnak-nevsehir":915,"sirnak-nigde":926,"sirnak-ordu":947,"sirnak-osmaniye":626,"sirnak-rize":792,"sirnak-sakarya":1453,"sirnak-samsun":1125,"sirnak-sanliurfa":357,"sirnak-siirt":100,"sirnak-sinop":1250,"sirnak-sivas":783,"sirnak-tekirdag":1731,"sirnak-tokat":886,"sirnak-trabzon":837,"sirnak-tunceli":527,"sirnak-usak":1409,"sirnak-van":350,"sirnak-yalova":1555,"sirnak-yozgat":1003,"sirnak-zonguldak":1414,
  "sivas-adana":428,"sivas-adiyaman":410,"sivas-afyonkarahisar":706,"sivas-agri":618,"sivas-aksaray":351,"sivas-amasya":221,"sivas-ankara":442,"sivas-antalya":811,"sivas-ardahan":659,"sivas-artvin":624,"sivas-aydin":1010,"sivas-balikesir":987,"sivas-bartin":655,"sivas-batman":590,"sivas-bayburt":377,"sivas-bilecik":765,"sivas-bingol":479,"sivas-bitlis":670,"sivas-bolu":630,"sivas-burdur":778,"sivas-bursa":836,"sivas-canakkale":1116,"sivas-cankiri":442,"sivas-corum":287,"sivas-denizli":891,"sivas-diyarbakir":490,"sivas-duzce":676,"sivas-edirne":1125,"sivas-elazig":322,"sivas-erzincan":253,"sivas-erzurum":438,"sivas-eskisehir":684,"sivas-gaziantep":402,"sivas-giresun":292,"sivas-gumushane":356,"sivas-hakkari":968,"sivas-hatay":499,"sivas-igdir":762,"sivas-isparta":749,"sivas-istanbul":893,"sivas-izmir":1037,"sivas-kahramanmaras":326,"sivas-karabuk":590,"sivas-karaman":499,"sivas-kars":640,"sivas-kastamonu":474,"sivas-kayseri":202,"sivas-kilis":465,"sivas-kirikkale":371,"sivas-kirklareli":1101,"sivas-kirsehir":326,"sivas-kocaeli_(izmit)":782,"sivas-konya":498,"sivas-kutahya":763,"sivas-malatya":244,"sivas-manisa":1017,"sivas-mardin":585,"sivas-mersin":498,"sivas-mugla":1019,"sivas-mus":589,"sivas-nevsehir":275,"sivas-nigde":324,"sivas-ordu":307,"sivas-osmaniye":428,"sivas-rize":487,"sivas-sakarya":745,"sivas-samsun":350,"sivas-sanliurfa":493,"sivas-siirt":677,"sivas-sinop":474,"sivas-sirnak":783,"sivas-tekirdag":1023,"sivas-tokat":111,"sivas-trabzon":408,"sivas-tunceli":376,"sivas-usak":818,"sivas-van":804,"sivas-yalova":847,"sivas-yozgat":228,"sivas-zonguldak":690,
  "tekirdag-adana":1081,"tekirdag-adiyaman":1313,"tekirdag-afyonkarahisar":581,"tekirdag-agri":1539,"tekirdag-aksaray":813,"tekirdag-amasya":805,"tekirdag-ankara":584,"tekirdag-antalya":846,"tekirdag-ardahan":1524,"tekirdag-artvin":1414,"tekirdag-aydin":617,"tekirdag-balikesir":369,"tekirdag-bartin":548,"tekirdag-batman":1579,"tekirdag-bayburt":1257,"tekirdag-bilecik":379,"tekirdag-bingol":1469,"tekirdag-bitlis":1660,"tekirdag-bolu":394,"tekirdag-burdur":725,"tekirdag-bursa":379,"tekirdag-canakkale":181,"tekirdag-cankiri":626,"tekirdag-corum":742,"tekirdag-denizli":652,"tekirdag-diyarbakir":1480,"tekirdag-duzce":347,"tekirdag-edirne":148,"tekirdag-elazig":1331,"tekirdag-erzincan":1174,"tekirdag-erzurum":1360,"tekirdag-eskisehir":454,"tekirdag-gaziantep":1229,"tekirdag-giresun":1055,"tekirdag-gumushane":1217,"tekirdag-hakkari":1957,"tekirdag-hatay":1278,"tekirdag-igdir":1683,"tekirdag-isparta":726,"tekirdag-istanbul":131,"tekirdag-izmir":496,"tekirdag-kahramanmaras":1154,"tekirdag-karabuk":527,"tekirdag-karaman":920,"tekirdag-kars":1562,"tekirdag-kastamonu":640,"tekirdag-kayseri":897,"tekirdag-kilis":1292,"tekirdag-kirikkale":655,"tekirdag-kirklareli":124,"tekirdag-kirsehir":765,"tekirdag-kocaeli_(izmit)":243,"tekirdag-konya":807,"tekirdag-kutahya":484,"tekirdag-malatya":1234,"tekirdag-manisa":506,"tekirdag-mardin":1562,"tekirdag-mersin":1074,"tekirdag-mugla":716,"tekirdag-mus":1578,"tekirdag-nevsehir":857,"tekirdag-nigde":937,"tekirdag-ordu":1013,"tekirdag-osmaniye":1171,"tekirdag-rize":1266,"tekirdag-sakarya":279,"tekirdag-samsun":866,"tekirdag-sanliurfa":1368,"tekirdag-siirt":1666,"tekirdag-sinop":820,"tekirdag-sirnak":1731,"tekirdag-sivas":1023,"tekirdag-tokat":914,"tekirdag-trabzon":1187,"tekirdag-tunceli":1297,"tekirdag-usak":592,"tekirdag-van":1772,"tekirdag-yalova":309,"tekirdag-yozgat":796,"tekirdag-zonguldak":460,
  "tokat-adana":492,"tokat-adiyaman":513,"tokat-afyonkarahisar":645,"tokat-agri":674,"tokat-aksaray":415,"tokat-amasya":112,"tokat-ankara":380,"tokat-antalya":872,"tokat-ardahan":715,"tokat-artvin":616,"tokat-aydin":984,"tokat-balikesir":926,"tokat-bartin":546,"tokat-batman":693,"tokat-bayburt":391,"tokat-bilecik":703,"tokat-bingol":582,"tokat-bitlis":773,"tokat-bolu":521,"tokat-burdur":810,"tokat-bursa":775,"tokat-canakkale":1054,"tokat-cankiri":333,"tokat-corum":178,"tokat-denizli":866,"tokat-diyarbakir":594,"tokat-duzce":567,"tokat-edirne":1016,"tokat-elazig":426,"tokat-erzincan":309,"tokat-erzurum":494,"tokat-eskisehir":623,"tokat-gaziantep":466,"tokat-giresun":257,"tokat-gumushane":370,"tokat-hakkari":1071,"tokat-hatay":564,"tokat-igdir":818,"tokat-isparta":772,"tokat-istanbul":784,"tokat-izmir":976,"tokat-kahramanmaras":391,"tokat-karabuk":481,"tokat-karaman":563,"tokat-kars":696,"tokat-kastamonu":365,"tokat-kayseri":267,"tokat-kilis":529,"tokat-kirikkale":309,"tokat-kirklareli":992,"tokat-kirsehir":332,"tokat-kocaeli_(izmit)":673,"tokat-konya":559,"tokat-kutahya":702,"tokat-malatya":348,"tokat-manisa":956,"tokat-mardin":688,"tokat-mersin":562,"tokat-mugla":993,"tokat-mus":692,"tokat-nevsehir":339,"tokat-nigde":388,"tokat-ordu":215,"tokat-osmaniye":492,"tokat-rize":468,"tokat-sakarya":636,"tokat-samsun":241,"tokat-sanliurfa":596,"tokat-siirt":780,"tokat-sinop":365,"tokat-sirnak":886,"tokat-sivas":111,"tokat-tekirdag":914,"tokat-trabzon":389,"tokat-tunceli":432,"tokat-usak":757,"tokat-van":907,"tokat-yalova":738,"tokat-yozgat":219,"tokat-zonguldak":581,
  "trabzon-adana":832,"trabzon-adiyaman":770,"trabzon-afyonkarahisar":997,"trabzon-agri":474,"trabzon-aksaray":755,"trabzon-amasya":452,"trabzon-ankara":733,"trabzon-antalya":1224,"trabzon-ardahan":336,"trabzon-artvin":227,"trabzon-aydin":1337,"trabzon-balikesir":1227,"trabzon-bartin":797,"trabzon-batman":663,"trabzon-bayburt":169,"trabzon-bilecik":1009,"trabzon-bingol":471,"trabzon-bitlis":646,"trabzon-bolu":794,"trabzon-burdur":1163,"trabzon-bursa":1065,"trabzon-canakkale":1344,"trabzon-cankiri":654,"trabzon-corum":493,"trabzon-denizli":1218,"trabzon-diyarbakir":610,"trabzon-duzce":840,"trabzon-edirne":1289,"trabzon-elazig":491,"trabzon-erzincan":229,"trabzon-erzurum":294,"trabzon-eskisehir":975,"trabzon-gaziantep":806,"trabzon-giresun":132,"trabzon-gumushane":94,"trabzon-hakkari":902,"trabzon-hatay":903,"trabzon-igdir":556,"trabzon-isparta":1125,"trabzon-istanbul":1057,"trabzon-izmir":1328,"trabzon-kahramanmaras":730,"trabzon-karabuk":729,"trabzon-karaman":903,"trabzon-kars":422,"trabzon-kastamonu":617,"trabzon-kayseri":606,"trabzon-kilis":869,"trabzon-kirikkale":662,"trabzon-kirklareli":1265,"trabzon-kirsehir":714,"trabzon-kocaeli_(izmit)":946,"trabzon-konya":911,"trabzon-kutahya":1054,"trabzon-malatya":584,"trabzon-manisa":1308,"trabzon-mardin":704,"trabzon-mersin":902,"trabzon-mugla":1345,"trabzon-mus":564,"trabzon-nevsehir":679,"trabzon-nigde":728,"trabzon-ordu":175,"trabzon-osmaniye":832,"trabzon-rize":79,"trabzon-sakarya":909,"trabzon-samsun":321,"trabzon-sanliurfa":796,"trabzon-siirt":741,"trabzon-sinop":482,"trabzon-sirnak":837,"trabzon-sivas":408,"trabzon-tekirdag":1187,"trabzon-tokat":389,"trabzon-tunceli":352,"trabzon-usak":1109,"trabzon-van":707,"trabzon-yalova":1011,"trabzon-yozgat":601,"trabzon-zonguldak":830,
  "tunceli-adana":630,"tunceli-adiyaman":419,"tunceli-afyonkarahisar":1078,"tunceli-agri":418,"tunceli-aksaray":722,"tunceli-amasya":498,"tunceli-ankara":813,"tunceli-antalya":1182,"tunceli-ardahan":460,"tunceli-artvin":424,"tunceli-aydin":1382,"tunceli-balikesir":1337,"tunceli-bartin":929,"tunceli-batman":340,"tunceli-bayburt":256,"tunceli-bilecik":1119,"tunceli-bingol":145,"tunceli-bitlis":336,"tunceli-bolu":904,"tunceli-burdur":1150,"tunceli-bursa":1175,"tunceli-canakkale":1454,"tunceli-cankiri":743,"tunceli-corum":589,"tunceli-denizli":1263,"tunceli-diyarbakir":280,"tunceli-duzce":950,"tunceli-edirne":1399,"tunceli-elazig":140,"tunceli-erzincan":128,"tunceli-erzurum":239,"tunceli-eskisehir":1056,"tunceli-gaziantep":475,"tunceli-giresun":420,"tunceli-gumushane":259,"tunceli-hakkari":633,"tunceli-hatay":609,"tunceli-igdir":562,"tunceli-isparta":1121,"tunceli-istanbul":1167,"tunceli-izmir":1409,"tunceli-kahramanmaras":455,"tunceli-karabuk":864,"tunceli-karaman":870,"tunceli-kars":441,"tunceli-kastamonu":748,"tunceli-kayseri":574,"tunceli-kilis":538,"tunceli-kirikkale":743,"tunceli-kirklareli":1375,"tunceli-kirsehir":698,"tunceli-kocaeli_(izmit)":1056,"tunceli-konya":869,"tunceli-kutahya":1135,"tunceli-malatya":233,"tunceli-manisa":1389,"tunceli-mardin":374,"tunceli-mersin":700,"tunceli-mugla":1390,"tunceli-mus":254,"tunceli-nevsehir":646,"tunceli-nigde":695,"tunceli-ordu":463,"tunceli-osmaniye":537,"tunceli-rize":422,"tunceli-sakarya":1019,"tunceli-samsun":575,"tunceli-sanliurfa":445,"tunceli-siirt":431,"tunceli-sinop":716,"tunceli-sirnak":527,"tunceli-sivas":376,"tunceli-tekirdag":1297,"tunceli-tokat":432,"tunceli-trabzon":352,"tunceli-usak":1190,"tunceli-van":470,"tunceli-yalova":1121,"tunceli-yozgat":599,"tunceli-zonguldak":964,
  "usak-adana":690,"usak-adiyaman":1027,"usak-afyonkarahisar":112,"usak-agri":1432,"usak-aksaray":470,"usak-amasya":707,"usak-ankara":367,"usak-antalya":290,"usak-ardahan":1473,"usak-artvin":1336,"usak-aydin":272,"usak-balikesir":224,"usak-bartin":629,"usak-batman":1309,"usak-bayburt":1191,"usak-bilecik":249,"usak-bingol":1199,"usak-bitlis":1390,"usak-bolu":459,"usak-burdur":169,"usak-bursa":320,"usak-canakkale":418,"usak-cankiri":510,"usak-corum":616,"usak-denizli":153,"usak-diyarbakir":1210,"usak-duzce":412,"usak-edirne":642,"usak-elazig":1061,"usak-erzincan":1067,"usak-erzurum":1252,"usak-eskisehir":217,"usak-gaziantep":906,"usak-giresun":977,"usak-gumushane":1139,"usak-hakkari":1598,"usak-hatay":886,"usak-igdir":1576,"usak-isparta":170,"usak-istanbul":492,"usak-izmir":215,"usak-kahramanmaras":884,"usak-karabuk":560,"usak-karaman":451,"usak-kars":1454,"usak-kastamonu":615,"usak-kayseri":625,"usak-kilis":942,"usak-kirikkale":450,"usak-kirklareli":656,"usak-kirsehir":537,"usak-kocaeli_(izmit)":381,"usak-konya":338,"usak-kutahya":138,"usak-malatya":964,"usak-manisa":195,"usak-mardin":1239,"usak-mersin":683,"usak-mugla":280,"usak-mus":1308,"usak-nevsehir":546,"usak-nigde":573,"usak-ordu":935,"usak-osmaniye":779,"usak-rize":1188,"usak-sakarya":344,"usak-samsun":788,"usak-sanliurfa":1045,"usak-siirt":1396,"usak-sinop":786,"usak-sirnak":1409,"usak-sivas":818,"usak-tekirdag":592,"usak-tokat":757,"usak-trabzon":1109,"usak-tunceli":1190,"usak-van":1524,"usak-yalova":387,"usak-yozgat":591,"usak-zonguldak":525,
  "van-adana":900,"van-adiyaman":559,"van-afyonkarahisar":1412,"van-agri":233,"van-aksaray":1054,"van-amasya":972,"van-ankara":1212,"van-antalya":1450,"van-ardahan":444,"van-artvin":558,"van-aydin":1713,"van-balikesir":1736,"van-bartin":1403,"van-batman":292,"van-bayburt":537,"van-bilecik":1513,"van-bingol":327,"van-bitlis":159,"van-bolu":1378,"van-burdur":1481,"van-bursa":1585,"van-canakkale":1864,"van-cankiri":1218,"van-corum":1063,"van-denizli":1594,"van-diyarbakir":363,"van-duzce":1425,"van-edirne":1873,"van-elazig":466,"van-erzincan":603,"van-erzurum":415,"van-eskisehir":1433,"van-gaziantep":684,"van-giresun":774,"van-gumushane":613,"van-hakkari":195,"van-hatay":878,"van-igdir":222,"van-isparta":1452,"van-istanbul":1641,"van-izmir":1743,"van-kahramanmaras":721,"van-karabuk":1338,"van-karaman":1202,"van-kars":357,"van-kastamonu":1223,"van-kayseri":895,"van-kilis":739,"van-kirikkale":1138,"van-kirklareli":1850,"van-kirsehir":1029,"van-kocaeli_(izmit)":1531,"van-konya":1201,"van-kutahya":1509,"van-malatya":560,"van-manisa":1723,"van-mardin":440,"van-mersin":970,"van-mugla":1722,"van-mus":216,"van-nevsehir":978,"van-nigde":1027,"van-ordu":817,"van-osmaniye":807,"van-rize":661,"van-sakarya":1493,"van-samsun":963,"van-sanliurfa":540,"van-siirt":254,"van-sinop":1124,"van-sirnak":350,"van-sivas":804,"van-tekirdag":1772,"van-tokat":907,"van-trabzon":707,"van-tunceli":470,"van-usak":1524,"van-yalova":1596,"van-yozgat":1024,"van-zonguldak":1438,
  "yalova-adana":905,"yalova-adiyaman":1137,"yalova-afyonkarahisar":346,"yalova-agri":1363,"yalova-aksaray":637,"yalova-amasya":628,"yalova-ankara":407,"yalova-antalya":610,"yalova-ardahan":1347,"yalova-artvin":1238,"yalova-aydin":507,"yalova-balikesir":218,"yalova-bartin":371,"yalova-batman":1403,"yalova-bayburt":1080,"yalova-bilecik":125,"yalova-bingol":1292,"yalova-bitlis":1483,"yalova-bolu":217,"yalova-burdur":489,"yalova-bursa":69,"yalova-canakkale":335,"yalova-cankiri":450,"yalova-corum":566,"yalova-denizli":501,"yalova-diyarbakir":1304,"yalova-duzce":171,"yalova-edirne":410,"yalova-elazig":1155,"yalova-erzincan":998,"yalova-erzurum":1184,"yalova-eskisehir":219,"yalova-gaziantep":1053,"yalova-giresun":879,"yalova-gumushane":1041,"yalova-hakkari":1781,"yalova-hatay":1101,"yalova-igdir":1507,"yalova-isparta":491,"yalova-istanbul":178,"yalova-izmir":391,"yalova-kahramanmaras":978,"yalova-karabuk":351,"yalova-karaman":685,"yalova-kars":1386,"yalova-kastamonu":464,"yalova-kayseri":721,"yalova-kilis":1116,"yalova-kirikkale":479,"yalova-kirklareli":387,"yalova-kirsehir":588,"yalova-kocaeli_(izmit)":65,"yalova-konya":572,"yalova-kutahya":249,"yalova-malatya":1058,"yalova-manisa":354,"yalova-mardin":1386,"yalova-mersin":898,"yalova-mugla":605,"yalova-mus":1402,"yalova-nevsehir":681,"yalova-nigde":761,"yalova-ordu":837,"yalova-osmaniye":994,"yalova-rize":1090,"yalova-sakarya":103,"yalova-samsun":690,"yalova-sanliurfa":1192,"yalova-siirt":1490,"yalova-sinop":644,"yalova-sirnak":1555,"yalova-sivas":847,"yalova-tekirdag":309,"yalova-tokat":738,"yalova-trabzon":1011,"yalova-tunceli":1121,"yalova-usak":387,"yalova-van":1596,"yalova-yozgat":620,"yalova-zonguldak":284,
  "yozgat-adana":489,"yozgat-adiyaman":613,"yozgat-afyonkarahisar":479,"yozgat-agri":841,"yozgat-aksaray":222,"yozgat-amasya":199,"yozgat-ankara":214,"yozgat-antalya":681,"yozgat-ardahan":882,"yozgat-artvin":828,"yozgat-aydin":818,"yozgat-balikesir":760,"yozgat-bartin":497,"yozgat-batman":810,"yozgat-bayburt":600,"yozgat-bilecik":537,"yozgat-bingol":699,"yozgat-bitlis":890,"yozgat-bolu":402,"yozgat-burdur":644,"yozgat-bursa":609,"yozgat-canakkale":888,"yozgat-cankiri":245,"yozgat-corum":108,"yozgat-denizli":700,"yozgat-diyarbakir":710,"yozgat-duzce":449,"yozgat-edirne":897,"yozgat-elazig":542,"yozgat-erzincan":476,"yozgat-erzurum":661,"yozgat-eskisehir":457,"yozgat-gaziantep":529,"yozgat-giresun":469,"yozgat-gumushane":580,"yozgat-hakkari":1188,"yozgat-hatay":626,"yozgat-igdir":985,"yozgat-isparta":607,"yozgat-istanbul":665,"yozgat-izmir":810,"yozgat-kahramanmaras":453,"yozgat-karabuk":428,"yozgat-karaman":433,"yozgat-kars":864,"yozgat-kastamonu":299,"yozgat-kayseri":197,"yozgat-kilis":592,"yozgat-kirikkale":143,"yozgat-kirklareli":874,"yozgat-kirsehir":113,"yozgat-kocaeli_(izmit)":555,"yozgat-konya":368,"yozgat-kutahya":536,"yozgat-malatya":464,"yozgat-manisa":790,"yozgat-mardin":805,"yozgat-mersin":482,"yozgat-mugla":827,"yozgat-mus":809,"yozgat-nevsehir":205,"yozgat-nigde":286,"yozgat-ordu":427,"yozgat-osmaniye":555,"yozgat-rize":680,"yozgat-sakarya":517,"yozgat-samsun":280,"yozgat-sanliurfa":667,"yozgat-siirt":897,"yozgat-sinop":371,"yozgat-sirnak":1003,"yozgat-sivas":228,"yozgat-tekirdag":796,"yozgat-tokat":219,"yozgat-trabzon":601,"yozgat-tunceli":599,"yozgat-usak":591,"yozgat-van":1024,"yozgat-yalova":620,"yozgat-zonguldak":478,
  "zonguldak-adana":764,"zonguldak-adiyaman":996,"zonguldak-afyonkarahisar":483,"zonguldak-agri":1205,"zonguldak-aksaray":496,"zonguldak-amasya":471,"zonguldak-ankara":266,"zonguldak-antalya":748,"zonguldak-ardahan":1166,"zonguldak-artvin":1057,"zonguldak-aydin":801,"zonguldak-balikesir":499,"zonguldak-bartin":88,"zonguldak-batman":1262,"zonguldak-bayburt":935,"zonguldak-bilecik":281,"zonguldak-bingol":1107,"zonguldak-bitlis":1298,"zonguldak-bolu":158,"zonguldak-burdur":627,"zonguldak-bursa":337,"zonguldak-canakkale":617,"zonguldak-cankiri":292,"zonguldak-corum":408,"zonguldak-denizli":682,"zonguldak-diyarbakir":1162,"zonguldak-duzce":113,"zonguldak-edirne":561,"zonguldak-elazig":1014,"zonguldak-erzincan":840,"zonguldak-erzurum":1026,"zonguldak-eskisehir":356,"zonguldak-gaziantep":912,"zonguldak-giresun":698,"zonguldak-gumushane":860,"zonguldak-hakkari":1633,"zonguldak-hatay":960,"zonguldak-igdir":1349,"zonguldak-isparta":629,"zonguldak-istanbul":329,"zonguldak-izmir":672,"zonguldak-kahramanmaras":836,"zonguldak-karabuk":101,"zonguldak-karaman":642,"zonguldak-kars":1228,"zonguldak-kastamonu":213,"zonguldak-kayseri":580,"zonguldak-kilis":975,"zonguldak-kirikkale":338,"zonguldak-kirklareli":538,"zonguldak-kirsehir":447,"zonguldak-kocaeli_(izmit)":218,"zonguldak-konya":531,"zonguldak-kutahya":387,"zonguldak-malatya":916,"zonguldak-manisa":636,"zonguldak-mardin":1244,"zonguldak-mersin":757,"zonguldak-mugla":810,"zonguldak-mus":1217,"zonguldak-nevsehir":540,"zonguldak-nigde":620,"zonguldak-ordu":656,"zonguldak-osmaniye":853,"zonguldak-rize":909,"zonguldak-sakarya":181,"zonguldak-samsun":509,"zonguldak-sanliurfa":1050,"zonguldak-siirt":1349,"zonguldak-sinop":393,"zonguldak-sirnak":1414,"zonguldak-sivas":690,"zonguldak-tekirdag":460,"zonguldak-tokat":581,"zonguldak-trabzon":830,"zonguldak-tunceli":964,"zonguldak-usak":525,"zonguldak-van":1438,"zonguldak-yalova":284,"zonguldak-yozgat":478
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
          📍 {CITIES.length} il merkezi · PNG haritası
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
  // PNG: "TÜRKİYE SİYASİ HARİTASI" — 26°E-44°E, 36°N-42°N
  // Şehir noktaları coğrafi koordinatlardan normalize edilmiştir
  return (
    <img
      src="/9/harita/turkiye_haritasi.png"
      alt="Türkiye Siyasi Haritası"
      draggable={false}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        objectFit: "fill",
        display: "block",
        pointerEvents: "none",
        borderRadius: "4px",
      }}
    />
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