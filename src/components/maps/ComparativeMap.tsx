'use client';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// TypeScript tipi: EvaluationPanel ile tam uyumlu hale getirildi
interface ComparativeMapProps {
  referenceGeoJSON: any;
  studentGeoJSON: any;
}

export default function ComparativeMap({ referenceGeoJSON, studentGeoJSON }: ComparativeMapProps) {
  return (
    <div className="h-full w-full min-h-[400px]">
      <MapContainer center={[39.12, 27.18]} zoom={13} className="h-full w-full">
        <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />
        
        {/* Öğretmenin Referans Verisi (Mavi) */}
        {referenceGeoJSON && (
          <GeoJSON data={referenceGeoJSON} style={{ color: '#2563eb', weight: 4, fillOpacity: 0.2 }} />
        )}
        
        {/* Öğrencinin Çizimi (Kırmızı) */}
        {studentGeoJSON && (
          <GeoJSON data={studentGeoJSON} style={{ color: '#dc2626', weight: 3, dashArray: '5, 5' }} />
        )}
      </MapContainer>
    </div>
  );
}