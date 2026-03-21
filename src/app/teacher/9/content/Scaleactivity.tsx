"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type Tab = "learn" | "measure" | "convert" | "quiz";
type ScaleType = "fraction" | "line";

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

const SCALES = [
  { label: "1/25.000",    value: 25000,    desc: "1 cm → 250 m" },
  { label: "1/50.000",    value: 50000,    desc: "1 cm → 500 m" },
  { label: "1/100.000",   value: 100000,   desc: "1 cm → 1 km" },
  { label: "1/500.000",   value: 500000,   desc: "1 cm → 5 km" },
  { label: "1/1.000.000", value: 1000000,  desc: "1 cm → 10 km" },
];

interface QItem { q: string; opts: string[]; correct: number; exp: string; type: "fraction"|"calc"|"compare"; }
const QUIZ_ITEMS: QItem[] = [
  { type:"fraction", q:"1/100.000 ölçekli bir haritada 1 cm, gerçekte kaç km'ye karşılık gelir?", opts:["10 km","100 km","1 km","0,1 km"], correct:2, exp:"1/100.000 ölçeğinde: 1 cm × 100.000 = 100.000 cm = 1 km. Paydaki rakam doğrudan küçültme oranını verir." },
  { type:"calc",     q:"1/500.000 ölçekli haritada iki şehir arası 3 cm ölçülmüştür. Gerçek mesafe kaç km'dir?", opts:["150 km","500 km","50 km","1500 km"], correct:0, exp:"3 cm × 500.000 = 1.500.000 cm = 15.000 m = 150 km. Harita ölçüsü × ölçek paydasını cm cinsinden gerçek uzunluk verir." },
  { type:"compare",  q:"Aşağıdakilerden hangisi en büyük ölçeklidir? (En fazla ayrıntı)", opts:["1/1.000.000","1/500.000","1/100.000","1/25.000"], correct:3, exp:"Payda küçüldükçe ölçek büyür. 1/25.000 en büyük ölçektir; daha fazla ayrıntı gösterir fakat daha az alanı kapsar." },
  { type:"calc",     q:"İki nokta arası gerçek mesafe 240 km'dir. 1/1.000.000 ölçekli haritada bu mesafe kaç cm olur?", opts:["24 cm","2,4 cm","240 cm","0,24 cm"], correct:0, exp:"240 km = 24.000.000 cm. 24.000.000 ÷ 1.000.000 = 24 cm. Gerçek uzunluğu ölçek paydasına böleriz." },
  { type:"fraction", q:"Kesir ölçekte payda neyi gösterir?", opts:["Haritanın boyutunu","Gerçek uzunluğu","Küçültme oranını","Harita alanını"], correct:2, exp:"Kesir ölçekte pay=1 (haritada 1 cm), payda ise yapılan küçültme oranını gösterir. 1/100.000 → 100.000 kat küçültme." },
];

