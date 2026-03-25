"use client";

import { useMemo, useState } from "react";

const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const MONO = "'Courier New',Courier,monospace";
const BG = "#06111f";
const PRIMARY = "#22c55e";
const SECONDARY = "#38bdf8";
const ACCENT = "#f59e0b";
const PANEL = "rgba(7,18,33,0.88)";

type Tab = "learn" | "activity" | "test";
type LearnSection = "temel" | "elemanlar" | "turler" | "koordinat";

interface LearnCardItem {
  title: string;
  text: string;
}

interface QuizItem {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const LEARN_CONTENT: Record<LearnSection, { title: string; subtitle: string; color: string; cards: LearnCardItem[] }> = {
  temel: {
    title: "Harita Nedir?",
    subtitle: "Haritanin tanimi, onemi ve harita olabilme kosullari",
    color: PRIMARY,
    cards: [
      {
        title: "Mekanin sembolik dili",
        text:
          "Harita; Dunya'nin veya baska bir gok cisminin tamaminin ya da bir bolumunun kus bakisi gorunumle, belirli bir oranda kucultulerek duzleme aktarilmis gosterimidir.",
      },
      {
        title: "Neden ihtiyac duyariz?",
        text:
          "Haritalar 'Nerede?' sorusuna cevap verir. Ulasim, afet yonetimi, cevre planlama, tarim, saglik, guvenlik ve turizm gibi alanlarda karar vermeyi kolaylastirir.",
      },
      {
        title: "Bir cizim ne zaman haritadir?",
        text:
          "Bir cizimin harita sayilabilmesi icin kus bakisi cizilmesi, olcek tasimasi ve duzlem uzerine aktarilmasi gerekir. Bu ozellikleri tasimayan serbest cizimler kroki olarak adlandirilir.",
      },
    ],
  },
  elemanlar: {
    title: "Harita Elemanlari",
    subtitle: "Bir haritayi dogru okumak icin once onun dilini cozeriz",
    color: SECONDARY,
    cards: [
      {
        title: "Baslik",
        text:
          "Haritanin neyi, hangi alan icin gosterdigini belirtir. Baslik sayesinde haritanin konusu ilk bakista anlasilir.",
      },
      {
        title: "Olcek ve yon",
        text:
          "Olcek, gercek uzunluklarin ne kadar kucultuldugunu gosterir. Yon oku ise kuzey basta olmak uzere yonleri dogru yorumlamayi saglar.",
      },
      {
        title: "Lejant ve koordinatlar",
        text:
          "Lejant; renklerin, taramalarin ve sembollerin anlamini verir. Paralel ve meridyenler ise bir yerin kesin konumunu belirtmeye yardim eder.",
      },
    ],
  },
  turler: {
    title: "Harita Turleri",
    subtitle: "Kullanim amacina gore haritalar farkli bilgi sunar",
    color: "#a78bfa",
    cards: [
      {
        title: "Genel haritalar",
        text:
          "Fiziki, siyasi, topografya ve atlas haritalari gibi genis kullanimli haritalardir. Mekanin temel ozelliklerini genel bir bakisla verir.",
      },
      {
        title: "Tematik haritalar",
        text:
          "Nufus, iklim, bitki ortusu, ulasim, ekonomi, jeoloji ve toprak gibi belirli bir konuyu one cikaran haritalardir.",
      },
      {
        title: "Dogru harita secimi",
        text:
          "Bir soruya cevap ararken once uygun harita turu secilmelidir. Ornegin nufus dagilisi icin nufus haritasi, yer sekilleri icin fiziki harita kullanilir.",
      },
    ],
  },
  koordinat: {
    title: "Cografi Koordinatlar",
    subtitle: "Enlem ve boylamla bir noktanin yeri matematiksel olarak bulunur",
    color: ACCENT,
    cards: [
      {
        title: "Enlem",
        text:
          "Enlem, bir noktanin Ekvator'a olan acisal uzakligidir. Kuzey ve Guney Yarim Kure'de derece, dakika ve saniye ile ifade edilir.",
      },
      {
        title: "Boylam",
        text:
          "Boylam, bir noktanin baslangic meridyenine olan acisal uzakligidir. Dogu ya da Bati boylami olarak ifade edilir.",
      },
      {
        title: "Gunluk kullanim",
        text:
          "Koordinat sistemi gunumuzde ozellikle GPS ile ulasim, lojistik, muhendislik, meteoroloji ve acil durum yonetiminde aktif olarak kullanilir.",
      },
    ],
  },
};

const MAP_RULES = [
  { label: "Kus bakisi gorunum", detail: "Harita ustten bakiyormus gibi cizilir." },
  { label: "Olcek", detail: "Gercek uzunluklar orantili bicimde kucultulur." },
  { label: "Duzlem", detail: "Kagit, ekran ya da benzeri bir yuzeye aktarilir." },
];

const MAP_ELEMENTS = [
  { id: "baslik", label: "Baslik", hint: "Haritanin neyi gosterdigini soyler." },
  { id: "olcek", label: "Olcek", hint: "Mesafe ve alan hesaplamasina yardim eder." },
  { id: "lejant", label: "Lejant", hint: "Sembol ve renklerin anlamini aciklar." },
  { id: "yon", label: "Yon oku", hint: "Kuzey ve diger yonleri anlamayi saglar." },
  { id: "koord", label: "Koordinatlar", hint: "Kesin konum belirtmekte kullanilir." },
];

const QUIZ_ITEMS: QuizItem[] = [
  {
    question: "Asagidakilerden hangisi bir cizimin harita sayilabilmesi icin zorunlu ozelliklerden biri degildir?",
    options: ["Kus bakisi gorunum", "Olcek", "Duzlem uzerine cizim", "Renkli olmasi"],
    correct: 3,
    explanation: "Haritanin renkli olmasi zorunlu degildir; ancak kus bakisi, olcek ve duzlem kosullari gereklidir.",
  },
  {
    question: "Haritada kullanilan renk ve sembollerin ne anlama geldigini hangi eleman aciklar?",
    options: ["Olcek", "Lejant", "Yon oku", "Baslik"],
    correct: 1,
    explanation: "Lejant, haritada yer alan sembol ve renklerin anlamini gosteren listedir.",
  },
  {
    question: "Nufusun dagilisini incelemek isteyen biri hangi harita turunu secmelidir?",
    options: ["Siyasi harita", "Nufus haritasi", "Fiziki harita", "Kroki"],
    correct: 1,
    explanation: "Nufus haritasi tematik bir haritadir ve nufus dagilisini gostermek icin kullanilir.",
  },
  {
    question: "Bir noktanin Ekvator'a olan acisal uzakligina ne ad verilir?",
    options: ["Boylam", "Yukselti", "Enlem", "Izohips"],
    correct: 2,
    explanation: "Ekvator'a gore olan acisal uzaklik enlem olarak adlandirilir.",
  },
  {
    question: "GPS teknolojisinin temel islevi asagidakilerden hangisidir?",
    options: ["Hava sicakligini olcmek", "Bir yerin koordinatlarini uydularla belirlemek", "Haritanin renklerini belirlemek", "Nufus miktarini hesaplamak"],
    correct: 1,
    explanation: "GPS, uydular yardimiyla bir konumun koordinatlarini belirlemeyi saglayan kuresel konumlandirma sistemidir.",
  },
];

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#7dd3fc", marginBottom: "5px", fontFamily: MONO }}>
        OZET
      </div>
      <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>{label}</div>
      <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px", lineHeight: 1.7 }}>{value}</div>
    </div>
  );
}

