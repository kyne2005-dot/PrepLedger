import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Database,
  Download,
  Trash2,
  Upload,
} from 'lucide-react';
import { AppState, UserSettings } from '../types';
import { formatDisplayDate, getDayOfWeekShort } from '../utils/dates';
import { hasRealUserData } from '../utils/storage';

interface SettingsSectionProps {
  todayStr: string;
  state: AppState;
  onUpdateSettings: (next: UserSettings) => void;
  onUpdateFirstUseDate: (nextDate: string) => void;
  onExportJson: () => void;
  onImportJson: (rawText: string) => { ok: boolean; message: string };
  onLoadSampleData: () => void;
  onClearSampleData: () => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  todayStr,
  state,
  onUpdateSettings,
  onUpdateFirstUseDate,
  onExportJson,
  onImportJson,
  onLoadSampleData,
  onClearSampleData,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importFeedback, setImportFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [confirmModal, setConfirmModal] = useState<
    null | 'overwrite_with_sample' | 'clear_all_real'
  >(null);

  const { settings } = state;
  const realDataExists = hasRealUserData(state);

  const toggleGymDay = (dayIdx: number) => {
    const exists = settings.gymScheduledDays.includes(dayIdx);
    const nextDays = exists
      ? settings.gymScheduledDays.filter((d) => d !== dayIdx)
      : [...settings.gymScheduledDays, dayIdx].sort((a, b) => a - b);
    onUpdateSettings({ ...settings, gymScheduledDays: nextDays });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const result = onImportJson(text);
      setImportFeedback({
        type: result.ok ? 'success' : 'error',
        text: result.message,
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRequestLoadSample = () => {
    if (realDataExists) {
      setConfirmModal('overwrite_with_sample');
    } else {
      onLoadSampleData();
      setImportFeedback({
        type: 'success',
        text: 'Sample data loaded. Explore the dashboard, banner alerts, and logs.',
      });
    }
  };

  const handleRequestClearSample = () => {
    if (realDataExists) {
      setConfirmModal('clear_all_real');
    } else {
      onClearSampleData();
      setImportFeedback({
        type: 'success',
        text: 'Sample data cleared. Workspace reset to a clean slate.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Daily Goal & Gym Preferences */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Goal & Checklist Preferences
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            All preferences and logs stay in your browser&apos;s localStorage with zero login required.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Minimum Problems for Completed Day
            </label>
            <select
              value={settings.dailyMinProblems}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  dailyMinProblems: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
            >
              <option value={1}>1 problem (Default)</option>
              <option value={2}>2 problems</option>
              <option value={3}>3 problems</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Daily Checklist Target
            </label>
            <select
              value={settings.dailyTargetProblems}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  dailyTargetProblems: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
            >
              <option value={1}>1 problem / day</option>
              <option value={2}>2 problems / day</option>
              <option value={3}>3 problems / day</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              First-Use Date (Missed-Day Start)
            </label>
            <input
              type="date"
              value={state.firstUseDate}
              max={todayStr}
              onChange={(e) => {
                if (e.target.value) onUpdateFirstUseDate(e.target.value);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 font-mono"
            />
          </div>
        </div>

        {/* Optional Gym/Running Configuration */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <label className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.includeGymSection}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  includeGymSection: e.target.checked,
                })
              }
              className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
            />
            <span>Include optional Gym & Running section on daily checklist</span>
          </label>

          {settings.includeGymSection && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Weekly Gym / Running Target
                </label>
                <select
                  value={settings.weeklyGymTarget}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      weeklyGymTarget: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <option key={n} value={n}>
                      {n} session{n === 1 ? '' : 's'} per week
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Scheduled Days
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                    const active = settings.gymScheduledDays.includes(dayIdx);
                    return (
                      <button
                        key={dayIdx}
                        type="button"
                        onClick={() => toggleGymDay(dayIdx)}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-md border cursor-pointer ${
                          active
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {getDayOfWeekShort(dayIdx)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* JSON Export / Import Backup */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Backup & Restore (JSON)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Export includes LeetCode logs, internships, Python sprints, gym logs, recruiter contacts, and behavioral stories.{' '}
            {state.lastExportDate
              ? `Last exported on ${formatDisplayDate(state.lastExportDate)}.`
              : 'No export recorded yet.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON Backup</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Import JSON Backup</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {importFeedback && (
          <p
            className={`text-xs font-medium px-3 py-2 rounded-lg border ${
              importFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {importFeedback.text}
          </p>
        )}
      </section>

      {/* Demo Mode */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Demo Mode
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Preview the full dashboard with realistic sample LeetCode logs, internships, sprints, recruiter contacts, and stories. Loading sample data will never overwrite your real data without confirmation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRequestLoadSample}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>Load sample data</span>
          </button>

          <button
            type="button"
            onClick={handleRequestClearSample}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear sample data</span>
          </button>
        </div>
      </section>

      {/* Confirmation Modal (Never overwrites real data silently) */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-5 space-y-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h4
                  id="confirm-modal-title"
                  className="text-base font-semibold text-slate-900"
                >
                  {confirmModal === 'overwrite_with_sample'
                    ? 'Replace existing data with sample data?'
                    : 'Clear all saved data?'}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {confirmModal === 'overwrite_with_sample'
                    ? 'You currently have real saved entries in localStorage. Loading sample data will replace your current workspace. You can export a JSON backup first to keep your data safe.'
                    : 'You currently have real saved entries rather than sample data. Clearing will reset the workspace to empty.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onExportJson();
                  if (confirmModal === 'overwrite_with_sample') {
                    onLoadSampleData();
                  } else {
                    onClearSampleData();
                  }
                  setConfirmModal(null);
                }}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 cursor-pointer"
              >
                Export Backup &amp; Continue
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal === 'overwrite_with_sample') {
                    onLoadSampleData();
                  } else {
                    onClearSampleData();
                  }
                  setConfirmModal(null);
                }}
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                {confirmModal === 'overwrite_with_sample'
                  ? 'Overwrite with Sample'
                  : 'Clear Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
