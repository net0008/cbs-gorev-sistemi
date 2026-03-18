'use client';
import dynamic from 'next/dynamic';

// Haritayı içeren çalışma alanını SSR olmadan yüklüyoruz
const TaskWorkspace = dynamic(
  () => import('../../TaskWorkspace'),
  { ssr: false, loading: () => <div className="animate-pulse h-[600px] w-full bg-slate-200 dark:bg-slate-800 rounded-2xl"></div> }
);

export default function StudentPerformancePage() {
  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full animate-pulse ring-2 ring-blue-500 shadow-lg shadow-blue-500/20">
            <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
          </div>
          Coğrafi Bilgi Sistemleri'ni Öğreniyorum
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-3 text-lg">Yönergeleri izleyerek harita çizimini tamamlayın, yorumunuzu yazın ve kontrol listesini işaretleyin.</p>
      </div>
      <TaskWorkspace />
    </div>
  );
}