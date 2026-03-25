"use client";
import { useState, useEffect } from "react";
import { FONT_SANS, FONT_MONO, BG_DARK, COLOR_SUCCESS, COLOR_ACCENT, COLOR_ERROR, COLOR_UA, COLOR_CBS, COLOR_BLUE, COLOR_PINK } from "./theme";


const BG = BG_DARK;

const FONT = FONT_SANS;
const MONO = FONT_MONO;

const C_GREEN = COLOR_SUCCESS;

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
const sndOK    = () => [440,554,660].forEach((f,i) => setTimeout(() => beep(f,0.22,"sine",0.14), i*80));
const sndFail  = () => beep(200,0.32,"sawtooth",0.12);
const sndClick = () => beep(700,0.07,"square",0.07);

// ─── Tipler ──────────────────────────────────────────────────────────────────
type Phase = "learn" | "test";

interface MapType {
  id: string;
  no: number;
  name: string;
  color: string;
  icon: string;
  tagline: string;
  description: string;
  features: string[];
  examples: string[];
  notFor: string;
}

interface TestQuestion {
  q: string;
  opts: string[];
  correct: number;
  exp: string;
  type: "identify" | "usage" | "compare";
}

// ─── Veri ────────────────────────────────────────────────────────────────────
const MAP_TYPES: MapType[] = [
  {
    id: "korokromatik", no: 1, name: "Korokromatik Harita", color: "#10b981", icon: "🎨",
    tagline: "Alansal dağılış — renk ve desen",
    description: "Yayılış alanları gösterilmek istenen coğrafi bir unsurun farklı renk veya desenlerle ifade edildiği tematik haritalardır. Yoğunluk veya miktar belirtmez; sadece 'nerede var, nerede yok' sorusunu yanıtlar.",
    features: ["Alansal dağılışı gösterir","Renk veya desen kullanılır","Yoğunluk/miktar belirtmez","Sınırlar belirgindir"],
    examples: ["Dünyadaki kömür yataklarının dağılışı","Türkiye'deki toprak türleri","Büyükşehir belediyesine sahip iller","Efes Antik Kenti yapı dağılışı","İklim bölgeleri haritası"],
    notFor: "Sayısal değerleri veya miktarları karşılaştırmak",
  },
  {
    id: "koroplet", no: 2, name: "Koroplet Harita", color: "#3b82f6", icon: "📊",
    tagline: "Sayısal değere göre dereceli renk",
    description: "Belirli sınırlar içindeki bölgelerin bir coğrafi unsura ait sayısal değerlere göre renk veya desenlerle gösterildiği nicel haritalardır. Miktar veya yoğunluğa bağlı dereceli renklendirme yapılır.",
    features: ["Nicel (ölçülebilir) veriler kullanılır","Dereceli renklendirme yapılır","Sınırlara (ülke, il, ilçe) göre gruplanır","İstatistiksel değişkenleri gösterir"],
    examples: ["İllere göre mısır üretimi (TÜİK 2023)","Ülkelere göre nüfus yoğunluğu","Kişi başına düşen gelir haritası","Kaygıyla baş etmede aile desteği oranı (Wellcome 2020)"],
    notFor: "Nokta ya da çizgi verilerini göstermek",
  },
  {
    id: "izoplet", no: 3, name: "İzoplet / İzometrik Harita", color: COLOR_UA, icon: "〰️",
    tagline: "Eşit değerleri birleştiren hatlar",
    description: "Belirli bir ögenin eşit yoğunluk veya dağılım değerlerinin birleştirilmesiyle oluşan hatların gösterildiği tematik haritalardır. İzometrik haritalarda aletle ölçülen değerler (yükselti, sıcaklık, yağış) kullanılır.",
    features: ["Eşdeğer noktalar çizgiyle birleştirilir","Sürekli alan verisi kabul edilir","Hatlar arası alanlar benzer değerleri gösterir","Hem doğal hem beşerî veriler için kullanılır"],
    examples: ["İzohips (eş yükselti) haritası","İzoterm (eş sıcaklık) haritası","İzobar (eş basınç) — hava durumu","İzobat (eş derinlik)","Eğirdir Gölü nitrit azotu kirlilik haritası"],
    notFor: "Sınırlarla ayrılmış bölge verilerini göstermek",
  },
  {
    id: "noktalama", no: 4, name: "Noktalama Haritası", color: COLOR_ACCENT, icon: "⚫",
    tagline: "Her nokta belirli bir miktarı temsil eder",
    description: "Mekânsal bir verinin dağılışını göstermek için sembollerin (daire, kare, üçgen vb.) kullanıldığı haritalardır. Harita üzerindeki her bir nokta belirli bir miktarı temsil eder. Nokta yoğunluğu = veri yoğunluğu.",
    features: ["Her nokta belirli miktarı temsil eder","Daire, kare, üçgen gibi semboller kullanılır","Yoğun nokta = yoğun dağılış","Görsel olarak kolayca okunur"],
    examples: ["Dünya nüfus dağılışı (1 nokta = 1 milyon kişi)","Dr. John Snow'un 1854 kolera salgını haritası","Tarımsal üretim noktaları","Liman ve havalimanı konumları"],
    notFor: "Kesin sayısal değerleri göstermek",
  },
  {
    id: "oransal", no: 5, name: "Oransal Sembol Haritası", color: COLOR_ERROR, icon: "🔵",
    tagline: "Büyüklük = değer miktarı",
    description: "Bir konuya ait verilerin ölçeklendirilmiş sembol ya da şekillerle gösterildiği haritalardır. Gösterilmek istenen coğrafi unsurun değerine göre sembolün boyutu değişir. En yaygın sembol dairedir.",
    features: ["Sembol boyutu veriyle orantılıdır","Daire, kare, çubuk veya ikon kullanılır","Değerler arasında görsel karşılaştırma sağlar","Konum ve miktar aynı anda gösterilir"],
    examples: ["KOP illerinde sulanan tarım alanı (2023)","Şehirlere göre nüfus büyüklüğü","Limanların yük kapasitesi","Ülkelere göre GSYH karşılaştırması"],
    notFor: "Yoğunluk veya dağılış alanı göstermek",
  },
  {
    id: "akis", no: 6, name: "Akış Haritası", color: COLOR_CBS, icon: "➡️",
    tagline: "Hareket, yön ve miktar",
    description: "Akım ya da dinamik haritalar olarak da adlandırılır. Bir coğrafi unsurun hareket miktarını ve yönünü gösterir. Oklar yönü, ok kalınlığı ise miktarı ifade eder.",
    features: ["Hareket/göç yönünü gösterir","Ok kalınlığı miktarı ifade eder","Başlangıç ve bitiş noktaları bellidir","Zamana bağlı değişimi aktarabilir"],
    examples: ["Göç haritaları","Balon balığının Akdeniz'e yayılışı","Malazgirt Savaşı ordu hareketleri","Ticaret yolları ve taşıma miktarları","Nehir debisi haritaları"],
    notFor: "Statik dağılış veya miktarları göstermek",
  },
  {
    id: "kartogram", no: 7, name: "Kartogram Harita", color: COLOR_PINK, icon: "🗂️",
    tagline: "Alan boyutu = istatistiksel değer",
    description: "Kartogram haritalarda kıta, ülke veya il alanı bir istatistiksel verinin değerine göre boyutlandırılıp gösterilir. Gerçek coğrafi alan değil, veri büyüklüğü ön plandadır.",
    features: ["Coğrafi alan veri değerine göre şekillenir","Sosyoekonomik değişkenler için idealdir","Gerçek coğrafi şekil bozulur","CBS ve bilgisayar teknolojileriyle yaygınlaşmıştır"],
    examples: ["Türkiye nüfus dağılışı kartogramı (2023)","Ülkelere göre GSYH kartogramı","Aşı oranlarına göre ülke büyüklüğü","CO₂ emisyonuna göre ülke boyutu"],
    notFor: "Coğrafi konumu veya gerçek alanı göstermek",
  },
];

