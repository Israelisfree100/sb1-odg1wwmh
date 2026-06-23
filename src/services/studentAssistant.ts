/**
 * Rule-based student assistant service.
 * Answers Hebrew questions using real application data for the active student.
 * Replace askAssistant() with an API call when ready to connect a real LLM.
 */
import type { User, TimetableEntry } from '../types';
import {
  getTodayTimetable,
  getTomorrowTimetable,
  getNextLesson,
  getDailyInfo,
  getAssignments,
  getCompletedAssignmentIds,
  getIncompleteAssignments,
  getNextExam,
  getClassMessages,
  getMergedLostFoundItems,
  getSubjectRoom,
  getSchoolDayStart,
  getClass,
} from '../utils/dataHelpers';
import { isRagSchool, RAG_SUBJECT_TEACHERS } from '../data/ragSchoolInfo';
import { TIMETABLE_ENTRIES } from '../data/mockData';

// ─── Internal helpers ─────────────────────────────────────────────────────────

function contains(q: string, ...words: string[]): boolean {
  return words.some((w) => q.includes(w));
}

function fmtLesson(l: TimetableEntry): string {
  if (l.isBreak) return `${l.startTime}–${l.endTime}  ${l.subject}`;
  const room = l.room ? ` | ${l.room}` : '';
  const teacher = l.teacherName ? ` (${l.teacherName})` : '';
  return `${l.startTime}–${l.endTime}  ${l.subject}${teacher}${room}`;
}

function lookupSubjectTeacher(user: User, subject: string): string | undefined {
  if (isRagSchool(user.schoolId) && RAG_SUBJECT_TEACHERS[subject]) {
    return RAG_SUBJECT_TEACHERS[subject];
  }
  const classId = user.classId ?? '';
  const entry = TIMETABLE_ENTRIES.find(
    (e) => e.classId === classId && e.subject === subject && !e.isBreak && e.teacherName,
  );
  return entry?.teacherName;
}

// ─── Answer generators ────────────────────────────────────────────────────────

function answerToday(user: User): string {
  const all = getTodayTimetable(user.classId ?? '');
  const lessons = all.filter((l) => !l.isBreak);
  if (lessons.length === 0)
    return 'לא נמצאו שיעורים להיום. אולי זה יום חופש? 😎';
  const list = lessons.map((l) => `• ${fmtLesson(l)}`).join('\n');
  return `השיעורים שלך היום (${lessons.length} סה"כ):\n${list}`;
}

function answerTomorrow(user: User): string {
  const all = getTomorrowTimetable(user.classId ?? '');
  const lessons = all.filter((l) => !l.isBreak);
  if (lessons.length === 0)
    return 'לא נמצאו שיעורים למחר.';
  const list = lessons.map((l) => `• ${fmtLesson(l)}`).join('\n');
  return `השיעורים שלך מחר (${lessons.length} סה"כ):\n${list}`;
}

function answerSchoolStart(user: User): string {
  const start = getSchoolDayStart(user.classId ?? '');
  if (!start) return 'לא נמצאה שעת התחלה ליום הלימודים.';
  return `יום הלימודים מתחיל בשעה ${start}. 🌅`;
}

function answerBreak(user: User, big: boolean): string {
  const entries = getTodayTimetable(user.classId ?? '');
  if (big) {
    const b = entries.find(
      (e) => e.isBreak && (e.subject.includes('גדולה') || e.subject.includes('אוכל')),
    );
    if (b) return `הפסקת האוכל והפסקה הגדולה היא בין ${b.startTime} ל-${b.endTime} 🍎`;
    return 'לא נמצאה הפסקה גדולה ברשומות היום.';
  }
  const b = entries.find(
    (e) => e.isBreak && e.subject.includes('קטנה'),
  );
  if (b) return `ההפסקה הקטנה היא בין ${b.startTime} ל-${b.endTime} ☕`;
  const anyBreak = entries.find((e) => e.isBreak);
  if (anyBreak) return `ההפסקה היא בין ${anyBreak.startTime} ל-${anyBreak.endTime}.`;
  return 'לא נמצאה הפסקה קטנה ברשומות היום.';
}

