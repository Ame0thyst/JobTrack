import { StageType } from '@/store/application.store';

/**
 * Shared stage color mappings used across dashboard and applications pages.
 * Centralised here to prevent DRY violations.
 */
export const stageColors: Record<StageType, { bg: string; text: string; dot: string; badge: string }> = {
  WATCHING:     { bg: 'bg-slate-100 text-slate-700',   text: 'text-slate-500',   dot: 'bg-slate-400',   badge: 'text-slate-650 bg-slate-100 border-slate-200' },
  PREPARED:     { bg: 'bg-indigo-50 text-indigo-700',  text: 'text-indigo-500',  dot: 'bg-indigo-500',  badge: 'text-indigo-700 bg-indigo-50 border-indigo-150/80' },
  APPLIED:      { bg: 'bg-sky-50 text-sky-700',        text: 'text-sky-500',     dot: 'bg-sky-500',     badge: 'text-sky-700 bg-sky-50 border-sky-150/80' },
  HR_SCREENING: { bg: 'bg-amber-50 text-amber-700',    text: 'text-amber-500',   dot: 'bg-amber-500',   badge: 'text-amber-700 bg-amber-50 border-amber-150/80' },
  INTERVIEW_1:  { bg: 'bg-purple-50 text-purple-700',  text: 'text-purple-500',  dot: 'bg-purple-500',  badge: 'text-purple-700 bg-purple-50 border-purple-150/80' },
  INTERVIEW_2:  { bg: 'bg-violet-50 text-violet-700',  text: 'text-violet-500',  dot: 'bg-violet-500',  badge: 'text-violet-700 bg-violet-50 border-violet-150/80' },
  REVIEW:       { bg: 'bg-fuchsia-50 text-fuchsia-700',text: 'text-fuchsia-500', dot: 'bg-fuchsia-500', badge: 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-150/80' },
  OFFER:        { bg: 'bg-emerald-50 text-emerald-700',text: 'text-emerald-500', dot: 'bg-emerald-500', badge: 'text-emerald-700 bg-emerald-50 border-emerald-150/80' },
  REJECTED:     { bg: 'bg-rose-50 text-rose-700',      text: 'text-rose-500',    dot: 'bg-rose-500',    badge: 'text-rose-700 bg-rose-50 border-rose-150/80' },
};
