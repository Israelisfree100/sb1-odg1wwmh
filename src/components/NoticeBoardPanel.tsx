import React from 'react';
import type { Announcement, AnnouncementAudience } from '../types';

interface NoticeBoardPanelProps {
  announcements: Announcement[];
  onViewAll: () => void;
}

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

export function NoticeBoardPanel({
  announcements,
  onViewAll,
}: NoticeBoardPanelProps) {
  const sorted = [...announcements]
    .sort((a, b) => {
      if (a.important && !b.important) return -1;
      if (!a.important && b.important) return 1;
      return 0;
    })
    .slice(0, 4);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-l from-violet-500 to-sky-500 px-4 py-3.5">
        <h2 className="text-sm font-extrabold text-white tracking-wide">
          📋 לוח מודעות בית הספר
        </h2>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-50">
        {sorted.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">
            אין מודעות כרגע
          </p>
        )}
        {sorted.map((ann) => (
          <div
            key={ann.id}
            className={`px-4 py-3 ${ann.important ? 'bg-rose-50/50' : ''}`}
          >
            <p className="text-sm font-bold text-gray-800 leading-snug">
              {ann.important && (
                <span className="text-rose-500 ml-1" aria-label="חשוב">
                  ⚡
                </span>
              )}
              {ann.title}
            </p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
              {ann.content}
            </p>
            <div className="flex items-center justify-between mt-2 gap-2">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${AUDIENCE_COLORS[ann.audience]}`}
              >
                {AUDIENCE_LABELS[ann.audience]}
              </span>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {ann.date}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onViewAll}
          className="w-full text-sm font-bold text-violet-600 hover:text-violet-700 transition-colors py-1 text-center"
        >
          לכל ההודעות ←
        </button>
      </div>
    </div>
  );
}
