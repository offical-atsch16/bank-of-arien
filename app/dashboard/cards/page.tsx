'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { generateCardNumber, generateCVV, generateExpiryDate } from '@/lib/banking-utils';
import { Eye, EyeOff, Lock, Unlock, ShieldCheck } from 'lucide-react';

export default function CardsPage() {
  const { user, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Card details visibility toggle states
  const [visibleCards, setVisibleCards] = useState<{ [key: string]: boolean }>({});

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function fetchCards() {
    try {
      const res = await fetch('/api/db/cards');
      const data = await res.json();
      if (data?.cards) setCards(data.cards);
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
        if (accData?.accounts) setAccounts(accData.accounts);

        await fetchCards();
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

  const toggleVisibility = (cardId: string) => {
    setVisibleCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const handleToggleLock = async (cardId: string, currentLocked: boolean) => {
    try {
      const res = await fetch('/api/db/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-lock',
          cardId,
          isLocked: !currentLocked
        })
      });

      if (!res.ok) throw new Error();

      setSuccess(`Karte wurde erfolgreich ${!currentLocked ? 'gesperrt' : 'entsperrt'}.`);
      await fetchCards();
    } catch (err: any) {
      setError('Fehler beim Ändern des Kartenstatus.');
    }
  };

  const handleCreateCard = async (type: 'debit' | 'credit') => {
    if (!dbUser || accounts.length === 0) return;
    setCreating(true);
    setError('');
    setSuccess('');

    // Plan limitation check
    if (dbUser.plan === 'free' && type === 'credit') {
      setError('Virtuelle Kreditkarten stehen im Free-Plan nicht zur Verfügung. Bitte führen Sie erst ein Upgrade auf Premium oder Elite durch.');
      setCreating(false);
      return;
    }

    try {
      const design = dbUser.plan === 'elite' ? 'black-metal' : dbUser.plan === 'premium' ? 'gold' : 'standard';
      const checkingAcc = accounts.find(a => a.type === 'checking') || accounts[0];

      const res = await fetch('/api/db/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: checkingAcc.id,
          cardNumber: generateCardNumber(),
          expiry: generateExpiryDate(),
          cvv: generateCVV(),
          type,
          design
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(`Virtuelle ${type === 'credit' ? 'Kreditkarte' : 'Debitkarte'} erfolgreich generiert!`);
      await fetchCards();
    } catch (err: any) {
      setError(err.message || 'Kartenlimitierung für Ihren aktuellen Plan erreicht.');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Kartenverwaltung</h1>
          <p className="text-sm text-slate-400 mt-1">Verwalten, sperren und generieren Sie Ihre virtuellen Debit- & Kreditkarten.</p>
        </div>

        {!dbUser?.is_frozen && (
          <div className="flex gap-3">
            <button
              onClick={() => handleCreateCard('debit')}
              disabled={creating}
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold hover:bg-white/10 transition-all"
            >
              + Debitkarte
            </button>
            <button
              onClick={() => handleCreateCard('credit')}
              disabled={creating}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-sm font-semibold shadow-md hover:brightness-110 transition-all"
            >
              + Kreditkarte
            </button>
          </div>
        )}
      </div>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
      {success && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">{success}</div>}

      {/* Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const isVisible = visibleCards[card.id] || false;
          const formattedNum = isVisible
            ? card.card_number.replace(/(\d{4})/g, '$1 ').trim()
            : `•••• •••• •••• ${card.card_number.slice(-4)}`;

          let designClasses = "from-slate-800 to-slate-950 text-white";
          if (card.design === 'gold') {
            designClasses = "from-amber-600 via-amber-700 to-yellow-900 text-amber-100";
          } else if (card.design === 'black-metal') {
            designClasses = "from-zinc-900 via-zinc-800 to-black text-zinc-100 border border-zinc-700";
          }

          return (
            <div key={card.id} className="space-y-4">
              {/* Virtual Credit Card Container */}
              <div className={`relative h-[200px] rounded-3xl bg-gradient-to-br ${designClasses} p-6 shadow-2xl flex flex-col justify-between overflow-hidden transition-transform duration-300 ${card.is_locked ? 'opacity-50' : 'hover:scale-[1.02]'}`}>
                {/* Chip & Bank Logo */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-[10px] tracking-widest font-bold uppercase opacity-80">BANK OF ARIEN</span>
                    <span className="text-[8px] opacity-60 font-mono mt-0.5">{card.type === 'credit' ? 'KREDITKARTE' : 'DEBITKARTE'}</span>
                  </div>
                  <div className="w-8 h-8 rounded bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center font-black text-xs text-yellow-300">
                    ARIEN
                  </div>
                </div>

                {/* Card Number */}
                <div className="my-auto">
                  <p className="text-xl font-mono tracking-widest text-center">{formattedNum}</p>
                </div>

                {/* Expiry and CVV */}
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[8px] uppercase opacity-50 block font-mono">Gültig bis</span>
                    <span className="text-sm font-mono">{card.expiry}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase opacity-50 block font-mono">CVV</span>
                    <span className="text-sm font-mono">{isVisible ? card.cvv : '•••'}</span>
                  </div>
                  {card.is_locked ? (
                    <span className="px-2 py-1 rounded bg-red-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Lock className="w-3 h-3" /> GESPERRT
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-emerald-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-slate-950">
                      <ShieldCheck className="w-3 h-3" /> AKTIV
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => toggleVisibility(card.id)}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{isVisible ? 'Verbergen' : 'Details'}</span>
                </button>
                <button
                  onClick={() => handleToggleLock(card.id, card.is_locked)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    card.is_locked
                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  }`}
                >
                  {card.is_locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{card.is_locked ? 'Entsperren' : 'Sperren'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
