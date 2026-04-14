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
const sndOK    = () => [440, 554, 660].forEach((f, i) => setTimeout(() => beep(f, 0.22, "sine", 0.13), i * 80));
const sndFail  = () => beep(200, 0.30, "sawtooth", 0.12);
const sndClick = () => beep(680, 0.07, "square", 0.06);
const sndDrop  = () => beep(520, 0.12, "sine", 0.10);

/* ─── Stil sabitleri ─────────────────────────────────────────────────────── */
const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const MONO = "'Courier New',Courier,monospace";
const BG   = "#0d0f07";
const C    = "#eab308";   // sarı/altın — ekonomi ana renk
const C2   = "#22c55e";   // yeşil  — tarım / toprak
const C3   = "#38bdf8";   // sky    — su / ulaşım
const C4   = "#f97316";   // turuncu— sanayi / enerji
const C5   = "#e879f9";   // fuşya  — turizm

type Tab      = "learn" | "act" | "test";
type LearnSec = "tanim" | "konum" | "iklim" | "topografya" | "su" | "toprak" | "bitki" | "maden";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VERİ: Doğal Faktör → Etkilenen Faaliyet Kartları (Aktivite)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
interface AK { id: string; faktor: string; faktorIkon: string; faaliyet: string; }
const AKTIVITE_KARTI: AK[] = [
  { id: "a1",  faktor: "Ilıman ve yağışlı iklim",          faktorIkon: "🌤", faaliyet: "tarım"    },
  { id: "a2",  faktor: "Verimli alüvyal ovalar",           faktorIkon: "🌾", faaliyet: "tarım"    },
  { id: "a3",  faktor: "Geniş ve sık ormanlar",            faktorIkon: "🌲", faaliyet: "sanayi"   },
  { id: "a4",  faktor: "Taş kömürü ve demir yatakları",    faktorIkon: "⛏",  faaliyet: "sanayi"   },
  { id: "a5",  faktor: "Geniş nehirler ve koylar",         faktorIkon: "🚢", faaliyet: "ulasim"   },
  { id: "a6",  faktor: "Elverişli topoğrafya (kıyı ovası)",faktorIkon: "🏗",  faaliyet: "ulasim"   },
  { id: "a7",  faktor: "Peribacası ve mağara gibi doğal güzellikler", faktorIkon: "🗿", faaliyet: "turizm"   },
  { id: "a8",  faktor: "Ilıman deniz kıyısı ve temiz plajlar",        faktorIkon: "🏖", faaliyet: "turizm"   },
  { id: "a9",  faktor: "Bol akarsular ve yüksek rakım farkı",         faktorIkon: "💧", faaliyet: "enerji"   },
  { id: "a10", faktor: "Sürekli ve güçlü rüzgâr koşulları",           faktorIkon: "💨", faaliyet: "enerji"   },
  { id: "a11", faktor: "Geniş doğal meradaki otlaklar",               faktorIkon: "🐄", faaliyet: "tarim2"  },
  { id: "a12", faktor: "Kil ve seramik hammaddesi içeren toprak",      faktorIkon: "🏺", faaliyet: "sanayi"  },
];

