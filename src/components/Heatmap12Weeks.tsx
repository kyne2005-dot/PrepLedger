import React, { useState } from 'react';
import { LeetCodeEntry } from '../types';
import { formatDisplayDate, getLast12WeeksGrid } from '../utils/dates';

interface Heatmap12WeeksProps {
  todayStr: string;
  logs: LeetCodeEntry[];
  countsByDate: Record<string, number>;
}

export const Heatmap12Weeks: React.FC<Heatmap12WeeksProps> = ({
  todayStr,
  logs,
  countsByDate,
}) => {
  const weeks = getLast12WeeksGrid(todayStr);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const selectedLogs = logs.filter((l) => l.date === selectedDate);
  const totalInWindow = weeks.reduce(
    (sum, week) =>
      sum +
      week.days.reduce(
        (wSum, d) =>
          !d.isFuture && !d.isBeforeWindow
            ? wSum + (countsByDate[d.date] || 0)
            : wSum,
        0
      ),
    0
  );

  const activeDaysInWindow = weeks.reduce(
    (sum, week) =>
      sum +
      week.days.reduce(
        (wSum, d) =>
          !d.isFuture && !d.isBeforeWindow && (countsByDate[d.date] || 0) >= 1
            ? wSum + 1
            : wSum,
        0
      ),
    0
  );

  const getCellStyle = (count: number, isFuture: boolean, isBeforeWindow: boolean) => {
    if (isFuture || isBeforeWindow) {
      return 'bg-transparent border-transparent cursor-default';
    }
    if (count === 0) return 'bg-slate-100 border-slate-200/80 hover:border-slate-400';
    if (count === 1) return 'bg-blue-200 border-blue-300 hover:border-blue-500';
    if (count === 2) return 'bg-blue-500 border-blue-600 hover:border-blue-700';
    return 'bg-blue-700 border-blue-800 hover:border-slate-900';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            12-Week Consistency Heatmap
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {activeDaysInWindow} active days · {totalInWindow} problems solved over the last 12 weeks
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>0</span>
          <span className="w-3.5 h-3.5 rounded-sm bg-slate-100 border border-slate-200 inline-block" />
          <span className="w-3.5 h-3.5 rounded-sm bg-blue-200 border border-blue-300 inline-block" />
          <span className="w-3.5 h-3.5 rounded-sm bg-blue-500 border border-blue-600 inline-block" />
          <span className="w-3.5 h-3.5 rounded-sm bg-blue-700 border border-blue-800 inline-block" />
          <span>3+</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-1.5 min-w-full sm:min-w-0">
          {/* Day of week axis */}
          <div className="grid grid-rows-7 gap-1.5 pr-2 text-[11px] font-mono text-slate-400 select-none">
            {dayLabels.map((label, idx) => (
              <div key={label} className="h-5 flex items-center">
                {idx % 2 === 1 ? label : ''}
              </div>
            ))}
          </div>

          {/* 12 Week Columns */}
          <div className="grid grid-cols-12 gap-1.5 flex-1">
            {weeks.map((week) => (
              <div key={week.weekIndex} className="grid grid-rows-7 gap-1.5">
                {week.days.map((day) => {
                  const count = countsByDate[day.date] || 0;
                  const isSelected = selectedDate === day.date;
                  const isToday = day.date === todayStr;
                  const disabled = day.isFuture || day.isBeforeWindow;

                  return (
                    <button
                      key={day.date}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedDate(day.date)}
                      title={
                        disabled
                          ? ''
                          : `${formatDisplayDate(day.date)}: ${count} problem${count === 1 ? '' : 's'}`
                      }
                      aria-label={
                        disabled
                          ? undefined
                          : `${formatDisplayDate(day.date)}: ${count} problem${count === 1 ? '' : 's'}`
                      }
                      className={`h-5 w-5 sm:w-full min-w-[20px] rounded-[4px] border transition-colors ${getCellStyle(
                        count,
                        day.isFuture,
                        day.isBeforeWindow
                      )} ${
                        isSelected && !disabled
                          ? 'ring-2 ring-slate-900 ring-offset-1'
                          : isToday
                            ? 'ring-1 ring-blue-700 ring-offset-1'
                            : ''
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Day Inspection Strip */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
        <div className="font-medium text-slate-700">
          {formatDisplayDate(selectedDate)}
          {selectedDate === todayStr && (
            <span className="text-blue-700 ml-1.5">· Today</span>
          )}
        </div>
        <div className="text-slate-600">
          {selectedLogs.length === 0 ? (
            <span>No problems logged on this day.</span>
          ) : (
            <span>
              {selectedLogs.length} solved:{' '}
              {selectedLogs.map((l) => l.title).join(', ')}
            </span>
          )}
        </div>
      </div>
    </section>
  );
};
