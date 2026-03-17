'use client';

import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import dynamic from 'next/dynamic';

const EditControl = dynamic(
  () => import('react-leaflet-draw').then(mod => mod.EditControl),
  { ssr: false }
);
import "leaflet-draw/dist/leaflet.draw.css";

const CHECKLIST_STEPS = [
  "Gerekli katmanlar seçildi mi?",
  "Koordinat doğruluğu kontrol edildi mi?",
  "Semboloji uygun mu?"
];

export default function TaskWorkspace() {
  const [drawnItems, setDrawnItems] = useState<any>(null);
  const [checklist, setChecklist] = useState<boolean[]>(new Array(CHECKLIST_STEPS.length).fill(false));
  const [isSelfAssessmentOpen, setIsSelfAssessmentOpen] = useState(false);
  const [cikarilanSonuc, setCikarilanSonuc] = useState('');
  const [selfAssessment, setSelfAssessment] = useState({ ogrendiklerim: '', zorlandiklarim: '', farkYarattigim: '' });
  
  const featureGroupRef = useRef<L.FeatureGroup>(null);

  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  const onCreated = (e: any) => {
    if (featureGroupRef.current) {
      featureGroupRef.current.addLayer(e.layer);
      setDrawnItems(featureGroupRef.current.toGeoJSON());
    }
  };

  const toggleChecklist = (index: number) => {
    const newChecklist = [...checklist];
    newChecklist[index] = !newChecklist[index];
    setChecklist(newChecklist);
  };

  const handleFinalSubmit = () => {
    if (!drawnItems) {
      alert("Lütfen önce harita üzerinde görevinizi tamamlayın.");
      setIsSelfAssessmentOpen(false);
      return;
    }
    
    const payload = {
      ogrenci_geometrisi: drawnItems,
      kontrol_listesi_durumu: checklist,
      cikarilan_sonuc: cikarilanSonuc,
      oz_degerlendirme_notu: selfAssessment
    };
    
    console.log("Supabase'e Gönderilecek Veri:", payload);
    alert("Tebrikler! Performans göreviniz başarıyla sisteme kaydedildi.");
    setIsSelfAssessmentOpen(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      
      {/* Harita ve Çizim Alanı */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="h-[600px] w-full rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-xl relative z-0">
          <MapContainer center={[39.12, 27.18]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />
            <FeatureGroup ref={featureGroupRef}>
              <EditControl position="topright" onCreated={onCreated} draw={{ circlemarker: false, circle: false }} />
            </FeatureGroup>
          </MapContainer>
        </div>
      </div>

      {/* Kontrol Listesi ve İşlem Paneli */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            Adım Adım İlerleme
          </h3>
          
          <div className="space-y-3">
            {CHECKLIST_STEPS.map((step, index) => (
              <label key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-colors shadow-sm bg-white/50 dark:bg-slate-800/50">
                <input 
                  type="checkbox" 
                  className="mt-1 w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  checked={checklist[index]}
                  onChange={() => toggleChecklist(index)}
                />
                <span className={`text-sm font-medium ${checklist[index] ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                  {step}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setIsSelfAssessmentOpen(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg transition-transform transform hover:-translate-y-1"
        >
          Görevi Tamamla
        </button>
      </div>

      {/* Öz Değerlendirme Modalı */}
      {isSelfAssessmentOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl p-8 transform transition-all">
            <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-400 border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
              Sonuç ve Öz Değerlendirme
            </h2>
            
            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800">
              <label className="block text-sm font-bold text-blue-900 dark:text-blue-300 mb-2">Öğrencinin Çıkardığı Sonuç (Mekânsal Çıkarım)</label>
              <textarea 
                className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                rows={3}
                value={cikarilanSonuc}
                onChange={(e) => setCikarilanSonuc(e.target.value)}
                placeholder="Haritadaki veriyi coğrafi olarak yorumlayınız. Neden bu alanları seçtiniz?"
              />
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Bu çalışma sırasında neler öğrendim?</label>
                <textarea 
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  value={selfAssessment.ogrendiklerim}
                  onChange={(e) => setSelfAssessment({...selfAssessment, ogrendiklerim: e.target.value})}
                  placeholder="Kendi ifadelerinizle açıklayınız..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Çalışmam sırasında en çok nerede zorlandım?</label>
                <textarea 
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  value={selfAssessment.zorlandiklarim}
                  onChange={(e) => setSelfAssessment({...selfAssessment, zorlandiklarim: e.target.value})}
                  placeholder="Karşılaştığınız zorlukları belirtiniz..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Çalışmamı yeniden yapsaydım neye dikkat ederdim? (Ne fark yarattım?)</label>
                <textarea 
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  value={selfAssessment.farkYarattigim}
                  onChange={(e) => setSelfAssessment({...selfAssessment, farkYarattigim: e.target.value})}
                  placeholder="Gelecek çalışmalarda neleri farklı yapardınız veya projenizde ne gibi bir fark yarattınız?"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <button onClick={() => setIsSelfAssessmentOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                Vazgeç
              </button>
              <button onClick={handleFinalSubmit} className="px-8 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors">
                Çizimi ve Formu Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}