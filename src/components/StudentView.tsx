'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet';
import { supabase } from '@/lib/supabase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet ikon sorununu çözen blok
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

// WKT -> GeoJSON (Standart Lng, Lat sırası)
const parseWKT = (wkt: string): any => {
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
      return { type: 'Point', coordinates: [lng, lat] };
    }
    if (type === 'LINESTRING') {
      const coordinates = coordString.split(/,\s*/).map(pair => {
        const [lng, lat] = pair.split(' ').map(parseFloat);
        return [lng, lat];
      });
      return { type: 'LineString', coordinates };
    }
    if (type === 'POLYGON') {
      coordString = coordString.replace(/^\(|\)$/g, ''); 
      const coordinates = coordString.split(/,\s*/).map(pair => {
        const [lng, lat] = pair.split(' ').map(parseFloat);
        return [lng, lat];
      });
      return { type: 'Polygon', coordinates: [coordinates] };
    }
  } catch (e) {
    console.error("Ayrıştırma Hatası:", e);
    return null;
  }
  return null;
};

function MapUpdater({ geometry }: { geometry: any }) {
  const map = useMap();
  useEffect(() => {
    if (geometry) {
      const layer = L.geoJSON(geometry);
      map.fitBounds(layer.getBounds().pad(0.2));
    }
  }, [geometry, map]);
  return null;
}

export default function StudentView() {
  const [inputCode, setInputCode] = useState('');
  const [taskGeometry, setTaskGeometry] = useState<any>(null);
  const [taskDetails, setTaskDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchTask = async () => {
    if (!inputCode.trim()) return setErrorMessage('Kod girin.');
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const { data, error } = await supabase
        .from('gis_tasks')
        .select('*')
        .eq('task_code', inputCode.trim().toUpperCase())
        .single();

      if (error) throw error;
      if (data?.geometry) {
        setTaskGeometry(parseWKT(data.geometry));
        setTaskDetails(data);
      }
    } catch (error: any) {
      setErrorMessage('Görev bulunamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-slate-200">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="GÖREV KODU"
          className="flex-1 p-3 rounded bg-slate-800 border border-slate-700 uppercase outline-none focus:border-blue-500"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
        />
        <button
          onClick={fetchTask}
          className="bg-blue-600 px-6 rounded font-bold hover:bg-blue-500 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? '...' : 'ARA'}
        </button>
      </div>

      {errorMessage && <p className="text-red-400 text-sm">{errorMessage}</p>}

      <div className="h-[450px] rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl">
        <MapContainer center={[39.12, 27.18]} zoom={13} style={{ height: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {taskGeometry && (
            <>
              <MapUpdater geometry={taskGeometry} />
              {taskGeometry.type === 'Point' && (
                <Marker position={[taskGeometry.coordinates[1], taskGeometry.coordinates[0]]}>
                  <Popup>{taskDetails?.title}</Popup>
                </Marker>
              )}
              {(taskGeometry.type === 'LineString' || taskGeometry.type === 'Polygon') && (
                <GeoJSON data={taskGeometry} style={{ color: '#3b82f6', weight: 4 }} />
              )}
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}