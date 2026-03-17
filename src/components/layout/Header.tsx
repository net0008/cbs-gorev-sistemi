'use client';
import { useState } from 'react';
import Sidebar from "./Sidebar";
import { Map } from 'lucide-react';

export default function Header() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <header className="w-full bg-slate-900 dark:bg-gray-900 border-b border-slate-800 dark:border-gray-700 p-4 sticky top-0 z-[1001] shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌍</span>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Bergama CBS
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-blue-600 rounded-full text-white"><Map size={24} /></button>
          <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        </div>
      </div>
    </header>
  );
}
