import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarCheck,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { RecruiterContact } from '../types';
import { diffDaysLocal, formatDisplayDate } from '../utils/dates';

interface ContactsSectionProps {
  todayStr: string;
  contacts: RecruiterContact[];
  onAddContact: (contact: Omit<RecruiterContact, 'id'>) => void;
  onUpdateContact: (contact: RecruiterContact) => void;
  onDeleteContact: (id: string) => void;
}

export const ContactsSection: React.FC<ContactsSectionProps> = ({
  todayStr,
  contacts,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [connectedVia, setConnectedVia] = useState('');
  const [lastContactDate, setLastContactDate] = useState(todayStr);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCompany('');
    setConnectedVia('');
    setLastContactDate(todayStr);
    setNotes('');
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !company.trim()) {
      setFormError('Please enter both a contact name and company.');
      return;
    }

    const payload = {
      name: name.trim(),
      company: company.trim(),
      connectedVia: connectedVia.trim() || 'Direct outreach',
      lastContactDate: lastContactDate || todayStr,
      notes: notes.trim(),
    };

    if (editingId) {
      onUpdateContact({ id: editingId, ...payload });
    } else {
      onAddContact(payload);
    }
    resetForm();
  };

  const handleStartEdit = (contact: RecruiterContact) => {
    setEditingId(contact.id);
    setName(contact.name);
    setCompany(contact.company);
    setConnectedVia(contact.connectedVia);
    setLastContactDate(contact.lastContactDate);
    setNotes(contact.notes);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...contacts]
      .filter((c) => {
        if (!q) return true;
        return `${c.name} ${c.company} ${c.connectedVia} ${c.notes}`
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => a.lastContactDate.localeCompare(b.lastContactDate));
  }, [contacts, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Add / Edit Contact Form */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            {editingId ? 'Edit Recruiter Contact' : 'Add Recruiter Contact'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track recruiters and alumni referrals. Contacts over 14 days without touchpoint are highlighted.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Lin"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Company *
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Datadog"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Where We Connected
              </label>
              <input
                type="text"
                value={connectedVia}
                onChange={(e) => setConnectedVia(e.target.value)}
                placeholder="Career fair, LinkedIn, Info session..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Last Contact Date
              </label>
              <input
                type="date"
                value={lastContactDate}
                max={todayStr}
                onChange={(e) => setLastContactDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Conversation details, email address, follow-up topics..."
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
              <span>{editingId ? 'Save Changes' : 'Add Contact'}</span>
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

      {/* Recruiter Contacts List */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Recruiter contacts
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              {contacts.length} contact{contacts.length === 1 ? '' : 's'} saved
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, company, or notes..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 w-56 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>
        </div>

        {filteredContacts.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-slate-200 rounded-lg">
            <p className="text-sm font-medium text-slate-700">
              {contacts.length === 0
                ? 'No recruiter contacts added yet'
                : 'No contacts match your search'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Keep track of campus recruiters, hiring managers, and referral contacts here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredContacts.map((contact) => {
              const daysAgo = diffDaysLocal(contact.lastContactDate, todayStr);
              const isOverdue = daysAgo >= 14;

              return (
                <article
                  key={contact.id}
                  className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-base font-semibold text-slate-900 truncate">
                          {contact.name}
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {contact.company} · {contact.connectedVia}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(contact)}
                          aria-label={`Edit ${contact.name}`}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteContact(contact.id)}
                          aria-label={`Delete ${contact.name}`}
                          className="p-1.5 text-slate-500 hover:text-red-700 rounded-md hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Last Contacted Indicator (Warning after 14 days) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border tabular-nums ${
                          isOverdue
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {isOverdue && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span>
                          Last contacted: {formatDisplayDate(contact.lastContactDate)} (
                          {daysAgo === 0
                            ? 'today'
                            : daysAgo === 1
                              ? '1 day ago'
                              : `${daysAgo} days ago`}
                          ){isOverdue ? ' · Reach out' : ''}
                        </span>
                      </div>

                      {daysAgo > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateContact({
                              ...contact,
                              lastContactDate: todayStr,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
                        >
                          <CalendarCheck className="w-3.5 h-3.5" />
                          <span>Contacted Today</span>
                        </button>
                      )}
                    </div>

                    {contact.notes && (
                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                        {contact.notes}
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
