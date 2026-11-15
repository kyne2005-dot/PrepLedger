import { AppState, Difficulty, InternshipStatus, LeetCodeEntry } from '../types';
import { reconcileSprintCycle } from './calculations';
import { addDaysLocal, getTodayLocal, isValidLocalDateString } from './dates';

export const STORAGE_KEY = 'prepledger_state_v1';
export const CURRENT_SCHEMA_VERSION = 1;

export function createInitialState(todayStr = getTodayLocal()): AppState {
  return {
    version: 1,
    firstUseDate: todayStr,
    lastExportDate: null,
    isSampleData: false,
    leetcodeLogs: [],
    internships: [],
    sprintState: {
      currentSprint: {
        id: `sprint-1-${todayStr}`,
        number: 1,
        title: 'Python Sprint #1',
        notes: 'Pick a focused 2-week Python project to build and ship.',
        startDate: todayStr,
        endDate: addDaysLocal(todayStr, 13),
        status: 'active',
      },
      history: [],
    },
    gymLogs: [],
    contacts: [],
    stories: [],
    dismissedFollowUps: [],
    settings: {
      dailyMinProblems: 1,
      dailyTargetProblems: 2,
      includeGymSection: true,
      weeklyGymTarget: 3,
      gymScheduledDays: [1, 3, 5],
      sprintLengthDays: 14,
    },
    activeTimer: {
      running: false,
      startedAtMs: null,
      accumulatedMs: 0,
    },
  };
}

