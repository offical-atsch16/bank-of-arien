'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { MessageSquarePlus, Send, Sparkles } from 'lucide-react';

export default function SupportPage() {
  const { user, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function fetchTickets() {
    try {
      const res = await fetch('/api/db/support');
      const data = await res.json();
      if (data?.tickets) setTickets(data.tickets);
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
        await fetchTickets();
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

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbUser || !subject || !message) return;
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/db/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler beim Erstellen');

      setSuccess('Support-Ticket wurde erfolgreich erstellt. Ein Mitarbeiter wird Ihnen in Kürze antworten.');
      setSubject('');
      setMessage('');
      await fetchTickets();
    } catch (err: any) {
      setError('Ticket-Erstellung fehlgeschlagen.');
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
        <h1 className="text-3xl font-extrabold tracking-tight">Support-Center</h1>
        <p className="text-sm text-slate-400 mt-1">Hier können Sie Anfragen an die Bank stellen und Antworten der Kundenbetreuung einsehen.</p>
      </div>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
      {success && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold">Ihre Support-Anfragen</h2>
          {tickets.length === 0 ? (
            <p className="text-sm text-slate-500 bg-white/2 border border-white/5 rounded-3xl p-8 text-center">Sie haben bisher keine Tickets erstellt.</p>
          ) : (
            <div className="space-y-4">
              {tickets.map((t) => (
                <div key={t.id} className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-md space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white">{t.subject}</h4>
                      <p className="text-[10px] text-slate-500">{new Date(t.created_at).toLocaleString('de-DE')}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      t.status === 'open'
                        ? 'bg-blue-500/10 text-blue-400'
                        : t.status === 'answered'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {t.status === 'open' ? 'Offen' : t.status === 'answered' ? 'Beantwortet' : 'Geschlossen'}
                    </span>
                  </div>

                  <p className="text-sm text-slate-300 bg-black/10 rounded-xl p-3 border border-white/2 whitespace-pre-wrap">{t.message}</p>

                  {t.admin_reply && (
                    <div className="mt-3 pl-4 border-l-2 border-amber-500 space-y-1">
                      <p className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Antwort von BANK OF ARIEN:</span>
                      </p>
                      <p className="text-xs text-slate-300 italic whitespace-pre-wrap">{t.admin_reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create ticket form */}
        <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl space-y-4 self-start">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-blue-400" />
            <span>Neues Ticket erstellen</span>
          </h2>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Betreff / Thema</label>
              <input
                type="text"
                required
                placeholder="Frage zu Überweisungen..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-blue-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nachricht</label>
              <textarea
                required
                rows={4}
                placeholder="Beschreiben Sie Ihr Anliegen so detailliert wie möglich..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white outline-none focus:border-blue-500 transition-all text-sm resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 p-3.5 font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Senden</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
