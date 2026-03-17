'use client';
import { useState } from 'react';
import { Map, X, Home, GraduationCap, Settings } from 'lucide-react';
import Link from 'next/link';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="p-2 bg-blue-600 rounded-full"><Map size={24} /></button>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-[2000]" onClick={() => setIsOpen(false)} />}
      <div className={`fixed top-0 right-0 h-full w-72 bg-slate-900 z-[2001] transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6">
          <button onClick={() => setIsOpen(false)} className="mb-8"><X size={24} /></button>
          <nav className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2"><Home size={20}/> Ana Sayfa</Link>
            <Link href="/teacher" className="flex items-center gap-2"><Settings size={20}/> Öğretmen</Link>
            <Link href="/student" className="flex items-center gap-2"><GraduationCap size={20}/> Öğrenci</Link>
          </nav>
        </div>
      </div>
    </>
  );
}
