'use client';

import { useEffect, useState } from 'react';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        const res = await fetch('/admin/api/operations/get?type=audit');
        const data = await res.json();
        if (data?.logs) setLogs(data.logs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-zinc-400 animate-pulse">Lade HQ Audit-Logs...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-wider text-zinc-100 font-mono">HQ Audit Logs</h1>
        <p className="text-xs text-zinc-500 mt-1">Revisionssichere und lückenlose Protokollierung aller systemweiten Administrator-Aktionen.</p>
      </div>

      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
        {logs.length === 0 ? (
          <p className="text-sm text-zinc-600 text-center py-8">Keine Aktivitätslogs im System vorhanden.</p>
        ) : (
          <div className="font-mono text-xs space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-md font-bold mr-2">
                    {log.action}
                  </span>
                  <span className="text-zinc-400">
                    Admin <span className="text-zinc-200 font-bold">@{log.admin?.username || 'system'}</span> hat Aktion auf User <span className="text-zinc-200 font-bold">@{log.user?.username || 'unknown'}</span> ausgeführt.
                  </span>
                  {log.details && (
                    <p className="text-[10px] text-zinc-500 pl-4 mt-1">Details: {JSON.stringify(log.details)}</p>
                  )}
                </div>
                <div className="text-zinc-600 text-right text-[10px]">
                  {new Date(log.created_at).toLocaleString('de-DE')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
