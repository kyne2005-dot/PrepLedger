import React, { useState } from 'react';
import { Check, Circle, Dumbbell, Footprints, Plus, Trash2 } from 'lucide-react';
import {
  GymActivityType,
  GymLogEntry,
  NavSection,
  PythonSprint,
  UserSettings,
} from '../types';
import { getSprintProgress } from '../utils/calculations';
import {
  addDaysLocal,
  formatDisplayDate,
  getDayOfWeekIndex,
  getDayOfWeekName,
  getDayOfWeekShort,
  getStartOfWeekSunday,
} from '../utils/dates';

interface DailyChecklistProps {
  todayStr: string;
  todayProblemCount: number;
  settings: UserSettings;
  currentSprint: PythonSprint;
  gymLogs: GymLogEntry[];
  onLogGym: (type: GymActivityType, notes: string) => void;
  onDeleteGym: (id: string) => void;
  onNavigate: (section: NavSection) => void;
  onQuickLogProblem: () => void;
}

export const DailyChecklist: React.FC<DailyChecklistProps> = ({
  todayStr,
  todayProblemCount,
  settings,
  currentSprint,
  gymLogs,
  onLogGym,
  onDeleteGym,
  onNavigate,
  onQuickLogProblem,
}) => {
  const [gymNotes, setGymNotes] = useState('');
  const dayName = getDayOfWeekName(todayStr);
  const dowIndex = getDayOfWeekIndex(todayStr);
  const sprintProgress = getSprintProgress(currentSprint, todayStr);

  // Weekly gym logs (Sunday -> Saturday of current week)
  const weekStart = getStartOfWeekSunday(todayStr);
  const weekEnd = addDaysLocal(weekStart, 6);
  const weekGymLogs = gymLogs.filter(
    (g) => g.date >= weekStart && g.date <= weekEnd
  );
  const todayGymLogs = gymLogs.filter((g) => g.date === todayStr);
  const isScheduledGymDay = settings.gymScheduledDays.includes(dowIndex);

  const problemSlots = Array.from(
    { length: settings.dailyTargetProblems },
    (_, i) => i + 1
  );

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 flex-1 flex flex-col justify-between gap-5">
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {dayName} Checklist
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatDisplayDate(todayStr)} · Daily minimum: {settings.dailyMinProblems} problem
            </p>
          </div>
          <button
            type="button"
            onClick={onQuickLogProblem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Problem</span>
          </button>
        </div>

        {/* Daily LeetCode & Sprint Items */}
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
          {problemSlots.map((slot) => {
            const done = todayProblemCount >= slot;
            const isMinimumGate = slot === settings.dailyMinProblems;
            return (
              <div
                key={slot}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {done ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                  )}
                  <span
                    className={
                      done
                        ? 'text-slate-500 line-through'
                        : 'text-slate-800 font-medium'
                    }
                  >
                    LeetCode Problem #{slot}
                    {isMinimumGate ? ' (streak minimum)' : ' (stretch goal)'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-mono tabular-nums shrink-0">
                  {done ? 'Done' : 'Pending'}
                </span>
              </div>
            );
          })}

          {/* 14-Day Python Sprint Check-in */}
          <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm bg-slate-50/50">
            <div className="flex items-center gap-2.5 min-w-0">
              {currentSprint.status === 'Completed' ? (
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
              ) : (
                <Circle className="w-5 h-5 text-blue-400 shrink-0" />
              )}
              <div className="min-w-0">
                <div className="text-slate-800 font-medium truncate">
                  {currentSprint.title}
                </div>
                <div className="text-xs text-slate-500 tabular-nums">
                  Day {sprintProgress.dayNumber} of 14 ·{' '}
                  {currentSprint.status === 'Completed'
                    ? 'Cycle completed'
                    : `${sprintProgress.daysRemaining} days left in cycle`}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('sprints')}
              className="text-xs font-medium text-blue-700 hover:text-blue-900 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open Sprint
            </button>
          </div>
        </div>
      </div>

      {/* Optional Gym / Running Section */}
      {settings.includeGymSection && (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Gym & Running (Optional)
              </h3>
              <p className="text-xs text-slate-500 tabular-nums">
                {weekGymLogs.length} / {settings.weeklyGymTarget} sessions this week ·{' '}
                {isScheduledGymDay
                  ? `Scheduled for ${dayName}`
                  : `Scheduled: ${settings.gymScheduledDays.map(getDayOfWeekShort).join(', ') || 'Flexible'}`}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={gymNotes}
              onChange={(e) => setGymNotes(e.target.value)}
              placeholder="Optional workout note (e.g. 5K run, push day)"
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onLogGym('Gym', gymNotes);
                  setGymNotes('');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Log Gym</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogGym('Running', gymNotes);
                  setGymNotes('');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Log Run</span>
              </button>
            </div>
          </div>

          {todayGymLogs.length > 0 && (
            <div className="space-y-1.5">
              {todayGymLogs.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between gap-2 text-xs px-3 py-1.5 rounded-md bg-emerald-50/70 border border-emerald-200 text-emerald-900"
                >
                  <span className="truncate">
                    Today: {g.type}
                    {g.notes ? ` — ${g.notes}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteGym(g.id)}
                    aria-label="Remove workout log"
                    className="text-emerald-700 hover:text-red-700 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
