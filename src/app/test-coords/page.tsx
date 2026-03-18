"use client";
import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, Copy, Save, Trash2, Map as MapIcon, Crosshair } from 'lucide-react';

export default function CoordsFinderPro() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [label, setLabel] = useState("");
  const [savedCoords, setSavedCoords] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("/9/harita/map-sicaklik.jpg");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dosya Yükleme (Blob hatasını standart img ile çözüyoruz)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const temporaryUrl = URL.createObjectURL(file);
      setImageUrl(temporaryUrl);
    }
  };

  // Koordinat Hesaplama
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCoords({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
  };

  // Listeyi Kopyalama
  const handleCopy = () => {
    navigator.clipboard.writeText(savedCoords.join('\n'));
    alert("Koordinatlar kopyalandı!");
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a] text-slate-200 flex overflow-hidden font-sans selection:bg-emerald-500/30">
      
      {/* SOL PANEL: Dar ve Şık Koordinat Listesi */}
      <aside className="w-80 bg-slate-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-emerald-600/5">
          <div className="flex items-center gap-2">
            <MapIcon className="text-emerald-500" size={20} />
            <h2 className="font-bold text-lg tracking-tight">Koordinatlar</h2>
          </div>
          <button onClick={handleCopy} title="Kopyala" className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-emerald-400">
            <Copy size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {savedCoords.length === 0 ? (
            <p className="text-xs text-slate-600 text-center mt-10 italic">Henüz kayıt yok...</p>
          ) : (
            savedCoords.map((c, i) => (
              <div key={i} className="group relative bg-white/5 border border-white/5 p-3 rounded-xl text-[11px] font-mono text-emerald-300/80 hover:border-emerald-500/30 transition-all">
                {c}
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-black/20 border-t border-white/5">
          <button 
            onClick={() => setSavedCoords([])}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
          >
            <Trash2 size={14} /> Listeyi Temizle
          </button>
        </div>
      </aside>

      {/* ANA PANEL */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black">
        
        {/* Üst Bilgi Şeridi (Maarif Modeli Temalı) */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-sm">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-3">
              HASBİ ERDOĞMUŞ <span className="text-emerald-500 font-light text-sm">|</span> 
              <span className="text-emerald-500 tracking-widest text-sm uppercase">Koordinat Dedektörü v2.2</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">
              Öğrenme Çıktıları ve Süreç Bileşenleri
            </p>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Mevcut İmleç</span>
                <span className="font-mono text-lg text-emerald-400 tracking-tighter">X:%{coords.x} Y:%{coords.y}</span>
             </div>
             <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-white/5 hover:bg-emerald-600 rounded-2xl transition-all shadow-xl group"
            >
              <UploadCloud size={20} className="group-hover:scale-110 transition-transform" />
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </button>
          </div>
        </header>

        {/* Kontrol Çubuğu */}
        <div className="p-4 px-8 flex gap-4 bg-emerald-600/5 items-center border-b border-white/5">
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Başlık (Örn: Lejant, Ölçek...)"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-5 py-3 text-sm focus:border-emerald-500 outline-none transition-all placeholder:text-slate-700"
            />
          </div>
          <button 
            onClick={() => {
              if(!label) return;
              const line = `${label}: centerX: ${coords.x}, centerY: ${coords.y}`;
              setSavedCoords(prev => [...prev, line]);
              setLabel("");
            }}
            className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
          >
            <Save size={18} /> KAYDET
          </button>
        </div>

        {/* Harita Görüntüleme Alanı */}
        <div className="flex-1 overflow-auto p-10 flex items-center justify-center custom-scrollbar">
          <div 
            onClick={handleImageClick}
            className="relative cursor-crosshair border border-emerald-500/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-slate-950 rounded-lg overflow-hidden group"
          >
            {/* Hedef Nişangah Simülasyonu */}
            <div 
              className="absolute pointer-events-none border border-emerald-500/50 w-8 h-8 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out"
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
            >
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-emerald-500/50"></div>
              <div className="absolute left-1/2 top-0 w-[1px] h-full bg-emerald-500/50"></div>
            </div>

            <img 
              src={imageUrl} 
              alt="Harita" 
              className="max-w-none h-auto block select-none" 
            />
          </div>
        </div>

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.2); }
      `}</style>
    </div>
  );
}