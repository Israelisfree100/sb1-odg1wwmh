import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Announcement, AnnouncementAudience, User } from '../types';
import { getRelevantAnnouncements, getSchool } from '../utils/dataHelpers';

interface AnnouncementsScreenProps {
  activeUser: User;
  onBack: () => void;
}

type FilterKey = 'all' | AnnouncementAudience;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'school', label: 'בית הספר' },
  { key: 'grade', label: 'השכבה שלי' },
  { key: 'class', label: 'הכיתה שלי' },
];

const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  school: 'כל בית הספר',
  grade: 'השכבה שלי',
  class: 'הכיתה שלי',
  parents: 'הורים',
};

const AUDIENCE_COLORS: Record<AnnouncementAudience, string> = {
  school: 'bg-violet-100 text-violet-700',
  grade: 'bg-sky-100 text-sky-700',
  class: 'bg-teal-100 text-teal-700',
  parents: 'bg-amber-100 text-amber-700',
};

function AnnouncementCard({ ann }: { ann: Announcement }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border p-5 ${
        ann.important ? 'border-rose-200' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-gray-800 flex-1 leading-snug">
          {ann.important && (
            <span className="text-rose-500 ml-1.5" aria-label="חשוב">
              ⚡
            </span>
          )}
          {ann.title}
        </h3>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${AUDIENCE_COLORS[ann.audience]}`}
        >
          {AUDIENCE_LABELS[ann.audience]}
        </span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed mb-3">
        {ann.content}
      </p>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{ann.author}</span>
        <span>{ann.date}</span>
      </div>
    </div>
  );
}

export function AnnouncementsScreen({
  activeUser,
  onBack,
}: AnnouncementsScreenProps) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const school = getSchool(activeUser.schoolId);

  const allAnnouncements = getRelevantAnnouncements(activeUser);
  const filtered =
    filter === 'all'
      ? allAnnouncements
      : allAnnouncements.filter((a) => a.audience === filter);

  const sorted = [...filtered].sort((a, b) => {
    if (a.important && !b.important) return -1;
    if (!a.important && b.important) return 1;
    return 0;
  });

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-violet-50 via-sky-50 to-emerald-50 font-sans"
    >
      <header className="bg-white/80 backdrop-blur-md border-b border-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors font-medium text-sm rounded-lg px-2 py-1 hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5" />
            חזרה
          </button>
          <div className="text-center">
            <p className="font-bold text-gray-800 text-sm">לוח מודעות</p>
            {school && (
              <p className="text-xs text-gray-400">{school.name}</p>
            )}
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
                filter === f.key
                  ? 'bg-violet-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {f.label}
              {f.key !== 'all' && (
                <span className="mr-1.5 text-xs opacity-70">
                  ({allAnnouncements.filter((a) => a.audience === f.key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Announcements */}
        {sorted.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <p className="text-2xl mb-3">📭</p>
            <p className="text-gray-500 font-medium">אין מודעות להצגה</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((ann) => (
              <AnnouncementCard key={ann.id} ann={ann} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
