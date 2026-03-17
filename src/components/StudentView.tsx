'use client';

import { useState, useEffect } from 'react';
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

// WKT (Well-Known Text) formatını GeoJSON formatına çeviren yardımcı fonksiyon
const parseWKT = (wkt: string): { type: string; coordinates: any } | null => {
  if (!wkt) return null;
  const typeMatch = wkt.match(/^(\w+)/);
  if (!typeMatch) return null;
  const type = typeMatch[1].toUpperCase();

  const coordStringMatch = wkt.match(/\((.*)\)/);
  if (!coordStringMatch) return null;
  let coordString = coordStringMatch[1];

  try {
    if (type === 'POINT') {
      const [lng, lat] = coordString.split(' ').map(parseFloat);
      return { type: 'Point', coordinates: [lat, lng] };
    }
    if (type === 'LINESTRING') {
      const coordinates = coordString.split(', ').map(pair => {
        const [lng, lat] = pair.split(' ').map(parseFloat);
        return [lat, lng];
      });
      return { type: 'LineString', coordinates };
    }
    if (type === 'POLYGON') {
      coordString = coordString.replace(/^\(|\)$/g, ''); // Dış parantezleri kaldır
      const coordinates = coordString.split(', ').map(pair => {
        const [lng, lat] = pair.split(' ').map(parseFloat);
        return [lat, lng];
      });
      return { type: 'Polygon', coordinates: [coordinates] }; // GeoJSON için ekstra dizi katmanı
    }
  } catch (e) {
    console.error("WKT Ayrıştırma Hatası:", e);
    return null;
  }
  return null;
};

// Haritayı bulunan geometriye odaklamak için yardımcı bileşen
function MapUpdater({ geometry }: { geometry: any }) {
  const map = useMap();
  useEffect(() => {
    if (!geometry) return;
    const layer = L.geoJSON(geometry);
    map.fitBounds(layer.getBounds().pad(0.1));
  }, [geometry, map]);
  return null;
}

export default function StudentView() {
  const [inputCode, setInputCode] = useState('');
  const [taskGeometry, setTaskGeometry] = useState<any | null>(null);
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
    setTaskGeometry(null);
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
        // Veritabanından gelen WKT string'ini ayrıştır
        if (data.geometry) {
          const parsedGeometry = parseWKT(data.geometry);
          setTaskGeometry(parsedGeometry);
          setTaskDetails(data); // Diğer görev detaylarını state'e ata
        } else {
          setErrorMessage('Görevin koordinat bilgisi (geometri) bulunamadı.');
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
        <MapContainer center={[39.12, 27.18]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {taskGeometry && (
            <>
              <MapUpdater geometry={taskGeometry} />
              {taskGeometry.type === 'Point' && <Marker position={taskGeometry.coordinates}>
                <Popup>{taskDetails?.title || 'Hedef Nokta'}</Popup>
              </Marker>}
              {taskGeometry.type === 'LineString' && <L.GeoJSON data={taskGeometry} style={{ color: 'red', weight: 5 }} />}
              {taskGeometry.type === 'Polygon' && <L.GeoJSON data={taskGeometry} style={{ color: 'lime' }} />}
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}