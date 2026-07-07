'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useApplicationStore } from '@/store/application.store';
import { Bell, Calendar, Search, Check, AlertCircle, Sparkles } from 'lucide-react';
import { SearchPalette } from './SearchPalette';
import { toast } from 'sonner';

export const TopBar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, checkUser } = useAuthStore();
  const { applications, fetchApplications, toggleReminder } = useApplicationStore();
  const [mounted, setMounted] = useState(false);
  
  // Search & Notifications states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  
  // Keep track of notified reminders in local storage
  const [notifiedIds, setNotifiedIds] = useState<string[]>([]);

  useEffect(() => {
    checkUser();
    fetchApplications();
    setMounted(true);

    // Load already notified IDs
    const cached = localStorage.getItem('jobtrack_notified_reminders');
    if (cached) {
      try {
        setNotifiedIds(JSON.parse(cached));
      } catch {
        // Ignore parsing errors
      }
    }

    // Request notification permissions
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [checkUser, fetchApplications]);

  // Listen for Ctrl+K/Cmd+K shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle clicking outside notifications dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reminders polling logic (Check every 30 seconds for upcoming reminders)
  useEffect(() => {
    if (!mounted || applications.length === 0) return;

    const checkReminders = () => {
      const now = new Date().getTime();
      const allReminders = applications.flatMap(app => 
        (app.reminders || []).map(r => ({
          ...r,
          companyName: app.companyName,
          roleTitle: app.roleTitle,
          applicationId: app.id
        }))
      );

      allReminders.forEach((rem) => {
        const remTime = new Date(rem.remindAt).getTime();
        
        // If reminder is today/past, not completed, and not already notified in this session/caching
        if (!rem.isCompleted && remTime <= now && !notifiedIds.includes(rem.id)) {
          // Trigger In-app toast
          toast.info(`Reminder: ${rem.type.replace('_', ' ')} for ${rem.companyName}`, {
            description: `${rem.roleTitle} - Date: ${new Date(rem.remindAt).toLocaleDateString()}`,
            action: {
              label: 'View',
              onClick: () => router.push(`/applications/${rem.applicationId}`)
            }
          });

          // Trigger System Notification if permitted
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`JobTrack: ${rem.type.replace('_', ' ')}`, {
                body: `Action required for ${rem.companyName} - ${rem.roleTitle}`,
                icon: '/favicon.ico'
              });
            } catch (err) {
              console.error('System notification trigger error:', err);
            }
          }

          // Cache notified ID
          const updated = [...notifiedIds, rem.id];
          setNotifiedIds(updated);
          localStorage.setItem('jobtrack_notified_reminders', JSON.stringify(updated));
        }
      });
    };

    // Initial check
    checkReminders();

    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [applications, notifiedIds, mounted, router]);

  // Flatten and filter active reminders
  const activeReminders = applications.flatMap(app => 
    (app.reminders || []).map(r => ({
      ...r,
      companyName: app.companyName,
      roleTitle: app.roleTitle,
      applicationId: app.id
    }))
  ).filter(r => !r.isCompleted)
   .sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime());

  // Determine current page title
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard Overview';
    if (pathname.startsWith('/applications')) return 'Job Applications';
    if (pathname === '/companies') return 'Companies';
    if (pathname === '/calendar') return 'Schedule Calendar';
    if (pathname === '/kanban') return 'Kanban Board';
    if (pathname === '/resumes') return 'Resume Version Manager';
    if (pathname === '/analytics') return 'Career Analytics';
    if (pathname === '/settings') return 'Settings';
    return 'Dashboard';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/70 px-8 backdrop-blur">
      {/* Title & Greetings */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Dashboard</p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{getPageTitle()}</h2>
        {pathname === '/' && user && mounted && (
          <p className="text-sm text-slate-500">
            {getGreeting()}, <span className="font-semibold text-slate-700">{user.name || 'User'}</span>. Here is your latest job search activity.
          </p>
        )}
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3">
        {/* Global Search trigger bar */}
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-400 hover:text-slate-600 hover:border-slate-350 hover:bg-slate-50 shadow-2xs transition-all max-w-[240px] md:w-[220px]"
        >
          <Search size={14} className="text-slate-450 shrink-0" />
          <span className="truncate text-left font-medium">Search anything...</span>
          <kbd className="hidden md:inline-block border border-slate-200 bg-slate-50 text-[9px] font-bold px-1.5 py-0.5 rounded-lg shrink-0 select-none text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Date Display */}
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-550 shadow-2xs">
          <Calendar size={14} className="text-indigo-600" />
          <span className="font-semibold">{mounted ? new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : '...'}</span>
        </div>

        {/* Notifications center Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-2xs transition-all hover:border-slate-300 hover:text-slate-700"
          >
            <Bell size={15} />
            {activeReminders.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-extrabold text-white animate-in scale-in">
                {activeReminders.length}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-3.5 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-top-3 duration-250 select-none">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-3.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Upcoming Tasks</span>
                {activeReminders.length > 0 && (
                  <span className="rounded-full bg-indigo-50 border border-indigo-150 px-2 py-0.5 text-[9px] font-bold text-indigo-700 animate-pulse">
                    {activeReminders.length} Active
                  </span>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {activeReminders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-6 text-center text-slate-450">
                    <Sparkles size={24} className="text-slate-300 mb-1.5" />
                    <p className="text-[11px] font-bold">No active reminders</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">We will notify you of upcoming interview deadlines or follow-ups.</p>
                  </div>
                ) : (
                  activeReminders.map((rem) => (
                    <div key={rem.id} className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors">
                      <button 
                        onClick={() => toggleReminder(rem.id, true)}
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50 text-transparent hover:text-indigo-600 transition-all cursor-pointer"
                        title="Mark Complete"
                      >
                        <Check size={12} className="stroke-[3]" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                          {rem.type.replace('_', ' ')}
                        </p>
                        <p 
                          onClick={() => { router.push(`/applications/${rem.applicationId}`); setIsNotifOpen(false); }}
                          className="text-xs font-semibold text-slate-900 truncate hover:text-indigo-600 cursor-pointer mt-0.5"
                        >
                          {rem.companyName}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{rem.roleTitle}</p>
                        <div className="mt-2.5 flex items-center gap-1 text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-150/60 w-fit px-2 py-0.5 rounded-md">
                          <AlertCircle size={10} />
                          <span>Due: {new Date(rem.remindAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-100 bg-slate-50 px-5 py-2.5 text-center">
                <button 
                  onClick={() => { router.push('/calendar'); setIsNotifOpen(false); }}
                  className="text-[10px] font-bold uppercase tracking-wider text-indigo-650 hover:text-indigo-550 transition-colors"
                >
                  View Schedule Calendar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Search command palette */}
      <SearchPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
};
