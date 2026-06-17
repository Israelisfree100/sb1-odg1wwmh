import type { User, UserRole, AppScreen, TimetableEntry, Assignment, Exam, Announcement, ClassMessage } from '../types';
import { CLASSES, USERS } from '../data/schools';
import { TIMETABLE_ENTRIES } from '../data/mockData';
import { getExamsForClass } from '../services/examRepository';
import { getPublishedAnnouncements } from '../services/announcementRepository';
import { CLASS_MESSAGES } from '../data/classMessages';
import {
  getAssignments,
  getCompletedAssignmentIds,
  getClass,
} from './dataHelpers';

// ─── Role labels ──────────────────────────────────────────────────────────────

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'student': return 'תלמיד';
    case 'teacher': return 'מורה';
    case 'parent': return 'הורה';
    case 'school_admin': return 'הנהלת בית הספר';
    case 'platform_admin': return 'מנהל מערכת';
    default: return role;
  }
}

export function getRoleLoginTitle(role: UserRole): string {
  switch (role) {
    case 'student': return 'כניסה לתלמידים';
    case 'teacher': return 'כניסה למורים';
    case 'parent': return 'כניסה להורים';
    case 'school_admin': return 'כניסה להנהלת בית הספר';
    default: return 'כניסה';
  }
}

export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case 'student': return 'מערכת שעות, משימות, מבחנים, הודעות ועוזר אישי';
    case 'teacher': return 'כיתות, משימות, הודעות, מבחנים וחומרי לימוד';
    case 'parent': return 'מעקב אחר משימות, מבחנים, הודעות ועדכונים';
    case 'school_admin': return 'ניהול בית הספר, משתמשים, תוכן ומערכות';
    default: return '';
  }
}

export function getDashboardForRole(role: UserRole): AppScreen {
  switch (role) {
    case 'school_admin': return { id: 'admin-dashboard' };
    case 'teacher': return { id: 'teacher-dashboard' };
    case 'parent': return { id: 'parent-dashboard' };
    default: return { id: 'dashboard' };
  }
}

export function getAllowedScreenIds(role: UserRole): AppScreen['id'][] {
  switch (role) {
    case 'school_admin':
      return ['admin-dashboard', 'admin-announcements', 'admin-exams', 'placeholder'];
    case 'teacher':
      return ['teacher-dashboard', 'placeholder'];
    case 'parent':
      return ['parent-dashboard', 'placeholder'];
    case 'student':
      return [
        'dashboard', 'daily-schedule', 'assignments', 'class-messages',
        'lost-found', 'smart-assistant', 'exam-assistant', 'practice',
        'announcements', 'placeholder',
      ];
    default:
      return ['dashboard', 'placeholder'];
  }
}

// ─── Teacher helpers ──────────────────────────────────────────────────────────

export function getTeacherClasses(user: User) {
  if (!user.classIds || user.classIds.length === 0) return [];
  return CLASSES.filter((c) => user.classIds!.includes(c.id));
}

export function getTeacherSubjects(user: User): string[] {
  return user.subjects ?? [];
}

function todayDayOfWeek(): number {
  const raw = new Date().getDay();
  return raw >= 5 ? 0 : raw;
}

/**
 * Returns today's timetable entries for the teacher's classes where
 * teacherName matches. Falls back to all class entries if none match by name.
 */
export function getTeacherTodayLessons(user: User): TimetableEntry[] {
  if (!user.classIds || user.classIds.length === 0) return [];
  const day = todayDayOfWeek();
  const all = TIMETABLE_ENTRIES.filter(
    (e) =>
      user.classIds!.includes(e.classId) &&
      e.dayOfWeek === day &&
      !e.isBreak,
  ).sort((a, b) => a.period - b.period);

  const byName = all.filter((e) => e.teacherName === user.fullName);
  return byName.length > 0 ? byName : all;
}

export function getTeacherRelevantAssignments(user: User): Assignment[] {
  if (!user.classIds) return [];
  return user.classIds.flatMap((cid) => getAssignments(cid));
}

export function getTeacherRelevantExams(user: User): Exam[] {
  if (!user.classIds || !user.schoolId) return [];
  return user.classIds.flatMap((cid) => getExamsForClass(cid, user.schoolId));
}

export function getTeacherRelevantMessages(user: User): ClassMessage[] {
  if (!user.classIds) return [];
  return CLASS_MESSAGES.filter((m) => user.classIds!.includes(m.classId));
}

export function getTeacherPublishedAnnouncements(user: User): Announcement[] {
  return getPublishedAnnouncements(user.schoolId);
}

// ─── Parent helpers ───────────────────────────────────────────────────────────

export function getParentChildren(user: User): User[] {
  if (!user.childUserIds || user.childUserIds.length === 0) return [];
  return USERS.filter((u) => user.childUserIds!.includes(u.id));
}

export interface ChildSnapshot {
  child: User;
  classGroup: ReturnType<typeof getClass>;
  todayLessons: TimetableEntry[];
  assignments: Assignment[];
  completedCount: number;
  nextExam: Exam | undefined;
  announcements: Announcement[];
  classMessages: ClassMessage[];
}

export function getParentSelectedChildData(
  parentUser: User,
  childUserId: string,
): ChildSnapshot | null {
  if (!parentUser.childUserIds?.includes(childUserId)) return null;
  const child = USERS.find((u) => u.id === childUserId);
  if (!child) return null;

  const classGroup = child.classId ? getClass(child.classId) : undefined;
  const day = todayDayOfWeek();
  const todayLessons = TIMETABLE_ENTRIES.filter(
    (e) =>
      e.classId === child.classId &&
      e.dayOfWeek === day &&
      !e.isBreak,
  ).sort((a, b) => a.period - b.period);

  const assignments = child.classId ? getAssignments(child.classId) : [];
  const completed = getCompletedAssignmentIds(child.id);
  const completedCount = assignments.filter((a) => completed.includes(a.id)).length;

  const exams = child.classId
    ? getExamsForClass(child.classId, child.schoolId)
    : [];
  const nextExam = exams[0];

  const publishedAnn = getPublishedAnnouncements(child.schoolId);
  const announcements = publishedAnn.filter((ann) => {
    if (ann.audience === 'school') return true;
    if (ann.audience === 'parents') return true;
    if (ann.audience === 'grade' && classGroup && ann.targetGrade === classGroup.grade) return true;
    if (ann.audience === 'class' && ann.targetClassId === child.classId) return true;
    return false;
  });

  const classMessages = child.classId
    ? CLASS_MESSAGES.filter((m) => m.classId === child.classId)
    : [];

  return {
    child,
    classGroup,
    todayLessons,
    assignments,
    completedCount,
    nextExam,
    announcements,
    classMessages,
  };
}
