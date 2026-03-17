export default function ContentPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 border-b border-border pb-4">
        9. Sınıf - Hazır İçerikler
      </h1>
      <p className="mb-6 text-foreground/80">
        Aşağıdaki konulardan birini seçerek ilgili test ve materyallere ulaşabilirsiniz.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Örnek Kart */}
        <div className="bg-card p-6 rounded-lg shadow-md border border-border hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Doğa ve İnsan Etkileşimi</h2>
          <p className="text-foreground/70">İnsanın doğa üzerindeki etkileri ve doğanın insan yaşamına etkileri.</p>
        </div>
        {/* Örnek Kart */}
        <div className="bg-card p-6 rounded-lg shadow-md border border-border hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Dünya’nın Şekli ve Hareketleri</h2>
          <p className="text-foreground/70">Dünya'nın geoit şekli, kendi ekseni ve Güneş etrafındaki hareketlerinin sonuçları.</p>
        </div>
        {/* Örnek Kart */}
        <div className="bg-card p-6 rounded-lg shadow-md border border-border hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Harita Bilgisi ve İzohipsler</h2>
          <p className="text-foreground/70">Harita unsurları, projeksiyon yöntemleri ve izohipslerle yer şekillerini gösterme.</p>
        </div>
      </div>
    </div>
  );
}