import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 text-white">
      {/* Navbar */}
      <header className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 flex items-center justify-center font-black text-lg tracking-widest shadow-lg">
            A
          </div>
          <span className="text-xl font-bold tracking-wider">BANK OF ARIEN</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/sign-in" className="px-4 py-2 text-sm font-medium hover:text-blue-400 transition-colors">
            Einloggen
          </Link>
          <Link href="/sign-up" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 font-semibold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all">
            Konto eröffnen
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto py-20">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-blue-300 mb-8 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          <span>Simulation – Kein echtes Geld</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          Die Banking-Erfahrung der{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-amber-300">
            nächsten Generation
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
          Erleben Sie vollfunktionsfähiges Banking im atemberaubenden Liquid-Glass Design. Kostenloses Girokonto, intelligente Sparziele, simulierte Kredite und ein vollwertiges Admin-Panel.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
          <Link href="/sign-up" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 font-bold shadow-xl shadow-violet-500/10 hover:brightness-110 active:scale-95 transition-all">
            Jetzt kostenlos starten
          </Link>
          <Link href="/admin/login" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 active:scale-95 transition-all">
            Admin-Portal
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full">
          <div className="p-6 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl text-left">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 font-bold text-xl">
              01
            </div>
            <h3 className="font-bold text-lg mb-2">Liquid Glass Design</h3>
            <p className="text-sm text-slate-400">Atemberaubende halbtransparente Glaseffekte, weiche Farbverläufe und flüssige Animationen.</p>
          </div>

          <div className="p-6 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl text-left">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4 font-bold text-xl">
              02
            </div>
            <h3 className="font-bold text-lg mb-2">Echte Mechanismen</h3>
            <p className="text-sm text-slate-400">Atomare Transaktionen per RPC, echte Zinsläufe, Daueraufträge, Kreditanträge und Kartenverwaltung.</p>
          </div>

          <div className="p-6 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl text-left">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 font-bold text-xl">
              03
            </div>
            <h3 className="font-bold text-lg mb-2">Unabhängiger Admin</h3>
            <p className="text-sm text-slate-400">Ein komplett eigenständiges Admin-Dashboard mit Benutzermanagement, Fraud-Locking und Direktauszahlungen.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-slate-500 border-t border-white/5 max-w-7xl mx-auto w-full">
        <p className="mb-2">BANK OF ARIEN – Eine anspruchsvolle Full-Stack Demo-Banking-App.</p>
        <p>Entwickelt von Jules. Es handelt sich um Spielgeld. Keine Verbindung zu echten Finanzinstituten.</p>
      </footer>
    </div>
  );
}
