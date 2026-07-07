'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApplicationStore, StageType } from '@/store/application.store';
import { 
  ChevronLeft, 
  ChevronRight, 
  Briefcase, 
  Calendar as CalendarIcon, 
  Clock, 
  Sparkles,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  type: 'APPLIED' | 'REMINDER';
  title: string;
  subtitle: string;
  date: Date;
  color: { bg: string; text: string; dot: string };
  applicationId: string;
  reminderType?: string;
  isCompleted?: boolean;
}

export default function CalendarPage() {
  const router = useRouter();
  const { applications, fetchApplications, toggleReminder } = useApplicationStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get start/end of month calculations
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayIndex = firstDayOfMonth.getDay(); // 0 is Sunday, 1 is Monday...
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Previous month padding days
  const prevMonthDays = [];
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate();
  for (let i = startDayIndex - 1; i >= 0; i--) {
    prevMonthDays.push(new Date(year, month - 1, totalDaysInPrevMonth - i));
  }

  // Current month days
  const currentMonthDays = [];
  for (let i = 1; i <= totalDaysInMonth; i++) {
    currentMonthDays.push(new Date(year, month, i));
  }

  // Next month padding days to fill grid (6 rows of 7 days = 42 cells)
  const nextMonthDays = [];
  const remainingCells = 42 - (prevMonthDays.length + currentMonthDays.length);
  for (let i = 1; i <= remainingCells; i++) {
    nextMonthDays.push(new Date(year, month + 1, i));
  }

  const allCalendarCells = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  // Helper colors for events
  const getEventColors = (type: string, detailType?: string) => {
    if (type === 'APPLIED') {
      return { bg: 'bg-sky-50 border-sky-150', text: 'text-sky-700', dot: 'bg-sky-500' };
    }
    // Reminders mapping
    switch (detailType) {
      case 'INTERVIEW':
        return { bg: 'bg-purple-50 border-purple-150', text: 'text-purple-700', dot: 'bg-purple-500' };
      case 'DEADLINE':
        return { bg: 'bg-rose-50 border-rose-150', text: 'text-rose-700', dot: 'bg-rose-500' };
      case 'FOLLOW_UP':
        return { bg: 'bg-amber-50 border-amber-150', text: 'text-amber-700', dot: 'bg-amber-500' };
      default:
        return { bg: 'bg-slate-50 border-slate-150', text: 'text-slate-700', dot: 'bg-slate-500' };
    }
  };

  // Compile all events from applications
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const targetString = date.toDateString();

    applications.forEach((app) => {
      // 1. Check Applied At Date
      if (app.appliedAt) {
        const appDate = new Date(app.appliedAt);
        if (appDate.toDateString() === targetString) {
          events.push({
            id: `applied-${app.id}`,
            type: 'APPLIED',
            title: `Submitted Application`,
            subtitle: app.companyName,
            date: appDate,
            color: getEventColors('APPLIED'),
            applicationId: app.id,
          });
        }
      }

      // 2. Check Reminders
      if (app.reminders) {
        app.reminders.forEach((rem) => {
          const remDate = new Date(rem.remindAt);
          if (remDate.toDateString() === targetString) {
            events.push({
              id: rem.id,
              type: 'REMINDER',
              title: `${rem.type.replace('_', ' ')} Reminder`,
              subtitle: app.companyName,
              date: remDate,
              color: getEventColors('REMINDER', rem.type),
              applicationId: app.id,
              reminderType: rem.type,
              isCompleted: rem.isCompleted,
            });
          }
        });
      }
    });

    return events;
  };

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Selected date events
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate ? date.toDateString() === selectedDate.toDateString() : false;
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month && date.getFullYear() === year;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-outfit">Schedule Calendar</h1>
          <p className="mt-1 text-sm text-slate-500">Track deadlines, interview notifications, and submission timelines visually.</p>
        </div>
        
        {/* Month Selector Controls */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-2xs rounded-2xl p-1.5 w-fit">
          <button 
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-50 text-slate-500 rounded-xl transition-all cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-extrabold text-slate-800 min-w-[120px] text-center">
            {monthNames[month]} {year}
          </span>
          <button 
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-50 text-slate-500 rounded-xl transition-all cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Month Calendar Grid */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs">
          {/* Weekday indicators */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400 uppercase tracking-widest pb-3.5 border-b border-slate-100 select-none">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 mt-3">
            {allCalendarCells.map((day, idx) => {
              const dayEvents = getEventsForDate(day);
              const dayCurrent = isCurrentMonth(day);
              const dayToday = isToday(day);
              const daySelected = isSelected(day);

              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[90px] p-2 rounded-2xl border flex flex-col justify-between transition-all duration-200 cursor-pointer select-none relative group ${
                    daySelected 
                      ? 'border-indigo-500 bg-indigo-50/20 shadow-xs'
                      : dayToday
                        ? 'border-indigo-200 bg-indigo-50/10 hover:border-indigo-400'
                        : dayCurrent
                          ? 'border-slate-150/70 bg-white hover:border-slate-300'
                          : 'border-slate-100 bg-slate-50/40 text-slate-350 opacity-60 hover:border-slate-200'
                  }`}
                >
                  {/* Day Indicator number */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold flex h-6 w-6 items-center justify-center rounded-lg transition-all ${
                      dayToday 
                        ? 'bg-indigo-650 text-white font-extrabold shadow-sm'
                        : daySelected
                          ? 'text-indigo-700 font-extrabold'
                          : dayCurrent ? 'text-slate-700' : 'text-slate-400'
                    }`}>
                      {day.getDate()}
                    </span>
                    
                    {/* Small indicators */}
                    {dayEvents.length > 0 && (
                      <span className="flex h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                    )}
                  </div>

                  {/* List Event Titles on cell if space allows */}
                  <div className="mt-1.5 space-y-1 overflow-hidden flex-1 flex flex-col justify-end">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div 
                        key={ev.id}
                        className={`text-[8.5px] px-1.5 py-0.5 rounded border font-bold truncate tracking-wide flex items-center gap-1 leading-normal ${ev.color.bg} ${ev.color.text} ${
                          ev.isCompleted ? 'opacity-50 line-through' : ''
                        }`}
                      >
                        <span className={`h-1 w-1 rounded-full shrink-0 ${ev.color.dot}`} />
                        <span className="truncate">{ev.subtitle}</span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[7.5px] text-slate-450 font-bold px-1.5">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda side Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs flex flex-col min-h-[440px]">
            {/* Agenda Header */}
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon size={16} className="text-indigo-650" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Day Agenda</h3>
              </div>
              <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {selectedDate ? selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Select date'}
              </span>
            </div>

            {/* Agenda Items list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 mt-3.5 pr-0.5 space-y-4">
              {selectedDateEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center text-slate-450 flex-1 my-auto">
                  <Sparkles size={32} className="text-slate-300 mb-2.5 animate-pulse" />
                  <p className="text-xs font-bold text-slate-700">Clear Schedule</p>
                  <p className="text-[11px] text-slate-400 mt-1">No application logs, interview sessions, or active reminders for this date.</p>
                </div>
              ) : (
                selectedDateEvents.map((ev) => (
                  <div key={ev.id} className="pt-4 first:pt-0 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Event tag badge */}
                      <span className={`inline-block text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${ev.color.bg} ${ev.color.text}`}>
                        {ev.title}
                      </span>
                      
                      {/* Event details */}
                      <p 
                        onClick={() => router.push(`/applications/${ev.applicationId}`)}
                        className="text-xs font-bold text-slate-850 hover:text-indigo-650 cursor-pointer transition-colors truncate mt-1 flex items-center gap-1"
                      >
                        {ev.subtitle} <ExternalLink size={10} className="text-slate-400" />
                      </p>

                      <p className="text-[10px] text-slate-450 flex items-center gap-1">
                        <Clock size={10} />
                        <span>Date: {new Date(ev.date).toLocaleDateString()}</span>
                      </p>
                    </div>

                    {/* Quick check off action if reminder */}
                    {ev.type === 'REMINDER' && (
                      <button 
                        onClick={() => toggleReminder(ev.id, !ev.isCompleted)}
                        className={`rounded-xl border p-2 shadow-3xs cursor-pointer transition-all flex items-center justify-center ${
                          ev.isCompleted 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-250 hover:bg-white hover:text-slate-400 hover:border-slate-200' 
                            : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={ev.isCompleted ? 'Mark Active' : 'Mark Complete'}
                      >
                        <CheckCircle2 size={14} className={ev.isCompleted ? 'fill-emerald-100' : ''} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <p className="text-[10px] text-slate-450 leading-normal border-t border-slate-100 pt-3.5 mt-4">
              Events are populated automatically from your application submission logs (`appliedAt`) and the Action events scheduled inside the details pages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
