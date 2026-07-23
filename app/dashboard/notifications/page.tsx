'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Bell, Check } from 'lucide-react';

export default function NotificationsPage() {
  const { user, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/db/notifications');
      const data = await res.json();
      if (data?.notifications) setNotifications(data.notifications);
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
        await fetchNotifications();
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

  const markAllAsRead = async () => {
    if (!dbUser) return;
    try {
      await fetch('/api/db/notifications', { method: 'POST' });
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isLoaded || loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 w-40 bg-white/5 rounded"></div>
      <div className="h-40 bg-white/5 rounded-3xl"></div>
    </div>;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Benachrichtigungen</h1>
          <p className="text-sm text-slate-400 mt-1">Ihr persönliches Nachrichtencenter der BANK OF ARIEN.</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-blue-400 hover:underline flex items-center gap-1.5 font-bold"
          >
            <Check className="w-4 h-4" />
            <span>Alle gelesen</span>
          </button>
        )}
      </div>

      <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl space-y-4">
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">Keine Benachrichtigungen vorhanden.</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                  n.read
                    ? 'border-white/5 bg-white/2 opacity-75'
                    : 'border-blue-500/20 bg-blue-500/5'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  n.type === 'transfer' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white font-medium">{n.message}</p>
                  <p className="text-[10px] text-slate-500">{new Date(n.created_at).toLocaleString('de-DE')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
