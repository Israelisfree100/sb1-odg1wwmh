import React, { useState, useMemo } from 'react';
import { ChevronRight, LogOut, FileText, BookOpen } from 'lucide-react';
import type { User, AppScreen } from '../types';
import { getSchool, getInitials, getClass } from '../utils/dataHelpers';
import { getParentChildren } from '../utils/roleHelpers';
import {
  canParentAccessChild, getParentSelectedChildId, saveParentSelectedChildId, getSelectedChild,
} from '../utils/parentHelpers';
import { getExamsForClass } from '../services/examRepository';

interface Props { activeUser: User; onBack: () => void; onNavigate: (s: AppScreen) => void; onLogout: () => void; }

type ExamFilter = 'upcoming' | 'all' | string;

const MATH_SUBJECTS = ['חשבון'];

export function ParentChildExamsScreen({ activeUser, onBack, onLogout }: Props) {
  const [childId, setChildId] = useState(() => getParentSelectedChildId(activeUser));
  const [filter, setFilter] = useState<ExamFilter>('upcoming');
  const children = useMemo(() => getParentChildren(activeUser), [activeUser]);
  const child = useMemo(
    () => (canParentAccessChild(activeUser, childId) ? getSelectedChild(activeUser, childId) : undefined),
    [activeUser, childId],
  );
  const cls = useMemo(() => (child?.classId ? getClass(child.classId) : undefined), [child]);
  const school = useMemo(() => getSchool(activeUser.schoolId), [activeUser.schoolId]);
  const initials = getInitials(activeUser.fullName);

  const exams = useMemo(
    () => (child?.classId ? getExamsForClass(child.classId, child.schoolId) : []),
    [child],
  );

  const subjects = useMemo(() => Array.from(new Set(exams.map((e) => e.subject))), [exams]);

  const visible = useMemo(() => {
    if (filter === 'all') return exams;
    if (filter === 'upcoming') return exams; // all are "upcoming" since they have future date labels
    return exams.filter((e) => e.subject === filter);
  }, [exams, filter]);

  const handleChangeChild = (id: string) => {
    if (!canParentAccessChild(activeUser, id)) return;
    setChildId(id); saveParentSelectedChildId(activeUser, id);
  };

  const FILTERS = [
    { id: 'upcoming', label: 'קרובים' },
    { id: 'all', label: 'כל המבחנים' },
    ...subjects.map((s) => ({ id: s, label: s })),
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
              <p className="text-sm font-bold text-gray-800">מבחנים</p>
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
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">לא נמצא ילד מקושר</p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-l from-violet-500 to-purple-600 rounded-2xl p-4 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">{getInitials(child.fullName)}</div>
              <div>
                <p className="font-bold">{child.fullName}</p>
                <p className="text-xs opacity-80">{cls?.name ?? child.classId} · {exams.length} מבחנים</p>
              </div>
            </div>

            {/* Filters */}
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
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>אין מבחנים להצגה</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visible.map((e, idx) => (
                  <div key={e.id} className={`bg-white rounded-xl border shadow-sm px-4 py-4 ${
                    idx === 0 && filter === 'upcoming' ? 'border-violet-300 bg-violet-50' : 'border-gray-100'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-gray-800">{e.subject}</p>
                          {idx === 0 && filter === 'upcoming' && (
                            <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">הבא</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{e.teacherName} · {e.dateLabel}</p>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {e.topics.map((t) => (
                            <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                        {e.notes && <p className="text-xs text-amber-600">{e.notes}</p>}
                      </div>
                      <div className="flex-shrink-0">
                        {MATH_SUBJECTS.includes(e.subject) ? (
                          <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-xl flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> יש תרגול
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-xl">תרגול יתווסף</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
