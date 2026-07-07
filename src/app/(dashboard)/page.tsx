"use client";

import React, { useEffect, useState } from "react";
import { useApplicationStore, StageType, JobApplication } from "@/store/application.store";
import { stageColors } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { QuickAddModal } from "@/components/dashboard/QuickAddModal";
import {
  Briefcase,
  Clock,
  Sparkles,
  CalendarDays,
  Plus,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  FileText,
  Bell,
  Flame,
  Target
} from "lucide-react";
import Link from "next/link";
import { CompanyAvatar } from "@/components/ui/CompanyAvatar";


export default function DashboardHome() {
  const {
    applications,
    fetchApplications,
    toggleReminder,
    isLoading,
  } = useApplicationStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetchApplications();
    setMounted(true);
  }, [fetchApplications]);

  // Streak & Goal Calculations
  const calculateStreak = (apps: JobApplication[]) => {
    if (apps.length === 0) return 0;
    const dates = new Set<string>();
    
    apps.forEach(app => {
      dates.add(new Date(app.createdAt).toDateString());
      if (app.appliedAt) {
        dates.add(new Date(app.appliedAt).toDateString());
      }
    });

    let streak = 0;
    const checkDate = new Date();
    
    // Check if today is in dates
    if (dates.has(checkDate.toDateString())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      while (dates.has(checkDate.toDateString())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    } else {
      // Check if yesterday is in dates (streak is active if they haven't applied yet today)
      checkDate.setDate(checkDate.getDate() - 1);
      if (dates.has(checkDate.toDateString())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
        while (dates.has(checkDate.toDateString())) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }
    }
    return streak;
  };

  const getWeeklyAppCount = (apps: JobApplication[]) => {
    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    return apps.filter(app => {
      const appTime = new Date(app.appliedAt || app.createdAt).getTime();
      return appTime >= monday.getTime();
    }).length;
  };

  const streakDays = calculateStreak(applications);
  const weeklyTarget = 5;
  const weeklyCount = getWeeklyAppCount(applications);
  const weeklyPercent = Math.min((weeklyCount / weeklyTarget) * 100, 100);

  // Aggregate stats
  const totalApps = applications.length;
  const appliedApps = applications.filter(
    (a) => a.currentStage !== "WATCHING" && a.currentStage !== "PREPARED"
  ).length;
  const interviewApps = applications.filter(
    (a) =>
      a.currentStage === "HR_SCREENING" ||
      a.currentStage === "INTERVIEW_1" ||
      a.currentStage === "INTERVIEW_2" ||
      a.currentStage === "REVIEW"
  ).length;
  const offers = applications.filter((a) => a.currentStage === "OFFER").length;

  // New opportunities added in the last 7 days (weekly trend)
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = applications.filter(
    (a) => new Date(a.createdAt).getTime() > oneWeekAgo
  ).length;

  // Success rate (Offers / Total Applications)
  const successRate = totalApps > 0 ? Math.round((offers / totalApps) * 100) : 0;

  // Pipeline funnel calculation
  const watchingCount = applications.filter((a) => a.currentStage === "WATCHING").length;
  const preparedCount = applications.filter((a) => a.currentStage === "PREPARED").length;
  const appliedCount = applications.filter((a) => a.currentStage === "APPLIED").length;
  const interviewCount = applications.filter((a) =>
    ["HR_SCREENING", "INTERVIEW_1", "INTERVIEW_2", "REVIEW"].includes(a.currentStage)
  ).length;
  const offerCount = applications.filter((a) => a.currentStage === "OFFER").length;
  const rejectedCount = applications.filter((a) => a.currentStage === "REJECTED").length;

  const getPercentage = (count: number) => {
    return totalApps > 0 ? Math.round((count / totalApps) * 100) : 0;
  };

  // Reminders aggregation
  const activeReminders = applications
    .flatMap((a) => (a.reminders || []).map((r) => ({ ...r, application: a })))
    .filter((r) => !r.isCompleted)
    .sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime())
    .slice(0, 5);

  // Recent activity logs (based on latest stage transitions)
  const recentActivities = applications
    .flatMap((a) => (a.stages || []).map((s) => ({ ...s, application: a })))
    .sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime())
    .slice(0, 5);

  // Reminder relative date urgency formatter
  const getReminderUrgency = (dateStr: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dateZero = new Date(dateStr);
    dateZero.setHours(0, 0, 0, 0);

    const diffTime = dateZero.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isPast = new Date(dateStr).getTime() < Date.now();

    const timeString = new Date(dateStr).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isPast) {
      return {
        label: diffDays === 0 ? `Overdue today (${timeString})` : `Overdue by ${Math.abs(diffDays)}d`,
        style: "bg-rose-50 border-rose-200 text-rose-700 font-bold",
        itemStyle: "bg-rose-50/15 border-rose-100 hover:bg-rose-50/25 hover:border-rose-200",
      };
    } else if (diffDays === 0) {
      return {
        label: `Today at ${timeString}`,
        style: "bg-amber-50 border-amber-200 text-amber-700 font-bold animate-pulse",
        itemStyle: "bg-amber-50/10 border-amber-100/80 hover:bg-amber-50/20",
      };
    } else if (diffDays === 1) {
      return {
        label: `Tomorrow at ${timeString}`,
        style: "bg-sky-50 border-sky-200 text-sky-700 font-medium",
        itemStyle: "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-200",
      };
    } else {
      return {
        label: `${new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" })} (${timeString})`,
        style: "bg-slate-100 border-slate-200 text-slate-600",
        itemStyle: "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-200",
      };
    }
  };

  const handleToggleReminder = async (id: string, currentStatus: boolean) => {
    await toggleReminder(id, !currentStatus);
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Overview</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor opportunities, reminders, and stage movement in a calmer workspace.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 shadow-sm hover:shadow-md transition-shadow">
          <Plus size={16} /> Quick Add Job
        </Button>
      </div>

      {/* Goal Tracker & Daily Streaks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Streak widget */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-3xl p-6 shadow-sm border border-orange-400/20 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-100">Consistency Tracker</span>
            <h3 className="text-2xl font-extrabold flex items-center gap-1.5 font-outfit">
              {streakDays} Day Application Streak {streakDays > 0 ? '🔥' : '⏳'}
            </h3>
            <p className="text-[11px] text-orange-50 font-medium">
              {streakDays > 0 
                ? "Excellent dedication! Keep submitting applications to grow your pipeline."
                : "Submit or update any job application today to start your application streak!"}
            </p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-xs">
            <Flame size={28} className={streakDays > 0 ? "text-orange-100 fill-orange-200/35 animate-pulse" : "text-orange-200"} />
          </div>
        </div>

        {/* Weekly Goal widget */}
        <div className="surface-card rounded-3xl p-6 border border-slate-150/45 shadow-3xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Weekly Target Progress</span>
              <h3 className="text-xl font-bold text-slate-800">
                {weeklyCount} / {weeklyTarget} Applied This Week
              </h3>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-150">
              <Target size={18} />
            </div>
          </div>
          
          <div className="mt-4.5 space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                style={{ width: `${weeklyPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-450 uppercase tracking-wider">
              <span>Goal: {weeklyPercent}% Complete</span>
              <span>
                {weeklyCount >= weeklyTarget 
                  ? "Target reached! 🎉" 
                  : `${weeklyTarget - weeklyCount} more to go`}
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* Stats cards with trend badges */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          {
            label: "Total Opportunities",
            value: totalApps,
            icon: Briefcase,
            color: "text-indigo-700 bg-indigo-50 border-indigo-100",
            badge: newThisWeek > 0 ? `+${newThisWeek} new` : "Stable",
            badgeColor: newThisWeek > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100",
          },
          {
            label: "Submitted Applications",
            value: appliedApps,
            icon: Clock,
            color: "text-sky-700 bg-sky-50 border-sky-100",
            badge: totalApps > 0 ? `${Math.round((appliedApps / totalApps) * 100)}% of total` : "N/A",
            badgeColor: "bg-sky-50 text-sky-700 border-sky-100",
          },
          {
            label: "Interviews Scheduled",
            value: interviewApps,
            icon: CalendarDays,
            color: "text-violet-700 bg-violet-50 border-violet-100",
            badge: interviewApps > 0 ? "Active stages" : "None scheduled",
            badgeColor: interviewApps > 0 ? "bg-violet-50 text-violet-700 border-violet-100" : "bg-slate-50 text-slate-500 border-slate-100",
          },
          {
            label: "Offers Received",
            value: offers,
            icon: Sparkles,
            color: "text-emerald-700 bg-emerald-50 border-emerald-100",
            badge: `${successRate}% Success`,
            badgeColor: successRate > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-100",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="surface-card flex items-center justify-between rounded-3xl p-5 hover:shadow-sm transition-all duration-300 border border-slate-150/40">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl border ${stat.color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {stat.label}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</h3>
                </div>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${stat.badgeColor}`}>
                {stat.badge}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Shaded Columns & Funnel Visual pipeline */}
        <div className="lg:col-span-8 space-y-6">
          <div className="surface-card rounded-3xl p-6 border border-slate-150/40 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="section-title">Pipeline Conversion Funnel</h2>
                <p className="text-xs text-slate-400 mt-0.5">Visual representation of your applications status distribution</p>
              </div>
              <TrendingUp className="text-slate-400" size={18} />
            </div>

            <div className="space-y-4 pt-1">
              {[
                { stage: "Saved Opportunities (Watching)", count: watchingCount, pct: getPercentage(watchingCount), color: "bg-slate-400" },
                { stage: "Prepared / Resume Ready", count: preparedCount, pct: getPercentage(preparedCount), color: "bg-indigo-400" },
                { stage: "Submitted Applications", count: appliedCount, pct: getPercentage(appliedCount), color: "bg-sky-500" },
                { stage: "Interviewing / Screening / Review", count: interviewCount, pct: getPercentage(interviewCount), color: "bg-violet-500" },
                { stage: "Offers Received", count: offerCount, pct: getPercentage(offerCount), color: "bg-emerald-500" },
                { stage: "Rejected Opportunities", count: rejectedCount, pct: getPercentage(rejectedCount), color: "bg-rose-500" },
              ].map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${item.color}`} />
                      {item.stage}
                    </span>
                    <span>
                      {item.count} <span className="text-slate-400 font-normal">({item.pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/50">
                    <div
                      className={`${item.color} h-full rounded-full transition-all duration-500 ease-out`}
                      style={{ width: `${Math.max(item.pct, item.count > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline of Recent Activity with colored dots and brand logos */}
          <div className="space-y-4">
            <h2 className="section-title">Recent Activity</h2>
            <div className="surface-card min-h-[300px] rounded-3xl p-6 border border-slate-150/40">
              {recentActivities.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                  <Briefcase className="mb-2 text-slate-300" size={32} />
                  <p className="text-sm font-medium text-slate-700">No activity yet</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Updates will appear here as applications move between stages.
                  </p>
                </div>
              ) : (
                <div className="relative ml-4 space-y-6 border-l border-slate-200 pl-6 py-2">
                  {recentActivities.map((act) => {
                    const chosenStage = act.stage as StageType;
                    const colorStyles = stageColors[chosenStage] || stageColors.WATCHING;

                    return (
                      <div key={act.id} className="relative group">
                        {/* Timeline dot matching transition color */}
                        <div className={`absolute -left-[31px] top-2 h-2.5 w-2.5 rounded-full border-2 border-white ring-4 ring-white ${colorStyles.dot}`} />
                        
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <CompanyAvatar companyName={act.application.companyName} companyLogo={act.application.companyLogo} size="md" className="mt-0.5 shadow-2xs" />
                            <div>
                              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                {act.application.companyName}
                                <span className="text-slate-300 font-normal">•</span>
                                <span className="text-indigo-700 font-semibold">{act.application.roleTitle}</span>
                              </h4>
                              <p className="mt-1 text-[11px] text-slate-500">
                                Transitioned to{" "}
                                <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${colorStyles.bg}`}>
                                  {act.stage.replace("_", " ")}
                                </span>
                              </p>
                              {act.note && (
                                <p className="mt-1.5 text-xs italic text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100 max-w-md">
                                  &quot;{act.note}&quot;
                                </p>
                              )}
                            </div>
                          </div>

                          <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0">
                            {mounted ? (
                              <>
                                {new Date(act.enteredAt).toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                <span className="mx-1">•</span>
                                {new Date(act.enteredAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </>
                            ) : (
                              ""
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shaded Columns & Urgency-themed Reminders */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Upcoming Reminders</h2>
            <Link href="/applications" className="text-xs font-bold text-indigo-700 hover:text-indigo-600 transition-colors flex items-center gap-0.5">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>
          
          <div className="surface-card flex min-h-[300px] flex-col justify-between rounded-3xl p-5 border border-slate-150/40">
            {activeReminders.length === 0 ? (
              <div className="my-auto text-center py-12">
                <CheckCircle2 className="mx-auto mb-2 text-slate-300" size={32} />
                <p className="text-sm font-semibold text-slate-700">All caught up</p>
                <p className="mt-1 text-xs text-slate-500">No reminders pending right now.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {activeReminders.map((reminder) => {
                  const urgency = getReminderUrgency(reminder.remindAt);

                  return (
                    <div
                      key={reminder.id}
                      className={`flex items-start justify-between rounded-2xl border p-3.5 transition-all duration-200 ${urgency.itemStyle}`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleReminder(reminder.id, reminder.isCompleted)}
                          className="mt-0.5 text-slate-400 transition-colors hover:text-indigo-600 cursor-pointer"
                          title="Mark complete"
                        >
                          <div className="flex h-4.5 w-4.5 items-center justify-center rounded-md border border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/50 shadow-2xs" />
                        </button>
                        <div>
                          <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                            {reminder.type.replace("_", " ")}
                          </p>
                          <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                            {reminder.application.companyName} • {reminder.application.roleTitle}
                          </p>
                          <span className={`inline-block mt-2 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wider ${urgency.style}`}>
                            {urgency.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <Link
              href="/applications"
              className="mt-5 flex items-center justify-center gap-1 w-full text-xs font-bold text-slate-600 border border-slate-200 rounded-2xl py-2.5 hover:bg-slate-50 hover:border-slate-300 transition-all text-center"
            >
              Manage Tasks
            </Link>
          </div>
        </div>
      </div>

      {/* Refactored QuickAddModal component */}
      <QuickAddModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
