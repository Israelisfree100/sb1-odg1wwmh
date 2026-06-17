/**
 * Assignment Repository
 * Merges static mock data with teacher-created assignments stored in localStorage.
 * Student views call getAssignmentsForClass(); teacher CRUD calls save/delete helpers.
 */
import type { Assignment } from '../types';
import { ASSIGNMENTS } from '../data/mockData';
import { CLASSES } from '../data/schools';

const KEY = (schoolId: string) => `teacher_assignments_${schoolId}`;
const DEL_KEY = (schoolId: string) => `teacher_assignments_deleted_${schoolId}`;

export function generateAssignmentId(): string {
  return `asgn-t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getSchoolIdForClass(classId: string): string {
  return CLASSES.find((c) => c.id === classId)?.schoolId ?? '';
}

function loadLocalAssignments(schoolId: string): Assignment[] {
  try {
    return JSON.parse(localStorage.getItem(KEY(schoolId)) ?? '[]') as Assignment[];
  } catch {
    return [];
  }
}

function loadDeletedIds(schoolId: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(DEL_KEY(schoolId)) ?? '[]') as string[];
  } catch {
    return [];
  }
}

/** All assignments for a class (merged mock + teacher-created). */
export function getAssignmentsForClass(classId: string): Assignment[] {
  const schoolId = getSchoolIdForClass(classId);
  const local = loadLocalAssignments(schoolId);
  const deletedIds = loadDeletedIds(schoolId);
  const mockItems = ASSIGNMENTS.filter((a) => a.classId === classId);
  const localMap = new Map(local.map((a) => [a.id, a]));
  const mockIds = new Set(mockItems.map((a) => a.id));

  const mergedMock = mockItems
    .filter((a) => !deletedIds.includes(a.id))
    .map((a) => localMap.get(a.id) ?? a);

  const newItems = local.filter(
    (a) => a.classId === classId && !mockIds.has(a.id) && !deletedIds.includes(a.id),
  );

  return [...mergedMock, ...newItems];
}

/** All assignments for a school (teacher management view). */
export function getAllAssignmentsForSchool(schoolId: string): Assignment[] {
  const local = loadLocalAssignments(schoolId);
  const deletedIds = loadDeletedIds(schoolId);
  const mockItems = ASSIGNMENTS.filter((a) => a.schoolId === schoolId);
  const localMap = new Map(local.map((a) => [a.id, a]));
  const mockIds = new Set(mockItems.map((a) => a.id));

  const mergedMock = mockItems
    .filter((a) => !deletedIds.includes(a.id))
    .map((a) => localMap.get(a.id) ?? a);

  const newItems = local.filter(
    (a) => !mockIds.has(a.id) && !deletedIds.includes(a.id),
  );

  return [...mergedMock, ...newItems];
}

/** Save (create or update) an assignment. */
export function saveAssignment(schoolId: string, assignment: Assignment): void {
  const items = loadLocalAssignments(schoolId);
  const idx = items.findIndex((a) => a.id === assignment.id);
  const updated =
    idx >= 0 ? items.map((a, i) => (i === idx ? assignment : a)) : [...items, assignment];
  try {
    localStorage.setItem(KEY(schoolId), JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/** Delete an assignment by ID. */
export function deleteAssignment(schoolId: string, id: string): void {
  const items = loadLocalAssignments(schoolId).filter((a) => a.id !== id);
  try {
    localStorage.setItem(KEY(schoolId), JSON.stringify(items));
  } catch {
    // ignore
  }
  const isMock = ASSIGNMENTS.some((a) => a.id === id);
  if (isMock) {
    const deletedIds = loadDeletedIds(schoolId);
    if (!deletedIds.includes(id)) {
      try {
        localStorage.setItem(DEL_KEY(schoolId), JSON.stringify([...deletedIds, id]));
      } catch {
        // ignore
      }
    }
  }
}
