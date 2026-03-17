'use client';

import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });

interface ComparativeMapProps {
  referenceGeoJSON?: any;
  studentGeoJSON?: any;
}

export default function ComparativeMap({ referenceGeoJSON, studentGeoJSON }: ComparativeMapProps) {
  useEffect(() => {
    // Leaflet ikon hatası çözümü
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  return (
    <MapContainer center={[39.12, 27.18]} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {/* Öğretmen Referans Çizimi (Mavi) */}
      {referenceGeoJSON && (
        <GeoJSON
          data={referenceGeoJSON}
          style={() => ({ color: '#3b82f6', weight: 4, opacity: 0.6, dashArray: '5, 5' })}
        />
      )}
      
      {/* Öğrenci Çizimi (Kırmızı) */}
      {studentGeoJSON && (
        <GeoJSON
          data={studentGeoJSON}
          style={() => ({ color: '#ef4444', weight: 4, opacity: 0.8 })}
        />
      )}
    </MapContainer>
  );
}