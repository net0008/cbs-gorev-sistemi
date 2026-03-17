export default function ContentPage() {
  return (
    <div className="bg-card p-6 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 border-b border-border pb-4">
        10. Sınıf - Hazır İçerikler
      </h1>
      <p className="mb-6 text-foreground/80">
        Aşağıdaki konulardan birini seçerek ilgili test ve materyallere ulaşabilirsiniz.
      </p>
      <ul className="list-disc list-inside space-y-3">
        <li className="text-lg">Yer'in Yapısı ve Oluşum Süreçleri</li>
        <li className="text-lg">Su Kaynakları</li>
        <li className="text-lg">Türkiye'nin Yer Şekilleri (Horst-Graben Sistemleri)</li>
      </ul>
    </div>
  );
}