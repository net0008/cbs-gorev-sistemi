"use client";
import { useState, useRef, useEffect } from "react";
import { FONT_SANS, FONT_MONO, BG_DARK, COLOR_LOCATION, COLOR_SUCCESS, COLOR_ERROR, COLOR_ACCENT, COLOR_UA, COLOR_CBS, COLOR_TOPO, COLOR_PINK, COLOR_BLUE, COLOR_SECONDARY } from "./theme";

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
type Tab = "learn"|"act1"|"act2"|"act3"|"test";

// Komsu ulkeler
const KARA_KOMSULAR = [
  { id:"ermenistan", name:"Ermenistan",            yon:"Dogu",  renk:"#ef4444" },
  { id:"gurcistan",  name:"Gurcistan",             yon:"Dogu",  renk:"#ef4444" },
  { id:"azerbaycan", name:"Azerbaycan (Nahcivan)",  yon:"Dogu",  renk:"#ef4444" },
  { id:"iran",       name:"Iran",                  yon:"Dogu",  renk:"#ef4444" },
  { id:"irak",       name:"Irak",                  yon:"Guney", renk:"#f97316" },
  { id:"suriye",     name:"Suriye",                yon:"Guney", renk:"#f97316" },
  { id:"yunanistan", name:"Yunanistan",             yon:"Bati",  renk:"#3b82f6" },
  { id:"bulgaristan",name:"Bulgaristan",            yon:"Bati",  renk:"#3b82f6" },
];
const DENIZ_KOMSULAR = [
  { id:"d_bulgaristan", name:"Bulgaristan",          deniz:"Karadeniz",  renk:"#0ea5e9" },
  { id:"d_romanya",     name:"Romanya",               deniz:"Karadeniz",  renk:"#0ea5e9" },
  { id:"d_ukrayna",     name:"Ukrayna",               deniz:"Karadeniz",  renk:"#0ea5e9" },
  { id:"d_rusya",       name:"Rusya Federasyonu",     deniz:"Karadeniz",  renk:"#0ea5e9" },
  { id:"d_gurcistan",   name:"Gurcistan",             deniz:"Karadeniz",  renk:"#0ea5e9" },
  { id:"d_yunanistan",  name:"Yunanistan",             deniz:"Ege Denizi", renk:"#6366f1" },
  { id:"d_kktc",        name:"Kuzey Kibris Turk C.",  deniz:"Akdeniz",    renk:"#10b981" },
  { id:"d_libya",       name:"Libya",                 deniz:"Akdeniz",    renk:"#10b981" },
  { id:"d_misir",       name:"Misir",                 deniz:"Akdeniz",    renk:"#10b981" },
  { id:"d_filistin",    name:"Filistin",              deniz:"Akdeniz",    renk:"#10b981" },
  { id:"d_israil",      name:"Israil",                deniz:"Akdeniz",    renk:"#10b981" },
  { id:"d_lubnan",      name:"Lubnan",                deniz:"Akdeniz",    renk:"#10b981" },
  { id:"d_suriye",      name:"Suriye",                deniz:"Akdeniz",    renk:"#10b981" },
];

type GzftCat = "G"|"Z"|"F"|"T";
interface GzftItem { id:string; text:string; cat:GzftCat; }
const GZFT_ITEMS: GzftItem[] = [
  { id:"g1", cat:"G", text:"Uc tarafi denizlerle cevrili - dis ticaret ve ulasim avantaji" },
  { id:"g2", cat:"G", text:"Asya ile Avrupa'yi birlestiren kopru konumu" },
  { id:"g3", cat:"G", text:"Turk Bogazlari (Istanbul & Canakkale) - Karadeniz-Akdeniz baglantisi" },
  { id:"g4", cat:"G", text:"Orta enlemlerde yer almasi - dort mevsim yasanmasi" },
  { id:"g5", cat:"G", text:"Tarihi ticaret yollarinin (Ipek Yolu) kesisim noktasi" },
  { id:"z1", cat:"Z", text:"Siyasi acidan istikrarsiz komsu bolgelere yakinlik" },
  { id:"z2", cat:"Z", text:"Dogu ile bati arasindaki yerel saat farki (76 dakika)" },
  { id:"z3", cat:"Z", text:"Bolgesel catismalara cografi yakinlik - guvenlik riski" },
  { id:"f1", cat:"F", text:"Enerji koridoru - Orta Dogu ve Kafkasya kaynaklarini Avrupa'ya tasima" },
  { id:"f2", cat:"F", text:"Turizm potansiyeli - zengin kulturel miras ve iklim cesitliligi" },
  { id:"f3", cat:"F", text:"Istanbul'un kuresel finans ve ticaret merkezi olma potansiyeli" },
  { id:"f4", cat:"F", text:"Tarim, turizm ve sanayide iklim cesitliliginden kaynaklanan zenginlik" },
  { id:"t1", cat:"T", text:"Komsu bolgelerdeki jeopolitik gerilimler - ekonomik istikrar tehdidi" },
  { id:"t2", cat:"T", text:"Bolgesel catismalarin yarattigi goc baskisi" },
  { id:"t3", cat:"T", text:"Enerji kaynaklarina erisim guvenligini tehdit eden bolgesel anlasmazliklar" },
];
const GZFT_CATS = [
  { id:"G" as GzftCat, label:"GUCLU YONLER",  emoji:"\u{1F4AA}", color:"#10b981", bg:"rgba(16,185,129,0.08)" },
  { id:"Z" as GzftCat, label:"ZAYIF YONLER",  emoji:"\u26A0\uFE0F", color:"#ef4444", bg:"rgba(239,68,68,0.08)" },
  { id:"F" as GzftCat, label:"FIRSATLAR",     emoji:"\u{1F680}", color:"#f59e0b", bg:"rgba(245,158,11,0.08)" },
  { id:"T" as GzftCat, label:"TEHDITLER",     emoji:"\u{1F6E1}\uFE0F", color:"#8b5cf6", bg:"rgba(139,92,246,0.08)" },
];

