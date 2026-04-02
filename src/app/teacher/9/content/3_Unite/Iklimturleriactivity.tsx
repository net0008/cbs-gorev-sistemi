"use client";
import { useState } from "react";

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
const BG   = "#060d18";
const C    = "#0ea5e9";
const C2   = "#f97316";
const C3   = "#a78bfa";
const C4   = "#34d399";
const C5   = "#ef4444";
const C6   = "#f59e0b";
type Tab = "learn"|"act"|"test";
type LearnSec = "turleri"|"turkiye"|"grafik"|"degisiklik"|"insanfaktor"|"etkiler"|"ongorular";

interface Iklim { id:string; ad:string; tur:"sicak"|"iliman"|"soguk"; icon:string; color:string; enlem:string; ozellik:string; yagis:string; sicaklik:string; ornek:string; }
const IKLIMLER: Iklim[] = [
  { id:"ekvatoral",  ad:"Ekvatoral İklim",           tur:"sicak",  icon:"🌿", color:"#166534",
    enlem:"0°-10°", ozellik:"Yıl boyunca sıcak ve yağışlı; mevsimler belirgin değil. Yıllık yağış 1500-2000 mm üzeri.",
    yagis:"Her mevsim bol yağış (yağmur ormanları)", sicaklik:"Yıl boyunca 24-28°C",
    ornek:"Amazonia, Kongo Havzası, Güneydoğu Asya adaları" },
  { id:"savan",      ad:"Savan İklimi",               tur:"sicak",  icon:"🦁", color:"#a16207",
    enlem:"5°-20°", ozellik:"Sıcak ve kurak kuşak ile Ekvator arasında geçiş iklimi. Yağışlı ve kurak mevsimler belirgindir.",
    yagis:"Yağışlı mevsim (yaz) ve uzun kurak mevsim (kış)", sicaklik:"22-30°C, yıllık fark az",
    ornek:"Orta Afrika, Brezilya iç kesimleri, Kuzey Avustralya" },
  { id:"col",        ad:"Çöl İklimi",                  tur:"sicak",  icon:"🏜️", color:"#b45309",
    enlem:"20°-30°", ozellik:"30° dinamik yüksek basınç altında; son derece kurak. Yıllık yağış 250 mm altında.",
    yagis:"Çok az ve düzensiz (<250 mm/yıl)", sicaklik:"Gündüz 40-50°C; gece -5°C ye kadar",
    ornek:"Sahra, Arabistan, Kalahari, Atacama" },
  { id:"muson",      ad:"Muson İklimi",                tur:"sicak",  icon:"🌧️", color:"#0369a1",
    enlem:"5°-25°", ozellik:"Kıtaların doğu kıyılarında muson rüzgârlarının etkisiyle yoğun yaz yağışları, kurak kış.",
    yagis:"Yaz musonu: aşırı yağış; Kış: oldukça kurak", sicaklik:"25-30°C, yaz sıcak",
    ornek:"Güney ve Güneydoğu Asya (Hindistan, Bangladeş, Vietnam)" },
  { id:"akdeniz",    ad:"Akdeniz İklimi",              tur:"iliman", icon:"🫒", color:"#15803d",
    enlem:"30°-45°", ozellik:"Yazlar sıcak-kurak, kışlar ılık-yağışlı. Yağışlar 30° DYB ile 60° DAB hareketine göre değişir.",
    yagis:"Kışın yağışlı (500-800 mm); yazın kurak", sicaklik:"Yaz 24-28°C; Kış 8-12°C",
    ornek:"Akdeniz kıyıları, Güney Avustralya, Şili kıyıları, Güney Batı Afrika" },
  { id:"okyanusal",  ad:"Okyanusal İklim",             tur:"iliman", icon:"🌊", color:"#0284c7",
    enlem:"45°-60°", ozellik:"Batı rüzgârlarının etkisiyle her mevsim ılık ve yağışlı. Sıcaklık farkları azdır.",
    yagis:"Her mevsim yağışlı (700-1200 mm)", sicaklik:"Yaz 15-20°C; Kış 5-10°C",
    ornek:"Batı Avrupa, Yeni Zelanda, Şilinin güneyi, Kanada kıyıları" },
  { id:"iliman_karasal",ad:"Ilıman Karasal (Step) İklim",tur:"iliman", icon:"🌾", color:"#ca8a04",
    enlem:"30°-60°", ozellik:"Kıtaların iç kesimlerinde karasallığın etkisiyle; yaz sıcak, kış soğuk, yağış az ve düzensiz.",
    yagis:"Az ve düzensiz (300-500 mm)", sicaklik:"Yaz 20-25°C; Kış -5°C nin altı",
    ornek:"Orta Asya, ABD orta kesimleri, Arjantin (Pampas), İç Anadolu" },
  { id:"sert_karasal",ad:"Sert Karasal İklim",         tur:"iliman", icon:"❄️", color:"#7c3aed",
    enlem:"50°-70°", ozellik:"Kıtaların iç ve kuzey bölgelerinde; kış çok soğuk ve uzun, yaz kısa ve serin.",
    yagis:"Az (200-400 mm)", sicaklik:"Kış -20°C/-40°C; Yaz 10-15°C",
    ornek:"Sibirya, Kanada iç kesimleri, Kuzey Kazakistan" },
  { id:"tundra",     ad:"Tundra (Kutup Altı) İklimi",  tur:"soguk",  icon:"🌿", color:"#0891b2",
    enlem:"60°-70°", ozellik:"Uzun ve soğuk kış, çok kısa ve serin yaz. Donmuş toprak (permafrost) yaygındır.",
    yagis:"Az (200-300 mm)", sicaklik:"En sıcak ay <10°C; kış -20°C nin altı",
    ornek:"Sibirya kıyıları, Kanada ve Alaska tundraları, İzlanda" },
  { id:"kutup",      ad:"Kutup İklimi",                 tur:"soguk",  icon:"🐧", color:"#94a3b8",
    enlem:"80°-90°", ozellik:"Yıl boyunca kar ve buz. En sıcak ay dahi 0°C nin altında. Bitki örtüsü yok.",
    yagis:"Çok az (<100 mm kar olarak)", sicaklik:"Yıl boyu negatif; kış -40°C/-70°C",
    ornek:"Antarktika, Grönland iç kesimleri, Kuzey Buz Denizi" },
  { id:"yuksek_dag", ad:"Yüksek Dağ İklimi",           tur:"soguk",  icon:"⛰️", color:"#64748b",
    enlem:"Her enlемде", ozellik:"Yükseltiye bağlı olarak sıcaklık düşer. İklim kuşaklarının dikey dağılımını yansıtır.",
    yagis:"Yükseltiye göre çeşitlenir", sicaklik:"Her 1000 metrede ~6.5°C düşer",
    ornek:"Himalayalar, And Dağları, Alpler, Ağrı Dağı, Toros Dağları" },
];

interface MK { id:string; ad:string; cat:"sicak"|"iliman"|"soguk"; }
const MATCH_ITEMS: MK[] = [
  {id:"m1",ad:"Ekvatoral İklim",cat:"sicak"},
  {id:"m2",ad:"Savan İklimi",cat:"sicak"},
  {id:"m3",ad:"Çöl İklimi",cat:"sicak"},
  {id:"m4",ad:"Muson İklimi",cat:"sicak"},
  {id:"m5",ad:"Akdeniz İklimi",cat:"iliman"},
  {id:"m6",ad:"Okyanusal İklim",cat:"iliman"},
  {id:"m7",ad:"Ilıman Karasal (Step) İklim",cat:"iliman"},
  {id:"m8",ad:"Sert Karasal İklim",cat:"iliman"},
  {id:"m9",ad:"Tundra İklimi",cat:"soguk"},
  {id:"m10",ad:"Kutup İklimi",cat:"soguk"},
  {id:"m11",ad:"Yüksek Dağ İklimi",cat:"soguk"},
];

