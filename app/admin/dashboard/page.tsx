'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Wallet,
  Lock,
  Unlock,
  Check
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>({ users: 0, balance: 0, transactions: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search/Filter states
  const [search, setSearch] = useState('');

  // Operations Form State
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [operationLoading, setOperationLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Loan approval lists
  const [pendingLoans, setPendingLoans] = useState<any[]>([]);

  async function fetchStatsAndData() {
    setLoading(true);
    try {
      const statsRes = await fetch('/admin/api/stats');
      const statsData = await statsRes.json();
      if (statsData) {
        setStats({
          users: statsData.usersCount,
          balance: statsData.totalBalance,
          transactions: statsData.transactionsCount
        });
        setUsers(statsData.users);
        setFilteredUsers(statsData.users);
      }

      const loansRes = await fetch('/admin/api/operations/get?type=loans');
      const loansData = await loansRes.json();
      if (loansData?.loans) {
        setPendingLoans(loansData.loans);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatsAndData();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredUsers(users);
    } else {
      const q = search.toLowerCase();
      setFilteredUsers(users.filter(u =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.usertag.toLowerCase().includes(q)
      ));
    }
  }, [search, users]);

  const selectUserDetail = async (u: any) => {
    setSelectedUser(u);
    setMsg({ type: '', text: '' });

    try {
      const res = await fetch(`/admin/api/user-details?userId=${u.id}`);
      const data = await res.json();
      if (data?.accounts) {
        setUserAccounts(data.accounts);
        if (data.accounts.length > 0) setPayoutAccount(data.accounts[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFreeze = async (userId: string, currentFrozen: boolean) => {
    try {
      const res = await fetch('/admin/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'freeze',
          userId,
          isFrozen: !currentFrozen
        })
      });

      if (!res.ok) throw new Error();

      setMsg({ type: 'success', text: `Benutzer erfolgreich ${!currentFrozen ? 'gesperrt' : 'entsperrt'}.` });

      const updatedUser = { ...selectedUser, is_frozen: !currentFrozen };
      setSelectedUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    } catch (err) {
      setMsg({ type: 'error', text: 'Operation failed.' });
    }
  };

  const handleChangePlan = async (userId: string, targetPlan: string) => {
    try {
      const res = await fetch('/admin/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'plan',
          userId,
          targetPlan
        })
      });

      if (!res.ok) throw new Error();

      setMsg({ type: 'success', text: `Plan erfolgreich auf ${targetPlan.toUpperCase()} geändert.` });

      const updatedUser = { ...selectedUser, plan: targetPlan };
      setSelectedUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    } catch (err) {
      setMsg({ type: 'error', text: 'Änderung fehlgeschlagen.' });
    }
  };

  const handleBankPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAccount || !payoutAmount || !payoutNote) return;
    setOperationLoading(true);
    setMsg({ type: '', text: '' });

    try {
      const res = await fetch('/admin/api/send-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverAccountId: payoutAccount,
          amount: Number(payoutAmount),
          note: payoutNote
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Auszahlung fehlgeschlagen');
      }

      setMsg({ type: 'success', text: `${payoutAmount} EUR erfolgreich als BANK OF ARIEN ausgezahlt!` });
      setPayoutAmount('');
      setPayoutNote('');

      if (selectedUser) {
        const resDetails = await fetch(`/admin/api/user-details?userId=${selectedUser.id}`);
        const dataDetails = await resDetails.json();
        if (dataDetails?.accounts) setUserAccounts(dataDetails.accounts);
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Operation fehlgeschlagen.' });
    } finally {
      setOperationLoading(false);
    }
  };

  const handleLoanApproval = async (loanId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/admin/api/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'loan',
          loanId,
          status
        })
      });

      if (!res.ok) throw new Error();

      setPendingLoans(prev => prev.filter(l => l.id !== loanId));
      fetchStatsAndData();
    } catch (err) {
      alert('Kredit-Aktion fehlgeschlagen.');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-zinc-400 animate-pulse">Lade HQ Administration...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-wider text-zinc-100">HQ Administration</h1>
        <p className="text-xs text-zinc-500 mt-1">Echtzeit-Überwachung aller Geldflüsse, Konten, Kredite und Kunden der Bank of Arien.</p>
      </div>

      {/* Global HQ Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Registrierte Kunden</span>
            <p className="text-3xl font-extrabold text-zinc-100 mt-2">{stats.users}</p>
          </div>
          <Users className="w-8 h-8 text-amber-500/20" />
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Gesamtguthaben System</span>
            <p className="text-3xl font-extrabold text-zinc-100 mt-2">
              {stats.balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
          <Wallet className="w-8 h-8 text-emerald-500/20" />
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Systemtransaktionen</span>
            <p className="text-3xl font-extrabold text-zinc-100 mt-2">{stats.transactions}</p>
          </div>
          <Check className="w-8 h-8 text-amber-500/20" />
        </div>
      </div>

      {/* Loan approvals */}
      {pendingLoans.length > 0 && (
        <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-amber-400">Ausstehende Kreditanträge</h2>
          <div className="grid grid-cols-1 gap-4">
            {pendingLoans.map((l) => (
              <div key={l.id} className="p-4 rounded-xl border border-amber-500/10 bg-zinc-900 flex justify-between items-center text-sm">
                <div>
                  <p className="font-bold text-zinc-200">Kunde: {l.user?.username} ({l.user?.email})</p>
                  <p className="text-xs text-zinc-400 mt-1">Betrag: {Number(l.amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} • Laufzeit: {l.term_months} Monate • Rate: {l.monthly_payment} EUR/Mo</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLoanApproval(l.id, 'approved')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all"
                  >
                    Genehmigen
                  </button>
                  <button
                    onClick={() => handleLoanApproval(l.id, 'rejected')}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-all"
                  >
                    Ablehnen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Core management layout: List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User list column (1/3) */}
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Kunden suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm outline-none focus:border-amber-500 transition-all text-white placeholder-zinc-600"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => selectUserDetail(u)}
                className={`w-full p-4 rounded-xl text-left border transition-all block ${
                  selectedUser?.id === u.id
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100">{u.username}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">{u.email}</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                    {u.plan}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* User details operations column (2/3) */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-8">
              {msg.text && (
                <div className={`p-4 rounded-xl text-xs font-bold border ${
                  msg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {msg.text}
                </div>
              )}

              {/* Detail Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedUser.username}</h2>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">Usertag: @{selectedUser.usertag}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleFreeze(selectedUser.id, selectedUser.is_frozen)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      selectedUser.is_frozen
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-red-600/10 hover:bg-red-600/20 text-red-400'
                    }`}
                  >
                    {selectedUser.is_frozen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{selectedUser.is_frozen ? 'Entsperren' : 'Kunde sperren'}</span>
                  </button>
                </div>
              </div>

              {/* Plan controls */}
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 block">Planverwaltung</span>
                <div className="flex gap-2">
                  {['free', 'premium', 'elite'].map((plan) => (
                    <button
                      key={plan}
                      onClick={() => handleChangePlan(selectedUser.id, plan)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex-1 ${
                        selectedUser.plan === plan
                          ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Accounts list */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 block">Aktive Bankkonten des Users</span>
                {userAccounts.map(acc => (
                  <div key={acc.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-zinc-100">{acc.name} ({acc.type})</p>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">{acc.iban}</p>
                    </div>
                    <span className="text-lg font-black text-white">
                      {Number(acc.balance).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                ))}
              </div>

              {/* BANK OF ARIEN Cash Disbursment RPC Form */}
              <form onSubmit={handleBankPayout} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
                <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 block">Direktzahlung von BANK OF ARIEN auszahlen</span>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Begünstigtes Konto</label>
                  <select
                    value={payoutAccount}
                    onChange={(e) => setPayoutAccount(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-xs text-white outline-none"
                  >
                    {userAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.iban})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Betrag (EUR)</label>
                    <input
                      type="number"
                      required
                      placeholder="100,00"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Zweck / Notiz</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Zinsgutschrift oder Bonus"
                      value={payoutNote}
                      onChange={(e) => setPayoutNote(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={operationLoading}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                  {operationLoading ? 'Führe Buchung aus...' : 'Als Bank auszahlen'}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-12 text-center text-zinc-600 border border-dashed border-zinc-800 rounded-2xl">
              Bitte wählen Sie links einen Kunden aus der Liste, um Detailinformationen einzusehen und administrative Aktionen durchzuführen.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
