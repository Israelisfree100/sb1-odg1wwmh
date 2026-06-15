/**
 * Rule-based student assistant service.
 * Answers Hebrew questions using real application data for the active student.
 * Replace askAssistant() with an API call when ready to connect a real LLM.
 */
import type { User, TimetableEntry } from '../types';
import {
  getTodayTimetable,
  getNextLesson,
  getDailyInfo,
  getAssignments,
  getCompletedAssignmentIds,
  getIncompleteAssignments,
  getNextExam,
  getClassMessages,
  getMergedLostFoundItems,
} from '../utils/dataHelpers';

// ─── Internal helpers ─────────────────────────────────────────────────────────

function contains(q: string, ...words: string[]): boolean {
  return words.some((w) => q.includes(w));
}

function fmtLesson(l: TimetableEntry): string {
  const room = l.room ? ` | חדר ${l.room}` : '';
  return `${l.startTime}–${l.endTime}  ${l.subject} (${l.teacherName})${room}`;
}

// ─── Answer generators ────────────────────────────────────────────────────────

function answerToday(user: User): string {
  const lessons = getTodayTimetable(user.classId ?? '');
  if (lessons.length === 0)
    return 'לא נמצאו שיעורים להיום. אולי זה יום חופש? 😎';
  const list = lessons.map((l) => `• ${fmtLesson(l)}`).join('\n');
  return `השיעורים שלך היום (${lessons.length} סה"כ):\n${list}`;
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
  const exam = getNextExam(user.classId ?? '');
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

  // Today's timetable
  if (
    contains(ql, 'מה יש לי היום', 'שיעורים היום', 'מערכת שעות', 'מה יש היום', 'לוח שעות')
  ) {
    return answerToday(user);
  }

  // Next lesson
  if (
    contains(ql, 'שיעור הבא', 'מה עכשיו', 'מה יש עכשיו', 'מה יש אחרי', 'מה הבא')
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
