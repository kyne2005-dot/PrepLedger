import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Clock,
  ExternalLink,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Square,
  Trash2,
} from 'lucide-react';
import {
  ActiveTimerState,
  Difficulty,
  LEETCODE_TOPICS,
  LeetCodeEntry,
} from '../types';
import { diffDaysLocal, formatDisplayDate } from '../utils/dates';

interface LeetCodeSectionProps {
  todayStr: string;
  logs: LeetCodeEntry[];
  activeTimer: ActiveTimerState;
  initialTopicFilter?: string;
  onUpdateTimer: (next: ActiveTimerState) => void;
  onAddEntry: (entry: Omit<LeetCodeEntry, 'id'>) => void;
  onUpdateEntry: (entry: LeetCodeEntry) => void;
  onDeleteEntry: (id: string) => void;
  onMarkReviewed: (entryId: string, milestone: 3 | 7) => void;
}

function formatTimerClock(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export const LeetCodeSection: React.FC<LeetCodeSectionProps> = ({
  todayStr,
  logs,
  activeTimer,
  initialTopicFilter = 'All',
  onUpdateTimer,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onMarkReviewed,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState(todayStr);
  const [title, setTitle] = useState('');
  const [problemRef, setProblemRef] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [topic, setTopic] = useState<string>(LEETCODE_TOPICS[0]);
  const [minutesTaken, setMinutesTaken] = useState<string>('25');
  const [revisit, setRevisit] = useState(false);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All');
  const [filterTopic, setFilterTopic] = useState<string>(initialTopicFilter);
  const [filterRevisit, setFilterRevisit] = useState<'All' | 'Flagged' | 'Due'>('All');

  useEffect(() => {
    if (initialTopicFilter && initialTopicFilter !== 'All') {
      setFilterTopic(initialTopicFilter);
    }
  }, [initialTopicFilter]);

  // Live solve timer tick
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (!activeTimer.running) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [activeTimer.running]);

  const elapsedMs = activeTimer.running
    ? activeTimer.accumulatedMs +
      Math.max(0, nowMs - (activeTimer.startedAtMs ?? nowMs))
    : activeTimer.accumulatedMs;

  const handleStartTimer = () => {
    onUpdateTimer({
      running: true,
      startedAtMs: Date.now(),
      accumulatedMs: activeTimer.accumulatedMs,
    });
  };

  const handleStopTimer = () => {
    const totalMs = activeTimer.running
      ? activeTimer.accumulatedMs +
        Math.max(0, Date.now() - (activeTimer.startedAtMs ?? Date.now()))
      : activeTimer.accumulatedMs;
    const mins = totalMs > 0 ? Math.max(1, Math.round(totalMs / 60000)) : 0;
    setMinutesTaken(String(mins));
    onUpdateTimer({
      running: false,
      startedAtMs: null,
      accumulatedMs: totalMs,
    });
  };

  const handleResetTimer = () => {
    onUpdateTimer({
      running: false,
      startedAtMs: null,
      accumulatedMs: 0,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setDate(todayStr);
    setTitle('');
    setProblemRef('');
    setDifficulty('Medium');
    setTopic(LEETCODE_TOPICS[0]);
    setMinutesTaken('25');
    setRevisit(false);
    setNotes('');
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter a problem name.');
      return;
    }
    const parsedMinutes = Math.max(0, Math.round(Number(minutesTaken) || 0));

    if (editingId) {
      const existing = logs.find((l) => l.id === editingId);
      onUpdateEntry({
        id: editingId,
        date,
        title: title.trim(),
        problemRef: problemRef.trim(),
        difficulty,
        topic,
        minutesTaken: parsedMinutes,
        revisit,
        reviewedMilestones: revisit ? existing?.reviewedMilestones || [] : [],
        notes: notes.trim(),
      });
    } else {
      onAddEntry({
        date,
        title: title.trim(),
        problemRef: problemRef.trim(),
        difficulty,
        topic,
        minutesTaken: parsedMinutes,
        revisit,
        reviewedMilestones: [],
        notes: notes.trim(),
      });
      if (!activeTimer.running && activeTimer.accumulatedMs > 0) {
        handleResetTimer();
      }
    }
    resetForm();
  };

  const handleStartEdit = (entry: LeetCodeEntry) => {
    setEditingId(entry.id);
    setDate(entry.date);
    setTitle(entry.title);
    setProblemRef(entry.problemRef);
    setDifficulty(entry.difficulty);
    setTopic(entry.topic);
    setMinutesTaken(String(entry.minutesTaken));
    setRevisit(entry.revisit);
    setNotes(entry.notes);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...logs]
      .filter((item) => {
        if (filterDifficulty !== 'All' && item.difficulty !== filterDifficulty) {
          return false;
        }
        if (filterTopic !== 'All' && item.topic !== filterTopic) {
          return false;
        }
        if (filterRevisit === 'Flagged' && !item.revisit) {
          return false;
        }
        if (filterRevisit === 'Due') {
          if (!item.revisit) return false;
          const age = diffDaysLocal(item.date, todayStr);
          const reviewed = item.reviewedMilestones || [];
          const isDue =
            (age >= 7 && !reviewed.includes(7)) ||
            (age >= 3 && age < 7 && !reviewed.includes(3));
          if (!isDue) return false;
        }
        if (q) {
          const hay = `${item.title} ${item.problemRef} ${item.topic} ${item.notes}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [logs, searchQuery, filterDifficulty, filterTopic, filterRevisit, todayStr]);

  const difficultyTextClass = (diff: Difficulty) => {
    if (diff === 'Easy') return 'text-emerald-700 font-medium';
    if (diff === 'Medium') return 'text-amber-700 font-medium';
    return 'text-red-700 font-medium';
  };

  return (
    <div className="space-y-6">
      {/* Logger + Solve Timer */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 mb-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {editingId ? 'Edit LeetCode Entry' : 'Log LeetCode Problem'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Backfill past dates anytime—streaks, heatmap, and missed-day tallies recalculate automatically.
            </p>
          </div>

          {/* Solve Timer Controls */}
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="font-mono tabular-nums text-sm font-semibold text-slate-900 min-w-[54px]">
              {formatTimerClock(elapsedMs)}
            </span>
            {!activeTimer.running ? (
              <button
                type="button"
                onClick={handleStartTimer}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-blue-700 text-white hover:bg-blue-800 whitespace-nowrap cursor-pointer"
              >
                <Play className="w-3 h-3" />
                <span>Start</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopTimer}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 whitespace-nowrap cursor-pointer"
              >
                <Square className="w-3 h-3" />
                <span>Stop</span>
              </button>
            )}
            {elapsedMs > 0 && !activeTimer.running && (
              <button
                type="button"
                onClick={handleResetTimer}
                title="Reset timer"
                aria-label="Reset timer"
                className="p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Problem Name *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. LRU Cache"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Number or Link
              </label>
              <input
                type="text"
                value={problemRef}
                onChange={(e) => setProblemRef(e.target.value)}
                placeholder="146 or https://..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Topic
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                {LEETCODE_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                max={todayStr}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Minutes Taken
              </label>
              <input
                type="number"
                min={0}
                max={600}
                value={minutesTaken}
                onChange={(e) => setMinutesTaken(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div className="sm:col-span-3 flex items-center h-[38px]">
              <label className="inline-flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={revisit}
                  onChange={(e) => setRevisit(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                />
                <span>
                  Revisit (remind me in the banner 3 and 7 days later)
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Reflection & Approach Notes (Word Bank)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your approach, time & space complexity, edge cases, or thoughts after completing this problem..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          {formError && (
            <p className="text-xs font-medium text-red-700">{formError}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{editingId ? 'Save Changes' : 'Log Problem'}</span>
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Search, Filter & Problem History */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Solved Problems & Reflection Word Bank
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              Showing {filteredLogs.length} of {logs.length} logged problems
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, #, or notes..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 w-48 sm:w-56 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              aria-label="Filter by difficulty"
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              aria-label="Filter by topic"
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="All">All Topics</option>
              {LEETCODE_TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={filterRevisit}
              onChange={(e) =>
                setFilterRevisit(e.target.value as 'All' | 'Flagged' | 'Due')
              }
              aria-label="Filter by revisit status"
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="All">All Entries</option>
              <option value="Flagged">Revisit Flagged</option>
              <option value="Due">Revisit Due Now</option>
            </select>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-slate-200 rounded-lg">
            <p className="text-sm font-medium text-slate-700">
              {logs.length === 0
                ? 'No LeetCode problems logged yet'
                : 'No problems match your current filters'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {logs.length === 0
                ? 'Use the form above to log your first problem and reflection notes.'
                : 'Try clearing your search query or switching topic/difficulty filters.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
            {filteredLogs.map((entry) => {
              const age = diffDaysLocal(entry.date, todayStr);
              const reviewed = entry.reviewedMilestones || [];
              const dueMilestone: 3 | 7 | null =
                entry.revisit && age >= 7 && !reviewed.includes(7)
                  ? 7
                  : entry.revisit && age >= 3 && age < 7 && !reviewed.includes(3)
                    ? 3
                    : null;

              return (
                <article
                  key={entry.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900">
                          {entry.title}
                        </h4>
                        {entry.problemRef &&
                          (isUrl(entry.problemRef) ? (
                            <a
                              href={entry.problemRef}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline"
                            >
                              <span>Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs font-mono text-slate-500">
                              #{entry.problemRef.replace(/^#/, '')}
                            </span>
                          ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="font-mono tabular-nums">
                          {formatDisplayDate(entry.date)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className={difficultyTextClass(entry.difficulty)}>
                          {entry.difficulty}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{entry.topic}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {entry.minutesTaken} min
                        </span>
                        {entry.revisit && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
                              <RefreshCw className="w-3 h-3" />
                              <span>
                                {dueMilestone
                                  ? `${dueMilestone}-day revisit due`
                                  : reviewed.includes(7)
                                    ? 'Reviewed'
                                    : 'Revisit scheduled'}
                              </span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {dueMilestone && (
                        <button
                          type="button"
                          onClick={() => onMarkReviewed(entry.id, dueMilestone)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 whitespace-nowrap cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark Reviewed</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(entry)}
                        aria-label={`Edit ${entry.title}`}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id)}
                        aria-label={`Delete ${entry.title}`}
                        className="p-1.5 text-slate-500 hover:text-red-700 rounded-md hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {entry.notes && (
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                      {entry.notes}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
