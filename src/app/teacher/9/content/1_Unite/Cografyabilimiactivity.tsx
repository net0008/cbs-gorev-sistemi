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
const BG   = "#070e18";
const C_FIZ = "#16a34a";
const C_BES = "#7c3aed";
const C_ACC = "#f97316";
type Tab = "learn"|"act"|"test";
type LearnSec = "konu"|"neden"|"gelisim";

interface Dal { id:string; ad:string; kat:"fiziki"|"beseri"; icon:string; color:string; tanim:string; etk:string; }
const DALLAR: Dal[] = [
  {id:"jeom",ad:"Jeomorfoloji",kat:"fiziki",icon:"⛰️",color:"#78350f",tanim:"Litosfer unsurları, yer şekilleri ve oluşum süreçleri ile dağılışını inceler.",etk:"Jeoloji, litoloji, petrografi, jeofizik"},
  {id:"klim",ad:"Klimatoloji",kat:"fiziki",icon:"🌤️",color:"#075985",tanim:"Atmosfer, hava olayları, iklim sistemleri, iklim tipleri ve dağılışını inceler.",etk:"Meteoroloji"},
  {id:"hidro",ad:"Hidrografya",kat:"fiziki",icon:"💧",color:"#0c4a6e",tanim:"Denizler, göller, akarsular gibi su ortamlarını ve bu ortamlardaki olayları inceler.",etk:"Hidroloji, oseonografya, limnoloji"},
  {id:"biyo",ad:"Biyocoğrafya",kat:"fiziki",icon:"🌿",color:"#14532d",tanim:"Bitki ve hayvan topluluklarının genel özellikleri, etkileşimleri ve dağılışlarını inceler.",etk:"Biyoloji, botanik, zooloji"},
  {id:"toprak",ad:"Toprak Coğrafyası",kat:"fiziki",icon:"🟫",color:"#92400e",tanim:"Yeryüzündeki toprakların oluşum süreçlerini, özelliklerini ve dağılışını inceler.",etk:"Pedoloji, mineraloji"},
  {id:"nufus",ad:"Nüfus Coğrafyası",kat:"beseri",icon:"👥",color:"#5b21b6",tanim:"Nüfusun özellikleri, dağılışı, değişimi, hareketleri ve nüfus politikalarını inceler.",etk:"Demografi, istatistik"},
  {id:"yerles",ad:"Yerleşme Coğrafyası",kat:"beseri",icon:"🏘️",color:"#6d28d9",tanim:"Yerleşmelerin gelişimi, tipleri ve dağılışı ile yerleşmeyi etkileyen faktörleri inceler.",etk:"Arkeoloji, tarih"},
  {id:"siyasi",ad:"Siyasi Coğrafya",kat:"beseri",icon:"🗺️",color:"#4c1d95",tanim:"Siyasi faaliyet ve olayların mekâna bağlı değişiklik ve farklılıklarını inceler.",etk:"Uluslararası ilişkiler, tarih, siyaset"},
  {id:"sosyal",ad:"Sosyal Coğrafya",kat:"beseri",icon:"🤝",color:"#3730a3",tanim:"Sosyal ilişkileri, kimlikleri ve eşitsizlikleri mekânsal perspektiften inceler.",etk:"Antropoloji, sosyoloji, demografi"},
  {id:"kultur",ad:"Kültürel Coğrafya",kat:"beseri",icon:"🎭",color:"#6d28d9",tanim:"Toplumların dil, din, giyim, müzik, mimari gibi kültürel özelliklerini coğrafyayla inceler.",etk:"Sosyoloji, filoloji, ilahiyat, antropoloji"},
  {id:"ekon",ad:"Ekonomik Coğrafya",kat:"beseri",icon:"💼",color:"#86198f",tanim:"Sanayi, ticaret, tarım, hayvancılık, turizm gibi ekonomik faaliyetleri inceler.",etk:"İktisat"},
];

interface Bilim { id:string; isim:string; yil:string; cag:"eski"|"orta"|"yeni"|"yakin"; icon:string; katki:string; }
const BILIMLER: Bilim[] = [
  {id:"erat",isim:"Eratosthenes",yil:"MÖ 276-194",cag:"eski",icon:"🌍",katki:"Cografya terimini ilk kullandi. Dunya cevresini olctu. Ilk sistematik cografya eserini yazdi."},
  {id:"strab",isim:"Strabon",yil:"MÖ 64-MS 24",cag:"eski",icon:"📜",katki:"17 ciltlik Geographika ile doneminin bilinen dunyasini tasvir etti. Insan-cevre iliskisini isledi."},
  {id:"batl",isim:"Batlamyus",yil:"100-170",cag:"eski",icon:"🗺️",katki:"Koordinat sistemi gelistirdi. Geographia ile harita ciziminde yeni standartlar olusturdu."},
  {id:"biru",isim:"Biruni",yil:"973-1048",cag:"orta",icon:"⚙️",katki:"Dunya'nin yari capini buyuk dogrulukla hesapladi. Matematik ve astronomiyi cografyayla butunlestirdi."},
  {id:"idris",isim:"Muhammed Idrisi",yil:"1100-1166",cag:"orta",icon:"🧭",katki:"Unlu dunya haritasini cizdi. Kitab-i Rucer adli cografi eseri yazdi."},
  {id:"batt",isim:"Ibni Battuta",yil:"1304-1369",cag:"orta",icon:"🚢",katki:"44 yilda 117.000 km yol katetti. Rihle adli eseri cografi bilgi hazinesidir."},
  {id:"piri",isim:"Piri Reis",yil:"1470-1554",cag:"yeni",icon:"⚓",katki:"1513 tarihli dunya haritasini cizdi; Amerika'yi ilk gosteren haritalardan biri. Kitab-i Bahriye'yi yazdi."},
  {id:"orte",isim:"A. Ortelius",yil:"1527-1598",cag:"yeni",icon:"📚",katki:"Ilk modern atlasi yayimladi: Theatrum Orbis Terrarum (1570)."},
  {id:"katip",isim:"Katip Celebi",yil:"1609-1657",cag:"yeni",icon:"🖊️",katki:"Cihannuma adli eseriyle Osmanli cografi dusuncesinin zirvesini olusturdu."},
  {id:"humbo",isim:"A. von Humboldt",yil:"1769-1859",cag:"yakin",icon:"🔭",katki:"Modern fiziki cografyanin temellerini atti. Bitki cografyasinin kurucusu sayilir."},
  {id:"ritte",isim:"Carl Ritter",yil:"1779-1859",cag:"yakin",icon:"🏫",katki:"Beseri cografyanin temellerini atti. Cografyayi universitede bagimsiz bilim dali yapti."},
  {id:"blach",isim:"P. V. Blache",yil:"1845-1918",cag:"yakin",icon:"📐",katki:"Possibilism teorisinin kurucusu. Insan-cevre iliskisinde insanin aktif rolunu vurguladi."},
  {id:"sauer",isim:"C. O. Sauer",yil:"1889-1975",cag:"yakin",icon:"🌾",katki:"Kulturel peyzaj kavramini gelistirdi. Insanin kulturel etkinliklerinin dogali nasil donusturdugunu inceledi."},
];

