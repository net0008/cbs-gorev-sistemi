export default function Footer() {
  return (
    <footer className="w-full bg-slate-900 border-t border-slate-800 p-8 mt-auto">
      <div className="container mx-auto text-center">
        <p className="text-slate-500 text-sm">
          © {new Date().getFullYear()} Bergama CBS Projesi. Jeoloji ve Coğrafya Eğitimi İçin Tasarlanmıştır.
        </p>
        <div className="mt-2 text-xs text-slate-600">Geliştirici: Hasbi Erdoğmuş</div>
      </div>
    </footer>
  );
}