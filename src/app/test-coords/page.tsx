"use client";
import React, { useState, useRef } from 'react';
import { X, UploadCloud, Copy, Save, Crosshair } from 'lucide-react';

export default function CoordsFinderAdvanced() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [label, setLabel] = useState("");
  const [savedCoords, setSavedCoords] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("/9/harita/map-sicaklik.jpg");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const temporaryUrl = URL.createObjectURL(file);
      setImageUrl(temporaryUrl);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCoords({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
  };

  const handleSaveCoord = () => {
    if (!label.trim()) return;
    const format = `${label}: centerX: ${coords.x}, centerY: ${coords.y}`;
    setSavedCoords(prev => [...prev, format]);
    setLabel("");
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a] text-slate-200 flex flex-col font-sans">
      {/* Üst Bar */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md">
        <div className="flex flex-col">
          <h1 className="text-lg font-black text-emerald-400 tracking-tighter uppercase">Koordinat Dedektörü v2.3</h1>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Öğrenme Çıktıları ve Süreç Bileşenleri</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Mevcut Nokta</p>
            <p className="font-mono text-emerald-400 text-lg">X:%{coords.x} Y:%{coords.y}</p>
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl transition-all border border-emerald-500/20">
            <UploadCloud size={20} />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sol Liste Paneli */}
        <aside className="w-80 bg-black/20 border-r border-white/5 p-4 flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Kayıtlı Noktalar</span>
            <button onClick={() => navigator.clipboard.writeText(savedCoords.join('\n'))} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
              <Copy size={12} /> KOPYALA
            </button>
          </div>
          <textarea 
            readOnly 
            className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-[11px] text-emerald-300/80 resize-none outline-none custom-scrollbar"
            value={savedCoords.join('\n')}
            placeholder="Kayıtlar burada listelenir..."
          />
        </aside>

        {/* Orta Harita Alanı */}
        <main className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="mb-4 flex gap-3">
            <input 
              type="text" 
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Başlık Yaz (Örn: Lejant)..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-2.5 outline-none focus:border-emerald-500 transition-all text-sm"
            />
            <button onClick={handleSaveCoord} className="bg-emerald-600 hover:bg-emerald-500 px-8 rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">
              KAYDET
            </button>
          </div>

          <div className="flex-1 bg-slate-950 rounded-3xl border border-white/5 overflow-auto relative custom-scrollbar flex items-start justify-center p-4">
            <div onClick={handleImageClick} className="relative cursor-crosshair border-2 border-dashed border-white/10 group">
              {/* Nişangah */}
              <div 
                className="absolute w-6 h-6 border-2 border-red-500 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-red-500 rounded-full"></div>
              </div>
              <img src={imageUrl} alt="Harita" className="max-w-none h-auto block select-none" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}