import React from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Download,
  RefreshCw,
  UserCheck,
  X,
} from 'lucide-react';
import {
  DueRevisitItem,
  FollowUpNudge,
  StreakStats,
  UpcomingDeadline,
} from '../utils/calculations';
import { diffDaysLocal, formatShortDate } from '../utils/dates';
import { NavSection } from '../types';

interface DashboardBannerProps {
  todayStr: string;
  firstUseDate: string;
  lastExportDate: string | null;
  isSampleData: boolean;
  streakStats: StreakStats;
  dueRevisits: DueRevisitItem[];
  followUps: FollowUpNudge[];
  upcomingDeadlines: UpcomingDeadline[];
  onExportJson: () => void;
  onMarkReviewed: (entryId: string, milestone: 3 | 7) => void;
  onDismissFollowUp: (internshipId: string) => void;
  onNavigate: (section: NavSection) => void;
}

export const DashboardBanner: React.FC<DashboardBannerProps> = ({
  todayStr,
  firstUseDate,
  lastExportDate,
  isSampleData,
  streakStats,
  dueRevisits,
  followUps,
  upcomingDeadlines,
  onExportJson,
  onMarkReviewed,
  onDismissFollowUp,
  onNavigate,
}) => {
  const daysSinceExport = lastExportDate
    ? diffDaysLocal(lastExportDate, todayStr)
    : null;
  const daysSinceStart = diffDaysLocal(firstUseDate, todayStr);

  const isBackupWarning =
    daysSinceExport !== null ? daysSinceExport >= 7 : daysSinceStart >= 7;

  const exportLabel =
    daysSinceExport === null
      ? 'Last export: Never'
      : daysSinceExport === 0
        ? 'Last export: 0 days ago'
        : daysSinceExport === 1
          ? 'Last export: 1 day ago'
          : `Last export: ${daysSinceExport} days ago`;

  const hasAlerts =
    streakStats.isStreakAtRisk ||
    dueRevisits.length > 0 ||
    followUps.length > 0 ||
    upcomingDeadlines.length > 0 ||
    isBackupWarning;

  return (
    <section
      aria-label="Daily status and reminders"
      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3"
    >
      {/* Primary Top Status Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {streakStats.isStreakAtRisk ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Streak at risk</span>
              <span className="text-amber-700 font-normal">
                · Log at least 1 LeetCode problem today
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Today complete</span>
              <span className="text-emerald-700 font-normal tabular-nums font-mono text-xs">
                · {streakStats.todayCount} logged today
              </span>
            </div>
          )}

          {isSampleData && (
            <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-2.5 py-1">
              Sample data active
            </span>
          )}
        </div>

        {/* Backup Status & Quick Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border ${
              isBackupWarning
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            {isBackupWarning && (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            )}
            <span className="tabular-nums">{exportLabel}</span>
            {isBackupWarning && <span>· Backup recommended</span>}
          </div>

          <button
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Actionable Reminders Stream */}
      {hasAlerts &&
        (dueRevisits.length > 0 ||
          followUps.length > 0 ||
          upcomingDeadlines.length > 0) && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {/* Revisit Reminders (3 and 7 days later) */}
            {dueRevisits.map(({ entry, milestone, daysSince }) => (
              <div
                key={`${entry.id}-${milestone}`}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-medium text-slate-900">
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">
                      {milestone}-day revisit: {entry.title}
                    </span>
                  </div>
                  <div className="text-slate-500 mt-0.5 tabular-nums">
                    Solved {daysSince} days ago · {entry.topic}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onMarkReviewed(entry.id, milestone)}
                  className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Mark Reviewed
                </button>
              </div>
            ))}

            {/* Upcoming Internship Deadlines (<= 7 days) */}
            {upcomingDeadlines.map(({ internship, daysRemaining }) => {
              const countdownText =
                daysRemaining === 0
                  ? `${internship.company} closes today.`
                  : daysRemaining === 1
                    ? `${internship.company} closes in 1 day.`
                    : `${internship.company} closes in ${daysRemaining} days.`;
              return (
                <div
                  key={`deadline-${internship.id}`}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-50/70 border border-amber-200 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-medium text-amber-950">
                      <CalendarClock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span className="truncate">{countdownText}</span>
                    </div>
                    <div className="text-amber-800 mt-0.5 truncate">
                      {internship.role} · Due {formatShortDate(internship.deadline)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('internships')}
                    className="px-2.5 py-1 rounded-md bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 font-medium whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    View
                  </button>
                </div>
              );
            })}

            {/* Internship Follow-up Nudges (Applied >= 14 days) */}
            {followUps.map(({ internship, daysSinceApplied }) => (
              <div
                key={`followup-${internship.id}`}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-medium text-slate-900">
                    <UserCheck className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span className="truncate">
                      Follow up: {internship.company}
                    </span>
                  </div>
                  <div className="text-slate-500 mt-0.5 tabular-nums truncate">
                    Applied {daysSinceApplied} days ago · {internship.role}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDismissFollowUp(internship.id)}
                  aria-label={`Dismiss follow up for ${internship.company}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Dismiss</span>
                </button>
              </div>
            ))}
          </div>
        )}
    </section>
  );
};
