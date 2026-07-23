'use client';

import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [successMsg, setSuccessMsg] = useState('');

  async function fetchAllTickets() {
    setLoading(true);
    try {
      const res = await fetch('/admin/api/operations/get?type=tickets');
      const data = await res.json();
      if (data?.tickets) setTickets(data.tickets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAllTickets();
  }, []);

  const handleSendReply = async (ticketId: string) => {
    const reply = replyText[ticketId];
    if (!reply?.trim()) return;

    try {
      const res = await fetch('/admin/api/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'support',
          ticketId,
          reply
        })
      });

      if (!res.ok) throw new Error();

      setSuccessMsg('Antwort erfolgreich gesendet!');
      setReplyText(prev => ({ ...prev, [ticketId]: '' }));
      await fetchAllTickets();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Antwort fehlgeschlagen.');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-zinc-400 animate-pulse">Lade HQ Support-Tickets...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-wider text-zinc-100">Kunden-Support Tickets</h1>
        <p className="text-xs text-zinc-500 mt-1">Beantworten Sie hier Kundenanfragen direkt. Der Kunde sieht Ihre Antwort sofort im Kundenbereich.</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          {successMsg}
        </div>
      )}

      <div className="space-y-4">
        {tickets.length === 0 ? (
          <p className="text-sm text-zinc-600 text-center py-8">Aktuell keine Support-Tickets im System.</p>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-zinc-200">{ticket.subject}</h4>
                  <p className="text-[10px] text-zinc-500">
                    Von: <span className="text-zinc-300 font-bold">{ticket.user?.username}</span> ({ticket.user?.email}) • {new Date(ticket.created_at).toLocaleString('de-DE')}
                  </p>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                  ticket.status === 'open'
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {ticket.status === 'open' ? 'Offen' : 'Beantwortet'}
                </span>
              </div>

              <p className="text-sm text-zinc-300 bg-zinc-950 p-3 rounded-xl border border-zinc-800/50 whitespace-pre-wrap">{ticket.message}</p>

              {ticket.admin_reply && (
                <div className="pl-4 border-l-2 border-amber-500/50 text-xs text-zinc-400">
                  <p className="font-bold text-amber-500">Bisherige Antwort:</p>
                  <p className="italic mt-1 whitespace-pre-wrap">{ticket.admin_reply}</p>
                </div>
              )}

              {ticket.status === 'open' && (
                <div className="space-y-3 pt-2">
                  <textarea
                    rows={3}
                    placeholder="Geben Sie hier Ihre offizielle Antwort als BANK OF ARIEN ein..."
                    value={replyText[ticket.id] || ''}
                    onChange={(e) => setReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-100 placeholder-zinc-700 outline-none focus:border-amber-500 resize-none"
                  ></textarea>
                  <button
                    onClick={() => handleSendReply(ticket.id)}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Antworten</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
