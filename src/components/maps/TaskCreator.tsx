'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, FeatureGroup } from 'react-leaflet';
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

import { EditControl } from "react-leaflet-draw"
import "leaflet-draw/dist/leaflet.draw.css"

export default function TaskCreator() {
  const [taskName, setTaskName] = useState<string>('');
  const [drawnItems, setDrawnItems] = useState<any>(null); // Çizilen özellikleri depolamak için
  const featureGroupRef = useRef<L.FeatureGroup>(null);

  const _onCreated = (e: any) => {
    const { layerType, layer } = e;
    if (layerType === 'marker') {
      console.log('Marker created:', layer.getLatLng());
    } else if (layerType === 'polyline') {
      console.log('Polyline created:', layer.getLatLngs());
    } else if (layerType === 'polygon') {
      console.log('Polygon created:', layer.getLatLngs());
    }
    // Yeni katmanı drawnItems state'ine ekle
    if (featureGroupRef.current) {
      featureGroupRef.current.addLayer(layer);
      setDrawnItems(featureGroupRef.current.toGeoJSON()); // GeoJSON ile state'i güncelle
    }
  };

  const _onEdited = (e: any) => {
    console.log('Layer edited:', e);
    if (featureGroupRef.current) {
      setDrawnItems(featureGroupRef.current.toGeoJSON());
    }
  };

  const _onDeleted = (e: any) => {
    console.log('Layer deleted:', e);
    if (featureGroupRef.current) {
      setDrawnItems(featureGroupRef.current.toGeoJSON());
    }
  };

  const handleSaveTask = () => {
    console.log('Saving task:', taskName);
    console.log('Drawn items:', drawnItems);
    // Burada taskName ve drawnItems'ı backend'inize gönderebilirsiniz
    alert(`Görev kaydedildi: ${taskName}\nÇizilen öğeler: ${JSON.stringify(drawnItems)}`);
  };

  return (
    <div className="flex flex-col gap-4 p-4 h-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      <h2 className="text-xl font-semibold">Görev Oluştur</h2>
      <input
        type="text"
        placeholder="Görev Adı"
        className="w-full p-2 border rounded text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
      />

      {/* Çizim araçları (Nokta, Çizgi, Alan) EditControl tarafından sağlanır */}
      <div className="h-[500px] w-full rounded-lg overflow-hidden border border-slate-700 dark:border-gray-700 bg-slate-900 dark:bg-gray-900 shadow-inner">
        <MapContainer center={[39.12, 27.18]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FeatureGroup ref={featureGroupRef}>
            <EditControl
              position="topright" // Araç çubuğunu konumlandır
              onCreated={_onCreated}
              onEdited={_onEdited}
              onDeleted={_onDeleted}
              draw={{
                rectangle: false, // İstenmiyorsa dikdörtgen çizimini devre dışı bırak
                circlemarker: false, // İstenmiyorsa daire işaretleyici çizimini devre dışı bırak
                circle: false, // İstenmiyorsa daire çizimini devre dışı bırak
              }}
            />
          </FeatureGroup>
        </MapContainer>
      </div>
      <button
        onClick={handleSaveTask}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
      >
        Görevi Kaydet
      </button>
      <p className="text-center text-slate-400 dark:text-gray-400 text-sm italic">
        Harita üzerinde çizim araçlarını kullanarak görev noktaları, çizgileri veya alanları belirleyebilirsiniz.
      </p>
    </div>
  );
}