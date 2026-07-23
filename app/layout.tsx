import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

export const metadata: Metadata = {
  title: "BANK OF ARIEN – Premium Next-Gen Banking",
  description: "Erleben Sie modernstes, voll-simuliertes Banking im atemberaubenden Liquid-Glass Design.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="de" className="dark">
        <body className="antialiased bg-slate-950 text-slate-100 min-h-screen flex flex-col">
          {/* Global Demo Warning Banner */}
          <div className="bg-gradient-to-r from-amber-500/20 via-yellow-600/20 to-amber-500/20 text-amber-300 border-b border-amber-500/10 text-[10px] md:text-xs text-center py-2 font-black tracking-widest uppercase sticky top-0 z-50 backdrop-blur-md">
            ⚠️ BANK OF ARIEN – DEMO-ANWENDUNG: SPIELGELD, KEIN ECHTES INSTITUT
          </div>

          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
