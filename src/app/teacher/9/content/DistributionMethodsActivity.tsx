﻿"use client";

import { useMemo, useState } from "react";
import MapReadingActivity from "./MapReadingActivity";
import { FONT_SANS, FONT_MONO, BG_DARK, COLOR_PRIMARY, COLOR_SECONDARY, COLOR_ACCENT, PANEL_DARK, COLOR_UA } from "./theme";

const ACCENT = "#fbbf24";

// ─── Ses ─────────────────────────────────────────────────────────────────────
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
const sndOK    = () => [440,554,660].forEach((f,i) => setTimeout(() => beep(f,0.22,"sine",0.14), i*80));
const sndFail  = () => beep(200,0.32,"sawtooth",0.12);
const sndClick = () => beep(700,0.07,"square",0.07);

type Tab = "learn" | "activity" | "map_reading" | "test";
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
    subtitle: "Haritanın tanımı, önemi ve harita olabilme koşulları",
    color: COLOR_PRIMARY,
    cards: [
      {
        title: "Mekânın sembolik dili",
        text: "Harita; Dünya'nın veya başka bir gök cisminin tamamının ya da bir bölümünün kuş bakışı görünümle, belirli bir oranda küçültülerek düzleme aktarılmış gösterimidir.",
      },
      {
        title: "Neden ihtiyaç duyarız?",
        text: "Haritalar 'Nerede?' sorusuna cevap verir. Ulaşım, afet yönetimi, çevre planlama, tarım, sağlık, güvenlik ve turizm gibi alanlarda karar vermeyi kolaylaştırır.",
      },
      {
        title: "Bir çizim ne zaman haritadır?",
        text: "Bir çizimin harita sayılabilmesi için kuş bakışı çizilmesi, ölçek taşıması ve düzlem üzerine aktarılması gerekir. Bu özellikleri taşımayan serbest çizimler kroki olarak adlandırılır.",
      },
    ],
  },
  elemanlar: {
    title: "Harita Elemanları",
    subtitle: "Bir haritayı doğru okumak için önce onun dilini çözeriz",
    color: COLOR_SECONDARY,
    cards: [
      {
        title: "Başlık",
        text: "Haritanın neyi, hangi alan için gösterdiğini belirtir. Başlık sayesinde haritanın konusu ilk bakışta anlaşılır.",
      },
      {
        title: "Ölçek ve yön",
        text: "Ölçek, gerçek uzunlukların ne kadar küçültüldüğünü gösterir. Yön oku ise kuzey başta olmak üzere yönleri doğru yorumlamayı sağlar.",
      },
      {
        title: "Lejant ve koordinatlar",
        text: "Lejant; renklerin, taramaların ve sembollerin anlamını verir. Paralel ve meridyenler ise bir yerin kesin konumunu belirtmeye yardım eder.",
      },
    ],
  },
  turler: {
    title: "Harita Türleri",
    subtitle: "Kullanım amacına göre haritalar farklı bilgi sunar",
    color: COLOR_UA,
    cards: [
      {
        title: "Genel haritalar",
        text: "Fiziki, siyasi, topoğrafya ve atlas haritaları gibi geniş kullanımlı haritalardır. Mekânın temel özelliklerini genel bir bakışla verir.",
      },
      {
        title: "Tematik haritalar",
        text: "Nüfus, iklim, bitki örtüsü, ulaşım, ekonomi, jeoloji ve toprak gibi belirli bir konuyu öne çıkaran haritalardır.",
      },
      {
        title: "Doğru harita seçimi",
        text: "Bir soruya cevap ararken önce uygun harita türü seçilmelidir. Örneğin nüfus dağılışı için nüfus haritası, yer şekilleri için fiziki harita kullanılır.",
      },
    ],
  },
  koordinat: {
    title: "Coğrafi Koordinatlar",
    subtitle: "Enlem ve boylamla bir noktanın yeri matematiksel olarak bulunur",
    color: COLOR_ACCENT,
    cards: [
      {
        title: "Enlem",
        text: "Enlem, bir noktanın Ekvator'a olan açısal uzaklığıdır. Kuzey ve Güney Yarım Küre'de derece, dakika ve saniye ile ifade edilir.",
      },
      {
        title: "Boylam",
        text: "Boylam, bir noktanın başlangıç meridyenine olan açısal uzaklığıdır. Doğu ya da Batı boylamı olarak ifade edilir.",
      },
      {
        title: "Günlük kullanım",
        text: "Koordinat sistemi günümüzde özellikle GPS ile ulaşım, lojistik, mühendislik, meteoroloji ve acil durum yönetiminde aktif olarak kullanılır.",
      },
    ],
  },
};

