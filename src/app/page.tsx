'use client'; // Bu satır şart, tarayıcıda çalışacağını belirtir.

import dynamic from 'next/dynamic';

// Harita bileşenini SSR (Server Side Rendering) kapatarak çağırıyoruz
const TaskCreator = dynamic(() => import('@/components/TaskCreator'), { 
  ssr: false,
  loading: () => <p className="text-white p-10">Harita Yükleniyor...</p>
});

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center border-b border-slate-700 pb-4">
          CBS Görev Hazırlama Paneli
        </h1>
        
        {/* Hazırladığımız Makro Bileşeni */}
        <div className="bg-slate-800 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
          <TaskCreator />
        </div>
      </div>
    </main>
  );
}