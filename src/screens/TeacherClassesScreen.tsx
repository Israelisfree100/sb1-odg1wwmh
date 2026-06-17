import React, { useMemo, useState } from 'react';
import {
  ChevronRight,
  LogOut,
  Users,
  ClipboardList,
  FileText,
  MessageSquare,
  Calendar,
  ChevronLeft,
} from 'lucide-react';
import type { User, AppScreen } from '../types';
import { getSchool, getInitials, getClass } from '../utils/dataHelpers';
import { getTeacherClasses } from '../utils/roleHelpers';
import { getAssignmentsForClass } from '../services/assignmentRepository';
import { getExamsForClass } from '../services/examRepository';
import { getClassMessagesForClass } from '../services/classMessageRepository';
import { USERS } from '../data/schools';
import { TIMETABLE_ENTRIES } from '../data/mockData';

interface Props {
  activeUser: User;
  onNavigate: (screen: AppScreen) => void;
  onBack: () => void;
  onLogout: () => void;
}

function todayDayOfWeek() {
  const raw = new Date().getDay();
  return raw >= 5 ? 0 : raw;
}

export function TeacherClassesScreen({ activeUser, onNavigate, onBack, onLogout }: Props) {
  const school = useMemo(() => getSchool(activeUser.schoolId), [activeUser.schoolId]);
  const classes = useMemo(() => getTeacherClasses(activeUser), [activeUser]);
  const initials = getInitials(activeUser.fullName);

  const classStats = useMemo(() =>
    classes.map((cls) => {
      const students = USERS.filter((u) => u.classId === cls.id && u.role === 'student');
      const assignments = getAssignmentsForClass(cls.id);
      const exams = getExamsForClass(cls.id, activeUser.schoolId);
      const messages = getClassMessagesForClass(cls.id);
      const day = todayDayOfWeek();
      const todayLessons = TIMETABLE_ENTRIES.filter(
        (e) => e.classId === cls.id && e.dayOfWeek === day && !e.isBreak,
      );
      const myLessons = todayLessons.filter((e) => e.teacherName === activeUser.fullName);
      return { cls, students, assignments, exams, messages, todayLessons, myLessons };
    }),
  [classes, activeUser]);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors text-sm">
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">לוח מורה</span>
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <div>
              <p className="text-sm font-bold text-gray-800">הכיתות שלי</p>
              <p className="text-xs text-gray-500">{school?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <button onClick={onLogout} aria-label="יציאה" className="text-gray-400 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-rose-50">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-xl font-extrabold text-gray-800">
          הכיתות שלי ({classes.length})
        </h1>

        {classes.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">לא משויכות אליך כיתות</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {classStats.map(({ cls, students, assignments, exams, messages, myLessons }) => (
            <button
              key={cls.id}
              onClick={() => onNavigate({ id: 'teacher-class-detail', classId: cls.id })}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-right hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold text-emerald-700">{cls.name}</span>
                  {activeUser.homeroomClassId === cls.id && (
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">כיתת אם</span>
                  )}
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors mt-0.5" />
              </div>

              <p className="text-xs text-gray-500 mb-3">
                שכבה {cls.grade} · {activeUser.subjects?.filter(s => {
                  // find if this teacher teaches this subject in this class from timetable
                  return TIMETABLE_ENTRIES.some(e => e.classId === cls.id && e.teacherName === activeUser.fullName && e.subject === s);
                }).join(', ') || activeUser.subjects?.join(', ')}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-2">
                  <Users className="w-3.5 h-3.5 text-sky-500" />
                  <span className="text-gray-600">{students.length} תלמידים</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-2">
                  <ClipboardList className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-gray-600">{assignments.length} משימות</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-2">
                  <FileText className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-gray-600">{exams.length} מבחנים</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-2">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-gray-600">{messages.length} הודעות</span>
                </div>
              </div>

              {myLessons.length > 0 && (
                <div className="mt-3 bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700">
                      {myLessons.length} שיעורים שלי היום
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {myLessons.map(l => `${l.subject} ${l.startTime}`).join(' · ')}
                  </p>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-500 mb-3">פעולות מהירות</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigate({ id: 'teacher-assignments' })}
              className="flex items-center gap-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl px-3 py-2 text-xs font-semibold hover:bg-sky-100 transition-colors"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              ניהול משימות
            </button>
            <button
              onClick={() => onNavigate({ id: 'teacher-class-messages' })}
              className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl px-3 py-2 text-xs font-semibold hover:bg-amber-100 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              ניהול הודעות
            </button>
            <button
              onClick={() => onNavigate({ id: 'teacher-exams' })}
              className="flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl px-3 py-2 text-xs font-semibold hover:bg-violet-100 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              ניהול מבחנים
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Class Detail Screen ──────────────────────────────────────────────────────

interface DetailProps {
  activeUser: User;
  classId: string;
  onNavigate: (screen: AppScreen) => void;
  onBack: () => void;
  onLogout: () => void;
}

type DetailTab = 'students' | 'assignments' | 'exams' | 'messages' | 'timetable';

export function TeacherClassDetailScreen({
  activeUser,
  classId,
  onNavigate,
  onBack,
  onLogout,
}: DetailProps) {
  const [tab, setTab] = useState<DetailTab>('students');
  const school = useMemo(() => getSchool(activeUser.schoolId), [activeUser.schoolId]);
  const cls = useMemo(() => getClass(classId), [classId]);
  const students = useMemo(
    () => USERS.filter((u) => u.classId === classId && u.role === 'student'),
    [classId],
  );
  const assignments = useMemo(() => getAssignmentsForClass(classId), [classId]);
  const exams = useMemo(() => getExamsForClass(classId, activeUser.schoolId), [classId, activeUser.schoolId]);
  const messages = useMemo(() => getClassMessagesForClass(classId), [classId]);
  const todayTimetable = useMemo(() => {
    const day = todayDayOfWeek();
    return TIMETABLE_ENTRIES.filter(
      (e) => e.classId === classId && e.dayOfWeek === day,
    ).sort((a, b) => a.period - b.period);
  }, [classId]);

  const initials = getInitials(activeUser.fullName);

  if (!cls) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">כיתה לא נמצאה</p>
          <button onClick={onBack} className="text-emerald-600 underline text-sm">חזרה</button>
        </div>
      </div>
    );
  }

  const TAB_LABELS: { id: DetailTab; label: string }[] = [
    { id: 'students', label: 'תלמידים' },
    { id: 'assignments', label: 'משימות' },
    { id: 'exams', label: 'מבחנים' },
    { id: 'messages', label: 'הודעות' },
    { id: 'timetable', label: 'מערכת היום' },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 font-sans">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors text-sm">
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">הכיתות שלי</span>
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <div>
              <p className="text-sm font-bold text-gray-800">כיתה {cls.name}</p>
              <p className="text-xs text-gray-500">{school?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <button onClick={onLogout} className="text-gray-400 hover:text-rose-500 transition-colors p-1.5">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Class identity */}
        <div className="bg-gradient-to-l from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold">{cls.name}</h1>
              <p className="text-sm opacity-80 mt-0.5">שכבה {cls.grade} · {activeUser.subjects?.join(', ')}</p>
            </div>
            {activeUser.homeroomClassId === cls.id && (
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">כיתת אם</span>
            )}
          </div>
          <div className="flex gap-4 mt-3 text-sm">
            <span>{students.length} תלמידים</span>
            <span>{assignments.length} משימות</span>
            <span>{exams.length} מבחנים</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate({ id: 'teacher-assignments' })}
            className="flex items-center gap-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl px-3 py-2 text-xs font-bold hover:bg-sky-100 transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            יצירת משימה
          </button>
          <button
            onClick={() => onNavigate({ id: 'teacher-class-messages' })}
            className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold hover:bg-amber-100 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            יצירת הודעה
          </button>
          <button
            onClick={() => onNavigate({ id: 'teacher-exams' })}
            className="flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl px-3 py-2 text-xs font-bold hover:bg-violet-100 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            יצירת מבחן
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm overflow-x-auto">
          {TAB_LABELS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                tab === t.id
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'students' && (
          <div className="space-y-2">
            {students.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>אין תלמידי דמו לכיתה זו</p>
              </div>
            ) : (
              students.map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-sm font-bold flex-shrink-0">
                    {getInitials(s.fullName)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{s.fullName}</p>
                    <p className="text-xs text-gray-400">{s.username}</p>
                  </div>
                </div>
              ))
            )}
            <p className="text-xs text-gray-400 text-center mt-2">* מוצגים תלמידי הדמו בלבד</p>
          </div>
        )}

        {tab === 'assignments' && (
          <div className="space-y-2">
            {assignments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>אין משימות לכיתה זו</p>
              </div>
            ) : (
              assignments.map((a) => (
                <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">{a.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.subject} · {a.teacherName}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      a.priority === 'high' ? 'bg-rose-100 text-rose-700'
                      : a.priority === 'medium' ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                    }`}>
                      {a.priority === 'high' ? 'דחופה' : a.priority === 'medium' ? 'חשובה' : 'רגילה'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">מועד: {a.dueDate}</p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'exams' && (
          <div className="space-y-2">
            {exams.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>אין מבחנים לכיתה זו</p>
              </div>
            ) : (
              exams.map((e) => (
                <div key={e.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
                  <p className="text-sm font-bold text-gray-800">{e.subject}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{e.dateLabel} · {e.teacherName}</p>
                  <p className="text-xs text-gray-400 mt-1">{e.topics.join(', ')}</p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'messages' && (
          <div className="space-y-2">
            {messages.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>אין הודעות לכיתה זו</p>
              </div>
            ) : (
              messages.slice(0, 10).map((m) => (
                <div key={m.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">{m.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{m.teacherName} · {m.publishedAt}</p>
                    </div>
                    {m.isImportant && (
                      <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">חשוב</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'timetable' && (
          <div className="space-y-2">
            {todayTimetable.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>אין שיעורים היום</p>
              </div>
            ) : (
              todayTimetable.map((e) => (
                <div key={e.id} className={`rounded-xl border shadow-sm px-4 py-3 flex items-center gap-3 ${
                  e.isBreak ? 'bg-yellow-50 border-yellow-100' : 
                  e.teacherName === activeUser.fullName ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100'
                }`}>
                  <div className="text-center w-14 flex-shrink-0">
                    <p className="text-xs font-bold text-gray-600">{e.startTime}</p>
                    <p className="text-xs text-gray-400">{e.endTime}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${e.isBreak ? 'text-amber-700' : 'text-gray-800'}`}>{e.subject}</p>
                    {!e.isBreak && <p className="text-xs text-gray-500 truncate">{e.teacherName}{e.room ? ` · ${e.room}` : ''}</p>}
                  </div>
                  {e.teacherName === activeUser.fullName && !e.isBreak && (
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">שלך</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