function answerSchoolEnd(user: User): string {
  const lessons = getTodayTimetable(user.classId ?? '').filter((l) => !l.isBreak);
  if (!lessons.length) return 'לא נמצאו שיעורים היום.';
  const last = lessons[lessons.length - 1];
  return `יום הלימודים מסתיים בשעה ${last.endTime}. 🎒`;
}

function answerFirstLesson(user: User): string {
  const lessons = getTodayTimetable(user.classId ?? '').filter((l) => !l.isBreak);
  if (!lessons.length) return 'אין שיעורים מוזנים להיום.';
  const first = lessons[0];
  return `השיעור הראשון היום הוא ${first.subject} בשעה ${first.startTime}${first.teacherName ? ` עם ${first.teacherName}` : ''}${first.room ? ` ב${first.room}` : ''}.`;
}

function answerHomeroomTeacher(user: User): string {
  const cls = user.classId ? getClass(user.classId) : undefined;
  if (cls?.teacherName) return `המחנכת שלך היא ${cls.teacherName}. 👩‍🏫`;
  return 'לא נמצאה מחנכת לכיתה שלך.';
}

function answerSubjectTeacher(user: User, subject: string, label: string): string {
  const teacher = lookupSubjectTeacher(user, subject);
  if (teacher) return `${label} מלמד/ת ${subject}: ${teacher}.`;
  return `לא נמצא מורה ל${subject} במערכת.`;
}

function answerSubjectLocation(user: User, subject: string): string {
  const aliases = subject === 'ספורט' ? ['ספורט', 'חינוך גופני'] : [subject];
  for (const sub of aliases) {
    const room = getSubjectRoom(user.classId ?? '', sub);
    if (room) {
      const display = subject === 'ספורט' ? 'חינוך גופני (ספורט)' : subject;
      return `שיעור ${display} מתקיים ב${room}.`;
    }
  }
  return `שיעור ${subject} מתקיים בכיתה.`;
}

function answerLibraryReturn(user: User): string {
  const info = getDailyInfo(user.classId ?? '');
  if (info?.reminder.includes('ספרייה')) return `תזכורת: ${info.reminder}`;
  return 'את הספר לספרייה יש להחזיר עד יום רביעי, לפני שיעור הספרייה.';
}

function answerNextLesson(user: User): string {
  const next = getNextLesson(user.classId ?? '');
  if (!next) return 'כל השיעורים להיום הסתיימו! 🎉 כל הכבוד, שיהיה לך יום נהדר!';
  return `השיעור הבא שלך:\n• ${fmtLesson(next)}`;
}

function answerBringItems(user: User): string {
  const info = getDailyInfo(user.classId ?? '');
  if (!info?.itemsToBring.length)
    return 'לא נמצאו פריטים מיוחדים להביא מחר.';
  return `מה להביא מחר:\n${info.itemsToBring.map((i) => `• ${i}`).join('\n')}`;
}

function answerHomework(user: User): string {
  const incomplete = getIncompleteAssignments(
    user.classId ?? '',
    user.id,
  );
  if (incomplete.length === 0)
    return '🌟 מדהים! אין לך שיעורי בית פתוחים כרגע. כל הכבוד!';
  const list = incomplete
    .map((a) => `• ${a.subject}: ${a.title} (עד ${a.dueDate})`)
    .join('\n');
  return `שיעורי הבית הפתוחים שלך:\n${list}`;
}

function answerRemainingTasks(user: User): string {
  const all = getAssignments(user.classId ?? '');
  const done = getCompletedAssignmentIds(user.id);
  const n = all.filter((a) => !done.includes(a.id)).length;
  if (n === 0) return '🎉 אין לך משימות פתוחות כרגע! כל הכבוד!';
  return `נשארו לך ${n} מתוך ${all.length} משימות לסיים.`;
}

