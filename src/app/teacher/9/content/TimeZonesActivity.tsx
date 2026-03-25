'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Globe, MapPin, ArrowRightLeft, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const cities = [
  { name: "Quebec (Kanada)", zone: -5, info: "Batı boylamlarında saat geri kalır." },
  { name: "Buenos Aires (Arjantin)", zone: -3, info: "Güney Amerika'nın doğu kıyısı." },
  { name: "Reykjavik (İzlanda)", zone: 0, info: "Başlangıç meridyeni üzerinde." },
  { name: "İstanbul (Türkiye)", zone: 3, info: "Türkiye +3. saat dilimini (Iğdır) ortak saat olarak kullanır." },
  { name: "St. Petersburg (Rusya)", zone: 3, info: "Türkiye ile aynı saat diliminde yer alır." },
  { name: "Tokyo (Japonya)", zone: 9, info: "Güneşin en erken doğduğu yerlerden biri." }
];

export default function TimeZonesActivity({ onClose }: Props) {
  const [trTime, setTrTime] = useState(12); // Türkiye saati başlangıç 12:00
  const [selectedCity, setSelectedCity] = useState(cities[0]);
  const [userGuess, setUserGuess] = useState("");
  const [result, setResult] = useState<{ status: 'correct' | 'wrong' | null, msg: string }>({ status: null, msg: "" });

  const calculateCorrectTime = (targetZone: number) => {
    // Türkiye +3'te. Aradaki fark: targetZone - 3
    let time = trTime + (targetZone - 3);
    if (time < 0) time += 24;
    if (time >= 24) time -= 24;
    return time;
  };

  const checkAnswer = () => {
    const correct = calculateCorrectTime(selectedCity.zone);
    if (parseInt(userGuess) === correct) {
      setResult({ status: 'correct', msg: `Tebrikler! ${selectedCity.name} şehrinde saat gerçekten ${correct}:00` });
      playTone(660, 0.2);
    } else {
      setResult({ status: 'wrong', msg: `Maalesef hatalı. Doğru cevap ${correct}:00 olmalıydı. Her meridyen arası 4 dakikadır, her 15 meridyen 1 saat eder.` });
      playTone(220, 0.3);
    }
  };

  const playTone = (freq: number, dur: number) => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.start(); osc.stop(ctx.currentTime + dur);
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden font-sans">
      {/* Navbar */}
      <div className="p-4 px-6 flex justify-between items-center bg-black/60 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Clock className="text-amber-400" size={24} />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">Yerel ve Ulusal Saat Simülasyonu</h2>
            <p className="text-slate-400 text-xs tracking-widest uppercase">Mekansal Bilgi Teknolojileri</p>
          </div>
        </div>
        <button onClick={onClose} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg font-bold text-sm transition-all border border-red-500/20">
          ETKİNLİĞİ BİTİR
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sol Panel: Bilgi ve Hesaplama */}
        <div className="w-1/3 bg-slate-900/50 border-r border-white/5 p-8 overflow-y-auto">
          <div className="space-y-6">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="text-blue-400" size={20} />
                <h3 className="text-white font-bold uppercase text-sm tracking-widest">Güneşin Konumu</h3>
              </div>
              <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                <p className="text-slate-300 text-sm leading-relaxed italic">
                  "Güneş'in ufuk düzlemi üzerinde en yüksek noktaya ulaştığı zaman dilimi öğle vakti (12:00) kabul edilir."
                </p>
              </div>
            </section>

            <section className="bg-slate-800/40 p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-amber-400 font-bold text-sm uppercase">Saat Hesaplama Görevi</h3>
              
              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-bold uppercase">Türkiye (Ortak Saat)</label>
                <div className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-white/10">
                  <span className="text-white font-bold">Iğdır (+3 GMT)</span>
                  <input 
                    type="number" 
                    value={trTime} 
                    onChange={(e) => setTrTime(Number(e.target.value))}
                    className="w-16 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded px-2 py-1 text-center font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-center py-2">
                <ArrowRightLeft className="text-slate-600 rotate-90" />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-500 font-bold uppercase">Hedef Şehir Seçin</label>
                <select 
                  onChange={(e) => {
                    setSelectedCity(cities[parseInt(e.target.value)]);
                    setResult({status: null, msg: ""});
                    setUserGuess("");
                  }}
                  className="w-full bg-slate-800 text-white border border-white/10 rounded-lg p-3 outline-none focus:border-amber-500/50 transition-all"
                >
                  {cities.map((city, i) => (
                    <option key={i} value={i}>{city.name} (GMT {city.zone >= 0 ? `+${city.zone}` : city.zone})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Soru: Türkiye saati <span className="text-amber-400 font-bold">{trTime}:00</span> iken <span className="text-blue-400 font-bold">{selectedCity.name}</span> şehrinde saat kaçtır?
                </p>
                <input 
                  type="number" 
                  placeholder="Saat giriniz (0-23)" 
                  value={userGuess}
                  onChange={(e) => setUserGuess(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white text-lg font-bold placeholder:text-slate-700 focus:border-amber-500/50 outline-none"
                />
                <button 
                  onClick={checkAnswer}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black py-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                >
                  HESAPLA VE KONTROL ET
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* Sağ Alan: Görselleştirme / Harita */}
        <div className="flex-1 bg-[#020617] relative flex flex-col items-center justify-center p-12 overflow-hidden">
          {/* Arka Plan Dünya Haritası Süslemesi */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          </div>

          <div className="relative w-full max-w-5xl aspect-video bg-slate-900/80 rounded-3xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-sm">
             {/* Meridyen Çizgileri Simülasyonu */}
             <div className="absolute inset-0 grid grid-cols-24 pointer-events-none opacity-20">
               {[...Array(24)].map((_, i) => (
                 <div key={i} className="border-r border-white/50 relative">
                   <span className="absolute bottom-2 left-1 text-[8px] text-white/50">{i-12}h</span>
                 </div>
               ))}
             </div>

             <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                   <motion.div
                    key={selectedCity.name}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center"
                   >
                     <MapPin size={60} className="text-amber-500 mb-4 animate-bounce" />
                     <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{selectedCity.name}</h2>
                     <p className="text-slate-500 font-bold tracking-[0.3em] uppercase text-xs">{selectedCity.info}</p>
                   </motion.div>
                </div>
             </div>

             {/* Sonuç Overlay */}
             <AnimatePresence>
               {result.status && (
                 <motion.div 
                   initial={{ opacity: 0, y: 100 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 100 }}
                   className={`absolute bottom-0 left-0 right-0 p-8 ${result.status === 'correct' ? 'bg-emerald-600/90' : 'bg-red-600/90'} backdrop-blur-xl border-t border-white/20`}
                 >
                   <div className="flex items-center gap-4 max-w-2xl mx-auto text-white">
                     {result.status === 'correct' ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
                     <div>
                       <h4 className="font-black text-xl uppercase tracking-tight">İşlem Sonucu</h4>
                       <p className="font-medium text-white/90 leading-relaxed">{result.msg}</p>
                     </div>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-6 w-full max-w-5xl">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">DÜNYA'NIN DÖNÜŞÜ</span>
              <p className="text-xs text-white">Batıdan doğuya doğru döner (Saati doğuda ileri taşır).</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">ZAMAN FARKI</span>
              <p className="text-xs text-white">Her 1 meridyen = 4 Dakika</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 text-right">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">SAAT DİLİMİ</span>
              <p className="text-xs text-white">Her 15 meridyen = 1 Saat</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}