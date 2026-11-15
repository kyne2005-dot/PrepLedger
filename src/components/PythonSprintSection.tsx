import React, { useState } from 'react';
import { CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import { SprintState } from '../types';
import { getSprintProgress } from '../utils/calculations';
import { addDaysLocal, formatDisplayDate } from '../utils/dates';

interface PythonSprintSectionProps {
  todayStr: string;
  sprintState: SprintState;
  onUpdateCurrentSprint: (title: string, notes: string) => void;
  onMarkComplete: () => void;
  onReopenCurrentSprint: () => void;
  onSetCycleStartDate: (newStartDate: string) => void;
}

export const PythonSprintSection: React.FC<PythonSprintSectionProps> = ({
  todayStr,
  sprintState,
  onUpdateCurrentSprint,
  onMarkComplete,
  onReopenCurrentSprint,
  onSetCycleStartDate,
}) => {
  const { currentSprint, history } = sprintState;
  const progress = getSprintProgress(currentSprint, todayStr);

  const [titleDraft, setTitleDraft] = useState(currentSprint.title);
  const [notesDraft, setNotesDraft] = useState(currentSprint.notes);
  const [startDateDraft, setStartDateDraft] = useState(currentSprint.startDate);
  const [savedNotice, setSavedNotice] = useState(false);

  // Keep local drafts synced when sprint rolls over or sample data loads
  React.useEffect(() => {
    setTitleDraft(currentSprint.title);
    setNotesDraft(currentSprint.notes);
    setStartDateDraft(currentSprint.startDate);
  }, [currentSprint.id, currentSprint.title, currentSprint.notes, currentSprint.startDate]);

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCurrentSprint(
      titleDraft.trim() || `Python Sprint #${currentSprint.number}`,
      notesDraft.trim()
    );
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2000);
  };

  const nextCycleStart = addDaysLocal(currentSprint.endDate, 1);

  return (
    <div className="space-y-6">
      {/* Active 14-Day Cycle Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums mb-1">
              <span>Fixed 14-Day Cycle</span>
              <span aria-hidden="true">·</span>
              <span>
                {formatDisplayDate(currentSprint.startDate)} –{' '}
                {formatDisplayDate(currentSprint.endDate)}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {currentSprint.title}
            </h2>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {currentSprint.status === 'Completed' ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Completed</span>
                </span>
                <button
                  type="button"
                  onClick={onReopenCurrentSprint}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reopen</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onMarkComplete}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Complete</span>
              </button>
            )}
          </div>
        </div>

        {/* Cycle Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs tabular-nums">
            <span className="font-medium text-slate-700 font-mono">
              Day {progress.dayNumber} of {progress.totalDays}
            </span>
            <span className="text-slate-500">
              {currentSprint.status === 'Completed'
                ? `Next sprint starts ${formatDisplayDate(nextCycleStart)}`
                : progress.daysRemaining === 0
                  ? 'Final day of sprint cycle'
                  : `${progress.daysRemaining} days remaining before auto-rollover`}
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                currentSprint.status === 'Completed'
                  ? 'bg-emerald-600'
                  : 'bg-blue-700'
              }`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>

        {/* Editable Project Details */}
        <form onSubmit={handleSaveDetails} className="space-y-3.5 pt-2 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Python Project Title
              </label>
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                placeholder="e.g. Python Sprint #1: CLI Expense Tracker"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Cycle Start Date (14-day anchor)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDateDraft}
                  max={todayStr}
                  onChange={(e) => setStartDateDraft(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
                {startDateDraft !== currentSprint.startDate && (
                  <button
                    type="button"
                    onClick={() => onSetCycleStartDate(startDateDraft)}
                    className="px-2.5 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 whitespace-nowrap cursor-pointer"
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Project Scope, Milestones & Notes
            </label>
            <textarea
              rows={3}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Outline libraries, core features, tests, and repo link..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Save Sprint Notes
            </button>
            {savedNotice && (
              <span className="text-xs font-medium text-emerald-700">
                Saved
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Past Sprint History */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Sprint History
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Sprints that pass their 14-day window unfinished are automatically marked &ldquo;Not finished&rdquo; when the next cycle starts.
          </p>
        </div>

        {history.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg">
            <Clock className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
            <p className="text-sm font-medium text-slate-700">
              No completed or past sprint cycles yet
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Past 14-day cycles will appear here once finished or rolled over.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
            {history.map((sprint) => (
              <div key={sprint.id} className="p-4 space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      {sprint.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                      {formatDisplayDate(sprint.startDate)} –{' '}
                      {formatDisplayDate(sprint.endDate)}
                      {sprint.completedAt &&
                        ` · Finished ${formatDisplayDate(sprint.completedAt)}`}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md border self-start sm:self-auto ${
                      sprint.status === 'Completed'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    {sprint.status}
                  </span>
                </div>
                {sprint.notes && (
                  <p className="text-xs text-slate-600 whitespace-pre-wrap">
                    {sprint.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
