'use client';
import dynamic from 'next/dynamic';

// Haritayı içeren çalışma alanını SSR olmadan yüklüyoruz
const TaskWorkspace = dynamic(
  () => import('@/components/student/TaskWorkspace'),
  { ssr: false, loading: () => <div className="animate-pulse h-[600px] w-full bg-slate-200 dark:bg-slate-800 rounded-2xl"></div> }
);

export default function StudentPerformancePage() {
  return (
    <div className="w-full max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Performans Görevi</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Yönergeleri izleyerek harita çizimini tamamlayın ve kontrol listesini işaretleyin.</p>
      </div>
      <TaskWorkspace />
    </div>
  );
}