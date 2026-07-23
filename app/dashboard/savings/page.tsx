'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { PiggyBank, Plus, TrendingUp } from 'lucide-react';

export default function SavingsPage() {
  const { user, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Transfer inside targets state
  const [checkingAccount, setCheckingAccount] = useState('');
  const [savingsAccount, setSavingsAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);

  async function fetchAccounts() {
    try {
      const res = await fetch('/api/db/accounts');
      const data = await res.json();
      if (data?.accounts) {
        setAccounts(data.accounts);
        const checking = data.accounts.find((a: any) => a.type === 'checking');
        const savings = data.accounts.find((a: any) => a.type === 'savings');
        if (checking) setCheckingAccount(checking.id);
        if (savings) setSavingsAccount(savings.id);
      }
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

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkingAccount || !savingsAccount || !amount || Number(amount) <= 0) return;
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      // Create deposit via standard transfer endpoint, resolving recipient automatically
      const targetSavings = accounts.find(a => a.id === savingsAccount);
      if (!targetSavings) throw new Error('Sparkonto nicht gefunden.');

      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderAccountId: checkingAccount,
          receiverIbanOrTag: targetSavings.iban,
          amount,
          note: 'Einzahlung in Sparziel/Sparbuch',
          category: 'savings',
          pin: '1234', // default pin placeholder for internal transfers
          clerkId: user?.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Senden.');

      setSuccess(`Erfolgreich ${Number(amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} auf das Sparbuch eingezahlt!`);
      setAmount('');
      await fetchAccounts();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Einzahlen.');
    } finally {
      setProcessing(false);
    }
  };

  const checkingAccs = accounts.filter(a => a.type === 'checking');
  const savingsAccs = accounts.filter(a => a.type === 'savings');

  if (!isLoaded || loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 w-40 bg-white/5 rounded"></div>
      <div className="h-40 bg-white/5 rounded-3xl"></div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Sparziele & Sparbücher</h1>
        <p className="text-sm text-slate-400 mt-1">Legen Sie Geld beiseite und sichern Sie sich attraktive Zinsgutschriften von der Bank.</p>
      </div>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
      {success && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sparziele overview */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold">Aktive Sparbücher</h2>

          {savingsAccs.length === 0 ? (
            <div className="p-8 text-center rounded-3xl border border-white/5 bg-white/2 space-y-4">
              <PiggyBank className="w-12 h-12 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-400">Sie haben aktuell kein aktives Sparbuch eingerichtet.</p>
              <p className="text-xs text-slate-500">Erstellen Sie einfach ein Sparkonto im Menü &apos;Konten&apos;, um Sparziele zu definieren.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savingsAccs.map((acc) => (
                <div key={acc.id} className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/15 to-transparent rounded-full blur-2xl pointer-events-none"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-lg">{acc.name}</h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{acc.iban}</p>
                    </div>
                    <PiggyBank className="w-6 h-6 text-amber-400" />
                  </div>

                  <div>
                    <span className="text-3xl font-black text-white">
                      {Number(acc.balance).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-amber-400/90 font-medium mt-2">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Verzinsung: 2,5% p.a. (Simuliert)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deposit into savings form */}
        {savingsAccs.length > 0 && checkingAccs.length > 0 && (
          <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl space-y-4 self-start">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              <span>Geld beiseitelegen</span>
            </h2>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Vom Girokonto</label>
                <select
                  value={checkingAccount}
                  onChange={(e) => setCheckingAccount(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-amber-500 transition-all text-sm font-medium"
                >
                  {checkingAccs.map(acc => (
                    <option key={acc.id} value={acc.id} className="bg-slate-900">
                      {acc.name} ({Number(acc.balance).toFixed(2)} EUR)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Auf das Sparbuch</label>
                <select
                  value={savingsAccount}
                  onChange={(e) => setSavingsAccount(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-amber-500 transition-all text-sm font-medium"
                >
                  {savingsAccs.map(acc => (
                    <option key={acc.id} value={acc.id} className="bg-slate-900">
                      {acc.name} ({Number(acc.balance).toFixed(2)} EUR)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Betrag (EUR)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="250,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-amber-500 transition-all text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 p-3.5 font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 text-slate-950"
              >
                <Plus className="w-4 h-4" />
                <span>Sparen bestätigen</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
