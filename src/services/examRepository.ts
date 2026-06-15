/**
 * Exam Repository
 * Merges static mock data with admin-managed overrides stored in localStorage.
 * Student views call getExamsForClass(); admin views call getAllExamsForAdmin().
 */
import type { Exam } from '../types';
import { EXAMS } from '../data/mockData';

const KEY = (schoolId: string) => `admin_exams_${schoolId}`;
const DEL_KEY = (schoolId: string) => `admin_exams_${schoolId}_deleted`;

function loadAdminExams(schoolId: string): Exam[] {
  try {
    return JSON.parse(localStorage.getItem(KEY(schoolId)) ?? '[]') as Exam[];
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

export function generateExamId(): string {
  return `exam-adm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** All exams for a school (admin view). */
export function getAllExamsForAdmin(schoolId: string): Exam[] {
  const adminItems = loadAdminExams(schoolId);
  const deletedIds = loadDeletedIds(schoolId);
  const adminMap = new Map(adminItems.map((e) => [e.id, e]));
  const mockIds = new Set(
    EXAMS.filter((e) => e.schoolId === schoolId).map((e) => e.id),
  );

  const mergedMock = EXAMS.filter(
    (e) => e.schoolId === schoolId && !deletedIds.includes(e.id),
  ).map((e) => adminMap.get(e.id) ?? e);

  const newAdminItems = adminItems.filter(
    (e) => !mockIds.has(e.id) && !deletedIds.includes(e.id),
  );

  return [...mergedMock, ...newAdminItems];
}

/** Exams for a specific class (student view). */
export function getExamsForClass(classId: string, schoolId: string): Exam[] {
  return getAllExamsForAdmin(schoolId).filter((e) => e.classId === classId);
}

/** Save (create or update) an exam. */
export function saveExam(schoolId: string, exam: Exam): void {
  const items = loadAdminExams(schoolId);
  const idx = items.findIndex((e) => e.id === exam.id);
  const updated =
    idx >= 0 ? items.map((e, i) => (i === idx ? exam : e)) : [...items, exam];
  try {
    localStorage.setItem(KEY(schoolId), JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/** Delete an exam by ID. */
export function deleteExam(schoolId: string, id: string): void {
  const items = loadAdminExams(schoolId).filter((e) => e.id !== id);
  try {
    localStorage.setItem(KEY(schoolId), JSON.stringify(items));
  } catch {
    // ignore
  }
  const isMock = EXAMS.some((e) => e.id === id);
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
