"use client";
import { useState, useRef, useEffect } from "react";

// ─── Ses ─────────────────────────────────────────────────────────────────────
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
const sndOK    = () => [440,554,660].forEach((f,i)=>setTimeout(()=>beep(f,0.22,"sine",0.13),i*80));
const sndFail  = () => beep(200,0.30,"sawtooth",0.12);
const sndClick = () => beep(680,0.07,"square",0.06);

// ─── Stil sabitleri ───────────────────────────────────────────────────────────
const FONT  = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const MONO  = "'Courier New',Courier,monospace";
const BG    = "#060d1a";
const C     = "#f59e0b";   // amber — güneş/saat teması
const C2    = "#38bdf8";   // sky blue — dünya/harita
const C3    = "#a78bfa";   // violet — tarih çizgisi
const PANEL = "rgba(6,13,26,0.82)";

type Tab = "learn" | "act" | "test";
type LearnSec = "yerel" | "ulusal" | "uluslararasi" | "tarih";

// ─── Şehir verileri (Aktivite + Test) ─────────────────────────────────────
interface Sehir { id: string; isim: string; ulke: string; dilim: number; harf: string; }
const SEHIRLER: Sehir[] = [
  { id:"istanbul",   isim:"İstanbul",    ulke:"Türkiye",          dilim:3,  harf:"d" },
  { id:"quebec",     isim:"Québec",      ulke:"Kanada",           dilim:-5, harf:"a" },
  { id:"buenosaires",isim:"Buenos Aires",ulke:"Arjantin",         dilim:-3, harf:"b" },
  { id:"reykjavik",  isim:"Reykjavík",   ulke:"İzlanda",          dilim:0,  harf:"c" },
  { id:"stpetersburg",isim:"St. Petersburg",ulke:"Rusya Fed.",    dilim:3,  harf:"ç" },
  { id:"pekin",      isim:"Pekin",       ulke:"Çin H.C.",         dilim:8,  harf:"e" },
  { id:"tokyo",      isim:"Tokyo",       ulke:"Japonya",          dilim:9,  harf:"f" },
];

// ─── Test soruları ─────────────────────────────────────────────────────────
const TEST_ITEMS = [
  { q:"Yerel saat neye göre belirlenir?",
    opts:["Ülkelerin resmî kararına","Güneş'in öğle vakti en yüksek noktaya ulaştığı zamana","Başlangıç meridyenine göre hesaplamayla","GPS uydularının zaman sinyaline"],
    correct:1, exp:"Güneş'in ufuk düzlemi üzerinde en yüksek noktaya ulaştığı zaman dilimi öğle vakti (12.00) olarak belirlenir. Bu öğle vaktine göre ayarlanan saate yerel saat adı verilir." },
  { q:"Uluslararası saat dilimlerine göre dünya kaç eşit parçaya bölünmüştür?",
    opts:["12","36","24","48"],
    correct:2, exp:"Uluslararası saat dilimlerine göre dünya, 15'er derecelik aralıklarla 24 saat dilimine ayrılmıştır. 360° ÷ 15° = 24 saat dilimi." },
  { q:"Türkiye hangi saat diliminde yer alır?",
    opts:["+2","+3","+4","+1"],
    correct:1, exp:"Türkiye, ulusal saat olarak 45° doğu meridyenini esas aldığından +3. saat diliminde yer alır." },
  { q:"Doğu yarım küreye doğru her 15° ilerledikçe saat nasıl değişir?",
    opts:["1 saat geri gider","1 saat ileri gider","Değişmez","2 saat ileri gider"],
    correct:1, exp:"Dünya batıdan doğuya doğru döndüğü için doğuya gidildikçe güneş daha erken doğar. Her 15° doğuya gidişte saat 1 saat ileri gider." },
  { q:"Ulusal (ortak) saat neden kullanılır?",
    opts:["Ülkelerin meridyen sayısını artırmak için","Ulaşım ve resmi işlemlerde yerel saat farklarının yarattığı karışıklığı önlemek için","Güneş'in konumunu doğru hesaplamak için","Saat dilimlerini uluslararası standarda uydurmak için"],
    correct:1, exp:"Bir ülke içindeki yerel saat farkları; resmî işlemler ile ulaşım, bankacılık, iletişim gibi hizmetlerin yürütülmesinde karışıklığa neden olabilir. Bu sorunu çözmek için ulusal (ortak) saat kullanılır." },
  { q:"Tarih değiştirme çizgisi hangi meridyen üzerinde yer alır?",
    opts:["0° meridyeni","90° doğu meridyeni","180° meridyeni","45° doğu meridyeni"],
    correct:2, exp:"Başlangıç meridyeninin (0°) tam karşısında yer alan 180° meridyeni tarih değiştirme çizgisi olarak adlandırılır." },
  { q:"İstanbul (UTC+3) saat 12.00 iken Tokyo'da (UTC+9) saat kaçtır?",
    opts:["06.00","18.00","15.00","09.00"],
    correct:1, exp:"Tokyo, İstanbul'dan 6 saat ileridedir (9-3=6). İstanbul'da 12.00 iken Tokyo'da 12+6=18.00'dir." },
  { q:"İstanbul (UTC+3) saat 12.00 iken Québec'te (UTC-5) saat kaçtır?",
    opts:["20.00","04.00","19.00","17.00"],
    correct:1, exp:"Québec, İstanbul'dan 8 saat geridedir (3-(-5)=8). İstanbul'da 12.00 iken Québec'te 12-8=04.00'tür." },
  { q:"Tarih değiştirme çizgisini doğudan batıya (Büyük Okyanus'tan Asya'ya doğru) geçen biri tarihi nasıl değiştirir?",
    opts:["Tarihi 1 gün geri alır","Tarihi 1 gün ileri alır","Tarih değişmez","2 gün ileri alır"],
    correct:1, exp:"Tarih değiştirme çizgisinin batısında (doğu yarım kürede) tarih bir gün ileri, doğusunda (batı yarım kürede) bir gün geridir. Doğudan batıya geçince tarihi 1 gün ileri almak gerekir." },
  { q:"Birden fazla ulusal saat kullanan ülkeler nasıl ülkelerdir?",
    opts:["Küçük yüzölçümlü adacık devletleri","Doğu-batı doğrultusunda geniş yer kaplayan ülkeler","Ekonomisi güçlü ülkeler","Çok nüfuslu ülkeler"],
    correct:1, exp:"Kanada, ABD, Rusya Federasyonu, Avustralya gibi doğu-batı doğrultusunda geniş yer kaplayan ve üzerinden fazla sayıda meridyen geçen ülkelerde aynı anda birden fazla ortak saat kullanılmaktadır." },
];

