'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Info, Map as MapIcon, Database, CheckCircle2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const methods = [
  {
    id: 'dot',
    title: 'Noktalama Yöntemi',
    description: 'Verilerin dağılışını, her noktanın belirli bir sayısal değeri temsil ettiği noktalarla gösterir.',
    useCase: 'Nüfus dağılışı, tarım ürünleri üretimi.',
    pdfRef: 'Harita 2.8: Türkiye Nüfus Dağılışı'
  },
  {
    id: 'choropleth',
    title: 'Koroplet (Alan) Yöntemi',
    description: 'Belirli bir alandaki yoğunluğu veya değeri farklı renk tonlarıyla gösterir.',
    useCase: 'Nüfus yoğunluğu, okuryazarlık oranı.',
    pdfRef: 'İllere göre nüfus dağılışı kartogramı'
  },
  {
    id: 'coloring',
    title: 'Renklendirme Yöntemi',
    description: 'Yükselti ve derinlik basamaklarını standart renklerle gösterir.',
    useCase: 'Fiziki haritalar, topoğrafya.',
    pdfRef: 'Harita 2.9: Rize ili fiziki haritası'
  },
  {
    id: 'isoline',
    title: 'İzohips (Eş Değer) Yöntemi',
    description: 'Aynı değere sahip noktaların birleştirilmesiyle elde edilen kapalı eğrilerdir.',
    useCase: 'Yükselti, sıcaklık (izoterm), basınç (izobar).',
    pdfRef: 'Yer şekillerini gösterme teknikleri'
  }
];

export default function DistributionMethodsActivity({ onClose }: Props) {
  const [selectedMethod, setSelectedMethod] = useState(methods[0]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden select-none font-sans">
      {/* Header */}
      <div className="p-4 px-6 flex justify-between items-center bg-black/80 border-b border-white/10 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Layers className="text-blue-400" size={24} />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">Dağılışları Gösterme Yöntemleri</h2>
            <p className="text-blue-400/80 text-xs font-medium uppercase tracking-wider">COĞ.9.2.1.a - Mekansal Bilgi Teknolojileri</p>
          </div>
        </div>
        <button onClick={onClose} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg font-bold text-sm transition-all border border-red-500/20">
          KAPAT
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sol Panel: Seçenekler */}
        <div className="w-80 bg-black/40 border-r border-white/5 p-6 flex flex-col gap-4 overflow-y-auto">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-2 text-center">Yöntem Seçimi</h3>
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method)}
              className={`p-4 rounded-xl text-left transition-all border ${
                selectedMethod.id === method.id 
                ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-lg shadow-blue-500/10' 
                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm">{method.title}</span>
                {selectedMethod.id === method.id && <CheckCircle2 size={16} className="text-blue-400" />}
              </div>
              <p className="text-[11px] leading-relaxed opacity-60 line-clamp-2">{method.description}</p>
            </button>
          ))}
          
          <div className="mt-auto p-4 bg-slate-900/50 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Info size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">PDF Bilgi Notu</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed italic">
              "Renklendirme yönteminde yeşil renk 0-500m arası yükseltiyi temsil ederken, koyu kahverengi en yüksek dağlık alanları gösterir."
            </p>
          </div>
        </div>

        {/* Ana Alan: Görselleştirme */}
        <div className="flex-1 bg-[#020617] relative flex items-center justify-center p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedMethod.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-4xl aspect-[16/9] bg-slate-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative"
            >
              {/* Harita Katman Simülasyonu */}
              <div className="absolute inset-0 opacity-40">
                <div className="absolute inset-0 bg-[url('/9/harita/turkiye_haritasi.png')] bg-cover bg-center grayscale" />
              </div>

              {/* Yönteme Özel Katman */}
              <div className="absolute inset-0 flex items-center justify-center p-12">
                {selectedMethod.id === 'dot' && <DotLayer />}
                {selectedMethod.id === 'choropleth' && <ChoroplethLayer />}
                {selectedMethod.id === 'coloring' && <ColoringLayer />}
                {selectedMethod.id === 'isoline' && <IsolineLayer />}
              </div>

              {/* Lejant */}
              <div className="absolute bottom-6 right-6 p-4 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 w-48 shadow-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Lejant</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm ${getLegendColor(selectedMethod.id)}`} />
                    <span className="text-[10px] text-white/80">{selectedMethod.title} Verisi</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bilgi Kartı */}
          <div className="absolute top-12 left-12 right-12 flex justify-center pointer-events-none">
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-blue-600/90 backdrop-blur text-white px-6 py-3 rounded-full flex items-center gap-4 shadow-xl border border-blue-400/50"
            >
              <Database size={18} />
              <span className="text-sm font-bold tracking-wide">{selectedMethod.title}: {selectedMethod.useCase}</span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Alt Katman Bileşenleri
function DotLayer() {
  return (
    <div className="grid grid-cols-12 grid-rows-6 gap-8 w-full opacity-80">
      {[...Array(40)].map((_, i) => (
        <motion.div 
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          key={i} className="w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_8px_#60a5fa]" 
          style={{ marginLeft: Math.random() * 20, marginTop: Math.random() * 20 }}
        />
      ))}
    </div>
  );
}

function ColoringLayer() {
  return (
    <div className="w-full h-full flex flex-col gap-1 rounded-lg overflow-hidden border border-white/5">
      <div className="flex-1 bg-emerald-700/40 flex items-center justify-center text-[10px] text-emerald-200">0 - 500m (Yeşil)</div>
      <div className="flex-1 bg-yellow-600/40 flex items-center justify-center text-[10px] text-yellow-100">500 - 1000m (Sarı)</div>
      <div className="flex-1 bg-orange-700/40 flex items-center justify-center text-[10px] text-orange-100">1000 - 1500m (Turuncu)</div>
      <div className="flex-1 bg-amber-900/40 flex items-center justify-center text-[10px] text-amber-200">1500m+ (Kahverengi)</div>
    </div>
  );
}

function ChoroplethLayer() {
  return (
    <div className="grid grid-cols-4 grid-rows-3 gap-2 w-full h-full opacity-60">
      {[...Array(12)].map((_, i) => (
        <div key={i} className={`rounded-lg ${i % 3 === 0 ? 'bg-blue-900' : i % 3 === 1 ? 'bg-blue-600' : 'bg-blue-400'}`} />
      ))}
    </div>
  );
}

function IsolineLayer() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {[...Array(5)].map((_, i) => (
        <div 
          key={i} 
          className="absolute border border-blue-400/40 rounded-full" 
          style={{ width: `${(i + 1) * 20}%`, height: `${(i + 1) * 20}%` }}
        />
      ))}
      <span className="text-blue-400 text-[10px] font-bold">1500m</span>
    </div>
  );
}

function getLegendColor(id: string) {
  switch(id) {
    case 'dot': return 'bg-blue-400';
    case 'choropleth': return 'bg-blue-600';
    case 'coloring': return 'bg-amber-700';
    case 'isoline': return 'border border-blue-400';
    default: return 'bg-white';
  }
}