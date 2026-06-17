/**
 * Class Message Repository
 * Merges static mock messages with teacher-created messages stored in localStorage.
 */
import type { ClassMessage } from '../types';
import { CLASS_MESSAGES } from '../data/classMessages';
import { CLASSES } from '../data/schools';

const KEY = (schoolId: string) => `teacher_class_messages_${schoolId}`;
const DEL_KEY = (schoolId: string) => `teacher_class_messages_deleted_${schoolId}`;

export function generateMessageId(): string {
  return `msg-t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getSchoolIdForClass(classId: string): string {
  return CLASSES.find((c) => c.id === classId)?.schoolId ?? '';
}

function loadLocalMessages(schoolId: string): ClassMessage[] {
  try {
    return JSON.parse(localStorage.getItem(KEY(schoolId)) ?? '[]') as ClassMessage[];
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

/** All messages for a class (merged mock + teacher-created). */
export function getClassMessagesForClass(classId: string): ClassMessage[] {
  const schoolId = getSchoolIdForClass(classId);
  const local = loadLocalMessages(schoolId);
  const deletedIds = loadDeletedIds(schoolId);
  const mockItems = CLASS_MESSAGES.filter((m) => m.classId === classId);
  const localMap = new Map(local.map((m) => [m.id, m]));
  const mockIds = new Set(mockItems.map((m) => m.id));

  const mergedMock = mockItems
    .filter((m) => !deletedIds.includes(m.id))
    .map((m) => localMap.get(m.id) ?? m);

  const newItems = local.filter(
    (m) => m.classId === classId && !mockIds.has(m.id) && !deletedIds.includes(m.id),
  );

  // Sort by publishedAt descending
  return [...mergedMock, ...newItems].sort(
    (a, b) => b.publishedAt.localeCompare(a.publishedAt),
  );
}

/** All messages for a school (teacher management view). */
export function getAllMessagesForSchool(schoolId: string): ClassMessage[] {
  const local = loadLocalMessages(schoolId);
  const deletedIds = loadDeletedIds(schoolId);
  const mockItems = CLASS_MESSAGES.filter((m) => m.schoolId === schoolId);
  const localMap = new Map(local.map((m) => [m.id, m]));
  const mockIds = new Set(mockItems.map((m) => m.id));

  const mergedMock = mockItems
    .filter((m) => !deletedIds.includes(m.id))
    .map((m) => localMap.get(m.id) ?? m);

  const newItems = local.filter(
    (m) => !mockIds.has(m.id) && !deletedIds.includes(m.id),
  );

  return [...mergedMock, ...newItems].sort(
    (a, b) => b.publishedAt.localeCompare(a.publishedAt),
  );
}

/** Save (create or update) a class message. */
export function saveClassMessage(schoolId: string, message: ClassMessage): void {
  const items = loadLocalMessages(schoolId);
  const idx = items.findIndex((m) => m.id === message.id);
  const updated =
    idx >= 0
      ? items.map((m, i) => (i === idx ? message : m))
      : [...items, message];
  try {
    localStorage.setItem(KEY(schoolId), JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/** Delete a class message by ID. */
export function deleteClassMessage(schoolId: string, id: string): void {
  const items = loadLocalMessages(schoolId).filter((m) => m.id !== id);
  try {
    localStorage.setItem(KEY(schoolId), JSON.stringify(items));
  } catch {
    // ignore
  }
  const isMock = CLASS_MESSAGES.some((m) => m.id === id);
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
