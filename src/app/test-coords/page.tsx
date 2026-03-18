"use client";
import React, { useState } from 'react';

export default function CoordsFinder() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCoords({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
    console.log(`X: %${x.toFixed(2)}, Y: %${y.toFixed(2)}`);
  };

  return (
    <div className="p-10 bg-slate-900 min-h-screen text-white text-center">
      <h1 className="text-2xl font-bold mb-4">Hasbi Hocam, Harita Üzerinde Bir Noktaya Tıkla</h1>
      <p className="mb-6 bg-emerald-600 inline-block px-4 py-2 rounded">
        Son Tıklanan Koordinat: <span className="font-mono text-yellow-300">X: %{coords.x}, Y: %{coords.y}</span>
      </p>
      
      <div 
        onClick={handleImageClick}
        className="relative inline-block cursor-crosshair border-2 border-dashed border-white/20"
      >
        <img 
          src="/9/harita/map-sicaklik.jpg" 
          alt="Koordinat Bulucu"
          className="max-w-6xl w-full select-none"
        />
      </div>
      <p className="mt-4 text-slate-400">Not: Değerler console (F12) ekranına da yazdırılıyor.</p>
    </div>
  );
}