function answerNextExam(user: User): string {
  const exam = getNextExam(user.classId ?? '', user.schoolId);
  if (!exam) return 'לא נמצא מבחן קרוב. שמור/י על השקט 😊';
  return (
    `המבחן הבא שלך:\n` +
    `📚 מקצוע: ${exam.subject}\n` +
    `📅 תאריך: ${exam.dateLabel}\n` +
    `📝 נושאים: ${exam.topics.join(', ')}`
  );
}

function answerImportantMessage(user: User): string {
  const msgs = getClassMessages(user.classId ?? '').filter(
    (m) => m.isImportant,
  );
  if (msgs.length === 0) return 'אין הודעות חשובות כרגע 😊';
  const m = msgs[0];
  return (
    `הודעה חשובה מ${m.teacherName} (${m.publishedAt}):\n` +
    `📢 ${m.title}\n\n${m.content}`
  );
}

function answerLostFoundSearch(user: User, q: string): string | null {
  const openFound = getMergedLostFoundItems(user.schoolId).filter(
    (i) => i.status === 'open' && i.reportType === 'found',
  );
  const qWords = q.split(/\s+/).filter((w) => w.length >= 2);
  const matches = openFound.filter((item) => {
    const text = `${item.itemName} ${item.description} ${item.color ?? ''}`.toLowerCase();
    return qWords.some((word) => text.includes(word));
  });
  if (matches.length > 0) {
    const list = matches
      .map(
        (i) =>
          `• ${i.itemName}${i.color ? ` (${i.color})` : ''} — ${i.location}, ${i.date}`,
      )
      .join('\n');
    return `מצאתי פריטים רלוונטיים באבדות ומציאות:\n${list}\n\nכנסו למסך "אבדות ומציאות" לפרטים נוספים.`;
  }
  return null;
}

