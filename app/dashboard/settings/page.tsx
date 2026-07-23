'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { User, KeyRound, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (!isLoaded || loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 w-40 bg-white/5 rounded"></div>
      <div className="h-40 bg-white/5 rounded-3xl"></div>
    </div>;
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Einstellungen</h1>
        <p className="text-sm text-slate-400 mt-1">Hier finden Sie Informationen zu Ihrem Profil, Sicherheitseinstellungen und Plänen.</p>
      </div>

      <div className="p-6 md:p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl space-y-6">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <User className="w-5 h-5 text-blue-400" />
          <span>Profil-Informationen</span>
        </h2>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 rounded-xl bg-white/2 border border-white/5">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Username</span>
              <span className="text-sm font-semibold text-white">{dbUser?.username}</span>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 rounded-xl bg-white/2 border border-white/5">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">E-Mail-Adresse</span>
              <span className="text-sm font-semibold text-white">{dbUser?.email}</span>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 rounded-xl bg-white/2 border border-white/5">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Persönlicher Usertag</span>
              <span className="text-sm font-semibold text-blue-400 font-mono">@{dbUser?.usertag}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety info card */}
      <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-violet-400" />
          <span>Sicherheit & PIN</span>
        </h2>
        <p className="text-sm text-slate-400">
          Ihre 4-stellige Sicherheits-PIN wurde bei der ersten Registrierung eingerichtet. Sie wird zur sicheren Ausführung aller Überweisungen verwendet. Sollten Sie Ihre PIN vergessen haben, kontaktieren Sie bitte den Support.
        </p>
        <div className="flex items-center gap-2 text-xs text-amber-400 font-bold">
          <Sparkles className="w-4 h-4" />
          <span>Die Verschlüsselung erfolgt sicher über starke Passworthashes (bcrypt) auf dem Datenbankserver.</span>
        </div>
      </div>
    </div>
  );
}