interface MK { id:string; text:string; cat:"dogal"|"beseri"; }
const MATCH_ITEMS: MK[] = [
  {id:"mk1",text:"Yer şekillerinin oluşum süreci",cat:"dogal"},
  {id:"mk2",text:"Nüfus göç hareketleri",cat:"beseri"},
  {id:"mk3",text:"İklim tiplerinin coğrafi dağılışı",cat:"dogal"},
  {id:"mk4",text:"Şehirlerin büyüme ve yayılması",cat:"beseri"},
  {id:"mk5",text:"Okyanus ve akarsu akıntıları",cat:"dogal"},
  {id:"mk6",text:"Sanayi bölgelerinin konumu",cat:"beseri"},
  {id:"mk7",text:"Orman topluluklarının yayılışı",cat:"dogal"},
  {id:"mk8",text:"Devletlerin sınır anlaşmazlıkları",cat:"beseri"},
  {id:"mk9",text:"Toprak erozyonu ve bozulması",cat:"dogal"},
  {id:"mk10",text:"Dil ve din dağılış haritaları",cat:"beseri"},
];

const TEST_ITEMS = [
  {q:"Doğal ortam ile beşerî ortamın birlikteliğinden oluşan en geniş yaşam alanına ne ad verilir?",opts:["Biyosfer","Litosfer","Coğrafi ortam","Beşerî ortam"],correct:2,exp:"Doğal ortam ile beşerî ortamın birlikteliğinden oluşan en geniş yaşam alanına coğrafi ortam denir. Hem doğal hem de beşerî unsurları kapsar."},
  {q:"Donmuş topraklar, buzullar ve sürekli karlı alanlardan oluşan küreye ne ad verilir?",opts:["Hidrosfer","Kriyosfer","Litosfer","Biyosfer"],correct:1,exp:"Kriyosfer (buz küre); donmuş topraklar, buzullar ve sürekli karla kaplı alanlardan oluşur. Hidrosferde sıvı su bulunurken kriyosferde katı hâldeki su bulunur."},
  {q:"Coğrafya terimini ilk kez kullanan ve Dünya çevresini hesaplayan bilim insanı kimdir?",opts:["Strabon","Biruni","Batlamyus","Eratosthenes"],correct:3,exp:"Coğrafya kavramını ilk kez Eratosthenes kullanmıştır. Eski Yunanca geo ve graphein kelimelerinden türetilmiştir. Dünya çevresini de o hesaplamıştır."},
  {q:"Biyocoğrafya hangi bilimlerle etkileşim içindedir?",opts:["Jeoloji, litoloji","Hidroloji ve potamoloji","Biyoloji, botanik, zooloji","Demografi ve istatistik"],correct:2,exp:"Biyocoğrafya bitki ve hayvan topluluklarının dağılışını inceler. Bu nedenle biyoloji, botanik ve zooloji bilimleriyle etkileşim içindedir."},
  {q:"Orta Çağ'da coğrafyanın gelişmesinde önemli katkı sunan bilginlerin çoğunluğu hangi çevreye aittir?",opts:["Fransız bilim insanları","Müslüman bilginler","İngiliz denizciler","Alman filozoflar"],correct:1,exp:"Orta Çağ'da Müslüman bilginler büyük rol oynamıştır. Biruni, Muhammed İdrisi, İbni Battuta bunların başında gelir."},
  {q:"Aşağıdakilerden hangisi fiziki coğrafyanın alt dallarından biri DEĞİLDİR?",opts:["Klimatoloji","Hidrografya","Jeomorfoloji","Nüfus Coğrafyası"],correct:3,exp:"Nüfus Coğrafyası, beşerî coğrafyanın bir alt dalıdır. Fiziki coğrafyanın alt dalları: Jeomorfoloji, Klimatoloji, Hidrografya, Biyocoğrafya, Toprak Coğrafyası."},
  {q:"Coğrafi bakış açısına sahip bir kişi öncelikle hangi soruları sorar?",opts:["Bu olay ne zaman oldu?","Ne, nerede, neden orada, ortamın özellikleri neler?","Bu olayı kim yaptı ve nasıl yapıldı?","Bu olaydan kim etkilendi?"],correct:1,exp:"Coğrafya; Ne? Nerede? Ne zaman? Neden orada? Neden önemli? Ortamın özellikleri neler? Doğal ve beşerî ortamlarla nasıl bir ilişkisi var? sorularına cevap arar."},
  {q:"Koordinat sistemi geliştiren ve Geographia adlı eserle harita çiziminde standartlar oluşturan kimdir?",opts:["Strabon","Biruni","Batlamyus","Piri Reis"],correct:2,exp:"Batlamyus (100-170) koordinat sistemi geliştirdi ve Geographia adlı eseriyle harita çiziminde yeni standartlar oluşturdu."},
  {q:"Yeni Çağ'da coğrafyanın gelişmesine öncülük eden temel etkenler nelerdir?",opts:["İpek Yolu ve göç","Rönesans, reform ve sömürgecilik hareketleri","Sanayi Devrimi ve Fransız İhtilali","Yazının icadı ve şehirlerin kurulması"],correct:1,exp:"Yeni Çağ'da Rönesans ve reform hareketleri ile sömürgecilik coğrafyanın gelişmesinde rol oynadı. Bu çağda Kolomb, Magellan ve Piri Reis öncü olmuştur."},
  {q:"Coğrafya biliminin beşerî ortamı inceleyen bölümü aşağıdakilerden hangisidir?",opts:["Fiziki coğrafya","Sistematik coğrafya","Beşerî coğrafya","Bölgesel coğrafya"],correct:2,exp:"Beşerî coğrafya; insan faaliyetlerinin mekândaki dağılımını, insanların mekânı nasıl kullandığını ve algıladığını inceler."},
];

// ─── Dal Kartı ──────────────────────────────────────────────────────────────
function DalKarti({ dal, active, onClick }: { dal:Dal; active:boolean; onClick:()=>void }) {
  return (
    <button onClick={onClick}
      style={{ padding:"12px 14px", background:active?`${dal.color}22`:"rgba(0,0,0,0.22)",
        border:`2px solid ${active?dal.color:`${dal.color}30`}`, borderRadius:"10px",
        cursor:"pointer", textAlign:"left", fontFamily:FONT, transition:"all 0.2s", width:"100%" }}>
      <div style={{ fontSize:"20px", marginBottom:"5px" }}>{dal.icon}</div>
      <div style={{ fontSize:"13px", fontWeight:"800", color:active?dal.color:"#334155" }}>{dal.ad}</div>
    </button>
  );
}

