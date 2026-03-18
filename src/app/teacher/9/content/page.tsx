import MapReadingActivity from "@/components/activities/MapReadingActivity";

/**
 * 9. Sınıf için "Harita Okuryazarlığı: Haritanın Elemanları" etkinliğini görüntüleyen sayfa.
 * Bu sayfa, MapReadingActivity bileşenini kullanarak interaktif bir öğrenme deneyimi sunar.
 */
export default function MapElementsActivityPage() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-8">
      {/* Etkinlik bileşenini sayfanın ortasında ve geniş bir alanda göster */}
      <div className="w-full">
        <MapReadingActivity />
      </div>
    </div>
  );
}