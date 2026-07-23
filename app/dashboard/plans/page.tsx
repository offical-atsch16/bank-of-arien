'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Crown, CheckCircle, Star } from 'lucide-react';

export default function PlansPage() {
  const { user, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [success, setSuccess] = useState('');

  async function fetchUser() {
    try {
      const res = await fetch('/api/db/user');
      const data = await res.json();
      if (data?.user) setDbUser(data.user);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      await fetchUser();
      setLoading(false);
    }
    if (isLoaded && user) {
      init();
    }
  }, [user, isLoaded]);

  const handleUpgrade = async (plan: string) => {
    if (!dbUser) return;
    setUpgrading(true);
    setSuccess('');

    try {
      const res = await fetch('/api/db/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });

      if (!res.ok) throw new Error();

      setSuccess(`Herzlichen Glückwunsch! Ihr Konto wurde erfolgreich auf den ${plan.toUpperCase()}-Plan umgestellt.`);
      await fetchUser();
    } catch (err) {
      console.error(err);
    } finally {
      setUpgrading(false);
    }
  };

  if (!isLoaded || loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 w-40 bg-white/5 rounded"></div>
      <div className="h-40 bg-white/5 rounded-3xl"></div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Kontomodelle & Upgrades</h1>
        <p className="text-sm text-slate-400">Wählen Sie den perfekten Plan für Ihre finanziellen Ambitionen bei der BANK OF ARIEN.</p>
      </div>

      {success && (
        <div className="max-w-4xl mx-auto rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Plans comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
        {/* Free Plan */}
        <div className={`p-8 rounded-3xl border ${dbUser?.plan === 'free' ? 'border-blue-500 bg-blue-500/5' : 'border-white/5 bg-white/2'} backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-8`}>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">EINSTEIGER</span>
            <h3 className="text-2xl font-black text-white mt-1">Free</h3>
            <p className="text-xs text-slate-400 mt-2">Grundlegendes Banking für den täglichen Bedarf.</p>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">0,00 €</span>
              <span className="text-xs text-slate-500"> / Monat</span>
            </div>

            <ul className="space-y-3 mt-6 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                <span>1 Girokonto inklusive</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                <span>Standard-Debitkarte</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                <span>Tägliches Überweisungslimit: 500 €</span>
              </li>
            </ul>
          </div>

          <button
            disabled={dbUser?.plan === 'free'}
            className="w-full py-3 rounded-xl border border-white/10 text-xs font-bold disabled:opacity-50 hover:bg-white/5 transition-all"
          >
            {dbUser?.plan === 'free' ? 'Ihr aktueller Plan' : 'Standard'}
          </button>
        </div>

        {/* Premium Plan */}
        <div className={`p-8 rounded-3xl border ${dbUser?.plan === 'premium' ? 'border-violet-500 bg-violet-500/5' : 'border-white/10 bg-white/5'} backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-8 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase font-bold tracking-widest text-violet-400">EMPFOHLEN</span>
              <Star className="w-4 h-4 text-violet-400" />
            </div>
            <h3 className="text-2xl font-black text-white mt-1">Premium</h3>
            <p className="text-xs text-slate-400 mt-2">Vollständige finanzielle Freiheit mit intelligenten Extras.</p>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">9,99 €</span>
              <span className="text-xs text-slate-500"> / Monat (Simuliert)</span>
            </div>

            <ul className="space-y-3 mt-6 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-violet-400" />
                <span>Unbegrenzte Girokonten</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-violet-400" />
                <span>Sparbuch mit attraktiven Zinsen</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-violet-400" />
                <span>Umfangreiche Statistiken</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-violet-400" />
                <span>Limit: 5.000 € / Tag</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleUpgrade('premium')}
            disabled={upgrading || dbUser?.plan === 'premium'}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-xs font-bold shadow-md hover:brightness-110 disabled:opacity-50 transition-all text-white"
          >
            {dbUser?.plan === 'premium' ? 'Ihr aktueller Plan' : 'Für 9,99 € upgraden'}
          </button>
        </div>

        {/* Elite Plan */}
        <div className={`p-8 rounded-3xl border ${dbUser?.plan === 'elite' ? 'border-amber-500 bg-amber-500/5' : 'border-white/5 bg-white/2'} backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-8 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">EXKLUSIV</span>
              <Crown className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-white mt-1">Elite</h3>
            <p className="text-xs text-slate-400 mt-2">Das ultimative Premium-Erlebnis mit Priority-Support.</p>
            <div className="mt-4">
              <span className="text-3xl font-black text-white">29,99 €</span>
              <span className="text-xs text-slate-500"> / Monat (Simuliert)</span>
            </div>

            <ul className="space-y-3 mt-6 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>Alles aus Premium</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>Kredite zu Bestkonditionen</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>Black-Metal Kartendesign</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>Unbegrenztes Tageslimit</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleUpgrade('elite')}
            disabled={upgrading || dbUser?.plan === 'elite'}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-600 text-xs font-bold shadow-md hover:brightness-110 disabled:opacity-50 transition-all text-slate-950"
          >
            {dbUser?.plan === 'elite' ? 'Ihr aktueller Plan' : 'Für 29,99 € upgraden'}
          </button>
        </div>
      </div>
    </div>
  );
}
