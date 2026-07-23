'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Calendar, Plus, Trash2, ShieldAlert } from 'lucide-react';

export default function StandingOrdersPage() {
  const { user, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [standingOrders, setStandingOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [senderAccountId, setSenderAccountId] = useState('');
  const [receiverIban, setReceiverIban] = useState('');
  const [amount, setAmount] = useState('');
  const [interval, setIntervalVal] = useState('monthly');
  const [nextExecution, setNextExecution] = useState('');
  const [endDate, setEndDate] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function fetchOrders() {
    try {
      const res = await fetch('/api/db/standing-orders');
      const data = await res.json();
      if (data?.standingOrders) setStandingOrders(data.standingOrders);
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
          setAccounts(accData.accounts);
          if (accData.accounts.length > 0) {
            setSenderAccountId(accData.accounts[0].id);
          }
        }
        await fetchOrders();
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

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbUser || !senderAccountId) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/db/standing-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderAccountId,
          receiverIban,
          amount,
          interval,
          nextExecution,
          endDate
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Einrichten');
      }

      setSuccess('Dauerauftrag erfolgreich eingerichtet!');
      setReceiverIban('');
      setAmount('');
      await fetchOrders();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Einrichten des Dauerauftrags.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Diesen Dauerauftrag wirklich löschen?')) return;
    try {
      const res = await fetch('/api/db/standing-orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!res.ok) throw new Error();

      setSuccess('Dauerauftrag erfolgreich gelöscht.');
      await fetchOrders();
    } catch (err) {
      setError('Löschen fehlgeschlagen.');
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
        <h1 className="text-3xl font-extrabold tracking-tight">Daueraufträge</h1>
        <p className="text-sm text-slate-400 mt-1">Richten Sie wiederkehrende Überweisungen ein, um Fixkosten automatisch zu begleichen.</p>
      </div>

      {dbUser?.is_frozen && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <span>Ihr Konto ist gesperrt. Sie können keine Daueraufträge einrichten.</span>
        </div>
      )}

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
      {success && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active orders list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold">Aktive Daueraufträge</h2>
          {standingOrders.length === 0 ? (
            <p className="text-sm text-slate-500 bg-white/2 border border-white/5 rounded-3xl p-8 text-center">Keine aktiven Daueraufträge vorhanden.</p>
          ) : (
            <div className="space-y-3">
              {standingOrders.map((order) => (
                <div key={order.id} className="p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-md flex justify-between items-center hover:border-white/20 transition-all">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">An IBAN: {order.receiver_account?.iban}</p>
                    <p className="text-xs text-slate-400">Vom Quellkonto: {order.sender_account?.name}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] uppercase font-black bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">
                        {order.interval === 'monthly' ? 'Monatlich' : 'Wöchentlich'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Nächster Lauf: {new Date(order.next_execution).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-lg font-extrabold text-white">
                      {Number(order.amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </span>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Setup order form */}
        {!dbUser?.is_frozen && (
          <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl space-y-4 self-start">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <span>Dauerauftrag einrichten</span>
            </h2>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Quellkonto</label>
                <select
                  value={senderAccountId}
                  onChange={(e) => setSenderAccountId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-blue-500 transition-all text-sm font-medium"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} className="bg-slate-900">
                      {acc.name} ({Number(acc.balance).toFixed(2)} EUR)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Empfänger IBAN</label>
                <input
                  type="text"
                  required
                  placeholder="DE..."
                  value={receiverIban}
                  onChange={(e) => setReceiverIban(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-blue-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Betrag (EUR)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="50,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-blue-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Intervall</label>
                <select
                  value={interval}
                  onChange={(e) => setIntervalVal(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-blue-500 transition-all text-sm font-medium"
                >
                  <option value="weekly" className="bg-slate-900">Wöchentlich</option>
                  <option value="monthly" className="bg-slate-900">Monatlich</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Erste Ausführung</label>
                <input
                  type="date"
                  required
                  value={nextExecution}
                  onChange={(e) => setNextExecution(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-blue-500 transition-all text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 p-3.5 font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Einrichten</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
