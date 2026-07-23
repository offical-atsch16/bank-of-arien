'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Wallet,
  Plus,
  CreditCard,
  ShieldAlert,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverview() {
  const { user, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);

      try {
        const userRes = await fetch('/api/db/user');
        const userData = await userRes.json();
        if (userData?.user) {
          setDbUser(userData.user);
        }

        const accountsRes = await fetch('/api/db/accounts');
        const accountsData = await accountsRes.json();
        if (accountsData?.accounts) {
          setAccounts(accountsData.accounts);
        }

        const txsRes = await fetch('/api/db/transactions');
        const txsData = await txsRes.json();
        if (txsData?.transactions) {
          setTransactions(txsData.transactions.slice(0, 5));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded && user) {
      fetchData();
    }
  }, [user, isLoaded]);

  if (!isLoaded || loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-white/5 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-white/5 rounded-3xl"></div>
          <div className="h-40 bg-white/5 rounded-3xl"></div>
          <div className="h-40 bg-white/5 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  const totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Hallo, {dbUser?.username || user?.firstName || 'Kunde'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Willkommen zurück bei der <span className="text-blue-400 font-semibold">BANK OF ARIEN</span>
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="text-xs font-semibold text-slate-400">Aktueller Plan:</span>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            {dbUser?.plan || 'Free'}
          </span>
        </div>
      </div>

      {dbUser?.is_frozen && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>
            Ihr Konto wurde gesperrt. Bitte wenden Sie sich an unseren Support, um die Sperre aufzuheben.
          </span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Assets Glass Card */}
        <div className="relative overflow-hidden p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-xl flex flex-col justify-between min-h-[160px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Gesamtguthaben</span>
            <Wallet className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-4">
            <span className="text-3xl md:text-4xl font-black text-white">
              {totalBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+1,2% Rendite simuliert</span>
            </div>
          </div>
        </div>

        {/* Checking Account Balance */}
        {accounts.filter(a => a.type === 'checking').map((acc) => (
          <div key={acc.id} className="relative overflow-hidden p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-xl flex flex-col justify-between min-h-[160px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Girokonto</span>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{acc.iban}</p>
              </div>
              <CreditCard className="w-5 h-5 text-violet-400" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-white">
                {Number(acc.balance).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
          </div>
        ))}

        {/* Savings Account Balance (if any) or call to action to create one */}
        {accounts.filter(a => a.type === 'savings').length > 0 ? (
          accounts.filter(a => a.type === 'savings').slice(0, 1).map((acc) => (
            <div key={acc.id} className="relative overflow-hidden p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-xl flex flex-col justify-between min-h-[160px]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Sparbuch</span>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{acc.iban}</p>
                </div>
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-white">
                  {Number(acc.balance).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="relative overflow-hidden p-6 rounded-3xl border border-white/5 bg-white/2 backdrop-blur-2xl shadow-xl flex flex-col justify-between min-h-[160px]">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Zins-Sparen</span>
            <div className="mt-2">
              <p className="text-xs text-slate-400">Legen Sie ein Sparziel fest und erhalten Sie attraktive Zinsen.</p>
              <Link href="/dashboard/savings" className="inline-flex items-center gap-1 text-xs text-blue-400 font-bold mt-4 hover:underline">
                <span>Jetzt Sparziel anlegen</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (Takes 2/3 column space) */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold tracking-wide">Letzte Aktivitäten</h2>
            <Link href="/dashboard/transactions" className="text-xs text-blue-400 hover:underline">
              Alle ansehen
            </Link>
          </div>

          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">Noch keine Transaktionen vorhanden.</p>
            ) : (
              transactions.map((tx) => {
                const isDebit = accounts.some(a => a.id === tx.sender_account_id);
                return (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/2 hover:bg-white/5 transition-all">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isDebit ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {isDebit ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {tx.note || (isDebit ? 'Überweisung gesendet' : 'Gutschrift erhalten')}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                          {isDebit
                            ? `An: ${tx.receiver_account?.iban || 'System'}`
                            : `Von: ${tx.sender_account?.iban || 'BANK OF ARIEN'}`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${isDebit ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isDebit ? '-' : '+'}{Number(tx.amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {new Date(tx.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions (Takes 1/3 column space) */}
        <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-xl space-y-6">
          <h2 className="text-lg font-bold tracking-wide">Schnellaktionen</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/dashboard/transfer"
              className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-all group"
            >
              <ArrowUpRight className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Geld senden</span>
            </Link>

            <Link
              href="/dashboard/cards"
              className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-all group"
            >
              <CreditCard className="w-6 h-6 text-violet-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Karten verwalten</span>
            </Link>

            <Link
              href="/dashboard/savings"
              className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-all group"
            >
              <TrendingUp className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Sparziel setzen</span>
            </Link>

            <Link
              href="/dashboard/support"
              className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-all group"
            >
              <HelpCircle className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Support</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