export function normalizeAppState(
  raw: unknown,
  todayStr = getTodayLocal()
): AppState {
  const base = createInitialState(todayStr);
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Record<string, unknown>;

  const firstUseDate =
    typeof obj.firstUseDate === 'string' && isValidLocalDateString(obj.firstUseDate)
      ? obj.firstUseDate
      : base.firstUseDate;

  const lastExportDate =
    typeof obj.lastExportDate === 'string' && isValidLocalDateString(obj.lastExportDate)
      ? obj.lastExportDate
      : null;

  const leetcodeLogs: LeetCodeEntry[] = Array.isArray(obj.leetcodeLogs)
    ? obj.leetcodeLogs.map((item: Record<string, unknown>, idx) => ({
        id: typeof item.id === 'string' ? item.id : `lc-${idx}-${Date.now()}`,
        date:
          typeof item.date === 'string' && isValidLocalDateString(item.date)
            ? item.date
            : todayStr,
        title: typeof item.title === 'string' ? item.title : 'Untitled Problem',
        problemRef: typeof item.problemRef === 'string' ? item.problemRef : '',
        difficulty: (item.difficulty === 'Easy' ||
        item.difficulty === 'Medium' ||
        item.difficulty === 'Hard'
          ? item.difficulty
          : 'Medium') as Difficulty,
        topic: typeof item.topic === 'string' && item.topic ? item.topic : 'Arrays & Hashing',
        minutesTaken:
          typeof item.minutesTaken === 'number' && !Number.isNaN(item.minutesTaken)
            ? Math.max(0, Math.round(item.minutesTaken))
            : 0,
        revisit: Boolean(item.revisit),
        reviewedMilestones: Array.isArray(item.reviewedMilestones)
          ? item.reviewedMilestones.filter((m): m is number => typeof m === 'number')
          : [],
        notes: typeof item.notes === 'string' ? item.notes : '',
      }))
    : [];

  const validStatuses: InternshipStatus[] = [
    'Applied',
    'In Progress',
    'Offer',
    'Declined',
  ];

  const internships = Array.isArray(obj.internships)
    ? obj.internships.map((item: Record<string, unknown>, idx) => ({
        id: typeof item.id === 'string' ? item.id : `int-${idx}-${Date.now()}`,
        company: typeof item.company === 'string' ? item.company : 'Company',
        role: typeof item.role === 'string' ? item.role : 'Software Engineering Intern',
        status: validStatuses.includes(item.status as InternshipStatus)
          ? (item.status as InternshipStatus)
          : 'Applied',
        dateApplied:
          typeof item.dateApplied === 'string' && isValidLocalDateString(item.dateApplied)
            ? item.dateApplied
            : todayStr,
        deadline:
          typeof item.deadline === 'string' && isValidLocalDateString(item.deadline)
            ? item.deadline
            : '',
        nextStep: typeof item.nextStep === 'string' ? item.nextStep : '',
        link: typeof item.link === 'string' ? item.link : '',
        notes: typeof item.notes === 'string' ? item.notes : '',
      }))
    : [];

  const rawSprint = (obj.sprintState || {}) as Record<string, unknown>;
  const rawCurrent = (rawSprint.currentSprint || {}) as Record<string, unknown>;
  const sprintStart =
    typeof rawCurrent.startDate === 'string' && isValidLocalDateString(rawCurrent.startDate)
      ? rawCurrent.startDate
      : base.sprintState.currentSprint.startDate;
  const sprintEnd =
    typeof rawCurrent.endDate === 'string' && isValidLocalDateString(rawCurrent.endDate)
      ? rawCurrent.endDate
      : addDaysLocal(sprintStart, 13);

  const initialSprintState = {
    currentSprint: {
      id:
        typeof rawCurrent.id === 'string'
          ? rawCurrent.id
          : `sprint-${typeof rawCurrent.number === 'number' ? rawCurrent.number : 1}`,
      number: typeof rawCurrent.number === 'number' ? rawCurrent.number : 1,
      title:
        typeof rawCurrent.title === 'string' && rawCurrent.title
          ? rawCurrent.title
          : 'Python Sprint #1',
      notes: typeof rawCurrent.notes === 'string' ? rawCurrent.notes : '',
      startDate: sprintStart,
      endDate: sprintEnd,
      status:
        rawCurrent.status === 'Completed' ? ('Completed' as const) : ('active' as const),
      completedAt:
        typeof rawCurrent.completedAt === 'string' ? rawCurrent.completedAt : undefined,
    },
    history: Array.isArray(rawSprint.history)
      ? rawSprint.history.map((h: Record<string, unknown>, idx) => ({
          id: typeof h.id === 'string' ? h.id : `hist-${idx}`,
          number: typeof h.number === 'number' ? h.number : idx + 1,
          title: typeof h.title === 'string' ? h.title : `Python Sprint #${idx + 1}`,
          notes: typeof h.notes === 'string' ? h.notes : '',
          startDate:
            typeof h.startDate === 'string' && isValidLocalDateString(h.startDate)
              ? h.startDate
              : sprintStart,
          endDate:
            typeof h.endDate === 'string' && isValidLocalDateString(h.endDate)
              ? h.endDate
              : sprintEnd,
          status:
            h.status === 'Completed'
              ? ('Completed' as const)
              : ('Not finished' as const),
          completedAt: typeof h.completedAt === 'string' ? h.completedAt : undefined,
        }))
      : [],
  };

  const { state: reconciledSprints } = reconcileSprintCycle(initialSprintState, todayStr);

  const gymLogs = Array.isArray(obj.gymLogs)
    ? obj.gymLogs.map((g: Record<string, unknown>, idx) => ({
        id: typeof g.id === 'string' ? g.id : `gym-${idx}`,
        date:
          typeof g.date === 'string' && isValidLocalDateString(g.date)
            ? g.date
            : todayStr,
        type: g.type === 'Running' ? ('Running' as const) : ('Gym' as const),
        notes: typeof g.notes === 'string' ? g.notes : '',
      }))
    : [];

  const contacts = Array.isArray(obj.contacts)
    ? obj.contacts.map((c: Record<string, unknown>, idx) => ({
        id: typeof c.id === 'string' ? c.id : `contact-${idx}`,
        name: typeof c.name === 'string' ? c.name : '',
        company: typeof c.company === 'string' ? c.company : '',
        connectedVia: typeof c.connectedVia === 'string' ? c.connectedVia : '',
        lastContactDate:
          typeof c.lastContactDate === 'string' &&
          isValidLocalDateString(c.lastContactDate)
            ? c.lastContactDate
            : todayStr,
        notes: typeof c.notes === 'string' ? c.notes : '',
      }))
    : [];

  const stories = Array.isArray(obj.stories)
    ? obj.stories.map((s: Record<string, unknown>, idx) => ({
        id: typeof s.id === 'string' ? s.id : `story-${idx}`,
        title: typeof s.title === 'string' ? s.title : 'Untitled Story',
        labels: Array.isArray(s.labels)
          ? s.labels.filter((l): l is string => typeof l === 'string')
          : [],
        notes: typeof s.notes === 'string' ? s.notes : '',
        updatedAt:
          typeof s.updatedAt === 'string' && isValidLocalDateString(s.updatedAt)
            ? s.updatedAt
            : todayStr,
      }))
    : [];

  const dismissedFollowUps = Array.isArray(obj.dismissedFollowUps)
    ? obj.dismissedFollowUps.filter((d): d is string => typeof d === 'string')
    : [];

  const rawSettings = (obj.settings || {}) as Record<string, unknown>;
  const settings = {
    dailyMinProblems:
      typeof rawSettings.dailyMinProblems === 'number'
        ? Math.max(1, Math.min(3, rawSettings.dailyMinProblems))
        : base.settings.dailyMinProblems,
    dailyTargetProblems:
      typeof rawSettings.dailyTargetProblems === 'number'
        ? Math.max(1, Math.min(3, rawSettings.dailyTargetProblems))
        : base.settings.dailyTargetProblems,
    includeGymSection:
      typeof rawSettings.includeGymSection === 'boolean'
        ? rawSettings.includeGymSection
        : base.settings.includeGymSection,
    weeklyGymTarget:
      typeof rawSettings.weeklyGymTarget === 'number'
        ? Math.max(1, Math.min(7, rawSettings.weeklyGymTarget))
        : base.settings.weeklyGymTarget,
    gymScheduledDays: Array.isArray(rawSettings.gymScheduledDays)
      ? rawSettings.gymScheduledDays.filter(
          (d): d is number => typeof d === 'number' && d >= 0 && d <= 6
        )
      : base.settings.gymScheduledDays,
    sprintLengthDays: 14,
  };

  const rawTimer = (obj.activeTimer || {}) as Record<string, unknown>;
  const activeTimer = {
    running: Boolean(rawTimer.running),
    startedAtMs:
      typeof rawTimer.startedAtMs === 'number' ? rawTimer.startedAtMs : null,
    accumulatedMs:
      typeof rawTimer.accumulatedMs === 'number' ? rawTimer.accumulatedMs : 0,
  };

  return {
    version: 1,
    firstUseDate,
    lastExportDate,
    isSampleData: Boolean(obj.isSampleData),
    leetcodeLogs,
    internships,
    sprintState: reconciledSprints,
    gymLogs,
    contacts,
    stories,
    dismissedFollowUps,
    settings,
    activeTimer,
  };
}