function formatNum(cm: number): string {
  if (cm >= 100000) return (cm / 100000).toFixed(cm % 100000 === 0 ? 0 : 1) + " km";
  if (cm >= 100)    return (cm / 100).toFixed(0) + " m";
  return cm.toFixed(0) + " cm";
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: "11px", letterSpacing: "2px", color: "#7a5a20", fontWeight: "800" }}>{children}</div>;
}
function SDivider() {
  return <div style={{ height: "1px", background: "rgba(251,191,36,0.09)", margin: "18px 0" }} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function ScaleActivity({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("learn");
  const TABS = [
    { id: "learn" as Tab,   icon: "📖", label: "ÖĞREN" },
    { id: "measure" as Tab, icon: "📐", label: "ÖLÇÜM YAP" },
    { id: "convert" as Tab, icon: "🔄", label: "DÖNÜŞTÜR" },
    { id: "quiz" as Tab,    icon: "✏️", label: "QUIZ" },
  ];
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"#07111e", display:"flex", flexDirection:"column", fontFamily:"'Courier New',monospace", touchAction:"none", userSelect:"none", WebkitUserSelect:"none" }} onWheel={e=>e.preventDefault()}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", height:"60px", borderBottom:"1px solid rgba(251,191,36,0.18)", background:"rgba(3,7,18,0.7)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"22px" }}>
          <div>
            <div style={{ fontSize:"9px", letterSpacing:"3px", color:"#fbbf24", opacity:0.65 }}>HARİTA ÖLÇEĞİ</div>
            <div style={{ fontSize:"17px", fontWeight:"800", color:"#fef3c7" }}>Kesir & Çizgi Ölçek</div>
          </div>
          <div style={{ display:"flex", gap:"3px", background:"rgba(0,0,0,0.35)", padding:"4px", borderRadius:"9px" }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>{sndClick();setTab(t.id);}}
                style={{ padding:"7px 14px", borderRadius:"6px", border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:"11px", fontWeight:"700", letterSpacing:"0.8px", transition:"all 0.18s", background:tab===t.id?"#d97706":"transparent", color:tab===t.id?"#fff":"#5a4a1a" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose}
          style={{ padding:"7px 16px", background:"transparent", border:"1px solid rgba(255,80,80,0.3)", borderRadius:"7px", color:"#ff7070", fontSize:"11px", fontWeight:"700", letterSpacing:"1.5px", cursor:"pointer", fontFamily:"inherit" }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,80,80,0.1)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
          ✕ KAPAT
        </button>
      </div>
      <div style={{ flex:1, overflow:"hidden", display:"flex", minHeight:0 }}>
        {tab==="learn"   && <LearnTab />}
        {tab==="measure" && <MeasureTab />}
        {tab==="convert" && <ConvertTab />}
        {tab==="quiz"    && <QuizTab />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ÖĞREN
// ═══════════════════════════════════════════════════════════════════════════════
function LearnTab() {
  const [activeType, setActiveType] = useState<ScaleType>("fraction");
  const [animScale, setAnimScale] = useState(100000);
  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
      {/* Sol */}
      <div style={{ width:"290px", flexShrink:0, borderRight:"1px solid rgba(251,191,36,0.1)", background:"rgba(3,7,18,0.5)", overflowY:"auto", padding:"22px" }}>
        <SLabel>ÖLÇEK TÜRLERİ</SLabel>
        <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginTop:"12px" }}>
          {(["fraction","line"] as ScaleType[]).map(t=>(
            <button key={t} onClick={()=>{sndClick();setActiveType(t);}}
              style={{ padding:"14px 16px", background:activeType===t?"rgba(251,191,36,0.1)":"rgba(0,0,0,0.2)", border:`2px solid ${activeType===t?"#d97706":"rgba(251,191,36,0.1)"}`, borderRadius:"10px", cursor:"pointer", textAlign:"left", fontFamily:"inherit", transition:"all 0.2s" }}>
              <div style={{ fontSize:"13px", fontWeight:"800", color:activeType===t?"#fbbf24":"#5a4a2a" }}>{t==="fraction"?"1. Kesir Ölçek":"2. Çizgi Ölçek"}</div>
              <div style={{ fontSize:"11px", color:activeType===t?"#92660a":"#2a2010", marginTop:"3px" }}>{t==="fraction"?"Pay / Payda formatı":"Grafik / Görsel format"}</div>
            </button>
          ))}
        </div>
        <SDivider />
        {activeType==="fraction" ? (
          <div>
            <SLabel>KESİR ÖLÇEK NEDİR?</SLabel>
            <div style={{ marginTop:"10px", padding:"14px 16px", background:"rgba(251,191,36,0.06)", border:"1.5px solid rgba(251,191,36,0.18)", borderRadius:"10px" }}>
              <p style={{ fontSize:"13px", color:"#a08060", lineHeight:"1.85", margin:0, fontWeight:"500" }}>
                <span style={{ color:"#fbbf24", fontWeight:"800" }}>Pay</span> ve <span style={{ color:"#fbbf24", fontWeight:"800" }}>paydadan</span> oluşan kesirli sayıyla gösterilen ölçektir. Pay her zaman <span style={{ color:"#fbbf24" }}>1</span>'dir ve haritadaki uzunluğu, payda ise küçültme oranını gösterir. Birim her zaman <span style={{ color:"#fbbf24" }}>santimetre (cm)</span>'dir.
              </p>
            </div>
            <SDivider />
            <SLabel>ÖRNEK HESAPLAMA</SLabel>
            <div style={{ marginTop:"10px", display:"flex", flexDirection:"column", gap:"8px" }}>
              {[{s:25000,m:"1 cm",r:"250 m"},{s:100000,m:"1 cm",r:"1 km"},{s:500000,m:"1 cm",r:"5 km"},{s:1000000,m:"1 cm",r:"10 km"}].map(r=>(
                <div key={r.s} style={{ padding:"9px 12px", background:"rgba(0,0,0,0.2)", border:"1px solid rgba(251,191,36,0.08)", borderRadius:"7px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:"12px", color:"#fbbf24", fontWeight:"700" }}>1/{r.s.toLocaleString("tr")}</span>
                  <span style={{ fontSize:"12px", color:"#5a4a2a" }}>{r.m} → {r.r}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <SLabel>ÇİZGİ ÖLÇEK NEDİR?</SLabel>
            <div style={{ marginTop:"10px", padding:"14px 16px", background:"rgba(251,191,36,0.06)", border:"1.5px solid rgba(251,191,36,0.18)", borderRadius:"10px" }}>
              <p style={{ fontSize:"13px", color:"#a08060", lineHeight:"1.85", margin:0, fontWeight:"500" }}>
                <span style={{ color:"#fbbf24", fontWeight:"800" }}>Grafik olarak</span> gösterilen ölçektir. Harita dijital cihazlarla çoğaltılıp ebatları değiştirildiğinde çizgi ölçek de orantılı değiştiği için <span style={{ color:"#fbbf24" }}>tercih edilir</span>.
              </p>
            </div>
            <SDivider />
            <SLabel>AVANTAJLARI</SLabel>
            <div style={{ marginTop:"10px", display:"flex", flexDirection:"column", gap:"7px" }}>
              {["Fotokopi/dijital büyütmede oran bozulmaz","Görsel olarak mesafeyi hemen gösterir","Cetvel ile doğrudan ölçüm yapılır","Kağıt parçasıyla nokta transferi kolay"].map(t=>(
                <div key={t} style={{ display:"flex", gap:"8px", alignItems:"flex-start", padding:"8px 10px", background:"rgba(0,0,0,0.15)", borderRadius:"7px" }}>
                  <span style={{ color:"#d97706", fontWeight:"800", fontSize:"12px" }}>✓</span>
                  <span style={{ fontSize:"12px", color:"#7a6040", lineHeight:"1.5", fontWeight:"500" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Orta: Animasyon */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"28px", background:"radial-gradient(ellipse at center,#0e1a2e 0%,#07111e 100%)", gap:"24px", overflowY:"auto" }}>
        {activeType==="fraction" ? <FractionViz scale={animScale} onScale={setAnimScale}/> : <LineViz/>}
      </div>

      {/* Sağ */}
      <div style={{ width:"250px", flexShrink:0, borderLeft:"1px solid rgba(251,191,36,0.1)", background:"rgba(3,7,18,0.5)", overflowY:"auto", padding:"22px" }}>
        <SLabel>BÜYÜK / KÜÇÜK ÖLÇEK</SLabel>
        <div style={{ marginTop:"12px", display:"flex", flexDirection:"column", gap:"10px" }}>
          <div style={{ padding:"14px", background:"rgba(16,185,129,0.07)", border:"1.5px solid rgba(16,185,129,0.2)", borderRadius:"10px" }}>
            <div style={{ fontSize:"13px", fontWeight:"800", color:"#10b981", marginBottom:"7px" }}>📌 Büyük Ölçek</div>
            <div style={{ fontSize:"12px", color:"#0d7a56", lineHeight:"1.7", fontWeight:"500" }}>
              <div>• Payda küçüktür (1/25.000)</div>
              <div>• Az alan, fazla ayrıntı</div>
              <div>• Şehir/mahalle haritaları</div>
            </div>
          </div>
          <div style={{ padding:"14px", background:"rgba(239,68,68,0.07)", border:"1.5px solid rgba(239,68,68,0.2)", borderRadius:"10px" }}>
            <div style={{ fontSize:"13px", fontWeight:"800", color:"#ef4444", marginBottom:"7px" }}>📌 Küçük Ölçek</div>
            <div style={{ fontSize:"12px", color:"#7a2020", lineHeight:"1.7", fontWeight:"500" }}>
              <div>• Payda büyüktür (1/1.000.000)</div>
              <div>• Geniş alan, az ayrıntı</div>
              <div>• Dünya/kıta/ülke haritaları</div>
            </div>
          </div>
        </div>
        <SDivider />
        <SLabel>ÖLÇEK TABLOSU</SLabel>
        <div style={{ marginTop:"10px", display:"flex", flexDirection:"column", gap:"5px" }}>
          {SCALES.map(s=>(
            <div key={s.value} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", background:"rgba(0,0,0,0.15)", borderRadius:"6px" }}>
              <span style={{ fontSize:"12px", color:"#fbbf24", fontWeight:"700" }}>{s.label}</span>
              <span style={{ fontSize:"11px", color:"#5a4010" }}>{s.desc}</span>
            </div>
          ))}
        </div>
        <SDivider />
        <div style={{ padding:"12px 14px", background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.12)", borderRadius:"8px" }}>
          <div style={{ fontSize:"11px", color:"#d97706", fontWeight:"800", marginBottom:"6px" }}>💡 KURAL</div>
          <p style={{ fontSize:"12px", color:"#5a4010", lineHeight:"1.7", margin:0, fontWeight:"500" }}>
            Payda <strong style={{ color:"#fbbf24" }}>küçüldükçe</strong> ölçek <strong style={{ color:"#10b981" }}>büyür</strong> → ayrıntı artar.<br/><br/>
            Payda <strong style={{ color:"#fbbf24" }}>büyüdükçe</strong> ölçek <strong style={{ color:"#ef4444" }}>küçülür</strong> → kapsam artar.
          </p>
        </div>
      </div>
    </div>
  );
}

function FractionViz({ scale, onScale }: { scale:number; onScale:(v:number)=>void }) {
  const realCm = scale;
  const realKm = scale / 100000;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"24px", width:"100%", maxWidth:"560px" }}>
      <div style={{ fontSize:"11px", letterSpacing:"3px", color:"#d97706", opacity:0.8 }}>KESİR ÖLÇEK</div>
      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", justifyContent:"center" }}>
        {SCALES.map(s=>(
          <button key={s.value} onClick={()=>{sndClick();onScale(s.value);}}
            style={{ padding:"8px 14px", background:scale===s.value?"#d97706":"rgba(0,0,0,0.3)", border:`1.5px solid ${scale===s.value?"#d97706":"rgba(251,191,36,0.15)"}`, borderRadius:"7px", color:scale===s.value?"#000":"#5a4010", fontSize:"12px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", transition:"all 0.18s" }}>
            {s.label}
          </button>
        ))}
      </div>
      {/* Kesir görseli */}
      <div style={{ padding:"28px 44px", background:"rgba(0,0,0,0.35)", border:"2px solid rgba(251,191,36,0.2)", borderRadius:"14px", textAlign:"center" }}>
        <div style={{ fontSize:"11px", color:"#d97706", letterSpacing:"2px", marginBottom:"8px" }}>ÖLÇEK</div>
        <div style={{ fontSize:"44px", fontWeight:"800", color:"#fbbf24", lineHeight:1 }}>1</div>
        <div style={{ width:"130px", height:"3px", background:"#d97706", borderRadius:"2px", margin:"8px auto" }}/>
        <div style={{ fontSize:"32px", fontWeight:"800", color:"#fbbf24" }}>{scale.toLocaleString("tr")}</div>
        <div style={{ marginTop:"10px", fontSize:"12px", color:"#7a6030" }}>
          Haritada 1 cm = Gerçekte {realCm.toLocaleString("tr")} cm
        </div>
      </div>
      {/* Karşılaştırma cetveli */}
      <div style={{ width:"100%", padding:"20px 24px", background:"rgba(0,0,0,0.25)", border:"1.5px solid rgba(251,191,36,0.12)", borderRadius:"12px" }}>
        <div style={{ fontSize:"11px", color:"#d97706", letterSpacing:"2px", marginBottom:"14px" }}>KARŞILAŞTIRMA</div>
        {/* Harita cetveli */}
        <div style={{ marginBottom:"14px" }}>
          <div style={{ fontSize:"12px", color:"#7a6030", marginBottom:"6px", fontWeight:"600" }}>Haritada (cm)</div>
          <div style={{ display:"flex", alignItems:"center" }}>
            {[0,1,2,3,4].map(n=>(
              <div key={n} style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{ width:"52px", height:n%2===0?"18px":"11px", background:n%2===0?"#fbbf24":"#92660a", borderRight:"1px solid #07111e" }}/>
                <span style={{ fontSize:"10px", color:"#7a6030", marginTop:"3px" }}>{n}</span>
              </div>
            ))}
            <span style={{ fontSize:"11px", color:"#5a4010", marginLeft:"4px" }}>cm</span>
          </div>
        </div>
        {/* Gerçek cetvel */}
        <div>
          <div style={{ fontSize:"12px", color:"#10b981", marginBottom:"6px", fontWeight:"600" }}>Gerçekte ({realKm>=1?"km":"m"})</div>
          <div style={{ display:"flex", alignItems:"center" }}>
            {[0,1,2,3,4].map(n=>(
              <div key={n} style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{ width:"52px", height:n%2===0?"18px":"11px", background:n%2===0?"#10b981":"#065f46", borderRight:"1px solid #07111e" }}/>
                <span style={{ fontSize:"10px", color:"#10b981", marginTop:"3px" }}>
                  {realKm>=1?(n*realKm).toFixed(realKm%1===0?0:1):(n*scale/100).toFixed(0)}
                </span>
              </div>
            ))}
            <span style={{ fontSize:"11px", color:"#10b981", marginLeft:"4px" }}>{realKm>=1?"km":"m"}</span>
          </div>
        </div>
        <div style={{ marginTop:"14px", padding:"10px 14px", background:"rgba(251,191,36,0.05)", borderRadius:"7px", fontSize:"13px", color:"#a08050", lineHeight:"1.7", fontWeight:"500" }}>
          📐 <strong style={{ color:"#fbbf24" }}>1/{scale.toLocaleString("tr")}</strong> ölçeğinde haritadaki <strong style={{ color:"#fbbf24" }}>1 cm</strong> gerçekte <strong style={{ color:"#10b981" }}>{realKm>=1?`${realKm} km`:`${scale/100} m`}</strong>'ye karşılık gelir.
        </div>
      </div>
    </div>
  );
}

function LineViz() {
  const [mapCm, setMapCm] = useState(3);
  const scale = 100000;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"24px", width:"100%", maxWidth:"580px" }}>
      <div style={{ fontSize:"11px", letterSpacing:"3px", color:"#d97706", opacity:0.8 }}>ÇİZGİ ÖLÇEK</div>
      <div style={{ width:"100%", padding:"22px 26px", background:"rgba(0,0,0,0.35)", border:"2px solid rgba(251,191,36,0.2)", borderRadius:"14px" }}>
        <div style={{ fontSize:"11px", color:"#d97706", letterSpacing:"2px", marginBottom:"14px" }}>ÇİZGİ ÖLÇEK (1/100.000)</div>
        <div style={{ display:"flex", alignItems:"flex-end" }}>
          {[0,1,2,3,4,5].map(n=>(
            <div key={n} style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
              <div style={{ width:"68px", height:"20px", background:n%2===0?"#fbbf24":"#1a1000", border:"1px solid #d97706", boxSizing:"border-box" }}/>
              <div style={{ fontSize:"11px", color:"#d97706", marginTop:"5px", marginLeft:"-3px" }}>{n}</div>
            </div>
          ))}
          <span style={{ fontSize:"11px", color:"#7a6030", marginLeft:"6px", marginBottom:"4px" }}>km</span>
        </div>
        <div style={{ marginTop:"16px", fontSize:"12px", color:"#7a6030", lineHeight:"1.7" }}>
          Haritada 1 cm = Gerçekte <strong style={{ color:"#fbbf24" }}>1 km</strong> (100.000 cm). Kesir ölçek karşılığı: <strong style={{ color:"#fbbf24" }}>1/100.000</strong>
        </div>
      </div>
      <div style={{ width:"100%", padding:"22px 26px", background:"rgba(0,0,0,0.25)", border:"1.5px solid rgba(251,191,36,0.12)", borderRadius:"12px" }}>
        <div style={{ fontSize:"11px", color:"#d97706", letterSpacing:"2px", marginBottom:"14px" }}>İNTERAKTİF HESAPLAMA</div>
        <label style={{ fontSize:"12px", color:"#7a6030", fontWeight:"700", display:"block", marginBottom:"8px" }}>
          Haritada ölçülen mesafe: <span style={{ color:"#fbbf24" }}>{mapCm} cm</span>
        </label>
        <input type="range" min={1} max={10} value={mapCm} onChange={e=>setMapCm(Number(e.target.value))} style={{ width:"100%", accentColor:"#d97706", cursor:"pointer" }}/>
        <div style={{ marginTop:"14px", position:"relative", height:"36px" }}>
          <div style={{ height:"28px", width:`${mapCm*50}px`, maxWidth:"100%", background:"linear-gradient(90deg,#92400e,#fbbf24)", borderRadius:"4px", transition:"width 0.3s ease", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:"11px", fontWeight:"800", color:"#000" }}>{mapCm} cm</span>
          </div>
        </div>
        <div style={{ marginTop:"12px", padding:"14px 18px", background:"rgba(16,185,129,0.07)", border:"1.5px solid rgba(16,185,129,0.2)", borderRadius:"9px" }}>
          <div style={{ fontSize:"11px", color:"#10b981", fontWeight:"700", marginBottom:"5px" }}>GERÇEK MESAFE</div>
          <div style={{ fontSize:"28px", fontWeight:"800", color:"#10b981" }}>{mapCm} km</div>
          <div style={{ fontSize:"11px", color:"#065f46", marginTop:"3px" }}>{mapCm} cm × 100.000 = {(mapCm*100000).toLocaleString("tr")} cm = {mapCm} km</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ÖLÇÜM YAP
// ═══════════════════════════════════════════════════════════════════════════════
interface City { id:string; name:string; x:number; y:number; }
const CITIES: City[] = [
  {id:"istanbul", name:"İstanbul", x:0.17,y:0.24},
  {id:"ankara",   name:"Ankara",   x:0.43,y:0.30},
  {id:"izmir",    name:"İzmir",    x:0.13,y:0.43},
  {id:"konya",    name:"Konya",    x:0.42,y:0.49},
  {id:"adana",    name:"Adana",    x:0.51,y:0.60},
  {id:"samsun",   name:"Samsun",   x:0.54,y:0.14},
  {id:"erzurum",  name:"Erzurum",  x:0.73,y:0.22},
  {id:"trabzon",  name:"Trabzon",  x:0.68,y:0.12},
  {id:"diyarbakir",name:"Diyarbakır",x:0.68,y:0.53},
  {id:"van",      name:"Van",      x:0.82,y:0.38},
  {id:"antalya",  name:"Antalya",  x:0.33,y:0.67},
  {id:"bursa",    name:"Bursa",    x:0.22,y:0.27},
];
const REAL_KM: Record<string,number> = {
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
};

function MeasureTab() {
  const [selScale, setSelScale] = useState(1000000);
  const [cityA, setCityA] = useState<City|null>(null);
  const [cityB, setCityB] = useState<City|null>(null);
  const [step, setStep] = useState<"pickA"|"pickB"|"result">("pickA");
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({w:600,h:380});
  useEffect(()=>{
    if(mapRef.current) setMapSize({w:mapRef.current.clientWidth,h:mapRef.current.clientHeight});
  },[]);

  const handleCity = (c:City)=>{
    sndClick();
    if(step==="pickA"){setCityA(c);setCityB(null);setStep("pickB");}
    else if(step==="pickB"&&c.id!==cityA?.id){setCityB(c);setStep("result");}
  };
  const reset=()=>{setCityA(null);setCityB(null);setStep("pickA");};

  let mapCm=0,realKm=0,key="";
  if(cityA&&cityB&&mapSize.w>0){
    const dx=(cityB.x-cityA.x)*mapSize.w, dy=(cityB.y-cityA.y)*mapSize.h;
    const px=Math.sqrt(dx*dx+dy*dy);
    const mapWidthCm=(1500*100000)/selScale;
    const pxPerCm=mapSize.w/mapWidthCm;
    mapCm=px/pxPerCm;
    realKm=(mapCm*selScale)/100000;
    key=`${cityA.id}-${cityB.id}`;
  }
  const knownReal=REAL_KM[key];

  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
      <div style={{ width:"270px", flexShrink:0, borderRight:"1px solid rgba(251,191,36,0.1)", background:"rgba(3,7,18,0.5)", overflowY:"auto", padding:"22px", display:"flex", flexDirection:"column", gap:"14px" }}>
        <SLabel>ÖLÇEK SEÇ</SLabel>
        <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
          {SCALES.map(s=>(
            <button key={s.value} onClick={()=>{sndClick();setSelScale(s.value);reset();}}
              style={{ padding:"9px 12px", background:selScale===s.value?"rgba(251,191,36,0.1)":"rgba(0,0,0,0.2)", border:`1.5px solid ${selScale===s.value?"#d97706":"rgba(251,191,36,0.08)"}`, borderRadius:"7px", cursor:"pointer", textAlign:"left", fontFamily:"inherit", transition:"all 0.18s" }}>
              <span style={{ fontSize:"12px", fontWeight:"700", color:selScale===s.value?"#fbbf24":"#5a4010" }}>{s.label}</span>
              <span style={{ fontSize:"11px", color:"#3a2a08", marginLeft:"8px" }}>{s.desc}</span>
            </button>
          ))}
        </div>
        <SDivider />
        <SLabel>NASIL KULLANILIR?</SLabel>
        {[{n:"1",t:"Yukarıdan ölçek seçin"},{n:"2",t:"Haritadan ilk şehre tıklayın"},{n:"3",t:"İkinci şehre tıklayın"},{n:"4",t:"Mesafeyi okuyun"}].map(s=>(
          <div key={s.n} style={{ display:"flex", gap:"10px", alignItems:"flex-start", padding:"7px 10px", background:"rgba(0,0,0,0.15)", borderRadius:"7px" }}>
            <span style={{ width:"20px", height:"20px", borderRadius:"50%", background:"#d97706", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:"800", color:"#000", flexShrink:0 }}>{s.n}</span>
            <span style={{ fontSize:"12px", color:"#7a6030", lineHeight:"1.5", fontWeight:"500" }}>{s.t}</span>
          </div>
        ))}
        <SDivider />
        {step==="pickA"&&<div style={{ padding:"12px", background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.15)", borderRadius:"8px" }}><div style={{ fontSize:"13px", color:"#fbbf24", fontWeight:"700" }}>📍 İlk şehri seçin</div><div style={{ fontSize:"12px", color:"#5a4010", marginTop:"4px" }}>Haritadaki bir şehre tıklayın.</div></div>}
        {step==="pickB"&&<div style={{ padding:"12px", background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:"8px" }}><div style={{ fontSize:"13px", color:"#10b981", fontWeight:"700" }}>📍 {cityA?.name} seçildi</div><div style={{ fontSize:"12px", color:"#0d5a38", marginTop:"4px" }}>Şimdi ikinci şehri seçin.</div></div>}
        {step==="result"&&cityA&&cityB&&(
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            <div style={{ padding:"14px", background:"rgba(251,191,36,0.08)", border:"1.5px solid rgba(251,191,36,0.2)", borderRadius:"9px" }}>
              <div style={{ fontSize:"11px", color:"#d97706", fontWeight:"700", marginBottom:"8px", letterSpacing:"1px" }}>HESAPLAMA</div>
              <div style={{ fontSize:"12px", color:"#7a6030", lineHeight:"1.8" }}>
                <div>{cityA.name} → {cityB.name}</div>
                <div>Haritada: <strong style={{ color:"#fbbf24" }}>{mapCm.toFixed(1)} cm</strong></div>
                <div>Ölçek: <strong style={{ color:"#fbbf24" }}>1/{selScale.toLocaleString("tr")}</strong></div>
                <div style={{ marginTop:"4px", fontSize:"11px", color:"#3a2a08" }}>{mapCm.toFixed(1)} × {selScale.toLocaleString("tr")} = {(mapCm*selScale).toFixed(0)} cm</div>
              </div>
            </div>
            <div style={{ padding:"14px", background:"rgba(16,185,129,0.08)", border:"1.5px solid rgba(16,185,129,0.25)", borderRadius:"9px" }}>
              <div style={{ fontSize:"11px", color:"#10b981", fontWeight:"700", marginBottom:"4px", letterSpacing:"1px" }}>GERÇEK MESAFE</div>
              <div style={{ fontSize:"26px", fontWeight:"800", color:"#10b981" }}>{realKm.toFixed(0)} km</div>
              {knownReal&&<div style={{ fontSize:"11px", color:"#065f46", marginTop:"3px" }}>Gerçek: ~{knownReal} km</div>}
            </div>
            <button onClick={reset} style={{ padding:"9px", background:"transparent", border:"1.5px solid rgba(251,191,36,0.2)", borderRadius:"7px", color:"#d97706", fontSize:"12px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(251,191,36,0.07)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>🔄 YENİDEN ÖLÇÜM</button>
          </div>
        )}
      </div>

      {/* Harita */}
      <div style={{ flex:1, position:"relative", padding:"16px", display:"flex", alignItems:"center", justifyContent:"center", background:"#07111e" }}>
        <div ref={mapRef} style={{ position:"relative", width:"100%", height:"100%", maxWidth:"700px", maxHeight:"450px" }}>
          <TurkeyMap />
          {cityA&&cityB&&(
            <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}>
              <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#fbbf24"/></marker></defs>
              <line x1={`${cityA.x*100}%`} y1={`${cityA.y*100}%`} x2={`${cityB.x*100}%`} y2={`${cityB.y*100}%`} stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="8,5" markerEnd="url(#arr)" opacity="0.9"/>
              {step==="result"&&<text x={`${(cityA.x+cityB.x)/2*100}%`} y={`${(cityA.y+cityB.y)/2*100-3}%`} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fbbf24" fontFamily="Courier New" style={{ filter:"drop-shadow(0 1px 3px rgba(0,0,0,0.9))" }}>{realKm.toFixed(0)} km</text>}
            </svg>
          )}
          {CITIES.map(city=>{
            const isA=cityA?.id===city.id, isB=cityB?.id===city.id;
            return (
              <div key={city.id} onClick={()=>handleCity(city)}
                style={{ position:"absolute", left:`${city.x*100}%`, top:`${city.y*100}%`, transform:"translate(-50%,-50%)", cursor:"pointer", zIndex:10 }}
                onMouseEnter={e=>{e.currentTarget.style.transform="translate(-50%,-50%) scale(1.4)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translate(-50%,-50%)";}}>
                <div style={{ width:"12px", height:"12px", borderRadius:"50%", background:isA?"#10b981":isB?"#fbbf24":"#ef4444", border:`2px solid ${isA?"#00ff88":isB?"#fff":"#ff8888"}`, boxShadow:`0 0 8px ${isA?"#10b981":isB?"#fbbf24":"#ef444488"}` }}/>
                <div style={{ position:"absolute", left:"14px", top:"-4px", fontSize:"10px", fontWeight:"700", color:isA?"#10b981":isB?"#fbbf24":"#c8a060", whiteSpace:"nowrap", background:"rgba(7,17,30,0.88)", padding:"1px 5px", borderRadius:"3px" }}>{city.name}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TurkeyMap() {
  return (
    <svg viewBox="0 0 100 65" style={{ width:"100%", height:"100%", position:"absolute", inset:0 }} preserveAspectRatio="xMidYMid meet">
      <defs><radialGradient id="sea" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="#1a3a5c"/><stop offset="100%" stopColor="#0d2035"/></radialGradient></defs>
      <rect width="100" height="65" fill="url(#sea)" rx="4"/>
      <path d="M5,28 Q8,20 15,18 Q20,16 28,17 Q32,15 38,13 Q45,11 52,12 Q58,11 64,12 Q70,13 76,15 Q82,17 88,20 Q93,22 95,27 Q97,32 95,38 Q92,43 87,46 Q82,49 78,52 Q74,54 70,56 Q65,58 60,59 Q55,60 50,59 Q44,60 40,58 Q35,57 30,55 Q24,52 20,49 Q14,45 10,40 Q6,35 5,28 Z" fill="#2d5a27" stroke="#3a7a30" strokeWidth="0.3"/>
      {[20,30,40,50,60,70,80].map(x=><line key={x} x1={x} y1={0} x2={x} y2={65} stroke="#1a3a5c" strokeWidth="0.2" opacity="0.5"/>)}
      {[10,20,30,40,50].map(y=><line key={y} x1={0} y1={y} x2={100} y2={y} stroke="#1a3a5c" strokeWidth="0.2" opacity="0.5"/>)}
      <rect x="3" y="59" width="18" height="3" fill="#fbbf24" rx="1" opacity="0.8"/>
      <rect x="21" y="59" width="18" height="3" fill="#1a1000" rx="1" opacity="0.8" stroke="#fbbf24" strokeWidth="0.2"/>
      <text x="3"  y="58" fontSize="2.5" fill="#fbbf24" fontFamily="Courier New">0</text>
      <text x="21" y="58" fontSize="2.5" fill="#fbbf24" fontFamily="Courier New">500</text>
      <text x="40" y="62" fontSize="2.5" fill="#fbbf24" fontFamily="Courier New">km</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DÖNÜŞTÜR
// ═══════════════════════════════════════════════════════════════════════════════
function ConvertTab() {
  const [mode, setMode] = useState<"mapToReal"|"realToMap">("mapToReal");
  const [selScale, setSelScale] = useState(100000);
  const [inputVal, setInputVal] = useState("");
  const num = parseFloat(inputVal.replace(",",".")) || 0;

  let resultText = "", formulaText = "", resultBig = "";
  if(num>0){
    if(mode==="mapToReal"){
      const cm = num*selScale;
      const km = cm/100000;
      formulaText = `${num} cm × ${selScale.toLocaleString("tr")} = ${cm.toLocaleString("tr")} cm`;
      resultBig = formatNum(cm);
      resultText = `= ${km%1===0?km.toFixed(0):km.toFixed(2)} km`;
    } else {
      const realCm = num*100000;
      const mapCm = realCm/selScale;
      formulaText = `${num} km = ${realCm.toLocaleString("tr")} cm ÷ ${selScale.toLocaleString("tr")}`;
      resultBig = `${mapCm%1===0?mapCm.toFixed(0):mapCm.toFixed(3)} cm`;
      resultText = `haritada`;
    }
  }

  return (
    <div style={{ flex:1, overflowY:"auto", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"36px 24px", background:"radial-gradient(ellipse at center,#0e1a2e 0%,#07111e 100%)" }}>
      <div style={{ width:"100%", maxWidth:"680px", display:"flex", flexDirection:"column", gap:"22px" }}>
        <div style={{ fontSize:"11px", letterSpacing:"3px", color:"#d97706", textAlign:"center" }}>ÖLÇEK DÖNÜŞTÜRÜCÜ</div>
        {/* Mod */}
        <div style={{ display:"flex", gap:"10px", justifyContent:"center" }}>
          {[["mapToReal","📏 Harita → Gerçek","cm → km"] as const,["realToMap","🗺️ Gerçek → Harita","km → cm"] as const].map(([m,label,sub])=>(
            <button key={m} onClick={()=>{sndClick();setMode(m);setInputVal("");}}
              style={{ padding:"14px 22px", background:mode===m?"rgba(251,191,36,0.12)":"rgba(0,0,0,0.3)", border:`2px solid ${mode===m?"#d97706":"rgba(251,191,36,0.1)"}`, borderRadius:"10px", cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
              <div style={{ fontSize:"14px", fontWeight:"800", color:mode===m?"#fbbf24":"#5a4010" }}>{label}</div>
              <div style={{ fontSize:"11px", color:mode===m?"#92660a":"#2a1a00", marginTop:"3px" }}>{sub}</div>
            </button>
          ))}
        </div>
        {/* Ölçek */}
        <div>
          <div style={{ fontSize:"12px", color:"#7a6030", fontWeight:"700", marginBottom:"10px", letterSpacing:"1px" }}>ÖLÇEK</div>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            {SCALES.map(s=>(
              <button key={s.value} onClick={()=>{sndClick();setSelScale(s.value);}}
                style={{ padding:"9px 16px", background:selScale===s.value?"#d97706":"rgba(0,0,0,0.3)", border:`1.5px solid ${selScale===s.value?"#d97706":"rgba(251,191,36,0.12)"}`, borderRadius:"8px", color:selScale===s.value?"#000":"#5a4010", fontSize:"12px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", transition:"all 0.18s" }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {/* Giriş */}
        <div style={{ padding:"24px 28px", background:"rgba(0,0,0,0.3)", border:"2px solid rgba(251,191,36,0.15)", borderRadius:"14px", display:"flex", flexDirection:"column", gap:"16px" }}>
          <div>
            <label style={{ fontSize:"13px", color:"#7a6030", fontWeight:"700", display:"block", marginBottom:"10px" }}>
              {mode==="mapToReal"?"Harita üzerindeki ölçüm (cm)":"Gerçek mesafe (km)"}
            </label>
            <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
              <input type="number" value={inputVal} onChange={e=>setInputVal(e.target.value)}
                placeholder={mode==="mapToReal"?"Örn: 3.5":"Örn: 450"}
                style={{ flex:1, padding:"14px 16px", background:"rgba(0,0,0,0.4)", border:"2px solid rgba(251,191,36,0.2)", borderRadius:"9px", color:"#fbbf24", fontSize:"18px", fontFamily:"inherit", fontWeight:"700", outline:"none" }}/>
              <span style={{ fontSize:"16px", color:"#d97706", fontWeight:"700" }}>{mode==="mapToReal"?"cm":"km"}</span>
            </div>
          </div>
          {num>0&&(
            <>
              <div style={{ padding:"12px 16px", background:"rgba(251,191,36,0.05)", borderRadius:"8px" }}>
                <div style={{ fontSize:"11px", color:"#7a6030", fontWeight:"600", marginBottom:"4px" }}>FORMÜL</div>
                <div style={{ fontSize:"13px", color:"#d97706", fontWeight:"700", fontFamily:"Courier New" }}>{formulaText}</div>
              </div>
              <div style={{ textAlign:"center", fontSize:"20px" }}>⬇️</div>
              <div style={{ padding:"20px 24px", background:"rgba(16,185,129,0.08)", border:"2px solid rgba(16,185,129,0.25)", borderRadius:"10px", textAlign:"center" }}>
                <div style={{ fontSize:"12px", color:"#10b981", fontWeight:"700", marginBottom:"6px", letterSpacing:"1px" }}>SONUÇ</div>
                <div style={{ fontSize:"36px", fontWeight:"800", color:"#10b981" }}>{resultBig}</div>
                <div style={{ fontSize:"12px", color:"#065f46", marginTop:"5px" }}>{resultText}</div>
              </div>
            </>
          )}
        </div>
        {/* Referans tablosu */}
        <div style={{ padding:"20px 24px", background:"rgba(0,0,0,0.2)", border:"1px solid rgba(251,191,36,0.08)", borderRadius:"12px" }}>
          <div style={{ fontSize:"12px", color:"#7a6030", fontWeight:"700", marginBottom:"12px", letterSpacing:"1px" }}>HIZLI REFERANS — 1/{selScale.toLocaleString("tr")} ÖLÇEK</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
            {[1,2,3,5,10,15].map(cm=>(
              <div key={cm} style={{ display:"flex", justifyContent:"space-between", padding:"7px 12px", background:"rgba(0,0,0,0.15)", borderRadius:"5px" }}>
                <span style={{ fontSize:"12px", color:"#fbbf24", fontWeight:"700" }}>{cm} cm →</span>
                <span style={{ fontSize:"12px", color:"#10b981", fontWeight:"700" }}>{formatNum(cm*selScale)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════════════════════
function QuizTab() {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number|null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);
  const q = QUIZ_ITEMS[qIdx];

  const handleAnswer=(i:number)=>{
    if(selected!==null)return;
    setSelected(i);
    const ok=i===q.correct;
    if(ok){setScore(s=>s+20);sndOK();}else{sndFail();}
    setAnswers(a=>[...a,ok]);
  };
  const next=()=>{ sndClick(); if(qIdx>=QUIZ_ITEMS.length-1){setDone(true);return;} setQIdx(i=>i+1);setSelected(null); };
  const retry=()=>{setQIdx(0);setSelected(null);setScore(0);setAnswers([]);setDone(false);};

  if(done){
    const pct=Math.round((score/(QUIZ_ITEMS.length*20))*100);
    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"18px", background:"radial-gradient(ellipse at center,#1a1000 0%,#07111e 100%)" }}>
        <div style={{ fontSize:"56px" }}>📏</div>
        <div style={{ fontSize:"24px", fontWeight:"800", color:"#fbbf24" }}>QUIZ TAMAMLANDI!</div>
        <div style={{ fontSize:"48px", fontWeight:"800", color:pct>=80?"#10b981":pct>=50?"#fbbf24":"#ef4444" }}>{score} PUAN</div>
        <div style={{ fontSize:"14px", color:"#5a4010" }}>{answers.filter(Boolean).length}/{QUIZ_ITEMS.length} doğru · %{pct}</div>
        <div style={{ fontSize:"14px", color:"#7a6030", textAlign:"center", maxWidth:"380px", lineHeight:"1.7" }}>
          {pct>=80?"🏆 Mükemmel! Harita ölçeğini çok iyi öğrendin.":pct>=50?"👍 İyi! Dönüştür sekmesini tekrar incele.":"📚 Tekrar dene! Öğren sekmesinden başla."}
        </div>
        <button onClick={retry} style={{ padding:"12px 28px", background:"linear-gradient(90deg,#92400e,#d97706)", border:"none", borderRadius:"9px", color:"#fff", fontSize:"13px", fontWeight:"800", letterSpacing:"1.5px", cursor:"pointer", fontFamily:"inherit" }}>🔄 TEKRAR DENE</button>
      </div>
    );
  }

  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
      {/* Sol */}
      <div style={{ width:"210px", flexShrink:0, borderRight:"1px solid rgba(251,191,36,0.1)", background:"rgba(3,7,18,0.5)", padding:"22px", display:"flex", flexDirection:"column", gap:"8px" }}>
        <SLabel>SORULAR</SLabel>
        <div style={{ display:"flex", flexDirection:"column", gap:"7px", marginTop:"8px" }}>
          {QUIZ_ITEMS.map((item,i)=>{
            const d=i<answers.length, cur=i===qIdx;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:"9px", padding:"9px 11px", background:cur?"rgba(251,191,36,0.1)":"rgba(0,0,0,0.15)", border:`1.5px solid ${cur?"#d97706":d?(answers[i]?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"):"rgba(255,255,255,0.04)"}`, borderRadius:"7px" }}>
                <div style={{ width:"22px", height:"22px", borderRadius:"50%", background:d?(answers[i]?"#10b981":"#ef4444"):cur?"#d97706":"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:"800", color:"#fff", flexShrink:0 }}>
                  {d?(answers[i]?"✓":"✗"):i+1}
                </div>
                <div>
                  <div style={{ fontSize:"11px", color:cur?"#fbbf24":d?(answers[i]?"#10b981":"#ef4444"):"#2a1a00", fontWeight:cur?"800":"500" }}>Soru {i+1}</div>
                  <div style={{ fontSize:"10px", color:"#2a1a00" }}>{item.type==="fraction"?"Kavram":item.type==="calc"?"Hesaplama":"Karşılaştırma"}</div>
                </div>
              </div>
            );
          })}
        </div>
        <SDivider />
        <div style={{ padding:"12px", background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.12)", borderRadius:"8px" }}>
          <div style={{ fontSize:"10px", color:"#5a4010", fontWeight:"700", letterSpacing:"1px" }}>PUAN</div>
          <div style={{ fontSize:"28px", fontWeight:"800", color:"#fbbf24" }}>{score}</div>
          <div style={{ fontSize:"11px", color:"#3a2a00" }}>/ {QUIZ_ITEMS.length*20}</div>
        </div>
      </div>

      {/* Soru */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"28px 36px", overflowY:"auto", gap:"18px" }}>
        <div style={{ width:"100%", maxWidth:"620px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"7px" }}>
            <span style={{ fontSize:"11px", color:"#5a4010", fontWeight:"700", letterSpacing:"1px" }}>SORU {qIdx+1} / {QUIZ_ITEMS.length}</span>
            <span style={{ fontSize:"11px", color:"#d97706" }}>{Math.round((qIdx/QUIZ_ITEMS.length)*100)}% tamamlandı</span>
          </div>
          <div style={{ height:"5px", background:"rgba(251,191,36,0.12)", borderRadius:"3px", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${(qIdx/QUIZ_ITEMS.length)*100}%`, background:"linear-gradient(90deg,#92400e,#d97706,#fbbf24)", borderRadius:"3px", transition:"width 0.4s ease" }}/>
          </div>
        </div>
        <div style={{ alignSelf:"flex-start", maxWidth:"620px", width:"100%" }}>
          <span style={{ padding:"5px 12px", background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:"20px", fontSize:"11px", color:"#d97706", fontWeight:"700" }}>
            {q.type==="fraction"?"📐 KAVRAM":q.type==="calc"?"🔢 HESAPLAMA":"⚖️ KARŞILAŞTIRMA"}
          </span>
        </div>
        <div style={{ maxWidth:"620px", width:"100%", padding:"20px 24px", background:"rgba(251,191,36,0.06)", border:"1.5px solid rgba(251,191,36,0.18)", borderRadius:"12px" }}>
          <p style={{ fontSize:"15px", color:"#d4a84a", lineHeight:"1.8", margin:0, fontWeight:"600" }}>{q.q}</p>
        </div>
        <div style={{ maxWidth:"620px", width:"100%", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
          {q.opts.map((opt,i)=>{
            const isSel=selected===i, isCorr=i===q.correct, show=selected!==null;
            let bg="rgba(0,0,0,0.25)",border="rgba(255,255,255,0.06)",color="#6a5030";
            if(show){if(isCorr){bg="rgba(16,185,129,0.1)";border="#10b981";color="#10b981";}else if(isSel){bg="rgba(239,68,68,0.1)";border="#ef4444";color="#ef4444";}}
            else if(isSel){bg="rgba(251,191,36,0.1)";border="#d97706";color="#fbbf24";}
            return (
              <button key={i} onClick={()=>handleAnswer(i)} disabled={selected!==null}
                style={{ padding:"14px 16px", background:bg, border:`2px solid ${border}`, borderRadius:"10px", cursor:selected!==null?"default":"pointer", fontFamily:"inherit", textAlign:"left", transition:"all 0.18s" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:"10px" }}>
                  <span style={{ width:"22px", height:"22px", borderRadius:"50%", background:show&&isCorr?"#10b981":show&&isSel?"#ef4444":"rgba(251,191,36,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:"800", color:show?"#fff":"#d97706", flexShrink:0, marginTop:"1px" }}>
                    {show&&isCorr?"✓":show&&isSel&&!isCorr?"✗":String.fromCharCode(65+i)}
                  </span>
                  <span style={{ fontSize:"13px", color, fontWeight:"600", lineHeight:"1.5" }}>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>
        {selected!==null&&(
          <div style={{ maxWidth:"620px", width:"100%", padding:"16px 20px", background:selected===q.correct?"rgba(16,185,129,0.07)":"rgba(239,68,68,0.07)", border:`2px solid ${selected===q.correct?"rgba(16,185,129,0.25)":"rgba(239,68,68,0.25)"}`, borderRadius:"12px" }}>
            <div style={{ fontSize:"14px", fontWeight:"800", color:selected===q.correct?"#10b981":"#ef4444", marginBottom:"8px" }}>{selected===q.correct?"✅ DOĞRU!":"❌ YANLIŞ!"}</div>
            <p style={{ fontSize:"13px", color:"#8a7050", lineHeight:"1.8", margin:0, fontWeight:"500" }}>{q.exp}</p>
          </div>
        )}
        {selected!==null&&(
          <button onClick={next}
            style={{ padding:"14px 36px", background:"linear-gradient(90deg,#92400e,#d97706,#fbbf24)", border:"none", borderRadius:"10px", color:"#000", fontSize:"14px", fontWeight:"800", letterSpacing:"1.5px", cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 20px rgba(217,119,6,0.35)" }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";}}>
            {qIdx>=QUIZ_ITEMS.length-1?"🏁 SONUÇLARI GÖR":"⏭ SONRAKİ SORU"}
          </button>
        )}
      </div>
    </div>
  );
}