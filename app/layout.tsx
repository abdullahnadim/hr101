// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppNavigation } from "./components/AppNavigation";

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
        <Providers>
          <AppNavigation>
            {children}
          </AppNavigation>
        </Providers>
      </body>
    </html>
  );
}