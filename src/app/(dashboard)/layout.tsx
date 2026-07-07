import React from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col pl-20">
        <TopBar />
        <main className="flex-1 px-8 py-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