interface Faktor { id:string; tip:"dogal"|"insan"; ad:string; icon:string; color:string; aciklama:string; }
const DEGISIKLIK_FAKTORLERI: Faktor[] = [
  { id:"isinimsal", tip:"dogal", ad:"Işınımsal Etkenler",      icon:"☀️", color:"#f59e0b",
    aciklama:"İklim sisteminin en önemli girdisi Güneş'ten alınan enerjidir. Yörünge ve eksen eğikliğindeki değişimler (~42.000 yıllık periyot) yeryüzünde sıcaklık değişimlerine neden olur. Eksen eğikliği bugün ~23°27' iken 22,1°-24,5° arasında değişmektedir. Bu, Güneş'ten alınan enerjide ~%1 değişime yol açar ve buzul çağlarının ortaya çıkmasında rol oynar." },
  { id:"sera_dogal", tip:"dogal", ad:"Atmosferdeki Sera Gazları",icon:"🌡️", color:"#dc2626",
    aciklama:"Su buharı (H₂O), karbondioksit (CO₂), metan (CH₄) gibi gazlar ısıyı tutarak sera etkisi oluşturur. Sera etkisi olmasa Dünya'nın ortalama sıcaklığı -18°C olurdu (gerçek: +15°C). Geçmişteki volkanik faaliyetler ve biyolojik aktiviteler sera gazı dengesini değiştirerek iklimi etkilemiştir." },
  { id:"tektonik", tip:"dogal", ad:"Tektonik Hareketler",      icon:"🌋", color:"#92400e",
    aciklama:"Levha hareketleri okyanus ve kıtaların konumunu değiştirir. Örnek: Hindistan levhası ~200 milyon yıl önce Güney Kutbu'na yakınken tektonik hareketlerle kuzeye kayıp Asya ile birleşmiştir. Buzullar eriyip tropik iklim koşulları oluşmuştur. Okyanus geçitlerinin açılıp kapanması da akıntıları değiştirir." },
  { id:"sanayi",  tip:"insan", ad:"Sanayi Faaliyetleri",       icon:"🏭", color:"#475569",
    aciklama:"Sanayi Devrimi'nden bu yana fosil yakıt kullanımı dramatik biçimde artmıştır. 2019 yılı verilerine göre sera gazı emisyonlarının %33'ü enerji sektöründen, %24'ü sanayiden kaynaklanmaktadır. Karbondioksit, metan, azot oksit ve florlu gazlar birikimine neden olur." },
  { id:"ulasim",  tip:"insan", ad:"Ulaşım Faaliyetleri",       icon:"✈️", color:"#6366f1",
    aciklama:"Karayolu, demiryolu, havayolu ve denizyolu ulaşımı sera gazı emisyonlarının %15'ini oluşturmaktadır. Özellikle havacılık ve deniz taşımacılığının küresel etkisi büyüktür. Kentsel ulaşım da CO₂ ve diğer kirleticileri artırır." },
  { id:"bitki",   tip:"insan", ad:"Bitki Örtüsünün Tahribi",   icon:"🌳", color:"#166534",
    aciklama:"Sanayi Devrimi'nden bu yana küresel orman alanlarının beşte biri yok edilmiştir. Ormanlar CO₂ depolar; yok edildiklerinde hem depolanan karbon salınır hem de yeni CO₂ emme kapasitesi azalır. Karaların ~1/3'ü tarım alanına dönüştürülmüştür. Tarım ve ormancılık emisyonların %22'sine karşılık gelir." },
];

interface Etki { id:string; ad:string; icon:string; color:string; detay:string[]; }
const ETKILER: Etki[] = [
  { id:"okyanus",  ad:"Okyanuslar",           icon:"🌊", color:"#0369a1", detay:["Su sıcaklığı yükseliyor","Okyanus akıntıları değişiyor","Su yoğunluğu azalıyor","Suyun hacmi artıyor (deniz seviyesi yükseliyor)","pH dengesi bozuluyor","Fitoplankton verimliliği etkileniyor"] },
  { id:"kriyosfer",ad:"Kriyosfer",            icon:"🧊", color:"#94a3b8", detay:["Kar örtüsü erken kayboluyor","Deniz buzulları alanı azalıyor","Permafrost çözünüyor (sera gazı salınımı)","Buzulların hacmi küçülüyor","Arktik deniz buzu 1990-2020 arası dramatik şekilde geriledi"] },
  { id:"karasal",  ad:"Kara Ekosistemleri",   icon:"🌿", color:"#166534", detay:["Bitki topluluklarının yayılma alanları değişiyor","Çiçek açma ve tomurcuklanma tarihleri öne geliyor","Orman yangınları artıyor","Türlerin göç yolları insan faaliyetleriyle engelleniyor","Sıcaklığa dayanıksız türler yok oluyor riski"] },
  { id:"denizseviyesi",ad:"Deniz Seviyesi",   icon:"📈", color:"#7c3aed", detay:["XX. yüzyılda ~20 cm yükseldi","2100'e kadar 28 cm-2 m arasında yükselebilir","2150'ye kadar 5 m yükselebilir","Maldivler gibi alçak adalar tehlikede","Kıyı kentleri su baskını riski taşıyor"] },
  { id:"ekstrem",  ad:"Aşırı Hava Olayları", icon:"⚡", color:"#dc2626", detay:["Sıcak hava dalgaları daha sık ve şiddetli","Şiddetli yağış ve sel artıyor","Kuraklık bölgeleri genişliyor","Kasırga sıklığı ve şiddeti artıyor","Türkiye'de 2023: 1475 aşırı hava olayı (rekor)"] },
  { id:"goc",      ad:"Göç ve Sosyal Etkiler",icon:"👥", color:"#f97316", detay:["2005-2050 arası ~100 milyon iklim mültecisi öngörüsü","Kurak bölgelerden büyük göç dalgası","Su kaynakları ve gıda güvenliği riski","Hastalık taşıyan böceklerin alanı genişliyor","Ekonomik ve siyasi çatışmalar artıyor"] },
];

const TEST_ITEMS = [
  {q:"İklim türleri belirlenirken hangi değişkenler esas alınır?",opts:["Nüfus yoğunluğu ve arazi kullanımı","Sıcaklık, basınç, rüzgâr, nem ve yağış gibi iklim değişkenlerinin uzun süreli ortalamaları","Kısa süreli hava olayları ve anlık meteoroloji verileri","Bitki örtüsü türleri ve hayvan toplulukları"],correct:1,exp:"Dünyada iklim türlerinin belirlenmesinde genel olarak sıcaklık, basınç, rüzgârlar, nem ve yağış gibi iklim değişkenlerinin uzun süreli ortalamaları dikkate alınır."},
  {q:"Tropikal kuşakta görülen sıcak iklimler kaç türe ayrılır?",opts:["2","3","4","5"],correct:2,exp:"Sıcak iklimler; ekvatoral iklim, çöl iklimi, savan iklimi ve muson iklimi olmak üzere dörde ayrılır."},
  {q:"Türkiyede mutlak konum itibarıyla hangi iklim kuşağı içinde yer alır?",opts:["Sert karasal iklim kuşağı","Tundra iklim kuşağı","Akdeniz iklim kuşağı","Ekvatoral iklim kuşağı"],correct:2,exp:"Türkiye, mutlak konumu itibarıyla Akdeniz iklim kuşağı içinde yer alır. Ancak yükselti, dağların uzanışı ve karasallık gibi faktörler nedeniyle farklı iklim türleri oluşmuştur."},
  {q:"Türkiyede etkili olan üç büyük iklim türü hangileridir?",opts:["Ekvatoral, savan ve çöl iklimleri","Akdeniz, Karadeniz ve karasal iklimler","Tundra, kutup ve yüksek dağ iklimleri","Okyanusal, muson ve step iklimleri"],correct:1,exp:"Akdeniz ve Karadeniz iklimleri ile karasal iklim, Türkiyede etkili olan üç büyük iklim türüdür."},
  {q:"Küresel iklim değişikliğine neden olan doğal faktörler arasında hangisi yer almaz?",opts:["Işınımsal etkenler","Tektonik hareketler","Sanayi faaliyetleri","Atmosferdeki sera gazlarındaki değişim"],correct:2,exp:"Sanayi faaliyetleri insan kaynaklı bir faktördür. Doğal faktörler; ışınımsal etkenler, tektonik hareketler ve atmosferdeki sera gazlarındaki doğal değişimdir."},
  {q:"Sera etkisi olmasa Dünyada ortalama sıcaklık ne olurdu?",opts:["+5°C","0°C","-18°C","+30°C"],correct:2,exp:"Bilim insanları sera etkisi olmaması durumunda Dünyanın ortalama sıcaklığının -18°C olacağını ifade etmektedir. Gerçekte ise ortalama sıcaklık +15°C civarındadır."},
  {q:"2019 yılı verilerine göre sera gazı emisyonlarının en büyük payı hangi sektöre aittir?",opts:["Ulaşım (%15)","Konutlar (%6)","Enerji tedarik sektörü (%33)","Sanayi (%24)"],correct:2,exp:"2019 yılındaki insan kaynaklı sera gazı emisyonlarının yaklaşık %33'ü enerji tedarik sektöründen kaynaklanmaktadır. Bunu %24 ile sanayi ve %22 ile tarım-ormancılık izlemektedir."},
  {q:"XXI. yüzyılda küresel deniz seviyesinin 2100 yılına kadar ne kadar yükselebileceği öngörülmektedir?",opts:["5-10 cm","28 cm ile 2 m arasında","10-15 cm","3-5 m arasında"],correct:1,exp:"XXI. yüzyılda okyanus sularının ısınması ve eriyen buzullar nedeniyle küresel deniz seviyesinin 2100 yılına kadar 28 cm ile 2 m arasında yükselebileceği hesaplanmaktadır."},
  {q:"İklim grafiğinde (klimagram) hangi iki değişken gösterilir?",opts:["Nüfus ve yüzölçümü","Aylık ortalama sıcaklık ve aylık toplam yağış","Rüzgâr hızı ve yönü","Güneşlenme süresi ve nem oranı"],correct:1,exp:"İklim grafiklerinde (klimagramlarda) bir yere ait aylık ortalama hava sıcaklığı (çizgi grafik) ve aylık toplam yağış miktarı (sütun grafik) gösterilir."},
  {q:"XX. yüzyılda atmosferde sera gazlarının artmasıyla dünya genelinde sıcaklık ne kadar yükselmiştir?",opts:["0.1°C","0.74°C","2.5°C","0.3°C"],correct:1,exp:"XX. yüzyılda atmosferde sera gazlarının artmasıyla dünya genelinde sıcaklık 0,74°C yükselmiştir. Bu artış kuzey yarım kürede çeşitli olumsuz etkilere neden olmuştur."},
];

