'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Send, CheckCircle2, AlertCircle, ShieldEllipsis, X } from 'lucide-react';

export default function TransferPage() {
  const { user, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [senderAccountId, setSenderAccountId] = useState('');
  const [receiverInput, setReceiverInput] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('general');

  // PIN Modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function fetchAccounts() {
    try {
      const res = await fetch('/api/db/accounts');
      const data = await res.json();
      if (data?.accounts) {
        setAccounts(data.accounts);
        if (data.accounts.length > 0) {
          setSenderAccountId(data.accounts[0].id);
        }
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

  const handleOpenPinModal = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!senderAccountId || !receiverInput || !amount || Number(amount) <= 0) {
      setError('Bitte alle Felder korrekt ausfüllen.');
      return;
    }

    setShowPinModal(true);
  };

  const handleExecuteTransfer = async () => {
    if (!user) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderAccountId,
          receiverIbanOrTag: receiverInput,
          amount,
          note,
          category,
          pin,
          clerkId: user.id
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Ausführen der Überweisung');
      }

      setSuccess('Überweisung erfolgreich ausgeführt!');
      setShowPinModal(false);
      setReceiverInput('');
      setAmount('');
      setNote('');
      setPin('');

      await fetchAccounts();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Senden.');
      setShowPinModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded || loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 w-40 bg-white/5 rounded"></div>
      <div className="h-64 bg-white/5 rounded-3xl"></div>
    </div>;
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Geld senden</h1>
        <p className="text-sm text-slate-400 mt-1">Senden Sie Geld in Echtzeit an andere User per IBAN, Username oder Usertag.</p>
      </div>

      {dbUser?.is_frozen && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span>Ihre Kontofunktionen sind gesperrt. Sie können keine Transaktionen durchführen.</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {!dbUser?.is_frozen && (
        <form onSubmit={handleOpenPinModal} className="p-6 md:p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Abbuchungskonto</label>
            <select
              value={senderAccountId}
              onChange={(e) => setSenderAccountId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-blue-500 transition-all text-sm font-medium"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="bg-slate-900">
                  {acc.name} ({Number(acc.balance).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Empfänger (IBAN, Usertag oder Username)</label>
            <input
              type="text"
              required
              placeholder="DE99... oder usertag123"
              value={receiverInput}
              onChange={(e) => setReceiverInput(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-blue-500 transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Betrag (EUR)</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                placeholder="150,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-blue-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Kategorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-blue-500 transition-all text-sm font-medium"
              >
                <option value="general" className="bg-slate-900">Allgemein</option>
                <option value="food" className="bg-slate-900">Lebensmittel</option>
                <option value="rent" className="bg-slate-900">Miete & Wohnen</option>
                <option value="entertainment" className="bg-slate-900">Freizeit & Entertainment</option>
                <option value="salary" className="bg-slate-900">Gehalt</option>
                <option value="savings" className="bg-slate-900">Sparen</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Verwendungszweck (Note)</label>
            <input
              type="text"
              placeholder="z.B. Abendessen gestern"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-blue-500 transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 p-3.5 font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Überweisung vorbereiten</span>
          </button>
        </form>
      )}

      {/* PIN Confirmation Glass Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-2xl relative">
            <button
              onClick={() => setShowPinModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                <ShieldEllipsis className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Transaktion freigeben</h3>
                <p className="text-xs text-slate-400 mt-1">Bitte geben Sie Ihre 4-stellige Sicherheits-PIN ein, um die Überweisung von {Number(amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} zu bestätigen.</p>
              </div>

              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full rounded-xl border border-white/10 bg-white/10 p-3.5 text-center tracking-widest text-xl text-white placeholder-slate-600 outline-none focus:border-blue-500 transition-all"
              />

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-semibold hover:bg-white/5"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleExecuteTransfer}
                  disabled={submitting || pin.length !== 4}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-xs font-bold shadow-md hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? 'Sende...' : 'Bestätigen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
