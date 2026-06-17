import React, { useState, useMemo } from 'react';
import { ChevronRight, LogOut, ClipboardList } from 'lucide-react';
import type { User, AppScreen } from '../types';
import { getSchool, getInitials, getClass, getCompletedAssignmentIds } from '../utils/dataHelpers';
import { getParentChildren } from '../utils/roleHelpers';
import {
  canParentAccessChild, getParentSelectedChildId, saveParentSelectedChildId, getSelectedChild,
} from '../utils/parentHelpers';
import { getAssignmentsForClass } from '../services/assignmentRepository';

interface Props { activeUser: User; onBack: () => void; onNavigate: (s: AppScreen) => void; onLogout: () => void; }

type Filter = 'all' | 'today' | 'week' | 'incomplete' | 'complete' | 'overdue';

const PRIORITY_LABELS: Record<string, string> = { low: 'רגילה', medium: 'חשובה', high: 'דחופה' };
const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
};

function isToday(dateStr: string) { return dateStr.includes('היום'); }
function isThisWeek(dateStr: string) { return dateStr.includes('השבוע') || isToday(dateStr); }
function isPastDue(dateStr: string, completed: boolean) {
  if (completed) return false;
  return dateStr.includes('אתמול') || dateStr.includes('עבר') || dateStr.includes('באיחור');
}

export function ParentChildAssignmentsScreen({ activeUser, onBack, onLogout }: Props) {
  const [childId, setChildId] = useState(() => getParentSelectedChildId(activeUser));
  const [filter, setFilter] = useState<Filter>('all');
  const children = useMemo(() => getParentChildren(activeUser), [activeUser]);
  const child = useMemo(
    () => (canParentAccessChild(activeUser, childId) ? getSelectedChild(activeUser, childId) : undefined),
    [activeUser, childId],
  );
  const cls = useMemo(() => (child?.classId ? getClass(child.classId) : undefined), [child]);
  const school = useMemo(() => getSchool(activeUser.schoolId), [activeUser.schoolId]);

  const assignments = useMemo(
    () => (child?.classId ? getAssignmentsForClass(child.classId) : []),
    [child],
  );
  const completedIds = useMemo(
    () => (child ? getCompletedAssignmentIds(child.id) : []),
    [child],
  );

  const enriched = useMemo(() =>
    assignments.map((a) => ({
      ...a,
      isCompleted: completedIds.includes(a.id),
      isOverdue: isPastDue(a.dueDate, completedIds.includes(a.id)),
    })),
  [assignments, completedIds]);

  const stats = useMemo(() => ({
    total: enriched.length,
    completed: enriched.filter((a) => a.isCompleted).length,
    remaining: enriched.filter((a) => !a.isCompleted).length,
    overdue: enriched.filter((a) => a.isOverdue).length,
    pct: enriched.length > 0
      ? Math.round((enriched.filter((a) => a.isCompleted).length / enriched.length) * 100)
      : 0,
  }), [enriched]);

  const visible = useMemo(() => {
    return enriched.filter((a) => {
      switch (filter) {
        case 'today': return isToday(a.dueDate);
        case 'week': return isThisWeek(a.dueDate);
        case 'incomplete': return !a.isCompleted;
        case 'complete': return a.isCompleted;
        case 'overdue': return a.isOverdue;
        default: return true;
      }
    });
  }, [enriched, filter]);

  const handleChangeChild = (id: string) => {
    if (!canParentAccessChild(activeUser, id)) return;
    setChildId(id); saveParentSelectedChildId(activeUser, id);
  };
  const initials = getInitials(activeUser.fullName);

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'הכל' }, { id: 'today', label: 'להיום' },
    { id: 'week', label: 'השבוע' }, { id: 'incomplete', label: 'טרם הושלמו' },
    { id: 'complete', label: 'הושלמו' }, { id: 'overdue', label: 'באיחור' },
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
              <p className="text-sm font-bold text-gray-800">משימות ושיעורי בית</p>
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
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">לא נמצא ילד מקושר</p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-l from-violet-500 to-purple-600 rounded-2xl p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">{getInitials(child.fullName)}</div>
                <div>
                  <p className="font-bold">{child.fullName}</p>
                  <p className="text-xs opacity-80">{cls?.name ?? child.classId}</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold">{stats.pct}%</p>
                <p className="text-xs opacity-70">השלים</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'סה"כ', value: stats.total, color: 'bg-violet-50 text-violet-700' },
                { label: 'הושלמו', value: stats.completed, color: 'bg-emerald-50 text-emerald-700' },
                { label: 'נשארו', value: stats.remaining, color: 'bg-sky-50 text-sky-700' },
                { label: 'באיחור', value: stats.overdue, color: 'bg-rose-50 text-rose-700' },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl p-3 text-center border border-gray-100 ${s.color.split(' ')[0]}`}>
                  <p className={`text-xl font-extrabold ${s.color.split(' ')[1]}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{stats.completed} הושלמו מתוך {stats.total}</span>
                <span className="font-bold text-emerald-600">{stats.pct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-gradient-to-l from-emerald-400 to-teal-500 h-2.5 rounded-full transition-all" style={{ width: `${stats.pct}%` }} />
              </div>
            </div>

            {/* Read-only notice */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700">
              📋 צפייה בלבד — סימון השלמת משימות הוא של הילד/ה בלבד
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
                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>אין משימות להצגה</p>
              </div>
            ) : (
              <div className="space-y-2">
                {visible.map((a) => (
                  <div key={a.id} className={`bg-white rounded-xl border shadow-sm px-4 py-3 ${
                    a.isOverdue ? 'border-rose-200' : a.isCompleted ? 'border-emerald-100 opacity-70' : 'border-gray-100'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-bold ${a.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>{a.title}</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[a.priority]}`}>{PRIORITY_LABELS[a.priority]}</span>
                          {a.isOverdue && <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">באיחור</span>}
                          {a.isCompleted && <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">הושלם</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{a.subject} · {a.teacherName}</p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{a.description.slice(0, 80)}</p>
                        <p className="text-xs text-violet-700 font-semibold mt-1">מועד: {a.dueDate}</p>
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
