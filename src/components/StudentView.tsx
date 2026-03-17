'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// Harita merkezini yeni bulunan koordinata kaydırmak için yardımcı bileşen
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 14); // Koordinata git ve yakınlaş (zoom: 14)
  return null;
}

export default function StudentView() {
  const [inputCode, setInputCode] = useState('');
  const [targetCoords, setTargetCoords] = useState<[number, number] | null>(null);
  const [taskDetails, setTaskDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchTask = async () => {
    if (!inputCode.trim()) {
      setErrorMessage('Lütfen bir görev kodu girin.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setTargetCoords(null);
    setTaskDetails(null);

    if (!supabase) {
      setErrorMessage('Veritabanı bağlantı hatası: Supabase ayarları eksik.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('gis_tasks')
        .select('*')
        .eq('task_code', inputCode.trim().toUpperCase()) // Küçük/büyük harf duyarlılığını önlemek için
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        // Supabase PostgREST, geography kolonunu GeoJSON olarak döndürür: { type: "Point", coordinates: [lng, lat] }
        if (data.geometry && data.geometry.coordinates) {
          // PostGIS verisini Leaflet'in beklediği [lat, lng] formatına çeviriyoruz
          const lat = data.geometry.coordinates[1];
          const lng = data.geometry.coordinates[0];
          
          setTargetCoords([lat, lng]);
          setTaskDetails(data);
        } else {
          setErrorMessage('Görevin koordinat bilgisi okunamadı.');
        }
      }
    } catch (error: any) {
      console.error("Supabase Hatası:", error.message);
      // "single()" fonksiyonu kayıt bulamazsa hata fırlatır, bunu kullanıcıya dostane gösterelim
      setErrorMessage('Görev bulunamadı. Lütfen kodu doğru girdiğinizden emin olun.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Görev Kodunu Girin (Örn: A1B2C)"
          className="flex-1 p-3 border rounded text-black uppercase"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value.toUpperCase())}
          disabled={isLoading}
        />
        <button
          onClick={fetchTask}
          className="bg-green-600 text-white p-3 rounded hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed font-semibold px-8"
          disabled={isLoading}
        >
          {isLoading ? 'Aranıyor...' : 'Görevi Bul'}
        </button>
      </div>

      {errorMessage && <p className="text-red-400 font-medium text-sm">{errorMessage}</p>}

      {taskDetails && (
        <div className="bg-slate-700 p-4 rounded-lg border border-slate-600 shadow-inner">
          <h3 className="text-xl font-bold text-green-400">{taskDetails.title}</h3>
          <p className="text-slate-300 text-sm mt-1">Bu görevi başarıyla buldunuz! Hedef haritada işaretlendi.</p>
        </div>
      )}

      <div className="h-[400px] w-full rounded-lg overflow-hidden border border-slate-600 relative bg-slate-800">
        <MapContainer center={targetCoords || [39.12, 27.18]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {targetCoords && (
            <>
              <MapUpdater center={targetCoords} />
              <Marker position={targetCoords}>
                <Popup>{taskDetails?.title || 'Hedef Nokta'}</Popup>
              </Marker>
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}