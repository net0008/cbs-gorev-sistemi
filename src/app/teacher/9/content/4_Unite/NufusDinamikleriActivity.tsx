"use client";
import { useState } from "react";

/* ─── Ses ───────────────────────────────────────────────────────────────── */
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
const sndFail  = () => beep(200,0.30,"sawtooth",0.12);
const sndClick = () => beep(680,0.07,"square",0.06);
const sndDrop  = () => beep(520,0.12,"sine",0.10);

/* ─── Stil sabitleri ─────────────────────────────────────────────────────── */
const FONT  = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const MONO  = "'Courier New',Courier,monospace";
const BG    = "#07091a";
const C     = "#8b5cf6";   // violet — nüfus
const C2    = "#06b6d4";   // cyan   — harita/dağılış
const C3    = "#f59e0b";   // amber  — piramit
const C4    = "#10b981";   // yeşil  — büyüme
const C5    = "#ef4444";   // kırmızı— politika
const PANEL = "rgba(7,9,26,0.85)";

type Tab       = "learn" | "act" | "test";
type LearnSec  = "tarihsel" | "dagilisi" | "goc" | "demografik" | "piramitler" | "politikalar";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VERİ: Demografik Dönüşüm Evreleri
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const EVRELER = [
  {
    no: 1, ad: "1. Evre — Ön Sanayi", color: "#78350f",
    dogum: "yüksek", olum: "yüksek", artis: "çok az / durağan",
    nufus: "Az, yavaş artar",
    aciklama: "Doğum ve ölüm oranlarının ikisi de yüksektir. Salgın hastalıklar, yetersiz beslenme ve kötü hijyen koşulları ölümleri artırır. Nüfus artışı yok denecek kadar azdır.",
    ornek: "Tarihöncesi toplumlar, ortaçağ Avrupası",
  },
  {
    no: 2, ad: "2. Evre — Erken Sanayi", color: "#b45309",
    dogum: "yüksek", olum: "düşüyor", artis: "hızlı artış",
    nufus: "Hızla büyür",
    aciklama: "Tıp, hijyen ve tarımdaki ilerlemeler ölüm oranlarını hızla düşürür; doğum oranı hâlâ yüksektir. Bu makasın açılması nüfusu patlama yapar. Gelişmekte olan ülkelerin büyük bölümü bu evrededir.",
    ornek: "20. yy başı Afrika, Güney Asya",
  },
  {
    no: 3, ad: "3. Evre — Geç Sanayi", color: "#0369a1",
    dogum: "düşüyor", olum: "düşük", artis: "yavaşlayan artış",
    nufus: "Orta hızda büyür",
    aciklama: "Kentleşme, eğitim ve kadın istihdamı artar; doğum oranı düşmeye başlar. Ölüm oranı zaten düşüktür. Nüfus artmaya devam eder ancak hızı azalır.",
    ornek: "Türkiye (1970-2000), Brezilya, Çin",
  },
  {
    no: 4, ad: "4. Evre — Sanayi Sonrası", color: "#166534",
    dogum: "düşük", olum: "düşük", artis: "durağan / çok yavaş",
    nufus: "Durağanlaşır",
    aciklama: "Her iki oran da düşük ve birbirine yakın seyreder. Nüfus çok yavaş artar ya da durağanlaşır. Gelişmiş ülkelerde görülür; yaşlı nüfus oranı yüksektir.",
    ornek: "Batı Avrupa, Japonya, Güney Kore",
  },
  {
    no: 5, ad: "5. Evre — Gerileme", color: "#4c1d95",
    dogum: "çok düşük", olum: "düşük (yaşlı nüfus etkisi)", artis: "negatif",
    nufus: "Azalır",
    aciklama: "Doğum oranı ölüm oranının altına iner; nüfus azalmaya başlar. Göç ve politikalar nüfusu dengelemeye çalışabilir. Bazı Avrupa ülkelerinde gözlemlenmektedir.",
    ornek: "Almanya, İtalya, Bulgaristan",
  },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VERİ: Göç Nedenleri (Aktivite)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
interface MK { id:string; text:string; cat:"itici"|"cekici"; }
const MATCH_ITEMS: MK[] = [
  { id:"m1",  text:"İşsizlik ve ekonomik yoksulluk",              cat:"itici"  },
  { id:"m2",  text:"Daha yüksek ücret ve iş olanakları",          cat:"cekici" },
  { id:"m3",  text:"Doğal afet — deprem, sel, kuraklık",          cat:"itici"  },
  { id:"m4",  text:"Kaliteli sağlık ve eğitim imkânları",         cat:"cekici" },
  { id:"m5",  text:"Siyasi baskı ve çatışma ortamı",              cat:"itici"  },
  { id:"m6",  text:"Güvenli ve huzurlu yaşam koşulları",          cat:"cekici" },
  { id:"m7",  text:"Tarım arazisinin yetersizliği",               cat:"itici"  },
  { id:"m8",  text:"Kentsel alt yapı ve sosyal hizmetler",        cat:"cekici" },
  { id:"m9",  text:"Çevre kirliliği ve yaşanabilirlik düşüklüğü", cat:"itici"  },
  { id:"m10", text:"Akraba ve hemşehri ağının varlığı",           cat:"cekici" },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TEST SORULARI
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const TEST_ITEMS = [
  {
    q: "İnsanlık tarihinde yaşanan birinci nüfus sıçramasının temel nedeni nedir?",
    opts: ["Sanayi Devrimi'nin başlaması","Tarım Devrimi ve yerleşik hayata geçiş","Alet yapımı ve vahşi hayvanlarla mücadelede ilerleme","Tıp alanındaki gelişmeler"],
    correct: 2,
    exp: "Birinci sıçrama, yaklaşık 1 milyon yıl önce insanların çeşitli aletleri icat etmesiyle başladı. Aletlerin etkin kullanımıyla yetersiz beslenme azaldı, vahşi hayvanlarla mücadelede ilerleme sağlandı.",
  },
  {
    q: "Demografik dönüşümün 2. evresinde nüfusun hızla artmasının temel nedeni nedir?",
    opts: ["Doğum oranının yükselmesi","Ölüm oranının düşmesi, doğum oranının yüksek kalması","Her iki oranın da düşmesi","Göçün artması"],
    correct: 1,
    exp: "2. evrede tıp, hijyen ve tarımdaki ilerlemeler ölüm oranlarını hızla düşürür; ancak doğum oranı hâlâ yüksektir. Bu makas nüfusu patlama yaptırır.",
  },
  {
    q: "Aşağıdakilerden hangisi nüfus yoğunluğunu azaltan doğal faktörler arasında yer alır?",
    opts: ["Verimli tarım arazileri","Yüksek rakım ve engebeli arazi","Uygun iklim koşulları","Zengin yer altı kaynakları"],
    correct: 1,
    exp: "Yüksek rakım ve engebeli araziler tarımı, ulaşımı ve yerleşimi zorlaştırır; bu nedenle nüfus yoğunluğu bu alanlarda düşük kalır.",
  },
  {
    q: "UNFPA'ya göre 2100 yılında dünya nüfusunun kaç milyar olması öngörülmektedir?",
    opts: ["5-7 milyar","7-9 milyar","9-13 milyar","15-20 milyar"],
    correct: 2,
    exp: "Birleşmiş Milletler Dünya Nüfus Fonu (UNFPA), 2100 yılında dünya nüfusunun 9-13 milyar arasında olacağını tahmin etmektedir.",
  },
  {
    q: "Üçgen ya da piramit biçimli (geniş tabanlı) nüfus piramidi hangi özelliği gösterir?",
    opts: ["Yaşlı ve durağan nüfus","Genç ve hızlı büyüyen nüfus","Nüfus azalması","Göç alan ülke"],
    correct: 1,
    exp: "Geniş tabanlı üçgen piramit, doğum oranının yüksek olduğu, genç nüfusun baskın olduğu ve hızlı büyüyen bir nüfus yapısını gösterir.",
  },
  {
    q: "Pro-natalist nüfus politikasının temel amacı nedir?",
    opts: ["Nüfusu azaltmak","Nüfus artışını teşvik etmek","Göçü engellemek","Kentleşmeyi hızlandırmak"],
    correct: 1,
    exp: "Pro-natalist politika; düşük doğum oranlarını artırmaya yönelik teşvik edici uygulamalardır. Doğum izni, çocuk yardımı ve vergi avantajları bu politikanın araçlarıdır.",
  },
  {
    q: "Ortanca yaş (medyan yaş) kavramı neyi ifade eder?",
    opts: ["Ülkedeki en yaşlı kişinin yaşı","Toplumu iki eşit gruba bölen yaş değeri","Ortalama ömür uzunluğu","En sık rastlanan yaş"],
    correct: 1,
    exp: "Ortanca yaş (medyan yaş), nüfusu yaşa göre sıralandığında tam ortaya denk gelen değerdir. Toplumun yarısı bu yaşın altında, yarısı bu yaşın üzerindedir.",
  },
  {
    q: "Türkiye'de 1950-1980 yılları arasında nüfus artış hızının yüksek olmasının başlıca nedenleri nelerdir?",
    opts: ["Yoğun dış göç ve ölüm oranının artması","Yüksek doğum oranı ve sağlık hizmetleriyle düşen ölüm oranı","Tarım alanlarının azalması","Kentleşme oranının düşük olması"],
    correct: 1,
    exp: "Bu dönemde doğum oranları hâlâ yüksekken sağlık hizmetlerindeki ilerlemeler ölüm oranlarını önemli ölçüde düşürmüştür. Bu makasın açılması nüfusu hızla büyütmüştür.",
  },
  {
    q: "Bağımlı nüfus kavramı neyi ifade eder?",
    opts: ["15-64 yaş arasındaki çalışabilir nüfus","0-14 ve 65+ yaş gruplarını kapsayan çalışmayan nüfus","Yalnızca 65 yaş üstü bireyler","Sosyal yardım alan nüfus"],
    correct: 1,
    exp: "Bağımlı nüfus; ekonomik anlamda üretim dışında kalan 0-14 yaş (genç) ve 65 yaş üstü (yaşlı) gruplarını kapsar. Yüksek bağımlılık oranı ekonomi için ek yük oluşturur.",
  },
  {
    q: "Nüfus piramidinde daralan taban ve geniş orta-üst yaş grubu hangi ülke tipini temsil eder?",
    opts: ["Az gelişmiş, genç nüfuslu ülke","Gelişmiş, yaşlanan ve düşük doğum oranına sahip ülke","Hızlı nüfus artışı yaşayan ülke","Göç veren gelişmekte olan ülke"],
    correct: 1,
    exp: "Taban darlığı düşük doğum oranına, orta-üst katmanların genişliği ise yaşlanan nüfusa işaret eder. Bu yapı Batı Avrupa ve Japonya gibi gelişmiş ülkelerde görülür.",
  },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BILEŞEN: Demografik Dönüşüm SVG Animasyonu
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function DemografikDonusumSVG({ activeEvre }: { activeEvre: number }) {
  const W = 620, H = 180;
  // Evre başlangıç x değerleri
  const evreX = [0, 120, 240, 380, 510];
  const evrW  = [120, 120, 140, 130, 110];

  // Doğum oranı eğrisi noktaları (y: 0 = yüksek)
  const dogumY = [30, 30, 60, 100, 120];
  // Ölüm oranı eğrisi noktaları
  const olumY  = [30, 80, 100, 110, 118];
  // x konumları (her evre ortası)
  const xs = evreX.map((x, i) => x + evrW[i] / 2);

  const polyDogum = xs.map((x, i) => `${x},${dogumY[i]}`).join(" ");
  const polyOlum  = xs.map((x, i) => `${x},${olumY[i]}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, display: "block", margin: "0 auto" }}>
      {/* Arka plan evreler */}
      {EVRELER.map((ev, i) => (
        <rect key={i}
          x={evreX[i]} y={0} width={evrW[i]} height={H}
          fill={i === activeEvre ? `${ev.color}22` : `${ev.color}08`}
          stroke={i === activeEvre ? ev.color : `${ev.color}30`}
          strokeWidth={i === activeEvre ? 1.5 : 0.5}
        />
      ))}
      {/* Evre numaraları */}
      {EVRELER.map((ev, i) => (
        <text key={i}
          x={evreX[i] + evrW[i] / 2} y={H - 8}
          textAnchor="middle" fontSize="10" fill={i === activeEvre ? ev.color : "#475569"}
          fontFamily={FONT} fontWeight={i === activeEvre ? "800" : "400"}>
          {ev.no}. Evre
        </text>
      ))}
      {/* Doğum oranı eğrisi */}
      <polyline points={polyDogum} fill="none" stroke={C5} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      {/* Ölüm oranı eğrisi */}
      <polyline points={polyOlum} fill="none" stroke={C2} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      {/* Veri noktaları */}
      {xs.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={dogumY[i]} r={i === activeEvre ? 6 : 4} fill={C5} opacity="0.9" />
          <circle cx={x} cy={olumY[i]}  r={i === activeEvre ? 6 : 4} fill={C2} opacity="0.9" />
        </g>
      ))}
      {/* Lejant */}
      <line x1={10} y1={10} x2={40} y2={10} stroke={C5} strokeWidth="2"/>
      <text x={45} y={14} fontSize="10" fill={C5} fontFamily={FONT}>Doğum Oranı</text>
      <line x1={150} y1={10} x2={180} y2={10} stroke={C2} strokeWidth="2"/>
      <text x={185} y={14} fontSize="10" fill={C2} fontFamily={FONT}>Ölüm Oranı</text>
    </svg>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BILEŞEN: Nüfus Piramidi SVG
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function NufusPiramidi({ tip }: { tip: "genis" | "dik" | "yaşli" }) {
  const W = 240, H = 200;
  const cx = W / 2;
  const yaşGrubu = ["0-4","5-14","15-24","25-34","35-44","45-54","55-64","65+"];

  const barWidths: Record<string, number[]> = {
    genis:  [90, 84, 76, 66, 56, 44, 30, 16], // üçgen — genç nüfus
    dik:    [60, 62, 64, 62, 58, 52, 44, 32], // silindir — durağan
    yaşli:  [32, 36, 46, 58, 66, 68, 64, 56], // ters üçgen — yaşlı nüfus
  };
  const widths = barWidths[tip];
  const colors: Record<string, string> = { genis: C5, dik: C4, yaşli: C };
  const color = colors[tip];
  const rowH = (H - 20) / yaşGrubu.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      {yaşGrubu.map((grup, i) => {
        const y = 5 + i * rowH;
        const hw = widths[i] / 2;
        return (
          <g key={grup}>
            {/* Sol (Kadın) */}
            <rect x={cx - hw} y={y + 1} width={hw} height={rowH - 2} fill={`${color}55`} stroke={color} strokeWidth="0.5" rx="1" />
            {/* Sağ (Erkek) */}
            <rect x={cx} y={y + 1} width={hw} height={rowH - 2} fill={`${color}80`} stroke={color} strokeWidth="0.5" rx="1" />
            {/* Yaş etiketi */}
            <text x={cx} y={y + rowH / 2 + 4} textAnchor="middle" fontSize="8" fill={color} fontFamily={MONO} fontWeight="700">{grup}</text>
          </g>
        );
      })}
      {/* Eksen çizgisi */}
      <line x1={cx} y1={5} x2={cx} y2={H - 15} stroke={color} strokeWidth="1" opacity="0.4" />
      <text x={cx / 2} y={H - 3} textAnchor="middle" fontSize="8" fill={color} fontFamily={FONT} opacity="0.6">Kadın</text>
      <text x={cx + cx / 2} y={H - 3} textAnchor="middle" fontSize="8" fill={color} fontFamily={FONT} opacity="0.6">Erkek</text>
    </svg>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BILEŞEN: Aktivite — Göç Nedeni Sınıflandırma
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function GocAktivite() {
  const BUCKETS = [
    { id: "itici" as const, label: "İTİCİ FAKTÖRLER", icon: "↩", color: C5,
      sub: "İnsanı yaşadığı yerden uzaklaştıran etkenler" },
    { id: "cekici" as const, label: "ÇEKİCİ FAKTÖRLER", icon: "↪", color: C4,
      sub: "İnsanı yeni bir yere çeken etkenler" },
  ];

  const [shuffled] = useState<MK[]>(() => {
    const a = [...MATCH_ITEMS];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  });
  const [placed,  setPlaced]  = useState<Record<string, string>>({});
  const [wrong,   setWrong]   = useState<Record<string, boolean>>({});
  const [dragId,  setDragId]  = useState<string | null>(null);
  const [hovBuck, setHovBuck] = useState<string | null>(null);
  const [score,   setScore]   = useState(0);
  const [done,    setDone]    = useState(false);

  const doDrop = (bid: string) => {
    if (!dragId) return;
    const item = shuffled.find(m => m.id === dragId);
    if (!item || placed[dragId]) return;
    const ok = item.cat === bid;
    sndDrop(); if (ok) { sndOK(); setScore(s => s + 1); } else sndFail();
    const np = { ...placed,  [dragId]: bid };
    const nw = { ...wrong,   [dragId]: !ok };
    setPlaced(np); setWrong(nw); setDragId(null); setHovBuck(null);
    if (Object.keys(np).length === shuffled.length) setTimeout(() => setDone(true), 400);
  };
  const retry = () => { setPlaced({}); setWrong({}); setScore(0); setDone(false); setDragId(null); };

  if (done) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, padding:"48px 24px", textAlign:"center" }}>
      <div style={{ fontSize:52 }}>🌍</div>
      <div style={{ fontSize:26, fontWeight:800, color:"#e2e8f0", fontFamily:FONT }}>Göç Faktörleri Tamamlandı!</div>
      <div style={{ fontSize:50, fontWeight:800, color:C, fontFamily:MONO }}>{score}/{shuffled.length}</div>
      <div style={{ fontSize:14, color:"#475569", fontFamily:FONT }}>doğru sınıflandırma</div>
      <button onClick={retry}
        style={{ padding:"12px 28px", background:`linear-gradient(90deg,#4c1d95,${C})`, border:"none", borderRadius:10, color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:FONT }}>
        🔄 Tekrar Oyna
      </button>
    </div>
  );

  const pending = shuffled.filter(m => !placed[m.id]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <div style={{ fontSize:10, color:C, letterSpacing:3, fontWeight:800, fontFamily:MONO, marginBottom:4 }}>ETKİNLİK</div>
        <div style={{ fontSize:17, fontWeight:800, color:"#e2e8f0", fontFamily:FONT }}>🌍 Göç Nedenlerini Sınıflandır</div>
        <div style={{ fontSize:12, color:"#475569", marginTop:3, fontFamily:FONT }}>
          Her kartı doğru kategoriye sürükle bırak
        </div>
      </div>

      {/* Sürüklenecek kartlar */}
      <div style={{ padding:"12px 14px", background:"rgba(0,0,0,0.3)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, minHeight:52 }}>
        <div style={{ fontSize:10, color:"#475569", letterSpacing:2, fontWeight:800, marginBottom:8, fontFamily:FONT }}>SINIFLANDIRILACAK ETKENLER</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
          {pending.map(item => (
            <div key={item.id} draggable
              onDragStart={e => { setDragId(item.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", item.id); }}
              onDragEnd={() => { setDragId(null); setHovBuck(null); }}
              style={{
                padding:"9px 13px",
                background: dragId === item.id ? `${C}20` : "rgba(0,0,0,0.4)",
                border: `1.5px solid ${dragId === item.id ? C : "rgba(255,255,255,0.1)"}`,
                borderRadius:8, cursor:"grab", fontSize:12, fontWeight:600,
                color:"#cbd5e1", fontFamily:FONT, userSelect:"none", WebkitUserSelect:"none",
                opacity: dragId === item.id ? 0.5 : 1,
              }}>
              {item.text}
            </div>
          ))}
          {shuffled.filter(m => placed[m.id]).map(item => (
            <div key={item.id} style={{
              padding:"9px 13px",
              background: wrong[item.id] ? "rgba(239,68,68,0.08)" : "rgba(52,211,153,0.08)",
              border: `1.5px solid ${wrong[item.id] ? "#ef444430" : "#34d39930"}`,
              borderRadius:8, fontSize:12, fontWeight:600,
              color: wrong[item.id] ? "#ef4444" : "#34d399",
              fontFamily:FONT, opacity:0.65,
            }}>
              {wrong[item.id] ? "✗ " : "✓ "}{item.text}
            </div>
          ))}
        </div>
      </div>

      {/* Hedef kutular */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {BUCKETS.map(b => (
          <div key={b.id}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setHovBuck(b.id); }}
            onDragLeave={() => setHovBuck(null)}
            onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) { setDragId(id); setTimeout(() => doDrop(b.id), 0); } else doDrop(b.id); }}
            style={{
              minHeight:160, padding:14,
              background: hovBuck === b.id ? `${b.color}18` : `${b.color}08`,
              border: `2px ${hovBuck === b.id ? "solid" : "dashed"} ${b.color}${hovBuck === b.id ? "80" : "35"}`,
              borderRadius:12, transition:"all 0.2s",
            }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{b.icon}</div>
            <div style={{ fontSize:13, fontWeight:800, color:b.color, marginBottom:2, fontFamily:FONT }}>{b.label}</div>
            <div style={{ fontSize:11, color:`${b.color}80`, marginBottom:10, fontFamily:FONT }}>{b.sub}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {shuffled.filter(m => placed[m.id] === b.id).map(it => (
                <div key={it.id} style={{
                  padding:"6px 9px",
                  background: wrong[it.id] ? "rgba(239,68,68,0.12)" : "rgba(52,211,153,0.12)",
                  border: `1px solid ${wrong[it.id] ? "#ef444440" : "#34d39940"}`,
                  borderRadius:6, fontSize:11,
                  color: wrong[it.id] ? "#ef4444" : "#34d399",
                  fontWeight:600, fontFamily:FONT,
                }}>
                  {wrong[it.id] ? "✗ " : "✓ "}{it.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding:"9px 14px", background:"rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:8, display:"flex", justifyContent:"space-between" }}>
        <span style={{ fontSize:12, color:"#475569", fontFamily:FONT }}>Kalan: {pending.length} kart</span>
        <span style={{ fontSize:14, fontWeight:800, color:C, fontFamily:MONO }}>{score} doğru</span>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BILEŞEN: Test Sekmesi
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function TestTab() {
  const [qIdx,    setQIdx]    = useState(0);
  const [sel,     setSel]     = useState<number | null>(null);
  const [score,   setScore]   = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done,    setDone]    = useState(false);
  const q = TEST_ITEMS[qIdx];

  const handleAnswer = (i: number) => {
    if (sel !== null) return;
    setSel(i);
    const ok = i === q.correct;
    if (ok) { setScore(s => s + 10); sndOK(); } else sndFail();
    setAnswers(a => [...a, ok]);
  };
  const next  = () => { sndClick(); if (qIdx >= TEST_ITEMS.length - 1) { setDone(true); return; } setQIdx(i => i + 1); setSel(null); };
  const retry = () => { setQIdx(0); setSel(null); setScore(0); setAnswers([]); setDone(false); };

  if (done) {
    const pct = Math.round((score / (TEST_ITEMS.length * 10)) * 100);
    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:18, padding:"40px 24px", textAlign:"center" }}>
        <div style={{ fontSize:52 }}>👥</div>
        <div style={{ fontSize:26, fontWeight:800, color:"#e2e8f0", fontFamily:FONT }}>Test Tamamlandı!</div>
        <div style={{ fontSize:52, fontWeight:800, color: pct >= 80 ? "#34d399" : pct >= 50 ? C3 : "#ef4444", fontFamily:MONO }}>{score} PUAN</div>
        <div style={{ fontSize:14, color:"#475569", fontFamily:FONT }}>{answers.filter(Boolean).length}/{TEST_ITEMS.length} doğru · %{pct}</div>
        <div style={{ fontSize:14, color:"#64748b", maxWidth:420, lineHeight:1.8, fontFamily:FONT }}>
          {pct >= 80 ? "🏆 Mükemmel! Nüfus dinamiklerini çok iyi öğrendin." : pct >= 50 ? "👍 İyi! Öğren sekmesini tekrar incele." : "📚 Tekrar dene!"}
        </div>
        <button onClick={retry}
          style={{ padding:"13px 30px", background:`linear-gradient(90deg,#4c1d95,${C})`, border:"none", borderRadius:10, color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:FONT }}>
          🔄 Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
      {/* Sol liste */}
      <div style={{ width:220, flexShrink:0, borderRight:`1px solid ${C}18`, background:PANEL, padding:"20px 14px", display:"flex", flexDirection:"column", gap:6, overflowY:"auto" }}>
        <div style={{ fontSize:11, letterSpacing:2, color:"#475569", fontWeight:800, fontFamily:FONT, marginBottom:4 }}>SORULAR</div>
        {TEST_ITEMS.map((_, i) => {
          const d = i < answers.length, cur = i === qIdx;
          return (
            <div key={i} style={{
              display:"flex", alignItems:"center", gap:8, padding:"8px 10px",
              background: cur ? `${C}10` : "rgba(0,0,0,0.15)",
              border: `1.5px solid ${cur ? C : d ? (answers[i] ? "rgba(52,211,153,0.3)" : "rgba(239,68,68,0.3)") : "rgba(255,255,255,0.04)"}`,
              borderRadius:7,
            }}>
              <div style={{
                width:20, height:20, borderRadius:"50%",
                background: d ? (answers[i] ? "#34d399" : "#ef4444") : cur ? C : "rgba(255,255,255,0.06)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:10, fontWeight:800, color:"#fff", flexShrink:0, fontFamily:MONO,
              }}>
                {d ? (answers[i] ? "✓" : "✗") : i + 1}
              </div>
              <span style={{ fontSize:12, fontWeight:700, color: cur ? C : d ? (answers[i] ? "#34d399" : "#ef4444") : "#334155", fontFamily:FONT }}>
                Soru {i + 1}
              </span>
            </div>
          );
        })}
        <div style={{ marginTop:"auto", padding:12, background:"rgba(0,0,0,0.3)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:9, textAlign:"center" }}>
          <div style={{ fontSize:11, color:"#475569", fontWeight:700, fontFamily:FONT, marginBottom:4 }}>PUAN</div>
          <div style={{ fontSize:30, fontWeight:800, color:C, fontFamily:MONO }}>{score}</div>
          <div style={{ fontSize:11, color:"#334155", fontFamily:FONT }}>/ {TEST_ITEMS.length * 10}</div>
        </div>
      </div>

      {/* Soru alanı */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"28px 36px", overflowY:"auto", gap:16 }}>
        <div style={{ width:"100%", maxWidth:640 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:12, color:"#475569", fontWeight:700, fontFamily:FONT }}>SORU {qIdx + 1}/{TEST_ITEMS.length}</span>
            <span style={{ fontSize:12, color:C, fontFamily:FONT }}>{Math.round((qIdx / TEST_ITEMS.length) * 100)}%</span>
          </div>
          <div style={{ height:4, background:`${C}18`, borderRadius:2, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${(qIdx / TEST_ITEMS.length) * 100}%`, background:`linear-gradient(90deg,#4c1d95,${C})`, borderRadius:2, transition:"width 0.4s" }} />
          </div>
        </div>

        <div style={{ maxWidth:640, width:"100%", padding:"20px 24px", background:`${C}08`, border:`1.5px solid ${C}20`, borderRadius:14 }}>
          <p style={{ fontSize:15, color:"#e2e8f0", lineHeight:1.9, margin:0, fontWeight:600, fontFamily:FONT }}>{q.q}</p>
        </div>

        <div style={{ maxWidth:640, width:"100%", display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
          {q.opts.map((opt, i) => {
            const isSel = sel === i, isCorr = i === q.correct, show = sel !== null;
            let bg = "rgba(0,0,0,0.25)", border = "rgba(255,255,255,0.07)", color = "#64748b";
            if (show) {
              if (isCorr)     { bg = "#34d39912"; border = "#34d399"; color = "#34d399"; }
              else if (isSel) { bg = "rgba(239,68,68,0.1)"; border = "#ef4444"; color = "#ef4444"; }
            }
            return (
              <button key={i} onClick={() => handleAnswer(i)} disabled={sel !== null}
                style={{ padding:"13px 15px", background:bg, border:`2px solid ${border}`, borderRadius:10, cursor: sel !== null ? "default" : "pointer", fontFamily:FONT, textAlign:"left", transition:"all 0.18s" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:9 }}>
                  <span style={{
                    width:22, height:22, borderRadius:"50%",
                    background: show && isCorr ? "#34d399" : show && isSel ? "#ef4444" : `${C}20`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:10, fontWeight:800, color: show ? "#fff" : "#94a3b8",
                    flexShrink:0, marginTop:1, fontFamily:MONO,
                  }}>
                    {show && isCorr ? "✓" : show && isSel && !isCorr ? "✗" : String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ fontSize:13, color, fontWeight:600, lineHeight:1.6, fontFamily:FONT }}>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>

        {sel !== null && (
          <div style={{
            maxWidth:640, width:"100%", padding:"15px 18px",
            background: sel === q.correct ? "rgba(52,211,153,0.07)" : "rgba(239,68,68,0.07)",
            border: `1.5px solid ${sel === q.correct ? "rgba(52,211,153,0.25)" : "rgba(239,68,68,0.25)"}`,
            borderRadius:12,
          }}>
            <div style={{ fontSize:14, fontWeight:800, color: sel === q.correct ? "#34d399" : "#ef4444", marginBottom:8, fontFamily:FONT }}>
              {sel === q.correct ? "✅ DOĞRU!" : "❌ YANLIŞ!"}
            </div>
            <p style={{ fontSize:13, color:"#64748b", lineHeight:1.85, margin:0, fontFamily:FONT }}>{q.exp}</p>
          </div>
        )}

        {sel !== null && (
          <button onClick={next}
            style={{ padding:"12px 34px", background:`linear-gradient(90deg,#4c1d95,${C})`, border:"none", borderRadius:10, color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:FONT }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}>
            {qIdx >= TEST_ITEMS.length - 1 ? "🏁 Sonuçları Gör" : "⏭ Sonraki Soru"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ANA BİLEŞEN
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function NufusDinamiikleriActivity({ onClose }: { onClose: () => void }) {
  const [tab,        setTab]        = useState<Tab>("learn");
  const [sec,        setSec]        = useState<LearnSec>("tarihsel");
  const [activeEvre, setActiveEvre] = useState(0);

  const TABS = [
    { id: "learn" as Tab, icon: "📖", label: "ÖĞREN"    },
    { id: "act"   as Tab, icon: "🌍", label: "ETKİNLİK" },
    { id: "test"  as Tab, icon: "✏️", label: "TEST"      },
  ];

  const SECTIONS: { id: LearnSec; icon: string; label: string; color: string; sub: string }[] = [
    { id:"tarihsel",    icon:"⏳", label:"4.1.1. Nüfusun Tarihsel Değişimi ve Geleceği",      color:C3,  sub:"3 sıçrama dönemi" },
    { id:"dagilisi",    icon:"🗺️", label:"Nüfus Dağılışı",        color:C2,  sub:"Faktörler & yoğunluk" },
    { id:"goc",         icon:"✈️", label:"Nüfus Hareketleri/Göç", color:C4,  sub:"İtici & çekici" },
    { id:"demografik",  icon:"📊", label:"Demografik Dönüşüm",    color:C,   sub:"5 evre" },
    { id:"piramitler",  icon:"🔼", label:"Nüfus Piramitleri",     color:C3,  sub:"3 tip" },
    { id:"politikalar", icon:"⚖️", label:"Nüfus Politikaları",    color:C5,  sub:"Pro-natalist / Anti" },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:BG, display:"flex", flexDirection:"column", fontFamily:FONT, userSelect:"none", WebkitUserSelect:"none" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Üst bar ─────────────────────────────────────────────────────── */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 24px", height:64,
        borderBottom:`1px solid ${C}1a`,
        background:"rgba(3,3,15,0.94)", flexShrink:0,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:24 }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:4, color:C, opacity:0.6, fontFamily:MONO }}>4. ÜNİTE — BEŞERİ SİSTEMLER VE SÜREÇLER</div>
            <div style={{ fontSize:19, fontWeight:800, color:"#e2e8f0", letterSpacing:0.3 }}>Nüfus Dinamikleri</div>
          </div>
          <div style={{ display:"flex", gap:3, background:"rgba(0,0,0,0.4)", padding:4, borderRadius:10 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => { sndClick(); setTab(t.id); }}
                style={{
                  padding:"7px 18px", borderRadius:7, border:"none", cursor:"pointer",
                  fontFamily:FONT, fontSize:12, fontWeight:700, transition:"all 0.18s",
                  background: tab === t.id ? C : "transparent",
                  color:      tab === t.id ? "#fff" : "#334155",
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose}
          style={{ padding:"8px 18px", background:"transparent", border:"1px solid rgba(255,80,80,0.3)", borderRadius:8, color:"#f87171", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,80,80,0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          ✕ KAPAT
        </button>
      </div>

      {/* ── İçerik ──────────────────────────────────────────────────────── */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", minHeight:0 }}>

        {/* ══ ÖĞREN ══ */}
        {tab === "learn" && (
          <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
            {/* Sol menü */}
            <div style={{ width:240, flexShrink:0, borderRight:`1px solid ${C}12`, background:PANEL, overflowY:"auto", padding:"20px 14px" }}>
              <div style={{ fontSize:11, letterSpacing:2, color:"#475569", fontWeight:800, fontFamily:FONT, marginBottom:12 }}>KONULAR</div>
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {SECTIONS.map(s => (
                  <button key={s.id} onClick={() => { sndClick(); setSec(s.id); }}
                    style={{
                      padding:"12px 14px",
                      background: sec === s.id ? `${s.color}14` : "rgba(0,0,0,0.22)",
                      border: `2px solid ${sec === s.id ? s.color : "rgba(255,255,255,0.04)"}`,
                      borderRadius:10, cursor:"pointer", textAlign:"left", fontFamily:FONT, transition:"all 0.18s",
                    }}>
                    <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
                    <div style={{ fontSize:13, fontWeight:800, color: sec === s.id ? s.color : "#334155" }}>{s.label}</div>
                    <div style={{ fontSize:11, color: sec === s.id ? `${s.color}80` : "#1e293b", marginTop:2 }}>{s.sub}</div>
                  </button>
                ))}
              </div>

              <div style={{ height:1, background:`${C}12`, margin:"18px 0" }} />
              <div style={{ fontSize:11, letterSpacing:2, color:"#475569", fontWeight:800, fontFamily:FONT, marginBottom:10 }}>ANAHTAR KAVRAMLAR</div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {[
                  ["Doğurganlık","Kadın başına düşen ortalama çocuk",C5],
                  ["Kaba Doğum Oranı","1000 kişide yıllık doğum",C3],
                  ["Kaba Ölüm Oranı","1000 kişide yıllık ölüm",C2],
                  ["Bağımlılık Oranı","Bağımlı/Aktif nüfus",C4],
                  ["Ortanca Yaş","Nüfusu 2'ye bölen yaş",C],
                ].map(([k, v, color]) => (
                  <div key={k} style={{ padding:"7px 10px", background:"rgba(0,0,0,0.2)", borderRadius:7, borderLeft:`3px solid ${color}` }}>
                    <div style={{ fontSize:11, color:String(color), fontWeight:800, fontFamily:FONT }}>{k}</div>
                    <div style={{ fontSize:10, color:"#334155", fontFamily:FONT, marginTop:2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Sağ içerik ── */}
            <div style={{ flex:1, overflowY:"auto", padding:"26px 32px", display:"flex", flexDirection:"column", gap:20, background:`radial-gradient(ellipse at 20% 10%,${C}07 0%,${BG} 65%)` }}>

              {/* TARİHSEL DEĞİŞİM */}
              {sec === "tarihsel" && (
                <div style={{ animation:"fadeUp 0.22s ease", display:"flex", flexDirection:"column", gap:18 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                      <span style={{ fontSize:30 }}>⏳</span>
                      <div>
                        <div style={{ fontSize:22, fontWeight:800, color:"#e2e8f0", fontFamily:FONT }}>Nüfusun Tarihsel Değişimi ve Geleceği</div>
                        <div style={{ fontSize:13, color:C3, fontWeight:600, fontFamily:FONT }}>3 büyük sıçrama dönemi · Dünya nüfusunun geleceği</div>
                      </div>
                    </div>
                    <div style={{ height:2, background:`linear-gradient(90deg,${C3},transparent)`, opacity:0.4, borderRadius:2 }} />
                  </div>

                  <div style={{ padding:"16px 20px", background:`${C3}0a`, border:`1.5px solid ${C3}22`, borderRadius:14 }}>
                    <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.95, margin:0, fontFamily:FONT }}>
                      İnsanlık tarihi boyunca dünya nüfusu genellikle artış eğiliminde olmuştur. Başlangıçta düşük olan artış hızı, son birkaç asırda <strong style={{ color:C3 }}>katlanarak artmıştır</strong>. Tarih boyunca üç büyük sıçrama dönemi yaşanmıştır.
                    </p>
                  </div>

                  {/* 3 Sıçrama */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                    {[
                      { no:"1.", baslik:"Birinci Sıçrama", zaman:"~1 milyon yıl önce", ikon:"🪓", color:"#78350f",
                        icerik:"İnsanların çeşitli aletleri icat etmesiyle başladı. Yetersiz beslenme azaldı, vahşi hayvanlarla mücadelede ilerlemeler yaşandı." },
                      { no:"2.", baslik:"İkinci Sıçrama", zaman:"~10.000 yıl önce", ikon:"🌾", color:"#065f46",
                        icerik:"Neolitik Dönem'de tarımsal faaliyetler başladı, yerleşik hayata geçildi. Gıda üretimi arttı; dünyanın ilk şehirleri ortaya çıktı. Nüfus 150-300 milyon düzeyine ulaştı." },
                      { no:"3.", baslik:"Üçüncü Sıçrama", zaman:"18.-20. yüzyıl", ikon:"🏭", color:"#1e3a8a",
                        icerik:"Bilimsel gelişmeler ve Sanayi Devrimi etkisiyle tıp, beslenme ve sağlık koşulları iyileşti. Ölüm oranları düşerken doğum oranları yüksek kaldı. Nüfus 1927'de 2 milyara ulaştı." },
                    ].map(item => (
                      <div key={item.no} style={{ padding:"16px 14px", background:`${item.color}0d`, border:`1.5px solid ${item.color}28`, borderRadius:12 }}>
                        <div style={{ fontSize:26, marginBottom:8 }}>{item.ikon}</div>
                        <div style={{ fontSize:13, fontWeight:800, color:item.color, marginBottom:4, fontFamily:FONT }}>{item.no} {item.baslik}</div>
                        <div style={{ fontSize:11, color:`${item.color}90`, marginBottom:8, fontFamily:MONO }}>{item.zaman}</div>
                        <p style={{ fontSize:12, color:"#64748b", lineHeight:1.75, margin:0, fontFamily:FONT }}>{item.icerik}</p>
                      </div>
                    ))}
                  </div>

                  {/* Çatalhöyük kutusu */}
                  <div style={{ padding:"14px 18px", background:`${C4}08`, border:`1.5px solid ${C4}20`, borderRadius:12 }}>
                    <div style={{ fontSize:11, color:C4, letterSpacing:2, fontWeight:800, marginBottom:8, fontFamily:FONT }}>📍 GERÇEK HAYAT ÖRNEĞİ — ÇATALHÖYÜK</div>
                    <p style={{ fontSize:13, color:"#64748b", lineHeight:1.85, margin:0, fontFamily:FONT }}>
                      Dünyanın bilinen en eski yerleşmelerinden biri olan <strong style={{ color:C4 }}>Çatalhöyük</strong>, Konya'nın Çumra ilçesinde yaklaşık 9.400 yıl önce kuruldu. Tarımsal faaliyetler, teknolojik ilerleme ve sosyoekonomik gelişmelerle hayat şartları iyileşti. En kalabalık döneminde yaklaşık <strong style={{ color:C4 }}>8.000 kişinin</strong> yaşadığı tespit edildi. Sonunda kaynak yetersizliği ve kuraklık nedeniyle terk edildi.
                    </p>
                  </div>

                  {/* Gelecek */}
                  <div style={{ padding:"14px 18px", background:`${C}08`, border:`1px solid ${C}20`, borderRadius:12 }}>
                    <div style={{ fontSize:11, color:C, letterSpacing:2, fontWeight:800, marginBottom:8, fontFamily:FONT }}>🔭 DÜNYA NÜFUSUNUN GELECEĞİ</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                      {[["2022","8 milyar",C],["2037","9 milyar (tahmini)",C3],["2058","10 milyar (tahmini)",C4],["2100","9-13 milyar (UNFPA)",C2]].slice(0,4).map(([y,v,c]) => (
                        <div key={y} style={{ padding:"10px", background:"rgba(0,0,0,0.25)", borderRadius:8, textAlign:"center" }}>
                          <div style={{ fontSize:11, color:"#475569", fontFamily:MONO, marginBottom:4 }}>{y}</div>
                          <div style={{ fontSize:13, fontWeight:800, color:String(c), fontFamily:MONO }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize:12, color:"#475569", lineHeight:1.8, margin:"12px 0 0", fontFamily:FONT }}>
                      Nüfus değişimleri birçok değişkenin etkisi altında olduğundan tahminlerde bulunmak güçtür. Mevcut eğilimler çerçevesinde UNFPA, 2100 yılında dünya nüfusunun 9-13 milyar arasında olacağını öngörmektedir.
                    </p>
                  </div>
                </div>
              )}

              {/* NÜFUS DAĞILIŞI */}
              {sec === "dagilisi" && (
                <div style={{ animation:"fadeUp 0.22s ease", display:"flex", flexDirection:"column", gap:18 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                      <span style={{ fontSize:30 }}>🗺️</span>
                      <div>
                        <div style={{ fontSize:22, fontWeight:800, color:"#e2e8f0", fontFamily:FONT }}>Nüfusun Dağılışı ve Yoğunluğu</div>
                        <div style={{ fontSize:13, color:C2, fontWeight:600, fontFamily:FONT }}>Kalabalık alanlar · Tenha alanlar · Etki eden faktörler</div>
                      </div>
                    </div>
                    <div style={{ height:2, background:`linear-gradient(90deg,${C2},transparent)`, opacity:0.4, borderRadius:2 }} />
                  </div>

                  <div style={{ padding:"14px 18px", background:`${C2}0a`, border:`1.5px solid ${C2}22`, borderRadius:12 }}>
                    <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.9, margin:0, fontFamily:FONT }}>
                      Dünya nüfusu yeryüzüne eşit dağılmamıştır. <strong style={{ color:C2 }}>Nüfus yoğunluğu</strong>; birim alana düşen kişi sayısını ifade eder. Kalabalık ve tenha alanlar doğal, beşerî ve ekonomik faktörlerin bileşimiyle şekillenir.
                    </p>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                    {[
                      {
                        baslik:"🏙️ Nüfusun Yoğun Olduğu Alanlar", color:C5,
                        icerik:[
                          "Verimli alüvyal ovalar (Nil Deltası, Ganj Ovası)",
                          "Ilıman iklim kuşakları",
                          "Sanayi ve ticaret merkezleri",
                          "Ulaşım ağlarının kesişim noktaları",
                          "Delta ve ova kıyı kesimleri",
                          "Enerji ve hammadde kaynaklarına yakın alanlar",
                        ],
                      },
                      {
                        baslik:"🏔️ Nüfusun Seyrek Olduğu Alanlar", color:"#94a3b8",
                        icerik:[
                          "Kutup bölgeleri ve tundra kuşağı",
                          "Yüksek dağlık araziler",
                          "Çöl ve yarı kurak alanlar",
                          "Yoğun tropikal ormanlar",
                          "Olumsuz iklim koşullarına sahip bölgeler",
                          "Tarıma elverişsiz topraklar",
                        ],
                      },
                    ].map(item => (
                      <div key={item.baslik} style={{ padding:"14px 16px", background:`${item.color}08`, border:`1.5px solid ${item.color}22`, borderRadius:12 }}>
                        <div style={{ fontSize:13, fontWeight:800, color:item.color, marginBottom:10, fontFamily:FONT }}>{item.baslik}</div>
                        {item.icerik.map(s => (
                          <div key={s} style={{ fontSize:12, color:"#64748b", lineHeight:1.75, fontFamily:FONT, paddingLeft:8, borderLeft:`2px solid ${item.color}50`, marginBottom:5 }}>{s}</div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Faktörler tablosu */}
                  <div style={{ padding:"14px 16px", background:"rgba(0,0,0,0.28)", border:`1px solid ${C2}15`, borderRadius:12 }}>
                    <div style={{ fontSize:11, color:C2, letterSpacing:2, fontWeight:800, marginBottom:12, fontFamily:FONT }}>NÜFUS DAĞILIŞINI ETKİLEYEN FAKTÖRLER</div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                      {[
                        {kat:"Doğal Faktörler",color:"#065f46",maddeler:["İklim","Yer şekilleri","Su kaynakları","Toprak verimliliği","Doğal afet riski"]},
                        {kat:"Beşerî Faktörler",color:"#4c1d95",maddeler:["Tarihsel yerleşim","Siyasi sınırlar","Kültürel yapı","Göç hareketleri","Savaş ve çatışmalar"]},
                        {kat:"Ekonomik Faktörler",color:"#92400e",maddeler:["Sanayileşme","Tarım potansiyeli","Hammadde zenginliği","Ticaret güzergâhları","İstihdam olanakları"]},
                      ].map(item => (
                        <div key={item.kat} style={{ padding:"12px", background:`${item.color}0d`, border:`1px solid ${item.color}28`, borderRadius:9 }}>
                          <div style={{ fontSize:11, color:item.color, fontWeight:800, marginBottom:8, fontFamily:FONT }}>{item.kat}</div>
                          {item.maddeler.map(m => (
                            <div key={m} style={{ fontSize:11, color:"#475569", fontFamily:FONT, marginBottom:4, paddingLeft:6, borderLeft:`1.5px solid ${item.color}50` }}>{m}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* GÖÇ */}
              {sec === "goc" && (
                <div style={{ animation:"fadeUp 0.22s ease", display:"flex", flexDirection:"column", gap:18 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                      <span style={{ fontSize:30 }}>✈️</span>
                      <div>
                        <div style={{ fontSize:22, fontWeight:800, color:"#e2e8f0", fontFamily:FONT }}>Nüfus Hareketleri ve Göç</div>
                        <div style={{ fontSize:13, color:C4, fontWeight:600, fontFamily:FONT }}>İç göç · Dış göç · İtici & çekici faktörler</div>
                      </div>
                    </div>
                    <div style={{ height:2, background:`linear-gradient(90deg,${C4},transparent)`, opacity:0.4, borderRadius:2 }} />
                  </div>

                  <div style={{ padding:"14px 18px", background:`${C4}0a`, border:`1.5px solid ${C4}22`, borderRadius:12 }}>
                    <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.9, margin:0, fontFamily:FONT }}>
                      <strong style={{ color:C4 }}>Göç</strong>; bireylerin veya toplulukların belirli nedenlerle bir yerden başka bir yere kalıcı ya da geçici olarak yer değiştirmesidir. Göç, nüfusun dağılışını, yapısını ve büyüklüğünü doğrudan etkiler.
                    </p>
                  </div>

                  {/* Göç türleri */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    {[
                      { tip:"İç Göç", icon:"🏙️", color:C3, aciklama:"Ülke sınırları içinde gerçekleşen yer değiştirmedir. Genellikle kırdan kente doğru yaşanır. Türkiye'de 1950 sonrası hızlanan sanayileşmeyle iç göç yoğunlaşmıştır." },
                      { tip:"Dış Göç", icon:"🌐", color:C2, aciklama:"Ülke sınırları dışına çıkılan yer değiştirmedir. İşgücü göçü, mülteci göçü ve beyin göçü bu kapsamda değerlendirilir." },
                      { tip:"Zorunlu Göç", icon:"⚠️", color:C5, aciklama:"Savaş, doğal afet veya siyasi baskı gibi dışsal nedenlerle kişilerin yurtlarını terk etmek zorunda kaldığı göç türüdür. Mülteci ve sığınmacı hareketleri bu gruba girer." },
                      { tip:"Gönüllü Göç", icon:"✔️", color:C4, aciklama:"İnsanların ekonomik, sosyal veya kişisel nedenlerle kendi istekleriyle gerçekleştirdiği yer değiştirmedir. İş arayışı, eğitim ve daha iyi yaşam koşulları başlıca nedenlerdir." },
                    ].map(item => (
                      <div key={item.tip} style={{ padding:"14px 16px", background:`${item.color}08`, border:`1.5px solid ${item.color}22`, borderRadius:11, display:"flex", gap:12, alignItems:"flex-start" }}>
                        <span style={{ fontSize:22, flexShrink:0 }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize:13, fontWeight:800, color:item.color, marginBottom:6, fontFamily:FONT }}>{item.tip}</div>
                          <p style={{ fontSize:12, color:"#475569", lineHeight:1.75, margin:0, fontFamily:FONT }}>{item.aciklama}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* İtici-çekici özet */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <div style={{ padding:"14px 16px", background:`${C5}08`, border:`1.5px solid ${C5}22`, borderRadius:11 }}>
                      <div style={{ fontSize:12, color:C5, fontWeight:800, letterSpacing:1.5, marginBottom:10, fontFamily:FONT }}>↩ İTİCİ FAKTÖRLER</div>
                      {["İşsizlik ve yoksulluk","Doğal afetler (deprem, sel)","Siyasi baskı, çatışma","Tarım arazisi yetersizliği","Çevre kirliliği"].map(s => (
                        <div key={s} style={{ fontSize:12, color:"#64748b", fontFamily:FONT, paddingLeft:8, borderLeft:`2px solid ${C5}50`, marginBottom:5 }}>{s}</div>
                      ))}
                    </div>
                    <div style={{ padding:"14px 16px", background:`${C4}08`, border:`1.5px solid ${C4}22`, borderRadius:11 }}>
                      <div style={{ fontSize:12, color:C4, fontWeight:800, letterSpacing:1.5, marginBottom:10, fontFamily:FONT }}>↪ ÇEKİCİ FAKTÖRLER</div>
                      {["Daha yüksek ücret ve istihdam","Nitelikli sağlık & eğitim","Güvenli yaşam koşulları","Kentsel altyapı hizmetleri","Hemşehri ağının varlığı"].map(s => (
                        <div key={s} style={{ fontSize:12, color:"#64748b", fontFamily:FONT, paddingLeft:8, borderLeft:`2px solid ${C4}50`, marginBottom:5 }}>{s}</div>
                      ))}
                    </div>
                  </div>

                  {/* Göçün etkileri */}
                  <div style={{ padding:"13px 16px", background:"rgba(0,0,0,0.25)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10 }}>
                    <div style={{ fontSize:11, color:C3, letterSpacing:2, fontWeight:800, marginBottom:8, fontFamily:FONT }}>⚡ GÖÇÜN SONUÇLARI</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                      {[
                        ["Göç veren bölge","Nüfus yaşlanır, işgücü azalır, ekonomi zayıflar",C5],
                        ["Göç alan bölge","Nüfus gençleşir, işgücü artar, konut/altyapı baskısı oluşur",C4],
                        ["Türkiye iç göçü","Batı ve kıyı kentler büyürken Doğu Anadolu nüfus kaybeder",C2],
                        ["Beyin göçü","Nitelikli işgücünün yurt dışına çıkması ulusal gelişimi yavaşlatır",C3],
                      ].map(([baslik, aciklama, color]) => (
                        <div key={String(baslik)} style={{ padding:"9px 11px", background:`${color}08`, border:`1px solid ${color}20`, borderRadius:8 }}>
                          <div style={{ fontSize:11, color:String(color), fontWeight:800, fontFamily:FONT, marginBottom:3 }}>{baslik}</div>
                          <div style={{ fontSize:11, color:"#475569", fontFamily:FONT, lineHeight:1.65 }}>{aciklama}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* DEMOGRAFİK DÖNÜŞÜM */}
              {sec === "demografik" && (
                <div style={{ animation:"fadeUp 0.22s ease", display:"flex", flexDirection:"column", gap:18 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                      <span style={{ fontSize:30 }}>📊</span>
                      <div>
                        <div style={{ fontSize:22, fontWeight:800, color:"#e2e8f0", fontFamily:FONT }}>Demografik Dönüşüm Süreci</div>
                        <div style={{ fontSize:13, color:C, fontWeight:600, fontFamily:FONT }}>Doğum & ölüm oranlarının tarihsel dönüşümü — 5 evre</div>
                      </div>
                    </div>
                    <div style={{ height:2, background:`linear-gradient(90deg,${C},transparent)`, opacity:0.4, borderRadius:2 }} />
                  </div>

                  <div style={{ padding:"14px 18px", background:`${C}0a`, border:`1.5px solid ${C}22`, borderRadius:12 }}>
                    <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.9, margin:0, fontFamily:FONT }}>
                      <strong style={{ color:C }}>Demografik dönüşüm modeli</strong>, toplumların sanayileşme sürecinde doğum ve ölüm oranlarının nasıl değiştiğini ve bu değişimin nüfus büyüklüğünü nasıl etkilediğini açıklar. Model genellikle <strong style={{ color:"#e2e8f0" }}>5 evre</strong> üzerinden tanımlanır.
                    </p>
                  </div>

                  {/* Grafik */}
                  <div style={{ padding:"14px 16px", background:"rgba(0,0,0,0.3)", border:"1px solid rgba(139,92,246,0.18)", borderRadius:12 }}>
                    <div style={{ fontSize:11, color:C, letterSpacing:2, fontWeight:800, marginBottom:12, fontFamily:FONT }}>DEMOGRAFİK DÖNÜŞÜM GRAFİĞİ — Evre Seç</div>
                    <DemografikDonusumSVG activeEvre={activeEvre} />
                  </div>

                  {/* Evre seçici */}
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {EVRELER.map((ev, i) => (
                      <button key={i} onClick={() => { sndClick(); setActiveEvre(i); }}
                        style={{
                          padding:"8px 14px",
                          background: activeEvre === i ? `${ev.color}22` : `${ev.color}08`,
                          border: `1.5px solid ${activeEvre === i ? ev.color : `${ev.color}28`}`,
                          borderRadius:9, cursor:"pointer", fontSize:12, fontWeight:800,
                          color: activeEvre === i ? ev.color : "#475569",
                          fontFamily:FONT, transition:"all 0.2s",
                        }}>
                        {ev.no}. Evre
                      </button>
                    ))}
                  </div>

                  {/* Seçili evre detayı */}
                  {(() => {
                    const ev = EVRELER[activeEvre];
                    return (
                      <div style={{ padding:"16px 18px", background:`${ev.color}0d`, border:`1.5px solid ${ev.color}28`, borderRadius:12, animation:"fadeUp 0.2s ease" }}>
                        <div style={{ fontSize:16, fontWeight:800, color:ev.color, marginBottom:10, fontFamily:FONT }}>{ev.ad}</div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
                          {[["Doğum Oranı", ev.dogum, C5], ["Ölüm Oranı", ev.olum, C2], ["Nüfus Artışı", ev.artis, C4]].map(([k, v, c]) => (
                            <div key={String(k)} style={{ padding:"9px 11px", background:"rgba(0,0,0,0.25)", borderRadius:8, textAlign:"center" }}>
                              <div style={{ fontSize:10, color:String(c), fontWeight:800, fontFamily:FONT, marginBottom:3 }}>{k}</div>
                              <div style={{ fontSize:12, fontWeight:700, color:"#94a3b8", fontFamily:FONT }}>{v}</div>
                            </div>
                          ))}
                        </div>
                        <p style={{ fontSize:13, color:"#94a3b8", lineHeight:1.85, margin:"0 0 10px", fontFamily:FONT }}>{ev.aciklama}</p>
                        <div style={{ fontSize:11, color:ev.color, fontFamily:FONT, padding:"7px 10px", background:`${ev.color}10`, borderRadius:7 }}>
                          📍 Örnek: {ev.ornek}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* NÜFUS PİRAMİTLERİ */}
              {sec === "piramitler" && (
                <div style={{ animation:"fadeUp 0.22s ease", display:"flex", flexDirection:"column", gap:18 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                      <span style={{ fontSize:30 }}>🔼</span>
                      <div>
                        <div style={{ fontSize:22, fontWeight:800, color:"#e2e8f0", fontFamily:FONT }}>Nüfus Piramitleri</div>
                        <div style={{ fontSize:13, color:C3, fontWeight:600, fontFamily:FONT }}>Genişleyen · Durağan · Daralan/Yaşlanan</div>
                      </div>
                    </div>
                    <div style={{ height:2, background:`linear-gradient(90deg,${C3},transparent)`, opacity:0.4, borderRadius:2 }} />
                  </div>

                  <div style={{ padding:"14px 18px", background:`${C3}0a`, border:`1.5px solid ${C3}22`, borderRadius:12 }}>
                    <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.9, margin:0, fontFamily:FONT }}>
                      <strong style={{ color:C3 }}>Nüfus piramidi</strong>, bir ülkenin yaş ve cinsiyet yapısını görsel olarak gösteren grafiktir. Yatay çubuklar her yaş grubunun nüfustaki payını, sol taraf kadın, sağ taraf erkek nüfusu gösterir. Piramit şekli ülkenin demografik yapısı hakkında önemli bilgiler sunar.
                    </p>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
                    {[
                      {
                        tip: "genis" as const, baslik:"Genişleyen Piramit (Üçgen)", color:C5,
                        ozellik:"Geniş taban — yüksek doğum oranı",
                        detay:["Yüksek doğum oranı","Genç nüfus baskın","Hızlı nüfus büyümesi","Az gelişmiş ülkelerde görülür","Bağımlılık oranı yüksek"],
                        ornek:"Nijerya, Etiyopya, Afganistan",
                      },
                      {
                        tip: "dik" as const, baslik:"Durağan Piramit (Silindir)", color:C4,
                        ozellik:"Dengeli yapı — oranlar birbirine yakın",
                        detay:["Düşük doğum & ölüm oranı","Dengeli yaş dağılımı","Yavaş nüfus artışı","Gelişmiş ülkelerde görülür","Orta bağımlılık oranı"],
                        ornek:"ABD (bazı dönemler), İsveç",
                      },
                      {
                        tip: "yaşli" as const, baslik:"Yaşlanan Piramit (Ters Üçgen)", color:C,
                        ozellik:"Dar taban — çok düşük doğum oranı",
                        detay:["Çok düşük doğum oranı","Yaşlı nüfus ağırlıklı","Nüfus durağan/azalıyor","Gelişmiş Avrupa ülkeleri","Emeklilik sistemi baskısı"],
                        ornek:"Japonya, Almanya, İtalya",
                      },
                    ].map(item => (
                      <div key={item.tip} style={{ display:"flex", flexDirection:"column", gap:10 }}>
                        <div style={{ padding:"12px", background:`${item.color}08`, border:`1.5px solid ${item.color}22`, borderRadius:11, textAlign:"center" }}>
                          <div style={{ fontSize:12, fontWeight:800, color:item.color, marginBottom:4, fontFamily:FONT }}>{item.baslik}</div>
                          <div style={{ fontSize:10, color:`${item.color}80`, marginBottom:8, fontFamily:FONT }}>{item.ozellik}</div>
                          <NufusPiramidi tip={item.tip} />
                        </div>
                        <div style={{ padding:"10px 12px", background:"rgba(0,0,0,0.22)", borderRadius:9 }}>
                          {item.detay.map(d => (
                            <div key={d} style={{ fontSize:11, color:"#475569", fontFamily:FONT, paddingLeft:7, borderLeft:`2px solid ${item.color}50`, marginBottom:4, lineHeight:1.6 }}>{d}</div>
                          ))}
                          <div style={{ fontSize:10, color:item.color, marginTop:6, fontFamily:MONO }}>📍 {item.ornek}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Türkiye nüfus piramidi notu */}
                  <div style={{ padding:"13px 16px", background:`${C2}08`, border:`1px solid ${C2}18`, borderRadius:10 }}>
                    <div style={{ fontSize:11, color:C2, letterSpacing:2, fontWeight:800, marginBottom:8, fontFamily:FONT }}>🇹🇷 TÜRKİYE NÜFUS PİRAMİDİ DEĞİŞİMİ</div>
                    <p style={{ fontSize:13, color:"#64748b", lineHeight:1.85, margin:0, fontFamily:FONT }}>
                      Türkiye, tarihsel süreçte genişleyen piramit yapısından durağan piramit yapısına geçmektedir. 1980'lerde geniş tabanlı üçgen yapı hâkimken günümüzde doğum oranlarının düşmesi nedeniyle taban daralmaktadır. TÜİK projeksiyonlarına göre orta ve uzun vadede piramit daralan/yaşlanan nüfus yapısına yaklaşacaktır.
                    </p>
                  </div>
                </div>
              )}

              {/* NÜFUS POLİTİKALARI */}
              {sec === "politikalar" && (
                <div style={{ animation:"fadeUp 0.22s ease", display:"flex", flexDirection:"column", gap:18 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                      <span style={{ fontSize:30 }}>⚖️</span>
                      <div>
                        <div style={{ fontSize:22, fontWeight:800, color:"#e2e8f0", fontFamily:FONT }}>Nüfus Politikaları</div>
                        <div style={{ fontSize:13, color:C5, fontWeight:600, fontFamily:FONT }}>Pro-natalist · Anti-natalist · Optimum nüfus</div>
                      </div>
                    </div>
                    <div style={{ height:2, background:`linear-gradient(90deg,${C5},transparent)`, opacity:0.4, borderRadius:2 }} />
                  </div>

                  <div style={{ padding:"14px 18px", background:`${C5}0a`, border:`1.5px solid ${C5}22`, borderRadius:12 }}>
                    <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.9, margin:0, fontFamily:FONT }}>
                      <strong style={{ color:C5 }}>Nüfus politikası</strong>; hükümetlerin bir ülkedeki nüfusun miktarını, yapısını veya dağılışını belirli hedefler doğrultusunda yönlendirmeye çalıştığı uygulamaların bütünüdür. Nüfus fırsatları ve sorunları nüfus politikalarını doğrudan etkiler.
                    </p>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                    {[
                      {
                        tip:"PRO-NATALİST POLİTİKA", icon:"👶", color:C4,
                        tanim:"Nüfus artışını teşvik eden politikalardır. Doğum oranını artırmaya yönelik teşvik ve destekleri kapsar.",
                        araclar:["Doğum izni ve ücretli ebeveyn izni","Çocuk yardımı ve vergi indirimi","Kreş ve çocuk bakım teşviki","Konut ve eğitim sübvansiyonu","Aile kurmaya yönelik devlet desteği"],
                        sebep:"Düşük doğum oranı, yaşlanan nüfus, işgücü açığı",
                        ornek:"Fransa, İsveç, Japonya, Türkiye (son dönem)",
                      },
                      {
                        tip:"ANTİ-NATALİST POLİTİKA", icon:"🚫", color:C5,
                        tanim:"Nüfus artışını yavaşlatan veya durdurmayı amaçlayan politikalardır. Doğum oranını düşürmeye yönelik uygulamaları kapsar.",
                        araclar:["Aile planlaması hizmetleri","Çocuk sayısı sınırlandırması","Kontrasepsiyon desteği","Kadın eğitimine yatırım","Kentleşme ve kalkınma programları"],
                        sebep:"Hızlı nüfus artışı, kaynak yetersizliği, gıda güvenliği endişesi",
                        ornek:"Çin (tek çocuk politikası), Hindistan, Bangladeş",
                      },
                    ].map(item => (
                      <div key={item.tip} style={{ padding:"14px 16px", background:`${item.color}08`, border:`1.5px solid ${item.color}22`, borderRadius:12 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                          <span style={{ fontSize:24 }}>{item.icon}</span>
                          <div style={{ fontSize:13, fontWeight:800, color:item.color, fontFamily:FONT }}>{item.tip}</div>
                        </div>
                        <p style={{ fontSize:12, color:"#64748b", lineHeight:1.75, margin:"0 0 10px", fontFamily:FONT }}>{item.tanim}</p>
                        <div style={{ fontSize:10, color:item.color, fontWeight:800, letterSpacing:1.5, marginBottom:6, fontFamily:FONT }}>ARAÇLAR</div>
                        {item.araclar.map(a => (
                          <div key={a} style={{ fontSize:11, color:"#475569", fontFamily:FONT, paddingLeft:7, borderLeft:`2px solid ${item.color}50`, marginBottom:4 }}>{a}</div>
                        ))}
                        <div style={{ marginTop:10, padding:"8px 10px", background:`${item.color}0d`, borderRadius:7, fontSize:11, fontFamily:FONT }}>
                          <div style={{ color:item.color, fontWeight:800, marginBottom:3 }}>Neden uygulanır?</div>
                          <div style={{ color:"#64748b" }}>{item.sebep}</div>
                          <div style={{ color:item.color, marginTop:4 }}>📍 {item.ornek}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Türkiye nüfus politikası */}
                  <div style={{ padding:"14px 16px", background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:10 }}>
                    <div style={{ fontSize:11, color:C3, letterSpacing:2, fontWeight:800, marginBottom:8, fontFamily:FONT }}>🇹🇷 TÜRKİYE NÜFUS POLİTİKASININ TARİHSEL DEĞİŞİMİ</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {[
                        ["1923-1965","Pro-natalist","Nüfusu artırmak için çok çocuğa teşvik edildi.","#166534"],
                        ["1965-2000","Anti-natalist","Hızlı nüfus artışı nedeniyle aile planlaması desteklendi.","#b45309"],
                        ["2000-günümüz","Pro-natalist","Düşen doğum oranları ve yaşlanan nüfus nedeniyle 3 çocuk teşviki başladı.","#166534"],
                      ].map(([dönem, tip, aciklama, color]) => (
                        <div key={String(dönem)} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                          <div style={{ minWidth:80, fontSize:11, color:C3, fontFamily:MONO, fontWeight:700, flexShrink:0 }}>{dönem}</div>
                          <div style={{ padding:"6px 10px", background:`${color}0d`, border:`1px solid ${color}28`, borderRadius:7, flex:1 }}>
                            <div style={{ fontSize:11, color:String(color), fontWeight:800, fontFamily:FONT, marginBottom:2 }}>{tip}</div>
                            <div style={{ fontSize:11, color:"#475569", fontFamily:FONT }}>{aciklama}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ══ ETKİNLİK ══ */}
        {tab === "act" && (
          <div style={{ flex:1, overflowY:"auto", padding:"24px 28px", background:`radial-gradient(ellipse at 5% 5%,${C}05 0%,${BG} 60%)` }}>
            <GocAktivite />
          </div>
        )}

        {/* ══ TEST ══ */}
        {tab === "test" && (
          <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
            <TestTab />
          </div>
        )}

      </div>
    </div>
  );
}