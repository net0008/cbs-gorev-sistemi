'use client';

import { useState } from 'react';
import { Map, X, Home, GraduationCap, MapPin, Settings, Info } from 'lucide-react';
import Link from 'next/link';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Ana Sayfa', href: '/', icon: <Home size={20} /> },
    { name: 'Öğretmen Paneli', href: '/teacher', icon: <Settings size={20} /> },
    { name: 'Öğrenci Girişi', href: '/student', icon: <GraduationCap size={20} /> },
    { name: 'Aktif Görevler', href: '#', icon: <MapPin size={20} /> },
    { name: 'Proje Hakkında', href: '#', icon: <Info size={20} /> },
  ];

  return (
    <>
      {/* Menü Tetikleyici Buton (Harita İkonu) */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-all active:scale-95"
        title="Menüyü Aç"
      >
        <Map size={24} />
      </button>

      {/* Karartma Arka Plan (Overlay) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Yan Menü (Sidebar) */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-slate-900 border-l border-slate-800 shadow-2xl z-[2001] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full">
          {/* Menü Üst Kısmı */}
          <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
              <Map size={20} /> Menü
            </h2>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          {/* Menü Linkleri */}
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group"
              >
                <span className="text-slate-500 group-hover:text-blue-400">
                  {item.icon}
                </span>
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Menü Alt Kısmı */}
          <div className="mt-auto pt-6 border-t border-slate-800 text-xs text-slate-500 italic">
            Bergama CBS v2.0
          </div>
        </div>
      </div>
    </>
  );
}