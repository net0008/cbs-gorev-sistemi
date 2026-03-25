'use client';
import { useState, useRef, useEffect, useCallback } from "react";
import { FONT_SANS, FONT_MONO, BG_DARK, COLOR_CBS, COLOR_UA, COLOR_GPS, PANEL_DARK } from "./theme";

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

type MainTab = "learn" | "act" | "test";
type LearnSec = "cbs" | "ua" | "gps";

// ─── TEST VERİLERİ ─────────────────────────────────────────────────────────
interface QItem { q: string; opts: string[]; correct: number; exp: string; cat: "cbs"|"ua"|"gps"; }
const TEST_ITEMS: QItem[] = [
  { cat:"cbs", q:"CBS'nin temel bileşenlerinden biri DEĞİLDİR?",
    opts:["Kullanıcı","Donanım","Uydu anteni","Yazılım"], correct:2,
    exp:"CBS'nin 5 temel bileşeni şunlardır: Kullanıcı, Veri, Donanım, Yazılım, Yöntem. 'Uydu anteni' CBS'nin bir bileşeni değildir; GPS sisteminin parçasıdır." },
  { cat:"cbs", q:"CBS'de farklı coğrafi unsurlara ait bilgiler nasıl haritalanır?",
    opts:["Tek bir katmanda birleştirilir","Ayrı katmanlar hâlinde haritalanır","Yalnızca sayısal verilerle gösterilir","Sadece 2D harita formatında gösterilir"], correct:1,
    exp:"CBS ile bir yerdeki farklı coğrafi unsurlara ait bilgiler (yükselti, arazi kullanımı, parsel, taşkın alanı vb.) ayrı katmanlar hâlinde haritalanabilir. Bu katmanlar üst üste getirilerek analiz yapılır." },
  { cat:"cbs", q:"CBS'nin 'Yöntem' bileşeni ne işe yarar?",
    opts:["Harita çizmek için kullanılan donanımdır","Verilerin bilgiye dönüştürülme biçimini belirler","Kullanıcıların sisteme erişim yetkisini düzenler","Coğrafi koordinatları hesaplar"], correct:1,
    exp:"CBS'de Yöntem; veri toplama, depolama, analiz ve görüntülemenin nasıl olacağı ile ilgili kullanıcı tercihlerini içerir. Verileri bilgiye dönüştürmede kullanılan yaklaşımı tanımlar." },
  { cat:"ua", q:"Uzaktan algılamada uydular yalnızca görünür ışığı algılar. Bu ifade doğru mudur?",
    opts:["Evet, sadece görünür ışık algılanır","Hayır, kızılötesi ve morötesi ışınları da algılar","Evet, çünkü kameralar sadece görünür ışıkla çalışır","Hayır, sadece radar dalgalarını algılar"], correct:1,
    exp:"Uydular, görünür dalga boyunun yanında insan duyularının algılayamayacağı kızılötesi ve morötesi ışınları da algılama sistemleriyle donatılmıştır. Bu sayede bitkiler, sıcaklık, nem gibi veriler toplanabilir." },
  { cat:"ua", q:"Uzaktan algılama teknolojisiyle aşağıdakilerden hangisi takip EDİLEMEZ?",
    opts:["İklim değişikliği","Kentleşme","Bitki örtüsü dağılımı","Bir kişinin düşünceleri"], correct:3,
    exp:"Uzaktan algılama; sıcaklık, iklim değişikliği, kentleşme, bitki örtüsü, toprak nemi, arazi kullanımı gibi mekânsal verileri izleyebilir. Ancak bir kişinin düşünceleri gibi fiziksel olmayan veriler algılanamaz." },
  { cat:"ua", q:"Uzaktan algılamada mekânsal veri nasıl gösterilir?",
    opts:["Yalnızca tablo biçiminde","Grafik ve diyagramlarla","Nokta, çizgi veya alan olarak","Sadece metin formatında"], correct:2,
    exp:"Mekânsal veri; haritası oluşturulabilen, konumsal özelliğe sahip her türlü coğrafi veridir. Mekânsal veriler; nokta, çizgi veya alan olarak gösterilir." },
  { cat:"gps", q:"GPS sisteminin kaç temel bileşeni vardır?",
    opts:["İki (uydu + alıcı)","Dört","Üç (uydu + yer kontrol ağı + alıcı)","Beş"], correct:2,
    exp:"GPS'nin üç temel bileşeni vardır: 1) Uydu Ağı (radyo sinyali gönderir), 2) Yer Kontrol Ağı (uyduları izler ve yönlendirir), 3) GPS Alıcıları (koordinatları belirler)." },
  { cat:"gps", q:"GPS'in yer kontrol ağının temel amacı nedir?",
    opts:["Kullanıcılara konum verisi iletmek","Uyduların konumunu takip edip sistemin doğru çalışmasını sağlamak","Harita üretmek","CBS yazılımlarını güncellemek"], correct:1,
    exp:"Yer kontrol istasyonları, uyduların konumu ve hareketlerini takip ederek gerekli yönlendirmeleri yapar. Amaç, GPS uydularının kontrolünü yaparak sistemin hatasız çalışmasını sağlamaktır." },
  { cat:"gps", q:"GPS ile aşağıdakilerden hangisi ölçülemez?",
    opts:["Enlem ve boylam","Yükselti","Anlık hız","Hava sıcaklığı"], correct:3,
    exp:"GPS ile bir noktanın enlem, boylam ve yükselti bilgilerine ek olarak yerel saat bilgileri ve anlık hız bilgisi elde edilir. Hava sıcaklığı ölçmek için termometre gibi meteorolojik araçlar gerekir." },
  { cat:"gps", q:"Alzheimer hastasının kaybolma riskine karşı GPS nasıl kullanılabilir?",
    opts:["Haritada yeni yollar çizmek için","Hastanın üzerindeki cihazla konumunu sürekli takip etmek için","Hastaneye navigasyon sağlamak için","Hastanın tıbbi kayıtlarını depolamak için"], correct:1,
    exp:"GPS teknolojisi; insan, hayvan, araç veya nesnelerin hareketlerinin izlenmesinde kullanılabilir. Alzheimer hastasına takılan GPS cihazı, ailelerin hastanın konumunu sürekli izlemesine olanak tanır." },
];

