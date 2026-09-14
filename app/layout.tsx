import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutDashboard, Users, Calendar, Settings } from "lucide-react";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HR 101 - Workspace",
  description: "Enterprise HR Management Platform",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F8F9FA] flex h-screen overflow-hidden antialiased text-neutral-900`} suppressHydrationWarning>
        
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-white border-r border-neutral-200 flex-col shrink-0 z-20">
          <div className="h-16 flex items-center px-6 border-b border-neutral-100">
            <div className="h-6 w-6 bg-black rounded-md mr-3"></div>
            <span className="font-semibold text-sm tracking-wide">HR 101</span>
          </div>
          
          <nav className="flex-1 px-3 py-6 space-y-1">
            <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-50 text-neutral-600 font-medium text-sm transition-colors">
              <LayoutDashboard size={18} className="text-neutral-400" />
              Overview
            </Link>
            <Link href="/candidates" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-50 text-neutral-600 font-medium text-sm transition-colors">
              <Users size={18} className="text-neutral-400" />
              Candidates
            </Link>
            <Link href="/calendar" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-50 text-neutral-600 font-medium text-sm transition-colors">
              <Calendar size={18} className="text-neutral-400" />
              Calendar
            </Link>
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-50 text-neutral-600 font-medium text-sm transition-colors">
              <Settings size={18} className="text-neutral-400" />
              Settings
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-y-auto pb-16 md:pb-0">
          {children}
          
          <footer className="w-full text-center py-6 mt-auto text-xs font-medium text-neutral-400">
            Developed by Mir
          </footer>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex justify-around items-center h-16 z-50 px-2 safe-area-pb">
          <Link href="/" className="flex flex-col items-center gap-1 p-2 text-neutral-500 hover:text-black">
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-medium">Overview</span>
          </Link>
          <Link href="/candidates" className="flex flex-col items-center gap-1 p-2 text-neutral-500 hover:text-black">
            <Users size={20} />
            <span className="text-[10px] font-medium">Candidates</span>
          </Link>
          <Link href="/calendar" className="flex flex-col items-center gap-1 p-2 text-neutral-500 hover:text-black">
            <Calendar size={20} />
            <span className="text-[10px] font-medium">Calendar</span>
          </Link>
          <Link href="/settings" className="flex flex-col items-center gap-1 p-2 text-neutral-500 hover:text-black">
            <Settings size={20} />
            <span className="text-[10px] font-medium">Settings</span>
          </Link>
        </nav>

      </body>
    </html>
  );
}