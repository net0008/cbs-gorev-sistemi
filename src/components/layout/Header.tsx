'use client';
import { useState } from 'react';
import Sidebar from "./Sidebar";
import { Menu } from 'lucide-react';

export default function Header() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className="w-full bg-card border-b border-border p-4 sticky top-0 z-40 shadow-md">
        <div className="container mx-auto flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-muted">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
          <span className="text-2xl">🌍</span>
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Coğrafi Bilgi Sistemi'ni Öğreniyorum
          </h1>
        </div>
        </div>
      </header>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
    </>
  );
}
