"use client";
import { useState, useRef, useEffect } from "react";

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

const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const MONO = "'Courier New',monospace";
const BG   = "#05080f";
const C    = "#6366f1";
type Tab = "learn"|"act1"|"act2"|"act3"|"test";

// Komsu ulkeler
const KARA_KOMSULAR = [
  { id:"ermenistan", name:"Ermenistan",            yon:"Dogu",  renk:"#ef4444" },
  { id:"gurcistan",  name:"Gucistan",              yon:"Dogu",  renk:"#ef4444" },
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
  { id:"d_gurcistan",   name:"Gucistan",              deniz:"Karadeniz",  renk:"#0ea5e9" },
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
interface Soru { id:number; soru:string; cevap:string; ipucu:string; }
const KOORDINAT_SORULARI: Soru[] = [
  { id:1, soru:"Turkiye'nin en kuzey noktasi hangi paralele yakindir?", cevap:"42 Kuzey", ipucu:"Haritada en ustteki yatay cizgiyi incele. Sinop kiyisi en kuzey noktamizdir." },
  { id:2, soru:"Turkiye'nin en guney noktasi hangi paralele yakindir?", cevap:"36 Kuzey", ipucu:"En alttaki yatay cizgiye bak. Hatay kiyilari en guney noktamizdir." },
  { id:3, soru:"Turkiye'nin en bati noktasi hangi meridyene yakindir?", cevap:"26 Dogu", ipucu:"Soldan ilk dikey cizgiye bak. Canakkale kiyilari en bati noktamizdir." },
  { id:4, soru:"Turkiye'nin en dogu noktasi hangi meridyene yakindir?", cevap:"45 Dogu", ipucu:"Sagdaki son dikey cizgiye bak. Igdir ili en dogu noktamizdir." },
  { id:5, soru:"Ankara'nin koordinatlari yaklasik olarak nedir?", cevap:"40 Kuzey, 33 Dogu", ipucu:"Haritada Turkiye'nin ortasina bak. Baskentimiz orta Anadolu'dadir." },
  { id:6, soru:"Turkiye kuzey mi guney yarim kurede yer alir?", cevap:"Kuzey Yarim Kure", ipucu:"Ekvator cizgisi (0) nerede? Turkiye'nin paralelleri (36-42) onun kuzeyindedir." },
  { id:7, soru:"Turkiye dogu mu bati yarim kurede yer alir?", cevap:"Dogu Yarim Kure", ipucu:"Baslangic meridyeni 0'dir. Turkiye'nin meridyenleri (26-45) onun dogusundadir." },
  { id:8, soru:"Turkiye'nin kuzey-guney genisligi (enlem farki) kac derecedir?", cevap:"6 derece (36-42 arasi)", ipucu:"En kuzey ve en guney paraleli haritadan bul, farkini hesapla." },
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
              style={{ padding:"12px 14px", background:section===s.id?`${C}18`:"rgba(0,0,0,0.22)", border:`2px solid ${section===s.id?C:"rgba(99,102,241,0.08)"}`, borderRadius:"10px", cursor:"pointer", textAlign:"left", fontFamily:FONT, transition:"all 0.18s" }}>
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
              <span style={{ fontSize:"11px", color:"#6366f1", fontWeight:"700" }}>{k}</span>
              <span style={{ fontSize:"11px", color:"#3a3a6a" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"26px 32px", display:"flex", flexDirection:"column", gap:"20px", background:`radial-gradient(ellipse at 20% 20%,${C}08 0%,${BG} 70%)` }}>
        {section==="mutlak" && <>
          <SectionHeader icon="📍" color={C} title="Mutlak Konum" sub="Koordinatlarla kesin konum belirleme"/>
          <InfoCard color={C}><p style={{ fontSize:"14px", color:"#c7d2fe", lineHeight:"1.9", margin:0, fontWeight:"500" }}>Ekvator ve baslangic meridyenine gore belirlenen kesin konum <strong style={{ color:C }}>mutlak konum</strong>'dur.</p></InfoCard>
          <div style={{ width:"100%", maxWidth:"840px", margin:"0 auto", padding:"16px 20px", background:"rgba(0,0,0,0.28)", border:`1px solid ${C}18`, borderRadius:"12px" }}>
            <div style={{ fontSize:"11px", color:C, letterSpacing:"2px", fontWeight:"800", marginBottom:"12px", fontFamily:FONT }}>TURKIYE'NIN KOORDINATLARI</div>
            <iframe style={{ width:"100%", height:"500px", border:0, borderRadius:"8px" }} allowFullScreen allow="geolocation"
              src="//umap.openstreetmap.fr/tr/map/turkiyenin-matematik-konumu_1380349?scaleControl=false&miniMap=false&scrollWheelZoom=true&zoomControl=false&editMode=disabled&moreControl=false&searchControl=false&tilelayersControl=false&embedControl=false&datalayersControl=true&onLoadPanel=none&captionBar=false&captionMenus=false&homeControl=false&fullscreenControl=false&captionControl=false&locateControl=false&measureControl=false&printControl=false#5/39.044786/36.210938"
              title="Turkiye Matematik Konumu"/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
            <InfoBox color="#10b981" title="KUZEY YARI KURE" icon="⬆️"><div style={{ fontSize:"13px", color:"#3a6a50", lineHeight:"1.8" }}>Turkiye <strong style={{ color:"#10b981" }}>36 - 42 Kuzey</strong> paralelleri arasindadir.</div></InfoBox>
            <InfoBox color={C} title="DOGU YARI KURE" icon="➡️"><div style={{ fontSize:"13px", color:"#3a3a6a", lineHeight:"1.8" }}>Turkiye <strong style={{ color:C }}>26 - 45 Dogu</strong> meridyenleri arasindadir. <strong style={{ color:C }}>76 dakika</strong> yerel saat farki vardir.</div></InfoBox>
          </div>
        </>}
        {section==="goreceli" && <>
          <SectionHeader icon="🌍" color="#10b981" title="Goreceli Konum" sub="Diger yerlerle iliskisel konum"/>
          <TurkeyNeighborMap />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <InfoBox color="#ef4444" title="KARA KOMSULARI (8)" icon="🤝">
              <div style={{ display:"flex", flexDirection:"column", gap:"5px", marginTop:"6px" }}>
                {[["Dogu","Ermenistan, Gurcistan, Azerbaycan, Iran"],["Guney","Irak, Suriye"],["Bati","Yunanistan, Bulgaristan"]].map(([y,u])=>(
                  <div key={y} style={{ fontSize:"12px", color:"#6a3a30", lineHeight:"1.6" }}><strong style={{ color:"#ef4444" }}>{y}: </strong>{u}</div>
                ))}
              </div>
            </InfoBox>
            <InfoBox color="#0ea5e9" title="DENIZ KOMSULARI (13)" icon="⚓">
              <div style={{ display:"flex", flexDirection:"column", gap:"5px", marginTop:"6px" }}>
                {[["Karadeniz","Bulgaristan, Romanya, Ukrayna, Rusya, Gurcistan"],["Ege Denizi","Yunanistan"],["Akdeniz","KKTC, Libya, Misir, Filistin, Israil, Lubnan, Suriye"]].map(([d,u])=>(
                  <div key={d} style={{ fontSize:"12px", color:"#1a4a6a", lineHeight:"1.6" }}><strong style={{ color:"#0ea5e9" }}>{d}: </strong>{u}</div>
                ))}
              </div>
            </InfoBox>
          </div>
        </>}
        {section==="jeopolitik" && <>
          <SectionHeader icon="⚡" color="#f59e0b" title="Jeopolitik Onem" sub="Stratejik konum avantajlari"/>
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            {[
              { icon:"🌊", color:"#0ea5e9", title:"Turk Bogazlari", desc:"Istanbul ve Canakkale Bogazi, Karadeniz'i Akdeniz'e baglar." },
              { icon:"⛽", color:"#f97316", title:"Enerji Koridoru", desc:"Orta Dogu ve Kafkasya enerji kaynaklari Turkiye uzerinden Avrupa'ya tasir." },
              { icon:"🏛️", color:"#a78bfa", title:"Kulturel Miras", desc:"Bircok medeniyete ev sahipligi yapmis zengin kulturel miras." },
              { icon:"💼", color:"#10b981", title:"Ticaret Merkezi", desc:"Kisalar arasi ticaret yollarinin kesisiminde Istanbul kuresel merkez kapasitesi tasir." },
              { icon:"🏝️", color:"#ec4899", title:"Kibris'in Onemi", desc:"Kibris (9.251 km2) Dogu Akdeniz'in en buyuk adasidir. KKTC Turkiye'nin dis politikasinda kritik oneme sahiptir." },
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
  const [qIdx,    setQIdx]    = useState(0);
  const [shown,   setShown]   = useState(false);
  const [correct, setCorrect] = useState<boolean|null>(null);
  const [score,   setScore]   = useState(0);
  const [done,    setDone]    = useState(false);
  const q = KOORDINAT_SORULARI[qIdx];

  const handleAnswer = (ok: boolean) => {
    if (shown) return;
    setShown(true); setCorrect(ok);
    if (ok) { setScore(s=>s+1); sndOK(); } else sndFail();
  };
  const next = () => {
    sndClick();
    if (qIdx >= KOORDINAT_SORULARI.length-1) { setDone(true); return; }
    setQIdx(i=>i+1); setShown(false); setCorrect(null);
  };
  const retry = () => { setQIdx(0); setShown(false); setCorrect(null); setScore(0); setDone(false); };

  if (done) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px", background:`radial-gradient(ellipse at center,${C}0a 0%,${BG} 100%)` }}>
      <div style={{ fontSize:"52px" }}>🎯</div>
      <div style={{ fontSize:"28px", fontWeight:"800", color:"#c7d2fe", fontFamily:FONT }}>ETK 1 TAMAMLANDI!</div>
      <div style={{ fontSize:"48px", fontWeight:"800", color:C, fontFamily:MONO }}>{score}/{KOORDINAT_SORULARI.length}</div>
      <div style={{ fontSize:"14px", color:"#4a4a8a" }}>soruya dogru cevap verdin</div>
      <button onClick={retry} style={{ padding:"12px 28px", background:`linear-gradient(90deg,#3730a3,${C})`, border:"none", borderRadius:"10px", color:"#fff", fontSize:"14px", fontWeight:"800", cursor:"pointer", fontFamily:FONT }}>Tekrar Dene</button>
    </div>
  );

  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
      {/* Sol: Harita */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"16px", gap:"10px", background:BG, minWidth:0 }}>
        <div style={{ fontSize:"11px", color:C, letterSpacing:"2px", fontWeight:"800", fontFamily:MONO, flexShrink:0 }}>
          HARITAYI INCELE - KOORDINATLARI BUL
        </div>
        <div style={{ flex:1, borderRadius:"10px", overflow:"hidden", border:`1px solid ${C}25`, minHeight:0 }}>
          <iframe
            style={{ width:"100%", height:"100%", border:0, display:"block" }}
            allowFullScreen
            allow="geolocation"
            src="//umap.openstreetmap.fr/tr/map/turkiye-koordinatl_1380468?scaleControl=false&miniMap=false&scrollWheelZoom=true&zoomControl=false&editMode=disabled&moreControl=false&searchControl=false&tilelayersControl=false&embedControl=false&datalayersControl=false&onLoadPanel=none&captionBar=false&captionMenus=false&homeControl=false&fullscreenControl=false&captionControl=false&locateControl=false&measureControl=false&printControl=false#5/39.078908/35.332031"
            title="Turkiye Koordinat Haritasi"
          />
        </div>
        {/* Ilerleme barciklari */}
        <div style={{ display:"flex", gap:"6px", justifyContent:"center", flexShrink:0 }}>
          {KOORDINAT_SORULARI.map((_,i)=>(
            <div key={i} style={{ width:"28px", height:"6px", borderRadius:"3px", background:i<qIdx?"#10b981":i===qIdx?C:"rgba(255,255,255,0.1)", transition:"background 0.3s" }}/>
          ))}
        </div>
      </div>

      {/* Sag: Soru paneli */}
      <div style={{ width:"340px", flexShrink:0, borderLeft:`1px solid rgba(99,102,241,0.15)`, background:"rgba(3,4,10,0.7)", display:"flex", flexDirection:"column", padding:"20px 18px", gap:"14px", overflowY:"auto" }}>
        <div>
          <div style={{ fontSize:"10px", letterSpacing:"3px", color:C, fontFamily:MONO, marginBottom:"4px" }}>ETK 1 - KOORDINAT OYUNU</div>
          <div style={{ fontSize:"16px", fontWeight:"800", color:"#c7d2fe" }}>Haritaya Bakarak Cevapla</div>
          <div style={{ fontSize:"12px", color:"#3a3a6a", marginTop:"3px" }}>Sol taraftaki haritayi inceleyerek soruyu cevapla</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:"12px", color:"#4a4a8a" }}>Soru {qIdx+1} / {KOORDINAT_SORULARI.length}</span>
          <span style={{ fontSize:"14px", fontWeight:"800", color:C, fontFamily:MONO }}>{score} puan</span>
        </div>
        <div style={{ height:"4px", background:`${C}18`, borderRadius:"2px" }}>
          <div style={{ height:"100%", width:`${(qIdx/KOORDINAT_SORULARI.length)*100}%`, background:`linear-gradient(90deg,#3730a3,${C})`, borderRadius:"2px", transition:"width 0.4s" }}/>
        </div>

        {/* Soru */}
        <div style={{ padding:"18px 16px", background:`${C}0e`, border:`2px solid ${C}28`, borderRadius:"12px" }}>
          <div style={{ fontSize:"11px", color:C, letterSpacing:"2px", marginBottom:"8px", fontFamily:MONO }}>SORU {q.id}</div>
          <p style={{ fontSize:"15px", color:"#c7d2fe", lineHeight:"1.8", margin:0, fontWeight:"600" }}>{q.soru}</p>
        </div>

        {/* Ipucu (cevap acilmadan) */}
        {!shown && (
          <div style={{ padding:"12px 14px", background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"9px" }}>
            <div style={{ fontSize:"11px", color:"#f59e0b", fontWeight:"800", marginBottom:"5px" }}>IPUCU</div>
            <div style={{ fontSize:"12px", color:"#6a5a30", lineHeight:"1.7" }}>{q.ipucu}</div>
          </div>
        )}

        {/* Cevap gosterilince */}
        {shown && (
          <div style={{ padding:"14px 16px", background:"rgba(16,185,129,0.08)", border:"2px solid rgba(16,185,129,0.3)", borderRadius:"10px" }}>
            <div style={{ fontSize:"11px", color:"#10b981", fontWeight:"800", marginBottom:"6px" }}>DOGRU CEVAP</div>
            <div style={{ fontSize:"16px", color:"#10b981", fontWeight:"800", fontFamily:MONO }}>{q.cevap}</div>
            <div style={{ marginTop:"8px", fontSize:"12px", color:"#3a6a50", lineHeight:"1.7" }}>{q.ipucu}</div>
          </div>
        )}

        {/* Butonlar */}
        {!shown ? (
          <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginTop:"auto" }}>
            <div style={{ fontSize:"12px", color:"#4a4a8a", textAlign:"center", marginBottom:"4px" }}>Haritaya baktin mi? Cevabini biliyor musun?</div>
            <button onClick={()=>handleAnswer(true)}
              style={{ padding:"12px", background:"rgba(16,185,129,0.1)", border:"2px solid rgba(16,185,129,0.4)", borderRadius:"10px", color:"#10b981", fontSize:"14px", fontWeight:"800", cursor:"pointer", fontFamily:FONT, transition:"all 0.18s" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(16,185,129,0.2)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(16,185,129,0.1)"}>
              Cevabi biliyorum
            </button>
            <button onClick={()=>handleAnswer(false)}
              style={{ padding:"12px", background:"rgba(239,68,68,0.08)", border:"2px solid rgba(239,68,68,0.3)", borderRadius:"10px", color:"#ef4444", fontSize:"14px", fontWeight:"800", cursor:"pointer", fontFamily:FONT, transition:"all 0.18s" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,0.16)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(239,68,68,0.08)"}>
              Emin degilim / Goster
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginTop:"auto" }}>
            {correct!==null && (
              <div style={{ padding:"10px 14px", background:correct?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)", border:`1px solid ${correct?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`, borderRadius:"8px", textAlign:"center" }}>
                <span style={{ fontSize:"14px", fontWeight:"800", color:correct?"#10b981":"#ef4444" }}>
                  {correct ? "+1 puan kazandin!" : "Bir sonrakinde basarilar!"}
                </span>
              </div>
            )}
            <button onClick={next}
              style={{ padding:"12px", background:`linear-gradient(90deg,#3730a3,${C})`, border:"none", borderRadius:"10px", color:"#fff", fontSize:"14px", fontWeight:"800", cursor:"pointer", fontFamily:FONT }}>
              {qIdx>=KOORDINAT_SORULARI.length-1?"Sonuclari Gor":"Sonraki Soru"}
            </button>
          </div>
        )}

        <div style={{ padding:"10px 14px", background:`${C}08`, border:`1px solid ${C}12`, borderRadius:"8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:"11px", color:"#3a3a6a" }}>Toplam Puan</span>
          <span style={{ fontSize:"20px", fontWeight:"800", color:C, fontFamily:MONO }}>{score} / {KOORDINAT_SORULARI.length}</span>
        </div>
      </div>
    </div>
  );
}

// ═══ ETK-2: Komsulari Siniflandir — DUZELTME ═════════════════════════════════
function Act2Komsular() {
  const ALL = [
    ...KARA_KOMSULAR.map(k=>({...k, tip:"kara" as const})),
    ...DENIZ_KOMSULAR.map(k=>({...k, tip:"deniz" as const})),
  ];
  const [cards] = useState<typeof ALL>(()=>{
    const arr=[...ALL];
    for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
    return arr.slice(0,12);
  });
  const [placed,   setPlaced]    = useState<Record<string,string>>({});
  const [wrong,    setWrong]     = useState<Record<string,boolean>>({});
  const [score,    setScore]     = useState(0);
  const [done,     setDone]      = useState(false);
  const [dragId,   setDragId]    = useState<string|null>(null);
  const [hovBucket,setHovBucket] = useState<string|null>(null);

  const BUCKETS=[
    { id:"kara",      label:"KARA SINIRI",  sub:"8 komsu",  color:"#ef4444", icon:"🤝" },
    { id:"karadeniz", label:"KARADENIZ",    sub:"5 komsu",  color:"#0ea5e9", icon:"🌊" },
    { id:"ege",       label:"EGE DENIZI",   sub:"1 komsu",  color:"#6366f1", icon:"🌊" },
    { id:"akdeniz",   label:"AKDENIZ",      sub:"7 komsu",  color:"#10b981", icon:"🌊" },
  ];
  const getCorrect=(item:typeof ALL[0])=>{
    if(item.tip==="kara")return "kara";
    const d=(item as typeof DENIZ_KOMSULAR[0]).deniz;
    if(d==="Karadeniz")return "karadeniz";
    if(d==="Ege Denizi")return "ege";
    return "akdeniz";
  };
  const doDrop=(bucketId:string)=>{
    if(!dragId)return;
    const item=cards.find(a=>a.id===dragId);
    if(!item||placed[dragId])return;
    const isOk=bucketId===getCorrect(item);
    sndDrop(); if(isOk){sndOK();setScore(s=>s+1);}else sndFail();
    const np={...placed,[dragId]:bucketId};
    const nw={...wrong, [dragId]:!isOk};
    setPlaced(np);setWrong(nw);setDragId(null);setHovBucket(null);
    if(Object.keys(np).length===cards.length)setTimeout(()=>setDone(true),400);
  };
  const retry=()=>{setPlaced({});setWrong({});setScore(0);setDone(false);setDragId(null);setHovBucket(null);};

  if(done)return(
    <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px",background:`radial-gradient(ellipse at center,${C}0a 0%,${BG} 100%)` }}>
      <div style={{ fontSize:"52px" }}>🗺️</div>
      <div style={{ fontSize:"28px",fontWeight:"800",color:"#c7d2fe" }}>ETK 2 TAMAMLANDI!</div>
      <div style={{ fontSize:"44px",fontWeight:"800",color:C,fontFamily:MONO }}>{score}/{cards.length}</div>
      <div style={{ fontSize:"14px",color:"#4a4a8a" }}>komsu dogru siniflandirildi</div>
      <button onClick={retry} style={{ padding:"12px 28px",background:`linear-gradient(90deg,#3730a3,${C})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT }}>Tekrar</button>
    </div>
  );

  const pending=cards.filter(it=>!placed[it.id]);
  return(
    <div style={{ flex:1,display:"flex",flexDirection:"column",padding:"20px 24px",gap:"16px",overflowY:"auto",background:`radial-gradient(ellipse at center,${C}08 0%,${BG} 100%)` }}>
      <div>
        <div style={{ fontSize:"10px",letterSpacing:"3px",color:C,fontFamily:MONO,marginBottom:"4px" }}>ETK 2</div>
        <div style={{ fontSize:"18px",fontWeight:"800",color:"#c7d2fe" }}>Komsulari Siniflandir</div>
        <div style={{ fontSize:"13px",color:"#4a4a8a",marginTop:"4px" }}>Ulke kartini uygun kutuya surukle birak</div>
      </div>

      {/* Suruklenecek kartlar */}
      <div style={{ padding:"12px 14px",background:"rgba(0,0,0,0.28)",border:"1px solid rgba(99,102,241,0.12)",borderRadius:"10px",minHeight:"60px" }}>
        <div style={{ fontSize:"11px",color:C,letterSpacing:"2px",fontWeight:"800",marginBottom:"10px" }}>SINIFLANDIRILACAK ULKELER</div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:"8px" }}>
          {pending.map(item=>(
            <div key={item.id} draggable
              onDragStart={e=>{setDragId(item.id);e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",item.id);}}
              onDragEnd={()=>{setDragId(null);setHovBucket(null);}}
              style={{
                padding:"9px 14px",
                background:dragId===item.id?`${C}30`:"rgba(0,0,0,0.4)",
                border:`1.5px solid ${dragId===item.id?C:`${C}35`}`,
                borderRadius:"8px",cursor:"grab",
                fontSize:"13px",fontWeight:"700",color:"#c7d2fe",fontFamily:FONT,
                transition:"all 0.15s",opacity:dragId===item.id?0.55:1,
                boxShadow:dragId===item.id?`0 0 14px ${C}55`:"none",
                userSelect:"none",WebkitUserSelect:"none",
              }}>
              {item.name}
            </div>
          ))}
          {cards.filter(it=>placed[it.id]).map(item=>(
            <div key={item.id}
              style={{
                padding:"9px 14px",
                background:wrong[item.id]?"rgba(239,68,68,0.08)":"rgba(16,185,129,0.08)",
                border:`1.5px solid ${wrong[item.id]?"#ef444430":"#10b98130"}`,
                borderRadius:"8px",fontSize:"13px",fontWeight:"700",
                color:wrong[item.id]?"#ef4444":"#10b981",fontFamily:FONT,opacity:0.65,
              }}>
              {wrong[item.id]?"X ":"OK "}{item.name}
            </div>
          ))}
        </div>
      </div>

      {/* Kutular */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",flex:1 }}>
        {BUCKETS.map(bucket=>(
          <div key={bucket.id}
            onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect="move";setHovBucket(bucket.id);}}
            onDragLeave={()=>setHovBucket(null)}
            onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("text/plain");if(id){setDragId(id);setTimeout(()=>doDrop(bucket.id),0);}else doDrop(bucket.id);}}
            style={{
              minHeight:"130px",padding:"14px 16px",
              background:hovBucket===bucket.id?`${bucket.color}18`:`${bucket.color}08`,
              border:`2px ${hovBucket===bucket.id?"solid":"dashed"} ${bucket.color}${hovBucket===bucket.id?"80":"40"}`,
              borderRadius:"12px",transition:"all 0.2s",
            }}>
            <div style={{ fontSize:"13px",fontWeight:"800",color:bucket.color,marginBottom:"4px" }}>{bucket.icon} {bucket.label}</div>
            <div style={{ fontSize:"11px",color:`${bucket.color}88`,marginBottom:"10px" }}>{bucket.sub}</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:"5px" }}>
              {cards.filter(it=>placed[it.id]===bucket.id).map(it=>(
                <div key={it.id}
                  style={{
                    padding:"5px 10px",
                    background:wrong[it.id]?"rgba(239,68,68,0.15)":"rgba(16,185,129,0.15)",
                    border:`1px solid ${wrong[it.id]?"#ef444450":"#10b98150"}`,
                    borderRadius:"6px",fontSize:"12px",
                    color:wrong[it.id]?"#ef4444":"#10b981",fontWeight:"700",
                  }}>
                  {wrong[it.id]?"X ":"OK "}{it.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding:"10px 14px",background:`${C}08`,border:`1px solid ${C}15`,borderRadius:"8px",display:"flex",justifyContent:"space-between" }}>
        <span style={{ fontSize:"12px",color:"#4a4a8a" }}>Kalan: {pending.length} kart</span>
        <span style={{ fontSize:"14px",fontWeight:"800",color:C,fontFamily:MONO }}>{score} dogru</span>
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
    <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px",background:`radial-gradient(ellipse at center,${C}0a 0%,${BG} 100%)` }}>
      <div style={{ fontSize:"52px" }}>⚖️</div>
      <div style={{ fontSize:"28px",fontWeight:"800",color:"#c7d2fe" }}>GZFT TAMAMLANDI!</div>
      <div style={{ fontSize:"44px",fontWeight:"800",color:C,fontFamily:MONO }}>{score}/{GZFT_ITEMS.length}</div>
      <div style={{ fontSize:"14px",color:"#4a4a8a" }}>kart dogru kategoriye yerlestirildi</div>
      <button onClick={retry} style={{ padding:"12px 28px",background:`linear-gradient(90deg,#3730a3,${C})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT }}>Tekrar</button>
    </div>
  );

  const pending=GZFT_ITEMS.filter(i=>!placed[i.id]);
  return(
    <div style={{ flex:1,display:"flex",flexDirection:"column",padding:"20px 24px",gap:"16px",overflowY:"auto",background:`radial-gradient(ellipse at 30% 20%,${C}08 0%,${BG} 100%)` }}>
      <div>
        <div style={{ fontSize:"10px",letterSpacing:"3px",color:C,fontFamily:MONO,marginBottom:"4px" }}>ETK 3 - GZFT ANALIZI</div>
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
                background:dragId===item.id?`${C}28`:"rgba(0,0,0,0.4)",
                border:`1.5px solid ${dragId===item.id?C:`${C}28`}`,
                borderRadius:"8px",cursor:"grab",
                fontSize:"12px",fontWeight:"600",color:"#c7d2fe",fontFamily:FONT,
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

      <div style={{ padding:"9px 14px",background:`${C}08`,border:`1px solid ${C}12`,borderRadius:"8px",display:"flex",justifyContent:"space-between" }}>
        <span style={{ fontSize:"12px",color:"#4a4a8a" }}>Kalan: {pending.length} kart</span>
        <span style={{ fontSize:"14px",fontWeight:"800",color:C,fontFamily:MONO }}>{score}/{GZFT_ITEMS.length} dogru</span>
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
      <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"18px",background:`radial-gradient(ellipse at center,${C}0a 0%,${BG} 100%)` }}>
        <div style={{ fontSize:"60px" }}>🌐</div>
        <div style={{ fontSize:"28px",fontWeight:"800",color:"#c7d2fe" }}>TEST TAMAMLANDI!</div>
        <div style={{ fontSize:"52px",fontWeight:"800",color:pct>=80?"#10b981":pct>=50?"#f59e0b":"#ef4444",fontFamily:MONO }}>{score} PUAN</div>
        <div style={{ fontSize:"15px",color:"#4a4a8a" }}>{answers.filter(Boolean).length}/{TEST_ITEMS.length} dogru - %{pct}</div>
        <div style={{ fontSize:"15px",color:"#6a6aaa",textAlign:"center",maxWidth:"420px",lineHeight:"1.8" }}>
          {pct>=80?"Mukemmel!":pct>=50?"Iyi! Ogren sekmesini tekrar incele.":"Tekrar dene!"}
        </div>
        <button onClick={retry} style={{ padding:"13px 30px",background:`linear-gradient(90deg,#3730a3,${C})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT }}>Tekrar Dene</button>
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
          <div style={{ maxWidth:"660px",width:"100%",padding:"16px 20px",background:sel===q.correct?"rgba(16,185,129,0.08)":"rgba(239,68,68,0.08)",border:`2px solid ${sel===q.correct?"rgba(16,185,129,0.28)":"rgba(239,68,68,0.28)"}`,borderRadius:"13px" }}>
            <div style={{ fontSize:"15px",fontWeight:"800",color:sel===q.correct?"#10b981":"#ef4444",marginBottom:"9px" }}>{sel===q.correct?"DOGRU!":"YANLIS!"}</div>
            <p style={{ fontSize:"14px",color:"#6a6aaa",lineHeight:"1.85",margin:0,fontWeight:"500" }}>{q.exp}</p>
          </div>
        )}
        {sel!==null&&(
          <button onClick={next}
            style={{ padding:"13px 36px",background:`linear-gradient(90deg,#3730a3,${C})`,border:"none",borderRadius:"11px",color:"#fff",fontSize:"15px",fontWeight:"800",letterSpacing:"1.5px",cursor:"pointer",fontFamily:FONT }}
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
function SLabel({children}:{children:React.ReactNode}){return <div style={{ fontSize:"11px",letterSpacing:"2px",color:"#3a3a6a",fontWeight:"800",fontFamily:FONT }}>{children}</div>;}
function SDivider(){return <div style={{ height:"1px",background:"rgba(99,102,241,0.1)",margin:"16px 0" }} />;}
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