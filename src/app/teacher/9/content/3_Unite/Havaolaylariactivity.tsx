"use client";
import { useState, useRef, useEffect } from "react";

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
const sndDrop  = () => beep(520,0.12,"sine",0.10);

const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const MONO = "'Courier New',Courier,monospace";
const BG   = "#060f1c";
const C    = "#0ea5e9";   // sky blue — hava/atmosfer
const C2   = "#f97316";   // turuncu — ısı/sıcaklık
const C3   = "#a78bfa";   // violet — basınç
const C4   = "#34d399";   // yeşil — nem/yağış
const C5   = "#ef4444";   // kırmızı — aşırı hava
type Tab = "learn"|"act"|"test";
type LearnSec = "atmosfer"|"sicaklik"|"basinc"|"ruzgar"|"nem"|"asiri"|"halk";

interface AsiriOlay { id:string; ad:string; icon:string; color:string; tanim:string; etkiler:string[]; }
const ASIRI_OLAYLAR: AsiriOlay[] = [
  { id:"sicak",  ad:"Sicak Hava Dalgasi",  icon:"🌡️", color:"#dc2626",
    tanim:"Mevsim normallerinin ortalama maksimum sicakliklardan 3-5 derece fazla olmasi ve art arda 5+ gun devam etmesidir (WMO).",
    etkiler:["Insan sagligi riski","Tarim urunlerine zarar","Su kaynaklarinin azalmasi","Enerji tuketimi artisi"] },
  { id:"soguk",  ad:"Soguk Hava Dalgasi",  icon:"🧊", color:"#0369a1",
    tanim:"Belirli bir bolgeyi etkileyen ani ve onemli sicaklik dususudur. Normal mevsim kosullarinin cok altinda sicakliklar getirir.",
    etkiler:["Bitki ve hayvanlar zarar gorur","Enerji tuketimi artar","Ulasim aksar","Insan sagligi tehlikeye girer"] },
  { id:"firtina", ad:"Firtina",             icon:"⛈️", color:"#7c3aed",
    tanim:"Kisa sureli, yogun ve tehlikeli hava kosullaridir. Ruzgar hizlari saatte 62-117 km arasinda degisir.",
    etkiler:["Asiri yagis ve dolu","Yildirim dusmesi","Elektrik hatlarina hasar","Ulasimin aksamasi"] },
  { id:"yagis",  ad:"Siddetli Yagis",       icon:"🌧️", color:"#0c4a6e",
    tanim:"24 saat icinde 50 mm yi asan yagis miktari cogu bolgede siddetli yagis olarak kabul edilir (WMO).",
    etkiler:["Sel ve taskin","Su baskinlari","Ulasimin aksamasi","Altyapi hasari"] },
  { id:"kuraklik",ad:"Kuraklik",            icon:"☀️", color:"#b45309",
    tanim:"Yagislarin belirli bir bolgede uzun sure boyunca normalin cok altinda kalmasidir. Yavas gelisen ama genis etkili bir olaydir.",
    etkiler:["Su kaynaklarinin azalmasi","Tarimsal uretim dususu","Gida guvenligi tehdidi","Sosyoekonomik sonuclar"] },
  { id:"dolu",   ad:"Dolu",                icon:"🧊❄️", color:"#0891b2",
    tanim:"Firtinali havalarda olusan, dusey akimli bulutlarda buz parcaciklarinin birlesmesiyle olusan kati yagis turudur.",
    etkiler:["Tarim urunlerine zarar","Arac ve bina hasari","Ani akinti tehlikesi","Can kayiplari"] },
];

const RUZGAR_YONLER = ["Kuzey","KD","Dogu","GD","Guney","GB","Bati","KB"];
const RUZGAR_FREQ_ANKARA = [90,40,60,20,10,10,50,40];
const YONLER_EN = ["N","NE","E","SE","S","SW","W","NW"];

const TEST_ITEMS = [
  {q:"Hava olayi ile iklim arasindaki temel fark nedir?",opts:["Hava olayi uzun sureli, iklim kisa surelidir","Hava olayi belirli yer ve zamandaki anlik kosullar, iklim uzun sureli ortalamadir","Iklim meteoroloji, hava olayi klimatoloji tarafindan incelenir","Hava olayi yalnizca yagisi kapsar"],correct:1,exp:"Hava olayi; belirli yer ve zamanda gerceklesen sicaklik, ruzgar, nem, sis, yagis gibi anlik hava kosullaridir. Iklim ise bir bolgedeki hava olaylarinin uzun sureli ortalamalarinin genel durumudur."},
  {q:"Atmosferin bilesimine gore en yuksek orana sahip gaz hangisidir?",opts:["Oksijen (%21)","Azot (%78)","Karbondioksit","Argon"],correct:1,exp:"Atmosferin yaklasik %78 i azottan, %21 i oksijenden, %1 i ise argon ve diger gazlardan (su buhari, karbondioksit, metan vb.) olusur."},
  {q:"Hava sicakligi hangi olcum aleti ile olculur?",opts:["Barometre","Anemometre","Termometre","Higrometre"],correct:2,exp:"Hava sicakligini olcmek icin mekanik veya dijital termometre kullanilir. Sicaklik derece celsius (C) olarak ifade edilir."},
  {q:"Alcak basinc merkezinin ozelligi hangisidir?",opts:["Yatay hava hareketi merkezden cevreye dogrudur, alçalici hava hareketi gorulur","Cevreden merkeze yatay hava akisi ve yukselici hava hareketi gorulur; genellikle bulutlu ve yagisli","Gunesli ve acik hava kosullari hakimdir","Bulut ve yagis olusumunu engeller"],correct:1,exp:"Alcak basinc merkezinde cevreden merkeze dogru yatay hava akisi ve yukselici hava hareketi vardir. Bu yukselici hareketler bulut gelisimi ve yagis olusumuna neden olur."},
  {q:"Hava basinci hangi aletle olculur ve birimi nedir?",opts:["Higrometre — %","Termometre — C","Barometre — milibar (mb) veya hektopaskal (hPa)","Anemometre — m/sn"],correct:2,exp:"Basinc, barometreyle olculur ve birimi milibar (mb) veya hektopaskal (hPa) olarak ifade edilir. Standart hava basinci 45 enleminde deniz seviyesinde 1013 mb olarak kabul edilmistir."},
  {q:"Atmosferdeki su buharina ne ad verilir ve hangi aletle olculur?",opts:["Yagis — pluviyometre","Nem — higrometre","Basinc — barometre","Sicaklik — termometre"],correct:1,exp:"Atmosferdeki su buharina nem adi verilir ve nem, higrometre (nemolcer) ile olculur. Yagis ise pluviyometre (yagisolcer) ile olculur."},
  {q:"Ruzgarin yil icinde en sik estigi yone ne ad verilir?",opts:["Ruzgar frekansi","Hakim ruzgar yonu","Ruzgar hizi","Izobar yonu"],correct:1,exp:"Ruzgarin esme sikligi, ruzgarin bir yone ait esme sayisidir. Ruzgarin yil icinde en sik estigi yone hakim ruzgar yonu denir."},
  {q:"Sicak hava dalgasinin tanimi WMO ya gore nasildir?",opts:["Mevsim normallerinden 1-2 derece yuksek sicakliklar 3 gun boyunca devam ederse","Mevsim normallerinden 3-5 derece yuksek sicakliklar art arda 5 gun veya daha fazla devam ederse","Herhangi bir gun sicakligin 40 derecenin uzerine cikmasi","Havanin neminin %80 in uzerinde olmasi"],correct:1,exp:"WMO ya gore mevsim normallerindeki sicakliklarin ortalama maksimum sicakliklardan 3-5 derece fazla olmasi ve art arda 5 gun veya daha fazla devam etmesi sicak hava dalgasi olarak tanimlanir."},
  {q:"Yogusma nedir?",opts:["Su buharinin kati hale donmesi","Su buharinin sivi hale donmesi sureci","Suyun gaz hale gecmesi","Yagisin yere dusmesi sureci"],correct:1,exp:"Su buharinin sivi hale donmesi surecine yogusma denir. Yogusma, havanin doyma noktasina erismesi ve sicakligin bu doyma noktasinin altina dusmesiyle gerceklesir."},
  {q:"Halk meteorolojisi ve halk takvimi ne icin kullanilmistir?",opts:["Bilimsel meteorolojik verileri derlemek icin","Teknolojinin yeterli olmadigi donemlerde tarim ve gunluk hayati duzenlemek icin","Meteoroloji istasyonlari kurmak icin","Asiri hava olaylarini tahmin etmek icin"],correct:1,exp:"Halk meteorolojisi, teknolojinin yeterli olmadigi donemlerde tarim ve hayvancilik faaliyetlerindeki belirsizligi ortadan kaldirarak gunluk hayati duzenleme ihtiyacindan ortaya cikmistir."},
];