function answerLostFoundCount(user: User): string {
  const open = getMergedLostFoundItems(user.schoolId).filter(
    (i) => i.status === 'open',
  ).length;
  return `כרגע יש ${open} פריטים פתוחים באבדות ומציאות בבית הספר שלך. כנסו למסך "אבדות ומציאות" לפרטים.`;
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function askAssistant(user: User, question: string): string {
  const q = question.trim();
  const ql = q.toLowerCase();

  // School day start
  if (contains(ql, 'מתי מתחיל', 'מתחיל היום', 'שעת התחלה', 'מתי מתחילים')) {
    return answerSchoolStart(user);
  }

  // Homeroom teacher
  if (contains(ql, 'מי המחנכת', 'מי המחנך', 'מי המורה שלי', 'מי המחנכת שלי')) {
    return answerHomeroomTeacher(user);
  }

  // Subject teachers
  if (contains(ql, 'מי מלמד', 'מי מלמדת') && contains(ql, 'שפה')) {
    return answerSubjectTeacher(user, 'שפה', '');
  }
  if (contains(ql, 'מי מלמד', 'מי מלמדת') && contains(ql, 'אנגלית')) {
    return answerSubjectTeacher(user, 'אנגלית', '');
  }
  if (contains(ql, 'מי מלמד', 'מי מלמדת') && contains(ql, 'מדעים')) {
    return answerSubjectTeacher(user, 'מדעים', '');
  }

  // Tomorrow's schedule
  if (contains(ql, 'מה יש לי מחר', 'מה יש מחר', 'מחר יש', 'לוח מחר')) {
    return answerTomorrow(user);
  }

  // Big break
  if (contains(ql, 'הפסקה גדולה', 'הפסקת אוכל', 'ארוחת הביניים', 'הפסקת צהריים')) {
    return answerBreak(user, true);
  }

  // Small break / generic break
  if (contains(ql, 'הפסקה קטנה')) {
    return answerBreak(user, false);
  }

  // School end time
  if (
    contains(ql, 'מתי נגמר', 'מתי נגמר היום', 'מתי מסתיים', 'מתי גומרים', 'נגמר יום', 'סוף יום', 'מסיים')
  ) {
    return answerSchoolEnd(user);
  }

  // First lesson
  if (contains(ql, 'שיעור ראשון', 'שיעור 1', 'שיעור הראשון', 'שיעור א\'')) {
    return answerFirstLesson(user);
  }

  // Sport location
  if (contains(ql, 'ספורט') && contains(ql, 'איפה', 'היכן', 'מקום', 'כיתה', 'אולם')) {
    return answerSubjectLocation(user, 'ספורט');
  }
  if (contains(ql, 'איפה שיעור ספורט', 'איפה ספורט', 'היכן ספורט')) {
    return answerSubjectLocation(user, 'ספורט');
  }

  // Library return
  if (
    contains(ql, 'להחזיר ספר', 'מחזירים ספר', 'ספר לספרייה', 'להחזיר לספרייה')
  ) {
    return answerLibraryReturn(user);
  }

  // Today's timetable
  if (
    contains(ql, 'מה יש לי היום', 'שיעורים היום', 'מערכת שעות', 'מה יש היום', 'לוח שעות')
  ) {
    return answerToday(user);
  }

  // Next lesson
  if (
    contains(ql, 'שיעור הבא', 'מה השיעור הבא', 'מה עכשיו', 'מה יש עכשיו', 'מה יש אחרי', 'מה הבא')
  ) {
    return answerNextLesson(user);
  }

  // Items to bring
  if (contains(ql, 'להביא מחר', 'מביאים מחר', 'צריך להביא', 'מה להביא')) {
    return answerBringItems(user);
  }

  // Homework / assignments
  if (
    contains(
      ql,
      'שיעורי בית',
      'שעורי בית',
      'שיעור בית',
      'שעור בית',
      'ש.ב',
      'ש"ב',
      'משימות שלי',
    )
  ) {
    return answerHomework(user);
  }

  // Remaining task count
  if (
    contains(
      ql,
      'כמה משימות',
      'כמה נשאר',
      'כמה נשארו',
      'משימות פתוחות',
      'כמה שיעורי בית',
    )
  ) {
    return answerRemainingTasks(user);
  }

  // Next exam
  if (contains(ql, 'מבחן', 'בחינה', 'מבחנים', 'בחינות', 'מתי מבחן')) {
    return answerNextExam(user);
  }

  // Important messages
  if (
    contains(
      ql,
      'הודעה חשובה',
      'הודעות חשובות',
      'הודעה מהמורה',
      'הודעות חדשות',
      'יש הודעה',
    )
  ) {
    return answerImportantMessage(user);
  }

  // Lost & found — count
  if (contains(ql, 'אבדות ומציאות', 'אבדות')) {
    return answerLostFoundCount(user);
  }

  // Lost & found — item search (any Hebrew word in the question)
  const lfResult = answerLostFoundSearch(user, ql);
  if (
    lfResult !== null &&
    contains(
      ql,
      'מצא',
      'נמצא',
      'אבד',
      'הלך',
      'מישהו',
      'קלמר',
      'עפרון',
      'מחברת',
      'תיק',
      'בקבוק',
      'ספר',
      'מעיל',
      'כובע',
      'ציידנית',
      'קופסת',
      'כלי',
      'בגד',
    )
  ) {
    return lfResult;
  }

  if (
    contains(
      ql,
      'מצא',
      'נמצא',
      'אבד',
      'קלמר',
      'עפרון',
      'מחברת',
      'תיק',
      'בקבוק',
      'ספר',
      'מעיל',
      'כובע',
      'ציידנית',
      'קופסת',
    )
  ) {
    return 'לא מצאתי פריט כזה ברשימת האבדות הפתוחות. נסה/י לבדוק ישירות במסך "אבדות ומציאות".';
  }

  return 'עדיין לא למדתי לענות על השאלה הזאת, אבל בקרוב אהיה חכם יותר 🙂';
}
