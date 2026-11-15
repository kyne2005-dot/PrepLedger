import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  INTERNSHIP_STATUSES,
  InternshipEntry,
  InternshipStatus,
} from '../types';
import { diffDaysLocal, formatDisplayDate } from '../utils/dates';

interface InternshipsSectionProps {
  todayStr: string;
  internships: InternshipEntry[];
  onAddInternship: (entry: Omit<InternshipEntry, 'id'>) => void;
  onUpdateInternship: (entry: InternshipEntry) => void;
  onDeleteInternship: (id: string) => void;
}

export const InternshipsSection: React.FC<InternshipsSectionProps> = ({
  todayStr,
  internships,
  onAddInternship,
  onUpdateInternship,
  onDeleteInternship,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<InternshipStatus>('Applied');
  const [dateApplied, setDateApplied] = useState(todayStr);
  const [deadline, setDeadline] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const [statusFilter, setStatusFilter] = useState<'All' | InternshipStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setCompany('');
    setRole('');
    setStatus('Applied');
    setDateApplied(todayStr);
    setDeadline('');
    setNextStep('');
    setLink('');
    setNotes('');
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) {
      setFormError('Please enter a company name.');
      return;
    }

    const payload = {
      company: company.trim(),
      role: role.trim() || 'Software / PM Intern',
      status,
      dateApplied: dateApplied || todayStr,
      deadline: deadline || '',
      nextStep: nextStep.trim(),
      link: link.trim(),
      notes: notes.trim(),
    };

    if (editingId) {
      onUpdateInternship({ id: editingId, ...payload });
    } else {
      onAddInternship(payload);
    }
    resetForm();
  };

  const handleStartEdit = (item: InternshipEntry) => {
    setEditingId(item.id);
    setCompany(item.company);
    setRole(item.role);
    setStatus(item.status);
    setDateApplied(item.dateApplied);
    setDeadline(item.deadline);
    setNextStep(item.nextStep);
    setLink(item.link);
    setNotes(item.notes);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusClick = (item: InternshipEntry, nextStatus: InternshipStatus) => {
    if (item.status === nextStatus) return;
    onUpdateInternship({ ...item, status: nextStatus });
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...internships]
      .filter((item) => {
        if (statusFilter !== 'All' && item.status !== statusFilter) return false;
        if (q) {
          const hay = `${item.company} ${item.role} ${item.nextStep} ${item.notes}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.dateApplied.localeCompare(a.dateApplied));
  }, [internships, statusFilter, searchQuery]);

  const countsByStatus = useMemo(() => {
    const map: Record<string, number> = {
      All: internships.length,
      Applied: 0,
      'In Progress': 0,
      Offer: 0,
      Declined: 0,
    };
    for (const item of internships) {
      map[item.status] = (map[item.status] || 0) + 1;
    }
    return map;
  }, [internships]);

  const getStatusPillClass = (pill: InternshipStatus, active: boolean) => {
    if (!active) {
      return 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900';
    }
    if (pill === 'Applied') return 'bg-slate-900 text-white border-slate-900';
    if (pill === 'In Progress') return 'bg-blue-700 text-white border-blue-700';
    if (pill === 'Offer') return 'bg-emerald-700 text-white border-emerald-700';
    return 'bg-red-700 text-white border-red-700';
  };

  return (
    <div className="space-y-6">
      {/* Add / Edit Internship Form */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            {editingId ? 'Edit Internship Application' : 'Add Internship Application'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track status, optional deadline countdowns, next steps, and reflection notes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Company *
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Booz Allen"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Technical PM Intern"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Date Applied
              </label>
              <input
                type="date"
                value={dateApplied}
                onChange={(e) => setDateApplied(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Deadline (Optional)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InternshipStatus)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                {INTERNSHIP_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === 'In Progress' ? 'In Progress (interview/assessment)' : s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Next Step (Optional)
              </label>
              <input
                type="text"
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                placeholder="e.g. Complete HackerRank by Thu"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Posting Link
              </label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Notes (Word Bank)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Referral details, recruiter screen takeaways, interview prep notes..."
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
              <span>{editingId ? 'Save Changes' : 'Add Internship'}</span>
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

      {/* Internships Applied For List */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Internships Applied For
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              {internships.length} tracked applications · Click a status pill on any card to update progress
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company or role..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 w-48 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
              {(['All', ...INTERNSHIP_STATUSES] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                    statusFilter === tab
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab} ({countsByStatus[tab] || 0})
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-slate-200 rounded-lg">
            <p className="text-sm font-medium text-slate-700">
              {internships.length === 0
                ? 'No internships added yet'
                : 'No applications match this filter'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Add an internship above to track applications, follow-up nudges, and deadlines.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((item) => {
              const daysAppliedAgo = diffDaysLocal(item.dateApplied, todayStr);
              const daysToDeadline = item.deadline
                ? diffDaysLocal(todayStr, item.deadline)
                : null;
              const isDeadlineSoon =
                daysToDeadline !== null &&
                daysToDeadline >= 0 &&
                daysToDeadline <= 7 &&
                item.status !== 'Declined' &&
                item.status !== 'Offer';

              return (
                <article
                  key={item.id}
                  className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-semibold text-slate-900 truncate">
                            {item.company}
                          </h4>
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Open posting for ${item.company}`}
                              className="text-blue-700 hover:text-blue-900 shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{item.role}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          aria-label={`Edit ${item.company}`}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteInternship(item.id)}
                          aria-label={`Delete ${item.company}`}
                          className="p-1.5 text-slate-500 hover:text-red-700 rounded-md hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Unboxed Metadata Line */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                      <span>Applied {formatDisplayDate(item.dateApplied)}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {daysAppliedAgo === 0
                          ? 'Today'
                          : `${daysAppliedAgo}d ago`}
                      </span>
                      {item.deadline && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              isDeadlineSoon
                                ? 'text-amber-700 font-semibold'
                                : 'text-slate-500'
                            }
                          >
                            Deadline {formatDisplayDate(item.deadline)}
                            {isDeadlineSoon &&
                              (daysToDeadline === 0
                                ? ' (today)'
                                : ` (${daysToDeadline}d left)`)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Clickable Status Pills */}
                    <div
                      className="flex flex-wrap items-center gap-1.5 pt-0.5"
                      role="group"
                      aria-label={`Status for ${item.company}`}
                    >
                      {INTERNSHIP_STATUSES.map((pill) => {
                        const active = item.status === pill;
                        return (
                          <button
                            key={pill}
                            type="button"
                            onClick={() => handleStatusClick(item, pill)}
                            title={
                              pill === 'In Progress'
                                ? 'In Progress (interview or assessment)'
                                : pill
                            }
                            className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${getStatusPillClass(
                              pill,
                              active
                            )}`}
                          >
                            {pill}
                          </button>
                        );
                      })}
                    </div>

                    {/* Optional Next Step */}
                    {item.nextStep && (
                      <div className="flex items-start gap-2 text-xs bg-blue-50/70 border border-blue-200/80 text-blue-950 rounded-lg px-3 py-2">
                        <ArrowRight className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold">Next step: </span>
                          <span>{item.nextStep}</span>
                        </div>
                      </div>
                    )}

                    {/* Free-text Notes */}
                    {item.notes && (
                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
