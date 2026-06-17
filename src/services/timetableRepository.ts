/**
 * Timetable Repository
 * Merges static TIMETABLE_ENTRIES from mockData with admin-managed overrides in localStorage.
 *
 * localStorage keys:
 *   admin_timetable_<schoolId>          — array of TimetableEntry
 *   admin_timetable_<schoolId>_deleted  — array of deleted entry IDs
 */
import type { TimetableEntry } from '../types';
import { TIMETABLE_ENTRIES } from '../data/mockData';

const KEY = (schoolId: string) => `admin_timetable_${schoolId}`;
const DEL_KEY = (schoolId: string) => `admin_timetable_${schoolId}_deleted`;

// ─── ID generation ────────────────────────────────────────────────────────────

export function generateTimetableId(): string {
  return `tt-adm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
}

// ─── Private ─────────────────────────────────────────────────────────────────

function getLocalEntries(schoolId: string): TimetableEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY(schoolId)) ?? '[]') as TimetableEntry[];
  } catch { return []; }
}

function getDeletedIds(schoolId: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(DEL_KEY(schoolId)) ?? '[]') as string[];
  } catch { return []; }
}

function saveLocalEntries(schoolId: string, entries: TimetableEntry[]): void {
  try { localStorage.setItem(KEY(schoolId), JSON.stringify(entries)); } catch { /* ignore */ }
}

function saveDeletedIds(schoolId: string, ids: string[]): void {
  try { localStorage.setItem(DEL_KEY(schoolId), JSON.stringify(ids)); } catch { /* ignore */ }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** All entries for a school — merges static + localStorage. */
export function getAllTimetableEntries(schoolId: string): TimetableEntry[] {
  const deleted = new Set(getDeletedIds(schoolId));
  const local = getLocalEntries(schoolId);
  const localMap = new Map(local.map((e) => [e.id, e]));

  const merged: TimetableEntry[] = [];
  for (const e of TIMETABLE_ENTRIES) {
    if (e.schoolId !== schoolId) continue;
    if (deleted.has(e.id)) continue;
    merged.push(localMap.get(e.id) ?? e);
    localMap.delete(e.id);
  }
  for (const e of localMap.values()) {
    if (!deleted.has(e.id)) merged.push(e);
  }
  return merged;
}

/** Entries for a specific class, sorted by day then period. */
export function getTimetableForClass(classId: string, schoolId: string): TimetableEntry[] {
  return getAllTimetableEntries(schoolId)
    .filter((e) => e.classId === classId)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.period - b.period);
}

/** Today's entries for a class (replacing the static version in dataHelpers). */
export function getTodayTimetableFromRepo(classId: string, schoolId: string): TimetableEntry[] {
  const raw = new Date().getDay();
  const day = raw >= 5 ? 0 : raw;
  return getAllTimetableEntries(schoolId)
    .filter((e) => e.classId === classId && e.dayOfWeek === day)
    .sort((a, b) => a.period - b.period);
}

/** Save (create or update) an entry. */
export function saveTimetableEntry(entry: TimetableEntry): void {
  const local = getLocalEntries(entry.schoolId);
  const idx = local.findIndex((e) => e.id === entry.id);
  if (idx >= 0) local[idx] = entry; else local.push(entry);
  saveLocalEntries(entry.schoolId, local);
}

/** Hard delete — adds to deleted list. */
export function deleteTimetableEntry(id: string, schoolId: string): void {
  const local = getLocalEntries(schoolId).filter((e) => e.id !== id);
  saveLocalEntries(schoolId, local);
  const deleted = getDeletedIds(schoolId);
  if (!deleted.includes(id)) saveDeletedIds(schoolId, [...deleted, id]);
}

/** Validates no overlap in same class/day. Returns conflicting entry if any. */
export function findOverlap(
  schoolId: string,
  entry: TimetableEntry,
  excludeId?: string,
): TimetableEntry | undefined {
  const toMins = (t: string) => { const [h = 0, m = 0] = t.split(':').map(Number); return h * 60 + m; };
  const newStart = toMins(entry.startTime);
  const newEnd = toMins(entry.endTime);
  return getAllTimetableEntries(schoolId).find((e) => {
    if (e.id === excludeId) return false;
    if (e.classId !== entry.classId || e.dayOfWeek !== entry.dayOfWeek) return false;
    const s = toMins(e.startTime);
    const en = toMins(e.endTime);
    return newStart < en && newEnd > s;
  });
}

/** Duplicate all entries from one day to another in the same class. */
export function duplicateDayEntries(
  classId: string,
  schoolId: string,
  fromDay: number,
  toDay: number,
): void {
  const entries = getTimetableForClass(classId, schoolId).filter((e) => e.dayOfWeek === fromDay);
  for (const e of entries) {
    const clone: TimetableEntry = { ...e, id: generateTimetableId(), dayOfWeek: toDay };
    saveTimetableEntry(clone);
  }
}

/** Count of all timetable entries in the school (for dashboard). */
export function getTimetableEntryCount(schoolId: string): number {
  return getAllTimetableEntries(schoolId).length;
}
