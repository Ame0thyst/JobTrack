'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApplicationStore } from '@/store/application.store';
import { 
  BarChart3, 
  Clock, 
  Sparkles, 
  HelpCircle, 
  Calendar,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Briefcase,
  ArrowUpRight
} from 'lucide-react';

interface TimingAnalysis {
  dayOfWeek: Record<string, number>;
  hourOfDay: Record<string, number>;
}

interface PlatformData {
  count: number;
  offers: number;
  conversionRate: number;
}

interface FunnelData {
  saved: number;
  applied: number;
  interview: number;
  offer: number;
}

interface AnalyticsData {
  totalApplications: number;
  totalOffers: number;
  totalRejected: number;
  successRate: number;
  avgResponseTime: number | null;
  pendingResponseCount: number;
  platformBreakdown: Record<string, PlatformData>;
  timingAnalysis: TimingAnalysis;
  funnel: FunnelData;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { applications, fetchApplications } = useApplicationStore();

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchApplications();
  }, [fetchApplications]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
        <svg className="animate-spin h-8 w-8 text-indigo-500 mb-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm font-semibold">Calculating career performance metrics...</p>
      </div>
    );
  }

  if (!data || data.totalApplications === 0) {
    return (
      <div className="surface-card mx-auto mt-12 max-w-lg rounded-3xl p-12 text-center text-slate-500">
        <BarChart3 size={40} className="mx-auto mb-2 text-slate-300" />
        <p className="font-semibold text-slate-800">No Application Data Available</p>
        <p className="mt-1 text-xs text-slate-500">
          Add job opportunities and transition them to Applied and beyond to generate analytics.
        </p>
      </div>
    );
  }

  // Find best day and hour
  const days = Object.entries(data.timingAnalysis.dayOfWeek);
  const bestDay = days.reduce((a, b) => (b[1] > a[1] ? b : a), days[0]);

  const hours = Object.entries(data.timingAnalysis.hourOfDay).map(([h, val]) => [parseInt(h), val]);
  const bestHour = hours.reduce((a, b) => (b[1] > a[1] ? b : a), hours[0]);

  // Find max value for day of week for scale
  const maxDayCount = Math.max(...days.map(d => d[1])) || 1;

  // Format hour for display
  const formatHour = (h: number) => {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Career Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Measure channels, timelines, and response indicators with a simpler view.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Success Rate Card */}
        <div className="surface-card relative flex min-h-[160px] flex-col justify-between rounded-3xl p-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Success Rate</span>
              <Sparkles size={16} className="text-emerald-600" />
            </div>
            <h3 className="mt-2 text-3xl font-extrabold text-slate-900">{data.successRate}%</h3>
          </div>
          <div>
            {/* ProgressBar */}
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full" 
                style={{ width: `${Math.min(data.successRate, 100)}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Based on {data.totalOffers} offer(s) out of {data.totalApplications} total opportunities.
            </p>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="surface-card relative flex min-h-[160px] flex-col justify-between rounded-3xl p-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Avg Response Time</span>
              <Clock size={16} className="text-sky-600" />
            </div>
            <h3 className="mt-2 text-3xl font-extrabold text-slate-900">
              {data.avgResponseTime !== null ? `${data.avgResponseTime} Days` : 'N/A'}
            </h3>
          </div>
          <div>
            <p className="text-xs leading-normal text-slate-500">
              {data.pendingResponseCount} applied job(s) pending response.
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              Calculated from stage change timestamps after submission.
            </p>
          </div>
        </div>

        {/* Best Submissions */}
        <div className="surface-card relative flex min-h-[160px] flex-col justify-between rounded-3xl p-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Submission Sweetspot</span>
              <Calendar size={16} className="text-violet-600" />
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-sm font-semibold text-slate-700">
                Best Day: <span className="text-indigo-700">{bestDay[1] > 0 ? bestDay[0] : 'N/A'}</span>
              </p>
              <p className="text-sm font-semibold text-slate-700">
                Best Hour: <span className="text-indigo-700">{bestHour[1] > 0 ? formatHour(bestHour[0]) : 'N/A'}</span>
              </p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500">
            Identifies when applications are logged based on high volume.
          </p>
        </div>

      </div>

      {/* Pipeline Funnel */}
      <div className="space-y-4">
        <h2 className="section-title">Application Pipeline Funnel</h2>
        <div className="surface-card rounded-3xl p-6 md:p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4 select-none">
            {[
              {
                label: '1. Saved Opportunity',
                key: 'saved',
                color: 'from-slate-400 to-slate-500',
                textColor: 'text-slate-600',
                bgLight: 'bg-slate-50 border-slate-100',
              },
              {
                label: '2. Submitted Application',
                key: 'applied',
                color: 'from-indigo-500 to-indigo-600',
                textColor: 'text-indigo-600',
                bgLight: 'bg-indigo-50 border-indigo-100',
              },
              {
                label: '3. Interview Process',
                key: 'interview',
                color: 'from-violet-500 to-violet-600',
                textColor: 'text-violet-600',
                bgLight: 'bg-violet-50 border-violet-100',
              },
              {
                label: '4. Offer Received',
                key: 'offer',
                color: 'from-emerald-500 to-emerald-600',
                textColor: 'text-emerald-600',
                bgLight: 'bg-emerald-50 border-emerald-100',
              },
            ].map((step, index, arr) => {
              const count = data.funnel[step.key as keyof FunnelData] || 0;
              // Calculate percentage relative to the first step (Saved)
              const totalPool = data.funnel.saved || 1;
              const percentOfTotal = Math.round((count / totalPool) * 100);

              // Calculate conversion rate from previous step
              let conversionFromPrev = 100;
              if (index > 0) {
                const prevCount = data.funnel[arr[index - 1].key as keyof FunnelData] || 0;
                conversionFromPrev = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
              }

              return (
                <div key={step.key} className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-5 hover:bg-white transition-all duration-300">
                  <div>
                    <span className={`inline-block rounded-lg px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${step.bgLight}`}>
                      {step.label}
                    </span>
                    <h4 className="mt-4 text-3xl font-extrabold text-slate-900">{count}</h4>
                    <p className="mt-1.5 text-xs text-slate-500 font-medium">
                      {percentOfTotal}% of total pool
                    </p>
                  </div>

                  <div className="mt-6 space-y-2">
                    {/* Funnel Level Bar */}
                    <div className="h-2.5 w-full overflow-hidden rounded-full border border-slate-200/50 bg-slate-100">
                      <div
                        className={`h-full bg-gradient-to-r ${step.color} rounded-full transition-all duration-500`}
                        style={{ width: `${percentOfTotal}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                      <span>Conversion:</span>
                      <span className={step.textColor}>
                        {index === 0 ? 'Baseline' : `+${conversionFromPrev}% from prev`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Platform breakdown */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="section-title">Platform Channels Breakdown</h2>
          <div className="surface-card space-y-5 rounded-3xl p-6">
            {Object.entries(data.platformBreakdown)
              .filter(([_, stats]) => stats.count > 0)
              .map(([platform, stats]) => (
                <div key={platform} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700">{platform.replace('_', ' ')}</span>
                    <span className="font-medium text-slate-500">
                      {stats.count} app(s) • <span className="font-semibold text-emerald-700">{Math.round(stats.conversionRate)}% Offer Rate</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full"
                      style={{ width: `${(stats.count / data.totalApplications) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right: Weekday breakdown chart */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="section-title">Submission Volume by Day</h2>
          <div className="surface-card flex min-h-[250px] flex-col justify-end rounded-3xl p-6">
            <div className="flex items-end justify-between h-44 px-2 select-none">
              {days.map(([day, val]) => {
                const percent = (val / maxDayCount) * 100;
                return (
                  <div key={day} className="flex flex-col items-center gap-2 group w-full">
                    <div className="relative flex h-full w-8 items-end justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      <div 
                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-sm transition-all duration-500"
                        style={{ height: `${val > 0 ? percent : 0}%` }}
                      />
                      {val > 0 && (
                          <span className="absolute bottom-2 w-full text-center text-[9px] font-extrabold text-white">
                          {val}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                      {day.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Offer Compensation Comparison Panel */}
      {(() => {
        const offerApps = applications.filter(app => app.currentStage === 'OFFER');
        if (offerApps.length === 0) return null;

        return (
          <div className="space-y-4 pt-4">
            <h2 className="section-title">Offer Package Comparison</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {offerApps.map((app) => (
                <div key={app.id} className="surface-card rounded-3xl p-6 border border-slate-150/45 shadow-3xs flex flex-col justify-between space-y-4 relative overflow-hidden">
                  {/* Decorative indicator */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500" />
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-150 overflow-hidden">
                        {app.companyLogo ? (
                          <img src={app.companyLogo} alt={app.companyName} className="h-full w-full object-cover" />
                        ) : (
                          <Briefcase size={16} className="text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{app.companyName}</h4>
                        <p className="text-[10px] font-semibold text-slate-450 truncate uppercase tracking-wider">{app.roleTitle}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Base Salary Range</span>
                      {app.salaryMin || app.salaryMax ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-extrabold text-slate-800">
                            {app.salaryMin ? `${app.salaryCurrency} ${app.salaryMin.toLocaleString()}` : 'N/A'}
                          </span>
                          <span className="text-xs text-slate-450 font-bold">to</span>
                          <span className="text-lg font-extrabold text-slate-800">
                            {app.salaryMax ? `${app.salaryCurrency} ${app.salaryMax.toLocaleString()}` : 'N/A'}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-slate-400 italic">No salary info recorded</p>
                      )}
                    </div>

                    {app.benefits && (
                      <div className="border-t border-slate-100 pt-3 space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Benefits & Perks</span>
                        <p className="text-xs text-slate-650 leading-relaxed whitespace-pre-wrap">{app.benefits}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button 
                      onClick={() => router.push(`/applications/${app.id}`)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:border-indigo-500 bg-white py-2 text-xs font-extrabold text-indigo-700 hover:bg-indigo-50/20 transition-all cursor-pointer"
                    >
                      <span>View Pipeline details</span>
                      <ArrowUpRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
