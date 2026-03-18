"use client";
import React from 'react';
import { ClipboardCheck, Users, BarChart3, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="w-full max-w-7xl mx-auto py-4">
      {/* Karşılama Alanı */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">CBS Görev Sistemi</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Eğitim teknolojileri ve coğrafi bilgi sistemleri görev yönetim platformuna hoş geldiniz.
        </p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Görevlerim Kartı */}
        <div className="bg-white dark:bg-slate-900/60 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-8">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl">
              <ClipboardCheck size={28} />
            </div>
            <button className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              <ArrowRight size={24} />
            </button>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Görevlerim</h3>
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-5">7 Aktif Görev</p>
          <div className="flex items-center gap-3 text-sm font-semibold">
            <span className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">2 Bekleyen</span>
            <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1.5 rounded-xl">5 Tamamlanan</span>
          </div>
        </div>

        {/* Sınıflarım Kartı */}
        <div className="bg-white dark:bg-slate-900/60 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-8">
            <div className="p-4 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <Users size={28} />
            </div>
            <button className="text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <ArrowRight size={24} />
            </button>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sınıflarım</h3>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-5">4 Kayıtlı Sınıf</p>
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-xl inline-block">
            120 Toplam Öğrenci
          </div>
        </div>

        {/* İstatistikler Kartı */}
        <div className="bg-white dark:bg-slate-900/60 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-8">
            <div className="p-4 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-2xl">
              <BarChart3 size={28} />
            </div>
            <button className="text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              <ArrowRight size={24} />
            </button>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">İstatistikler</h3>
          <p className="text-3xl font-black text-purple-600 dark:text-purple-400 mb-5">15 Görev Tamamlama</p>
          <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-4 py-1.5 rounded-xl inline-block">
            %85 Başarı Oranı
          </div>
        </div>

      </div>
    </div>
  );
}