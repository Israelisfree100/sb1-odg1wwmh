/**
 * Ramat Aviv G demo seed versioning and localStorage reset.
 * Clears only ramat-aviv-g scoped keys — never touches Shaked or Rakafot data.
 */
import { RAG_DEMO_SEED_VERSION, RAG_SCHOOL_ID, RAG_CLASS_G2_ID, RAG_CLASS_G3_ID } from '../data/ragSchoolInfo';

const VERSION_KEY = 'rag_demo_seed_version';

/** All localStorage key prefixes/suffixes scoped to ramat-aviv-g. */
const RAG_KEY_PATTERNS = [
  `admin_timetable_${RAG_SCHOOL_ID}`,
  `admin_timetable_${RAG_SCHOOL_ID}_deleted`,
  `admin_users_${RAG_SCHOOL_ID}`,
  `admin_users_${RAG_SCHOOL_ID}_deleted`,
  `admin_classes_${RAG_SCHOOL_ID}`,
  `admin_classes_${RAG_SCHOOL_ID}_deleted`,
  `admin_exams_${RAG_SCHOOL_ID}`,
  `admin_exams_${RAG_SCHOOL_ID}_deleted`,
  `admin_announcements_${RAG_SCHOOL_ID}`,
  `admin_announcements_${RAG_SCHOOL_ID}_deleted`,
  `teacher_assignments_${RAG_SCHOOL_ID}`,
  `teacher_assignments_deleted_${RAG_SCHOOL_ID}`,
  `teacher_class_messages_${RAG_SCHOOL_ID}`,
  `teacher_class_messages_deleted_${RAG_SCHOOL_ID}`,
  `teacher_announcement_requests_${RAG_SCHOOL_ID}`,
  `lost_found_items_${RAG_SCHOOL_ID}`,
  `lost_found_deleted_${RAG_SCHOOL_ID}`,
];

/** Keys that may contain stale class-rag-g2 references. */
const MIGRATION_KEYS = [
  'chaveri_session',
  'parent_selected_child_parent-rag',
  'parent_selected_child_parent-multi-rag',
];

/**
 * Run on app startup. If seed version changed, clear RAG overrides
 * so static demo data (ג׳3) is visible immediately.
 */
export function bootstrapRagDemoSeed(): void {
  try {
    const stored = localStorage.getItem(VERSION_KEY);
    if (stored !== RAG_DEMO_SEED_VERSION) {
      clearRagDemoLocalStorage();
      migrateClassReferences();
      localStorage.setItem(VERSION_KEY, RAG_DEMO_SEED_VERSION);
    }
  } catch {
    // ignore storage errors
  }
}

/** Development-only: clear all RAG localStorage and reload. */
export function resetRagDemoData(): void {
  clearRagDemoLocalStorage();
  migrateClassReferences();
  localStorage.setItem(VERSION_KEY, RAG_DEMO_SEED_VERSION);
  window.location.reload();
}

export function clearRagDemoLocalStorage(): void {
  for (const key of RAG_KEY_PATTERNS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

/** Replace legacy class-rag-g2 references in session / parent context. */
function migrateClassReferences(): void {
  for (const key of MIGRATION_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      if (raw.includes(RAG_CLASS_G2_ID)) {
        localStorage.setItem(key, raw.replaceAll(RAG_CLASS_G2_ID, RAG_CLASS_G3_ID));
      }
    } catch {
      // ignore
    }
  }
}

export function isDevEnvironment(): boolean {
  return import.meta.env.DEV;
}
