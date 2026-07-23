'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie } from 'recharts';
import { BarChart3, AlertTriangle, Sparkles } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

export default function StatisticsPage() {
  const { user, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [checkingAccounts, setCheckingAccounts] = useState<any[]>([]);

  useEffect(() => {
    async function init() {
      if (!user) return;
      setLoading(true);

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', user.id)
        .single();

      if (userData) {
        setDbUser(userData);

        const { data: accountsData } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', userData.id);

        if (accountsData) {
          const accountIds = accountsData.map(a => a.id);
          setCheckingAccounts(accountsData);

          if (accountIds.length > 0) {
            const { data: txs } = await supabase
              .from('transactions')
              .select('*')
              .or(`sender_account_id.in.(${accountIds.join(',')}),receiver_account_id.in.(${accountIds.join(',')})`);

            if (txs) setTransactions(txs);
          }
        }
      }
      setLoading(false);
    }

    if (isLoaded && user) {
      init();
    }
  }, [user, isLoaded]);

  if (!isLoaded || loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 w-40 bg-white/5 rounded"></div>
      <div className="h-64 bg-white/5 rounded-3xl"></div>
    </div>;
  }

  // Calculate expenses and earnings by category
  const categoriesMap: { [key: string]: number } = {};
  let totalExpenses = 0;
  let totalIncome = 0;

  transactions.forEach((tx) => {
    const isDebit = checkingAccounts.some(a => a.id === tx.sender_account_id);
    const amount = Number(tx.amount);

    if (isDebit) {
      const cat = tx.category || 'general';
      categoriesMap[cat] = (categoriesMap[cat] || 0) + amount;
      totalExpenses += amount;
    } else {
      totalIncome += amount;
    }
  });

  const pieData = Object.keys(categoriesMap).map((cat) => ({
    name: cat === 'general' ? 'Allgemein' : cat === 'food' ? 'Lebensmittel' : cat === 'rent' ? 'Miete' : cat === 'entertainment' ? 'Freizeit' : cat === 'savings' ? 'Sparen' : cat,
    value: categoriesMap[cat]
  }));

  const barData = [
    { name: 'Einnahmen', Betrag: totalIncome },
    { name: 'Ausgaben', Betrag: totalExpenses }
  ];

  // Simulated budget limits
  const budgetLimits: { [key: string]: number } = {
    food: 400,
    entertainment: 200,
    general: 500
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Finanz-Statistiken</h1>
        <p className="text-sm text-slate-400 mt-1">Vollständige grafische Auswertung Ihrer Einnahmen und Ausgaben nach Kategorien.</p>
      </div>

      {dbUser?.plan === 'free' ? (
        <div className="p-8 rounded-3xl border border-amber-500/10 bg-amber-500/5 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>Premium Feature</span>
            </h3>
            <p className="text-sm text-slate-400 max-w-xl">Intelligente Kategorien-Statistiken und Budgetgrenzen sind exklusiv für Premium und Elite Pläne verfügbar. Erweitern Sie noch heute Ihren Plan!</p>
          </div>
          <a href="/dashboard/plans" className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-extrabold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all self-stretch md:self-center text-center">
            Upgrade ansehen
          </a>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pie chart */}
            <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl space-y-4">
              <h2 className="text-lg font-bold">Ausgaben nach Kategorie</h2>
              {pieData.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-12">Noch keine Ausgaben erfasst.</p>
              ) : (
                <div className="h-[260px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `${Number(value).toFixed(2)} EUR`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Income vs Expenses Bar Chart */}
            <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl space-y-4">
              <h2 className="text-lg font-bold">Einnahmen vs. Ausgaben</h2>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip formatter={(value: any) => `${Number(value).toFixed(2)} EUR`} />
                    <Bar dataKey="Betrag" fill="#8b5cf6" radius={[10, 10, 0, 0]}>
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Budget Limits Warnings */}
          <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span>Budgetlimits & Warnungen</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.keys(budgetLimits).map((cat) => {
                const limit = budgetLimits[cat];
                const spent = categoriesMap[cat] || 0;
                const percentage = Math.min((spent / limit) * 100, 100);
                const isOver = spent > limit;

                return (
                  <div key={cat} className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold capitalize text-white">
                        {cat === 'food' ? 'Lebensmittel' : cat === 'entertainment' ? 'Freizeit' : cat}
                      </span>
                      <span className="text-xs text-slate-400">{spent.toFixed(2)} / {limit} EUR</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-violet-500'
                        }`}
                      ></div>
                    </div>

                    {isOver && (
                      <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Budgetgrenze überschritten!</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