// ─── Rüzgâr Gülü Bileşeni ───────────────────────────────────────────────────
function RuzgarGulu({ freq, labels }: { freq:number[]; labels:string[] }) {
  const max = Math.max(...freq);
  const cx = 120, cy = 120, r = 90;
  const angles = [-90,-45,0,45,90,135,180,225];
  return (
    <svg viewBox="0 0 240 240" width="240" height="240" style={{ display:"block",margin:"0 auto" }}>
      {/* Izgaralar */}
      {[25,50,75,100].map(p => {
        const pr = (p/100)*r;
        return <circle key={p} cx={cx} cy={cy} r={pr} fill="none" stroke="rgba(14,165,233,0.15)" strokeWidth="1"/>;
      })}
      {/* Eksen çizgileri */}
      {angles.map((a,i) => {
        const rad = a*Math.PI/180;
        return <line key={i} x1={cx} y1={cy} x2={cx+r*Math.cos(rad)} y2={cy+r*Math.sin(rad)} stroke="rgba(14,165,233,0.2)" strokeWidth="1"/>;
      })}
      {/* Frekans barları */}
      {freq.map((f,i) => {
        const rad = angles[i]*Math.PI/180;
        const frac = f/max;
        const len = frac*r;
        const x2 = cx + len*Math.cos(rad);
        const y2 = cy + len*Math.sin(rad);
        return <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} stroke={C} strokeWidth={6} strokeLinecap="round" opacity="0.85"/>;
      })}
      {/* Merkez */}
      <circle cx={cx} cy={cy} r={5} fill={C}/>
      {/* Etiketler */}
      {labels.map((l,i) => {
        const rad = angles[i]*Math.PI/180;
        const lx = cx + (r+14)*Math.cos(rad);
        const ly = cy + (r+14)*Math.sin(rad);
        return <text key={i} x={lx} y={ly+4} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily={FONT}>{l}</text>;
      })}
      {/* Frekans değerleri */}
      {freq.map((f,i) => {
        const rad = angles[i]*Math.PI/180;
        const frac = f/max;
        const len = frac*r+12;
        const lx = cx + len*Math.cos(rad);
        const ly = cy + len*Math.sin(rad);
        return <text key={i} x={lx} y={ly+3} textAnchor="middle" fontSize="8" fill={C} fontFamily={MONO}>{f}</text>; // Frekans degerleri
      })}
    </svg>
  );
}

// ─── Aktivite: Basınç Merkezi Sınıflandırma ─────────────────────────────────
interface BK { id:string; text:string; cat:"alcak"|"yuksek"; }
const BASINC_KARTLAR: BK[] = [
  {id:"b1",text:"Yatay hava akışı çevreden merkeze doğrudur",cat:"alcak"},
  {id:"b2",text:"Dikey hava hareketi yükselicidir",cat:"alcak"},
  {id:"b3",text:"Genellikle bulutlu ve yağışlı hava görülür",cat:"alcak"},
  {id:"b4",text:"Yatay hava akışı merkezden çevreye doğrudur",cat:"yuksek"},
  {id:"b5",text:"Dikey hava hareketi alçalıcıdır",cat:"yuksek"},
  {id:"b6",text:"Genellikle güneşli ve açık hava görülür",cat:"yuksek"},
  {id:"b7",text:"Bulut ve yağış oluşumunu engeller",cat:"yuksek"},
  {id:"b8",text:"Siklon olarak da adlandırılır",cat:"alcak"},
];