const KOVA_TANIMLARI = [
  { id: "tarım",   label: "Tarım", ikon: "🌿", color: C2,   acikl: "Bitkisel & hayvansal üretim" },
  { id: "tarim2",  label: "Hayvancılık", ikon: "🐑", color: "#86efac", acikl: "Otlatma & yem üretimi" },
  { id: "sanayi",  label: "Sanayi", ikon: "🏭", color: C4,  acikl: "İmalat & ham madde işleme" },
  { id: "ulasim",  label: "Ulaşım", ikon: "⛵", color: C3,  acikl: "Kara, deniz, hava yolları" },
  { id: "turizm",  label: "Turizm", ikon: "🗺", color: C5,  acikl: "Rekreasyon & ziyaret" },
  { id: "enerji",  label: "Enerji", ikon: "⚡", color: C,   acikl: "HES, rüzgâr, güneş" },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TEST SORULARI
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const TEST_ITEMS = [
  {
    q: "Ekonomik faaliyet kavramı en kapsamlı biçimde nasıl tanımlanır?",
    opts: [
      "Yalnızca fabrikada gerçekleştirilen üretim süreci",
      "İnsanların gelir elde etmek ve refah seviyelerini yükseltmek için yaptıkları üretim, dağıtım ve tüketim faaliyetlerinin tümü",
      "Devletin vergi toplamak için kullandığı ekonomik araçlar",
      "Uluslararası ticaret ve gümrük işlemleri",
    ],
    ans: 1,
    ac: "Ekonomik faaliyet; insanların gelir elde etmek ve refah seviyelerini yükseltmek için yaptıkları çalışmaları kapsar ve üretim, dağıtım ile tüketim süreçlerini içerir.",
  },
  {
    q: "Coğrafi konumun ekonomik faaliyetler üzerindeki etkisine en iyi örnek aşağıdakilerden hangisidir?",
    opts: [
      "Bir ülkedeki eğitim düzeyinin yükselmesi",
      "Türkiye'nin büyük ticaret yollarının kavşağında bulunması nedeniyle uluslararası ticarette avantaj sağlaması",
      "Nüfusun artmasıyla iş gücünün çoğalması",
      "Sermaye yatırımlarının teknolojik gelişmeyi hızlandırması",
    ],
    ans: 1,
    ac: "Coğrafi konum; ticaret yollarına, doğal kaynaklara ve küresel pazarlara erişimi belirler. Türkiye, büyük ticaret yollarının kavşağında bulunduğu için uluslararası ticarette stratejik avantaj elde etmektedir.",
  },
  {
    q: "İklimin tarım dışında hangi ekonomik faaliyeti doğrudan etkilediği söylenebilir?",
    opts: ["Madencilik", "Turizm", "Bankacılık", "İthalat-ihracat"],
    ans: 1,
    ac: "İklim; sıcaklık, yağış ve mevsimsellik gibi özelliklerle turizm faaliyetlerini doğrudan etkiler. Ilıman ve güneşli kıyılar turizmi teşvik ederken soğuk iklimler kış turizmini destekler.",
  },
  {
    q: "Topoğrafik özelliklerin liman gelişimine katkısına örnek aşağıdakilerden hangisidir?",
    opts: [
      "Yüksek platolar üzerinde büyük havalimanlarının kurulması",
      "Elverişli koy ve korunaklı kıyıların büyük limanlara ev sahipliği yapması",
      "Dağlık arazilerin yoğun sanayi bölgeleri oluşturması",
      "Engebeli arazilerde verimli tarım yapılması",
    ],
    ans: 1,
    ac: "Topoğrafik açıdan elverişli, korunaklı koy ve körfezler liman kurulmasına imkân tanır. Hamburg gibi büyük limanlar bu tür coğrafi avantajlardan yararlanır.",
  },
  {
    q: "Su kaynaklarının aşağıdaki ekonomik faaliyetlerden hangisiyle ilişkisi yoktur?",
    opts: ["Balıkçılık", "Hidroelektrik enerji", "Madencilik", "Tarımsal sulama"],
    ans: 2,
    ac: "Madencilik faaliyetlerinin gerçekleştirilmesi doğrudan su kaynağına ihtiyaç duymaz; maden yataklarına yakınlık belirleyicidir. Su kaynakları balıkçılık, HES, sulama ve deniz ulaşımını doğrudan etkiler.",
  },
  {
    q: "Toprak kaynağının hem tarım hem de sanayi açısından önemine örnek aşağıdakilerden hangisidir?",
    opts: [
      "Petrol ve doğal gaz çıkarımı",
      "Verimli toprağın tarımı, killi toprağın ise tuğla-kiremit üretimini desteklemesi",
      "Ormanların kâğıt sanayisine ham madde sağlaması",
      "Rüzgârlı arazilerin enerji üretimine katkısı",
    ],
    ans: 1,
    ac: "Toprak; tarımsal üretimin temeliyken kil içerikli topraklar porselen, kiremit ve tuğla gibi sanayi ürünlerinin üretiminde ham madde olarak kullanılır.",
  },
  {
    q: "Bitki örtüsü ile ekonomik faaliyet ilişkisine doğrudan örnek aşağıdakilerden hangisidir?",
    opts: [
      "Nehir boylarının tarım arazisi olarak kullanılması",
      "Ormanların kereste, kâğıt ve mobilya sanayisine ham madde sağlaması",
      "Verimli toprakların sanayi tesisi kuruluşuna zemin oluşturması",
      "Çöl ikliminin turizmi olumsuz etkilemesi",
    ],
    ans: 1,
    ac: "Bitki örtüsü; ormanların kereste, kâğıt ve mobilya üretiminde ham madde kaynağı olması ve mera alanlarının hayvancılığı desteklemesi aracılığıyla ekonomik faaliyetleri doğrudan etkiler.",
  },
  {
    q: "Demir-çelik sanayisi tesislerinin taş kömürü yataklarının yakınına kurulmasının temel nedeni nedir?",
    opts: [
      "Nitelikli iş gücüne yakın olmak",
      "Ulaşım maliyetini düşürmek ve enerji kaynağına yakın olmak",
      "Tarım arazilerinden uzak durmak",
      "İklim koşullarının üretime uygun olması",
    ],
    ans: 1,
    ac: "Sanayi tesisleri makineli üretimde çok fazla enerji tüketir. Taş kömürü başlıca enerji kaynağı olduğundan demir-çelik tesisleri nakliye maliyetini azaltmak için maden yataklarına yakın kurulur.",
  },
  {
    q: "Doğal güzelliklerin (peribacası, şelale, mağara) ekonomik faaliyetlere katkısı en çok hangi sektörde hissedilir?",
    opts: ["Madencilik", "Enerji üretimi", "Turizm", "Balıkçılık"],
    ans: 2,
    ac: "Peribacası (Kapadokya), şelale (Niagara) ve mağara gibi doğal ilgi çekici yeryüzü şekilleri; ziyaretçi çekerek turizm faaliyetlerinin gelişimine zemin hazırlar.",
  },
  {
    q: "Ekonomik faaliyetler, aşağıdaki süreçlerin hangisini kapsamaz?",
    opts: ["Üretim", "Dağıtım", "Tüketim", "Nüfus planlaması"],
    ans: 3,
    ac: "Ekonomik faaliyetler; üretim (malların hazırlanması), dağıtım (malların taşınması) ve tüketim (malların kullanılması) süreçlerini kapsar. Nüfus planlaması bir demografik politika konusudur.",
  },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SVG: Ekonomik Döngü (Üretim → Dağıtım → Tüketim)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function EkonomikDongu() {
  const W = 400, H = 140;
  const nodes = [
    { x: 70,  y: 70, label: "ÜRETİM",   sub: "Ham madde → Ürün",      ikon: "🏭", color: C4 },
    { x: 200, y: 70, label: "DAĞITIM",  sub: "Yerden yere aktarım",    ikon: "🚛", color: C3 },
    { x: 330, y: 70, label: "TÜKETİM", sub: "Kullanıcı tüketimi",      ikon: "🛒", color: C2 },
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
      <defs>
        <marker id="ok1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <polygon points="0,0 6,3 0,6" fill={C} opacity="0.7" />
        </marker>
      </defs>
      {/* Ok çizgileri */}
      <line x1={112} y1={70} x2={148} y2={70} stroke={C} strokeWidth="2" markerEnd="url(#ok1)" opacity="0.7" />
      <line x1={242} y1={70} x2={278} y2={70} stroke={C} strokeWidth="2" markerEnd="url(#ok1)" opacity="0.7" />
      {/* Geri döngü */}
      <path d="M 330,95 Q 200,128 70,95" stroke={`${C}50`} strokeWidth="1.5" fill="none" strokeDasharray="4,3" />
      {nodes.map(n => (
        <g key={n.label}>
          <circle cx={n.x} cy={n.y} r={38} fill={`${n.color}14`} stroke={n.color} strokeWidth="1.5" />
          <text x={n.x} y={n.y - 12} textAnchor="middle" fontSize="18">{n.ikon}</text>
          <text x={n.x} y={n.y + 6} textAnchor="middle" fontSize="8.5" fill={n.color} fontFamily={FONT} fontWeight="800">{n.label}</text>
          <text x={n.x} y={n.y + 18} textAnchor="middle" fontSize="7" fill="#475569" fontFamily={FONT}>{n.sub}</text>
        </g>
      ))}
      <text x={200} y={138} textAnchor="middle" fontSize="7.5" fill="#334155" fontFamily={FONT}>Ekonomik faaliyet döngüsü</text>
    </svg>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SVG: Dünya Gece Işıkları Şematik Harita
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function GeceIsiklariHarita() {
  const hotspots = [
    { cx: 190, cy: 62,  r: 20, label: "Batı Avrupa",     color: C  },
    { cx: 365, cy: 68,  r: 22, label: "Doğu Asya",       color: C  },
    { cx: 80,  cy: 72,  r: 18, label: "Kuzey Amerika",   color: C  },
    { cx: 230, cy: 78,  r: 14, label: "Hindistan",        color: "#fde047" },
    { cx: 210, cy: 95,  r: 10, label: "Nil Vadisi",       color: "#fde047" },
    { cx: 90,  cy: 100, r: 8,  label: "Güney Amerika",   color: "#fde047" },
    { cx: 275, cy: 68,  r: 8,  label: "Körfez",          color: "#fde047" },
    { cx: 330, cy: 130, r: 8,  label: "Avustralya kıyı", color: "#fde047" },
  ];
  return (
    <div>
      <svg viewBox="0 0 460 170" style={{ width: "100%", maxWidth: 460, borderRadius: 10, border: `1px solid ${C}20` }}>
        <rect width="460" height="170" fill="#050810" rx="8" />
        {/* Kıta şekilleri */}
        <ellipse cx="190" cy="85" rx="72" ry="52" fill="#0f1a14" opacity="0.8" />
        <ellipse cx="90"  cy="82" rx="55" ry="42" fill="#0f1a14" opacity="0.8" />
        <ellipse cx="80"  cy="108" rx="42" ry="28" fill="#0f1a14" opacity="0.8" />
        <ellipse cx="340" cy="88" rx="90" ry="62" fill="#0f1a14" opacity="0.8" />
        <ellipse cx="385" cy="140" rx="32" ry="20" fill="#0f1a14" opacity="0.8" />
        {hotspots.map(h => (
          <g key={h.label}>
            <circle cx={h.cx} cy={h.cy} r={h.r + 4} fill={h.color} opacity="0.08" />
            <circle cx={h.cx} cy={h.cy} r={h.r} fill={h.color} opacity="0.35" />
            <circle cx={h.cx} cy={h.cy} r={h.r * 0.4} fill={h.color} opacity="0.9" />
          </g>
        ))}
        {/* Ekvator */}
        <line x1="0" y1="110" x2="460" y2="110" stroke={`${C}30`} strokeWidth="0.7" strokeDasharray="4,4" />
        <text x="6" y="108" fontSize="6.5" fill={`${C}60`} fontFamily={FONT}>Ekvator</text>
        {/* Lejant */}
        <circle cx="14" cy="155" r="5" fill={C} opacity="0.7" />
        <text x="23" y="159" fontSize="7" fill="#64748b" fontFamily={FONT}>Yüksek ekonomik aktivite</text>
        <circle cx="140" cy="155" r="5" fill="#fde047" opacity="0.5" />
        <text x="149" y="159" fontSize="7" fill="#64748b" fontFamily={FONT}>Orta ekonomik aktivite</text>
      </svg>
      <div style={{ fontSize: 10, color: "#334155", marginTop: 5, textAlign: "center", fontFamily: FONT }}>
        Gece ışıklarının küresel dağılımı — ekonomik gelişmişliğin göstergesi
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BILEŞEN: Aktivite — Faktörü Ekonomik Faaliyetle Eşleştir
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function FaktorFaaliyetAktivite() {
  const [shuffled] = useState<AK[]>(() => {
    const a = [...AKTIVITE_KARTI];
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
    const ok = item.faaliyet === bid;
    sndDrop(); if (ok) { sndOK(); setScore(s => s + 1); } else sndFail();
    const np = { ...placed, [dragId]: bid };
    const nw = { ...wrong, [dragId]: !ok };
    setPlaced(np); setWrong(nw); setDragId(null); setHovBuck(null);
    if (Object.keys(np).length === shuffled.length) setTimeout(() => setDone(true), 400);
  };
  const retry = () => { setPlaced({}); setWrong({}); setScore(0); setDone(false); setDragId(null); };

  if (done) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 52 }}>🌍</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#e2e8f0", fontFamily: FONT }}>Eşleştirme Tamamlandı!</div>
      <div style={{ fontSize: 52, fontWeight: 800, color: score >= 10 ? C2 : C, fontFamily: MONO }}>{score}/{shuffled.length}</div>
      <div style={{ fontSize: 14, color: "#475569", fontFamily: FONT }}>doğru eşleştirme</div>
      <div style={{ fontSize: 13, color: score >= 10 ? C2 : "#f97316", fontFamily: FONT, maxWidth: 300, lineHeight: 1.5 }}>
        {score >= 10 ? "🎉 Harika! Doğal faktörlerin ekonomik faaliyetlerle ilişkisini tam kavramışsın." : "Doğal faktörleri tekrar inceleyerek hangi faaliyeti etkilediğini pekiştir."}
      </div>
      <button onClick={retry}
        style={{ padding: "12px 28px", background: `linear-gradient(90deg,#1a1200,${C})`, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: FONT, marginTop: 4 }}>
        🔄 Tekrar Dene
      </button>
    </div>
  );

  const pending = shuffled.filter(m => !placed[m.id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontSize: 10, color: C, letterSpacing: 3, fontWeight: 800, fontFamily: MONO, marginBottom: 4 }}>ETKİNLİK</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#e2e8f0", fontFamily: FONT }}>🌍 Doğal Faktörü Ekonomik Faaliyetle Eşleştir</div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 3, fontFamily: FONT }}>Her faktörü ilgili ekonomik faaliyet kategorisine sürükle bırak</div>
      </div>

      {/* Sürüklenecek kartlar */}
      <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, minHeight: 56 }}>
        <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, fontWeight: 800, marginBottom: 8, fontFamily: FONT }}>DOĞAL FAKTÖRLER</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {pending.map(item => (
            <div key={item.id} draggable
              onDragStart={e => { setDragId(item.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", item.id); }}
              onDragEnd={() => { setDragId(null); setHovBuck(null); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 12px",
                background: dragId === item.id ? `${C}18` : "rgba(0,0,0,0.45)",
                border: `1.5px solid ${dragId === item.id ? C : "rgba(255,255,255,0.09)"}`,
                borderRadius: 8, cursor: "grab", fontSize: 11.5, fontWeight: 600,
                color: "#cbd5e1", fontFamily: FONT, userSelect: "none", WebkitUserSelect: "none",
                opacity: dragId === item.id ? 0.5 : 1, transition: "border-color 0.15s",
              }}>
              <span style={{ fontSize: 16 }}>{item.faktorIkon}</span>{item.faktor}
            </div>
          ))}
          {shuffled.filter(m => placed[m.id]).map(item => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 12px",
              background: wrong[item.id] ? "rgba(239,68,68,0.07)" : "rgba(52,211,153,0.07)",
              border: `1.5px solid ${wrong[item.id] ? "#ef444428" : "#34d39928"}`,
              borderRadius: 8, fontSize: 11.5, fontWeight: 600,
              color: wrong[item.id] ? "#ef4444" : "#34d399", fontFamily: FONT, opacity: 0.65,
            }}>
              <span style={{ fontSize: 16 }}>{item.faktorIkon}</span>
              {wrong[item.id] ? "✗ " : "✓ "}{item.faktor}
            </div>
          ))}
        </div>
      </div>

      {/* Hedef kutular — 3+3 grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
        {KOVA_TANIMLARI.map(b => (
          <div key={b.id}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setHovBuck(b.id); }}
            onDragLeave={() => setHovBuck(null)}
            onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) { setDragId(id); setTimeout(() => doDrop(b.id), 0); } else doDrop(b.id); }}
            style={{
              minHeight: 120, padding: 11,
              background: hovBuck === b.id ? `${b.color}15` : `${b.color}07`,
              border: `2px ${hovBuck === b.id ? "solid" : "dashed"} ${b.color}${hovBuck === b.id ? "70" : "30"}`,
              borderRadius: 11, transition: "all 0.18s",
            }}>
            <div style={{ fontSize: 20, marginBottom: 3 }}>{b.ikon}</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: b.color, fontFamily: FONT }}>{b.label}</div>
            <div style={{ fontSize: 9, color: `${b.color}70`, marginBottom: 7, fontFamily: FONT }}>{b.acikl}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {shuffled.filter(m => placed[m.id] === b.id).map(it => (
                <div key={it.id} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "4px 6px",
                  background: wrong[it.id] ? "rgba(239,68,68,0.10)" : "rgba(52,211,153,0.10)",
                  border: `1px solid ${wrong[it.id] ? "#ef444438" : "#34d39938"}`,
                  borderRadius: 5, fontSize: 9.5,
                  color: wrong[it.id] ? "#ef4444" : "#34d399", fontWeight: 600, fontFamily: FONT,
                }}>
                  <span>{it.faktorIkon}</span>{wrong[it.id] ? "✗ " : "✓ "}{it.faktor.slice(0, 20)}{it.faktor.length > 20 ? "…" : ""}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: "8px 14px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#475569", fontFamily: FONT }}>Kalan: {pending.length} faktör</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: C, fontFamily: MONO }}>{score} doğru</span>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ANA BİLEŞEN
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function EkonomikFaaliyetlerDogalActivity() {
  const [tab,      setTab]      = useState<Tab>("learn");
  const [sec,      setSec]      = useState<LearnSec>("tanim");
  const [answers,  setAnswers]  = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [testDone, setTestDone] = useState(false);

  const TabBtn = ({ id, label, icon }: { id: Tab; label: string; icon: string }) => {
    const active = tab === id;
    return (
      <button onClick={() => { sndClick(); setTab(id); }}
        style={{
          flex: 1, padding: "10px 4px", border: "none", cursor: "pointer", fontFamily: FONT,
          fontSize: 11, fontWeight: active ? 800 : 600, letterSpacing: active ? 1.5 : 1,
          background: active ? `linear-gradient(135deg,${C}22,${C}0a)` : "transparent",
          color: active ? C : "#475569",
          borderBottom: `2.5px solid ${active ? C : "transparent"}`,
          transition: "all 0.18s",
        }}>
        {icon} {label}
      </button>
    );
  };

  const SECTIONS: { id: LearnSec; label: string; ikon: string; color: string }[] = [
    { id: "tanim",     label: "Ekonomik Faaliyet Nedir?",  ikon: "💡", color: C    },
    { id: "konum",     label: "Coğrafi Konum",              ikon: "🌐", color: "#60a5fa" },
    { id: "iklim",     label: "İklim",                      ikon: "☀", color: C4   },
    { id: "topografya",label: "Topoğrafya",                 ikon: "⛰", color: "#94a3b8" },
    { id: "su",        label: "Su Kaynakları",              ikon: "💧", color: C3   },
    { id: "toprak",    label: "Toprak",                     ikon: "🌱", color: C2   },
    { id: "bitki",     label: "Bitki Örtüsü",               ikon: "🌲", color: "#4ade80" },
    { id: "maden",     label: "Maden & Enerji",             ikon: "⚡", color: C    },
  ];

  /* ─── ÖĞREN İçeriği ─────────────────────────────────────────────────────── */
  const renderLearn = () => {

    if (sec === "tanim") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          İnsanlar hayatlarını sürdürmek, gelir elde etmek ve refah düzeylerini yükseltmek için
          çeşitli ekonomik faaliyetler yürütür. Bu faaliyetlerin yeryüzündeki dağılışı; doğal ve
          beşerî faktörlerin etkisiyle değişkenli ve karmaşık bir yapı sergiler.
        </p>

        {/* Tanım kutusu */}
        <div style={{ padding: "16px 18px", background: `${C}0d`, border: `2px solid ${C}35`, borderRadius: 14 }}>
          <div style={{ fontSize: 11, color: C, fontWeight: 800, fontFamily: MONO, letterSpacing: 1, marginBottom: 8 }}>📋 TANIM</div>
          <p style={{ fontSize: 14, color: "#e2e8f0", margin: 0, fontFamily: FONT, lineHeight: 1.75 }}>
            <strong style={{ color: C }}>Ekonomik faaliyet;</strong> insanların gelir elde etmek ve refah seviyelerini
            yükseltmek için yaptıkları çalışmalardır. Üretim, dağıtım ve tüketim süreçlerini kapsar.
          </p>
        </div>

        {/* Döngü SVG */}
        <div style={{ background: "rgba(0,0,0,0.35)", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C, marginBottom: 8, fontFamily: FONT }}>⚙️ Ekonomik Faaliyet Döngüsü</div>
          <EkonomikDongu />
        </div>

        {/* Üretim / Dağıtım / Tüketim detayları */}
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {[
            { ad: "ÜRETİM", ikon: "🏭", color: C4, acikl: "Mal ve hizmetlerin bir dizi işlemden geçirilerek kullanıma hazır hale getirilmesidir. Ham madde + iş gücü + sermaye → ürün.", ornek: "Fabrikada araba üretimi, tarlada buğday hasadı" },
            { ad: "DAĞITIM", ikon: "🚛", color: C3, acikl: "Üretilen mal ve hizmetlerin bir yerden başka bir yere aktarılmasıdır. Karayolu, denizyolu ve hava yoluyla gerçekleşir.", ornek: "Limanlardan ihracat, İstanbul'dan Anadolu'ya mal taşıma" },
            { ad: "TÜKETİM", ikon: "🛒", color: C2, acikl: "Mal ve hizmetlerin tüketiciler tarafından kullanılmasıdır. Nihai tüketim döngüyü tamamlar.", ornek: "Marketten ekmek almak, elektrik kullanmak" },
          ].map(item => (
            <div key={item.ad} style={{ padding: "12px 14px", background: "rgba(0,0,0,0.3)", border: `1px solid ${item.color}22`, borderRadius: 10, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{item.ikon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: item.color, marginBottom: 4, fontFamily: FONT }}>{item.ad}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: FONT, lineHeight: 1.6, marginBottom: 5 }}>{item.acikl}</div>
                <div style={{ fontSize: 10, color: "#475569", fontFamily: FONT, padding: "4px 8px", background: `${item.color}0a`, borderRadius: 5 }}>📌 Örnek: {item.ornek}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Gece ışıkları haritası */}
        <div style={{ background: "rgba(0,0,0,0.35)", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C, marginBottom: 8, fontFamily: FONT }}>🛰️ Gece Işıkları → Ekonomik Aktivite Haritası</div>
          <GeceIsiklariHarita />
          <p style={{ fontSize: 11, color: "#64748b", margin: "8px 0 0", fontFamily: FONT, lineHeight: 1.55 }}>
            Gece uydu görüntüleri; ekonomik büyümeyi ölçmek, yoksulluğun haritasını çıkarmak ve
            bölgesel eşitsizlikleri analiz etmek için kullanılır. Parlak bölgeler yüksek ekonomik aktiviteye işaret eder.
          </p>
        </div>
      </div>
    );

    if (sec === "konum") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ padding: "14px 16px", background: "rgba(96,165,250,0.07)", border: "2px solid rgba(96,165,250,0.25)", borderRadius: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 26 }}>🌐</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#60a5fa", fontFamily: FONT }}>Coğrafi Konum</div>
              <div style={{ fontSize: 11, color: "rgba(96,165,250,0.7)", fontFamily: FONT }}>Ekonomik faaliyetlerin ana belirleyicisi</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, fontFamily: FONT, lineHeight: 1.65 }}>
            Bir yerin coğrafi özellikleri; o yerin sahip olduğu coğrafi konumdan kaynaklanır.
            Coğrafi konum; fizikî ve beşerî çevre özelliklerinin temel belirleyicisidir ve
            küresel pazarda ekonomik faaliyetler için kritik bir faktördür.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { başlık: "Ticaret Yollarına Yakınlık", ikon: "🚢", color: "#60a5fa", acikl: "Büyük ticaret yollarının kavşak noktasında bulunan ülkeler uluslararası ticarette avantaj elde eder. Türkiye; Asya-Avrupa ve Karadeniz-Akdeniz geçişinde stratejik konumdadır.", ornek: "Türkiye Boğazları → dünya petrol ticareti" },
            { başlık: "Doğal Kaynaklara Yakınlık", ikon: "⛽", color: "#fde047", acikl: "Petrol, maden ve orman gibi doğal kaynaklara yakın ülkeler bu kaynakların işlenmesinde maliyet avantajı elde eder.", ornek: "Körfez ülkeleri → petrol ihracatı" },
            { başlık: "Kıta Konumu", ikon: "🗺", color: C2, acikl: "Adada ya da kıtanın iç bölgesinde yer alan ülkeler ile kıyı devletleri arasında ulaşım ve ticaret maliyeti bakımından büyük farklılıklar oluşur.", ornek: "İsviçre (kara içi) vs Hollanda (kıyı)" },
            { başlık: "İklim Kuşağı", ikon: "☀", color: C4, acikl: "Coğrafi konuma bağlı iklim kuşağı; tarımdan turizma, enerjiden sanayiye uzanan geniş bir yelpazede ekonomiyi şekillendirir.", ornek: "Tropikal kuşak → kahve, kakao üretimi" },
          ].map(item => (
            <div key={item.başlık} style={{ padding: "12px 13px", background: "rgba(0,0,0,0.3)", border: `1px solid ${item.color}22`, borderRadius: 11 }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{item.ikon}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: item.color, fontFamily: FONT, marginBottom: 5 }}>{item.başlık}</div>
              <div style={{ fontSize: 11, color: "#64748b", fontFamily: FONT, lineHeight: 1.55, marginBottom: 6 }}>{item.acikl}</div>
              <div style={{ fontSize: 10, color: "#475569", padding: "3px 8px", background: `${item.color}0a`, borderRadius: 5, fontFamily: FONT }}>📍 {item.ornek}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 14px", background: `${"#60a5fa"}0d`, border: `1px solid ${"#60a5fa"}25`, borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#60a5fa", marginBottom: 5, fontFamily: MONO, letterSpacing: 1 }}>🇹🇷 TÜRKİYE ÖRNEĞİ</div>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, fontFamily: FONT, lineHeight: 1.65 }}>
            Türkiye; Asya ile Avrupa arasında köprü, Karadeniz ile Akdeniz arasında geçiş noktasında
            bulunduğundan enerji boru hatları, ticaret koridorları ve lojistik merkez olma avantajına sahiptir.
            Bu stratejik konum Türkiye'ye hem ulaşım hem de ticaret alanında önemli ekonomik katkılar sağlar.
          </p>
        </div>
      </div>
    );

    if (sec === "iklim") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          İklim koşulları; tarımdan sanayiye, enerjiden turizma uzanan geniş bir alanda ekonomik
          faaliyetleri hem doğrudan hem de dolaylı olarak etkiler.
        </p>
        {[
          {
            faaliyet: "Tarım", ikon: "🌾", color: C2,
            acikl: "İklim; hangi ürünlerin, nerede ve ne miktarda yetişebileceğini belirler. Sıcak ve yağışlı tropik kuşakta ananas, muz, kahve yetişirken ılıman kuşakta buğday, mısır üretilir.",
            ornek: "Karadeniz → fındık; Ege → zeytin, üzüm; GAP → pamuk, pirinç",
          },
          {
            faaliyet: "Turizm", ikon: "🏖", color: C5,
            acikl: "Sıcak, güneşli ve kurak iklimler deniz-kum-güneş turizmini; karlı dağlık alanlar kış turizmini; ılıman iklimlerin doğa güzellikleri eko-turizmi destekler.",
            ornek: "Antalya → deniz turizmi; Uludağ → kayak turizmi",
          },
          {
            faaliyet: "Enerji Üretimi", ikon: "⚡", color: C,
            acikl: "Güneşli bölgeler güneş enerjisinde, rüzgârlı alınan rüzgâr enerjisinde, yağışlı yüksek araziler hidroelektrik üretiminde avantajlıdır.",
            ornek: "Karadeniz yağışları → HES; Ege kıyıları → rüzgâr enerjisi; Güneydoğu → güneş enerjisi",
          },
          {
            faaliyet: "Sanayi (Dolaylı)", ikon: "🏭", color: C4,
            acikl: "İklim bazı sanayi kollarının yer seçimini dolaylı etkiler. Aşırı nem veya soğuk; bazı üretim süreçlerini, ürün depolamayı ve işçi verimliliğini olumsuz etkileyebilir.",
            ornek: "Tekstil üretiminde nem kontrolü; çimento fabrikalarının iklime göre yer seçimi",
          },
        ].map(item => (
          <div key={item.faaliyet} style={{ padding: "13px 15px", background: "rgba(0,0,0,0.3)", border: `1.5px solid ${item.color}22`, borderRadius: 12, display: "flex", gap: 13 }}>
            <span style={{ fontSize: 26, flexShrink: 0, marginTop: 2 }}>{item.ikon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: item.color, fontFamily: FONT, marginBottom: 5 }}>İklim → {item.faaliyet}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: FONT, lineHeight: 1.6, marginBottom: 6 }}>{item.acikl}</div>
              <div style={{ fontSize: 10, color: "#475569", fontFamily: FONT, padding: "4px 8px", background: `${item.color}0a`, borderRadius: 5 }}>📍 {item.ornek}</div>
            </div>
          </div>
        ))}
      </div>
    );

    if (sec === "topografya") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          Topoğrafik özellikler (yükselti, eğim, bakı); tarım arazilerinden liman kurulmasına,
          ulaşım güzergahlarından sanayi tesisi kuruluşuna kadar pek çok kararı doğrudan etkiler.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { başlık: "Tarım Arazileri", ikon: "🌿", color: C2, acikl: "Sade yer şekilleri ve düz ovalar tarıma en uygun koşulları sağlar. Yüksek dağlık ve engebeli alanlar tarımı sınırlar." },
            { başlık: "Liman & Ulaşım", ikon: "🚢", color: C3, acikl: "Korunaklı koy ve körfezler liman kurulumunu kolaylaştırır. Kıyı ovaları büyük liman kentlerinin gelişimine zemin hazırlar." },
            { başlık: "Turizm Kaynağı", ikon: "🗿", color: C5, acikl: "Peribacası, traverten, şelale, mağara gibi ilgi çekici yeryüzü şekilleri turizm faaliyetlerinin gelişimini destekler." },
            { başlık: "Sanayi Yerleşimi", ikon: "🏭", color: C4, acikl: "Düz ve erişilebilir araziler büyük fabrika ve sanayi tesislerinin kurulumunu kolaylaştırır. Kıyı bölgelerinde deniz ulaşımı avantajı sağlar." },
          ].map(item => (
            <div key={item.başlık} style={{ padding: "12px 13px", background: "rgba(0,0,0,0.3)", border: `1px solid ${item.color}22`, borderRadius: 11 }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{item.ikon}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: item.color, fontFamily: FONT, marginBottom: 5 }}>{item.başlık}</div>
              <div style={{ fontSize: 11, color: "#64748b", fontFamily: FONT, lineHeight: 1.55 }}>{item.acikl}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", marginBottom: 5, fontFamily: MONO }}>⚖️ AVANTAJ vs KISIT</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ padding: "9px 11px", background: `${C2}0a`, borderRadius: 8, border: `1px solid ${C2}20` }}>
              <div style={{ fontSize: 10, color: C2, fontWeight: 800, fontFamily: FONT, marginBottom: 4 }}>✓ Avantajlı Topoğrafya</div>
              {["Verimli delta ve ovalar", "Korunaklı körfezler", "Dikkat çekici yeryüzü şekilleri", "Ulaşıma açık kıyı ovaları"].map(i => (
                <div key={i} style={{ fontSize: 10, color: "#64748b", fontFamily: FONT, marginBottom: 2 }}>• {i}</div>
              ))}
            </div>
            <div style={{ padding: "9px 11px", background: "rgba(239,68,68,0.05)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.18)" }}>
              <div style={{ fontSize: 10, color: "#f87171", fontWeight: 800, fontFamily: FONT, marginBottom: 4 }}>✗ Kısıtlayıcı Topoğrafya</div>
              {["Yüksek dağlık arazi", "Sarp yamaçlar ve derin vadiler", "Bataklık ve düzensiz kıyılar", "Eğimli ve kayalık zeminler"].map(i => (
                <div key={i} style={{ fontSize: 10, color: "#64748b", fontFamily: FONT, marginBottom: 2 }}>• {i}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );

    if (sec === "su") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          Su; tüm ekonomik faaliyetlerin vazgeçilmez unsurudur. Balıkçılıktan HES'e,
          tarımsal sulamadan deniz ulaşımına kadar pek çok sektör su kaynaklarına doğrudan bağlıdır.
        </p>
        {[
          { alan: "Balıkçılık", ikon: "🐟", color: C3, acikl: "Denizler, göller ve akarsular; balıkçılık faaliyetlerinin olmazsa olmazıdır. Soğuk ve besin açısından zengin sular en verimli balıkçılık alanlarını oluşturur." },
          { alan: "Hidroelektrik Enerji", ikon: "⚡", color: C, acikl: "Yeterli akış hızı ve debiye sahip nehirler; yenilenebilir enerji üretiminde kritik öneme sahiptir. Türkiye akarsular bakımından zengin bir ülkedir." },
          { alan: "Tarımsal Sulama", ikon: "🚿", color: C2, acikl: "Doğal yağışın yetersiz olduğu alanlarda; kanallar, barajlar ve yeraltı suları ile sulama yapılarak tarım alanı genişletilir." },
          { alan: "Deniz Ulaşımı", ikon: "🚢", color: "#7dd3fc", acikl: "Denizler, göller ve nehirler; dünya ticaretinin yaklaşık %80'ini taşıyan deniz ulaşımının temelidir. Maliyet avantajı bakımından en ekonomik taşıma türüdür." },
          { alan: "Sanayi (Soğutma & Ham Madde)", ikon: "🏭", color: C4, acikl: "Nükleer ve termal santraller soğutma için suya ihtiyaç duyar. Demir-çelik tesisleri de üretim süreçlerinde büyük miktarda su tüketir." },
        ].map(item => (
          <div key={item.alan} style={{ padding: "11px 14px", background: "rgba(0,0,0,0.3)", border: `1px solid ${item.color}22`, borderRadius: 10, display: "flex", gap: 12 }}>
            <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{item.ikon}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: item.color, fontFamily: FONT, marginBottom: 4 }}>Su → {item.alan}</div>
              <div style={{ fontSize: 11, color: "#64748b", fontFamily: FONT, lineHeight: 1.55 }}>{item.acikl}</div>
            </div>
          </div>
        ))}
      </div>
    );

    if (sec === "toprak") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          Toprak; tarımsal üretimin ve birçok sanayi dalının temel ham maddesidir.
          Özellikleri ve kalitesi hem tarımı hem de sanayi kurulumunu doğrudan etkiler.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { başlık: "Verimli Alüvyal Toprak", ikon: "🌾", color: C2, acikl: "Nehir taşıntısı ile oluşan alüvyal ovalar; tarımsal verimliliği en yüksek alanlardır. Dünya'nın en büyük tarım bölgeleri bu tür topraklar üzerindedir." },
            { başlık: "Killi Toprak → Seramik", ikon: "🏺", color: "#d97706", acikl: "Kil içeriği yüksek topraklar; porselen, seramik, kiremit ve tuğla gibi sanayi ürünlerinde ham madde olarak kullanılır." },
            { başlık: "Çorak ve Taşlı Toprak", ikon: "🏜", color: "#64748b", acikl: "Organik madde bakımından fakir, taşlı veya killi topraklar tarımsal verimliliği düşürür; ancak bazıları madenciliğe elverişlidir." },
            { başlık: "Toprak Kirliliği", ikon: "⚠️", color: "#f87171", acikl: "Tarımsal ilaç, sanayi atığı ve ağır metallerle kirlenmiş topraklar; tarımsal üretimi ve insan sağlığını olumsuz etkiler." },
          ].map(item => (
            <div key={item.başlık} style={{ padding: "12px 13px", background: "rgba(0,0,0,0.3)", border: `1px solid ${item.color}22`, borderRadius: 11 }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{item.ikon}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: item.color, fontFamily: FONT, marginBottom: 5 }}>{item.başlık}</div>
              <div style={{ fontSize: 11, color: "#64748b", fontFamily: FONT, lineHeight: 1.55 }}>{item.acikl}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 14px", background: `${C2}0d`, border: `1px solid ${C2}25`, borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C2, marginBottom: 5, fontFamily: MONO, letterSpacing: 1 }}>🇹🇷 TÜRKİYE TOPRAK ÇEŞİTLİLİĞİ</div>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, fontFamily: FONT, lineHeight: 1.65 }}>
            Türkiye; Çukurova alüvyal ovaları (pamuk-narenciye), İç Anadolu kuru step toprakları (tahıl),
            Karadeniz humuslu orman toprakları (çay-fındık) ve Ege kıyı toprakları (zeytin-üzüm) gibi
            farklı özellikte topraklara sahiptir. Bu çeşitlilik Türkiye'yi tarım ürünleri bakımından zengin kılar.
          </p>
        </div>
      </div>
    );

    if (sec === "bitki") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          Bitki örtüsü; hayvancılıktan sanayi ham maddesine, orman ürünlerinden eko-turizme
          kadar pek çok ekonomik faaliyetle doğrudan ilişkilidir.
        </p>
        {[
          { alan: "Hayvancılık", ikon: "🐄", color: C2, acikl: "Geniş doğal mera ve çayırlar; büyükbaş ve küçükbaş hayvancılığın temel beslenme kaynağıdır. Step vejetasyonu koyun ve keçi yetiştiriciliğini destekler." },
          { alan: "Orman Ürünleri Sanayisi", ikon: "🌲", color: "#4ade80", acikl: "Ormanlar; kereste, kâğıt ve selüloz, mobilya ve yonga levha gibi ürünlerin üretiminde kritik ham madde kaynağı oluşturur." },
          { alan: "Eko-Turizm ve Rekreasyon", ikon: "🏕", color: C5, acikl: "Çeşitlilik gösteren bitki örtüsüne sahip alanlar; doğa yürüyüşü, kamp ve bitki gözlem turizmine imkân sağlar." },
          { alan: "Tıbbi ve Endüstriyel Bitkiler", ikon: "🌿", color: C, acikl: "Lavanta, ıhlamur, kekik gibi aromatik ve tıbbi bitkiler; ilaç, kozmetik ve gıda sanayisinde değerli ham maddelerdir." },
        ].map(item => (
          <div key={item.alan} style={{ padding: "12px 14px", background: "rgba(0,0,0,0.3)", border: `1px solid ${item.color}22`, borderRadius: 11, display: "flex", gap: 12 }}>
            <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{item.ikon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: item.color, fontFamily: FONT, marginBottom: 5 }}>Bitki Örtüsü → {item.alan}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: FONT, lineHeight: 1.6 }}>{item.acikl}</div>
            </div>
          </div>
        ))}
      </div>
    );

    if (sec === "maden") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          Madenler ve enerji kaynakları; sanayi tesislerinin kurulum yeri kararını,
          bölgesel ekonomik kalkınmayı ve ülkelerin enerji bağımsızlığını doğrudan şekillendirir.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { başlık: "Demir & Çelik", ikon: "⚙️", color: "#94a3b8", acikl: "Demir cevheri ve taş kömürüne yakın kurulan demir-çelik tesisleri; maliyet avantajından yararlanır. Zonguldak kömür havzası bu ilişkinin Türkiye örneğidir." },
            { başlık: "Petrokim & Petrol", ikon: "🛢", color: "#f97316", acikl: "Petrol ve doğal gaz yataklarına yakın bölgelerde petrokimya tesisleri ve rafineriler kurulur. Körfez bölgesi bu ilişkinin en güçlü örneğidir." },
            { başlık: "Yenilenebilir Enerji", ikon: "🌬", color: C, acikl: "Sürekli ve güçlü rüzgâr koşulları rüzgâr tarlalarının, yüksek güneş ışınımı ise güneş enerjisi santrallerinin kurulmasına elverişlidir." },
            { başlık: "HES & Su Gücü", ikon: "💧", color: C3, acikl: "Yeterli yağış, rakım farkı ve güçlü akış hızı olan nehirler; hidroelektrik santral yatırımları için temel koşullardır." },
            { başlık: "Bor & Nadir Mineraller", ikon: "🔬", color: "#e879f9", acikl: "Bor, lityum ve nadir toprak minerallerine sahip ülkeler teknoloji sanayisinde stratejik avantaj elde eder. Türkiye dünya bor rezervlerinin %70'ini barındırır." },
            { başlık: "Tarımsal Ham Madde", ikon: "🌾", color: C2, acikl: "Şeker pancarı, pamuk ve ayçiçeği gibi tarımsal ürünler; şeker, tekstil ve yağ sanayisine ham madde sağlar. Sanayi-tarım bağı güçlüdür." },
          ].map(item => (
            <div key={item.başlık} style={{ padding: "11px 12px", background: "rgba(0,0,0,0.3)", border: `1px solid ${item.color}20`, borderRadius: 11 }}>
              <div style={{ fontSize: 20, marginBottom: 5 }}>{item.ikon}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: item.color, fontFamily: FONT, marginBottom: 4 }}>{item.başlık}</div>
              <div style={{ fontSize: 10, color: "#64748b", fontFamily: FONT, lineHeight: 1.5 }}>{item.acikl}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 14px", background: `${C4}0d`, border: `1px solid ${C4}25`, borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C4, marginBottom: 5, fontFamily: MONO, letterSpacing: 1 }}>⚡ ENERJİ–SANAYİ BAĞLANTISI</div>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, fontFamily: FONT, lineHeight: 1.65 }}>
            Sanayi tesislerindeki üretim giderek daha fazla enerji tüketen makinelere dayanmaktadır.
            Bu nedenle sanayi kuruluş yeri kararlarında enerji kaynaklarına yakınlık giderek daha
            belirleyici olmaktadır. Demir-çelik fabrikalarının taş kömürü havzaları yakınında kurulması
            bu ilişkinin tarihsel en güçlü örneğidir.
          </p>
        </div>
      </div>
    );

    return null;
  };

  /* ─── TEST ──────────────────────────────────────────────────────────────── */
  const renderTest = () => {
    if (testDone) {
      const score = TEST_ITEMS.reduce((acc, _, i) => answers[i] === TEST_ITEMS[i].ans ? acc + 1 : acc, 0);
      const pct = Math.round((score / TEST_ITEMS.length) * 100);
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "40px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 52 }}>{pct >= 90 ? "🌍" : pct >= 70 ? "🏭" : "📉"}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#e2e8f0", fontFamily: FONT }}>Test Tamamlandı!</div>
          <div style={{ fontSize: 52, fontWeight: 800, fontFamily: MONO, color: pct >= 70 ? C2 : C4 }}>{score}<span style={{ fontSize: 26, color: "#475569" }}>/{TEST_ITEMS.length}</span></div>
          <div style={{ fontSize: 26, fontWeight: 800, color: C, fontFamily: MONO }}>{pct}%</div>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 7, marginTop: 6 }}>
            {TEST_ITEMS.map((q, i) => {
              const ok = answers[i] === q.ans;
              return (
                <div key={i} style={{ padding: "9px 12px", background: ok ? `${C2}0a` : `${C4}0a`, border: `1px solid ${ok ? C2 + "25" : C4 + "25"}`, borderRadius: 8, textAlign: "left" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ok ? C2 : C4, fontFamily: FONT }}>{ok ? "✓" : "✗"} S{i + 1}. {q.q}</div>
                  {!ok && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, fontFamily: FONT, lineHeight: 1.5 }}>✅ Doğru: <strong style={{ color: C2 }}>{q.opts[q.ans]}</strong></div>}
                  {!ok && <div style={{ fontSize: 10, color: "#475569", marginTop: 2, fontFamily: FONT, lineHeight: 1.5 }}>{q.ac}</div>}
                </div>
              );
            })}
          </div>
          <button onClick={() => { setAnswers({}); setRevealed({}); setTestDone(false); sndClick(); }}
            style={{ padding: "12px 26px", background: `linear-gradient(90deg,#1a1200,${C})`, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: FONT, marginTop: 6 }}>
            🔄 Testi Tekrar Çöz
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 12, color: "#475569", fontFamily: FONT }}>Her soruyu okuyun ve tek seçenek işaretleyin.</div>
        {TEST_ITEMS.map((q, qi) => {
          const chosen = answers[qi], isRev = revealed[qi];
          return (
            <div key={qi} style={{ padding: "14px 16px", background: "rgba(0,0,0,0.3)", border: `1px solid ${isRev ? (chosen === q.ans ? C2 + "28" : C4 + "28") : "rgba(255,255,255,0.07)"}`, borderRadius: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 12, fontFamily: FONT, lineHeight: 1.55 }}>
                <span style={{ color: C, fontFamily: MONO, marginRight: 6 }}>{qi + 1}.</span>{q.q}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {q.opts.map((opt, oi) => {
                  let bg = "rgba(0,0,0,0.25)", border = "rgba(255,255,255,0.07)", col = "#94a3b8";
                  if (isRev) {
                    if (oi === q.ans) { bg = `${C2}10`; border = C2 + "40"; col = C2; }
                    else if (oi === chosen) { bg = `${C4}10`; border = C4 + "40"; col = C4; }
                  } else if (chosen === oi) { bg = `${C}10`; border = C + "45"; col = C; }
                  return (
                    <div key={oi} onClick={() => { if (!isRev) { sndClick(); setAnswers(a => ({ ...a, [qi]: oi })); } }}
                      style={{ padding: "9px 13px", background: bg, border: `1.5px solid ${border}`, borderRadius: 8, cursor: isRev ? "default" : "pointer", fontSize: 12, fontWeight: 600, color: col, fontFamily: FONT, display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }}>
                      <span style={{ width: 17, height: 17, borderRadius: "50%", border: `2px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8.5, flexShrink: 0, color: col }}>
                        {isRev && oi === q.ans ? "✓" : isRev && oi === chosen ? "✗" : chosen === oi && !isRev ? "●" : "○"}
                      </span>
                      {opt}
                    </div>
                  );
                })}
              </div>
              {chosen !== undefined && !isRev && (
                <button onClick={() => { setRevealed(r => ({ ...r, [qi]: true })); chosen === q.ans ? sndOK() : sndFail(); }}
                  style={{ marginTop: 9, padding: "7px 16px", background: `${C}18`, border: `1px solid ${C}40`, borderRadius: 7, color: C, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                  Cevabı Kontrol Et
                </button>
              )}
              {isRev && (
                <div style={{ marginTop: 9, padding: "8px 11px", background: chosen === q.ans ? `${C2}08` : `${C4}08`, border: `1px solid ${chosen === q.ans ? C2 + "22" : C4 + "22"}`, borderRadius: 7, fontSize: 11, color: "#94a3b8", fontFamily: FONT, lineHeight: 1.55 }}>
                  {q.ac}
                </div>
              )}
            </div>
          );
        })}
        {Object.keys(revealed).length === TEST_ITEMS.length && (
          <button onClick={() => setTestDone(true)}
            style={{ padding: "13px", background: `linear-gradient(90deg,#1a1200,${C})`, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: FONT }}>
            Sonuçları Gör →
          </button>
        )}
      </div>
    );
  };

  /* ─── RENDER ─────────────────────────────────────────────────────────── */
  const activeSec = SECTIONS.find(s => s.id === sec)!;

  return (
    <div style={{ background: BG, minHeight: "100vh", color: "#e2e8f0", fontFamily: FONT }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: 9, color: C, letterSpacing: 4, fontWeight: 800, fontFamily: MONO, marginBottom: 4 }}>5. ÜNİTE · EKONOMİK FAALİYETLER VE ETKİLERİ</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${C}30,${C}08)`, border: `1px solid ${C}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🌍</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.2, fontFamily: FONT }}>Ekonomik Faaliyetleri Etkileyen Doğal Faktörler</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 2, fontFamily: FONT }}>5.1.1 — Konum · İklim · Topoğrafya · Su · Toprak · Bitki · Maden</div>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 12 }}>
          <TabBtn id="learn" label="ÖĞREN" icon="📖" />
          <TabBtn id="act"   label="ETKİNLİK" icon="🎯" />
          <TabBtn id="test"  label="TEST" icon="📝" />
        </div>
      </div>

      {/* İçerik */}
      <div style={{ display: "flex", gap: 0 }}>
        {tab === "learn" && (
          <div style={{ width: 200, flexShrink: 0, padding: "14px 10px", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 4 }}>
            {SECTIONS.map(s => {
              const active = sec === s.id;
              return (
                <button key={s.id} onClick={() => { sndClick(); setSec(s.id); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "9px 10px",
                    background: active ? `${s.color}18` : "transparent",
                    border: `1px solid ${active ? s.color + "35" : "transparent"}`,
                    borderRadius: 8, cursor: "pointer", textAlign: "left", width: "100%",
                    color: active ? s.color : "#475569", fontFamily: FONT,
                    fontSize: 11, fontWeight: active ? 800 : 600, transition: "all 0.15s",
                  }}>
                  <span style={{ fontSize: 15 }}>{s.ikon}</span>
                  <span style={{ lineHeight: 1.35 }}>{s.label}</span>
                </button>
              );
            })}

            <div style={{ marginTop: 14, padding: "12px 10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10 }}>
              <div style={{ fontSize: 9, color: "#475569", letterSpacing: 2, fontWeight: 800, marginBottom: 8, fontFamily: MONO }}>ÖZET</div>
              {[
                ["Ekonomik Faaliyet", "Üretim+Dağıtım+Tüketim"],
                ["Coğrafi Konum", "Ticaret yolu avantajı"],
                ["İklim", "Tarım & turizm & enerji"],
                ["Topoğrafya", "Liman, ulaşım, turizm"],
                ["Su Kaynakları", "HES, balıkçılık, sulama"],
                ["Toprak", "Tarım & seramik sanayi"],
                ["Bitki Örtüsü", "Kereste, mera, eko-turizm"],
                ["Maden & Enerji", "Sanayi yerleşim kararı"],
              ].map(([k, v]) => (
                <div key={k as string} style={{ marginBottom: 5 }}>
                  <div style={{ fontSize: 9, color: C, fontWeight: 800, fontFamily: MONO }}>{k as string}</div>
                  <div style={{ fontSize: 9, color: "#475569", fontFamily: FONT }}>{v as string}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ flex: 1, padding: 18, overflowY: "auto" }}>
          {tab === "learn" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 22 }}>{activeSec.ikon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: activeSec.color, fontFamily: FONT }}>{activeSec.label}</div>
                  <div style={{ fontSize: 10, color: "#475569", fontFamily: MONO, letterSpacing: 1 }}>5.1.1 · KONU {SECTIONS.findIndex(s => s.id === sec) + 1}/{SECTIONS.length}</div>
                </div>
              </div>
              {renderLearn()}
            </>
          )}
          {tab === "act"  && <FaktorFaaliyetAktivite />}
          {tab === "test" && renderTest()}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 20px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10, color: "#1a1200", fontFamily: MONO }}>9. SINIF COĞRAFYA · 5.1.1</div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {SECTIONS.map(s => (
            <div key={s.id}
              onClick={() => { if (tab !== "learn") { sndClick(); setTab("learn"); } setSec(s.id); sndClick(); }}
              style={{ width: 8, height: 8, borderRadius: "50%", background: sec === s.id && tab === "learn" ? s.color : "#1a1200", cursor: "pointer", transition: "background 0.2s" }} />
          ))}
        </div>
      </div>
    </div>
  );
}