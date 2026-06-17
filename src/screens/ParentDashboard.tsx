import React, { useMemo, useState } from 'react';
import {
  LogOut,
  Users,
  ClipboardList,
  FileText,
  MessageSquare,
  BellRing,
  TrendingUp,
  Calendar,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import type { User, AppScreen } from '../types';
import { getSchool, getInitials } from '../utils/dataHelpers';
import {
  getParentChildren,
  getParentSelectedChildData,
} from '../utils/roleHelpers';

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatChipProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

function StatChip({ icon, label, value, color }: StatChipProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-extrabold text-gray-800 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

interface NavCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
  badge?: string;
}

function NavCard({ icon, title, description, color, onClick, badge }: NavCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-right hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 w-full"
    >
      {badge && (
        <span className="absolute top-3 left-3 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <h3 className="text-sm font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ParentDashboardProps {
  activeUser: User;
  onNavigate: (screen: AppScreen) => void;
  onLogout: () => void;
}

export function ParentDashboard({ activeUser, onNavigate, onLogout }: ParentDashboardProps) {
  const school = useMemo(() => getSchool(activeUser.schoolId), [activeUser.schoolId]);
  const children = useMemo(() => getParentChildren(activeUser), [activeUser]);

  // Ensure selectedChildId is always a valid linked child ID
  const [selectedChildId, setSelectedChildId] = useState<string>(
    () => children[0]?.id ?? '',
  );

  // If stored ID is no longer in the linked list (e.g. stale session), fall back to first child
  const validChildId = children.some((c) => c.id === selectedChildId)
    ? selectedChildId
    : (children[0]?.id ?? '');

  const snapshot = useMemo(
    () => (validChildId ? getParentSelectedChildData(activeUser, validChildId) : null),
    [activeUser, validChildId],
  );

  const initials = getInitials(activeUser.fullName);

  const remainingAssignments = snapshot
    ? snapshot.assignments.length - snapshot.completedCount
    : 0;

  const completionPct =
    snapshot && snapshot.assignments.length > 0
      ? Math.round((snapshot.completedCount / snapshot.assignments.length) * 100)
      : 0;

  const latestImportantAnn = snapshot?.announcements.find((a) => a.important);
  const latestMessage = snapshot?.classMessages[snapshot.classMessages.length - 1];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-sky-50 font-sans"
    >
      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Left: school + role badge */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{school?.name ?? activeUser.schoolId}</p>
              <span className="inline-block bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">
                הורה
              </span>
            </div>
          </div>

          {/* Right: avatar + name + logout */}
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800">{activeUser.fullName}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <button
              onClick={onLogout}
              aria-label="יציאה מהמערכת"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-rose-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">יציאה</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">
            שלום {activeUser.firstName}! 👋
          </h1>
          <p className="text-gray-500 mt-1">הנה העדכונים החשובים מהילדים</p>
        </div>

        {/* No children state */}
        {children.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">לא נמצאו ילדים משויכים לחשבון זה</p>
          </div>
        )}

        {/* Child selector + data */}
        {children.length > 0 && (
          <>
            {/* Child selector — only if multiple */}
            {children.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <label
                  htmlFor="child-select"
                  className="block text-xs font-semibold text-gray-500 mb-2"
                >
                  בחר/י ילד לצפייה
                </label>
                <div className="relative">
                  <select
                    id="child-select"
                    value={validChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-800"
                  >
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.fullName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {snapshot && (
              <>
                {/* Child identity card */}
                <div className="bg-gradient-to-l from-violet-500 to-purple-600 rounded-2xl p-5 text-white">
                  <p className="text-xs opacity-70 mb-1">צפייה במידע של</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                      {getInitials(snapshot.child.fullName)}
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold">{snapshot.child.fullName}</h2>
                      <p className="text-sm opacity-80">
                        {snapshot.classGroup?.name ?? snapshot.child.classId ?? ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatChip
                    icon={<Calendar className="w-5 h-5 text-sky-600" />}
                    label="שיעורים היום"
                    value={snapshot.todayLessons.length}
                    color="bg-sky-100"
                  />
                  <StatChip
                    icon={<ClipboardList className="w-5 h-5 text-rose-600" />}
                    label="משימות שנותרו"
                    value={remainingAssignments}
                    color="bg-rose-100"
                  />
                  <StatChip
                    icon={<FileText className="w-5 h-5 text-violet-600" />}
                    label="מבחן הבא"
                    value={snapshot.nextExam?.dateLabel ?? 'אין'}
                    color="bg-violet-100"
                  />
                  <StatChip
                    icon={<MessageSquare className="w-5 h-5 text-amber-600" />}
                    label="הודעות כיתה"
                    value={snapshot.classMessages.length}
                    color="bg-amber-100"
                  />
                </div>

                {/* Today's timetable summary */}
                {snapshot.todayLessons.length > 0 && (
                  <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-violet-600" />
                      <h2 className="text-base font-bold text-gray-800">
                        מערכת השעות של {snapshot.child.firstName} — היום
                      </h2>
                    </div>
                    <div className="space-y-2">
                      {snapshot.todayLessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-violet-50 border border-violet-100"
                        >
                          <span className="text-xs font-bold text-violet-700 w-24 flex-shrink-0">
                            {lesson.startTime}–{lesson.endTime}
                          </span>
                          <span className="text-sm font-semibold text-gray-800 flex-1">
                            {lesson.subject}
                          </span>
                          {lesson.room && (
                            <span className="text-xs text-gray-400">{lesson.room}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Progress bar */}
                {snapshot.assignments.length > 0 && (
                  <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <h2 className="text-base font-bold text-gray-800">התקדמות במשימות</h2>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>{snapshot.completedCount} הושלמו מתוך {snapshot.assignments.length}</span>
                      <span className="font-bold text-emerald-600">{completionPct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-l from-emerald-400 to-teal-500 h-2.5 rounded-full transition-all"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                  </section>
                )}

                {/* Next exam */}
                {snapshot.nextExam && (
                  <section className="bg-white rounded-2xl border border-violet-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-violet-600" />
                      <h2 className="text-base font-bold text-gray-800">המבחן הקרוב</h2>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                      <p className="font-bold text-violet-800 text-base">{snapshot.nextExam.subject}</p>
                      <p className="text-sm text-violet-700 mt-1">{snapshot.nextExam.dateLabel}</p>
                      <p className="text-xs text-violet-600 mt-1.5">
                        נושאים: {snapshot.nextExam.topics.join(', ')}
                      </p>
                    </div>
                  </section>
                )}

                {/* Latest important announcement */}
                {latestImportantAnn && (
                  <section className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      <h2 className="text-base font-bold text-gray-800">הודעה חשובה מבית הספר</h2>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                      <p className="font-bold text-amber-800 text-sm">{latestImportantAnn.title}</p>
                      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        {latestImportantAnn.content.slice(0, 150)}{latestImportantAnn.content.length > 150 ? '...' : ''}
                      </p>
                      <p className="text-xs text-amber-500 mt-1.5">{latestImportantAnn.author} · {latestImportantAnn.date}</p>
                    </div>
                  </section>
                )}

                {/* Latest class message */}
                {latestMessage && (
                  <section className="bg-white rounded-2xl border border-sky-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-5 h-5 text-sky-600" />
                      <h2 className="text-base font-bold text-gray-800">ההודעה האחרונה מהכיתה</h2>
                    </div>
                    <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
                      <p className="font-bold text-sky-800 text-sm">{latestMessage.title}</p>
                      <p className="text-xs text-sky-700 mt-1 leading-relaxed">
                        {latestMessage.content.slice(0, 150)}{latestMessage.content.length > 150 ? '...' : ''}
                      </p>
                      <p className="text-xs text-sky-500 mt-1.5">{latestMessage.teacherName} · {latestMessage.publishedAt}</p>
                    </div>
                  </section>
                )}

                {/* Navigation cards */}
                <section>
                  <h2 className="text-base font-bold text-gray-700 mb-3">מידע נוסף</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <NavCard
                      icon={<Calendar className="w-5 h-5 text-sky-600" />}
                      title="מערכת השעות של הילד"
                      description="צפייה בלוח השעות השבועי"
                      color="bg-sky-100"
                      badge="בקרוב"
                      onClick={() => onNavigate({ id: 'placeholder', title: 'מערכת השעות — בקרוב' })}
                    />
                    <NavCard
                      icon={<ClipboardList className="w-5 h-5 text-rose-600" />}
                      title="משימות ושיעורי בית"
                      description="עקבי אחר המשימות"
                      color="bg-rose-100"
                      badge="בקרוב"
                      onClick={() => onNavigate({ id: 'placeholder', title: 'משימות ושיעורי בית — בקרוב' })}
                    />
                    <NavCard
                      icon={<FileText className="w-5 h-5 text-violet-600" />}
                      title="מבחנים"
                      description="מבחנים ומועדים קרובים"
                      color="bg-violet-100"
                      badge="בקרוב"
                      onClick={() => onNavigate({ id: 'placeholder', title: 'מבחנים — בקרוב' })}
                    />
                    <NavCard
                      icon={<MessageSquare className="w-5 h-5 text-amber-600" />}
                      title="הודעות הכיתה"
                      description="הודעות מהמורה והכיתה"
                      color="bg-amber-100"
                      badge="בקרוב"
                      onClick={() => onNavigate({ id: 'placeholder', title: 'הודעות הכיתה — בקרוב' })}
                    />
                    <NavCard
                      icon={<BellRing className="w-5 h-5 text-teal-600" />}
                      title="הודעות בית הספר"
                      description="מידע ועדכונים מבית הספר"
                      color="bg-teal-100"
                      badge="בקרוב"
                      onClick={() => onNavigate({ id: 'placeholder', title: 'הודעות בית הספר — בקרוב' })}
                    />
                    <NavCard
                      icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                      title="התקדמות בתרגול"
                      description="מעקב אחר ביצועים ולמידה"
                      color="bg-emerald-100"
                      badge="בקרוב"
                      onClick={() => onNavigate({ id: 'placeholder', title: 'התקדמות בתרגול — בקרוב' })}
                    />
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
