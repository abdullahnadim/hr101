import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Users, Calendar, Settings } from "lucide-react";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HR 101 - Workspace",
  description: "Enterprise HR Management Platform",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F8F9FA] flex h-screen overflow-hidden antialiased text-neutral-900`} suppressHydrationWarning>
        
        {/* Premium Minimal Sidebar */}
        <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col shrink-0">
          <div className="h-16 flex items-center px-6 border-b border-neutral-100">
            <div className="h-6 w-6 bg-black rounded-md mr-3"></div>
            <span className="font-semibold text-sm tracking-wide">HR 101</span>
          </div>
          
          <nav className="flex-1 px-3 py-6 space-y-1">
            <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md bg-neutral-100 text-black font-medium text-sm transition-colors">
              <Users size={18} className="text-neutral-500" />
              Interviews
            </Link>
            <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-50 text-neutral-600 font-medium text-sm transition-colors">
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
        <main className="flex-1 flex flex-col h-full overflow-y-auto">
          {children}
          
          {/* Global Footer */}
          <footer className="w-full text-center py-6 mt-auto text-xs font-medium text-neutral-400">
            Developed by Mir
          </footer>
        </main>
      </body>
    </html>
  );
}