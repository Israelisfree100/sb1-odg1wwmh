import React, { useMemo } from 'react';
import { ChevronRight, LogOut, BookOpen, Clock, MapPin, Star, Calendar, Package, AlertCircle, CheckCircle2, PartyPopper } from 'lucide-react';
import type { User, TimetableEntry } from '../types';
import {
  getTodayTimetable,
  getDailyInfo,
  getAssignments,
  getCompletedAssignmentIds,
  getSchool,
  getClass,
  getInitials,
} from '../utils/dataHelpers';

// ─── Types ────────────────────────────────────────────────────────────────────

type LessonStatus = 'ended' | 'now' | 'next' | 'later';

interface LessonWithStatus extends TimetableEntry {
  status: LessonStatus;
}

interface Props {
  activeUser: User;
  onBack: () => void;
  onLogout: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const MONTHS_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

function getHebrewDate(): string {
  const now = new Date();
  return `יום ${DAYS_HE[now.getDay()]}, ${now.getDate()} ב${MONTHS_HE[now.getMonth()]} ${now.getFullYear()}`;
}

function toMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
}

function computeLessonStatuses(entries: TimetableEntry[]): LessonWithStatus[] {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // "next" badge only applies to real lessons, not break slots
  const nextIdx = entries.findIndex(
    (e) => !e.isBreak && toMinutes(e.startTime) > nowMinutes,
  );

  return entries.map((e, i) => {
    const start = toMinutes(e.startTime);
    const end = toMinutes(e.endTime);
    let status: LessonStatus;
    if (nowMinutes >= end) {
      status = 'ended';
    } else if (nowMinutes >= start) {
      status = 'now';
    } else if (!e.isBreak && i === nextIdx) {
      status = 'next';
    } else {
      status = 'later';
    }
    return { ...e, status };
  });
}

// ─── Subject colours (static classes — Tailwind will scan) ────────────────────

type ColourSet = { bg: string; text: string; border: string; icon: string };

const SUBJECT_COLOURS: Record<string, ColourSet> = {
  חשבון: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'bg-blue-100' },
  מתמטיקה: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'bg-blue-100' },
  גאומטריה: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: 'bg-indigo-100' },
  שפה: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: 'bg-orange-100' },
  עברית: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: 'bg-orange-100' },
  אנגלית: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'bg-emerald-100' },
  מדעים: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: 'bg-purple-100' },
  תורה: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'bg-amber-100' },
  'חינוך גופני': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: 'bg-rose-100' },
  ספורט: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: 'bg-rose-100' },
  מוזיקה: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', icon: 'bg-pink-100' },
  אמנות: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'bg-amber-100' },
  'כישורי חיים': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: 'bg-teal-100' },
  'מבחן חשבון': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'bg-red-100' },
};

const DEFAULT_COLOUR: ColourSet = {
  bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: 'bg-gray-100',
};

