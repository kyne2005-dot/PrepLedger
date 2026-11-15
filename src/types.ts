export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type InternshipStatus = 'Applied' | 'In Progress' | 'Offer' | 'Declined';

export type GymActivityType = 'Gym' | 'Running';

export type NavSection =
  | 'dashboard'
  | 'leetcode'
  | 'internships'
  | 'sprints'
  | 'contacts'
  | 'stories'
  | 'settings';

export const LEETCODE_TOPICS = [
  'Arrays & Hashing',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Binary Search',
  'Linked List',
  'Trees',
  'Tries',
  'Heap / Priority Queue',
  'Backtracking',
  'Graphs',
  'Dynamic Programming',
  'Greedy',
  'Intervals',
  'Math & Geometry',
  'Bit Manipulation',
  'Other',
] as const;

export const INTERNSHIP_STATUSES: InternshipStatus[] = [
  'Applied',
  'In Progress',
  'Offer',
  'Declined',
];

export const STORY_PRESET_LABELS = [
  'Leadership',
  'Problem solving',
  'Teamwork',
  'Conflict resolution',
  'Ownership',
  'Communication',
] as const;

export interface LeetCodeEntry {
  id: string;
  date: string; // Local YYYY-MM-DD
  title: string;
  problemRef: string; // Problem number or link
  difficulty: Difficulty;
  topic: string;
  minutesTaken: number;
  revisit: boolean;
  reviewedMilestones: number[]; // e.g. [3], [3, 7]
  notes: string;
}

export interface InternshipEntry {
  id: string;
  company: string;
  role: string;
  status: InternshipStatus;
  dateApplied: string; // Local YYYY-MM-DD
  deadline: string; // Optional YYYY-MM-DD or ''
  nextStep: string; // Optional short text
  link: string;
  notes: string;
}

export interface PythonSprint {
  id: string;
  number: number;
  title: string;
  notes: string;
  startDate: string; // Local YYYY-MM-DD
  endDate: string; // Local YYYY-MM-DD (startDate + 13 days)
  status: 'active' | 'Completed' | 'Not finished';
  completedAt?: string;
}

export interface SprintState {
  currentSprint: PythonSprint;
  history: PythonSprint[];
}

export interface GymLogEntry {
  id: string;
  date: string; // Local YYYY-MM-DD
  type: GymActivityType;
  notes: string;
}

export interface RecruiterContact {
  id: string;
  name: string;
  company: string;
  connectedVia: string;
  lastContactDate: string; // Local YYYY-MM-DD
  notes: string;
}

export interface BehavioralStory {
  id: string;
  title: string;
  labels: string[];
  notes: string;
  updatedAt: string; // Local YYYY-MM-DD
}

export interface UserSettings {
  dailyMinProblems: number; // Exact minimum that counts as a completed day (default 1)
  dailyTargetProblems: number; // Daily checklist target (1-3, default 2)
  includeGymSection: boolean;
  weeklyGymTarget: number;
  gymScheduledDays: number[]; // 0 (Sun) - 6 (Sat)
  sprintLengthDays: number; // Fixed 14
}

export interface ActiveTimerState {
  running: boolean;
  startedAtMs: number | null;
  accumulatedMs: number;
}

export interface AppState {
  version: number;
  firstUseDate: string; // Local YYYY-MM-DD
  lastExportDate: string | null; // Local YYYY-MM-DD or null
  isSampleData: boolean;
  leetcodeLogs: LeetCodeEntry[];
  internships: InternshipEntry[];
  sprintState: SprintState;
  gymLogs: GymLogEntry[];
  contacts: RecruiterContact[];
  stories: BehavioralStory[];
  dismissedFollowUps: string[]; // Internship IDs dismissed from follow-up banner
  settings: UserSettings;
  activeTimer: ActiveTimerState;
}
