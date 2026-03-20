'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Navigation, MapPin, CheckCircle, Target } from 'lucide-react';
import { Navigation, MapPin, CheckCircle, Target, Flag } from 'lucide-react';

interface RouteSimulationActivityProps {
  onClose: () => void;
}

// =========================================================================
// 🛑 EXACT RE-CALIBRATED COORDINATE DATABASE (Percentage based on 1306x1020)
// 🛑 EXACT RE-CALIBRATED COORDINATE DATABASE (Percentage based on 1303x1019.89)
// =========================================================================

const boylamX = {
  '10W': 10.26, '0': 16.77, '10E': 23.28, '20E': 29.56, '30E': 35.83,
  '40E': 42.42, '50E': 48.62, '60E': 55.05, '70E': 61.64, '80E': 67.84,
  '90E': 74.50, '100E': 80.63, '110E': 86.91, '120E': 93.42
  '10W': 10.28, '0': 16.81, '10E': 23.33, '20E': 29.62, '30E': 35.92,
  '40E': 42.52, '50E': 48.73, '60E': 55.18, '70E': 61.78, '80E': 68.00,
  '90E': 74.67, '100E': 80.81, '110E': 87.11, '120E': 93.63
};

const enlemY = {
  '50N': 5.61, '40N': 18.26, '30N': 29.23, '20N': 39.33, '10N': 48.84,
  '0': 58.15, '10S': 67.46, '20S': 76.78, '30S': 87.07, '40S': 98.05
  '50N': 5.61, '40N': 18.26, '30N': 29.24, '20N': 39.34, '10N': 48.85,
  '0': 58.17, '10S': 67.48, '20S': 76.80, '30S': 87.09, '40S': 98.07
};

// Puanlama ve Tur Sayısı
const TOTAL_ROUNDS = 5;
const SUCCESS_POINTS = 20;

