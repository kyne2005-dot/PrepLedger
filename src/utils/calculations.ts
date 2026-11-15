import {
  InternshipEntry,
  LEETCODE_TOPICS,
  LeetCodeEntry,
  PythonSprint,
  SprintState,
} from '../types';
import { addDaysLocal, diffDaysLocal } from './dates';

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalMissedDays: number;
  currentMissedStreak: number;
  todayCount: number;
  isTodayCompleted: boolean;
  isStreakAtRisk: boolean;
  countsByDate: Record<string, number>;
}

export function calculateStreakStats(
  logs: LeetCodeEntry[],
  firstUseDate: string,
  todayStr: string,
  minPerDay = 1
): StreakStats {
  const countsByDate: Record<string, number> = {};
  for (const entry of logs) {
    if (!entry.date) continue;
    countsByDate[entry.date] = (countsByDate[entry.date] || 0) + 1;
  }

  const completedDates = Object.keys(countsByDate)
    .filter((d) => countsByDate[d] >= minPerDay && d <= todayStr)
    .sort();

  const completedSet = new Set(completedDates);
  const todayCount = countsByDate[todayStr] || 0;
  const isTodayCompleted = todayCount >= minPerDay;
  const isStreakAtRisk = !isTodayCompleted;

  // Current streak: start from today if completed, otherwise from yesterday
  let currentStreak = 0;
  let cursor = isTodayCompleted ? todayStr : addDaysLocal(todayStr, -1);
  while (completedSet.has(cursor)) {
    currentStreak += 1;
    cursor = addDaysLocal(cursor, -1);
  }

  // Longest streak across all completed dates
  let longestStreak = 0;
  let run = 0;
  let prevDate: string | null = null;
  for (const d of completedDates) {
    if (prevDate && diffDaysLocal(prevDate, d) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longestStreak) {
      longestStreak = run;
    }
    prevDate = d;
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  // Missed days: count only days from firstUseDate through yesterday (today hasn't ended)
  const yesterdayStr = addDaysLocal(todayStr, -1);
  let totalMissedDays = 0;
  let currentMissedStreak = 0;

  if (firstUseDate <= yesterdayStr) {
    let day = firstUseDate;
    let safety = 0;
    while (day <= yesterdayStr && safety < 3660) {
      if (!completedSet.has(day)) {
        totalMissedDays += 1;
      }
      day = addDaysLocal(day, 1);
      safety += 1;
    }

    if (!isTodayCompleted) {
      let back = yesterdayStr;
      let backSafety = 0;
      while (back >= firstUseDate && !completedSet.has(back) && backSafety < 3660) {
        currentMissedStreak += 1;
        back = addDaysLocal(back, -1);
        backSafety += 1;
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalMissedDays,
    currentMissedStreak,
    todayCount,
    isTodayCompleted,
    isStreakAtRisk,
    countsByDate,
  };
}

export interface DueRevisitItem {
  entry: LeetCodeEntry;
  milestone: 3 | 7;
  daysSince: number;
}

export function getDueRevisitEntries(
  logs: LeetCodeEntry[],
  todayStr: string
): DueRevisitItem[] {
  const due: DueRevisitItem[] = [];

  for (const entry of logs) {
    if (!entry.revisit) continue;
    const daysSince = diffDaysLocal(entry.date, todayStr);
    const reviewed = entry.reviewedMilestones || [];

    if (daysSince >= 7 && !reviewed.includes(7)) {
      due.push({ entry, milestone: 7, daysSince });
    } else if (daysSince >= 3 && daysSince < 7 && !reviewed.includes(3)) {
      due.push({ entry, milestone: 3, daysSince });
    }
  }

  return due.sort((a, b) => b.daysSince - a.daysSince);
}

export function reconcileSprintCycle(
  sprintState: SprintState,
  todayStr: string
): { state: SprintState; changed: boolean } {
  let current = { ...sprintState.currentSprint };
  const history = [...sprintState.history];
  let changed = false;
  let safety = 0;

  while (todayStr > current.endDate && safety < 200) {
    changed = true;
    const finalizedStatus: 'Completed' | 'Not finished' =
      current.status === 'Completed' ? 'Completed' : 'Not finished';

    history.unshift({
      ...current,
      status: finalizedStatus,
    });

    const nextNumber = current.number + 1;
    const nextStart = addDaysLocal(current.endDate, 1);
    const nextEnd = addDaysLocal(nextStart, 13);

    current = {
      id: `sprint-${nextNumber}-${nextStart}`,
      number: nextNumber,
      title: `Python Sprint #${nextNumber}`,
      notes: '',
      startDate: nextStart,
      endDate: nextEnd,
      status: 'active',
    };
    safety += 1;
  }

  if (!changed) {
    return { state: sprintState, changed: false };
  }

  return {
    state: {
      currentSprint: current,
      history,
    },
    changed: true,
  };
}

export function getSprintProgress(sprint: PythonSprint, todayStr: string) {
  const rawDay = diffDaysLocal(sprint.startDate, todayStr) + 1;
  const dayNumber = Math.max(1, Math.min(14, rawDay));
  const daysRemaining = Math.max(0, diffDaysLocal(todayStr, sprint.endDate));
  return {
    dayNumber,
    totalDays: 14,
    daysRemaining,
    percent: Math.round((dayNumber / 14) * 100),
  };
}

export interface FollowUpNudge {
  internship: InternshipEntry;
  daysSinceApplied: number;
}

export function getInternshipFollowUps(
  internships: InternshipEntry[],
  dismissedIds: string[],
  todayStr: string
): FollowUpNudge[] {
  const dismissedSet = new Set(dismissedIds);
  return internships
    .filter((item) => item.status === 'Applied' && !dismissedSet.has(item.id))
    .map((item) => ({
      internship: item,
      daysSinceApplied: diffDaysLocal(item.dateApplied, todayStr),
    }))
    .filter((x) => x.daysSinceApplied >= 14)
    .sort((a, b) => b.daysSinceApplied - a.daysSinceApplied);
}

export interface UpcomingDeadline {
  internship: InternshipEntry;
  daysRemaining: number;
}

export function getUpcomingDeadlines(
  internships: InternshipEntry[],
  todayStr: string
): UpcomingDeadline[] {
  return internships
    .filter(
      (item) =>
        item.deadline &&
        item.status !== 'Declined' &&
        item.status !== 'Offer'
    )
    .map((item) => ({
      internship: item,
      daysRemaining: diffDaysLocal(todayStr, item.deadline),
    }))
    .filter((x) => x.daysRemaining >= 0 && x.daysRemaining <= 7)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export interface TopicCoverageItem {
  topic: string;
  count: number;
  isLeastLogged: boolean;
}

export function calculateTopicCoverage(logs: LeetCodeEntry[]): TopicCoverageItem[] {
  const counts: Record<string, number> = {};
  for (const topic of LEETCODE_TOPICS) {
    if (topic !== 'Other') {
      counts[topic] = 0;
    }
  }

  for (const entry of logs) {
    const t = entry.topic || 'Other';
    counts[t] = (counts[t] || 0) + 1;
  }

  const entries = Object.entries(counts).map(([topic, count]) => ({
    topic,
    count,
  }));

  const minCount = entries.length > 0 ? Math.min(...entries.map((e) => e.count)) : 0;

  return entries
    .map((item) => ({
      ...item,
      isLeastLogged: logs.length > 0 && item.count === minCount,
    }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
}
