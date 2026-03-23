"use client";
import { useState, useRef, useEffect, useCallback } from "react";

// ─── Ses ─────────────────────────────────────────────────────────────────────
function beep(f: number, d: number, t: OscillatorType = "sine", v = 0.14) {
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
const sndOK    = () => [440,554,660].forEach((f,i) => setTimeout(() => beep(f,0.22,"sine",0.13), i*80));
const sndFail  = () => beep(200,0.30,"sawtooth",0.11);
const sndClick = () => beep(700,0.07,"square",0.06);

// ─── Sabitler ────────────────────────────────────────────────────────────────
const FONT  = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const MONO  = "'Courier New',monospace";
const BG    = "#0a0e06";
const ACCENT = "#f97316";

type Tab = "learn" | "shapes" | "profile" | "test";

// ─── Renklendirme tablosu ────────────────────────────────────────────────────
const ELEVATION_COLORS = [
  { min:-3000, max:-1000, color:"#0a2a6e", label:"Derin deniz" },
  { min:-1000, max:-250,  color:"#1a4a9e", label:"Derin" },
  { min:-250,  max:0,     color:"#3a7acc", label:"Sığ deniz" },
  { min:0,     max:250,   color:"#5ab85a", label:"Alçak ova (0-250m)" },
  { min:250,   max:500,   color:"#92cc60", label:"Ova (250-500m)" },
  { min:500,   max:750,   color:"#d4e060", label:"Yüksek ova (500-750m)" },
  { min:750,   max:1000,  color:"#e8c840", label:"Yüksek alan" },
  { min:1000,  max:1300,  color:"#d4a020", label:"Dağlık" },
  { min:1300,  max:1600,  color:"#c47820", label:"Yüksek dağ" },
  { min:1600,  max:1900,  color:"#a05010", label:"Çok yüksek dağ" },
  { min:1900,  max:2500,  color:"#784030", label:"Alpin" },
  { min:2500,  max:3932,  color:"#5a3040", label:"Kar sınırı üstü" },
];

// ─── Yer şekilleri verisi ─────────────────────────────────────────────────────
const LANDFORMS = [
  {
    id:"zirve", name:"Zirve (Doruk)", icon:"▲", color:"#ef4444",
    desc:"Dağ ya da tepelerin en yüksek noktasıdır. İzohips haritalarında nokta (.) veya üçgen (▲) sembolüyle gösterilir.",
    izohipsRule:"En içteki (en küçük) izohips halkasının merkezinde yer alır.",
    example:"Ağrı Dağı zirvesi (5.137 m)",
  },
  {
    id:"vadi", name:"Vadi", icon:"∪", color:"#3b82f6",
    desc:"Akarsu veya buzul aşındırması sonucu oluşan, bir taban ve iki yanında yamaçların bulunduğu eğimli oluktur.",
    izohipsRule:"İzohipslerin yükseltinin ARTTIĞI yöne doğru yaptığı büklümler vadiyi gösterir (V-şekli, tepeye doğru).",
    example:"Çoruh Vadisi",
  },
  {
    id:"sirt", name:"Sırt", icon:"∩", color:"#8b5cf6",
    desc:"Tepe veya dağlarda farklı yöne bakan yamaçları birleştiren yerdir. İki vadi arasında kalan yükseltili alanlardır.",
    izohipsRule:"İzohipslerin yükseltinin AZALDIĞI yöne doğru yaptığı büklümler sırtı gösterir (ters V, denize doğru).",
    example:"Kaçkar sırtları",
  },
  {
    id:"boyun", name:"Boyun", icon:"⊓", color:"#f59e0b",
    desc:"İki tepe arasında kalan ve çevresine göre yükseltinin daha az olduğu yerdir. Geçit niteliği taşır.",
    izohipsRule:"İki zirve (içte) ve iki vadi (dışta) arasında kalan eyer şeklindeki iz hips deseni.",
    example:"Zigana Geçidi",
  },
  {
    id:"delta", name:"Delta", icon:"△", color:"#10b981",
    desc:"Akarsuların getirdiği alüvyonların deniz kıyısında birikmesiyle oluşan ve denize doğru çıkıntı yapan ovalardır.",
    izohipsRule:"Kıyı çizgisinde (0 m) denize doğru çıkıntı yapar. İzohipsler çok seyrek ve düzdür.",
    example:"Çukurova (Seyhan-Ceyhan Deltası)",
  },
  {
    id:"falez", name:"Falez (Yalıyar)", icon:"⌐", color:"#06b6d4",
    desc:"Dalga aşındırması sonucu oluşan dik kıyılardır. Denize dik olarak inen sarp kayalık yüzeylerdir.",
    izohipsRule:"Kıyıda izohipslerin birbirine çok yaklaştığı (neredeyse üst üste çakıştığı) yerlerde görülür.",
    example:"Karaburun Yarımadası falezleri",
  },
  {
    id:"cukur", name:"Çukur (Çanak)", icon:"∪̄", color:"#ec4899",
    desc:"Yüksek kesimlerle çevrili alçak sahalardır. Kapalı havzalar oluşturur.",
    izohipsRule:"İçe dönük ok işaretiyle gösterilir. En içteki izohips en alçak yeri gösterir (normal durumun tersi).",
    example:"Tuz Gölü çanağı",
  },
  {
    id:"selale", name:"Şelale", icon:"↡", color:"#a78bfa",
    desc:"Akarsu boylarındaki bir eğim kırığında suların yüksekten dökülüp aktığı yerdir.",
    izohipsRule:"Akarsu yatağı üzerinde izohipslerin birbirine çok yaklaşması eğimin arttığını ve şelale oluşumunu gösterir.",
    example:"Düden Şelalesi (Antalya)",
  },
];

// ─── Test soruları ────────────────────────────────────────────────────────────
const TEST_ITEMS = [
  { q:"İzohipsler arasındaki yükselti farkı haritanın neresinde eşittir?", opts:["Sadece kıyı bölgelerinde","Sadece dağlık alanlarda","Haritanın tamamında","Deniz seviyesi yakınlarında"], correct:2, exp:"İzohipsler arası yükselti farkı (eküidistans değeri) haritanın her yerinde eşittir. Bu değer haritanın ölçeğine göre değişir ama aynı haritada sabit kalır." },
  { q:"İzohipslerin birbirine yakın olduğu yerlerde arazi nasıldır?", opts:["Düz ve ovalık","Eğim azdır","Eğim fazladır — dik yamaç","Çukur alandır"], correct:2, exp:"İzohipsler ne kadar sık çizilmişse eğim o kadar fazladır. Seyrek izohipsler düz araziyi, sık izohipsler dik yamaçları gösterir." },
  { q:"0 metre izohipsi neyle çakışır?", opts:["En alçak dağ noktası","Kıyı çizgisi","İlk izohips halkası","Ortalama deniz seviyesi üstü"], correct:1, exp:"0 metre eğrisi deniz kıyısından geçer ve kıyı çizgisi olarak adlandırılır. Deniz kıyısı ile kara sınırını belirler." },
  { q:"İzohips haritasında vadiler nasıl gösterilir?", opts:["Eğrilerin yükseltinin azaldığı yöne büklüm yaptığı yerler","Eğrilerin yükseltinin arttığı yöne büklüm yaptığı yerler","En küçük izohips halkalarının merkezi","Sık izohipslerin arasında kalan düz alanlar"], correct:1, exp:"Vadiler, izohipslerin yükseltinin ARTTIĞI yöne doğru (yani tepeye/dağa doğru) büklüm yaptığı V şeklindeki bölgelerdir. Su akışı bu büklümün içinden geçer." },
  { q:"Çukur (kapalı) alanlarda izohipsler nasıl gösterilir?", opts:["Düz çizgilerle","İçe dönük ok işaretiyle","Kesik çizgilerle","Daha kalın çizgilerle"], correct:1, exp:"Etrafına göre alçak kalmış çukur alanlar içe dönük ok (→ ↓) işaretiyle gösterilir. Bu sayede normal tepe ile çukur birbirinden ayırt edilir." },
  { q:"Renklendirme yönteminde 0 metreden başlayarak yükselti arttıkça hangi renk sırası kullanılır?", opts:["Mavi → Yeşil → Sarı → Turuncu → Kahverengi","Sarı → Yeşil → Turuncu → Mavi → Kahverengi","Kahverengi → Turuncu → Sarı → Yeşil → Mavi","Yeşil → Sarı → Kahverengi → Beyaz → Mavi"], correct:0, exp:"Renklendirme yönteminde: Deniz (mavi tonları) → 0-250m (yeşil) → 250-750m (açık yeşil/sarı) → 750-1600m (turuncu) → 1600m+ (kahverengi). Renk koyulaştıkça yükselti artar." },
  { q:"Profil nedir?", opts:["Haritanın tüm yükseltilerini gösteren tablo","İki nokta arasında yer şekillerinin yandan görünüşünü gösteren grafik","Haritanın ölçeğini hesaplama yöntemi","Renklendirme ile izohips yönteminin birleşimi"], correct:1, exp:"Profil; harita kullanılarak belirlenen iki nokta arasında yer şekillerinin yandan görünüşünü, eğim ve yükselti değerlerini gösteren grafiklerdir. Arazi hakkında yorum yapılmasına olanak tanır." },
  { q:"Kabartma haritaların en önemli avantajı nedir?", opts:["Çok ucuz üretilebilir","Üç boyutlu olması sayesinde yer şekillerinin algılanmasını kolaylaştırır","En ayrıntılı ölçek değerini verir","Yalnızca denizleri gösterebilir"], correct:1, exp:"Kabartma haritalar yükseltileri gerçek 3D maket olarak gösterir. Bu sayede yer şekillerinin algılanması kolaylaşır. Görme engelli bireyler için de önemli bir araçtır." },
  { q:"İzohips haritasında sırtlar nasıl gösterilir?", opts:["En içteki izohips halkalarının birleştiği çizgi","Eğrilerin yükseltinin azaldığı yöne (denize doğru) büklüm yaptığı yerler","Birbirine paralel düz çizgilerle","Eğrilerin kesiştiği noktalar"], correct:1, exp:"Sırtlar, izohipslerin yükseltinin AZALDIĞI yöne doğru (denize/ovaya doğru) büklüm yaptığı yerlerdir. Vadilerin tam tersi yönünde büklüm oluştururlar." },
  { q:"Büyük ölçekli haritalarda izohips aralığı nasıldır?", opts:["Daha büyüktür — 500 metrede bir","Daha küçüktür — 1, 5, 10 veya 20 metrede bir","Sabit kalır, ölçekten etkilenmez","Yalnızca 100 metrede bir çizilir"], correct:1, exp:"Büyük ölçekli haritalarda daha fazla ayrıntı gösterilir. Bu nedenle izohips aralığı daha küçük tutulur (1, 5, 10 veya 20 m). Küçük ölçekli haritalarda ise 100, 500 m gibi büyük aralıklar kullanılır." },
];

// ═══════════════════════════════════════════════════════════════════════════════
export default function TopoActivity({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("learn");

  const TABS = [
    { id:"learn"   as Tab, icon:"📖", label:"ÖĞREN"       },
    { id:"shapes"  as Tab, icon:"⛰️", label:"YER ŞEKİLLERİ" },
    { id:"profile" as Tab, icon:"📈", label:"PROFİL"      },
    { id:"test"    as Tab, icon:"✏️", label:"TEST"         },
  ];

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:1000, background:BG, display:"flex", flexDirection:"column", fontFamily:FONT, touchAction:"none", userSelect:"none", WebkitUserSelect:"none" }}
      onWheel={e=>e.preventDefault()}
    >
      {/* Üst bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", height:"64px", borderBottom:"1px solid rgba(249,115,22,0.2)", background:"rgba(5,7,3,0.85)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"28px" }}>
          <div>
            <div style={{ fontSize:"10px", letterSpacing:"4px", color:ACCENT, opacity:0.6, fontFamily:MONO }}>YÜKSELTİ & TOPOĞRAFYA</div>
            <div style={{ fontSize:"20px", fontWeight:"800", color:"#fed7aa", letterSpacing:"-0.3px" }}>İzohips & Yer Şekilleri</div>
          </div>
          <div style={{ display:"flex", gap:"3px", background:"rgba(0,0,0,0.4)", padding:"4px", borderRadius:"10px" }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>{sndClick();setTab(t.id);}}
                style={{ padding:"7px 16px", borderRadius:"7px", border:"none", cursor:"pointer", fontFamily:FONT, fontSize:"12px", fontWeight:"700", letterSpacing:"0.5px", transition:"all 0.18s",
                  background:tab===t.id?ACCENT:"transparent",
                  color:tab===t.id?"#000":"#5a2e10" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose}
          style={{ padding:"8px 18px", background:"transparent", border:"1px solid rgba(255,80,80,0.3)", borderRadius:"8px", color:"#ff7070", fontSize:"12px", fontWeight:"700", cursor:"pointer", fontFamily:FONT }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,80,80,0.1)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
          ✕ KAPAT
        </button>
      </div>

      <div style={{ flex:1, overflow:"hidden", display:"flex", minHeight:0 }}>
        {tab==="learn"   && <LearnTab />}
        {tab==="shapes"  && <ShapesTab />}
        {tab==="profile" && <ProfileTab />}
        {tab==="test"    && <TestTab />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ÖĞREN SEKMESİ
// ═══════════════════════════════════════════════════════════════════════════════
// ─── İzohips kuralları verisi ─────────────────────────────────────────────────
const IZOHIPS_RULES = [
  { no:1,  title:"Kapalı eğrilerdir",         desc:"İzohipsler iç içe çizilmiş kapalı eğrilerdir. Hiçbiri harita kenarında bitmez; kapalı halkalar oluştururlar.", color:"#f97316", demo:"closed" },
  { no:2,  title:"Birbirini kesmez",           desc:"Her eğri başka bir yüksekliği gösterdiği için iki izohips asla birbirini kesemez. Kesişen eğriler hata anlamına gelir.", color:"#ef4444", demo:"nocross" },
  { no:3,  title:"Aynı eğri = eşit yükselti", desc:"Aynı izohips üzerindeki bütün noktaların yükselti değeri birbirinin aynıdır. Farklı uzaklıktaki noktalar aynı yükseltidedir.", color:"#10b981", demo:"equal" },
  { no:4,  title:"En içteki = en yüksek",      desc:"En içteki (en küçük) izohips halkası en yüksek yeri, en dıştaki ise en alçak yeri gösterir. Çukur alanlarda bu kural tersine döner.", color:"#3b82f6", demo:"inner" },
  { no:5,  title:"0 m = Kıyı çizgisi",        desc:"Kıyı çizgisi 0 metre ile gösterilir. İlk izohipsin değeri, izohipsler arası yükselti farkının (eküidistans) ne olduğunu gösterir.", color:"#06b6d4", demo:"zero" },
  { no:6,  title:"Eküidistans her yerde eşit", desc:"İzohipsler arası yükselti farkı (eküidistans değeri) haritanın her yerinde eşittir. Bu değer haritanın ölçeğine göre belirlenir.", color:"#8b5cf6", demo:"equidist" },
  { no:7,  title:"Sık = Dik yamaç",           desc:"İzohipslerin birbirine yakın (sık) olduğu yerler eğimin fazla olduğunu gösterir. Seyrek izohipsler ise düz veya az eğimli araziyi ifade eder.", color:"#f59e0b", demo:"dense" },
  { no:8,  title:"Komşu iki izohips eşit",    desc:"Birbirini çevrelemeyen komşu iki izohipsin yükselti değeri aynıdır. Bir sırt üzerindeki iki taraf aynı yükseltide başlar.", color:"#ec4899", demo:"neighbor" },
  { no:9,  title:"Akarsu iki tarafı eşit",    desc:"Bir akarsuyun her iki tarafındaki arazi aynı yükselti değeri ile başlar. Bu nedenle izohipsler akarsu üzerinde V şeklinde büklüm yapar.", color:"#14b8a6", demo:"river" },
  { no:10, title:"Çukur alan: içe dönük ok",  desc:"Etrafına göre alçakta kalmış çukur alanlar içe dönük ok işaretiyle gösterilir. Bu işaret olmadan çukur ile tepe birbirinden ayırt edilemez.", color:"#a78bfa", demo:"hollow" },
];

function LearnTab() {
  const [method, setMethod] = useState<"renk"|"izohips"|"kabartma">("renk");
  const [elevation, setElevation] = useState(500);
  const [activeRule, setActiveRule] = useState(0);

  const getColor = (m: number) => ELEVATION_COLORS.find(c => m >= c.min && m < c.max)?.color ?? "#5ab85a";
  const getLabel = (m: number) => ELEVATION_COLORS.find(c => m >= c.min && m < c.max)?.label ?? "";
  const getArazi = (m: number) => {
    if (m < -1000) return "Derin okyanus — ışık ulaşmaz";
    if (m < 0)     return "Deniz ya da göl tabanı";
    if (m < 200)   return "Kıyı ovası — düz, alçak arazi";
    if (m < 500)   return "Ova veya yüksek ova";
    if (m < 1000)  return "Dağlık alan — orman kuşağı";
    if (m < 2000)  return "Yüksek dağ — kar sınırına yakın";
    return "Alpin kuşak — sürekli karla kaplı";
  };

  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
      {/* Sol: yöntem seçici */}
      <div style={{ width:"260px", flexShrink:0, borderRight:"1px solid rgba(249,115,22,0.12)", background:"rgba(5,7,3,0.6)", overflowY:"auto", padding:"20px 16px" }}>
        <SLabel>GÖSTERME YÖNTEMLERİ</SLabel>
        <div style={{ display:"flex", flexDirection:"column", gap:"7px", marginTop:"12px" }}>
          {([
            {id:"renk" as const,     icon:"🎨", title:"a) Renklendirme",     sub:"Renk tonu = yükselti aralığı"},
            {id:"izohips" as const,  icon:"〰️", title:"b) Eş Yükselti (İzohips)", sub:"10 özellik — interaktif"},
            {id:"kabartma" as const, icon:"🗻", title:"c) Kabartma",         sub:"3B maket gösterim"},
          ]).map(m=>(
            <button key={m.id} onClick={()=>{sndClick();setMethod(m.id);}}
              style={{ padding:"13px 14px", background:method===m.id?`${ACCENT}18`:"rgba(0,0,0,0.22)", border:`2px solid ${method===m.id?ACCENT:"rgba(249,115,22,0.1)"}`, borderRadius:"10px", cursor:"pointer", textAlign:"left", fontFamily:FONT, transition:"all 0.2s" }}>
              <div style={{ fontSize:"18px", marginBottom:"4px" }}>{m.icon}</div>
              <div style={{ fontSize:"13px", fontWeight:"800", color:method===m.id?ACCENT:"#5a2e10" }}>{m.title}</div>
              <div style={{ fontSize:"11px", color:method===m.id?`${ACCENT}88`:"#3a1808", marginTop:"2px" }}>{m.sub}</div>
            </button>
          ))}
        </div>

        {method==="izohips" && (
          <>
            <SDivider />
            <SLabel>10 İZOHİPS ÖZELLİĞİ</SLabel>
            <div style={{ marginTop:"10px", display:"flex", flexDirection:"column", gap:"5px" }}>
              {IZOHIPS_RULES.map((r,i)=>(
                <button key={i} onClick={()=>{sndClick();setActiveRule(i);}}
                  style={{ padding:"8px 10px", background:activeRule===i?`${r.color}18`:"rgba(0,0,0,0.18)", border:`1.5px solid ${activeRule===i?r.color:"rgba(255,255,255,0.05)"}`, borderRadius:"7px", cursor:"pointer", textAlign:"left", fontFamily:FONT, transition:"all 0.15s", display:"flex", alignItems:"center", gap:"8px" }}>
                  <span style={{ width:"20px", height:"20px", borderRadius:"50%", background:activeRule===i?r.color:`${r.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:"800", color:activeRule===i?"#000":r.color, flexShrink:0, fontFamily:MONO }}>{r.no}</span>
                  <span style={{ fontSize:"11px", fontWeight:"700", color:activeRule===i?r.color:"#5a2e10", lineHeight:"1.3" }}>{r.title}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {method==="renk" && (
          <>
            <SDivider />
            <SLabel>RENK SIRASI (Alçaktan Yükseğe)</SLabel>
            <div style={{ marginTop:"10px", display:"flex", flexDirection:"column", gap:"3px" }}>
              {ELEVATION_COLORS.map(c=>(
                <div key={c.label} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"5px 8px", borderRadius:"5px" }}>
                  <div style={{ width:"18px", height:"12px", background:c.color, borderRadius:"2px", flexShrink:0, border:"1px solid rgba(255,255,255,0.1)" }}/>
                  <span style={{ fontSize:"11px", color:"#5a3018", fontWeight:"500" }}>{c.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Orta: içerik */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 28px", gap:"20px", overflowY:"auto", background:`radial-gradient(ellipse at 30% 20%,#150a03 0%,${BG} 70%)` }}>

        {/* ── RENKLENDİRME ── */}
        {method==="renk" && (
          <>
            <div style={{ fontSize:"12px", letterSpacing:"3px", color:ACCENT, fontFamily:MONO, opacity:0.8 }}>RENKLENDİRME YÖNTEMİ</div>

            {/* Açıklama */}
            <div style={{ width:"100%", maxWidth:"680px", padding:"20px 24px", background:"rgba(0,0,0,0.35)", border:`2px solid ${ACCENT}22`, borderRadius:"14px" }}>
              <p style={{ fontSize:"14px", color:"#d4956a", lineHeight:"1.9", margin:0, fontWeight:"500" }}>
                Renklendirme yönteminde aynı yükselti veya derinlikteki yerler <strong style={{ color:ACCENT }}>aynı renk tonlarıyla</strong> gösterilerek o yere ait yükselti ve yer şekillerinin algılanması kolaylaştırılır. Deniz seviyesinden itibaren yükselti arttıkça sırasıyla <strong style={{ color:"#5ab85a" }}>yeşil</strong>, <strong style={{ color:"#d4e060" }}>sarı</strong>, <strong style={{ color:"#e8c840" }}>turuncu</strong>, <strong style={{ color:"#c47820" }}>açık kahverengi</strong> ve <strong style={{ color:"#784030" }}>koyu kahverengi</strong> renkleri kullanılır. Göl, deniz ve okyanuslarda açık maviden koyu mavi tonlara doğru geçiş derinliğin arttığını gösterir.
              </p>
            </div>

            {/* Gradyan bant */}
            <div style={{ width:"100%", maxWidth:"680px" }}>
              <div style={{ fontSize:"11px", color:ACCENT, letterSpacing:"2px", fontWeight:"800", marginBottom:"10px", fontFamily:FONT }}>YÜKSELTİ — RENK GRADYANI</div>
              <div style={{ display:"flex", height:"48px", borderRadius:"10px", overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)" }}>
                {ELEVATION_COLORS.map(c=>(
                  <div key={c.label} style={{ flex:1, background:c.color, position:"relative" }} title={`${c.min}–${c.max}m: ${c.label}`}/>
                ))}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:"5px" }}>
                <span style={{ fontSize:"10px", color:"#3a7acc", fontFamily:MONO }}>−3000 m (Derin Okyanus)</span>
                <span style={{ fontSize:"10px", color:"#784030", fontFamily:MONO }}>+3932 m (Zirve)</span>
              </div>
            </div>

            {/* İnteraktif kaydırıcı */}
            <div style={{ width:"100%", maxWidth:"680px", padding:"22px 26px", background:"rgba(0,0,0,0.28)", border:`1px solid ${ACCENT}18`, borderRadius:"14px" }}>
              <div style={{ fontSize:"11px", color:ACCENT, letterSpacing:"2px", marginBottom:"14px", fontFamily:MONO }}>İNTERAKTİF — YÜKSELTİ SEÇ</div>
              <input type="range" min={-3000} max={3932} step={25} value={elevation} onChange={e=>setElevation(Number(e.target.value))}
                style={{ width:"100%", accentColor:getColor(elevation), cursor:"pointer" }}/>
              <div style={{ marginTop:"16px", display:"flex", alignItems:"center", gap:"20px" }}>
                <div style={{ width:"90px", height:"90px", borderRadius:"12px", background:getColor(elevation), border:"3px solid rgba(255,255,255,0.15)", boxShadow:`0 0 28px ${getColor(elevation)}77`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:"16px", color:"rgba(255,255,255,0.9)", fontWeight:"800", fontFamily:MONO }}>{elevation>0?"+":""}{elevation}</span>
                  <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.7)" }}>metre</span>
                </div>
                <div>
                  <div style={{ fontSize:"18px", fontWeight:"800", color:getColor(elevation), marginBottom:"6px" }}>{getLabel(elevation)}</div>
                  <div style={{ fontSize:"13px", color:"#7a4a28", lineHeight:"1.7" }}>{getArazi(elevation)}</div>
                  <div style={{ marginTop:"8px", fontSize:"12px", color:"#5a3018", fontFamily:MONO }}>
                    {elevation<0?"Deniz/Göl":"Kara"} · {Math.abs(elevation)} m {elevation<0?"derinlik":"yükselti"}
                  </div>
                </div>
              </div>
            </div>

            {/* Karşılaştırma tablosu */}
            <div style={{ width:"100%", maxWidth:"680px", padding:"18px 22px", background:"rgba(0,0,0,0.22)", border:`1px solid ${ACCENT}10`, borderRadius:"12px" }}>
              <div style={{ fontSize:"11px", color:ACCENT, letterSpacing:"2px", fontWeight:"800", marginBottom:"12px", fontFamily:FONT }}>TAM RENK LEJANTI</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"5px" }}>
                {ELEVATION_COLORS.map(c=>(
                  <div key={c.label} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"6px 10px", background: elevation >= c.min && elevation < c.max ? `${c.color}30` : "rgba(0,0,0,0.15)", border: elevation >= c.min && elevation < c.max ? `1px solid ${c.color}` : "1px solid transparent", borderRadius:"6px", transition:"all 0.2s" }}>
                    <div style={{ width:"20px", height:"13px", background:c.color, borderRadius:"3px", flexShrink:0 }}/>
                    <span style={{ fontSize:"10px", color: elevation >= c.min && elevation < c.max ? c.color : "#5a3018", fontWeight: elevation >= c.min && elevation < c.max ? "800":"500" }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── İZOHİPS ── */}
        {method==="izohips" && (
          <>
            <div style={{ fontSize:"12px", letterSpacing:"3px", color:ACCENT, fontFamily:MONO, opacity:0.8 }}>EŞ YÜKSELTİ (İZOHİPS) YÖNTEMİ</div>

            {/* Seçili kural detayı */}
            <div style={{ width:"100%", maxWidth:"700px", padding:"20px 24px", background:`${IZOHIPS_RULES[activeRule].color}0e`, border:`2px solid ${IZOHIPS_RULES[activeRule].color}35`, borderRadius:"14px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"12px" }}>
                <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:IZOHIPS_RULES[activeRule].color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", fontWeight:"800", color:"#000", flexShrink:0, fontFamily:MONO }}>
                  {IZOHIPS_RULES[activeRule].no}
                </div>
                <div style={{ fontSize:"18px", fontWeight:"800", color:IZOHIPS_RULES[activeRule].color }}>{IZOHIPS_RULES[activeRule].title}</div>
              </div>
              <p style={{ fontSize:"14px", color:"#d4956a", lineHeight:"1.9", margin:0, fontWeight:"500" }}>{IZOHIPS_RULES[activeRule].desc}</p>
            </div>

            {/* İnteraktif SVG demosu */}
            <IzohipsDemoRich activeRule={activeRule} />

            {/* Navigasyon */}
            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={()=>{sndClick();setActiveRule(r=>Math.max(0,r-1));}} disabled={activeRule===0}
                style={{ padding:"10px 22px", background:"rgba(0,0,0,0.3)", border:`1.5px solid ${ACCENT}30`, borderRadius:"8px", color:ACCENT, fontSize:"13px", fontWeight:"700", cursor:activeRule===0?"not-allowed":"pointer", fontFamily:FONT, opacity:activeRule===0?0.4:1 }}>
                ← Önceki Kural
              </button>
              <div style={{ padding:"10px 16px", background:`${ACCENT}10`, border:`1px solid ${ACCENT}20`, borderRadius:"8px", fontSize:"12px", color:ACCENT, fontFamily:MONO, fontWeight:"700" }}>
                {activeRule+1} / {IZOHIPS_RULES.length}
              </div>
              <button onClick={()=>{sndClick();setActiveRule(r=>Math.min(IZOHIPS_RULES.length-1,r+1));}} disabled={activeRule===IZOHIPS_RULES.length-1}
                style={{ padding:"10px 22px", background:"rgba(0,0,0,0.3)", border:`1.5px solid ${ACCENT}30`, borderRadius:"8px", color:ACCENT, fontSize:"13px", fontWeight:"700", cursor:activeRule===IZOHIPS_RULES.length-1?"not-allowed":"pointer", fontFamily:FONT, opacity:activeRule===IZOHIPS_RULES.length-1?0.4:1 }}>
                Sonraki Kural →
              </button>
            </div>
          </>
        )}

        {/* ── KABARTMA ── */}
        {method==="kabartma" && (
          <>
            <div style={{ fontSize:"12px", letterSpacing:"3px", color:ACCENT, fontFamily:MONO, opacity:0.8 }}>KABARTMA YÖNTEMİ</div>
            <div style={{ width:"100%", maxWidth:"620px", padding:"22px 26px", background:"rgba(0,0,0,0.35)", border:`2px solid ${ACCENT}22`, borderRadius:"14px" }}>
              <p style={{ fontSize:"14px", color:"#d4956a", lineHeight:"1.9", margin:0, fontWeight:"500" }}>
                Kabartma yöntemiyle oluşturulan haritalar, yükseltilerin <strong style={{ color:ACCENT }}>üç boyutlu bir maket</strong> hâlinde gösterildiği haritalardır. Algılanması kolay olduğu için yer şekillerinin öğrenilmesini kolaylaştırır. <strong style={{ color:ACCENT }}>Görme engelli</strong> bireylerin haritaları öğrenmesine de olanak sağlar. Günümüzde <strong style={{ color:ACCENT }}>3B yazıcılar</strong> ile üretilebilir.
              </p>
            </div>
            <Kabartma3D />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", width:"100%", maxWidth:"620px" }}>
              {[
                { title:"Avantaj", col:"#10b981", items:["Görsel olarak kolay anlaşılır","Görme engelliler kullanabilir","3B yazıcıyla üretilebilir","Anlamlı eğitim materyali"] },
                { title:"Kullanım", col:ACCENT, items:["Okul eğitim materyali","Turizm tanıtım broşürü","Askeri operasyon planlaması","Müze ve sergi"] },
                { title:"Dezavantaj", col:"#ef4444", items:["Taşıması zor olabilir","Küçük ölçek ayrıntısı sınırlı","Üretim maliyeti yüksek","Güncelleme güç"] },
              ].map(box=>(
                <div key={box.title} style={{ padding:"14px 16px", background:"rgba(0,0,0,0.28)", border:`1px solid ${box.col}20`, borderRadius:"10px" }}>
                  <div style={{ fontSize:"12px", color:box.col, fontWeight:"800", marginBottom:"8px", letterSpacing:"1px" }}>{box.title.toUpperCase()}</div>
                  {box.items.map(it=><div key={it} style={{ fontSize:"12px", color:"#6a3a20", lineHeight:"1.75" }}>• {it}</div>)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Zengin İzohips Demo ──────────────────────────────────────────────────────
function IzohipsDemoRich({ activeRule }: { activeRule: number }) {
  const rule = IZOHIPS_RULES[activeRule];
  const c = rule.color;
  const W=700, H=240;

  const Rings = ({ cx=200, cy=120, sik=false }: { cx?:number; cy?:number; sik?:boolean }) => {
    const rs = sik ? [90,72,56,42,30,20,11] : [90,72,50,30,14];
    return <>
      <ellipse cx={cx} cy={cy} rx={100} ry={100} fill="#1a4a9e" opacity="0.2"/>
      {rs.map((r,i)=>(
        <ellipse key={i} cx={cx} cy={cy} rx={r} ry={r*0.65}
          fill={i===0?"transparent":`rgba(${70+i*18},${35+i*8},0,${0.08+i*0.05})`}
          stroke={c} strokeWidth={i===rs.length-1?2:1.5} opacity={0.5+i*0.08}/>
      ))}
      <text x={cx} y={cy+3} textAnchor="middle" fontSize="9" fill={c} fontFamily={MONO}>▲ Zirve</text>
    </>;
  };

  return (
    <div style={{ width:"100%", maxWidth:"720px" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", background:"rgba(0,0,0,0.22)", borderRadius:"12px", border:`1.5px solid ${c}25` }}>

        {rule.demo==="closed" && <>
          <Rings cx={200} cy={120}/>
          <text x={200} y={220} textAnchor="middle" fontSize="12" fill={c} fontFamily={FONT} fontWeight="700">Kapalı halkalar — ucları birleşir, kesilmez</text>
          {/* Ok ile kapalı eğriyi göster */}
          <path d="M310,120 Q350,80 380,120 Q350,160 310,120" fill="none" stroke={c} strokeWidth="2" strokeDasharray="5,3"/>
          <text x={370} y={70} fontSize="12" fill={c} fontFamily={FONT} fontWeight="700">Kapalı eğri</text>
          <text x={370} y={88} fontSize="11" fill="#8a5030" fontFamily={FONT}>Her izohips bir</text>
          <text x={370} y={104} fontSize="11" fill="#8a5030" fontFamily={FONT}>halka oluşturur</text>
          {/* Yanlış örnek - kesik çizgi */}
          <line x1={430} y1={130} x2={530} y2={130} stroke="#ef4444" strokeWidth="2" strokeDasharray="3,3"/>
          <text x={480} y={148} textAnchor="middle" fontSize="10" fill="#ef4444" fontFamily={FONT}>❌ Açık çizgi (yanlış)</text>
        </>}

        {rule.demo==="nocross" && <>
          {/* İki izohips — kesişmeyen */}
          <ellipse cx={200} cy={120} rx={80} ry={55} fill="none" stroke={c} strokeWidth="2"/>
          <ellipse cx={200} cy={120} rx={55} ry={38} fill="none" stroke={c} strokeWidth="2" opacity="0.7"/>
          <ellipse cx={200} cy={120} rx={30} ry={20} fill="none" stroke={c} strokeWidth="2" opacity="0.5"/>
          <text x={200} y={210} textAnchor="middle" fontSize="12" fill={c} fontFamily={FONT} fontWeight="700">✓ Doğru: İzohipsler hiç kesişmez</text>
          {/* Yanlış örnek - kesişen */}
          <ellipse cx={480} cy={110} rx={70} ry={50} fill="none" stroke="#ef4444" strokeWidth="2"/>
          <ellipse cx={500} cy={130} rx={60} ry={45} fill="none" stroke="#ef4444" strokeWidth="2"/>
          <circle cx={467} cy={155} r={8} fill="#ef4444" opacity="0.8"/>
          <text x={467} y={159} textAnchor="middle" fontSize="9" fill="white" fontWeight="800">✗</text>
          <text x={490} y={195} textAnchor="middle" fontSize="12" fill="#ef4444" fontFamily={FONT} fontWeight="700">❌ Yanlış: Kesişen izohipsler</text>
        </>}

        {rule.demo==="equal" && <>
          <Rings cx={200} cy={120}/>
          {/* Aynı çizgi üzerinde 3 nokta */}
          {[[130,97],[170,102],[158,138]].map(([px,py],i)=>(
            <g key={i}>
              <circle cx={px} cy={py} r={6} fill={c} opacity="0.8"/>
              <text x={px+8} y={py+4} fontSize="11" fill={c} fontFamily={MONO} fontWeight="700">300m</text>
            </g>
          ))}
          <text x={200} y={218} textAnchor="middle" fontSize="12" fill={c} fontFamily={FONT} fontWeight="700">Aynı halkadaki her nokta = aynı yükselti</text>
          <text x={450} y={60} fontSize="12" fill="#8a5030" fontFamily={FONT}>A, B, C noktaları farklı</text>
          <text x={450} y={78} fontSize="12" fill="#8a5030" fontFamily={FONT}>uzaklıkta ama hepsi</text>
          <text x={450} y={96} fontSize="12" fill={c} fontFamily={FONT} fontWeight="700">300 metre yükseltide</text>
        </>}

        {rule.demo==="inner" && <>
          {[90,68,50,32,16].map((r,i)=>{
            const vals=[0,200,400,600,800];
            return (
              <g key={i}>
                <ellipse cx={220} cy={120} rx={r} ry={r*0.65} fill="none" stroke={c} strokeWidth={2} opacity={0.4+i*0.12}/>
                <text x={220+r+3} y={120+4} fontSize="10" fill={c} fontFamily={MONO} opacity={0.7}>{vals[i]}m</text>
              </g>
            );
          })}
          <circle cx={220} cy={120} r={5} fill={c}/>
          <text x={220} y={113} textAnchor="middle" fontSize="9" fill={c} fontFamily={MONO}>▲ Zirve</text>
          {/* Ok yukarı */}
          <line x1={380} y1={180} x2={380} y2={60} stroke={c} strokeWidth="2" markerEnd={`url(#arrowUp)`}/>
          <defs><marker id="arrowUp" markerWidth="8" markerHeight="8" refX="4" refY="0" orient="auto"><path d="M0,8 L4,0 L8,8 Z" fill={c}/></marker></defs>
          <text x={395} y={180} fontSize="11" fill="#8a5030" fontFamily={FONT}>En dışta</text>
          <text x={395} y={196} fontSize="11" fill="#8a5030" fontFamily={FONT}>alçak (0m)</text>
          <text x={395} y={70} fontSize="11" fill={c} fontFamily={FONT} fontWeight="700">En içte</text>
          <text x={395} y={86} fontSize="11" fill={c} fontFamily={FONT} fontWeight="700">yüksek (800m)</text>
          <text x={360} y={225} textAnchor="middle" fontSize="12" fill={c} fontFamily={FONT} fontWeight="700">En içteki halka = En yüksek yer</text>
        </>}

        {rule.demo==="zero" && <>
          {/* Kıyı çizgisi */}
          <rect x={0} y={140} width={W} height={100} fill="#1a4a9e" opacity="0.3"/>
          <path d="M50,140 Q150,130 250,140 Q350,150 450,138 Q550,128 700,140" fill="#1a4a9e" stroke="#3a7acc" strokeWidth="2.5" fillOpacity="0.3"/>
          {/* Kara izohipsleri */}
          <path d="M80,130 Q200,100 350,115 Q480,105 620,125" fill="none" stroke={c} strokeWidth="2.5" opacity="0.9"/>
          <text x={350} y={110} textAnchor="middle" fontSize="12" fill={c} fontFamily={MONO} fontWeight="800">0 m — Kıyı çizgisi</text>
          <path d="M100,100 Q220,72 360,85 Q490,73 610,98" fill="none" stroke={c} strokeWidth="1.8" opacity="0.7"/>
          <text x={360} y={78} textAnchor="middle" fontSize="10" fill={c} fontFamily={MONO}>100 m</text>
          <path d="M130,70 Q240,44 370,55 Q490,44 590,68" fill="none" stroke={c} strokeWidth="1.5" opacity="0.5"/>
          <text x={370} y={48} textAnchor="middle" fontSize="10" fill={c} fontFamily={MONO}>200 m</text>
          <text x={350} y={218} textAnchor="middle" fontSize="12" fill="#3a7acc" fontFamily={FONT} fontWeight="700">0 m eğrisi = Kıyı çizgisi (Deniz-Kara sınırı)</text>
        </>}

        {rule.demo==="equidist" && <>
          {/* Eşit aralıklı izohipsler */}
          {[0,1,2,3,4,5].map(i=>{
            const y=180-i*28;
            return (
              <g key={i}>
                <line x1={50} y1={y} x2={450} y2={y} stroke={c} strokeWidth={2} opacity={0.5+i*0.08}/>
                <text x={460} y={y+4} fontSize="11" fill={c} fontFamily={MONO}>{i*100} m</text>
                {i<5&&<>
                  <line x1={20} y1={y} x2={20} y2={y-28} stroke="#8a5030" strokeWidth="1.5" strokeDasharray="3,2"/>
                  <text x={5} y={y-12} fontSize="10" fill="#6a3a20" fontFamily={MONO}>100m</text>
                </>}
              </g>
            );
          })}
          <text x={250} y={220} textAnchor="middle" fontSize="12" fill={c} fontFamily={FONT} fontWeight="700">Eküidistans: Her aralık eşit (100 m)</text>
          {/* Ölçek notu */}
          <rect x={520} y={60} width={160} height={80} fill="rgba(0,0,0,0.3)" rx="8" stroke={`${c}30`} strokeWidth="1"/>
          <text x={600} y={85} textAnchor="middle" fontSize="11" fill={c} fontFamily={FONT} fontWeight="700">Ölçek → Eküidistans</text>
          <text x={600} y={103} textAnchor="middle" fontSize="10" fill="#8a5030" fontFamily={FONT}>Büyük ölçek: 1, 5, 10m</text>
          <text x={600} y={120} textAnchor="middle" fontSize="10" fill="#8a5030" fontFamily={FONT}>Küçük ölçek: 100, 500m</text>
        </>}

        {rule.demo==="dense" && <>
          {/* Sol: sık izohipsler (dik yamaç) */}
          {[0,8,17,27,38,50,63].map((x,i)=>(
            <line key={i} x1={60+x} y1={40} x2={60+x} y2={180} stroke={c} strokeWidth="1.8" opacity={0.5+i*0.06}/>
          ))}
          <text x={90} y={25} textAnchor="middle" fontSize="13" fill={c} fontFamily={FONT} fontWeight="800">SIK</text>
          <text x={90} y={200} textAnchor="middle" fontSize="11" fill={c} fontFamily={FONT}>Dik yamaç</text>
          <text x={90} y={216} textAnchor="middle" fontSize="11" fill="#ef4444" fontFamily={FONT} fontWeight="700">Eğim FAZLA</text>
          {/* Yamaç profili sol */}
          <path d="M40,180 L130,40" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="5,3" opacity="0.6"/>
          {/* Orta: seyrek */}
          {[0,28,60,96,134].map((x,i)=>(
            <line key={i} x1={250+x} y1={40} x2={250+x} y2={180} stroke={c} strokeWidth="1.8" opacity={0.5+i*0.06}/>
          ))}
          <text x={382} y={25} textAnchor="middle" fontSize="13" fill="#10b981" fontFamily={FONT} fontWeight="800">SEYREK</text>
          <text x={382} y={200} textAnchor="middle" fontSize="11" fill="#10b981" fontFamily={FONT}>Düz arazi</text>
          <text x={382} y={216} textAnchor="middle" fontSize="11" fill="#10b981" fontFamily={FONT} fontWeight="700">Eğim AZ</text>
          {/* Yamaç profili sağ */}
          <path d="M230,180 L520,40" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="5,3" opacity="0.6"/>
          <text x={350} y={120} textAnchor="middle" fontSize="22" fill="rgba(255,255,255,0.12)">↔</text>
        </>}

        {rule.demo==="neighbor" && <>
          {/* Sırt üzerinde iki taraf */}
          <Rings cx={180} cy={110} sik={false}/>
          <line x1={180} y1={20} x2={180} y2={200} stroke={c} strokeWidth="2" strokeDasharray="5,4" opacity="0.5"/>
          <text x={180} y={215} textAnchor="middle" fontSize="11" fill={c} fontFamily={FONT}>Sırt ekseni</text>
          <text x={80} y={160} fontSize="11" fill={c} fontFamily={FONT} fontWeight="700">Sol yamaç</text>
          <text x={200} y={160} fontSize="11" fill={c} fontFamily={FONT} fontWeight="700">Sağ yamaç</text>
          <text x={75} y={175} fontSize="10" fill="#8a5030" fontFamily={FONT}>300m'den başlar</text>
          <text x={200} y={175} fontSize="10" fill="#8a5030" fontFamily={FONT}>300m'den başlar</text>
          <text x={450} y={80} fontSize="12" fill="#8a5030" fontFamily={FONT}>Birbirini çevrelemeyen</text>
          <text x={450} y={98} fontSize="12" fill="#8a5030" fontFamily={FONT}>komşu iki izohipsin</text>
          <text x={450} y={116} fontSize="12" fill={c} fontFamily={FONT} fontWeight="700">yükselti değeri aynı</text>
        </>}

        {rule.demo==="river" && <>
          {/* İzohipsler + akarsu */}
          {[0,1,2,3,4].map(i=>{
            const r=80-i*14;
            return <ellipse key={i} cx={200} cy={120} rx={r} ry={r*0.6} fill="none" stroke={c} strokeWidth="1.8" opacity={0.4+i*0.12}/>;
          })}
          {/* Vadi — akarsu boyunca izohipslerin V büklümü */}
          <path d="M320,40 Q290,80 300,120 Q310,160 320,200" fill="none" stroke="#3b82f6" strokeWidth="3" opacity="0.8"/>
          {[50,80,110,140,170].map((y,i)=>(
            <path key={i} d={`M${310-i*3},${y} Q${320},${y+15} ${330+i*3},${y}`} fill="none" stroke={c} strokeWidth="1.5" strokeDasharray="3,2" opacity="0.7"/>
          ))}
          <text x={320} y={25} textAnchor="middle" fontSize="11" fill="#3b82f6" fontFamily={FONT} fontWeight="700">Akarsu (V büklümü)</text>
          <text x={200} y={218} textAnchor="middle" fontSize="12" fill={c} fontFamily={FONT} fontWeight="700">Akarsuyun iki tarafı aynı yükseltide başlar</text>
          <text x={480} y={100} fontSize="11" fill="#8a5030" fontFamily={FONT}>İzohips büklümü</text>
          <text x={480} y={116} fontSize="11" fill={c} fontFamily={FONT} fontWeight="700">tepeye doğru →</text>
          <text x={480} y={132} fontSize="11" fill="#8a5030" fontFamily={FONT}>(yükseltinin arttığı</text>
          <text x={480} y={148} fontSize="11" fill="#8a5030" fontFamily={FONT}>yöne büklüm)</text>
        </>}

        {rule.demo==="hollow" && <>
          {/* Normal tepe (sol) */}
          {[70,54,38,22].map((r,i)=>(
            <ellipse key={i} cx={150} cy={110} rx={r} ry={r*0.6} fill="none" stroke="#10b981" strokeWidth="1.8" opacity={0.5+i*0.12}/>
          ))}
          <circle cx={150} cy={110} r={4} fill="#10b981"/>
          <text x={150} y={200} textAnchor="middle" fontSize="11" fill="#10b981" fontFamily={FONT} fontWeight="700">Normal tepe ▲</text>
          <text x={150} y={215} textAnchor="middle" fontSize="10" fill="#8a5030" fontFamily={FONT}>İçte yüksek</text>

          {/* Çukur alan (sağ) — içe dönük oklar */}
          {[70,54,38,22].map((r,i)=>(
            <ellipse key={i} cx={450} cy={110} rx={r} ry={r*0.6} fill="none" stroke={c} strokeWidth="1.8" opacity={0.5+i*0.12}/>
          ))}
          {/* İçe dönük oklar */}
          {[[450,42,450,60],[520,110,500,110],[450,178,450,160],[380,110,400,110]].map(([x1,y1,x2,y2],i)=>(
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="2.5" markerEnd="url(#arrowIn)"/>
          ))}
          <defs><marker id="arrowIn" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill={c}/></marker></defs>
          <text x={450} y={200} textAnchor="middle" fontSize="11" fill={c} fontFamily={FONT} fontWeight="700">Çukur alan ▼</text>
          <text x={450} y={215} textAnchor="middle" fontSize="10" fill={c} fontFamily={FONT}>İçe dönük ok işareti</text>

          <text x={300} y={110} textAnchor="middle" fontSize="18" fill="rgba(255,255,255,0.15)">vs</text>
        </>}

      </svg>
    </div>
  );
}

// ─── 3B kabartma SVG ─────────────────────────────────────────────────────────
function Kabartma3D() {
  return (
    <svg width="400" height="220" viewBox="0 0 400 220" style={{ borderRadius:"12px", border:`1px solid ${ACCENT}18` }}>
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2a4a"/>
          <stop offset="100%" stopColor="#0a1020"/>
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#skyGrad)"/>
      {/* Dağ silueti 3B */}
      <polygon points="200,20 310,160 90,160" fill="#5a3018" stroke="#8a4820" strokeWidth="1"/>
      <polygon points="200,20 310,160 200,160" fill="#7a4020" stroke="#9a5025" strokeWidth="0.5"/>
      {/* Karlar */}
      <polygon points="200,20 225,70 175,70" fill="white" opacity="0.9"/>
      {/* Yamaç gölge çizgileri (arazi katmanları) */}
      {[90,100,110,120,130,140,150].map((y,i)=>(
        <line key={i} x1={200-(i+1)*14} y1={y} x2={200+(i+1)*14} y2={y} stroke={`rgba(255,160,80,${0.15+i*0.04})`} strokeWidth="1"/>
      ))}
      {/* Ön plan */}
      <ellipse cx="200" cy="200" rx="180" ry="30" fill="#3a5a20" opacity="0.6"/>
      {/* Etiket */}
      <text x="200" y="214" textAnchor="middle" fontSize="11" fill={ACCENT} fontFamily={FONT} fontWeight="700">Kabartma Harita — 3B Gösterim</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// YER ŞEKİLLERİ SEKMESİ
// ═══════════════════════════════════════════════════════════════════════════════
function ShapesTab() {
  const [selected, setSelected] = useState(LANDFORMS[0]);
  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

      {/* Sol: liste */}
      <div style={{ width:"260px", flexShrink:0, borderRight:"1px solid rgba(249,115,22,0.12)", background:"rgba(5,7,3,0.6)", overflowY:"auto", padding:"20px 14px" }}>
        <SLabel>8 YER ŞEKLİ</SLabel>
        <div style={{ display:"flex", flexDirection:"column", gap:"6px", marginTop:"12px" }}>
          {LANDFORMS.map(lf=>{
            const active=selected.id===lf.id;
            return (
              <button key={lf.id} onClick={()=>{sndClick();setSelected(lf);}}
                style={{ padding:"12px 14px", background:active?`${lf.color}16`:"rgba(0,0,0,0.22)", border:`2px solid ${active?lf.color:"rgba(249,115,22,0.08)"}`, borderRadius:"10px", cursor:"pointer", textAlign:"left", fontFamily:FONT, transition:"all 0.18s", display:"flex", alignItems:"center", gap:"10px" }}>
                <span style={{ fontSize:"18px", lineHeight:1, filter:active?"none":"grayscale(0.7)" }}>{lf.icon}</span>
                <div>
                  <div style={{ fontSize:"12px", fontWeight:"800", color:active?lf.color:"#5a2e10" }}>{lf.name}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sağ: detay */}
      <div style={{ flex:1, overflowY:"auto", padding:"30px 36px", display:"flex", flexDirection:"column", gap:"20px", background:`radial-gradient(ellipse at 30% 20%,${selected.color}08 0%,${BG} 60%)` }}>
        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          <span style={{ fontSize:"52px", lineHeight:1 }}>{selected.icon}</span>
          <div>
            <div style={{ fontSize:"26px", fontWeight:"800", color:"#fed7aa" }}>{selected.name}</div>
            <div style={{ fontSize:"13px", color:selected.color, fontWeight:"600", marginTop:"4px" }}>Topoğrafya haritasında gösterim</div>
          </div>
        </div>

        <div style={{ height:"2px", background:`linear-gradient(90deg,${selected.color},transparent)`, opacity:0.4, borderRadius:"2px" }}/>

        {/* Açıklama */}
        <div style={{ padding:"20px 24px", background:`${selected.color}0a`, border:`1.5px solid ${selected.color}22`, borderRadius:"14px" }}>
          <p style={{ fontSize:"15px", color:"#d4956a", lineHeight:"1.9", margin:0, fontWeight:"500" }}>{selected.desc}</p>
        </div>

        {/* İzohips kuralı */}
        <div style={{ padding:"16px 20px", background:"rgba(0,0,0,0.3)", border:`1.5px solid ${selected.color}20`, borderRadius:"12px" }}>
          <div style={{ fontSize:"12px", color:selected.color, fontWeight:"800", marginBottom:"8px", letterSpacing:"1px" }}>📐 İZOHİPS'TE NASIL GÖRÜNÜR?</div>
          <p style={{ fontSize:"14px", color:"#7a4a28", lineHeight:"1.8", margin:0, fontWeight:"500" }}>{selected.izohipsRule}</p>
        </div>

        {/* Gerçek örnek */}
        <div style={{ padding:"14px 18px", background:"rgba(0,0,0,0.2)", border:`1px solid rgba(249,115,22,0.12)`, borderRadius:"10px", display:"flex", gap:"12px", alignItems:"center" }}>
          <span style={{ fontSize:"20px" }}>📍</span>
          <div>
            <div style={{ fontSize:"11px", color:"#5a2e10", fontWeight:"700", letterSpacing:"1px", marginBottom:"3px" }}>GERÇEK ÖRNEK</div>
            <div style={{ fontSize:"13px", color:"#8a5030", fontWeight:"600" }}>{selected.example}</div>
          </div>
        </div>

        {/* SVG şekil temsili */}
        <LandformSVG shape={selected} />
      </div>
    </div>
  );
}

function LandformSVG({ shape }: { shape: typeof LANDFORMS[0] }) {
  const c = shape.color;
  const W=500, H=180;
  return (
    <div style={{ padding:"16px 20px", background:"rgba(0,0,0,0.25)", border:`1px solid ${c}15`, borderRadius:"12px" }}>
      <div style={{ fontSize:"11px", color:c, letterSpacing:"2px", fontWeight:"800", marginBottom:"10px", fontFamily:FONT }}>İZOHİPS GÖRÜNÜMÜ</div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", background:"rgba(0,0,0,0.15)", borderRadius:"8px" }}>
        {shape.id==="zirve" && <>
          {[80,60,42,26,12].map((r,i)=><ellipse key={i} cx={120} cy={90} rx={r} ry={r*0.6} fill="none" stroke={c} strokeWidth={i===4?2.5:1.5} opacity={0.4+i*0.12}/>)}
          {[80,60,42,26,12].map((r,i)=><text key={`t${i}`} x={120+r+4} y={93} fontSize="9" fill={c} fontFamily={MONO} opacity="0.7">{i*100}m</text>)}
          <circle cx={120} cy={90} r={4} fill={c}/>
          <text x={130} y={82} fontSize="10" fill={c} fontFamily={FONT} fontWeight="700">Zirve ▲</text>
          <text x={280} y={40} fontSize="12" fill="#8a5030" fontFamily={FONT}>En küçük halka = en yüksek</text>
          <text x={280} y={58} fontSize="12" fill="#8a5030" fontFamily={FONT}>nokta (zirve)</text>
        </>}
        {shape.id==="vadi" && <>
          {[0,20,40,60,80].map((off,i)=>{
            const y=90-off*0.5;
            return <path key={i} d={`M${50+off},${y-30} Q${130},${y+40} ${210-off},${y-30}`} fill="none" stroke={c} strokeWidth="1.5" opacity={0.5+i*0.1}/>;
          })}
          <path d="M130,60 L130,150" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4,3" opacity="0.8"/>
          <text x={135} y={155} fontSize="10" fill="#3b82f6" fontFamily={FONT}>Akarsu</text>
          <text x={260} y={40} fontSize="12" fill="#8a5030" fontFamily={FONT}>Büklüm yüksek yöne doğru</text>
          <text x={260} y={58} fontSize="12" fill="#8a5030" fontFamily={FONT}>(tepeye doğru V şekli)</text>
        </>}
        {shape.id==="sirt" && <>
          {[0,20,40,60,80].map((off,i)=>{
            const y=90+off*0.5;
            return <path key={i} d={`M${50+off},${y+30} Q${130},${y-40} ${210-off},${y+30}`} fill="none" stroke={c} strokeWidth="1.5" opacity={0.5+i*0.1}/>;
          })}
          <text x={260} y={40} fontSize="12" fill="#8a5030" fontFamily={FONT}>Büklüm deniz/ova yönüne</text>
          <text x={260} y={58} fontSize="12" fill="#8a5030" fontFamily={FONT}>(aşağıya doğru ∩ şekli)</text>
          <text x={105} y={30} fontSize="10" fill={c} fontFamily={FONT} fontWeight="700">Sırt</text>
        </>}
        {shape.id==="boyun" && <>
          {/* iki tepe, aralarında boyun */}
          {[60,42,26].map((r,i)=><>
            <ellipse key={`a${i}`} cx={110} cy={90} rx={r} ry={r*0.6} fill="none" stroke={c} strokeWidth="1.5" opacity={0.5+i*0.15}/>
            <ellipse key={`b${i}`} cx={270} cy={90} rx={r} ry={r*0.6} fill="none" stroke={c} strokeWidth="1.5" opacity={0.5+i*0.15}/>
          </>)}
          <path d="M150,90 Q190,110 230,90" fill="none" stroke={c} strokeWidth="2" strokeDasharray="5,3" opacity="0.6"/>
          <text x={170} y={135} fontSize="10" fill={c} fontFamily={FONT} fontWeight="700">Boyun</text>
          <text x={290} y={40} fontSize="12" fill="#8a5030" fontFamily={FONT}>İki tepe arasındaki</text>
          <text x={290} y={58} fontSize="12" fill="#8a5030" fontFamily={FONT}>alçak geçit</text>
        </>}
        {shape.id==="delta" && <>
          {/* Üçgen delta */}
          <polygon points="190,30 280,140 100,140" fill={`${c}20`} stroke={c} strokeWidth="1.5"/>
          <rect x="0" y="140" width="500" height="40" fill="#1a4a9e" opacity="0.4"/>
          <text x="190" y="80" textAnchor="middle" fontSize="11" fill={c} fontFamily={FONT} fontWeight="700">Delta</text>
          <text x="190" y="155" textAnchor="middle" fontSize="10" fill="#3a7acc" fontFamily={FONT}>Deniz</text>
          {/* Kollar */}
          <line x1="190" y1="30" x2="150" y2="140" stroke="#3b82f6" strokeWidth="2" opacity="0.7"/>
          <line x1="190" y1="30" x2="230" y2="140" stroke="#3b82f6" strokeWidth="2" opacity="0.7"/>
          <text x="320" y="50" fontSize="12" fill="#8a5030" fontFamily={FONT}>Kıyıda seyrek ve</text>
          <text x="320" y="68" fontSize="12" fill="#8a5030" fontFamily={FONT}>düz izohipsler</text>
          <text x="320" y="86" fontSize="12" fill="#8a5030" fontFamily={FONT}>(alüvyon düzlüğü)</text>
        </>}
        {shape.id==="falez" && <>
          <rect x="50" y="30" width="100" height="100" fill="#5a3018" stroke={c} strokeWidth="2"/>
          <rect x="0" y="130" width="200" height="50" fill="#1a4a9e" opacity="0.5"/>
          {/* Çok sık izohipsler */}
          {[40,50,60,70,80,90,100,110,120].map((y,i)=><line key={i} x1="200" y1={y} x2="280" y2={y} stroke={c} strokeWidth="1" opacity="0.5"/>)}
          <text x="210" y={35} fontSize="10" fill={c} fontFamily={MONO}>Sık izohipsler</text>
          <text x="210" y={50} fontSize="10" fill={c} fontFamily={MONO}>= Dik falez</text>
          <text x="60" y={165} fontSize="10" fill="#3a7acc" fontFamily={FONT}>Deniz</text>
          <text x="55" y={80} fontSize="10" fill={c} fontFamily={FONT} fontWeight="700">Falez</text>
        </>}
        {shape.id==="cukur" && <>
          {[80,60,42,26].map((r,i)=><ellipse key={i} cx={140} cy={90} rx={r} ry={r*0.6} fill="none" stroke={c} strokeWidth={i===3?2:1.5} opacity={0.4+i*0.15}/>)}
          {/* İçe dönük oklar */}
          {[0,90,180,270].map((angle,i)=>{
            const rad=angle*Math.PI/180;
            const x1=140+95*Math.cos(rad), y1=90+57*Math.sin(rad);
            const x2=140+70*Math.cos(rad), y2=90+42*Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="2" markerEnd={`url(#arrowC)`} opacity="0.7"/>;
          })}
          <defs><marker id="arrowC" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={c}/></marker></defs>
          <text x={200} y={30} fontSize="11" fill={c} fontFamily={FONT} fontWeight="700">İçe dönük ok işaretleri</text>
          <text x={200} y={48} fontSize="11" fill="#8a5030" fontFamily={FONT}>Etrafına göre alçak alan</text>
        </>}
        {shape.id==="selale" && <>
          {/* Akarsu + ani sıklaşan izohipsler */}
          {[30,45,60,75,90].map((x,i)=><line key={i} x1={x} y1="20" x2={x} y2={160} stroke={c} strokeWidth="1.5" opacity={0.3+i*0.1}/>)}
          {/* Şelale — sıkışan noktası */}
          <rect x="100" y="70" width="60" height="30" fill={`${c}20`} stroke={c} strokeWidth="2" strokeDasharray="3,2"/>
          <text x="130" y="91" textAnchor="middle" fontSize="10" fill={c} fontFamily={MONO}>Şelale!</text>
          <text x="130" y="107" textAnchor="middle" fontSize="9" fill={ACCENT} fontFamily={FONT}>Sık izohipsler</text>
          <line x1="130" y1="20" x2="130" y2="165" stroke="#3b82f6" strokeWidth="2.5" opacity="0.6"/>
          <text x="130" y="175" textAnchor="middle" fontSize="9" fill="#3b82f6" fontFamily={FONT}>Akarsu</text>
          <text x="230" y="50" fontSize="12" fill="#8a5030" fontFamily={FONT}>Akarsu üzerinde</text>
          <text x="230" y="68" fontSize="12" fill="#8a5030" fontFamily={FONT}>ani sıklaşan</text>
          <text x="230" y="86" fontSize="12" fill={ACCENT} fontFamily={FONT} fontWeight="700">izohipsler = şelale</text>
        </>}
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFİL SEKMESİ
// ═══════════════════════════════════════════════════════════════════════════════
function ProfileTab() {
  const [step, setStep] = useState(0);
  const STEPS = [
    { title:"1. Adım: Doğruyu çiz", desc:"Profil çıkarılacak iki nokta (A ve B) belirlenir ve aralarına bir doğru çizilir. Bu doğru izohipsleri keser.", color:"#f97316" },
    { title:"2. Adım: Yükseltileri oku", desc:"Belirlenen doğrultudaki eş yükselti eğrilerinin yükselti değerleri bulunur ve doğrunun altına yazılır.", color:"#3b82f6" },
    { title:"3. Adım: İz düşümleri al", desc:"Yükselti değerleri bulunan izohipslerin yükseltilerine göre iz düşümleri (projeksiyon) alınır.", color:"#10b981" },
    { title:"4. Adım: Noktaları birleştir", desc:"İz düşümleri alınan noktalar birleştirilerek arazi profili (yandan görünüş) elde edilir.", color:"#a78bfa" },
  ];

  const PROFILE_POINTS = [
    {x:50,  h:450},
    {x:100, h:475},
    {x:150, h:500},
    {x:200, h:525},
    {x:250, h:525},
    {x:300, h:550},
    {x:350, h:575},
    {x:400, h:600},
    {x:450, h:625},
    {x:500, h:650},
    {x:550, h:675},
    {x:600, h:675},
    {x:650, h:650},
  ];
  const PW=700, PH=280;
  const minH=440, maxH=700;
  const toY = (h:number) => PH - 40 - ((h-minH)/(maxH-minH))*(PH-80);

  return (
    <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", alignItems:"center", padding:"30px 28px", gap:"24px", background:`radial-gradient(ellipse at center,#150800 0%,${BG} 100%)` }}>
      <div style={{ fontSize:"12px", letterSpacing:"3px", color:ACCENT, fontFamily:MONO, opacity:0.8 }}>PROFİL ÇIKARMA</div>
      <div style={{ width:"100%", maxWidth:"720px", padding:"18px 22px", background:"rgba(0,0,0,0.35)", border:`2px solid ${ACCENT}22`, borderRadius:"14px" }}>
        <p style={{ fontSize:"14px", color:"#d4956a", lineHeight:"1.85", margin:0, fontWeight:"500" }}>
          <strong style={{ color:ACCENT }}>Profil</strong>; harita kullanılarak belirlenen iki nokta arasında yer şekillerinin yandan görünüşünü, eğim ve yükselti değerlerini gösteren grafiklerdir. Coğrafya, jeoloji, inşaat mühendisliği ve daha pek çok alanda kullanılır.
        </p>
      </div>

      {/* Adım seçici */}
      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", justifyContent:"center" }}>
        {STEPS.map((s,i)=>(
          <button key={i} onClick={()=>{sndClick();setStep(i);}}
            style={{ padding:"10px 18px", background:step===i?`${s.color}20`:"rgba(0,0,0,0.3)", border:`2px solid ${step===i?s.color:"rgba(249,115,22,0.12)"}`, borderRadius:"9px", cursor:"pointer", fontFamily:FONT, fontSize:"12px", fontWeight:"700", color:step===i?s.color:"#5a2e10", transition:"all 0.18s" }}>
            {s.title.split(":")[0]}
          </button>
        ))}
      </div>

      {/* Aktif adım açıklaması */}
      <div style={{ width:"100%", maxWidth:"720px", padding:"16px 22px", background:`${STEPS[step].color}0e`, border:`1.5px solid ${STEPS[step].color}28`, borderRadius:"12px" }}>
        <div style={{ fontSize:"15px", fontWeight:"800", color:STEPS[step].color, marginBottom:"8px" }}>{STEPS[step].title}</div>
        <p style={{ fontSize:"14px", color:"#8a5030", lineHeight:"1.8", margin:0 }}>{STEPS[step].desc}</p>
      </div>

      {/* İzohips harita (üst) */}
      <div style={{ width:"100%", maxWidth:"720px" }}>
        <div style={{ fontSize:"11px", color:ACCENT, letterSpacing:"2px", fontWeight:"800", marginBottom:"8px", fontFamily:FONT }}>İZOHİPS HARİTASI</div>
        <svg width={PW} height={140} viewBox={`0 ${minH-20} ${PW} 140`} style={{ width:"100%", background:"rgba(0,0,0,0.2)", borderRadius:"10px", border:`1px solid ${ACCENT}15` }}>
          {/* İzohips çizgileri */}
          {[450,475,500,525,550,575,600,625,650,675].map(h=>(
            <line key={h} x1="30" y1={h} x2={PW-30} y2={h} stroke={`hsl(${30+(h-450)/10},60%,40%)`} strokeWidth="1.5" opacity="0.6"/>
          ))}
          {[450,500,550,600,650].map(h=>(
            <text key={h} x="5" y={h+4} fontSize="9" fill={ACCENT} fontFamily={MONO} opacity="0.8">{h}</text>
          ))}
          {/* A-B doğrusu (adım 0+'da) */}
          {step>=0 && <line x1={50} y1={minH+20} x2={650} y2={minH+20} stroke={STEPS[0].color} strokeWidth="2.5"/>}
          {step>=0 && <>
            <circle cx={50} cy={minH+20} r={5} fill={STEPS[0].color}/>
            <text x={42} y={minH+35} fontSize="11" fill={STEPS[0].color} fontFamily={MONO} fontWeight="700">A</text>
            <circle cx={650} cy={minH+20} r={5} fill={STEPS[0].color}/>
            <text x={645} y={minH+35} fontSize="11" fill={STEPS[0].color} fontFamily={MONO} fontWeight="700">B</text>
          </>}
          {/* Kesim noktaları (adım 1+'da) */}
          {step>=1 && PROFILE_POINTS.map((pt,i)=>(
            <g key={i}>
              <circle cx={pt.x} cy={pt.h} r={3} fill={STEPS[1].color}/>
              <text x={pt.x-6} y={pt.h-5} fontSize="8" fill={STEPS[1].color} fontFamily={MONO}>{pt.h}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Profil grafik (alt) */}
      {step>=2 && (
        <div style={{ width:"100%", maxWidth:"720px" }}>
          <div style={{ fontSize:"11px", color:STEPS[2].color, letterSpacing:"2px", fontWeight:"800", marginBottom:"8px", fontFamily:FONT }}>
            {step>=3?"TAMAMLANAN PROFİL":"İZ DÜŞÜMLERI ALINAN NOKTALAR"}
          </div>
          <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`} style={{ width:"100%", background:"rgba(0,0,0,0.2)", borderRadius:"10px", border:`1px solid ${STEPS[step].color}20` }}>
            {/* Y ekseni */}
            {[450,500,550,600,650,700].map(h=>(
              <g key={h}>
                <line x1="45" y1={toY(h)} x2={PW-20} y2={toY(h)} stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
                <text x="40" y={toY(h)+4} textAnchor="end" fontSize="10" fill="#6a3a20" fontFamily={MONO}>{h}</text>
              </g>
            ))}
            <text x="12" y={PH/2} fontSize="10" fill={ACCENT} fontFamily={MONO} transform={`rotate(-90,12,${PH/2})`}>Yükselti (m)</text>
            {/* Noktalar */}
            {PROFILE_POINTS.map((pt,i)=>(
              <circle key={i} cx={pt.x} cy={toY(pt.h)} r={step>=3?3:5} fill={STEPS[2].color} opacity="0.85"/>
            ))}
            {/* Profil çizgisi (adım 3'te) */}
            {step>=3 && (
              <polyline
                points={PROFILE_POINTS.map(pt=>`${pt.x},${toY(pt.h)}`).join(" ")}
                fill="none" stroke={STEPS[3].color} strokeWidth="2.5" strokeLinejoin="round"/>
            )}
            {/* A-B */}
            <text x={50} y={PH-8} fontSize="11" fill={ACCENT} fontFamily={MONO} fontWeight="700">A</text>
            <text x={645} y={PH-8} fontSize="11" fill={ACCENT} fontFamily={MONO} fontWeight="700">B</text>
          </svg>
        </div>
      )}

      {step<3 && (
        <button onClick={()=>setStep(s=>Math.min(3,s+1))}
          style={{ padding:"12px 32px", background:`linear-gradient(90deg,#78200a,${ACCENT})`, border:"none", borderRadius:"10px", color:"#fff", fontSize:"14px", fontWeight:"800", cursor:"pointer", fontFamily:FONT }}>
          ⏭ Sonraki Adım
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SEKMESİ
// ═══════════════════════════════════════════════════════════════════════════════
function TestTab() {
  const [qIdx,    setQIdx]    = useState(0);
  const [sel,     setSel]     = useState<number|null>(null);
  const [score,   setScore]   = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done,    setDone]    = useState(false);
  const q = TEST_ITEMS[qIdx];

  const handleAnswer=(i:number)=>{
    if(sel!==null)return;
    setSel(i);
    const ok=i===q.correct;
    if(ok){setScore(s=>s+10);sndOK();}else sndFail();
    setAnswers(a=>[...a,ok]);
  };
  const next=()=>{sndClick();if(qIdx>=TEST_ITEMS.length-1){setDone(true);return;}setQIdx(i=>i+1);setSel(null);};
  const retry=()=>{setQIdx(0);setSel(null);setScore(0);setAnswers([]);setDone(false);};

  if(done){
    const pct=Math.round((score/(TEST_ITEMS.length*10))*100);
    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"18px", background:`radial-gradient(ellipse at center,#150800 0%,${BG} 100%)` }}>
        <div style={{ fontSize:"60px" }}>⛰️</div>
        <div style={{ fontSize:"28px", fontWeight:"800", color:"#fed7aa", fontFamily:FONT }}>TEST TAMAMLANDI!</div>
        <div style={{ fontSize:"52px", fontWeight:"800", color:pct>=80?"#10b981":pct>=50?ACCENT:"#ef4444", fontFamily:MONO }}>{score} PUAN</div>
        <div style={{ fontSize:"15px", color:"#5a2e10", fontFamily:FONT }}>{answers.filter(Boolean).length}/{TEST_ITEMS.length} doğru · %{pct}</div>
        <div style={{ fontSize:"15px", color:"#7a4a28", textAlign:"center", maxWidth:"420px", lineHeight:"1.8", fontFamily:FONT }}>
          {pct>=80?"🏆 Mükemmel! İzohips ve yer şekillerini çok iyi öğrendin.":pct>=50?"👍 İyi! Öğren ve Yer Şekilleri sekmelerini tekrar incele.":"📚 Tekrar dene! İzohips kurallarını incele."}
        </div>
        <button onClick={retry}
          style={{ padding:"13px 30px", background:`linear-gradient(90deg,#78200a,${ACCENT})`, border:"none", borderRadius:"10px", color:"#fff", fontSize:"14px", fontWeight:"800", cursor:"pointer", fontFamily:FONT }}>
          🔄 Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
      {/* Sol */}
      <div style={{ width:"230px", flexShrink:0, borderRight:"1px solid rgba(249,115,22,0.12)", background:"rgba(5,7,3,0.6)", padding:"22px 16px", display:"flex", flexDirection:"column", gap:"7px", overflowY:"auto" }}>
        <SLabel>SORULAR</SLabel>
        <div style={{ display:"flex", flexDirection:"column", gap:"7px", marginTop:"10px" }}>
          {TEST_ITEMS.map((_,i)=>{
            const d=i<answers.length, cur=i===qIdx;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:"9px", padding:"9px 11px", background:cur?`${ACCENT}12`:"rgba(0,0,0,0.18)", border:`1.5px solid ${cur?ACCENT:d?(answers[i]?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"):"rgba(255,255,255,0.04)"}`, borderRadius:"7px" }}>
                <div style={{ width:"22px", height:"22px", borderRadius:"50%", background:d?(answers[i]?"#10b981":"#ef4444"):cur?ACCENT:"rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:"800", color:"#fff", flexShrink:0, fontFamily:MONO }}>
                  {d?(answers[i]?"✓":"✗"):i+1}
                </div>
                <span style={{ fontSize:"12px", fontWeight:"700", color:cur?ACCENT:d?(answers[i]?"#10b981":"#ef4444"):"#3a1808", fontFamily:FONT }}>Soru {i+1}</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:"auto", padding:"12px 14px", background:`${ACCENT}08`, border:`1px solid ${ACCENT}15`, borderRadius:"9px" }}>
          <div style={{ fontSize:"11px", color:"#5a2e10", fontWeight:"700", letterSpacing:"1px", marginBottom:"4px" }}>PUAN</div>
          <div style={{ fontSize:"32px", fontWeight:"800", color:ACCENT, fontFamily:MONO }}>{score}</div>
          <div style={{ fontSize:"12px", color:"#3a1808" }}>/ {TEST_ITEMS.length*10}</div>
        </div>
      </div>

      {/* Soru alanı */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"28px 36px", overflowY:"auto", gap:"18px" }}>
        {/* İlerleme */}
        <div style={{ width:"100%", maxWidth:"660px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
            <span style={{ fontSize:"12px", color:"#5a2e10", fontWeight:"700", letterSpacing:"1px", fontFamily:FONT }}>SORU {qIdx+1} / {TEST_ITEMS.length}</span>
            <span style={{ fontSize:"12px", color:ACCENT, fontFamily:FONT }}>{Math.round((qIdx/TEST_ITEMS.length)*100)}%</span>
          </div>
          <div style={{ height:"5px", background:`${ACCENT}15`, borderRadius:"3px", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${(qIdx/TEST_ITEMS.length)*100}%`, background:`linear-gradient(90deg,#78200a,${ACCENT})`, borderRadius:"3px", transition:"width 0.4s" }}/>
          </div>
        </div>

        {/* Soru */}
        <div style={{ maxWidth:"660px", width:"100%", padding:"22px 26px", background:`${ACCENT}08`, border:`1.5px solid ${ACCENT}20`, borderRadius:"14px" }}>
          <p style={{ fontSize:"16px", color:"#fed7aa", lineHeight:"1.9", margin:0, fontWeight:"600", fontFamily:FONT }}>{q.q}</p>
        </div>

        {/* Şıklar */}
        <div style={{ maxWidth:"660px", width:"100%", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
          {q.opts.map((opt,i)=>{
            const isSel=sel===i, isCorr=i===q.correct, show=sel!==null;
            let bg="rgba(0,0,0,0.25)", border="rgba(255,255,255,0.07)", color="#6a3a18";
            if(show){if(isCorr){bg=`#10b98112`;border="#10b981";color="#10b981";}else if(isSel){bg="rgba(239,68,68,0.1)";border="#ef4444";color="#ef4444";}}
            else if(isSel){bg=`${ACCENT}12`;border=ACCENT;color=ACCENT;}
            return (
              <button key={i} onClick={()=>handleAnswer(i)} disabled={sel!==null}
                style={{ padding:"14px 16px", background:bg, border:`2px solid ${border}`, borderRadius:"11px", cursor:sel!==null?"default":"pointer", fontFamily:FONT, textAlign:"left", transition:"all 0.18s" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:"10px" }}>
                  <span style={{ width:"23px", height:"23px", borderRadius:"50%", background:show&&isCorr?"#10b981":show&&isSel?"#ef4444":`${ACCENT}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:"800", color:show?"#fff":ACCENT, flexShrink:0, marginTop:"1px", fontFamily:MONO }}>
                    {show&&isCorr?"✓":show&&isSel&&!isCorr?"✗":String.fromCharCode(65+i)}
                  </span>
                  <span style={{ fontSize:"14px", color, fontWeight:"600", lineHeight:"1.6", fontFamily:FONT }}>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Açıklama */}
        {sel!==null && (
          <div style={{ maxWidth:"660px", width:"100%", padding:"16px 20px", background:sel===q.correct?`#10b98108`:"rgba(239,68,68,0.08)", border:`2px solid ${sel===q.correct?"rgba(16,185,129,0.28)":"rgba(239,68,68,0.28)"}`, borderRadius:"13px" }}>
            <div style={{ fontSize:"15px", fontWeight:"800", color:sel===q.correct?"#10b981":"#ef4444", marginBottom:"9px", fontFamily:FONT }}>
              {sel===q.correct?"✅ DOĞRU!":"❌ YANLIŞ!"}
            </div>
            <p style={{ fontSize:"14px", color:"#7a4a28", lineHeight:"1.85", margin:0, fontWeight:"500", fontFamily:FONT }}>{q.exp}</p>
          </div>
        )}

        {sel!==null && (
          <button onClick={next}
            style={{ padding:"13px 36px", background:`linear-gradient(90deg,#78200a,${ACCENT})`, border:"none", borderRadius:"11px", color:"#fff", fontSize:"15px", fontWeight:"800", letterSpacing:"1.5px", cursor:"pointer", fontFamily:FONT }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";}}>
            {qIdx>=TEST_ITEMS.length-1?"🏁 Sonuçları Gör":"⏭ Sonraki Soru"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Yardımcılar ──────────────────────────────────────────────────────────────
function SLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize:"11px", letterSpacing:"2px", color:"#5a2e10", fontWeight:"800", fontFamily:FONT }}>{children}</div>;
}
function SDivider() {
  return <div style={{ height:"1px", background:"rgba(249,115,22,0.1)", margin:"18px 0" }} />;
}