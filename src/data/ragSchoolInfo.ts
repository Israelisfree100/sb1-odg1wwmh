/**
 * Ramat Aviv G — static school metadata for dashboards and Smart Assistant.
 * Demo-only; no personal data beyond supplied names.
 */
export const RAG_SCHOOL_ID = 'ramat-aviv-g';
export const RAG_CLASS_G3_ID = 'class-rag-g3';
/** @deprecated Legacy class id — migrated to RAG_CLASS_G3_ID */
export const RAG_CLASS_G2_ID = 'class-rag-g2';

export const RAG_DEMO_SEED_VERSION = '2026-g3-v1';

export const RAG_LEADERSHIP = {
  principal: 'יגאל',
  assistantPrincipal: 'גילה',
} as const;

export const RAG_HOMEROOM = {
  className: "ג'3",
  teacherName: 'דלית שלג',
} as const;

/** Professional staff shown on student dashboard (excluding homeroom). */
export const RAG_STAFF_ROSTER: { name: string; subjects: string }[] = [
  { name: 'לאה קמחזי', subjects: 'שפה ותיאטרון' },
  { name: 'דנית', subjects: 'מדעים' },
  { name: 'מקסים', subjects: 'מוזיקה' },
  { name: 'בן', subjects: 'חינוך גופני' },
  { name: 'טל', subjects: 'אנגלית' },
];

/** Subject → teacher name for Smart Assistant lookups. */
export const RAG_SUBJECT_TEACHERS: Record<string, string> = {
  מתמטיקה: 'דלית שלג',
  חשבון: 'דלית שלג',
  גאומטריה: 'דלית שלג',
  'כישורי חיים': 'דלית שלג',
  תורה: 'דלית שלג',
  שפה: 'לאה קמחזי',
  'מיומנויות קריאה': 'לאה קמחזי',
  תיאטרון: 'לאה קמחזי',
  'מפתח הלב / תיאטרון': 'לאה קמחזי',
  מדעים: 'דנית',
  מוזיקה: 'מקסים',
  'חינוך גופני': 'בן',
  ספורט: 'בן',
  אנגלית: 'טל',
};

export function isRagSchool(schoolId: string): boolean {
  return schoolId === RAG_SCHOOL_ID;
}
