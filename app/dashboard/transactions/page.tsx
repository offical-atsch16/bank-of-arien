'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  Search,
  CalendarDays
} from 'lucide-react';

export default function TransactionsPage() {
  const { user, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [dateRange, setDateRange] = useState('all'); // all, 30days, 90days, year

  async function fetchAllData() {
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
      }

      const txsRes = await fetch('/api/db/transactions');
      const txsData = await txsRes.json();
      if (txsData?.transactions) {
        setTransactions(txsData.transactions);
        setFilteredTransactions(txsData.transactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoaded && user) {
      fetchAllData();
    }
  }, [user, isLoaded]);

  // Apply filters on client side
  useEffect(() => {
    let result = [...transactions];

    // Filter by Account
    if (selectedAccount !== 'all') {
      result = result.filter(tx =>
        tx.sender_account_id === selectedAccount || tx.receiver_account_id === selectedAccount
      );
    }

    // Filter by Category
    if (category !== 'all') {
      result = result.filter(tx => tx.category === category);
    }

    // Filter by search query (Note, receiver IBAN, amount)
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(tx =>
        (tx.note && tx.note.toLowerCase().includes(q)) ||
        (tx.sender_account?.iban && tx.sender_account.iban.toLowerCase().includes(q)) ||
        (tx.receiver_account?.iban && tx.receiver_account.iban.toLowerCase().includes(q)) ||
        (tx.amount && tx.amount.toString().includes(q))
      );
    }

    // Filter by Date Range
    if (dateRange !== 'all') {
      const cutoff = new Date();
      if (dateRange === '30days') cutoff.setDate(cutoff.getDate() - 30);
      else if (dateRange === '90days') cutoff.setDate(cutoff.getDate() - 90);
      else if (dateRange === 'year') cutoff.setFullYear(cutoff.getFullYear() - 1);

      result = result.filter(tx => new Date(tx.created_at) >= cutoff);
    }

    setFilteredTransactions(result);
  }, [selectedAccount, search, category, dateRange, transactions]);

  // Export to PDF
  const exportPDF = () => {
    const doc = new jsPDF() as any;

    doc.setFillColor(15, 23, 42); // slate-900 background for top banner
    doc.rect(0, 0, 210, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("BANK OF ARIEN", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Kontoauszug – Offizieller Beleg", 14, 28);
    doc.text(`Erstellungsdatum: ${new Date().toLocaleDateString('de-DE')}`, 14, 35);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Kontoinhaber:", 14, 55);
    doc.setFont("helvetica", "normal");
    doc.text(`${dbUser?.username || 'Kunde'} (${dbUser?.email})`, 14, 62);
    doc.text(`Usertag: @${dbUser?.usertag}`, 14, 68);

    const tableHeaders = [["Datum", "Verwendungszweck", "Sender IBAN", "Empfänger IBAN", "Kategorie", "Betrag"]];
    const tableRows = filteredTransactions.map(tx => {
      const isDebit = accounts.some(a => a.id === tx.sender_account_id);
      return [
        new Date(tx.created_at).toLocaleDateString('de-DE'),
        tx.note || (isDebit ? 'Überweisung' : 'Gutschrift'),
        tx.sender_account?.iban || 'BANK OF ARIEN',
        tx.receiver_account?.iban || 'BANK OF ARIEN',
        tx.category || 'Allgemein',
        `${isDebit ? '-' : '+'}${Number(tx.amount).toFixed(2)} EUR`
      ];
    });

    doc.autoTable({
      startY: 75,
      head: tableHeaders,
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // indigo-600
      styles: { fontSize: 8 },
    });

    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("BANK OF ARIEN – Dies ist ein simulierter Beleg. Es handelt sich nicht um echtes Geld.", 14, doc.lastAutoTable.finalY + 15);

    doc.save(`Kontoauszug_BankOfArien_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  if (!isLoaded || loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 w-40 bg-white/5 rounded"></div>
      <div className="h-96 bg-white/5 rounded-3xl"></div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Transaktionen</h1>
          <p className="text-sm text-slate-400 mt-1">Suchen, filtern und exportieren Sie Ihre gesamte Transaktionshistorie.</p>
        </div>
        <button
          onClick={exportPDF}
          disabled={filteredTransactions.length === 0}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-sm font-bold shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all self-start"
        >
          <Download className="w-4 h-4" />
          <span>Kontoauszug (PDF)</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Suchen</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Zweck, Betrag, IBAN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Account */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Konto</label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-all"
          >
            <option value="all" className="bg-slate-900">Alle Konten</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id} className="bg-slate-900">{acc.name}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Kategorie</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-all"
          >
            <option value="all" className="bg-slate-900">Alle Kategorien</option>
            <option value="general" className="bg-slate-900">Allgemein</option>
            <option value="food" className="bg-slate-900">Lebensmittel</option>
            <option value="rent" className="bg-slate-900">Miete & Wohnen</option>
            <option value="entertainment" className="bg-slate-900">Freizeit & Entertainment</option>
            <option value="salary" className="bg-slate-900">Gehalt</option>
            <option value="savings" className="bg-slate-900">Sparen</option>
          </select>
        </div>

        {/* Date range */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Zeitraum</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-all"
          >
            <option value="all" className="bg-slate-900">Gesamte Zeit</option>
            <option value="30days" className="bg-slate-900">Letzte 30 Tage</option>
            <option value="90days" className="bg-slate-900">Letzte 90 Tage</option>
            <option value="year" className="bg-slate-900">Letztes Jahr</option>
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl space-y-4">
        {filteredTransactions.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">Keine passenden Transaktionen gefunden.</p>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => {
              const isDebit = accounts.some(a => a.id === tx.sender_account_id);
              return (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/2 hover:bg-white/5 transition-all border border-white/5">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isDebit ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {isDebit ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{tx.note || 'Überweisung'}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        {isDebit
                          ? `An: ${tx.receiver_account?.iban || 'System'}`
                          : `Von: ${tx.sender_account?.iban || 'BANK OF ARIEN'}`
                        }
                      </p>
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-blue-400 mt-1.5 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        {tx.category || 'general'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-sm font-bold ${isDebit ? 'text-red-400' : 'text-emerald-400'}`}>
                      {isDebit ? '-' : '+'}{Number(tx.amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1 justify-end font-medium">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-600" />
                      <span>{new Date(tx.created_at).toLocaleDateString('de-DE')}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
