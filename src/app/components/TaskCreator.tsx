'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Polyline, Polygon } from 'react-leaflet';
import { supabase } from '@/lib/supabase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// İkon düzeltmesi
if (typeof window !== 'undefined') {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

export default function TaskCreator() {
  const [taskName, setTaskName] = useState('');
  const [mode, setMode] = useState<'point' | 'line' | 'area'>('point');
  const [coords, setCoords] = useState<[number, number][]>([]);

  // Tıklama olaylarını yöneten iç bileşen
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        const newCoord: [number, number] = [e.latlng.lat, e.latlng.lng];
        
        setCoords((prev) => {
          if (mode === 'point') return [newCoord]; // Nokta ise tek koordinat tut
          return [...prev, newCoord]; // Çizgi/Alan ise üzerine ekle
        });
      },
    });
    return null;
  };

  const saveTask = async () => {
    if (coords.length === 0 || !taskName) return alert("İsim ve harita seçimi eksik!");
    
    let wkt = "";
    const lats = coords.map(c => `${c[1]} ${c[0]}`).join(', ');

    if (mode === 'point') wkt = `POINT(${coords[0][1]} ${coords[0][0]})`;
    else if (mode === 'line') wkt = `LINESTRING(${lats})`;
    else if (mode === 'area') {
      if (coords.length < 3) return alert("Alan için en az 3 nokta gerekli!");
      wkt = `POLYGON((${lats}, ${coords[0][1]} ${coords[0][0]}))`;
    }

    const { error } = await supabase.from('gis_tasks').insert([{
      title: taskName,
      task_type: mode,
      geometry: wkt,
      task_code: Math.random().toString(36).substring(7).toUpperCase()
    }]);

    if (error) alert("Hata: " + error.message);
    else {
      alert("Görev başarıyla kaydedildi!");
      setCoords([]);
      setTaskName('');
    }
  };

  return (
    <div className="flex flex-col w-full bg-slate-800 rounded-lg overflow-hidden border border-slate-700 shadow-xl">
      {/* Kontrol Paneli */}
      <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          {['point', 'line', 'area'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m as any); setCoords([]); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === m ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {m === 'point' ? '📍 Nokta' : m === 'line' ? '🛤️ Çizgi' : '📐 Alan'}
            </button>
          ))}
        </div>
        
        {/* Temizle Düğmesi - Görünürlük Garantili */}
        <button 
          onClick={() => setCoords([])} 
          className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/50 rounded-md text-sm hover:bg-red-500 hover:text-white transition-all"
        >
          🗑️ Çizimi Temizle
        </button>
      </div>

      <div className="p-4">
        <input 
          type="text" 
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="Görev adını giriniz..." 
          className="w-full p-3 bg-slate-950 border border-slate-700 rounded-md mb-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <div className="h-[450px] w-full rounded-md border border-slate-700 relative z-0">
          <MapContainer center={[39.12, 27.18]} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapEvents />
            
            {/* Çizimlerin Önizlemesi */}
            {mode === 'point' && coords.length > 0 && <Marker position={coords[0]} />}
            {mode === 'line' && coords.length > 1 && <Polyline positions={coords} color="#3b82f6" weight={4} />}
            {mode === 'area' && coords.length > 2 && <Polygon positions={coords} fillColor="#3b82f6" color="#2563eb" />}
            
            {/* Tıklanan her noktayı geçici marker olarak göster */}
            {mode !== 'point' && coords.map((c, i) => (
               <Marker key={i} position={c} opacity={0.6} />
            ))}
          </MapContainer>
        </div>

        <button 
          onClick={saveTask}
          disabled={coords.length === 0}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-md transition-colors"
        >
          Makroyu Kaydet ({coords.length} Nokta)
        </button>
      </div>
    </div>
  );
}