function getColour(subject: string): ColourSet {
  return SUBJECT_COLOURS[subject] ?? DEFAULT_COLOUR;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LessonStatus }) {
  if (status === 'ended') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2.5 py-0.5">
        <CheckCircle2 className="w-3 h-3" />
        הסתיים
      </span>
    );
  }
  if (status === 'now') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-0.5 animate-pulse">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
        עכשיו
      </span>
    );
  }
  if (status === 'next') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 bg-sky-100 rounded-full px-2.5 py-0.5">
        <Clock className="w-3 h-3" />
        השיעור הבא
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full px-2.5 py-0.5">
      בהמשך היום
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DailyScheduleScreen({ activeUser, onBack, onLogout }: Props) {
  const school = getSchool(activeUser.schoolId);
  const cls = activeUser.classId ? getClass(activeUser.classId) : undefined;
  const initials = getInitials(activeUser.fullName);

  const todayLessons = useMemo(
    () => computeLessonStatuses(getTodayTimetable(activeUser.classId ?? '')),
    [activeUser.classId],
  );

  const dailyInfo = getDailyInfo(activeUser.classId ?? '');

  const todayAssignments = useMemo(() => {
    const all = getAssignments(activeUser.classId ?? '');
    const done = getCompletedAssignmentIds(activeUser.id);
    return all.filter((a) => a.dueDate === 'היום' && !done.includes(a.id));
  }, [activeUser.classId, activeUser.id]);

  const mostImportant = useMemo(() => {
    const urgent = todayAssignments.find((a) => a.priority === 'high');
    return urgent ?? todayAssignments[0] ?? null;
  }, [todayAssignments]);

  const importantMessage: string = mostImportant
    ? `${mostImportant.subject}: ${mostImportant.title}`
    : (dailyInfo?.reminder ?? 'נתראה היום בכיתה — יהיה יום נהדר! ✨');

  const lastLesson = todayLessons[todayLessons.length - 1];
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const schoolDayEnded =
    !lastLesson || nowMinutes >= toMinutes(lastLesson.endTime);

  const hebrewDate = getHebrewDate();

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50">
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
            <p className="font-bold text-gray-800 text-sm">היום שלי</p>
            {school && (
              <p className="text-xs text-gray-400 truncate">{school.name}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs select-none">
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
        {/* ── Date & Info card ── */}
        <div className="bg-gradient-to-l from-sky-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sky-100 text-sm font-medium">{hebrewDate}</p>
              <h2 className="text-xl font-bold mt-0.5">
                {activeUser.firstName} — {cls?.name ?? 'כיתה'}
              </h2>
              {school && (
                <p className="text-sky-200 text-sm mt-0.5">{school.name}</p>
              )}
            </div>
            <div className="text-left">
              <p className="text-sky-100 text-xs font-medium">שיעורים היום</p>
              <p className="text-3xl font-bold">{todayLessons.filter((l) => !l.isBreak).length}</p>
            </div>
          </div>
        </div>

        {/* ── Most important today ── */}
        <div className="bg-gradient-to-l from-amber-400 to-orange-400 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 fill-white" />
            <span className="font-bold text-sm">הדבר הכי חשוב להיום</span>
          </div>
          <p className="text-white font-semibold text-base leading-snug">
            {importantMessage}
          </p>
        </div>

        {/* ── School day ended banner ── */}
        {schoolDayEnded && todayLessons.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3">
            <PartyPopper className="w-7 h-7 text-emerald-500 shrink-0" />
            <div>
              <p className="font-bold text-emerald-800">יום הלימודים הסתיים להיום!</p>
              <p className="text-emerald-600 text-sm mt-0.5">כל הכבוד! עכשיו זמן לנוח ולטפל בשיעורי הבית 🎉</p>
            </div>
          </div>
        )}

        {/* ── Timetable ── */}
        <section>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            מערכת שעות היום
          </h3>

          {todayLessons.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <p className="text-4xl mb-3">😴</p>
              <p className="font-bold text-gray-700">אין שיעורים מוזנים להיום</p>
              <p className="text-sm text-gray-400 mt-1">נתראה ביום הלימודים הבא!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayLessons.map((lesson, idx) => {
                // ── Break card ─────────────────────────────────────────────
                if (lesson.isBreak) {
                  const isNow = lesson.status === 'now';
                  const isBig = lesson.subject.includes('גדולה') || lesson.subject.includes('אוכל');
                  return (
                    <div
                      key={lesson.id}
                      className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border transition-all ${
                        isNow
                          ? 'bg-yellow-50 border-yellow-200 ring-1 ring-yellow-100'
                          : lesson.status === 'ended'
                          ? 'bg-gray-50 border-gray-100 opacity-55'
                          : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base select-none shrink-0">
                          {isBig ? '🍎' : '☕'}
                        </span>
                        <p className={`text-sm font-semibold truncate ${isNow ? 'text-yellow-800' : 'text-gray-500'}`}>
                          {lesson.subject}
                          {isNow && (
                            <span className="mr-2 text-xs font-bold text-yellow-600 animate-pulse"> ● עכשיו</span>
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 tabular-nums shrink-0">
                        {lesson.startTime}–{lesson.endTime}
                      </p>
                    </div>
                  );
                }

                // ── Regular lesson card ────────────────────────────────────
                const col = getColour(lesson.subject);
                const isNow = lesson.status === 'now';
                const lessonNum = todayLessons.slice(0, idx + 1).filter((e) => !e.isBreak).length;
                return (
                  <div
                    key={lesson.id}
                    className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
                      isNow
                        ? 'border-emerald-300 ring-2 ring-emerald-200'
                        : lesson.status === 'ended'
                        ? 'border-gray-100 opacity-70'
                        : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${col.bg} ${col.text}`}
                          >
                            {lesson.subject}
                          </span>
                          <StatusBadge status={lesson.status} />
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                          {lesson.teacherName}
                        </p>
                        {lesson.room && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {/^\d+$/.test(lesson.room) ? `כיתה ${lesson.room}` : lesson.room}
                          </p>
                        )}
                      </div>
                      <div className="text-left shrink-0">
                        <p
                          className={`text-sm font-bold tabular-nums ${
                            isNow ? 'text-emerald-700' : 'text-gray-700'
                          }`}
                        >
                          {lesson.startTime}
                        </p>
                        <p className="text-xs text-gray-400 tabular-nums">
                          עד {lesson.endTime}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          שיעור {lessonNum}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Items to bring ── */}
        {dailyInfo && dailyInfo.itemsToBring.length > 0 && (
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-violet-500" />
              מה להביא מחר
            </h3>
            <ul className="space-y-1.5">
              {dailyInfo.itemsToBring.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Homework due today ── */}
        {dailyInfo && dailyInfo.homeworkDueToday.length > 0 && (
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              שיעורי בית להיום
            </h3>
            <ul className="space-y-1.5">
              {dailyInfo.homeworkDueToday.map((hw) => (
                <li key={hw} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  {hw}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Upcoming event ── */}
        {dailyInfo?.upcomingEvent && (
          <section className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
            <h3 className="font-bold text-indigo-800 flex items-center gap-2 mb-1.5">
              <Calendar className="w-4 h-4" />
              אירוע קרוב
            </h3>
            <p className="text-sm text-indigo-700">{dailyInfo.upcomingEvent}</p>
          </section>
        )}

        <div className="h-6" />
      </main>
    </div>
  );
}