const TEST_ITEMS = [
  { q:"Turkiye hangi paralel ve meridyen araliginda yer alir?", opts:["26-42K ve 36-45D","36-42K ve 26-45D","36-45K ve 26-42D","26-36K ve 42-45D"], correct:1, exp:"Turkiye; 36-42 kuzey paralelleri, 26-45 dogu meridyenleri arasinda yer alir." },
  { q:"Turkiye'nin dogusu ile batisi arasindaki yerel saat farki ne kadardir?", opts:["Yaklasik 30 dakika","Yaklasik 76 dakika","Yaklasik 1 saat","Yaklasik 2 saat"], correct:1, exp:"Yaklasik 76 dakikalik yerel saat farki bulunur." },
  { q:"Mutlak konum nedir?", opts:["Ulkenin diger ulkelere gore konumu","Ekvator ve baslangic meridyenine gore kesin konum","Komsu ulkelere olan mesafe","Deniz kiyisina yakinlik"], correct:1, exp:"Mutlak konum koordinatlarla ifade edilen kesin konumdur." },
  { q:"Turkiye'nin kara siniri komsularindan hangisi DOGU yonunde degildir?", opts:["Ermenistan","Gurcistan","Bulgaristan","Azerbaycan"], correct:2, exp:"Bulgaristan BATI komsusudur. Dogu: Ermenistan, Gurcistan, Azerbaycan, Iran." },
  { q:"Turk Bogazlari hangi iki denizi birlestirir?", opts:["Ege-Kizildeniz","Karadeniz-Akdeniz","Karadeniz-Ege","Akdeniz-Hint Okyanusu"], correct:1, exp:"Turk Bogazlari Karadeniz'i Akdeniz'e baglar." },
  { q:"Gorecel konum ile mutlak konum arasindaki temel fark nedir?", opts:["Mutlak degisebilir","Goreceli iliskisel; mutlak koordinatlarla sabittir","Ikisi ayni anlama gelir","Goreceli yalniz kitalara gore belirlenir"], correct:1, exp:"Mutlak konum koordinatlarla kesin; goreceli ise iliskiseldir." },
  { q:"Turkiye'nin Akdeniz'deki deniz siniri komsularindan hangisi dogru listelenmistir?", opts:["Romanya, Ukrayna, Rusya","KKTC, Libya, Misir, Filistin, Israil, Lubnan, Suriye","Yunanistan, Bulgaristan, Iran","Gurcistan, Ermenistan, Azerbaycan"], correct:1, exp:"Akdeniz deniz siniri komsulari: KKTC, Libya, Misir, Filistin, Israil, Lubnan, Suriye." },
  { q:"Turkiye'nin orta enlemlerde yer almasinin en onemli sonucu nedir?", opts:["Yil boyunca tek mevsim","Dort mevsimin belirgin yasanmasi","Tropikal iklimin hakimiyeti","Col iklimine yakinlik"], correct:1, exp:"36-42 kuzey enlemi dort mevsimin belirgin yasanmasini saglar." },
  { q:"Turkiye'nin enerji koridoru konumunda olmasi hangi GZFT kategorisine girer?", opts:["Guclu yon (G)","Zayif yon (Z)","Firsat (F)","Tehdit (T)"], correct:2, exp:"Enerji koridoru olmak gelecekte elde edilecek kazanim oldugu icin FIRSAT (F) kategorisindedir." },
  { q:"Kibris Adasi Dogu Akdeniz'de buyukluk siralamasi nedir?", opts:["En buyuk ada","Ikinci buyuk","Ucuncu","Dorduncu"], correct:0, exp:"Kibris (9.251 km2) Dogu Akdeniz'in en buyuk adasidir." },
];

// ─── Koordinat soruları
interface Soru {
  id: number;
  soru: string;
  cevap: string;
  options: string[];
  lat: number;
  lon: number;
  zoom: number;
  ipucu: string;
}

const KOORDINAT_SORULARI: Soru[] = [
  { id: 1, soru: "Türkiye'nin en kuzey noktası (Sinop/İnceburun) hangi paralele yakındır?", cevap: "42° Kuzey", options: ["36° Kuzey", "38° Kuzey", "40° Kuzey", "42° Kuzey"], lat: 42.02, lon: 35.15, zoom: 8, ipucu: "Haritanın en üst noktasındaki İnceburun'a odaklan." },
  { id: 2, soru: "Türkiye'nin en güney noktası (Hatay/Beysun) hangi paralele yakındır?", cevap: "36° Kuzey", options: ["36° Kuzey", "38° Kuzey", "42° Kuzey", "45° Kuzey"], lat: 35.90, lon: 36.15, zoom: 8, ipucu: "Haritanın en altındaki Hatay sınırına bak." },
  { id: 3, soru: "Türkiye'nin en batı noktası (Gökçeada/Avlaka) hangi meridyene yakındır?", cevap: "26° Doğu", options: ["26° Doğu", "36° Doğu", "42° Doğu", "45° Doğu"], lat: 40.10, lon: 25.66, zoom: 8, ipucu: "Gökçeada civarındaki en sol dikey çizgiyi incele." },
  { id: 4, soru: "Türkiye'nin en doğu noktası (Iğdır/Dilucu) hangi meridyene yakındır?", cevap: "45° Doğu", options: ["26° Doğu", "36° Doğu", "42° Doğu", "45° Doğu"], lat: 39.65, lon: 44.80, zoom: 8, ipucu: "Iğdır'daki en sağ dikey çizgiyi kontrol et." },
  { id: 5, soru: "Ankara'nın koordinatları yaklaşık olarak nedir?", cevap: "40° Kuzey - 33° Doğu", options: ["36°K - 30°D", "40° Kuzey - 33° Doğu", "42°K - 35°D", "38°K - 28°D"], lat: 39.93, lon: 32.85, zoom: 7, ipucu: "İç Anadolu'daki kesişim noktasına odaklan." },
  { id: 6, soru: "Türkiye, Ekvator çizgisine göre hangi yarım kürede yer alır?", cevap: "Kuzey Yarım Küre", options: ["Kuzey Yarım Küre", "Güney Yarım Küre", "Batı Yarım Küre", "Doğu Yarım Küre"], lat: 39.00, lon: 35.00, zoom: 4, ipucu: "Ekvator'un (0°) kuzeyinde miyiz yoksa güneyinde mi?" },
  { id: 7, soru: "Türkiye, Başlangıç Meridyeni'ne (Greenwich) göre hangi taraftadır?", cevap: "Doğu Yarım Küre", options: ["Kuzey Yarım Küre", "Güney Yarım Küre", "Batı Yarım Küre", "Doğu Yarım Küre"], lat: 39.00, lon: 35.00, zoom: 4, ipucu: "0° meridyeninin sağında (doğusunda) yer alıyoruz." },
  { id: 8, soru: "Türkiye'nin en kuzeyi ile en güneyi arasındaki enlem farkı kaçtır?", cevap: "6 Derece", options: ["6 Derece", "19 Derece", "76 Derece", "10 Derece"], lat: 39.00, lon: 35.00, zoom: 5, ipucu: "36° ve 42° paralelleri arasındaki farkı hesapla." }
];

