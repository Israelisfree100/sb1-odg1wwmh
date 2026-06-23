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
  LOST_FOUND_ITEMS,
  DAILY_INFO,
} from '../data/mockData';
import type { DailyInfo } from '../data/mockData';
import { SCHOOLS, CLASSES } from '../data/schools';
import {
  getPublishedAnnouncements,
} from '../services/announcementRepository';
import { canUserSeeAnnouncement } from './announcementVisibility';
import { getExamsForClass } from '../services/examRepository';
import { getAssignmentsForClass } from '../services/assignmentRepository';
import { getClassMessagesForClass } from '../services/classMessageRepository';

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
 * Saturday (6) maps to Sunday (0) as fallback — no school on Shabbat.
 */
export function getTodayTimetable(classId: string): TimetableEntry[] {
  const raw = new Date().getDay();
  const day = raw === 6 ? 0 : raw;
  return TIMETABLE_ENTRIES.filter(
    (e) => e.classId === classId && e.dayOfWeek === day,
  ).sort((a, b) => a.period - b.period);
}

/** Returns tomorrow's timetable (handles week wrap). */
export function getTomorrowTimetable(classId: string): TimetableEntry[] {
  const raw = new Date().getDay();
  const tomorrow = raw === 6 ? 0 : raw === 5 ? 6 : raw + 1; // Fri→Sat→Sun wrap
  // If tomorrow is Saturday, show Sunday schedule
  const day = tomorrow === 6 ? 0 : tomorrow;
  return TIMETABLE_ENTRIES.filter(
    (e) => e.classId === classId && e.dayOfWeek === day,
  ).sort((a, b) => a.period - b.period);
}

/** First lesson start time for a class on a given day. */
export function getSchoolDayStart(classId: string, day?: number): string | undefined {
  const d = day ?? (new Date().getDay() === 6 ? 0 : new Date().getDay());
  const lessons = TIMETABLE_ENTRIES.filter(
    (e) => e.classId === classId && e.dayOfWeek === d && !e.isBreak,
  ).sort((a, b) => a.period - b.period);
  return lessons[0]?.startTime;
}

function toMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Returns the next upcoming lesson for today, or undefined if school day ended. */
export function getNextLesson(classId: string): TimetableEntry | undefined {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return getTodayTimetable(classId).find(
    (l) => !l.isBreak && toMinutes(l.startTime) > nowMins,
  );
}

/** Returns the room for the first occurrence of a subject in the class timetable (any day). */
export function getSubjectRoom(classId: string, subject: string): string | undefined {
  return TIMETABLE_ENTRIES.find(
    (e) => e.classId === classId && e.subject === subject,
  )?.room;
}

// ─── Daily Info ───────────────────────────────────────────────────────────────

export function getDailyInfo(classId: string): DailyInfo | undefined {
  return DAILY_INFO.find((d) => d.classId === classId);
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export function getAssignments(classId: string): Assignment[] {
  return getAssignmentsForClass(classId);
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

/** Returns all incomplete assignments for a student. */
export function getIncompleteAssignments(
  classId: string,
  userId: string,
): Assignment[] {
  const all = getAssignments(classId);
  const done = getCompletedAssignmentIds(userId);
  return all.filter((a) => !done.includes(a.id));
}

// ─── Exams ────────────────────────────────────────────────────────────────────

export function getExams(classId: string, schoolId: string): Exam[] {
  return getExamsForClass(classId, schoolId);
}

export function getNextExam(classId: string, schoolId: string): Exam | undefined {
  return getExamsForClass(classId, schoolId)[0];
}

// ─── Announcements ────────────────────────────────────────────────────────────

/**
 * Returns all published announcements visible to the given user.
 * Uses the shared canUserSeeAnnouncement visibility helper.
 * For parents, pass childClassId separately.
 */
export function getRelevantAnnouncements(user: User, childClassId?: string): Announcement[] {
  return getPublishedAnnouncements(user.schoolId).filter((ann) =>
    canUserSeeAnnouncement(user, ann, childClassId),
  );
}

// ─── Class Messages ───────────────────────────────────────────────────────────

export function getClassMessages(classId: string): ClassMessage[] {
  return getClassMessagesForClass(classId);
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

const LF_ITEMS_KEY = 'lost_found_items_';
const LF_DELETED_KEY = 'lost_found_deleted_';

function getLocalLostFoundItems(schoolId: string): LostFoundItem[] {
  try {
    const raw = localStorage.getItem(LF_ITEMS_KEY + schoolId);
    return raw ? (JSON.parse(raw) as LostFoundItem[]) : [];
  } catch {
    return [];
  }
}

function getDeletedLostFoundIds(schoolId: string): string[] {
  try {
    const raw = localStorage.getItem(LF_DELETED_KEY + schoolId);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * Merges static mock data with user-created/modified items from localStorage.
 * Local overrides take precedence over mock items with the same id.
 * Deleted item ids are excluded.
 * Newest user-created items appear first.
 */
export function getMergedLostFoundItems(schoolId: string): LostFoundItem[] {
  const mockItems = LOST_FOUND_ITEMS.filter((i) => i.schoolId === schoolId);
  const localItems = getLocalLostFoundItems(schoolId);
  const deletedIds = getDeletedLostFoundIds(schoolId);

  const mockWithOverrides = mockItems
    .filter((m) => !deletedIds.includes(m.id))
    .map((m) => localItems.find((l) => l.id === m.id) ?? m);

  const pureNewItems = localItems.filter(
    (l) => !mockItems.some((m) => m.id === l.id),
  );

  return [...pureNewItems.slice().reverse(), ...mockWithOverrides];
}

/** Saves a new or updated LostFoundItem to localStorage. */
export function saveLostFoundItem(
  schoolId: string,
  item: LostFoundItem,
): void {
  const current = getLocalLostFoundItems(schoolId);
  const idx = current.findIndex((i) => i.id === item.id);
  const updated =
    idx >= 0
      ? current.map((i, n) => (n === idx ? item : i))
      : [...current, item];
  try {
    localStorage.setItem(LF_ITEMS_KEY + schoolId, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/** Deletes an item — removes from local items and/or marks mock item as deleted. */
export function deleteLostFoundItemById(
  schoolId: string,
  itemId: string,
): void {
  const localItems = getLocalLostFoundItems(schoolId);
  const isLocal = localItems.some((i) => i.id === itemId);
  if (isLocal) {
    const updated = localItems.filter((i) => i.id !== itemId);
    try {
      localStorage.setItem(LF_ITEMS_KEY + schoolId, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  const mockItems = LOST_FOUND_ITEMS.filter((i) => i.schoolId === schoolId);
  if (mockItems.some((i) => i.id === itemId)) {
    const deletedIds = getDeletedLostFoundIds(schoolId);
    if (!deletedIds.includes(itemId)) {
      try {
        localStorage.setItem(
          LF_DELETED_KEY + schoolId,
          JSON.stringify([...deletedIds, itemId]),
        );
      } catch {
        // ignore
      }
    }
  }
}

/** @deprecated — use getMergedLostFoundItems */
export function getLostFoundItems(schoolId: string): LostFoundItem[] {
  return getMergedLostFoundItems(schoolId);
}
