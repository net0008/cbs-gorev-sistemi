import Sidebar from "./Sidebar";

export default function Header() {
  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-[1001] shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌍</span>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Bergama CBS
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Sidebar />
        </div>
      </div>
    </header>
  );
}