// ═══════════════════════════════════════════════════════════════════════════════
export default function LocationActivity({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("learn");
  const TABS = [
    { id:"learn" as Tab, icon:"📖", label:"OGREN"   },
    { id:"act1"  as Tab, icon:"🎯", label:"ETK · 1" },
    { id:"act2"  as Tab, icon:"🗺️", label:"ETK · 2" },
    { id:"act3"  as Tab, icon:"⚖️", label:"ETK · 3" },
    { id:"test"  as Tab, icon:"✏️", label:"TEST"     },
  ];
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:BG, display:"flex", flexDirection:"column", fontFamily:FONT, userSelect:"none", WebkitUserSelect:"none" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", height:"64px", borderBottom:"1px solid rgba(99,102,241,0.2)", background:"rgba(3,4,10,0.85)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"24px" }}>
          <div>
            <div style={{ fontSize:"10px", letterSpacing:"4px", color:C, opacity:0.6, fontFamily:MONO }}>TURKIYE COGRAFI KONUMU</div>
            <div style={{ fontSize:"20px", fontWeight:"800", color:"#c7d2fe" }}>Mutlak & Goreceli Konum</div>
          </div>
          <div style={{ display:"flex", gap:"3px", background:"rgba(0,0,0,0.4)", padding:"4px", borderRadius:"10px" }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>{sndClick();setTab(t.id);}}
                style={{ padding:"7px 14px", borderRadius:"7px", border:"none", cursor:"pointer", fontFamily:FONT, fontSize:"12px", fontWeight:"700", transition:"all 0.18s", background:tab===t.id?C:"transparent", color:tab===t.id?"#fff":"#3a3a6a" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose}
          style={{ padding:"8px 18px", background:"transparent", border:"1px solid rgba(255,80,80,0.3)", borderRadius:"8px", color:"#ff7070", fontSize:"12px", fontWeight:"700", cursor:"pointer", fontFamily:FONT }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,80,80,0.1)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
          X KAPAT
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

// ═══ OGREN ═══════════════════════════════════════════════════════════════════
function LearnTab() {
  const [section, setSection] = useState<"mutlak"|"goreceli"|"jeopolitik">("mutlak");
  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
      <div style={{ width:"250px", flexShrink:0, borderRight:"1px solid rgba(99,102,241,0.12)", background:"rgba(3,4,10,0.6)", overflowY:"auto", padding:"20px 14px" }}>
        <SLabel>KONULAR</SLabel>
        <div style={{ display:"flex", flexDirection:"column", gap:"7px", marginTop:"12px" }}>
          {([
            { id:"mutlak" as const,    icon:"📍", title:"Mutlak Konum",    sub:"Koordinatlar & paralel/meridyen" },
            { id:"goreceli" as const,  icon:"🌍", title:"Goreceli Konum",  sub:"Komsular & stratejik onem" },
            { id:"jeopolitik" as const,icon:"⚡",  title:"Jeopolitik Onem", sub:"Bogazlar & enerji & kultur" },
          ]).map(s=>(
            <button key={s.id} onClick={()=>{sndClick();setSection(s.id);}}
              style={{ padding:"12px 14px", background:section===s.id?`${COLOR_LOCATION}18`:"rgba(0,0,0,0.22)", border:`2px solid ${section===s.id?COLOR_LOCATION:"rgba(99,102,241,0.08)"}`, borderRadius:"10px", cursor:"pointer", textAlign:"left", fontFamily:FONT_SANS, transition:"all 0.18s" }}>
              <div style={{ fontSize:"18px", marginBottom:"4px" }}>{s.icon}</div>
              <div style={{ fontSize:"13px", fontWeight:"800", color:section===s.id?"#c7d2fe":"#3a3a6a" }}>{s.title}</div>
              <div style={{ fontSize:"11px", color:section===s.id?`${C}88`:"#2a2a4a", marginTop:"2px" }}>{s.sub}</div>
            </button>
          ))}
        </div>
        <SDivider />
        <SLabel>HIZLI OZET</SLabel>
        <div style={{ marginTop:"10px", display:"flex", flexDirection:"column", gap:"6px" }}>
          {[["36-42 Kuzey paraleli","Kuzey Yarim Kure"],["26-45 Dogu meridyeni","Dogu Yarim Kure"],["8 kara komsulari","D/G/B"],["13 deniz komsulari","3 deniz: K/E/A"],["76 dk saat farki","Dogu-Bati arasi"]].map(([k,v])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 10px", background:"rgba(0,0,0,0.2)", borderRadius:"6px" }}>
              <span style={{ fontSize:"11px", color:COLOR_LOCATION, fontWeight:"700" }}>{k}</span>
              <span style={{ fontSize:"11px", color:"#3a3a6a" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"26px 32px", display:"flex", flexDirection:"column", gap:"20px", background:`radial-gradient(ellipse at 20% 20%,${COLOR_LOCATION}08 0%,${BG_DARK} 70%)` }}>
        {section==="mutlak" && <>
          <SectionHeader icon="📍" color={COLOR_LOCATION} title="Mutlak Konum" sub="Koordinatlarla kesin konum belirleme"/>
          <InfoCard color={COLOR_LOCATION}><p style={{ fontSize:"14px", color:"#c7d2fe", lineHeight:"1.9", margin:0, fontWeight:"500" }}>Ekvator ve baslangic meridyenine gore belirlenen kesin konum <strong style={{ color:COLOR_LOCATION }}>mutlak konum</strong>'dur.</p></InfoCard>
          <div style={{ width:"100%", maxWidth:"840px", margin:"0 auto", padding:"16px 20px", background:"rgba(0,0,0,0.28)", border:`1px solid ${COLOR_LOCATION}18`, borderRadius:"12px" }}>
            <div style={{ fontSize:"11px", color:COLOR_LOCATION, letterSpacing:"2px", fontWeight:"800", marginBottom:"12px", fontFamily:FONT_SANS }}>TURKIYE'NIN KOORDINATLARI</div>
            <iframe style={{ width:"100%", height:"500px", border:0, borderRadius:"8px" }} allowFullScreen allow="geolocation"
              src="//umap.openstreetmap.fr/tr/map/turkiyenin-matematik-konumu_1380349?scaleControl=false&miniMap=false&scrollWheelZoom=true&zoomControl=false&editMode=disabled&moreControl=false&searchControl=false&tilelayersControl=false&embedControl=false&datalayersControl=false&onLoadPanel=none&captionBar=false&captionMenus=false&homeControl=false&fullscreenControl=false&captionControl=false&locateControl=false&measureControl=false&printControl=false#5/39.044786/36.210938"
              title="Turkiye Matematik Konumu"/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
            <InfoBox color={COLOR_SUCCESS} title="KUZEY YARI KURE" icon="⬆️"><div style={{ fontSize:"13px", color:"#3a6a50", lineHeight:"1.8" }}>Turkiye <strong style={{ color:COLOR_SUCCESS }}>36 - 42 Kuzey</strong> paralelleri arasindadir.</div></InfoBox>
            <InfoBox color={COLOR_LOCATION} title="DOGU YARI KURE" icon="➡️"><div style={{ fontSize:"13px", color:"#3a3a6a", lineHeight:"1.8" }}>Turkiye <strong style={{ color:COLOR_LOCATION }}>26 - 45 Dogu</strong> meridyenleri arasindadir. <strong style={{ color:COLOR_LOCATION }}>76 dakika</strong> yerel saat farki vardir.</div></InfoBox>
          </div>
        </>}
        {section==="goreceli" && <>
          <SectionHeader icon="🌍" color="#10b981" title="Goreceli Konum" sub="Diger yerlerle iliskisel konum"/>
          <TurkeyNeighborMap />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <InfoBox color={COLOR_ERROR} title="KARA KOMSULARI (8)" icon="🤝">
              <div style={{ display:"flex", flexDirection:"column", gap:"5px", marginTop:"6px" }}>
                {[["Dogu","Ermenistan, Gurcistan, Azerbaycan, Iran"],["Guney","Irak, Suriye"],["Bati","Yunanistan, Bulgaristan"]].map(([y,u])=>(
                  <div key={y} style={{ fontSize:"12px", color:"#6a3a30", lineHeight:"1.6" }}><strong style={{ color:COLOR_ERROR }}>{y}: </strong>{u}</div>
                ))}
              </div>
            </InfoBox>
            <InfoBox color={COLOR_SECONDARY} title="DENIZ KOMSULARI (13)" icon="⚓">
              <div style={{ display:"flex", flexDirection:"column", gap:"5px", marginTop:"6px" }}>
                {[["Karadeniz","Bulgaristan, Romanya, Ukrayna, Rusya, Gurcistan"],["Ege Denizi","Yunanistan"],["Akdeniz","KKTC, Libya, Misir, Filistin, Israil, Lubnan, Suriye"]].map(([d,u])=>(
                  <div key={d} style={{ fontSize:"12px", color:"#1a4a6a", lineHeight:"1.6" }}><strong style={{ color:COLOR_SECONDARY }}>{d}: </strong>{u}</div>
                ))}
              </div>
            </InfoBox>
          </div>
        </>}
        {section==="jeopolitik" && <>
          <SectionHeader icon="⚡" color="#f59e0b" title="Jeopolitik Onem" sub="Stratejik konum avantajlari"/>
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            {[
              { icon:"🌊", color:COLOR_SECONDARY, title:"Turk Bogazlari", desc:"Istanbul ve Canakkale Bogazi, Karadeniz'i Akdeniz'e baglar." },
              { icon:"⛽", color:COLOR_TOPO, title:"Enerji Koridoru", desc:"Orta Dogu ve Kafkasya enerji kaynaklari Turkiye uzerinden Avrupa'ya tasir." },
              { icon:"🏛️", color:COLOR_UA, title:"Kulturel Miras", desc:"Bircok medeniyete ev sahipligi yapmis zengin kulturel miras." },
              { icon:"💼", color:COLOR_SUCCESS, title:"Ticaret Merkezi", desc:"Kisalar arasi ticaret yollarinin kesisiminde Istanbul kuresel merkez kapasitesi tasir." },
              { icon:"🏝️", color:COLOR_PINK, title:"Kibris'in Onemi", desc:"Kibris (9.251 km2) Dogu Akdeniz'in en buyuk adasidir. KKTC Turkiye'nin dis politikasinda kritik oneme sahiptir." },
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
        </>}
      </div>
    </div>
  );
}

function TurkeyNeighborMap() {
  const [hov, setHov] = useState<string|null>(null);
  const countries = [
    { id:"bulgaristan", name:"Bulgaristan", x:100, y:30,  w:80,  h:45, fill:"#3b82f6" },
    { id:"yunanistan",  name:"Yunanistan",  x:40,  y:70,  w:70,  h:60, fill:"#3b82f6" },
    { id:"turkiye",     name:"TURKIYE",     x:120, y:80,  w:260, h:90, fill:"#6366f1" },
    { id:"gurcistan",   name:"Gurcistan",   x:370, y:55,  w:70,  h:35, fill:"#ef4444" },
    { id:"ermenistan",  name:"Ermenistan",  x:380, y:88,  w:55,  h:30, fill:"#ef4444" },
    { id:"azerbaycan",  name:"Azerbaycan",  x:430, y:75,  w:55,  h:28, fill:"#ef4444" },
    { id:"iran",        name:"Iran",        x:380, y:115, w:110, h:55, fill:"#ef4444" },
    { id:"irak",        name:"Irak",        x:280, y:165, w:95,  h:50, fill:"#f97316" },
    { id:"suriye",      name:"Suriye",      x:185, y:165, w:100, h:45, fill:"#f97316" },
  ];
  return (
    <div style={{ width:"100%", maxWidth:"580px", padding:"14px 18px", background:"rgba(0,0,0,0.28)", border:`1px solid ${C}18`, borderRadius:"12px" }}>
      <div style={{ fontSize:"11px", color:C, letterSpacing:"2px", fontWeight:"800", marginBottom:"10px" }}>SEMATIK KOMSU HARITASI</div>
      <svg width="520" height="240" viewBox="0 0 520 240" style={{ width:"100%" }}>
        <rect x="0" y="0" width="115" height="240" fill="#1a4a9e" opacity="0.18" rx="4"/>
        <text x="30" y="130" fontSize="9" fill="#3a7acc" fontFamily={FONT} textAnchor="middle">Ege</text>
        <rect x="120" y="0" width="270" height="30" fill="#1a4a9e" opacity="0.15"/>
        <text x="255" y="22" fontSize="9" fill="#3a7acc" fontFamily={FONT} textAnchor="middle">Karadeniz</text>
        <rect x="120" y="210" width="270" height="30" fill="#1a4a9e" opacity="0.15"/>
        <text x="255" y="228" fontSize="9" fill="#3a7acc" fontFamily={FONT} textAnchor="middle">Akdeniz</text>
        {countries.map(c=>{
          const isHov=hov===c.id;
          return (
            <g key={c.id} onMouseEnter={()=>setHov(c.id)} onMouseLeave={()=>setHov(null)} style={{ cursor:"pointer" }}>
              <rect x={c.x} y={c.y} width={c.w} height={c.h} fill={isHov?c.fill:`${c.fill}60`} stroke={isHov?c.fill:`${c.fill}80`} strokeWidth={isHov?2.5:1.5} rx="4" style={{ transition:"all 0.18s" }}/>
              <text x={c.x+c.w/2} y={c.y+c.h/2+4} textAnchor="middle" fontSize={c.id==="turkiye"?14:10} fill={c.id==="turkiye"?"#fff":isHov?"#fff":"rgba(255,255,255,0.7)"} fontFamily={FONT} fontWeight={c.id==="turkiye"?"800":"600"}>{c.name}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ═══ ETK-1: uMap iframe + soru kartlari ══════════════════════════════════════
function Act1KoordinatOyunu() {
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isShaking, setIsShaking] = useState(false);
  
  // YENİ STATE'LER
  const [status, setStatus] = useState<'idle' | 'success' | 'hint'>('idle');
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);

  const q = KOORDINAT_SORULARI[qIdx];

  // Zamanlayıcı Kontrolü
  useEffect(() => {
    if (timeLeft > 0 && status === 'idle' && !done) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && status === 'idle') {
      handleAnswer(null); // Süre biterse yanlış say
    }
  }, [timeLeft, status, done]);

  const triggerShake = () => {
    setIsShaking(true);
    sndFail();
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleAnswer = (choice: string | null) => {
    if (status === 'success') return; // Zaten bildiyse işlem yapma

    setSelectedOpt(choice);
    
    if (choice === q.cevap) {
      setStatus('success');
      setScore(s => s + 1);
      sndOK();
    } else {
      setStatus('hint'); // Yanlışta ipucu moduna geç
      triggerShake();
    }
  };

  const next = () => {
    if (qIdx >= KOORDINAT_SORULARI.length - 1) {
      setDone(true);
    } else {
      setQIdx(i => i + 1);
      setStatus('idle');
      setSelectedOpt(null);
      setTimeLeft(15);
      sndClick();
    }
  };

  const tryAgain = () => {
    setStatus('idle');
    setSelectedOpt(null);
    sndClick();
    // Süreyi sıfırlamak yerine kaldığı yerden veya küçük bir bonusla devam ettirebiliriz
  };

  if (done) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ background: `radial-gradient(ellipse at center,${COLOR_LOCATION}0a 0%,${BG_DARK} 100%)` }}>
        <div className="text-6xl">🎯</div>
        <div className="text-2xl font-black text-indigo-200">GÖREV TAMAMLANDI!</div>
        <div className="text-5xl font-black text-indigo-500 font-mono">{score} / {KOORDINAT_SORULARI.length}</div>
        <div className="text-sm text-slate-400">Tüm koordinat analizlerini bitirdin.</div>
        <button onClick={() => {
          setQIdx(0);
          setScore(0);
          setDone(false);
          setStatus('idle');
          setSelectedOpt(null);
          setTimeLeft(15);
        }} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors">
          TEKRAR DENE
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) rotate(-1deg); }
          50% { transform: translateX(5px) rotate(1deg); }
          75% { transform: translateX(-5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
          border: 2px solid #ef4444;
        }
      `}</style>
      <div className={`flex flex-1 overflow-hidden ${isShaking ? "animate-shake" : ""}`}>
      {/* SOL: Harita */}
      <div className="flex-1 flex flex-col p-4 gap-2 bg-slate-950">
        <div className="text-[10px] text-blue-400 tracking-widest font-mono">SİSMİK ODAKLAMA: AKTİF</div>
        <div className="flex-1 rounded-xl overflow-hidden border-2 border-blue-500/20">
          <iframe
            key={q.id} // Soru değiştikçe haritayı yeniden yükler (Zoom için)
            className="w-full h-full border-0"
            allowFullScreen
            src={`//umap.openstreetmap.fr/tr/map/turkiye-koordinatl_1380468?datalayersControl=false&onLoadPanel=none&editMode=disabled&moreControl=false&searchControl=false&tilelayersControl=false&embedControl=false&scaleControl=false&miniMap=false&scrollWheelZoom=true&zoomControl=false&captionBar=false&fullscreenControl=false&locateControl=false&measureControl=false&printControl=false#${q.zoom}/${q.lat}/${q.lon}`}
          />
        </div>
      </div>

      {/* SAĞ: Operasyon Paneli */}
      <div className="w-[360px] bg-slate-900/80 p-6 flex flex-col gap-6 border-l border-blue-500/10">
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-blue-400 font-mono">GÖREV {q.id}</span>
            <span className={`text-xl font-black font-mono ${timeLeft < 5 ? "text-red-500 animate-pulse" : "text-blue-400"}`}>
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-100 leading-tight">{q.soru}</h3>
        </div>

        {/* Seçenekler */}
        <div className="grid grid-cols-1 gap-3">
          {q.options.map((opt, i) => {
            const isCorrect = opt === q.cevap;
            const isSelected = opt === selectedOpt;
            return (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                disabled={status === 'success'} // Sadece doğru bilince butonlar kilitlenir
                className={`p-4 rounded-lg text-left text-sm font-semibold transition-all duration-200 border-2 
                  ${status === 'success' && isCorrect ? "bg-green-500/30 border-green-500 text-green-200 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : 
                    status === 'hint' && isSelected ? "bg-red-500/10 border-red-500/50 text-red-400" :
                    "bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500"}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* GERİ BİLDİRİM ALANI */}
        <div className="mt-auto min-h-[120px]">
          {status === 'success' && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg animate-in fade-in zoom-in">
              <div className="text-green-400 font-bold mb-1">✓ HARİKA OPERATÖR!</div>
              <p className="text-xs text-green-200/70 mb-3">Koordinat verisi doğrulandı. Bir sonraki göreve hazırsın.</p>
              <button onClick={next} className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded-md font-bold transition-colors">
                SONRAKİ GÖREV
              </button>
            </div>
          )}

          {status === 'hint' && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg animate-in slide-in-from-bottom-2">
              <div className="text-amber-400 font-bold mb-1">⚠️ SİSMİK UYARI</div>
              <p className="text-xs text-amber-200/80 mb-3"><span className="font-bold">İpucu:</span> {q.ipucu}</p>
              <button onClick={tryAgain} className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-md font-bold transition-colors">
                TEKRAR DENE
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}





// ═══ ETK-2: uMap Entegrasyonlu Komşu Sınıflandırma ═════════════════════════════
function Act2Komsular() {
  const ALL = [
    ...KARA_KOMSULAR.map(k => ({ ...k, tip: "kara" as const })),
    ...DENIZ_KOMSULAR.map(k => ({ ...k, tip: "deniz" as const })),
  ];

  // Rastgele 10 komşu seçelim (ekranı boğmamak için)
  const [cards] = useState<typeof ALL>(() => {
    const arr = [...ALL];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 10);
  });

  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [wrong, setWrong] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [dragId, setDragId] = useState<string|null>(null);
  const [hovBucket, setHovBucket] = useState<string|null>(null);

  const BUCKETS = [
    { id: "kara", label: "KARA SINIRI", color: "#ef4444", icon: "🤝" },
    { id: "karadeniz", label: "KARADENİZ", color: "#0ea5e9", icon: "🌊" },
    { id: "ege", label: "EGE DENİZİ", color: "#6366f1", icon: "🌊" },
    { id: "akdeniz", label: "AKDENİZ", color: "#10b981", icon: "🌊" },
  ];

  const getCorrect = (item: typeof ALL[0]) => {
    if (item.tip === "kara") return "kara";
    const d = (item as typeof DENIZ_KOMSULAR[0]).deniz;
    if (d === "Karadeniz") return "karadeniz";
    if (d === "Ege Denizi") return "ege";
    return "akdeniz";
  };

  const doDrop = (bucketId: string) => {
    if (!dragId) return;
    const item = cards.find(a => a.id === dragId);
    if (!item || placed[dragId]) return;

    const isOk = bucketId === getCorrect(item);
    sndDrop();
    if (isOk) { sndOK(); setScore(s => s + 1); } else { sndFail(); }

    const np = { ...placed, [dragId]: bucketId };
    const nw = { ...wrong, [dragId]: !isOk };
    setPlaced(np);
    setWrong(nw);
    setDragId(null);
    setHovBucket(null);

    if (Object.keys(np).length === cards.length) {
      setTimeout(() => setDone(true), 600);
    }
  };

  const retry = () => {
    setPlaced({}); setWrong({}); setScore(0); setDone(false); setDragId(null); setHovBucket(null);
  };

  if (done) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", background: `radial-gradient(ellipse at center,${COLOR_LOCATION}0a 0%,${BG_DARK} 100%)` }}>
      <div style={{ fontSize: "60px" }}>🏆</div>
      <div style={{ fontSize: "24px", fontWeight: "800", color: "#c7d2fe" }}>TEBRİKLER OPERATÖR!</div>
      <div style={{ fontSize: "48px", fontWeight: "800", color: COLOR_LOCATION, fontFamily: FONT_MONO }}>{score}/{cards.length}</div>
      <div style={{ fontSize: "14px", color: "#4a4a8a" }}>Komşuluk ilişkilerini başarıyla analiz ettin.</div>
      <button onClick={retry} style={{ padding: "12px 32px", background: COLOR_LOCATION, border: "none", borderRadius: "10px", color: "#fff", fontWeight: "800", cursor: "pointer" }}>TEKRAR DENE</button>
    </div>
  );

  const pending = cards.filter(it => !placed[it.id]);

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* SOL PANEL: Etkileşimli uMap Haritası */}
      <div style={{ flex: 1.2, display: "flex", flexDirection: "column", padding: "16px", gap: "12px", borderRight: "1px solid rgba(99,102,241,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "11px", color: COLOR_LOCATION, letterSpacing: "2px", fontWeight: "800", fontFamily: FONT_MONO }}>
            SİSMİK REFERANS HARİTASI (uMAP)
          </div>
          <div style={{ fontSize: "10px", color: "#4a4a8a" }}>İpucu: Haritayı kaydırarak sınırları incele</div>
        </div>
        
        <div style={{ flex: 1, borderRadius: "12px", overflow: "hidden", border: `2px solid ${COLOR_LOCATION}20`, background: "#000" }}>
          <iframe 
            style={{ width: "100%", height: "100%", border: 0 }} 
            allowFullScreen 
            allow="geolocation" 
            src="//umap.openstreetmap.fr/tr/map/turkiye-koordinatl_1380468?scaleControl=false&miniMap=false&scrollWheelZoom=true&zoomControl=false&editMode=disabled&moreControl=false&searchControl=false&tilelayersControl=false&embedControl=false&datalayersControl=false&onLoadPanel=none&captionBar=false&captionMenus=false&homeControl=false&fullscreenControl=false&captionControl=false&locateControl=false&measureControl=false&printControl=false#5/40.195659/38.188477"
          ></iframe>
        </div>
      </div>

      {/* SAĞ PANEL: Sürükle Bırak Arayüzü */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px", gap: "16px", background: "rgba(3,4,10,0.4)", overflowY: "auto" }}>
        <div>
          <div style={{ fontSize: "18px", fontWeight: "800", color: "#c7d2fe" }}>Komşuları Sınıflandır</div>
          <div style={{ fontSize: "12px", color: "#4a4a8a", marginTop:"4px" }}>Aşağıdaki ülkeleri haritadaki konumlarına göre ilgili kutuya bırak.</div>
        </div>

        {/* Bekleyen Kartlar */}
        <div style={{ minHeight: "100px", padding: "12px", background: "rgba(0,0,0,0.3)", borderRadius: "10px", border: "1px dashed rgba(99,102,241,0.2)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {pending.map(item => (
              <div key={item.id} draggable
                onDragStart={e => { setDragId(item.id); e.dataTransfer.setData("text/plain", item.id); }}
                style={{ 
                padding: "8px 14px", background: "rgba(99,102,241,0.15)", border: `1px solid ${COLOR_LOCATION}50`, 
                  borderRadius: "6px", cursor: "grab", color: "#fff", fontSize: "13px", fontWeight: "600" 
                }}>
                {item.name}
              </div>
            ))}
            {pending.length === 0 && <div style={{ fontSize: "12px", color: "#3a3a6a", textAlign: "center", width: "100%" }}>Tüm kartlar yerleştirildi!</div>}
          </div>
        </div>

        {/* Hedef Kutular */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {BUCKETS.map(b => (
            <div key={b.id}
              onDragOver={e => { e.preventDefault(); setHovBucket(b.id); }}
              onDragLeave={() => setHovBucket(null)}
              onDrop={(e) => { e.preventDefault(); doDrop(b.id); }}
              style={{ 
                minHeight: "110px", padding: "12px", borderRadius: "10px", transition: "all 0.2s",
                background: hovBucket === b.id ? `${b.color}20` : "rgba(0,0,0,0.2)",
                border: `2px ${hovBucket === b.id ? "solid" : "dashed"} ${b.color}${hovBucket === b.id ? "99" : "40"}`,
              }}>
              <div style={{ fontSize: "12px", fontWeight: "800", color: b.color, marginBottom: "8px" }}>
                {b.icon} {b.label}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {cards.filter(it => placed[it.id] === b.id).map(it => (
                  <div key={it.id} style={{ 
                    fontSize: "10px", padding: "4px 8px", borderRadius: "4px", 
                    background: wrong[it.id] ? "#ef444420" : "#10b98120",
                    color: wrong[it.id] ? "#ef4444" : "#10b981",
                    border: `1px solid ${wrong[it.id] ? "#ef444440" : "#10b98140"}`
                  }}>
                    {wrong[it.id] ? "✕ " : "✓ "}{it.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "auto", padding: "12px", background: `${COLOR_LOCATION}10`, borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#4a4a8a" }}>Doğru Sayısı:</span>
          <span style={{ fontSize: "18px", fontWeight: "800", color: COLOR_LOCATION, fontFamily: FONT_MONO }}>{score} / {cards.length}</span>
        </div>
      </div>
    </div>
  );
}
// ═══ ETK-3: GZFT ═════════════════════════════════════════════════════════════
function Act3Gzft() {
  const [placed, setPlaced] = useState<Record<string,GzftCat>>({});
  const [wrong,  setWrong]  = useState<Record<string,boolean>>({});
  const [score,  setScore]  = useState(0);
  const [done,   setDone]   = useState(false);
  const [dragId, setDragId] = useState<string|null>(null);
  const [hovBucket,setHovBucket]=useState<string|null>(null);

  const handleDrop=(itemId:string,cat:GzftCat)=>{
    const item=GZFT_ITEMS.find(i=>i.id===itemId);
    if(!item||placed[itemId])return;
    const ok=item.cat===cat;
    sndDrop();if(ok){sndOK();setScore(s=>s+1);}else sndFail();
    const np={...placed,[itemId]:cat};
    const nw={...wrong, [itemId]:!ok};
    setPlaced(np);setWrong(nw);setDragId(null);setHovBucket(null);
    if(Object.keys(np).length===GZFT_ITEMS.length)setTimeout(()=>setDone(true),400);
  };
  const retry=()=>{setPlaced({});setWrong({});setScore(0);setDone(false);setDragId(null);setHovBucket(null);};

  if(done)return(
    <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px",background:`radial-gradient(ellipse at center,${COLOR_LOCATION}0a 0%,${BG_DARK} 100%)` }}>
      <div style={{ fontSize:"52px" }}>⚖️</div>
      <div style={{ fontSize:"28px",fontWeight:"800",color:"#c7d2fe" }}>GZFT TAMAMLANDI!</div>
      <div style={{ fontSize:"44px",fontWeight:"800",color:COLOR_LOCATION,fontFamily:FONT_MONO }}>{score}/{GZFT_ITEMS.length}</div>
      <div style={{ fontSize:"14px",color:"#4a4a8a" }}>kart dogru kategoriye yerlestirildi</div>
      <button onClick={retry} style={{ padding:"12px 28px",background:`linear-gradient(90deg,#3730a3,${COLOR_LOCATION})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT_SANS }}>Tekrar</button>
    </div>
  );

  const pending=GZFT_ITEMS.filter(i=>!placed[i.id]);
  return(
    <div style={{ flex:1,display:"flex",flexDirection:"column",padding:"20px 24px",gap:"16px",overflowY:"auto",background:`radial-gradient(ellipse at 30% 20%,${COLOR_LOCATION}08 0%,${BG_DARK} 100%)` }}>
      <div>
        <div style={{ fontSize:"10px",letterSpacing:"3px",color:COLOR_LOCATION,fontFamily:FONT_MONO,marginBottom:"4px" }}>ETK 3 - GZFT ANALIZI</div>
        <div style={{ fontSize:"18px",fontWeight:"800",color:"#c7d2fe" }}>Turkiye'nin Konum Analizi</div>
        <div style={{ fontSize:"13px",color:"#4a4a8a",marginTop:"4px" }}>Her karti dogru GZFT kategorisine surukle</div>
      </div>

      <div style={{ padding:"12px 14px",background:"rgba(0,0,0,0.22)",border:"1px solid rgba(99,102,241,0.12)",borderRadius:"10px" }}>
        <div style={{ fontSize:"11px",color:C,letterSpacing:"2px",fontWeight:"800",marginBottom:"10px" }}>SINIFLANDIRILACAK KARTLAR</div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:"7px" }}>
          {pending.map(item=>(
            <div key={item.id} draggable
              onDragStart={e=>{setDragId(item.id);e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",item.id);}}
              onDragEnd={()=>{setDragId(null);setHovBucket(null);}}
              style={{
                padding:"9px 12px",
                background:dragId===item.id?`${COLOR_LOCATION}28`:"rgba(0,0,0,0.4)",
                border:`1.5px solid ${dragId===item.id?COLOR_LOCATION:`${COLOR_LOCATION}28`}`,
                borderRadius:"8px",cursor:"grab",
                fontSize:"12px",fontWeight:"600",color:"#c7d2fe",fontFamily:FONT_SANS,
                maxWidth:"260px",lineHeight:"1.5",opacity:dragId===item.id?0.5:1,
                userSelect:"none",WebkitUserSelect:"none",
              }}>
              {item.text}
            </div>
          ))}
          {GZFT_ITEMS.filter(i=>placed[i.id]).map(item=>(
            <div key={item.id}
              style={{
                padding:"9px 12px",
                background:wrong[item.id]?"rgba(239,68,68,0.08)":"rgba(16,185,129,0.08)",
                border:`1.5px solid ${wrong[item.id]?"#ef444430":"#10b98130"}`,
                borderRadius:"8px",fontSize:"12px",fontWeight:"600",
                color:wrong[item.id]?"#ef4444":"#10b981",fontFamily:FONT,maxWidth:"260px",lineHeight:"1.5",opacity:0.6,
              }}>
              {wrong[item.id]?"X ":"OK "}{item.text.substring(0,30)}...
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",flex:1 }}>
        {GZFT_CATS.map(cat=>(
          <div key={cat.id}
            onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect="move";setHovBucket(cat.id);}}
            onDragLeave={()=>setHovBucket(null)}
            onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("text/plain");if(id){handleDrop(id,cat.id);}else if(dragId){handleDrop(dragId,cat.id);}}}
            style={{
              minHeight:"130px",padding:"14px 16px",
              background:hovBucket===cat.id?`${cat.color}1a`:cat.bg,
              border:`2px ${hovBucket===cat.id?"solid":"dashed"} ${cat.color}${hovBucket===cat.id?"88":"35"}`,
              borderRadius:"12px",transition:"all 0.2s",
            }}>
            <div style={{ fontSize:"14px",fontWeight:"800",color:cat.color,marginBottom:"3px" }}>{cat.emoji} {cat.label}</div>
            <div style={{ fontSize:"11px",color:`${cat.color}80`,marginBottom:"10px" }}>
              {cat.id==="G"?"Var olan avantajlar":cat.id==="Z"?"Var olan dezavantajlar":cat.id==="F"?"Gelecekteki firsatlar":"Olasi tehditler"}
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:"5px" }}>
              {GZFT_ITEMS.filter(i=>placed[i.id]===cat.id).map(it=>(
                <div key={it.id}
                  style={{
                    padding:"7px 10px",
                    background:wrong[it.id]?"rgba(239,68,68,0.1)":"rgba(16,185,129,0.1)",
                    border:`1px solid ${wrong[it.id]?"#ef444440":"#10b98140"}`,
                    borderRadius:"6px",fontSize:"11px",
                    color:wrong[it.id]?"#ef4444":"#10b981",fontWeight:"600",lineHeight:"1.5",
                  }}>
                  {wrong[it.id]?"X ":"OK "}{it.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding:"9px 14px",background:`${COLOR_LOCATION}08`,border:`1px solid ${COLOR_LOCATION}12`,borderRadius:"8px",display:"flex",justifyContent:"space-between" }}>
        <span style={{ fontSize:"12px",color:"#4a4a8a" }}>Kalan: {pending.length} kart</span>
        <span style={{ fontSize:"14px",fontWeight:"800",color:COLOR_LOCATION,fontFamily:FONT_MONO }}>{score}/{GZFT_ITEMS.length} dogru</span>
      </div>
    </div>
  );
}

// ═══ TEST ════════════════════════════════════════════════════════════════════
function TestTab() {
  const [qIdx,setQIdx]=useState(0);const [sel,setSel]=useState<number|null>(null);
  const [score,setScore]=useState(0);const [answers,setAnswers]=useState<boolean[]>([]);const [done,setDone]=useState(false);
  const q=TEST_ITEMS[qIdx];
  const handleAnswer=(i:number)=>{if(sel!==null)return;setSel(i);const ok=i===q.correct;if(ok){setScore(s=>s+10);sndOK();}else sndFail();setAnswers(a=>[...a,ok]);};
  const next=()=>{sndClick();if(qIdx>=TEST_ITEMS.length-1){setDone(true);return;}setQIdx(i=>i+1);setSel(null);};
  const retry=()=>{setQIdx(0);setSel(null);setScore(0);setAnswers([]);setDone(false);};
  if(done){
    const pct=Math.round((score/(TEST_ITEMS.length*10))*100);
    return(
      <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"18px",background:`radial-gradient(ellipse at center,${COLOR_LOCATION}0a 0%,${BG_DARK} 100%)` }}>
        <div style={{ fontSize:"60px" }}>🌐</div>
        <div style={{ fontSize:"28px",fontWeight:"800",color:"#c7d2fe" }}>TEST TAMAMLANDI!</div>
        <div style={{ fontSize:"52px",fontWeight:"800",color:pct>=80?COLOR_SUCCESS:pct>=50?COLOR_ACCENT:COLOR_ERROR,fontFamily:FONT_MONO }}>{score} PUAN</div>
        <div style={{ fontSize:"15px",color:"#4a4a8a" }}>{answers.filter(Boolean).length}/{TEST_ITEMS.length} dogru - %{pct}</div>
        <div style={{ fontSize:"15px",color:"#6a6aaa",textAlign:"center",maxWidth:"420px",lineHeight:"1.8" }}>
          {pct>=80?"Mukemmel!":pct>=50?"Iyi! Ogren sekmesini tekrar incele.":"Tekrar dene!"}
        </div>
        <button onClick={retry} style={{ padding:"13px 30px",background:`linear-gradient(90deg,#3730a3,${COLOR_LOCATION})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT_SANS }}>Tekrar Dene</button>
      </div>
    );
  }
  return(
    <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
      <div style={{ width:"230px",flexShrink:0,borderRight:"1px solid rgba(99,102,241,0.12)",background:"rgba(3,4,10,0.6)",padding:"22px 16px",display:"flex",flexDirection:"column",gap:"7px",overflowY:"auto" }}>
        <SLabel>SORULAR</SLabel>
        <div style={{ display:"flex",flexDirection:"column",gap:"6px",marginTop:"10px" }}>
          {TEST_ITEMS.map((_,i)=>{const d=i<answers.length,cur=i===qIdx;return(
            <div key={i} style={{ display:"flex",alignItems:"center",gap:"9px",padding:"9px 11px",background:cur?`${C}12`:"rgba(0,0,0,0.18)",border:`1.5px solid ${cur?C:d?(answers[i]?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"):"rgba(255,255,255,0.04)"}`,borderRadius:"7px" }}>
              <div style={{ width:"22px",height:"22px",borderRadius:"50%",background:d?(answers[i]?"#10b981":"#ef4444"):cur?C:"rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"800",color:"#fff",flexShrink:0,fontFamily:MONO }}>
                {d?(answers[i]?"V":"X"):i+1}
              </div>
              <span style={{ fontSize:"12px",fontWeight:"700",color:cur?"#c7d2fe":d?(answers[i]?"#10b981":"#ef4444"):"#3a3a6a" }}>Soru {i+1}</span>
            </div>
          );})}
        </div>
        <div style={{ marginTop:"auto",padding:"12px 14px",background:`${C}08`,border:`1px solid ${C}15`,borderRadius:"9px" }}>
          <div style={{ fontSize:"11px",color:"#4a4a8a",fontWeight:"700",letterSpacing:"1px",marginBottom:"4px" }}>PUAN</div>
          <div style={{ fontSize:"32px",fontWeight:"800",color:C,fontFamily:MONO }}>{score}</div>
          <div style={{ fontSize:"12px",color:"#3a3a6a" }}>/ {TEST_ITEMS.length*10}</div>
        </div>
      </div>
      <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"28px 36px",overflowY:"auto",gap:"18px" }}>
        <div style={{ width:"100%",maxWidth:"660px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:"8px" }}>
            <span style={{ fontSize:"12px",color:"#4a4a8a",fontWeight:"700",letterSpacing:"1px" }}>SORU {qIdx+1} / {TEST_ITEMS.length}</span>
            <span style={{ fontSize:"12px",color:C }}>{Math.round((qIdx/TEST_ITEMS.length)*100)}%</span>
          </div>
          <div style={{ height:"5px",background:`${C}18`,borderRadius:"3px",overflow:"hidden" }}>
            <div style={{ height:"100%",width:`${(qIdx/TEST_ITEMS.length)*100}%`,background:`linear-gradient(90deg,#3730a3,${C})`,borderRadius:"3px",transition:"width 0.4s" }}/>
          </div>
        </div>
        <div style={{ maxWidth:"660px",width:"100%",padding:"22px 26px",background:`${C}08`,border:`1.5px solid ${C}20`,borderRadius:"14px" }}>
          <p style={{ fontSize:"16px",color:"#c7d2fe",lineHeight:"1.9",margin:0,fontWeight:"600" }}>{q.q}</p>
        </div>
        <div style={{ maxWidth:"660px",width:"100%",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px" }}>
          {q.opts.map((opt,i)=>{
            const isSel=sel===i,isCorr=i===q.correct,show=sel!==null;
            let bg="rgba(0,0,0,0.25)",border="rgba(255,255,255,0.07)",color="#6a6aaa";
            if(show){if(isCorr){bg=`#10b98112`;border="#10b981";color="#10b981";}else if(isSel){bg="rgba(239,68,68,0.1)";border="#ef4444";color="#ef4444";}}
            return(
              <button key={i} onClick={()=>handleAnswer(i)} disabled={sel!==null}
                style={{ padding:"14px 16px",background:bg,border:`2px solid ${border}`,borderRadius:"11px",cursor:sel!==null?"default":"pointer",fontFamily:FONT,textAlign:"left",transition:"all 0.18s" }}>
                <div style={{ display:"flex",alignItems:"flex-start",gap:"10px" }}>
                  <span style={{ width:"23px",height:"23px",borderRadius:"50%",background:show&&isCorr?"#10b981":show&&isSel?"#ef4444":`${C}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"800",color:show?"#fff":"#c7d2fe",flexShrink:0,marginTop:"1px",fontFamily:MONO }}>
                    {show&&isCorr?"V":show&&isSel&&!isCorr?"X":String.fromCharCode(65+i)}
                  </span>
                  <span style={{ fontSize:"14px",color,fontWeight:"600",lineHeight:"1.6" }}>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>
        {sel!==null&&(
          <div style={{ maxWidth:"660px",width:"100%",padding:"16px 20px",background:sel===q.correct?`${COLOR_SUCCESS}08`:`${COLOR_ERROR}08`,border:`2px solid ${sel===q.correct?`${COLOR_SUCCESS}28`:`${COLOR_ERROR}28`}`,borderRadius:"13px" }}>
            <div style={{ fontSize:"15px",fontWeight:"800",color:sel===q.correct?"#10b981":"#ef4444",marginBottom:"9px" }}>{sel===q.correct?"DOGRU!":"YANLIS!"}</div>
            <p style={{ fontSize:"14px",color:"#6a6aaa",lineHeight:"1.85",margin:0,fontWeight:"500" }}>{q.exp}</p>
          </div>
        )}
        {sel!==null&&(
          <button onClick={next}
            style={{ padding:"13px 36px",background:`linear-gradient(90deg,#3730a3,${COLOR_LOCATION})`,border:"none",borderRadius:"11px",color:"#fff",fontSize:"15px",fontWeight:"800",letterSpacing:"1.5px",cursor:"pointer",fontFamily:FONT_SANS }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";}}>
            {qIdx>=TEST_ITEMS.length-1?"Sonuclari Gor":"Sonraki Soru"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Yardimcilar ─────────────────────────────────────────────────────────────
function SLabel({children}:{children:React.ReactNode}){return <div style={{ fontSize:"11px",letterSpacing:"2px",color:"#3a3a6a",fontWeight:"800",fontFamily:FONT_SANS }}>{children}</div>;}
function SDivider(){return <div style={{ height:"1px",background:`${COLOR_LOCATION}1a`,margin:"16px 0" }} />;}
function InfoCard({color,children}:{color:string;children:React.ReactNode}){return <div style={{ padding:"20px 24px",background:`${color}0a`,border:`1.5px solid ${color}22`,borderRadius:"14px" }}>{children}</div>;}
function InfoBox({color,title,icon,children}:{color:string;title:string;icon:string;children:React.ReactNode}){return(
  <div style={{ padding:"16px 18px",background:`${color}08`,border:`1px solid ${color}20`,borderRadius:"12px" }}>
    <div style={{ fontSize:"12px",color,fontWeight:"800",marginBottom:"8px",letterSpacing:"1px" }}>{icon} {title}</div>
    {children}
  </div>
);}
function SectionHeader({icon,color,title,sub}:{icon:string;color:string;title:string;sub:string}){return(
  <div>
    <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px" }}>
      <span style={{ fontSize:"32px" }}>{icon}</span>
      <div>
        <div style={{ fontSize:"22px",fontWeight:"800",color:"#c7d2fe" }}>{title}</div>
        <div style={{ fontSize:"13px",color,fontWeight:"600" }}>{sub}</div>
      </div>
    </div>
    <div style={{ height:"2px",background:`linear-gradient(90deg,${color},transparent)`,opacity:0.4,borderRadius:"2px" }} />
  </div>
);}