function DalDetay({ dal }: { dal:Dal }) {
  return (
    <div style={{ padding:"18px 20px", background:`${dal.color}0d`, border:`1.5px solid ${dal.color}30`, borderRadius:"12px", animation:"fadeUp 0.2s ease" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"12px" }}>
        <span style={{ fontSize:"26px" }}>{dal.icon}</span>
        <div>
          <div style={{ fontSize:"16px", fontWeight:"800", color:dal.color, fontFamily:FONT }}>{dal.ad}</div>
          <div style={{ fontSize:"11px", color:`${dal.color}80`, fontFamily:FONT }}>
            {dal.kat==="fiziki" ? "Fiziki Coğrafya" : "Beşerî Coğrafya"}
          </div>
        </div>
      </div>
      <p style={{ fontSize:"13px", color:"#94a3b8", lineHeight:"1.85", margin:"0 0 10px", fontFamily:FONT }}>{dal.tanim}</p>
      <div style={{ padding:"9px 12px", background:"rgba(0,0,0,0.22)", borderRadius:"8px", borderLeft:`3px solid ${dal.color}` }}>
        <div style={{ fontSize:"10px", color:dal.color, fontWeight:"800", letterSpacing:"1.5px", marginBottom:"4px", fontFamily:FONT }}>ETKİLEŞİM İÇİNDE OLDUĞU BİLİMLER</div>
        <div style={{ fontSize:"12px", color:"#64748b", fontFamily:FONT }}>{dal.etk}</div>
      </div>
    </div>
  );
}

// ─── Tarih şeridi bilim insanı ──────────────────────────────────────────────
function BilimKarti({ b, active, onClick }: { b:Bilim; active:boolean; onClick:()=>void }) {
  const CAG_COLORS: Record<string,string> = { eski:"#0ea5e9", orta:"#7c3aed", yeni:"#16a34a", yakin:"#f97316" };
  const c = CAG_COLORS[b.cag];
  return (
    <button onClick={onClick}
      style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"4px",
        padding:"10px 8px", background:active?`${c}1a`:"rgba(0,0,0,0.18)",
        border:`1.5px solid ${active?c:`${c}28`}`, borderRadius:"10px",
        cursor:"pointer", textAlign:"center", fontFamily:FONT, transition:"all 0.2s", flex:"1", minWidth:"80px" }}>
      <span style={{ fontSize:"20px" }}>{b.icon}</span>
      <div style={{ fontSize:"11px", fontWeight:"800", color:active?c:"#334155", lineHeight:"1.3" }}>{b.isim}</div>
      <div style={{ fontSize:"10px", color:`${c}90`, fontFamily:MONO }}>{b.yil}</div>
    </button>
  );
}

