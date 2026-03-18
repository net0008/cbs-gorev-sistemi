"use client";
import React, { useState, useRef } from 'react';
import { Plus, X, UploadCloud, Copy, Save } from 'lucide-react';
import Image from 'next/image';

interface SavedCoord {
  label: string;
  x: number;
  y: number;
  formatted: string;
}

export default function CoordsFinderAdvanced() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [label, setLabel] = useState("");
  const [savedCoords, setSavedCoords] = useState<SavedCoord[]>([]);
  const [imageUrl, setImageUrl] = useState("/9/harita/map-sicaklik.jpg"); // Varsayılan resim
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local Resim Yükleme (Upload) İşleyicisi
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const temporaryUrl = URL.createObjectURL(file); // Local URL oluştur
      setImageUrl(temporaryUrl); // Resim state'ini güncelle
    }
  };

  // Harita Tıklama (Koordinat Alma) İşleyicisi
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const technicalX = Number(x.toFixed(2));
    const technicalY = Number(y.toFixed(2));
    setCoords({ x: technicalX, y: technicalY });
    console.log(`X: %${technicalX}, Y: %${technicalY}`);
  };

  // Başlık (Textbox) Değişim İşleyicisi
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  };

  // Koordinat Kaydetme İşleyicisi (Teknik Formatıyla)
  const handleSaveCoord = () => {
    if (label.trim() === "" || (coords.x === 0 && coords.y === 0)) return; // Boş alan kontrolü
    
    // Senin İstediğin Format: Lejant: centerX: 87.50, centerY: 87.17
    const technicalFormat = `${label}: centerX: ${coords.x.toFixed(2)}, centerY: ${coords.y.toFixed(2)}`;
    
    setSavedCoords(prev => [...prev, { label, x: coords.x, y: coords.y, formatted: technicalFormat }]);
    setLabel(""); // Textbox'ı temizle
  };

  // Listeyi Kopyalama İşleyicisi
  const handleCopyList = () => {
    const listText = savedCoords.map(item => item.formatted).join('\n');
    navigator.clipboard.writeText(listText);
    alert("Koordinat listesi panoya kopyalandı!");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden select-none p-6 text-white font-sans">
      
      {/* Genel Düzen: Sol Panel (Liste), Sağ Panel (Harita ve Kontroller) */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* SOL PANEL - Kopyala-Yapıştır Listesi */}
        <div className="w-[350px] bg-black/40 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col gap-5 overflow-hidden shadow-2xl">
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <h2 className="font-bold text-xl text-emerald-400">Koordinat Listesi</h2>
            <button onClick={handleCopyList} className="text-slate-400 hover:text-emerald-400 transition-colors">
              <Copy size={18} />
            </button>
          </div>
          
          <textarea 
            readOnly 
            rows={10} 
            value={savedCoords.map(item => item.formatted).join('\n')}
            placeholder="Tıklayıp Kaydet butonuna bastığınız koordinatlar burada listelenir. Kopyalayıp koda yapıştırabilirsiniz."
            className="flex-1 bg-transparent text-slate-300 font-mono text-sm leading-relaxed p-4 rounded-xl border border-white/5 resize-none outline-none overflow-y-auto"
          />
        </div>

        {/* SAĞ PANEL - Harita ve Kontroller */}
        <div className="flex-1 bg-black/30 rounded-3xl p-8 border border-white/10 flex flex-col gap-6 overflow-hidden relative">
          
          {/* Başlık ve Talimatlar */}
          <div className="flex justify-between items-start gap-4">
            <div className="text-white">
              <h1 className="text-3xl font-bold">Hasbi Hocam, Koordinat Dedektörü v2.0</h1>
              <p className="text-sm text-slate-400 mt-2 uppercase tracking-widest leading-loose">Harita Üzerinde Bir Noktaya Tıkla. Başlığı Yaz ve Kaydet Butonuna Bas.</p>
            </div>
            {/* Kapat Butonu Simülasyonu (Opsiyonel) */}
            <div className="bg-red-600 rounded-full w-8 h-8 flex items-center justify-center text-white"><X size={18} /></div>
          </div>

          {/* Dosya Yükleme (Upload) Kontrolü */}
          <div className="absolute top-8 right-16 flex items-center gap-2 bg-slate-800 px-4 py-1.5 rounded-full border border-white/5 shadow-lg">
            <button onClick={() => fileInputRef.current?.click()} className="text-slate-300 hover:text-white transition-colors">
              <UploadCloud size={20} />
            </button>
            <span className="text-xs text-slate-400">Harita Yükle (Local)</span>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              onChange={handleFileChange} 
              className="hidden" // Input'u gizle
            />
          </div>

          {/* Mevcut Koordinat Gösterimi */}
          <div className="inline-block self-start bg-emerald-600 px-5 py-2.5 rounded-2xl shadow-lg border border-emerald-400/20">
            <p className="text-xs text-slate-100 uppercase tracking-wider font-semibold">Son Tıklanan Koordinat</p>
            <span className="font-mono text-2xl text-yellow-300">X: %{coords.x.toFixed(2)}, Y: %{coords.y.toFixed(2)}</span>
          </div>

          {/* Başlık (Textbox) ve Kaydet Butonu */}
          <div className="flex gap-4 items-center bg-black/40 rounded-3xl p-6 border border-white/10 shadow-lg">
            <input 
              type="text" 
              value={label}
              onChange={handleLabelChange}
              placeholder="Başlık Yazın (Örn: Lejant, Ölçek, Yön Oku...)"
              className="flex-1 bg-transparent text-white px-6 py-3 rounded-xl border border-white/5 outline-none font-medium text-lg placeholder:text-slate-600"
            />
            <button 
              onClick={handleSaveCoord}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-bold transition-all active:scale-90 shadow-xl border border-emerald-400/20 flex items-center gap-2"
            >
              <Save size={18} /> Koordinat Kaydet
            </button>
          </div>
          
          {/* Tıklanabilir Harita Alanı */}
          <div className="relative flex-1 bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center p-6 shadow-inner">
            <div 
              onClick={handleImageClick}
              className="relative inline-block cursor-crosshair border-2 border-dashed border-white/10 select-none shadow-2xl rounded-lg"
            >
              {/* Resim Yükleme (Upload) Simülasyonu */}
              <Image 
                src={imageUrl} // State'ten gelen URL'yi kullan
                alt="Hasbi Hocam Koordinat Bulucu" 
                fill
                priority
                className="object-contain" // Resmin konteynerine düzgün sığmasını sağlar
              />
            </div>
          </div>
          <p className="absolute bottom-4 left-8 text-xs text-slate-500">Not: Değerler console (F12) ekranına da yazdırılıyor.</p>
        </div>

      </div>
    </div>
  );
}