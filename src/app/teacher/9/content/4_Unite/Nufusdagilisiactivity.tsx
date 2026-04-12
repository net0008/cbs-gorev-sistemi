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
const FONT  = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const MONO  = "'Courier New',Courier,monospace";
const BG    = "#060d1f";
const C     = "#0ea5e9";   // sky    — ana renk / harita / coğrafya
const C2    = "#10b981";   // yeşil  — doğal faktörler
const C3    = "#f59e0b";   // amber  — tarihsel göç
const C4    = "#e879f9";   // fuşya  — göç türleri
const C5    = "#fb923c";   // turuncu— beyin göçü / iklim
const PANEL = "rgba(6,13,31,0.85)";

type Tab      = "learn" | "act" | "test";
type LearnSec = "dagilisi" | "doga" | "beseri" | "goc_turleri" | "tarihsel" | "beyin";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VERİ: Faktör Kartları (Aktivite — Doğal vs Beşerî & Ekonomik)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
interface FK { id: string; text: string; ikon: string; cat: "doga" | "beseri"; }
const FAKTOR_KARTI: FK[] = [
  { id: "f01", text: "İklim koşulları",                           ikon: "🌤", cat: "doga"   },
  { id: "f02", text: "Yer şekilleri ve dağlık araziler",          ikon: "⛰", cat: "doga"   },
  { id: "f03", text: "Yükselti ve eğim",                          ikon: "📐", cat: "doga"   },
  { id: "f04", text: "Akarsu, göl ve yeraltı suları",             ikon: "💧", cat: "doga"   },
  { id: "f05", text: "Toprak özellikleri ve verimliliği",         ikon: "🌾", cat: "doga"   },
  { id: "f06", text: "Bitki örtüsü",                              ikon: "🌿", cat: "doga"   },
  { id: "f07", text: "Sanayi ve fabrikalaşma",                    ikon: "🏭", cat: "beseri" },
  { id: "f08", text: "Ulaşım ağı ve bağlantı olanakları",        ikon: "🚄", cat: "beseri" },
  { id: "f09", text: "Tarım ve tarıma elverişli alanlar",         ikon: "🚜", cat: "beseri" },
  { id: "f10", text: "Turizm ve rekreasyon tesisleri",            ikon: "🏖", cat: "beseri" },
  { id: "f11", text: "Madencilik faaliyetleri",                   ikon: "⛏", cat: "beseri" },
  { id: "f12", text: "Siyasi nedenler ve nüfus politikaları",     ikon: "🏛", cat: "beseri" },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TEST SORULARI
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const TEST_ITEMS = [
  {
    q: "Aşağıdakilerden hangisi nüfusun seyrek olmasına yol açan doğal bir faktördür?",
    opts: ["Sanayinin gelişmesi", "Yüksek dağlık arazi ve olumsuz iklim", "Ulaşım ağının yaygınlaşması", "Tarihî ve dinî değerlerin varlığı"],
    ans: 1,
    ac: "Yüksek dağlık araziler ve olumsuz iklim koşulları (kutup soğukları, çöl sıcaklıkları) yaşam koşullarını güçleştirerek nüfusun seyrekleşmesine neden olur.",
  },
  {
    q: "Göç kavramının en doğru tanımı aşağıdakilerden hangisidir?",
    opts: [
      "Nüfusun doğal artış hızının yükselmesi",
      "İnsanların doğal, ekonomik, sosyal, siyasal ve kültürel nedenlerle başka bir yere hareketi",
      "Ülke sınırları içinde yaşanan mevsimlik tarım faaliyetleri",
      "Doğum oranının ölüm oranından fazla olması durumu",
    ],
    ans: 1,
    ac: "Göç; insanların bulundukları yerden doğal, ekonomik, sosyal, siyasal ve kültürel nedenlerle başka bir yere hareket etmesidir.",
  },
  {
    q: "Lozan Barış Antlaşması'yla gerçekleşen nüfus hareketinin türü nedir?",
    opts: ["Beyin göçü", "Mübadele göçü", "Mevsimlik göç", "İklim göçü"],
    ans: 1,
    ac: "Lozan Barış Antlaşması'yla Türkiye ve Yunanistan arasında nüfus mübadelesi protokolü imzalanmış; Yunanistan'daki Türkler ile Türkiye'deki Rumlar yer değiştirmiştir.",
  },
  {
    q: "Türklerin ana yurdu olan Türkistan'dan göç etmesinin nedenleri arasında aşağıdakilerden hangisi yer almaz?",
    opts: [
      "İklim değişikliği sonucu artan kuraklık",
      "Doğal kaynakların nüfusu besleyememesi",
      "Sanayi Devrimi'nin yarattığı iş gücü talebi",
      "Çinliler ve Moğollar tarafından yapılan baskılar",
    ],
    ans: 2,
    ac: "Sanayi Devrimi kökenli iş gücü göçü, Türklerin Türkistan'dan göç etme nedenleri arasında yer almaz. Bu göçler MÖ 1500'lerde başlamış, MS 800'lere kadar sürmüştür.",
  },
  {
    q: "Beyin göçü kavramı en doğru biçimde nasıl tanımlanır?",
    opts: [
      "Tarım nüfusunun kentlere göç etmesi",
      "Mülteci hareketleri ve zorla yerinden edilme",
      "İyi eğitimli ve nitelikli kişilerin daha iyi fırsatlar için başka ülkelere göç etmesi",
      "Bölgeler arası mevsimlik iş gücü göçü",
    ],
    ans: 2,
    ac: "Beyin göçü; iyi eğitim almış ve nitelikli insanların kendi alanlarında çalışma olanağı bulmak, daha yüksek kazanç sağlamak amacıyla başka ülkelere göç etmesidir.",
  },
  {
    q: "Venezuela'dan 2018–2024 yılları arasında gerçekleşen göçün temel itici faktörleri arasında hangisi yer alır?",
    opts: [
      "Ülkedeki doğal kaynak zenginliği ve yüksek yaşam kalitesi",
      "ABD'nin siyasi baskısı ve ekonomik kriz",
      "İklim değişikliğine bağlı seller ve kuraklık",
      "Nüfusun hızlı büyümesi ve arazi yetersizliği",
    ],
    ans: 1,
    ac: "ABD'nin siyasi baskısı ve uygulanan ambargo nedeniyle Venezuela ekonomik krize girmiş; bu durum 2018–2024 arasında yaklaşık 5,7 milyon kişinin ülkeyi terk etmesine yol açmıştır.",
  },
  {
    q: "Ülke sınırları içinde yaşanan göç türü aşağıdakilerden hangisidir?",
    opts: ["Dış göç", "Mübadele göçü", "Beyin göçü", "İç göç"],
    ans: 3,
    ac: "İç göç; sınır ölçütüne göre ülke içinde yaşanan göçtür. Kırdan kente, bir ilden başka bir ile yapılan göçler bu türe örnektir.",
  },
  {
    q: "Aşağıdaki alanlardan hangisinde nüfus yoğunluğunun fazla olması beklenir?",
    opts: [
      "Antarktika kıta sahanlığı",
      "Büyük Sahra Çölü",
      "Muson ikliminin etkisindeki verimli ovalar",
      "Yüksek ve engebeli Himalaya etekleri",
    ],
    ans: 2,
    ac: "Muson yağışlarının sağladığı su bolluğu ve verimli topraklar tarıma elverişli bir ortam yaratır. Bu nedenle Güney ve Güneydoğu Asya'nın muson alanları dünyanın en kalabalık yerleşim bölgeleri arasındadır.",
  },
  {
    q: "Çin hükümetinin Afrika ülkelerine yönelik yatırımları sonucunda gerçekleşen Çinli göçü hangi göç türüne örnektir?",
    opts: ["Zorunlu göç", "Mübadele göçü", "Ekonomik amaçlı işçi göçü", "İklim göçü"],
    ans: 2,
    ac: "Çinlilerin Afrika'ya göçü; madencilik, enerji ve inşaat gibi alanlardaki yatırımların yarattığı iş gücü ihtiyacına bağlı ekonomik amaçlı işçi göçüdür.",
  },
  {
    q: "İklim değişikliği kaynaklı göçlere aşağıdakilerden hangisi doğrudan örnektir?",
    opts: [
      "Aziz Sancar'ın TÜBİTAK bursuyla ABD'ye gitmesi",
      "Lozan Antlaşması'yla gerçekleştirilen Türk-Rum nüfus mübadelesi",
      "Pasifik ada halklarının yükselen deniz seviyeleri nedeniyle göç etmesi",
      "Kavimler Göçü sırasında Türklerin Anadolu'ya yönelmesi",
    ],
    ans: 2,
    ac: "Yükselen deniz seviyeleri ve aşırı hava olayları nedeniyle Pasifik'teki Tuvalu, Kiribati ve Marshall Adaları halkları iklim değişikliği nedeniyle göç etmek zorunda kalmıştır.",
  },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BILEŞEN: Dünya Nüfus Dağılışı SVG (basitleştirilmiş koroplet)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function DunyaHaritaSVG() {
  const bolgeler = [
    { ad: "Güney&Güneydoğu Asya", x: 310, y: 95, r: 34, color: C,   yogun: true,  not: "Dünyanın en kalabalık bölgesi" },
    { ad: "Doğu Asya (Çin, Japonya)", x: 370, y: 75, r: 28, color: C,   yogun: true,  not: "Yoğun tarım ovası nüfusu" },
    { ad: "Batı Avrupa",           x: 195, y: 55, r: 20, color: "#7dd3fc", yogun: true,  not: "Sanayileşme ve kentleşme" },
    { ad: "Kuzey Amerika kıyıları",x: 80,  y: 65, r: 18, color: "#7dd3fc", yogun: true,  not: "Ulaşım ve sanayi gelişimi" },
    { ad: "Nil Vadisi",            x: 220, y: 110, r: 10, color: "#7dd3fc", yogun: true,  not: "Verimli nehir havzası" },
    { ad: "Amazon Havzası",        x: 110, y: 130, r: 18, color: "#1e3a5f", yogun: false, not: "Tropikal iklim, ulaşım güçlüğü" },
    { ad: "Sahra Çölü",            x: 195, y: 105, r: 24, color: "#1e3a5f", yogun: false, not: "Ekstrem iklim, su yokluğu" },
    { ad: "Sibirya",               x: 340, y: 40,  r: 26, color: "#1e3a5f", yogun: false, not: "Soğuk iklim, uzak konum" },
    { ad: "Avustralya iç bölgesi", x: 380, y: 145, r: 20, color: "#1e3a5f", yogun: false, not: "Çöl iklimi, az yağış" },
    { ad: "Kutup bölgeleri",       x: 240, y: 15,  r: 18, color: "#0f2144", yogun: false, not: "Donmuş zemin, yaşanamaz" },
  ];
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox="0 0 480 180" style={{ width: "100%", maxWidth: 480, borderRadius: 12, border: `1px solid ${C}20` }}>
        {/* Okyanus */}
        <rect width="480" height="180" fill="#0a1628" rx="10" />
        {/* Kıtalar (basit şekil) */}
        <ellipse cx="195" cy="95" rx="75" ry="55" fill="#1a2a44" opacity="0.7" />
        <ellipse cx="110" cy="120" rx="50" ry="40" fill="#1a2a44" opacity="0.7" />
        <ellipse cx="80" cy="65" rx="55" ry="35" fill="#1a2a44" opacity="0.7" />
        <ellipse cx="350" cy="85" rx="95" ry="65" fill="#1a2a44" opacity="0.7" />
        <ellipse cx="380" cy="148" rx="40" ry="25" fill="#1a2a44" opacity="0.7" />
        {/* Yoğunluk baloncukları */}
        {bolgeler.map((b) => (
          <g key={b.ad}>
            <circle cx={b.x} cy={b.y} r={b.r} fill={b.color} opacity={b.yogun ? 0.55 : 0.2} />
            <circle cx={b.x} cy={b.y} r={b.r * 0.45} fill={b.color} opacity={b.yogun ? 0.85 : 0.3} />
          </g>
        ))}
        {/* Ekvator çizgisi */}
        <line x1="0" y1="112" x2="480" y2="112" stroke={C3} strokeWidth="0.8" strokeDasharray="5,5" opacity="0.4" />
        <text x="6" y="110" fontSize="7" fill={C3} fontFamily={FONT} opacity="0.6">Ekvator</text>
        {/* Lejant */}
        <circle cx="12" cy="162" r="6" fill={C} opacity="0.7" />
        <text x="22" y="166" fontSize="8" fill="#94a3b8" fontFamily={FONT}>Yoğun nüfus</text>
        <circle cx="100" cy="162" r="6" fill="#1e3a5f" opacity="0.7" />
        <text x="110" y="166" fontSize="8" fill="#94a3b8" fontFamily={FONT}>Seyrek nüfus</text>
      </svg>
      <div style={{ fontSize: 10, color: "#475569", marginTop: 6, textAlign: "center", fontFamily: FONT }}>
        Dünya nüfus yoğunluğu — şematik gösterim
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BILEŞEN: Türkiye Göç Akışı SVG (şematik)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function TurkiyeGocSVG() {
  return (
    <svg viewBox="0 0 320 160" style={{ width: "100%", maxWidth: 320, borderRadius: 10, border: `1px solid ${C4}20` }}>
      <rect width="320" height="160" fill="#0a0f20" rx="8" />
      {/* Türkiye ana form */}
      <path d="M20,65 Q60,50 100,55 Q140,50 170,58 Q200,52 240,60 Q280,58 305,70 Q305,90 280,95 Q240,100 200,92 Q160,98 120,90 Q80,95 40,88 Q18,82 20,65 Z"
            fill="#1e3a5f" stroke={C} strokeWidth="1" opacity="0.8" />
      {/* İstanbul */}
      <circle cx="68" cy="62" r="9" fill={C} opacity="0.8" />
      <text x="68" y="78" textAnchor="middle" fontSize="8" fill={C} fontFamily={FONT} fontWeight="700">İstanbul</text>
      {/* Ankara */}
      <circle cx="165" cy="72" r="6" fill={C4} opacity="0.8" />
      <text x="165" y="86" textAnchor="middle" fontSize="7.5" fill={C4} fontFamily={FONT} fontWeight="700">Ankara</text>
      {/* İzmir */}
      <circle cx="75" cy="92" r="6" fill={C2} opacity="0.8" />
      <text x="75" y="106" textAnchor="middle" fontSize="7.5" fill={C2} fontFamily={FONT} fontWeight="700">İzmir</text>
      {/* Doğu Anadolu */}
      <circle cx="265" cy="78" r="4" fill="#475569" opacity="0.7" />
      <text x="265" y="92" textAnchor="middle" fontSize="7" fill="#64748b" fontFamily={FONT}>Doğu An.</text>
      {/* Göç okları */}
      <defs>
        <marker id="oka" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <polygon points="0,0 5,2.5 0,5" fill={C3} opacity="0.8"/>
        </marker>
        <marker id="okb" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <polygon points="0,0 5,2.5 0,5" fill={C4} opacity="0.8"/>
        </marker>
      </defs>
      <path d="M255,75 Q220,68 175,70" stroke={C3} strokeWidth="1.5" fill="none" strokeDasharray="3,2" markerEnd="url(#oka)" opacity="0.8" />
      <path d="M175,73 Q130,68 85,65" stroke={C3} strokeWidth="1.5" fill="none" strokeDasharray="3,2" markerEnd="url(#oka)" opacity="0.8" />
      <path d="M170,75 Q130,85 88,88" stroke={C4} strokeWidth="1.5" fill="none" strokeDasharray="3,2" markerEnd="url(#okb)" opacity="0.8" />
      {/* Lejant */}
      <line x1="12" y1="135" x2="38" y2="135" stroke={C3} strokeWidth="1.5" strokeDasharray="3,2" />
      <text x="42" y="139" fontSize="8" fill={C3} fontFamily={FONT}>Doğu→Batı iç göç</text>
      <line x1="12" y1="150" x2="38" y2="150" stroke={C4} strokeWidth="1.5" strokeDasharray="3,2" />
      <text x="42" y="154" fontSize="8" fill={C4} fontFamily={FONT}>Kırdan kente göç</text>
    </svg>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BILEŞEN: Aktivite — Faktör Sınıflandırma (Doğal / Beşerî & Ekonomik)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function FaktorAktivite() {
  const BUCKETS = [
    { id: "doga" as const, label: "DOĞAL FAKTÖRLER", ikon: "🌍",
      color: C2, sub: "İklim, yer şekilleri, su, toprak, bitki örtüsü" },
    { id: "beseri" as const, label: "BEŞERİ & EKONOMİK FAKTÖRLER", ikon: "🏙",
      color: C4, sub: "Sanayi, ulaşım, tarım, turizm, politika, madencilik" },
  ];

  const [shuffled] = useState<FK[]>(() => {
    const a = [...FAKTOR_KARTI];
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
    sndDrop();
    if (ok) { sndOK(); setScore(s => s + 1); } else sndFail();
    const np = { ...placed, [dragId]: bid };
    const nw = { ...wrong,  [dragId]: !ok };
    setPlaced(np); setWrong(nw); setDragId(null); setHovBuck(null);
    if (Object.keys(np).length === shuffled.length) setTimeout(() => setDone(true), 400);
  };
  const retry = () => { setPlaced({}); setWrong({}); setScore(0); setDone(false); setDragId(null); };

  if (done) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 52 }}>🗺️</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#e2e8f0", fontFamily: FONT }}>Faktörler Sınıflandırıldı!</div>
      <div style={{ fontSize: 52, fontWeight: 800, color: C, fontFamily: MONO }}>{score}/{shuffled.length}</div>
      <div style={{ fontSize: 14, color: "#475569", fontFamily: FONT }}>doğru yerleştirme</div>
      {score === shuffled.length
        ? <div style={{ fontSize: 13, color: C2, fontFamily: FONT, maxWidth: 300 }}>🎉 Mükemmel! Nüfus dağılışını etkileyen tüm faktörleri doğru sınıflandırdın.</div>
        : <div style={{ fontSize: 13, color: C3, fontFamily: FONT, maxWidth: 300 }}>Faktörleri tekrar gözden geçirerek doğal ile beşerî arasındaki ayrımı pekiştir.</div>
      }
      <button onClick={retry}
        style={{ padding: "12px 28px", background: `linear-gradient(90deg,#0c4a6e,${C})`, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: FONT, marginTop: 4 }}>
        🔄 Tekrar Dene
      </button>
    </div>
  );

  const pending = shuffled.filter(m => !placed[m.id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontSize: 10, color: C, letterSpacing: 3, fontWeight: 800, fontFamily: MONO, marginBottom: 4 }}>ETKİNLİK</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#e2e8f0", fontFamily: FONT }}>🗺️ Nüfus Faktörlerini Sınıflandır</div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 3, fontFamily: FONT }}>
          Her faktörü doğru kategoriye sürükle ve bırak
        </div>
      </div>

      {/* Sürüklenecek kartlar */}
      <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, minHeight: 56 }}>
        <div style={{ fontSize: 10, color: "#475569", letterSpacing: 2, fontWeight: 800, marginBottom: 8, fontFamily: FONT }}>SINIFLANDIRILACAK FAKTÖRLER</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {pending.map(item => (
            <div key={item.id} draggable
              onDragStart={e => { setDragId(item.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", item.id); }}
              onDragEnd={() => { setDragId(null); setHovBuck(null); }}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "8px 12px",
                background: dragId === item.id ? `${C}18` : "rgba(0,0,0,0.45)",
                border: `1.5px solid ${dragId === item.id ? C : "rgba(255,255,255,0.09)"}`,
                borderRadius: 8, cursor: "grab", fontSize: 12, fontWeight: 600,
                color: "#cbd5e1", fontFamily: FONT, userSelect: "none", WebkitUserSelect: "none",
                opacity: dragId === item.id ? 0.5 : 1, transition: "border-color 0.15s",
              }}>
              <span style={{ fontSize: 15 }}>{item.ikon}</span>{item.text}
            </div>
          ))}
          {shuffled.filter(m => placed[m.id]).map(item => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "8px 12px",
              background: wrong[item.id] ? "rgba(239,68,68,0.07)" : "rgba(52,211,153,0.07)",
              border: `1.5px solid ${wrong[item.id] ? "#ef444428" : "#34d39928"}`,
              borderRadius: 8, fontSize: 12, fontWeight: 600,
              color: wrong[item.id] ? "#ef4444" : "#34d399", fontFamily: FONT, opacity: 0.6,
            }}>
              <span style={{ fontSize: 15 }}>{item.ikon}</span>
              {wrong[item.id] ? "✗ " : "✓ "}{item.text}
            </div>
          ))}
        </div>
      </div>

      {/* Hedef kutular */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {BUCKETS.map(b => (
          <div key={b.id}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setHovBuck(b.id); }}
            onDragLeave={() => setHovBuck(null)}
            onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) { setDragId(id); setTimeout(() => doDrop(b.id), 0); } else doDrop(b.id); }}
            style={{
              minHeight: 170, padding: 14,
              background: hovBuck === b.id ? `${b.color}15` : `${b.color}06`,
              border: `2px ${hovBuck === b.id ? "solid" : "dashed"} ${b.color}${hovBuck === b.id ? "70" : "30"}`,
              borderRadius: 12, transition: "all 0.18s",
            }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{b.ikon}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: b.color, marginBottom: 2, fontFamily: FONT }}>{b.label}</div>
            <div style={{ fontSize: 10, color: `${b.color}70`, marginBottom: 10, fontFamily: FONT, lineHeight: 1.4 }}>{b.sub}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {shuffled.filter(m => placed[m.id] === b.id).map(it => (
                <div key={it.id} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 9px",
                  background: wrong[it.id] ? "rgba(239,68,68,0.10)" : "rgba(52,211,153,0.10)",
                  border: `1px solid ${wrong[it.id] ? "#ef444438" : "#34d39938"}`,
                  borderRadius: 6, fontSize: 11,
                  color: wrong[it.id] ? "#ef4444" : "#34d399", fontWeight: 600, fontFamily: FONT,
                }}>
                  <span>{it.ikon}</span>{wrong[it.id] ? "✗ " : "✓ "}{it.text}
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
export default function NufusDagilisiActivity() {
  const [tab,      setTab]      = useState<Tab>("learn");
  const [sec,      setSec]      = useState<LearnSec>("dagilisi");
  const [answers,  setAnswers]  = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [testDone, setTestDone] = useState(false);

  /* TAB BUTONU */
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

  /* KONU MENÜSİ */
  const SECTIONS: { id: LearnSec; label: string; ikon: string; color: string }[] = [
    { id: "dagilisi",    label: "Nüfusun Dağılışı",       ikon: "🌍", color: C    },
    { id: "doga",        label: "Doğal Faktörler",          ikon: "🏔", color: C2   },
    { id: "beseri",      label: "Beşerî & Ekonomik",        ikon: "🏙", color: C4   },
    { id: "goc_turleri", label: "Göç Türleri",              ikon: "✈", color: C3   },
    { id: "tarihsel",    label: "Tarihsel Göçler",          ikon: "🗺", color: C5   },
    { id: "beyin",       label: "Beyin Göçü & İklim",       ikon: "🧠", color: "#a78bfa" },
  ];

  /* ─── ÖĞREN içeriği ─────────────────────────────────────────────────────── */
  const renderLearn = () => {
    /* ── Nüfusun Dağılışı ──────────────────────────────────────────────── */
    if (sec === "dagilisi") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          Dünya'da nüfus her yere eşit dağılmamıştır. Bazı alanlar milyonlarca insanı barındırırken
          bazı alanlar neredeyse boştur. Bu dağılımı belirleyen başlıca etkenler <strong style={{ color: C2 }}>doğal</strong> ve{" "}
          <strong style={{ color: C4 }}>beşerî-ekonomik</strong> faktörler olarak iki grupta incelenir.
        </p>

        <DunyaHaritaSVG />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { baş: "🟦 Yoğun Nüfus Alanları", renk: C, örnekler: [
              "Güney ve Güneydoğu Asya (Hindistan, Bangladeş, Endonezya)",
              "Doğu Asya (Çin, Japonya, Kore)",
              "Batı Avrupa kıyı şeridi",
              "Kuzey Amerika doğu kıyısı",
              "Nil Vadisi ve deltası",
            ]},
            { baş: "⬜ Seyrek Nüfus Alanları", renk: "#475569", örnekler: [
              "Amazon yağmur ormanları",
              "Sahra ve Arabistan çölleri",
              "Sibirya tundra kuşağı",
              "Avustralya iç bölgeleri",
              "Antarktika ve kutup çevreleri",
            ]},
          ].map(col => (
            <div key={col.baş} style={{ padding: 14, background: "rgba(0,0,0,0.3)", border: `1px solid ${col.renk}25`, borderRadius: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: col.renk, marginBottom: 10, fontFamily: FONT }}>{col.baş}</div>
              {col.örnekler.map(ö => (
                <div key={ö} style={{ fontSize: 11, color: "#94a3b8", marginBottom: 5, paddingLeft: 8, borderLeft: `2px solid ${col.renk}40`, fontFamily: FONT, lineHeight: 1.45 }}>
                  {ö}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 16px", background: `${C}0d`, border: `1px solid ${C}28`, borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C, marginBottom: 6, fontFamily: MONO, letterSpacing: 1 }}>📌 ANAHTAR KAVRAM</div>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, fontFamily: FONT, lineHeight: 1.65 }}>
            <strong style={{ color: C }}>Nüfus yoğunluğu</strong>; bir bölgenin ne kadar kalabalık ya da seyrek
            olduğunu ifade eder. Km² başına düşen kişi sayısı ile hesaplanır. Dünya geneli yaklaşık
            60 kişi/km²'dir; ancak yerel farklılıklar devasa boyutlara ulaşır.
          </p>
        </div>
      </div>
    );

    /* ── Doğal Faktörler ───────────────────────────────────────────────── */
    if (sec === "doga") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          Doğa; iklimden yer şekillerine, su kaynaklarından toprak özelliklerine kadar pek çok
          unsurla insanların nerede yerleşeceğini doğrudan etkiler.
        </p>
        {[
          { ikon: "🌤", başlık: "İklim", color: C, açıklama: "Ilıman ve yeterli yağışlı iklimler tarıma ve yaşama elverişlidir. Kutuplar, çöller ve monsun tufanları gibi ekstrem koşullar nüfusu azaltır ya da tamamen ortadan kaldırır." },
          { ikon: "⛰", başlık: "Yer Şekilleri & Yükselti", color: C2, açıklama: "Düz ovalar ve alçak araziler yerleşim ve ulaşımı kolaylaştırır. Yüksek dağlık araziler iklimi sertleştirir ve ulaşımı güçleştirerek nüfusu seyrekleştirir. 2000 metre üstünde kalıcı yerleşim nadirdir." },
          { ikon: "💧", başlık: "Su Kaynakları", color: "#7dd3fc", açıklama: "İnsanlar suyun olduğu yerde yaşar. Nil, İndüs, Ganj ve Mezopotamya havzaları tarih boyunca yüksek nüfus barındırmıştır. Yeraltı suları kuytu bölgeleri de yaşanabilir kılabilir." },
          { ikon: "🌾", başlık: "Toprak & Bitki Örtüsü", color: C3, açıklama: "Verimli alüvyal topraklar tarımı ve beslenmeyi mümkün kılar. Çöl ve bataklık gibi verimsiz alanlar nüfusu iter. Sık tropikal ormanlar ulaşımı güçleştirerek yerleşimi kısıtlar." },
          { ikon: "🌊", başlık: "Kıyılar & Okyanuslar", color: "#38bdf8", açıklama: "Deniz kıyıları ticaret, balıkçılık ve ulaşım olanakları sağlar. Tarihsel olarak kıyı şehirleri en kalabalık yerleşim alanları olmuştur. Türkiye'de kıyı illerinin nüfus yoğunluğu iç bölgelerden çok yüksektir." },
          { ikon: "🌋", başlık: "Doğal Afetler", color: C5, açıklama: "Deprem, volkanik patlama, taşkın ve heyelan riski yüksek alanlar nüfusu uzun vadede iter. Öte yandan volkanik topraklar verimli olduğundan bazı riskli alanlar yine de kalabalıktır (Endonezya volkanları)." },
        ].map(item => (
          <div key={item.başlık} style={{ padding: "13px 16px", background: "rgba(0,0,0,0.3)", border: `1px solid ${item.color}22`, borderRadius: 10, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{item.ikon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: item.color, marginBottom: 5, fontFamily: FONT }}>{item.başlık}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.65, fontFamily: FONT }}>{item.açıklama}</div>
            </div>
          </div>
        ))}
      </div>
    );

    /* ── Beşerî & Ekonomik Faktörler ───────────────────────────────────── */
    if (sec === "beseri") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          İnsanlar doğal koşulların yanı sıra kendi yarattıkları ekonomik ve sosyal ortamlara göre
          de yer seçer. Teknoloji, sanayi ve politikalar doğal dezavantajları bile aşabilir.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { ikon: "🏭", ad: "Sanayi",       color: C4, açıkl: "Fabrika ve üretim merkezleri iş olanağı yaratarak geniş nüfus kitlelerini çeker. Sanayi Devrimi'nden bu yana Avrupa ve ABD'nin büyük kentleri bu şekilde büyümüştür." },
            { ikon: "🚄", ad: "Ulaşım",        color: C,  açıkl: "Demiryolu, karayolu ve deniz limanları olan yerlere erişim kolaylaşır, ticaret ve göç artar, nüfus yoğunlaşır." },
            { ikon: "🚜", ad: "Tarım",          color: C2, açıkl: "Sulama sistemleri ve tarım teknolojisi, doğal olarak az elverişli alanları tarıma açmış; bu alanlarda nüfusun artmasını sağlamıştır." },
            { ikon: "🏖", ad: "Turizm",         color: C3, açıkl: "Antalya ve Muğla gibi turizm merkezleri, güçlü hizmet sektörü ve istihdam sayesinde kalabalık nüfuslar çekmiştir." },
            { ikon: "⛏", ad: "Madencilik",      color: C5, açıkl: "Maden yatakları doğal olarak ıssız bölgelerde bile nüfus yerleşimini tetikler (Zonguldak kömür havzası, Güneydoğu Asya kalay bölgeleri)." },
            { ikon: "🏛", ad: "Politika & Göç", color: "#a78bfa", açıkl: "Nüfus politikaları, yerleşim teşvikleri ve zorunlu göçler nüfus dağılışını büyük ölçüde yeniden şekillendirebilir." },
          ].map(item => (
            <div key={item.ad} style={{ padding: "11px 13px", background: "rgba(0,0,0,0.3)", border: `1px solid ${item.color}20`, borderRadius: 10 }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{item.ikon}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: item.color, marginBottom: 5, fontFamily: FONT }}>{item.ad}</div>
              <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6, fontFamily: FONT }}>{item.açıkl}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 16px", background: `${C4}0d`, border: `1px solid ${C4}25`, borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C4, marginBottom: 6, fontFamily: MONO, letterSpacing: 1 }}>🇹🇷 TÜRKİYE ÖRNEĞİ</div>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, fontFamily: FONT, lineHeight: 1.65 }}>
            Türkiye'de kıyı illeri; ılıman iklim, verimli toprak, turizm ve sanayi sayesinde en kalabalık bölgelerdir.
            İstanbul, İzmir ve Kocaeli gibi sanayi ve ticaret merkezleri nüfusu çekmeye devam etmektedir.
            Doğu Anadolu'nun yüksek ve engebeli yapısı ise nüfusu seyrekleştirmektedir.
          </p>
        </div>
      </div>
    );

    /* ── Göç Türleri ───────────────────────────────────────────────────── */
    if (sec === "goc_turleri") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          <strong style={{ color: C3 }}>Göç;</strong> insanların doğal, ekonomik, sosyal, siyasal ve kültürel
          nedenlerle bulundukları yerden başka bir yere hareketi olarak tanımlanır. Göç; sınır,
          süre ve neden ölçütlerine göre çeşitli türlere ayrılır.
        </p>

        {/* Göç türleri tablosu */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 12 }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.4)" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", color: C3, fontWeight: 800, borderBottom: `1px solid ${C3}30` }}>Ölçüt</th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: C3, fontWeight: 800, borderBottom: `1px solid ${C3}30` }}>Tür</th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: C3, fontWeight: 800, borderBottom: `1px solid ${C3}30` }}>Açıklama & Örnek</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Sınır", "İç Göç 🏙", "Ülke sınırları içinde gerçekleşir. Kırdan kente, bir ilden diğerine göç. Türkiye'de 1960'lardan bu yana batı illerine yönelik iç göç hareketleri.", C2],
                ["Sınır", "Dış Göç ✈", "Ülke sınırlarının dışına yapılan göç. Türk işçilerin 1960'larda Almanya'ya gitmesi, günümüzde Suriyeli mülteciler.", C],
                ["Süre", "Geçici (Mevsimlik) Göç 🗓", "Belirli bir süreyle sınırlı, kalıcı yerleşim olmaksızın yapılan göç. Mevsimlik tarım işçileri, Çinli yatırımcıların Afrika seyahatleri.", C4],
                ["Süre", "Kalıcı Göç 🏠", "Yerleşilen yere kalıcı olarak iskân edilmek üzere yapılan göç. Yurt dışına kesin çıkış yapanlar.", C5],
                ["Neden", "Zorunlu Göç 🚨", "Savaş, doğal afet, zulüm gibi kişinin iradesi dışındaki nedenlerle gerçekleşir. Lozan nüfus mübadelesi, Suriye iç savaşı göçleri.", "#f87171"],
                ["Neden", "Gönüllü Göç 🌟", "Daha iyi iş, eğitim ya da yaşam koşulları arayışıyla kişinin kendi iradesiyle yaptığı göç. Beyin göçü en belirgin örneğidir.", C3],
              ].map(([olcut, tur, acikl, color], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.1)" }}>
                  <td style={{ padding: "9px 12px", color: "#475569", fontWeight: 700, fontSize: 11, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{olcut}</td>
                  <td style={{ padding: "9px 12px", color: color as string, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.04)", whiteSpace: "nowrap" }}>{tur}</td>
                  <td style={{ padding: "9px 12px", color: "#64748b", lineHeight: 1.55, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{acikl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* İtici – Çekici */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { ad: "↩ İTİCİ FAKTÖRLER", color: "#f87171", items: ["İşsizlik ve yoksulluk","Doğal afet (deprem, sel, kuraklık)","Savaş ve siyasi baskı","Çevre kirliliği","Tarım arazisi yetersizliği"] },
            { ad: "↪ ÇEKİCİ FAKTÖRLER", color: C2, items: ["İş ve yüksek gelir olanakları","Nitelikli sağlık ve eğitim","Güvenlik ve hukuk güvencesi","Sosyal altyapı ve hizmetler","Akraba ve hemşehri ağı"] },
          ].map(col => (
            <div key={col.ad} style={{ padding: 13, background: "rgba(0,0,0,0.3)", border: `1px solid ${col.color}22`, borderRadius: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: col.color, marginBottom: 10, fontFamily: FONT }}>{col.ad}</div>
              {col.items.map(it => (
                <div key={it} style={{ fontSize: 11, color: "#64748b", marginBottom: 5, paddingLeft: 8, borderLeft: `2px solid ${col.color}40`, fontFamily: FONT }}>{it}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );

    /* ── Tarihsel Göçler ───────────────────────────────────────────────── */
    if (sec === "tarihsel") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          Göç; insanlık tarihi boyunca yaşanmış ve uygarlıkların şekillenmesini belirlemiştir.
          Kavimler Göçü'nden Yeni Dünya'ya göçlere, köle göçlerinden Sanayi Devrimi işçi
          göçlerine uzanan tarihsel süreç, günümüz dünya nüfus haritasını büyük ölçüde oluşturmuştur.
        </p>

        {/* Türklerin Göçü */}
        <div style={{ padding: "14px 16px", background: `${C3}0d`, border: `1px solid ${C3}28`, borderRadius: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C3, marginBottom: 10, fontFamily: FONT }}>🗺️ Türklerin Türkistan'dan Göçü (MÖ 1500 – MS 800)</div>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 10px", fontFamily: FONT, lineHeight: 1.65 }}>
            Türkler, anavatanları Türkistan'dan çeşitli dalgalar halinde batıya, güneye ve kuzeye yayılmıştır.
            Bu göçlerin temel nedenleri şunlardır:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              ["☀", "İklim değişikliği", "Artan kuraklık otlakları azalttı"],
              ["🌿", "Kaynak yetersizliği", "Doğal kaynaklar nüfusu besleyemedi"],
              ["⚔", "Siyasi baskı", "Çin ve Moğol baskıları savaş yarattı"],
              ["🧭", "Keşif isteği", "Yeni topraklar ve yeni yurtlar arayışı"],
            ].map(([ikon, başlık, açıkl]) => (
              <div key={başlık as string} style={{ padding: "9px 11px", background: "rgba(0,0,0,0.35)", borderRadius: 8, border: `1px solid ${C3}18` }}>
                <div style={{ fontSize: 16, marginBottom: 3 }}>{ikon}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: C3, fontFamily: FONT }}>{başlık as string}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2, fontFamily: FONT }}>{açıkl as string}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mübadele Göçü */}
        <div style={{ padding: "14px 16px", background: `${C5}0d`, border: `1px solid ${C5}28`, borderRadius: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C5, marginBottom: 8, fontFamily: FONT }}>🤝 Mübadele Göçleri</div>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, fontFamily: FONT, lineHeight: 1.65 }}>
            Ülkeler arasındaki anlaşmalar doğrultusunda gerçekleştirilen <strong style={{ color: C5 }}>zorunlu</strong> tarihsel göçlerdir.
          </p>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              { baş: "Türkiye – Yunanistan (1923)", açıkl: "Lozan Barış Antlaşması'yla Yunanistan'daki Türkler ile Türkiye'deki Rumlar yer değiştirmiştir. Yaklaşık 1,2 milyon Rum ve 400.000 Türk bu mübadeleden etkilenmiştir.", color: C5 },
              { baş: "Romanya – Bulgaristan", açıkl: "20. yüzyıl boyunca bu iki ülke arasında da mübadele göçleri yaşanmış; etnik gruplar karşılıklı olarak yer değiştirmiştir.", color: "#fb923c" },
            ].map(item => (
              <div key={item.baş} style={{ padding: "10px 12px", background: "rgba(0,0,0,0.3)", borderRadius: 8, border: `1px solid ${item.color}18` }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: item.color, marginBottom: 4, fontFamily: FONT }}>📍 {item.baş}</div>
                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.55, fontFamily: FONT }}>{item.açıkl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Venezuela & Afrika */}
        <div style={{ padding: "14px 16px", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#94a3b8", marginBottom: 10, fontFamily: FONT }}>📌 Güncel Göç Örnekleri</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { baş: "🇻🇪 Venezuela (2018-2024)", color: C, açıkl: "Siyasi baskı ve ekonomik kriz nedeniyle nüfusun yaklaşık ⅕'i (5,7 milyon kişi) ülkeden göç etti. Kolombiya, Peru ve Ekvador başlıca hedef ülkeler oldu." },
              { baş: "🇨🇳 Çin → Afrika İşçi Göçü", color: C2, açıkl: "2000'li yıllardan itibaren Çin'in Afrika'daki madencilik, enerji ve inşaat yatırımları; 1-2 milyon Çinlinin Afrika ülkelerine göç etmesine yol açtı." },
            ].map(item => (
              <div key={item.baş} style={{ padding: "10px 12px", background: "rgba(0,0,0,0.3)", borderRadius: 8, border: `1px solid ${item.color}18` }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: item.color, marginBottom: 4, fontFamily: FONT }}>{item.baş}</div>
                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.55, fontFamily: FONT }}>{item.açıkl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    /* ── Beyin Göçü & İklim Göçleri ────────────────────────────────────── */
    if (sec === "beyin") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Beyin Göçü */}
        <div style={{ padding: "14px 16px", background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.22)", borderRadius: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#a78bfa", marginBottom: 8, fontFamily: FONT }}>🧠 Beyin Göçü</div>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 12px", fontFamily: FONT, lineHeight: 1.65 }}>
            İyi eğitim almış ve nitelikli kişilerin kendi alanlarında çalışma olanağı bulmak,
            daha yüksek kazanç sağlamak ve yaşam koşullarını iyileştirmek amacıyla başka
            ülkelere göç etmesidir.
          </p>
          {/* Aziz Sancar bilgi kutusu */}
          <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.35)", borderRadius: 10, border: "1px solid rgba(167,139,250,0.15)" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#a78bfa", marginBottom: 6, fontFamily: FONT }}>👨‍🔬 Aziz Sancar — Örnek Olay</div>
            <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.65, fontFamily: FONT }}>
              1946 yılında Mardin'in Savur ilçesinde doğan Aziz Sancar, İstanbul Tıp Fakültesi'ni birincilikle
              bitirdi. Mardin'de iki yıl hekimlik yaptıktan sonra <strong style={{ color: "#a78bfa" }}>TÜBİTAK bursu</strong> ile
              ABD'ye göç etti. Johns Hopkins ve Teksas Üniversitesi'nde DNA onarımı, kanser tedavisi
              ve biyolojik saat üzerine çalıştı; 415 bilimsel makale ve 33 kitap yayımladı.
              <strong style={{ color: C3 }}> 7 Ekim 2015'te Nobel Kimya Ödülü'nü kazandı.</strong>
            </div>
          </div>
          {/* Etki tablosu */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
            {[
              { per: "Göçen Kişi", artı: ["Yüksek gelir", "Kariyer fırsatı"], eksi: ["Aile ayrılığı", "Kültürel uyum sorunu"], color: "#a78bfa" },
              { per: "Ayrıldığı Ülke", artı: ["Döviz transferi (remitans)"], eksi: ["Nitelikli iş gücü kaybı", "Beyin kaybı"], color: C5 },
              { per: "Gittiği Ülke", artı: ["Nitelikli iş gücü kazancı", "İnovasyon artışı"], eksi: ["Uzun vadede kaynak maliyeti"], color: C2 },
            ].map(col => (
              <div key={col.per} style={{ padding: "10px 11px", background: "rgba(0,0,0,0.3)", borderRadius: 8, border: `1px solid ${col.color}20` }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: col.color, marginBottom: 6, fontFamily: FONT }}>{col.per}</div>
                {col.artı.map(a => <div key={a} style={{ fontSize: 10, color: C2, marginBottom: 3, fontFamily: FONT }}>✓ {a}</div>)}
                {col.eksi.map(e => <div key={e} style={{ fontSize: 10, color: "#f87171", marginBottom: 3, fontFamily: FONT }}>✗ {e}</div>)}
              </div>
            ))}
          </div>
        </div>

        {/* İklim Kaynaklı Göçler */}
        <div style={{ padding: "14px 16px", background: `${C5}0d`, border: `1px solid ${C5}25`, borderRadius: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C5, marginBottom: 8, fontFamily: FONT }}>🌡️ İklim Kaynaklı Göçler</div>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 12px", fontFamily: FONT, lineHeight: 1.65 }}>
            İklim değişikliği; seller, kuraklık, buzul erimesi ve deniz seviyesi yükselmesi aracılığıyla
            milyonlarca insanı yurtlarını terk etmek zorunda bırakmaktadır.
          </p>
          {[
            { icon: "🧊", başlık: "Permafrost Erimesi", yer: "Kanada kuzey, Alaska, Sibirya", açıkl: "Donmuş zemin çözülünce yollar çöküyor, evler hasar görüyor, günlük hayat tehdit altına giriyor." },
            { icon: "🌊", başlık: "Yükselen Deniz Seviyeleri", yer: "Pasifik Adaları (Tuvalu, Kiribati, Marshall)", açıkl: "Alçak kıyılardaki aileler daha yüksek yerlere ya da komşu ülkelere sığınmak zorunda kalıyor." },
            { icon: "☀", başlık: "Kuraklık & Çölleşme", yer: "Afrika Boynuzu (Etiyopya, Somali, Kenya…)", açıkl: "Su kıtlığı ve gıda yetersizliği, kırsal halkı kentlere ya da ülke dışına göç etmeye itiyor." },
          ].map(item => (
            <div key={item.başlık} style={{ padding: "10px 12px", background: "rgba(0,0,0,0.3)", borderRadius: 8, marginBottom: 8, border: `1px solid ${C5}15` }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: C5, marginBottom: 2, fontFamily: FONT }}>{item.başlık} — <span style={{ color: "#f97316", fontSize: 10 }}>{item.yer}</span></div>
                  <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.55, fontFamily: FONT }}>{item.açıkl}</div>
                </div>
              </div>
            </div>
          ))}
          <div style={{ padding: "10px 12px", background: `${C}0a`, border: `1px solid ${C}20`, borderRadius: 8, marginTop: 4 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: FONT, lineHeight: 1.55 }}>
              💡 <strong style={{ color: C }}>Türkiye bağlantısı:</strong> Aşırı sıcak dalgaları, kuraklık ve su kıtlığı Türkiye'de de kırsaldan kente
              iç göçü tetikleyebilir; Güneydoğu illerinde mevsimsel tarım göçleri bu sürecin öncü göstergesidir.
            </div>
          </div>
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
      const emoji = pct >= 90 ? "🌍" : pct >= 70 ? "✈" : "🗺";
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 52 }}>{emoji}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#e2e8f0", fontFamily: FONT }}>Test Tamamlandı!</div>
          <div style={{ fontSize: 56, fontWeight: 800, fontFamily: MONO, color: pct >= 70 ? C2 : C5 }}>{score}<span style={{ fontSize: 26, color: "#475569" }}>/{TEST_ITEMS.length}</span></div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C, fontFamily: MONO }}>{pct}%</div>
          <div style={{ fontSize: 13, color: "#475569", fontFamily: FONT }}>
            {pct >= 90 ? "Harika! Nüfus dağılışı ve göç konularına hakimsin." : pct >= 70 ? "İyi iş çıkardın! Birkaç konuyu tekrar etmeni öneririm." : "Konuları tekrar gözden geçirmeni öneririm."}
          </div>
          {/* Detaylı sonuçlar */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {TEST_ITEMS.map((q, i) => {
              const ok = answers[i] === q.ans;
              return (
                <div key={i} style={{ padding: "10px 14px", background: ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${ok ? "#10b98130" : "#ef444430"}`, borderRadius: 8, textAlign: "left" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ok ? C2 : "#ef4444", marginBottom: 4, fontFamily: FONT }}>{ok ? "✓" : "✗"} S{i + 1}. {q.q}</div>
                  {!ok && <div style={{ fontSize: 11, color: "#64748b", fontFamily: FONT, lineHeight: 1.5 }}>✅ Doğru cevap: <strong style={{ color: C2 }}>{q.opts[q.ans]}</strong></div>}
                  {!ok && <div style={{ fontSize: 11, color: "#475569", fontFamily: FONT, marginTop: 3, lineHeight: 1.5 }}>{q.ac}</div>}
                </div>
              );
            })}
          </div>
          <button onClick={() => { setAnswers({}); setRevealed({}); setTestDone(false); sndClick(); }}
            style={{ padding: "12px 28px", background: `linear-gradient(90deg,#0c4a6e,${C})`, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: FONT, marginTop: 8 }}>
            🔄 Testi Tekrar Çöz
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 12, color: "#475569", fontFamily: FONT }}>
          Her soruyu dikkatle okuyun ve tek bir seçenek işaretleyin.
        </div>
        {TEST_ITEMS.map((q, qi) => {
          const chosen  = answers[qi];
          const isRev   = revealed[qi];
          return (
            <div key={qi} style={{ padding: "16px 18px", background: "rgba(0,0,0,0.3)", border: `1px solid ${isRev ? (chosen === q.ans ? "#10b98130" : "#ef444430") : "rgba(255,255,255,0.07)"}`, borderRadius: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 12, fontFamily: FONT, lineHeight: 1.55 }}>
                <span style={{ color: C, fontFamily: MONO, marginRight: 6 }}>{qi + 1}.</span>{q.q}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {q.opts.map((opt, oi) => {
                  let bg = "rgba(0,0,0,0.25)";
                  let border = "rgba(255,255,255,0.07)";
                  let col = "#94a3b8";
                  if (isRev) {
                    if (oi === q.ans) { bg = "rgba(16,185,129,0.10)"; border = "#10b98140"; col = "#10b981"; }
                    else if (oi === chosen) { bg = "rgba(239,68,68,0.10)"; border = "#ef444440"; col = "#ef4444"; }
                  } else if (chosen === oi) {
                    bg = `${C}12`; border = `${C}50`; col = C;
                  }
                  return (
                    <div key={oi} onClick={() => { if (!isRev) { sndClick(); setAnswers(a => ({ ...a, [qi]: oi })); } }}
                      style={{ padding: "9px 13px", background: bg, border: `1.5px solid ${border}`, borderRadius: 8, cursor: isRev ? "default" : "pointer", fontSize: 12, fontWeight: 600, color: col, fontFamily: FONT, display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, flexShrink: 0, color: col }}>
                        {isRev && oi === q.ans ? "✓" : isRev && oi === chosen ? "✗" : chosen === oi && !isRev ? "●" : "○"}
                      </span>
                      {opt}
                    </div>
                  );
                })}
              </div>
              {chosen !== undefined && !isRev && (
                <button onClick={() => { setRevealed(r => ({ ...r, [qi]: true })); chosen === q.ans ? sndOK() : sndFail(); }}
                  style={{ marginTop: 10, padding: "8px 18px", background: `${C}18`, border: `1px solid ${C}40`, borderRadius: 7, color: C, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                  Cevabı Kontrol Et
                </button>
              )}
              {isRev && (
                <div style={{ marginTop: 10, padding: "9px 12px", background: chosen === q.ans ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)", border: `1px solid ${chosen === q.ans ? "#10b98125" : "#ef444425"}`, borderRadius: 8, fontSize: 11, color: "#94a3b8", fontFamily: FONT, lineHeight: 1.55 }}>
                  {q.ac}
                </div>
              )}
            </div>
          );
        })}
        {Object.keys(revealed).length === TEST_ITEMS.length && (
          <button onClick={() => { setTestDone(true); }}
            style={{ padding: "13px", background: `linear-gradient(90deg,#0c4a6e,${C})`, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: FONT }}>
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
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 20px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: 9, color: C, letterSpacing: 4, fontWeight: 800, fontFamily: MONO, marginBottom: 4 }}>4. ÜNİTE · BEŞERİ SİSTEMLER VE SÜREÇLER</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${C}30,${C}08)`, border: `1px solid ${C}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🌍</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.2, fontFamily: FONT }}>Nüfusun Dağılışı ve Hareketleri</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 2, fontFamily: FONT }}>4.1.2 — Faktörler · Göç Türleri · Tarihsel Göçler · Beyin Göçü</div>
          </div>
        </div>
        {/* Sekmeler */}
        <div style={{ display: "flex", marginTop: 12 }}>
          <TabBtn id="learn" label="ÖĞREN" icon="📖" />
          <TabBtn id="act"   label="ETKİNLİK" icon="🎯" />
          <TabBtn id="test"  label="TEST" icon="📝" />
        </div>
      </div>

      {/* ─── İçerik ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 0 }}>
        {/* Sol menü (sadece ÖĞREN'de) */}
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

            {/* Hızlı özet */}
            <div style={{ marginTop: 16, padding: "12px 10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10 }}>
              <div style={{ fontSize: 9, color: "#475569", letterSpacing: 2, fontWeight: 800, marginBottom: 8, fontFamily: MONO }}>ÖZET</div>
              {[
                ["Nüfus Yoğunluğu", "Km² başına kişi sayısı"],
                ["Doğal Faktörler", "İklim, yer şekli, su"],
                ["Beşerî Faktörler", "Sanayi, ulaşım, tarım"],
                ["İç Göç", "Ülke içi hareket"],
                ["Dış Göç", "Ülke dışına çıkış"],
                ["Beyin Göçü", "Nitelikli iş gücü kaybı"],
              ].map(([k, v]) => (
                <div key={k as string} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 9, color: C, fontWeight: 800, fontFamily: MONO }}>{k as string}</div>
                  <div style={{ fontSize: 9, color: "#475569", fontFamily: FONT }}>{v as string}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sağ içerik */}
        <div style={{ flex: 1, padding: 18, overflowY: "auto" }}>
          {tab === "learn" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 22 }}>{activeSec.ikon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: activeSec.color, fontFamily: FONT }}>{activeSec.label}</div>
                  <div style={{ fontSize: 10, color: "#475569", fontFamily: MONO, letterSpacing: 1 }}>4.1.2 · KONU {SECTIONS.findIndex(s => s.id === sec) + 1}/{SECTIONS.length}</div>
                </div>
              </div>
              {renderLearn()}
            </>
          )}
          {tab === "act"   && <FaktorAktivite />}
          {tab === "test"  && renderTest()}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 20px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10, color: "#1e3a5f", fontFamily: MONO }}>9. SINIF COĞRAFYA · 4.1.2</div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {SECTIONS.map(s => (
            <div key={s.id} onClick={() => { if (tab !== "learn") { sndClick(); setTab("learn"); } setSec(s.id); sndClick(); }}
              style={{ width: 8, height: 8, borderRadius: "50%", background: sec === s.id && tab === "learn" ? s.color : "#1e3a5f", cursor: "pointer", transition: "background 0.2s" }} />
          ))}
        </div>
      </div>
    </div>
  );
}