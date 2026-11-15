import { describe, expect, it } from 'vitest';
import { LeetCodeEntry } from '../types';
import { calculateStreakStats } from './calculations';

function makeLog(date: string, idSuffix = '1', title = 'Two Sum'): LeetCodeEntry {
  return {
    id: `lc-${date}-${idSuffix}`,
    date,
    title,
    problemRef: '1',
    difficulty: 'Easy',
    topic: 'Arrays & Hashing',
    minutesTaken: 15,
    revisit: false,
    reviewedMilestones: [],
    notes: '',
  };
}

describe('calculateStreakStats', () => {
  it('increases the current streak when logging consecutive days including today', () => {
    const firstUse = '2026-11-10';
    const today = '2026-11-12';

    const beforeTodayLogs = [makeLog('2026-11-10'), makeLog('2026-11-11')];
    const statsBefore = calculateStreakStats(beforeTodayLogs, firstUse, today, 1);

    expect(statsBefore.currentStreak).toBe(2);
    expect(statsBefore.isTodayCompleted).toBe(false);
    expect(statsBefore.isStreakAtRisk).toBe(true);

    const afterTodayLogs = [...beforeTodayLogs, makeLog('2026-11-12')];
    const statsAfter = calculateStreakStats(afterTodayLogs, firstUse, today, 1);

    expect(statsAfter.currentStreak).toBe(3);
    expect(statsAfter.longestStreak).toBe(3);
    expect(statsAfter.isTodayCompleted).toBe(true);
    expect(statsAfter.isStreakAtRisk).toBe(false);
    expect(statsAfter.totalMissedDays).toBe(0);
  });

  it('resets the current streak and increments missed-day tally after a full missed day ends', () => {
    const firstUse = '2026-11-10';
    const logs = [makeLog('2026-11-10')];

    // On Nov 11 before day ends: Nov 11 is NOT missed yet, streak from Nov 10 is still 1
    const statsOnNov11 = calculateStreakStats(logs, firstUse, '2026-11-11', 1);
    expect(statsOnNov11.currentStreak).toBe(1);
    expect(statsOnNov11.totalMissedDays).toBe(0);
    expect(statsOnNov11.currentMissedStreak).toBe(0);

    // On Nov 12 after Nov 11 ended with 0 logs: streak resets to 0 and Nov 11 is missed
    const statsOnNov12 = calculateStreakStats(logs, firstUse, '2026-11-12', 1);
    expect(statsOnNov12.currentStreak).toBe(0);
    expect(statsOnNov12.longestStreak).toBe(1);
    expect(statsOnNov12.totalMissedDays).toBe(1);
    expect(statsOnNov12.currentMissedStreak).toBe(1);
  });

  it('recalculates current streak, longest streak, and missed tally when backfilling or editing past days', () => {
    const firstUse = '2026-11-01';
    const today = '2026-11-06';

    // Initial logs: Nov 1, Nov 2, (gap Nov 3), Nov 4, Nov 5
    const initialLogs = [
      makeLog('2026-11-01'),
      makeLog('2026-11-02'),
      makeLog('2026-11-04'),
      makeLog('2026-11-05'),
    ];
    const initialStats = calculateStreakStats(initialLogs, firstUse, today, 1);
    expect(initialStats.currentStreak).toBe(2);
    expect(initialStats.longestStreak).toBe(2);
    expect(initialStats.totalMissedDays).toBe(1);

    // Backfill Nov 3 -> bridges Nov 1..Nov 5 into a 5-day streak with 0 missed days
    const backfilledLogs = [...initialLogs, makeLog('2026-11-03')];
    const backfilledStats = calculateStreakStats(backfilledLogs, firstUse, today, 1);
    expect(backfilledStats.currentStreak).toBe(5);
    expect(backfilledStats.longestStreak).toBe(5);
    expect(backfilledStats.totalMissedDays).toBe(0);

    // Edit/delete Nov 5 -> breaks current streak (Nov 5 became missed), longest remains 4 (Nov 1..4)
    const editedLogs = backfilledLogs.filter((l) => l.date !== '2026-11-05');
    const editedStats = calculateStreakStats(editedLogs, firstUse, today, 1);
    expect(editedStats.currentStreak).toBe(0);
    expect(editedStats.longestStreak).toBe(4);
    expect(editedStats.totalMissedDays).toBe(1);
    expect(editedStats.currentMissedStreak).toBe(1);
  });

  it('never counts days before firstUseDate as missed', () => {
    const firstUse = '2026-11-12';
    const today = '2026-11-14';
    // User missed Nov 12 and Nov 13, but had no logs before Nov 12 either
    const stats = calculateStreakStats([], firstUse, today, 1);

    expect(stats.totalMissedDays).toBe(2); // Only Nov 12 and Nov 13 (not Nov 1..11, not Nov 14)
    expect(stats.currentMissedStreak).toBe(2);

    // On firstUseDate itself, 0 days can be missed
    const dayOneStats = calculateStreakStats([], '2026-11-14', '2026-11-14', 1);
    expect(dayOneStats.totalMissedDays).toBe(0);
    expect(dayOneStats.currentMissedStreak).toBe(0);
  });

  it('never counts today as missed before it ends', () => {
    const firstUse = '2026-11-10';
    const today = '2026-11-14';
    const logs = [
      makeLog('2026-11-10'),
      makeLog('2026-11-11'),
      makeLog('2026-11-12'),
      makeLog('2026-11-13'),
    ];

    const stats = calculateStreakStats(logs, firstUse, today, 1);

    expect(stats.todayCount).toBe(0);
    expect(stats.isTodayCompleted).toBe(false);
    expect(stats.isStreakAtRisk).toBe(true);
    expect(stats.totalMissedDays).toBe(0);
    expect(stats.currentMissedStreak).toBe(0);
    expect(stats.currentStreak).toBe(4);
  });
});
