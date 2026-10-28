'use client';
import Link from 'next/link';
import { Receipt, Users, Package, Phone } from 'lucide-react';

export default function ReceptionHub() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <header>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Front Desk Operations</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage incoming bills, visitors, and deliveries.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Module: Bills */}
        <Link href="/reception/bill" className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex flex-col items-start gap-4 cursor-pointer">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Receipt size={24} />
          </div>
          <div>
            <h2 className="font-bold text-neutral-900 group-hover:text-blue-700 transition-colors">Bill Logbook</h2>
            <p className="text-xs text-neutral-500 mt-1 line-clamp-2">Record and track physical vendor invoices and company bills.</p>
          </div>
        </Link>

        {/* Future Module Placeholders */}
        <div className="bg-neutral-50 border border-neutral-200/60 p-6 rounded-2xl flex flex-col items-start gap-4 opacity-60 grayscale cursor-not-allowed">
          <div className="w-12 h-12 bg-neutral-200 text-neutral-500 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <h2 className="font-bold text-neutral-700">Visitor Log</h2>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1">Coming Soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}