function SectionBadge({ text, color }: { text: string; color: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        borderRadius: "999px",
        background: `${color}14`,
        border: `1px solid ${color}40`,
        color,
        fontSize: "11px",
        fontWeight: 800,
        letterSpacing: "1.8px",
        fontFamily: MONO,
      }}
    >
      {text}
    </div>
  );
}

function LearnPanel() {
  const [section, setSection] = useState<LearnSection>("temel");
  const current = LEARN_CONTENT[section];

  return (
    <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
      <aside
        style={{
          width: "280px",
          flexShrink: 0,
          borderRight: "1px solid rgba(148,163,184,0.16)",
          background: "rgba(2,6,23,0.6)",
          padding: "22px 16px",
          overflowY: "auto",
        }}
      >
        <div style={{ fontSize: "11px", letterSpacing: "3px", color: PRIMARY, fontFamily: MONO, marginBottom: "14px" }}>
          KONU BASLIKLARI
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {(Object.entries(LEARN_CONTENT) as [LearnSection, (typeof LEARN_CONTENT)[LearnSection]][]).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              style={{
                textAlign: "left",
                padding: "14px",
                borderRadius: "14px",
                cursor: "pointer",
                border: `1px solid ${section === key ? value.color : "rgba(148,163,184,0.16)"}`,
                background: section === key ? `${value.color}16` : "rgba(255,255,255,0.03)",
                transition: "all 0.2s ease",
                fontFamily: FONT,
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: 800, color: section === key ? "#ffffff" : "#e2e8f0" }}>{value.title}</div>
              <div style={{ fontSize: "12px", color: section === key ? "#cbd5e1" : "#94a3b8", marginTop: "4px", lineHeight: 1.6 }}>
                {value.subtitle}
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: "22px", fontSize: "11px", letterSpacing: "3px", color: SECONDARY, fontFamily: MONO, marginBottom: "12px" }}>
          HIZLI HATIRLATMA
        </div>
        <div style={{ display: "grid", gap: "10px" }}>
          <MetricCard label="Harita kosullari" value="Kus bakisi, olcek ve duzlem" />
          <MetricCard label="Temel elemanlar" value="Baslik, olcek, lejant, yon oku, koordinatlar" />
          <MetricCard label="Koordinat sistemi" value="Enlem + Boylam = kesin konum" />
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "28px 34px",
          background: `radial-gradient(circle at top left, ${current.color}18, transparent 26%), linear-gradient(180deg, rgba(15,23,42,0.94), rgba(2,6,23,0.98))`,
        }}
      >
        <SectionBadge text="OGREN" color={current.color} />
        <h2 style={{ fontSize: "34px", lineHeight: 1.15, margin: "16px 0 10px", color: "#f8fafc", fontWeight: 800 }}>
          {current.title}
        </h2>
        <p style={{ fontSize: "16px", lineHeight: 1.8, color: "#cbd5e1", maxWidth: "820px", margin: 0 }}>{current.subtitle}</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginTop: "24px" }}>
          {current.cards.map((card) => (
            <div
              key={card.title}
              style={{
                padding: "20px",
                borderRadius: "18px",
                background: PANEL,
                border: `1px solid ${current.color}28`,
                boxShadow: "0 12px 32px rgba(2,6,23,0.22)",
              }}
            >
              <div style={{ fontSize: "15px", fontWeight: 800, color: current.color, marginBottom: "10px" }}>{card.title}</div>
              <p style={{ fontSize: "14px", lineHeight: 1.9, color: "#dbeafe", margin: 0 }}>{card.text}</p>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "24px",
            padding: "22px",
            borderRadius: "22px",
            background: "rgba(15,23,42,0.78)",
            border: "1px solid rgba(148,163,184,0.16)",
          }}
        >
          <div style={{ fontSize: "12px", letterSpacing: "3px", color: "#f8fafc", fontFamily: MONO, marginBottom: "14px" }}>
            KISA OZET
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
            {section === "temel" &&
              MAP_RULES.map((rule) => (
                <div key={rule.label} style={{ padding: "14px", borderRadius: "14px", background: `${current.color}12`, border: `1px solid ${current.color}30` }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: current.color }}>{rule.label}</div>
                  <div style={{ fontSize: "13px", lineHeight: 1.8, color: "#cbd5e1", marginTop: "6px" }}>{rule.detail}</div>
                </div>
              ))}
            {section === "elemanlar" &&
              MAP_ELEMENTS.map((item) => (
                <div key={item.id} style={{ padding: "14px", borderRadius: "14px", background: `${current.color}12`, border: `1px solid ${current.color}30` }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: current.color }}>{item.label}</div>
                  <div style={{ fontSize: "13px", lineHeight: 1.8, color: "#cbd5e1", marginTop: "6px" }}>{item.hint}</div>
                </div>
              ))}
            {section === "turler" && (
              <>
                <div style={{ padding: "14px", borderRadius: "14px", background: `${current.color}12`, border: `1px solid ${current.color}30` }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: current.color }}>Genel haritalar</div>
                  <div style={{ fontSize: "13px", lineHeight: 1.8, color: "#cbd5e1", marginTop: "6px" }}>Fiziki, siyasi, atlas ve topografya gibi genis kapsamli haritalar.</div>
                </div>
                <div style={{ padding: "14px", borderRadius: "14px", background: `${current.color}12`, border: `1px solid ${current.color}30` }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: current.color }}>Tematik haritalar</div>
                  <div style={{ fontSize: "13px", lineHeight: 1.8, color: "#cbd5e1", marginTop: "6px" }}>Nufus, iklim, ekonomi, ulasim ve toprak gibi belirli bir konuya odaklanir.</div>
                </div>
              </>
            )}
            {section === "koordinat" && (
              <>
                <div style={{ padding: "14px", borderRadius: "14px", background: `${current.color}12`, border: `1px solid ${current.color}30` }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: current.color }}>Enlem</div>
                  <div style={{ fontSize: "13px", lineHeight: 1.8, color: "#cbd5e1", marginTop: "6px" }}>Ekvator'a uzakligi ifade eder.</div>
                </div>
                <div style={{ padding: "14px", borderRadius: "14px", background: `${current.color}12`, border: `1px solid ${current.color}30` }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: current.color }}>Boylam</div>
                  <div style={{ fontSize: "13px", lineHeight: 1.8, color: "#cbd5e1", marginTop: "6px" }}>Baslangic meridyenine uzakligi ifade eder.</div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ActivityPanel() {
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [ruleChecked, setRuleChecked] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const ruleScore = useMemo(() => {
    const required = MAP_RULES.map((rule) => rule.label);
    const correctCount = selectedRules.filter((rule) => required.includes(rule)).length;
    const wrongCount = selectedRules.length - correctCount;
    return Math.max(correctCount - wrongCount, 0);
  }, [selectedRules]);

  const toggleRule = (rule: string) => {
    setSelectedRules((prev) => (prev.includes(rule) ? prev.filter((item) => item !== rule) : [...prev, rule]));
    setRuleChecked(false);
  };

  const isPerfectRuleAnswer = selectedRules.length === MAP_RULES.length && MAP_RULES.every((rule) => selectedRules.includes(rule.label));
  const activeElement = MAP_ELEMENTS.find((item) => item.id === selectedElement) ?? null;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 34px", background: "linear-gradient(180deg, rgba(4,12,24,0.96), rgba(2,6,23,1))" }}>
      <SectionBadge text="ETKINLIK" color={PRIMARY} />
      <h2 style={{ fontSize: "32px", margin: "16px 0 10px", color: "#f8fafc", fontWeight: 800 }}>Haritayi okuyarak karar ver</h2>
      <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#cbd5e1", margin: 0, maxWidth: "860px" }}>
        Bu bolumde once bir cizimin harita sayilmasi icin gereken kosullari sececek, sonra harita elemanlarinin islevlerini kullanarak minik bir yorumlama calismasi yapacaksin.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "18px", marginTop: "24px" }}>
        <div style={{ padding: "22px", borderRadius: "20px", background: PANEL, border: `1px solid ${PRIMARY}28` }}>
          <div style={{ fontSize: "12px", letterSpacing: "3px", color: PRIMARY, fontFamily: MONO, marginBottom: "10px" }}>GOREV 1</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#f8fafc", marginBottom: "10px" }}>Bir cizimin harita olma kosullari</div>
          <p style={{ fontSize: "14px", lineHeight: 1.8, color: "#cbd5e1", marginTop: 0 }}>
            Asagidaki seceneklerden harita icin zorunlu olanlari isaretle. Hepsini secince "Kontrol Et" butonuna bas.
          </p>

          <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
            {["Kus bakisi gorunum", "Olcek", "Duzlem", "Mutlaka renkli olma", "Yalnizca kagida cizilme"].map((item) => {
              const active = selectedRules.includes(item);
              return (
                <button
                  key={item}
                  onClick={() => toggleRule(item)}
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: `1px solid ${active ? PRIMARY : "rgba(148,163,184,0.16)"}`,
                    background: active ? `${PRIMARY}14` : "rgba(255,255,255,0.03)",
                    color: active ? "#f8fafc" : "#cbd5e1",
                    cursor: "pointer",
                    fontFamily: FONT,
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "18px", flexWrap: "wrap" }}>
            <button
              onClick={() => setRuleChecked(true)}
              style={{
                padding: "11px 16px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                background: `linear-gradient(90deg, ${PRIMARY}, #14b8a6)`,
                color: "#052e16",
                fontWeight: 800,
                fontFamily: FONT,
              }}
            >
              Kontrol Et
            </button>
            <div style={{ fontSize: "13px", color: "#94a3b8" }}>Anlik puan: {ruleScore} / 3</div>
          </div>

          {ruleChecked && (
            <div
              style={{
                marginTop: "16px",
                padding: "14px 16px",
                borderRadius: "14px",
                background: isPerfectRuleAnswer ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
                border: `1px solid ${isPerfectRuleAnswer ? "rgba(34,197,94,0.4)" : "rgba(245,158,11,0.4)"}`,
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: 800, color: isPerfectRuleAnswer ? "#86efac" : "#fcd34d" }}>
                {isPerfectRuleAnswer ? "Tebrikler, tum zorunlu kosullari dogru sectin." : "Bir kez daha dusun. Harita icin kus bakisi, olcek ve duzlem gereklidir."}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "22px", borderRadius: "20px", background: PANEL, border: `1px solid ${SECONDARY}28` }}>
          <div style={{ fontSize: "12px", letterSpacing: "3px", color: SECONDARY, fontFamily: MONO, marginBottom: "10px" }}>GOREV 2</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#f8fafc", marginBottom: "10px" }}>Elemani sec, gorevini ogren</div>
          <p style={{ fontSize: "14px", lineHeight: 1.8, color: "#cbd5e1", marginTop: 0 }}>
            Harita elemanlarindan birini sec. Sonra bunun hangi bilgiyi okumakta kullanildigini incele.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px", marginTop: "16px" }}>
            {MAP_ELEMENTS.map((item) => {
              const active = selectedElement === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedElement(item.id)}
                  style={{
                    padding: "14px 12px",
                    borderRadius: "14px",
                    border: `1px solid ${active ? SECONDARY : "rgba(148,163,184,0.16)"}`,
                    background: active ? `${SECONDARY}14` : "rgba(255,255,255,0.03)",
                    color: active ? "#f8fafc" : "#cbd5e1",
                    cursor: "pointer",
                    fontFamily: FONT,
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              marginTop: "18px",
              minHeight: "122px",
              padding: "16px",
              borderRadius: "16px",
              background: "rgba(15,23,42,0.72)",
              border: "1px dashed rgba(125,211,252,0.24)",
            }}
          >
            {activeElement ? (
              <>
                <div style={{ fontSize: "15px", fontWeight: 800, color: SECONDARY }}>{activeElement.label}</div>
                <p style={{ fontSize: "14px", lineHeight: 1.9, color: "#dbeafe", margin: "8px 0 0" }}>{activeElement.hint}</p>
              </>
            ) : (
              <p style={{ fontSize: "14px", lineHeight: 1.8, color: "#94a3b8", margin: 0 }}>
                Bir eleman sectiginde burada kisa aciklamasi gorunecek. Boylece haritaya bakarken hangi bilginin nereden okunacagini pekistirebilirsin.
              </p>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "20px", padding: "20px 22px", borderRadius: "20px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
        <div style={{ fontSize: "12px", letterSpacing: "3px", color: ACCENT, fontFamily: MONO, marginBottom: "8px" }}>SINIF ICIN TARTISMA SORUSU</div>
        <p style={{ fontSize: "14px", lineHeight: 1.9, color: "#fde68a", margin: 0 }}>
          Drone ile kargo dagitimi yapan bir sistemin dogru rota kurmasi icin harita, koordinat ve GPS bilgisinden nasil ayni anda yararlanabilecegini acikla.
        </p>
      </div>
    </div>
  );
}

function TestPanel() {
  const [answers, setAnswers] = useState<number[]>(Array(QUIZ_ITEMS.length).fill(-1));
  const [submitted, setSubmitted] = useState(false);

  const score = answers.reduce((total, answer, index) => (answer === QUIZ_ITEMS[index].correct ? total + 1 : total), 0);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 34px", background: "linear-gradient(180deg, rgba(3,7,18,0.98), rgba(6,17,31,1))" }}>
      <SectionBadge text="TEST" color={ACCENT} />
      <h2 style={{ fontSize: "32px", margin: "16px 0 10px", color: "#f8fafc", fontWeight: 800 }}>Kendini degerlendir</h2>
      <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#cbd5e1", margin: 0, maxWidth: "860px" }}>
        Asagidaki sorulari cozerek harita okuryazarligi kazaniminin temel kavramlarini ne kadar kavradigini kontrol et.
      </p>

      <div style={{ display: "grid", gap: "16px", marginTop: "24px" }}>
        {QUIZ_ITEMS.map((item, index) => (
          <div key={item.question} style={{ padding: "20px", borderRadius: "18px", background: PANEL, border: "1px solid rgba(148,163,184,0.16)" }}>
            <div style={{ fontSize: "15px", fontWeight: 800, color: "#f8fafc", lineHeight: 1.6 }}>
              {index + 1}. {item.question}
            </div>
            <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
              {item.options.map((option, optionIndex) => {
                const chosen = answers[index] === optionIndex;
                const showState = submitted;
                const isCorrect = item.correct === optionIndex;
                let border = "rgba(148,163,184,0.16)";
                let background = "rgba(255,255,255,0.03)";

                if (chosen) {
                  border = SECONDARY;
                  background = `${SECONDARY}14`;
                }
                if (showState && isCorrect) {
                  border = PRIMARY;
                  background = `${PRIMARY}14`;
                }
                if (showState && chosen && !isCorrect) {
                  border = "#ef4444";
                  background = "rgba(239,68,68,0.12)";
                }

                return (
                  <button
                    key={option}
                    onClick={() => {
                      const next = [...answers];
                      next[index] = optionIndex;
                      setAnswers(next);
                      setSubmitted(false);
                    }}
                    style={{
                      textAlign: "left",
                      padding: "13px 15px",
                      borderRadius: "14px",
                      border: `1px solid ${border}`,
                      background,
                      color: "#e2e8f0",
                      cursor: "pointer",
                      fontFamily: FONT,
                      fontSize: "14px",
                      lineHeight: 1.7,
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {submitted && (
              <div
                style={{
                  marginTop: "14px",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  background: "rgba(148,163,184,0.08)",
                  border: "1px solid rgba(148,163,184,0.16)",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#f8fafc" }}>
                  Dogru cevap: {item.options[item.correct]}
                </div>
                <p style={{ fontSize: "13px", lineHeight: 1.8, color: "#cbd5e1", margin: "6px 0 0" }}>{item.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginTop: "22px" }}>
        <button
          onClick={() => setSubmitted(true)}
          style={{
            padding: "12px 18px",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            background: `linear-gradient(90deg, ${ACCENT}, #f97316)`,
            color: "#1c1917",
            fontWeight: 800,
            fontFamily: FONT,
          }}
        >
          Sonuclari Goster
        </button>
        <button
          onClick={() => {
            setAnswers(Array(QUIZ_ITEMS.length).fill(-1));
            setSubmitted(false);
          }}
          style={{
            padding: "12px 18px",
            borderRadius: "12px",
            border: "1px solid rgba(148,163,184,0.2)",
            cursor: "pointer",
            background: "transparent",
            color: "#cbd5e1",
            fontWeight: 700,
            fontFamily: FONT,
          }}
        >
          Testi Sifirla
        </button>
        {submitted && (
          <div style={{ fontSize: "14px", color: "#fde68a", fontWeight: 700 }}>
            Puanin: {score} / {QUIZ_ITEMS.length}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DistributionMethodsActivity({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("learn");

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "learn", label: "OGREN", icon: "📘" },
    { id: "activity", label: "ETKINLIK", icon: "🧩" },
    { id: "test", label: "TEST", icon: "📝" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        background: BG,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          height: "72px",
          borderBottom: "1px solid rgba(34,197,94,0.18)",
          background: "rgba(2,6,23,0.86)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          gap: "16px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "22px", minWidth: 0 }}>
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "4px", color: PRIMARY, opacity: 0.75, fontFamily: MONO }}>HARITA OKURYAZARLIGI</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#f8fafc" }}>Konu Anlatimi, Etkinlik ve Test</div>
          </div>

          <div style={{ display: "flex", gap: "4px", padding: "4px", borderRadius: "12px", background: "rgba(15,23,42,0.78)" }}>
            {tabs.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                style={{
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "10px",
                  padding: "9px 14px",
                  background: tab === item.id ? PRIMARY : "transparent",
                  color: tab === item.id ? "#052e16" : "#cbd5e1",
                  fontWeight: 800,
                  fontSize: "12px",
                  fontFamily: FONT,
                }}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "1px solid rgba(248,113,113,0.4)",
            background: "transparent",
            color: "#fca5a5",
            cursor: "pointer",
            fontWeight: 700,
            fontFamily: FONT,
          }}
        >
          X KAPAT
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {tab === "learn" && <LearnPanel />}
        {tab === "activity" && <ActivityPanel />}
        {tab === "test" && <TestPanel />}
      </div>
    </div>
  );
}
