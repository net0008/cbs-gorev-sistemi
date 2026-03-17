'use client';

import { useState } from 'react';
import { Map, X } from 'lucide-react';
import Link from 'next/link';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} title="Menüyü Aç" className="p-2 bg-blue-600 text-white rounded-full">
        <Map size={24} />
      </button>
      <div className={`fixed top-0 right-0 h-full w-72 bg-slate-900 z-[2001] transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <button onClick={() => setIsOpen(false)} className="p-4 text-white"><X size={24} /></button>
        <nav className="flex flex-col p-4 gap-2"><Link href="/">Ana Sayfa</Link><Link href="/student">Öğrenci Girişi</Link></nav>
      </div>
    </>
  );
}