export function loadAppState(): AppState {
  const todayStr = getTodayLocal();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState(todayStr);
    const parsed = JSON.parse(raw);
    return normalizeAppState(parsed, todayStr);
  } catch {
    return createInitialState(todayStr);
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function hasRealUserData(state: AppState): boolean {
  if (state.isSampleData) return false;
  return (
    state.leetcodeLogs.length > 0 ||
    state.internships.length > 0 ||
    state.contacts.length > 0 ||
    state.stories.length > 0 ||
    state.gymLogs.length > 0 ||
    state.sprintState.history.length > 0
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export type BackupImportResult =
  | { ok: true; state: AppState }
  | { ok: false; error: string };

export function validateAndParseBackupJson(
  rawText: string,
  todayStr = getTodayLocal()
): BackupImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return {
      ok: false,
      error: 'Invalid JSON file: could not parse JSON syntax.',
    };
  }

  if (!isPlainObject(parsed)) {
    return {
      ok: false,
      error: 'Invalid backup file: expected a JSON object at the root.',
    };
  }

  // Optional version (older exports may omit version). If present, must be a positive number.
  if (parsed.version !== undefined) {
    if (
      typeof parsed.version !== 'number' ||
      !Number.isFinite(parsed.version) ||
      parsed.version < 1
    ) {
      return {
        ok: false,
        error: 'Invalid backup file: "version" must be a positive number.',
      };
    }
  }

  // Required core arrays
  if (!Array.isArray(parsed.leetcodeLogs)) {
    return {
      ok: false,
      error: 'Invalid backup file: missing required "leetcodeLogs" list.',
    };
  }

  if (!Array.isArray(parsed.internships)) {
    return {
      ok: false,
      error: 'Invalid backup file: missing required "internships" list.',
    };
  }

  for (let i = 0; i < parsed.leetcodeLogs.length; i += 1) {
    const item = parsed.leetcodeLogs[i];
    if (
      !isPlainObject(item) ||
      typeof item.title !== 'string' ||
      !item.title.trim() ||
      typeof item.date !== 'string' ||
      !isValidLocalDateString(item.date)
    ) {
      return {
        ok: false,
        error: `Invalid backup file: LeetCode entry #${i + 1} is missing a valid "title" or YYYY-MM-DD "date".`,
      };
    }
  }

  for (let i = 0; i < parsed.internships.length; i += 1) {
    const item = parsed.internships[i];
    if (
      !isPlainObject(item) ||
      typeof item.company !== 'string' ||
      !item.company.trim()
    ) {
      return {
        ok: false,
        error: `Invalid backup file: Internship entry #${i + 1} is missing a valid "company" field.`,
      };
    }
  }

  if (
    parsed.firstUseDate !== undefined &&
    (typeof parsed.firstUseDate !== 'string' ||
      !isValidLocalDateString(parsed.firstUseDate))
  ) {
    return {
      ok: false,
      error: 'Invalid backup file: "firstUseDate" must be a YYYY-MM-DD string.',
    };
  }

  if (
    parsed.lastExportDate !== undefined &&
    parsed.lastExportDate !== null &&
    (typeof parsed.lastExportDate !== 'string' ||
      !isValidLocalDateString(parsed.lastExportDate))
  ) {
    return {
      ok: false,
      error:
        'Invalid backup file: "lastExportDate" must be null or a YYYY-MM-DD string.',
    };
  }

  if (parsed.sprintState !== undefined && !isPlainObject(parsed.sprintState)) {
    return {
      ok: false,
      error: 'Invalid backup file: "sprintState" must be an object.',
    };
  }

  if (parsed.gymLogs !== undefined && !Array.isArray(parsed.gymLogs)) {
    return {
      ok: false,
      error: 'Invalid backup file: "gymLogs" must be an array.',
    };
  }

  if (parsed.contacts !== undefined && !Array.isArray(parsed.contacts)) {
    return {
      ok: false,
      error: 'Invalid backup file: "contacts" must be an array.',
    };
  }

  if (parsed.stories !== undefined && !Array.isArray(parsed.stories)) {
    return {
      ok: false,
      error: 'Invalid backup file: "stories" must be an array.',
    };
  }

  if (
    parsed.dismissedFollowUps !== undefined &&
    !Array.isArray(parsed.dismissedFollowUps)
  ) {
    return {
      ok: false,
      error: 'Invalid backup file: "dismissedFollowUps" must be an array.',
    };
  }

  if (parsed.settings !== undefined && !isPlainObject(parsed.settings)) {
    return {
      ok: false,
      error: 'Invalid backup file: "settings" must be an object.',
    };
  }

  const normalized = normalizeAppState(parsed, todayStr);
  return { ok: true, state: normalized };
}

export function buildExportPayload(
  state: AppState,
  todayStr = getTodayLocal()
): AppState {
  return {
    ...state,
    version: CURRENT_SCHEMA_VERSION,
    lastExportDate: todayStr,
  };
}

export function exportStateAsJson(
  state: AppState,
  todayStr = getTodayLocal()
): AppState {
  const updated = buildExportPayload(state, todayStr);
  const payload = JSON.stringify(updated, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prepledger-backup-${todayStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return updated;
}

export function generateSampleData(todayStr = getTodayLocal()): AppState {
  const d = (offset: number) => addDaysLocal(todayStr, offset);

  return {
    version: 1,
    firstUseDate: d(-45),
    lastExportDate: d(-9), // Triggers the >7 day backup warning in the banner so user sees how it works
    isSampleData: true,
    leetcodeLogs: [
      {
        id: 'sample-lc-1',
        date: d(-1),
        title: 'LRU Cache',
        problemRef: '146',
        difficulty: 'Medium',
        topic: 'Linked List',
        minutesTaken: 34,
        revisit: true,
        reviewedMilestones: [],
        notes: 'Doubly linked list + hashmap for O(1) get/put. Watch sentinel head/tail pointer updates on removeNode.',
      },
      {
        id: 'sample-lc-2',
        date: d(-2),
        title: 'Course Schedule II',
        problemRef: 'https://leetcode.com/problems/course-schedule-ii/',
        difficulty: 'Medium',
        topic: 'Graphs',
        minutesTaken: 28,
        revisit: false,
        reviewedMilestones: [],
        notes: "Kahn's BFS topological sort with indegree array. If result.length !== numCourses, cycle exists.",
      },
      {
        id: 'sample-lc-3',
        date: d(-3),
        title: 'Word Ladder',
        problemRef: '127',
        difficulty: 'Hard',
        topic: 'Graphs',
        minutesTaken: 47,
        revisit: true,
        reviewedMilestones: [],
        notes: 'Flagged for 3-day review! Bidirectional BFS cuts search space; wildcard pattern bucket map avoids O(N^2 * L).',
      },
      {
        id: 'sample-lc-4',
        date: d(-4),
        title: 'Minimum Window Substring',
        problemRef: '76',
        difficulty: 'Hard',
        topic: 'Sliding Window',
        minutesTaken: 42,
        revisit: false,
        reviewedMilestones: [],
        notes: 'Track have/need character frequency counts. Shrink left pointer while have === need.',
      },
      {
        id: 'sample-lc-5',
        date: d(-5),
        title: 'Koko Eating Bananas',
        problemRef: '875',
        difficulty: 'Medium',
        topic: 'Binary Search',
        minutesTaken: 19,
        revisit: false,
        reviewedMilestones: [],
        notes: 'Binary search on answer space [1..max(piles)]. Ceil division: Math.ceil(p / k).',
      },
      {
        id: 'sample-lc-6',
        date: d(-6),
        title: 'Valid Parentheses',
        problemRef: '20',
        difficulty: 'Easy',
        topic: 'Stack',
        minutesTaken: 9,
        revisit: false,
        reviewedMilestones: [],
        notes: 'Warm-up stack check; push expected closing bracket for cleaner comparison.',
      },
      {
        id: 'sample-lc-7',
        date: d(-7),
        title: 'Merge K Sorted Lists',
        problemRef: '23',
        difficulty: 'Hard',
        topic: 'Heap / Priority Queue',
        minutesTaken: 38,
        revisit: true,
        reviewedMilestones: [],
        notes: 'Flagged for 7-day review! Min-heap of k list heads gives O(N log k) time; divide-and-conquer merge also works.',
      },
      {
        id: 'sample-lc-8',
        date: d(-8),
        title: 'Binary Tree Level Order Traversal',
        problemRef: '102',
        difficulty: 'Medium',
        topic: 'Trees',
        minutesTaken: 16,
        revisit: false,
        reviewedMilestones: [],
        notes: 'Standard BFS queue snapshot by level size.',
      },
      {
        id: 'sample-lc-9',
        date: d(-10),
        title: 'Group Anagrams',
        problemRef: '49',
        difficulty: 'Medium',
        topic: 'Arrays & Hashing',
        minutesTaken: 14,
        revisit: false,
        reviewedMilestones: [],
        notes: 'Use 26-char frequency key instead of sorting each string for O(N * K) time.',
      },
      {
        id: 'sample-lc-10',
        date: d(-11),
        title: 'Container With Most Water',
        problemRef: '11',
        difficulty: 'Medium',
        topic: 'Two Pointers',
        minutesTaken: 15,
        revisit: false,
        reviewedMilestones: [],
        notes: 'Move shorter pointer inward because width shrinks and only a taller wall can improve area.',
      },
      {
        id: 'sample-lc-11',
        date: d(-12),
        title: '3Sum',
        problemRef: '15',
        difficulty: 'Medium',
        topic: 'Two Pointers',
        minutesTaken: 26,
        revisit: false,
        reviewedMilestones: [],
        notes: 'Sort first, skip duplicate anchors and duplicate left/right pairs.',
      },
      {
        id: 'sample-lc-12',
        date: d(-13),
        title: 'Top K Frequent Elements',
        problemRef: '347',
        difficulty: 'Medium',
        topic: 'Arrays & Hashing',
        minutesTaken: 18,
        revisit: false,
        reviewedMilestones: [],
        notes: 'Bucket sort by frequency for O(N) linear time.',
      },
      {
        id: 'sample-lc-13',
        date: d(-14),
        title: 'Subsets',
        problemRef: '78',
        difficulty: 'Medium',
        topic: 'Backtracking',
        minutesTaken: 17,
        revisit: false,
        reviewedMilestones: [],
        notes: 'Include/exclude recursion tree; copy path snapshot at leaf or every node.',
      },
      {
        id: 'sample-lc-14',
        date: d(-17),
        title: 'Two Sum',
        problemRef: '1',
        difficulty: 'Easy',
        topic: 'Arrays & Hashing',
        minutesTaken: 7,
        revisit: false,
        reviewedMilestones: [],
        notes: 'Single-pass complement hashmap.',
      },
      {
        id: 'sample-lc-15',
        date: d(-18),
        title: 'Longest Increasing Subsequence',
        problemRef: '300',
        difficulty: 'Medium',
        topic: 'Dynamic Programming',
        minutesTaken: 31,
        revisit: false,
        reviewedMilestones: [],
        notes: 'Patience sorting + binary search on tails array achieves O(N log N).',
      },
      {
        id: 'sample-lc-16',
        date: d(-19),
        title: 'Merge Intervals',
        problemRef: '56',
        difficulty: 'Medium',
        topic: 'Intervals',
        minutesTaken: 15,
        revisit: false,
        reviewedMilestones: [],
        notes: 'Sort by start time; merge when curr.start <= last.end.',
      },
      {
        id: 'sample-lc-17',
        date: d(-20),
        title: 'Implement Trie',
        problemRef: '208',
        difficulty: 'Medium',
        topic: 'Tries',
        minutesTaken: 22,
        revisit: false,
        reviewedMilestones: [],
        notes: 'TrieNode with children map and isEnd boolean.',
      },
      {
        id: 'sample-lc-18',
        date: d(-21),
        title: 'Number of Islands',
        problemRef: '200',
        difficulty: 'Medium',
        topic: 'Graphs',
        minutesTaken: 20,
        revisit: false,
        reviewedMilestones: [],
        notes: 'DFS/BFS flood fill marking visited water in-place.',
      },
      {
        id: 'sample-lc-19',
        date: d(-24),
        title: 'Maximum Subarray',
        problemRef: '53',
        difficulty: 'Medium',
        topic: 'Greedy',
        minutesTaken: 12,
        revisit: false,
        reviewedMilestones: [],
        notes: "Kadane's algorithm: reset running sum when it drops below 0.",
      },
    ],
    internships: [
      {
        id: 'sample-int-1',
        company: 'Booz Allen',
        role: 'Summer Technical PM Intern',
        status: 'Applied',
        dateApplied: d(-6),
        deadline: d(5), // Closes in 5 days -> triggers banner countdown
        nextStep: 'Submit security clearance pre-screen form',
        link: 'https://careers.boozallen.com',
        notes: 'Tailored resume for federal cloud & agile delivery metrics. Mentioned Python automation work.',
      },
      {
        id: 'sample-int-2',
        company: 'Datadog',
        role: 'Software Engineering Intern',
        status: 'Applied',
        dateApplied: d(-16), // >= 14 days at Applied -> triggers Follow up nudge
        deadline: '',
        nextStep: 'Send polite follow-up note to campus recruiter',
        link: 'https://careers.datadoghq.com',
        notes: 'Applied via university portal after fall tech talk.',
      },
      {
        id: 'sample-int-3',
        company: 'Stripe',
        role: 'Product Management Intern',
        status: 'In Progress',
        dateApplied: d(-12),
        deadline: d(3), // Closes in 3 days
        nextStep: 'Complete 60-min product sense & API design case',
        link: 'https://stripe.com/jobs',
        notes: 'Passed recruiter screen. Studying developer checkout flows & webhook reliability.',
      },
      {
        id: 'sample-int-4',
        company: 'Cloudflare',
        role: 'Systems Engineering Intern',
        status: 'Offer',
        dateApplied: d(-35),
        deadline: '',
        nextStep: 'Review offer terms and housing stipend by Nov 30',
        link: 'https://www.cloudflare.com/careers/',
        notes: 'Strong technical loop on networking & LRU caching.',
      },
      {
        id: 'sample-int-5',
        company: 'Palantir',
        role: 'Forward Deployed SWE Intern',
        status: 'Declined',
        dateApplied: d(-28),
        deadline: '',
        nextStep: '',
        link: 'https://www.palantir.com/careers/',
        notes: 'Completed Karat screen; need faster edge-case verification under time pressure.',
      },
    ],
    sprintState: {
      currentSprint: {
        id: `sample-sprint-3-${d(-5)}`,
        number: 3,
        title: 'Python Sprint #3: FastAPI Job Alert Scraper',
        notes: 'Build a FastAPI + SQLite CLI/service that parses RSS internship feeds and exports weekly digests.',
        startDate: d(-5),
        endDate: d(8),
        status: 'active',
      },
      history: [
        {
          id: 'sample-sprint-2',
          number: 2,
          title: 'Python Sprint #2: Log Anomaly Detector',
          notes: 'Built pandas + pytest script to detect latency spikes in sample Nginx logs.',
          startDate: d(-19),
          endDate: d(-6),
          status: 'Completed',
          completedAt: d(-7),
        },
        {
          id: 'sample-sprint-1',
          number: 1,
          title: 'Python Sprint #1: Resume Keyword Analyzer',
          notes: 'Started TF-IDF matcher but ran out of time before adding PDF export.',
          startDate: d(-33),
          endDate: d(-20),
          status: 'Not finished',
        },
      ],
    },
    gymLogs: [
      { id: 'sample-gym-1', date: d(-1), type: 'Running', notes: '5K tempo run — 24:15' },
      { id: 'sample-gym-2', date: d(-3), type: 'Gym', notes: 'Upper body strength + core' },
      { id: 'sample-gym-3', date: d(-5), type: 'Running', notes: 'Easy 3-mile recovery jog' },
    ],
    contacts: [
      {
        id: 'sample-contact-1',
        name: 'Maya Lin',
        company: 'Datadog',
        connectedVia: 'Fall Campus Career Fair',
        lastContactDate: d(-18), // Triggers >= 14 days warning color
        notes: 'University technical recruiter for SWE & PM tracks. Mentioned teams review applications in late November.',
      },
      {
        id: 'sample-contact-2',
        name: 'Jordan Alvarez',
        company: 'Stripe',
        connectedVia: 'LinkedIn referral via alumni',
        lastContactDate: d(-4),
        notes: 'PM Recruiting Coordinator. Sent calendar link for product sense round.',
      },
      {
        id: 'sample-contact-3',
        name: 'Priya Nair',
        company: 'Booz Allen',
        connectedVia: 'Tech Info Session',
        lastContactDate: d(-9),
        notes: 'Campus talent lead for Digital Solutions group.',
      },
    ],
    stories: [
      {
        id: 'sample-story-1',
        title: 'Cut Capstone API Latency by 42% Before Demo Day',
        labels: ['Problem solving', 'Ownership'],
        notes: 'Situation: Our team dashboard timed out under 50 concurrent users 4 days before final review.\nTask: Diagnose bottleneck and stabilize response times.\nAction: Profiled SQL queries, added composite indexes and in-memory caching for static lookups.\nResult: P95 latency dropped from 1.9s to 1.1s and demo ran with zero errors.',
        updatedAt: d(-4),
      },
      {
        id: 'sample-story-2',
        title: 'Aligned Engineering & Design on Scope Cut Under Tight Sprint',
        labels: ['Leadership', 'Teamwork', 'Communication'],
        notes: 'Situation: Halfway through a 2-week hackathon sprint, scope creep threatened core checkout reliability.\nTask: Re-align 4 teammates around shippable MVP.\nAction: Facilitated a 20-minute trade-off matrix prioritizing user-critical flows and deferred analytics charts to v2.\nResult: Shipped on schedule and won Best Execution.',
        updatedAt: d(-10),
      },
      {
        id: 'sample-story-3',
        title: 'Resolved Merge Conflict & Testing Gap in Group Repo',
        labels: ['Teamwork', 'Problem solving'],
        notes: 'Situation: Two branches modified shared auth middleware differently, breaking CI.\nAction: Paired with both teammates, unified schema validation, and added GitHub Actions test gate.\nResult: Prevented regressions for the rest of the semester.',
        updatedAt: d(-15),
      },
    ],
    dismissedFollowUps: [],
    settings: {
      dailyMinProblems: 1,
      dailyTargetProblems: 2,
      includeGymSection: true,
      weeklyGymTarget: 3,
      gymScheduledDays: [1, 3, 5],
      sprintLengthDays: 14,
    },
    activeTimer: {
      running: false,
      startedAtMs: null,
      accumulatedMs: 0,
    },
  };
}
