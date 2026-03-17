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
    amacaUygunluk: 0,
    mekansalVeriYeterliligi: 0,
    aracGerecKullanimi: 0,
    gunlukHayattaKullanim: 0,
  });
  const [teacherNote, setTeacherNote] = useState('');

  const handleSaveEvaluation = async () => {
    const totalScore = rubricScores.amacaUygunluk + rubricScores.mekansalVeriYeterliligi + rubricScores.aracGerecKullanimi + rubricScores.gunlukHayattaKullanim;
    console.log("Değerlendirme Kaydediliyor:", { rubricScores, totalScore, teacherNote });
    alert(`Değerlendirme kaydedildi. Toplam Puan: ${totalScore}`);
    
    // Supabase UPDATE işlemi örneği:
    /*
    await supabase.from('ogrenci_cevaplari').update({
      rubrik_sonuclari: rubricScores,
      puan: totalScore,
      ogretmen_notu: teacherNote
    }).eq('id', currentAnswerId);
    */
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
      {/* Sol Taraf: Karşılaştırmalı Harita */}
      <div className="col-span-2 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Öğrenci Çalışması Karşılaştırması</h2>
          <div className="flex gap-4 text-sm font-medium">
            <span className="flex items-center gap-2 text-blue-600"><div className="w-4 h-1 border-b-2 border-dashed border-blue-600"></div> Referans (Öğretmen)</span>
            <span className="flex items-center gap-2 text-red-500"><div className="w-4 h-1 bg-red-500"></div> Öğrenci Çizimi</span>
          </div>
        </div>
        <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-md border border-slate-300 dark:border-slate-700">
          <ComparativeMap 
            referenceGeoJSON={null} // Buraya Supabase'den gelen referans JSON eklenecek
            studentGeoJSON={null}   // Buraya öğrencinin çizdiği JSON eklenecek
          />
        </div>
        
        {/* Öğrenci Öz Değerlendirmesi Görüntüleme Alanı */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-blue-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">Öğrenci Öz Değerlendirmesi</h3>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
            <p><strong>Neleri Öğrendim?:</strong> Fay hatlarının yerleşim yerlerine etkisini kavramsal olarak haritaya dökmeyi öğrendim.</p>
            <p><strong>Nerede Zorlandım?:</strong> Ölçeğe uygun çizim yaparken poligon sınırlarını ayarlamakta zorlandım.</p>
            <p><strong>Neye Dikkat Ederdim?:</strong> Daha detaylı bir lejand oluşturmaya ve renk seçimlerine daha çok dikkat ederdim.</p>
          </div>
        </div>
      </div>

      {/* Sağ Taraf: Analitik Rubrik ve Notlandırma */}
      <div className="col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md flex flex-col gap-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 border-b pb-2">Analitik Puanlama Anahtarı</h3>
        
        <div className="space-y-5">
          {[
            { key: 'amacaUygunluk', label: 'Amaca Uygunluk' },
            { key: 'mekansalVeriYeterliligi', label: 'Mekânsal Veri Yeterliliği' },
            { key: 'aracGerecKullanimi', label: 'Seçilen Araç-Gereç Kullanımı' },
            { key: 'gunlukHayattaKullanim', label: 'Günlük Hayatta Kullanım Potansiyeli' }
          ].map((criterion) => (
            <div key={criterion.key} className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{criterion.label}</label>
              <div className="flex gap-2">
                {[
                  { value: 1, label: 'Kabul Edilebilir' },
                  { value: 2, label: 'İyi' },
                  { value: 3, label: 'Çok İyi' }
                ].map((scale) => (
                  <button
                    key={scale.value}
                    onClick={() => setRubricScores(prev => ({ ...prev, [criterion.key]: scale.value }))}
                    className={`flex-1 py-2 px-1 rounded-lg text-xs font-semibold transition-all border ${
                      (rubricScores as any)[criterion.key] === scale.value 
                        ? 'bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="block text-lg mb-1">{scale.value}</span>
                    {scale.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Geri Bildirim / Öğretmen Notu</label>
          <textarea
            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            rows={4}
            placeholder="Öğrencinin gelişimini destekleyecek yapıcı geri bildiriminiz..."
            value={teacherNote}
            onChange={(e) => setTeacherNote(e.target.value)}
          />
        </div>

        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Toplam: <span className="text-blue-600">{rubricScores.amacaUygunluk + rubricScores.mekansalVeriYeterliligi + rubricScores.aracGerecKullanimi + rubricScores.gunlukHayattaKullanim}</span> / 12
          </div>
          <button 
            onClick={handleSaveEvaluation}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition-colors shadow-md hover:shadow-lg"
          >
            Değerlendirmeyi Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}