// ─── Bartın Aktivite Verileri ───────────────────────────────────────────────
interface CbsComponent { id: string; label: string; color: string; description: string; example: string; }
const CBS_COMPONENTS: CbsComponent[] = [
  { id:"kullanici", label:"Kullanıcı",  color:COLOR_CBS,
    description:"CBS uygulamalarının başarısında bilgi ve becerisi önemli rol oynar; sistemi yönetir.",
    example:"Orman yangını risk haritasını oluşturan uzman coğrafyacılar ve CBS uzmanları" },
  { id:"veri",      label:"Veri",       color:"#60a5fa",
    description:"Doğru ve güncel veriler; uydu görüntüleri, hava fotoğrafları, anketler ve saha araştırmalarından elde edilir.",
    example:"Arazi kullanımı için uydu görüntüleri; sıcaklık ve nem için Meteoroloji Genel Müdürlüğü verileri" },
  { id:"donanim",   label:"Donanım",    color:"#f59e0b",
    description:"CBS'nin işlemesini sağlayan bilgisayar, tablet, yazıcı, tarayıcı gibi teknolojik araçların bütünüdür.",
    example:"Harita üretimi için kullanılan bilgisayar, CBS yazılımının kurulu olduğu sunucu" },
  { id:"yazilim",   label:"Yazılım",    color:"#a78bfa",
    description:"Coğrafi verileri işlemek, harita üretmek ve analiz yapmak için gereken programlardır.",
    example:"CBS yazılımıyla yakınlık analizi yapılması, analiz haritalarının elde edilmesi" },
  { id:"yontem",    label:"Yöntem",     color:"#34d399",
    description:"Verileri bilgiye dönüştürmede kullanılır; veri toplama, depolama, analiz ve görüntüleme tercihlerini kapsar.",
    example:"Yangın faktörlerinin belirlenmesi, haritaların üretilme sırası, katmanların birleştirilme yöntemi" },
];