// ─── Saat dilimi hesaplama aktivitesi ─────────────────────────────────────
function SaatDilimiAktivite() {
  const referansIstanbul = SEHIRLER.find(s=>s.id==="istanbul")!;
  const [referansSaat, setReferansSaat] = useState(12);
  const [userAnswers, setUserAnswers] = useState<Record<string,string>>({});
  const [checked, setChecked]         = useState(false);
  const [results, setResults]         = useState<Record<string,boolean>>({});

  const hedefSehirler = SEHIRLER.filter(s=>s.id !== "istanbul");

  const hesapla = (dilim: number) => {
    const fark = dilim - referansIstanbul.dilim;
    let saat = (referansSaat + fark + 48) % 24;
    return saat;
  };

  const formatSaat = (s: number) => {
    const h = Math.floor(s).toString().padStart(2,"0");
    return `${h}:00`;
  };

  const handleCheck = () => {
    const res: Record<string,boolean> = {};
    hedefSehirler.forEach(s=>{
      const dogru = hesapla(s.dilim);
      const kullanici = parseInt((userAnswers[s.id]||"").replace(":","").replace("00","")) ;
      const kullaniciSaat = parseInt(userAnswers[s.id]||"-1");
      res[s.id] = kullaniciSaat === dogru;
    });
    setResults(res);
    setChecked(true);
    const allOk = Object.values(res).every(Boolean);
    if(allOk) sndOK(); else sndFail();
  };

  const reset = () => { setUserAnswers({}); setChecked(false); setResults({}); sndClick(); };

  // Saat rengi
  const saatRengi = (s: number) => {
    if(s>=6&&s<12) return "#f59e0b";
    if(s>=12&&s<18) return "#38bdf8";
    if(s>=18&&s<22) return "#a78bfa";
    return "#64748b";
  };
  const saatEmoji = (s: number) => {
    if(s>=6&&s<12) return "🌅";
    if(s>=12&&s<18) return "☀️";
    if(s>=18&&s<22) return "🌆";
    return "🌙";
  };

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:"18px" }}>
      {/* Başlık */}
      <div>
        <div style={{ fontSize:"10px",color:C,letterSpacing:"3px",fontWeight:"800",fontFamily:MONO,marginBottom:"4px" }}>ETKİNLİK — iGEO 2026 İSTANBUL</div>
        <div style={{ fontSize:"17px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT }}>🌍 Saat Dilimi Hesaplama</div>
        <div style={{ fontSize:"13px",color:"#475569",marginTop:"4px",fontFamily:FONT }}>Uluslararası Coğrafya Olimpiyatı için İstanbul saat 12.00'de toplantı var. Diğer şehirlerin saatini hesapla.</div>
      </div>

      {/* Dünya saat dilimi görseli — SVG */}
      <div style={{ padding:"14px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:"12px" }}>
        <div style={{ fontSize:"11px",color:C2,letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT }}>SAAT DİLİMİ ÇİZELGESİ</div>
        <div style={{ overflowX:"auto" }}>
          <svg viewBox="0 0 760 80" width="100%" style={{ minWidth:"600px" }}>
            {/* Arka plan bantları */}
            {Array.from({length:24},(_,i)=>{
              const x = i*(760/24);
              const w = 760/24;
              const dilim = i-12;
              const isPos = dilim > 0;
              const isNeg = dilim < 0;
              return (
                <g key={i}>
                  <rect x={x} y={0} width={w} height={80}
                    fill={dilim===3?"rgba(245,158,11,0.18)":i%2===0?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.04)"}
                    stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
                  <text x={x+w/2} y={15} textAnchor="middle" fontSize="8" fill={dilim===3?C:"#475569"} fontFamily={MONO} fontWeight={dilim===3?"800":"400"}>
                    {dilim===0?"0":dilim>0?`+${dilim}`:dilim}
                  </text>
                </g>
              );
            })}
            {/* Şehir noktaları */}
            {SEHIRLER.map(s=>{
              const idx = s.dilim + 12;
              const x = idx*(760/24) + (760/24)/2;
              const isRef = s.id==="istanbul";
              return (
                <g key={s.id}>
                  <circle cx={x} cy={isRef?48:55} r={isRef?8:6}
                    fill={isRef?C:`${C2}90`} stroke={isRef?C:C2} strokeWidth={isRef?2:1}/>
                  <text x={x} y={isRef?36:44} textAnchor="middle" fontSize="7" fill={isRef?C:C2} fontFamily={FONT} fontWeight="700">
                    {s.isim.substring(0,6)}
                  </text>
                  <text x={x} y={isRef?62:68} textAnchor="middle" fontSize="8" fill={isRef?C:"#94a3b8"} fontFamily={MONO}>
                    {s.dilim>0?`+${s.dilim}`:s.dilim}
                  </text>
                </g>
              );
            })}
            {/* 180° çizgisi */}
            <line x1={755} y1={0} x2={755} y2={80} stroke={C3} strokeWidth="2" strokeDasharray="4,3"/>
            <text x={748} y={12} textAnchor="end" fontSize="7" fill={C3} fontFamily={MONO}>180°</text>
            {/* 0° çizgisi */}
            <line x1={380} y1={0} x2={380} y2={80} stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,3"/>
            <text x={384} y={12} fontSize="7" fill="#64748b" fontFamily={MONO}>0°</text>
          </svg>
        </div>
      </div>

      {/* Referans saat seçici */}
      <div style={{ padding:"14px 18px",background:`${C}0d`,border:`1.5px solid ${C}28`,borderRadius:"12px",display:"flex",alignItems:"center",gap:"20px",flexWrap:"wrap" }}>
        <div>
          <div style={{ fontSize:"10px",color:C,letterSpacing:"2px",fontWeight:"800",fontFamily:MONO,marginBottom:"4px" }}>İSTANBUL REFERANS SAATİ (+3)</div>
          <div style={{ fontSize:"28px",fontWeight:"800",color:C,fontFamily:MONO }}>{formatSaat(referansSaat)}</div>
        </div>
        <div style={{ flex:1,minWidth:"180px" }}>
          <input type="range" min={0} max={23} value={referansSaat}
            onChange={e=>{setReferansSaat(parseInt(e.target.value));if(checked){setChecked(false);setResults({});}}}
            style={{ width:"100%",accentColor:C,cursor:"pointer" }}/>
          <div style={{ display:"flex",justifyContent:"space-between",fontSize:"10px",color:"#475569",fontFamily:MONO,marginTop:"2px" }}>
            <span>00:00</span><span>12:00</span><span>23:00</span>
          </div>
        </div>
        <div style={{ fontSize:"22px" }}>{saatEmoji(referansSaat)}</div>
      </div>

      {/* Tablo */}
      <div style={{ display:"flex",flexDirection:"column",gap:"6px" }}>
        <div style={{ display:"grid",gridTemplateColumns:"1.2fr 0.8fr 0.8fr 1fr",gap:"8px",padding:"8px 14px",background:"rgba(0,0,0,0.3)",borderRadius:"8px" }}>
          <div style={{ fontSize:"11px",fontWeight:"800",color:"#475569",fontFamily:FONT }}>ŞEHİR / ÜLKE</div>
          <div style={{ fontSize:"11px",fontWeight:"800",color:"#475569",fontFamily:FONT }}>SAAT DİLİMİ</div>
          <div style={{ fontSize:"11px",fontWeight:"800",color:"#475569",fontFamily:FONT }}>FARK</div>
          <div style={{ fontSize:"11px",fontWeight:"800",color:"#475569",fontFamily:FONT }}>TOPLANTI SAATİ</div>
        </div>
        {/* İstanbul (referans) */}
        <div style={{ display:"grid",gridTemplateColumns:"1.2fr 0.8fr 0.8fr 1fr",gap:"8px",padding:"10px 14px",background:`${C}12`,border:`1.5px solid ${C}30`,borderRadius:"8px",alignItems:"center" }}>
          <div>
            <div style={{ fontSize:"13px",fontWeight:"800",color:C,fontFamily:FONT }}>🇹🇷 İstanbul</div>
            <div style={{ fontSize:"11px",color:"#92400e",fontFamily:FONT }}>Türkiye — Referans</div>
          </div>
          <div style={{ fontSize:"14px",fontWeight:"800",color:C,fontFamily:MONO }}>+3</div>
          <div style={{ fontSize:"12px",color:"#92400e",fontFamily:MONO }}>—</div>
          <div style={{ fontSize:"18px",fontWeight:"800",color:C,fontFamily:MONO }}>{formatSaat(referansSaat)}</div>
        </div>
        {/* Diğer şehirler */}
        {hedefSehirler.map(s=>{
          const dogruSaat = hesapla(s.dilim);
          const fark = s.dilim - referansIstanbul.dilim;
          const isOk = checked ? results[s.id] : null;
          const renk = isOk===true?"#34d399":isOk===false?"#ef4444":C2;
          return (
            <div key={s.id} style={{ display:"grid",gridTemplateColumns:"1.2fr 0.8fr 0.8fr 1fr",gap:"8px",padding:"10px 14px",background:isOk===true?"rgba(52,211,153,0.07)":isOk===false?"rgba(239,68,68,0.07)":`${C2}08`,border:`1.5px solid ${isOk===true?"#34d39930":isOk===false?"#ef444430":`${C2}18`}`,borderRadius:"8px",alignItems:"center" }}>
              <div>
                <div style={{ fontSize:"13px",fontWeight:"800",color:renk,fontFamily:FONT }}>({s.harf}) {s.isim}</div>
                <div style={{ fontSize:"11px",color:"#334155",fontFamily:FONT }}>{s.ulke}</div>
              </div>
              <div style={{ fontSize:"14px",fontWeight:"800",color:renk,fontFamily:MONO }}>{s.dilim>0?`+${s.dilim}`:s.dilim}</div>
              <div style={{ fontSize:"12px",color:"#475569",fontFamily:MONO }}>{fark>0?`+${fark}`:fark} saat</div>
              <div style={{ display:"flex",alignItems:"center",gap:"8px" }}>
                <input type="number" min={0} max={23} placeholder="0-23"
                  value={userAnswers[s.id]||""}
                  onChange={e=>{ setUserAnswers(a=>({...a,[s.id]:e.target.value})); if(checked){setChecked(false);setResults({});} }}
                  style={{ width:"70px",padding:"7px 10px",background:"rgba(0,0,0,0.4)",border:`1.5px solid ${isOk===true?"#34d399":isOk===false?"#ef4444":"rgba(56,189,248,0.25)"}`,borderRadius:"7px",color:"#e2e8f0",fontSize:"15px",fontFamily:MONO,fontWeight:"700",outline:"none" }}/>
                <span style={{ fontSize:"12px",color:"#334155",fontFamily:MONO }}>:00</span>
                {isOk===true && <span style={{ fontSize:"16px" }}>✅</span>}
                {isOk===false && (
                  <span style={{ display:"flex",flexDirection:"column",gap:"1px" }}>
                    <span style={{ fontSize:"12px" }}>❌</span>
                    <span style={{ fontSize:"11px",color:"#34d399",fontFamily:MONO }}>{formatSaat(dogruSaat)}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Kontrol butonu */}
      <div style={{ display:"flex",gap:"10px" }}>
        <button onClick={handleCheck}
          style={{ flex:1,padding:"13px",background:`linear-gradient(90deg,#b45309,${C})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT }}>
          ✔ Cevapları Kontrol Et
        </button>
        <button onClick={reset}
          style={{ padding:"13px 20px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",color:"#94a3b8",fontSize:"14px",fontWeight:"700",cursor:"pointer",fontFamily:FONT }}>
          🔄 Sıfırla
        </button>
      </div>

      {checked && (
        <div style={{ padding:"14px 18px",background:Object.values(results).every(Boolean)?"rgba(52,211,153,0.08)":"rgba(245,158,11,0.08)",border:`1.5px solid ${Object.values(results).every(Boolean)?"#34d39930":"rgba(245,158,11,0.3)"}`,borderRadius:"10px",fontSize:"13px",color:Object.values(results).every(Boolean)?"#34d399":C,fontWeight:"700",fontFamily:FONT }}>
          {Object.values(results).every(Boolean)
            ? "🎉 Tüm hesaplamalar doğru! Tebrikler."
            : `${Object.values(results).filter(Boolean).length}/${hedefSehirler.length} doğru. Kırmızı kutucuklara doğru cevaplar yazıldı.`}
        </div>
      )}

      {/* Formül ipucu */}
      <div style={{ padding:"12px 16px",background:"rgba(0,0,0,0.25)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"9px" }}>
        <div style={{ fontSize:"10px",color:C,letterSpacing:"2px",fontWeight:"800",marginBottom:"6px",fontFamily:FONT }}>💡 FORMÜL</div>
        <div style={{ fontSize:"13px",color:"#94a3b8",fontFamily:MONO }}>Hedef Saat = Referans Saat + (Hedef Dilim − Referans Dilim)</div>
        <div style={{ fontSize:"12px",color:"#475569",fontFamily:FONT,marginTop:"4px" }}>Örnek: Tokyo (+9) için → 12 + (9−3) = 18:00</div>
      </div>
    </div>
  );
}

// ─── Test sekmesi ─────────────────────────────────────────────────────────
function TestTab() {
  const [qIdx,setQIdx]     = useState(0);
  const [sel,setSel]       = useState<number|null>(null);
  const [score,setScore]   = useState(0);
  const [answers,setAnswers]= useState<boolean[]>([]);
  const [done,setDone]     = useState(false);
  const q = TEST_ITEMS[qIdx];

  const handleAnswer = (i:number) => {
    if(sel!==null)return;
    setSel(i);
    const ok = i===q.correct;
    if(ok){setScore(s=>s+10);sndOK();}else sndFail();
    setAnswers(a=>[...a,ok]);
  };
  const next  = ()=>{ sndClick(); if(qIdx>=TEST_ITEMS.length-1){setDone(true);return;} setQIdx(i=>i+1); setSel(null); };
  const retry = ()=>{ setQIdx(0);setSel(null);setScore(0);setAnswers([]);setDone(false); };

  if(done){
    const pct = Math.round((score/(TEST_ITEMS.length*10))*100);
    return(
      <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"18px",padding:"40px 24px",textAlign:"center" }}>
        <div style={{ fontSize:"52px" }}>⏰</div>
        <div style={{ fontSize:"26px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT }}>Test Tamamlandı!</div>
        <div style={{ fontSize:"52px",fontWeight:"800",color:pct>=80?"#34d399":pct>=50?C:"#ef4444",fontFamily:MONO }}>{score} PUAN</div>
        <div style={{ fontSize:"14px",color:"#475569",fontFamily:FONT }}>{answers.filter(Boolean).length}/{TEST_ITEMS.length} doğru · %{pct}</div>
        <div style={{ fontSize:"14px",color:"#64748b",maxWidth:"420px",lineHeight:"1.8",fontFamily:FONT }}>
          {pct>=80?"🏆 Mükemmel! Saat dilimlerini ve yerel saati çok iyi öğrendin.":pct>=50?"👍 İyi! Öğren sekmesini tekrar inceleyebilirsin.":"📚 Tekrar dene!"}
        </div>
        <button onClick={retry} style={{ padding:"13px 30px",background:`linear-gradient(90deg,#b45309,${C})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT }}>🔄 Tekrar Dene</button>
      </div>
    );
  }

  return(
    <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
      {/* Sol liste */}
      <div style={{ width:"220px",flexShrink:0,borderRight:"1px solid rgba(245,158,11,0.1)",background:PANEL,padding:"20px 14px",display:"flex",flexDirection:"column",gap:"6px",overflowY:"auto" }}>
        <div style={{ fontSize:"11px",letterSpacing:"2px",color:"#475569",fontWeight:"800",fontFamily:FONT,marginBottom:"4px" }}>SORULAR</div>
        {TEST_ITEMS.map((_,i)=>{
          const d=i<answers.length, cur=i===qIdx;
          return(
            <div key={i} style={{ display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",background:cur?`${C}10`:"rgba(0,0,0,0.15)",border:`1.5px solid ${cur?C:d?(answers[i]?"rgba(52,211,153,0.3)":"rgba(239,68,68,0.3)"):"rgba(255,255,255,0.04)"}`,borderRadius:"7px" }}>
              <div style={{ width:"20px",height:"20px",borderRadius:"50%",background:d?(answers[i]?"#34d399":"#ef4444"):cur?C:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"800",color:"#fff",flexShrink:0,fontFamily:MONO }}>
                {d?(answers[i]?"✓":"✗"):i+1}
              </div>
              <span style={{ fontSize:"12px",fontWeight:"700",color:cur?C:d?(answers[i]?"#34d399":"#ef4444"):"#334155",fontFamily:FONT }}>Soru {i+1}</span>
            </div>
          );
        })}
        <div style={{ marginTop:"auto",padding:"12px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"9px",textAlign:"center" }}>
          <div style={{ fontSize:"11px",color:"#475569",fontWeight:"700",fontFamily:FONT,marginBottom:"4px" }}>PUAN</div>
          <div style={{ fontSize:"30px",fontWeight:"800",color:C,fontFamily:MONO }}>{score}</div>
          <div style={{ fontSize:"11px",color:"#334155",fontFamily:FONT }}>/ {TEST_ITEMS.length*10}</div>
        </div>
      </div>
      {/* Soru */}
      <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"28px 36px",overflowY:"auto",gap:"18px" }}>
        <div style={{ width:"100%",maxWidth:"640px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:"8px" }}>
            <span style={{ fontSize:"12px",color:"#475569",fontWeight:"700",fontFamily:FONT }}>SORU {qIdx+1}/{TEST_ITEMS.length}</span>
            <span style={{ fontSize:"12px",color:C,fontFamily:FONT }}>{Math.round((qIdx/TEST_ITEMS.length)*100)}%</span>
          </div>
          <div style={{ height:"4px",background:`${C}18`,borderRadius:"2px",overflow:"hidden" }}>
            <div style={{ height:"100%",width:`${(qIdx/TEST_ITEMS.length)*100}%`,background:`linear-gradient(90deg,#b45309,${C})`,borderRadius:"2px",transition:"width 0.4s" }}/>
          </div>
        </div>
        <div style={{ maxWidth:"640px",width:"100%",padding:"22px 24px",background:`${C}08`,border:`1.5px solid ${C}20`,borderRadius:"14px" }}>
          <p style={{ fontSize:"15px",color:"#e2e8f0",lineHeight:"1.9",margin:0,fontWeight:"600",fontFamily:FONT }}>{q.q}</p>
        </div>
        <div style={{ maxWidth:"640px",width:"100%",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"9px" }}>
          {q.opts.map((opt,i)=>{
            const isSel=sel===i,isCorr=i===q.correct,show=sel!==null;
            let bg="rgba(0,0,0,0.25)",border="rgba(255,255,255,0.07)",color="#64748b";
            if(show){if(isCorr){bg="#34d39912";border="#34d399";color="#34d399";}else if(isSel){bg="rgba(239,68,68,0.1)";border="#ef4444";color="#ef4444";}}
            return(
              <button key={i} onClick={()=>handleAnswer(i)} disabled={sel!==null}
                style={{ padding:"13px 15px",background:bg,border:`2px solid ${border}`,borderRadius:"10px",cursor:sel!==null?"default":"pointer",fontFamily:FONT,textAlign:"left",transition:"all 0.18s" }}>
                <div style={{ display:"flex",alignItems:"flex-start",gap:"9px" }}>
                  <span style={{ width:"22px",height:"22px",borderRadius:"50%",background:show&&isCorr?"#34d399":show&&isSel?"#ef4444":`${C}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"800",color:show?"#fff":"#94a3b8",flexShrink:0,marginTop:"1px",fontFamily:MONO }}>
                    {show&&isCorr?"✓":show&&isSel&&!isCorr?"✗":String.fromCharCode(65+i)}
                  </span>
                  <span style={{ fontSize:"13px",color,fontWeight:"600",lineHeight:"1.6",fontFamily:FONT }}>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>
        {sel!==null&&(
          <div style={{ maxWidth:"640px",width:"100%",padding:"15px 18px",background:sel===q.correct?"rgba(52,211,153,0.07)":"rgba(239,68,68,0.07)",border:`1.5px solid ${sel===q.correct?"rgba(52,211,153,0.25)":"rgba(239,68,68,0.25)"}`,borderRadius:"12px" }}>
            <div style={{ fontSize:"14px",fontWeight:"800",color:sel===q.correct?"#34d399":"#ef4444",marginBottom:"8px",fontFamily:FONT }}>{sel===q.correct?"✅ DOĞRU!":"❌ YANLIŞ!"}</div>
            <p style={{ fontSize:"13px",color:"#64748b",lineHeight:"1.85",margin:0,fontFamily:FONT }}>{q.exp}</p>
          </div>
        )}
        {sel!==null&&(
          <button onClick={next}
            style={{ padding:"12px 34px",background:`linear-gradient(90deg,#b45309,${C})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";}}>
            {qIdx>=TEST_ITEMS.length-1?"🏁 Sonuçları Gör":"⏭ Sonraki Soru"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Ana bileşen ──────────────────────────────────────────────────────────
export default function YerelSaatActivity({ onClose }: { onClose: () => void }) {
  const [tab,      setTab]      = useState<Tab>("learn");
  const [learnSec, setLearnSec] = useState<LearnSec>("yerel");

  const TABS = [
    { id:"learn" as Tab, icon:"📖", label:"ÖĞREN"    },
    { id:"act"   as Tab, icon:"🌍", label:"ETKİNLİK" },
    { id:"test"  as Tab, icon:"✏️", label:"TEST"      },
  ];

  const SECTIONS = [
    { id:"yerel"       as LearnSec, icon:"☀️", label:"Yerel Saat",          color:C,   sub:"Güneş & öğle vakti" },
    { id:"ulusal"      as LearnSec, icon:"🗺️", label:"Ulusal Saat",          color:C2,  sub:"Ortak saat uygulaması" },
    { id:"uluslararasi"as LearnSec, icon:"🌐", label:"Uluslararası Dilimler", color:"#34d399", sub:"24 saat dilimi" },
    { id:"tarih"       as LearnSec, icon:"📅", label:"Tarih Değiştirme",     color:C3,  sub:"180° meridyeni" },
  ];

  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,background:BG,display:"flex",flexDirection:"column",fontFamily:FONT,userSelect:"none",WebkitUserSelect:"none" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{opacity:1}
      `}</style>

      {/* Üst bar */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",height:"64px",borderBottom:"1px solid rgba(245,158,11,0.15)",background:"rgba(3,6,15,0.92)",flexShrink:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:"24px" }}>
          <div>
            <div style={{ fontSize:"10px",letterSpacing:"4px",color:C,opacity:0.6,fontFamily:MONO }}>MEKÂNSAL BİLGİ TEKNOLOJİLERİ</div>
            <div style={{ fontSize:"19px",fontWeight:"800",color:"#e2e8f0",letterSpacing:"0.3px" }}>Yerel Saat & Saat Dilimleri</div>
          </div>
          <div style={{ display:"flex",gap:"3px",background:"rgba(0,0,0,0.4)",padding:"4px",borderRadius:"10px" }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>{sndClick();setTab(t.id);}}
                style={{ padding:"7px 18px",borderRadius:"7px",border:"none",cursor:"pointer",fontFamily:FONT,fontSize:"12px",fontWeight:"700",transition:"all 0.18s",background:tab===t.id?C:"transparent",color:tab===t.id?"#1c0a00":"#334155" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose}
          style={{ padding:"8px 18px",background:"transparent",border:"1px solid rgba(255,80,80,0.3)",borderRadius:"8px",color:"#f87171",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:FONT }}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,80,80,0.1)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          ✕ KAPAT
        </button>
      </div>

      {/* İçerik */}
      <div style={{ flex:1,overflow:"hidden",display:"flex",minHeight:0 }}>

        {/* ── ÖĞREN ── */}
        {tab==="learn" && (
          <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
            {/* Sol panel */}
            <div style={{ width:"256px",flexShrink:0,borderRight:"1px solid rgba(245,158,11,0.1)",background:PANEL,overflowY:"auto",padding:"20px 14px" }}>
              <div style={{ fontSize:"11px",letterSpacing:"2px",color:"#475569",fontWeight:"800",fontFamily:FONT,marginBottom:"12px" }}>KONULAR</div>
              <div style={{ display:"flex",flexDirection:"column",gap:"8px" }}>
                {SECTIONS.map(s=>(
                  <button key={s.id} onClick={()=>{sndClick();setLearnSec(s.id);}}
                    style={{ padding:"12px 14px",background:learnSec===s.id?`${s.color}14`:"rgba(0,0,0,0.2)",border:`2px solid ${learnSec===s.id?s.color:"rgba(255,255,255,0.04)"}`,borderRadius:"10px",cursor:"pointer",textAlign:"left",fontFamily:FONT,transition:"all 0.18s" }}>
                    <div style={{ fontSize:"20px",marginBottom:"4px" }}>{s.icon}</div>
                    <div style={{ fontSize:"13px",fontWeight:"800",color:learnSec===s.id?s.color:"#334155" }}>{s.label}</div>
                    <div style={{ fontSize:"11px",color:learnSec===s.id?`${s.color}80`:"#1e293b",marginTop:"2px" }}>{s.sub}</div>
                  </button>
                ))}
              </div>

              <div style={{ height:"1px",background:"rgba(245,158,11,0.1)",margin:"20px 0" }} />
              <div style={{ fontSize:"11px",letterSpacing:"2px",color:"#475569",fontWeight:"800",fontFamily:FONT,marginBottom:"10px" }}>HIZLI ÖZET</div>
              <div style={{ display:"flex",flexDirection:"column",gap:"6px" }}>
                {[
                  ["Yerel saat","Öğle = Güneş en yüksekte",C],
                  ["Türkiye","45°D meridyeni → +3",C],
                  ["Ulusl. dilim","24 dilim × 15° = 360°",C2],
                  ["Tarih çizgisi","180° meridyeni",C3],
                  ["Doğuya →","Her 15° = +1 saat",C],
                ].map(([k,v,c])=>(
                  <div key={k} style={{ padding:"8px 10px",background:"rgba(0,0,0,0.2)",borderRadius:"7px",borderLeft:`3px solid ${c}` }}>
                    <div style={{ fontSize:"11px",color:String(c),fontWeight:"800",fontFamily:FONT }}>{k}</div>
                    <div style={{ fontSize:"11px",color:"#334155",fontFamily:FONT,marginTop:"2px" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sağ içerik */}
            <div style={{ flex:1,overflowY:"auto",padding:"28px 32px",display:"flex",flexDirection:"column",gap:"20px",background:`radial-gradient(ellipse at 10% 10%,${C}06 0%,${BG} 60%)` }}>

              {/* ── Yerel Saat ── */}
              {learnSec==="yerel" && (
                <div style={{ animation:"fadeUp 0.25s ease",display:"flex",flexDirection:"column",gap:"18px" }}>
                  <div>
                    <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px" }}>
                      <span style={{ fontSize:"30px" }}>☀️</span>
                      <div>
                        <div style={{ fontSize:"22px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT }}>Yerel Saat</div>
                        <div style={{ fontSize:"13px",color:C,fontWeight:"600",fontFamily:FONT }}>Güneş'e dayalı zaman ölçümü</div>
                      </div>
                    </div>
                    <div style={{ height:"2px",background:`linear-gradient(90deg,${C},transparent)`,opacity:0.35,borderRadius:"2px" }} />
                  </div>
                  <div style={{ padding:"18px 22px",background:`${C}0a`,border:`1.5px solid ${C}22`,borderRadius:"14px" }}>
                    <p style={{ fontSize:"14px",color:"#94a3b8",lineHeight:"1.95",margin:0,fontFamily:FONT }}>
                      Dünya'nın kendi ekseni etrafındaki hareketi sebebiyle Güneş'in ufuk düzlemindeki konumu yere ve zamana göre değişir. Güneş'in ufuk düzlemi üzerinde <strong style={{ color:C }}>en yüksek noktaya ulaştığı zaman dilimi</strong> öğle vakti (12.00) olarak belirlenir. Öğle vaktine göre ayarlanan saate <strong style={{ color:"#e2e8f0" }}>yerel saat</strong> adı verilir.
                    </p>
                  </div>

                  {/* Güneş animasyonu SVG */}
                  <div style={{ padding:"16px 18px",background:"rgba(0,0,0,0.28)",border:"1px solid rgba(245,158,11,0.12)",borderRadius:"12px" }}>
                    <div style={{ fontSize:"11px",color:C,letterSpacing:"2px",fontWeight:"800",marginBottom:"12px",fontFamily:FONT }}>GÜNEŞ'İN GÜNLÜK HAREKETI</div>
                    <svg viewBox="0 0 540 120" width="100%" style={{ maxWidth:"540px",display:"block",margin:"0 auto" }}>
                      {/* Ufuk */}
                      <line x1="20" y1="85" x2="520" y2="85" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5"/>
                      <text x="25" y="99" fontSize="10" fill="#475569" fontFamily={FONT}>Doğu (Gündoğumu)</text>
                      <text x="390" y="99" fontSize="10" fill="#475569" fontFamily={FONT}>Batı (Günbatımı)</text>
                      {/* Yay */}
                      <path d="M 60,85 Q 270,15 480,85" fill="none" stroke={`${C}60`} strokeWidth="2" strokeDasharray="6,4"/>
                      {/* Sabah güneşi */}
                      <circle cx="100" cy="70" r="12" fill={`${C}40`} stroke={C} strokeWidth="1.5"/>
                      <text x="100" y="73" textAnchor="middle" fontSize="10" fill={C} fontFamily={FONT}>🌅</text>
                      <text x="100" y="112" textAnchor="middle" fontSize="9" fill="#475569" fontFamily={FONT}>06.00</text>
                      {/* Öğle güneşi */}
                      <circle cx="270" cy="22" r="16" fill={`${C}50`} stroke={C} strokeWidth="2"/>
                      <text x="270" y="26" textAnchor="middle" fontSize="13" fill={C} fontFamily={FONT}>☀️</text>
                      <text x="270" y="112" textAnchor="middle" fontSize="9" fill={C} fontWeight="800" fontFamily={FONT}>12.00</text>
                      <line x1="270" y1="40" x2="270" y2="85" stroke={`${C}50`} strokeWidth="1" strokeDasharray="3,2"/>
                      <text x="270" y="50" textAnchor="middle" fontSize="8" fill={C} fontFamily={FONT}>En yüksek</text>
                      <text x="270" y="60" textAnchor="middle" fontSize="8" fill={C} fontFamily={FONT}>= Öğle (Yerel Saat)</text>
                      {/* Akşam güneşi */}
                      <circle cx="440" cy="70" r="12" fill={`${C}40`} stroke={C} strokeWidth="1.5"/>
                      <text x="440" y="73" textAnchor="middle" fontSize="10" fill={C} fontFamily={FONT}>🌇</text>
                      <text x="440" y="112" textAnchor="middle" fontSize="9" fill="#475569" fontFamily={FONT}>18.00</text>
                    </svg>
                  </div>

                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px" }}>
                    {[
                      { icon:"🕌", color:"#a78bfa", title:"Dini Vakitler", desc:"Namaz, iftar ve sahur vakitlerinin belirlenmesinde yerel saat kullanılır." },
                      { icon:"🌍", color:C2, title:"Meridyen Farkı", desc:"Her meridyende Güneş farklı zamanda en yüksek noktaya ulaşır; bu yüzden yerel saatler farklıdır." },
                      { icon:"🏛️", color:C, title:"Tarihsel Kullanım", desc:"İnsanlar tarihin her döneminde günlük hayatını Güneş'in konumuna göre düzenlemiştir." },
                      { icon:"📐", color:"#34d399", title:"15° = 1 Saat", desc:"Dünya 360° / 24 saat = saatte 15° döner. Bu nedenle 15° meridyen farkı 1 saatlik yerel saat farkı oluşturur." },
                    ].map(item=>(
                      <div key={item.title} style={{ padding:"13px 15px",background:`${item.color}08`,border:`1px solid ${item.color}20`,borderRadius:"10px",display:"flex",gap:"10px",alignItems:"flex-start" }}>
                        <span style={{ fontSize:"20px",flexShrink:0 }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize:"12px",fontWeight:"800",color:item.color,fontFamily:FONT,marginBottom:"4px" }}>{item.title}</div>
                          <p style={{ fontSize:"12px",color:"#475569",lineHeight:"1.75",margin:0,fontFamily:FONT }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Ulusal Saat ── */}
              {learnSec==="ulusal" && (
                <div style={{ animation:"fadeUp 0.25s ease",display:"flex",flexDirection:"column",gap:"18px" }}>
                  <div>
                    <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px" }}>
                      <span style={{ fontSize:"30px" }}>🗺️</span>
                      <div>
                        <div style={{ fontSize:"22px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT }}>Ulusal (Ortak) Saat</div>
                        <div style={{ fontSize:"13px",color:C2,fontWeight:"600",fontFamily:FONT }}>Ülke içindeki standart saat uygulaması</div>
                      </div>
                    </div>
                    <div style={{ height:"2px",background:`linear-gradient(90deg,${C2},transparent)`,opacity:0.35,borderRadius:"2px" }} />
                  </div>
                  <div style={{ padding:"18px 22px",background:`${C2}0a`,border:`1.5px solid ${C2}22`,borderRadius:"14px" }}>
                    <p style={{ fontSize:"14px",color:"#94a3b8",lineHeight:"1.95",margin:0,fontFamily:FONT }}>
                      Bir ülke içindeki yerel saat farkları; <strong style={{ color:C2 }}>resmî işlemler ile ulaşım, bankacılık, iletişim</strong> gibi hizmetlerin yürütülmesinde karışıklığa neden olabilir. Bu sorunu çözmek için ülke sınırları içindeki bir veya birden fazla meridyenin yerel saati <strong style={{ color:"#e2e8f0" }}>ulusal (ortak) saat</strong> olarak kullanılır.
                    </p>
                  </div>
                  {/* Türkiye kutusu */}
                  <div style={{ padding:"16px 20px",background:`${C}0d`,border:`2px solid ${C}30`,borderRadius:"12px" }}>
                    <div style={{ fontSize:"12px",color:C,letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT }}>🇹🇷 TÜRKİYE'NİN ULUSAL SAATİ</div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px" }}>
                      <div style={{ padding:"12px",background:"rgba(0,0,0,0.25)",borderRadius:"9px",textAlign:"center" }}>
                        <div style={{ fontSize:"11px",color:"#92400e",fontFamily:FONT,marginBottom:"4px" }}>ESAS ALINAN MERİDYEN</div>
                        <div style={{ fontSize:"24px",fontWeight:"800",color:C,fontFamily:MONO }}>45° D</div>
                      </div>
                      <div style={{ padding:"12px",background:"rgba(0,0,0,0.25)",borderRadius:"9px",textAlign:"center" }}>
                        <div style={{ fontSize:"11px",color:"#92400e",fontFamily:FONT,marginBottom:"4px" }}>SAAT DİLİMİ</div>
                        <div style={{ fontSize:"24px",fontWeight:"800",color:C,fontFamily:MONO }}>UTC+3</div>
                      </div>
                    </div>
                  </div>
                  {/* Birden fazla saat kullanan ülkeler */}
                  <div>
                    <div style={{ fontSize:"12px",color:C2,letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT }}>BİRDEN FAZLA ULUSAL SAAT KULLANAN ÜLKELER</div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"8px" }}>
                      {[["🇨🇦","Kanada","6 saat dilimi"],["🇺🇸","ABD","6 saat dilimi (kıta)"],["🇷🇺","Rusya Federasyonu","11 saat dilimi"],["🇦🇺","Avustralya","3 saat dilimi"]].map(([flag,ulke,dilim])=>(
                        <div key={ulke} style={{ padding:"11px 14px",background:`${C2}08`,border:`1px solid ${C2}18`,borderRadius:"9px",display:"flex",gap:"10px",alignItems:"center" }}>
                          <span style={{ fontSize:"24px" }}>{flag}</span>
                          <div>
                            <div style={{ fontSize:"12px",fontWeight:"800",color:C2,fontFamily:FONT }}>{ulke}</div>
                            <div style={{ fontSize:"11px",color:"#334155",fontFamily:FONT }}>{dilim}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop:"10px",padding:"11px 14px",background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:"9px",fontSize:"12px",color:"#475569",lineHeight:"1.7",fontFamily:FONT }}>
                      Bu ülkeler doğu-batı doğrultusunda çok geniş yer kapladığından ve üzerinden çok sayıda meridyen geçtiğinden birden fazla ortak saat kullanmaktadır.
                    </div>
                  </div>
                </div>
              )}

              {/* ── Uluslararası Saat Dilimleri ── */}
              {learnSec==="uluslararasi" && (
                <div style={{ animation:"fadeUp 0.25s ease",display:"flex",flexDirection:"column",gap:"18px" }}>
                  <div>
                    <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px" }}>
                      <span style={{ fontSize:"30px" }}>🌐</span>
                      <div>
                        <div style={{ fontSize:"22px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT }}>Uluslararası Saat Dilimleri</div>
                        <div style={{ fontSize:"13px",color:"#34d399",fontWeight:"600",fontFamily:FONT }}>24 dilim · 15°'lik aralıklar</div>
                      </div>
                    </div>
                    <div style={{ height:"2px",background:`linear-gradient(90deg,#34d399,transparent)`,opacity:0.35,borderRadius:"2px" }} />
                  </div>
                  <div style={{ padding:"18px 22px",background:"rgba(52,211,153,0.07)",border:"1.5px solid rgba(52,211,153,0.18)",borderRadius:"14px" }}>
                    <p style={{ fontSize:"14px",color:"#94a3b8",lineHeight:"1.95",margin:0,fontFamily:FONT }}>
                      Yerel saat farklılıklarının getirdiği karmaşayı ortadan kaldırmak amacıyla dünya genelinde geçerliliği olan bir saat düzenlemesine gidilmiş ve <strong style={{ color:"#34d399" }}>uluslararası saat dilimleri</strong> ortaya çıkmıştır. Dünya, <strong style={{ color:"#e2e8f0" }}>15'er derecelik aralıklarla 24 saat dilimine</strong> ayrılmıştır.
                    </p>
                  </div>

                  {/* Hesap kutusu */}
                  <div style={{ padding:"16px 20px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(52,211,153,0.18)",borderRadius:"12px" }}>
                    <div style={{ fontSize:"11px",color:"#34d399",letterSpacing:"2px",fontWeight:"800",marginBottom:"12px",fontFamily:FONT }}>📐 MATEMATİKSEL HESAP</div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",textAlign:"center" }}>
                      {[["360°","Dünyanın tam dönüşü"],["÷ 24","Saat sayısı"],["= 15°","Her dilim genişliği"]].map(([val,desc])=>(
                        <div key={val} style={{ padding:"12px 8px",background:"rgba(52,211,153,0.07)",border:"1px solid rgba(52,211,153,0.15)",borderRadius:"8px" }}>
                          <div style={{ fontSize:"22px",fontWeight:"800",color:"#34d399",fontFamily:MONO }}>{val}</div>
                          <div style={{ fontSize:"10px",color:"#475569",fontFamily:FONT,marginTop:"4px" }}>{desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Numaralandırma */}
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px" }}>
                    <div style={{ padding:"14px 16px",background:"rgba(52,211,153,0.07)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:"10px" }}>
                      <div style={{ fontSize:"11px",color:"#34d399",fontWeight:"800",letterSpacing:"2px",marginBottom:"8px",fontFamily:FONT }}>DOĞU (+)</div>
                      <div style={{ fontSize:"13px",color:"#94a3b8",lineHeight:"1.85",fontFamily:FONT }}>Doğu yarım küredeki saat dilimleri <strong style={{ color:"#34d399" }}>+1, +2, +3 …</strong> şeklinde numaralandırılır. 0° meridyeninden doğuya her 15°'de saat 1 artar.</div>
                    </div>
                    <div style={{ padding:"14px 16px",background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:"10px" }}>
                      <div style={{ fontSize:"11px",color:"#ef4444",fontWeight:"800",letterSpacing:"2px",marginBottom:"8px",fontFamily:FONT }}>BATI (−)</div>
                      <div style={{ fontSize:"13px",color:"#94a3b8",lineHeight:"1.85",fontFamily:FONT }}>Batı yarım küredeki saat dilimleri <strong style={{ color:"#ef4444" }}>−1, −2, −3 …</strong> şeklinde numaralandırılır. 0° meridyeninden batıya her 15°'de saat 1 azalır.</div>
                    </div>
                  </div>

                  <div style={{ padding:"13px 16px",background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:"10px",fontSize:"13px",color:"#94a3b8",lineHeight:"1.8",fontFamily:FONT }}>
                    <strong style={{ color:C }}>Önemli not:</strong> Uluslararası saat dilimlerinin sınırları, ülkelerin siyasi sınırları esas alınarak zikzak oluşturacak şekilde çizilmiştir.
                  </div>
                </div>
              )}

              {/* ── Tarih Değiştirme Çizgisi ── */}
              {learnSec==="tarih" && (
                <div style={{ animation:"fadeUp 0.25s ease",display:"flex",flexDirection:"column",gap:"18px" }}>
                  <div>
                    <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px" }}>
                      <span style={{ fontSize:"30px" }}>📅</span>
                      <div>
                        <div style={{ fontSize:"22px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT }}>Tarih Değiştirme Çizgisi</div>
                        <div style={{ fontSize:"13px",color:C3,fontWeight:"600",fontFamily:FONT }}>180° meridyeni — Gün değişim sınırı</div>
                      </div>
                    </div>
                    <div style={{ height:"2px",background:`linear-gradient(90deg,${C3},transparent)`,opacity:0.35,borderRadius:"2px" }} />
                  </div>
                  <div style={{ padding:"18px 22px",background:`${C3}0a`,border:`1.5px solid ${C3}22`,borderRadius:"14px" }}>
                    <p style={{ fontSize:"14px",color:"#94a3b8",lineHeight:"1.95",margin:0,fontFamily:FONT }}>
                      Başlangıç meridyeninin (0°) tam karşısında yer alan <strong style={{ color:C3 }}>180° meridyeni</strong>, tarih değiştirme çizgisi olarak adlandırılır. Aynı zamanda doğu yarım küre ile batı yarım küreyi birbirinden ayıran sınırdır.
                    </p>
                  </div>

                  {/* Diyagram */}
                  <div style={{ padding:"16px 18px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(167,139,250,0.15)",borderRadius:"12px" }}>
                    <div style={{ fontSize:"11px",color:C3,letterSpacing:"2px",fontWeight:"800",marginBottom:"12px",fontFamily:FONT }}>TANH DEĞİŞTİRME ÇİZGİSİ DİYAGRAMI</div>
                    <svg viewBox="0 0 540 130" width="100%" style={{ maxWidth:"540px",display:"block",margin:"0 auto" }}>
                      {/* Zemin */}
                      <rect x="0" y="20" width="265" height="90" fill="rgba(56,189,248,0.06)" rx="6"/>
                      <rect x="275" y="20" width="265" height="90" fill="rgba(167,139,250,0.06)" rx="6"/>
                      {/* Başlangıç çizgisi */}
                      <line x1="270" y1="5" x2="270" y2="125" stroke={C3} strokeWidth="2.5"/>
                      <text x="270" y="14" textAnchor="middle" fontSize="9" fill={C3} fontFamily={MONO} fontWeight="800">180°</text>
                      <text x="270" y="120" textAnchor="middle" fontSize="9" fill={C3} fontFamily={MONO}>Tarih Değ. Çizgisi</text>
                      {/* Sol taraf */}
                      <text x="135" y="40" textAnchor="middle" fontSize="11" fill="#38bdf8" fontFamily={FONT} fontWeight="800">DOĞU YARIM KÜRE</text>
                      <text x="135" y="58" textAnchor="middle" fontSize="24" fontFamily={FONT}>📅</text>
                      <text x="135" y="80" textAnchor="middle" fontSize="11" fill="#38bdf8" fontFamily={FONT} fontWeight="800">Tarih 1 İLERİ</text>
                      <text x="135" y="96" textAnchor="middle" fontSize="9" fill="#475569" fontFamily={FONT}>(Daha ileri tarih)</text>
                      {/* Sağ taraf */}
                      <text x="405" y="40" textAnchor="middle" fontSize="11" fill={C3} fontFamily={FONT} fontWeight="800">BATI YARIM KÜRE</text>
                      <text x="405" y="58" textAnchor="middle" fontSize="24" fontFamily={FONT}>📆</text>
                      <text x="405" y="80" textAnchor="middle" fontSize="11" fill={C3} fontFamily={FONT} fontWeight="800">Tarih 1 GERİ</text>
                      <text x="405" y="96" textAnchor="middle" fontSize="9" fill="#475569" fontFamily={FONT}>(Bir önceki gün)</text>
                      {/* Oklar */}
                      <path d="M 230,65 L 210,65 L 210,80 L 230,80" fill="none" stroke="#38bdf8" strokeWidth="1.5"/>
                      <path d="M 310,65 L 330,65 L 330,80 L 310,80" fill="none" stroke={C3} strokeWidth="1.5"/>
                    </svg>
                  </div>

                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px" }}>
                    {[
                      { icon:"⬅️", color:C2, title:"Doğudan Batıya Geçince", desc:"Tarih 1 gün ileri alınır. (Doğu yarım küre → Batı yarım küre)" },
                      { icon:"➡️", color:C3, title:"Batıdan Doğuya Geçince", desc:"Tarih 1 gün geri alınır. (Batı yarım küre → Doğu yarım küre)" },
                      { icon:"〰️", color:"#64748b", title:"Zikzak Çizim", desc:"Ada ve ülkelerde zaman karışıklığını önlemek için siyasi sınırlar dikkate alınarak zikzak şeklinde çizilmiştir." },
                      { icon:"🌏", color:"#f59e0b", title:"Büyük Okyanus'ta", desc:"Tarih değiştirme çizgisi büyük ölçüde Büyük Okyanus üzerinden geçer; karaları mümkün olduğunca bölmez." },
                    ].map(item=>(
                      <div key={item.title} style={{ padding:"12px 14px",background:`${item.color}08`,border:`1px solid ${item.color}20`,borderRadius:"9px",display:"flex",gap:"9px",alignItems:"flex-start" }}>
                        <span style={{ fontSize:"18px",flexShrink:0 }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize:"12px",fontWeight:"800",color:item.color,fontFamily:FONT,marginBottom:"3px" }}>{item.title}</div>
                          <p style={{ fontSize:"12px",color:"#475569",lineHeight:"1.7",margin:0,fontFamily:FONT }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ── ETKİNLİK ── */}
        {tab==="act" && (
          <div style={{ flex:1,overflowY:"auto",padding:"24px 28px",display:"flex",flexDirection:"column",gap:"16px",background:`radial-gradient(ellipse at 5% 5%,${C}05 0%,${BG} 60%)` }}>
            <SaatDilimiAktivite />
          </div>
        )}

        {/* ── TEST ── */}
        {tab==="test" && (
          <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
            <TestTab />
          </div>
        )}

      </div>
    </div>
  );
}