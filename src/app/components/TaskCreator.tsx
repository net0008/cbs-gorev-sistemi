import { useState } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker } from 'react-leaflet';
import { supabase } from '@/lib/supabase';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import "leaflet-defaulticon-compatibility";

export default function TaskCreator() {
  const [taskName, setTaskName] = useState('');
  const [point, setPoint] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Haritaya tıklamayı yakalayan bileşen
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        if (isLoading) return;
        setPoint([e.latlng.lat, e.latlng.lng]);
        setStatusMessage(null);
        console.log("Koordinat Yakalandı:", e.latlng);
      },
    });
    return point ? <Marker position={point} /> : null;
  };

  const saveTask = async () => {
    setStatusMessage(null);
    if (!point || !taskName.trim()) {
      setStatusMessage({ type: 'error', message: "Görev adı ve haritadan bir nokta seçimi zorunludur!" });
      return;
    }

    setIsLoading(true);

    // PostGIS için GeoJSON formatı
    const geojson = {
      type: 'Point',
      coordinates: [point[1], point[0]] // [boylam, enlem] - Standart GIS sırası
    };

    try {
      const { error } = await supabase
        .from('gis_tasks')
        .insert([
          { 
            title: taskName.trim(), 
            task_type: 'point', 
            geometry: geojson, // Supabase bunu otomatik olarak Geography tipine çevirir
            task_code: Math.random().toString(36).substring(7).toUpperCase()
          }
        ]);

      if (error) {
        throw error;
      }

      setStatusMessage({ type: 'success', message: "Görev başarıyla kaydedildi!" });
      setTaskName('');
      setPoint(null);
    } catch (error: any) {
      console.error("Hata:", error.message);
      setStatusMessage({ type: 'error', message: `Bir hata oluştu: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <input 
        type="text" 
        placeholder="Görev Adı Belirleyin" 
        className="p-2 border rounded text-black disabled:bg-gray-200"
        value={taskName}
        onChange={(e) => {
          setTaskName(e.target.value);
          if (statusMessage) setStatusMessage(null);
        }}
        disabled={isLoading}
      />
      <div className="h-[400px] w-full rounded-lg overflow-hidden border border-slate-600 relative">
        <MapContainer center={[39.12, 27.18]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler />
        </MapContainer>
      </div>
      {statusMessage && (
        <p className={`text-sm ${statusMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {statusMessage.message}
        </p>
      )}
      <button 
        onClick={saveTask} 
        className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {isLoading ? 'Kaydediliyor...' : 'Makroyu Kaydet ve Görevi Oluştur'}
      </button>
    </div>
  );
}