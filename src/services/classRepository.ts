/**
 * Class Repository
 * Merges static CLASSES with admin-created/modified classes in localStorage.
 *
 * localStorage keys:
 *   admin_classes_<schoolId>          — array of ClassGroup objects
 *   admin_classes_<schoolId>_deleted  — array of deleted class IDs
 */
import type { ClassGroup } from '../types';
import { CLASSES } from '../data/schools';
import { getAllUsersForSchool } from './userRepository';
import { getAssignmentsForClass } from './assignmentRepository';
import { getExamsForClass } from './examRepository';
import { TIMETABLE_ENTRIES } from '../data/mockData';

const KEY = (schoolId: string) => `admin_classes_${schoolId}`;
const DELETED_KEY = (schoolId: string) => `admin_classes_${schoolId}_deleted`;

// ─── ID generation ────────────────────────────────────────────────────────────

export function generateClassId(schoolId: string): string {
  return `cls-${schoolId}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function getLocalClasses(schoolId: string): ClassGroup[] {
  try {
    return JSON.parse(localStorage.getItem(KEY(schoolId)) ?? '[]') as ClassGroup[];
  } catch {
    return [];
  }
}

function getDeletedIds(schoolId: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(DELETED_KEY(schoolId)) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function saveLocalClasses(schoolId: string, classes: ClassGroup[]): void {
  try {
    localStorage.setItem(KEY(schoolId), JSON.stringify(classes));
  } catch {
    // ignore
  }
}

function saveDeletedIds(schoolId: string, ids: string[]): void {
  try {
    localStorage.setItem(DELETED_KEY(schoolId), JSON.stringify(ids));
  } catch {
    // ignore
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns all (non-deleted) classes for a school, merged from static + localStorage. */
export function getAllClassesForSchool(schoolId: string): ClassGroup[] {
  const deleted = new Set(getDeletedIds(schoolId));
  const local = getLocalClasses(schoolId);
  const localMap = new Map(local.map((c) => [c.id, c]));

  const merged: ClassGroup[] = [];

  for (const c of CLASSES) {
    if (c.schoolId !== schoolId) continue;
    if (deleted.has(c.id)) continue;
    merged.push(localMap.get(c.id) ?? c);
    localMap.delete(c.id);
  }
  for (const c of localMap.values()) {
    if (!deleted.has(c.id)) merged.push(c);
  }

  return merged.sort((a, b) => a.name.localeCompare(b.name, 'he'));
}

/** Returns only active (isActive !== false) classes. */
export function getActiveClassesForSchool(schoolId: string): ClassGroup[] {
  return getAllClassesForSchool(schoolId).filter((c) => c.isActive !== false);
}

/** Returns a class by ID across the merged set. */
export function getClassById(id: string): ClassGroup | undefined {
  const staticCls = CLASSES.find((c) => c.id === id);
  const schoolId = staticCls?.schoolId;
  if (!schoolId) {
    // Scan local stores
    const schoolIds = Array.from(new Set(CLASSES.map((c) => c.schoolId)));
    for (const sid of schoolIds) {
      const found = getLocalClasses(sid).find((c) => c.id === id);
      if (found) return found;
    }
    return undefined;
  }
  const local = getLocalClasses(schoolId).find((c) => c.id === id);
  return local ?? staticCls;
}

/** Creates or updates a class. */
export function saveClass(cls: ClassGroup): void {
  const local = getLocalClasses(cls.schoolId);
  const idx = local.findIndex((c) => c.id === cls.id);
  if (idx >= 0) {
    local[idx] = cls;
  } else {
    local.push(cls);
  }
  saveLocalClasses(cls.schoolId, local);
}

/** Archives (deactivates) a class. */
export function archiveClass(id: string, schoolId: string): void {
  const all = getAllClassesForSchool(schoolId);
  const cls = all.find((c) => c.id === id);
  if (!cls) return;
  saveClass({ ...cls, isActive: false });
}

/** Unarchives a class. */
export function unarchiveClass(id: string, schoolId: string): void {
  const all = getAllClassesForSchool(schoolId);
  const cls = all.find((c) => c.id === id);
  if (!cls) return;
  saveClass({ ...cls, isActive: true });
}

/**
 * Returns null if the class can be deleted, or a string explaining why it cannot.
 * Safe to delete only when there are no linked students, teachers, assignments, exams, or timetable entries.
 */
export function canDeleteClass(
  classId: string,
  schoolId: string,
): { canDelete: boolean; reason?: string } {
  const students = getAllUsersForSchool(schoolId, 'student').filter(
    (u) => u.classId === classId,
  );
  if (students.length > 0)
    return { canDelete: false, reason: `הכיתה משויכת ל-${students.length} תלמידים` };

  const teachers = getAllUsersForSchool(schoolId, 'teacher').filter(
    (u) => u.classIds?.includes(classId),
  );
  if (teachers.length > 0)
    return { canDelete: false, reason: `${teachers.length} מורים משויכים לכיתה` };

  const assignments = getAssignmentsForClass(classId);
  if (assignments.length > 0)
    return { canDelete: false, reason: `קיימות ${assignments.length} משימות לכיתה` };

  const exams = getExamsForClass(classId, schoolId);
  if (exams.length > 0)
    return { canDelete: false, reason: `קיימים ${exams.length} מבחנים לכיתה` };

  const timetable = TIMETABLE_ENTRIES.filter((e) => e.classId === classId);
  if (timetable.length > 0)
    return { canDelete: false, reason: 'קיימות ערכי מערכת שעות לכיתה' };

  return { canDelete: true };
}

/** Hard deletes a class (adds to deleted list). */
export function deleteClass(id: string, schoolId: string): void {
  const local = getLocalClasses(schoolId);
  saveLocalClasses(schoolId, local.filter((c) => c.id !== id));
  const deleted = getDeletedIds(schoolId);
  if (!deleted.includes(id)) {
    saveDeletedIds(schoolId, [...deleted, id]);
  }
}

/** Count of active classes for dashboard. */
export function getActiveClassCount(schoolId: string): number {
  return getActiveClassesForSchool(schoolId).length;
}
