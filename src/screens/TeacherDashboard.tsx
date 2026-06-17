import React, { useMemo } from 'react';
import {
  LogOut,
  BookOpen,
  ClipboardList,
  MessageSquare,
  FileText,
  Library,
  Calendar,
  Users,
  AlertCircle,
  BellRing,
  Clock,
  BookMarked,
} from 'lucide-react';
import type { User, AppScreen } from '../types';
import { getSchool, getClass, getInitials } from '../utils/dataHelpers';
import {
  getTeacherClasses,
  getTeacherSubjects,
  getTeacherTodayLessons,
  getTeacherRelevantAssignments,
  getTeacherRelevantExams,
  getTeacherRelevantMessages,
  getTeacherPublishedAnnouncements,
} from '../utils/roleHelpers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayDateHebrew(): string {
  return new Date().toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatWidgetProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

function StatWidget({ icon, label, value, color }: StatWidgetProps) {
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

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
  badge?: string;
}

function ActionCard({ icon, title, description, color, onClick, badge }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-right hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 w-full"
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

interface TeacherDashboardProps {
  activeUser: User;
  onNavigate: (screen: AppScreen) => void;
  onLogout: () => void;
}

export function TeacherDashboard({ activeUser, onNavigate, onLogout }: TeacherDashboardProps) {
  const school = useMemo(() => getSchool(activeUser.schoolId), [activeUser.schoolId]);
  const teacherClasses = useMemo(() => getTeacherClasses(activeUser), [activeUser]);
  const subjects = useMemo(() => getTeacherSubjects(activeUser), [activeUser]);
  const todayLessons = useMemo(() => getTeacherTodayLessons(activeUser), [activeUser]);
  const assignments = useMemo(() => getTeacherRelevantAssignments(activeUser), [activeUser]);
  const exams = useMemo(() => getTeacherRelevantExams(activeUser), [activeUser]);
  const messages = useMemo(() => getTeacherRelevantMessages(activeUser), [activeUser]);
  const announcements = useMemo(() => getTeacherPublishedAnnouncements(activeUser), [activeUser]);

  const urgentAssignment = useMemo(
    () => assignments.find((a) => a.priority === 'high'),
    [assignments],
  );
  const nextExam = useMemo(() => exams[0], [exams]);
  const importantMessage = useMemo(
    () => messages.find((m) => m.isImportant),
    [messages],
  );

  const initials = getInitials(activeUser.fullName);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 font-sans"
    >
      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Left: school + role badge */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{school?.name ?? activeUser.schoolId}</p>
              <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                מורה
              </span>
            </div>
          </div>

          {/* Right: avatar + name + logout */}
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800">{activeUser.fullName}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
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
          <p className="text-gray-500 mt-1">הנה תמונת המצב שלך להיום</p>
          {(teacherClasses.length > 0 || subjects.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {teacherClasses.map((cls) => (
                <span key={cls.id} className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {cls.name}
                  {activeUser.homeroomClassId === cls.id ? ' (מחנכת)' : ''}
                </span>
              ))}
              {subjects.map((sub) => (
                <span key={sub} className="bg-teal-100 text-teal-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {sub}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatWidget
            icon={<Users className="w-5 h-5 text-emerald-600" />}
            label="הכיתות שלי"
            value={teacherClasses.length}
            color="bg-emerald-100"
          />
          <StatWidget
            icon={<ClipboardList className="w-5 h-5 text-sky-600" />}
            label="משימות פעילות"
            value={assignments.length}
            color="bg-sky-100"
          />
          <StatWidget
            icon={<FileText className="w-5 h-5 text-violet-600" />}
            label="מבחנים קרובים"
            value={exams.length}
            color="bg-violet-100"
          />
          <StatWidget
            icon={<BellRing className="w-5 h-5 text-amber-600" />}
            label="הודעות שפורסמו"
            value={announcements.length}
            color="bg-amber-100"
          />
          <StatWidget
            icon={<Calendar className="w-5 h-5 text-teal-600" />}
            label="שיעורים היום"
            value={todayLessons.length}
            color="bg-teal-100"
          />
        </div>

        {/* Today's lessons */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-gray-800">היום שלי כמורה</h2>
            <span className="text-xs text-gray-400 mr-auto">{todayDateHebrew()}</span>
          </div>

          {todayLessons.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">אין שיעורים היום</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayLessons.map((lesson) => {
                const cls = getClass(lesson.classId);
                const isMyLesson = lesson.teacherName === activeUser.fullName;
                return (
                  <div
                    key={lesson.id}
                    className={`flex items-center gap-4 p-3 rounded-xl border ${
                      isMyLesson
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <div className="text-center min-w-[52px]">
                      <p className="text-xs font-bold text-gray-600">{lesson.startTime}</p>
                      <p className="text-xs text-gray-400">{lesson.endTime}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${isMyLesson ? 'text-emerald-800' : 'text-gray-700'}`}>
                        {lesson.subject}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {cls?.name ?? lesson.classId}
                        {lesson.room ? ` · ${lesson.room}` : ''}
                      </p>
                    </div>
                    {isMyLesson && (
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                        השיעור שלך
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-gray-400 flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs">{lesson.period}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Attention needed */}
        {(nextExam || urgentAssignment || importantMessage) && (
          <section className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-gray-800">מה דורש תשומת לב</h2>
            </div>
            <div className="space-y-3">
              {nextExam && (
                <div className="flex items-start gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
                  <FileText className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-violet-800">מבחן קרוב</p>
                    <p className="text-xs text-violet-700 mt-0.5">
                      {nextExam.subject} — {nextExam.dateLabel}
                    </p>
                    <p className="text-xs text-violet-600 mt-0.5">
                      {nextExam.topics.join(', ')}
                    </p>
                  </div>
                </div>
              )}
              {urgentAssignment && (
                <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <ClipboardList className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-rose-800">משימה דחופה</p>
                    <p className="text-xs text-rose-700 mt-0.5">
                      {urgentAssignment.title} — {urgentAssignment.subject}
                    </p>
                    <p className="text-xs text-rose-600 mt-0.5">
                      מועד: {urgentAssignment.dueDate}
                    </p>
                  </div>
                </div>
              )}
              {importantMessage && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <MessageSquare className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">הודעה חשובה</p>
                    <p className="text-xs text-amber-700 mt-0.5">{importantMessage.title}</p>
                    <p className="text-xs text-amber-600 mt-0.5">{importantMessage.teacherName}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Action cards */}
        <section>
          <h2 className="text-base font-bold text-gray-700 mb-3">פעולות מהירות</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <ActionCard
              icon={<Users className="w-5 h-5 text-emerald-600" />}
              title="הכיתות שלי"
              description={teacherClasses.length > 0
                ? teacherClasses.map((c) => c.name).join(', ')
                : 'אין כיתות משויכות'
              }
              color="bg-emerald-100"
              onClick={() => onNavigate({ id: 'placeholder', title: 'הכיתות שלי — בקרוב' })}
            />
            <ActionCard
              icon={<ClipboardList className="w-5 h-5 text-sky-600" />}
              title="יצירת משימה"
              description="הוסף משימה חדשה לכיתה"
              color="bg-sky-100"
              badge="בקרוב"
              onClick={() => onNavigate({ id: 'placeholder', title: 'יצירת משימה — בקרוב' })}
            />
            <ActionCard
              icon={<MessageSquare className="w-5 h-5 text-violet-600" />}
              title="יצירת הודעה"
              description="שלח הודעה לכיתה או לשכבה"
              color="bg-violet-100"
              badge="בקרוב"
              onClick={() => onNavigate({ id: 'placeholder', title: 'יצירת הודעה — בקרוב' })}
            />
            <ActionCard
              icon={<FileText className="w-5 h-5 text-rose-600" />}
              title="יצירת מבחן"
              description="הגדר מבחן חדש לכיתה"
              color="bg-rose-100"
              badge="בקרוב"
              onClick={() => onNavigate({ id: 'placeholder', title: 'יצירת מבחן — בקרוב' })}
            />
            <ActionCard
              icon={<BookMarked className="w-5 h-5 text-amber-600" />}
              title="חומרי לימוד"
              description="ספריית משאבים ומצגות"
              color="bg-amber-100"
              badge="בקרוב"
              onClick={() => onNavigate({ id: 'placeholder', title: 'חומרי לימוד — בקרוב' })}
            />
            <ActionCard
              icon={<Library className="w-5 h-5 text-teal-600" />}
              title="מערכת השעות שלי"
              description="צפייה במערכת השעות השבועית"
              color="bg-teal-100"
              badge="בקרוב"
              onClick={() => onNavigate({ id: 'placeholder', title: 'מערכת השעות שלי — בקרוב' })}
            />
          </div>
        </section>

        {/* Classes detail */}
        {teacherClasses.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-gray-800">הכיתות שלי</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teacherClasses.map((cls) => {
                const classExams = exams.filter((e) => e.classId === cls.id);
                const classAssignments = assignments.filter((a) => a.classId === cls.id);
                return (
                  <div key={cls.id} className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base font-extrabold text-emerald-800">{cls.name}</span>
                      {activeUser.homeroomClassId === cls.id && (
                        <span className="bg-emerald-200 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                          כיתת אם
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs text-emerald-700">
                      <span>{classAssignments.length} משימות</span>
                      <span>{classExams.length} מבחנים</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
