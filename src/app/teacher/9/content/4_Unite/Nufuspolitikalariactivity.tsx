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

/* ─── Stil sabitleri ─────────────────────────────────────────────────────── */
const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const MONO = "'Courier New',Courier,monospace";
const BG   = "#0c0e0a";
const C    = "#84cc16";   // lime    — ana renk / büyüme/politika
const C2   = "#f97316";   // turuncu — artırma politikası
const C3   = "#38bdf8";   // sky     — azaltma politikası
const C4   = "#a78bfa";   // violet  — Türkiye
const C5   = "#fb7185";   // rose    — sorunlar

type Tab      = "learn" | "act" | "test";
type LearnSec = "tanim" | "turleri" | "azaltma" | "artirma" | "diger" | "turkiye";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VERİ: Politika Türleri
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const POLITIKA_TURLERI = [
  {
    id: "azaltma", ikon: "📉", ad: "Nüfus Artış Hızını Azaltma",
    color: C3, tag: "Anti-natalist",
    hedef: "Doğurganlığı ve nüfus artışını düşürmek",
    kim: "Gelişmekte olan ülkeler",
    ornekUlke: "Hindistan, Pakistan, Afganistan",
    uygulamalar: ["Aile planlaması ve doğum kontrolü", "Kadın eğitimi ve istihdamı", "Evlilik yaşını yükseltme", "Doğum teşviklerini kaldırma"],
    neden: "Hızlı nüfus artışı doğal kaynakların aşırı tüketimi, yetersiz beslenme, konut açığı ve işsizlik gibi sorunlara yol açar.",
  },
  {
    id: "artirma", ikon: "📈", ad: "Nüfus Artış Hızını Artırma",
    color: C2, tag: "Pro-natalist",
    hedef: "Doğurganlığı ve nüfus artışını yükseltmek",
    kim: "Gelişmiş ülkeler",
    ornekUlke: "Almanya, Japonya, İsveç, Fransa",
    uygulamalar: ["Doğum sonrası ücretli izin (anne + baba)", "Çocuk ve konut yardımı", "Ücretsiz kreş ve sağlık hizmeti", "Okul öncesi ücretsiz eğitim"],
    neden: "Genç nüfusu azalan, iş gücü açığı büyüyen ve yaşlı nüfus oranı artan gelişmiş ülkeler bu politikaya yönelir.",
  },
  {
    id: "dagilim", ikon: "🗺", ad: "Nüfusun Ülke İçindeki Dağılışını Düzenleme",
    color: C, tag: "Dağılım",
    hedef: "Bölgesel dengesizlikleri gidermek",
    kim: "Her gelişmişlik düzeyinden ülkeler",
    ornekUlke: "Kanada, Avustralya, Endonezya, Norveç, Çin, Hindistan",
    uygulamalar: ["Büyük kentlerden küçük yerleşim birimlerine teşvik", "Bölgesel kalkınma yatırımları", "Altyapı eşitsizliklerini giderme"],
    neden: "Büyük şehirlerde aşırı yoğunlaşma; ulaşım, konut ve çevre sorunlarına yol açar.",
  },
  {
    id: "goc", ikon: "✈", ad: "Göç Politikası Belirleme",
    color: "#34d399", tag: "Göç",
    hedef: "İş gücü açığını göçle kapatmak",
    kim: "İş gücü ihtiyacı fazla gelişmiş ülkeler",
    ornekUlke: "Almanya, Katar, ABD, Kanada, Avustralya",
    uygulamalar: ["Nitelikli göçmenlere vize kolaylığı", "Çalışma izni ve yerleşim teşviki", "Göçmen entegrasyon programları"],
    neden: "Çalışma çağındaki nüfus yetersizken ekonomik büyüme devam ettiğinde ülkeler dış göçe kapılarını açar.",
  },
  {
    id: "iyilestirme", ikon: "🎓", ad: "Demografik Yapıyı İyileştirme",
    color: "#e879f9", tag: "Nitelik",
    hedef: "Mevcut nüfusun eğitim, sağlık ve istihdam kalitesini artırmak",
    kim: "Orta gelirli / geç sanayi ülkeleri",
    ornekUlke: "Brezilya, Çin, Türkiye geçiş dönemi",
    uygulamalar: ["Okur-yazarlık ve eğitim oranını artırma", "Sağlık yatırımları ve bebek ölüm hızını düşürme", "Sanayi-hizmet sektörü istihdamını genişletme"],
    neden: "Nüfus miktarı yeterli ama nitelik düşükse ülkenin ekonomik potansiyeli tam kullanılamaz.",
  },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VERİ: Senaryo Kartları (Aktivite)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
interface SK { id: string; senaryo: string; politikaId: string; }
const SENARYOLAR: SK[] = [
  { id: "s1", senaryo: "Japonya'da nüfus artış hızı negatife döndü; iş gücü sıkıntısı yaşanıyor.", politikaId: "artirma" },
  { id: "s2", senaryo: "Hindistan'da her yıl 15 milyonluk nüfus artışı kaynakları tüketiyor.", politikaId: "azaltma" },
  { id: "s3", senaryo: "Kanada'da kırsal bölgeler boşalırken Toronto aşırı kalabalıklaşıyor.", politikaId: "dagilim" },
  { id: "s4", senaryo: "Almanya'da inşaat sektörü için yeterli iş gücü bulunamamaktadır.", politikaId: "goc" },
  { id: "s5", senaryo: "Brezilya'da işsizlik yüksek; fabrikalar eğitimli iş gücü bulamıyor.", politikaId: "iyilestirme" },
  { id: "s6", senaryo: "İsveç'te çiftler iş kariyer kaygısıyla çocuk sahibi olmayı erteliyor.", politikaId: "artirma" },
  { id: "s7", senaryo: "Pakistan'da hızlı nüfus artışı nedeniyle okullar kapasiteyi aşıyor.", politikaId: "azaltma" },
  { id: "s8", senaryo: "Avustralya'da kıyı şehirleri dolup taşarken iç bölgeler ıssız kalıyor.", politikaId: "dagilim" },
  { id: "s9", senaryo: "Katar petrol sektöründe çalıştırmak üzere teknik personel arıyor.", politikaId: "goc" },
  { id: "s10", senaryo: "Türkiye'de sanayiye geçişle birlikte nitelikli iş gücü açığı oluştu.", politikaId: "iyilestirme" },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TEST SORULARI
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const TEST_ITEMS = [
  {
    q: "Nüfus politikası kavramının en doğru tanımı aşağıdakilerden hangisidir?",
    opts: [
      "Ülkelerin göç oranını belirlemek amacıyla aldığı kararlar",
      "Ülkelerin nüfusun yapısı, dağılışı, nitelik ve niceliğine yönelik aldığı karar ve uygulamalar",
      "Yalnızca doğum oranını artırmaya yönelik devlet politikaları",
      "Kentleşme hızını kontrol etmeye yönelik belediye kararları",
    ],
    ans: 1,
    ac: "Nüfus politikası; ülkelerin nüfusun yapısı, dağılışı, nitelik ve niceliğine yönelik aldığı karar ve uygulamaların tümüdür.",
  },
  {
    q: "Aşağıdakilerden hangisi pro-natalist (nüfus artırma) politikasına örnek değildir?",
    opts: [
      "Doğum sonrası ücretli ebeveyn izni",
      "Ücretsiz kreş hizmeti",
      "Aile planlaması ve doğum kontrolü destekleri",
      "Konut ve çocuk yardımı",
    ],
    ans: 2,
    ac: "Aile planlaması ve doğum kontrolü, nüfus artışını azaltmayı hedefleyen anti-natalist politikanın uygulamalarıdır; pro-natalist değildir.",
  },
  {
    q: "İsveç'in nüfus artış hızı düşük olan gelişmiş ülkeler için model sayılmasının temel nedeni nedir?",
    opts: [
      "Ülkeye yoğun göç alarak nüfusunu artırması",
      "Aile politikaları ve teşviklerle doğurganlığı yükseltmeyi başarması",
      "Doğal nüfus artışını olumsuz etkileyen savaşlardan uzak durması",
      "Nüfusunu dünyanın her yerine ihraç eden beyin göçü politikası",
    ],
    ans: 1,
    ac: "İsveç; ücretli ebeveyn izni, kreş desteği, ücretsiz sağlık ve eğitim gibi aile odaklı politikalarla son 20 yılda nüfus artış hızını yükseltmeyi başardığından model ülke sayılmaktadır.",
  },
  {
    q: "Almanya, Katar ve Kanada'nın uyguladığı ortak nüfus politikası aşağıdakilerden hangisidir?",
    opts: [
      "Nüfus artış hızını azaltma",
      "Nüfusun dağılışını düzenleme",
      "Göç politikası belirleme (göç alma)",
      "Demografik yapıyı iyileştirme",
    ],
    ans: 2,
    ac: "Almanya, Katar ve Kanada; çalışma çağındaki nüfus yetersizliğini ve iş gücü açığını kapatmak amacıyla göç almaya yönelik politikalar uygulamaktadır.",
  },
  {
    q: "Demografik fırsat penceresi kavramı nasıl tanımlanır?",
    opts: [
      "Doğum oranının ölüm oranının iki katına çıktığı dönem",
      "Bir ülkede çalışma çağındaki nüfusun bağımlı nüfustan daha yüksek olduğu dönem",
      "Nüfusun en hızlı büyüdüğü demografik dönüşüm aşaması",
      "Göç almaya başlayan ülkenin yaşadığı nüfus artış dönemi",
    ],
    ans: 1,
    ac: "Demografik fırsat penceresi; bir ülkede çalışma çağındaki nüfusun oranının bağımlı nüfus (çocuk ve yaşlı) oranından daha yüksek olduğu dönemdir.",
  },
  {
    q: "Hızlı nüfus artışının yarattığı sorunların önüne geçmek için aşağıdaki ülkelerin hangisinin nüfus artış hızını azaltma politikası uygulaması beklenir?",
    opts: ["Japonya", "Almanya", "Pakistan", "İsveç"],
    ans: 2,
    ac: "Pakistan; doğum oranının yüksek olduğu ve bu nedenle eğitim, sağlık, konut gibi hizmetlerin yetersiz kaldığı gelişmekte olan bir ülke olarak anti-natalist politikaya ihtiyaç duymaktadır.",
  },
  {
    q: "Türkiye'de 1965'ten sonra nüfus politikasının değişmesinin temel nedeni nedir?",
    opts: [
      "Savaş kayıpları nedeniyle nüfusun azalması",
      "Hızlı nüfus artışının ekonomik ve sosyal sorunlara yol açması",
      "Ülkenin beyin göçü vererek iş gücünü yitirmesi",
      "Doğal afetlerin nüfusu önemli ölçüde azaltması",
    ],
    ans: 1,
    ac: "Türkiye'de 1950'lerin yüksek nüfus artış hızı, ekonomik kaynaklar üzerinde baskı oluşturunca politika değişti ve aile planlaması uygulamalarına geçildi.",
  },
  {
    q: "Endonezya, Norveç ve Avustralya'nın nüfus politikaları hangi kategoride değerlendirilebilir?",
    opts: [
      "Nüfus artış hızını azaltma",
      "Demografik yapıyı iyileştirme",
      "Nüfusun ülke içindeki dağılışını düzenleme",
      "Göç politikası belirleme",
    ],
    ans: 2,
    ac: "Endonezya, Norveç ve Avustralya; büyük kentlerdeki aşırı yoğunlaşmayı azaltıp iç bölgeleri kalkındırmak amacıyla nüfusun ülke içindeki dağılışını düzenleyen politikalar uygulamaktadır.",
  },
  {
    q: "Bir ülkede nüfus artış hızının düşük olmasının yarattığı sorunlardan hangisi doğrudan beklenir?",
    opts: [
      "Kaynak ve toprak üzerindeki baskının artması",
      "Çarpık kentleşme ve gecekondu sorunu",
      "İş gücü açığı ve ekonomik yavaşlama riski",
      "Eğitim ve sağlık hizmetlerinin yetersiz kalması",
    ],
    ans: 2,
    ac: "Nüfus artış hızı düşük olduğunda genç nüfus oranı azalır, çalışma çağındaki nüfus giderek küçülür ve bu durum iş gücü açığına ve ekonomik yavaşlamaya neden olur.",
  },
  {
    q: "Brezilya'daki favela oluşumunun temel nedeni aşağıdakilerden hangisidir?",
    opts: [
      "Doğal afetler ve iklim değişikliği",
      "Hızlı nüfus artışı ve kırdan kente göç",
      "Dış göç politikalarının gevşemesi",
      "Beyin göçünün artması",
    ],
    ans: 1,
    ac: "Brezilya'da hızlı nüfus artışı ve kırdan kente göç sonucunda kentlerin kaldıramayacağı nüfus kitlesi favela adı verilen gecekondu yerleşmelerinin ortaya çıkmasına neden olmuştur.",
  },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SVG: İsveç Nüfus Artış Hızı Çizgi Grafiği (1997–2022)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function IsveçGrafik() {
  const data = [
    0.04, 0.02, 0.03, 0.05, 0.06, 0.08, 0.07, 0.07, 0.09, 0.13,
    0.16, 0.16, 0.09, 0.08, 0.10, 0.13, 0.17, 0.15, 0.14, 0.13,
    0.06, 0.08, 0.13, 0.14, 0.15,
  ]; // approximate ‰ values 1997–2022
  const yillar = Array.from({ length: 26 }, (_, i) => 1997 + i);
  const W = 440, H = 140;
  const pad = { l: 28, r: 12, t: 16, b: 24 };
  const gW = W - pad.l - pad.r, gH = H - pad.t - pad.b;
  const maxV = 0.2;
  const xS = (i: number) => pad.l + (i / (data.length - 1)) * gW;
  const yS = (v: number) => pad.t + gH - (v / maxV) * gH;
  const poly = data.map((v, i) => `${xS(i)},${yS(v)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
      {[0, 0.05, 0.10, 0.15, 0.20].map(v => (
        <line key={v} x1={pad.l} x2={W - pad.r} y1={yS(v)} y2={yS(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {[0, 0.05, 0.10, 0.15, 0.20].map(v => (
        <text key={v} x={pad.l - 4} y={yS(v) + 4} textAnchor="end" fontSize="7" fill="#334155" fontFamily={MONO}>{v.toFixed(2)}</text>
      ))}
      <polygon points={`${xS(0)},${yS(0)} ${poly} ${xS(data.length - 1)},${yS(0)}`} fill={`${C2}18`} />
      <polyline points={poly} fill="none" stroke={C2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {[0, 5, 10, 15, 20, 25].map(i => (
        <text key={i} x={xS(i)} y={H - 4} textAnchor="middle" fontSize="7" fill="#334155" fontFamily={MONO}>{yillar[i]}</text>
      ))}
      <line x1={pad.l} y1={yS(0)} x2={W - pad.r} y2={yS(0)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <text x={pad.l + 6} y={pad.t + 12} fontSize="8" fill={C2} fontFamily={FONT} fontWeight="700">‰ Nüfus Artış Hızı</text>
    </svg>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SVG: Türkiye Nüfus Politikası Zaman Çizelgesi
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function TurkiyeZaman() {
  const donemler = [
    { yil: "1923–1960", politika: "Pro-natalist", acikl: "Nüfusu artır", color: C2, x: 0 },
    { yil: "1965–1980", politika: "Anti-natalist", acikl: "Aile planlaması", color: C3, x: 160 },
    { yil: "1980–2000", politika: "Geçiş", acikl: "Nitelik odaklı", color: C, x: 320 },
    { yil: "2000–bugün", politika: "Pro-natalist", acikl: "En az 3 çocuk", color: C4, x: 480 },
  ];
  const W = 660, H = 90;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
      {/* Zaman çizgisi */}
      <line x1={30} y1={44} x2={W - 30} y2={44} stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      {donemler.map((d, i) => (
        <g key={i}>
          {/* Nokta */}
          <circle cx={d.x + 60} cy={44} r={8} fill={`${d.color}22`} stroke={d.color} strokeWidth="2" />
          <circle cx={d.x + 60} cy={44} r={3} fill={d.color} />
          {/* Dönem etiketleri — alternatif yukarı/aşağı */}
          {i % 2 === 0 ? (
            <>
              <line x1={d.x + 60} y1={36} x2={d.x + 60} y2={16} stroke={`${d.color}50`} strokeWidth="1" strokeDasharray="2,2" />
              <text x={d.x + 60} y={12} textAnchor="middle" fontSize="8.5" fill={d.color} fontFamily={FONT} fontWeight="800">{d.politika}</text>
              <text x={d.x + 60} y={24} textAnchor="middle" fontSize="7.5" fill={`${d.color}80`} fontFamily={FONT}>{d.acikl}</text>
            </>
          ) : (
            <>
              <line x1={d.x + 60} y1={52} x2={d.x + 60} y2={72} stroke={`${d.color}50`} strokeWidth="1" strokeDasharray="2,2" />
              <text x={d.x + 60} y={82} textAnchor="middle" fontSize="8.5" fill={d.color} fontFamily={FONT} fontWeight="800">{d.politika}</text>
              <text x={d.x + 60} y={68} textAnchor="middle" fontSize="7.5" fill={`${d.color}80`} fontFamily={FONT}>{d.acikl}</text>
            </>
          )}
          <text x={d.x + 60} y={57} textAnchor="middle" fontSize="7" fill="#475569" fontFamily={MONO}>{d.yil}</text>
        </g>
      ))}
    </svg>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BILEŞEN: Aktivite — Senaryo Kartlarını Politikayla Eşleştir
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function SenaryoAktivite() {
  const POLITIKA_MAP: Record<string, { ad: string; color: string; ikon: string }> = {
    azaltma:     { ad: "Artış Hızını Azaltma", color: C3, ikon: "📉" },
    artirma:     { ad: "Artış Hızını Artırma", color: C2, ikon: "📈" },
    dagilim:     { ad: "Dağılışı Düzenleme",   color: C,  ikon: "🗺" },
    goc:         { ad: "Göç Politikası",        color: "#34d399", ikon: "✈" },
    iyilestirme: { ad: "Demografik İyileştirme", color: "#e879f9", ikon: "🎓" },
  };

  const [secilenKart, setSecilenKart] = useState<string | null>(null);
  const [eslestirme, setEslestirme] = useState<Record<string, string>>({}); // senaryoId → politikaId
  const [yanlis, setYanlis] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);

  const handlePolitikaClick = (polId: string) => {
    if (!secilenKart) return;
    const sn = SENARYOLAR.find(s => s.id === secilenKart)!;
    const ok = sn.politikaId === polId;
    const ne = { ...eslestirme, [secilenKart]: polId };
    const ny = { ...yanlis, [secilenKart]: !ok };
    setEslestirme(ne); setYanlis(ny);
    if (ok) sndOK(); else sndFail();
    setSecilenKart(null);
    if (Object.keys(ne).length === SENARYOLAR.length) setTimeout(() => setDone(true), 450);
  };

  const retry = () => { setSecilenKart(null); setEslestirme({}); setYanlis({}); setDone(false); };
  const score = SENARYOLAR.filter(s => !yanlis[s.id] && eslestirme[s.id] !== undefined).length;

  if (done) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "44px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 52 }}>🏛️</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#e2e8f0", fontFamily: FONT }}>Tüm Senaryolar Eşleştirildi!</div>
      <div style={{ fontSize: 52, fontWeight: 800, color: score >= 8 ? "#34d399" : C5, fontFamily: MONO }}>{score}/{SENARYOLAR.length}</div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 7 }}>
        {SENARYOLAR.map(s => {
          const ok = !yanlis[s.id];
          const pol = POLITIKA_MAP[s.politikaId];
          return (
            <div key={s.id} style={{ padding: "9px 13px", background: ok ? "rgba(52,211,153,0.08)" : "rgba(251,113,133,0.08)", border: `1px solid ${ok ? "#34d39930" : "#fb718530"}`, borderRadius: 9, textAlign: "left", display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 16 }}>{pol.ikon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#64748b", fontFamily: FONT, marginBottom: 2 }}>{s.senaryo}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: ok ? "#34d399" : C5, fontFamily: FONT }}>{ok ? "✓ " : "✗ Doğrusu: "}{pol.ad}</div>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={retry}
        style={{ marginTop: 8, padding: "12px 28px", background: `linear-gradient(90deg,#1a2e08,${C})`, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: FONT }}>
        🔄 Tekrar Dene
      </button>
    </div>
  );

  const bekleyen = SENARYOLAR.filter(s => !eslestirme[s.id]);
  const biten = SENARYOLAR.filter(s => eslestirme[s.id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontSize: 10, color: C, letterSpacing: 3, fontWeight: 800, fontFamily: MONO, marginBottom: 4 }}>ETKİNLİK</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#e2e8f0", fontFamily: FONT }}>🏛️ Senaryoyu Nüfus Politikasıyla Eşleştir</div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 3, fontFamily: FONT }}>
          Bir senaryo seç, ardından hangi politikaya uyduğuna tıkla
        </div>
      </div>

      {/* Senaryo kartları */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 10, color: "#334155", letterSpacing: 2, fontWeight: 800, fontFamily: FONT, marginBottom: 2 }}>SENARYOLAR</div>
        {bekleyen.map(s => (
          <div key={s.id} onClick={() => { sndClick(); setSecilenKart(secilenKart === s.id ? null : s.id); }}
            style={{
              padding: "10px 14px", borderRadius: 10, cursor: "pointer",
              background: secilenKart === s.id ? `${C}15` : "rgba(0,0,0,0.35)",
              border: `1.5px solid ${secilenKart === s.id ? C + "60" : "rgba(255,255,255,0.08)"}`,
              fontSize: 12, color: secilenKart === s.id ? "#e2e8f0" : "#64748b",
              fontFamily: FONT, lineHeight: 1.5, transition: "all 0.15s",
            }}>
            {secilenKart === s.id && <span style={{ color: C, fontWeight: 800, marginRight: 6 }}>▶</span>}
            {s.senaryo}
          </div>
        ))}
        {biten.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
            {biten.map(s => {
              const pol = POLITIKA_MAP[s.politikaId];
              const ok = !yanlis[s.id];
              return (
                <div key={s.id} style={{ padding: "5px 10px", borderRadius: 7, fontSize: 10, fontWeight: 700, fontFamily: FONT, background: ok ? "rgba(52,211,153,0.08)" : "rgba(251,113,133,0.08)", border: `1px solid ${ok ? "#34d39930" : "#fb718530"}`, color: ok ? "#34d399" : C5 }}>
                  {pol.ikon} {ok ? "✓" : "✗"} {s.senaryo.slice(0, 30)}…
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Politika seçim butonları */}
      <div style={{ padding: "13px 14px", background: "rgba(0,0,0,0.3)", border: `1px solid ${secilenKart ? C + "35" : "rgba(255,255,255,0.06)"}`, borderRadius: 12, transition: "border-color 0.2s" }}>
        <div style={{ fontSize: 10, color: secilenKart ? C : "#334155", letterSpacing: 2, fontWeight: 800, marginBottom: 10, fontFamily: FONT }}>
          {secilenKart ? "Hangi nüfus politikası bu sorunu çözer?" : "Önce yukarıdan bir senaryo seç"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {Object.entries(POLITIKA_MAP).map(([polId, pol]) => (
            <button key={polId} onClick={() => handlePolitikaClick(polId)}
              disabled={!secilenKart}
              style={{
                padding: "10px 10px", borderRadius: 10, cursor: secilenKart ? "pointer" : "not-allowed",
                background: secilenKart ? `${pol.color}14` : "rgba(0,0,0,0.3)",
                border: `1.5px solid ${secilenKart ? pol.color + "45" : "rgba(255,255,255,0.05)"}`,
                color: secilenKart ? pol.color : "#334155", fontFamily: FONT,
                fontSize: 11, fontWeight: 700, opacity: secilenKart ? 1 : 0.4,
                transition: "all 0.15s", textAlign: "left",
              }}>
              <span style={{ fontSize: 16, marginRight: 6 }}>{pol.ikon}</span>{pol.ad}
            </button>
          ))}
        </div>
      </div>

      {/* İlerleme */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
        <span style={{ fontSize: 12, color: "#475569", fontFamily: FONT }}>Kalan: {bekleyen.length}/{SENARYOLAR.length}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: C, fontFamily: MONO }}>{score} doğru</span>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ANA BİLEŞEN
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function NufusPolitikalariActivity({ onClose }: { onClose: () => void }) {
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
    { id: "tanim",    label: "Nüfus Politikası Nedir?", ikon: "📋", color: C    },
    { id: "turleri",  label: "Politika Türleri",         ikon: "📊", color: C2   },
    { id: "azaltma",  label: "Azaltma Politikası",       ikon: "📉", color: C3   },
    { id: "artirma",  label: "Artırma Politikası",       ikon: "📈", color: C2   },
    { id: "diger",    label: "Diğer Politikalar",        ikon: "🌐", color: "#34d399" },
    { id: "turkiye",  label: "Türkiye'nin Politikaları", ikon: "🇹🇷", color: C4  },
  ];

  /* ─── ÖĞREN içeriği ─────────────────────────────────────────────────────── */
  const renderLearn = () => {

    /* ── Tanım ───────────────────────────────────────────────────────────── */
    if (sec === "tanim") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          Nüfus, tarih boyunca askerî, siyasi ve ekonomik bir güç kaynağı olarak görülmüştür.
          Devletler bu gücü yönetmek için nüfusla ilgili politikalar geliştirmiştir.
        </p>

        {/* Tanım kutusu */}
        <div style={{ padding: "16px 18px", background: `${C}0d`, border: `2px solid ${C}35`, borderRadius: 14 }}>
          <div style={{ fontSize: 11, color: C, fontWeight: 800, fontFamily: MONO, letterSpacing: 1, marginBottom: 8 }}>📋 TANIM</div>
          <p style={{ fontSize: 14, color: "#e2e8f0", margin: 0, fontFamily: FONT, lineHeight: 1.75 }}>
            <strong style={{ color: C }}>Nüfus politikası;</strong> ülkelerin nüfusun yapısı, dağılışı, nitelik ve
            niceliğine yönelik aldığı karar ve uygulamaların tümüdür.
          </p>
        </div>

        {/* Politikayı etkileyen faktörler */}
        <div style={{ padding: "14px 16px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", marginBottom: 10, fontFamily: FONT }}>⚙️ Nüfus Politikasını Belirleyen Faktörler</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {[
              ["📊", "Doğum ve ölüm oranları"],
              ["👶", "Nüfusun yaş dağılımı"],
              ["🎓", "Eğitim düzeyi"],
              ["⚔", "Savaş ve çatışmalar"],
              ["🦠", "Salgın hastalıklar"],
              ["✈", "Göç hareketleri"],
              ["🏙", "Kentleşme hızı"],
              ["🏭", "Ekonomik iş gücü ihtiyacı"],
            ].map(([ik, ad]) => (
              <div key={ad as string} style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 9px", background: "rgba(0,0,0,0.3)", borderRadius: 7 }}>
                <span style={{ fontSize: 15 }}>{ik}</span>
                <span style={{ fontSize: 11, color: "#64748b", fontFamily: FONT }}>{ad as string}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Demografik fırsat penceresi */}
        <div style={{ padding: "14px 16px", background: `${C4}0d`, border: `1px solid ${C4}28`, borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C4, marginBottom: 8, fontFamily: FONT }}>🪟 Demografik Fırsat Penceresi</div>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, fontFamily: FONT, lineHeight: 1.65 }}>
            Bir ülkede <strong style={{ color: C4 }}>çalışma çağındaki nüfusun</strong> oranının bağımlı
            nüfus (çocuk + yaşlı) oranından daha yüksek olduğu dönemdir.
            Bu dönem; ekonomik büyüme için büyük bir fırsat sunar. Türkiye bu fırsatı
            2000'lerin başında yaşamış, 2040'lardan itibaren kapanması öngörülmektedir.
          </p>
        </div>

        {/* Politika amacı */}
        <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#475569", marginBottom: 6, fontFamily: MONO, letterSpacing: 1 }}>🎯 TEMEL HEDEF</div>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0, fontFamily: FONT, lineHeight: 1.65 }}>
            Nüfus politikasında temel hedef <strong style={{ color: C }}>nüfus artış hızının düzenlenmesidir.</strong>
            Bunun yanı sıra nüfusun yapısı, dağılışı, eğitim ve sağlık kalitesine ilişkin hedefler
            de önemli bir bileşendir. Politikalar değişen koşullara göre güncellenir.
          </p>
        </div>
      </div>
    );

    /* ── Politika Türleri — özet ──────────────────────────────────────────── */
    if (sec === "turleri") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          Ülkelerin siyasi, sosyal, ekonomik ve kültürel farklılıkları, nüfus politikalarını da
          farklılaştırır. Beş temel politika türü vardır:
        </p>
        {POLITIKA_TURLERI.map(p => (
          <div key={p.id} style={{ padding: "13px 16px", background: "rgba(0,0,0,0.3)", border: `1.5px solid ${p.color}22`, borderRadius: 12, display: "flex", gap: 13, alignItems: "flex-start" }}>
            <div style={{ fontSize: 26, flexShrink: 0, marginTop: 2 }}>{p.ikon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: p.color, fontFamily: FONT }}>{p.ad}</div>
                <span style={{ padding: "2px 8px", background: `${p.color}18`, border: `1px solid ${p.color}35`, borderRadius: 10, fontSize: 9, fontWeight: 800, color: p.color, fontFamily: FONT }}>{p.tag}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 6 }}>
                <div style={{ padding: "5px 8px", background: "rgba(0,0,0,0.3)", borderRadius: 6 }}>
                  <div style={{ fontSize: 8.5, color: "#475569", fontFamily: MONO }}>HEDEF</div>
                  <div style={{ fontSize: 10, color: p.color, fontFamily: FONT, lineHeight: 1.4 }}>{p.hedef}</div>
                </div>
                <div style={{ padding: "5px 8px", background: "rgba(0,0,0,0.3)", borderRadius: 6 }}>
                  <div style={{ fontSize: 8.5, color: "#475569", fontFamily: MONO }}>UYGULAYAN</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: FONT, lineHeight: 1.4 }}>{p.kim}</div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: "#64748b", fontFamily: FONT, lineHeight: 1.45, paddingLeft: 6, borderLeft: `2px solid ${p.color}40` }}>
                📍 Örnek: {p.ornekUlke}
              </div>
            </div>
          </div>
        ))}
      </div>
    );

    /* ── Azaltma Politikası ──────────────────────────────────────────────── */
    if (sec === "azaltma") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ padding: "14px 16px", background: `${C3}0d`, border: `2px solid ${C3}30`, borderRadius: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 26 }}>📉</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C3, fontFamily: FONT }}>Anti-Natalist Politika</div>
              <div style={{ fontSize: 11, color: `${C3}80`, fontFamily: FONT }}>Nüfus Artış Hızını Azaltma</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, fontFamily: FONT, lineHeight: 1.65 }}>
            Gelişmekte olan ülkelerde yüksek doğum oranları; eğitim, sağlık ve konut gibi
            hizmetlerin kapasitesini aşmaktadır. Bu ülkeler nüfus artış hızını düşürmeye
            yönelik politikalar uygulamak zorunda kalmaktadır.
          </p>
        </div>

        {/* Sorunlar */}
        <div style={{ padding: "13px 16px", background: "rgba(0,0,0,0.3)", border: `1px solid ${C5}22`, borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C5, marginBottom: 10, fontFamily: FONT }}>⚠️ Yüksek Nüfus Artışının Yarattığı Sorunlar</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {[
              ["🌿", "Doğal kaynakların aşırı tüketimi"],
              ["🍽", "Yetersiz beslenme ve gıda güvensizliği"],
              ["🏠", "Konut açığı ve gecekondulaşma"],
              ["💼", "Yüksek işsizlik oranları"],
              ["🏥", "Sağlık ve eğitim hizmetlerinin yetersizliği"],
              ["📉", "Kişi başına düşen millî gelirin azalması"],
            ].map(([ik, ad]) => (
              <div key={ad as string} style={{ display: "flex", gap: 7, alignItems: "flex-start", padding: "7px 9px", background: `${C5}08`, borderRadius: 7, border: `1px solid ${C5}18` }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{ik}</span>
                <span style={{ fontSize: 11, color: "#64748b", fontFamily: FONT, lineHeight: 1.4 }}>{ad as string}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Uygulamalar */}
        <div style={{ padding: "13px 16px", background: "rgba(0,0,0,0.3)", border: `1px solid ${C3}22`, borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C3, marginBottom: 10, fontFamily: FONT }}>✅ Anti-Natalist Politika Uygulamaları</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              ["🎓", "Özellikle kız çocuklarının eğitime erişimini artırma"],
              ["💊", "Ücretsiz veya destekli aile planlaması hizmetleri"],
              ["👩‍💼", "Kadınların iş hayatına katılımını teşvik etme"],
              ["📋", "Çocuk sayısıyla bağlantılı sosyal yardım kısıtlamaları"],
              ["🏙", "Kentleşme ve eğitimle doğurganlığın doğal düşüşü"],
            ].map(([ik, ad]) => (
              <div key={ad as string} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "7px 10px", background: `${C3}0a`, borderRadius: 7 }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{ik}</span>
                <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: FONT, lineHeight: 1.45 }}>{ad as string}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9 }}>
          <div style={{ fontSize: 11, color: "#64748b", fontFamily: FONT, lineHeight: 1.55 }}>
            📌 <strong style={{ color: C3 }}>Örnek ülkeler:</strong> Hindistan (1975'ten itibaren gönüllü aile planlaması), Çin (1980–2015 tek çocuk politikası — en sert anti-natalist örnek), Pakistan, Afganistan, Afrika Sahrası ülkeleri.
          </div>
        </div>
      </div>
    );

    /* ── Artırma Politikası ──────────────────────────────────────────────── */
    if (sec === "artirma") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ padding: "14px 16px", background: `${C2}0d`, border: `2px solid ${C2}30`, borderRadius: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 26 }}>📈</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C2, fontFamily: FONT }}>Pro-Natalist Politika</div>
              <div style={{ fontSize: 11, color: `${C2}80`, fontFamily: FONT }}>Nüfus Artış Hızını Artırma</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, fontFamily: FONT, lineHeight: 1.65 }}>
            Gelişmiş ülkelerde eğitim, kentleşme ve kadınların iş hayatına katılımı doğum oranlarını
            düşürmüştür. Nüfus artışının azalmasıyla yaşlı nüfus artar, iş gücü daralır ve ekonomi
            baskı altına girer. Bu ülkeler doğurganlığı teşvik eden politikalara yönelir.
          </p>
        </div>

        {/* İsveç modeli */}
        <div style={{ padding: "14px 16px", background: "rgba(0,0,0,0.3)", border: `1px solid ${C2}22`, borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C2, marginBottom: 8, fontFamily: FONT }}>🇸🇪 İsveç Modeli — Pro-Natalist'in Başarı Hikâyesi</div>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 10px", fontFamily: FONT, lineHeight: 1.65 }}>
            İsveç; ailenin önemi, ekonomik güvenlik, çocuk hakları ve cinsiyet eşitliği temeline
            dayanan kapsamlı bir nüfus politikasıyla çoğu Avrupa ülkesinin aksine son 20 yılda
            nüfus artış hızını yükseltmeyi başarmıştır.
          </p>
          <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C2, marginBottom: 6, fontFamily: FONT }}>📉 Nüfus Artış Hızı Eğrisi (1997–2022)</div>
            <IsveçGrafik />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {[
              ["👨‍👩‍👧", "Hem anne hem babaya ücretli ebeveyn izni (60 gün zorunlu)"],
              ["🏥", "Ücretsiz sağlık ve diş bakımı hizmeti"],
              ["🏫", "Ücretsiz okul öncesi eğitim ve kreş"],
              ["💰", "Çocuk ve konut yardımları"],
              ["🤒", "Çocuk hastalığında yılda 60 güne kadar bakım izni"],
              ["⚖", "Cinsiyet eşitliği temelli politika tasarımı"],
            ].map(([ik, ad]) => (
              <div key={ad as string} style={{ display: "flex", gap: 7, padding: "7px 9px", background: `${C2}08`, borderRadius: 7, border: `1px solid ${C2}18` }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{ik}</span>
                <span style={{ fontSize: 10, color: "#64748b", fontFamily: FONT, lineHeight: 1.45 }}>{ad as string}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9 }}>
          <div style={{ fontSize: 11, color: "#64748b", fontFamily: FONT, lineHeight: 1.55 }}>
            📌 <strong style={{ color: C2 }}>Diğer örnek ülkeler:</strong> Almanya (Elterngeld ebeveyn desteği), Fransa (Avrupa'nın en yüksek doğum oranı), Japonya (doğum teşvik primleri), Güney Kore (bebek başına prim ödemeleri).
          </div>
        </div>
      </div>
    );

    /* ── Diğer Politikalar ──────────────────────────────────────────────── */
    if (sec === "diger") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          Nüfus artış hızını düzenlemenin ötesinde, ülkeler dağılım, göç ve nitelik boyutlarında
          da aktif politikalar geliştirmektedir.
        </p>

        {POLITIKA_TURLERI.slice(2).map(p => (
          <div key={p.id} style={{ padding: "14px 16px", background: "rgba(0,0,0,0.3)", border: `1.5px solid ${p.color}22`, borderRadius: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: `${p.color}18`, border: `1.5px solid ${p.color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{p.ikon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: p.color, fontFamily: FONT }}>{p.ad}</div>
                <div style={{ fontSize: 11, color: `${p.color}80`, fontFamily: FONT, marginTop: 1 }}>{p.hedef}</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 10px", fontFamily: FONT, lineHeight: 1.65 }}>{p.neden}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {p.uygulamalar.map(u => (
                <div key={u} style={{ padding: "4px 10px", background: `${p.color}10`, border: `1px solid ${p.color}25`, borderRadius: 20, fontSize: 10, color: p.color, fontFamily: FONT }}>
                  {u}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "#475569", fontFamily: FONT, padding: "6px 10px", background: "rgba(0,0,0,0.3)", borderRadius: 7 }}>
              📍 {p.ornekUlke}
            </div>
          </div>
        ))}

        {/* Favela notu */}
        <div style={{ padding: "12px 14px", background: `${C5}0a`, border: `1px solid ${C5}22`, borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C5, marginBottom: 5, fontFamily: FONT }}>🇧🇷 Favela Örneği — Politika Boşluğunun Sonucu</div>
          <p style={{ fontSize: 11, color: "#64748b", margin: 0, fontFamily: FONT, lineHeight: 1.6 }}>
            Brezilya'da hızlı nüfus artışı ve kırdan kente göç sonucunda kentler kapasiteyi aştı.
            Yeterli dağılım ve kentleşme politikası oluşturulamaması, <strong style={{ color: C5 }}>favela</strong> adı verilen
            dev gecekondu yerleşmelerinin ortaya çıkmasına neden oldu.
          </p>
        </div>
      </div>
    );

    /* ── Türkiye'nin Nüfus Politikaları ─────────────────────────────────── */
    if (sec === "turkiye") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          Türkiye'de nüfus politikaları, Cumhuriyet'in ilanından bu yana dönemin ekonomik,
          sosyal ve demografik koşullarına göre sürekli değişmiştir.
        </p>

        {/* Zaman çizelgesi */}
        <div style={{ padding: "14px 16px", background: "rgba(0,0,0,0.3)", border: `1px solid ${C4}22`, borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C4, marginBottom: 10, fontFamily: FONT }}>🇹🇷 Türkiye Nüfus Politikası Zaman Çizelgesi</div>
          <TurkiyeZaman />
        </div>

        {/* Dönem detayları */}
        {[
          {
            donem: "1923–1960", tag: "Pro-natalist", color: C2,
            acikl: "Kurtuluş Savaşı sonrası nüfus büyük kayıplar vermişti. Atatürk başta olmak üzere yöneticiler nüfusu artırmayı askerî, ekonomik ve siyasi açıdan öncelikli hedef olarak benimsedi. Çok çocuklu anneler ödüllendirildi.",
            uyg: ["Çok çocuk doğuran ailelere ödül", "Göçü teşvik politikaları", "Doğum kontrolüne kısıtlama"],
          },
          {
            donem: "1965–1980", tag: "Anti-natalist", color: C3,
            acikl: "Nüfus artış hızı %2,5'e yaklaşınca ekonomik kalkınma baskı altına girdi. Nüfus Planlaması Kanunu çıkarıldı; aile planlaması hizmetleri yaygınlaştırıldı.",
            uyg: ["1965 Nüfus Planlaması Kanunu", "Ücretsiz aile planlaması klinikleri", "Doğum kontrolü araçlarına erişim"],
          },
          {
            donem: "1980–2000", tag: "Geçiş Dönemi", color: C,
            acikl: "Doğum oranları hızla düşerken nüfusun niteliğini artırma ön plana çıktı. Eğitim, sağlık ve istihdam politikaları ön plana geçti.",
            uyg: ["Zorunlu eğitim süresinin uzatılması", "Sağlık altyapısının geliştirilmesi", "Kentleşmeyle birlikte doğurganlığın doğal düşüşü"],
          },
          {
            donem: "2000–Günümüz", tag: "Pro-natalist", color: C4,
            acikl: "Doğurganlık hızı 1,51'e gerileyince politika yeniden değişti. Hükümet 'en az 3 çocuk' söylemiyle birlikte doğum teşvikleri ve aile desteklerini hayata geçirdi.",
            uyg: ["Doğum başı nakdi destek", "Kreş ve annelik izni genişlemesi", "Evlilik yaşını düşürmeye yönelik düzenlemeler"],
          },
        ].map((d, i) => (
          <div key={d.donem} style={{ padding: "12px 14px", background: "rgba(0,0,0,0.3)", border: `1px solid ${d.color}20`, borderRadius: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: d.color, fontFamily: MONO }}>{d.donem}</div>
              <span style={{ padding: "3px 10px", background: `${d.color}18`, border: `1px solid ${d.color}35`, borderRadius: 12, fontSize: 10, fontWeight: 800, color: d.color, fontFamily: FONT }}>{d.tag}</span>
            </div>
            <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 8px", fontFamily: FONT, lineHeight: 1.6 }}>{d.acikl}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {d.uyg.map(u => (
                <div key={u} style={{ padding: "3px 9px", background: `${d.color}10`, border: `1px solid ${d.color}22`, borderRadius: 16, fontSize: 9.5, color: d.color, fontFamily: FONT }}>{u}</div>
              ))}
            </div>
          </div>
        ))}

        {/* Türkiye 2024 verileri */}
        <div style={{ padding: "13px 15px", background: `${C4}0d`, border: `1.5px solid ${C4}28`, borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C4, marginBottom: 8, fontFamily: MONO, letterSpacing: 1 }}>📊 TÜRKİYE 2024 NÜFUS VERİLERİ (TÜİK)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
            {[
              ["Nüfus", "85.664.944"],
              ["Artış Hızı", "‰3,4"],
              ["Doğum", "‰11,2"],
              ["Ölüm", "‰6,2"],
              ["Ortanca Yaş", "34,4"],
              ["Doğurganlık", "1,51"],
            ].map(([k, v]) => (
              <div key={k as string} style={{ padding: "8px 10px", background: "rgba(0,0,0,0.3)", borderRadius: 8 }}>
                <div style={{ fontSize: 8.5, color: "#475569", fontFamily: MONO }}>{k as string}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C4, fontFamily: MONO }}>{v as string}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: "#64748b", fontFamily: FONT, lineHeight: 1.55, padding: "8px 10px", background: "rgba(0,0,0,0.25)", borderRadius: 7 }}>
            💡 Doğurganlık hızı 1,51 ile nüfusu yenileme eşiği olan 2,1'in oldukça altındadır. Bu nedenle Türkiye'nin mevcut pro-natalist politikayı güçlendirmesi ve 2060 tahminlerine göre hazırlık yapması beklenmektedir.
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
      const emoji = pct >= 90 ? "🏛️" : pct >= 70 ? "📋" : "📉";
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "40px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 52 }}>{emoji}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#e2e8f0", fontFamily: FONT }}>Test Tamamlandı!</div>
          <div style={{ fontSize: 52, fontWeight: 800, fontFamily: MONO, color: pct >= 70 ? C : C5 }}>{score}<span style={{ fontSize: 26, color: "#475569" }}>/{TEST_ITEMS.length}</span></div>
          <div style={{ fontSize: 26, fontWeight: 800, color: C, fontFamily: MONO }}>{pct}%</div>
          <div style={{ fontSize: 13, color: "#475569", fontFamily: FONT, maxWidth: 320 }}>
            {pct >= 90 ? "Harika! Nüfus politikalarına tam hakimsin." : pct >= 70 ? "İyi iş! Birkaç konuyu tekrar incele." : "Politika türlerini tekrar gözden geçirmeni öneririm."}
          </div>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 7, marginTop: 6 }}>
            {TEST_ITEMS.map((q, i) => {
              const ok = answers[i] === q.ans;
              return (
                <div key={i} style={{ padding: "9px 12px", background: ok ? "rgba(132,204,22,0.07)" : "rgba(251,113,133,0.07)", border: `1px solid ${ok ? C + "28" : C5 + "28"}`, borderRadius: 8, textAlign: "left" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ok ? C : C5, marginBottom: 3, fontFamily: FONT }}>{ok ? "✓" : "✗"} S{i + 1}. {q.q}</div>
                  {!ok && <div style={{ fontSize: 11, color: "#64748b", fontFamily: FONT, lineHeight: 1.5 }}>✅ Doğru: <strong style={{ color: C }}>{q.opts[q.ans]}</strong></div>}
                  {!ok && <div style={{ fontSize: 10, color: "#475569", fontFamily: FONT, marginTop: 2, lineHeight: 1.5 }}>{q.ac}</div>}
                </div>
              );
            })}
          </div>
          <button onClick={() => { setAnswers({}); setRevealed({}); setTestDone(false); sndClick(); }}
            style={{ padding: "12px 26px", background: `linear-gradient(90deg,#1a2e08,${C})`, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: FONT, marginTop: 6 }}>
            🔄 Testi Tekrar Çöz
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 17 }}>
        <div style={{ fontSize: 12, color: "#475569", fontFamily: FONT }}>Her soruyu okuyun ve tek seçenek işaretleyin.</div>
        {TEST_ITEMS.map((q, qi) => {
          const chosen = answers[qi];
          const isRev  = revealed[qi];
          return (
            <div key={qi} style={{ padding: "14px 16px", background: "rgba(0,0,0,0.3)", border: `1px solid ${isRev ? (chosen === q.ans ? C + "28" : C5 + "28") : "rgba(255,255,255,0.07)"}`, borderRadius: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 12, fontFamily: FONT, lineHeight: 1.55 }}>
                <span style={{ color: C, fontFamily: MONO, marginRight: 6 }}>{qi + 1}.</span>{q.q}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {q.opts.map((opt, oi) => {
                  let bg = "rgba(0,0,0,0.25)", border = "rgba(255,255,255,0.07)", col = "#94a3b8";
                  if (isRev) {
                    if (oi === q.ans) { bg = `${C}12`; border = C + "40"; col = C; }
                    else if (oi === chosen) { bg = `${C5}12`; border = C5 + "40"; col = C5; }
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
                <div style={{ marginTop: 9, padding: "8px 11px", background: chosen === q.ans ? `${C}08` : `${C5}08`, border: `1px solid ${chosen === q.ans ? C + "22" : C5 + "22"}`, borderRadius: 7, fontSize: 11, color: "#94a3b8", fontFamily: FONT, lineHeight: 1.55 }}>
                  {q.ac}
                </div>
              )}
            </div>
          );
        })}
        {Object.keys(revealed).length === TEST_ITEMS.length && (
          <button onClick={() => setTestDone(true)}
            style={{ padding: "13px", background: `linear-gradient(90deg,#1a2e08,${C})`, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: FONT }}>
            Sonuçları Gör →
          </button>
        )}
      </div>
    );
  };

  /* ─── RENDER ─────────────────────────────────────────────────────────── */
  const activeSec = SECTIONS.find(s => s.id === sec)!;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: BG, display: "flex", flexDirection: "column", color: "#e2e8f0", fontFamily: FONT }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {/* Header */}
      <div style={{ padding: "20px 20px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <div style={{ fontSize: 9, color: C, letterSpacing: 4, fontWeight: 800, fontFamily: MONO, marginBottom: 4 }}>4. ÜNİTE · BEŞERİ SİSTEMLER VE SÜREÇLER</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${C}30,${C}08)`, border: `1px solid ${C}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏛️</div>
                <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.2, fontFamily: FONT }}>Nüfus Politikaları</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2, fontFamily: FONT }}>4.1.4 — Tanım · 5 Politika Türü · İsveç Modeli · Türkiye</div>
                </div>
                </div>
            </div>
            <button onClick={onClose}
                style={{ padding:"8px 18px", background:"transparent", border:"1px solid rgba(255,80,80,0.3)", borderRadius:8, color:"#f87171", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,80,80,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                ✕ KAPAT
            </button>
        </div>
        <div style={{ display: "flex", marginTop: 12 }}>
          <TabBtn id="learn" label="ÖĞREN" icon="📖" />
          <TabBtn id="act"   label="ETKİNLİK" icon="🎯" />
          <TabBtn id="test"  label="TEST" icon="📝" />
        </div>
      </div>

      {/* İçerik */}
      <div style={{ flex: 1, display: "flex", gap: 0, overflow: "hidden" }}>
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

            <div style={{ marginTop: 16, padding: "12px 10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10 }}>
              <div style={{ fontSize: 9, color: "#475569", letterSpacing: 2, fontWeight: 800, marginBottom: 8, fontFamily: MONO }}>ÖZET</div>
              {[
                ["Nüfus Politikası", "Yapı, dağılış, nitelik/nicelik"],
                ["Anti-natalist", "Azaltma — Hindistan, Pakistan"],
                ["Pro-natalist", "Artırma — İsveç, Almanya"],
                ["Dağılım", "Kanada, Avustralya"],
                ["Göç Politikası", "Almanya, Katar, ABD"],
                ["İyileştirme", "Eğitim, sağlık, istihdam"],
                ["Türkiye 2024", "Doğurganlık 1,51 — Pro-nat."],
              ].map(([k, v]) => (
                <div key={k as string} style={{ marginBottom: 5 }}>
                  <div style={{ fontSize: 9, color: C, fontWeight: 800, fontFamily: MONO }}>{k as string}</div>
                  <div style={{ fontSize: 9, color: "#475569", fontFamily: FONT }}>{v as string}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ flex: 1, padding: "18px 24px", overflowY: "auto" }}>
          {tab === "learn" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 22 }}>{activeSec.ikon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: activeSec.color, fontFamily: FONT }}>{activeSec.label}</div>
                  <div style={{ fontSize: 10, color: "#475569", fontFamily: MONO, letterSpacing: 1 }}>4.1.4 · KONU {SECTIONS.findIndex(s => s.id === sec) + 1}/{SECTIONS.length}</div>
                </div>
              </div>
              {renderLearn()}
            </>
          )}
          {tab === "act"  && <SenaryoAktivite />}
          {tab === "test" && renderTest()}
        </div>
      </div>
    </div>
  );
}