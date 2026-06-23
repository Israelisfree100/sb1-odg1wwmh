/**
 * Per-school visual theme tokens (Tailwind class names).
 * Text badge only — no logo images.
 */
export interface SchoolTheme {
  badge: string;
  /** Tailwind gradient for headers / hero areas */
  headerGradient: string;
  /** Page background gradient */
  pageGradient: string;
  /** Accent badge background */
  badgeBg: string;
  badgeText: string;
  /** Primary interactive colour ring */
  focusRing: string;
  /** Card border accent */
  cardBorder: string;
}

const DEFAULT_THEME: SchoolTheme = {
  badge: '',
  headerGradient: 'from-violet-500 to-sky-500',
  pageGradient: 'from-violet-50 via-sky-50 to-emerald-50',
  badgeBg: 'bg-sky-100',
  badgeText: 'text-sky-700',
  focusRing: 'focus-visible:ring-violet-400',
  cardBorder: 'border-sky-100',
};

/** Ramat Aviv G — clean Tel Aviv elementary palette. */
export const RAG_THEME: SchoolTheme = {
  badge: 'רמת אביב ג׳',
  headerGradient: 'from-sky-500 to-teal-500',
  pageGradient: 'from-sky-50 via-cyan-50/80 to-amber-50/40',
  badgeBg: 'bg-sky-100',
  badgeText: 'text-sky-800',
  focusRing: 'focus-visible:ring-sky-400',
  cardBorder: 'border-sky-100',
};

export function getSchoolTheme(schoolId: string): SchoolTheme {
  if (schoolId === 'ramat-aviv-g') return RAG_THEME;
  return DEFAULT_THEME;
}
