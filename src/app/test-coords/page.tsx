"use client";
import React, { useState, useRef } from 'react';
import { X, UploadCloud, Copy, Save, Trash2, Map as MapIcon } from 'lucide-react';

export default function CoordsFinderPro() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [label, setLabel] = useState("");
  const [savedCoords, setSavedCoords] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("/9/harita/map-sicaklik.jpg");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dosya Yükleme Fonksiyonu
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const temporaryUrl = URL.createObjectURL(file);
      setImageUrl(temporaryUrl);
    }
  };

  // Koordinat Hesaplama (Tıklanan yerin % oranını verir)
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCoords({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
  };

  const handleSave = () => {
    if (!label) return;
    const line = `${label}: centerX: ${coords.x}, centerY: ${coords.y}`;
    setSavedCoords(prev => [...prev, line]);
    setLabel("");
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a] text-slate-200 flex overflow-hidden font-sans">
      
      {/* 🟢 SOL SİDEBAR (Görseldeki gibi) */}
      <aside className="w-80 bg-slate-900/80 backdrop-blur-xl border-r border-white/5 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-emerald-600/5">
          <h2 className="font-black text-sm text-white leading-tight uppercase tracking-tighter">
            HASBİ ERDOĞMUŞ <span className="text-emerald-500">|</span> <br />
            <span className="text-emerald-500">KOORDİNAT DEDEKTÖRÜ V2.2</span>
          </h2>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">
            Öğrenme Çıktıları ve Süreç Bileşenleri
          </p>
        </div>
        
        {/* Kayıtlı Liste */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {savedCoords.map((c, i) => (
            <div key={i} className="bg-white/5 border border-white/5 p-3 rounded-xl text-[10px] font-mono text-emerald-400">
              {c}
            </div>
          ))}
        </div>

        <div className="p-4 bg-black/20 border-t border-white/5 space-y-2">
          <button onClick={() => navigator.clipboard.writeText(savedCoords.join('\n'))} className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg">
            <Copy size={14} /> LİSTEYİ KOPYALA
          </button>
          <button onClick={() => setSavedCoords([])} className="w-full py-2 text-[10px] text-slate-500 hover:text-rose-400 transition-colors">
            TEMİZLE
          </button>
        </div>
      </aside>

      {/* 🔵 ANA PANEL */}
      <main className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black p-8">
        
        {/* Üst Kısım: Butonlar ve Koordinat Göstergesi */}
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-4">
             {/* Koordinat Göstergesi (Siyah Kutu) */}
             <div className="bg-black/40 border border-white/10 px-6 py-3 rounded-2xl shadow-2xl">
                <span className="text-[10px] text-slate-500 uppercase font-black block mb-1">Mevcut İmleç Konumu</span>
                <span className="font-mono text-2xl text-emerald-400 tracking-tighter italic">X:%{coords.x} Y:%{coords.y}</span>
             </div>
          </div>

          {/* 🚀 ARADIĞIN BUTON: Harita Yükle (Görseldeki gibi büyük ve yeşil) */}
          <div className="flex gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all active:scale-95 group"
            >
              <UploadCloud size={24} className="group-hover:animate-bounce" />
              <div className="text-left">
                <p className="leading-none text-sm uppercase">Harita Yükle</p>
                <p className="text-[9px] font-normal opacity-70">JPG, PNG veya WebP</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </button>

            <button className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-2xl shadow-lg active:scale-90 transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Başlık Giriş Alanı */}
        <div className="flex gap-4 mb-8 bg-white/5 p-4 rounded-3xl border border-white/5 shadow-inner">
          <input 
            type="text" 
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Kutucuk Başlığını Yazın (Örn: Lejant)..."
            className="flex-1 bg-transparent border-none outline-none text-white text-lg font-medium px-4 placeholder:text-slate-600"
          />
          <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 px-10 py-4 rounded-2xl font-black text-sm transition-all shadow-xl uppercase">
            KAYDET
          </button>
        </div>

        {/* 🗺️ HARİTA GÖRÜNTÜLEME ALANI */}
        <div className="flex-1 bg-black/40 rounded-[2.5rem] border-2 border-dashed border-white/10 overflow-auto relative custom-scrollbar flex items-center justify-center">
          <div onClick={handleImageClick} className="relative cursor-crosshair">
            {/* Tıklanan Yere İşaretçi (Nişangah) */}
            <div 
              className="absolute pointer-events-none border border-red-500 w-10 h-10 -translate-x-1/2 -translate-y-1/2 transition-all"
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
            >
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-red-500"></div>
              <div className="absolute left-1/2 top-0 w-[1px] h-full bg-red-500"></div>
            </div>

            {/* ÇÖZÜM: Standart <img> etiketi Blobları anında gösterir */}
            <img 
              src={imageUrl} 
              alt="Harita" 
              className="max-w-none h-auto block select-none rounded-lg" 
            />
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.4); }
      `}</style>
    </div>
  );
}