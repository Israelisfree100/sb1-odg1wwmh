/** Subjects that share the math practice engine (Exam Assistant). */
export const MATH_SUBJECTS = ['חשבון', 'מתמטיקה'] as const;

export function isMathSubject(subject: string | undefined): boolean {
  return subject != null && (MATH_SUBJECTS as readonly string[]).includes(subject);
}
