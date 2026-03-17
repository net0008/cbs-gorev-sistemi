export default function ContentPage() {
  return (
    <div className="bg-card p-6 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 border-b border-border pb-4">
        9. Sınıf - Hazır İçerikler
      </h1>
      <p className="mb-6 text-foreground/80">
        Aşağıdaki konulardan birini seçerek ilgili test ve materyallere ulaşabilirsiniz.
      </p>
      <ul className="list-disc list-inside space-y-3">
        <li className="text-lg">Doğa ve İnsan</li>
        <li className="text-lg">Dünya'nın Şekli ve Hareketleri</li>
        <li className="text-lg">Harita Bilgisi</li>
      </ul>
    </div>
  );
}