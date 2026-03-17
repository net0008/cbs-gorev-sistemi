export default function Header() {
  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-[1001] shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌍</span>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Bergama CBS Görev Sistemi
          </h1>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-300">
          <a href="/" className="hover:text-white transition">Ana Sayfa</a>
          <a href="/teacher" className="hover:text-white transition">Öğretmen Paneli</a>
          <a href="/student" className="hover:text-white transition">Öğrenci Girişi</a>
        </nav>
      </div>
    </header>
  );
}