const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKDAY_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayLocal(): string {
  return toLocalDateString(new Date());
}

export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function isValidLocalDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = parseLocalDate(value);
  return toLocalDateString(parsed) === value;
}

export function addDaysLocal(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
}

export function diffDaysLocal(fromStr: string, toStr: string): number {
  const from = parseLocalDate(fromStr);
  const to = parseLocalDate(toStr);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / msPerDay);
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function getDayOfWeekName(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return WEEKDAY_LONG[d.getDay()];
}

export function getDayOfWeekShort(dayIndex: number): string {
  return WEEKDAY_SHORT[dayIndex] ?? '';
}

export function getDayOfWeekIndex(dateStr: string): number {
  return parseLocalDate(dateStr).getDay();
}

/**
 * Returns an array of 12 week columns (Sunday..Saturday), ending on the week containing todayStr.
 * Dates after todayStr in the final week are marked `isFuture: true`.
 */
export function getLast12WeeksGrid(todayStr: string): Array<{
  weekIndex: number;
  days: Array<{ date: string; isFuture: boolean; isBeforeWindow: boolean }>;
}> {
  const today = parseLocalDate(todayStr);
  const todayDayOfWeek = today.getDay(); // 0 = Sun .. 6 = Sat
  // End of current week (Saturday)
  const weekEnd = addDaysLocal(todayStr, 6 - todayDayOfWeek);
  // Start 12 weeks back (84 days total including weekEnd)
  const gridStart = addDaysLocal(weekEnd, -83);
  const windowStart = addDaysLocal(todayStr, -83);

  const weeks: Array<{
    weekIndex: number;
    days: Array<{ date: string; isFuture: boolean; isBeforeWindow: boolean }>;
  }> = [];

  for (let w = 0; w < 12; w++) {
    const days: Array<{ date: string; isFuture: boolean; isBeforeWindow: boolean }> = [];
    for (let d = 0; d < 7; d++) {
      const date = addDaysLocal(gridStart, w * 7 + d);
      days.push({
        date,
        isFuture: date > todayStr,
        isBeforeWindow: date < windowStart,
      });
    }
    weeks.push({ weekIndex: w, days });
  }

  return weeks;
}

export function getStartOfWeekSunday(dateStr: string): string {
  const dow = getDayOfWeekIndex(dateStr);
  return addDaysLocal(dateStr, -dow);
}
