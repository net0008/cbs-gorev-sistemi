'use client';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface ComparativeMapProps {
  referenceGeoJSON: any;
  studentGeoJSON: any;
}

export default function ComparativeMap({ referenceGeoJSON, studentGeoJSON }: ComparativeMapProps) {
  return (
    <div className="h-full w-full">
      <MapContainer center={[39.12, 27.18]} zoom={13} className="h-full w-full">
        <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />
        {referenceGeoJSON && (
          <GeoJSON data={referenceGeoJSON} style={{ color: '#2563eb', weight: 4, fillOpacity: 0.2 }} />
        )}
        {studentGeoJSON && (
          <GeoJSON data={studentGeoJSON} style={{ color: '#dc2626', weight: 3, dashArray: '5, 5' }} />
        )}
      </MapContainer>
    </div>
  );
}