"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import Image from "next/image";

// ------------------------------
// 1. TİPLER VE SABİTLER
// ------------------------------

// Koordinat listeleri (harita üzerindeki etiketlere göre)
const ENLEM_DEGERLERI = [60, 30, 0, -30, -60] as const;
type EnlemTipi = typeof ENLEM_DEGERLERI[number];

const BOYLAM_DEGERLERI = [-120, -90, -60, -30, 0, 30, 60, 90, 120] as const;
type BoylamTipi = typeof BOYLAM_DEGERLERI[number];

// Görev yapısı: her görevde bir enlem ve bir boylam (hedef koordinat)
type Gorev = {
  enlem: EnlemTipi;
  boylam: BoylamTipi;
};

// SVG konumlandırma sabitleri (harita 841x595, koordinatlar -180..180 ve -90..90 aralığında)
const HARITA_GENISLIK = 841;
const HARITA_YUKSEKLIK = 595;
const MIN_BOYLAM = -180;
const MAX_BOYLAM = 180;
const MIN_ENLEM = -90;
const MAX_ENLEM = 90;

// Koordinatları SVG pixel koordinatlarına çeviren fonksiyon
const koordinatToPixel = (boylam: number, enlem: number): { x: number; y: number } => {
  const x = ((boylam - MIN_BOYLAM) / (MAX_BOYLAM - MIN_BOYLAM)) * HARITA_GENISLIK;
  const y = HARITA_YUKSEKLIK - ((enlem - MIN_ENLEM) / (MAX_ENLEM - MIN_ENLEM)) * HARITA_YUKSEKLIK;
  return { x, y };
};

// Başlangıç noktası (0,0) - harita merkezi
const BASLANGIC_NOKTASI = koordinatToPixel(0, 0);

// ------------------------------
// 2. SES YÖNETİCİSİ (Web Audio API)
// ------------------------------
const useAudioEffects = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  }, []);

  const playBeep = useCallback(() => {
    initAudio();
    const ctx = audioCtxRef.current!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc.start();
    osc.stop(now + 0.5);
  }, [initAudio]);

  const playError = useCallback(() => {
    initAudio();
    const ctx = audioCtxRef.current!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    osc.start();
    osc.stop(now + 0.8);
  }, [initAudio]);

  const playSuccessMelody = useCallback(() => {
    initAudio();
    const ctx = audioCtxRef.current!;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, now + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.2 + 0.5);
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.5);
    });
  }, [initAudio]);

  return { playBeep, playError, playSuccessMelody };
};

// ------------------------------
// 3. DRONE BİLEŞENİ (Framer Motion ile dönen pervaneler)
// ------------------------------
const Drone = ({ x, y, angle }: { x: number; y: number; angle: number }) => {
  return (
    <motion.div
      className="absolute z-20"
      style={{
        left: x - 20,
        top: y - 20,
        width: 40,
        height: 40,
        transform: `rotate(${angle}rad)`,
      }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Gövde */}
        <circle cx="50" cy="50" r="20" fill="#2c3e66" stroke="#60a5fa" strokeWidth="2" />
        {/* Pervaneler (4 adet, kırmızı, dönen) */}
        {[[20, 20], [80, 20], [20, 80], [80, 80]].map(([cx, cy], idx) => (
          <motion.g
            key={idx}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            style={{ originX: cx, originY: cy }}
          >
            <line x1={cx - 12} y1={cy} x2={cx + 12} y2={cy} stroke="#ef4444" strokeWidth="3" />
            <line x1={cx} y1={cy - 12} x2={cx} y2={cy + 12} stroke="#ef4444" strokeWidth="3" />
          </motion.g>
        ))}
        {/* Kamera gözü */}
        <circle cx="50" cy="50" r="6" fill="#facc15" />
      </svg>
    </motion.div>
  );
};

