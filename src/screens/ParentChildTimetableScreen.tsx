import React, { useState, useMemo } from 'react';
import { ChevronRight, LogOut, Calendar, Clock } from 'lucide-react';
import type { User, AppScreen } from '../types';
import { getSchool, getInitials, getClass } from '../utils/dataHelpers';
import { getParentChildren } from '../utils/roleHelpers';
import {
  canParentAccessChild, getParentSelectedChildId, saveParentSelectedChildId, getSelectedChild,
} from '../utils/parentHelpers';
import { TIMETABLE_ENTRIES } from '../data/mockData';

interface Props {
  activeUser: User;
  onBack: () => void;
  onNavigate: (s: AppScreen) => void;
  onLogout: () => void;
}

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];

function todayDay() {
  const d = new Date().getDay();
  return d >= 5 ? 0 : d;
}

function getLessonStatus(
  entry: { startTime: string; endTime: string; isBreak?: boolean },
  day: number,
  activeDay: number,
): 'done' | 'now' | 'next' | 'later' | 'break' {
  if (entry.isBreak) return 'break';
  if (day !== todayDay() || activeDay !== todayDay()) return 'later';
  const now = new Date();
  const [sh, sm] = entry.startTime.split(':').map(Number);
  const [eh, em] = entry.endTime.split(':').map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  const cur = now.getHours() * 60 + now.getMinutes();
  if (cur >= end) return 'done';
  if (cur >= start) return 'now';
  return 'later';
}

export function ParentChildTimetableScreen({ activeUser, onBack, onLogout }: Props) {
  const [childId, setChildId] = useState(() => getParentSelectedChildId(activeUser));
  const [activeDay, setActiveDay] = useState(todayDay());
  const children = useMemo(() => getParentChildren(activeUser), [activeUser]);
  const child = useMemo(
    () => (canParentAccessChild(activeUser, childId) ? getSelectedChild(activeUser, childId) : undefined),
    [activeUser, childId],
  );
  const cls = useMemo(() => (child?.classId ? getClass(child.classId) : undefined), [child]);
  const school = useMemo(() => getSchool(activeUser.schoolId), [activeUser.schoolId]);
  const initials = getInitials(activeUser.fullName);

  const dayEntries = useMemo(() => {
    if (!child?.classId) return [];
    return TIMETABLE_ENTRIES
      .filter((e) => e.classId === child.classId && e.dayOfWeek === activeDay)
      .sort((a, b) => a.period - b.period);
  }, [child, activeDay]);

  const handleChangeChild = (id: string) => {
    if (!canParentAccessChild(activeUser, id)) return;
    setChildId(id);
    saveParentSelectedChildId(activeUser, id);
  };

  const STATUS_STYLES: Record<string, string> = {
    done: 'bg-gray-50 border-gray-100 opacity-60',
    now: 'bg-emerald-50 border-emerald-200 shadow-emerald-100',
    next: 'bg-sky-50 border-sky-200',
    later: 'bg-white border-gray-100',
    break: 'bg-amber-50 border-amber-100',
  };

  const STATUS_BADGE: Record<string, string | null> = {
    done: 'הסתיים',
    now: 'עכשיו',
    next: 'הבא',
    later: null,
    break: null,
  };

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
              <p className="text-sm font-bold text-gray-800">מערכת שעות</p>
              <p className="text-xs text-gray-500">{school?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
            <button onClick={onLogout} className="text-gray-400 hover:text-rose-500 p-1.5"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Child selector */}
        {children.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
            <select
              value={childId}
              onChange={(e) => handleChangeChild(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              {children.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
          </div>
        )}

        {!child ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">לא נמצא ילד מקושר</p>
          </div>
        ) : (
          <>
            {/* Child + class header */}
            <div className="bg-gradient-to-l from-violet-500 to-purple-600 rounded-2xl p-4 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                {getInitials(child.fullName)}
              </div>
              <div>
                <p className="font-bold">{child.fullName}</p>
                <p className="text-xs opacity-80">{cls?.name ?? child.classId} · {school?.name}</p>
              </div>
            </div>

            {/* Day tabs */}
            <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm overflow-x-auto">
              {DAY_NAMES.map((name, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveDay(idx)}
                  className={`flex-1 min-w-[56px] py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeDay === idx
                      ? 'bg-violet-500 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {name}
                  {idx === todayDay() && <span className="block text-[10px] opacity-70">היום</span>}
                </button>
              ))}
            </div>

            {/* Timetable */}
            {dayEntries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-400 text-sm">אין שיעורים ביום זה</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dayEntries.map((e) => {
                  const status = getLessonStatus(e, activeDay, activeDay);
                  const badge = STATUS_BADGE[status];
                  return (
                    <div key={e.id} className={`rounded-xl border shadow-sm px-4 py-3 flex items-center gap-3 ${STATUS_STYLES[status]}`}>
                      <div className="text-center w-14 flex-shrink-0">
                        <p className="text-xs font-bold text-gray-600">{e.startTime}</p>
                        <p className="text-xs text-gray-400">{e.endTime}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${e.isBreak ? 'text-amber-700' : status === 'now' ? 'text-emerald-800' : 'text-gray-800'}`}>
                          {e.subject}
                        </p>
                        {!e.isBreak && (
                          <p className="text-xs text-gray-500 truncate">
                            {e.teacherName}{e.room ? ` · ${e.room}` : ''}
                          </p>
                        )}
                      </div>
                      {badge && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          badge === 'עכשיו' ? 'bg-emerald-100 text-emerald-700'
                          : badge === 'הבא' ? 'bg-sky-100 text-sky-700'
                          : 'bg-gray-100 text-gray-500'
                        }`}>
                          {badge}
                        </span>
                      )}
                    </div>
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
