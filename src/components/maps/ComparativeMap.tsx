'use client';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface ComparativeMapProps {
  teacherData: any; // Referans Geometri
  studentData: any; // Öğrenci Çizimi
}

export default function ComparativeMap({ teacherData, studentData }: ComparativeMapProps) {
  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-slate-700">
      <MapContainer center={[39.12, 27.18]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />
        
        {/* Öğretmenin Referans Verisi (Mavi) */}
        {teacherData && (
          <GeoJSON data={teacherData} style={{ color: '#2563eb', weight: 4, fillOpacity: 0.2 }} />
        )}
        
        {/* Öğrencinin Çizimi (Kırmızı) */}
        {studentData && (
          <GeoJSON data={studentData} style={{ color: '#dc2626', weight: 3, dashArray: '5, 5' }} />
        )}
      </MapContainer>
    </div>
  );
}