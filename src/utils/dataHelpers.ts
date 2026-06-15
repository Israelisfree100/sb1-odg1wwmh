import type {
  Announcement,
  TimetableEntry,
  Assignment,
  Exam,
  LostFoundItem,
  User,
  ClassGroup,
  School,
  ClassMessage,
} from '../types';
import {
  TIMETABLE_ENTRIES,
  ASSIGNMENTS,
  EXAMS,
  ANNOUNCEMENTS,
  LOST_FOUND_ITEMS,
  DAILY_INFO,
} from '../data/mockData';
import type { DailyInfo } from '../data/mockData';
import { CLASS_MESSAGES } from '../data/classMessages';
import { SCHOOLS, CLASSES } from '../data/schools';

// ─── School & Class ───────────────────────────────────────────────────────────

export function getSchool(schoolId: string): School | undefined {
  return SCHOOLS.find((s) => s.id === schoolId);
}

export function getClass(classId: string): ClassGroup | undefined {
  return CLASSES.find((c) => c.id === classId);
}

/** Returns the first letter of each word in the name (up to 2 letters). */
export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] ?? '') + (parts[1][0] ?? '');
  return fullName.slice(0, 2);
}

// ─── Timetable ────────────────────────────────────────────────────────────────

/**
 * Returns today's timetable entries sorted by period.
 * Maps Friday (5) and Saturday (6) to Sunday (0) as fallback.
 */
export function getTodayTimetable(classId: string): TimetableEntry[] {
  const raw = new Date().getDay();
  const day = raw >= 5 ? 0 : raw;
  return TIMETABLE_ENTRIES.filter(
    (e) => e.classId === classId && e.dayOfWeek === day,
  ).sort((a, b) => a.period - b.period);
}

// ─── Daily Info ───────────────────────────────────────────────────────────────

export function getDailyInfo(classId: string): DailyInfo | undefined {
  return DAILY_INFO.find((d) => d.classId === classId);
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export function getAssignments(classId: string): Assignment[] {
  return ASSIGNMENTS.filter((a) => a.classId === classId);
}

const ASSIGNMENT_STATUS_PREFIX = 'assignment_status_';

export function getCompletedAssignmentIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(ASSIGNMENT_STATUS_PREFIX + userId);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function toggleAssignmentComplete(
  userId: string,
  assignmentId: string,
): void {
  const current = getCompletedAssignmentIds(userId);
  const updated = current.includes(assignmentId)
    ? current.filter((id) => id !== assignmentId)
    : [...current, assignmentId];
  try {
    localStorage.setItem(
      ASSIGNMENT_STATUS_PREFIX + userId,
      JSON.stringify(updated),
    );
  } catch {
    // ignore
  }
}

// ─── Exams ────────────────────────────────────────────────────────────────────

export function getExams(classId: string): Exam[] {
  return EXAMS.filter((e) => e.classId === classId);
}

export function getNextExam(classId: string): Exam | undefined {
  return EXAMS.find((e) => e.classId === classId);
}

// ─── Announcements ────────────────────────────────────────────────────────────

/**
 * Returns all announcements relevant to the given student:
 * school-wide + matching grade + matching class.
 * Parents-only announcements are excluded for students.
 */
export function getRelevantAnnouncements(user: User): Announcement[] {
  const cls = user.classId ? getClass(user.classId) : undefined;
  return ANNOUNCEMENTS.filter((ann) => {
    if (ann.schoolId !== user.schoolId) return false;
    if (ann.audience === 'parents') return false;
    if (ann.audience === 'school') return true;
    if (ann.audience === 'grade' && cls && ann.targetGrade === cls.grade)
      return true;
    if (ann.audience === 'class' && ann.targetClassId === user.classId)
      return true;
    return false;
  });
}

// ─── Class Messages ───────────────────────────────────────────────────────────

export function getClassMessages(classId: string): ClassMessage[] {
  return CLASS_MESSAGES.filter((m) => m.classId === classId);
}

const READ_MESSAGES_PREFIX = 'class_messages_read_';

export function getReadMessageIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(READ_MESSAGES_PREFIX + userId);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function markMessageRead(userId: string, messageId: string): void {
  const current = getReadMessageIds(userId);
  if (!current.includes(messageId)) {
    try {
      localStorage.setItem(
        READ_MESSAGES_PREFIX + userId,
        JSON.stringify([...current, messageId]),
      );
    } catch {
      // ignore
    }
  }
}

export function markAllMessagesRead(userId: string, messageIds: string[]): void {
  try {
    localStorage.setItem(
      READ_MESSAGES_PREFIX + userId,
      JSON.stringify(messageIds),
    );
  } catch {
    // ignore
  }
}

// ─── Lost & Found ─────────────────────────────────────────────────────────────

export function getLostFoundItems(schoolId: string): LostFoundItem[] {
  const LOCAL_KEY = 'chaveri_lf_' + schoolId;
  let extras: LostFoundItem[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    extras = raw ? (JSON.parse(raw) as LostFoundItem[]) : [];
  } catch {
    extras = [];
  }
  return [
    ...LOST_FOUND_ITEMS.filter((i) => i.schoolId === schoolId),
    ...extras,
  ];
}