function BasincAktivite() {
  const [shuffled] = useState<BK[]>(()=>{
    const a=[...BASINC_KARTLAR];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  });
  const [placed,setPlaced] = useState<Record<string,string>>({});
  const [wrong,setWrong]   = useState<Record<string,boolean>>({});
  const [dragId,setDragId] = useState<string|null>(null);
  const [hovBucket,setHov] = useState<string|null>(null);
  const [score,setScore]   = useState(0);
  const [done,setDone]     = useState(false);

  const BUCKETS = [
    {id:"alcak",  label:"Alcak Basinc Merkezi (Siklon)", color:C3, icon:"⬆️", sub:"A semboluyle gosterilir"},
    {id:"yuksek", label:"Yuksek Basinc Merkezi (Antisiklon)", color:C2, icon:"⬇️", sub:"Y semboluyle gosterilir"},
  ];
  const doDrop = (bid:string) => {
    if(!dragId)return;
    const item=shuffled.find(m=>m.id===dragId);
    if(!item||placed[dragId])return;
    const ok=item.cat===bid;
    sndDrop();if(ok){sndOK();setScore(s=>s+1);}else sndFail();
    const np={...placed,[dragId]:bid};
    const nw={...wrong,[dragId]:!ok};
    setPlaced(np);setWrong(nw);setDragId(null);setHov(null);
    if(Object.keys(np).length===shuffled.length)setTimeout(()=>setDone(true),400);
  };
  const retry=()=>{setPlaced({});setWrong({});setScore(0);setDone(false);setDragId(null);};
  if(done)return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px",padding:"48px 24px",textAlign:"center"}}>
      <div style={{fontSize:"52px"}}>🌀</div> {/* Sınıflandırma Tamamlandı! */}
      <div style={{fontSize:"26px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Siniflandirma Tamamlandi!</div>
      <div style={{fontSize:"50px",fontWeight:"800",color:C,fontFamily:MONO}}>{score}/{shuffled.length}</div>
      <div style={{fontSize:"14px",color:"#475569",fontFamily:FONT}}>dogru siniflandirma</div> {/* doğru sınıflandırma */}
      <button onClick={retry} style={{padding:"12px 28px",background:`linear-gradient(90deg,#0369a1,${C})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT}}>Tekrar Oyna</button> {/* Tekrar Oyna */}
    </div> 
  );
  const pending=shuffled.filter(m=>!placed[m.id]);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
      <div>
        <div style={{fontSize:"10px",color:C,letterSpacing:"3px",fontWeight:"800",fontFamily:MONO,marginBottom:"4px"}}>ETKİNLİK 1</div>
        <div style={{fontSize:"17px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>🌀 Basınç Merkezlerini Sınıflandır</div>
        <div style={{fontSize:"12px",color:"#475569",marginTop:"3px",fontFamily:FONT}}>Her ozelligi dogru basinc merkezine surukle birak</div>
      </div>
      <div style={{padding:"12px 14px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"10px",minHeight:"52px"}}> {/* Özellikler */}
        <div style={{fontSize:"10px",color:"#475569",letterSpacing:"2px",fontWeight:"800",marginBottom:"8px",fontFamily:FONT}}>ÖZELLİKLER</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"7px"}}>
          {pending.map(item=>(
            <div key={item.id} draggable
              onDragStart={e=>{setDragId(item.id);e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",item.id);}}
              onDragEnd={()=>{setDragId(null);setHov(null);}}
              style={{padding:"9px 13px",background:dragId===item.id?`${C}20`:"rgba(0,0,0,0.4)",
                border:`1.5px solid ${dragId===item.id?C:"rgba(255,255,255,0.1)"}`,
                borderRadius:"8px",cursor:"grab",fontSize:"12px",fontWeight:"600",color:"#cbd5e1",
                fontFamily:FONT,userSelect:"none",WebkitUserSelect:"none",opacity:dragId===item.id?0.5:1}}>
              {item.text}
            </div>
          ))}
          {shuffled.filter(m=>placed[m.id]).map(item=>(
            <div key={item.id} style={{padding:"9px 13px",
              background:wrong[item.id]?"rgba(239,68,68,0.08)":"rgba(52,211,153,0.08)",
              border:`1.5px solid ${wrong[item.id]?"#ef444430":"#34d39930"}`,
              borderRadius:"8px",fontSize:"12px",fontWeight:"600",
              color:wrong[item.id]?"#ef4444":"#34d399",fontFamily:FONT,opacity:0.65}}>
              {wrong[item.id]?"X ":"OK "}{item.text}
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
        {BUCKETS.map(bucket=>(
          <div key={bucket.id}
            onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect="move";setHov(bucket.id);}}
            onDragLeave={()=>setHov(null)}
            onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("text/plain");if(id){setDragId(id);setTimeout(()=>doDrop(bucket.id),0);}else doDrop(bucket.id);}}
            style={{minHeight:"160px",padding:"14px",
              background:hovBucket===bucket.id?`${bucket.color}18`:`${bucket.color}08`,
              border:`2px ${hovBucket===bucket.id?"solid":"dashed"} ${bucket.color}${hovBucket===bucket.id?"80":"35"}`,
              borderRadius:"12px",transition:"all 0.2s"}}>
            <div style={{fontSize:"22px",marginBottom:"4px"}}>{bucket.icon}</div>
            <div style={{fontSize:"13px",fontWeight:"800",color:bucket.color,marginBottom:"2px",fontFamily:FONT}}>{bucket.label}</div>
            <div style={{fontSize:"11px",color:`${bucket.color}80`,marginBottom:"10px",fontFamily:FONT}}>{bucket.sub}</div>
            <div style={{display:"flex",flexDirection:"column",gap:"5px"}}> {/* Yerleştirilen öğeler */}
              {shuffled.filter(m=>placed[m.id]===bucket.id).map(it=>(
                <div key={it.id} style={{padding:"6px 9px",
                  background:wrong[it.id]?"rgba(239,68,68,0.12)":"rgba(52,211,153,0.12)",
                  border:`1px solid ${wrong[it.id]?"#ef444440":"#34d39940"}`,
                  borderRadius:"6px",fontSize:"11px",
                  color:wrong[it.id]?"#ef4444":"#34d399",fontWeight:"600",fontFamily:FONT}}>
                  {wrong[it.id]?"X ":"OK "}{it.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{padding:"9px 14px",background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"8px",display:"flex",justifyContent:"space-between"}}>
        <span style={{fontSize:"12px",color:"#475569",fontFamily:FONT}}>Kalan: {pending.length} kart</span> {/* Kalan kart sayısı */}
        <span style={{fontSize:"14px",fontWeight:"800",color:C,fontFamily:MONO}}>{score} dogru</span>
      </div>
    </div>
  );
}

function TestTab() {
  const [qIdx,setQIdx]       = useState(0);
  const [sel,setSel]         = useState<number|null>(null);
  const [score,setScore]     = useState(0);
  const [answers,setAnswers] = useState<boolean[]>([]);
  const [done,setDone]       = useState(false);
  const q = TEST_ITEMS[qIdx];
  const handleAnswer=(i:number)=>{ if(sel!==null)return; setSel(i); const ok=i===q.correct; if(ok){setScore(s=>s+10);sndOK();}else sndFail(); setAnswers(a=>[...a,ok]); };
  const next =()=>{ sndClick(); if(qIdx>=TEST_ITEMS.length-1){setDone(true);return;} setQIdx(i=>i+1); setSel(null); };
  const retry=()=>{ setQIdx(0);setSel(null);setScore(0);setAnswers([]);setDone(false); };
  if(done){
    const pct=Math.round((score/(TEST_ITEMS.length*10))*100);
    return(
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"18px",padding:"40px",textAlign:"center"}}>
        <div style={{fontSize:"52px"}}>⛅</div> {/* Test Tamamlandı! */}
        <div style={{fontSize:"26px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Test Tamamlandi!</div> {/* Test Tamamlandı! */}
        <div style={{fontSize:"52px",fontWeight:"800",color:pct>=80?"#34d399":pct>=50?C2:C5,fontFamily:MONO}}>{score} PUAN</div>
        <div style={{fontSize:"14px",color:"#475569",fontFamily:FONT}}>{answers.filter(Boolean).length}/{TEST_ITEMS.length} dogru · %{pct}</div> {/* doğru */}
        <div style={{fontSize:"14px",color:"#64748b",maxWidth:"420px",lineHeight:"1.8",fontFamily:FONT}}>
          {pct>=80?"Mukemmel! Hava olaylarini cok iyi ogrendin.":pct>=50?"Iyi! Ogren sekmesini tekrar incele.":"Tekrar dene!"} {/* Mükemmel! Öğren sekmesini tekrar incele. Tekrar dene! */}
        </div>
        <button onClick={retry} style={{padding:"13px 30px",background:`linear-gradient(90deg,#0369a1,${C})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT}}>Tekrar Dene</button>
      </div>
    );
  }
  return(
    <div style={{flex:1,display:"flex",overflow:"hidden"}}>
      <div style={{width:"220px",flexShrink:0,borderRight:"1px solid rgba(14,165,233,0.1)",background:"rgba(3,6,15,0.7)",padding:"20px 14px",display:"flex",flexDirection:"column",gap:"6px",overflowY:"auto"}}>
        <div style={{fontSize:"11px",letterSpacing:"2px",color:"#475569",fontWeight:"800",fontFamily:FONT,marginBottom:"4px"}}>SORULAR</div> {/* Sorular */}
        {TEST_ITEMS.map((_,i)=>{ const d=i<answers.length,cur=i===qIdx; return(
          <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",
            background:cur?`${C}10`:"rgba(0,0,0,0.15)",
            border:`1.5px solid ${cur?C:d?(answers[i]?"rgba(52,211,153,0.3)":"rgba(239,68,68,0.3)"):"rgba(255,255,255,0.04)"}`,
            borderRadius:"7px"}}>
            <div style={{width:"20px",height:"20px",borderRadius:"50%",background:d?(answers[i]?"#34d399":"#ef4444"):cur?C:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"800",color:"#fff",flexShrink:0,fontFamily:MONO}}>
              {d?(answers[i]?"V":"X"):i+1}
            </div> {/* Soru {i+1} */}
            <span style={{fontSize:"12px",fontWeight:"700",color:cur?C:d?(answers[i]?"#34d399":"#ef4444"):"#334155",fontFamily:FONT}}>Soru {i+1}</span> {/* Soru {i+1} */}
          </div>
        );})}
        <div style={{marginTop:"auto",padding:"12px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"9px",textAlign:"center"}}>
          <div style={{fontSize:"11px",color:"#475569",fontWeight:"700",fontFamily:FONT,marginBottom:"4px"}}>PUAN</div> {/* Puan */}
          <div style={{fontSize:"30px",fontWeight:"800",color:C,fontFamily:MONO}}>{score}</div>
          <div style={{fontSize:"11px",color:"#334155",fontFamily:FONT}}>/ {TEST_ITEMS.length*10}</div>
        </div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"28px 32px",overflowY:"auto",gap:"16px"}}>
        <div style={{width:"100%",maxWidth:"640px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
            <span style={{fontSize:"12px",color:"#475569",fontWeight:"700",fontFamily:FONT}}>SORU {qIdx+1}/{TEST_ITEMS.length}</span> {/* Soru {qIdx+1} */}
            <span style={{fontSize:"12px",color:C,fontFamily:FONT}}>{Math.round((qIdx/TEST_ITEMS.length)*100)}%</span>
          </div>
          <div style={{height:"4px",background:`${C}18`,borderRadius:"2px",overflow:"hidden"}}>
            <div style={{height:"100%",width:`${(qIdx/TEST_ITEMS.length)*100}%`,background:`linear-gradient(90deg,#0369a1,${C})`,borderRadius:"2px",transition:"width 0.4s"}}/>
          </div>
        </div>
        <div style={{maxWidth:"640px",width:"100%",padding:"20px 24px",background:`${C}08`,border:`1.5px solid ${C}20`,borderRadius:"14px"}}>
          <p style={{fontSize:"15px",color:"#e2e8f0",lineHeight:"1.9",margin:0,fontWeight:"600",fontFamily:FONT}}>{q.q}</p>
        </div>
        <div style={{maxWidth:"640px",width:"100%",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"9px"}}>
          {q.opts.map((opt,i)=>{ const isSel=sel===i,isCorr=i===q.correct,show=sel!==null; let bg="rgba(0,0,0,0.25)",border="rgba(255,255,255,0.07)",color="#64748b"; if(show){if(isCorr){bg="#34d39912";border="#34d399";color="#34d399";}else if(isSel){bg="rgba(239,68,68,0.1)";border="#ef4444";color="#ef4444";}} return(
            <button key={i} onClick={()=>handleAnswer(i)} disabled={sel!==null}
              style={{padding:"13px 15px",background:bg,border:`2px solid ${border}`,borderRadius:"10px",cursor:sel!==null?"default":"pointer",fontFamily:FONT,textAlign:"left",transition:"all 0.18s"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:"9px"}}>
                <span style={{width:"22px",height:"22px",borderRadius:"50%",background:show&&isCorr?"#34d399":show&&isSel?"#ef4444":`${C}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"800",color:show?"#fff":"#94a3b8",flexShrink:0,marginTop:"1px",fontFamily:MONO}}>
                  {show&&isCorr?"V":show&&isSel&&!isCorr?"X":String.fromCharCode(65+i)}
                </span>
                <span style={{fontSize:"13px",color,fontWeight:"600",lineHeight:"1.6",fontFamily:FONT}}>{opt}</span>
              </div>
            </button>
          );})}
        </div>
        {sel!==null&&(
          <div style={{maxWidth:"640px",width:"100%",padding:"15px 18px",background:sel===q.correct?"rgba(52,211,153,0.07)":"rgba(239,68,68,0.07)",border:`1.5px solid ${sel===q.correct?"rgba(52,211,153,0.25)":"rgba(239,68,68,0.25)"}`,borderRadius:"12px"}}>
            <div style={{fontSize:"14px",fontWeight:"800",color:sel===q.correct?"#34d399":"#ef4444",marginBottom:"8px",fontFamily:FONT}}>{sel===q.correct?"DOGRU!":"YANLIS!"}</div> {/* Doğru! Yanlış! */}
            <p style={{fontSize:"13px",color:"#64748b",lineHeight:"1.85",margin:0,fontFamily:FONT}}>{q.exp}</p>
          </div>
        )}
        {sel!==null&&( // Sonuçları Gör, Sonraki Soru
          <button onClick={next} style={{padding:"12px 34px",background:`linear-gradient(90deg,#0369a1,${C})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)"}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none"}}>
            {qIdx>=TEST_ITEMS.length-1?"Sonuclari Gor":"Sonraki Soru"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Ana Bileşen ────────────────────────────────────────────────────────────
export default function HavaOlaylariActivity({ onClose }: { onClose: () => void }) {
  const [tab,setTab]         = useState<Tab>("learn");
  const [sec,setSec]         = useState<LearnSec>("atmosfer");
  const [activeAsiri,setActiveAsiri] = useState<string>("sicak");
  const [actTab,setActTab]   = useState<"basinc"|"ruzgar">("basinc");

  const TABS = [
    {id:"learn" as Tab,icon:"📖",label:"OGREN"}, // Öğren
    {id:"act"   as Tab,icon:"🌀",label:"ETKINLIK"}, // Etkinlik
    {id:"test"  as Tab,icon:"✏️",label:"TEST"}, // Test
  ];
  const SECTIONS: {id:LearnSec;icon:string;label:string;color:string}[] = [
    {id:"atmosfer", icon:"🌬️", label:"Atmosfer",       color:C},
    {id:"sicaklik", icon:"🌡️", label:"Sicaklik",        color:C2}, // Sıcaklık
    {id:"basinc",   icon:"🌀", label:"Basinc",          color:C3},
    {id:"ruzgar",   icon:"💨", label:"Ruzgar",          color:"#64748b"},
    {id:"nem",      icon:"💧", label:"Nem & Yagis",     color:C4},
    {id:"asiri",    icon:"⚡", label:"Asiri Hava",      color:C5},
    {id:"halk",     icon:"🌾", label:"Halk Meteoroloji",color:"#a78bfa"},
  ];

  return(
    <div style={{position:"fixed",inset:0,zIndex:1000,background:BG,display:"flex",flexDirection:"column",fontFamily:FONT,userSelect:"none",WebkitUserSelect:"none"}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Üst bar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",height:"64px",borderBottom:`1px solid ${C}1a`,background:"rgba(2,5,12,0.95)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:"24px"}}> {/* 3. Ünite: Doğal Sistemler ve Süreçler */}
          <div>
            <div style={{fontSize:"10px",letterSpacing:"4px",color:C,opacity:0.6,fontFamily:MONO}}>3. UNITE: DOGAL SISTEMLER VE SURECLER</div>
            <div style={{fontSize:"19px",fontWeight:"800",color:"#e2e8f0"}}>Hava Olaylari</div> {/* Hava Olayları */}
          </div>
          <div style={{display:"flex",gap:"3px",background:"rgba(0,0,0,0.4)",padding:"4px",borderRadius:"10px"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>{sndClick();setTab(t.id);}}
                style={{padding:"7px 18px",borderRadius:"7px",border:"none",cursor:"pointer",fontFamily:FONT,fontSize:"12px",fontWeight:"700",transition:"all 0.18s",background:tab===t.id?C:"transparent",color:tab===t.id?"#fff":"#334155"}}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div> {/* Kapat */}
        <button onClick={onClose} style={{padding:"8px 18px",background:"transparent",border:"1px solid rgba(255,80,80,0.3)",borderRadius:"8px",color:"#f87171",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:FONT}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,80,80,0.1)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          KAPAT
        </button>
      </div>

      <div style={{flex:1,overflow:"hidden",display:"flex",minHeight:0}}>

        {/* ── ÖĞREN ── */}
        {tab==="learn" && (
          <div style={{flex:1,display:"flex",overflow:"hidden"}}>
            {/* Sol menü */}
            <div style={{width:"200px",flexShrink:0,borderRight:`1px solid ${C}12`,background:"rgba(2,5,12,0.7)",overflowY:"auto",padding:"16px 12px"}}> {/* Konular */}
              <div style={{fontSize:"11px",letterSpacing:"2px",color:"#475569",fontWeight:"800",fontFamily:FONT,marginBottom:"10px"}}>KONULAR</div>
              <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                {SECTIONS.map(s=>(
                  <button key={s.id} onClick={()=>{sndClick();setSec(s.id);}}
                    style={{padding:"9px 11px",background:sec===s.id?`${s.color}14`:"rgba(0,0,0,0.2)",border:`1.5px solid ${sec===s.id?s.color:"rgba(255,255,255,0.04)"}`,borderRadius:"8px",cursor:"pointer",textAlign:"left",fontFamily:FONT,transition:"all 0.18s",display:"flex",gap:"8px",alignItems:"center"}}>
                    <span style={{fontSize:"16px"}}>{s.icon}</span>
                    <span style={{fontSize:"12px",fontWeight:"800",color:sec===s.id?s.color:"#334155"}}>{s.label}</span>
                  </button>
                ))}
              </div>
              <div style={{height:"1px",background:`${C}10`,margin:"16px 0"}}/> {/* Aletler */}
              <div style={{fontSize:"11px",letterSpacing:"2px",color:"#475569",fontWeight:"800",fontFamily:FONT,marginBottom:"10px"}}>ALETLER</div> {/* Aletler */}
              <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                {[["🌡️","Termometre","Sicaklik olcer"],["🧱","Barometre","Basinc olcer"],["💨","Anemometre","Ruzgar olcer"],["💧","Higrometre","Nem olcer"],["🌧️","Pluviyometre","Yagis olcer"]].map(([icon,alet,desc])=>( // Sıcaklık ölçer, Basınç ölçer, Rüzgar ölçer, Nem ölçer, Yağış ölçer
                  <div key={alet} style={{padding:"6px 8px",background:"rgba(0,0,0,0.2)",borderRadius:"6px",borderLeft:`2px solid ${C}40`}}>
                    <div style={{fontSize:"11px",color:C,fontWeight:"700",fontFamily:FONT}}>{icon} {alet}</div>
                    <div style={{fontSize:"10px",color:"#334155",fontFamily:FONT,marginTop:"1px"}}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sağ içerik */}
            <div style={{flex:1,overflowY:"auto",padding:"24px 28px",display:"flex",flexDirection:"column",gap:"18px",background:`radial-gradient(ellipse at 10% 10%,${C}06 0%,${BG} 65%)`}}>

              {/* ATMOSFER */}
              {sec==="atmosfer" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"16px"}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px"}}>
                      <span style={{fontSize:"28px"}}>🌬️</span> {/* Atmosfer */}
                      <div>
                        <div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Atmosfer</div>
                        <div style={{fontSize:"13px",color:C,fontWeight:"600",fontFamily:FONT}}>Yeryuzundeki tum yasam bicimlerinin vazgecilmez ortami</div> {/* Yeryüzündeki tüm yaşam biçimlerinin vazgeçilmez ortamı */}
                      </div>
                    </div>
                    <div style={{height:"2px",background:`linear-gradient(90deg,${C},transparent)`,opacity:0.35,borderRadius:"2px"}}/>
                  </div>
                  <div style={{padding:"16px 20px",background:`${C}0a`,border:`1.5px solid ${C}22`,borderRadius:"12px"}}>
                    <p style={{fontSize:"14px",color:"#94a3b8",lineHeight:"1.95",margin:0,fontFamily:FONT}}>
                      Atmosfer; havada asili halde bulunan su damlaciklari, buz kristalleri, toz tanecikleri gibi sivi ve kati tanecikler iceren gaz karisimlarindan olusur. <strong style={{color:C}}>Azot (%78)</strong>, <strong style={{color:C2}}>oksijen (%21)</strong> ve diger gazlar (%1) atmosferin temel bilesenleridir.
                    </p> {/* Atmosfer bileşimi */}
                  </div>
                  {/* Atmosfer bileşimi SVG */}
                  <div style={{padding:"16px 18px",background:"rgba(0,0,0,0.28)",border:"1px solid rgba(14,165,233,0.12)",borderRadius:"12px"}}>
                    <div style={{fontSize:"11px",color:C,letterSpacing:"2px",fontWeight:"800",marginBottom:"12px",fontFamily:FONT}}>ATMOSFER BILESIMI</div>
                    <svg viewBox="0 0 400 90" width="100%" style={{maxWidth:"400px",display:"block",margin:"0 auto"}}>
                      {/* Bar chart */}
                      {[["Azot",78,"#0ea5e9",0],["Oksijen",21,"#f97316",100],["Diger",1,"#64748b",175]].map(([label,pct,color,x])=>(
                        <g key={String(label)}>
                          <rect x={Number(x)} y={20} width={Number(pct)*1.8} height={30} fill={String(color)} rx="4" opacity="0.85"/>
                          <text x={Number(x)+Number(pct)*0.9} y={38} textAnchor="middle" fontSize="11" fill="#fff" fontFamily={FONT} fontWeight="700">%{pct}</text>
                          <text x={Number(x)+Number(pct)*0.9} y={68} textAnchor="middle" fontSize="10" fill={String(color)} fontFamily={FONT}>{String(label)}</text>
                        </g>
                      ))}
                    </svg>
                  </div>
                  {/* Atmosfer özellikleri */}
                  <div>
                    <div style={{fontSize:"11px",color:C,letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT}}>ATMOSFERIN TEMEL OZELLIKLERI</div> {/* Atmosferin Temel Özellikleri */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                      {[
                        ["🌦️","Hava olaylarini olusturur","Yagis, sis, bulut, ruzgar"],
                        ["☀️","Zararli isinlari emer","UV ve diger zararli isinlari filtreler"],
                        ["🪨","Meteorlara karsi korur","Buyuk kutleli meteorlarin dusmesini engeller"],
                        ["🌡️","Asiri isi ve sogumaya karsi","Dunyanin asiri isinmasini ve sogumayi onler"],
                        ["💡","Isinlari dagitir","Golge alanlarin da aydinlanmasini saglar"],
                        ["🌿","Yasam icin optimal kosullar","Gaz oranlariyla yasam icin en uygun kosullar"],
                      ].map(([icon,title,sub])=>(
                        <div key={String(title)} style={{padding:"10px 12px",background:`${C}08`,border:`1px solid ${C}15`,borderRadius:"9px",display:"flex",gap:"9px",alignItems:"flex-start"}}>
                          <span style={{fontSize:"18px",flexShrink:0}}>{icon}</span>
                          <div>
                            <div style={{fontSize:"12px",fontWeight:"700",color:"#94a3b8",fontFamily:FONT}}>{String(title)}</div>
                            <div style={{fontSize:"11px",color:"#334155",fontFamily:FONT,marginTop:"2px"}}>{String(sub)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SICAKLIK */}
              {sec==="sicaklik" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"16px"}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px"}}>
                      <span style={{fontSize:"28px"}}>🌡️</span> {/* Hava Sıcaklığı */}
                      <div>
                        <div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Hava Sicakligi</div>
                        <div style={{fontSize:"13px",color:C2,fontWeight:"600",fontFamily:FONT}}>Termometre ile olcum · Derece Celsius</div> {/* Termometre ile ölçüm · Derece Celsius */}
                      </div>
                    </div>
                    <div style={{height:"2px",background:`linear-gradient(90deg,${C2},transparent)`,opacity:0.35,borderRadius:"2px"}}/>
                  </div>
                  <div style={{padding:"16px 20px",background:`${C2}0a`,border:`1.5px solid ${C2}22`,borderRadius:"12px"}}>
                    <p style={{fontSize:"14px",color:"#94a3b8",lineHeight:"1.95",margin:0,fontFamily:FONT}}>
                      Sicaklik, hava ve iklimy en onemli unsurlarinan biridir. <strong style={{color:C2}}>Gunes, atmosferdeki sicakligin kaynagidir.</strong> Atmosfere giren Gunes isinlarinin bir kismi yeryuzu tarafindan sogurulduktan sonra bir kismi atmosfere yansitilir. Hava sicakligi; saatlik, gunluk, mevsimlik olarak farklilik gosterir.
                    </p> {/* Güneş enerjisi akışı */}
                  </div>
                  {/* Güneş enerjisi akışı */}
                  <div style={{padding:"14px 16px",background:"rgba(0,0,0,0.28)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:"11px"}}>
                    <div style={{fontSize:"11px",color:C2,letterSpacing:"2px",fontWeight:"800",marginBottom:"12px",fontFamily:FONT}}>GUNES ENERJISININ ATMOSFERDEKI DAGILIHI</div>
                    <svg viewBox="0 0 480 80" width="100%" style={{maxWidth:"480px",display:"block",margin:"0 auto"}}>{/* oklar */}
                      {[["Uzaya yansiyan","&6","#94a3b8",0],["Atmosferde emilenler","&25","#f59e0b",120],["Bulutlardan yansiyan","&20","#60a5fa",240],["Yeryuzune gelen","&49","#f97316",360]].map(([label,pctStr,color,x])=>{
                        const pct=parseInt(String(pctStr).replace("&",""));
                        return(
                          <g key={String(label)}>
                            <rect x={Number(x)} y={15} width={pct*1.5} height={28} fill={String(color)} rx="3" opacity="0.85"/>
                            <text x={Number(x)+pct*0.75} y={32} textAnchor="middle" fontSize="10" fill="#fff" fontFamily={FONT} fontWeight="700">%{pct}</text>
                            <text x={Number(x)+pct*0.75} y={60} textAnchor="middle" fontSize="9" fill={String(color)} fontFamily={FONT}>{String(label)}</text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  {/* Albedo kutusu */}
                  <div style={{padding:"12px 16px",background:`${C2}08`,border:`1px solid ${C2}20`,borderRadius:"10px"}}>
                    <div style={{fontSize:"12px",color:C2,fontWeight:"800",marginBottom:"6px",fontFamily:FONT}}>ALBEDO NEDIR?</div> {/* Albedo Nedir? */}
                    <p style={{fontSize:"13px",color:"#64748b",lineHeight:"1.8",margin:0,fontFamily:FONT}}>
                      Yeryuzunun Gunesten gelen isinimi atmosfere dogru ortalama yansitma yuzdesidir. Toprak, su, bitki, buzul, asfalt, beton gibi yuzeyler farkli albedo degerlerine sahiptir.
                    </p> {/* Sıcaklık ölçüm koşulları */}
                  </div>
                  <div style={{padding:"12px 16px",background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"10px",fontSize:"13px",color:"#64748b",lineHeight:"1.8",fontFamily:FONT}}>
                    Sicaklik; insanlarin konforu ve sagligini, bitki ve hayvanlarin ozelliklerini, su kaynaklarini ve tarim faaliyetlerini etkileyen onemli bir faktordu. Termometre, Gunes isinlarina maruz kalmayan, hava girisine acik, yerden 1.5-2 m yuksekte ahsap kutu icine yerlestirilir.
                  </div>
                </div> {/* Sıcaklık ölçüm koşulları */}
              )}

              {/* BASINÇ */}
              {sec==="basinc" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"16px"}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px"}}>
                      <span style={{fontSize:"28px"}}>🌀</span> {/* Hava Basıncı */}
                      <div>
                        <div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Hava Basinci</div>
                        <div style={{fontSize:"13px",color:C3,fontWeight:"600",fontFamily:FONT}}>Barometre ile olcum · milibar (mb) / hPa</div> {/* Barometre ile ölçüm · milibar (mb) / hPa */}
                      </div>
                    </div>
                    <div style={{height:"2px",background:`linear-gradient(90deg,${C3},transparent)`,opacity:0.35,borderRadius:"2px"}}/>
                  </div>
                  <div style={{padding:"16px 20px",background:`${C3}0a`,border:`1.5px solid ${C3}22`,borderRadius:"12px"}}>
                    <p style={{fontSize:"14px",color:"#94a3b8",lineHeight:"1.95",margin:0,fontFamily:FONT}}>
                      Atmosferi olusturan gazlarin birim yuzeye uyguladigi kuvvete <strong style={{color:C3}}>hava basinci</strong> adiyla verilir. Standart hava basinci; <strong style={{color:"#e2e8f0"}}>45 enleminde, deniz seviyesinde ve 15°C sicaklikta, 1013 mb</strong> olarak kabul edilmistir.
                    </p> {/* Alçak / Yüksek Basınç karşılaştırma */}
                  </div>
                  {/* Alcak / Yuksek Basınç karşılaştırma */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}> {/* Alçak / Yüksek Basınç karşılaştırma */}
                    {[
                      {id:"alcak",title:"Alcak Basinc Merkezi (A)",icon:"⬆️",color:"#7c3aed",symbol:"A",props:["Yatay hava: Cevreden merkeze","Dikey hava: Yukselici","Bulutlu ve yagisli hava","Siklon olarak da bilinir"]},
                      {id:"yuksek",title:"Yuksek Basinc Merkezi (Y)",icon:"⬇️",color:"#f97316",symbol:"Y",props:["Yatay hava: Merkezden cevreye","Dikey hava: Alcalici","Gunesli ve acik hava","Antisiklon olarak da bilinir"]},
                    ].map(bp=>(
                      <div key={bp.id} style={{padding:"14px 16px",background:`${bp.color}0d`,border:`1.5px solid ${bp.color}28`,borderRadius:"11px"}}>
                        <div style={{fontSize:"22px",marginBottom:"6px"}}>{bp.icon}</div>
                        <div style={{fontSize:"13px",fontWeight:"800",color:bp.color,marginBottom:"10px",fontFamily:FONT}}>{bp.title}</div>
                        <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                          {bp.props.map(p=>(
                            <div key={p} style={{fontSize:"12px",color:"#64748b",fontFamily:FONT,paddingLeft:"8px",borderLeft:`2px solid ${bp.color}50`}}>{p}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{padding:"12px 16px",background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"10px",fontSize:"13px",color:"#64748b",lineHeight:"1.8",fontFamily:FONT}}> {/* İzobar tanımı */}
                    Izobar: Ayni basinc degerine sahip noktalarin birlestirilmesiyle olusturulan esbasinc egrileridir. Basinc; ruzgar, hava dolasimi ve yagis olusumunu etkiler.
                  </div>
                </div>
              )}

              {/* RÜZGÂR */}
              {sec==="ruzgar" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"16px"}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px"}}>
                      <span style={{fontSize:"28px"}}>💨</span> {/* Rüzgar */}
                      <div>
                        <div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Ruzgar</div>
                        <div style={{fontSize:"13px",color:"#94a3b8",fontWeight:"600",fontFamily:FONT}}>Yuksek basinctan alcak basinca yatay hava hareketi</div> {/* Yüksek basınçtan alçak basınca yatay hava hareketi */}
                      </div>
                    </div>
                    <div style={{height:"2px",background:"linear-gradient(90deg,#94a3b8,transparent)",opacity:0.35,borderRadius:"2px"}}/>
                  </div>
                  <div style={{padding:"16px 20px",background:"rgba(148,163,184,0.08)",border:"1.5px solid rgba(148,163,184,0.2)",borderRadius:"12px"}}>
                    <p style={{fontSize:"14px",color:"#94a3b8",lineHeight:"1.95",margin:0,fontFamily:FONT}}>
                      Yuksek basinc alanindan alcak basinc alanina dogru yeryuzune gore <strong style={{color:"#e2e8f0"}}>yatay dogrultuda olan hava hareketlerine ruzgar</strong> adı verilir. Ruzgarlar; estigi yere sicak, soguk, nemli veya kuru hava kutlelerini getirerek hava durumu ve iklim uzerinde rol oynar.
                    </p> {/* Rüzgar özellikleri */}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px"}}>
                    {[ // Rüzgar özellikleri
                      {icon:"⚡",color:"#f59e0b",title:"Hizi (Siddeti)","desc":"Birim zamanda yatay dogrultuda alinan yoldur. Anemometre ile olculur. m/sn veya km/sa ile belirtilir."},
                      {icon:"🧭",color:C,title:"Yonu","desc":"Ruzgarlarin bir merkeze gore estigi dogrultudur. Cografik yonlere gore ifade edilir."},
                      {icon:"📊",color:C4,title:"Esme Sikligi (Frekansi)","desc":"Ruzgarin bir yone ait esme sayisidir. Yil ici en sik estigi yona hakim ruzgar yonu denir."},
                    ].map(item=>(
                      <div key={item.title} style={{padding:"12px 14px",background:`${item.color}08`,border:`1px solid ${item.color}20`,borderRadius:"10px",textAlign:"center"}}>
                        <div style={{fontSize:"22px",marginBottom:"6px"}}>{item.icon}</div>
                        <div style={{fontSize:"12px",fontWeight:"800",color:item.color,marginBottom:"6px",fontFamily:FONT}}>{item.title}</div>
                        <p style={{fontSize:"11px",color:"#475569",lineHeight:"1.7",margin:0,fontFamily:FONT}}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  {/* Rüzgâr hız tablosu */}
                  <div style={{padding:"14px 16px",background:"rgba(0,0,0,0.28)",border:"1px solid rgba(148,163,184,0.15)",borderRadius:"11px"}}> {/* Rüzgar Hızı ve İnsan Üzerindeki Etkisi */}
                    <div style={{fontSize:"11px",color:"#94a3b8",letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT}}>RUZGAR HIZI VE INSAN UZERINDEKI ETKISI</div> {/* Rüzgar Hızı ve İnsan Üzerindeki Etkisi */}
                    <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
                      {[["4","Saclar dagilir"],["5","Giysiler ucusmaya baslar"],["6-8","Toz ve kagit parcaciklari havalanir"],["8-11","Ruzgarin kuvveti vucutta hissedilir"],["11-14","Semsiye kullanmak guc hale gelir"],["14-17","Ruzgara karsi yurumek guclesiyor"],["17-21","Ruzgara karsi yurumek mumkun olmaz"]].map(([hiz,etki])=>( // Saçlar dağılır, Giysiler uçuşmaya başlar, Rüzgarın kuvveti vücutta hissedilir, Şemsiye kullanmak güç hale gelir, Rüzgara karşı yürümek güçleşiyor, Rüzgara karşı yürümek mümkün olmaz
                        <div key={hiz} style={{display:"flex",gap:"10px",padding:"5px 8px",background:"rgba(255,255,255,0.02)",borderRadius:"5px"}}>
                          <div style={{width:"50px",fontSize:"12px",fontWeight:"800",color:"#94a3b8",fontFamily:MONO,flexShrink:0}}>{hiz} m/sn</div>
                          <div style={{fontSize:"12px",color:"#475569",fontFamily:FONT}}>{etki}</div>
                        </div>
                      ))} 
                    </div>
                  </div>
                  {/* Rüzgâr gülü görseli */}
                  <div style={{padding:"14px 16px",background:"rgba(0,0,0,0.28)",border:`1px solid ${C}15`,borderRadius:"11px"}}>
                    <div style={{fontSize:"11px",color:C,letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT}}>ORNEK RUZGAR FREKANS GULU — Ankara</div>
                    <div style={{display:"flex",gap:"16px",alignItems:"flex-start",flexWrap:"wrap"}}>
                      <RuzgarGulu freq={RUZGAR_FREQ_ANKARA} labels={YONLER_EN}/>
                      <div style={{flex:1,minWidth:"180px"}}> {/* Rüzgar gülü açıklaması */}
                        <div style={{fontSize:"12px",color:"#64748b",lineHeight:"1.8",fontFamily:FONT,marginBottom:"8px"}}>
                          Bu ornekte kuzey ruzgari 90 gun esme frekansiyla hakim ruzgar yonudur. Dogu ruzgari 60 gunle ikinci siradadir.
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
                          {RUZGAR_YONLER.map((y,i)=>(
                            <div key={y} style={{display:"flex",gap:"8px",alignItems:"center"}}>
                              <div style={{width:"55px",fontSize:"11px",color:"#64748b",fontFamily:FONT}}>{y}</div>
                              <div style={{flex:1,background:`${C}18`,borderRadius:"3px",height:"8px",overflow:"hidden"}}>
                                <div style={{height:"100%",width:`${(RUZGAR_FREQ_ANKARA[i]/90)*100}%`,background:C,borderRadius:"3px"}}/>
                              </div>
                              <div style={{width:"28px",fontSize:"11px",color:C,fontFamily:MONO,textAlign:"right"}}>{RUZGAR_FREQ_ANKARA[i]}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NEM & YAĞIŞ */}
              {sec==="nem" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"16px"}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px"}}>
                      <span style={{fontSize:"28px"}}>💧</span> {/* Nem & Yağış */}
                      <div>
                        <div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Nem & Yagis</div>
                        <div style={{fontSize:"13px",color:C4,fontWeight:"600",fontFamily:FONT}}>Su dongusu · Yogusma · Doyma noktasi</div> {/* Su döngüsü · Yoğuşma · Doyma noktası */}
                      </div>
                    </div>
                    <div style={{height:"2px",background:`linear-gradient(90deg,${C4},transparent)`,opacity:0.35,borderRadius:"2px"}}/>
                  </div>
                  <div style={{padding:"16px 20px",background:`${C4}0a`,border:`1.5px solid ${C4}22`,borderRadius:"12px"}}>
                    <p style={{fontSize:"14px",color:"#94a3b8",lineHeight:"1.95",margin:0,fontFamily:FONT}}>
                      Atmosferdeki su buharina <strong style={{color:C4}}>nem</strong> adi verilir. Suyun atmosfer, litosfer, hidrosfer ve biyosfer arasinda surekli yer degistirmesine <strong style={{color:"#e2e8f0"}}>su dongusu</strong> denir. Atmosferdeki nemin yogusmasi sonucunda <strong style={{color:C4}}>yagis</strong> meydana gelir.
                    </p> {/* Su döngüsü SVG */}
                  </div>
                  {/* Su döngüsü SVG */}
                  <div style={{padding:"14px 16px",background:"rgba(0,0,0,0.28)",border:`1px solid ${C4}18`,borderRadius:"11px"}}>
                    <div style={{fontSize:"11px",color:C4,letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT}}>SU DONGUSU</div>
                    <svg viewBox="0 0 520 100" width="100%" style={{maxWidth:"520px",display:"block",margin:"0 auto"}}>
                      {/* oklar */}
                      <defs>
                        <marker id="arr" markerWidth="8" markerHeight="6" refX="4" refY="3" orient="auto">
                          <polygon points="0 0, 8 3, 0 6" fill={C4}/>
                        </marker>
                      </defs>
                      <line x1="80" y1="70" x2="180" y2="30" stroke={C4} strokeWidth="1.5" markerEnd="url(#arr)"/>
                      <line x1="200" y1="30" x2="300" y2="30" stroke={C4} strokeWidth="1.5" markerEnd="url(#arr)"/>
                      <line x1="320" y1="30" x2="420" y2="65" stroke={C4} strokeWidth="1.5" markerEnd="url(#arr)"/>
                      <line x1="400" y1="75" x2="100" y2="75" stroke={C4} strokeWidth="1.5" markerEnd="url(#arr)"/>
                      {[["Buharlasma",20,80],["Yukselmek",130,20],["Bulut Olusumu",230,18],["Yogusma & Yagis",350,20],["Yuzey Akisi",250,88]].map(([label,x,y])=>( // Buharlaşma, Yükselmek, Bulut Oluşumu, Yoğuşma & Yağış, Yüzey Akışı
                        <text key={String(label)} x={Number(x)} y={Number(y)} fontSize="9" fill="#94a3b8" fontFamily={FONT} textAnchor="middle">{String(label)}</text>
                      ))}
                      {[["Deniz/Su",30,78],["Bulut",240,35,"#60a5fa"],["Yagis",410,60,"#0ea5e9"]].map(([label,x,y,c])=>( // Deniz/Su, Bulut, Yağış
                        <text key={String(label)} x={Number(x)} y={Number(y)} fontSize="10" fill={String(c)||C4} fontFamily={FONT} fontWeight="700">{String(label)}</text>
                      ))}
                    </svg>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px"}}>
                    {[
                      {icon:"💧",color:C4,title:"Nem",desc:"Higrometre ile olculur. Asiri isinma ve sogumayi engelleyerek sicaklik uzerinde etkilidir."},
                      {icon:"🌡️",color:"#0369a1",title:"Doyma Noktasi",desc:"Hava kutlesinin basincinda degisim olmaksizin doymasi icin sogumasi gereken sicaklik."},
                      {icon:"🌧️",color:C,title:"Yogusma & Yagis",desc:"Su buharinin sivi hale donmesidir. Yogusma, doyma noktasina ulasildiktan sonra gerceklesir."}, // Yoğuşma & Yağış
                    ].map(item=>(
                      <div key={item.title} style={{padding:"12px 14px",background:`${item.color}08`,border:`1px solid ${item.color}20`,borderRadius:"10px",textAlign:"center"}}>
                        <div style={{fontSize:"22px",marginBottom:"6px"}}>{item.icon}</div>
                        <div style={{fontSize:"12px",fontWeight:"800",color:item.color,marginBottom:"6px",fontFamily:FONT}}>{item.title}</div>
                        <p style={{fontSize:"11px",color:"#475569",lineHeight:"1.7",margin:0,fontFamily:FONT}}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AŞIRI HAVA */}
              {sec==="asiri" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"16px"}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px"}}>
                      <span style={{fontSize:"28px"}}>⚡</span> {/* Aşırı Hava Olayları */}
                      <div>
                        <div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Asiri Hava Olaylari</div>
                        <div style={{fontSize:"13px",color:C5,fontWeight:"600",fontFamily:FONT}}>Normal kosullarin otesine gecen siddeti veya ani olaylar</div> {/* Normal koşulların ötesine geçen şiddeti veya ani olaylar */}
                      </div>
                    </div>
                    <div style={{height:"2px",background:`linear-gradient(90deg,${C5},transparent)`,opacity:0.35,borderRadius:"2px"}}/>
                  </div>
                  <div style={{padding:"16px 20px",background:`${C5}0a`,border:`1.5px solid ${C5}22`,borderRadius:"12px"}}>
                    <p style={{fontSize:"14px",color:"#94a3b8",lineHeight:"1.95",margin:0,fontFamily:FONT}}>
                      Asiri hava olaylari; sicaklik, yagis, ruzgar hizi, basinc gibi hava olaylarinki <strong style={{color:C5}}>uc degerler nedeniyle olusan</strong> ve ciddi maddi hasara, can kayiplarina neden olabilen meteorolojik olaylardir.
                    </p> {/* Olay kartları */}
                  </div>
                  {/* Olay kartları */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px"}}>
                    {ASIRI_OLAYLAR.map(olay=>(
                      <button key={olay.id} onClick={()=>{sndClick();setActiveAsiri(olay.id);}}
                        style={{padding:"12px",background:activeAsiri===olay.id?`${olay.color}20`:`${olay.color}08`,border:`1.5px solid ${activeAsiri===olay.id?olay.color:`${olay.color}25`}`,borderRadius:"10px",cursor:"pointer",textAlign:"center",fontFamily:FONT,transition:"all 0.2s"}}>
                        <div style={{fontSize:"24px",marginBottom:"5px"}}>{olay.icon}</div>
                        <div style={{fontSize:"11px",fontWeight:"800",color:activeAsiri===olay.id?olay.color:"#475569"}}>{olay.ad}</div>
                      </button>
                    ))}
                  </div>
                  {/* Seçili olay detayı */}
                  {(() => {
                    const olay=ASIRI_OLAYLAR.find(o=>o.id===activeAsiri);
                    if(!olay)return null;
                    return(
                      <div style={{padding:"16px 18px",background:`${olay.color}0d`,border:`1.5px solid ${olay.color}28`,borderRadius:"12px",animation:"fadeUp 0.2s ease"}}>
                        <div style={{display:"flex",gap:"10px",alignItems:"flex-start",marginBottom:"10px"}}> {/* Başlıca Etkileri */}
                          <span style={{fontSize:"26px"}}>{olay.icon}</span>
                          <div style={{fontSize:"15px",fontWeight:"800",color:olay.color,fontFamily:FONT}}>{olay.ad}</div>
                        </div>
                        <p style={{fontSize:"13px",color:"#94a3b8",lineHeight:"1.85",margin:"0 0 12px",fontFamily:FONT}}>{olay.tanim}</p>
                        <div style={{fontSize:"11px",color:olay.color,letterSpacing:"1.5px",fontWeight:"800",marginBottom:"8px",fontFamily:FONT}}>BASLICA ETKILERI</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px"}}>
                          {olay.etkiler.map(etki=>(
                            <div key={etki} style={{padding:"6px 9px",background:"rgba(0,0,0,0.2)",borderRadius:"6px",borderLeft:`2px solid ${olay.color}60`,fontSize:"12px",color:"#475569",fontFamily:FONT}}>{etki}</div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  {/* Türkiye istatistik */} {/* Türkiye 2023 — Rekor Seviyeye Ulaşan Aşırı Hava Olayları */}
                  <div style={{padding:"14px 16px",background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"10px"}}> {/* Türkiye 2023 — Rekor Seviyeye Ulaşan Aşırı Hava Olayları */}
                    <div style={{fontSize:"11px",color:C5,letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT}}>TURKIYE 2023 — REKOR SEIYEYE ULASAN ASIRI HAVA OLAYLARI</div> {/* Türkiye 2023 — Rekor Seviyeye Ulaşan Aşırı Hava Olayları */}
                    <div style={{display:"flex",gap:"12px",alignItems:"center",flexWrap:"wrap"}}> {/* 2023 toplam olay, bir yıllık artış */}
                      <div style={{padding:"12px 16px",background:"rgba(239,68,68,0.1)",border:"1.5px solid rgba(239,68,68,0.3)",borderRadius:"9px",textAlign:"center",minWidth:"100px"}}>
                        <div style={{fontSize:"28px",fontWeight:"800",color:C5,fontFamily:MONO}}>1475</div>
                        <div style={{fontSize:"11px",color:"#94a3b8",fontFamily:FONT}}>2023 toplam olay</div>
                      </div>
                      <div style={{padding:"12px 16px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"9px",textAlign:"center",minWidth:"100px"}}>
                        <div style={{fontSize:"28px",fontWeight:"800",color:"#f97316",fontFamily:MONO}}>%45</div>
                        <div style={{fontSize:"11px",color:"#94a3b8",fontFamily:FONT}}>bir yillik artis</div>
                      </div>
                      <p style={{fontSize:"12px",color:"#64748b",lineHeight:"1.75",margin:0,fontFamily:FONT,flex:1,minWidth:"180px"}}>
                        Turkiye de asiri hava olaylarinin sayisi son alti yildir surekli artmaktadir. Bu artis; kuresel iklim degisikligi ve insan faaliyetleriyle iliksilidir.
                      </p> {/* Türkiye'de aşırı hava olayları artışı */}
                    </div>
                  </div>
                </div>
              )}

              {/* HALK METEOROLOJİSİ */}
              {sec==="halk" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"16px"}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px"}}>
                      <span style={{fontSize:"28px"}}>🌾</span> {/* Halk Meteorolojisi & Halk Takvimi */}
                      <div>
                        <div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Halk Meteorolojisi & Halk Takvimi</div>
                        <div style={{fontSize:"13px",color:"#a78bfa",fontWeight:"600",fontFamily:FONT}}>Yerel bilgi · Gozlem · Deneyim</div> {/* Yerel bilgi · Gözlem · Deneyim */}
                      </div>
                    </div>
                    <div style={{height:"2px",background:"linear-gradient(90deg,#a78bfa,transparent)",opacity:0.35,borderRadius:"2px"}}/>
                  </div>
                  <div style={{padding:"16px 20px",background:"rgba(167,139,250,0.08)",border:"1.5px solid rgba(167,139,250,0.22)",borderRadius:"12px"}}>
                    <p style={{fontSize:"14px",color:"#94a3b8",lineHeight:"1.95",margin:0,fontFamily:FONT}}>
                      <strong style={{color:"#a78bfa"}}>Halk meteorolojisi</strong>, hava olaylarini halkin cografi ve kulturel bilgisi dogrultusunda ele alan yerel hava durumu tahminleridir. Teknolojinin yeterli olmadigi donemde <strong style={{color:"#e2e8f0"}}>tarim ve hayvancilik</strong> faaliyetlerindeki belirsizligi ortadan kaldirarak ortaya cikmiştir.
                    </p> {/* Halk meteorolojisi tanımı */}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                    {[
                      {icon:"👁️",color:"#a78bfa",title:"Dogayi Gozlemlemek","desc":"Ruzgarin elis yonu, bulutlar, bitkiler, hayvanlar ve gok cisimlerine bakarak hava tahminleri yapilmistir."},
                      {icon:"📅",color:"#0ea5e9",title:"Halk Takvimi","desc":"Yillar boyunca elde edilen bilgilerle olusturulan, yaşanilan yere ait yerel bilgiyi iceren zaman cizgisidir."},
                      {icon:"🌾",color:"#34d399",title:"Pratik Zaman Siniflandirmasi","desc":"Cografi kosullara gore pratik zaman siniflandirmasi yapilarak gunluk hayat duzenlenmistir."}, // Pratik Zaman Sınıflandırması
                      {icon:"🌿",color:"#f97316",title:"Dogayla Uyum","desc":"Insanlar dogal cevrelerinin dinamigini anlayip onunla uyumlu yasamaya calismislardir."},
                    ].map(item=>(
                      <div key={item.title} style={{padding:"12px 14px",background:`${item.color}08`,border:`1px solid ${item.color}20`,borderRadius:"10px",display:"flex",gap:"9px",alignItems:"flex-start"}}>
                        <span style={{fontSize:"20px",flexShrink:0}}>{item.icon}</span>
                        <div>
                          <div style={{fontSize:"12px",fontWeight:"800",color:item.color,fontFamily:FONT,marginBottom:"4px"}}>{item.title}</div>
                          <p style={{fontSize:"12px",color:"#475569",lineHeight:"1.7",margin:0,fontFamily:FONT}}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{padding:"14px 16px",background:"rgba(0,0,0,0.25)",border:"1px solid rgba(167,139,250,0.15)",borderRadius:"10px"}}> {/* Halk Meteorolojisi Örnek Gözlemler */}
                    <div style={{fontSize:"11px",color:"#a78bfa",letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT}}>HALK METEOROLOJISI ORNEK GOZLEMLER</div> {/* Halk Meteorolojisi Örnek Gözlemler */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
                      {[["Kuzeyden esen ruzgar","Soguk ve kar haber veriyor"],["Gunbatiminda kizillik","Ertesi gun gunesli olabilir"],["Karincalar yuvaya don","Yagmur yaklasiyor"],["Ay etrafinda hale","Yagisli hava yaklasiyor"]].map(([olay,anlam])=>( // Kuzeyden esen rüzgar, Soğuk ve kar haber veriyor, Günbatımında kızıllık, Ertesi gün güneşli olabilir, Karıncalar yuvaya dön, Yağmur yaklaşıyor, Ay etrafında hale, Yağışlı hava yaklaşıyor
                        <div key={olay} style={{padding:"8px 10px",background:"rgba(167,139,250,0.06)",borderRadius:"7px",borderLeft:"2px solid rgba(167,139,250,0.4)"}}>
                          <div style={{fontSize:"11px",color:"#a78bfa",fontWeight:"700",fontFamily:FONT}}>{olay}</div>
                          <div style={{fontSize:"11px",color:"#475569",fontFamily:FONT,marginTop:"2px"}}>{anlam}</div>
                        </div>
                      ))} 
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ── ETKİNLİK ── */}
        {tab==="act" && (
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            {/* Aktivite sekme seçici */}
            <div style={{display:"flex",gap:"3px",padding:"12px 20px",borderBottom:`1px solid ${C}12`,background:"rgba(2,5,12,0.6)",flexShrink:0}}>
              {[{id:"basinc" as const,icon:"🌀",label:"Basinc Merkezleri"},{id:"ruzgar" as const,icon:"🌹",label:"Ruzgar Gulu"}].map(t=>( // Basınç Merkezleri, Rüzgar Gülü
                <button key={t.id} onClick={()=>{sndClick();setActTab(t.id);}}
                  style={{padding:"7px 16px",borderRadius:"7px",border:"none",cursor:"pointer",fontFamily:FONT,fontSize:"12px",fontWeight:"700",background:actTab===t.id?C:"transparent",color:actTab===t.id?"#fff":"#475569",transition:"all 0.18s"}}>
                  {t.icon} {t.label} 
                </button>
              ))}
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"24px 28px",background:`radial-gradient(ellipse at 5% 5%,${C}05 0%,${BG} 60%)`}}>
              {actTab==="basinc" && <BasincAktivite/>}
              {actTab==="ruzgar" && (
                <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
                  <div> {/* Rüzgar Gülü İnceleme */}
                    <div style={{fontSize:"10px",color:C,letterSpacing:"3px",fontWeight:"800",fontFamily:MONO,marginBottom:"4px"}}>ETKİNLİK 2</div>
                    <div style={{fontSize:"17px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>🌹 Ruzgar Gulu Inceleme</div> {/* Rüzgar Gülü İnceleme */}
                    <div style={{fontSize:"12px",color:"#475569",marginTop:"3px",fontFamily:FONT}}>Bir yerlesim merkezinin ruzgar frekansi gulunu incele ve hakim ruzgar yonunu bul</div> {/* Bir yerleşim merkezinin rüzgar frekansı gülünü incele ve hakim rüzgar yönünü bul */}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"16px",alignItems:"start"}}>
                    <div style={{padding:"14px",background:"rgba(0,0,0,0.3)",border:`1px solid ${C}20`,borderRadius:"12px"}}>
                      <div style={{fontSize:"11px",color:C,letterSpacing:"1.5px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT,textAlign:"center"}}>RUZGAR FREKANSI GULU</div>
                      <RuzgarGulu freq={RUZGAR_FREQ_ANKARA} labels={YONLER_EN}/>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                      <div style={{padding:"14px 16px",background:`${C}0a`,border:`1.5px solid ${C}22`,borderRadius:"11px"}}> {/* Rüzgar Frekansı Değerleri (Gün) */}
                        <div style={{fontSize:"12px",color:C,fontWeight:"800",marginBottom:"8px",fontFamily:FONT}}>Ruzgar Frekansi Degerleri (Gun)</div>
                        {RUZGAR_YONLER.map((y,i)=>(
                          <div key={y} style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"5px"}}>
                            <div style={{width:"80px",fontSize:"12px",color:"#94a3b8",fontFamily:FONT}}>{y}</div>
                            <div style={{flex:1,background:`${C}15`,borderRadius:"3px",height:"10px",overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${(RUZGAR_FREQ_ANKARA[i]/90)*100}%`,background:C,borderRadius:"3px",transition:"width 0.5s"}}/>
                            </div>
                            <div style={{width:"32px",fontSize:"12px",fontWeight:"800",color:C,fontFamily:MONO,textAlign:"right"}}>{RUZGAR_FREQ_ANKARA[i]}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{padding:"12px 16px",background:`${C}08`,border:`1px solid ${C}18`,borderRadius:"10px",fontSize:"13px",fontFamily:FONT}}> {/* Analiz Soruları */}
                        <div style={{color:C,fontWeight:"800",marginBottom:"6px"}}>Analiz Sorulari</div> {/* Analiz Soruları */}
                        {["Bu yerlesim merkezinin hakim ruzgar yonu hangi yondur? Kac gun esmistir?","Kuzey ruzgari icin esme frekansi 90 gunken; guney ruzgari kac gun esmistir?","Bir fabrika kurmak isteseydiniz, yerlesim merkezine gore hangi yonde kurardiniz?"].map((soru,i)=>( // Bu yerleşim merkezinin hakim rüzgar yönü hangi yöndür? Kaç gün esmiştir? Kuzey rüzgarı için esme frekansı 90 günken; güney rüzgarı kaç gün esmiştir? Bir fabrika kurmak isteseydiniz, yerleşim merkezine göre hangi yönde kurardınız?
                          <div key={i} style={{marginBottom:"8px",paddingLeft:"10px",borderLeft:`2px solid ${C}40`,fontSize:"12px",color:"#64748b",lineHeight:"1.7"}}>{i+1}. {soru}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TEST ── */}
        {tab==="test" && (
          <div style={{flex:1,display:"flex",overflow:"hidden"}}>
            <TestTab/>
          </div>
        )}

      </div>
    </div>
  );
}