function EslestirmeAktisite() {
  const BUCKETS = [
    {id:"sicak"  as const, label:"Sıcak İklimler 🌡️",   color:"#dc2626", sub:"Tropikal kuşak (0°-30°)"},
    {id:"iliman" as const, label:"Ilıman İklimler 🌿",   color:"#16a34a", sub:"Orta kuşak (30°-60°)"},
    {id:"soguk"  as const, label:"Soğuk İklimler ❄️",    color:"#0369a1", sub:"Kutup yakını (60°-90°)"},
  ];
  const [shuffled]=useState<MK[]>(()=>{ const a=[...MATCH_ITEMS]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; });
  const [placed,setPlaced]=useState<Record<string,string>>({});
  const [wrong,setWrong]=useState<Record<string,boolean>>({});
  const [dragId,setDragId]=useState<string|null>(null);
  const [hovBucket,setHov]=useState<string|null>(null);
  const [score,setScore]=useState(0);
  const [done,setDone]=useState(false);
  const doDrop=(bid:string)=>{ if(!dragId)return; const item=shuffled.find(m=>m.id===dragId); if(!item||placed[dragId])return; const ok=item.cat===bid; sndDrop();if(ok){sndOK();setScore(s=>s+1);}else sndFail(); const np={...placed,[dragId]:bid}; const nw={...wrong,[dragId]:!ok}; setPlaced(np);setWrong(nw);setDragId(null);setHov(null); if(Object.keys(np).length===shuffled.length)setTimeout(()=>setDone(true),400); };
  const retry=()=>{setPlaced({});setWrong({});setScore(0);setDone(false);setDragId(null);};
  if(done)return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"16px",padding:"48px 24px",textAlign:"center"}}><div style={{fontSize:"52px"}}>🌍</div><div style={{fontSize:"26px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Eşleştirme Tamamlandı!</div><div style={{fontSize:"50px",fontWeight:"800",color:C,fontFamily:MONO}}>{score}/{shuffled.length}</div><div style={{fontSize:"14px",color:"#475569",fontFamily:FONT}}>doğru eşleştirme</div><button onClick={retry} style={{padding:"12px 28px",background:`linear-gradient(90deg,#0369a1,${C})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT}}>🔄 Tekrar Oyna</button></div>);
  const pending=shuffled.filter(m=>!placed[m.id]);
  return(<div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
    <div><div style={{fontSize:"10px",color:C,letterSpacing:"3px",fontWeight:"800",fontFamily:MONO,marginBottom:"4px"}}>ETKİNLİK</div><div style={{fontSize:"17px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>🌍 İklim Türlerini Sınıflandır</div><div style={{fontSize:"12px",color:"#475569",marginTop:"3px",fontFamily:FONT}}>Her iklim türünü doğru kategoriye sürükle bırak</div></div>
    <div style={{padding:"12px 14px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"10px",minHeight:"48px"}}><div style={{fontSize:"10px",color:"#475569",letterSpacing:"2px",fontWeight:"800",marginBottom:"8px",fontFamily:FONT}}>İKLİM TÜRLERİ</div><div style={{display:"flex",flexWrap:"wrap",gap:"7px"}}>{pending.map(item=>(<div key={item.id} draggable onDragStart={e=>{setDragId(item.id);e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",item.id);}} onDragEnd={()=>{setDragId(null);setHov(null);}} style={{padding:"8px 12px",background:dragId===item.id?`${C}20`:"rgba(0,0,0,0.4)",border:`1.5px solid ${dragId===item.id?C:"rgba(255,255,255,0.1)"}`,borderRadius:"8px",cursor:"grab",fontSize:"12px",fontWeight:"600",color:"#cbd5e1",fontFamily:FONT,userSelect:"none",WebkitUserSelect:"none",opacity:dragId===item.id?0.5:1}}>{item.ad}</div>))}{shuffled.filter(m=>placed[m.id]).map(item=>(<div key={item.id} style={{padding:"8px 12px",background:wrong[item.id]?"rgba(239,68,68,0.08)":"rgba(52,211,153,0.08)",border:`1.5px solid ${wrong[item.id]?"#ef444430":"#34d39930"}`,borderRadius:"8px",fontSize:"12px",fontWeight:"600",color:wrong[item.id]?"#ef4444":"#34d399",fontFamily:FONT,opacity:0.65}}>{wrong[item.id]?"✗ ":"✓ "}{item.ad}</div>))}</div></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px"}}>
      {BUCKETS.map(bucket=>(<div key={bucket.id} onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect="move";setHov(bucket.id);}} onDragLeave={()=>setHov(null)} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("text/plain");if(id){setDragId(id);setTimeout(()=>doDrop(bucket.id),0);}else doDrop(bucket.id);}} style={{minHeight:"140px",padding:"12px",background:hovBucket===bucket.id?`${bucket.color}18`:`${bucket.color}08`,border:`2px ${hovBucket===bucket.id?"solid":"dashed"} ${bucket.color}${hovBucket===bucket.id?"80":"35"}`,borderRadius:"11px",transition:"all 0.2s"}}><div style={{fontSize:"13px",fontWeight:"800",color:bucket.color,marginBottom:"3px",fontFamily:FONT}}>{bucket.label}</div><div style={{fontSize:"11px",color:`${bucket.color}70`,marginBottom:"8px",fontFamily:FONT}}>{bucket.sub}</div><div style={{display:"flex",flexDirection:"column",gap:"4px"}}>{shuffled.filter(m=>placed[m.id]===bucket.id).map(it=>(<div key={it.id} style={{padding:"5px 8px",background:wrong[it.id]?"rgba(239,68,68,0.12)":"rgba(52,211,153,0.12)",border:`1px solid ${wrong[it.id]?"#ef444440":"#34d39940"}`,borderRadius:"5px",fontSize:"11px",color:wrong[it.id]?"#ef4444":"#34d399",fontWeight:"600",fontFamily:FONT}}>{wrong[it.id]?"✗ ":"✓ "}{it.ad}</div>))}</div></div>))}
    </div>
    <div style={{padding:"8px 14px",background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"8px",display:"flex",justifyContent:"space-between"}}><span style={{fontSize:"12px",color:"#475569",fontFamily:FONT}}>Kalan: {pending.length}</span><span style={{fontSize:"14px",fontWeight:"800",color:C,fontFamily:MONO}}>{score} doğru</span></div>
  </div>);
}

function TestTab() {
  const [qIdx,setQIdx]=useState(0); const [sel,setSel]=useState<number|null>(null);
  const [score,setScore]=useState(0); const [answers,setAnswers]=useState<boolean[]>([]);
  const [done,setDone]=useState(false); const q=TEST_ITEMS[qIdx];
  const handleAnswer=(i:number)=>{ if(sel!==null)return; setSel(i); const ok=i===q.correct; if(ok){setScore(s=>s+10);sndOK();}else sndFail(); setAnswers(a=>[...a,ok]); };
  const next=()=>{ sndClick(); if(qIdx>=TEST_ITEMS.length-1){setDone(true);return;} setQIdx(i=>i+1); setSel(null); };
  const retry=()=>{ setQIdx(0);setSel(null);setScore(0);setAnswers([]);setDone(false); };
  if(done){ const pct=Math.round((score/(TEST_ITEMS.length*10))*100); return(
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"18px",padding:"40px",textAlign:"center"}}>
      <div style={{fontSize:"52px"}}>🌍</div>
      <div style={{fontSize:"26px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Test Tamamlandı!</div>
      <div style={{fontSize:"52px",fontWeight:"800",color:pct>=80?"#34d399":pct>=50?C6:C5,fontFamily:MONO}}>{score} PUAN</div>
      <div style={{fontSize:"14px",color:"#475569",fontFamily:FONT}}>{answers.filter(Boolean).length}/{TEST_ITEMS.length} doğru · %{pct}</div>
      <button onClick={retry} style={{padding:"13px 30px",background:`linear-gradient(90deg,#0369a1,${C})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT}}>🔄 Tekrar Dene</button>
    </div>); }
  return(<div style={{flex:1,display:"flex",overflow:"hidden"}}>
    <div style={{width:"210px",flexShrink:0,borderRight:`1px solid ${C}10`,background:"rgba(2,5,12,0.75)",padding:"18px 12px",display:"flex",flexDirection:"column",gap:"5px",overflowY:"auto"}}>
      <div style={{fontSize:"11px",letterSpacing:"2px",color:"#475569",fontWeight:"800",fontFamily:FONT,marginBottom:"4px"}}>SORULAR</div>
      {TEST_ITEMS.map((_,i)=>{ const d=i<answers.length,cur=i===qIdx; return(<div key={i} style={{display:"flex",alignItems:"center",gap:"8px",padding:"7px 9px",background:cur?`${C}10`:"rgba(0,0,0,0.15)",border:`1.5px solid ${cur?C:d?(answers[i]?"rgba(52,211,153,0.3)":"rgba(239,68,68,0.3)"):"rgba(255,255,255,0.04)"}`,borderRadius:"7px"}}><div style={{width:"19px",height:"19px",borderRadius:"50%",background:d?(answers[i]?"#34d399":"#ef4444"):cur?C:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",fontWeight:"800",color:"#fff",flexShrink:0,fontFamily:MONO}}>{d?(answers[i]?"✓":"✗"):i+1}</div><span style={{fontSize:"11px",fontWeight:"700",color:cur?C:d?(answers[i]?"#34d399":"#ef4444"):"#334155",fontFamily:FONT}}>Soru {i+1}</span></div>); })}
      <div style={{marginTop:"auto",padding:"10px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"8px",textAlign:"center"}}><div style={{fontSize:"10px",color:"#475569",fontWeight:"700",fontFamily:FONT,marginBottom:"3px"}}>PUAN</div><div style={{fontSize:"28px",fontWeight:"800",color:C,fontFamily:MONO}}>{score}</div><div style={{fontSize:"10px",color:"#334155",fontFamily:FONT}}>/ {TEST_ITEMS.length*10}</div></div>
    </div>
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"22px 28px",overflowY:"auto",gap:"14px"}}>
      <div style={{width:"100%",maxWidth:"640px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"7px"}}><span style={{fontSize:"12px",color:"#475569",fontWeight:"700",fontFamily:FONT}}>SORU {qIdx+1}/{TEST_ITEMS.length}</span><span style={{fontSize:"12px",color:C,fontFamily:FONT}}>{Math.round((qIdx/TEST_ITEMS.length)*100)}%</span></div><div style={{height:"4px",background:`${C}18`,borderRadius:"2px",overflow:"hidden"}}><div style={{height:"100%",width:`${(qIdx/TEST_ITEMS.length)*100}%`,background:`linear-gradient(90deg,#0369a1,${C})`,borderRadius:"2px",transition:"width 0.4s"}}/></div></div>
      <div style={{maxWidth:"640px",width:"100%",padding:"18px 22px",background:`${C}08`,border:`1.5px solid ${C}20`,borderRadius:"14px"}}><p style={{fontSize:"15px",color:"#e2e8f0",lineHeight:"1.9",margin:0,fontWeight:"600",fontFamily:FONT}}>{q.q}</p></div>
      <div style={{maxWidth:"640px",width:"100%",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
        {q.opts.map((opt,i)=>{ const isSel=sel===i,isCorr=i===q.correct,show=sel!==null; let bg="rgba(0,0,0,0.25)",border="rgba(255,255,255,0.07)",color="#64748b"; if(show){if(isCorr){bg="#34d39912";border="#34d399";color="#34d399";}else if(isSel){bg="rgba(239,68,68,0.1)";border="#ef4444";color="#ef4444";}} return(<button key={i} onClick={()=>handleAnswer(i)} disabled={sel!==null} style={{padding:"12px 14px",background:bg,border:`2px solid ${border}`,borderRadius:"10px",cursor:sel!==null?"default":"pointer",fontFamily:FONT,textAlign:"left",transition:"all 0.18s"}}><div style={{display:"flex",alignItems:"flex-start",gap:"8px"}}><span style={{width:"20px",height:"20px",borderRadius:"50%",background:show&&isCorr?"#34d399":show&&isSel?"#ef4444":`${C}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",fontWeight:"800",color:show?"#fff":"#94a3b8",flexShrink:0,marginTop:"1px",fontFamily:MONO}}>{show&&isCorr?"✓":show&&isSel&&!isCorr?"✗":String.fromCharCode(65+i)}</span><span style={{fontSize:"13px",color,fontWeight:"600",lineHeight:"1.6",fontFamily:FONT}}>{opt}</span></div></button>); })}
      </div>
      {sel!==null&&(<div style={{maxWidth:"640px",width:"100%",padding:"14px 17px",background:sel===q.correct?"rgba(52,211,153,0.07)":"rgba(239,68,68,0.07)",border:`1.5px solid ${sel===q.correct?"rgba(52,211,153,0.25)":"rgba(239,68,68,0.25)"}`,borderRadius:"12px"}}><div style={{fontSize:"14px",fontWeight:"800",color:sel===q.correct?"#34d399":"#ef4444",marginBottom:"7px",fontFamily:FONT}}>{sel===q.correct?"✅ DOĞRU!":"❌ YANLIŞ!"}</div><p style={{fontSize:"13px",color:"#64748b",lineHeight:"1.85",margin:0,fontFamily:FONT}}>{q.exp}</p></div>)}
      {sel!==null&&(<button onClick={next} style={{padding:"11px 32px",background:`linear-gradient(90deg,#0369a1,${C})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)"}} onMouseLeave={e=>{e.currentTarget.style.transform="none"}}>{qIdx>=TEST_ITEMS.length-1?"🏁 Sonuçları Gör":"⏭ Sonraki Soru"}</button>)}
    </div>
  </div>);
}

export default function IklimTurleriActivity({ onClose }: { onClose: () => void }) {
  const [tab,setTab]=useState<Tab>("learn");
  const [sec,setSec]=useState<LearnSec>("turleri");
  const [activeIklim,setActiveI]=useState<string>("ekvatoral");
  const [filterTur,setFilterTur]=useState<"hepsi"|"sicak"|"iliman"|"soguk">("hepsi");
  const [activeFaktor,setActiveF]=useState<string>("isinimsal");
  const [activeEtki,setActiveE]=useState<string>("okyanus");

  const TABS=[{id:"learn" as Tab,icon:"📖",label:"ÖĞREN"},{id:"act" as Tab,icon:"🌍",label:"ETKİNLİK"},{id:"test" as Tab,icon:"✏️",label:"TEST"}];
  const SECTIONS: {id:LearnSec;icon:string;label:string;color:string}[]=[
    {id:"turleri",      icon:"🗺️",label:"İklim Türleri",          color:C},
    {id:"turkiye",      icon:"🇹🇷",label:"Türkiyede İklim",        color:C2},
    {id:"grafik",       icon:"📊",label:"İklim Grafiği Okuma",    color:C4},
    {id:"degisiklik",   icon:"🌡️",label:"İklim Değişikliği",      color:C5},
    {id:"insanfaktor",  icon:"🏭",label:"İnsan Faktörleri",       color:"#7c3aed"},
    {id:"etkiler",      icon:"📉",label:"Etkileri",               color:"#dc2626"},
    {id:"ongorular",    icon:"🔭",label:"Öngörüler",              color:C6},
  ];

  const filteredIklimler = filterTur==="hepsi" ? IKLIMLER : IKLIMLER.filter(i=>i.tur===filterTur);
  const TUR_COLORS: Record<string,string> = {sicak:"#dc2626",iliman:"#16a34a",soguk:"#0369a1"};
  const TUR_LABELS: Record<string,string> = {sicak:"Sıcak İklim",iliman:"Ilıman İklim",soguk:"Soğuk İklim"};

  return(
    <div style={{position:"fixed",inset:0,zIndex:1000,background:BG,display:"flex",flexDirection:"column",fontFamily:FONT,userSelect:"none",WebkitUserSelect:"none"}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",height:"64px",borderBottom:`1px solid ${C}1a`,background:"rgba(2,4,12,0.96)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:"22px"}}>
          <div><div style={{fontSize:"10px",letterSpacing:"4px",color:C,opacity:0.6,fontFamily:MONO}}>3. ÜNİTE — DOĞAL SİSTEMLER</div><div style={{fontSize:"19px",fontWeight:"800",color:"#e2e8f0"}}>İklim Türleri & Değişiklikler</div></div>
          <div style={{display:"flex",gap:"3px",background:"rgba(0,0,0,0.4)",padding:"4px",borderRadius:"10px"}}>{TABS.map(t=>(<button key={t.id} onClick={()=>{sndClick();setTab(t.id);}} style={{padding:"7px 18px",borderRadius:"7px",border:"none",cursor:"pointer",fontFamily:FONT,fontSize:"12px",fontWeight:"700",transition:"all 0.18s",background:tab===t.id?C:"transparent",color:tab===t.id?"#fff":"#334155"}}>{t.icon} {t.label}</button>))}</div>
        </div>
        <button onClick={onClose} style={{padding:"8px 18px",background:"transparent",border:"1px solid rgba(255,80,80,0.3)",borderRadius:"8px",color:"#f87171",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:FONT}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,80,80,0.1)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>✕ KAPAT</button>
      </div>

      <div style={{flex:1,overflow:"hidden",display:"flex",minHeight:0}}>
        {tab==="learn" && (
          <div style={{flex:1,display:"flex",overflow:"hidden"}}>
            <div style={{width:"214px",flexShrink:0,borderRight:`1px solid ${C}12`,background:"rgba(2,4,12,0.72)",overflowY:"auto",padding:"14px 10px"}}>
              <div style={{fontSize:"11px",letterSpacing:"2px",color:"#475569",fontWeight:"800",fontFamily:FONT,marginBottom:"10px"}}>KONULAR</div>
              <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>{SECTIONS.map(s=>(<button key={s.id} onClick={()=>{sndClick();setSec(s.id);}} style={{padding:"9px 12px",background:sec===s.id?`${s.color}14`:"rgba(0,0,0,0.2)",border:`1.5px solid ${sec===s.id?s.color:"rgba(255,255,255,0.04)"}`,borderRadius:"8px",cursor:"pointer",textAlign:"left",fontFamily:FONT,transition:"all 0.18s",display:"flex",gap:"8px",alignItems:"center"}}><span style={{fontSize:"15px"}}>{s.icon}</span><span style={{fontSize:"12px",fontWeight:"800",color:sec===s.id?s.color:"#334155"}}>{s.label}</span></button>))}</div>
              <div style={{height:"1px",background:`${C}10`,margin:"14px 0"}}/>
              <div style={{fontSize:"11px",letterSpacing:"2px",color:"#475569",fontWeight:"800",fontFamily:FONT,marginBottom:"8px"}}>ÖZET</div>
              <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                {[["4 Sıcak İklim","Ekv./Sav./Çöl/Muson","#dc2626"],["4 Ilıman İklim","Akd./Oky./Step/Sert","#16a34a"],["3 Soğuk İklim","Tundra/Kutup/Dağ","#0369a1"],["3 Doğal Faktör","Işınımsal/Sera/Tektonik",C6],["3 İnsan Faktörü","Sanayi/Ulaşım/Ormansızlaşma","#7c3aed"]].map(([k,v,c])=>(<div key={k} style={{padding:"6px 9px",background:"rgba(0,0,0,0.2)",borderRadius:"6px",borderLeft:`2px solid ${c}`}}><div style={{fontSize:"11px",color:String(c),fontWeight:"800",fontFamily:FONT}}>{k}</div><div style={{fontSize:"10px",color:"#334155",fontFamily:FONT,marginTop:"2px"}}>{v}</div></div>))}
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"20px 24px",display:"flex",flexDirection:"column",gap:"14px",background:`radial-gradient(ellipse at 10% 10%,${C}05 0%,${BG} 65%)`}}>

              {/* İKLİM TÜRLERİ */}
              {sec==="turleri" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"13px"}}>
                  <div><div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"7px"}}><span style={{fontSize:"28px"}}>🗺️</span><div><div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Dünya İklim Türleri</div><div style={{fontSize:"13px",color:C,fontWeight:"600",fontFamily:FONT}}>11 iklim türü — Sıcak · Ilıman · Soğuk</div></div></div><div style={{height:"2px",background:`linear-gradient(90deg,${C},transparent)`,opacity:0.35,borderRadius:"2px"}}/></div>
                  <div style={{padding:"13px 17px",background:`${C}08`,border:`1.5px solid ${C}18`,borderRadius:"11px"}}><p style={{fontSize:"14px",color:"#94a3b8",lineHeight:"1.9",margin:0,fontFamily:FONT}}>İklim türleri; <strong style={{color:C5}}>sıcaklık, basınç, rüzgâr, nem ve yağış</strong> gibi değişkenlerin uzun süreli ortalamasına göre belirlenir. <strong style={{color:C}}>Enlem, karasallık-denizellik, okyanus akıntıları ve topoğrafik faktörler</strong> farklı iklim türlerini ortaya çıkarır.</p></div>
                  <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                    {([["hepsi","Hepsi 🌍",C],["sicak","Sıcak 🌡️","#dc2626"],["iliman","Ilıman 🌿","#16a34a"],["soguk","Soğuk ❄️","#0369a1"]] as [string,string,string][]).map(([id,label,color])=>(<button key={id} onClick={()=>{sndClick();setFilterTur(id as typeof filterTur);setActiveI(IKLIMLER.filter(i=>id==="hepsi"||i.tur===id)[0]?.id||activeIklim);}} style={{padding:"7px 14px",background:filterTur===id?`${color}20`:"rgba(0,0,0,0.25)",border:`1.5px solid ${filterTur===id?color:"rgba(255,255,255,0.08)"}`,borderRadius:"8px",cursor:"pointer",fontSize:"12px",fontWeight:"800",color:filterTur===id?color:"#475569",fontFamily:FONT,transition:"all 0.18s"}}>{label}</button>))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:"7px"}}>
                    {filteredIklimler.map(iklim=>(<button key={iklim.id} onClick={()=>{sndClick();setActiveI(iklim.id);}} style={{padding:"10px 8px",background:activeIklim===iklim.id?`${iklim.color}22`:`${iklim.color}08`,border:`1.5px solid ${activeIklim===iklim.id?iklim.color:`${iklim.color}25`}`,borderRadius:"9px",cursor:"pointer",textAlign:"center",fontFamily:FONT,transition:"all 0.2s"}}><div style={{fontSize:"20px",marginBottom:"5px"}}>{iklim.icon}</div><div style={{fontSize:"11px",fontWeight:"800",color:activeIklim===iklim.id?iklim.color:"#475569",lineHeight:"1.3"}}>{iklim.ad}</div><div style={{fontSize:"9px",color:TUR_COLORS[iklim.tur],marginTop:"3px",fontWeight:"700"}}>{TUR_LABELS[iklim.tur]}</div></button>))}
                  </div>
                  {(() => { const i=IKLIMLER.find(x=>x.id===activeIklim); if(!i)return null; return(<div style={{padding:"16px 18px",background:`${i.color}0d`,border:`1.5px solid ${i.color}28`,borderRadius:"12px",animation:"fadeUp 0.2s ease"}}><div style={{display:"flex",gap:"10px",alignItems:"center",marginBottom:"10px"}}><span style={{fontSize:"26px"}}>{i.icon}</span><div><div style={{fontSize:"16px",fontWeight:"800",color:i.color,fontFamily:FONT}}>{i.ad}</div><div style={{fontSize:"12px",color:`${i.color}80`,fontFamily:FONT}}>{TUR_LABELS[i.tur]} · {i.enlem} enlemi</div></div></div><p style={{fontSize:"13px",color:"#94a3b8",lineHeight:"1.85",margin:"0 0 12px",fontFamily:FONT}}>{i.ozellik}</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>{[["🌡️","Sıcaklık",i.sicaklik],["🌧️","Yağış",i.yagis],["📍","Örnek Bölge",i.ornek]].map(([icon,label,val])=>(<div key={String(label)} style={{padding:"9px 11px",background:"rgba(0,0,0,0.22)",borderRadius:"8px"}}><div style={{fontSize:"10px",color:i.color,fontWeight:"800",fontFamily:FONT,marginBottom:"4px"}}>{icon} {String(label)}</div><div style={{fontSize:"11px",color:"#64748b",fontFamily:FONT,lineHeight:"1.6"}}>{String(val)}</div></div>))}</div></div>); })()}
                </div>
              )}

              {/* TÜRKİYEDE İKLİM */}
              {sec==="turkiye" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"13px"}}>
                  <div><div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"7px"}}><span style={{fontSize:"28px"}}>🇹🇷</span><div><div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Türkiyede İklim Türleri</div><div style={{fontSize:"13px",color:C2,fontWeight:"600",fontFamily:FONT}}>Akdeniz · Karadeniz · Karasal ve geçiş iklimleri</div></div></div><div style={{height:"2px",background:`linear-gradient(90deg,${C2},transparent)`,opacity:0.35,borderRadius:"2px"}}/></div>
                  <div style={{padding:"13px 17px",background:`${C2}0a`,border:`1.5px solid ${C2}22`,borderRadius:"11px"}}><p style={{fontSize:"14px",color:"#94a3b8",lineHeight:"1.9",margin:0,fontFamily:FONT}}>Türkiye mutlak konum itibarıyla <strong style={{color:C2}}>Akdeniz iklim kuşağı</strong> içinde yer alır. Ancak <strong style={{color:"#e2e8f0"}}>yükselti, dağların uzanışı, karasallık-denizellik ve bakı</strong> gibi faktörler nedeniyle birden fazla iklim türü görülür. İklimler arası geçiş dereceli gerçekleşir; kesin sınır çizmek mümkün değildir.</p></div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"9px"}}>
                    {[
                      {ad:"Akdeniz İklimi",color:"#dc7c00",icon:"🫒",bolge:"Güney ve batı kıyıları",ozellik:"Yazlar sıcak-kurak, kışlar ılık-yağışlı. İç kesimlere gidildikçe karasallık artar."},
                      {ad:"Karadeniz İklimi",color:"#0369a1",icon:"🌧️",bolge:"Kuzey kıyı şeridi",ozellik:"Her mevsim bol yağışlı; sıcaklık farkları azdır. Dağların denize bakan yamaçları en çok yağış alır."},
                      {ad:"Karasal İklim",color:"#78350f",icon:"🌾",bolge:"İç ve Doğu Anadolu",ozellik:"Yaz sıcak-kurak, kış soğuk ve az yağışlı. Yıllık ve günlük sıcaklık farkları çok fazla."},
                    ].map(item=>(<div key={item.ad} style={{padding:"13px 14px",background:`${item.color}0d`,border:`1.5px solid ${item.color}28`,borderRadius:"11px"}}><div style={{fontSize:"22px",marginBottom:"5px"}}>{item.icon}</div><div style={{fontSize:"13px",fontWeight:"800",color:item.color,marginBottom:"4px",fontFamily:FONT}}>{item.ad}</div><div style={{fontSize:"11px",color:"#64748b",fontWeight:"700",marginBottom:"6px",fontFamily:FONT}}>{item.bolge}</div><p style={{fontSize:"12px",color:"#475569",lineHeight:"1.7",margin:0,fontFamily:FONT}}>{item.ozellik}</p></div>))}
                  </div>
                  <div style={{padding:"13px 16px",background:"rgba(0,0,0,0.25)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"9px"}}>
                    <div style={{fontSize:"11px",color:C2,letterSpacing:"2px",fontWeight:"800",marginBottom:"8px",fontFamily:FONT}}>GEÇİŞ İKLİMLERİ</div>
                    <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
                      {["Akdeniz-Karasal Geçiş","Karasal-Karadeniz Geçiş","Akdeniz-Karadeniz Geçiş","Karasal-Sert Karasal Geçiş"].map(g=>(<div key={g} style={{padding:"6px 10px",background:"rgba(249,115,22,0.08)",border:"1px solid rgba(249,115,22,0.2)",borderRadius:"7px",fontSize:"11px",fontWeight:"700",color:C2,fontFamily:FONT}}>{g}</div>))}
                    </div>
                    <div style={{fontSize:"12px",color:"#475569",marginTop:"8px",lineHeight:"1.7",fontFamily:FONT}}>Örneğin Anadolunun batısında (Uşak, Afyon, Kütahya) Akdeniz ikliminin özellikleri hissedilirken yükselti ve karasallığın etkisiyle karasal iklim özellikleri de görülür.</div>
                  </div>
                </div>
              )}

              {/* İKLİM GRAFİĞİ OKUMA */}
              {sec==="grafik" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"13px"}}>
                  <div><div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"7px"}}><span style={{fontSize:"28px"}}>📊</span><div><div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>İklim Grafiği (Klimagram) Nasıl Okunur?</div><div style={{fontSize:"13px",color:C4,fontWeight:"600",fontFamily:FONT}}>Sıcaklık + Yağış verilerini yorumlama</div></div></div><div style={{height:"2px",background:`linear-gradient(90deg,${C4},transparent)`,opacity:0.35,borderRadius:"2px"}}/></div>
                  <div style={{padding:"13px 17px",background:`${C4}08`,border:`1.5px solid ${C4}18`,borderRadius:"11px"}}><p style={{fontSize:"14px",color:"#94a3b8",lineHeight:"1.9",margin:0,fontFamily:FONT}}>Bir yere ait <strong style={{color:C4}}>aylık ortalama sıcaklık</strong> (çizgi grafik — sol eksen, °C) ve <strong style={{color:C}}>aylık toplam yağış</strong> (sütun grafik — sağ eksen, mm) değerlerini gösteren grafiklere klimagram denir. Bu grafikler sayesinde iklim özelliklerini kolayca yorumlayabiliriz.</p></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"9px"}}>
                    {[
                      {icon:"🌡️",color:C5,title:"Sıcaklık Değişimi",desc:"Grafikteki çizgi grafiği sol eksene (°C) göre aylık ortalama sıcaklığı gösterir. En yüksek ve en düşük aylar, yıllık sıcaklık farkı ve mevsimsel değişimler bu çizgiden okunur."},
                      {icon:"🌧️",color:C,title:"Yağış Dağılımı",desc:"Sütun grafik sağ eksene (mm) göre aylık toplam yağışı gösterir. Yağışın hangi mevsimlerde yoğunlaştığı, düzenli mi düzensiz mi olduğu ve yıllık toplam bu sütunlardan hesaplanır."},
                      {icon:"📍",title:"Grafiğin Konumu",color:C4,desc:"Grafiğin başlığında yer ve ülke adı; enlem, boylam ve yükselti değerleri verilir. Bu bilgiler iklim bölgesinin belirlenmesinde kullanılır."},
                      {icon:"🔍",title:"İklim Türünü Belirle",color:C6,desc:"Yağışın hangi mevsimde yoğun olduğu + yaz-kış sıcaklık farkı → iklim türünü belirler. Örn: Yaz kurak + Kış yağışlı = Akdeniz iklimi. Her mevsim yağışlı + az sıcaklık farkı = Okyanusal iklim."},
                    ].map(item=>(<div key={item.title} style={{padding:"12px 14px",background:`${item.color}08`,border:`1px solid ${item.color}20`,borderRadius:"10px",display:"flex",gap:"9px",alignItems:"flex-start"}}><span style={{fontSize:"20px",flexShrink:0}}>{item.icon}</span><div><div style={{fontSize:"12px",fontWeight:"800",color:item.color,fontFamily:FONT,marginBottom:"4px"}}>{item.title}</div><p style={{fontSize:"12px",color:"#475569",lineHeight:"1.7",margin:0,fontFamily:FONT}}>{item.desc}</p></div></div>))}
                  </div>
                  {/* Örnek klimagram SVG — Ankara verileri */}
                  <div style={{padding:"14px 16px",background:"rgba(0,0,0,0.28)",border:"1px solid rgba(52,211,153,0.15)",borderRadius:"11px"}}>
                    <div style={{fontSize:"11px",color:C4,letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT}}>ÖRNEK KLİMAGRAM — ANKARA (Karasal İklim)</div>
                    {(() => {
                      const months=["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
                      const temp=[0.3,1.7,5.7,11.3,16.1,20.0,23.4,23.5,19.0,13.2,7.3,2.6];
                      const rain=[39.9,35.1,39.7,41.8,51.4,36.7,14.1,12.7,17.9,27.1,31.8,44.2];
                      const maxR=Math.max(...rain); const maxT=25; const svgW=500; const svgH=140;
                      const barW=svgW/12-3;
                      return(<svg viewBox={`0 0 ${svgW} ${svgH+30}`} width="100%" style={{maxWidth:"500px",display:"block",margin:"0 auto"}}>
                        {months.map((_,i)=>{
                          const x=i*(svgW/12)+2;
                          const bh=Math.round((rain[i]/maxR)*svgH*0.85);
                          const ty=Math.round(svgH-(temp[i]/maxT)*svgH*0.9)-5;
                          return(<g key={i}>
                            <rect x={x} y={svgH-bh} width={barW} height={bh} fill={`${C}50`} rx="2"/>
                            <circle cx={x+barW/2} cy={ty} r="3" fill={C5}/>
                            {i>0&&<line x1={(i-1)*(svgW/12)+barW/2+2} y1={Math.round(svgH-(temp[i-1]/maxT)*svgH*0.9)-5} x2={x+barW/2} y2={ty} stroke={C5} strokeWidth="1.5"/>}
                            <text x={x+barW/2} y={svgH+12} textAnchor="middle" fontSize="7.5" fill="#475569" fontFamily={FONT}>{months[i]}</text>
                          </g>);
                        })}
                        <text x="2" y="10" fontSize="8" fill={C5} fontFamily={FONT}>°C</text>
                        <text x={svgW-20} y="10" fontSize="8" fill={C} fontFamily={FONT}>mm</text>
                      </svg>);
                    })()}
                    <div style={{display:"flex",gap:"12px",justifyContent:"center",marginTop:"6px"}}><div style={{display:"flex",alignItems:"center",gap:"5px"}}><div style={{width:"20px",height:"3px",background:C5,borderRadius:"2px"}}/><span style={{fontSize:"10px",color:"#64748b",fontFamily:FONT}}>Sıcaklık (°C)</span></div><div style={{display:"flex",alignItems:"center",gap:"5px"}}><div style={{width:"12px",height:"10px",background:`${C}50`,borderRadius:"2px"}}/><span style={{fontSize:"10px",color:"#64748b",fontFamily:FONT}}>Yağış (mm)</span></div></div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px",marginTop:"10px"}}>
                      {[["En sıcak ay","Ağustos (23.5°C)",C5],["En soğuk ay","Ocak (0.3°C)",C],["En çok yağış","Mayıs (51.4 mm)",C4],["İklim türü","Ilıman Karasal (Step)",C6]].map(([k,v,c])=>(<div key={k} style={{padding:"7px 9px",background:"rgba(0,0,0,0.2)",borderRadius:"7px"}}><div style={{fontSize:"10px",color:String(c),fontWeight:"800",fontFamily:FONT}}>{k}</div><div style={{fontSize:"11px",color:"#64748b",fontFamily:FONT,marginTop:"2px"}}>{v}</div></div>))}
                    </div>
                  </div>
                </div>
              )}

              {/* İKLİM DEĞİŞİKLİĞİ DOĞAL FAKTÖRLERİ */}
              {sec==="degisiklik" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"13px"}}>
                  <div><div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"7px"}}><span style={{fontSize:"28px"}}>🌡️</span><div><div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>İklim Değişikliği — Doğal Faktörler</div><div style={{fontSize:"13px",color:C5,fontWeight:"600",fontFamily:FONT}}>Işınımsal etkenler · Sera gazları · Tektonik hareketler</div></div></div><div style={{height:"2px",background:`linear-gradient(90deg,${C5},transparent)`,opacity:0.35,borderRadius:"2px"}}/></div>
                  <div style={{padding:"13px 17px",background:`${C5}08`,border:`1.5px solid ${C5}18`,borderRadius:"11px"}}><p style={{fontSize:"14px",color:"#94a3b8",lineHeight:"1.9",margin:0,fontFamily:FONT}}>İklim sistemi bileşenlerinde meydana gelen değişimler, <strong style={{color:C5}}>iklim özelliklerini doğrudan etkiler</strong>. Bu değişikliklerin nedenleri <strong style={{color:"#e2e8f0"}}>doğal faktörler</strong> ve <strong style={{color:"#7c3aed"}}>insan faaliyetleri</strong> olmak üzere ikiye ayrılır. Geçmişte yaşanan buzul çağları ve sıcak çağlar doğal iklim değişikliklerine örnektir.</p></div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px"}}>
                    {DEGISIKLIK_FAKTORLERI.filter(f=>f.tip==="dogal").map(f=>(<button key={f.id} onClick={()=>{sndClick();setActiveF(f.id);}} style={{padding:"12px 10px",background:activeFaktor===f.id?`${f.color}20`:`${f.color}08`,border:`1.5px solid ${activeFaktor===f.id?f.color:`${f.color}25`}`,borderRadius:"10px",cursor:"pointer",textAlign:"center",fontFamily:FONT,transition:"all 0.2s"}}><div style={{fontSize:"24px",marginBottom:"5px"}}>{f.icon}</div><div style={{fontSize:"11px",fontWeight:"800",color:activeFaktor===f.id?f.color:"#475569",lineHeight:"1.4"}}>{f.ad}</div></button>))}
                  </div>
                  {(() => { const f=DEGISIKLIK_FAKTORLERI.find(x=>x.id===activeFaktor&&x.tip==="dogal"); if(!f)return null; return(<div style={{padding:"16px 18px",background:`${f.color}0d`,border:`1.5px solid ${f.color}28`,borderRadius:"12px",animation:"fadeUp 0.2s ease"}}><div style={{fontSize:"16px",fontWeight:"800",color:f.color,marginBottom:"10px",fontFamily:FONT}}>{f.icon} {f.ad}</div><p style={{fontSize:"13px",color:"#94a3b8",lineHeight:"1.9",margin:0,fontFamily:FONT}}>{f.aciklama}</p></div>); })()}
                  <div style={{padding:"12px 16px",background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.18)",borderRadius:"9px",fontSize:"13px",fontFamily:FONT}}>
                    <div style={{color:C6,fontWeight:"800",marginBottom:"6px",fontSize:"11px",letterSpacing:"1.5px"}}>BİLİM İNSANLARININ KULLANDIĞI KANITLAR</div>
                    <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
                      {["Bitki ve hayvan fosilleri","Tortul özellikleri","Okyanus tabanı çökelleri","Relikt (kalıntı) bitkiler","Ağaç yaş halkaları","Taraçalar","Buzul aşındırma şekilleri","Buzul hava kabarcıkları"].map(k=>(<div key={k} style={{padding:"5px 9px",background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:"6px",fontSize:"11px",fontWeight:"600",color:C6,fontFamily:FONT}}>{k}</div>))}
                    </div>
                  </div>
                </div>
              )}

              {/* İNSAN FAKTÖRLERİ */}
              {sec==="insanfaktor" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"13px"}}>
                  <div><div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"7px"}}><span style={{fontSize:"28px"}}>🏭</span><div><div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>İklim Değişikliği — İnsan Faaliyetleri</div><div style={{fontSize:"13px",color:"#7c3aed",fontWeight:"600",fontFamily:FONT}}>Antroposen Çağı · Sera gazı birikimi · Küresel ısınma</div></div></div><div style={{height:"2px",background:"linear-gradient(90deg,#7c3aed,transparent)",opacity:0.35,borderRadius:"2px"}}/></div>
                  <div style={{padding:"13px 17px",background:"rgba(124,58,237,0.08)",border:"1.5px solid rgba(124,58,237,0.2)",borderRadius:"11px"}}><p style={{fontSize:"14px",color:"#94a3b8",lineHeight:"1.9",margin:0,fontFamily:FONT}}>İnsan, Sanayi Devrimi'nden bu yana fosil yakıt kullanımıyla <strong style={{color:"#7c3aed"}}>atmosferdeki sera gazı birikimini artırmıştır</strong>. Bu, doğal sera etkisini kuvvetlendirerek küresel sıcaklığın olağandan daha hızlı artmasına neden olmaktadır. Bu dönem <strong style={{color:"#e2e8f0"}}>Antroposen (İnsan Çağı)</strong> olarak adlandırılır.</p></div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px"}}>
                    {DEGISIKLIK_FAKTORLERI.filter(f=>f.tip==="insan").map(f=>(<button key={f.id} onClick={()=>{sndClick();setActiveF(f.id);}} style={{padding:"12px 10px",background:activeFaktor===f.id?`${f.color}20`:`${f.color}08`,border:`1.5px solid ${activeFaktor===f.id?f.color:`${f.color}25`}`,borderRadius:"10px",cursor:"pointer",textAlign:"center",fontFamily:FONT,transition:"all 0.2s"}}><div style={{fontSize:"24px",marginBottom:"5px"}}>{f.icon}</div><div style={{fontSize:"11px",fontWeight:"800",color:activeFaktor===f.id?f.color:"#475569",lineHeight:"1.4"}}>{f.ad}</div></button>))}
                  </div>
                  {(() => { const f=DEGISIKLIK_FAKTORLERI.find(x=>x.id===activeFaktor&&x.tip==="insan"); if(!f)return null; return(<div style={{padding:"16px 18px",background:`${f.color}0d`,border:`1.5px solid ${f.color}28`,borderRadius:"12px",animation:"fadeUp 0.2s ease"}}><div style={{fontSize:"16px",fontWeight:"800",color:f.color,marginBottom:"10px",fontFamily:FONT}}>{f.icon} {f.ad}</div><p style={{fontSize:"13px",color:"#94a3b8",lineHeight:"1.9",margin:0,fontFamily:FONT}}>{f.aciklama}</p></div>); })()}
                  <div style={{padding:"13px 16px",background:"rgba(124,58,237,0.06)",border:"1px solid rgba(124,58,237,0.15)",borderRadius:"9px"}}>
                    <div style={{fontSize:"11px",color:"#7c3aed",letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT}}>2019 SERA GAZI EMİSYONLARI DAĞILIMI</div>
                    <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                      {( [["Enerji Tedarik Sektörü",33,"#dc2626"],["Sanayi",24,"#7c3aed"],["Tarım-Ormancılık",22,"#166534"],["Ulaşım",15,"#0369a1"],["Konutlar",6,"#f59e0b"]] as [string, number, string][] ).map(([label,pct,color])=>(<div key={label} style={{display:"flex",gap:"8px",alignItems:"center"}}><div style={{width:"150px",fontSize:"12px",color:"#94a3b8",fontFamily:FONT,flexShrink:0}}>{label}</div><div style={{flex:1,background:`${color}18`,borderRadius:"3px",height:"12px",overflow:"hidden"}}><div style={{height:"100%",width:`${pct*2.5}%`,background:color,borderRadius:"3px"}}/></div><div style={{width:"35px",fontSize:"12px",fontWeight:"800",color:color,fontFamily:MONO,textAlign:"right"}}>%{pct}</div></div>))}
                    </div>
                  </div>
                </div>
              )}

              {/* ETKİLERİ */}
              {sec==="etkiler" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"13px"}}>
                  <div><div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"7px"}}><span style={{fontSize:"28px"}}>📉</span><div><div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Küresel İklim Değişikliğinin Etkileri</div><div style={{fontSize:"13px",color:"#dc2626",fontWeight:"600",fontFamily:FONT}}>Okyanuslar · Kriyosfer · Ekosistemler · Toplumsal etkiler</div></div></div><div style={{height:"2px",background:"linear-gradient(90deg,#dc2626,transparent)",opacity:0.35,borderRadius:"2px"}}/></div>
                  <div style={{padding:"13px 17px",background:"rgba(220,38,38,0.07)",border:"1.5px solid rgba(220,38,38,0.18)",borderRadius:"11px"}}><p style={{fontSize:"14px",color:"#94a3b8",lineHeight:"1.9",margin:0,fontFamily:FONT}}>XX. yüzyılda atmosferde sera gazlarının artmasıyla <strong style={{color:"#dc2626"}}>dünya genelinde sıcaklık 0,74°C yükselmiştir</strong>. Bu durum iklim sistemi bileşenlerinde önemli değişimlere ve buzul çağı ile sıcak çağ döngüsünün dışında bir ısınmaya neden olmaktadır.</p></div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"7px"}}>
                    {ETKILER.map(e=>(<button key={e.id} onClick={()=>{sndClick();setActiveE(e.id);}} style={{padding:"10px 8px",background:activeEtki===e.id?`${e.color}20`:`${e.color}08`,border:`1.5px solid ${activeEtki===e.id?e.color:`${e.color}25`}`,borderRadius:"9px",cursor:"pointer",textAlign:"center",fontFamily:FONT,transition:"all 0.2s"}}><div style={{fontSize:"22px",marginBottom:"5px"}}>{e.icon}</div><div style={{fontSize:"11px",fontWeight:"800",color:activeEtki===e.id?e.color:"#475569",lineHeight:"1.3"}}>{e.ad}</div></button>))}
                  </div>
                  {(() => { const e=ETKILER.find(x=>x.id===activeEtki); if(!e)return null; return(<div style={{padding:"16px 18px",background:`${e.color}0d`,border:`1.5px solid ${e.color}28`,borderRadius:"12px",animation:"fadeUp 0.2s ease"}}><div style={{display:"flex",gap:"10px",alignItems:"center",marginBottom:"10px"}}><span style={{fontSize:"24px"}}>{e.icon}</span><div style={{fontSize:"16px",fontWeight:"800",color:e.color,fontFamily:FONT}}>{e.ad}</div></div><div style={{display:"flex",flexDirection:"column",gap:"5px"}}>{e.detay.map(d=>(<div key={d} style={{padding:"7px 10px",background:"rgba(0,0,0,0.2)",borderRadius:"6px",borderLeft:`2px solid ${e.color}60`,fontSize:"12px",color:"#94a3b8",lineHeight:"1.6",fontFamily:FONT}}>{d}</div>))}</div></div>); })()}
                </div>
              )}

              {/* ÖNGÖRÜLER */}
              {sec==="ongorular" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"13px"}}>
                  <div><div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"7px"}}><span style={{fontSize:"28px"}}>🔭</span><div><div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Küresel İklim Değişikliğine Yönelik Öngörüler</div><div style={{fontSize:"13px",color:C6,fontWeight:"600",fontFamily:FONT}}>IPCC raporları · 2080-2100 senaryoları</div></div></div><div style={{height:"2px",background:`linear-gradient(90deg,${C6},transparent)`,opacity:0.35,borderRadius:"2px"}}/></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"9px"}}>
                    {[
                      {icon:"🌡️",color:"#dc2626",title:"Küresel Sıcaklık",desc:"Sera gazı miktarları 2000 düzeyinde tutulsa bile her 10 yılda 0,1°C artış kaçınılmazdır. Türkiye ve çevresi için 2071-2080 sıcaklık ortalamasının 1961-1990 ortalamasından ~4-5°C yüksek olacağı tahmin edilmektedir."},
                      {icon:"🌊",color:"#0369a1",title:"Deniz Seviyesi",desc:"2100 yılına kadar 28 cm ile 2 m yükselme öngörülmektedir. 2150 yılına kadar ise 5 m yükselebilir. Maldivler gibi alçak adaların büyük bölümünün deniz altında kalacağı öngörülmektedir."},
                      {icon:"☀️",color:"#b45309",title:"Kuraklık",desc:"IPCC raporuna göre 2080'de Afrika'da kurak ve yarı kurak bölgeler %5-%8 genişleyecek; nem isteği yüksek bitkiler ortadan kalkabilir. Türkiye'nin Ege ve Akdeniz kıyılarında yağış azalacak."},
                      {icon:"🌧️",color:C,title:"Yağış Değişimi",desc:"Bazı bölgelerde yağış artarken bazılarında azalacak. 2080'e kadar Türkiye'nin Karadeniz kıyılarında yağış artışı, Ege ve Akdeniz kıyılarında ise azalma beklenmektedir."},
                      {icon:"🦟",color:"#7c3aed",title:"Sağlık Riskleri",desc:"Hastalık taşıyan böcek, sinek ve sivrisineklerin daha geniş alanlara dağılacağı öngörülmektedir. Sıtma, dang humması gibi hastalıkların yayılma alanı genişleyecektir."},
                      {icon:"👥",color:"#f97316",title:"İklim Göçü",desc:"2005-2050 yılları arasında Hindistan, Pakistan, Bangladeş, Uganda ve Etiyopya gibi ülkelerden yaklaşık 100 milyon iklim mültecisinin ekonomik açıdan gelişmiş ülkelere göç edeceği tahmin edilmektedir."},
                    ].map(item=>(<div key={item.title} style={{padding:"12px 14px",background:`${item.color}08`,border:`1px solid ${item.color}20`,borderRadius:"10px",display:"flex",gap:"9px",alignItems:"flex-start"}}><span style={{fontSize:"20px",flexShrink:0}}>{item.icon}</span><div><div style={{fontSize:"12px",fontWeight:"800",color:item.color,fontFamily:FONT,marginBottom:"4px"}}>{item.title}</div><p style={{fontSize:"12px",color:"#475569",lineHeight:"1.7",margin:0,fontFamily:FONT}}>{item.desc}</p></div></div>))}
                  </div>
                  <div style={{padding:"12px 16px",background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:"9px",fontSize:"13px",fontFamily:FONT}}>
                    <div style={{color:C6,fontWeight:"800",marginBottom:"6px",fontSize:"11px",letterSpacing:"1.5px"}}>ILIMAN KUŞAKTAKİ BİTKİ DEĞİŞİMİ ÖNGÖRÜSÜ (+1°C)</div>
                    <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
                      {["Bitki toplulukları 100-170 km kuzeye taşınacak","Alpin kuşaktaki (kardelen, menekşe vb.) türler daha yüksege göç edemeyerek yok olabilir","Orman yangınları sıklığı ve dağılımı artacak","Kentler ve asit yağmurları göç yollarını zorlaştıracak"].map(s=>(<div key={s} style={{fontSize:"12px",color:"#64748b",fontFamily:FONT,paddingLeft:"10px",borderLeft:`2px solid ${C6}40`}}>{s}</div>))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
        {tab==="act" && (<div style={{flex:1,overflowY:"auto",padding:"20px 24px",background:`radial-gradient(ellipse at 5% 5%,${C}05 0%,${BG} 60%)`}}><EslestirmeAktisite/></div>)}
        {tab==="test" && (<div style={{flex:1,display:"flex",overflow:"hidden"}}><TestTab/></div>)}
      </div>
    </div>
  );
}