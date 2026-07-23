'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Coins, Plus, ShieldAlert } from 'lucide-react';

export default function LoansPage() {
  const { user, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [amount, setAmount] = useState('');
  const [termMonths, setTermMonths] = useState('12');
  const [destinationAccount, setDestinationAccount] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function fetchLoans() {
    try {
      const res = await fetch('/api/db/loans');
      const data = await res.json();
      if (data?.loans) setLoans(data.loans);
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

        const accRes = await fetch('/api/db/accounts');
        const accData = await accRes.json();
        if (accData?.accounts) {
          const checkingOnly = accData.accounts.filter((a: any) => a.type === 'checking');
          setAccounts(checkingOnly);
          if (checkingOnly.length > 0) {
            setDestinationAccount(checkingOnly[0].id);
          }
        }
        await fetchLoans();
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

  // Loan calculation helper
  const calculateRate = (amt: number, term: number, plan: string) => {
    const baseInterestRate = plan === 'elite' ? 3.99 : plan === 'premium' ? 5.99 : 8.99;
    const monthlyRate = (baseInterestRate / 100) / 12;
    const payment = (amt * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
    return {
      monthly: isNaN(payment) || !isFinite(payment) ? 0 : payment,
      rate: baseInterestRate
    };
  };

  const currentAmt = Number(amount) || 0;
  const currentTerm = Number(termMonths) || 12;
  const planName = dbUser?.plan || 'free';
  const { monthly: calcMonthly, rate: calcRate } = calculateRate(currentAmt, currentTerm, planName);

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbUser || !destinationAccount || currentAmt <= 0) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    if (dbUser.plan === 'free') {
      setError('Kredite stehen im Free-Plan leider nicht zur Verfügung. Bitte führen Sie erst ein Upgrade auf Premium oder Elite durch.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/db/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentAmt,
          termMonths: currentTerm,
          interestRate: calcRate,
          monthlyPayment: Number(calcMonthly.toFixed(2)),
          accountId: destinationAccount
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Einreichen des Kreditantrags.');
      }

      setSuccess('Ihr Kreditantrag wurde erfolgreich übermittelt und wird jetzt von der Bank geprüft!');
      setAmount('');
      await fetchLoans();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Einreichen des Kreditantrags.');
    } finally {
      setSubmitting(false);
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
        <h1 className="text-3xl font-extrabold tracking-tight">Kredite & Tilgung</h1>
        <p className="text-sm text-slate-400 mt-1">Berechnen und beantragen Sie simulierte Kredite mit flexibler Ratenübersicht.</p>
      </div>

      {dbUser?.is_frozen && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>Ihr Konto ist gesperrt. Sie können keine Kreditanträge stellen.</span>
        </div>
      )}

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
      {success && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Loan applications and active list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold">Kredit-Übersicht</h2>
          {loans.length === 0 ? (
            <p className="text-sm text-slate-500 bg-white/2 border border-white/5 rounded-3xl p-8 text-center">Keine Kredite oder Anträge vorhanden.</p>
          ) : (
            <div className="space-y-3">
              {loans.map((loan) => (
                <div key={loan.id} className="p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-md flex justify-between items-center hover:border-white/20 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">Betrag: {Number(loan.amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                      <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                        loan.status === 'approved' || loan.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : loan.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {loan.status === 'approved' || loan.status === 'active' ? 'Aktiv' : loan.status === 'pending' ? 'Ausstehend' : loan.status === 'rejected' ? 'Abgelehnt' : 'Zurückgezahlt'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Laufzeit: {loan.term_months} Monate • Sollzins: {loan.interest_rate}% p.a.</p>
                    <p className="text-xs text-slate-500 font-mono mt-1">Auszahlungskonto: {loan.account?.name || 'Hauptkonto'}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-white block">
                      {Number(loan.monthly_payment).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} / Mo
                    </span>
                    <span className="text-[9px] text-slate-500">Monatliche Rate</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Apply for Loan Form */}
        {!dbUser?.is_frozen && (
          <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl space-y-6 self-start">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-400" />
              <span>Kreditrechner</span>
            </h2>

            <form onSubmit={handleApplyLoan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Gewünschter Betrag (EUR)</label>
                <input
                  type="number"
                  required
                  min="500"
                  max="100000"
                  placeholder="e.g. 10000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-blue-500 transition-all text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Laufzeit (Monate)</label>
                <select
                  value={termMonths}
                  onChange={(e) => setTermMonths(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-blue-500 transition-all text-sm font-medium"
                >
                  <option value="12" className="bg-slate-900">12 Monate (1 Jahr)</option>
                  <option value="24" className="bg-slate-900">24 Monate (2 Jahre)</option>
                  <option value="36" className="bg-slate-900">36 Monate (3 Jahre)</option>
                  <option value="48" className="bg-slate-900">48 Monate (4 Jahre)</option>
                  <option value="60" className="bg-slate-900">60 Monate (5 Jahre)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Auszahlung auf</label>
                <select
                  value={destinationAccount}
                  onChange={(e) => setDestinationAccount(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-blue-500 transition-all text-sm font-medium"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} className="bg-slate-900">
                      {acc.name} ({acc.iban})
                    </option>
                  ))}
                </select>
              </div>

              {/* Calculated payment block */}
              {currentAmt > 0 && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Zins-Satz ({dbUser?.plan || 'Free'} Plan)</span>
                    <span className="font-bold text-blue-400">{calcRate}% p.a.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monatliche Ratenhöhe</span>
                    <span className="font-bold text-emerald-400">{calcMonthly.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 p-3.5 font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Kredit beantragen</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
