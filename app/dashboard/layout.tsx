'use client';

import { Sidebar, MobileNavigation } from './components/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen pb-24 lg:pb-0 overflow-y-auto">
        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Bar */}
      <MobileNavigation />
    </div>
  );
}
