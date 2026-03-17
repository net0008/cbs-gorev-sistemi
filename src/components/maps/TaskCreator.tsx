'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet ikon hatası çözümü
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

export default function TaskCreator() {
  const [position, setPosition] = useState<[number, number] | null>(null);

  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      <div className="h-[500px] w-full rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shadow-inner">
        <MapContainer center={[39.12, 27.18]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {position && <Marker position={position}><Popup>Yeni Görev Noktası</Popup></Marker>}
        </MapContainer>
      </div>
      <p className="text-center text-slate-400 text-sm italic">
        Bergama arazisi üzerine tıklayarak görev noktası belirleyebilirsiniz.
      </p>
    </div>
  );
}