'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [address, setAddress] = useState('');
  const [pin, setPin] = useState('');
  const [plan, setPlan] = useState('free');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-xl animate-pulse">Lade Onboarding...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (pin.length !== 4 || isNaN(Number(pin))) {
      setError('Die Sicherheits-PIN muss genau 4 Ziffern lang sein.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          username: user.username || user.firstName || 'User',
          fullName,
          birthday,
          address,
          pin,
          plan,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Onboarding');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Etwas ist schiefgelaufen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 p-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
            BANK OF ARIEN
          </h1>
          <p className="mt-2 text-sm text-slate-400">Verifizieren Sie Ihre Identität zur Kontoeröffnung</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/20 p-3 text-sm text-red-300 border border-red-500/30">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Vollständiger Name</label>
            <input
              type="text"
              required
              placeholder="Max Mustermann"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder-slate-500 outline-none focus:border-violet-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Geburtsdatum</label>
            <input
              type="date"
              required
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-violet-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Adresse</label>
            <input
              type="text"
              required
              placeholder="Musterstraße 1, 12345 Musterstadt"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder-slate-500 outline-none focus:border-violet-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Sicherheits-PIN (4 Ziffern)</label>
            <input
              type="password"
              required
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder-slate-500 outline-none text-center tracking-widest text-lg focus:border-violet-500 transition-all"
            />
            <p className="mt-1 text-[10px] text-slate-400">Wird zur Bestätigung von Überweisungen benötigt.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Gewünschter Kontoplan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-violet-500 transition-all"
            >
              <option value="free" className="bg-slate-900">Free (Standard)</option>
              <option value="premium" className="bg-slate-900">Premium (€9,99 / Monat - Simuliert)</option>
              <option value="elite" className="bg-slate-900">Elite (€29,99 / Monat - Simuliert)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 p-3.5 font-semibold text-white shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Konto wird eingerichtet...' : 'Konto jetzt eröffnen'}
          </button>
        </form>

        <div className="mt-6 text-center text-[10px] text-slate-500">
          BANK OF ARIEN – Nur zu Simulationszwecken. Kein echtes Geld.
        </div>
      </div>
    </div>
  );
}
