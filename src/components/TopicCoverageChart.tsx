import React from 'react';
import { TopicCoverageItem } from '../utils/calculations';

interface TopicCoverageChartProps {
  items: TopicCoverageItem[];
  onSelectTopic?: (topic: string) => void;
}

export const TopicCoverageChart: React.FC<TopicCoverageChartProps> = ({
  items,
  onSelectTopic,
}) => {
  const maxCount = Math.max(1, ...items.map((i) => i.count));
  const totalLogs = items.reduce((sum, i) => sum + i.count, 0);
  const leastCount = items.filter((i) => i.isLeastLogged).length;

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Topic Coverage
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalLogs === 0
              ? 'Log LeetCode problems to track coverage across patterns.'
              : `${leastCount} topic${leastCount === 1 ? '' : 's'} highlighted as least logged so far`}
          </p>
        </div>

        {totalLogs > 0 && (
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" />
              <span>Practiced</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
              <span>Least logged</span>
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const widthPct =
            totalLogs === 0
              ? 0
              : item.count === 0
                ? 4
                : Math.max(8, Math.round((item.count / maxCount) * 100));

          return (
            <button
              key={item.topic}
              type="button"
              onClick={() => onSelectTopic && onSelectTopic(item.topic)}
              className="w-full text-left group grid grid-cols-[150px_1fr_auto] sm:grid-cols-[175px_1fr_auto] items-center gap-3 py-1 rounded hover:bg-slate-50 px-1.5 -mx-1.5 transition-colors cursor-pointer"
            >
              <span
                className={`text-xs truncate ${
                  item.isLeastLogged
                    ? 'font-semibold text-amber-800'
                    : 'font-medium text-slate-700'
                }`}
                title={item.topic}
              >
                {item.topic}
              </span>

              <div className="h-2.5 w-full bg-slate-100 rounded-sm overflow-hidden">
                <div
                  className={`h-full rounded-sm transition-all ${
                    item.isLeastLogged
                      ? 'bg-amber-400'
                      : item.count > 0
                        ? 'bg-blue-600'
                        : 'bg-slate-200'
                  }`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>

              <div className="flex items-center gap-2 text-xs tabular-nums font-mono justify-end min-w-[92px]">
                {item.isLeastLogged && (
                  <span className="font-sans text-[11px] font-medium text-amber-700">
                    Least logged
                  </span>
                )}
                <span className="text-slate-700 font-medium">{item.count}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
