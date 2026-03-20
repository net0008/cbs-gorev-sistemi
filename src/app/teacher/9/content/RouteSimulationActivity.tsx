'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Navigation, Target, Send, ShieldAlert, Crosshair, RefreshCcw, CheckCircle2, Flag } from 'lucide-react';

interface RouteSimulationActivityProps {
  onClose: () => void;
}

// 🛑 KOORDİNAT VERİ TABANI (Re-Calibrated Coordinates for Map - Percentage 1340x1080)
const boylamX: Record<string, number> = {
  '10W': 10.90, '0': 17.24, '10E': 23.58, '20E': 29.70, '30E': 35.82, 
  '40E': 42.24, '50E': 48.28, '60E': 54.55, '70E': 60.97, '80E': 67.01, 
  '90E': 73.51, '100E': 79.48, '110E': 85.60, '120E': 91.94 
};

const enlemY: Record<string, number> = {
  '50N': 8.61, '40N': 20.56, '30N': 30.93, '20N': 40.46, '10N': 49.44, 
  '0': 58.24, '10S': 67.04, '20S': 75.83, '30S': 85.56, '40S': 95.93 
};

// 🚁 ÖZEL DRONE BİLEŞENİ (Pervaneleri Dönen SVG)
const DroneSVG = () => (
  <div className="relative w-12 h-12 flex items-center justify-center filter drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
    {/* Pervane 1 (Sol Üst) */}
    <motion.div className="absolute top-0 left-0 w-5 h-5 rounded-full border border-white/30 bg-slate-400/20 backdrop-blur-sm flex items-center justify-center" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.15, ease: "linear" }}>
      <div className="w-4 h-0.5 bg-[#ef4444] rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>
    </motion.div>
    {/* Pervane 2 (Sağ Üst) */}
    <motion.div className="absolute top-0 right-0 w-5 h-5 rounded-full border border-white/30 bg-slate-400/20 backdrop-blur-sm flex items-center justify-center" animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 0.15, ease: "linear" }}>
      <div className="w-4 h-0.5 bg-[#ef4444] rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>
    </motion.div>
    {/* Pervane 3 (Sol Alt) */}
    <motion.div className="absolute bottom-0 left-0 w-5 h-5 rounded-full border border-white/30 bg-slate-400/20 backdrop-blur-sm flex items-center justify-center" animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 0.15, ease: "linear" }}>
      <div className="w-4 h-0.5 bg-[#ef4444] rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>
    </motion.div>
    {/* Pervane 4 (Sağ Alt) */}
    <motion.div className="absolute bottom-0 right-0 w-5 h-5 rounded-full border border-white/30 bg-slate-400/20 backdrop-blur-sm flex items-center justify-center" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.15, ease: "linear" }}>
      <div className="w-4 h-0.5 bg-[#ef4444] rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>
    </motion.div>
    
    {/* Drone Gövde (0 Derecesi sağa - Doğuya bakar) */}
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="z-10">
      {/* Kollar */}
      <path d="M4 4L20 20M4 20L20 4" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Ana Gövde */}
      <circle cx="12" cy="12" r="5" fill="#1e293b" stroke="#38bdf8" strokeWidth="2"/>
      {/* Burun (Ön taraf - Sağ) */}
      <path d="M17 12L21 15L21 9L17 12Z" fill="#ef4444" />
    </svg>
  </div>
);