// ─── ÖĞREN: CBS bileşenleri diyagramı ───────────────────────────────────────
function CbsDiagram() {
  const [active, setActive] = useState<string|null>(null);
  const comp = CBS_COMPONENTS.find(c => c.id === active);
  return (
    <div style={{ display:"flex", gap:"16px", alignItems:"flex-start" }}>
      {/* Diyagram */}
      <div style={{ width:"260px", flexShrink:0 }}>
        <svg viewBox="0 0 260 260" width="260" height="260">
          {/* Merkez */}
          <circle cx="130" cy="130" r="46" fill={`${COLOR_CBS}18`} stroke={COLOR_CBS} strokeWidth="2"/>
          <text x="130" y="126" textAnchor="middle" fontSize="11" fill={COLOR_CBS} fontFamily={FONT_SANS} fontWeight="800">CBS'nin</text>
          <text x="130" y="141" textAnchor="middle" fontSize="11" fill={COLOR_CBS} fontFamily={FONT_SANS} fontWeight="800">Bileşenleri</text>
          {/* 5 bileşen */}
          {CBS_COMPONENTS.map((comp, i) => {
            const angle = (i * 72 - 90) * Math.PI / 180;
            const cx = 130 + 95 * Math.cos(angle);
            const cy = 130 + 95 * Math.sin(angle);
            const isActive = active === comp.id;
            return (
              <g key={comp.id} onClick={() => { sndClick(); setActive(active === comp.id ? null : comp.id); }} style={{ cursor:"pointer" }}>
                <line x1="130" y1="130" x2={cx} y2={cy} stroke={`${comp.color}40`} strokeWidth="1.5" strokeDasharray="4,3"/>
                <circle cx={cx} cy={cy} r={isActive ? 30 : 26} fill={isActive ? `${comp.color}25` : `${comp.color}12`} stroke={comp.color} strokeWidth={isActive ? 2.5 : 1.5} style={{ transition:"all 0.2s" }}/>
                <text x={cx} y={cy+4} textAnchor="middle" fontSize="10" fill={comp.color} fontFamily={FONT_SANS} fontWeight="700">{comp.label}</text>
              </g>
            );
          })}
        </svg>
        <p style={{ fontSize:"11px", color:"#4a5568", textAlign:"center", fontFamily:FONT_SANS, marginTop:"4px" }}>Bileşene tıkla → ayrıntıları gör</p>
      </div>
      {/* Açıklama paneli */}
      <div style={{ flex:1 }}>
        {comp ? (
          <div style={{ padding:"18px 20px", background:`${comp.color}0d`, border:`1.5px solid ${comp.color}30`, borderRadius:"12px", animation:"fadeIn 0.2s ease" }}>
            <div style={{ fontSize:"14px", fontWeight:"800", color:comp.color, marginBottom:"10px", fontFamily:FONT_SANS, letterSpacing:"0.5px" }}>
              {comp.label}
            </div>
            <p style={{ fontSize:"13px", color:"#94a3b8", lineHeight:"1.85", margin:"0 0 12px", fontFamily:FONT_SANS }}>{comp.description}</p>
            <div style={{ padding:"10px 14px", background:"rgba(0,0,0,0.2)", borderRadius:"8px", borderLeft:`3px solid ${comp.color}` }}>
              <div style={{ fontSize:"10px", color:comp.color, fontWeight:"800", letterSpacing:"1.5px", marginBottom:"5px", fontFamily:FONT_SANS }}>BARTIN ÖRNEĞİ</div>
              <p style={{ fontSize:"12px", color:"#cbd5e1", lineHeight:"1.75", margin:0, fontFamily:FONT_SANS }}>{comp.example}</p>
            </div>
          </div>
        ) : (
          <div style={{ padding:"20px", background:"rgba(6,182,212,0.05)", border:"1.5px dashed rgba(6,182,212,0.2)", borderRadius:"12px", textAlign:"center" }}>
            <div style={{ fontSize:"28px", marginBottom:"10px" }}>🗺️</div>
            <p style={{ fontSize:"13px", color:"#4a5568", lineHeight:"1.8", fontFamily:FONT_SANS, margin:0 }}>
              Soldaki diyagramda bir bileşene tıklayarak<br/>açıklamasını ve Bartın orman yangını<br/>örneğindeki karşılığını öğren.
            </p>
          </div>
        )}
        {/* Tüm bileşenler özet */}
        <div style={{ marginTop:"12px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
          {CBS_COMPONENTS.map(c => (
            <button key={c.id} onClick={() => { sndClick(); setActive(active === c.id ? null : c.id); }}
              style={{ padding:"8px 12px", background:active===c.id?`${c.color}20`:"rgba(0,0,0,0.2)", border:`1.5px solid ${active===c.id?c.color:`${c.color}30`}`, borderRadius:"8px", cursor:"pointer", textAlign:"left", fontFamily:FONT_SANS, transition:"all 0.18s" }}>
              <span style={{ fontSize:"12px", fontWeight:"700", color:active===c.id?c.color:"#64748b" }}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ÖĞREN: GPS Diyagramı ───────────────────────────────────────────────────
function GpsDiagram() {
  const [active, setActive] = useState<number|null>(null);
  const parts = [
    { icon:"🛰️", label:"Uydu Ağı", color:"#f59e0b",
      desc:"Dünya yörüngesinde hareket eden uydular, kullanıcılara coğrafi konum ve yerel saat verisi içeren radyo sinyalleri iletir." },
    { icon:"📡", label:"Yer Kontrol Ağı", color:"#ef4444",
      desc:"Antenlerin bulunduğu izleme ve kontrol istasyonları uyduların gönderdiği radyo sinyallerini yakalar, uyduların konumu ve hareketlerini takip ederek yönlendirme yapar." },
    { icon:"📱", label:"GPS Alıcıları", color:COLOR_GPS,
      desc:"Saat, akıllı telefon, araç içi navigasyon, el tipi ve ayaklı cihazlar gibi farklı tiplerde geliştirilmiştir. Koordinatlar uydular tarafından belirlenir." },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px" }}>
        {parts.map((p,i)=>(
          <button key={i} onClick={()=>{ sndClick(); setActive(active===i?null:i); }}
            style={{ padding:"18px 14px", background:active===i?`${p.color}18`:`${p.color}08`, border:`2px solid ${active===i?p.color:`${p.color}30`}`, borderRadius:"12px", cursor:"pointer", textAlign:"center", fontFamily:FONT_SANS, transition:"all 0.2s" }}>
            <div style={{ fontSize:"26px", marginBottom:"8px" }}>{p.icon}</div>
            <div style={{ fontSize:"12px", fontWeight:"800", color:active===i?p.color:"#64748b" }}>{p.label}</div>
          </button>
        ))}
      </div>
      {/* Ok diyagramı */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", padding:"10px 0" }}>
        <div style={{ padding:"6px 12px", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:"6px", fontSize:"11px", color:"#f59e0b", fontFamily:FONT_SANS, fontWeight:"700" }}>🛰️ Uydu</div>
        <div style={{ fontSize:"14px", color:"#4a5568" }}>━━ sinyal ━━▶</div>
        <div style={{ padding:"6px 12px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"6px", fontSize:"11px", color:"#ef4444", fontFamily:FONT_SANS, fontWeight:"700" }}>📡 Yer İstasyonu</div>
        <div style={{ fontSize:"14px", color:"#4a5568" }}>━━ sinyal ━━▶</div>
        <div style={{ padding:"6px 12px", background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.3)", borderRadius:"6px", fontSize:"11px", color:COLOR_GPS, fontFamily:FONT_SANS, fontWeight:"700" }}>📱 Alıcı</div>
      </div>
      {active !== null && (
        <div style={{ padding:"16px 18px", background:`${parts[active].color}0d`, border:`1.5px solid ${parts[active].color}30`, borderRadius:"10px" }}>
          <div style={{ fontSize:"13px", fontWeight:"800", color:parts[active].color, marginBottom:"8px", fontFamily:FONT_SANS }}>{parts[active].icon} {parts[active].label}</div>
          <p style={{ fontSize:"13
        </div>
      )}
    </div>
  );
}

// ─── ETKİNLİK: Eşleştirme oyunu ────────────────────────────────────────────
interface MatchItem { id: string; text: string; category: "cbs"|"ua"|"gps"; catLabel: string; }
const MATCH_ITEMS: MatchItem[] = [
  { id:"m1",  text:"Donanım, yazılım, veri, kullanıcı ve yöntem bileşenlerinden oluşur",    category:"cbs", catLabel:"CBS" },
  { id:"m2",  text:"Farklı coğrafi unsurları katmanlar hâlinde haritalayabilir",              category:"cbs", catLabel:"CBS" },
  { id:"m3",  text:"Kızılötesi ve morötesi ışınları algılayan uydular kullanır",              category:"ua",  catLabel:"Uzaktan Algılama" },
  { id:"m4",  text:"Uydu görüntüleri ile arazi kullanımı ve bitki türleri sınıflandırılır",  category:"ua",  catLabel:"Uzaktan Algılama" },
  { id:"m5",  text:"Uydu ağı, yer kontrol ağı ve alıcılar olmak üzere 3 bileşeni vardır",   category:"gps", catLabel:"GPS" },
  { id:"m6",  text:"Navigasyon, araç takip ve arama-kurtarma gibi alanlarda kullanılır",     category:"gps", catLabel:"GPS" },
  { id:"m7",  text:"Enlem, boylam, yükselti ve yerel saat bilgisi verir",                    category:"gps", catLabel:"GPS" },
  { id:"m8",  text:"Mekânsal sorgulama ve yakınlık analizi yapılabilir",                     category:"cbs", catLabel:"CBS" },
];
const CATS = [
  { id:"cbs", label:"CBS",                color:C_CBS },
  { id:"ua",  label:"Uzaktan Algılama",   color:C_UA  },
  { id:"gps", label:"GPS",                color:C_GPS },
];

function MatchGame() {
  const [shuffled] = useState<MatchItem[]>(()=>{
    const a=[...MATCH_ITEMS];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  });
  const [placed, setPlaced] = useState<Record<string,string>>({});
  const [wrong,  setWrong]  = useState<Record<string,boolean>>({});
  const [dragId, setDragId] = useState<string|null>(null);
  const [hovCat, setHovCat] = useState<string|null>(null);
  const [score,  setScore]  = useState(0);
  const [done,   setDone]   = useState(false);

  const doDrop = (catId: string) => {
    if (!dragId) return;
    const item = shuffled.find(m => m.id === dragId);
    if (!item || placed[dragId]) return;
    const ok = item.category === catId;
    if (ok) { sndOK(); setScore(s=>s+1); } else sndFail();
    const np = {...placed,[dragId]:catId};
    const nw = {...wrong,[dragId]:!ok};
    setPlaced(np); setWrong(nw); setDragId(null); setHovCat(null);
    if (Object.keys(np).length === shuffled.length) setTimeout(()=>setDone(true),400);
  };

  const retry = () => { setPlaced({}); setWrong({}); setScore(0); setDone(false); setDragId(null); };

  if (done) return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px",padding:"40px 20px",textAlign:"center" }}>
      <div style={{ fontSize:"48px" }}>🎯</div>
      <div style={{ fontSize:"24px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT }}>Eşleştirme Tamamlandı!</div>
      <div style={{ fontSize:"44px",fontWeight:"800",color:C_CBS,fontFamily:MONO }}>{score}/{shuffled.length}</div>
      <div style={{ fontSize:"14px",color:"#64748b",fontFamily:FONT }}>doğru eşleştirme</div>
      <button onClick={retry} style={{ padding:"12px 28px",background:`linear-gradient(90deg,#0e7490,${C_CBS})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT }}>🔄 Tekrar Oyna</button>
    </div>
  );

  const pending = shuffled.filter(m=>!placed[m.id]);
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:"16px" }}>
      <div>
        <div style={{ fontSize:"10px",color:C_CBS,letterSpacing:"3px",fontWeight:"800",fontFamily:MONO,marginBottom:"4px" }}>ETKİNLİK</div>
        <div style={{ fontSize:"17px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT }}>🔗 Teknolojileri Eşleştir</div>
        <div style={{ fontSize:"12px",color:"#4a5568",marginTop:"3px",fontFamily:FONT }}>Her ifadeyi doğru teknoloji kategorisine sürükle bırak</div>
      </div>

      {/* Sürüklenecek kartlar */}
      <div style={{ padding:"14px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"12px",minHeight:"52px" }}>
        <div style={{ fontSize:"10px",color:"#4a5568",letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT }}>EŞLEŞTİRİLECEK İFADELER</div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:"7px" }}>
          {pending.map(item=>(
            <div key={item.id} draggable
              onDragStart={e=>{setDragId(item.id);e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",item.id);}}
              onDragEnd={()=>{setDragId(null);setHovCat(null);}}
              style={{ padding:"8px 12px",background:dragId===item.id?"rgba(6,182,212,0.15)":"rgba(0,0,0,0.4)",border:`1.5px solid ${dragId===item.id?C_CBS:"rgba(255,255,255,0.1)"}`,borderRadius:"8px",cursor:"grab",fontSize:"12px",fontWeight:"600",color:"#cbd5e1",fontFamily:FONT,lineHeight:"1.5",maxWidth:"280px",opacity:dragId===item.id?0.5:1,userSelect:"none",WebkitUserSelect:"none" }}>
              {item.text}
            </div>
          ))}
          {shuffled.filter(m=>placed[m.id]).map(item=>(
            <div key={item.id}
              style={{ padding:"8px 12px",background:wrong[item.id]?"rgba(239,68,68,0.08)":"rgba(52,211,153,0.08)",border:`1.5px solid ${wrong[item.id]?"#ef444430":"#34d39930"}`,borderRadius:"8px",fontSize:"12px",fontWeight:"600",color:wrong[item.id]?"#ef4444":"#34d399",fontFamily:FONT,lineHeight:"1.5",maxWidth:"280px",opacity:0.65 }}>
              {wrong[item.id]?"✗ ":"✓ "}{item.text.substring(0,40)}...
            </div>
          ))}
        </div>
      </div>

      {/* Kategori kutuları */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px" }}>
        {CATS.map(cat=>(
          <div key={cat.id}
            onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect="move";setHovCat(cat.id);}}
            onDragLeave={()=>setHovCat(null)}
            onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("text/plain");if(id){setDragId(id);setTimeout(()=>doDrop(cat.id),0);}else doDrop(cat.id);}}
            style={{ minHeight:"140px",padding:"14px",background:hovCat===cat.id?`${cat.color}18`:`${cat.color}08`,border:`2px ${hovCat===cat.id?"solid":"dashed"} ${cat.color}${hovCat===cat.id?"80":"35"}`,borderRadius:"12px",transition:"all 0.2s" }}>
            <div style={{ fontSize:"13px",fontWeight:"800",color:cat.color,marginBottom:"10px",fontFamily:FONT }}>{cat.label}</div>
            <div style={{ display:"flex",flexDirection:"column",gap:"5px" }}>
              {shuffled.filter(m=>placed[m.id]===cat.id).map(item=>(
                <div key={item.id} style={{ padding:"6px 9px",background:wrong[item.id]?"rgba(239,68,68,0.12)":"rgba(52,211,153,0.12)",border:`1px solid ${wrong[item.id]?"#ef444440":"#34d39940"}`,borderRadius:"6px",fontSize:"11px",color:wrong[item.id]?"#ef4444":"#34d399",fontWeight:"600",lineHeight:"1.5",fontFamily:FONT }}>
                  {wrong[item.id]?"✗ ":"✓ "}{item.text.substring(0,45)}...
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding:"9px 14px",background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"8px",display:"flex",justifyContent:"space-between" }}>
        <span style={{ fontSize:"12px",color:"#4a5568",fontFamily:FONT }}>Kalan: {pending.length} kart</span>
        <span style={{ fontSize:"14px",fontWeight:"800",color:C_CBS,fontFamily:MONO }}>{score} doğru</span>
      </div>
    </div>
  );
}

// ─── TEST ───────────────────────────────────────────────────────────────────
function TestTab() {
  const [qIdx,setQIdx]=useState(0);
  const [sel,setSel]=useState<number|null>(null);
  const [score,setScore]=useState(0);
  const [answers,setAnswers]=useState<boolean[]>([]);
  const [done,setDone]=useState(false);
  const q=TEST_ITEMS[qIdx];
  const catColor = q.cat==="cbs"?C_CBS:q.cat==="ua"?C_UA:C_GPS;
  const catLabel = q.cat==="cbs"?"CBS":q.cat==="ua"?"Uzaktan Algılama":"GPS";

  const handleAnswer=(i:number)=>{
    if(sel!==null)return;
    setSel(i);
    const ok=i===q.correct;
    if(ok){setScore(s=>s+10);sndOK();}else sndFail();
    setAnswers(a=>[...a,ok]);
  };
  const next=()=>{ sndClick(); if(qIdx>=TEST_ITEMS.length-1){setDone(true);return;} setQIdx(i=>i+1); setSel(null); };
  const retry=()=>{setQIdx(0);setSel(null);setScore(0);setAnswers([]);setDone(false);};

  if(done){
    const pct=Math.round((score/(TEST_ITEMS.length*10))*100);
    const cbsScore=TEST_ITEMS.filter((q,i)=>q.cat==="cbs"&&answers[i]).length;
    const uaScore=TEST_ITEMS.filter((q,i)=>q.cat==="ua"&&answers[i]).length;
    const gpsScore=TEST_ITEMS.filter((q,i)=>q.cat==="gps"&&answers[i]).length;
    return(
      <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"18px",padding:"32px 24px",textAlign:"center" }}>
        <div style={{ fontSize:"52px" }}>🌍</div>
        <div style={{ fontSize:"26px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT }}>Test Tamamlandı!</div>
        <div style={{ fontSize:"50px",fontWeight:"800",color:pct>=80?C_GPS:pct>=50?"#f59e0b":"#ef4444",fontFamily:MONO }}>{score} PUAN</div>
        <div style={{ fontSize:"14px",color:"#64748b",fontFamily:FONT }}>{answers.filter(Boolean).length}/{TEST_ITEMS.length} doğru · %{pct}</div>
        {/* Kategori bazlı skor */}
        <div style={{ display:"flex",gap:"10px" }}>
          {[{label:"CBS",score:cbsScore,total:4,color:C_CBS},{label:"Uzak. Alg.",score:uaScore,total:3,color:C_UA},{label:"GPS",score:gpsScore,total:3,color:C_GPS}].map(c=>(
            <div key={c.label} style={{ padding:"12px 16px",background:`${c.color}10`,border:`1.5px solid ${c.color}30`,borderRadius:"10px",textAlign:"center" }}>
              <div style={{ fontSize:"13px",fontWeight:"800",color:c.color,fontFamily:FONT }}>{c.label}</div>
              <div style={{ fontSize:"20px",fontWeight:"800",color:c.color,fontFamily:MONO }}>{c.score}/{c.total}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize:"14px",color:"#64748b",maxWidth:"400px",lineHeight:"1.8",fontFamily:FONT }}>
          {pct>=80?"🏆 Mükemmel! Mekânsal bilgi teknolojilerini çok iyi öğrendin.":pct>=50?"👍 İyi! Öğren sekmesini tekrar inceleyebilirsin.":"📚 Öğren sekmesinden tekrar başlayabilirsin."}
        </div>
        <button onClick={retry} style={{ padding:"13px 30px",background:`linear-gradient(90deg,#0e7490,${C_CBS})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT }}>🔄 Tekrar Dene</button>
      </div>
    );
  }

  return(
    <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
      {/* Sol liste */}
      <div style={{ width:"220px",flexShrink:0,borderRight:"1px solid rgba(255,255,255,0.05)",background:"rgba(3,6,15,0.6)",padding:"20px 14px",display:"flex",flexDirection:"column",gap:"6px",overflowY:"auto" }}>
        <div style={{ fontSize:"11px",letterSpacing:"2px",color:"#4a5568",fontWeight:"800",fontFamily:FONT,marginBottom:"4px" }}>SORULAR</div>
        {TEST_ITEMS.map((_,i)=>{
          const d=i<answers.length,cur=i===qIdx;
          const cc=TEST_ITEMS[i].cat==="cbs"?C_CBS:TEST_ITEMS[i].cat==="ua"?C_UA:C_GPS;
          return(
            <div key={i} style={{ display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",background:cur?`${cc}10`:"rgba(0,0,0,0.15)",border:`1.5px solid ${cur?cc:d?(answers[i]?"rgba(52,211,153,0.3)":"rgba(239,68,68,0.3)"):"rgba(255,255,255,0.04)"}`,borderRadius:"7px" }}>
              <div style={{ width:"20px",height:"20px",borderRadius:"50%",background:d?(answers[i]?"#34d399":"#ef4444"):cur?cc:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"800",color:"#fff",flexShrink:0,fontFamily:MONO }}>
                {d?(answers[i]?"✓":"✗"):i+1}
              </div>
              <div>
                <div style={{ fontSize:"10px",fontWeight:"700",color:cur?cc:"#334155",fontFamily:FONT }}>Soru {i+1}</div>
                <div style={{ fontSize:"10px",color:cur?`${cc}90`:"#1e293b",fontFamily:FONT }}>{TEST_ITEMS[i].cat.toUpperCase()}</div>
              </div>
            </div>
          );
        })}
        <div style={{ marginTop:"auto",padding:"12px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"9px",textAlign:"center" }}>
          <div style={{ fontSize:"11px",color:"#334155",fontWeight:"700",fontFamily:FONT,marginBottom:"4px" }}>PUAN</div>
          <div style={{ fontSize:"30px",fontWeight:"800",color:C_CBS,fontFamily:MONO }}>{score}</div>
          <div style={{ fontSize:"11px",color:"#334155",fontFamily:FONT }}>/ {TEST_ITEMS.length*10}</div>
        </div>
      </div>

      {/* Soru alanı */}
      <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"28px 36px",overflowY:"auto",gap:"18px" }}>
        {/* İlerleme */}
        <div style={{ width:"100%",maxWidth:"640px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:"8px" }}>
              <span style={{ fontSize:"11px",color:"#4a5568",fontWeight:"700",fontFamily:FONT }}>SORU {qIdx+1}/{TEST_ITEMS.length}</span>
              <span style={{ padding:"2px 8px",background:`${catColor}18`,border:`1px solid ${catColor}40`,borderRadius:"4px",fontSize:"10px",fontWeight:"800",color:catColor,fontFamily:FONT }}>{catLabel}</span>
            </div>
            <span style={{ fontSize:"11px",color:"#4a5568",fontFamily:FONT }}>{Math.round((qIdx/TEST_ITEMS.length)*100)}%</span>
          </div>
          <div style={{ height:"4px",background:"rgba(255,255,255,0.06)",borderRadius:"2px",overflow:"hidden" }}>
            <div style={{ height:"100%",width:`${(qIdx/TEST_ITEMS.length)*100}%`,background:`linear-gradient(90deg,#0e7490,${catColor})`,borderRadius:"2px",transition:"width 0.4s" }}/>
          </div>
        </div>

        {/* Soru */}
        <div style={{ maxWidth:"640px",width:"100%",padding:"22px 24px",background:`${catColor}08`,border:`1.5px solid ${catColor}20`,borderRadius:"14px" }}>
          <p style={{ fontSize:"15px",color:"#e2e8f0",lineHeight:"1.9",margin:0,fontWeight:"600",fontFamily:FONT }}>{q.q}</p>
        </div>

        {/* Seçenekler */}
        <div style={{ maxWidth:"640px",width:"100%",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"9px" }}>
          {q.opts.map((opt,i)=>{
            const isSel=sel===i,isCorr=i===q.correct,show=sel!==null;
            let bg="rgba(0,0,0,0.25)",border="rgba(255,255,255,0.07)",color="#64748b";
            if(show){if(isCorr){bg="#34d39912";border="#34d399";color="#34d399";}else if(isSel){bg="rgba(239,68,68,0.1)";border="#ef4444";color="#ef4444";}}
            return(
              <button key={i} onClick={()=>handleAnswer(i)} disabled={sel!==null}
                style={{ padding:"13px 15px",background:bg,border:`2px solid ${border}`,borderRadius:"10px",cursor:sel!==null?"default":"pointer",fontFamily:FONT,textAlign:"left",transition:"all 0.18s" }}>
                <div style={{ display:"flex",alignItems:"flex-start",gap:"9px" }}>
                  <span style={{ width:"22px",height:"22px",borderRadius:"50%",background:show&&isCorr?"#34d399":show&&isSel?"#ef4444":`${catColor}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"800",color:show?"#fff":"#94a3b8",flexShrink:0,marginTop:"1px",fontFamily:MONO }}>
                    {show&&isCorr?"✓":show&&isSel&&!isCorr?"✗":String.fromCharCode(65+i)}
                  </span>
                  <span style={{ fontSize:"13px",color,fontWeight:"600",lineHeight:"1.6",fontFamily:FONT }}>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Açıklama */}
        {sel!==null&&(
          <div style={{ maxWidth:"640px",width:"100%",padding:"15px 18px",background:sel===q.correct?"rgba(52,211,153,0.07)":"rgba(239,68,68,0.07)",border:`1.5px solid ${sel===q.correct?"rgba(52,211,153,0.25)":"rgba(239,68,68,0.25)"}`,borderRadius:"12px" }}>
            <div style={{ fontSize:"14px",fontWeight:"800",color:sel===q.correct?"#34d399":"#ef4444",marginBottom:"8px",fontFamily:FONT }}>{sel===q.correct?"✅ DOĞRU!":"❌ YANLIŞ!"}</div>
            <p style={{ fontSize:"13px",color:"#64748b",lineHeight:"1.85",margin:0,fontFamily:FONT }}>{q.exp}</p>
          </div>
        )}

        {sel!==null&&(
          <button onClick={next} style={{ padding:"12px 34px",background:`linear-gradient(90deg,#0e7490,${C_CBS})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";}}>
            {qIdx>=TEST_ITEMS.length-1?"🏁 Sonuçları Gör":"⏭ Sonraki Soru"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ANA BİLEŞEN ────────────────────────────────────────────────────────────
export default function MekanBilgiActivity({ onClose }: { onClose: () => void }) {
  const [tab,      setTab]     = useState<MainTab>("learn");
  const [learnSec, setLearnSec]= useState<LearnSec>("cbs");

  const TABS: { id: MainTab; icon: string; label: string }[] = [
    { id:"learn", icon:"📖", label:"ÖĞREN" },
    { id:"act",   icon:"🔗", label:"ETKİNLİK" },
    { id:"test",  icon:"✏️", label:"TEST" },
  ];

  const SECTIONS: { id: LearnSec; icon: string; label: string; color: string; sub: string }[] = [
    { id:"cbs", icon:"🗺️", label:"Coğrafi Bilgi Sistemleri",  color:C_CBS,  sub:"Bileşenler & Avantajlar" },
    { id:"ua",  icon:"🛰️", label:"Uzaktan Algılama",           color:C_UA,   sub:"Uydu Teknolojisi" },
    { id:"gps", icon:"📡", label:"GPS",                        color:C_GPS,  sub:"Küresel Konumlandırma" },
  ];

  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,background:BG,display:"flex",flexDirection:"column",fontFamily:FONT,userSelect:"none",WebkitUserSelect:"none" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Üst bar */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",height:"64px",borderBottom:"1px solid rgba(6,182,212,0.15)",background:"rgba(3,6,15,0.9)",flexShrink:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:"24px" }}>
          <div>
            <div style={{ fontSize:"10px",letterSpacing:"4px",color:C_CBS,opacity:0.6,fontFamily:MONO }}>MEKÂNSAL BİLGİ TEKNOLOJİLERİ</div>
            <div style={{ fontSize:"19px",fontWeight:"800",color:"#e2e8f0",letterSpacing:"0.3px" }}>CBS · Uzaktan Algılama · GPS</div>
          </div>
          <div style={{ display:"flex",gap:"3px",background:"rgba(0,0,0,0.4)",padding:"4px",borderRadius:"10px" }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>{sndClick();setTab(t.id);}}
                style={{ padding:"7px 18px",borderRadius:"7px",border:"none",cursor:"pointer",fontFamily:FONT,fontSize:"12px",fontWeight:"700",transition:"all 0.18s",background:tab===t.id?C_CBS:"transparent",color:tab===t.id?"#fff":"#334155" }}>
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

        {/* ─ ÖĞREN ─ */}
        {tab==="learn" && (
          <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
            {/* Sol panel */}
            <div style={{ width:"260px",flexShrink:0,borderRight:"1px solid rgba(6,182,212,0.1)",background:C_PANEL,overflowY:"auto",padding:"20px 14px" }}>
              <div style={{ fontSize:"11px",letterSpacing:"2px",color:"#334155",fontWeight:"800",fontFamily:FONT,marginBottom:"12px" }}>KONULAR</div>
              <div style={{ display:"flex",flexDirection:"column",gap:"8px" }}>
                {SECTIONS.map(s=>(
                  <button key={s.id} onClick={()=>{sndClick();setLearnSec(s.id);}}
                    style={{ padding:"13px 14px",background:learnSec===s.id?`${s.color}14`:"rgba(0,0,0,0.2)",border:`2px solid ${learnSec===s.id?s.color:"rgba(255,255,255,0.04)"}`,borderRadius:"10px",cursor:"pointer",textAlign:"left",fontFamily:FONT,transition:"all 0.18s" }}>
                    <div style={{ fontSize:"20px",marginBottom:"5px" }}>{s.icon}</div>
                    <div style={{ fontSize:"13px",fontWeight:"800",color:learnSec===s.id?s.color:"#334155" }}>{s.label}</div>
                    <div style={{ fontSize:"11px",color:learnSec===s.id?`${s.color}80`:"#1e293b",marginTop:"2px" }}>{s.sub}</div>
                  </button>
                ))}
              </div>

              <div style={{ height:"1px",background:"rgba(6,182,212,0.1)",margin:"20px 0" }} />
              <div style={{ fontSize:"11px",letterSpacing:"2px",color:"#334155",fontWeight:"800",fontFamily:FONT,marginBottom:"10px" }}>HIZLI ÖZET</div>
              <div style={{ display:"flex",flexDirection:"column",gap:"6px" }}>
                {[["CBS","5 bileşen — K/V/D/Y/Y",C_CBS],["Uzaktan Alg.","Uydu + ışın algılama",C_UA],["GPS","3 bileşen — U/YK/A",C_GPS]].map(([k,v,c])=>(
                  <div key={k} style={{ padding:"8px 10px",background:"rgba(0,0,0,0.2)",borderRadius:"7px",borderLeft:`3px solid ${c}` }}>
                    <div style={{ fontSize:"11px",color:String(c),fontWeight:"800",fontFamily:FONT }}>{k}</div>
                    <div style={{ fontSize:"11px",color:"#334155",fontFamily:FONT,marginTop:"2px" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sağ içerik */}
            <div style={{ flex:1,overflowY:"auto",padding:"28px 32px",display:"flex",flexDirection:"column",gap:"20px" }}>

              {learnSec==="cbs" && <>
                {/* Başlık */}
                <div>
                  <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px" }}>
                    <span style={{ fontSize:"30px" }}>🗺️</span>
                    <div>
                      <div style={{ fontSize:"22px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT }}>Coğrafi Bilgi Sistemleri</div>
                      <div style={{ fontSize:"13px",color:C_CBS,fontWeight:"600",fontFamily:FONT }}>CBS — Mekânsal verinin dijital yönetimi</div>
                    </div>
                  </div>
                  <div style={{ height:"2px",background:`linear-gradient(90deg,${C_CBS},transparent)`,opacity:0.4,borderRadius:"2px" }} />
                </div>

                {/* Tanım */}
                <div style={{ padding:"18px 22px",background:`${C_CBS}0a`,border:`1.5px solid ${C_CBS}22`,borderRadius:"14px" }}>
                  <p style={{ fontSize:"14px",color:"#94a3b8",lineHeight:"1.95",margin:0,fontFamily:FONT }}>
                    <strong style={{ color:C_CBS }}>Coğrafi Bilgi Sistemleri (CBS);</strong> doğal ortam, insan ve zaman ilişkisine ait veri toplama, depolama ve analiz çalışmalarıyla elde edilen mekânsal bilgilerin <strong style={{ color:"#e2e8f0" }}>harita, tablo veya grafiklerle görüntülenmesine</strong> imkân sağlayan bilgisayar tabanlı bilgi yönetimidir.
                  </p>
                </div>

                {/* Avantajlar */}
                <div>
                  <div style={{ fontSize:"12px",color:C_CBS,letterSpacing:"2px",fontWeight:"800",marginBottom:"12px",fontFamily:FONT }}>CBS'NİN BAŞLICA AVANTAJLARI</div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px" }}>
                    {[
                      ["⚡","Veri toplama daha hızlı","Bilgi yönetimi kolaylaşır"],
                      ["🔗","Mekânsal & sözel veri","Birlikte kullanılabilir"],
                      ["📐","Uzunluk, alan, eğim","Ölçümleri doğru yapılır"],
                      ["🕐","Zaman serisi","Değişimler izlenebilir"],
                      ["🔄","Harita güncelleme","Kolaylıkla yapılabilir"],
                      ["🌐","Dijital paylaşım","Ürünler hızlıca yayılır"],
                    ].map(([icon,title,sub])=>(
                      <div key={title} style={{ padding:"12px 14px",background:`${C_CBS}08`,border:`1px solid ${C_CBS}15`,borderRadius:"9px",display:"flex",gap:"10px",alignItems:"flex-start" }}>
                        <span style={{ fontSize:"18px",flexShrink:0 }}>{icon}</span>
                        <div>
                          <div style={{ fontSize:"12px",fontWeight:"700",color:"#94a3b8",fontFamily:FONT }}>{title}</div>
                          <div style={{ fontSize:"11px",color:"#334155",fontFamily:FONT,marginTop:"2px" }}>{sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CBS Bileşenleri diyagramı */}
                <div>
                  <div style={{ fontSize:"12px",color:C_CBS,letterSpacing:"2px",fontWeight:"800",marginBottom:"12px",fontFamily:FONT }}>CBS BİLEŞENLERİ — Tıkla & İncele</div>
                  <CbsDiagram />
                </div>

                {/* Bartın vaka */}
                <div style={{ padding:"18px 20px",background:"rgba(6,182,212,0.05)",border:"1.5px solid rgba(6,182,212,0.15)",borderRadius:"14px" }}>
                  <div style={{ fontSize:"12px",color:C_CBS,letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT }}>🔥 GERÇEK HAYAT ÖRNEĞİ — BARTIN ORMAN YANGINI RİSK ANALİZİ</div>
                  <p style={{ fontSize:"13px",color:"#64748b",lineHeight:"1.9",margin:"0 0 12px",fontFamily:FONT }}>
                    Bartın'da orman yangını açısından riskli alanların belirlenmesi amacıyla CBS'den yararlanılmıştır. Yangını etkileyen faktörler (arazi kullanımı, yükseklik, eğim, bakı, sıcaklık, nem) ve acil durum müdahalelerine yakınlık verileri toplanmıştır.
                  </p>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px" }}>
                    {[["Arazi Kullanımı","Uydu görüntüsü","🛰️"],["Sıcaklık & Nem","Meteoroloji","🌡️"],["Risk Haritası","CBS yazılımı","🗺️"]].map(([title,src,icon])=>(
                      <div key={title} style={{ padding:"10px",background:"rgba(0,0,0,0.25)",borderRadius:"8px",textAlign:"center" }}>
                        <div style={{ fontSize:"20px",marginBottom:"4px" }}>{icon}</div>
                        <div style={{ fontSize:"11px",fontWeight:"700",color:"#94a3b8",fontFamily:FONT }}>{title}</div>
                        <div style={{ fontSize:"10px",color:"#334155",fontFamily:FONT }}>{src}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>}

              {learnSec==="ua" && <>
                <div>
                  <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px" }}>
                    <span style={{ fontSize:"30px" }}>🛰️</span>
                    <div>
                      <div style={{ fontSize:"22px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT }}>Uzaktan Algılama</div>
                      <div style={{ fontSize:"13px",color:C_UA,fontWeight:"600",fontFamily:FONT }}>Dünya'yı Uzaydan Haritalamak</div>
                    </div>
                  </div>
                  <div style={{ height:"2px",background:`linear-gradient(90deg,${C_UA},transparent)`,opacity:0.4,borderRadius:"2px" }} />
                </div>

                <div style={{ padding:"18px 22px",background:`${C_UA}0a`,border:`1.5px solid ${C_UA}22`,borderRadius:"14px" }}>
                  <p style={{ fontSize:"14px",color:"#94a3b8",lineHeight:"1.95",margin:0,fontFamily:FONT }}>
                    Uydular; <strong style={{ color:C_UA }}>görünür dalga boyunun yanında kızılötesi ve morötesi ışınları</strong> algılama sistemleriyle donatılmıştır. Bu sayede insan gözünün algılayamayacağı veriler toplanarak farklı haritalar üretilir.
                  </p>
                </div>

                {/* Uydu veri akışı */}
                <div>
                  <div style={{ fontSize:"12px",color:C_UA,letterSpacing:"2px",fontWeight:"800",marginBottom:"12px",fontFamily:FONT }}>UZAKTAN ALGILAMA SÜRECİ</div>
                  <div style={{ display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",justifyContent:"center" }}>
                    {[["🌍","Dünya'dan yansıyan elektromanyetik dalgalar"],["→",null],["🛰️","Uydu algılar"],["→",null],["💻","Bilgisayara aktarılır"],["→",null],["🗺️","Harita üretilir"]].map(([icon,desc],i)=>(
                      desc ? (
                        <div key={i} style={{ padding:"12px 14px",background:`${C_UA}0a`,border:`1px solid ${C_UA}20`,borderRadius:"10px",textAlign:"center",minWidth:"90px" }}>
                          <div style={{ fontSize:"22px",marginBottom:"5px" }}>{icon}</div>
                          <div style={{ fontSize:"10px",color:"#64748b",fontFamily:FONT,lineHeight:"1.5" }}>{desc}</div>
                        </div>
                      ) : (
                        <div key={i} style={{ fontSize:"20px",color:"#334155" }}>→</div>
                      )
                    ))}
                  </div>
                </div>

                {/* Veri türleri */}
                <div>
                  <div style={{ fontSize:"12px",color:C_UA,letterSpacing:"2px",fontWeight:"800",marginBottom:"12px",fontFamily:FONT }}>UYDU İLE TOPLANAN VERİLER</div>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px" }}>
                    {[["🌡️","Sıcaklık"],["🏭","Atmosfer kirliliği"],["🌊","Deniz suyu tuzluluğu"],["🌿","Bitki örtüsü"],["🏔️","Yer şekilleri"],["💧","Toprak nemi"],["🏙️","Kentleşme"],["🌾","Tarım alanları"],["📈","İklim değişikliği"]].map(([icon,label])=>(
                      <div key={label} style={{ padding:"10px",background:`${C_UA}08`,border:`1px solid ${C_UA}18`,borderRadius:"8px",display:"flex",gap:"8px",alignItems:"center" }}>
                        <span style={{ fontSize:"16px" }}>{icon}</span>
                        <span style={{ fontSize:"11px",fontWeight:"700",color:"#64748b",fontFamily:FONT }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mekânsal veri kutusu */}
                <div style={{ padding:"16px 20px",background:`${C_UA}0a`,border:`1.5px solid ${C_UA}20`,borderRadius:"12px" }}>
                  <div style={{ fontSize:"12px",color:C_UA,letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT }}>MEKÂNSAL VERİ NEDİR?</div>
                  <p style={{ fontSize:"13px",color:"#64748b",lineHeight:"1.85",margin:"0 0 12px",fontFamily:FONT }}>
                    Haritası oluşturulabilen, konumsal özelliğe sahip her türlü coğrafi veridir.
                  </p>
                  <div style={{ display:"flex",gap:"10px" }}>
                    {[["📍","Nokta","Kent merkezi, dağ zirvesi"],["📏","Çizgi","Yol, nehir, sınır"],["⬛","Alan","Orman, göl, tarım arazisi"]].map(([icon,title,ex])=>(
                      <div key={title} style={{ flex:1,padding:"12px",background:"rgba(0,0,0,0.2)",borderRadius:"8px",textAlign:"center" }}>
                        <div style={{ fontSize:"20px",marginBottom:"5px" }}>{icon}</div>
                        <div style={{ fontSize:"12px",fontWeight:"800",color:C_UA,fontFamily:FONT }}>{title}</div>
                        <div style={{ fontSize:"10px",color:"#334155",fontFamily:FONT,marginTop:"3px" }}>{ex}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>}

              {learnSec==="gps" && <>
                <div>
                  <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px" }}>
                    <span style={{ fontSize:"30px" }}>📡</span>
                    <div>
                      <div style={{ fontSize:"22px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT }}>Küresel Konumlandırma Sistemi</div>
                      <div style={{ fontSize:"13px",color:C_GPS,fontWeight:"600",fontFamily:FONT }}>GPS — Her yerde, her zaman</div>
                    </div>
                  </div>
                  <div style={{ height:"2px",background:`linear-gradient(90deg,${C_GPS},transparent)`,opacity:0.4,borderRadius:"2px" }} />
                </div>

                <div style={{ padding:"18px 22px",background:`${C_GPS}0a`,border:`1.5px solid ${C_GPS}22`,borderRadius:"14px" }}>
                  <p style={{ fontSize:"14px",color:"#94a3b8",lineHeight:"1.95",margin:0,fontFamily:FONT }}>
                    <strong style={{ color:C_GPS }}>GPS (Küresel Konumlandırma Sistemi);</strong> uydu teknolojisi kullanılarak canlı veya nesnelere ait coğrafi koordinatlara dayalı konum belirlemeyi sağlar. Her türlü hava koşulunda ve dünyanın her yerinde <strong style={{ color:"#e2e8f0" }}>24 saat</strong> çalışır.
                  </p>
                </div>

                {/* Bileşenler */}
                <div>
                  <div style={{ fontSize:"12px",color:C_GPS,letterSpacing:"2px",fontWeight:"800",marginBottom:"12px",fontFamily:FONT }}>GPS'NİN 3 BİLEŞENİ — Tıkla & İncele</div>
                  <GpsDiagram />
                </div>

                {/* GPS ile bilgilere ulaş */}
                <div>
                  <div style={{ fontSize:"12px",color:C_GPS,letterSpacing:"2px",fontWeight:"800",marginBottom:"12px",fontFamily:FONT }}>GPS İLE HANGİ BİLGİLERE ULAŞILIR?</div>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"8px" }}>
                    {[["🌐","Enlem & Boylam","Yatay konum bilgisi"],["⛰️","Yükselti","Denizden yükseklik"],["🕐","Yerel Saat","Hassas zaman bilgisi"],["⚡","Anlık Hız","Atomik saatlerden hesaplanır"]].map(([icon,title,sub])=>(
                      <div key={title} style={{ padding:"12px 14px",background:`${C_GPS}08`,border:`1px solid ${C_GPS}18`,borderRadius:"9px",display:"flex",gap:"10px",alignItems:"center" }}>
                        <span style={{ fontSize:"22px",flexShrink:0 }}>{icon}</span>
                        <div>
                          <div style={{ fontSize:"12px",fontWeight:"800",color:C_GPS,fontFamily:FONT }}>{title}</div>
                          <div style={{ fontSize:"11px",color:"#334155",fontFamily:FONT,marginTop:"2px" }}>{sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kullanım alanları */}
                <div>
                  <div style={{ fontSize:"12px",color:C_GPS,letterSpacing:"2px",fontWeight:"800",marginBottom:"12px",fontFamily:FONT }}>GPS KULLANIM ALANLARI</div>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px" }}>
                    {[["🚗","Navigasyon","Araç içi yön bulma"],["✈️","Havacılık","Uçak güzergâhı"],["🚢","Denizcilik","Gemi konum takibi"],["🔍","Arama-Kurtarma","Kayıp kişi bulma"],["🐾","Yaban Hayatı","Göç izleme"],["🏦","ATM","Konuma dayalı finans"],["📡","İHA","İnsansız hava araçları"],["🏗️","Altyapı","Yerel yönetim hizmetleri"],["🧭","Harita Yapımı","Coğrafi unsur ekleme"]].map(([icon,title,sub])=>(
                      <div key={title} style={{ padding:"10px",background:`${C_GPS}08`,border:`1px solid ${C_GPS}15`,borderRadius:"8px",textAlign:"center" }}>
                        <div style={{ fontSize:"18px",marginBottom:"3px" }}>{icon}</div>
                        <div style={{ fontSize:"11px",fontWeight:"700",color:C_GPS,fontFamily:FONT }}>{title}</div>
                        <div style={{ fontSize:"10px",color:"#1e293b",fontFamily:FONT,marginTop:"2px" }}>{sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>}
            </div>
          </div>
        )}

        {/* ─ ETKİNLİK ─ */}
        {tab==="act" && (
          <div style={{ flex:1,overflowY:"auto",padding:"24px",display:"flex",flexDirection:"column",gap:"16px" }}>
            <MatchGame />
          </div>
        )}

        {/* ─ TEST ─ */}
        {tab==="test" && (
          <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
            <TestTab />
          </div>
        )}
      </div>
    </div>
  );
}