'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { 
  LayoutDashboard, 
  Briefcase, 
  Building2,
  Kanban as KanbanIcon, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  Layers,
  Calendar
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Applications', href: '/applications', icon: Briefcase },
    { label: 'Companies', href: '/companies', icon: Building2 },
    { label: 'Kanban Board', href: '/kanban', icon: KanbanIcon },
    { label: 'Schedule Calendar', href: '/calendar', icon: Calendar },
    { label: 'Resume Manager', href: '/resumes', icon: FileText },
    { label: 'Career Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-20 hover:w-72 flex-col justify-between border-r border-slate-200/80 bg-white/90 px-3 py-6 backdrop-blur transition-all duration-300 ease-in-out group shadow-sm hover:shadow-xl">
      <div className="overflow-hidden">
        <div className="mb-8 flex items-center justify-center group-hover:justify-start gap-3 px-1.5 transition-all duration-300">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 shadow-sm">
            <Layers size={18} className="text-white" />
          </div>
          <div className="flex flex-col min-w-0 transition-all duration-300 w-0 group-hover:w-44 opacity-0 group-hover:opacity-100 overflow-hidden">
            <h1 className="text-base font-bold tracking-tight text-slate-900 truncate">JobTrack</h1>
            <p className="text-[11px] font-medium text-slate-500 truncate">Simple job search workspace</p>
          </div>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center group-hover:justify-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 shrink-0 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className={`shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="transition-all duration-300 w-0 group-hover:w-44 opacity-0 group-hover:opacity-100 overflow-hidden truncate">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-5 overflow-hidden">
        {user && (
          <div className="flex items-center justify-center group-hover:justify-start gap-3 rounded-2xl bg-slate-50 px-2 group-hover:px-3 py-3 transition-all duration-300">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold uppercase text-white">
              {user.name ? user.name[0] : user.email[0]}
            </div>
            <div className="min-w-0 transition-all duration-300 w-0 group-hover:w-40 opacity-0 group-hover:opacity-100 overflow-hidden">
              <p className="truncate text-sm font-semibold text-slate-800">{user.name || 'User'}</p>
              <p className="truncate text-[11px] text-slate-500">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center justify-center group-hover:justify-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-rose-600 transition-all duration-300 hover:bg-rose-50"
        >
          <LogOut size={18} className="shrink-0" />
          <span className="transition-all duration-300 w-0 group-hover:w-44 opacity-0 group-hover:opacity-100 overflow-hidden truncate">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};
