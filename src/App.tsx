import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Briefcase,
  Code2,
  FolderGit2,
  LayoutDashboard,
  Menu,
  Plus,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { ContactsSection } from './components/ContactsSection';
import { DailyChecklist } from './components/DailyChecklist';
import { DashboardBanner } from './components/DashboardBanner';
import { Heatmap12Weeks } from './components/Heatmap12Weeks';
import { InternshipsSection } from './components/InternshipsSection';
import { LeetCodeSection } from './components/LeetCodeSection';
import { PythonSprintSection } from './components/PythonSprintSection';
import { SettingsSection } from './components/SettingsSection';
import { StoriesSection } from './components/StoriesSection';
import { TopicCoverageChart } from './components/TopicCoverageChart';
import {
  ActiveTimerState,
  AppState,
  BehavioralStory,
  GymActivityType,
  InternshipEntry,
  LeetCodeEntry,
  NavSection,
  RecruiterContact,
  UserSettings,
} from './types';
import {
  calculateStreakStats,
  calculateTopicCoverage,
  getDueRevisitEntries,
  getInternshipFollowUps,
  getSprintProgress,
  getUpcomingDeadlines,
  reconcileSprintCycle,
} from './utils/calculations';
import {
  addDaysLocal,
  diffDaysLocal,
  formatDisplayDate,
  getTodayLocal,
} from './utils/dates';
import {
  createInitialState,
  exportStateAsJson,
  generateSampleData,
  loadAppState,
  saveAppState,
  validateAndParseBackupJson,
} from './utils/storage';

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [todayStr, setTodayStr] = useState<string>(() => getTodayLocal());
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [leetcodeTopicJump, setLeetcodeTopicJump] = useState<string>('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Persist every state change to localStorage
  useEffect(() => {
    saveAppState(state);
  }, [state]);

  // Keep local date & 14-day sprint cycle synced if tab stays open past midnight
  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = getTodayLocal();
      if (current !== todayStr) {
        setTodayStr(current);
        setState((prev) => {
          const { state: nextSprint, changed } = reconcileSprintCycle(
            prev.sprintState,
            current
          );
          return changed ? { ...prev, sprintState: nextSprint } : prev;
        });
      }
    }, 30000);
    return () => window.clearInterval(interval);
  }, [todayStr]);

  // Derived analytics (recalculated from logs & dates, never stored counters)
  const streakStats = useMemo(
    () =>
      calculateStreakStats(
        state.leetcodeLogs,
        state.firstUseDate,
        todayStr,
        state.settings.dailyMinProblems
      ),
    [state.leetcodeLogs, state.firstUseDate, todayStr, state.settings.dailyMinProblems]
  );

  const dueRevisits = useMemo(
    () => getDueRevisitEntries(state.leetcodeLogs, todayStr),
    [state.leetcodeLogs, todayStr]
  );

  const followUps = useMemo(
    () =>
      getInternshipFollowUps(
        state.internships,
        state.dismissedFollowUps,
        todayStr
      ),
    [state.internships, state.dismissedFollowUps, todayStr]
  );

  const upcomingDeadlines = useMemo(
    () => getUpcomingDeadlines(state.internships, todayStr),
    [state.internships, todayStr]
  );

  const topicCoverage = useMemo(
    () => calculateTopicCoverage(state.leetcodeLogs),
    [state.leetcodeLogs]
  );

  const sprintProgress = useMemo(
    () => getSprintProgress(state.sprintState.currentSprint, todayStr),
    [state.sprintState.currentSprint, todayStr]
  );

  // Handlers
  const handleNavigate = (section: NavSection) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    if (section !== 'leetcode') {
      setLeetcodeTopicJump('All');
    }
  };

  const handleExportJson = () => {
    const updated = exportStateAsJson(state, todayStr);
    setState(updated);
  };

  const handleImportJson = (
    rawText: string
  ): { ok: boolean; message: string } => {
    const result = validateAndParseBackupJson(rawText, todayStr);
    if (!result.ok) {
      return { ok: false, message: result.error };
    }
    setState(result.state);
    return {
      ok: true,
      message: `Backup restored: ${result.state.leetcodeLogs.length} LeetCode entries, ${result.state.internships.length} internships, ${result.state.contacts.length} contacts, and ${result.state.stories.length} stories.`,
    };
  };

  const handleMarkReviewed = (entryId: string, milestone: 3 | 7) => {
    setState((prev) => ({
      ...prev,
      leetcodeLogs: prev.leetcodeLogs.map((entry) => {
        if (entry.id !== entryId) return entry;
        const current = new Set(entry.reviewedMilestones || []);
        if (milestone === 7) {
          current.add(3);
          current.add(7);
        } else {
          current.add(3);
        }
        return { ...entry, reviewedMilestones: Array.from(current) };
      }),
    }));
  };

  const handleDismissFollowUp = (internshipId: string) => {
    setState((prev) => ({
      ...prev,
      dismissedFollowUps: prev.dismissedFollowUps.includes(internshipId)
        ? prev.dismissedFollowUps
        : [...prev.dismissedFollowUps, internshipId],
    }));
  };

  // LeetCode CRUD
  const handleAddLeetCode = (entry: Omit<LeetCodeEntry, 'id'>) => {
    setState((prev) => ({
      ...prev,
      leetcodeLogs: [{ id: makeId('lc'), ...entry }, ...prev.leetcodeLogs],
    }));
  };

  const handleUpdateLeetCode = (updated: LeetCodeEntry) => {
    setState((prev) => ({
      ...prev,
      leetcodeLogs: prev.leetcodeLogs.map((item) =>
        item.id === updated.id ? updated : item
      ),
    }));
  };

  const handleDeleteLeetCode = (id: string) => {
    setState((prev) => ({
      ...prev,
      leetcodeLogs: prev.leetcodeLogs.filter((item) => item.id !== id),
    }));
  };

  const handleUpdateTimer = (next: ActiveTimerState) => {
    setState((prev) => ({ ...prev, activeTimer: next }));
  };

  // Internships CRUD
  const handleAddInternship = (entry: Omit<InternshipEntry, 'id'>) => {
    setState((prev) => ({
      ...prev,
      internships: [{ id: makeId('int'), ...entry }, ...prev.internships],
    }));
  };

  const handleUpdateInternship = (updated: InternshipEntry) => {
    setState((prev) => ({
      ...prev,
      internships: prev.internships.map((item) =>
        item.id === updated.id ? updated : item
      ),
    }));
  };

  const handleDeleteInternship = (id: string) => {
    setState((prev) => ({
      ...prev,
      internships: prev.internships.filter((item) => item.id !== id),
      dismissedFollowUps: prev.dismissedFollowUps.filter((d) => d !== id),
    }));
  };

  // Sprint Actions
  const handleUpdateCurrentSprint = (title: string, notes: string) => {
    setState((prev) => ({
      ...prev,
      sprintState: {
        ...prev.sprintState,
        currentSprint: {
          ...prev.sprintState.currentSprint,
          title,
          notes,
        },
      },
    }));
  };

  const handleMarkSprintComplete = () => {
    setState((prev) => ({
      ...prev,
      sprintState: {
        ...prev.sprintState,
        currentSprint: {
          ...prev.sprintState.currentSprint,
          status: 'Completed',
          completedAt: todayStr,
        },
      },
    }));
  };

  const handleReopenCurrentSprint = () => {
    setState((prev) => ({
      ...prev,
      sprintState: {
        ...prev.sprintState,
        currentSprint: {
          ...prev.sprintState.currentSprint,
          status: 'active',
          completedAt: undefined,
        },
      },
    }));
  };

  const handleSetSprintStartDate = (newStartDate: string) => {
    setState((prev) => {
      const updatedCurrent = {
        ...prev.sprintState.currentSprint,
        startDate: newStartDate,
        endDate: addDaysLocal(newStartDate, 13),
      };
      const { state: reconciled } = reconcileSprintCycle(
        { ...prev.sprintState, currentSprint: updatedCurrent },
        todayStr
      );
      return { ...prev, sprintState: reconciled };
    });
  };

  // Gym / Running
  const handleLogGym = (type: GymActivityType, notes: string) => {
    setState((prev) => ({
      ...prev,
      gymLogs: [
        { id: makeId('gym'), date: todayStr, type, notes: notes.trim() },
        ...prev.gymLogs,
      ],
    }));
  };

  const handleDeleteGym = (id: string) => {
    setState((prev) => ({
      ...prev,
      gymLogs: prev.gymLogs.filter((g) => g.id !== id),
    }));
  };

  // Contacts CRUD
  const handleAddContact = (contact: Omit<RecruiterContact, 'id'>) => {
    setState((prev) => ({
      ...prev,
      contacts: [{ id: makeId('contact'), ...contact }, ...prev.contacts],
    }));
  };

  const handleUpdateContact = (updated: RecruiterContact) => {
    setState((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) => (c.id === updated.id ? updated : c)),
    }));
  };

  const handleDeleteContact = (id: string) => {
    setState((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== id),
    }));
  };

  // Behavioral Stories CRUD
  const handleAddStory = (story: Omit<BehavioralStory, 'id'>) => {
    setState((prev) => ({
      ...prev,
      stories: [{ id: makeId('story'), ...story }, ...prev.stories],
    }));
  };

  const handleUpdateStory = (updated: BehavioralStory) => {
    setState((prev) => ({
      ...prev,
      stories: prev.stories.map((s) => (s.id === updated.id ? updated : s)),
    }));
  };

  const handleDeleteStory = (id: string) => {
    setState((prev) => ({
      ...prev,
      stories: prev.stories.filter((s) => s.id !== id),
    }));
  };

  // Settings & Demo Mode
  const handleUpdateSettings = (next: UserSettings) => {
    setState((prev) => ({ ...prev, settings: next }));
  };

  const handleUpdateFirstUseDate = (nextDate: string) => {
    setState((prev) => ({ ...prev, firstUseDate: nextDate }));
  };

  const handleLoadSampleData = () => {
    setState(generateSampleData(todayStr));
  };

  const handleClearSampleData = () => {
    setState(createInitialState(todayStr));
  };

  const activeInternshipsCount = state.internships.filter(
    (i) => i.status === 'Applied' || i.status === 'In Progress' || i.status === 'Offer'
  ).length;
  const inProgressCount = state.internships.filter(
    (i) => i.status === 'In Progress'
  ).length;
  const overdueContactsCount = state.contacts.filter(
    (c) => diffDaysLocal(c.lastContactDate, todayStr) >= 14
  ).length;

  const navItems: Array<{
    id: NavSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'leetcode',
      label: 'LeetCode Log',
      icon: Code2,
      count: state.leetcodeLogs.length,
    },
    {
      id: 'internships',
      label: 'Internships',
      icon: Briefcase,
      count: state.internships.length,
    },
    {
      id: 'sprints',
      label: 'Python Sprints',
      icon: FolderGit2,
    },
    {
      id: 'contacts',
      label: 'Recruiter Contacts',
      icon: Users,
      count: state.contacts.length,
    },
    {
      id: 'stories',
      label: 'Behavioral Stories',
      icon: BookOpen,
      count: state.stories.length,
    },
    { id: 'settings', label: 'Settings & Backup', icon: Settings },
  ];

  const sectionTitles: Record<NavSection, string> = {
    dashboard: 'Overview',
    leetcode: 'LeetCode Log',
    internships: 'Internships Applied For',
    sprints: '14-Day Python Sprints',
    contacts: 'Recruiter Contacts',
    stories: 'Behavioral Stories',
    settings: 'Settings & Backup',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar (248px) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[248px] lg:shrink-0 bg-white border-r border-slate-200 min-h-screen sticky top-0 h-screen">
        <div className="px-5 h-16 flex items-center border-b border-slate-200">
          <button
            type="button"
            onClick={() => handleNavigate('dashboard')}
            className="text-lg font-display font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            PrepLedger
          </button>
        </div>

        <nav
          aria-label="Primary workspace navigation"
          className="flex-1 p-3 space-y-1 overflow-y-auto"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {typeof item.count === 'number' && (
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      active ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 text-xs text-slate-500 space-y-1">
          <div className="font-medium text-slate-700">Local Browser Storage</div>
          <div className="tabular-nums font-mono">
            Tracking since {formatDisplayDate(state.firstUseDate)}
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-white h-full border-r border-slate-200 flex flex-col z-10">
            <div className="px-4 h-14 flex items-center justify-between border-b border-slate-200">
              <span className="text-base font-display font-bold text-slate-900">
                PrepLedger
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-1.5 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    {typeof item.count === 'number' && (
                      <span className="text-xs font-mono tabular-nums opacity-75">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Clean Top Header Bar (3-zone contract) */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0 whitespace-nowrap">
              <span className="lg:hidden font-display font-bold text-slate-900">
                PrepLedger
              </span>
              <span className="lg:hidden text-slate-300">/</span>
              <h1 className="text-base font-semibold text-slate-900 truncate">
                {sectionTitles[activeSection]}
              </h1>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => handleNavigate('dashboard')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'dashboard' ? 'text-slate-900 underline underline-offset-4' : ''
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('leetcode')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'leetcode' ? 'text-slate-900 underline underline-offset-4' : ''
              }`}
            >
              LeetCode
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('internships')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'internships' ? 'text-slate-900 underline underline-offset-4' : ''
              }`}
            >
              Internships
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('sprints')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'sprints' ? 'text-slate-900 underline underline-offset-4' : ''
              }`}
            >
              Sprints
            </button>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => handleNavigate('leetcode')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Problem</span>
            </button>
          </div>
        </header>

        {/* Scrollable Workspace Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1240px] w-full mx-auto space-y-6">
          {/* Persistent In-App Dashboard Banner */}
          <DashboardBanner
            todayStr={todayStr}
            firstUseDate={state.firstUseDate}
            lastExportDate={state.lastExportDate}
            isSampleData={state.isSampleData}
            streakStats={streakStats}
            dueRevisits={dueRevisits}
            followUps={followUps}
            upcomingDeadlines={upcomingDeadlines}
            onExportJson={handleExportJson}
            onMarkReviewed={handleMarkReviewed}
            onDismissFollowUp={handleDismissFollowUp}
            onNavigate={handleNavigate}
          />

          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              {/* 4-Column Streak & Pipeline KPI Strip */}
              <section
                aria-label="Streak and recruiting summary"
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
              >
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-slate-500">
                    Current Streak
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold font-mono tabular-nums text-slate-900">
                      {streakStats.currentStreak}
                    </span>
                    <span className="text-xs text-slate-500">
                      day{streakStats.currentStreak === 1 ? '' : 's'} in a row
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 tabular-nums">
                    {streakStats.isTodayCompleted
                      ? `${streakStats.todayCount} problem${streakStats.todayCount === 1 ? '' : 's'} logged today`
                      : '0 logged today · Day still active'}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-slate-500">
                    Longest Streak
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold font-mono tabular-nums text-slate-900">
                      {streakStats.longestStreak}
                    </span>
                    <span className="text-xs text-slate-500">
                      day{streakStats.longestStreak === 1 ? '' : 's'} best run
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 tabular-nums">
                    {state.leetcodeLogs.length} total problem{state.leetcodeLogs.length === 1 ? '' : 's'} logged
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-slate-500">
                    Missed-Day Tally
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold font-mono tabular-nums text-slate-900">
                      {streakStats.totalMissedDays}
                    </span>
                    <span className="text-xs text-slate-500">
                      total missed days
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 tabular-nums">
                    {streakStats.currentMissedStreak} day{streakStats.currentMissedStreak === 1 ? '' : 's'} missed in a row · Since {formatDisplayDate(state.firstUseDate)}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-slate-500">
                    Internships &amp; Sprint
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold font-mono tabular-nums text-slate-900">
                      {activeInternshipsCount}
                    </span>
                    <span className="text-xs text-slate-500">
                      active applications
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 tabular-nums">
                    {inProgressCount} in progress · Sprint day {sprintProgress.dayNumber}/14
                  </div>
                </div>
              </section>

              {/* Row 2: Daily Checklist + 12-Week Heatmap */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                <div className="xl:col-span-5 flex flex-col">
                  <DailyChecklist
                    todayStr={todayStr}
                    todayProblemCount={streakStats.todayCount}
                    settings={state.settings}
                    currentSprint={state.sprintState.currentSprint}
                    gymLogs={state.gymLogs}
                    onLogGym={handleLogGym}
                    onDeleteGym={handleDeleteGym}
                    onNavigate={handleNavigate}
                    onQuickLogProblem={() => handleNavigate('leetcode')}
                  />
                </div>
                <div className="xl:col-span-7 flex flex-col gap-6">
                  <Heatmap12Weeks
                    todayStr={todayStr}
                    logs={state.leetcodeLogs}
                    countsByDate={streakStats.countsByDate}
                  />

                  {/* Quick Summary Strip for Contacts & Stories */}
                  <section className="bg-white border border-slate-200 rounded-xl p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">
                          Recruiting Prep Snapshot
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Quick jump to your applications, recruiter touchpoints, and STAR story bank.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => handleNavigate('internships')}
                        className="text-left p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        <div className="text-xs text-slate-500">Internships</div>
                        <div className="text-lg font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
                          {state.internships.length}
                        </div>
                        <div className="text-xs text-blue-700 mt-1">
                          {upcomingDeadlines.length > 0
                            ? `${upcomingDeadlines.length} deadline within 7d`
                            : 'Manage applications'}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNavigate('contacts')}
                        className="text-left p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        <div className="text-xs text-slate-500">
                          Recruiter contacts
                        </div>
                        <div className="text-lg font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
                          {state.contacts.length}
                        </div>
                        <div
                          className={`text-xs mt-1 ${
                            overdueContactsCount > 0
                              ? 'text-amber-700 font-medium'
                              : 'text-blue-700'
                          }`}
                        >
                          {overdueContactsCount > 0
                            ? `${overdueContactsCount} over 14d since contact`
                            : 'View contacts'}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNavigate('stories')}
                        className="text-left p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        <div className="text-xs text-slate-500">
                          Behavioral stories
                        </div>
                        <div className="text-lg font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
                          {state.stories.length}
                        </div>
                        <div className="text-xs text-blue-700 mt-1">
                          Open story bank
                        </div>
                      </button>
                    </div>
                  </section>
                </div>
              </div>

              {/* Row 3: Topic Coverage Bar Chart */}
              <TopicCoverageChart
                items={topicCoverage}
                onSelectTopic={(topic) => {
                  setLeetcodeTopicJump(topic);
                  setActiveSection('leetcode');
                }}
              />
            </div>
          )}

          {activeSection === 'leetcode' && (
            <LeetCodeSection
              todayStr={todayStr}
              logs={state.leetcodeLogs}
              activeTimer={state.activeTimer}
              initialTopicFilter={leetcodeTopicJump}
              onUpdateTimer={handleUpdateTimer}
              onAddEntry={handleAddLeetCode}
              onUpdateEntry={handleUpdateLeetCode}
              onDeleteEntry={handleDeleteLeetCode}
              onMarkReviewed={handleMarkReviewed}
            />
          )}

          {activeSection === 'internships' && (
            <InternshipsSection
              todayStr={todayStr}
              internships={state.internships}
              onAddInternship={handleAddInternship}
              onUpdateInternship={handleUpdateInternship}
              onDeleteInternship={handleDeleteInternship}
            />
          )}

          {activeSection === 'sprints' && (
            <PythonSprintSection
              todayStr={todayStr}
              sprintState={state.sprintState}
              onUpdateCurrentSprint={handleUpdateCurrentSprint}
              onMarkComplete={handleMarkSprintComplete}
              onReopenCurrentSprint={handleReopenCurrentSprint}
              onSetCycleStartDate={handleSetSprintStartDate}
            />
          )}

          {activeSection === 'contacts' && (
            <ContactsSection
              todayStr={todayStr}
              contacts={state.contacts}
              onAddContact={handleAddContact}
              onUpdateContact={handleUpdateContact}
              onDeleteContact={handleDeleteContact}
            />
          )}

          {activeSection === 'stories' && (
            <StoriesSection
              todayStr={todayStr}
              stories={state.stories}
              onAddStory={handleAddStory}
              onUpdateStory={handleUpdateStory}
              onDeleteStory={handleDeleteStory}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsSection
              todayStr={todayStr}
              state={state}
              onUpdateSettings={handleUpdateSettings}
              onUpdateFirstUseDate={handleUpdateFirstUseDate}
              onExportJson={handleExportJson}
              onImportJson={handleImportJson}
              onLoadSampleData={handleLoadSampleData}
              onClearSampleData={handleClearSampleData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