export default function RouteSimulationActivity({ onClose }: RouteSimulationActivityProps) {
  // Oyun State'leri
  const [round, setRound] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [targetCoord, setTargetCoord] = useState<{ enlem: string, boylam: string }>({ enlem: '0', boylam: '0' });
  const [missionStatus, setMissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Kullanıcı Seçimleri
  const [selectedEnlem, setSelectedEnlem] = useState<string>('0');
  const [selectedBoylam, setSelectedBoylam] = useState<string>('0');

  // Drone State'leri
  const [prevPos, setPrevPos] = useState({ x: boylamX['0'], y: enlemY['0'] });
  const [dronePos, setDronePos] = useState({ x: boylamX['0'], y: enlemY['0'] });
  const [isAnimating, setIsAnimating] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // 🔊 OYUN SES SİSTEMİ (Web Audio API)
  const getAudioContext = () => {
    if (typeof window === 'undefined') return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const playSound = useCallback((type: 'mission' | 'error' | 'success' | 'gameover') => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    if (type === 'mission') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'success') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554, now + 0.1);
      osc.frequency.setValueAtTime(659, now + 0.2);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'gameover') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 1);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 1);
      osc.start(now);
      osc.stop(now + 1);
    }
  }, []);

  // 🎯 YENİ HEDEF ÜRETME
  const generateRandomTarget = useCallback(() => {
    const enlemKeys = Object.keys(enlemY);
    const boylamKeys = Object.keys(boylamX);
    const rEnlem = enlemKeys[Math.floor(Math.random() * enlemKeys.length)];
    const rBoylam = boylamKeys[Math.floor(Math.random() * boylamKeys.length)];
    setTargetCoord({ enlem: rEnlem, boylam: rBoylam });
    setMissionStatus('idle');
    playSound('mission');
  }, [playSound]);

  // OYUN BAŞLANGICI
  useEffect(() => {
    generateRandomTarget();
  }, [generateRandomTarget]);

  const handleRestart = () => {
    setRound(1);
    setScore(0);
    setGameOver(false);
    setDronePos({ x: boylamX['0'], y: enlemY['0'] });
    setPrevPos({ x: boylamX['0'], y: enlemY['0'] });
    setSelectedEnlem('0');
    setSelectedBoylam('0');
    generateRandomTarget();
  };

  const handleSendDrone = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setMissionStatus('idle');
    setPrevPos(dronePos);
    setDronePos({ x: boylamX[selectedBoylam], y: enlemY[selectedEnlem] });

    setTimeout(() => {
      setIsAnimating(false);
      
      // Doğruluk Kontrolü
      if (selectedEnlem === targetCoord.enlem && selectedBoylam === targetCoord.boylam) {
        setMissionStatus('success');
        setScore(prev => prev + 20);
        playSound('success');
        
        setTimeout(() => {
          if (round >= 5) {
            setGameOver(true);
            playSound('gameover');
          } else {
            setRound(prev => prev + 1);
            generateRandomTarget();
          }
        }, 2000);
      } else {
        setMissionStatus('error');
        setScore(prev => Math.max(0, prev - 5)); // Puan 0'ın altına düşmesin
        playSound('error');
      }
    }, 1500);
  };

  const getDroneRotation = () => {
    if (dronePos.x === prevPos.x && dronePos.y === prevPos.y) return 0;
    const dx = dronePos.x - prevPos.x;
    const dy = dronePos.y - prevPos.y;
    // DroneSVG default olarak sağa bakar (0 derece)
    return Math.atan2(dy, dx) * (180 / Math.PI); 
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
        <div className="text-white flex items-center gap-6">
          <div>
            <h2 className="font-extrabold text-xl text-blue-400 leading-tight">Dinamik Rota Simülasyonu</h2>
            <span className="text-xs text-slate-400 uppercase font-black tracking-widest block mt-1">Görevleri Tamamla</span>
          </div>
          <div className="h-8 w-px bg-slate-700 hidden md:block"></div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs text-slate-400 uppercase font-bold">Skor Board</span>
            <div className="flex items-center gap-4 text-sm font-black">
              <span className="text-emerald-400">Puan: {score}/100</span>
              <span className="text-amber-400">Tur: {round}/5</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white px-6 py-1.5 rounded-full font-bold text-sm transition-all active:scale-95">
          KAPAT
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center p-4 bg-[#050505] overflow-hidden">
        {/* Harita Alanı */}
        <div 
          className={`relative w-full h-full shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden border-4 bg-[#0a0a0a] rounded-xl flex-shrink-0 transition-colors duration-500 ${missionStatus === 'success' ? 'border-emerald-500/50' : missionStatus === 'error' ? 'border-red-500/50' : 'border-white/5'}`}
          style={{
             maxWidth: 'min(100%, calc(100vh * 1340 / 1080))',
             maxHeight: 'min(100%, calc(100vw * 1080 / 1340))',
             aspectRatio: '1340 / 1080'
          }}
        >
          <Image 
            src="/9/harita/koordinat-01.svg" 
            alt="Koordinat Haritası" 
            fill 
            priority 
            className="object-contain pointer-events-none opacity-90" 
          />
          
          {/* Animasyon Katmanı */}
          
          {/* Gidiş Yolu (Path) Çizgisi */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
            <motion.line
              x1={`${prevPos.x}%`} y1={`${prevPos.y}%`}
              x2={`${dronePos.x}%`} y2={`${dronePos.y}%`}
              stroke={missionStatus === 'error' ? "#ef4444" : "#3b82f6"} strokeWidth="3" strokeDasharray="10 10" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={isAnimating || missionStatus !== 'idle' ? { pathLength: 1, opacity: 0.6 } : { pathLength: 0, opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </svg>

          {/* Radar Hedef ve Bayrak (Target) */}
          {!gameOver && targetCoord && (
            <div 
              className="absolute z-20 pointer-events-none"
              style={{ left: `${boylamX[targetCoord.boylam]}%`, top: `${enlemY[targetCoord.enlem]}%` }}
            >
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-red-500 bg-red-500/20"
                style={{ width: 60, height: 60 }}
              />
              <div className="absolute -translate-x-[20%] -translate-y-[90%] drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
                <Flag size={36} className="text-red-500 fill-red-500" />
              </div>
            </div>
          )}

          {/* Drone İkonu */}
          <motion.div
            initial={false}
            animate={{ left: `${dronePos.x}%`, top: `${dronePos.y}%` }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{ rotate: getDroneRotation() }}
              transition={{ duration: 0.6, type: "spring" }} 
            >
              <DroneSVG />
            </motion.div>
            
            {/* Durum Bilgisi Overlay */}
            {missionStatus !== 'idle' && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className={`absolute top-16 backdrop-blur-md text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-2xl whitespace-nowrap border ${missionStatus === 'success' ? 'bg-emerald-600/90 border-emerald-400' : 'bg-red-600/90 border-red-400'}`}
               >
                 {missionStatus === 'success' ? '+20 Puan! Doğru İniş.' : '-5 Puan! Yanlış Hedef, Haritayı Tekrar İncele.'}
               </motion.div>
            )}
          </motion.div>

        </div>

        {/* Görev Kontrol Paneli */}
        <div className="absolute bottom-6 right-6 lg:bottom-10 lg:right-10 z-40 w-[320px] bg-slate-900/95 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col gap-4">
          <h3 className="text-blue-400 font-bold mb-5 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Target size={18} /> Drone Kontrol Merkezi
          </h3>
          
          <div className="space-y-4">
            {/* Enlem Seçimi */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Enlem (Latitude)</label>
              <select
                value={selectedEnlem}
                onChange={(e) => setSelectedEnlem(e.target.value)}
                disabled={isAnimating}
                className="bg-[#0f172a] border border-slate-700 text-white rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 appearance-none font-medium cursor-pointer"
              >
                {Object.keys(enlemY).map((key) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>

            {/* Boylam Seçimi */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Boylam (Longitude)</label>
              <select
                value={selectedBoylam}
                onChange={(e) => setSelectedBoylam(e.target.value)}
                disabled={isAnimating}
                className="bg-[#0f172a] border border-slate-700 text-white rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 appearance-none font-medium cursor-pointer"
              >
                {Object.keys(boylamX).map((key) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>

            {/* Gönder Butonu */}
            <button
              onClick={handleSendDrone}
              disabled={isAnimating}
              className={`w-full mt-2 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 border ${isAnimating ? 'bg-slate-700 border-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40 border-blue-500/50'}`}
            >
              {isAnimating ? (
                <span className="flex items-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <RefreshCcw size={18} />
                  </motion.div>
                  Seyir Halinde...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send size={18} />
                  Gönder
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Game Over Modal */}
        {gameOver && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 border border-slate-700 p-10 rounded-3xl text-center max-w-sm w-full shadow-2xl flex flex-col items-center"
            >
              <CheckCircle2 size={64} className="text-emerald-500 mb-6" />
              <h2 className="text-3xl font-extrabold text-white mb-2">Görev Tamamlandı!</h2>
              <p className="text-slate-400 mb-8 font-medium">Toplam 5 turu tamamladınız.</p>
              
              <div className="text-6xl font-black text-amber-400 mb-8 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]">
                {score} <span className="text-lg text-slate-500 uppercase tracking-widest block mt-2">Toplam Puan</span>
              </div>

              <button onClick={handleRestart} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 text-lg">
                Yeniden Oyna
              </button>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}