'use client';
import { useState, useEffect } from 'react';
import { X, Home, GraduationCap, Settings, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // Varsayılan tema

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme === 'light' ? 'light' : 'dark'); // 'light' veya 'dark' olduğundan emin ol
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[4999]" // z-index sidebar'dan biraz daha düşük
          onClick={() => setIsOpen(false)}
        />
      )}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-slate-900 dark:bg-gray-800 z-[5000] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <button onClick={() => setIsOpen(false)} className="mb-8 text-white hover:text-gray-300">
            <X size={24} />
          </button>
          <nav className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 text-white hover:text-gray-300" onClick={() => setIsOpen(false)}>
              <Home size={20} /> Ana Sayfa
            </Link>
            <Link href="/teacher" className="flex items-center gap-2 text-white hover:text-gray-300" onClick={() => setIsOpen(false)}>
              <Settings size={20} /> Öğretmen Paneli
            </Link>
            <Link href="/student" className="flex items-center gap-2 text-white hover:text-gray-300" onClick={() => setIsOpen(false)}>
              <GraduationCap size={20} /> Öğrenci Girişi
            </Link>
          </nav>
          <div className="mt-8">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              {theme === 'dark' ? 'Aydınlık Tema' : 'Karanlık Tema'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