const TEST_ITEMS: TestQuestion[] = [
  { type:"identify", q:"Türkiye'deki büyükşehir belediyesine sahip illerin haritada renk ile gösterildiği harita türü hangisidir?", opts:["Koroplet Harita","Korokromatik Harita","Kartogram Harita","Noktalama Haritası"], correct:1, exp:"Korokromatik harita, yayılış alanlarını renk veya desenle gösterir. Yoğunluk belirtmez; sadece 'nerede var?' sorusunu yanıtlar. Büyükşehir belediyeli iller için renk ayrımı yeterlidir." },
  { type:"usage",    q:"İllere göre mısır üretim miktarını (bin ton) haritada göstermek istiyorsunuz. Hangi yöntemi kullanırsınız?", opts:["Korokromatik","Akış Haritası","Koroplet Harita","İzoplet Harita"], correct:2, exp:"Koroplet harita, belirli sınırlar içinde sayısal değerleri dereceli renkle gösterir. İl sınırları içindeki üretim miktarı bu yöntemle en iyi ifade edilir." },
  { type:"identify", q:"Dr. John Snow'un 1854 kolera salgınında vaka adreslerini haritada göstermek için kullandığı yöntem hangisidir?", opts:["Kartogram","Oransal Sembol","Noktalama Haritası","Akış Haritası"], correct:2, exp:"Noktalama haritasında her nokta belirli miktarı (burada 1 kişiyi) temsil eder. Snow, vaka yoğunluğundan salgın kaynağını tespit etti — haritacılık tarihinin önemli dönüm noktalarından biridir." },
  { type:"usage",    q:"Eğirdir Gölü'nde farklı noktalarda ölçülen nitrit azotu değerlerini haritada göstermek için hangi yöntem kullanılmıştır?", opts:["Koroplet Harita","İzometrik Harita","Oransal Sembol","Korokromatik"], correct:1, exp:"İzometrik/izoplet haritalar, aletle ölçülen değerleri eşit değer hatlarıyla gösterir. Gölün farklı noktalarındaki nitrit değerleri bu yöntemle görselleştirilmiştir." },
  { type:"compare",  q:"Koroplet harita ile Korokromatik haritanın en temel farkı nedir?", opts:["Koroplet renk kullanmaz","Koroplet sayısal/nicel değerleri gösterir, Korokromatik sadece dağılış alanını","İkisi birbirinin aynısıdır","Korokromatik sayısal değerleri gösterir"], correct:1, exp:"Korokromatik harita 'var/yok' ayrımı yapar, miktar belirtmez. Koroplet ise dereceli renklendirmeyle sayısal değerleri (üretim, nüfus, gelir) gösterir." },
  { type:"identify", q:"Malazgirt Savaşı'nda Selçuklu ve Bizans ordularının hareketini göstermek için hangi harita türü kullanılmıştır?", opts:["Koroplet","Kartogram","Akış Haritası","Noktalama"], correct:2, exp:"Akış (akım) haritaları hareket, yön ve miktarı gösterir. Tarihi savaş harekâtlarının oklar aracılığıyla gösterilmesi bu yöntemin en yaygın kullanım alanlarından biridir." },
  { type:"usage",    q:"KOP (Konya Ovası Projesi) kapsamındaki illerde sulanan tarım alanı miktarını haritada göstermek için hangi yöntem kullanılır?", opts:["Akış Haritası","İzoplet Harita","Korokromatik","Oransal Sembol Haritası"], correct:3, exp:"Oransal sembol haritasında sembolün (genellikle daire) büyüklüğü veriyle orantılıdır. Konya'nın büyük dairesi en fazla sulanan alanı temsil eder." },
  { type:"compare",  q:"Türkiye nüfus dağılışını illere göre göstermek istiyorsunuz; illerin alanı nüfusla orantılı bozulacak. Bu hangi harita türüdür?", opts:["Koroplet","Noktalama","Akış","Kartogram"], correct:3, exp:"Kartogramda coğrafi alan veri değerine göre büyütülüp küçültülür. İstanbul'un büyük, kuzeydoğu illerinin küçük göründüğü nüfus kartogramı bunun en bilinen örneğidir." },
  { type:"identify", q:"İzohips, izoterm, izobar — bunların hepsi hangi harita türünün kapsamındadır?", opts:["Koroplet","Oransal Sembol","İzometrik/İzoplet Harita","Korokromatik"], correct:2, exp:"İzometrik haritalarda aletle ölçülen değerler (yükselti, sıcaklık, basınç) eşit değer hatlarıyla gösterilir. İzohips (eş yükselti), izoterm (eş sıcaklık), izobar (eş basınç) hepsi bu türün örnekleridir." },
  { type:"compare",  q:"Haritada sembol kullanılıyor ve sembolün büyüklüğü değerle doğru orantılı. Bu hangi yöntemdir?", opts:["Noktalama","Oransal Sembol","Kartogram","Akış"], correct:1, exp:"Oransal sembol haritasında sembol büyüklüğü veriyle orantılıdır (büyük daire = büyük değer). Noktalama haritasında ise sabit büyüklükte semboller kullanılır ve nokta sayısı değeri temsil eder." },
];