// ------------------------------
// 4. HEDEF BAYRAK BİLEŞENİ (pulse efekti)
// ------------------------------
const HedefBayrak = ({ x, y }: { x: number; y: number }) => {
  return (
    <div className="absolute z-10" style={{ left: x - 12, top: y - 30 }}>
      {/* Radar halkaları (pulse) */}
      <motion.div
        className="absolute rounded-full border-2 border-red-500 opacity-70"
        style={{ width: 30, height: 30, left: -3, top: -3 }}
        animate={{ scale: [1, 1.5, 2], opacity: [0.7, 0.3, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
      />
      <motion.div
        className="absolute rounded-full border-2 border-red-500 opacity-70"
        style={{ width: 20, height: 20, left: 2, top: 2 }}
        animate={{ scale: [1, 1.8, 2.5], opacity: [0.7, 0.3, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0.3, ease: "easeOut" }}
      />
      {/* Bayrak SVG */}
      <svg width="30" height="40" viewBox="0 0 30 40" fill="none">
        <rect x="5" y="5" width="20" height="25" fill="#ef4444" />
        <path d="M5 5 L25 17.5 L5 30 Z" fill="#b91c1c" />
        <rect x="13" y="30" width="4" height="10" fill="#6b7280" />
      </svg>
    </div>
  );
};

// ------------------------------
// 5. ANA BİLEŞEN: RouteSimulationActivity
// ------------------------------
export default function RouteSimulationActivity() {
  // Oyun durumu
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [aktifGorevIndex, setAktifGorevIndex] = useState(0);
  const [puan, setPuan] = useState(0);
  const [oyunBitti, setOyunBitti] = useState(false);
  const [dogruCevapSayisi, setDogruCevapSayisi] = useState(0); // modal için
  const [yanlisCevapSayisi, setYanlisCevapSayisi] = useState(0);

  // UI durumları
  const [selectedEnlem, setSelectedEnlem] = useState<EnlemTipi | "">("");
  const [selectedBoylam, setSelectedBoylam] = useState<BoylamTipi | "">("");
  const [mesaj, setMesaj] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [dronePos, setDronePos] = useState(BASLANGIC_NOKTASI);
  const [isMoving, setIsMoving] = useState(false);
  const [rotaYolu, setRotaYolu] = useState<{ d: string; key: number }[]>([]);

  // Ses efektleri
  const { playBeep, playError, playSuccessMelody } = useAudioEffects();

  // Referanslar
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<any>(null);

  // Rastgele görevler oluştur (toplam 5)
  const rastgeleGorevlerOlustur = useCallback((): Gorev[] => {
    const yeniGorevler: Gorev[] = [];
    for (let i = 0; i < 5; i++) {
      const rastEnlem = ENLEM_DEGERLERI[Math.floor(Math.random() * ENLEM_DEGERLERI.length)];
      const rastBoylam = BOYLAM_DEGERLERI[Math.floor(Math.random() * BOYLAM_DEGERLERI.length)];
      yeniGorevler.push({ enlem: rastEnlem, boylam: rastBoylam });
    }
    return yeniGorevler;
  }, []);

  // Oyunu başlat / sıfırla
  const oyunuBaslat = useCallback(() => {
    const yeniGorevler = rastgeleGorevlerOlustur();
    setGorevler(yeniGorevler);
    setAktifGorevIndex(0);
    setPuan(0);
    setOyunBitti(false);
    setDogruCevapSayisi(0);
    setYanlisCevapSayisi(0);
    setDronePos(BASLANGIC_NOKTASI);
    setIsMoving(false);
    setRotaYolu([]);
    setSelectedEnlem("");
    setSelectedBoylam("");
    setMesaj(null);
  }, [rastgeleGorevlerOlustur]);

  // Hedef koordinata drone uçuşu ve rota çizimi
  const droneHareketEt = useCallback((hedefX: number, hedefY: number) => {
    if (isMoving) return;
    setIsMoving(true);

    // Rota çizgisi için path oluştur
    const start = dronePos;
    const end = { x: hedefX, y: hedefY };
    const pathD = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
    const yeniRota = { d: pathD, key: Date.now() };
    setRotaYolu((prev) => [...prev, yeniRota]);

    // Hareket animasyonu (x, y interpolasyon)
    const xMotion = useMotionValue(start.x);
    const yMotion = useMotionValue(start.y);

    const controlsX = animate(xMotion, end.x, { duration: 1.2, ease: "easeInOut" });
    const controlsY = animate(yMotion, end.y, { duration: 1.2, ease: "easeInOut" });

    const unsubscribeX = xMotion.on("change", (latestX) => {
      const latestY = yMotion.get();
      setDronePos({ x: latestX, y: latestY });
    });

    Promise.all([controlsX, controlsY]).then(() => {
      unsubscribeX();
      setIsMoving(false);
    });
  }, [dronePos, isMoving]);

  // Gönder butonu işleyicisi
  const gonderTahmin = useCallback(() => {
    if (oyunBitti || isMoving) return;
    if (!selectedEnlem || !selectedBoylam) {
      setMesaj({ text: "Lütfen bir enlem ve boylam seçin!", type: "info" });
      return;
    }

    const mevcutGorev = gorevler[aktifGorevIndex];
    if (!mevcutGorev) return;

    const dogruMu = selectedEnlem === mevcutGorev.enlem && selectedBoylam === mevcutGorev.boylam;

    if (dogruMu) {
      // Doğru tahmin
      const yeniPuan = puan + 20;
      setPuan(yeniPuan);
      setDogruCevapSayisi((prev) => prev + 1);
      setMesaj({ text: "✅ Doğru! +20 puan", type: "success" });
      playSuccessMelody();

      // Hedef koordinatın pixel karşılığı
      const hedefPixel = koordinatToPixel(mevcutGorev.boylam, mevcutGorev.enlem);
      droneHareketEt(hedefPixel.x, hedefPixel.y);

      // Sonraki göreve geç veya oyunu bitir
      if (aktifGorevIndex + 1 < gorevler.length) {
        setTimeout(() => {
          setAktifGorevIndex((prev) => prev + 1);
          setSelectedEnlem("");
          setSelectedBoylam("");
          setMesaj(null);
          // Yeni görev için hedef bayrak otomatik olarak render olacak
        }, 1500);
      } else {
        // Oyun bitti
        setTimeout(() => {
          setOyunBitti(true);
          setMesaj(null);
        }, 1500);
      }
    } else {
      // Yanlış tahmin
      const yeniPuan = puan - 5;
      setPuan(yeniPuan);
      setYanlisCevapSayisi((prev) => prev + 1);
      setMesaj({ text: "❌ Yanlış! -5 puan", type: "error" });
      playError();
      // Yanlışta drone hareket etmez, sadece ceza puanı
    }
  }, [selectedEnlem, selectedBoylam, gorevler, aktifGorevIndex, puan, oyunBitti, isMoving, playSuccessMelody, playError, droneHareketEt]);

  // Yeni görev geldiğinde yeni hedef için bip sesi (hedef çıktığında)
  useEffect(() => {
    if (gorevler.length > 0 && aktifGorevIndex < gorevler.length && !oyunBitti) {
      playBeep();
    }
  }, [aktifGorevIndex, gorevler, oyunBitti, playBeep]);

  // İlk yüklemede oyunu başlat
  useEffect(() => {
    oyunuBaslat();
  }, [oyunuBaslat]);

  // Aktif görevin koordinatları (hedef bayrak konumu)
  const aktifGorev = gorevler[aktifGorevIndex];
  const hedefPixel = aktifGorev ? koordinatToPixel(aktifGorev.boylam, aktifGorev.enlem) : null;

  // Drone açısı (hedefe doğru yön)
  let droneAngle = 0;
  if (hedefPixel && !isMoving) {
    const dx = hedefPixel.x - dronePos.x;
    const dy = hedefPixel.y - dronePos.y;
    droneAngle = Math.atan2(dy, dx);
  }

  return (
    <div className="relative min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Ana oyun kartı */}
      <div className="w-full max-w-6xl bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-2xl p-4 border border-slate-700">
        {/* Skor ve görev bilgisi */}
        <div className="flex justify-between items-center mb-4 px-2">
          <div className="bg-slate-900/80 backdrop-blur rounded-lg px-4 py-2 border border-slate-600">
            <span className="text-slate-300 text-sm">⭐ PUAN</span>
            <span className="text-2xl font-bold text-yellow-400 ml-2">{puan}</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur rounded-lg px-4 py-2 border border-slate-600">
            <span className="text-slate-300 text-sm">🎯 GÖREV</span>
            <span className="text-xl font-bold text-white ml-2">{aktifGorevIndex + 1} / 5</span>
          </div>
        </div>

        {/* Harita konteyneri (841/595 aspect ratio) */}
        <div className="relative w-full aspect-[841/595] bg-slate-900 rounded-xl overflow-hidden border border-slate-600">
          <div className="relative w-full h-full">
            {/* Arkaplan harita SVG */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src="/9/harita/dunya_koordinat.svg"
                alt="Dünya Koordinat Haritası"
                className="w-full h-full object-contain"
              />
            </div>

            {/* SVG katmanı (rota çizgileri, drone, bayrak) */}
            <svg
              ref={svgRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${HARITA_GENISLIK} ${HARITA_YUKSEKLIK}`}
              preserveAspectRatio="none"
            >
              {/* Rota çizgileri (kesik mavi, animasyonlu) */}
              {rotaYolu.map((rota) => (
                <motion.path
                  key={rota.key}
                  d={rota.d}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="8 6"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
              ))}
            </svg>

            {/* Hedef bayrak (sadece aktif görev varsa) */}
            {hedefPixel && (
              <div style={{ position: "absolute", left: hedefPixel.x, top: hedefPixel.y, transform: "translate(-50%, -50%)" }}>
                <HedefBayrak x={0} y={0} />
              </div>
            )}

            {/* Drone */}
            <Drone x={dronePos.x} y={dronePos.y} angle={droneAngle} />
          </div>
        </div>

        {/* Alt panel: Dropdownlar + Gönder butonu + mesaj */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-slate-300 text-sm mb-1">Enlem (Latitude)</label>
            <select
              value={selectedEnlem}
              onChange={(e) => setSelectedEnlem(e.target.value as EnlemTipi)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              disabled={oyunBitti || isMoving}
            >
              <option value="">Seçiniz</option>
              {ENLEM_DEGERLERI.map((enlem) => (
                <option key={enlem} value={enlem}>{enlem}°</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-1">Boylam (Longitude)</label>
            <select
              value={selectedBoylam}
              onChange={(e) => setSelectedBoylam(Number(e.target.value) as BoylamTipi)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              disabled={oyunBitti || isMoving}
            >
              <option value="">Seçiniz</option>
              {BOYLAM_DEGERLERI.map((boylam) => (
                <option key={boylam} value={boylam}>{boylam}°</option>
              ))}
            </select>
          </div>
          <button
            onClick={gonderTahmin}
            disabled={oyunBitti || isMoving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg"
          >
            🚀 GÖNDER
          </button>
        </div>
        {mesaj && (
          <div className={`mt-3 text-center font-medium ${
            mesaj.type === "success" ? "text-green-400" : mesaj.type === "error" ? "text-red-400" : "text-yellow-400"
          }`}>
            {mesaj.text}
          </div>
        )}
      </div>

      {/* Oyun Bitti Modal */}
      <AnimatePresence>
        {oyunBitti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              className="bg-slate-800 border border-slate-600 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            >
              <h2 className="text-3xl font-bold text-center text-white mb-4">🎉 Oyun Bitti 🎉</h2>
              <div className="space-y-2 text-center text-slate-300">
                <p>Toplam Puan: <span className="text-yellow-400 font-bold text-xl">{puan}</span></p>
                <p>✅ Doğru Tahmin: {dogruCevapSayisi}</p>
                <p>❌ Yanlış Tahmin: {yanlisCevapSayisi}</p>
              </div>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={oyunuBaslat}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  🔄 Tekrar Oyna
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}