export default function RouteSimulationActivity({ onClose }: RouteSimulationActivityProps) {
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [gameState, setGameState] = useState<'playing' | 'checking' | 'next_round' | 'finished'>('playing');
  
  // Kombinasyon havuzunu sabitleyelim
  const allCoordinates = useMemo(() => {
    const coords: { enlem: string; boylam: string }[] = [];
    Object.keys(enlemY).forEach(enlem => {
      Object.keys(boylamX).forEach(boylam => {
        coords.push({ enlem, boylam });
      });
    });
    return coords;
  }, []);

  // Rastgele Hedef Belirleme
  const getRandomTarget = useCallback(() => {
    return allCoordinates[Math.floor(Math.random() * allCoordinates.length)];
  }, [allCoordinates]);

  // Mevcut Hedef ve Tahmin State'leri
  const [currentTarget, setCurrentTarget] = useState(getRandomTarget());
  const [guessedEnlem, setGuessedEnlem] = useState('0');
  const [guessedBoylam, setGuessedBoylam] = useState('0');
  const [prevDronePos, setPrevDronePos] = useState({ x: boylamX['0'], y: enlemY['0'] });

  const [lastCheck, setLastCheck] = useState<'correct' | 'wrong' | null>(null);

  // Ses Üretici
  const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (typeof window === 'undefined') return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  // 🚀 DRONE'U GÖNDER & KONTROL ET
  const handleSendDrone = () => {
    if (gameState !== 'playing') return;

    setGameState('checking');
    
    // Ses
    playSound(440, 0.2, 'square'); // Telsiz/Başlangıç Sesi

    const isCorrect = guessedEnlem === currentTarget.enlem && guessedBoylam === currentTarget.boylam;
    setLastCheck(isCorrect ? 'correct' : 'wrong');

    // Drone'un mevcut pozisyonunu al (animasyon için)
    const currentX = boylamX[guessedBoylam];
    const currentY = enlemY[guessedEnlem];

    setPrevDronePos({ x: currentX, y: currentY });

    if (isCorrect) {
      setScore(prev => prev + SUCCESS_POINTS);
      setGameState('next_round');
      setTimeout(() => playSound(880, 0.4, 'sine'), 1500); // Başarı Ses (Gecikmeli)

      // 2 Saniye sonra yeni tura geç
      setTimeout(() => {
        if (currentRound < TOTAL_ROUNDS) {
          setCurrentTarget(getRandomTarget());
          setCurrentRound(prev => prev + 1);
          setGameState('playing');
          setLastCheck(null);
        } else {
          setGameState('finished');
        }
      }, 3500);

    } else {
      setTimeout(() => playSound(150, 0.5, 'sawtooth'), 500); // Hata Sesi
      // Hata durumunda 2 saniye sonra tekrar oynamaya izin ver
      setTimeout(() => {
        setGameState('playing');
        setLastCheck(null);
      }, 2000);
    }
  };

  const resetGame = () => {
    setScore(0);
    setCurrentRound(1);
    setCurrentTarget(getRandomTarget());
    setGuessedEnlem('0');
    setGuessedBoylam('0');
    setPrevDronePos({ x: boylamX['0'], y: enlemY['0'] });
    setGameState('playing');
    setLastCheck(null);
  };

  // Dönüş Açısını Hesapla
  const getDroneRotation = () => {
    const dx = boylamX[guessedBoylam] - prevDronePos.x;
    const dy = enlemY[guessedEnlem] - prevDronePos.y;
    if (dx === 0 && dy === 0) return 45; // Hareket yoksa
    return Math.atan2(dy, dx) * (180 / Math.PI) + 45;
  };

  // 🚫 ZOOM VE KAYDIRMA ENGELLEYİCİ
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => { if (e.ctrlKey) e.preventDefault(); };
    const handleTouchMove = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault(); };
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden select-none font-sans">
      
      {/* Header */}
      <div className="p-4 px-6 flex justify-between items-center bg-black/80 border-b border-white/10 flex-shrink-0 z-50">
        <div className="text-white">
          <h2 className="font-extrabold text-xl text-blue-400 leading-tight">Dinamik Rota Simülasyonu</h2>
          <span className="text-xs text-slate-400 uppercase font-black tracking-widest block mt-1">Görevleri Tamamla</span>
          <span className="text-xs text-slate-400 uppercase font-black tracking-widest block mt-1">Görevleri tamamla</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">PUAN</div>
            <div className="text-2xl font-black text-emerald-400">{score}</div>
          </div>
          <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white px-6 py-1.5 rounded-full font-bold text-sm transition-all active:scale-95">KAPAT</button>
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center p-4 bg-[#050505] overflow-hidden">
        {/* Harita Alanı & Konteyner Kilit */}
        <div 
          className="relative w-full h-full shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden border-2 border-white/5 bg-[#0a0a0a] rounded-xl flex-shrink-0 z-10"
          style={{ 
            aspectRatio: '1306 / 1020',
            aspectRatio: '1303 / 1019.89',
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          <Image 
            src="/9/harita/koordinat-01.svg" 
            alt="Koordinat Haritası" 
            fill 
            priority 
            className="object-cover pointer-events-none opacity-90"
            className="object-fill w-full h-full pointer-events-none opacity-90"
          />
          
          {/* Animasyon Katmanı */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
            {/* Gidiş Yolu (Dashed Path) */}
            <motion.line
              x1={`${prevDronePos.x}%`} y1={`${prevDronePos.y}%`}
              x2={`${boylamX[guessedBoylam]}%`} y2={`${enlemY[guessedEnlem]}%`}
              stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="8 8" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={gameState !== 'playing' ? { pathLength: 1, opacity: 0.6 } : { pathLength: 0, opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </svg>

          {/* 🏁 Hedef Bayrağı & Radar Pulse (GİZLİ HEDEF) */}
          <motion.div 
            initial={false}
            animate={{ left: `${boylamX[currentTarget.boylam]}%`, top: `${enlemY[currentTarget.enlem]}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center"
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center justify-center"
          >
            {/* Bayrak Direği */}
            <div className="w-1 h-10 bg-white/70 rounded-full" />
            {/* Kırmızı Bayrak */}
            <div className="absolute top-0 left-0 w-8 h-6 bg-red-600 rounded-r-md rounded-bl-sm shadow-xl" />
            {/* SVG Kırmızı Bayrak */}
            <div className="absolute -translate-x-[20%] -translate-y-[80%] drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] z-20">
              <Flag size={36} className="text-[#ef4444] fill-[#ef4444]" />
            </div>
            
            {/* Radar Pulse Effect */}
            <motion.div 
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              className="absolute w-8 h-8 rounded-full border-2 border-red-500 z-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              className="absolute w-10 h-10 rounded-full border-2 border-red-500 bg-red-500/20 z-0"
            />
          </motion.div>

          {/* 🛸 Drone İkonu (KIRMIZI PERVANELİ) */}
          <motion.div
            initial={false}
            animate={{ left: `${boylamX[guessedBoylam]}%`, top: `${enlemY[guessedEnlem]}%` }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center pointer-events-none"
          >
            {/* Drone Gövdesi & Navigation Aracı */}
            <div className="relative flex items-center justify-center bg-red-600/20 rounded-full p-2 border border-red-500/30 backdrop-blur-sm shadow-2xl">
              <motion.div animate={{ rotate: getDroneRotation() }} transition={{ duration: 0.5 }}>
                <Navigation size={28} className="text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
              </motion.div>
              
              {/* Pervaneler (Animate Rotating Circles) */}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.3, ease: "linear" }}
                  className="absolute w-3 h-3 border-2 border-red-600 rounded-full"
                  animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                  transition={{ repeat: Infinity, duration: 0.15, ease: "linear" }}
                  className="absolute w-5 h-5 border border-white/20 bg-slate-400/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                  style={{
                    top: i < 2 ? -8 : 'auto', bottom: i >= 2 ? -8 : 'auto',
                    left: i % 2 === 0 ? -8 : 'auto', right: i % 2 !== 0 ? -8 : 'auto',
                    top: i < 2 ? -10 : 'auto', bottom: i >= 2 ? -10 : 'auto',
                    left: i % 2 === 0 ? -10 : 'auto', right: i % 2 !== 0 ? -10 : 'auto',
                  }}
                />
                >
                  <div className="w-4 h-0.5 bg-[#ef4444] rounded-full shadow-[0_0_8px_rgba(239,68,68,0.9)]"></div>
                </motion.div>
              ))}
            </div>
            
            {/* Durum Bildirimi Overlay */}
            {gameState === 'next_round' && lastCheck === 'correct' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-12 bg-green-600/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-xl whitespace-nowrap border border-green-400/50">Hedefe Varıldı!</motion.div>
            )}
            {gameState === 'playing' && lastCheck === 'wrong' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-12 bg-red-700/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-xl whitespace-nowrap border border-red-400/50">Hatalı Koordinat, Tekrar İncele!</motion.div>
            )}
          </motion.div>
        </div>

        {/* 🎮 Kontrol Merkezi & Görev Paneli */}
        <div className="absolute bottom-6 right-6 lg:bottom-10 lg:right-10 z-30 w-[320px] bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-3">
            <h3 className="text-blue-400 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
              <Target size={18} /> GÖREV PANELİ
            </h3>
            <div className="text-[11px] text-slate-400 font-medium">Tur: <span className="text-white font-black">{currentRound}/{TOTAL_ROUNDS}</span></div>
          </div>
          
          <div className="space-y-4">
            {/* Enlem Seçimi */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Enlem (Latitude)</label>
              <select
                value={guessedEnlem}
                onChange={(e) => setGuessedEnlem(e.target.value)}
                disabled={gameState !== 'playing'}
                className="bg-[#0f172a] border border-slate-700 text-white rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 appearance-none font-medium cursor-pointer"
              >
                {Object.keys(enlemY).map(key => <option key={key} value={key}>{key}</option>)}
              </select>
            </div>
            {/* Boylam Seçimi */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Boylam (Longitude)</label>
              <select
                value={guessedBoylam}
                onChange={(e) => setGuessedBoylam(e.target.value)}
                disabled={gameState !== 'playing'}
                className="bg-[#0f172a] border border-slate-700 text-white rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 appearance-none font-medium cursor-pointer"
              >
                {Object.keys(boylamX).map(key => <option key={key} value={key}>{key}</option>)}
              </select>
            </div>
            {/* Gönder Butonu */}
            <button
              onClick={handleSendDrone}
              disabled={gameState !== 'playing'}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/40 active:scale-95 border border-blue-500/50"
            >
              {gameState === 'checking' ? 'Menzil Hesaplanıyor...' : gameState === 'next_round' ? 'İniş Başarılı!' : 'Dronu Gönder'}
            </button>
          </div>
        </div>

        {/* 🏆 Oyun Sonu Ekranı */}
        <AnimatePresence>
          {gameState === 'finished' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center p-10 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1, transition: { type: 'spring', delay: 0.2 } }} className="flex flex-col items-center">
                <CheckCircle size={80} className="text-emerald-500 mb-6" />
                <h2 className="text-5xl font-black text-white mb-2">Görevler Tamamlandı!</h2>
                <p className="text-slate-400 text-lg mb-10 max-w-lg">Bergama Hava Kontrol Merkezi adına tebrik ederiz. Tüm coğrafi hedefleri başarıyla keşfettiniz.</p>
                <div className="flex items-end gap-1 mb-14">
                  <span className="text-xs text-slate-500 font-black uppercase tracking-widest pb-1">TOPLAM PUAN</span>
                  <span className="text-8xl font-black text-emerald-400 leading-none">{score}<span className="text-4xl text-emerald-700">/100</span></span>
                </div>
                <button onClick={resetGame} className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-full font-extrabold text-lg transition-all active:scale-95 shadow-xl shadow-emerald-950">Yeniden Başla</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}