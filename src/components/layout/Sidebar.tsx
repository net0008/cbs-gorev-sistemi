'use client';
import { useState, useEffect } from 'react';
import { X, Home, GraduationCap, Settings, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan temayı oku
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    // Tema değiştiğinde <html> etiketine sınıfı uygula ve localStorage'a kaydet
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <>
      {/* Arka plan karartması */}
      {isOpen && <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setIsOpen(false)} />}
      
      {/* Sidebar Menüsü */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-card text-foreground z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <button onClick={() => setIsOpen(false)} className="mb-8 p-2 rounded-md hover:bg-muted"><X size={24} /></button>
          <nav className="flex flex-col gap-4">
            <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted"><Home size={20}/> Ana Sayfa</Link>
            <Link href="/teacher" onClick={() => setIsOpen(false)} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted"><Settings size={20}/> Öğretmen</Link>
            <Link href="/student" onClick={() => setIsOpen(false)} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted"><GraduationCap size={20}/> Öğrenci</Link>
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <button onClick={toggleTheme} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted w-full text-left">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              <span>{theme === 'light' ? 'Karanlık Tema' : 'Aydınlık Tema'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
