'use client';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';

// Harita bileşenini, sunucu tarafında render edilmeyecek şekilde (SSR: false) dinamik olarak yüklüyoruz.
// Bu, sadece tarayıcıda çalışması gereken kütüphaneler için en doğru yöntemdir.
const MapBackground = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="relative w-full h-[calc(100vh-150px)] flex items-center justify-center -mt-4 -mb-4">
      <MapBackground
        center={[39.12, 27.18]} // Bergama merkezli
        zoom={12}
        className="absolute top-0 left-0 w-full h-full z-0"
        dragging={false}
        touchZoom={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        />
      </MapBackground>
      <div className="relative z-10 w-full max-w-2xl p-8 bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 text-center">
        <h1 className="text-4xl font-bold mb-4">Coğrafi Bilgi Sistemleri'ni Öğreniyorum</h1>
        <p className="mb-6 text-lg text-foreground/90">
          Dijital araçlarla, CBS eğitiminde yeni nesil bir deneyim başlıyor.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
            Keşfetmeye Başla
          </button>
          <Link href="/teacher/9/content" className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded-lg transition-colors inline-flex items-center">
            Öğretmen Paneli'ne Git
          </Link>
        </div>
      </div>
    </div>
  );
}