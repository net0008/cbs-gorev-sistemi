"use client";
import { useState, useRef, useEffect } from "react";

// ─── Ses ─────────────────────────────────────────────────────────────────────
function beep(f: number, d: number, t: OscillatorType = "sine", v = 0.13) {
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
const sndFail  = () => beep(200,0.28,"sawtooth",0.11);
const sndClick = () => beep(700,0.07,"square",0.06);
const sndDrop  = () => beep(500,0.12,"sine",0.10);

// ─── Sabitler ────────────────────────────────────────────────────────────────
const FONT  = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const MONO  = "'Courier New',monospace";
const BG    = "#05080f";
const C     = "#6366f1";   // indigo

type Tab = "learn" | "act1" | "act2" | "act3" | "test";

// ─── Komşu ülkeler ────────────────────────────────────────────────────────────
const KARA_KOMSULAR = [
  { id:"ermenistan", name:"Ermenistan",        yon:"Doğu",    renk:"#ef4444" },
  { id:"gurcistan",  name:"Gürcistan",         yon:"Doğu",    renk:"#ef4444" },
  { id:"azerbaycan", name:"Azerbaycan (Nahçıvan)", yon:"Doğu",renk:"#ef4444" },
  { id:"iran",       name:"İran",              yon:"Doğu",    renk:"#ef4444" },
  { id:"irak",       name:"Irak",              yon:"Güney",   renk:"#f97316" },
  { id:"suriye",     name:"Suriye",            yon:"Güney",   renk:"#f97316" },
  { id:"yunanistan", name:"Yunanistan",        yon:"Batı",    renk:"#3b82f6" },
  { id:"bulgaristan",name:"Bulgaristan",       yon:"Batı",    renk:"#3b82f6" },
];
const DENIZ_KOMSULAR = [
  { id:"d_bulgaristan", name:"Bulgaristan",         deniz:"Karadeniz",   renk:"#0ea5e9" },
  { id:"d_romanya",     name:"Romanya",              deniz:"Karadeniz",   renk:"#0ea5e9" },
  { id:"d_ukrayna",     name:"Ukrayna",              deniz:"Karadeniz",   renk:"#0ea5e9" },
  { id:"d_rusya",       name:"Rusya Federasyonu",    deniz:"Karadeniz",   renk:"#0ea5e9" },
  { id:"d_gurcistan",   name:"Gürcistan",            deniz:"Karadeniz",   renk:"#0ea5e9" },
  { id:"d_yunanistan",  name:"Yunanistan",           deniz:"Ege Denizi",  renk:"#6366f1" },
  { id:"d_kktc",        name:"Kuzey Kıbrıs Türk C.", deniz:"Akdeniz",     renk:"#10b981" },
  { id:"d_libya",       name:"Libya",                deniz:"Akdeniz",     renk:"#10b981" },
  { id:"d_misir",       name:"Mısır",                deniz:"Akdeniz",     renk:"#10b981" },
  { id:"d_filistin",    name:"Filistin",             deniz:"Akdeniz",     renk:"#10b981" },
  { id:"d_israil",      name:"İsrail",               deniz:"Akdeniz",     renk:"#10b981" },
  { id:"d_lubnan",      name:"Lübnan",               deniz:"Akdeniz",     renk:"#10b981" },
  { id:"d_suriye",      name:"Suriye",               deniz:"Akdeniz",     renk:"#10b981" },
];

// ─── GZFT verileri ───────────────────────────────────────────────────────────
type GzftCat = "G" | "Z" | "F" | "T";
interface GzftItem { id: string; text: string; cat: GzftCat; }
const GZFT_ITEMS: GzftItem[] = [
  { id:"g1", cat:"G", text:"Üç tarafı denizlerle çevrili — dış ticaret ve ulaşım avantajı" },
  { id:"g2", cat:"G", text:"Asya ile Avrupa'yı birleştiren köprü konumu" },
  { id:"g3", cat:"G", text:"Türk Boğazları (İstanbul & Çanakkale) — Karadeniz-Akdeniz bağlantısı" },
  { id:"g4", cat:"G", text:"Orta enlemlerde yer alması — dört mevsim yaşanması" },
  { id:"g5", cat:"G", text:"Tarihi ticaret yollarının (İpek Yolu) kesişim noktası" },
  { id:"z1", cat:"Z", text:"Siyasi açıdan istikrarsız komşu bölgelere yakınlık" },
  { id:"z2", cat:"Z", text:"Doğu ile batı arasındaki yerel saat farkı (76 dakika)" },
  { id:"z3", cat:"Z", text:"Bölgesel çatışmalara coğrafi yakınlık — güvenlik riski" },
  { id:"f1", cat:"F", text:"Enerji koridoru — Orta Doğu ve Kafkasya kaynaklarını Avrupa'ya taşıma" },
  { id:"f2", cat:"F", text:"Turizm potansiyeli — zengin kültürel miras ve iklim çeşitliliği" },
  { id:"f3", cat:"F", text:"İstanbul'un küresel finans ve ticaret merkezi olma potansiyeli" },
  { id:"f4", cat:"F", text:"Tarım, turizm ve sanayide iklim çeşitliliğinden kaynaklanan zenginlik" },
  { id:"t1", cat:"T", text:"Komşu bölgelerdeki jeopolitik gerilimler — ekonomik istikrar tehdidi" },
  { id:"t2", cat:"T", text:"Bölgesel çatışmaların yarattığı göç baskısı" },
  { id:"t3", cat:"T", text:"Enerji kaynaklarına erişim güvenliğini tehdit eden bölgesel anlaşmazlıklar" },
];
const GZFT_CATS = [
  { id:"G" as GzftCat, label:"GÜÇLÜ YÖNLER",  emoji:"💪", color:"#10b981", bg:"rgba(16,185,129,0.08)" },
  { id:"Z" as GzftCat, label:"ZAYIF YÖNLER",  emoji:"⚠️", color:"#ef4444", bg:"rgba(239,68,68,0.08)" },
  { id:"F" as GzftCat, label:"FIRSATLAR",     emoji:"🚀", color:"#f59e0b", bg:"rgba(245,158,11,0.08)" },
  { id:"T" as GzftCat, label:"TEHDİTLER",     emoji:"🛡️", color:"#8b5cf6", bg:"rgba(139,92,246,0.08)" },
];

// ─── Test soruları ────────────────────────────────────────────────────────────
const TEST_ITEMS = [
  { q:"Türkiye hangi paralel ve meridyen aralığında yer alır?", opts:["26°-42°K ve 36°-45°D","36°-42°K ve 26°-45°D","36°-45°K ve 26°-42°D","26°-36°K ve 42°-45°D"], correct:1, exp:"Türkiye; Ekvator'a göre kuzey yarım kürede 36°-42° kuzey paralelleri, başlangıç meridyenine göre doğu yarım kürede 26°-45° doğu meridyenleri arasında yer alır." },
  { q:"Türkiye'nin doğusu ile batısı arasındaki yerel saat farkı ne kadardır?", opts:["Yaklaşık 30 dakika","Yaklaşık 76 dakika","Yaklaşık 1 saat","Yaklaşık 2 saat"], correct:1, exp:"Türkiye'nin doğusu ile batısı arasında yaklaşık 76 dakikalık bir yerel saat farkı bulunur. Bu fark 26°-45° doğu meridyenleri arasındaki ~19 derecelik farktan kaynaklanır (her 1° için yaklaşık 4 dakika)." },
  { q:"Mutlak konum nedir?", opts:["Ülkenin diğer ülkelere göre konumu","Ekvator ve başlangıç meridyenine göre kesin konum","Komşu ülkelere olan mesafe","Deniz kıyısına yakınlık"], correct:1, exp:"Mutlak konum; bir yerin Ekvator'a ve başlangıç meridyenine (0° meridyeni) göre koordinatlarla ifade edildiği kesin konumdur. Navigasyon ve haritalarda kullanılır." },
  { q:"Türkiye'nin kara sınırı komşularından hangisi DOĞU yönünde değildir?", opts:["Ermenistan","Gürcistan","Bulgaristan","Azerbaycan"], correct:2, exp:"Bulgaristan, Türkiye'nin BATI komşusudur. Doğu komşuları: Ermenistan, Gürcistan, Azerbaycan (Nahçıvan) ve İran'dır. Batı komşuları: Yunanistan ve Bulgaristan'dır." },
  { q:"Türk Boğazları (İstanbul ve Çanakkale) hangi iki denizi birbirine bağlar?", opts:["Ege Denizi - Kızıldeniz","Karadeniz - Akdeniz","Karadeniz - Ege Denizi","Akdeniz - Hint Okyanusu"], correct:1, exp:"Türk Boğazları (İstanbul Boğazı ve Çanakkale Boğazı), Karadeniz'i Akdeniz'e bağlar. Bu özellik Türkiye'nin güvenlik, ticaret ve ulaşım açısından jeopolitik önemini artırır." },
  { q:"Göreceli konum ile mutlak konum arasındaki temel fark nedir?", opts:["Mutlak konum değişebilir, göreceli değişmez","Göreceli konum diğer yerlere göre ilişkisel konumdur; mutlak konum ise koordinatlarla sabittir","İkisi aynı anlama gelir","Göreceli konum yalnızca kıtalara göre belirlenir"], correct:1, exp:"Mutlak konum koordinatlarla (enlem-boylam) kesin olarak belirlenir ve değişmez. Göreceli konum ise bir yerin başka önemli yerlere, nehirlere, dağlara veya şehirlere olan konumsal ilişkisidir; çevre değiştikçe değişebilir." },
  { q:"Türkiye'nin Akdeniz'deki deniz sınırı komşularından hangisi DOĞRU LİSTELENMİŞTİR?", opts:["Romanya, Ukrayna, Rusya","KKTC, Libya, Mısır, Filistin, İsrail, Lübnan, Suriye","Yunanistan, Bulgaristan, İran","Gürcistan, Ermenistan, Azerbaycan"], correct:1, exp:"Türkiye'nin Akdeniz'deki deniz sınırı komşuları: KKTC, Libya, Mısır, Filistin, İsrail, Lübnan ve Suriye'dir. Romanya/Ukrayna/Rusya Karadeniz komşularıdır. Yunanistan hem kara hem Ege komşusudur." },
  { q:"Türkiye'nin orta enlemlerde yer almasının en önemli coğrafi sonucu nedir?", opts:["Yıl boyunca tek mevsim yaşanması","Dört mevsimin belirgin yaşanması","Tropikal iklimin hâkim olması","Çöl iklimine yakın olması"], correct:1, exp:"Türkiye'nin orta enlemlerde (36°-42° kuzey) yer alması, dört mevsimin belirgin biçimde yaşanmasını sağlar. Ekvator yakını tropikal, kutup yakını ise tek mevsimliye yakın iklim özellikleri gösterir." },
  { q:"Türkiye'nin enerji koridoru konumunda olması hangi tür GZFT kategorisine girer?", opts:["Güçlü yön (G)","Zayıf yön (Z)","Fırsat (F)","Tehdit (T)"], correct:2, exp:"Enerji koridoru olmak, var olan bir özelliği kullanarak gelecekte elde edilebilecek bir kazanım olduğu için FIRSAT (F) kategorisindedir. Türkiye, Orta Doğu ve Kafkasya'daki zengin enerji kaynaklarını Avrupa'ya taşıyan boru hatlarının geçtiği bir konumdadır." },
  { q:"Kıbrıs Adası Doğu Akdeniz'de büyüklük sıralamasında kaçıncıdır?", opts:["Birinci","İkinci","Üçüncü değil — birinci","Doğu Akdeniz'in en büyüğü"], correct:3, exp:"Kıbrıs Adası 9.251 km² yüzölçümüyle Sicilya ve Sardunya'dan sonra Akdeniz'in üçüncü büyük adası, Doğu Akdeniz'in ise en büyük adasıdır." },
];

// ═══════════════════════════════════════════════════════════════════════════════
export default function LocationActivity({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("learn");

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id:"learn", icon:"📖", label:"ÖĞREN"    },
    { id:"act1",  icon:"🎯", label:"ETK · 1"  },
    { id:"act2",  icon:"🗺️", label:"ETK · 2"  },
    { id:"act3",  icon:"⚖️", label:"ETK · 3"  },
    { id:"test",  icon:"✏️", label:"TEST"      },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:BG, display:"flex", flexDirection:"column", fontFamily:FONT, touchAction:"none", userSelect:"none", WebkitUserSelect:"none" }}
      onWheel={e=>e.preventDefault()}>

      {/* Üst bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", height:"64px", borderBottom:"1px solid rgba(99,102,241,0.2)", background:"rgba(3,4,10,0.85)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"24px" }}>
          <div>
            <div style={{ fontSize:"10px", letterSpacing:"4px", color:C, opacity:0.6, fontFamily:MONO }}>TÜRKİYE'NİN COĞRAFÎ KONUMU</div>
            <div style={{ fontSize:"20px", fontWeight:"800", color:"#c7d2fe" }}>Mutlak & Göreceli Konum</div>
          </div>
          <div style={{ display:"flex", gap:"3px", background:"rgba(0,0,0,0.4)", padding:"4px", borderRadius:"10px" }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>{sndClick();setTab(t.id);}}
                style={{ padding:"7px 14px", borderRadius:"7px", border:"none", cursor:"pointer", fontFamily:FONT, fontSize:"12px", fontWeight:"700", transition:"all 0.18s",
                  background:tab===t.id?C:"transparent",
                  color:tab===t.id?"#fff":"#3a3a6a" }}>
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
        {tab==="learn" && <LearnTab />}
        {tab==="act1"  && <Act1KoordinatOyunu />}
        {tab==="act2"  && <Act2Komsular />}
        {tab==="act3"  && <Act3Gzft />}
        {tab==="test"  && <TestTab />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ÖĞREN SEKMESİ
// ═══════════════════════════════════════════════════════════════════════════════
function LearnTab() {
  const [section, setSection] = useState<"mutlak"|"goreceli"|"jeopolitik">("mutlak");

  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
      {/* Sol menü */}
      <div style={{ width:"250px", flexShrink:0, borderRight:"1px solid rgba(99,102,241,0.12)", background:"rgba(3,4,10,0.6)", overflowY:"auto", padding:"20px 14px" }}>
        <SLabel>KONULAR</SLabel>
        <div style={{ display:"flex", flexDirection:"column", gap:"7px", marginTop:"12px" }}>
          {([
            { id:"mutlak" as const,    icon:"📍", title:"Mutlak Konum",    sub:"Koordinatlar & paralel/meridyen" },
            { id:"goreceli" as const,  icon:"🌍", title:"Göreceli Konum",  sub:"Komşular & stratejik önem" },
            { id:"jeopolitik" as const,icon:"⚡",  title:"Jeopolitik Önem", sub:"Boğazlar & enerji & kültür" },
          ]).map(s=>(
            <button key={s.id} onClick={()=>{sndClick();setSection(s.id);}}
              style={{ padding:"12px 14px", background:section===s.id?`${C}18`:"rgba(0,0,0,0.22)", border:`2px solid ${section===s.id?C:"rgba(99,102,241,0.08)"}`, borderRadius:"10px", cursor:"pointer", textAlign:"left", fontFamily:FONT, transition:"all 0.18s" }}>
              <div style={{ fontSize:"18px", marginBottom:"4px" }}>{s.icon}</div>
              <div style={{ fontSize:"13px", fontWeight:"800", color:section===s.id?"#c7d2fe":"#3a3a6a" }}>{s.title}</div>
              <div style={{ fontSize:"11px", color:section===s.id?`${C}88`:"#2a2a4a", marginTop:"2px" }}>{s.sub}</div>
            </button>
          ))}
        </div>

        <SDivider />
        <SLabel>HIZLI ÖZET</SLabel>
        <div style={{ marginTop:"10px", display:"flex", flexDirection:"column", gap:"6px" }}>
          {[
            ["36°-42° Kuzey paraleli","Kuzey Yarım Küre"],
            ["26°-45° Doğu meridyeni","Doğu Yarım Küre"],
            ["8 kara komşusu","Doğu/Güney/Batı"],
            ["13 deniz komşusu","3 deniz: K/E/A"],
            ["76 dk saat farkı","Doğu-Batı arası"],
          ].map(([k,v])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 10px", background:"rgba(0,0,0,0.2)", borderRadius:"6px" }}>
              <span style={{ fontSize:"11px", color:"#6366f1", fontWeight:"700" }}>{k}</span>
              <span style={{ fontSize:"11px", color:"#3a3a6a" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sağ: içerik */}
      <div style={{ flex:1, overflowY:"auto", padding:"26px 32px", display:"flex", flexDirection:"column", gap:"20px", background:`radial-gradient(ellipse at 20% 20%,${C}08 0%,${BG} 70%)` }}>

        {section==="mutlak" && (
          <>
            <SectionHeader icon="📍" color={C} title="Mutlak Konum" sub="Koordinatlarla kesin konum belirleme"/>
            <InfoCard color={C}>
              <p style={{ fontSize:"14px", color:"#c7d2fe", lineHeight:"1.9", margin:0, fontWeight:"500" }}>
                Dünya üzerindeki herhangi bir yerin <strong style={{ color:C }}>Ekvator'a</strong> ve <strong style={{ color:C }}>başlangıç meridyenine</strong> göre konumu <strong style={{ color:C }}>mutlak konum</strong> olarak adlandırılır. Mutlak konum; bir yerin Dünya üzerinde nerede bulunduğunun kesin olarak tanımlanmasını sağlar ve navigasyon ile haritalarda kullanılır.
              </p>
            </InfoCard>
            <div style={{ width:"100%", maxWidth:"840px", margin:"0 auto", padding:"16px 20px", background:"rgba(0,0,0,0.28)", border:`1px solid ${C}18`, borderRadius:"12px" }}>
              <div style={{ fontSize:"11px", color:C, letterSpacing:"2px", fontWeight:"800", marginBottom:"12px", fontFamily:FONT }}>TÜRKİYE'NİN KOORDİNATLARI</div>
              <iframe style={{ width: "100%", height: "500px", border: 0, borderRadius: "8px" }} allowFullScreen allow="geolocation" src="//umap.openstreetmap.fr/tr/map/turkiyenin-matematik-konumu_1380349?scaleControl=false&miniMap=false&scrollWheelZoom=true&zoomControl=false&editMode=disabled&moreControl=false&searchControl=false&tilelayersControl=null&embedControl=false&datalayersControl=true&onLoadPanel=none&captionBar=false&captionMenus=false&homeControl=false&fullscreenControl=false&captionControl=false#6/39.155622/35.354004" title="Türkiye'nin Matematik Konumu"></iframe>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
              <InfoBox color="#10b981" title="KUZEY YARI KÜRE" icon="⬆️">
                <div style={{ fontSize:"13px", color:"#3a6a50", lineHeight:"1.8" }}>
                  Türkiye <strong style={{ color:"#10b981" }}>36° - 42° Kuzey</strong> paralelleri arasındadır. Bu orta enlem kuşağı; dört mevsimin belirgin yaşanmasını sağlar.
                </div>
              </InfoBox>
              <InfoBox color={C} title="DOĞU YARI KÜRE" icon="➡️">
                <div style={{ fontSize:"13px", color:"#3a3a6a", lineHeight:"1.8" }}>
                  Türkiye <strong style={{ color:C }}>26° - 45° Doğu</strong> meridyenleri arasındadır. Doğu-batı arası yaklaşık <strong style={{ color:C }}>76 dakikalık</strong> yerel saat farkı vardır.
                </div>
              </InfoBox>
            </div>
            <InfoBox color="#f59e0b" title="ORTA ENLEM ETKİSİ" icon="🌤️">
              <div style={{ fontSize:"13px", color:"#6a4a10", lineHeight:"1.8" }}>
                Türkiye'nin orta enlemlerde yer alması; <strong style={{ color:"#f59e0b" }}>dört mevsimin</strong> belirgin biçimde yaşanmasını sağlar. Ekvator'a yakın ülkelerde tropikal, kutuplara yakın ülkelerde ise tek mevsim egemendir.
              </div>
            </InfoBox>
          </>
        )}

        {section==="goreceli" && (
          <>
            <SectionHeader icon="🌍" color="#10b981" title="Göreceli Konum" sub="Diğer yerlerle ilişkisel konum"/>
            <InfoCard color="#10b981">
              <p style={{ fontSize:"14px", color:"#d1fae5", lineHeight:"1.9", margin:0, fontWeight:"500" }}>
                Göreceli konum, bir yerin <strong style={{ color:"#10b981" }}>diğer yerlerle olan ilişkisini</strong> tanımlar. Bu konum; bir ülkenin jeopolitik, ekonomik ve kültürel ilişkilerini belirler. Göreceli konum, çevredeki ortam değiştikçe zaman içinde değişebilir.
              </p>
            </InfoCard>

            {/* Komşu haritası */}
            <TurkeyNeighborMap />

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
              <InfoBox color="#ef4444" title="KARA KOMSULARI (8)" icon="🤝">
                <div style={{ display:"flex", flexDirection:"column", gap:"5px", marginTop:"6px" }}>
                  {[["Doğu","Ermenistan, Gürcistan, Azerbaycan (Nahçıvan), İran"],["Güney","Irak, Suriye"],["Batı","Yunanistan, Bulgaristan"]].map(([yon,ulkeler])=>(
                    <div key={yon} style={{ fontSize:"12px", color:"#6a3a30", lineHeight:"1.6" }}>
                      <strong style={{ color:"#ef4444" }}>{yon}: </strong>{ulkeler}
                    </div>
                  ))}
                </div>
              </InfoBox>
              <InfoBox color="#0ea5e9" title="DENİZ KOMSULARI (13)" icon="⚓">
                <div style={{ display:"flex", flexDirection:"column", gap:"5px", marginTop:"6px" }}>
                  {[["Karadeniz","Bulgaristan, Romanya, Ukrayna, Rusya, Gürcistan"],["Ege Denizi","Yunanistan"],["Akdeniz","KKTC, Libya, Mısır, Filistin, İsrail, Lübnan, Suriye"]].map(([deniz,ulkeler])=>(
                    <div key={deniz} style={{ fontSize:"12px", color:"#1a4a6a", lineHeight:"1.6" }}>
                      <strong style={{ color:"#0ea5e9" }}>{deniz}: </strong>{ulkeler}
                    </div>
                  ))}
                </div>
              </InfoBox>
            </div>
          </>
        )}

        {section==="jeopolitik" && (
          <>
            <SectionHeader icon="⚡" color="#f59e0b" title="Jeopolitik Önem" sub="Stratejik konum avantajları"/>
            <InfoCard color="#f59e0b">
              <p style={{ fontSize:"14px", color:"#fef3c7", lineHeight:"1.9", margin:0, fontWeight:"500" }}>
                Türkiye, hem coğrafi konumu hem de tarihî ve kültürel bağları nedeniyle <strong style={{ color:"#f59e0b" }}>stratejik bir öneme</strong> sahiptir. Asya ve Avrupa kıtalarını birleştiren benzersiz konumu, Türkiye'yi dünya politikasında anahtar bir aktör hâline getirir.
              </p>
            </InfoCard>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {[
                { icon:"🌊", color:"#0ea5e9", title:"Türk Boğazları", desc:"İstanbul Boğazı ve Çanakkale Boğazı, Karadeniz'i Akdeniz'e bağlar. Güvenlik, ticaret ve ulaşım açısından kritik su yollarıdır." },
                { icon:"⛽", color:"#f97316", title:"Enerji Koridoru", desc:"Orta Doğu ve Kafkasya'daki zengin enerji kaynaklarını Avrupa'ya taşıyan boru hatları Türkiye üzerinden geçer. Bu durum enerji güvenliği açısından Türkiye'yi stratejik kılar." },
                { icon:"🏛️", color:"#a78bfa", title:"Kültürel Miras", desc:"Türkiye, tarihi boyunca birçok medeniyete ev sahipliği yapmış bir ülkedir. Bu zengin kültürel miras, turizm ve uluslararası ilişkilerde önemli bir varlık oluşturur." },
                { icon:"💼", color:"#10b981", title:"Ticaret Merkezi", desc:"Kıtalar arası ticaret yollarının kesişim noktasında yer alan Türkiye, özellikle İstanbul aracılığıyla küresel finans ve ticaret merkezi olma kapasitesi taşır." },
                { icon:"🏝️", color:"#ec4899", title:"Kıbrıs'ın Önemi", desc:"Kıbrıs Adası (9.251 km²), Doğu Akdeniz'in en büyük adasıdır. KKTC'nin varlığı, Türkiye'nin dış politikası ve bölgesel güvenliği açısından kritik bir öneme sahiptir." },
              ].map(item=>(
                <div key={item.title} style={{ padding:"16px 20px", background:`${item.color}08`, border:`1.5px solid ${item.color}22`, borderRadius:"12px", display:"flex", gap:"14px", alignItems:"flex-start" }}>
                  <span style={{ fontSize:"24px", flexShrink:0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize:"14px", fontWeight:"800", color:item.color, marginBottom:"6px" }}>{item.title}</div>
                    <p style={{ fontSize:"13px", color:"#4a4a8a", lineHeight:"1.75", margin:0 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Türkiye komşu haritası (SVG şematik) ────────────────────────────────────
function TurkeyNeighborMap() {
  const [hov, setHov] = useState<string|null>(null);
  // Basit şematik harita koordinatları (SVG)
  const countries = [
    { id:"bulgaristan", name:"Bulgaristan", x:100, y:30,  w:80,  h:45, fill:"#3b82f6" },
    { id:"yunanistan",  name:"Yunanistan",  x:40,  y:70,  w:70,  h:60, fill:"#3b82f6" },
    { id:"turkiye",     name:"TÜRKİYE",     x:120, y:80,  w:260, h:90, fill:"#6366f1" },
    { id:"gurcistan",   name:"Gürcistan",   x:370, y:55,  w:70,  h:35, fill:"#ef4444" },
    { id:"ermenistan",  name:"Ermenistan",  x:380, y:88,  w:55,  h:30, fill:"#ef4444" },
    { id:"azerbaycan",  name:"Azerbaycan",  x:430, y:75,  w:55,  h:28, fill:"#ef4444" },
    { id:"iran",        name:"İran",        x:380, y:115, w:110, h:55, fill:"#ef4444" },
    { id:"irak",        name:"Irak",        x:280, y:165, w:95,  h:50, fill:"#f97316" },
    { id:"suriye",      name:"Suriye",      x:185, y:165, w:100, h:45, fill:"#f97316" },
  ];
  return (
    <div style={{ width:"100%", maxWidth:"580px", padding:"14px 18px", background:"rgba(0,0,0,0.28)", border:`1px solid ${C}18`, borderRadius:"12px" }}>
      <div style={{ fontSize:"11px", color:C, letterSpacing:"2px", fontWeight:"800", marginBottom:"10px", fontFamily:FONT }}>ŞEMATİK KOMŞU HARİTASI — üzerine gel</div>
      <svg width="520" height="240" viewBox="0 0 520 240" style={{ width:"100%" }}>
        {/* Denizler */}
        <rect x="0"   y="0"   width="115" height="240" fill="#1a4a9e" opacity="0.18" rx="4"/>
        <text x="30"  y="130" fontSize="9" fill="#3a7acc" fontFamily={FONT} textAnchor="middle">Ege</text>
        <rect x="120" y="0"   width="270" height="30"  fill="#1a4a9e" opacity="0.15"/>
        <text x="255" y="22"  fontSize="9" fill="#3a7acc" fontFamily={FONT} textAnchor="middle">Karadeniz</text>
        <rect x="120" y="210" width="270" height="30"  fill="#1a4a9e" opacity="0.15"/>
        <text x="255" y="228" fontSize="9" fill="#3a7acc" fontFamily={FONT} textAnchor="middle">Akdeniz</text>
        {countries.map(c=>{
          const isHov=hov===c.id;
          return (
            <g key={c.id} onMouseEnter={()=>setHov(c.id)} onMouseLeave={()=>setHov(null)} style={{ cursor:"pointer" }}>
              <rect x={c.x} y={c.y} width={c.w} height={c.h}
                fill={isHov?c.fill:`${c.fill}60`} stroke={isHov?c.fill:`${c.fill}80`}
                strokeWidth={isHov?2.5:1.5} rx="4" style={{ transition: "all 0.18s" }}/>
              <text x={c.x+c.w/2} y={c.y+c.h/2+4} textAnchor="middle" fontSize={c.id==="turkiye"?14:10}
                fill={c.id==="turkiye"?"#fff":isHov?"#fff":"rgba(255,255,255,0.7)"}
                fontFamily={FONT} fontWeight={c.id==="turkiye"?"800":"600"}>{c.name}</text>
            </g>
          );
        })}
      </svg>
      {hov && hov!=="turkiye" && (
        <div style={{ marginTop:"8px", padding:"8px 12px", background:`${C}12`, border:`1px solid ${C}28`, borderRadius:"7px", fontSize:"12px", color:"#c7d2fe", fontWeight:"700", fontFamily:FONT }}>
          {KARA_KOMSULAR.find(k=>k.id===hov)?.yon} komşusu: {countries.find(c=>c.id===hov)?.name}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ETKİNLİK 1: Koordinat Oyunu
// ═══════════════════════════════════════════════════════════════════════════════
function Act1KoordinatOyunu() {
  // Oyun: Verilen koordinat çiftini harita üzerinde işaretle
  const [score, setScore]     = useState(0);
  const [qIdx, setQIdx]       = useState(0);
  const [clicked, setClicked] = useState<{x:number,y:number}|null>(null);
  const [result, setResult]   = useState<"ok"|"fail"|null>(null);
  const [done, setDone]       = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Harita alanı: lon 26-45, lat 36-42 → SVG 0-640 x 0-280
  const W=640, H=280;
  const lonToX = (lon:number) => ((lon-10)/(70-10))*W;
  const latToY = (lat:number) => ((55-lat)/(55-25))*H;

  interface Question { label:string; lon:number; lat:number; desc:string; }
  const QUESTIONS: Question[] = [
    { label:"Ankara (Başkent)",   lon:32.86, lat:39.93, desc:"Türkiye'nin başkenti" },
    { label:"İstanbul Boğazı",   lon:29.0,  lat:41.0,  desc:"Karadeniz-Akdeniz bağlantısı" },
    { label:"Türkiye'nin en doğusu (Iğdır)", lon:44.5, lat:39.9, desc:"45° Doğu meridyeni yakını" },
    { label:"Türkiye'nin en batısı (Çanakkale)", lon:26.2, lat:40.2, desc:"26° Doğu meridyeni yakını" },
    { label:"Türkiye'nin en güneyindeki nokta (Hatay)", lon:36.2, lat:36.2, desc:"36° Kuzey paraleli yakını" },
  ];

  const q = QUESTIONS[qIdx];
  const targetX = lonToX(q.lon);
  const targetY = latToY(q.lat);
  const TOLERANCE = 40; // piksel

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (result) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const sx = (e.clientX - rect.left) / rect.width * W;
    const sy = (e.clientY - rect.top) / rect.height * H;
    setClicked({x:sx, y:sy});
    const dist = Math.sqrt((sx-targetX)**2 + (sy-targetY)**2);
    if (dist < TOLERANCE) { setResult("ok"); setScore(s=>s+1); sndOK(); }
    else { setResult("fail"); sndFail(); }
  };

  const next = () => {
    sndClick();
    if (qIdx >= QUESTIONS.length-1) { setDone(true); return; }
    setQIdx(i=>i+1); setClicked(null); setResult(null);
  };
  const retry = () => { setQIdx(0); setClicked(null); setResult(null); setScore(0); setDone(false); };

  if (done) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px", background:`radial-gradient(ellipse at center,${C}0a 0%,${BG} 100%)` }}>
      <div style={{ fontSize:"52px" }}>🎯</div>
      <div style={{ fontSize:"28px", fontWeight:"800", color:"#c7d2fe", fontFamily:FONT }}>ETKİNLİK 1 TAMAMLANDI!</div>
      <div style={{ fontSize:"44px", fontWeight:"800", color:C, fontFamily:MONO }}>{score}/{QUESTIONS.length}</div>
      <div style={{ fontSize:"14px", color:"#4a4a8a", fontFamily:FONT }}>koordinatı doğru konumlandırdın</div>
      <button onClick={retry} style={{ padding:"12px 28px", background:`linear-gradient(90deg,#3730a3,${C})`, border:"none", borderRadius:"10px", color:"#fff", fontSize:"14px", fontWeight:"800", cursor:"pointer", fontFamily:FONT }}>🔄 Tekrar Dene</button>
    </div>
  );

  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
      {/* Sol: Talimat */}
      <div style={{ width:"280px", flexShrink:0, borderRight:"1px solid rgba(99,102,241,0.12)", background:"rgba(3,4,10,0.6)", padding:"24px 18px", display:"flex", flexDirection:"column", gap:"16px", overflowY:"auto" }}>
        <div style={{ fontSize:"10px", letterSpacing:"3px", color:C, fontFamily:MONO }}>ETKİNLİK 1</div>
        <div style={{ fontSize:"18px", fontWeight:"800", color:"#c7d2fe", fontFamily:FONT }}>🎯 Koordinat Bul</div>
        <div style={{ padding:"14px 16px", background:`${C}0e`, border:`1.5px solid ${C}25`, borderRadius:"10px", fontSize:"13px", color:"#6a6aaa", lineHeight:"1.8" }}>
          Verilen yeri harita üzerinde bul ve tıkla. Yeşil daireye yakın tıklarsan puan kazanırsın!
        </div>
        <div style={{ padding:"16px 18px", background:"rgba(0,0,0,0.3)", border:`2px solid ${C}30`, borderRadius:"12px" }}>
          <div style={{ fontSize:"11px", color:C, letterSpacing:"2px", marginBottom:"8px", fontFamily:MONO }}>HEDEF {qIdx+1}/{QUESTIONS.length}</div>
          <div style={{ fontSize:"17px", fontWeight:"800", color:"#c7d2fe", marginBottom:"8px" }}>{q.label}</div>
          <div style={{ fontSize:"12px", color:"#4a4a8a" }}>{q.desc}</div>
        </div>
        {result && (
          <div style={{ padding:"14px 16px", background:result==="ok"?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)", border:`2px solid ${result==="ok"?"#10b981":"#ef4444"}30`, borderRadius:"10px" }}>
            <div style={{ fontSize:"16px", fontWeight:"800", color:result==="ok"?"#10b981":"#ef4444", marginBottom:"6px" }}>
              {result==="ok"?"✅ DOĞRU! +1 puan":"❌ Yanlış yere tıkladın"}
            </div>
            <div style={{ fontSize:"12px", color:"#4a4a8a" }}>Yeşil nokta gerçek konumu gösteriyor.</div>
          </div>
        )}
        {result && (
          <button onClick={next} style={{ padding:"12px", background:`linear-gradient(90deg,#3730a3,${C})`, border:"none", borderRadius:"9px", color:"#fff", fontSize:"14px", fontWeight:"800", cursor:"pointer", fontFamily:FONT }}>
            {qIdx>=QUESTIONS.length-1?"🏁 Bitir":"⏭ Sonraki"}
          </button>
        )}
        <div style={{ marginTop:"auto", padding:"10px 14px", background:`${C}08`, border:`1px solid ${C}15`, borderRadius:"8px" }}>
          <div style={{ fontSize:"11px", color:C, fontFamily:MONO }}>PUAN</div>
          <div style={{ fontSize:"28px", fontWeight:"800", color:C, fontFamily:MONO }}>{score}</div>
        </div>
      </div>

      {/* Harita */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px", background:`${BG}` }}>
        <svg ref={svgRef} width={W} height={H} viewBox={`0 0 ${W} ${H}`}
          style={{ width:"100%", maxWidth:W, cursor:"crosshair", borderRadius:"12px", border:`1px solid ${C}20`, background:"rgba(0,0,0,0.25)" }}
          onClick={handleClick}>
          {/* Koordinat ızgarası */}
          {[10,20,30,40,50,60,70].map(lon=>(
            <g key={lon}>
              <line x1={lonToX(lon)} y1={0} x2={lonToX(lon)} y2={H} stroke="rgba(99,102,241,0.2)" strokeWidth="1"/>
              <text x={lonToX(lon)+2} y={H-5} fontSize="9" fill="rgba(99,102,241,0.5)" fontFamily={MONO}>{lon}°D</text>
            </g>
          ))}
          {[25,30,35,40,45,50,55].map(lat=>(
            <g key={lat}>
              <line x1={0} y1={latToY(lat)} x2={W} y2={latToY(lat)} stroke="rgba(99,102,241,0.2)" strokeWidth="1"/>
              <text x={4} y={latToY(lat)-3} fontSize="9" fill="rgba(99,102,241,0.5)" fontFamily={MONO}>{lat}°K</text>
            </g>
          ))}
          {/* Türkiye yaklaşık sınır (basitleştirilmiş dikdörtgen) */}
          <rect x={lonToX(26)} y={latToY(42)} width={lonToX(45)-lonToX(26)} height={latToY(36)-latToY(42)}
            fill="rgba(99,102,241,0.12)" stroke={C} strokeWidth="2" strokeDasharray="6,4" rx="4"/>
          <text x={(lonToX(26)+lonToX(45))/2} y={(latToY(42)+latToY(36))/2+5}
            textAnchor="middle" fontSize="16" fill={`${C}60`} fontFamily={FONT} fontWeight="800">TÜRKİYE</text>

          {/* Hedef (sadece sonuç açıklandıktan sonra göster) */}
          {result && (
            <g>
              <circle cx={targetX} cy={targetY} r={18} fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth="2"/>
              <circle cx={targetX} cy={targetY} r={6}  fill="#10b981"/>
              <text x={targetX+10} y={targetY-10} fontSize="11" fill="#10b981" fontFamily={FONT} fontWeight="700">{q.label}</text>
            </g>
          )}
          {/* Tıklanan nokta */}
          {clicked && (
            <g>
              <circle cx={clicked.x} cy={clicked.y} r={8} fill={result==="ok"?"rgba(16,185,129,0.4)":"rgba(239,68,68,0.4)"} stroke={result==="ok"?"#10b981":"#ef4444"} strokeWidth="2"/>
              <circle cx={clicked.x} cy={clicked.y} r={4} fill={result==="ok"?"#10b981":"#ef4444"}/>
              <text x={clicked.x+10} y={clicked.y-6} fontSize="10" fill={result==="ok"?"#10b981":"#ef4444"} fontFamily={FONT} fontWeight="700">Sen</text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ETKİNLİK 2: Komşuları Sınıflandır
// ═══════════════════════════════════════════════════════════════════════════════
function Act2Komsular() {
  const ALL = [...KARA_KOMSULAR.map(k=>({...k, tip:"kara" as const})), ...DENIZ_KOMSULAR.map(k=>({...k, tip:"deniz" as const}))];
  const shuffled = ALL.sort(()=>Math.random()-0.5).slice(0,12);

  const [placed, setPlaced]     = useState<Record<string,string>>({});
  const [wrong,  setWrong]      = useState<Record<string,boolean>>({});
  const [score,  setScore]      = useState(0);
  const [done,   setDone]       = useState(false);

  const BUCKETS = [
    { id:"kara",      label:"KARA SINIRI",  sub:"8 komşu",  color:"#ef4444", icon:"🤝" },
    { id:"karadeniz", label:"KARADENİZ",    sub:"5 komşu",  color:"#0ea5e9", icon:"🌊" },
    { id:"ege",       label:"EGE DENİZİ",   sub:"1 komşu",  color:"#6366f1", icon:"🌊" },
    { id:"akdeniz",   label:"AKDENİZ",      sub:"7 komşu",  color:"#10b981", icon:"🌊" },
  ];

  const getCorrectBucket = (item: typeof ALL[0]) => {
    if (item.tip==="kara") return "kara";
    const d = (item as typeof DENIZ_KOMSULAR[0]).deniz;
    if (d==="Karadeniz")  return "karadeniz";
    if (d==="Ege Denizi") return "ege";
    return "akdeniz";
  };

  const handleDrop = (itemId: string, bucketId: string) => {
    const item = ALL.find(a=>a.id===itemId);
    if (!item) return;
    const correct = getCorrectBucket(item);
    const isOk = bucketId === correct;
    sndDrop();
    if (isOk) { sndOK(); setScore(s=>s+1); } else { sndFail(); }
    setPlaced(p=>({...p,[itemId]:bucketId}));
    setWrong(w=>({...w,[itemId]:!isOk}));
    const allPlaced = Object.keys({...placed,[itemId]:bucketId}).length === shuffled.length;
    if (allPlaced) setTimeout(()=>setDone(true),400);
  };

  const [drag, setDrag] = useState<string|null>(null);

  const retry = () => { setPlaced({}); setWrong({}); setScore(0); setDone(false); setDrag(null); };

  if (done) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px", background:`radial-gradient(ellipse at center,${C}0a 0%,${BG} 100%)` }}>
      <div style={{ fontSize:"52px" }}>🗺️</div>
      <div style={{ fontSize:"28px", fontWeight:"800", color:"#c7d2fe" }}>ETKİNLİK 2 TAMAMLANDI!</div>
      <div style={{ fontSize:"44px", fontWeight:"800", color:C, fontFamily:MONO }}>{score}/{shuffled.length}</div>
      <div style={{ fontSize:"14px", color:"#4a4a8a" }}>komşu doğru sınıflandırıldı</div>
      <button onClick={retry} style={{ padding:"12px 28px", background:`linear-gradient(90deg,#3730a3,${C})`, border:"none", borderRadius:"10px", color:"#fff", fontSize:"14px", fontWeight:"800", cursor:"pointer", fontFamily:FONT }}>🔄 Tekrar</button>
    </div>
  );

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"20px 24px", gap:"18px", overflowY:"auto", background:`radial-gradient(ellipse at center,${C}08 0%,${BG} 100%)` }}>
      <div>
        <div style={{ fontSize:"10px", letterSpacing:"3px", color:C, fontFamily:MONO, marginBottom:"4px" }}>ETKİNLİK 2</div>
        <div style={{ fontSize:"18px", fontWeight:"800", color:"#c7d2fe" }}>🗺️ Komşuları Sınıflandır</div>
        <div style={{ fontSize:"13px", color:"#4a4a8a", marginTop:"4px" }}>Aşağıdaki ülkeleri doğru kutuya sürükle — Kara sınırı mı, hangi denizde mi?</div>
      </div>

      {/* Sürüklenecek kartlar */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
        {shuffled.filter(it=>!placed[it.id]).map(item=>(
          <div key={item.id} draggable
            onDragStart={()=>setDrag(item.id)}
            onDragEnd={()=>setDrag(null)}
            style={{ padding:"9px 14px", background:"rgba(0,0,0,0.35)", border:`1.5px solid ${C}30`, borderRadius:"8px", cursor:"grab", fontSize:"13px", fontWeight:"700", color:"#c7d2fe", fontFamily:FONT, transition:"all 0.15s", opacity:drag===item.id?0.5:1, boxShadow:drag===item.id?`0 0 16px ${C}60`:"none" }}>
            {item.name}
          </div>
        ))}
        {shuffled.filter(it=>placed[it.id]).map(item=>(
          <div key={item.id} style={{ padding:"9px 14px", background:wrong[item.id]?"rgba(239,68,68,0.1)":"rgba(16,185,129,0.1)", border:`1.5px solid ${wrong[item.id]?"#ef4444":"#10b981"}40`, borderRadius:"8px", fontSize:"13px", fontWeight:"700", color:wrong[item.id]?"#ef4444":"#10b981", fontFamily:FONT, opacity:0.7 }}>
            {wrong[item.id]?"✗ ":"✓ "}{item.name}
          </div>
        ))}
      </div>

      {/* Kutular */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", flex:1 }}>
        {BUCKETS.map(bucket=>(
          <div key={bucket.id}
            onDragOver={e=>{e.preventDefault();}}
            onDrop={e=>{e.preventDefault();if(drag)handleDrop(drag,bucket.id);}}
            style={{ minHeight:"120px", padding:"14px 16px", background:`${bucket.color}08`, border:`2px dashed ${bucket.color}40`, borderRadius:"12px", transition:"all 0.2s" }}>
            <div style={{ fontSize:"13px", fontWeight:"800", color:bucket.color, marginBottom:"4px" }}>{bucket.icon} {bucket.label}</div>
            <div style={{ fontSize:"11px", color:`${bucket.color}99`, marginBottom:"10px" }}>{bucket.sub}</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
              {shuffled.filter(it=>placed[it.id]===bucket.id).map(it=>(
                <div key={it.id} style={{ padding:"5px 10px", background:wrong[it.id]?"rgba(239,68,68,0.15)":"rgba(16,185,129,0.15)", border:`1px solid ${wrong[it.id]?"#ef4444":"#10b981"}50`, borderRadius:"6px", fontSize:"12px", color:wrong[it.id]?"#ef4444":"#10b981", fontWeight:"700" }}>
                  {it.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:"10px 14px", background:`${C}08`, border:`1px solid ${C}15`, borderRadius:"8px", display:"flex", justifyContent:"space-between" }}>
        <span style={{ fontSize:"12px", color:"#4a4a8a" }}>Kalan: {shuffled.filter(it=>!placed[it.id]).length} kart</span>
        <span style={{ fontSize:"14px", fontWeight:"800", color:C, fontFamily:MONO }}>{score} doğru</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ETKİNLİK 3: GZFT Sürükle-Bırak
// ═══════════════════════════════════════════════════════════════════════════════
function Act3Gzft() {
  const [placed, setPlaced] = useState<Record<string,GzftCat>>({});
  const [wrong,  setWrong]  = useState<Record<string,boolean>>({});
  const [score,  setScore]  = useState(0);
  const [done,   setDone]   = useState(false);
  const [drag,   setDrag]   = useState<string|null>(null);

  const handleDrop = (itemId:string, cat:GzftCat) => {
    const item = GZFT_ITEMS.find(i=>i.id===itemId);
    if (!item) return;
    const ok = item.cat === cat;
    sndDrop();
    if (ok) { sndOK(); setScore(s=>s+1); } else sndFail();
    setPlaced(p=>({...p,[itemId]:cat}));
    setWrong(w=>({...w,[itemId]:!ok}));
    const np = {...placed,[itemId]:cat};
    if (Object.keys(np).length === GZFT_ITEMS.length) setTimeout(()=>setDone(true),400);
  };

  const retry = ()=>{setPlaced({});setWrong({});setScore(0);setDone(false);setDrag(null);};

  if (done) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px", background:`radial-gradient(ellipse at center,${C}0a 0%,${BG} 100%)` }}>
      <div style={{ fontSize:"52px" }}>⚖️</div>
      <div style={{ fontSize:"28px", fontWeight:"800", color:"#c7d2fe" }}>GZFT ETKİNLİĞİ TAMAMLANDI!</div>
      <div style={{ fontSize:"44px", fontWeight:"800", color:C, fontFamily:MONO }}>{score}/{GZFT_ITEMS.length}</div>
      <div style={{ fontSize:"14px", color:"#4a4a8a" }}>kart doğru kategoriye yerleştirildi</div>
      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", justifyContent:"center" }}>
        {GZFT_CATS.map(cat=>{
          const correct = GZFT_ITEMS.filter(i=>i.cat===cat.id && !wrong[i.id] && placed[i.id]).length;
          const total   = GZFT_ITEMS.filter(i=>i.cat===cat.id).length;
          return (
            <div key={cat.id} style={{ padding:"10px 18px", background:`${cat.color}12`, border:`1.5px solid ${cat.color}30`, borderRadius:"10px", textAlign:"center" }}>
              <div style={{ fontSize:"14px", color:cat.color, fontWeight:"800" }}>{cat.emoji} {cat.label}</div>
              <div style={{ fontSize:"12px", color:`${cat.color}99` }}>{correct}/{total} doğru</div>
            </div>
          );
        })}
      </div>
      <button onClick={retry} style={{ padding:"12px 28px", background:`linear-gradient(90deg,#3730a3,${C})`, border:"none", borderRadius:"10px", color:"#fff", fontSize:"14px", fontWeight:"800", cursor:"pointer", fontFamily:FONT }}>🔄 Tekrar</button>
    </div>
  );

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"20px 24px", gap:"16px", overflowY:"auto", background:`radial-gradient(ellipse at 30% 20%,${C}08 0%,${BG} 100%)` }}>
      <div>
        <div style={{ fontSize:"10px", letterSpacing:"3px", color:C, fontFamily:MONO, marginBottom:"4px" }}>ETKİNLİK 3 — GZFT ANALİZİ</div>
        <div style={{ fontSize:"18px", fontWeight:"800", color:"#c7d2fe" }}>⚖️ Türkiye'nin Konum Analizi</div>
        <div style={{ fontSize:"13px", color:"#4a4a8a", marginTop:"4px" }}>Her kartı doğru GZFT kategorisine sürükle — G: Güçlü, Z: Zayıf, F: Fırsat, T: Tehdit</div>
      </div>

      {/* Sürüklenecek kartlar */}
      <div style={{ padding:"12px 14px", background:"rgba(0,0,0,0.22)", border:"1px solid rgba(99,102,241,0.12)", borderRadius:"10px" }}>
        <div style={{ fontSize:"11px", color:C, letterSpacing:"2px", fontWeight:"800", marginBottom:"10px", fontFamily:FONT }}>SINIFLANDIRILACAK KARTLAR</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"7px" }}>
          {GZFT_ITEMS.filter(i=>!placed[i.id]).map(item=>(
            <div key={item.id} draggable
              onDragStart={()=>setDrag(item.id)} onDragEnd={()=>setDrag(null)}
              style={{ padding:"9px 12px", background:"rgba(0,0,0,0.4)", border:`1.5px solid ${C}28`, borderRadius:"8px", cursor:"grab", fontSize:"12px", fontWeight:"600", color:"#c7d2fe", fontFamily:FONT, maxWidth:"260px", lineHeight:"1.5", opacity:drag===item.id?0.5:1, transition:"all 0.15s" }}>
              {item.text}
            </div>
          ))}
          {GZFT_ITEMS.filter(i=>placed[i.id]).map(item=>(
            <div key={item.id} style={{ padding:"9px 12px", background:wrong[item.id]?"rgba(239,68,68,0.08)":"rgba(16,185,129,0.08)", border:`1.5px solid ${wrong[item.id]?"#ef4444":"#10b981"}30`, borderRadius:"8px", fontSize:"12px", fontWeight:"600", color:wrong[item.id]?"#ef4444":"#10b981", fontFamily:FONT, maxWidth:"260px", lineHeight:"1.5", opacity:0.6 }}>
              {wrong[item.id]?"✗ ":"✓ "}{item.text.substring(0,30)}…
            </div>
          ))}
        </div>
      </div>

      {/* GZFT kutuları */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", flex:1 }}>
        {GZFT_CATS.map(cat=>(
          <div key={cat.id}
            onDragOver={e=>e.preventDefault()}
            onDrop={e=>{e.preventDefault();if(drag)handleDrop(drag,cat.id);}}
            style={{ minHeight:"130px", padding:"14px 16px", background:cat.bg, border:`2px dashed ${cat.color}35`, borderRadius:"12px" }}>
            <div style={{ fontSize:"14px", fontWeight:"800", color:cat.color, marginBottom:"3px" }}>{cat.emoji} {cat.label}</div>
            <div style={{ fontSize:"11px", color:`${cat.color}80`, marginBottom:"10px" }}>
              {cat.id==="G"?"Var olan avantajlar":cat.id==="Z"?"Var olan dezavantajlar":cat.id==="F"?"Gelecekteki fırsatlar":"Olası tehditler"}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
              {GZFT_ITEMS.filter(i=>placed[i.id]===cat.id).map(it=>(
                <div key={it.id} style={{ padding:"7px 10px", background:wrong[it.id]?"rgba(239,68,68,0.1)":"rgba(16,185,129,0.1)", border:`1px solid ${wrong[it.id]?"#ef4444":"#10b981"}40`, borderRadius:"6px", fontSize:"11px", color:wrong[it.id]?"#ef4444":"#10b981", fontWeight:"600", lineHeight:"1.5" }}>
                  {wrong[it.id]?"✗ ":"✓ "}{it.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:"9px 14px", background:`${C}08`, border:`1px solid ${C}12`, borderRadius:"8px", display:"flex", justifyContent:"space-between" }}>
        <span style={{ fontSize:"12px", color:"#4a4a8a" }}>Kalan: {GZFT_ITEMS.filter(i=>!placed[i.id]).length} kart</span>
        <span style={{ fontSize:"14px", fontWeight:"800", color:C, fontFamily:MONO }}>{score}/{GZFT_ITEMS.length} doğru</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST
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
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"18px", background:`radial-gradient(ellipse at center,${C}0a 0%,${BG} 100%)` }}>
        <div style={{ fontSize:"60px" }}>🌐</div>
        <div style={{ fontSize:"28px", fontWeight:"800", color:"#c7d2fe", fontFamily:FONT }}>TEST TAMAMLANDI!</div>
        <div style={{ fontSize:"52px", fontWeight:"800", color:pct>=80?"#10b981":pct>=50?"#f59e0b":"#ef4444", fontFamily:MONO }}>{score} PUAN</div>
        <div style={{ fontSize:"15px", color:"#4a4a8a" }}>{answers.filter(Boolean).length}/{TEST_ITEMS.length} doğru · %{pct}</div>
        <div style={{ fontSize:"15px", color:"#6a6aaa", textAlign:"center", maxWidth:"420px", lineHeight:"1.8" }}>
          {pct>=80?"🏆 Mükemmel! Türkiye'nin coğrafi konumunu çok iyi öğrendin.":pct>=50?"👍 İyi! Öğren sekmesini tekrar incele.":"📚 Tekrar dene! Mutlak-göreceli konum farkını incele."}
        </div>
        <button onClick={retry} style={{ padding:"13px 30px", background:`linear-gradient(90deg,#3730a3,${C})`, border:"none", borderRadius:"10px", color:"#fff", fontSize:"14px", fontWeight:"800", cursor:"pointer", fontFamily:FONT }}>🔄 Tekrar Dene</button>
      </div>
    );
  }

  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
      {/* Sol */}
      <div style={{ width:"230px", flexShrink:0, borderRight:"1px solid rgba(99,102,241,0.12)", background:"rgba(3,4,10,0.6)", padding:"22px 16px", display:"flex", flexDirection:"column", gap:"7px", overflowY:"auto" }}>
        <SLabel>SORULAR</SLabel>
        <div style={{ display:"flex", flexDirection:"column", gap:"6px", marginTop:"10px" }}>
          {TEST_ITEMS.map((_,i)=>{
            const d=i<answers.length, cur=i===qIdx;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:"9px", padding:"9px 11px", background:cur?`${C}12`:"rgba(0,0,0,0.18)", border:`1.5px solid ${cur?C:d?(answers[i]?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"):"rgba(255,255,255,0.04)"}`, borderRadius:"7px" }}>
                <div style={{ width:"22px", height:"22px", borderRadius:"50%", background:d?(answers[i]?"#10b981":"#ef4444"):cur?C:"rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:"800", color:"#fff", flexShrink:0, fontFamily:MONO }}>
                  {d?(answers[i]?"✓":"✗"):i+1}
                </div>
                <span style={{ fontSize:"12px", fontWeight:"700", color:cur?"#c7d2fe":d?(answers[i]?"#10b981":"#ef4444"):"#3a3a6a", fontFamily:FONT }}>Soru {i+1}</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:"auto", padding:"12px 14px", background:`${C}08`, border:`1px solid ${C}15`, borderRadius:"9px" }}>
          <div style={{ fontSize:"11px", color:"#4a4a8a", fontWeight:"700", letterSpacing:"1px", marginBottom:"4px" }}>PUAN</div>
          <div style={{ fontSize:"32px", fontWeight:"800", color:C, fontFamily:MONO }}>{score}</div>
          <div style={{ fontSize:"12px", color:"#3a3a6a" }}>/ {TEST_ITEMS.length*10}</div>
        </div>
      </div>

      {/* Soru */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"28px 36px", overflowY:"auto", gap:"18px" }}>
        <div style={{ width:"100%", maxWidth:"660px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
            <span style={{ fontSize:"12px", color:"#4a4a8a", fontWeight:"700", letterSpacing:"1px", fontFamily:FONT }}>SORU {qIdx+1} / {TEST_ITEMS.length}</span>
            <span style={{ fontSize:"12px", color:C, fontFamily:FONT }}>{Math.round((qIdx/TEST_ITEMS.length)*100)}%</span>
          </div>
          <div style={{ height:"5px", background:`${C}18`, borderRadius:"3px", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${(qIdx/TEST_ITEMS.length)*100}%`, background:`linear-gradient(90deg,#3730a3,${C})`, borderRadius:"3px", transition:"width 0.4s" }}/>
          </div>
        </div>
        <div style={{ maxWidth:"660px", width:"100%", padding:"22px 26px", background:`${C}08`, border:`1.5px solid ${C}20`, borderRadius:"14px" }}>
          <p style={{ fontSize:"16px", color:"#c7d2fe", lineHeight:"1.9", margin:0, fontWeight:"600", fontFamily:FONT }}>{q.q}</p>
        </div>
        <div style={{ maxWidth:"660px", width:"100%", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
          {q.opts.map((opt,i)=>{
            const isSel=sel===i, isCorr=i===q.correct, show=sel!==null;
            let bg="rgba(0,0,0,0.25)", border="rgba(255,255,255,0.07)", color="#6a6aaa";
            if(show){if(isCorr){bg=`#10b98112`;border="#10b981";color="#10b981";}else if(isSel){bg="rgba(239,68,68,0.1)";border="#ef4444";color="#ef4444";}}
            return (
              <button key={i} onClick={()=>handleAnswer(i)} disabled={sel!==null}
                style={{ padding:"14px 16px", background:bg, border:`2px solid ${border}`, borderRadius:"11px", cursor:sel!==null?"default":"pointer", fontFamily:FONT, textAlign:"left", transition:"all 0.18s" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:"10px" }}>
                  <span style={{ width:"23px", height:"23px", borderRadius:"50%", background:show&&isCorr?"#10b981":show&&isSel?"#ef4444":`${C}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:"800", color:show?"#fff":"#c7d2fe", flexShrink:0, marginTop:"1px", fontFamily:MONO }}>
                    {show&&isCorr?"✓":show&&isSel&&!isCorr?"✗":String.fromCharCode(65+i)}
                  </span>
                  <span style={{ fontSize:"14px", color, fontWeight:"600", lineHeight:"1.6" }}>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>
        {sel!==null && (
          <div style={{ maxWidth:"660px", width:"100%", padding:"16px 20px", background:sel===q.correct?"rgba(16,185,129,0.08)":"rgba(239,68,68,0.08)", border:`2px solid ${sel===q.correct?"rgba(16,185,129,0.28)":"rgba(239,68,68,0.28)"}`, borderRadius:"13px" }}>
            <div style={{ fontSize:"15px", fontWeight:"800", color:sel===q.correct?"#10b981":"#ef4444", marginBottom:"9px" }}>{sel===q.correct?"✅ DOĞRU!":"❌ YANLIŞ!"}</div>
            <p style={{ fontSize:"14px", color:"#6a6aaa", lineHeight:"1.85", margin:0, fontWeight:"500" }}>{q.exp}</p>
          </div>
        )}
        {sel!==null && (
          <button onClick={next} style={{ padding:"13px 36px", background:`linear-gradient(90deg,#3730a3,${C})`, border:"none", borderRadius:"11px", color:"#fff", fontSize:"15px", fontWeight:"800", letterSpacing:"1.5px", cursor:"pointer", fontFamily:FONT }}
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
  return <div style={{ fontSize:"11px", letterSpacing:"2px", color:"#3a3a6a", fontWeight:"800", fontFamily:FONT }}>{children}</div>;
}
function SDivider() {
  return <div style={{ height:"1px", background:"rgba(99,102,241,0.1)", margin:"16px 0" }} />;
}
function InfoCard({ color, children }: { color:string; children: React.ReactNode }) {
  return <div style={{ padding:"20px 24px", background:`${color}0a`, border:`1.5px solid ${color}22`, borderRadius:"14px" }}>{children}</div>;
}
function InfoBox({ color, title, icon, children }: { color:string; title:string; icon:string; children:React.ReactNode }) {
  return (
    <div style={{ padding:"16px 18px", background:`${color}08`, border:`1px solid ${color}20`, borderRadius:"12px" }}>
      <div style={{ fontSize:"12px", color, fontWeight:"800", marginBottom:"8px", letterSpacing:"1px" }}>{icon} {title}</div>
      {children}
    </div>
  );
}
function SectionHeader({ icon, color, title, sub }: { icon:string; color:string; title:string; sub:string }) {
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"8px" }}>
        <span style={{ fontSize:"32px" }}>{icon}</span>
        <div>
          <div style={{ fontSize:"22px", fontWeight:"800", color:"#c7d2fe" }}>{title}</div>
          <div style={{ fontSize:"13px", color, fontWeight:"600" }}>{sub}</div>
        </div>
      </div>
      <div style={{ height:"2px", background:`linear-gradient(90deg,${color},transparent)`, opacity:0.4, borderRadius:"2px" }} />
    </div>
  );
}