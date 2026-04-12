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
const BG   = "#05111e";
const C    = "#14b8a6";   // teal   — ana renk
const C2   = "#818cf8";   // indigo — piramit / yaş
const C3   = "#f43f5e";   // rose   — doğum oranı
const C4   = "#34d399";   // emerald— ölüm oranı / canlı
const C5   = "#fb923c";   // turuncu— Türkiye özel

type Tab      = "learn" | "act" | "test";
type LearnSec = "piramit" | "okuma" | "model" | "ulkeler" | "turkiye";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VERİ: Demografik Dönüşüm Evreleri
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const EVRELER = [
  {
    no: 1, label: "1. Aşama", subLabel: "Sanayi Öncesi",
    color: "#64748b",
    dogum: 40, olum: 38, artis: "çok düşük",
    nufus: "Durağan / çok yavaş",
    aciklama: "Doğum ve ölüm oranlarının her ikisi de yüksektir. Yetersiz sağlık hizmetleri, salgın hastalıklar ve kıtlık ölümleri yüksek tutar; nüfus artışı yok denecek kadar azdır.",
    ornek: "Ortaçağ Avrupası, tarih öncesi toplumlar",
    ulke: "Günümüzde hiçbir ülke bu aşamada değil",
  },
  {
    no: 2, label: "2. Aşama", subLabel: "Erken Sanayileşme",
    color: "#ef4444",
    dogum: 40, olum: 18, artis: "hızlı",
    nufus: "Hızla büyür",
    aciklama: "Tıp, hijyen ve beslenmedeki iyileşmeler ölüm oranını hızla düşürürken doğum oranı yüksek kalır. Bu 'makas açılması' nüfus patlamasına yol açar.",
    ornek: "20. yy başı Afrika, Güney Asya",
    ulke: "Etiyopya (doğum: ‰29,6 — ölüm: ‰5,8)",
  },
  {
    no: 3, label: "3. Aşama", subLabel: "Geç Sanayileşme",
    color: "#f59e0b",
    dogum: 22, olum: 10, artis: "yavaşlayan",
    nufus: "Orta hızda büyür",
    aciklama: "Kentleşme, kadın eğitimi ve çalışma hayatına giriş doğum oranını düşürmeye başlar. Ölüm oranı zaten düşüktür. Nüfus artmaya devam eder ama hızı azalır.",
    ornek: "Türkiye (1970–2000), Brezilya, Çin",
    ulke: "Meksika (doğum: ‰14,3 — ölüm: ‰6,5)",
  },
  {
    no: 4, label: "4. Aşama", subLabel: "Sanayi Sonrası",
    color: "#0ea5e9",
    dogum: 10, olum: 9, artis: "çok düşük / durağan",
    nufus: "Durağanlaşır",
    aciklama: "Her iki oran da düşük ve birbirine yakın seyreder. Gelişmiş ülkelerde görülür; yaşlı nüfus oranı artar. Nüfus artışı yavaşlamıştır veya durmuştur.",
    ornek: "Batı Avrupa, ABD, Kanada",
    ulke: "Kanada (doğum: ‰10,0 — ölüm: ‰8,2)",
  },
  {
    no: 5, label: "5. Aşama", subLabel: "Nüfus Gerileme",
    color: "#a78bfa",
    dogum: 7, olum: 12, artis: "negatif",
    nufus: "Azalır",
    aciklama: "Doğum oranı ölüm oranının altına iner; nüfus azalmaya başlar. Yaşlı nüfus fazladır; bebek beklentisi düşük. Göç ve politikalarla dengelenmeye çalışılır.",
    ornek: "Japonya, Almanya, İtalya, Bulgaristan",
    ulke: "Japonya (doğum: ‰6,9 — ölüm: ‰11,9 — azalıyor)",
  },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VERİ: Ülke Piramit Tipleri (Aktivite)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
interface UlkeData {
  id: string; ad: string; bayrak: string;
  nufus: string; artisHizi: string; dogumOrani: string; olumOrani: string; omur: string;
  asama: number; tip: "genis" | "orta" | "dar" | "ters";
  ipucu: string;
}
const ULKELER: UlkeData[] = [
  {
    id: "etiyopya", ad: "Etiyopya", bayrak: "🇪🇹",
    nufus: "118,5 milyon", artisHizi: "%2,37", dogumOrani: "‰29,6", olumOrani: "‰5,8", omur: "67 yıl",
    asama: 2, tip: "genis",
    ipucu: "Geniş tabanlı piramit — Hızlı büyüyen genç nüfus",
  },
  {
    id: "meksika", ad: "Meksika", bayrak: "🇲🇽",
    nufus: "130,7 milyon", artisHizi: "%0,72", dogumOrani: "‰14,3", olumOrani: "‰6,5", omur: "74 yıl",
    asama: 3, tip: "orta",
    ipucu: "Tabanı daralan piramit — Doğum hızı düşüyor",
  },
  {
    id: "kanada", ad: "Kanada", bayrak: "🇨🇦",
    nufus: "38,8 milyon", artisHizi: "%0,71", dogumOrani: "‰10,0", olumOrani: "‰8,2", omur: "84 yıl",
    asama: 4, tip: "dar",
    ipucu: "Dikdörtgen piramit — Dengeli yaş dağılımı",
  },
  {
    id: "japonya", ad: "Japonya", bayrak: "🇯🇵",
    nufus: "123,2 milyon", artisHizi: "−%0,43", dogumOrani: "‰6,9", olumOrani: "‰11,9", omur: "85 yıl",
    asama: 5, tip: "ters",
    ipucu: "Ters üçgen piramit — Yaşlanan ve azalan nüfus",
  },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TEST SORULARI
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const TEST_ITEMS = [
  {
    q: "Demografik dönüşüm modelinin 2. aşamasında hangi durum gözlemlenir?",
    opts: ["Doğum ve ölüm oranı ikisi de düşer", "Doğum oranı yüksekken ölüm oranı düşmeye başlar", "Nüfus azalmaya başlar", "Doğurganlık hızı 1'in altına iner"],
    ans: 1,
    ac: "2. aşamada tıp ve hijyen iyileştirmeleri ölüm oranını hızla düşürür; doğum oranı hâlâ yüksektir. Bu makas açılması nüfus patlamasına yol açar.",
  },
  {
    q: "Nüfus piramidinin geniş tabanlı olması neyi gösterir?",
    opts: ["Yaşlı nüfusun oranının fazla olduğunu", "Nüfusun azaldığını", "Genç ve hızlı büyüyen bir nüfus yapısını", "Doğurganlık hızının 1'in altında olduğunu"],
    ans: 2,
    ac: "Geniş tabanlı piramit; 0–14 yaş grubunun büyük olduğunu, yani genç ve hızlı büyüyen bir nüfus yapısını gösterir. Gelişmekte olan ülkelerde yaygındır.",
  },
  {
    q: "2023 verileri dikkate alındığında Japonya demografik dönüşümün hangi aşamasındadır?",
    opts: ["2. Aşama", "3. Aşama", "4. Aşama", "5. Aşama"],
    ans: 3,
    ac: "Japonya'da doğum oranı (‰6,9), ölüm oranının (‰11,9) altına inmiştir; nüfus azalmaktadır. Bu 5. aşamanın temel özelliğidir.",
  },
  {
    q: "Aktif nüfus (çalışma çağındaki nüfus) kaç yaş aralığını kapsar?",
    opts: ["0–14", "15–64", "25–59", "65+"],
    ans: 1,
    ac: "15–64 yaş aralığı aktif ya da çalışma çağındaki nüfusu oluşturur. Gelişmiş ülkelerde bu grup toplam nüfusun büyük çoğunluğunu oluşturur.",
  },
  {
    q: "Demografik dönüşüm modelini en doğru biçimde hangi ifade tanımlar?",
    opts: [
      "Nüfusun dünya üzerindeki dağılışını açıklayan model",
      "Ülkelerin ekonomik ve sosyal gelişmelerine bağlı olarak doğal nüfus artış hızının nasıl değiştiğini açıklayan model",
      "Göçün nüfus üzerindeki etkisini ölçen model",
      "Nüfus piramitlerinin oluşturulma yöntemini gösteren model",
    ],
    ans: 1,
    ac: "Demografik dönüşüm modeli; bir ülkedeki ekonomik ve sosyal gelişmelere göre doğal nüfus artış hızının nasıl değiştiğini açıklamak için geliştirilmiştir.",
  },
  {
    q: "Aşağıdaki ülkelerden hangisi demografik dönüşümün 2. aşamasındadır?",
    opts: ["Japonya", "Kanada", "Etiyopya", "Meksika"],
    ans: 2,
    ac: "Etiyopya'da doğum oranı ‰29,6 ile yüksek, ölüm oranı ‰5,8 ile düşüktür; nüfus hızla artmaktadır. Bu 2. aşamanın temel göstergesidir.",
  },
  {
    q: "Türkiye'nin doğum oranı hangi dönemde belirgin biçimde düşmeye başlamıştır?",
    opts: ["1940–1950", "1950–1960", "1965–1980 sonrası", "2010 sonrası"],
    ans: 2,
    ac: "Türkiye'de doğum oranı 1965 sonrasından itibaren kentleşme, kadın eğitimi ve sağlık hizmetlerinin yaygınlaşmasıyla belirgin biçimde düşmeye başlamıştır.",
  },
  {
    q: "5. aşamadaki bir ülkenin nüfus piramidi nasıl bir görünüm alır?",
    opts: ["Geniş tabanlı üçgen", "Dikdörtgen şeklinde dengeli", "Tabandan dar, tepeden geniş (ters üçgen)", "Her yaş grubu eşit genişlikte"],
    ans: 2,
    ac: "5. aşamada doğum oranı çok düşük, yaşlı nüfus oranı yüksek olduğundan piramit tabandan daralıp tepeden genişler; ters üçgen görünümü alır.",
  },
  {
    q: "Doğurganlık hızı 1,58 olan Kanada demografik dönüşümün hangi aşamasındadır?",
    opts: ["2. Aşama", "3. Aşama", "4. Aşama", "5. Aşama"],
    ans: 2,
    ac: "Kanada'da doğum (‰10) ve ölüm (‰8,2) oranları düşük ve birbirine yakındır; ortalama ömür 84 yıl, doğurganlık hızı 1,58'dir. Bu 4. aşama özelliklerini yansıtır.",
  },
  {
    q: "Demografik dönüşüm modelinde göçün nüfus üzerindeki etkisi nasıl ele alınır?",
    opts: ["Doğum oranına eklenerek hesaplanır", "Model göçün nüfus üzerindeki etkisini göz ardı eder", "Ölüm oranıyla birleştirilir", "Ayrı bir eksen üzerinde gösterilir"],
    ans: 1,
    ac: "Demografik dönüşüm modeli; doğal nüfus artışındaki değişimlere odaklanır ve göçün nüfus üzerindeki etkisini göz ardı eder.",
  },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SVG: İnteraktif Demografik Dönüşüm Grafiği
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function DonusumGrafik({ aktifEvre, onEvreClick }: { aktifEvre: number; onEvreClick: (n: number) => void }) {
  const W = 500, H = 200;
  const pad = { l: 38, r: 16, t: 18, b: 32 };
  const gW = W - pad.l - pad.r;
  const gH = H - pad.t - pad.b;

  // X ekseni: 5 dilim (evre sınırları)
  const evreX = [0, 1, 2, 3, 4, 5].map(i => pad.l + (i / 5) * gW);
  const evreOrtaX = [0, 1, 2, 3, 4].map(i => pad.l + ((i + 0.5) / 5) * gW);

  // Y ekseni: 0–50‰ (oran değerleri)
  const yScale = (val: number) => pad.t + gH - (val / 50) * gH;

  // Doğum oranı noktaları (evre ortaları)
  const dogumY = [45, 42, 22, 10, 7].map(yScale);
  // Ölüm oranı noktaları
  const olumY  = [42, 16, 10, 9, 12].map(yScale);
  // Nüfus eğrisi (görsel, normalize)
  const nufusY = [40, 34, 22, 12, 12].map(yScale);

  const toPolyline = (xs: number[], ys: number[]) =>
    xs.map((x, i) => `${x},${ys[i]}`).join(" ");

  const polyDogum = toPolyline(evreOrtaX, dogumY);
  const polyOlum  = toPolyline(evreOrtaX, olumY);
  const polyNufus = toPolyline(evreOrtaX, nufusY);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, overflow: "visible" }}>
      {/* Arka plan bantları */}
      {[0, 1, 2, 3, 4].map(i => (
        <rect key={i}
          x={evreX[i]} y={pad.t}
          width={evreX[i + 1] - evreX[i]}
          height={gH}
          fill={aktifEvre === i + 1 ? `${EVRELER[i].color}22` : "transparent"}
          style={{ cursor: "pointer", transition: "fill 0.2s" }}
          onClick={() => onEvreClick(i + 1)}
        />
      ))}
      {/* Grid yatay çizgiler */}
      {[10, 20, 30, 40, 50].map(v => (
        <line key={v} x1={pad.l} x2={W - pad.r} y1={yScale(v)} y2={yScale(v)}
          stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {/* Y etiketleri */}
      {[0, 10, 20, 30, 40, 50].map(v => (
        <text key={v} x={pad.l - 5} y={yScale(v) + 4} textAnchor="end"
          fontSize="8" fill="#475569" fontFamily={MONO}>{v}</text>
      ))}
      {/* Evre dikey sınır çizgileri */}
      {evreX.map((x, i) => (
        <line key={i} x1={x} x2={x} y1={pad.t} y2={pad.t + gH}
          stroke="rgba(255,255,255,0.08)" strokeWidth={i === 0 || i === 5 ? 1.5 : 1} strokeDasharray={i === 0 || i === 5 ? "0" : "3,3"} />
      ))}
      {/* Nüfus büyüklüğü — dolu alan (altlık) */}
      <polygon
        points={`${evreOrtaX[0]},${yScale(0)} ${polyNufus} ${evreOrtaX[4]},${yScale(0)}`}
        fill={`${C}12`} />
      <polyline points={polyNufus} fill="none" stroke={C} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.55" />

      {/* Ölüm oranı eğrisi — dolu alan */}
      <polygon
        points={`${evreOrtaX[0]},${yScale(0)} ${polyOlum} ${evreOrtaX[4]},${yScale(0)}`}
        fill={`${C4}10`} />
      <polyline points={polyOlum} fill="none" stroke={C4} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Doğum oranı eğrisi */}
      <polyline points={polyDogum} fill="none" stroke={C3} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Nokta vurgular */}
      {evreOrtaX.map((x, i) => (
        <g key={i} style={{ cursor: "pointer" }} onClick={() => onEvreClick(i + 1)}>
          <circle cx={x} cy={dogumY[i]} r={aktifEvre === i + 1 ? 7 : 4.5} fill={C3} opacity={aktifEvre === i + 1 ? 1 : 0.7} style={{ transition: "r 0.15s" }} />
          <circle cx={x} cy={olumY[i]}  r={aktifEvre === i + 1 ? 7 : 4.5} fill={C4} opacity={aktifEvre === i + 1 ? 1 : 0.7} style={{ transition: "r 0.15s" }} />
        </g>
      ))}

      {/* Evre etiketleri — X altı */}
      {[0, 1, 2, 3, 4].map(i => (
        <text key={i} x={evreOrtaX[i]} y={H - 4} textAnchor="middle"
          fontSize="9" fill={aktifEvre === i + 1 ? EVRELER[i].color : "#334155"}
          fontFamily={FONT} fontWeight={aktifEvre === i + 1 ? "800" : "600"}
          style={{ cursor: "pointer", transition: "fill 0.15s" }}
          onClick={() => onEvreClick(i + 1)}>
          {i + 1}. Aşama
        </text>
      ))}

      {/* Lejant */}
      <line x1={pad.l} y1={10} x2={pad.l + 22} y2={10} stroke={C3} strokeWidth="2.5" />
      <text x={pad.l + 26} y={14} fontSize="9" fill={C3} fontFamily={FONT}>Doğum Oranı</text>
      <line x1={pad.l + 100} y1={10} x2={pad.l + 122} y2={10} stroke={C4} strokeWidth="2.5" />
      <text x={pad.l + 126} y={14} fontSize="9" fill={C4} fontFamily={FONT}>Ölüm Oranı</text>
      <line x1={pad.l + 210} y1={10} x2={pad.l + 232} y2={10} stroke={C} strokeWidth="1.5" strokeDasharray="4,3" />
      <text x={pad.l + 236} y={14} fontSize="9" fill={C} fontFamily={FONT}>Nüfus Miktarı</text>
    </svg>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SVG: Nüfus Piramidi
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function NufusPiramidi({
  tip, color, etiket, kucuk = false
}: {
  tip: "genis" | "orta" | "dar" | "ters";
  color: string;
  etiket?: string;
  kucuk?: boolean;
}) {
  const W = kucuk ? 160 : 220, H = kucuk ? 160 : 200;
  const cx = W / 2;

  // 8 yaş grubu için yarı genişlikler (her iki taraf için)
  const barData: Record<string, { k: number; e: number }[]> = {
    genis: [
      {k:56,e:60},{k:50,e:53},{k:44,e:46},{k:38,e:40},
      {k:30,e:32},{k:23,e:24},{k:15,e:16},{k:8, e:8 },
    ],
    orta: [
      {k:38,e:40},{k:39,e:41},{k:42,e:44},{k:43,e:46},
      {k:40,e:42},{k:36,e:37},{k:28,e:29},{k:18,e:19},
    ],
    dar: [
      {k:28,e:29},{k:30,e:31},{k:33,e:34},{k:38,e:40},
      {k:42,e:44},{k:40,e:41},{k:35,e:37},{k:24,e:26},
    ],
    ters: [
      {k:18,e:19},{k:22,e:23},{k:26,e:27},{k:34,e:36},
      {k:42,e:44},{k:46,e:47},{k:48,e:49},{k:44,e:45},
    ],
  };
  const yasSinifi = ["0–14","15–24","25–34","35–44","45–54","55–64","65–74","75+"];
  const bars = barData[tip];
  const rowH = (H - (kucuk ? 16 : 22)) / bars.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      {bars.map((b, i) => {
        const y = (kucuk ? 5 : 8) + i * rowH;
        const alpha = 0.35 + (i / bars.length) * 0.25;
        return (
          <g key={i}>
            {/* Kadın (sol) */}
            <rect x={cx - b.k} y={y + 1} width={b.k} height={rowH - 2}
              fill={`${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`}
              stroke={color} strokeWidth="0.5" rx="2" />
            {/* Erkek (sağ) */}
            <rect x={cx} y={y + 1} width={b.e} height={rowH - 2}
              fill={`${color}${Math.round((alpha + 0.15) * 255).toString(16).padStart(2, "0")}`}
              stroke={color} strokeWidth="0.5" rx="2" />
            {/* Yaş etiketi */}
            {!kucuk && (
              <text x={cx} y={y + rowH / 2 + 3.5} textAnchor="middle"
                fontSize="7.5" fill={color} fontFamily={MONO} fontWeight="700" opacity="0.9">
                {yasSinifi[i]}
              </text>
            )}
          </g>
        );
      })}
      {/* Merkez eksen */}
      <line x1={cx} y1={kucuk ? 5 : 8} x2={cx} y2={H - (kucuk ? 14 : 18)}
        stroke={color} strokeWidth="0.8" opacity="0.3" />
      {!kucuk && (
        <>
          <text x={cx / 2} y={H - 4} textAnchor="middle" fontSize="8" fill={color} fontFamily={FONT} opacity="0.55">Kadın</text>
          <text x={cx + cx / 2} y={H - 4} textAnchor="middle" fontSize="8" fill={color} fontFamily={FONT} opacity="0.55">Erkek</text>
        </>
      )}
      {etiket && (
        <text x={cx} y={H - 1} textAnchor="middle" fontSize="9" fill={color} fontFamily={FONT} fontWeight="800">{etiket}</text>
      )}
    </svg>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BILEŞEN: Türkiye Zaman Serisi SVG
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function TurkiyeGrafik() {
  // Yaklaşık veri: yıl / doğum oranı / ölüm oranı / nüfus artış hızı
  const DATA = [
    { yil: 1940, dogum: 44, olum: 28, artis: 14 },
    { yil: 1950, dogum: 47, olum: 22, artis: 22 },
    { yil: 1960, dogum: 45, olum: 16, artis: 26 },
    { yil: 1970, dogum: 38, olum: 12, artis: 24 },
    { yil: 1980, dogum: 32, olum: 10, artis: 20 },
    { yil: 1990, dogum: 24, olum: 8,  artis: 15 },
    { yil: 2000, dogum: 19, olum: 7,  artis: 12 },
    { yil: 2010, dogum: 16, olum: 6,  artis: 12 },
    { yil: 2020, dogum: 14, olum: 6,  artis: 9  },
    { yil: 2024, dogum: 13, olum: 6,  artis: 8  },
  ];
  const W = 440, H = 180;
  const pad = { l: 34, r: 14, t: 16, b: 30 };
  const gW = W - pad.l - pad.r, gH = H - pad.t - pad.b;
  const xS = (i: number) => pad.l + (i / (DATA.length - 1)) * gW;
  const yS = (v: number) => pad.t + gH - (v / 50) * gH;

  const polyLine = (key: "dogum" | "olum" | "artis") =>
    DATA.map((d, i) => `${xS(i)},${yS(d[key])}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
      {[0, 10, 20, 30, 40, 50].map(v => (
        <line key={v} x1={pad.l} x2={W - pad.r} y1={yS(v)} y2={yS(v)}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {[0, 10, 20, 30, 40, 50].map(v => (
        <text key={v} x={pad.l - 4} y={yS(v) + 4} textAnchor="end"
          fontSize="7.5" fill="#334155" fontFamily={MONO}>{v}</text>
      ))}
      {DATA.map((d, i) => (
        <text key={d.yil} x={xS(i)} y={H - 4} textAnchor="middle"
          fontSize="7.5" fill="#334155" fontFamily={MONO}>{d.yil}</text>
      ))}
      {/* Nüfus artış bandı */}
      <polygon
        points={`${xS(0)},${yS(0)} ${polyLine("artis")} ${xS(DATA.length - 1)},${yS(0)}`}
        fill={`${C}10`} />
      <polyline points={polyLine("artis")} fill="none" stroke={C} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" />
      {/* Ölüm eğrisi alan */}
      <polygon
        points={`${xS(0)},${yS(0)} ${polyLine("olum")} ${xS(DATA.length - 1)},${yS(0)}`}
        fill={`${C4}0d`} />
      <polyline points={polyLine("olum")} fill="none" stroke={C4} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Doğum eğrisi */}
      <polyline points={polyLine("dogum")} fill="none" stroke={C3} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Lejant */}
      <line x1={pad.l} y1={10} x2={pad.l + 18} y2={10} stroke={C3} strokeWidth="2.5" />
      <text x={pad.l + 22} y={14} fontSize="8.5" fill={C3} fontFamily={FONT}>Doğum</text>
      <line x1={pad.l + 72} y1={10} x2={pad.l + 90} y2={10} stroke={C4} strokeWidth="2.5" />
      <text x={pad.l + 94} y={14} fontSize="8.5" fill={C4} fontFamily={FONT}>Ölüm</text>
      <line x1={pad.l + 140} y1={10} x2={pad.l + 158} y2={10} stroke={C} strokeWidth="1.5" strokeDasharray="4,3" />
      <text x={pad.l + 162} y={14} fontSize="8.5" fill={C} fontFamily={FONT}>Nüfus Artış Hızı</text>
    </svg>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BILEŞEN: Aktivite — Ülkeleri Demografik Aşamayla Eşleştir
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function EslestirmeAktivite() {
  const [secilen, setSecilen] = useState<string | null>(null);   // ülke id
  const [eslestirme, setEslestirme] = useState<Record<string, number>>({}); // ulkeId → asama no
  const [yanlis, setYanlis] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);

  const ASAMA_RENK: Record<number, string> = { 2: "#ef4444", 3: "#f59e0b", 4: "#0ea5e9", 5: "#a78bfa" };
  const PiramitRenk: Record<string, string> = {
    etiyopya: "#ef4444", meksika: "#f59e0b", kanada: "#0ea5e9", japonya: "#a78bfa"
  };

  const handleAsamaClick = (asama: number) => {
    if (!secilen) return;
    const ulke = ULKELER.find(u => u.id === secilen)!;
    const ok = ulke.asama === asama;
    const ne = { ...eslestirme, [secilen]: asama };
    const ny = { ...yanlis, [secilen]: !ok };
    setEslestirme(ne); setYanlis(ny);
    if (ok) sndOK(); else sndFail();
    setSecilen(null);
    if (Object.keys(ne).length === ULKELER.length) setTimeout(() => setDone(true), 450);
  };

  const retry = () => {
    setSecilen(null); setEslestirme({}); setYanlis({}); setDone(false);
  };

  const score = ULKELER.filter(u => !yanlis[u.id] && eslestirme[u.id] !== undefined).length;

  if (done) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "44px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 52 }}>📊</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#e2e8f0", fontFamily: FONT }}>Eşleştirme Tamamlandı!</div>
      <div style={{ fontSize: 52, fontWeight: 800, color: score === ULKELER.length ? C4 : C3, fontFamily: MONO }}>{score}/{ULKELER.length}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 400 }}>
        {ULKELER.map(u => {
          const ok = !yanlis[u.id];
          return (
            <div key={u.id} style={{ padding: "10px 14px", background: ok ? "rgba(52,211,153,0.08)" : "rgba(244,63,94,0.08)", border: `1px solid ${ok ? "#34d39930" : "#f43f5e30"}`, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 20 }}>{u.bayrak}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: ok ? C4 : "#f43f5e", fontFamily: FONT }}>{u.ad}</span>
              </div>
              <div style={{ fontSize: 11, color: ok ? C4 : "#f43f5e", fontFamily: MONO }}>
                {ok ? `✓ ${u.asama}. Aşama` : `✗ Doğrusu: ${u.asama}. Aşama`}
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={retry}
        style={{ marginTop: 8, padding: "12px 28px", background: `linear-gradient(90deg,#0f4c4c,${C})`, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: FONT }}>
        🔄 Tekrar Dene
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 10, color: C, letterSpacing: 3, fontWeight: 800, fontFamily: MONO, marginBottom: 4 }}>ETKİNLİK</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#e2e8f0", fontFamily: FONT }}>📊 Ülkeleri Demografik Aşamayla Eşleştir</div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 3, fontFamily: FONT }}>
          Önce bir ülkeyi seç, ardından hangi demografik dönüşüm aşamasında olduğuna tıkla
        </div>
      </div>

      {/* Ülke kartları */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {ULKELER.map(u => {
          const eslestirildi = eslestirme[u.id] !== undefined;
          const ok = eslestirildi && !yanlis[u.id];
          const hata = eslestirildi && yanlis[u.id];
          const aktif = secilen === u.id;
          const col = PiramitRenk[u.id];
          return (
            <div key={u.id}
              onClick={() => { if (eslestirildi) return; sndClick(); setSecilen(aktif ? null : u.id); }}
              style={{
                padding: "12px 13px", borderRadius: 12, cursor: eslestirildi ? "default" : "pointer",
                background: aktif ? `${col}18` : ok ? "rgba(52,211,153,0.07)" : hata ? "rgba(244,63,94,0.07)" : "rgba(0,0,0,0.35)",
                border: `2px solid ${aktif ? col : ok ? "#34d39940" : hata ? "#f43f5e40" : "rgba(255,255,255,0.08)"}`,
                transition: "all 0.18s",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 22 }}>{u.bayrak}</span>
                  <div style={{ fontSize: 13, fontWeight: 800, color: aktif ? col : ok ? C4 : hata ? "#f43f5e" : "#e2e8f0", fontFamily: FONT, marginTop: 2 }}>{u.ad}</div>
                </div>
                <NufusPiramidi tip={u.tip} color={col} kucuk />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {[
                  ["Nüfus", u.nufus], ["Artış", u.artisHizi],
                  ["Doğum", u.dogumOrani], ["Ölüm", u.olumOrani],
                ].map(([k, v]) => (
                  <div key={k as string} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 5, padding: "4px 7px" }}>
                    <div style={{ fontSize: 8, color: "#475569", fontFamily: MONO }}>{k as string}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: col, fontFamily: MONO }}>{v as string}</div>
                  </div>
                ))}
              </div>
              {eslestirildi && (
                <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, fontFamily: FONT, color: ok ? C4 : "#f43f5e" }}>
                  {ok ? `✓ ${u.asama}. Aşama — Doğru!` : `✗ Doğrusu: ${u.asama}. Aşama`}
                </div>
              )}
              {aktif && <div style={{ marginTop: 6, fontSize: 11, color: col, fontFamily: FONT, fontStyle: "italic" }}>👆 Aşağıdan aşamayı seç…</div>}
            </div>
          );
        })}
      </div>

      {/* Aşama seçim butonları */}
      <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.3)", border: `1px solid ${secilen ? C + "40" : "rgba(255,255,255,0.06)"}`, borderRadius: 12, transition: "border-color 0.2s" }}>
        <div style={{ fontSize: 10, color: secilen ? C : "#334155", letterSpacing: 2, fontWeight: 800, marginBottom: 10, fontFamily: FONT }}>
          {secilen ? `"${ULKELER.find(u => u.id === secilen)?.ad}" için aşama seç:` : "Önce yukarıdan bir ülke seç"}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[2, 3, 4, 5].map(as => {
            const ev = EVRELER[as - 1];
            const atanmis = Object.entries(eslestirme).filter(([, v]) => v === as && !yanlis[Object.entries(eslestirme).find(([, vv]) => vv === as)?.[0] ?? ""]);
            return (
              <button key={as} onClick={() => handleAsamaClick(as)}
                disabled={!secilen}
                style={{
                  flex: 1, minWidth: 80, padding: "10px 8px", borderRadius: 10,
                  background: secilen ? `${ev.color}18` : "rgba(0,0,0,0.3)",
                  border: `2px solid ${secilen ? ev.color + "55" : "rgba(255,255,255,0.06)"}`,
                  cursor: secilen ? "pointer" : "not-allowed", color: secilen ? ev.color : "#334155",
                  fontFamily: FONT, fontWeight: 800, fontSize: 11, transition: "all 0.15s", opacity: secilen ? 1 : 0.5,
                }}>
                <div style={{ fontSize: 13, marginBottom: 2 }}>{as}. Aşama</div>
                <div style={{ fontSize: 9, fontWeight: 600, opacity: 0.7 }}>{ev.subLabel}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* İlerleme */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
        <span style={{ fontSize: 12, color: "#475569", fontFamily: FONT }}>Eşleştirilen: {Object.keys(eslestirme).length}/{ULKELER.length}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: C, fontFamily: MONO }}>{score} doğru</span>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ANA BİLEŞEN
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function DemografikDonusumActivity({ onClose }: { onClose: () => void }) {
  const [tab,      setTab]      = useState<Tab>("learn");
  const [sec,      setSec]      = useState<LearnSec>("piramit");
  const [aktifEvre, setAktifEvre] = useState<number>(1);
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
          background: active ? `linear-gradient(135deg,${C}22,${C}08)` : "transparent",
          color: active ? C : "#475569",
          borderBottom: `2.5px solid ${active ? C : "transparent"}`,
          transition: "all 0.18s",
        }}>
        {icon} {label}
      </button>
    );
  };

  const SECTIONS: { id: LearnSec; label: string; ikon: string; color: string }[] = [
    { id: "piramit",   label: "Nüfus Piramidi",         ikon: "📐", color: C2   },
    { id: "okuma",     label: "Piramit Okuma",           ikon: "👁",  color: C    },
    { id: "model",     label: "Demografik Dönüşüm",      ikon: "📈", color: C3   },
    { id: "ulkeler",   label: "Ülke Örnekleri",          ikon: "🌍", color: C4   },
    { id: "turkiye",   label: "Türkiye'nin Dönüşümü",    ikon: "🇹🇷", color: C5 },
  ];

  /* ─── ÖĞREN içeriği ─────────────────────────────────────────────────────── */
  const renderLearn = () => {

    /* ── Nüfus Piramidi Nedir ───────────────────────────────────────────── */
    if (sec === "piramit") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          <strong style={{ color: C2 }}>Nüfus piramidi;</strong> bir yerin nüfusunun yaş gruplarına ve cinsiyete
          göre dağılımını gösteren çift yönlü çubuk grafiktir. Sol taraf kadınları, sağ taraf erkekleri
          temsil eder; yaş grupları aşağıdan yukarıya doğru sıralanır.
        </p>

        {/* 4 piramit tipi */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { tip: "genis" as const, color: "#ef4444", ad: "Geniş Tabanlı", evre: "2. Aşama", acikl: "Genç nüfus çok fazla, yaşlı nüfus az. Hızlı büyüme. Gelişmekte olan ülkelerde yaygın." },
            { tip: "orta" as const,  color: "#f59e0b", ad: "Daralan Tabanlı", evre: "3. Aşama", acikl: "Doğum oranı düşüyor; taban daralıyor. Orta gelirli ülkelerde görülür." },
            { tip: "dar" as const,   color: "#0ea5e9", ad: "Dikdörtgen", evre: "4. Aşama", acikl: "Yaş grupları dengeli dağılmış, taban ve tepe yakın. Gelişmiş ülkelerde görülür." },
            { tip: "ters" as const,  color: "#a78bfa", ad: "Ters Üçgen", evre: "5. Aşama", acikl: "Genç nüfus az, yaşlı nüfus fazla. Nüfus azalmakta. Japonya tipik örnektir." },
          ].map(item => (
            <div key={item.ad} style={{ padding: "12px 13px", background: "rgba(0,0,0,0.3)", border: `1px solid ${item.color}22`, borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: item.color, fontFamily: FONT }}>{item.ad}</div>
                  <div style={{ fontSize: 10, color: `${item.color}80`, fontFamily: MONO }}>{item.evre}</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                <NufusPiramidi tip={item.tip} color={item.color} kucuk />
              </div>
              <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.55, fontFamily: FONT }}>{item.acikl}</div>
            </div>
          ))}
        </div>
      </div>
    );

    /* ── Piramit Nasıl Okunur ───────────────────────────────────────────── */
    if (sec === "okuma") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          Nüfus piramidini okurken üç temel yaş grubuna odaklanılır. Her grup hem piramit şekli
          hem de ülkenin sosyoekonomik durumu hakkında ipucu verir.
        </p>

        {/* Yaş grupları */}
        {[
          {
            yas: "0 – 14 Yaş", ad: "Çocuk / Genç Nüfus", color: C3, ikon: "👶",
            özellik: "Piramit tabanı",
            genis: "Doğum oranı yüksek → hızlı büyüme → gelişmekte olan ülkeler",
            dar: "Doğum oranı düşük → nüfus artışı yavaş → gelişmiş ülkeler",
            acikl: "Bu grubun geniş olması, yakın gelecekte aktif nüfusun artacağına işaret eder. Eğitim ve sağlık yatırımları bu kesim için kritik öneme sahiptir.",
          },
          {
            yas: "15 – 64 Yaş", ad: "Aktif / Çalışma Çağı Nüfusu", color: C4, ikon: "💼",
            özellik: "Piramit gövdesi",
            genis: "Ekonomik üretim ve vergi tabanı güçlü → sosyal güvenlik sistemi sağlıklı",
            dar: "İş gücü yetersizliği → ekonomik yavaşlama riski",
            acikl: "Gelişmiş ülkelerde bu grubun oranı toplam nüfusun büyük çoğunluğunu oluşturur. Bağımlılık oranı bu gruba göre hesaplanır.",
          },
          {
            yas: "65+ Yaş", ad: "Yaşlı Nüfus", color: C2, ikon: "👴",
            özellik: "Piramit tepesi",
            genis: "Sağlık harcamaları ve emeklilik yükü artıyor → 4.–5. aşama ülkeleri",
            dar: "Yaşlı nüfus az → sağlık/emeklilik yükü düşük → 2. aşama ülkeleri",
            acikl: "Bu grubun artması, ortalama ömrün uzadığının göstergesidir. Yaşlı nüfusun fazla olduğu ülkelerde emeklilik ve sağlık sistemleri baskı altına girer.",
          },
        ].map(g => (
          <div key={g.yas} style={{ padding: "14px 16px", background: "rgba(0,0,0,0.3)", border: `1px solid ${g.color}22`, borderRadius: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>{g.ikon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: g.color, fontFamily: FONT }}>{g.yas}</div>
                <div style={{ fontSize: 11, color: `${g.color}80`, fontFamily: FONT }}>{g.ad} · {g.özellik}</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 8px", fontFamily: FONT, lineHeight: 1.65 }}>{g.acikl}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              <div style={{ padding: "7px 10px", background: `${g.color}10`, borderRadius: 7, border: `1px solid ${g.color}20` }}>
                <div style={{ fontSize: 9, color: `${g.color}80`, fontWeight: 800, fontFamily: MONO, marginBottom: 2 }}>GENİŞ TABANDA</div>
                <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: FONT, lineHeight: 1.5 }}>{g.genis}</div>
              </div>
              <div style={{ padding: "7px 10px", background: "rgba(0,0,0,0.3)", borderRadius: 7, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 9, color: "#475569", fontWeight: 800, fontFamily: MONO, marginBottom: 2 }}>DAR TABANDA</div>
                <div style={{ fontSize: 10, color: "#64748b", fontFamily: FONT, lineHeight: 1.5 }}>{g.dar}</div>
              </div>
            </div>
          </div>
        ))}

        <div style={{ padding: "12px 14px", background: `${C}0d`, border: `1px solid ${C}25`, borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C, marginBottom: 4, fontFamily: MONO, letterSpacing: 1 }}>📌 BAĞIMLILIK ORANI</div>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, fontFamily: FONT, lineHeight: 1.65 }}>
            Bağımlı nüfus = <strong style={{ color: C3 }}>0–14</strong> yaş + <strong style={{ color: C2 }}>65+ yaş</strong> gruplarından oluşur.
            Çalışma çağındaki nüfusa (15–64) oranı ne kadar yüksekse sosyal güvenlik üzerindeki yük o kadar ağırdır.
          </p>
        </div>
      </div>
    );

    /* ── Demografik Dönüşüm Modeli ─────────────────────────────────────── */
    if (sec === "model") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          <strong style={{ color: C3 }}>Demografik dönüşüm modeli;</strong> bir ülkedeki ekonomik ve sosyal
          gelişmelere göre doğal nüfus artış hızının nasıl değiştiğini açıklar. Model 5 aşamadan oluşur
          ve ülkeler sanayileşme ile birlikte bu aşamalardan geçer. Bir aşamaya tıklayarak detay görebilirsin.
        </p>

        <div style={{ background: "rgba(0,0,0,0.35)", borderRadius: 12, padding: "14px 16px 10px", border: "1px solid rgba(255,255,255,0.07)" }}>
          <DonusumGrafik aktifEvre={aktifEvre} onEvreClick={n => { sndClick(); setAktifEvre(n); }} />
        </div>

        {/* Seçili evre detayı */}
        {aktifEvre > 0 && (() => {
          const ev = EVRELER[aktifEvre - 1];
          return (
            <div style={{ padding: "14px 16px", background: `${ev.color}0d`, border: `2px solid ${ev.color}40`, borderRadius: 12, transition: "all 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: ev.color, fontFamily: FONT }}>{ev.label}</div>
                  <div style={{ fontSize: 11, color: `${ev.color}80`, fontFamily: FONT }}>{ev.subLabel}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ textAlign: "center", padding: "5px 10px", background: `${C3}15`, borderRadius: 7 }}>
                    <div style={{ fontSize: 8, color: C3, fontFamily: MONO, fontWeight: 800 }}>DOĞUM</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C3, fontFamily: MONO }}>‰{ev.dogum}</div>
                  </div>
                  <div style={{ textAlign: "center", padding: "5px 10px", background: `${C4}15`, borderRadius: 7 }}>
                    <div style={{ fontSize: 8, color: C4, fontFamily: MONO, fontWeight: 800 }}>ÖLÜM</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C4, fontFamily: MONO }}>‰{ev.olum}</div>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 8px", fontFamily: FONT, lineHeight: 1.65 }}>{ev.aciklama}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontSize: 11, color: "#64748b", fontFamily: FONT }}>🌍 <strong style={{ color: ev.color }}>Örnek:</strong> {ev.ornek}</div>
              </div>
              <div style={{ marginTop: 6, padding: "6px 10px", background: "rgba(0,0,0,0.3)", borderRadius: 7, fontSize: 11, color: `${ev.color}90`, fontFamily: FONT }}>
                📌 {ev.ulke}
              </div>
            </div>
          );
        })()}

        {/* 5 aşama hızlı gezinti */}
        <div style={{ display: "flex", gap: 6 }}>
          {EVRELER.map(ev => (
            <button key={ev.no} onClick={() => { sndClick(); setAktifEvre(ev.no); }}
              style={{
                flex: 1, padding: "8px 4px", borderRadius: 8,
                background: aktifEvre === ev.no ? `${ev.color}22` : "rgba(0,0,0,0.3)",
                border: `1.5px solid ${aktifEvre === ev.no ? ev.color + "70" : "rgba(255,255,255,0.07)"}`,
                cursor: "pointer", color: aktifEvre === ev.no ? ev.color : "#475569",
                fontFamily: FONT, fontSize: 10, fontWeight: aktifEvre === ev.no ? 800 : 600,
                transition: "all 0.15s",
              }}>
              {ev.no}. Aşama
            </button>
          ))}
        </div>

        <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#475569", marginBottom: 6, fontFamily: MONO, letterSpacing: 1 }}>⚠️ MODELİN SINIRLILIKLARI</div>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0, fontFamily: FONT, lineHeight: 1.65 }}>
            Model; İngiltere, Fransa ve Almanya'nın nüfuslanma sürecini esas alır.
            Göçün nüfus üzerindeki etkisini yansıtmaz. Günümüzde 1. aşamada ülke yoktur.
            Gelişmekte olan ülkeler teknoloji transferi sayesinde aşamaları daha hızlı geçebilmektedir.
          </p>
        </div>
      </div>
    );

    /* ── Ülke Örnekleri ─────────────────────────────────────────────────── */
    if (sec === "ulkeler") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          Dört ülkenin 2023 verileri ve piramit tipleri incelenerek demografik dönüşüm aşamaları belirlenebilir.
        </p>
        {ULKELER.map(u => {
          const ev = EVRELER[u.asama - 1];
          const PiramitRenk: Record<string, string> = { etiyopya: "#ef4444", meksika: "#f59e0b", kanada: "#0ea5e9", japonya: "#a78bfa" };
          const col = PiramitRenk[u.id];
          return (
            <div key={u.id} style={{ padding: "14px 16px", background: "rgba(0,0,0,0.3)", border: `1px solid ${col}22`, borderRadius: 12 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                {/* Sol: piramit */}
                <div style={{ flexShrink: 0 }}>
                  <NufusPiramidi tip={u.tip} color={col} />
                  <div style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: col, marginTop: 4, fontFamily: FONT }}>{u.bayrak} {u.ad}</div>
                </div>
                {/* Sağ: veri */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "inline-block", padding: "4px 12px", background: `${ev.color}18`, border: `1.5px solid ${ev.color}50`, borderRadius: 20, fontSize: 11, fontWeight: 800, color: ev.color, fontFamily: FONT, marginBottom: 10 }}>
                    {ev.label} — {ev.subLabel}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 10 }}>
                    {[
                      ["Nüfus", u.nufus, col],
                      ["Artış Hızı", u.artisHizi, col],
                      ["Doğum Oranı", u.dogumOrani, C3],
                      ["Ölüm Oranı", u.olumOrani, C4],
                      ["Ortalama Ömür", u.omur, C2],
                      ["Piramit Tipi", u.ipucu.split(" — ")[0], col],
                    ].map(([k, v, c]) => (
                      <div key={k as string} style={{ padding: "7px 9px", background: "rgba(0,0,0,0.3)", borderRadius: 7, border: `1px solid ${c as string}18` }}>
                        <div style={{ fontSize: 8.5, color: "#475569", fontFamily: MONO, marginBottom: 1 }}>{k as string}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: c as string, fontFamily: MONO }}>{v as string}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", fontFamily: FONT, lineHeight: 1.55, padding: "8px 10px", background: "rgba(0,0,0,0.25)", borderRadius: 7, borderLeft: `3px solid ${col}` }}>
                    💡 {u.ipucu}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );

    /* ── Türkiye'nin Demografik Dönüşümü ───────────────────────────────── */
    if (sec === "turkiye") return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: 0, fontFamily: FONT }}>
          Türkiye; sanayileşme, kentleşme ve sosyal dönüşümüyle birlikte demografik dönüşümün
          farklı aşamalarını hızla yaşamıştır. Doğum oranı belirgin biçimde düşerken ölüm oranı
          ve nüfus artış hızı da giderek azalmaktadır.
        </p>

        {/* Grafik */}
        <div style={{ background: "rgba(0,0,0,0.35)", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 11, color: C5, fontWeight: 800, fontFamily: FONT, marginBottom: 8 }}>🇹🇷 Türkiye Doğum ve Ölüm Oranları (1940–2024)</div>
          <TurkiyeGrafik />
        </div>

        {/* Dönem tablosu */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, fontSize: 12 }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.4)" }}>
                {["Dönem", "Piramit", "Aşama", "Özellikler"].map(h => (
                  <th key={h} style={{ padding: "9px 12px", textAlign: "left", color: C5, fontWeight: 800, borderBottom: `1px solid ${C5}30`, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  donem: "1950", piramit: "Geniş tabanlı", asama: "2. Aşama",
                  ozellik: "Doğum oranı ‰47 ile zirve, ölüm oranı ‰22. Hızlı nüfus artışı başlıyor.",
                  color: "#ef4444",
                },
                {
                  donem: "1980", piramit: "Daralma başlıyor", asama: "Geç 2. / Erken 3.",
                  ozellik: "Doğum oranı ‰32'ye düştü; kentleşme ve sağlık yatırımlarının etkisi görülüyor.",
                  color: "#f59e0b",
                },
                {
                  donem: "2000", piramit: "Orta tip", asama: "3. Aşama",
                  ozellik: "Doğum oranı ‰19. Kentsel yaşam, kadın eğitimi doğurganlık hızını düşürüyor.",
                  color: "#f59e0b",
                },
                {
                  donem: "2024", piramit: "Daralan taban", asama: "3–4. Aşama Geçiş",
                  ozellik: "Doğum ‰13, ölüm ‰6. Nüfus artış hızı yavaşladı; yaşlı nüfus oranı artıyor.",
                  color: "#0ea5e9",
                },
              ].map((row, i) => (
                <tr key={row.donem} style={{ background: i % 2 === 0 ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.1)" }}>
                  <td style={{ padding: "9px 12px", color: C5, fontWeight: 800, fontSize: 13, fontFamily: MONO }}>{row.donem}</td>
                  <td style={{ padding: "9px 12px", color: row.color, fontWeight: 600, fontSize: 11 }}>{row.piramit}</td>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                    <span style={{ padding: "3px 8px", background: `${row.color}18`, border: `1px solid ${row.color}40`, borderRadius: 12, fontSize: 10, fontWeight: 800, color: row.color, fontFamily: FONT }}>{row.asama}</span>
                  </td>
                  <td style={{ padding: "9px 12px", color: "#64748b", lineHeight: 1.55, fontSize: 11 }}>{row.ozellik}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4 piramit şematik görünüm */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          {[
            { yil: "1950", tip: "genis" as const, color: "#ef4444" },
            { yil: "1980", tip: "genis" as const, color: "#f97316" },
            { yil: "2000", tip: "orta" as const,  color: "#f59e0b" },
            { yil: "2024", tip: "dar" as const,   color: "#0ea5e9" },
          ].map(item => (
            <div key={item.yil} style={{ padding: "8px 6px", background: "rgba(0,0,0,0.3)", borderRadius: 10, border: `1px solid ${item.color}22`, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: item.color, fontFamily: MONO }}>{item.yil}</div>
              <NufusPiramidi tip={item.tip} color={item.color} kucuk />
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 14px", background: `${C5}0d`, border: `1px solid ${C5}25`, borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C5, marginBottom: 6, fontFamily: MONO, letterSpacing: 1 }}>🔭 GELECEK ÖNGÖRÜSÜ</div>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, fontFamily: FONT, lineHeight: 1.65 }}>
            Mevcut eğilimler devam ederse Türkiye, 2030'lu yıllarda 4. aşamanın özelliklerini
            belirgin biçimde taşıyacaktır. Yaşlı nüfus oranı artarken aktif nüfus oranı görece
            azalacak; bu durum sosyal güvenlik ve emeklilik sistemleri üzerinde baskı oluşturacaktır.
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
      const emoji = pct >= 90 ? "📊" : pct >= 70 ? "📈" : "📉";
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 52 }}>{emoji}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#e2e8f0", fontFamily: FONT }}>Test Tamamlandı!</div>
          <div style={{ fontSize: 56, fontWeight: 800, fontFamily: MONO, color: pct >= 70 ? C4 : C3 }}>{score}<span style={{ fontSize: 26, color: "#475569" }}>/{TEST_ITEMS.length}</span></div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C, fontFamily: MONO }}>{pct}%</div>
          <div style={{ fontSize: 13, color: "#475569", fontFamily: FONT, maxWidth: 320 }}>
            {pct >= 90 ? "Harika! Demografik dönüşüm ve nüfus piramitlerini çok iyi öğrenmişsin." : pct >= 70 ? "İyi iş! Birkaç aşama detayını tekrar gözden geçir." : "Demografik dönüşüm modelini ve piramit tiplerini tekrar incele."}
          </div>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {TEST_ITEMS.map((q, i) => {
              const ok = answers[i] === q.ans;
              return (
                <div key={i} style={{ padding: "10px 14px", background: ok ? "rgba(52,211,153,0.08)" : "rgba(244,63,94,0.08)", border: `1px solid ${ok ? "#34d39930" : "#f43f5e30"}`, borderRadius: 8, textAlign: "left" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ok ? C4 : "#f43f5e", marginBottom: 3, fontFamily: FONT }}>{ok ? "✓" : "✗"} S{i + 1}. {q.q}</div>
                  {!ok && <div style={{ fontSize: 11, color: "#64748b", fontFamily: FONT, lineHeight: 1.5 }}>✅ Doğru: <strong style={{ color: C4 }}>{q.opts[q.ans]}</strong></div>}
                  {!ok && <div style={{ fontSize: 11, color: "#475569", fontFamily: FONT, marginTop: 2, lineHeight: 1.5 }}>{q.ac}</div>}
                </div>
              );
            })}
          </div>
          <button onClick={() => { setAnswers({}); setRevealed({}); setTestDone(false); sndClick(); }}
            style={{ padding: "12px 28px", background: `linear-gradient(90deg,#0f4c4c,${C})`, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: FONT, marginTop: 8 }}>
            🔄 Testi Tekrar Çöz
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 12, color: "#475569", fontFamily: FONT }}>Her soruyu okuyun ve tek seçenek işaretleyin.</div>
        {TEST_ITEMS.map((q, qi) => {
          const chosen = answers[qi];
          const isRev  = revealed[qi];
          return (
            <div key={qi} style={{ padding: "15px 17px", background: "rgba(0,0,0,0.3)", border: `1px solid ${isRev ? (chosen === q.ans ? "#34d39930" : "#f43f5e30") : "rgba(255,255,255,0.07)"}`, borderRadius: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 12, fontFamily: FONT, lineHeight: 1.55 }}>
                <span style={{ color: C, fontFamily: MONO, marginRight: 6 }}>{qi + 1}.</span>{q.q}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {q.opts.map((opt, oi) => {
                  let bg = "rgba(0,0,0,0.25)", border = "rgba(255,255,255,0.07)", col = "#94a3b8";
                  if (isRev) {
                    if (oi === q.ans) { bg = "rgba(52,211,153,0.10)"; border = "#34d39940"; col = "#34d399"; }
                    else if (oi === chosen) { bg = "rgba(244,63,94,0.10)"; border = "#f43f5e40"; col = "#f43f5e"; }
                  } else if (chosen === oi) { bg = `${C}12`; border = `${C}50`; col = C; }
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
                  style={{ marginTop: 10, padding: "7px 17px", background: `${C}18`, border: `1px solid ${C}40`, borderRadius: 7, color: C, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                  Cevabı Kontrol Et
                </button>
              )}
              {isRev && (
                <div style={{ marginTop: 9, padding: "9px 12px", background: chosen === q.ans ? "rgba(52,211,153,0.07)" : "rgba(244,63,94,0.07)", border: `1px solid ${chosen === q.ans ? "#34d39920" : "#f43f5e20"}`, borderRadius: 8, fontSize: 11, color: "#94a3b8", fontFamily: FONT, lineHeight: 1.55 }}>
                  {q.ac}
                </div>
              )}
            </div>
          );
        })}
        {Object.keys(revealed).length === TEST_ITEMS.length && (
          <button onClick={() => setTestDone(true)}
            style={{ padding: "13px", background: `linear-gradient(90deg,#0f4c4c,${C})`, border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: FONT }}>
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
      <div style={{ padding: "20px 20px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <div style={{ fontSize: 9, color: C, letterSpacing: 4, fontWeight: 800, fontFamily: MONO, marginBottom: 4 }}>4. ÜNİTE · BEŞERİ SİSTEMLER VE SÜREÇLER</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${C}30,${C}08)`, border: `1px solid ${C}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📈</div>
                <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.2, fontFamily: FONT }}>Demografik Dönüşüm ve Nüfus Piramitleri</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2, fontFamily: FONT }}>4.1.3 — Yaş Grupları · 5 Aşama Modeli · Ülke Örnekleri · Türkiye</div>
                </div>
                </div>
            </div>
            <button onClick={onClose} style={{ padding:"8px 18px", background:"transparent", border:"1px solid rgba(255,80,80,0.3)", borderRadius:8, color:"#f87171", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,80,80,0.1)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>✕ KAPAT</button>
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

            {/* Hızlı özet */}
            <div style={{ marginTop: 16, padding: "12px 10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10 }}>
              <div style={{ fontSize: 9, color: "#475569", letterSpacing: 2, fontWeight: 800, marginBottom: 8, fontFamily: MONO }}>ÖZET</div>
              {[
                ["Piramit", "Yaş+cinsiyet dağılımı"],
                ["0–14 yaş", "Genç/çocuk nüfus"],
                ["15–64 yaş", "Aktif nüfus"],
                ["65+ yaş", "Yaşlı nüfus"],
                ["2. Aşama", "Etiyopya"],
                ["3. Aşama", "Meksika"],
                ["4. Aşama", "Kanada"],
                ["5. Aşama", "Japonya"],
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
                  <div style={{ fontSize: 10, color: "#475569", fontFamily: MONO, letterSpacing: 1 }}>4.1.3 · KONU {SECTIONS.findIndex(s => s.id === sec) + 1}/{SECTIONS.length}</div>
                </div>
              </div>
              {renderLearn()}
            </>
          )}
          {tab === "act"  && <EslestirmeAktivite />}
          {tab === "test" && renderTest()}
        </div>
      </div>
    </div>
  );
}