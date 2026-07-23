'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, KeyRound, User } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/admin/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login fehlgeschlagen');
      }

      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Ungültige Zugangsdaten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 text-white">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-2">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black tracking-widest text-zinc-100 uppercase">BANK OF ARIEN</h1>
          <p className="text-xs text-zinc-500">INTERNER MITARBEITER-BEREICH</p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/20 p-3 text-xs text-red-400 border border-red-500/30 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Benutzername</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Mitarbeiter-ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-10 pr-3 py-2.5 text-sm text-white placeholder-zinc-700 outline-none focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Passwort</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-10 pr-3 py-2.5 text-sm text-white placeholder-zinc-700 outline-none focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-sm font-bold text-slate-950 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
          >
            {loading ? 'Anmelden...' : 'Sicher Einloggen'}
          </button>
        </form>

        <div className="text-center">
          <a href="/" className="text-[10px] text-zinc-600 hover:text-zinc-400 underline">Zurück zur Hauptseite</a>
        </div>
      </div>
    </div>
  );
}
