import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  LogOut,
  CheckCircle2,
  Circle,
  BookOpen,
  CalendarDays,
  User,
  ClipboardList,
} from 'lucide-react';
import type { User as AppUser, Assignment } from '../types';
import {
  getAssignments,
  getCompletedAssignmentIds,
  toggleAssignmentComplete,
  getSchool,
  getClass,
  getInitials,
} from '../utils/dataHelpers';

// ─── Types & constants ────────────────────────────────────────────────────────

type Filter = 'all' | 'today' | 'week' | 'done';

interface Props {
  activeUser: AppUser;
  onBack: () => void;
  onLogout: () => void;
}

const PRIORITY_LABEL: Record<Assignment['priority'], string> = {
  high: 'דחופה',
  medium: 'חשובה',
  low: 'רגילה',
};

const PRIORITY_STYLE: Record<Assignment['priority'], string> = {
  high: 'bg-rose-100 text-rose-700 border-rose-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const DUE_ORDER: Record<string, number> = {
  היום: 0,
  מחר: 1,
  "יום ג'": 2,
  "יום ד'": 3,
  "יום ה'": 4,
  "יום ו'": 5,
};

function dueDateOrder(dueDate: string): number {
  return DUE_ORDER[dueDate] ?? 99;
}

const FILTER_LABELS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'today', label: 'להיום' },
  { key: 'week', label: 'השבוע' },
  { key: 'done', label: 'הושלמו' },
];

// ─── Sorting ──────────────────────────────────────────────────────────────────

function sortAssignments(
  assignments: Assignment[],
  completedIds: string[],
): Assignment[] {
  return [...assignments].sort((a, b) => {
    const aDone = completedIds.includes(a.id);
    const bDone = completedIds.includes(b.id);
    if (aDone !== bDone) return aDone ? 1 : -1;
    const dateDiff = dueDateOrder(a.dueDate) - dueDateOrder(b.dueDate);
    if (dateDiff !== 0) return dateDiff;
    const PRIO = { high: 0, medium: 1, low: 2 };
    return PRIO[a.priority] - PRIO[b.priority];
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AssignmentsScreen({ activeUser, onBack, onLogout }: Props) {
  const school = getSchool(activeUser.schoolId);
  const cls = activeUser.classId ? getClass(activeUser.classId) : undefined;
  const initials = getInitials(activeUser.fullName);

  const allAssignments = useMemo(
    () => getAssignments(activeUser.classId ?? ''),
    [activeUser.classId],
  );

  const [completedIds, setCompletedIds] = useState<string[]>(() =>
    getCompletedAssignmentIds(activeUser.id),
  );
  const [activeFilter, setActiveFilter] = useState<Filter>('all');

  function handleToggle(assignmentId: string) {
    toggleAssignmentComplete(activeUser.id, assignmentId);
    setCompletedIds(getCompletedAssignmentIds(activeUser.id));
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  const total = allAssignments.length;
  const completedCount = allAssignments.filter((a) =>
    completedIds.includes(a.id),
  ).length;
  const remaining = total - completedCount;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // ── Filtered ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = allAssignments;
    if (activeFilter === 'today') {
      list = list.filter((a) => a.dueDate === 'היום');
    } else if (activeFilter === 'week') {
      list = list.filter((a) => !completedIds.includes(a.id));
    } else if (activeFilter === 'done') {
      list = list.filter((a) => completedIds.includes(a.id));
    }
    return sortAssignments(list, completedIds);
  }, [allAssignments, activeFilter, completedIds]);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
      {/* ── Header ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/60 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            חזרה
          </button>
          <div className="text-center min-w-0">
            <p className="font-bold text-gray-800 text-sm">המשימות שלי</p>
            {cls && (
              <p className="text-xs text-gray-400 truncate">
                {school?.name} · {cls.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-pink-500 flex items-center justify-center text-white font-bold text-xs select-none">
              {initials}
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="התנתקות"
              className="text-gray-400 hover:text-rose-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* ── Stats card ── */}
        <div className="bg-gradient-to-l from-violet-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-purple-200 text-sm">
                {completedCount} מתוך {total} משימות הושלמו
              </p>
              <p className="text-2xl font-bold mt-0.5">
                {remaining === 0
                  ? '🎉 הכל הושלם!'
                  : `נשארו ${remaining} משימות`}
              </p>
            </div>
            <div className="text-left shrink-0">
              <p className="text-4xl font-bold tabular-nums">{pct}%</p>
              <p className="text-purple-200 text-xs">הושלם</p>
            </div>
          </div>
          <div className="bg-purple-800/50 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-white rounded-full h-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-purple-200">
            <span>התחלה</span>
            <span>סיום</span>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_LABELS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeFilter === key
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Assignment list ── */}
        {filtered.length === 0 ? (
          <EmptyState filter={activeFilter} />
        ) : (
          <div className="space-y-3">
            {filtered.map((assignment) => {
              const done = completedIds.includes(assignment.id);
              return (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  done={done}
                  onToggle={() => handleToggle(assignment.id)}
                />
              );
            })}
          </div>
        )}

        <div className="h-6" />
      </main>
    </div>
  );
}

