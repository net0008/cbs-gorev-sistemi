'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Polyline, Polygon } from 'react-leaflet';
import { supabase } from '@/lib/supabase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// İkon Fix
if (typeof window !== 'undefined') {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  });
}

export default function TaskCreator() {
  const [taskName, setTaskName] = useState('');
  const [mode, setMode] = useState<'point' | 'line' | 'area' | 'route'>('point');
  const [coords, setCoords] = useState<[number, number][]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Yol Tarifi Hesaplama (OSRM API)
  const getRoute = async (start: [number, number], end: [number, number]) => {
    setIsLoading(true);
    try {
      const resp = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
      const data = await resp.json();
      if (data.routes && data.routes[0]) {
        // GeoJSON'dan koordinatları [lat, lng] formatına çevir
        const routeCoords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
        setCoords(routeCoords);
      }
    } catch (err) {
      alert("Yol tarifi alınamadı.");
    } finally {
      setIsLoading(false);
    }
  };

  // Tıklama Yakalayıcı - Functional Update (prev => ...) kullanarak tek tık sorununu çözüyoruz
  const MapEvents = () => {
    useMapEvents({
      async click(e) {
        const newCoord: [number, number] = [e.latlng.lat, e.latlng.lng];
        
        if (mode === 'route') {
          if (coords.length === 0) {
            setCoords([newCoord]);
          } else if (coords.length === 1) {
            await getRoute(coords[0], newCoord);
          }
        } else {
          setCoords((prev) => (mode === 'point' ? [newCoord] : [...prev, newCoord]));
        }
      },
    });
    return null;
  };

  const saveTask = async () => {
    if (coords.length === 0 || !taskName) return alert("Hata: İsim veya seçim eksik!");
    
    let wkt = "";
    const wktCoords = coords.map(c => `${c[1]} ${c[0]}`).join(', ');

    if (mode === 'point') wkt = `POINT(${coords[0][1]} ${coords[0][0]})`;
    else if (mode === 'line' || mode === 'route') wkt = `LINESTRING(${wktCoords})`;
    else if (mode === 'area') wkt = `POLYGON((${wktCoords}, ${coords[0][1]} ${coords[0][0]}))`;

    const { error } = await supabase.from('gis_tasks').insert([{
      title: taskName, task_type: mode, geometry: wkt,
      task_code: Math.random().toString(36).substring(7).toUpperCase()
    }]);

    if (error) alert(error.message);
    else { alert("Görev Başarıyla Kaydedildi!"); setCoords([]); setTaskName(''); }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-800 rounded-lg shadow-xl">
      {/* Türkçe Butonlar ve Mod Seçici */}
      <div className="flex justify-between items-center bg-slate-900 p-3 rounded-md">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => {setMode('point'); setCoords([]);}} className={`px-3 py-1 rounded text-sm font-bold ${mode === 'point' ? 'bg-blue-600' : 'bg-slate-700'}`}>NOKTA</button>
          <button onClick={() => {setMode('line'); setCoords([]);}} className={`px-3 py-1 rounded text-sm font-bold ${mode === 'line' ? 'bg-blue-600' : 'bg-slate-700'}`}>ÇİZGİ</button>
          <button onClick={() => {setMode('area'); setCoords([]);}} className={`px-3 py-1 rounded text-sm font-bold ${mode === 'area' ? 'bg-blue-600' : 'bg-slate-700'}`}>ALAN</button>
          <button onClick={() => {setMode('route'); setCoords([]);}} className={`px-3 py-1 rounded text-sm font-bold ${mode === 'route' ? 'bg-blue-600' : 'bg-slate-700'}`}>YOL TARİFİ</button>
        </div>
        <button onClick={() => setCoords([])} className="bg-red-600 px-3 py-1 rounded text-xs font-bold text-white hover:bg-red-500">TEMİZLE</button>
      </div>

      <input type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)}
        placeholder="Görev/Formasyon Adı Giriniz" className="p-2 bg-slate-950 border border-slate-700 rounded text-white outline-none focus:ring-2 focus:ring-blue-500" />

      <div className="h-[450px] rounded-lg overflow-hidden border-2 border-slate-700 relative">
        {isLoading && <div className="absolute inset-0 bg-black/50 z-[1000] flex items-center justify-center text-white">Yol Hesaplanıyor...</div>}
        <MapContainer center={[39.12, 27.18]} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapEvents />
          
          {(mode === 'point' || (mode === 'route' && coords.length === 1)) && coords.length > 0 && <Marker position={coords[0]} />}
          {mode === 'route' && coords.length > 1 && (
            <>
              <Marker position={coords[0]} />
              <Polyline positions={coords} color="red" weight={5} />
              <Marker position={coords[coords.length - 1]} />
            </>
          )}
          {mode === 'line' && coords.length > 1 && <Polyline positions={coords} color="cyan" />}
          {mode === 'area' && coords.length > 2 && <Polygon positions={coords} color="lime" />}
          {mode !== 'point' && mode !== 'route' && coords.map((c, i) => <Marker key={i} position={c} opacity={0.5} />)}
        </MapContainer>
      </div>

      <button onClick={saveTask} className="bg-blue-600 py-3 rounded-lg font-bold hover:bg-blue-500 transition-colors">
        MAKROYU KAYDET ({coords.length} Nokta Verisi)
      </button>
    </div>
  );
}