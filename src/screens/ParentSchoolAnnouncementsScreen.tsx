import React, { useState, useMemo, useCallback } from 'react';
import { ChevronRight, LogOut, Megaphone, Check } from 'lucide-react';
import type { User, AppScreen, AnnouncementAudience } from '../types';
import { getSchool, getInitials, getClass } from '../utils/dataHelpers';
import { getParentChildren } from '../utils/roleHelpers';
import {
  canParentAccessChild, getParentSelectedChildId, saveParentSelectedChildId, getSelectedChild,
  getParentReadAnnouncementIds, markParentAnnouncementRead, markAllParentAnnouncementsRead,
  filterAnnouncementsForChild,
} from '../utils/parentHelpers';
import { getPublishedAnnouncements } from '../services/announcementRepository';

interface Props { activeUser: User; onBack: () => void; onNavigate: (s: AppScreen) => void; onLogout: () => void; }

type AnnFilter = 'all' | 'important' | AnnouncementAudience;

const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  school: 'לכל בית הספר', grade: 'לשכבה', class: 'לכיתה', parents: 'להורים',
};
const AUDIENCE_COLORS: Record<AnnouncementAudience, string> = {
  school: 'bg-sky-100 text-sky-700',
  grade: 'bg-violet-100 text-violet-700',
  class: 'bg-emerald-100 text-emerald-700',
  parents: 'bg-pink-100 text-pink-700',
};

export function ParentSchoolAnnouncementsScreen({ activeUser, onBack, onLogout }: Props) {
  const [childId, setChildId] = useState(() => getParentSelectedChildId(activeUser));
  const [filter, setFilter] = useState<AnnFilter>('all');
  const [readIds, setReadIds] = useState(() => getParentReadAnnouncementIds(activeUser.id));
  const [expanded, setExpanded] = useState<string | null>(null);

  const children = useMemo(() => getParentChildren(activeUser), [activeUser]);
  const child = useMemo(
    () => (canParentAccessChild(activeUser, childId) ? getSelectedChild(activeUser, childId) : undefined),
    [activeUser, childId],
  );
  const cls = useMemo(() => (child?.classId ? getClass(child.classId) : undefined), [child]);
  const school = useMemo(() => getSchool(activeUser.schoolId), [activeUser.schoolId]);
  const initials = getInitials(activeUser.fullName);

  const allPublished = useMemo(
    () => getPublishedAnnouncements(activeUser.schoolId),
    [activeUser.schoolId],
  );

  const childAnnouncements = useMemo(() => {
    if (!child) return [];
    return filterAnnouncementsForChild(allPublished, activeUser, child.classId);
  }, [allPublished, child, activeUser]);

  const visible = useMemo(() => {
    return childAnnouncements.filter((a) => {
      if (filter === 'important') return a.important;
      if (filter === 'all') return true;
      return a.audience === filter;
    });
  }, [childAnnouncements, filter]);

  const unreadCount = useMemo(
    () => childAnnouncements.filter((a) => !readIds.includes(a.id)).length,
    [childAnnouncements, readIds],
  );

  const handleOpen = useCallback((id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
    if (!readIds.includes(id)) {
      markParentAnnouncementRead(activeUser.id, id);
      setReadIds(getParentReadAnnouncementIds(activeUser.id));
    }
  }, [activeUser.id, readIds]);

  const handleMarkAll = () => {
    markAllParentAnnouncementsRead(activeUser.id, childAnnouncements.map((a) => a.id));
    setReadIds(getParentReadAnnouncementIds(activeUser.id));
  };

  const handleChangeChild = (id: string) => {
    if (!canParentAccessChild(activeUser, id)) return;
    setChildId(id); saveParentSelectedChildId(activeUser, id);
  };

  const FILTERS: { id: AnnFilter; label: string }[] = [
    { id: 'all', label: 'הכל' }, { id: 'important', label: 'חשוב' },
    { id: 'school', label: 'לכל בית הספר' }, { id: 'grade', label: 'לשכבה' },
    { id: 'class', label: 'לכיתה' }, { id: 'parents', label: 'להורים' },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-sky-50 font-sans">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm">
              <ChevronRight className="w-4 h-4" /><span className="hidden sm:inline">לוח הורה</span>
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <div>
              <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                הודעות בית הספר
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </p>
              <p className="text-xs text-gray-500">{school?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-violet-600 font-semibold hover:underline flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />סמן הכל
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
            <button onClick={onLogout} className="text-gray-400 hover:text-rose-500 p-1.5"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {children.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
            <select value={childId} onChange={(e) => handleChangeChild(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400">
              {children.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
          </div>
        )}

        {!child ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <Megaphone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">לא נמצא ילד מקושר</p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-l from-violet-500 to-purple-600 rounded-2xl p-4 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">{getInitials(child.fullName)}</div>
              <div>
                <p className="font-bold">{child.fullName}</p>
                <p className="text-xs opacity-80">{cls?.name ?? child.classId} · {childAnnouncements.length} הודעות</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 bg-white rounded-2xl p-2 border border-gray-100 shadow-sm">
              {FILTERS.map((f) => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    filter === f.id ? 'bg-violet-500 text-white' : 'text-gray-500 hover:bg-gray-50'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>אין הודעות להצגה</p>
              </div>
            ) : (
              <div className="space-y-2">
                {visible.map((a) => {
                  const isRead = readIds.includes(a.id);
                  const isOpen = expanded === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => handleOpen(a.id)}
                      className={`w-full text-right bg-white rounded-xl border shadow-sm px-4 py-3 transition-all hover:shadow-md ${
                        !isRead ? 'border-violet-200' : 'border-gray-100'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {!isRead && <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />}
                            <p className={`text-sm font-bold ${isRead ? 'text-gray-700' : 'text-gray-900'}`}>{a.title}</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${AUDIENCE_COLORS[a.audience]}`}>{AUDIENCE_LABELS[a.audience]}</span>
                            {a.important && <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">חשוב</span>}
                          </div>
                          <p className="text-xs text-gray-500">{a.author} · {a.date}</p>
                          {isOpen && (
                            <p className="text-xs text-gray-600 mt-2 leading-relaxed text-right">{a.content}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