// ─── Eşleştirme Aktivitesi ──────────────────────────────────────────────────
function EslestirmeAktisite() {
  const [shuffled] = useState<MK[]>(()=>{
    const a=[...MATCH_ITEMS];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  });
  const [placed, setPlaced] = useState<Record<string,string>>({});
  const [wrong,  setWrong]  = useState<Record<string,boolean>>({});
  const [dragId, setDragId] = useState<string|null>(null);
  const [hovBucket, setHov] = useState<string|null>(null);
  const [score,  setScore]  = useState(0);
  const [done,   setDone]   = useState(false);

  const BUCKETS = [
    { id:"dogal",  label:"Fiziki Coğrafya",  sub:"Doğal süreçler", color:C_FIZ, icon:"🌿" },
    { id:"beseri", label:"Beşerî Coğrafya",  sub:"İnsan faaliyetleri", color:C_BES, icon:"🏙️" },
  ];

  const doDrop = (bucketId:string) => {
    if(!dragId) return;
    const item = shuffled.find(m=>m.id===dragId);
    if(!item||placed[dragId]) return;
    const ok = item.cat===bucketId;
    sndDrop(); if(ok){sndOK();setScore(s=>s+1);}else sndFail();
    const np={...placed,[dragId]:bucketId};
    const nw={...wrong,[dragId]:!ok};
    setPlaced(np); setWrong(nw); setDragId(null); setHov(null);
    if(Object.keys(np).length===shuffled.length) setTimeout(()=>setDone(true),400);
  };

  const retry = ()=>{ setPlaced({}); setWrong({}); setScore(0); setDone(false); setDragId(null); };

  if(done) return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px",padding:"48px 24px",textAlign:"center" }}>
      <div style={{ fontSize:"52px" }}>🌍</div>
      <div style={{ fontSize:"26px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT }}>Eşleştirme Tamamlandı!</div>
      <div style={{ fontSize:"50px",fontWeight:"800",color:C_FIZ,fontFamily:MONO }}>{score}/{shuffled.length}</div>
      <div style={{ fontSize:"14px",color:"#475569",fontFamily:FONT }}>doğru eşleştirme</div>
      <button onClick={retry} style={{ padding:"12px 28px",background:`linear-gradient(90deg,#15803d,${C_FIZ})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT }}>🔄 Tekrar Oyna</button>
    </div>
  );

  const pending = shuffled.filter(m=>!placed[m.id]);
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:"16px" }}>
      <div>
        <div style={{ fontSize:"10px",color:C_FIZ,letterSpacing:"3px",fontWeight:"800",fontFamily:MONO,marginBottom:"4px" }}>ETKİNLİK</div>
        <div style={{ fontSize:"17px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT }}>🌿 Doğal mı, Beşerî mi?</div>
        <div style={{ fontSize:"12px",color:"#475569",marginTop:"3px",fontFamily:FONT }}>Her olayı doğru coğrafya türüne sürükle bırak</div>
      </div>
      {/* Kartlar */}
      <div style={{ padding:"12px 14px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"10px",minHeight:"52px" }}>
        <div style={{ fontSize:"10px",color:"#475569",letterSpacing:"2px",fontWeight:"800",marginBottom:"8px",fontFamily:FONT }}>SINIFLANDIRILACAK OLAYLAR</div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:"7px" }}>
          {pending.map(item=>(
            <div key={item.id} draggable
              onDragStart={e=>{setDragId(item.id);e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",item.id);}}
              onDragEnd={()=>{setDragId(null);setHov(null);}}
              style={{ padding:"8px 12px",background:dragId===item.id?`${C_FIZ}20`:"rgba(0,0,0,0.4)",
                border:`1.5px solid ${dragId===item.id?C_FIZ:"rgba(255,255,255,0.1)"}`,
                borderRadius:"8px",cursor:"grab",fontSize:"12px",fontWeight:"600",color:"#cbd5e1",
                fontFamily:FONT,userSelect:"none",WebkitUserSelect:"none",opacity:dragId===item.id?0.5:1 }}>
              {item.text}
            </div>
          ))}
          {shuffled.filter(m=>placed[m.id]).map(item=>(
            <div key={item.id}
              style={{ padding:"8px 12px",
                background:wrong[item.id]?"rgba(239,68,68,0.08)":"rgba(52,211,153,0.08)",
                border:`1.5px solid ${wrong[item.id]?"#ef444430":"#34d39930"}`,
                borderRadius:"8px",fontSize:"12px",fontWeight:"600",
                color:wrong[item.id]?"#ef4444":"#34d399",fontFamily:FONT,opacity:0.65 }}>
              {wrong[item.id]?"✗ ":"✓ "}{item.text}
            </div>
          ))}
        </div>
      </div>
      {/* Kutular */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",flex:1 }}>
        {BUCKETS.map(bucket=>(
          <div key={bucket.id}
            onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect="move";setHov(bucket.id);}}
            onDragLeave={()=>setHov(null)}
            onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("text/plain");if(id){setDragId(id);setTimeout(()=>doDrop(bucket.id),0);}else doDrop(bucket.id);}}
            style={{ minHeight:"160px",padding:"14px",
              background:hovBucket===bucket.id?`${bucket.color}18`:`${bucket.color}08`,
              border:`2px ${hovBucket===bucket.id?"solid":"dashed"} ${bucket.color}${hovBucket===bucket.id?"80":"35"}`,
              borderRadius:"12px",transition:"all 0.2s" }}>
            <div style={{ fontSize:"22px",marginBottom:"4px" }}>{bucket.icon}</div>
            <div style={{ fontSize:"14px",fontWeight:"800",color:bucket.color,marginBottom:"2px",fontFamily:FONT }}>{bucket.label}</div>
            <div style={{ fontSize:"11px",color:`${bucket.color}80`,marginBottom:"10px",fontFamily:FONT }}>{bucket.sub}</div>
            <div style={{ display:"flex",flexDirection:"column",gap:"5px" }}>
              {shuffled.filter(m=>placed[m.id]===bucket.id).map(it=>(
                <div key={it.id} style={{ padding:"6px 9px",
                  background:wrong[it.id]?"rgba(239,68,68,0.12)":"rgba(52,211,153,0.12)",
                  border:`1px solid ${wrong[it.id]?"#ef444440":"#34d39940"}`,
                  borderRadius:"6px",fontSize:"11px",
                  color:wrong[it.id]?"#ef4444":"#34d399",fontWeight:"600",fontFamily:FONT }}>
                  {wrong[it.id]?"✗ ":"✓ "}{it.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:"9px 14px",background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"8px",display:"flex",justifyContent:"space-between" }}>
        <span style={{ fontSize:"12px",color:"#475569",fontFamily:FONT }}>Kalan: {pending.length} kart</span>
        <span style={{ fontSize:"14px",fontWeight:"800",color:C_FIZ,fontFamily:MONO }}>{score} doğru</span>
      </div>
    </div>
  );
}

// ─── Test Sekmesi ────────────────────────────────────────────────────────────
function TestTab() {
  const [qIdx,setQIdx]       = useState(0);
  const [sel,setSel]         = useState<number|null>(null);
  const [score,setScore]     = useState(0);
  const [answers,setAnswers] = useState<boolean[]>([]);
  const [done,setDone]       = useState(false);
  const q = TEST_ITEMS[qIdx];

  const handleAnswer = (i:number) => {
    if(sel!==null) return;
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
        <div style={{ fontSize:"52px" }}>🌍</div>
        <div style={{ fontSize:"26px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT }}>Test Tamamlandı!</div>
        <div style={{ fontSize:"52px",fontWeight:"800",color:pct>=80?"#34d399":pct>=50?C_ACC:"#ef4444",fontFamily:MONO }}>{score} PUAN</div>
        <div style={{ fontSize:"14px",color:"#475569",fontFamily:FONT }}>{answers.filter(Boolean).length}/{TEST_ITEMS.length} dogru · %{pct}</div>
        <div style={{ fontSize:"14px",color:"#64748b",maxWidth:"420px",lineHeight:"1.8",fontFamily:FONT }}>
          {pct>=80?"Mukemmel! Cografya bilimini cok iyi ogrendin.":pct>=50?"Iyi! Ogren sekmesini tekrar inceleyebilirsin.":"Tekrar dene!"}
        </div>
        <button onClick={retry} style={{ padding:"13px 30px",background:`linear-gradient(90deg,#15803d,${C_FIZ})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT }}>Tekrar Dene</button>
      </div>
    );
  }

  return(
    <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
      <div style={{ width:"220px",flexShrink:0,borderRight:"1px solid rgba(255,255,255,0.05)",background:"rgba(3,6,15,0.7)",padding:"20px 14px",display:"flex",flexDirection:"column",gap:"6px",overflowY:"auto" }}>
        <div style={{ fontSize:"11px",letterSpacing:"2px",color:"#475569",fontWeight:"800",fontFamily:FONT,marginBottom:"4px" }}>SORULAR</div>
        {TEST_ITEMS.map((_,i)=>{
          const d=i<answers.length, cur=i===qIdx;
          return(
            <div key={i} style={{ display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",
              background:cur?`${C_FIZ}10`:"rgba(0,0,0,0.15)",
              border:`1.5px solid ${cur?C_FIZ:d?(answers[i]?"rgba(52,211,153,0.3)":"rgba(239,68,68,0.3)"):"rgba(255,255,255,0.04)"}`,
              borderRadius:"7px" }}>
              <div style={{ width:"20px",height:"20px",borderRadius:"50%",
                background:d?(answers[i]?"#34d399":"#ef4444"):cur?C_FIZ:"rgba(255,255,255,0.06)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"800",color:"#fff",flexShrink:0,fontFamily:MONO }}>
                {d?(answers[i]?"✓":"✗"):i+1}
              </div>
              <span style={{ fontSize:"12px",fontWeight:"700",color:cur?C_FIZ:d?(answers[i]?"#34d399":"#ef4444"):"#334155",fontFamily:FONT }}>Soru {i+1}</span>
            </div>
          );
        })}
        <div style={{ marginTop:"auto",padding:"12px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"9px",textAlign:"center" }}>
          <div style={{ fontSize:"11px",color:"#475569",fontWeight:"700",fontFamily:FONT,marginBottom:"4px" }}>PUAN</div>
          <div style={{ fontSize:"30px",fontWeight:"800",color:C_FIZ,fontFamily:MONO }}>{score}</div>
          <div style={{ fontSize:"11px",color:"#334155",fontFamily:FONT }}>/ {TEST_ITEMS.length*10}</div>
        </div>
      </div>
      <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"28px 32px",overflowY:"auto",gap:"16px" }}>
        <div style={{ width:"100%",maxWidth:"640px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:"8px" }}>
            <span style={{ fontSize:"12px",color:"#475569",fontWeight:"700",fontFamily:FONT }}>SORU {qIdx+1}/{TEST_ITEMS.length}</span>
            <span style={{ fontSize:"12px",color:C_FIZ,fontFamily:FONT }}>{Math.round((qIdx/TEST_ITEMS.length)*100)}%</span>
          </div>
          <div style={{ height:"4px",background:`${C_FIZ}18`,borderRadius:"2px",overflow:"hidden" }}>
            <div style={{ height:"100%",width:`${(qIdx/TEST_ITEMS.length)*100}%`,background:`linear-gradient(90deg,#15803d,${C_FIZ})`,borderRadius:"2px",transition:"width 0.4s" }}/>
          </div>
        </div>
        <div style={{ maxWidth:"640px",width:"100%",padding:"20px 24px",background:`${C_FIZ}08`,border:`1.5px solid ${C_FIZ}20`,borderRadius:"14px" }}>
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
                  <span style={{ width:"22px",height:"22px",borderRadius:"50%",background:show&&isCorr?"#34d399":show&&isSel?"#ef4444":`${C_FIZ}20`,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"800",color:show?"#fff":"#94a3b8",flexShrink:0,marginTop:"1px",fontFamily:MONO }}>
                    {show&&isCorr?"✓":show&&isSel&&!isCorr?"✗":String.fromCharCode(65+i)}
                  </span>
                  <span style={{ fontSize:"13px",color,fontWeight:"600",lineHeight:"1.6",fontFamily:FONT }}>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>
        {sel!==null&&(
          <div style={{ maxWidth:"640px",width:"100%",padding:"15px 18px",
            background:sel===q.correct?"rgba(52,211,153,0.07)":"rgba(239,68,68,0.07)",
            border:`1.5px solid ${sel===q.correct?"rgba(52,211,153,0.25)":"rgba(239,68,68,0.25)"}`,borderRadius:"12px" }}>
            <div style={{ fontSize:"14px",fontWeight:"800",color:sel===q.correct?"#34d399":"#ef4444",marginBottom:"8px",fontFamily:FONT }}>{sel===q.correct?"DOGRU!":"YANLIS!"}</div>
            <p style={{ fontSize:"13px",color:"#64748b",lineHeight:"1.85",margin:0,fontFamily:FONT }}>{q.exp}</p>
          </div>
        )}
        {sel!==null&&(
          <button onClick={next}
            style={{ padding:"12px 34px",background:`linear-gradient(90deg,#15803d,${C_FIZ})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)"}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none"}}>
            {qIdx>=TEST_ITEMS.length-1?"Sonuclari Gor":"Sonraki Soru"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────
export default function CografyaBilimiActivity({ onClose }: { onClose: () => void }) {
  const [tab,      setTab]      = useState<Tab>("learn");
  const [learnSec, setLearnSec] = useState<LearnSec>("konu");
  const [activeDal, setActiveDal] = useState<string>("jeom");
  const [activeBilim, setActiveBilim] = useState<string>("erat");

  const TABS = [
    { id:"learn" as Tab, icon:"📖", label:"ÖĞREN"    },
    { id:"act"   as Tab, icon:"🔗", label:"ETKİNLİK" },
    { id:"test"  as Tab, icon:"✏️", label:"TEST"      },
  ];
  const SECTIONS = [
    { id:"konu"    as LearnSec, icon:"🌍", label:"Konu & Bölümler",  color:C_FIZ  },
    { id:"neden"   as LearnSec, icon:"💡", label:"Niçin Öğrenelim", color:C_ACC  },
    { id:"gelisim" as LearnSec, icon:"⏳", label:"Gelişim Tarihi",   color:"#0ea5e9" },
  ];

  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,background:BG,display:"flex",flexDirection:"column",fontFamily:FONT,userSelect:"none",WebkitUserSelect:"none" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Üst bar */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",height:"64px",borderBottom:"1px solid rgba(22,163,74,0.18)",background:"rgba(3,6,15,0.94)",flexShrink:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:"24px" }}>
          <div>
            <div style={{ fontSize:"10px",letterSpacing:"4px",color:C_FIZ,opacity:0.6,fontFamily:MONO }}>COGRAFYANIN DOGASI — 1. ÜNİTE</div>
            <div style={{ fontSize:"19px",fontWeight:"800",color:"#e2e8f0",letterSpacing:"0.3px" }}>Coğrafya Bilimi</div>
          </div>
          <div style={{ display:"flex",gap:"3px",background:"rgba(0,0,0,0.4)",padding:"4px",borderRadius:"10px" }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>{sndClick();setTab(t.id);}}
                style={{ padding:"7px 18px",borderRadius:"7px",border:"none",cursor:"pointer",fontFamily:FONT,fontSize:"12px",fontWeight:"700",transition:"all 0.18s",
                  background:tab===t.id?C_FIZ:"transparent",color:tab===t.id?"#fff":"#334155" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose}
          style={{ padding:"8px 18px",background:"transparent",border:"1px solid rgba(255,80,80,0.3)",borderRadius:"8px",color:"#f87171",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:FONT }}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,80,80,0.1)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          KAPAT
        </button>
      </div>

      <div style={{ flex:1,overflow:"hidden",display:"flex",minHeight:0 }}>

        {/* ── ÖĞREN ── */}
        {tab==="learn" && (
          <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
            {/* Sol menü */}
            <div style={{ width:"240px",flexShrink:0,borderRight:"1px solid rgba(22,163,74,0.12)",background:"rgba(3,6,15,0.7)",overflowY:"auto",padding:"20px 14px" }}>
              <div style={{ fontSize:"11px",letterSpacing:"2px",color:"#475569",fontWeight:"800",fontFamily:FONT,marginBottom:"12px" }}>KONULAR</div>
              <div style={{ display:"flex",flexDirection:"column",gap:"8px" }}>
                {SECTIONS.map(s=>(
                  <button key={s.id} onClick={()=>{sndClick();setLearnSec(s.id);}}
                    style={{ padding:"12px 14px",background:learnSec===s.id?`${s.color}14`:"rgba(0,0,0,0.22)",border:`2px solid ${learnSec===s.id?s.color:"rgba(255,255,255,0.04)"}`,borderRadius:"10px",cursor:"pointer",textAlign:"left",fontFamily:FONT,transition:"all 0.18s" }}>
                    <div style={{ fontSize:"20px",marginBottom:"4px" }}>{s.icon}</div>
                    <div style={{ fontSize:"13px",fontWeight:"800",color:learnSec===s.id?s.color:"#334155" }}>{s.label}</div>
                  </button>
                ))}
              </div>
              <div style={{ height:"1px",background:"rgba(22,163,74,0.1)",margin:"20px 0" }} />
              <div style={{ fontSize:"11px",letterSpacing:"2px",color:"#475569",fontWeight:"800",fontFamily:FONT,marginBottom:"10px" }}>HIZLI ÖZET</div>
              <div style={{ display:"flex",flexDirection:"column",gap:"6px" }}>
                {[["Fiziki Cografya","5 alt dal",C_FIZ],["Beseri Cografya","6 alt dal",C_BES],["Doğal ortam","Insan etkisi yok","#64748b"],["Beseri ortam","Insan faaliyetleri",C_BES],["Cografi ortam","Her ikisinin birligi",C_FIZ]].map(([k,v,c])=>(
                  <div key={k} style={{ padding:"7px 10px",background:"rgba(0,0,0,0.2)",borderRadius:"7px",borderLeft:`3px solid ${c}` }}>
                    <div style={{ fontSize:"11px",color:String(c),fontWeight:"800",fontFamily:FONT }}>{k}</div>
                    <div style={{ fontSize:"11px",color:"#334155",fontFamily:FONT,marginTop:"2px" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sağ içerik */}
            <div style={{ flex:1,overflowY:"auto",padding:"26px 30px",display:"flex",flexDirection:"column",gap:"20px",background:`radial-gradient(ellipse at 10% 10%,${C_FIZ}06 0%,${BG} 65%)` }}>

              {/* ─ KONU & BÖLÜMLER ─ */}
              {learnSec==="konu" && (
                <div style={{ animation:"fadeUp 0.25s ease",display:"flex",flexDirection:"column",gap:"18px" }}>
                  <div>
                    <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px" }}>
                      <span style={{ fontSize:"30px" }}>🌍</span>
                      <div>
                        <div style={{ fontSize:"22px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT }}>Coğrafya Biliminin Konusu ve Bölümleri</div>
                        <div style={{ fontSize:"13px",color:C_FIZ,fontWeight:"600",fontFamily:FONT }}>Doğal ortam · Beşerî ortam · Coğrafi ortam</div>
                      </div>
                    </div>
                    <div style={{ height:"2px",background:`linear-gradient(90deg,${C_FIZ},transparent)`,opacity:0.35,borderRadius:"2px" }} />
                  </div>
                  {/* 3 Ortam kutusu */}
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px" }}>
                    {[
                      {icon:"🌿",title:"Doğal Ortam",color:"#065f46",desc:"İnsanın etkisi olmayan ortam. Litosfer, atmosfer, hidrosfer, kriyosfer ve biyosferden oluşur."},
                      {icon:"🏙️",title:"Beşerî Ortam",color:C_BES,desc:"İnsanın sosyal, kültürel ve ekonomik faaliyetleri sonucu doğal ortam üzerine inşa ettiği yaşam alanı."},
                      {icon:"🌐",title:"Coğrafi Ortam",color:C_FIZ,desc:"Doğal ortam ile beşerî ortamın birlikteliğinden oluşan en geniş yaşam alanı."},
                    ].map(item=>(
                      <div key={item.title} style={{ padding:"14px 16px",background:`${item.color}0d`,border:`1.5px solid ${item.color}25`,borderRadius:"11px",textAlign:"center" }}>
                        <div style={{ fontSize:"26px",marginBottom:"8px" }}>{item.icon}</div>
                        <div style={{ fontSize:"13px",fontWeight:"800",color:item.color,marginBottom:"8px",fontFamily:FONT }}>{item.title}</div>
                        <p style={{ fontSize:"12px",color:"#475569",lineHeight:"1.75",margin:0,fontFamily:FONT }}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  {/* 5 Küre */}
                  <div style={{ padding:"16px 18px",background:"rgba(0,0,0,0.28)",border:"1px solid rgba(22,163,74,0.15)",borderRadius:"12px" }}>
                    <div style={{ fontSize:"11px",color:C_FIZ,letterSpacing:"2px",fontWeight:"800",marginBottom:"12px",fontFamily:FONT }}>DOĞAL ORTAMIN 5 TEMEL KÜRE/ALANI</div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"8px",textAlign:"center" }}>
                      {[["Litosfer","Taş Küre","kayaç, toprak","#78350f"],["Atmosfer","Hava Küre","gazlar","#075985"],["Hidrosfer","Su Küre","deniz, göl, akarsu","#0c4a6e"],["Kriyosfer","Buz Küre","buzul, kar","#94a3b8"],["Biyosfer","Yasam Küre","canlılar","#14532d"]].map(([ad,tr,icerik,c])=>(
                        <div key={ad} style={{ padding:"10px 6px",background:`${c}15`,border:`1px solid ${c}30`,borderRadius:"8px" }}>
                          <div style={{ fontSize:"11px",fontWeight:"800",color:c,fontFamily:FONT }}>{ad}</div>
                          <div style={{ fontSize:"10px",color:`${c}90`,fontFamily:FONT,marginTop:"2px" }}>{tr}</div>
                          <div style={{ fontSize:"9px",color:"#334155",fontFamily:FONT,marginTop:"3px" }}>{icerik}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Coğrafya bölümleri */}
                  <div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px" }}>
                      {/* Fiziki */}
                      <div>
                        <div style={{ fontSize:"12px",color:C_FIZ,letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT }}>FİZİKİ COĞRAFYA — Tıkla & İncele</div>
                        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px" }}>
                          {DALLAR.filter(d=>d.kat==="fiziki").map(dal=>(
                            <DalKarti key={dal.id} dal={dal} active={activeDal===dal.id} onClick={()=>{sndClick();setActiveDal(dal.id);}} />
                          ))}
                        </div>
                      </div>
                      {/* Beseri */}
                      <div>
                        <div style={{ fontSize:"12px",color:C_BES,letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT }}>BEŞERİ COĞRAFYA — Tıkla & İncele</div>
                        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px" }}>
                          {DALLAR.filter(d=>d.kat==="beseri").map(dal=>(
                            <DalKarti key={dal.id} dal={dal} active={activeDal===dal.id} onClick={()=>{sndClick();setActiveDal(dal.id);}} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Seçili dal detayı */}
                    {activeDal && (
                      <div style={{ marginTop:"14px" }}>
                        {DALLAR.filter(d=>d.id===activeDal).map(dal=>(<DalDetay key={dal.id} dal={dal} />))}
                      </div>
                    )}
                  </div>
                  {/* Cografya teknikleri */}
                  <div style={{ padding:"14px 18px",background:`${C_FIZ}07`,border:`1px solid ${C_FIZ}18`,borderRadius:"10px" }}>
                    <div style={{ fontSize:"11px",color:C_FIZ,letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT }}>COĞRAFYA BİLİMİNİN KULLANDIĞI TEKNİKLER</div>
                    <div style={{ display:"flex",gap:"8px",flexWrap:"wrap" }}>
                      {[["🗺️","Haritalama"],["🛰️","Uzaktan Algılama"],["📊","Niceleme (İstatistik) Yöntemleri"],["💻","Coğrafi Bilgi Sistemleri (CBS)"]].map(([icon,teknik])=>(
                        <div key={teknik} style={{ padding:"8px 12px",background:"rgba(0,0,0,0.25)",border:`1px solid ${C_FIZ}25`,borderRadius:"7px",display:"flex",gap:"7px",alignItems:"center" }}>
                          <span style={{ fontSize:"16px" }}>{icon}</span>
                          <span style={{ fontSize:"12px",fontWeight:"700",color:"#94a3b8",fontFamily:FONT }}>{teknik}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ─ NİÇİN ÖĞRENELİM ─ */}
              {learnSec==="neden" && (
                <div style={{ animation:"fadeUp 0.25s ease",display:"flex",flexDirection:"column",gap:"18px" }}>
                  <div>
                    <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px" }}>
                      <span style={{ fontSize:"30px" }}>💡</span>
                      <div>
                        <div style={{ fontSize:"22px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT }}>Niçin Coğrafya Öğrenmeliyiz?</div>
                        <div style={{ fontSize:"13px",color:C_ACC,fontWeight:"600",fontFamily:FONT }}>Sürdürülebilir bir Dünya için coğrafi bakış açısı</div>
                      </div>
                    </div>
                    <div style={{ height:"2px",background:`linear-gradient(90deg,${C_ACC},transparent)`,opacity:0.35,borderRadius:"2px" }} />
                  </div>
                  <div style={{ padding:"18px 22px",background:`${C_ACC}0a`,border:`1.5px solid ${C_ACC}22`,borderRadius:"14px" }}>
                    <p style={{ fontSize:"14px",color:"#94a3b8",lineHeight:"1.95",margin:0,fontFamily:FONT }}>
                      Günümüzde doğal kaynakların yıllık tüketimi, Dünya ekosisteminin bir yılda ürettiği
                      kaynaklardan daha fazladır. Bu durum büyük bir tehdit oluşturmaktadır.
                      Bu bağlamda insan-doğa etkileşimini odak noktasına alan <strong style={{ color:C_ACC }}>coğrafya biliminin önemi artmaktadır</strong>.
                    </p>
                  </div>
                  {/* Coğrafyanın sorduğu sorular */}
                  <div style={{ padding:"16px 18px",background:"rgba(0,0,0,0.28)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:"12px" }}>
                    <div style={{ fontSize:"11px",color:C_ACC,letterSpacing:"2px",fontWeight:"800",marginBottom:"12px",fontFamily:FONT }}>COĞRAFYA BU SORULARA CEVAP ARAR</div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px" }}>
                      {[["❓","Ne?"],["📍","Nerede?"],["⏰","Ne zaman?"],["🤔","Neden orada?"],["⭐","Neden önemli?"],["🏔️","Ortamın özellikleri neler?"],["🔗","Doğal ortamla ilişkisi?"],["🏘️","Beşerî ortamla ilişkisi?"]].map(([icon,soru])=>(
                        <div key={soru} style={{ padding:"10px 12px",background:`${C_ACC}08`,border:`1px solid ${C_ACC}18`,borderRadius:"8px",display:"flex",gap:"8px",alignItems:"center" }}>
                          <span style={{ fontSize:"16px",flexShrink:0 }}>{icon}</span>
                          <span style={{ fontSize:"12px",fontWeight:"700",color:"#94a3b8",fontFamily:FONT }}>{soru}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Coğrafi bakış açısı yetenekleri */}
                  <div>
                    <div style={{ fontSize:"12px",color:C_ACC,letterSpacing:"2px",fontWeight:"800",marginBottom:"12px",fontFamily:FONT }}>COĞRAFİ BAKIŞ AÇISINA SAHİP BİRİ NELEPİR?</div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px" }}>
                      {[
                        {icon:"🔍",color:"#0ea5e9",title:"Bütünsel Görme",desc:"Doğal ortamdaki unsurları, doğa olayları ve insan faaliyetleriyle etkileşimini bütünsel şekilde görebilir."},
                        {icon:"⚖️",color:C_ACC,title:"Risk & Fırsat Analizi",desc:"Doğal ortamda karşılaştığı olayların ortaya çıkardığı risk ve fırsatları analiz edebilir."},
                        {icon:"🗺️",color:C_FIZ,title:"Harita Kullanımı",desc:"Haritaları kullanabilir; olay ve olguları mekânla ilişkilendirip yerel, bölgesel ve küresel olarak kavrayabilir."},
                        {icon:"🌱",color:"#34d399",title:"Sürdürülebilirlik",desc:"Doğal ortamın sınırlılıkları ile insan faaliyetlerinin çevre için oluşturduğu tehditleri görebilir."},
                      ].map(item=>(
                        <div key={item.title} style={{ padding:"13px 15px",background:`${item.color}08`,border:`1px solid ${item.color}20`,borderRadius:"10px",display:"flex",gap:"10px",alignItems:"flex-start" }}>
                          <span style={{ fontSize:"22px",flexShrink:0 }}>{item.icon}</span>
                          <div>
                            <div style={{ fontSize:"12px",fontWeight:"800",color:item.color,fontFamily:FONT,marginBottom:"4px" }}>{item.title}</div>
                            <p style={{ fontSize:"12px",color:"#475569",lineHeight:"1.75",margin:0,fontFamily:FONT }}>{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Bozkurt sel örneği */}
                  <div style={{ padding:"16px 20px",background:"rgba(239,68,68,0.06)",border:"1.5px solid rgba(239,68,68,0.2)",borderRadius:"12px" }}>
                    <div style={{ fontSize:"11px",color:"#ef4444",letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT }}>GERÇEK HAYAT ÖRNEĞİ — KASTAMONU-BOZKURT SEL AFETİ (2021)</div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px" }}>
                      <div>
                        <div style={{ fontSize:"12px",fontWeight:"800",color:"#fca5a5",fontFamily:FONT,marginBottom:"6px" }}>Doğal Koşullar</div>
                        <div style={{ display:"flex",flexDirection:"column",gap:"4px" }}>
                          {["Aşırı yağış (420 mm/3 gün)","Vadide konum","Dağlık arazi"].map(s=>(
                            <div key={s} style={{ fontSize:"12px",color:"#475569",fontFamily:FONT,paddingLeft:"8px",borderLeft:"2px solid rgba(239,68,68,0.5)" }}>{s}</div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:"12px",fontWeight:"800",color:"#fca5a5",fontFamily:FONT,marginBottom:"6px" }}>Beşerî Faktörler</div>
                        <div style={{ display:"flex",flexDirection:"column",gap:"4px" }}>
                          {["Dere yatağının daraltılması","Vadi tabanına yerleşim","Alçak köprüler"].map(s=>(
                            <div key={s} style={{ fontSize:"12px",color:"#475569",fontFamily:FONT,paddingLeft:"8px",borderLeft:"2px solid rgba(239,68,68,0.5)" }}>{s}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop:"10px",padding:"9px 12px",background:"rgba(239,68,68,0.08)",borderRadius:"7px",fontSize:"12px",color:"#fca5a5",fontFamily:FONT }}>
                      Coğrafi bakış açısıyla yapılacak mekânsal planlama bu tür afetlerin etkisini azaltabilir.
                    </div>
                  </div>
                </div>
              )}

              {/* ─ GELİŞİM TARİHİ ─ */}
              {learnSec==="gelisim" && (
                <div style={{ animation:"fadeUp 0.25s ease",display:"flex",flexDirection:"column",gap:"18px" }}>
                  <div>
                    <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"8px" }}>
                      <span style={{ fontSize:"30px" }}>⏳</span>
                      <div>
                        <div style={{ fontSize:"22px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT }}>Coğrafya Biliminin Gelişimi</div>
                        <div style={{ fontSize:"13px",color:"#0ea5e9",fontWeight:"600",fontFamily:FONT }}>Eski Çağdan günümüze coğrafi düşüncenin evrimi</div>
                      </div>
                    </div>
                    <div style={{ height:"2px",background:"linear-gradient(90deg,#0ea5e9,transparent)",opacity:0.35,borderRadius:"2px" }} />
                  </div>
                  {/* 4 Çağ bannerı */}
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px" }}>
                    {[
                      {cag:"eski",label:"Eski Çağ",color:"#0ea5e9",etken:"Yazının icadı, kent kurulması, ticaret, felsefi düşünce"},
                      {cag:"orta",label:"Orta Çağ",color:"#7c3aed",etken:"İpek Yolu, Baharat Yolu, Müslüman bilginler, göç hareketleri"},
                      {cag:"yeni",label:"Yeni Çağ",color:"#16a34a",etken:"Rönesans, reform, sömürgecilik, uzun mesafeli deniz seyahatleri"},
                      {cag:"yakin",label:"Yakın Çağ",color:"#f97316",etken:"Fransız İhtilali, Sanayi Devrimi, bilimsel keşif gezileri"},
                    ].map(item=>(
                      <div key={item.cag} style={{ padding:"12px 12px",background:`${item.color}0d`,border:`1.5px solid ${item.color}28`,borderRadius:"10px",textAlign:"center" }}>
                        <div style={{ fontSize:"12px",fontWeight:"800",color:item.color,marginBottom:"6px",fontFamily:FONT }}>{item.label}</div>
                        <p style={{ fontSize:"11px",color:"#475569",lineHeight:"1.65",margin:0,fontFamily:FONT }}>{item.etken}</p>
                      </div>
                    ))}
                  </div>
                  {/* Bilim insanları */}
                  <div>
                    <div style={{ fontSize:"12px",color:"#0ea5e9",letterSpacing:"2px",fontWeight:"800",marginBottom:"12px",fontFamily:FONT }}>ÖNEMLİ BİLİM İNSANLARI — Tıkla & İncele</div>
                    {["eski","orta","yeni","yakin"].map(cag=>{
                      const CAG_LABELS: Record<string,string> = {eski:"ESKİ ÇAĞ",orta:"ORTA ÇAĞ",yeni:"YENİ ÇAĞ",yakin:"YAKIN ÇAĞ"};
                      const CAG_COLORS: Record<string,string> = {eski:"#0ea5e9",orta:"#7c3aed",yeni:"#16a34a",yakin:"#f97316"};
                      const c = CAG_COLORS[cag];
                      const biler = BILIMLER.filter(b=>b.cag===cag);
                      return (
                        <div key={cag} style={{ marginBottom:"12px" }}>
                          <div style={{ fontSize:"10px",color:c,letterSpacing:"2px",fontWeight:"800",marginBottom:"8px",fontFamily:MONO }}>{CAG_LABELS[cag]}</div>
                          <div style={{ display:"flex",gap:"7px",flexWrap:"wrap" }}>
                            {biler.map(b=>(
                              <BilimKarti key={b.id} b={b} active={activeBilim===b.id} onClick={()=>{sndClick();setActiveBilim(b.id);}} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {/* Seçili bilim insanı */}
                    {activeBilim && (() => {
                      const b = BILIMLER.find(bl=>bl.id===activeBilim);
                      if(!b) return null;
                      const CAG_COLORS: Record<string,string> = {eski:"#0ea5e9",orta:"#7c3aed",yeni:"#16a34a",yakin:"#f97316"};
                      const c = CAG_COLORS[b.cag];
                      return (
                        <div style={{ padding:"16px 18px",background:`${c}0d`,border:`1.5px solid ${c}28`,borderRadius:"12px",marginTop:"4px",animation:"fadeUp 0.2s ease" }}>
                          <div style={{ display:"flex",gap:"12px",alignItems:"flex-start" }}>
                            <span style={{ fontSize:"28px",flexShrink:0 }}>{b.icon}</span>
                            <div style={{ flex:1 }}>
                              <div style={{ display:"flex",gap:"10px",alignItems:"baseline",marginBottom:"6px",flexWrap:"wrap" }}>
                                <div style={{ fontSize:"15px",fontWeight:"800",color:c,fontFamily:FONT }}>{b.isim}</div>
                                <div style={{ fontSize:"12px",color:`${c}80`,fontFamily:MONO }}>{b.yil}</div>
                              </div>
                              <p style={{ fontSize:"13px",color:"#94a3b8",lineHeight:"1.85",margin:0,fontFamily:FONT }}>{b.katki}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  {/* Türk bilim insanları notu */}
                  <div style={{ padding:"14px 16px",background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:"10px",fontSize:"13px",color:"#94a3b8",lineHeight:"1.8",fontFamily:FONT }}>
                    <strong style={{ color:"#f59e0b" }}>Cumhuriyet Dönemi:</strong> Besim Darkot, Faik Sabri Duran, Reşat İzbırak, Sırrı Erinç gibi bilim insanları coğrafya bilimine önemli katkılarda bulunmuştur.
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ── ETKİNLİK ── */}
        {tab==="act" && (
          <div style={{ flex:1,overflowY:"auto",padding:"24px 28px",background:`radial-gradient(ellipse at 5% 5%,${C_FIZ}05 0%,${BG} 60%)` }}>
            <EslestirmeAktisite />
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