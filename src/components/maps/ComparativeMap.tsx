'use client';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });

// TypeScript tipi: EvaluationPanel ile %100 uyumlu olmalı
interface ComparativeMapProps {
  referenceGeoJSON?: any | null;
  studentGeoJSON?: any | null;
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
    <div className="h-full w-full min-h-[400px]">
      <MapContainer center={[39.12, 27.18]} zoom={13} className="h-full w-full relative z-0">
        <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />
        
        {/* Öğretmenin Referans Verisi (Maarif Modeli: Standart/Örnek Veri) */}
        {referenceGeoJSON && (
          <GeoJSON data={referenceGeoJSON} style={{ color: '#2563eb', weight: 4, fillOpacity: 0.2 }} />
        )}
        
        {/* Öğrencinin Çizimi (Maarif Modeli: Performans Kanıtı) */}
        {studentGeoJSON && (
          <GeoJSON data={studentGeoJSON} style={{ color: '#dc2626', weight: 3, dashArray: '5, 5' }} />
        )}
      </MapContainer>
    </div>
  );
}