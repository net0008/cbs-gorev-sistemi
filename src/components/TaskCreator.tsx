import { useState } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker } from 'react-leaflet';
import { supabase } from '@/lib/supabase';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

// Next.js ile Leaflet ikonlarının haritada görünmeme sorununu çözen yerleşik yöntem
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function TaskCreator() {
  const [taskName, setTaskName] = useState('');
  const [point, setPoint] = useState<[number, number] | null>(null);

  // Haritaya tıklamayı yakalayan bileşen
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        setPoint([e.latlng.lat, e.latlng.lng]);
        console.log("Koordinat Yakalandı:", e.latlng);
      },
    });
    return point ? <Marker position={point} /> : null;
  };

  const saveTask = async () => {
    if (!point || !taskName) return alert("İsim ve nokta eksik!");

    // PostGIS için GeoJSON formatı
    const geojson = {
      type: 'Point',
      coordinates: [point[1], point[0]] // [boylam, enlem] - Standart GIS sırası
    };

    const { data, error } = await supabase
      .from('gis_tasks')
      .insert([
        { 
          title: taskName, 
          task_type: 'point', 
          geometry: geojson, // Supabase bunu otomatik olarak Geography tipine çevirir
          task_code: Math.random().toString(36).substring(7).toUpperCase()
        }
      ]);

    if (error) console.error("Hata:", error.message);
    else alert("Görev Başarıyla Kaydedildi!");
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <input 
        type="text" 
        placeholder="Görev Adı Belirleyin" 
        className="p-2 border rounded text-black"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
      />
      <div className="h-[400px] w-full rounded-lg overflow-hidden border">
        <MapContainer center={[39.12, 27.18]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler />
        </MapContainer>
      </div>
      <button onClick={saveTask} className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700">
        Makroyu Kaydet ve Görevi Oluştur
      </button>
    </div>
  );
}