// ─── Assignment Card ──────────────────────────────────────────────────────────

function AssignmentCard({
  assignment,
  done,
  onToggle,
}: {
  assignment: Assignment;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
        done ? 'border-gray-100 opacity-70' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Complete toggle */}
        <button
          type="button"
          onClick={onToggle}
          title={done ? 'סמן כלא הושלם' : 'סמן כהושלם'}
          className={`mt-0.5 shrink-0 transition-colors ${
            done ? 'text-emerald-500 hover:text-gray-400' : 'text-gray-300 hover:text-emerald-500'
          }`}
        >
          {done ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Top row: subject + priority */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full px-2.5 py-0.5">
              <BookOpen className="w-3 h-3" />
              {assignment.subject}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                PRIORITY_STYLE[assignment.priority]
              }`}
            >
              {PRIORITY_LABEL[assignment.priority]}
            </span>
          </div>

          {/* Title */}
          <h3
            className={`font-bold text-base leading-snug ${
              done ? 'line-through text-gray-400' : 'text-gray-800'
            }`}
          >
            {assignment.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-500 mt-1 leading-snug">
            {assignment.description}
          </p>

          {/* Footer: due date + teacher */}
          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
              {done ? (
                <span className="text-emerald-600 font-semibold">הושלמה ✓</span>
              ) : (
                <>
                  יש להגיש:{' '}
                  <span
                    className={`font-semibold ${
                      assignment.dueDate === 'היום'
                        ? 'text-rose-600'
                        : assignment.dueDate === 'מחר'
                        ? 'text-amber-600'
                        : 'text-gray-700'
                    }`}
                  >
                    {assignment.dueDate}
                  </span>
                </>
              )}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <User className="w-3.5 h-3.5 text-gray-400" />
              {assignment.teacherName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: Filter }) {
  const messages: Record<Filter, { emoji: string; title: string; subtitle: string }> = {
    all: {
      emoji: '🎉',
      title: 'אין משימות כרגע!',
      subtitle: 'כל הכבוד — הכל מסודר!',
    },
    today: {
      emoji: '✅',
      title: 'אין משימות להיום',
      subtitle: 'אין מה להגיש היום — נהנה!',
    },
    week: {
      emoji: '🌟',
      title: 'כל המשימות הושלמו!',
      subtitle: 'עשית עבודה מצוינת השבוע!',
    },
    done: {
      emoji: '📝',
      title: 'עוד לא הושלמה אף משימה',
      subtitle: 'סמן משימות כהושלמו כשתסיים אותן',
    },
  };

  const msg = messages[filter];

  return (
    <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
      <p className="text-5xl mb-3">{msg.emoji}</p>
      <p className="font-bold text-gray-700 text-lg">{msg.title}</p>
      <p className="text-sm text-gray-400 mt-1">{msg.subtitle}</p>
      <ClipboardList className="w-8 h-8 text-gray-200 mx-auto mt-4" />
    </div>
  );
}
