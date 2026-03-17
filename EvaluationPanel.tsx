'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Haritayı SSR olmadan yüklüyoruz
const ComparativeMap = dynamic(
  () => import('@/components/maps/ComparativeMap'),
  { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-100">Harita Yükleniyor...</div> }
);

export default function EvaluationPanel() {
  // Maarif Modeli Analitik Rubrik Örneği
  const [rubricScores, setRubricScores] = useState({
    cizimHassasiyeti: 0,
    sembolKullanimi: 0,
    veriDogrulugu: 0,
  });
  const [teacherNote, setTeacherNote] = useState('');

  const handleSaveEvaluation = async () => {
    const totalScore = rubricScores.cizimHassasiyeti + rubricScores.sembolKullanimi + rubricScores.veriDogrulugu;
    console.log("Değerlendirme Kaydediliyor:", { rubricScores, totalScore, teacherNote });
    alert(`Değerlendirme kaydedildi. Toplam Puan: ${totalScore}`);
    // Supabase UPDATE işlemi buraya gelecek
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 bg-slate-50 dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
      {/* Sol Taraf: Karşılaştırmalı Harita */}
      <div className="col-span-2 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Öğrenci Çalışması Karşılaştırması</h2>
          <div className="flex gap-4 text-sm font-medium">
            <span className="flex items-center gap-2 text-blue-600"><div className="w-4 h-1 border-b-2 border-dashed border-blue-600"></div> Referans (Öğretmen)</span>
            <span className="flex items-center gap-2 text-red-500"><div className="w-4 h-1 bg-red-500"></div> Öğrenci Çizimi</span>
          </div>
        </div>
        <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-md border border-slate-300 dark:border-slate-700">
          <ComparativeMap 
            referenceGeoJSON={null} // Buraya Supabase'den gelen referans JSON eklenecek
            studentGeoJSON={null}   // Buraya öğrencinin çizdiği JSON eklenecek
          />
        </div>
        
        {/* Öğrenci Öz Değerlendirmesi Görüntüleme Alanı */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-blue-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">Öğrenci Öz Değerlendirmesi</h3>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
            <p><strong>Neleri Öğrendim?:</strong> Fay hatlarının yerleşim yerlerine etkisini kavramsal olarak haritaya dökmeyi öğrendim.</p>
            <p><strong>Nerede Zorlandım?:</strong> Ölçeğe uygun çizim yaparken poligon sınırlarını ayarlamakta zorlandım.</p>
          </div>
        </div>
      </div>

      {/* Sağ Taraf: Analitik Rubrik ve Notlandırma */}
      <div className="col-span-1 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex flex-col gap-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Analitik Puanlama Anahtarı</h3>
        
        <div className="space-y-4">
          {[
            { key: 'cizimHassasiyeti', label: 'Çizim Hassasiyeti ve Sınırlar' },
            { key: 'sembolKullanimi', label: 'Semboloji ve Renk Kullanımı' },
            { key: 'veriDogrulugu', label: 'Mekansal Veri Doğruluğu' }
          ].map((criterion) => (
            <div key={criterion.key} className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{criterion.label}</label>
              <div className="flex justify-between gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    onClick={() => setRubricScores(prev => ({ ...prev, [criterion.key]: score }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      (rubricScores as any)[criterion.key] === score 
                        ? 'bg-blue-600 text-white shadow-inner' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Geri Bildirim / Öğretmen Notu</label>
          <textarea
            className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            rows={4}
            placeholder="Öğrencinin gelişimini destekleyecek yapıcı geri bildiriminiz..."
            value={teacherNote}
            onChange={(e) => setTeacherNote(e.target.value)}
          />
        </div>

        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Toplam: <span className="text-blue-600">{rubricScores.cizimHassasiyeti + rubricScores.sembolKullanimi + rubricScores.veriDogrulugu}</span> / 15
          </div>
          <button 
            onClick={handleSaveEvaluation}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Değerlendirmeyi Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}