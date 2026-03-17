'use client';
import dynamic from 'next/dynamic';

// Yol güncellendi: @/components/maps/TaskCreator
const TaskCreator = dynamic(() => import('@/components/maps/TaskCreator'), { ssr: false });

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center border-b border-slate-700 pb-4">
        CBS Görev Hazırlama Paneli
      </h1>
      <div className="bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
        <TaskCreator />
      </div>
    </div>
  );
}