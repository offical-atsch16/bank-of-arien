'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  LayoutDashboard,
  Wallet,
  Send,
  Calendar,
  History,
  CreditCard,
  PiggyBank,
  Coins,
  BarChart3,
  HelpCircle,
  Settings,
  Crown,
  Bell
} from 'lucide-react';

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Übersicht', href: '/dashboard' },
  { icon: Wallet, label: 'Konten', href: '/dashboard/accounts' },
  { icon: Send, label: 'Überweisung', href: '/dashboard/transfer' },
  { icon: Calendar, label: 'Daueraufträge', href: '/dashboard/standing-orders' },
  { icon: History, label: 'Transaktionen', href: '/dashboard/transactions' },
  { icon: CreditCard, label: 'Karten', href: '/dashboard/cards' },
  { icon: PiggyBank, label: 'Sparziele', href: '/dashboard/savings' },
  { icon: Coins, label: 'Kredite', href: '/dashboard/loans' },
  { icon: BarChart3, label: 'Statistiken', href: '/dashboard/statistics' },
  { icon: HelpCircle, label: 'Support-Tickets', href: '/dashboard/support' },
  { icon: Settings, label: 'Einstellungen', href: '/dashboard/settings' },
  { icon: Crown, label: 'Kontopläne', href: '/dashboard/plans' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-slate-950/40 backdrop-blur-2xl p-6 h-screen sticky top-0">
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 flex items-center justify-center font-black text-md tracking-wider">
          A
        </div>
        <span className="font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
          BANK OF ARIEN
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-none">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500/15 to-violet-500/15 text-blue-400 border border-blue-500/10 shadow-lg shadow-blue-500/5'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserButton afterSignOutUrl="/" />
          <span className="text-xs text-slate-400 font-medium">Mein Profil</span>
        </div>
        <Link href="/dashboard/notifications" className="p-2 hover:bg-white/5 rounded-xl transition-all relative">
          <Bell className="w-5 h-5 text-slate-400 hover:text-white" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        </Link>
      </div>
    </aside>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();

  // Pick top 5 most important menu links for mobile bar
  const mobileMenu = [
    { icon: LayoutDashboard, label: 'Übersicht', href: '/dashboard' },
    { icon: Send, label: 'Senden', href: '/dashboard/transfer' },
    { icon: CreditCard, label: 'Karten', href: '/dashboard/cards' },
    { icon: PiggyBank, label: 'Sparziele', href: '/dashboard/savings' },
    { icon: HelpCircle, label: 'Support', href: '/dashboard/support' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-t border-white/5 px-4 py-2 flex justify-around items-center">
      {mobileMenu.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
              isActive ? 'text-blue-400 scale-105 font-semibold' : 'text-slate-500 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
