import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { BehavioralStory, STORY_PRESET_LABELS } from '../types';
import { formatDisplayDate } from '../utils/dates';

interface StoriesSectionProps {
  todayStr: string;
  stories: BehavioralStory[];
  onAddStory: (story: Omit<BehavioralStory, 'id'>) => void;
  onUpdateStory: (story: BehavioralStory) => void;
  onDeleteStory: (id: string) => void;
}

export const StoriesSection: React.FC<StoriesSectionProps> = ({
  todayStr,
  stories,
  onAddStory,
  onUpdateStory,
  onDeleteStory,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [customLabel, setCustomLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const [labelFilter, setLabelFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const availableLabels = useMemo(() => {
    const set = new Set<string>(STORY_PRESET_LABELS);
    for (const s of stories) {
      for (const l of s.labels) set.add(l);
    }
    return Array.from(set);
  }, [stories]);

  const toggleLabel = (label: string) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleAddCustomLabel = () => {
    const trimmed = customLabel.trim();
    if (!trimmed) return;
    if (!selectedLabels.includes(trimmed)) {
      setSelectedLabels((prev) => [...prev, trimmed]);
    }
    setCustomLabel('');
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSelectedLabels([]);
    setCustomLabel('');
    setNotes('');
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter a story title.');
      return;
    }

    const payload = {
      title: title.trim(),
      labels: selectedLabels,
      notes: notes.trim(),
      updatedAt: todayStr,
    };

    if (editingId) {
      onUpdateStory({ id: editingId, ...payload });
    } else {
      onAddStory(payload);
    }
    resetForm();
  };

  const handleStartEdit = (story: BehavioralStory) => {
    setEditingId(story.id);
    setTitle(story.title);
    setSelectedLabels(story.labels);
    setNotes(story.notes);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredStories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...stories]
      .filter((s) => {
        if (labelFilter !== 'All' && !s.labels.includes(labelFilter)) {
          return false;
        }
        if (q) {
          const hay = `${s.title} ${s.labels.join(' ')} ${s.notes}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [stories, labelFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Add / Edit Story Form */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            {editingId ? 'Edit Behavioral Story' : 'Add Behavioral Story'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Keep STAR-format interview stories organized with optional competency labels.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Story Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cut Capstone API Latency by 42% Before Demo Day"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700">
              Optional Labels
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {availableLabels.map((label) => {
                const active = selectedLabels.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleLabel(label)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
              <div className="inline-flex items-center gap-1 ml-1">
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomLabel();
                    }
                  }}
                  placeholder="Custom label..."
                  className="px-2.5 py-1 text-xs rounded-md border border-slate-200 w-28 focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={handleAddCustomLabel}
                  className="px-2 py-1 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Story Notes (STAR: Situation, Task, Action, Result)
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write out the situation, your specific actions, trade-offs, and quantifiable result..."
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
              <span>{editingId ? 'Save Changes' : 'Save Story'}</span>
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

      {/* Story Bank List */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Behavioral stories
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              {stories.length} titled stor{stories.length === 1 ? 'y' : 'ies'} in your bank
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stories..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 w-48 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <select
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value)}
              aria-label="Filter stories by label"
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="All">All Labels</option>
              {availableLabels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredStories.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-slate-200 rounded-lg">
            <p className="text-sm font-medium text-slate-700">
              {stories.length === 0
                ? 'No behavioral stories saved yet'
                : 'No stories match your current filter'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Add stories above for Leadership, Problem solving, Teamwork, and more.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
            {filteredStories.map((story) => (
              <article key={story.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {story.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono tabular-nums">
                        Updated {formatDisplayDate(story.updatedAt)}
                      </span>
                      {story.labels.length > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-blue-700 font-medium">
                            {story.labels.join(' · ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(story)}
                      aria-label={`Edit ${story.title}`}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteStory(story.id)}
                      aria-label={`Delete ${story.title}`}
                      className="p-1.5 text-slate-500 hover:text-red-700 rounded-md hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {story.notes && (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                    {story.notes}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
