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
        center={[39.079, 34.146]} // Türkiye geneli
        zoom={6}
        className="absolute top-0 left-0 w-full h-full z-0"
      >
        <TileLayer
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        />
      </MapBackground>
      <div className="relative z-10 w-full max-w-2xl p-8 bg-white/15 dark:bg-black/20 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 text-center">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full animate-pulse ring-2 ring-blue-500 shadow-lg shadow-blue-500/20">
            <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
          </div>
          Coğrafi Bilgi Sistemleri'ni Öğreniyorum
        </h1>
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