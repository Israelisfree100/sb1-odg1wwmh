/**
 * Practice History Repository
 * Saves and retrieves safe practice session summaries per student.
 * Parent screens read from the child's history; no raw answers are stored.
 * localStorage key: practice_history_<studentUserId>
 */
import type { PracticeHistoryEntry } from '../types';

const KEY = (studentUserId: string) => `practice_history_${studentUserId}`;
const MAX_ENTRIES = 50;

export function generateHistoryId(): string {
  return `ph-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function getPracticeHistory(studentUserId: string): PracticeHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY(studentUserId)) ?? '[]') as PracticeHistoryEntry[];
  } catch {
    return [];
  }
}

export function savePracticeEntry(
  studentUserId: string,
  entry: PracticeHistoryEntry,
): void {
  const current = getPracticeHistory(studentUserId);
  const updated = [entry, ...current].slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(KEY(studentUserId), JSON.stringify(updated));
  } catch {
    // ignore quota errors
  }
}