// ═══════════════════════════════════════════════════════════════════════════════
export default function MapTypesActivity({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("learn");
  const [selectedType, setSelectedType] = useState<MapType>(MAP_TYPES[0]);
  const [animIdx, setAnimIdx] = useState(0);

  // Sol panel animasyonu
  useEffect(() => {
    const id = setInterval(() => setAnimIdx(i => (i+1) % MAP_TYPES.length), 3000);
    return () => clearInterval(id);
  }, []);

  const TABS = [
    { id:"learn" as Phase, icon:"📖", label:"ÖĞREN"  },
    { id:"test"  as Phase, icon:"✏️", label:"TEST"   },
  ];

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:1000, background:BG_DARK, display:"flex", flexDirection:"column", fontFamily:FONT_SANS, touchAction:"none", userSelect:"none", WebkitUserSelect:"none" }}
      onWheel={e=>e.preventDefault()}
    >
      {/* Üst bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:"64px", borderBottom:"1px solid rgba(16,185,129,0.2)", background:"rgba(2,8,6,0.8)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"28px" }}>
          <div>
            <div style={{ fontSize:"10px", letterSpacing:"4px", color:COLOR_SUCCESS, opacity:0.6, fontFamily:FONT_MONO }}>HARİTA TÜRLERİ</div>
            <div style={{ fontSize:"20px", fontWeight:"800", color:"#d1fae5", letterSpacing:"-0.3px" }}>Dağılış & Tematik Haritalar</div>
          </div>
          <div style={{ display:"flex", gap:"3px", background:"rgba(0,0,0,0.4)", padding:"4px", borderRadius:"10px" }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>{sndClick();setPhase(t.id);}}
                style={{ padding:"8px 20px", borderRadius:"7px", border:"none", cursor:"pointer", fontFamily:FONT_SANS, fontSize:"12px", fontWeight:"700", letterSpacing:"0.5px", transition:"all 0.18s",
                  background: phase===t.id ? COLOR_SUCCESS : "transparent",
                  color:      phase===t.id ? "#000"   : "#1a6040" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose}
          style={{ padding:"8px 18px", background:"transparent", border:"1px solid rgba(255,80,80,0.3)", borderRadius:"8px", color:"#ff7070", fontSize:"12px", fontWeight:"700", cursor:"pointer", fontFamily:FONT_SANS }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,80,80,0.1)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
          ✕ KAPAT
        </button>
      </div>

      {/* İçerik */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", minHeight:0 }}>
        {phase==="learn" && <LearnPanel selected={selectedType} onSelect={t=>{sndClick();setSelectedType(t);}} />}
        {phase==="test"  && <TestPanel />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ÖĞREN PANELİ
// ═══════════════════════════════════════════════════════════════════════════════
function LearnPanel({ selected, onSelect }: { selected: MapType; onSelect: (t: MapType) => void }) {
  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

      {/* Sol: harita türü listesi */}
      <div style={{ width:"280px", flexShrink:0, borderRight:"1px solid rgba(16,185,129,0.12)", background:"rgba(2,10,6,0.6)", overflowY:"auto", padding:"20px 16px" }}>
        <div style={{ fontSize:"11px", letterSpacing:"2px", color:"#1a6040", fontWeight:"800", marginBottom:"14px", fontFamily:FONT_SANS }}>7 HARİTA TÜRÜ</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
          {MAP_TYPES.map(mt=>{
            const active = selected.id === mt.id;
            return (
              <button key={mt.id} onClick={()=>onSelect(mt)}
                style={{ padding:"12px 14px", background:active?`${mt.color}18`:"rgba(0,0,0,0.2)", border:`2px solid ${active?mt.color:"rgba(16,185,129,0.08)"}`, borderRadius:"10px", cursor:"pointer", textAlign:"left", fontFamily:FONT_SANS, transition:"all 0.18s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  <span style={{ fontSize:"20px", lineHeight:1 }}>{mt.icon}</span>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:"800", color:active?mt.color:"#1a5030" }}>{mt.no}. {mt.name.replace(" Haritası","").replace(" Harita","")}</div>
                    <div style={{ fontSize:"11px", color:active?`${mt.color}99`:"#0d3020", marginTop:"2px", fontWeight:"500" }}>{mt.tagline}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop:"20px", padding:"12px 14px", background:"rgba(16,185,129,0.05)", border:"1px solid rgba(16,185,129,0.1)", borderRadius:"8px" }}>
          <div style={{ fontSize:"11px", color:COLOR_SUCCESS, fontWeight:"800", marginBottom:"6px" }}>💡 BİLGİ</div>
          <p style={{ fontSize:"12px", color:"#1a5030", lineHeight:"1.7", margin:0 }}>Harita türü, görselleştirilmek istenen <strong style={{ color:COLOR_SUCCESS }}>veri türü</strong> ve iletilmek istenen <strong style={{ color:COLOR_SUCCESS }}>mesaja</strong> göre seçilir.</p>
        </div>
      </div>

      {/* Orta: detay bilgi */}
      <div style={{ flex:1, overflowY:"auto", padding:"28px 32px", display:"flex", flexDirection:"column", gap:"22px", background:`radial-gradient(ellipse at 20% 20%, ${selected.color}08 0%, ${BG_DARK} 60%)` }}>

        {/* Başlık */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"12px" }}>
            <span style={{ fontSize:"44px", lineHeight:1 }}>{selected.icon}</span>
            <div>
              <div style={{ fontSize:"11px", letterSpacing:"2px", color:selected.color, opacity:0.7, fontFamily:FONT_MONO }}>{selected.no}. HARİTA TÜRÜ</div>
              <div style={{ fontSize:"26px", fontWeight:"800", color:"#d1fae5" }}>{selected.name}</div>
              <div style={{ fontSize:"14px", color:selected.color, fontWeight:"600", marginTop:"3px" }}>{selected.tagline}</div>
            </div>
          </div>
          <div style={{ height:"2px", background:`linear-gradient(90deg,${selected.color},transparent)`, borderRadius:"2px", opacity:0.5 }} />
        </div>

        {/* Açıklama */}
        <div style={{ padding:"20px 24px", background:`${selected.color}0a`, border:`1.5px solid ${selected.color}22`, borderRadius:"14px" }}>
          <p style={{ fontSize:"15px", color:"#9de3c4", lineHeight:"1.9", margin:0, fontWeight:"500" }}>{selected.description}</p>
        </div>

        {/* Özellikler + Örnekler */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
          <div style={{ padding:"18px 20px", background:"rgba(0,0,0,0.3)", border:`1px solid ${selected.color}18`, borderRadius:"12px" }}>
            <div style={{ fontSize:"12px", color:selected.color, fontWeight:"800", letterSpacing:"1px", marginBottom:"12px", fontFamily:FONT_SANS }}>✓ ÖZELLİKLER</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {selected.features.map(f=>(
                <div key={f} style={{ display:"flex", gap:"8px", alignItems:"flex-start" }}>
                  <span style={{ color:selected.color, fontSize:"12px", fontWeight:"800", flexShrink:0, marginTop:"1px" }}>•</span>
                  <span style={{ fontSize:"13px", color:"#5a9070", lineHeight:"1.6", fontWeight:"500" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding:"18px 20px", background:"rgba(0,0,0,0.3)", border:`1px solid ${selected.color}18`, borderRadius:"12px" }}>
            <div style={{ fontSize:"12px", color:selected.color, fontWeight:"800", letterSpacing:"1px", marginBottom:"12px", fontFamily:FONT_SANS }}>📌 ÖRNEK KULLANIM</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {selected.examples.map(e=>(
                <div key={e} style={{ display:"flex", gap:"8px", alignItems:"flex-start" }}>
                  <span style={{ color:selected.color, fontSize:"12px", flexShrink:0, marginTop:"1px" }}>→</span>
                  <span style={{ fontSize:"13px", color:"#5a9070", lineHeight:"1.6", fontWeight:"500" }}>{e}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kullanılmaz */}
        <div style={{ padding:"14px 18px", background:"rgba(239,68,68,0.07)", border:"1.5px solid rgba(239,68,68,0.18)", borderRadius:"10px", display:"flex", alignItems:"flex-start", gap:"10px" }}>
          <span style={{ fontSize:"16px", flexShrink:0 }}>🚫</span>
          <div>
            <div style={{ fontSize:"12px", color:"#ef4444", fontWeight:"800", marginBottom:"4px" }}>BU YÖNTEM UYGUN DEĞİL</div>
            <p style={{ fontSize:"13px", color:"#7a2020", margin:0, lineHeight:"1.6" }}>{selected.notFor}</p>
          </div>
        </div>

        {/* SVG görsel temsil */}
        <MapTypeVisual type={selected} />
      </div>

      {/* Sağ: karşılaştırma tablosu */}
      <div style={{ width:"300px", flexShrink:0, borderLeft:"1px solid rgba(16,185,129,0.12)", background:"rgba(2,10,6,0.6)", overflowY:"auto", padding:"20px 16px" }}>
        <div style={{ fontSize:"11px", letterSpacing:"2px", color:"#1a6040", fontWeight:"800", marginBottom:"14px", fontFamily:FONT_SANS }}>KARŞILAŞTIRMA</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
          {[
            { label:"Veri türü",       vals:{korokromatik:"Alan",koroplet:"Nicel",izoplet:"Sürekli",noktalama:"Dağılış",oransal:"Miktar",akis:"Hareket",kartogram:"İstatistik"} },
            { label:"Miktar gösterir", vals:{korokromatik:"❌",koroplet:"✓",izoplet:"✓",noktalama:"~",oransal:"✓",akis:"✓",kartogram:"✓"} },
            { label:"Yön gösterir",    vals:{korokromatik:"❌",koroplet:"❌",izoplet:"❌",noktalama:"❌",oransal:"❌",akis:"✓",kartogram:"❌"} },
            { label:"Renk dereceli",   vals:{korokromatik:"~",koroplet:"✓",izoplet:"✓",noktalama:"❌",oransal:"❌",akis:"❌",kartogram:"~"} },
          ].map(row=>{
            const val = (row.vals as any)[selected.id] || "—";
            return (
              <div key={row.label} style={{ padding:"10px 12px", background:"rgba(0,0,0,0.2)", border:`1px solid ${val==="✓"?"rgba(16,185,129,0.25)":val==="❌"?"rgba(239,68,68,0.15)":"rgba(255,255,255,0.05)"}`, borderRadius:"8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:"12px", color:"#2a5040", fontWeight:"600" }}>{row.label}</span>
                <span style={{ fontSize:"13px", fontWeight:"800", color:val==="✓"?C_GREEN:val==="❌"?"#ef4444":selected.color }}>{val}</span>
              </div>
            );
          })}
        </div>

        <div style={{ height:"1px", background:"rgba(16,185,129,0.1)", margin:"18px 0" }} />

        <div style={{ fontSize:"11px", letterSpacing:"2px", color:"#1a6040", fontWeight:"800", marginBottom:"12px" }}>GÖSTERİM ŞEKLİ</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {[
            { sembol:"Nokta", ornekler:["Zirve","Su kuyusu","Şehir","Konut"] },
            { sembol:"Çizgi", ornekler:["Sınır","Yol","Akarsu","Fay hattı"] },
            { sembol:"Alan",  ornekler:["Ülke","Göl","Orman","Tarım alanı"] },
          ].map(s=>(
            <div key={s.sembol} style={{ padding:"10px 12px", background:"rgba(0,0,0,0.2)", border:"1px solid rgba(16,185,129,0.08)", borderRadius:"8px" }}>
              <div style={{ fontSize:"12px", color:COLOR_SUCCESS, fontWeight:"700", marginBottom:"5px" }}>{s.sembol}</div>
              <div style={{ fontSize:"11px", color:"#2a5040" }}>{s.ornekler.join(" · ")}</div>
            </div>
          ))}
        </div>

        <div style={{ height:"1px", background:"rgba(16,185,129,0.1)", margin:"18px 0" }} />
        <div style={{ fontSize:"11px", letterSpacing:"2px", color:"#1a6040", fontWeight:"800", marginBottom:"10px" }}>TÜM TÜRLER</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
          {MAP_TYPES.map(mt=>(
            <button key={mt.id} onClick={()=>onSelect(mt)}
              style={{ padding:"5px 10px", background:selected.id===mt.id?`${mt.color}20`:"rgba(0,0,0,0.2)", border:`1px solid ${selected.id===mt.id?mt.color:"rgba(16,185,129,0.1)"}`, borderRadius:"6px", cursor:"pointer", fontSize:"11px", color:selected.id===mt.id?mt.color:"#2a5040", fontWeight:"700", fontFamily:FONT_SANS }}>
              {mt.no}. {mt.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SVG görsel temsil ────────────────────────────────────────────────────────
function MapTypeVisual({ type }: { type: MapType }) {
  const W = 560, H = 200;
  const c = type.color;
  return (
    <div style={{ padding:"16px 20px", background:"rgba(0,0,0,0.25)", border:`1px solid ${c}15`, borderRadius:"12px" }}>
      <div style={{ fontSize:"11px", color:c, letterSpacing:"2px", fontWeight:"800", marginBottom:"12px", fontFamily:FONT_SANS }}>GÖRSEL TEMSİL</div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", maxWidth:W, display:"block" }}>
        {/* Arka plan */}
        <rect width={W} height={H} fill="rgba(0,0,0,0.2)" rx="8"/>

        {type.id==="korokromatik" && <>
          {/* Harita şablonu - basit bölgeler farklı renkle */}
          <path d="M40,40 Q120,30 200,50 Q280,40 360,60 Q420,50 480,70 L480,130 Q400,140 300,120 Q200,140 100,130 Q60,140 40,120 Z" fill={`${c}30`} stroke={c} strokeWidth="2"/>
          <path d="M140,40 Q180,60 160,100 Q140,130 100,130 Q60,140 40,120 L40,40 Z" fill={`${c}60`} stroke={c} strokeWidth="1.5"/>
          <path d="M280,40 Q360,60 380,110 Q360,140 300,120 Q250,130 230,100 Q240,70 280,40 Z" fill={`${c}45`} stroke={c} strokeWidth="1.5"/>
          <text x={70}  y={95}  textAnchor="middle" fontSize="11" fill={c} fontFamily="sans-serif" fontWeight="700">A</text>
          <text x={320} y={85}  textAnchor="middle" fontSize="11" fill={c} fontFamily="sans-serif" fontWeight="700">B</text>
          <text x={430} y={100} textAnchor="middle" fontSize="11" fill="#1a5030" fontFamily="sans-serif">C</text>
          {/* Lejant */}
          <rect x="330" y="140" width="14" height="14" fill={`${c}60`} stroke={c} strokeWidth="1"/>
          <rect x="360" y="140" width="14" height="14" fill={`${c}30`} stroke={c} strokeWidth="1"/>
          <rect x="390" y="140" width="14" height="14" fill="rgba(255,255,255,0.05)" stroke={c} strokeWidth="1"/>
          <text x="350" y="152" fontSize="10" fill="#5a9070" fontFamily="sans-serif">Tür A</text>
          <text x="380" y="152" fontSize="10" fill="#5a9070" fontFamily="sans-serif">Tür B</text>
          <text x="410" y="152" fontSize="10" fill="#5a9070" fontFamily="sans-serif">Tür C</text>
          <text x="40" y="175" fontSize="12" fill={c} fontFamily="sans-serif" fontWeight="700">Renk = Tür/Kategori (miktar yok)</text>
        </>}

        {type.id==="koroplet" && <>
          {/* 5 bölge, farklı ton */}
          {[[40,30,120,100,"#0a3020"],[160,30,130,100,"#1a6040"],[290,30,110,100,c],[400,30,100,100,`${c}cc`],[40,130,130,50,"#2a8060"],[170,130,120,50,`${c}88`],[290,130,150,50,`${c}55`],[440,130,80,50,"#0a3020"]].map(([x,y,w,h,fill],i)=>(
            <rect key={i} x={x as number} y={y as number} width={w as number} height={h as number} fill={fill as string} stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" rx="2"/>
          ))}
          {/* Lejant gradyan */}
          <defs><linearGradient id="coroGrad" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#0a3020"/><stop offset="100%" stopColor={c}/></linearGradient></defs>
          <rect x="40" y="188" width="200" height="8" fill="url(#coroGrad)" rx="4"/>
          <text x="40"  y="185" fontSize="10" fill="#3a7050" fontFamily="sans-serif">Az</text>
          <text x="220" y="185" fontSize="10" fill={c} fontFamily="sans-serif">Çok</text>
          <text x="280" y="196" fontSize="12" fill={c} fontFamily="sans-serif" fontWeight="700">Renk tonu = Miktar yoğunluğu</text>
        </>}

        {type.id==="izoplet" && <>
          {/* Konsantrik kontur çizgileri */}
          {[80,65,50,35,20].map((r,i)=>(
            <ellipse key={i} cx={200} cy={100} rx={r*3} ry={r*1.8} fill="none" stroke={c} strokeWidth={i===4?2.5:1.5} opacity={0.3+i*0.14}/>
          ))}
          {/* Değer etiketleri */}
          {[[200,40,"1000m"],[200,67,"800m"],[200,84,"600m"],[200,96,"400m"]].map(([x,y,lbl],i)=>(
            <text key={i} x={x as number} y={y as number} textAnchor="middle" fontSize="10" fill={c} fontFamily="sans-serif" opacity={0.7}>{lbl as string}</text>
          ))}
          {/* Sağ taraf — izoterm örneği */}
          <path d="M350,40 Q420,60 460,100 Q430,140 350,160 Q320,140 340,100 Q330,70 350,40" fill="none" stroke={`${c}bb`} strokeWidth="2" strokeDasharray="5,3"/>
          <path d="M380,50 Q430,75 450,100 Q420,130 380,145 Q360,125 370,100 Q365,75 380,50" fill="none" stroke={`${c}88`} strokeWidth="1.5" strokeDasharray="4,3"/>
          <text x="420" y="100" fontSize="11" fill={c} fontFamily="sans-serif">20°C</text>
          <text x="395" y="100" fontSize="11" fill={`${c}aa`} fontFamily="sans-serif">18°C</text>
          <text x="130" y="178" fontSize="12" fill={c} fontFamily="sans-serif" fontWeight="700">Eşit değer noktaları birleştirilir</text>
        </>}

        {type.id==="noktalama" && <>
          {/* Ülke sınırı */}
          <path d="M40,60 Q150,40 280,50 Q380,45 480,70 L480,150 Q380,160 280,145 Q150,160 40,140 Z" fill="rgba(16,185,129,0.05)" stroke={`${c}40`} strokeWidth="1.5"/>
          {/* Noktalar - yoğunluk batıda fazla */}
          {[
            [80,80],[90,95],[75,110],[100,85],[110,100],[120,90],[95,115],[85,125],
            [140,70],[150,85],[160,75],[145,100],[155,110],[170,90],
            [200,80],[210,95],[220,85],[205,110],[215,120],[230,100],
            [260,90],[270,75],[255,105],[280,95],[290,110],
            [320,100],[330,85],[340,110],[315,115],
            [370,90],[380,105],[395,95],
            [430,100],[445,90],[420,115],
          ].map(([x,y],i)=>(
            <circle key={i} cx={x} cy={y} r="5" fill={c} opacity="0.75"/>
          ))}
          <text x="40" y="178" fontSize="12" fill={c} fontFamily="sans-serif" fontWeight="700">Yoğun nokta = Yoğun dağılış</text>
        </>}

        {type.id==="oransal" && <>
          {/* Harita alanı */}
          <path d="M40,40 Q260,30 480,50 L480,160 Q260,170 40,155 Z" fill="rgba(16,185,129,0.05)" stroke={`${c}30`} strokeWidth="1"/>
          {/* Oransal daireler */}
          {[
            [150,100,40,c,"Konya\n829k ha"],
            [280,95,28,`${c}cc`,"Aksaray\n177k ha"],
            [370,85,20,`${c}99`,"Niğde\n61k ha"],
            [420,110,13,`${c}77`,"Kırşehir\n19k ha"],
            [200,120,16,`${c}88`,"Karaman"],
            [320,120,11,`${c}66`,"Nevşehir"],
          ].map(([cx,cy,r,fill,lbl],i)=>(
            <g key={i}>
              <circle cx={cx as number} cy={cy as number} r={r as number} fill={fill as string} stroke="rgba(0,0,0,0.3)" strokeWidth="1"/>
              <text x={cx as number} y={(cy as number)+3} textAnchor="middle" fontSize="9" fill="#000" fontWeight="800">{(lbl as string).split('\n')[0]}</text>
            </g>
          ))}
          <text x="40" y="178" fontSize="12" fill={c} fontFamily="sans-serif" fontWeight="700">Sembol büyüklüğü = Değer miktarı</text>
        </>}

        {type.id==="akis" && <>
          {/* Harita arka planı */}
          <path d="M40,40 Q260,30 480,50 L480,160 Q260,170 40,155 Z" fill="rgba(16,185,129,0.04)" stroke={`${c}25`} strokeWidth="1"/>
          <defs>
            <marker id="arrowGreen" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill={c}/>
            </marker>
          </defs>
          {/* Ok çizgileri — farklı kalınlıklar = farklı miktar */}
          <line x1="80" y1="100" x2="220" y2="100" stroke={c} strokeWidth="8" markerEnd="url(#arrowGreen)" opacity="0.8"/>
          <line x1="80" y1="120" x2="220" y2="120" stroke={c} strokeWidth="4" markerEnd="url(#arrowGreen)" opacity="0.7"/>
          <line x1="80" y1="135" x2="220" y2="135" stroke={c} strokeWidth="2" markerEnd="url(#arrowGreen)" opacity="0.6"/>
          {/* Kaynaklar */}
          <circle cx="60" cy="100" r="10" fill={`${c}50`} stroke={c} strokeWidth="1.5"/>
          <circle cx="60" cy="120" r="10" fill={`${c}50`} stroke={c} strokeWidth="1.5"/>
          <circle cx="60" cy="135" r="10" fill={`${c}50`} stroke={c} strokeWidth="1.5"/>
          <text x="25" y="103" fontSize="10" fill={c} fontFamily="sans-serif">A</text>
          <text x="25" y="123" fontSize="10" fill={c} fontFamily="sans-serif">B</text>
          <text x="25" y="138" fontSize="10" fill={c} fontFamily="sans-serif">C</text>
          {/* Hedef */}
          <rect x="230" y="70" width="60" height="90" fill={`${c}20`} stroke={c} strokeWidth="1.5" rx="5"/>
          <text x="260" y="120" textAnchor="middle" fontSize="11" fill={c} fontFamily="sans-serif" fontWeight="700">Hedef</text>
          {/* Lejant */}
          <line x1="330" y1="80" x2="380" y2="80" stroke={c} strokeWidth="7" opacity="0.8"/>
          <text x="390" y="84" fontSize="11" fill={c} fontFamily="sans-serif">Çok</text>
          <line x1="330" y1="100" x2="380" y2="100" stroke={c} strokeWidth="3" opacity="0.7"/>
          <text x="390" y="104" fontSize="11" fill={`${c}aa`} fontFamily="sans-serif">Az</text>
          <text x="40" y="178" fontSize="12" fill={c} fontFamily="sans-serif" fontWeight="700">Ok yönü = Hareket yönü, kalınlık = Miktar</text>
        </>}

        {type.id==="kartogram" && <>
          {/* Normal Türkiye şekli */}
          <path d="M40,40 Q160,35 240,45 Q280,40 310,50 Q330,45 340,55 L340,100 Q320,110 280,105 Q240,115 180,105 Q120,115 80,105 Q55,110 40,100 Z" fill={`${c}15`} stroke={`${c}60`} strokeWidth="1.5" strokeDasharray="4,3"/>
          <text x="190" y="82" textAnchor="middle" fontSize="10" fill={`${c}80`} fontFamily="sans-serif">Gerçek alan</text>
          {/* Kartogram — İstanbul büyük, doğu illeri küçük */}
          <rect x="70"  y="125" width="55" height="55" fill={`${c}70`} stroke={c} strokeWidth="1.5" rx="4"/>
          <rect x="135" y="138" width="38" height="38" fill={`${c}55`} stroke={c} strokeWidth="1.5" rx="4"/>
          <rect x="183" y="148" width="28" height="28" fill={`${c}40`} stroke={c} strokeWidth="1.5" rx="4"/>
          <rect x="221" y="152" width="20" height="20" fill={`${c}30`} stroke={c} strokeWidth="1.5" rx="4"/>
          <rect x="251" y="155" width="14" height="14" fill={`${c}22`} stroke={c} strokeWidth="1.5" rx="3"/>
          <rect x="275" y="158" width="10" height="10" fill={`${c}18`} stroke={c} strokeWidth="1" rx="2"/>
          <text x="97"  y="158" textAnchor="middle" fontSize="9" fill="#000" fontWeight="800">İST</text>
          <text x="154" y="162" textAnchor="middle" fontSize="9" fill="#000" fontWeight="800">ANK</text>
          <text x="197" y="166" textAnchor="middle" fontSize="8" fill="#000">İZM</text>
          <text x="160" y="195" textAnchor="middle" fontSize="11" fill={c} fontFamily="sans-serif" fontWeight="700">Alan = Veri değeri (nüfus)</text>
          {/* Bilgi notu */}
          <text x="320" y="140" fontSize="11" fill={`${c}99`} fontFamily="sans-serif">Gerçek</text>
          <text x="320" y="153" fontSize="11" fill={`${c}99`} fontFamily="sans-serif">coğrafi alan</text>
          <text x="320" y="166" fontSize="11" fill={`${c}99`} fontFamily="sans-serif">bozulur</text>
        </>}
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST PANELİ
// ═══════════════════════════════════════════════════════════════════════════════
function TestPanel() {
  const [qIdx,     setQIdx]     = useState(0);
  const [selected, setSelected] = useState<number|null>(null);
  const [score,    setScore]    = useState(0);
  const [answers,  setAnswers]  = useState<boolean[]>([]);
  const [done,     setDone]     = useState(false);
  const q = TEST_ITEMS[qIdx];

  const handleAnswer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    const ok = i === q.correct;
    if (ok) { setScore(s => s+20); sndOK(); } else sndFail();
    setAnswers(a => [...a, ok]);
  };
  const next  = () => { sndClick(); if (qIdx >= TEST_ITEMS.length-1) { setDone(true); return; } setQIdx(i=>i+1); setSelected(null); };
  const retry = () => { setQIdx(0); setSelected(null); setScore(0); setAnswers([]); setDone(false); };

  if (done) {
    const pct = Math.round((score / (TEST_ITEMS.length*20))*100);
    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"18px", background:`radial-gradient(ellipse at center,#051a0e 0%,${BG_DARK} 100%)` }}>
        <div style={{ fontSize:"60px" }}>🗺️</div>
        <div style={{ fontSize:"28px", fontWeight:"800", color:"#d1fae5", fontFamily:FONT_SANS }}>TEST TAMAMLANDI!</div>
        <div style={{ fontSize:"52px", fontWeight:"800", color:pct>=80?COLOR_SUCCESS:pct>=50?COLOR_ACCENT:COLOR_ERROR, fontFamily:FONT_MONO }}>{score} PUAN</div>
        <div style={{ fontSize:"15px", color:"#1a6040", fontFamily:FONT_SANS }}>{answers.filter(Boolean).length}/{TEST_ITEMS.length} doğru · %{pct} başarı</div>
        <div style={{ fontSize:"15px", color:"#3a8060", textAlign:"center", maxWidth:"420px", lineHeight:"1.8", fontFamily:FONT_SANS }}>
          {pct>=80?"🏆 Mükemmel! Harita türlerini çok iyi öğrendin.":pct>=50?"👍 İyi! Öğren sekmesindeki karşılaştırma tablosunu tekrar incele.":"📚 Tekrar dene! Her harita türünün örneğini incele."}
        </div>
        <div style={{ display:"flex", gap:"12px" }}>
          <button onClick={retry}
            style={{ padding:"13px 30px", background:"transparent", border:`2px solid ${COLOR_SUCCESS}40`, borderRadius:"10px", color:COLOR_SUCCESS, fontSize:"14px", fontWeight:"800", cursor:"pointer", fontFamily:FONT_SANS }}
            onMouseEnter={e=>{e.currentTarget.style.background=`${C_GREEN}10`;}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            🔄 Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  const typeColor = {identify:"#10b981",usage:"#3b82f6",compare:"#f59e0b"}[q.type];
  const typeLbl   = {identify:"🔍 TANIMLAMA SORUSU",usage:"🛠️ KULLANIM SORUSU",compare:"⚖️ KARŞILAŞTIRMA SORUSU"}[q.type];

  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

      {/* Sol: ilerleme */}
      <div style={{ width:"240px", flexShrink:0, borderRight:"1px solid rgba(16,185,129,0.12)", background:"rgba(2,10,6,0.6)", padding:"24px 18px", display:"flex", flexDirection:"column", gap:"9px", overflowY:"auto" }}>
        <div style={{ fontSize:"11px", letterSpacing:"2px", color:"#1a6040", fontWeight:"800", marginBottom:"4px", fontFamily:FONT }}>SORULAR</div>
        {TEST_ITEMS.map((item,i)=>{
          const d=i<answers.length, cur=i===qIdx;
          const tc = {identify:"#10b981",usage:"#3b82f6",compare:"#f59e0b"}[item.type];
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", background:cur?`${tc}12`:"rgba(0,0,0,0.18)", border:`1.5px solid ${cur?tc:d?(answers[i]?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"):"rgba(255,255,255,0.04)"}`, borderRadius:"8px" }}>
              <div style={{ width:"24px", height:"24px", borderRadius:"50%", background:d?(answers[i]?C_GREEN:"#ef4444"):cur?tc:"rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:"800", color:"#fff", flexShrink:0, fontFamily:MONO }}>
                {d?(answers[i]?"✓":"✗"):i+1}
              </div>
              <div>
                <div style={{ fontSize:"12px", fontWeight:"700", color:cur?tc:d?(answers[i]?C_GREEN:"#ef4444"):"#1a4030", fontFamily:FONT }}>Soru {i+1}</div>
                <div style={{ fontSize:"10px", color:"#1a3020", fontFamily:FONT }}>{item.type==="identify"?"Tanımlama":item.type==="usage"?"Kullanım":"Karşılaştırma"}</div>
              </div>
            </div>
          );
        })}
        <div style={{ marginTop:"auto", padding:"13px 15px", background:`${C_GREEN}08`, border:`1px solid ${C_GREEN}15`, borderRadius:"9px" }}>
          <div style={{ fontSize:"11px", color:"#1a5030", fontWeight:"700", letterSpacing:"1px", marginBottom:"4px" }}>PUAN</div>
          <div style={{ fontSize:"32px", fontWeight:"800", color:C_GREEN, fontFamily:MONO }}>{score}</div>
          <div style={{ fontSize:"12px", color:"#1a4030" }}>/ {TEST_ITEMS.length*20}</div>
        </div>
      </div>

      {/* Soru alanı */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"28px 36px", overflowY:"auto", gap:"18px", background:`radial-gradient(ellipse at 30% 20%,${typeColor}06 0%,${BG} 60%)` }}>

        {/* İlerleme */}
        <div style={{ width:"100%", maxWidth:"680px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
            <span style={{ fontSize:"12px", color:"#1a5030", fontWeight:"700", letterSpacing:"1px", fontFamily:FONT }}>SORU {qIdx+1} / {TEST_ITEMS.length}</span>
            <span style={{ fontSize:"12px", color:C_GREEN, fontFamily:FONT }}>{Math.round((qIdx/TEST_ITEMS.length)*100)}% tamamlandı</span>
          </div>
          <div style={{ height:"5px", background:`${C_GREEN}15`, borderRadius:"3px", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${(qIdx/TEST_ITEMS.length)*100}%`, background:`linear-gradient(90deg,#065f46,${C_GREEN})`, borderRadius:"3px", transition:"width 0.4s ease" }}/>
          </div>
        </div>

        {/* Tür rozeti */}
        <div style={{ alignSelf:"flex-start", maxWidth:"680px", width:"100%" }}>
          <span style={{ padding:"6px 14px", background:`${typeColor}14`, border:`1px solid ${typeColor}28`, borderRadius:"20px", fontSize:"12px", color:typeColor, fontWeight:"700", letterSpacing:"1px", fontFamily:FONT }}>
            {typeLbl}
          </span>
        </div>

        {/* Soru metni */}
        <div style={{ maxWidth:"680px", width:"100%", padding:"22px 26px", background:`${typeColor}08`, border:`1.5px solid ${typeColor}20`, borderRadius:"14px" }}>
          <p style={{ fontSize:"16px", color:"#9de3c4", lineHeight:"1.9", margin:0, fontWeight:"600", fontFamily:FONT }}>{q.q}</p>
        </div>

        {/* Şıklar */}
        <div style={{ maxWidth:"680px", width:"100%", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
          {q.opts.map((opt,i)=>{
            const isSel=selected===i, isCorr=i===q.correct, show=selected!==null;
            let bg="rgba(0,0,0,0.25)", border="rgba(255,255,255,0.07)", color="#3a7050";
            if (show) {
              if (isCorr)     { bg=`${C_GREEN}12`; border=C_GREEN; color=C_GREEN; }
              else if (isSel) { bg="rgba(239,68,68,0.1)"; border="#ef4444"; color="#ef4444"; }
            } else if (isSel) { bg=`${typeColor}12`; border=typeColor; color=typeColor; }
            return (
              <button key={i} onClick={()=>handleAnswer(i)} disabled={selected!==null}
                style={{ padding:"15px 17px", background:bg, border:`2px solid ${border}`, borderRadius:"11px", cursor:selected!==null?"default":"pointer", fontFamily:FONT, textAlign:"left", transition:"all 0.18s" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:"11px" }}>
                  <span style={{ width:"24px", height:"24px", borderRadius:"50%", background:show&&isCorr?C_GREEN:show&&isSel?"#ef4444":`${typeColor}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:"800", color:show?"#fff":typeColor, flexShrink:0, marginTop:"1px", fontFamily:MONO }}>
                    {show&&isCorr?"✓":show&&isSel&&!isCorr?"✗":String.fromCharCode(65+i)}
                  </span>
                  <span style={{ fontSize:"14px", color, fontWeight:"600", lineHeight:"1.6", fontFamily:FONT }}>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Açıklama */}
        {selected!==null && (
          <div style={{ maxWidth:"680px", width:"100%", padding:"18px 22px", background:selected===q.correct?`${COLOR_SUCCESS}08`:"rgba(239,68,68,0.08)", border:`2px solid ${selected===q.correct?`${COLOR_SUCCESS}28`:"rgba(239,68,68,0.28)"}`, borderRadius:"14px" }}>
            <div style={{ fontSize:"16px", fontWeight:"800", color:selected===q.correct?COLOR_SUCCESS:COLOR_ERROR, marginBottom:"10px", fontFamily:FONT_SANS }}>
              {selected===q.correct?"✅ DOĞRU!":"❌ YANLIŞ!"}
            </div>
            <p style={{ fontSize:"14px", color:"#4a8060", lineHeight:"1.85", margin:0, fontWeight:"500", fontFamily:FONT_SANS }}>{q.exp}</p>
          </div>
        )}

        {/* İleri */}
        {selected!==null && (
          <button onClick={next}
            style={{ padding:"14px 38px", background:`linear-gradient(90deg,#065f46,${COLOR_SUCCESS})`, border:"none", borderRadius:"11px", color:"#000", fontSize:"15px", fontWeight:"800", letterSpacing:"1.5px", cursor:"pointer", fontFamily:FONT_SANS, boxShadow:`0 4px 22px ${COLOR_SUCCESS}40` }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";}}>
            {qIdx>=TEST_ITEMS.length-1?"🏁 Sonuçları Gör":"⏭ Sonraki Soru"}
          </button>
        )}
      </div>
    </div>
  );
}