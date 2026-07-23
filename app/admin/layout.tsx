'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Users,
  Terminal,
  Send,
  Settings,
  LogOut,
  FileText,
  HelpCircle,
  PiggyBank,
  ShieldCheck
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    // Clear cookie session via a fast endpoint or client-side removal
    document.cookie = "admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/admin/login');
  };

  const navItems = [
    { icon: Users, label: 'Kundenliste', href: '/admin/dashboard' },
    { icon: HelpCircle, label: 'Support-Tickets', href: '/admin/support' },
    { icon: Terminal, label: 'Aktivitätslogs', href: '/admin/audit' },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900 p-6 flex flex-col justify-between">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-sm">
              HQ
            </div>
            <div>
              <span className="font-black text-xs tracking-widest text-zinc-100 block">BANK OF ARIEN</span>
              <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">ADMIN PORTAL</span>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all text-left"
        >
          <LogOut className="w-5 h-5" />
          <span>Abmelden</span>
        </button>
      </aside>

      {/* Admin content area */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          {children}
        </div>
      </div>
    </div>
  );
}
