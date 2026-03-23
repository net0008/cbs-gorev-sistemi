"use client";
import { useState } from "react";
import { Mountain } from 'lucide-react';

// Ses fonksiyonları
function beep(f: number, d: number, t: OscillatorType = "sine", v = 0.15) {
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
const sndOK    = () => [440,554,660].forEach((f,i) => setTimeout(() => beep(f,0.22,"sine",0.14), i*80));
const sndFail  = () => beep(200,0.32,"sawtooth",0.12);
const sndClick = () => beep(700,0.07,"square",0.07);

// Tipler
type Phase = "learn" | "test";

interface ReliefMethod {
  id: string;
  name: string;
  icon: string;
  color: string;
  tagline: string;
  description: string;
  pros: string[];
  cons: string[];
}

interface TestQuestion {
  q: string;
  opts: string[];
  correct: number;
  exp: string;
}

// Veri
const METHODS: ReliefMethod[] = [
  {
    id: 'isohypse',
    name: 'İzohips Yöntemi',
    icon: '〰️',
    color: '#eab308', // amber-500
    tagline: 'Eş Yükselti Eğrileri',
    description: 'Deniz seviyesinden aynı yükseklikteki noktaları birleştiren iç içe kapalı eğrilerdir. En yaygın ve en doğru bilgi veren yöntemdir.',
    pros: ['Yükselti ve eğim hakkında sayısal bilgi verir.', 'Vadi, sırt, tepe gibi yer şekillerini net gösterir.', 'Profil çıkarma imkanı sağlar.'],
    cons: ['Okunması ve yorumlanması uzmanlık gerektirir.', 'Çok sık eğriler haritayı karmaşıklaştırabilir.']
  },
  {
    id: 'coloring',
    name: 'Renklendirme Yöntemi',
    icon: '🎨',
    color: '#22c55e', // green-500
    tagline: 'Yükselti Basamaklarına Göre Renkler',
    description: 'Belirli yükselti aralıkları, uluslararası standartlara göre belirlenmiş renklerle boyanır. Genellikle fiziki haritalarda izohips yöntemiyle birlikte kullanılır.',
    pros: ['Yükselti basamaklarını bir bakışta görmeyi sağlar.', 'Genel yükselti dağılışı hakkında hızlı bilgi verir.', 'Görsel olarak anlaşılırdır.'],
    cons: ['Sadece yükselti aralığını gösterir, kesin yükselti vermez.', 'Aynı renkli alanda eğim hakkında bilgi vermez.']
  },
  {
    id: 'relief',
    name: 'Kabartma Yöntemi',
    icon: '⛰️',
    color: '#a8a29e', // stone-400
    tagline: 'Gölge ve Işıkla 3D Görünüm',
    description: 'Haritanın genellikle kuzeybatısından 45° açıyla ışık geldiği varsayılarak, ışık alan yerlerin aydınlık, gölgede kalan yerlerin koyu renkle gösterilmesidir.',
    pros: ['Haritaya üç boyutlu bir görünüm kazandırır.', 'Yer şekillerinin genel görünümünü anlamayı kolaylaştırır.', 'Estetik bir görünüm sunar.'],
    cons: ['Yükselti ve eğim hakkında sayısal bilgi vermez.', 'Tek başına kullanıldığında yetersiz kalır.']
  },
  {
    id: 'hachuring',
    name: 'Tarama Yöntemi',
    icon: '///',
    color: '#78716c', // neutral-500
    tagline: 'Eğime Göre Çizgi Kalınlığı',
    description: 'Eğimli yüzeylerin, eğim yönünde çizilen kısa çizgilerle taranmasıdır. Çizgilerin kalınlığı, sıklığı ve uzunluğu eğimin derecesini gösterir.',
    pros: ['Eğim hakkında görsel bir fikir verir.', 'Eski haritalarda sıkça kullanılmıştır.'],
    cons: ['Yükselti hakkında bilgi vermez.', 'Çizimi zordur ve haritayı karmaşıklaştırabilir.', 'Günümüzde nadiren kullanılır.']
  }
];

const TEST_QUESTIONS: TestQuestion[] = [
    { q: "Aynı yükseklikteki noktaları birleştiren kapalı eğrilere ne ad verilir?", opts: ["İzobar", "İzoterm", "İzohips", "İzobat"], correct: 2, exp: "İzohips (eş yükselti eğrisi), aynı yüksekliğe sahip noktaları birleştirir." },
    { q: "Fiziki haritalarda yeşil renk genellikle hangi yükselti aralığını gösterir?", opts: ["0 - 500 m", "500 - 1000 m", "1000 - 1500 m", "1500 m üzeri"], correct: 0, exp: "Fiziki haritalarda 0-500 metre arası alçak düzlükler genellikle yeşil renkle gösterilir." },
    { q: "İzohipslerin sıklaştığı bir yamaç için ne söylenebilir?", opts: ["Eğim azdır", "Eğim fazladır", "Yükselti sabittir", "Bitki örtüsü gürdür"], correct: 1, exp: "İzohipslerin birbirine yaklaştığı yerlerde eğim artar." },
    { q: "Hangi yöntem tek başına kullanıldığında yükselti hakkında sayısal bir bilgi vermez?", opts: ["İzohips Yöntemi", "Renklendirme Yöntemi", "Kabartma Yöntemi", "Hiçbiri"], correct: 2, exp: "Kabartma yöntemi, ışık-gölge ile 3D hissi verir ancak sayısal yükselti bilgisi içermez." },
];

// Stil sabitleri
const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const BG = "#0a111c";
const C_PRIMARY = "#f97316"; // orange-500

// Ana bileşen
export default function Topoactivity({ onClose }: { onClose: () => void }) {
    const [phase, setPhase] = useState<Phase>("learn");
    const [selectedMethod, setSelectedMethod] = useState<ReliefMethod>(METHODS[0]);

    const TABS = [
        { id: "learn" as Phase, icon: "📖", label: "ÖĞREN" },
        { id: "test" as Phase, icon: "✏️", label: "TEST" },
    ];

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: BG, display: "flex", flexDirection: "column", fontFamily: FONT, color: "#e2e8f0" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: "64px", borderBottom: `1px solid ${C_PRIMARY}22`, background: "rgba(2,6,23,0.7)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ padding: "8px", background: `${C_PRIMARY}20`, borderRadius: "8px" }}>
                        <Mountain size={24} style={{ color: C_PRIMARY }} />
                    </div>
                    <div>
                        <div style={{ fontSize: "11px", letterSpacing: "3px", color: C_PRIMARY, opacity: 0.7 }}>ETKİNLİK 7</div>
                        <div style={{ fontSize: "18px", fontWeight: "800", color: "#fed7aa" }}>Yükselti ve Yer Şekilleri</div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "4px", background: "rgba(0,0,0,0.4)", padding: "4px", borderRadius: "10px" }}>
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => { sndClick(); setPhase(t.id); }}
                            style={{ padding: "8px 20px", borderRadius: "7px", border: "none", cursor: "pointer", fontFamily: FONT, fontSize: "12px", fontWeight: "700", transition: "all 0.18s",
                                background: phase === t.id ? C_PRIMARY : "transparent",
                                color: phase === t.id ? "#000" : "#7c2d12" }}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>
                <button onClick={onClose} style={{ padding: "8px 18px", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#f87171", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                    ✕ KAPAT
                </button>
            </div>

            {/* İçerik */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
                {phase === "learn" && <LearnPanel selected={selectedMethod} onSelect={m => { sndClick(); setSelectedMethod(m); }} />}
                {phase === "test" && <TestPanel />}
            </div>
        </div>
    );
}

// Öğrenme Paneli
function LearnPanel({ selected, onSelect }: { selected: ReliefMethod; onSelect: (m: ReliefMethod) => void }) {
    return (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div style={{ width: "300px", flexShrink: 0, borderRight: `1px solid ${C_PRIMARY}18`, background: "rgba(2,6,23,0.5)", overflowY: "auto", padding: "24px" }}>
                <h3 style={{ fontSize: "12px", letterSpacing: "2px", color: "#9a3412", fontWeight: "800", marginBottom: "16px" }}>GÖSTERİM YÖNTEMLERİ</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {METHODS.map(method => (
                        <button key={method.id} onClick={() => onSelect(method)}
                            style={{ padding: "14px 16px", background: selected.id === method.id ? `${method.color}20` : "rgba(255,255,255,0.03)", border: `2px solid ${selected.id === method.id ? method.color : "transparent"}`, borderRadius: "10px", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <span style={{ fontSize: "22px" }}>{method.icon}</span>
                                <div>
                                    <div style={{ fontSize: "14px", fontWeight: "800", color: selected.id === method.id ? method.color : "#94a3b8" }}>{method.name}</div>
                                    <div style={{ fontSize: "12px", color: selected.id === method.id ? `${method.color}99` : "#475569", marginTop: "3px" }}>{method.tagline}</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "32px", background: `radial-gradient(ellipse at 20% 20%, ${selected.color}08 0%, ${BG} 60%)` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                    <span style={{ fontSize: "48px" }}>{selected.icon}</span>
                    <div>
                        <h2 style={{ fontSize: "28px", fontWeight: "800", color: selected.color }}>{selected.name}</h2>
                        <p style={{ fontSize: "16px", color: `${selected.color}bb`, marginTop: "4px" }}>{selected.tagline}</p>
                    </div>
                </div>
                <div style={{ padding: "20px", background: `${selected.color}0a`, border: `1px solid ${selected.color}22`, borderRadius: "12px", marginBottom: "24px" }}>
                    <p style={{ fontSize: "15px", color: "#cbd5e1", lineHeight: "1.8", margin: 0 }}>{selected.description}</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div>
                        <h4 style={{ fontSize: "14px", color: "#10b981", fontWeight: "700", marginBottom: "12px" }}>✓ AVANTAJLARI</h4>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                            {selected.pros.map(pro => <li key={pro} style={{ fontSize: "14px", color: "#94a3b8", display: "flex", gap: "8px" }}><span style={{ color: "#10b981" }}>•</span>{pro}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ fontSize: "14px", color: "#ef4444", fontWeight: "700", marginBottom: "12px" }}>✗ DEZAVANTAJLARI</h4>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                            {selected.cons.map(con => <li key={con} style={{ fontSize: "14px", color: "#94a3b8", display: "flex", gap: "8px" }}><span style={{ color: "#ef4444" }}>•</span>{con}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Test Paneli
function TestPanel() {
  const [qIdx,     setQIdx]     = useState(0);
  const [selected, setSelected] = useState<number|null>(null);
  const [score,    setScore]    = useState(0);
  const [answers,  setAnswers]  = useState<boolean[]>([]);
  const [done,     setDone]     = useState(false);
  const q = TEST_QUESTIONS[qIdx];

  const handleAnswer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    const ok = i === q.correct;
    if (ok) { setScore(s => s+25); sndOK(); } else sndFail();
    setAnswers(a => [...a, ok]);
  };
  const next  = () => { sndClick(); if (qIdx >= TEST_QUESTIONS.length-1) { setDone(true); return; } setQIdx(i=>i+1); setSelected(null); };
  const retry = () => { setQIdx(0); setSelected(null); setScore(0); setAnswers([]); setDone(false); sndClick(); };

  if (done) {
    const pct = Math.round((score / (TEST_QUESTIONS.length*25))*100);
    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"18px", background:`radial-gradient(ellipse at center,#3a1a0a 0%,${BG} 100%)` }}>
        <div style={{ fontSize:"60px" }}>🏆</div>
        <div style={{ fontSize:"28px", fontWeight:"800", color:"#fed7aa" }}>TEST TAMAMLANDI!</div>
        <div style={{ fontSize:"52px", fontWeight:"800", color:pct>=80?"#22c55e":pct>=50?C_PRIMARY:"#ef4444" }}>{score} PUAN</div>
        <div style={{ fontSize:"15px", color:"#7c2d12" }}>{answers.filter(Boolean).length}/{TEST_QUESTIONS.length} doğru · %{pct} başarı</div>
        <button onClick={retry}
            style={{ padding:"13px 30px", background:"transparent", border:`2px solid ${C_PRIMARY}40`, borderRadius:"10px", color:C_PRIMARY, fontSize:"14px", fontWeight:"800", cursor:"pointer" }}>
            🔄 Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"32px 40px", overflowY:"auto", gap:"24px", background: `radial-gradient(ellipse at 50% 20%, #1e1b4b20 0%, ${BG} 60%)` }}>
        <div style={{ width:"100%", maxWidth:"680px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
            <span style={{ fontSize:"12px", color:"#7c2d12", fontWeight:"700", letterSpacing:"1px" }}>SORU {qIdx+1} / {TEST_QUESTIONS.length}</span>
          </div>
          <div style={{ height:"5px", background:`${C_PRIMARY}15`, borderRadius:"3px", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${((qIdx+1)/TEST_QUESTIONS.length)*100}%`, background:`linear-gradient(90deg,#9a3412,${C_PRIMARY})`, borderRadius:"3px", transition:"width 0.4s ease" }}/>
          </div>
        </div>

        <div style={{ maxWidth:"680px", width:"100%", padding:"22px 26px", background:`${C_PRIMARY}08`, border:`1.5px solid ${C_PRIMARY}20`, borderRadius:"14px" }}>
          <p style={{ fontSize:"16px", color:"#fed7aa", lineHeight:"1.9", margin:0, fontWeight:"600" }}>{q.q}</p>
        </div>

        <div style={{ maxWidth:"680px", width:"100%", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
          {q.opts.map((opt,i)=>{
            const isSel=selected===i, isCorr=i===q.correct, show=selected!==null;
            let bg="rgba(0,0,0,0.25)", border="rgba(255,255,255,0.07)", color="#7c2d12";
            if (show) {
              if (isCorr)     { bg=`#10b98118`; border="#10b981"; color="#10b981"; }
              else if (isSel) { bg=`#ef444418`; border="#ef4444"; color="#ef4444"; }
            } else if (isSel) { bg=`${C_PRIMARY}18`; border=C_PRIMARY; color=C_PRIMARY; }
            return (
              <button key={i} onClick={()=>handleAnswer(i)} disabled={selected!==null}
                style={{ padding:"15px 17px", background:bg, border:`2px solid ${border}`, borderRadius:"11px", cursor:selected!==null?"default":"pointer", textAlign:"left", transition:"all 0.18s" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:"11px" }}>
                  <span style={{ width:"24px", height:"24px", borderRadius:"50%", background:show&&isCorr?"#10b981":show&&isSel?"#ef4444":`${C_PRIMARY}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:"800", color:"#fff", flexShrink:0, marginTop:"1px" }}>
                    {show&&isCorr?"✓":show&&isSel&&!isCorr?"✗":String.fromCharCode(65+i)}
                  </span>
                  <span style={{ fontSize:"14px", color, fontWeight:"600", lineHeight:"1.6" }}>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>

        {selected!==null && (
          <div style={{ maxWidth:"680px", width:"100%", padding:"18px 22px", background:selected===q.correct?`#10b98110`:`#ef444410`, border:`2px solid ${selected===q.correct?`#10b98130`:`#ef444430`}`, borderRadius:"14px" }}>
            <div style={{ fontSize:"16px", fontWeight:"800", color:selected===q.correct?"#22c55e":"#ef4444", marginBottom:"10px" }}>
              {selected===q.correct?"✅ DOĞRU!":"❌ YANLIŞ!"}
            </div>
            <p style={{ fontSize:"14px", color:"#a16207", lineHeight:"1.85", margin:0, fontWeight:"500" }}>{q.exp}</p>
          </div>
        )}

        {selected!==null && (
          <button onClick={next}
            style={{ padding:"14px 38px", background:`linear-gradient(90deg,#9a3412,${C_PRIMARY})`, border:"none", borderRadius:"11px", color:"#fff", fontSize:"15px", fontWeight:"800", letterSpacing:"1.5px", cursor:"pointer", boxShadow:`0 4px 22px ${C_PRIMARY}40` }}>
            {qIdx>=TEST_QUESTIONS.length-1?"🏁 Sonuçları Gör":"⏭ Sonraki Soru"}
          </button>
        )}
    </div>
  );
}