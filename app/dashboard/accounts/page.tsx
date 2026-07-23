'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Wallet, Plus, ShieldAlert, Sparkles } from 'lucide-react';

export default function AccountsPage() {
  const { user, isLoaded } = useUser();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [newAccType, setNewAccType] = useState('checking');
  const [newAccName, setNewAccName] = useState('Zusatzkonto');

  async function fetchAccounts() {
    try {
      const res = await fetch('/api/db/accounts');
      const data = await res.json();
      if (data?.accounts) setAccounts(data.accounts);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    async function init() {
      if (!user) return;
      setLoading(true);

      try {
        const userRes = await fetch('/api/db/user');
        const userData = await userRes.json();
        if (userData?.user) {
          setDbUser(userData.user);
        }
        await fetchAccounts();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded && user) {
      init();
    }
  }, [user, isLoaded]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbUser) return;
    setCreating(true);
    setError('');
    setSuccess('');

    // Check Plan Limits
    if (dbUser.plan === 'free') {
      const existingChecking = accounts.filter(a => a.type === 'checking');
      if (newAccType === 'checking' && existingChecking.length >= 1) {
        setError('Im Free-Plan ist nur ein Girokonto (Checking) erlaubt. Führen Sie ein Upgrade auf Premium oder Elite durch.');
        setCreating(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/db/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAccName,
          type: newAccType
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Erstellen des Kontos');
      }

      setSuccess(`Konto "${newAccName}" erfolgreich erstellt.`);
      setNewAccName('Zusatzkonto');
      await fetchAccounts();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen des Kontos');
    } finally {
      setCreating(false);
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
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Meine Konten</h1>
        <p className="text-sm text-slate-400 mt-1">Verwalten Sie Ihre Konten, erstellen Sie Unterkonten und prüfen Sie Ihre Salden.</p>
      </div>

      {dbUser?.is_frozen && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>Ihre Kontofunktionen sind derzeit eingefroren.</span>
        </div>
      )}

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map((acc) => (
          <div key={acc.id} className="relative overflow-hidden p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl flex flex-col justify-between min-h-[180px] group hover:border-white/20 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-violet-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {acc.type === 'checking' ? 'Girokonto (Checking)' : acc.type === 'savings' ? 'Sparkonto' : 'Kreditkonto'}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">{acc.name}</h3>
                </div>
                <Wallet className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-xs font-mono text-slate-400 bg-white/5 rounded-lg px-2 py-1.5 inline-block mt-3 tracking-wide">{acc.iban}</p>
            </div>

            <div className="mt-6 flex justify-between items-baseline">
              <span className="text-2xl font-black text-white">
                {Number(acc.balance).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{acc.currency}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Account Creation Block */}
      {!dbUser?.is_frozen && (
        <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-blue-400" />
            <span>Neues Konto eröffnen</span>
          </h2>

          {error && <div className="mb-4 rounded-xl bg-red-500/15 p-3 text-sm text-red-300 border border-red-500/20">{error}</div>}
          {success && <div className="mb-4 rounded-xl bg-emerald-500/15 p-3 text-sm text-emerald-300 border border-emerald-500/20">{success}</div>}

          <form onSubmit={handleCreateAccount} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Konto-Name</label>
              <input
                type="text"
                required
                value={newAccName}
                onChange={(e) => setNewAccName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-blue-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Konto-Typ</label>
              <select
                value={newAccType}
                onChange={(e) => setNewAccType(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-blue-500 transition-all text-sm"
              >
                <option value="checking" className="bg-slate-900">Girokonto (Checking)</option>
                <option value="savings" className="bg-slate-900">Sparkonto (Savings)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 p-3 text-sm font-bold shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
            >
              {creating ? 'Erstelle...' : 'Eröffnen'}
            </button>
          </form>

          {dbUser?.plan === 'free' && (
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-400/90 font-medium">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>Tipp: Schalten Sie Premium oder Elite frei, um unbegrenzt Girokonten und Sparkonten anzulegen!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