const MAP_RULES = [
  { label: "Kuş bakışı görünüm", detail: "Harita üstten bakıyormuş gibi çizilir." },
  { label: "Ölçek", detail: "Gerçek uzunluklar orantılı biçimde küçültülür." },
  { label: "Düzlem", detail: "Kâğıt, ekran ya da benzeri bir yüzeye aktarılır." },
];

const MAP_ELEMENTS = [
  { id: "baslik", label: "Başlık", hint: "Haritanın neyi gösterdiğini söyler." },
  { id: "olcek", label: "Ölçek", hint: "Mesafe ve alan hesaplamasına yardım eder." },
  { id: "lejant", label: "Lejant", hint: "Sembol ve renklerin anlamını açıklar." },
  { id: "yon", label: "Yön oku", hint: "Kuzey ve diğer yönleri anlamayı sağlar." },
  { id: "koord", label: "Koordinatlar", hint: "Kesin konum belirtmekte kullanılır." },
];

const QUIZ_ITEMS: QuizItem[] = [
  {
    question: "Aşağıdakilerden hangisi bir çizimin harita sayılabilmesi için zorunlu özelliklerden biri değildir?",
    options: ["Kuş bakışı görünüm", "Ölçek", "Düzlem üzerine çizim", "Renkli olması"],
    correct: 3,
    explanation: "Haritanın renkli olması zorunlu değildir; ancak kuş bakışı, ölçek ve düzlem koşulları gereklidir.",
  },
  {
    question: "Haritada kullanılan renk ve sembollerin ne anlama geldiğini hangi eleman açıklar?",
    options: ["Ölçek", "Lejant", "Yön oku", "Başlık"],
    correct: 1,
    explanation: "Lejant, haritada yer alan sembol ve renklerin anlamını gösteren listedir.",
  },
  {
    question: "Nüfusun dağılışını incelemek isteyen biri hangi harita türünü seçmelidir?",
    options: ["Siyasi harita", "Nüfus haritası", "Fiziki harita", "Kroki"],
    correct: 1,
    explanation: "Nüfus haritası tematik bir haritadır ve nüfus dağılışını göstermek için kullanılır.",
  },
  {
    question: "Bir noktanın Ekvator'a olan açısal uzaklığına ne ad verilir?",
    options: ["Boylam", "Yükselti", "Enlem", "İzohips"],
    correct: 2,
    explanation: "Ekvator'a göre olan açısal uzaklık enlem olarak adlandırılır.",
  },
  {
    question: "GPS teknolojisinin temel işlevi aşağıdakilerden hangisidir?",
    options: ["Hava sıcaklığını ölçmek", "Bir yerin koordinatlarını uydularla belirlemek", "Haritanın renklerini belirlemek", "Nüfus miktarını hesaplamak"],
    correct: 1,
    explanation: "GPS, uydular yardımıyla bir konumun koordinatlarını belirlemeyi sağlayan küresel konumlandırma sistemidir.",
  },
  {
    question: "Ölçek kullanılmadan çizilen kaba taslak gösterimlere ne ad verilir?",
    options: ["Plan", "Lejant", "Kroki", "Projeksiyon"],
    correct: 2,
    explanation: "Ölçeksiz yapılan kaba taslak çizimler kroki olarak adlandırılır; bu nedenle uzunluk ve alan hesabı yapılamaz.",
  },
  {
    question: "Aşağıdakilerden hangisi haritanın temel elemanlarından biridir?",
    options: ["Paragraf", "Lejant", "Deneme", "Fotoğraf albümü"],
    correct: 1,
    explanation: "Lejant, haritadaki sembol ve renklerin anlamını veren temel harita elemanlarından biridir.",
  },
  {
    question: "Yer şekillerini genel hatlarıyla görmek isteyen biri öncelikle hangi haritaya bakmalıdır?",
    options: ["Fiziki harita", "Nüfus haritası", "Turizm haritası", "Ulaşım haritası"],
    correct: 0,
    explanation: "Fiziki haritalar dağ, ova, plato ve yükselti gibi yer şekillerini göstermede kullanılır.",
  },
  {
    question: "Başlangıç meridyenine göre bir yerin doğuda veya batıda olduğunu gösteren bilgi aşağıdakilerden hangisidir?",
    options: ["Yükselti", "Boylam", "Lejant", "Ölçek"],
    correct: 1,
    explanation: "Boylam, bir noktanın başlangıç meridyenine olan açısal uzaklığını ifade eder ve doğu-batı konumunu belirler.",
  },
  {
    question: "Haritanın neyi gösterdiğini ilk bakışta anlamamızı sağlayan eleman hangisidir?",
    options: ["Başlık", "Renk tonu", "Çerçeve kalınlığı", "Kâğıt boyutu"],
    correct: 0,
    explanation: "Başlık, haritanın konusunu ve gösterdiği alanı açıkça belirterek ilk okumayı kolaylaştırır.",
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
      <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#7dd3fc", marginBottom: "5px", fontFamily: FONT_MONO }}>
        ÖZET
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
        fontFamily: FONT_MONO,
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
        <div style={{ fontSize: "11px", letterSpacing: "3px", color: COLOR_PRIMARY, fontFamily: FONT_MONO, marginBottom: "14px" }}>
          KONU BAŞLIKLARI
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {(Object.entries(LEARN_CONTENT) as [LearnSection, (typeof LEARN_CONTENT)[LearnSection]][]).map(([key, value]) => (
            <button
              key={key}
              onClick={() => { sndClick(); setSection(key); }}
              style={{
                textAlign: "left",
                padding: "14px",
                borderRadius: "14px",
                cursor: "pointer",
                border: `1px solid ${section === key ? value.color : "rgba(148,163,184,0.16)"}`,
                background: section === key ? `${value.color}16` : "rgba(255,255,255,0.03)",
                transition: "all 0.2s ease",
                fontFamily: FONT_SANS,
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: 800, color: section === key ? "#ffffff" : "#e2e8f0" }}>{value.title}</div>
              <div style={{ fontSize: "12px", color: section === key ? "#cbd5e1" : "#94a3b8", marginTop: "4px", lineHeight: 1.6 }}>
                {value.subtitle}
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: "22px", fontSize: "11px", letterSpacing: "3px", color: COLOR_SECONDARY, fontFamily: FONT_MONO, marginBottom: "12px" }}>
          HIZLI HATIRLATMA
        </div>
        <div style={{ display: "grid", gap: "10px" }}>
          <MetricCard label="Harita koşulları" value="Kuş bakışı, ölçek ve düzlem" />
          <MetricCard label="Temel elemanlar" value="Başlık, ölçek, lejant, yön oku, koordinatlar" />
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
        <SectionBadge text="ÖĞREN" color={current.color} />
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
                background: PANEL_DARK,
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
          <div style={{ fontSize: "12px", letterSpacing: "3px", color: "#f8fafc", fontFamily: FONT_MONO, marginBottom: "14px" }}>
            KISA ÖZET
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
                  <div style={{ fontSize: "13px", lineHeight: 1.8, color: "#cbd5e1", marginTop: "6px" }}>Fiziki, siyasi, atlas ve topoğrafya gibi geniş kapsamlı haritalar.</div>
                </div>
                <div style={{ padding: "14px", borderRadius: "14px", background: `${current.color}12`, border: `1px solid ${current.color}30` }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: current.color }}>Tematik haritalar</div>
                  <div style={{ fontSize: "13px", lineHeight: 1.8, color: "#cbd5e1", marginTop: "6px" }}>Nüfus, iklim, ekonomi, ulaşım ve toprak gibi belirli bir konuya odaklanır.</div>
                </div>
              </>
            )}
            {section === "koordinat" && (
              <>
                <div style={{ padding: "14px", borderRadius: "14px", background: `${current.color}12`, border: `1px solid ${current.color}30` }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: current.color }}>Enlem</div>
                  <div style={{ fontSize: "13px", lineHeight: 1.8, color: "#cbd5e1", marginTop: "6px" }}>Ekvator'a uzaklığı ifade eder.</div>
                </div>
                <div style={{ padding: "14px", borderRadius: "14px", background: `${current.color}12`, border: `1px solid ${current.color}30` }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: current.color }}>Boylam</div>
                  <div style={{ fontSize: "13px", lineHeight: 1.8, color: "#cbd5e1", marginTop: "6px" }}>Başlangıç meridyenine uzaklığı ifade eder.</div>
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
    setRuleChecked(false); sndClick();
  };

  const isPerfectRuleAnswer = selectedRules.length === MAP_RULES.length && MAP_RULES.every((rule) => selectedRules.includes(rule.label));
  const activeElement = MAP_ELEMENTS.find((item) => item.id === selectedElement) ?? null;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 34px", background: "linear-gradient(180deg, rgba(4,12,24,0.96), rgba(2,6,23,1))" }}>
      <SectionBadge text="ETKİNLİK" color={COLOR_PRIMARY} />
      <h2 style={{ fontSize: "32px", margin: "16px 0 10px", color: "#f8fafc", fontWeight: 800 }}>Haritayı okuyarak karar ver</h2>
      <p style={{ fontSize: "15px", lineHeight: 1.8, color: "#cbd5e1", margin: 0, maxWidth: "860px" }}>
        Bu bölümde önce bir çizimin harita sayılması için gereken koşulları seçecek, sonra harita elemanlarının işlevlerini kullanarak minik bir yorumlama çalışması yapacaksın.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "18px", marginTop: "24px" }}>
        <div style={{ padding: "22px", borderRadius: "20px", background: PANEL_DARK, border: `1px solid ${COLOR_PRIMARY}28` }}>
          <div style={{ fontSize: "12px", letterSpacing: "3px", color: COLOR_PRIMARY, fontFamily: FONT_MONO, marginBottom: "10px" }}>GÖREV 1</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#f8fafc", marginBottom: "10px" }}>Bir çizimin harita olma koşulları</div>
          <p style={{ fontSize: "14px", lineHeight: 1.8, color: "#cbd5e1", marginTop: 0 }}>
            Aşağıdaki seçeneklerden harita için zorunlu olanları işaretle. Hepsini seçince "Kontrol Et" butonuna bas.
          </p>

          <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
            {["Kuş bakışı görünüm", "Ölçek", "Düzlem", "Mutlaka renkli olma", "Yalnızca kâğıda çizilme"].map((item) => {
              const active = selectedRules.includes(item);
              return (
                <button
                  key={item}
                  onClick={() => toggleRule(item)}
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: `1px solid ${active ? COLOR_PRIMARY : "rgba(148,163,184,0.16)"}`,
                    background: active ? `${COLOR_PRIMARY}14` : "rgba(255,255,255,0.03)",
                    color: active ? "#f8fafc" : "#cbd5e1",
                    cursor: "pointer",
                    fontFamily: FONT_SANS,
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
              onClick={() => { setRuleChecked(true); sndClick(); }}
              style={{
                padding: "11px 16px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                background: `linear-gradient(90deg, ${COLOR_PRIMARY}, #14b8a6)`,
                color: "#052e16",
                fontWeight: 800,
                fontFamily: FONT_SANS,
              }}
            >
              Kontrol Et
            </button>
            <div style={{ fontSize: "13px", color: "#94a3b8" }}>Anlık puan: {ruleScore} / 3</div>
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
                {isPerfectRuleAnswer ? "Tebrikler, tüm zorunlu koşulları doğru seçtin." : "Bir kez daha düşün. Harita için kuş bakışı, ölçek ve düzlem gereklidir."}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "22px", borderRadius: "20px", background: PANEL_DARK, border: `1px solid ${COLOR_SECONDARY}28` }}>
          <div style={{ fontSize: "12px", letterSpacing: "3px", color: COLOR_SECONDARY, fontFamily: FONT_MONO, marginBottom: "10px" }}>GÖREV 2</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#f8fafc", marginBottom: "10px" }}>Elemanı seç, görevini öğren</div>
          <p style={{ fontSize: "14px", lineHeight: 1.8, color: "#cbd5e1", marginTop: 0 }}>
            Harita elemanlarından birini seç. Sonra bunun hangi bilgiyi okumakta kullanıldığını incele.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px", marginTop: "16px" }}>
            {MAP_ELEMENTS.map((item) => {
              const active = selectedElement === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setSelectedElement(item.id); sndClick(); }}
                  style={{
                    padding: "14px 12px",
                    borderRadius: "14px",
                    border: `1px solid ${active ? COLOR_SECONDARY : "rgba(148,163,184,0.16)"}`,
                    background: active ? `${COLOR_SECONDARY}14` : "rgba(255,255,255,0.03)",
                    color: active ? "#f8fafc" : "#cbd5e1",
                    cursor: "pointer",
                    fontFamily: FONT_SANS,
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
                <div style={{ fontSize: "15px", fontWeight: 800, color: COLOR_SECONDARY }}>{activeElement.label}</div>
                <p style={{ fontSize: "14px", lineHeight: 1.9, color: "#dbeafe", margin: "8px 0 0" }}>{activeElement.hint}</p>
              </>
            ) : (
              <p style={{ fontSize: "14px", lineHeight: 1.8, color: "#94a3b8", margin: 0 }}>
                Bir eleman seçtiğinde burada kısa açıklaması görünecek. Böylece haritaya bakarken hangi bilginin nereden okunacağını pekiştirebilirsin.
              </p>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "20px", padding: "20px 22px", borderRadius: "20px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
        <div style={{ fontSize: "12px", letterSpacing: "3px", color: COLOR_ACCENT, fontFamily: FONT_MONO, marginBottom: "8px" }}>SINIF İÇİN TARTIŞMA SORUSU</div>
        <p style={{ fontSize: "14px", lineHeight: 1.9, color: "#fde68a", margin: 0 }}>
          Drone ile kargo dağıtımı yapan bir sistemin doğru rota kurması için harita, koordinat ve GPS bilgisinden nasıl aynı anda yararlanabileceğini açıkla.
        </p>
      </div>
    </div>
  );
}

function TestPanel() {
  const [qIdx, setQIdx] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  const q = QUIZ_ITEMS[qIdx];
  const progress = Math.round(((qIdx + 1) / QUIZ_ITEMS.length) * 100);

  const handleAnswer = (index: number) => {
    if (sel !== null) return;
    setSel(index);
    const correct = index === q.correct;
    if (correct) { setScore((prev) => prev + 10); sndOK(); } else { sndFail(); }
    setAnswers((prev) => [...prev, correct]);
  };

  const next = () => {
    sndClick();
    if (qIdx >= QUIZ_ITEMS.length - 1) {
      setDone(true);
      return;
    }
    setQIdx((prev) => prev + 1);
    setSel(null);
  };

  const retry = () => {
    sndClick();
    setQIdx(0);
    setSel(null);
    setScore(0);
    setAnswers([]);
    setDone(false);
  };

  if (done) {
    const pct = Math.round((score / (QUIZ_ITEMS.length * 10)) * 100);
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "18px", padding: "32px 24px", textAlign: "center", background: "linear-gradient(180deg, rgba(3,7,18,0.98), rgba(6,17,31,1))" }}>
        <div style={{ fontSize: "52px" }}>Harita</div>
        <div style={{ fontSize: "26px", fontWeight: 800, color: "#e2e8f0", fontFamily: FONT_SANS }}>Test Tamamlandı</div>
        <div style={{ fontSize: "50px", fontWeight: 800, color: pct >= 80 ? COLOR_PRIMARY : pct >= 50 ? COLOR_ACCENT : "#ef4444", fontFamily: FONT_MONO }}>{score} PUAN</div>
        <div style={{ fontSize: "14px", color: "#94a3b8", fontFamily: FONT_SANS }}>{answers.filter(Boolean).length}/{QUIZ_ITEMS.length} doğru - %{pct}</div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ padding: "12px 16px", background: `${COLOR_PRIMARY}10`, border: `1.5px solid ${COLOR_PRIMARY}30`, borderRadius: "10px", textAlign: "center" }}>
            <div style={{ fontSize: "13px", fontWeight: 800, color: COLOR_PRIMARY, fontFamily: FONT_SANS }}>Doğru</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: COLOR_PRIMARY, fontFamily: FONT_MONO }}>{answers.filter(Boolean).length}/{QUIZ_ITEMS.length}</div>
          </div>
          <div style={{ padding: "12px 16px", background: `rgba(245,158,11,0.1)`, border: `1.5px solid rgba(245,158,11,0.3)`, borderRadius: "10px", textAlign: "center" }}>
            <div style={{ fontSize: "13px", fontWeight: 800, color: COLOR_ACCENT, fontFamily: FONT_SANS }}>Başarı</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: COLOR_ACCENT, fontFamily: FONT_MONO }}>%{pct}</div>
          </div>
        </div>
        <div style={{ fontSize: "14px", color: "#94a3b8", maxWidth: "420px", lineHeight: "1.8", fontFamily: FONT_SANS }}>
          {pct >= 80 ? "Harita okuryazarlığı konularını çok iyi kavradın." : pct >= 50 ? "İyi gidiyorsun. Öğren sekmesine dönüp kısa bir tekrar yaparsan daha da güçlenir." : "Öğren sekmesindeki konu özetlerini tekrar inceleyip testi yeniden çözebilirsin."}
        </div>
        <button
          onClick={retry}
          style={{ padding: "13px 30px", background: `linear-gradient(90deg, #0f766e, ${COLOR_PRIMARY})`, border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: 800, cursor: "pointer", fontFamily: FONT_SANS }}
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", background: "linear-gradient(180deg, rgba(3,7,18,0.98), rgba(6,17,31,1))" }}>
      <div style={{ width: "220px", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.05)", background: "rgba(3,6,15,0.6)", padding: "20px 14px", display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto" }}>
        <div style={{ fontSize: "11px", letterSpacing: "2px", color: "#94a3b8", fontWeight: 800, fontFamily: FONT_SANS, marginBottom: "4px" }}>SORULAR</div>
        {QUIZ_ITEMS.map((_, i) => {
          const doneItem = i < answers.length;
          const cur = i === qIdx;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                background: cur ? `${ACCENT}10` : "rgba(0,0,0,0.15)",
                border: `1.5px solid ${cur ? ACCENT : doneItem ? answers[i] ? "rgba(52,211,153,0.3)" : "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.04)"}`,
                borderRadius: "7px",
              }}
            >
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: doneItem ? answers[i] ? "#34d399" : "#ef4444" : cur ? COLOR_ACCENT : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#fff", flexShrink: 0, fontFamily: FONT_MONO }}>
                {doneItem ? answers[i] ? "OK" : "X" : i + 1}
              </div>
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: cur ? COLOR_ACCENT : "#cbd5e1", fontFamily: FONT_SANS }}>Soru {i + 1}</div>
                <div style={{ fontSize: "10px", color: cur ? "#fcd34d" : "#64748b", fontFamily: FONT_SANS }}>HARITA</div>
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: "auto", padding: "12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "9px", textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700, fontFamily: FONT_SANS, marginBottom: "4px" }}>PUAN</div>
          <div style={{ fontSize: "30px", fontWeight: 800, color: COLOR_ACCENT, fontFamily: FONT_MONO }}>{score}</div>
          <div style={{ fontSize: "11px", color: "#64748b", fontFamily: FONT_SANS }}>/ {QUIZ_ITEMS.length * 10}</div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 36px", overflowY: "auto", gap: "18px" }}>
        <div style={{ width: "100%", maxWidth: "640px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700, fontFamily: FONT_SANS }}>SORU {qIdx + 1}/{QUIZ_ITEMS.length}</span>
              <span style={{ padding: "2px 8px", background: `${COLOR_ACCENT}18`, border: `1px solid ${COLOR_ACCENT}40`, borderRadius: "4px", fontSize: "10px", fontWeight: 800, color: COLOR_ACCENT, fontFamily: FONT_SANS }}>TEST</span>
            </div>
            <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: FONT_SANS }}>%{progress}</span>
          </div>
          <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, #0f766e, ${COLOR_ACCENT})`, borderRadius: "2px", transition: "width 0.4s" }} />
          </div>
        </div>

        <div style={{ maxWidth: "640px", width: "100%", padding: "22px 24px", background: `rgba(245,158,11,0.08)`, border: `1.5px solid ${COLOR_ACCENT}20`, borderRadius: "14px" }}>
          <p style={{ fontSize: "15px", color: "#e2e8f0", lineHeight: "1.9", margin: 0, fontWeight: 600, fontFamily: FONT_SANS }}>{q.question}</p>
        </div>

        <div style={{ maxWidth: "640px", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px" }}>
          {q.options.map((opt, i) => {
            const isSel = sel === i;
            const isCorr = i === q.correct;
            const show = sel !== null;
            let bg = "rgba(0,0,0,0.25)";
            let border = "rgba(255,255,255,0.07)";
            let color = "#cbd5e1";

            if (show) {
              if (isCorr) {
                bg = "#34d39912";
                border = "#34d399";
                color = "#34d399";
              } else if (isSel) {
                bg = "rgba(239,68,68,0.1)";
                border = "#ef4444";
                color = "#fca5a5";
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={sel !== null}
                style={{ padding: "13px 15px", background: bg, border: `2px solid ${border}`, borderRadius: "10px", cursor: sel !== null ? "default" : "pointer", fontFamily: FONT_SANS, textAlign: "left", transition: "all 0.18s" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "9px" }}>
                  <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: show && isCorr ? "#34d399" : show && isSel && !isCorr ? "#ef4444" : `${COLOR_ACCENT}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#fff", flexShrink: 0, marginTop: "1px", fontFamily: FONT_MONO }}>
                    {show && isCorr ? "OK" : show && isSel && !isCorr ? "X" : String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ fontSize: "13px", color, fontWeight: 600, lineHeight: "1.6", fontFamily: FONT_SANS }}>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>

        {sel !== null && (
          <div style={{ maxWidth: "640px", width: "100%", padding: "15px 18px", background: sel === q.correct ? "rgba(52,211,153,0.07)" : "rgba(239,68,68,0.07)", border: `1.5px solid ${sel === q.correct ? "rgba(52,211,153,0.25)" : "rgba(239,68,68,0.25)"}`, borderRadius: "12px" }}>
            <div style={{ fontSize: "14px", fontWeight: 800, color: sel === q.correct ? "#34d399" : "#ef4444", marginBottom: "8px", fontFamily: FONT_SANS }}>{sel === q.correct ? "Doğru" : "Yanlış"}</div>
            <p style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: "1.85", margin: 0, fontFamily: FONT_SANS }}>{q.explanation}</p>
          </div>
        )}

        {sel !== null && (
          <button
            onClick={next}
            style={{ padding: "12px 34px", background: `linear-gradient(90deg, #0f766e, ${COLOR_PRIMARY})`, border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: 800, cursor: "pointer", fontFamily: FONT_SANS }}
          >
            {qIdx >= QUIZ_ITEMS.length - 1 ? "Sonuçları Gör" : "Sonraki Soru"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function DistributionMethodsActivity({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("learn");

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "learn", label: "ÖĞREN", icon: "📘" },
    { id: "activity", label: "ETKİNLİK 1", icon: "🧩" },
    { id: "map_reading", label: "ETKİNLİK 2", icon: "🗺️" },
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
        background: BG_DARK,
        fontFamily: FONT_SANS,
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
            <div style={{ fontSize: "10px", letterSpacing: "4px", color: COLOR_PRIMARY, opacity: 0.75, fontFamily: FONT_MONO }}>HARİTA OKURYAZARLIĞI</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#f8fafc" }}>Konu Anlatımı, Etkinlik ve Test</div>
          </div>

          <div style={{ display: "flex", gap: "4px", padding: "4px", borderRadius: "12px", background: "rgba(15,23,42,0.78)" }}>
            {tabs.map((item) => (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); sndClick(); }}
                style={{
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "10px",
                  padding: "9px 14px",
                  background: tab === item.id ? COLOR_PRIMARY : "transparent",
                  color: tab === item.id ? "#052e16" : "#cbd5e1",
                  fontWeight: 800,
                  fontSize: "12px",
                  fontFamily: FONT_SANS,
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
            fontFamily: FONT_SANS,
          }}
        >
          X KAPAT
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        {tab === "learn" && <LearnPanel />}
        {tab === "activity" && <ActivityPanel />}
        {tab === "map_reading" && <MapReadingActivity />}
        {tab === "test" && <TestPanel />}
      </div>
    </div>
  );
}
