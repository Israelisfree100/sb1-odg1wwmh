/**
 * Announcement Visibility Helper
 * Single source of truth for all role/scope-based announcement filtering.
 *
 * Handles both:
 *   - Legacy format  (audience: 'school' | 'grade' | 'class' | 'parents')
 *   - Extended format (audienceRoles + scopeType)
 *
 * All announcement-reading screens (student, parent, teacher, admin) MUST
 * use canUserSeeAnnouncement() rather than filtering inline.
 */
import type { Announcement, User, AnnouncementAudienceRole } from '../types';
import { CLASSES } from '../data/schools';
import { getAllClassesForSchool } from '../services/classRepository';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClassGrade(classId: string): string | undefined {
  // Prefer repository (includes admin-created classes), fall back to static
  try {
    const all = getAllClassesForSchool(CLASSES.find((c) => c.id === classId)?.schoolId ?? '');
    return all.find((c) => c.id === classId)?.grade ?? CLASSES.find((c) => c.id === classId)?.grade;
  } catch {
    return CLASSES.find((c) => c.id === classId)?.grade;
  }
}

function parseDate(d: string | undefined): Date | null {
  if (!d) return null;
  const p = new Date(d);
  return isNaN(p.getTime()) ? null : p;
}

/** Maps legacy audience field to the equivalent extended role set. */
function legacyAudienceToRoles(audience: string): AnnouncementAudienceRole[] {
  switch (audience) {
    case 'school': return ['all_users'];
    case 'grade': return ['students', 'parents'];
    case 'class': return ['students', 'parents'];
    case 'parents': return ['parents'];
    default: return ['all_users'];
  }
}

/** Returns true if the user's role is covered by the announcement's audience roles. */
function roleMatches(user: User, roles: AnnouncementAudienceRole[]): boolean {
  if (roles.includes('all_users')) return true;
  if (roles.includes('students_and_parents')) {
    if (user.role === 'student' || user.role === 'parent') return true;
  }
  if (user.role === 'student' && roles.includes('students')) return true;
  if (user.role === 'parent' && roles.includes('parents')) return true;
  if (user.role === 'teacher' && (roles.includes('teachers') || roles.includes('staff'))) return true;
  if (user.role === 'school_admin' && (roles.includes('school_admin') || roles.includes('staff'))) return true;
  return false;
}

/** Derives the effective grade for a user:
 *  - student: from their classId
 *  - parent: from first linked child
 *  - teacher: from first assigned class
 */
function getEffectiveGrade(user: User, childClassId?: string): string | undefined {
  if (user.role === 'student') return getClassGrade(user.classId ?? '');
  if (user.role === 'parent' && childClassId) return getClassGrade(childClassId);
  if (user.role === 'teacher' && user.classIds && user.classIds.length > 0)
    return getClassGrade(user.classIds[0]);
  return undefined;
}

/** Derives effective classId(s) for scope check. */
function getEffectiveClassIds(user: User, childClassId?: string): string[] {
  if (user.role === 'student') return user.classId ? [user.classId] : [];
  if (user.role === 'parent' && childClassId) return [childClassId];
  if (user.role === 'teacher') return user.classIds ?? [];
  return [];
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Returns true if the given user may see the announcement.
 *
 * @param user         The viewer.
 * @param ann          The announcement to evaluate.
 * @param childClassId For parent users: the currently selected child's classId.
 *                     If undefined, parents will not match class/grade scopes.
 */
export function canUserSeeAnnouncement(
  user: User,
  ann: Announcement,
  childClassId?: string,
): boolean {
  // ── 1. School match ──────────────────────────────────────────────────────
  if (ann.schoolId !== user.schoolId) return false;

  // ── 2. Published check ───────────────────────────────────────────────────
  if (ann.isPublished === false) return false;

  // ── 3. Schedule — publishAt ──────────────────────────────────────────────
  const now = new Date();
  const publishAt = parseDate(ann.publishAt);
  if (publishAt && publishAt > now) return false;

  // ── 4. Expiry ────────────────────────────────────────────────────────────
  const expiresAt = parseDate(ann.expiresAt);
  if (expiresAt && expiresAt <= now) return false;

  // ── 5. Admin always sees all published announcements of their school ─────
  if (user.role === 'school_admin') return true;

  // ── 6. Determine effective roles and scope ───────────────────────────────
  const effectiveRoles: AnnouncementAudienceRole[] = ann.audienceRoles?.length
    ? ann.audienceRoles
    : legacyAudienceToRoles(ann.audience);

  if (!roleMatches(user, effectiveRoles)) return false;

  // ── 7. Scope check ───────────────────────────────────────────────────────
  const scopeType = ann.scopeType ?? (
    ann.audience === 'school' ? 'whole_school' :
    ann.audience === 'grade' ? 'grade' :
    ann.audience === 'class' ? 'class' :
    'whole_school'
  );

  if (scopeType === 'whole_school') return true;

  if (scopeType === 'grade') {
    const annGrade = ann.targetGrade;
    if (!annGrade) return false;
    const userGrade = getEffectiveGrade(user, childClassId);
    return userGrade === annGrade;
  }

  if (scopeType === 'class') {
    const annClassIds = ann.targetClassIds?.length
      ? ann.targetClassIds
      : ann.targetClassId
        ? [ann.targetClassId]
        : [];
    if (annClassIds.length === 0) return false;
    const userClassIds = getEffectiveClassIds(user, childClassId);
    return userClassIds.some((cid) => annClassIds.includes(cid));
  }

  if (scopeType === 'specific_users') {
    return Boolean(ann.targetUserIds?.includes(user.id));
  }

  return false;
}

// ─── Convenience filters ──────────────────────────────────────────────────────

/** Filters a list of announcements to those visible to the given user. */
export function getVisibleAnnouncements(
  announcements: Announcement[],
  user: User,
  childClassId?: string,
): Announcement[] {
  return announcements.filter((ann) => canUserSeeAnnouncement(user, ann, childClassId));
}

/**
 * Returns a human-readable audience preview string for the admin form.
 * e.g. "תלמידים ומורים — שכבה ג׳"
 */
export function getAudiencePreview(
  roles: AnnouncementAudienceRole[],
  scopeType: AnnouncementScopeType | '',
  targetGrade: string,
  targetClassIds: string[],
  classNames: Map<string, string>,
): string {
  const roleLabels: Record<AnnouncementAudienceRole, string> = {
    students: 'תלמידים',
    parents: 'הורים',
    teachers: 'מורים',
    school_admin: 'הנהלה',
    staff: 'צוות',
    students_and_parents: 'תלמידים והורים',
    all_users: 'כל המשתמשים',
  };
  const roleText = roles.includes('all_users')
    ? 'כל המשתמשים'
    : roles.map((r) => roleLabels[r]).join(', ');
  const scopeLabels: Record<string, string> = {
    whole_school: 'כל בית הספר',
    grade: `שכבה ${targetGrade}`,
    class: targetClassIds.map((id) => classNames.get(id) ?? id).join(', '),
    specific_users: 'משתמשים ספציפיים',
  };
  const scopeText = scopeType ? scopeLabels[scopeType] ?? '' : '';
  return scopeText ? `${roleText} — ${scopeText}` : roleText;
}
