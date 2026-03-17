'use client';

import { useState, useRef, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const FeatureGroup = dynamic(() => import('react-leaflet').then(mod => mod.FeatureGroup), { ssr: false });

// react-leaflet-draw SSR uyumlu olmadığından, EditControl bileşenini dinamik olarak ve sadece istemci tarafında yüklüyoruz.
const EditControl = dynamic(
  () => import('react-leaflet-draw').then(mod => mod.EditControl),
  { ssr: false }
);
import "leaflet-draw/dist/leaflet.draw.css"

export default function TaskCreator() {
  const [taskName, setTaskName] = useState<string>('');
  const [drawnItems, setDrawnItems] = useState<Record<string, any> | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup>(null);

  // Leaflet ikon hatasını sadece istemci tarafında çalışacak bir useEffect içinde çözüyoruz.
  // Bu, "window is not defined" hatasını engeller.
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

  const onEdited = () => {
    if (featureGroupRef.current) {
      setDrawnItems(featureGroupRef.current.toGeoJSON());
    }
  };

  const onDeleted = () => {
    if (featureGroupRef.current) {
      setDrawnItems(featureGroupRef.current.toGeoJSON());
    }
  };

  const handleSaveTask = () => {
    if (!taskName || !drawnItems) {
      alert('Lütfen görev adı girin ve haritaya bir öğe çizin.');
      return;
    }
    // Burada Supabase'e kaydetme mantığı eklenebilir.
    console.log('Görev Kaydediliyor:', { taskName, geometry: drawnItems });
    alert(`'${taskName}' görevi kaydedildi!`);
  };

  return (
    <div className="flex flex-col gap-4 p-4 h-full bg-card text-foreground">
      <h2 className="text-xl font-semibold">Görev Oluştur</h2>
      <input
        type="text"
        placeholder="Görev Adı"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        className="w-full p-2 border border-border rounded bg-background text-foreground"
      />

      <div className="h-[500px] w-full rounded-lg overflow-hidden border border-border shadow-inner">
        <MapContainer center={[39.12, 27.18]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FeatureGroup ref={featureGroupRef}>
            <EditControl position="topright" onCreated={onCreated} onEdited={onEdited} onDeleted={onDeleted} draw={{ rectangle: false, circle: false, circlemarker: false }} />
          </FeatureGroup>
        </MapContainer>
      </div>
      <button onClick={handleSaveTask} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Görevi Kaydet
      </button>
    </div>
  );
}