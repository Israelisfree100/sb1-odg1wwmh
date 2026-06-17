/**
 * User Repository
 * Merges static mock users (USERS) with admin-created/modified users stored in localStorage.
 * Static mock users are never mutated directly; overrides are stored per-school in localStorage.
 *
 * localStorage keys:
 *   admin_users_<schoolId>          — array of created/updated User objects
 *   admin_users_<schoolId>_deleted  — array of deleted user IDs
 *
 * isActive: undefined | true = active; false = deactivated. All static mock users are active.
 */
import type { User, UserRole } from '../types';
import { USERS } from '../data/schools';

const KEY = (schoolId: string) => `admin_users_${schoolId}`;
const DELETED_KEY = (schoolId: string) => `admin_users_${schoolId}_deleted`;

// ─── ID generation ────────────────────────────────────────────────────────────

export function generateUserId(schoolId: string, role: UserRole): string {
  const roleSlug = role === 'school_admin' ? 'admin' : role;
  return `${roleSlug}-${schoolId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Read helpers ─────────────────────────────────────────────────────────────

function getLocalUsers(schoolId: string): User[] {
  try {
    return JSON.parse(localStorage.getItem(KEY(schoolId)) ?? '[]') as User[];
  } catch {
    return [];
  }
}

function getDeletedIds(schoolId: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(DELETED_KEY(schoolId)) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function saveLocalUsers(schoolId: string, users: User[]): void {
  try {
    localStorage.setItem(KEY(schoolId), JSON.stringify(users));
  } catch {
    // ignore quota errors
  }
}

function saveDeletedIds(schoolId: string, ids: string[]): void {
  try {
    localStorage.setItem(DELETED_KEY(schoolId), JSON.stringify(ids));
  } catch {
    // ignore
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns all active (non-deleted) users for a school, merged from static + localStorage.
 * Locally stored records override static ones by ID.
 */
export function getAllUsersForSchool(schoolId: string, role?: UserRole): User[] {
  const deleted = new Set(getDeletedIds(schoolId));
  const local = getLocalUsers(schoolId);
  const localMap = new Map(local.map((u) => [u.id, u]));

  const merged: User[] = [];

  // Static users for this school, not deleted, override applied
  for (const u of USERS) {
    if (u.schoolId !== schoolId) continue;
    if (deleted.has(u.id)) continue;
    merged.push(localMap.get(u.id) ?? u);
    localMap.delete(u.id); // consumed
  }

  // Remaining local-only users (admin-created)
  for (const u of localMap.values()) {
    if (!deleted.has(u.id)) merged.push(u);
  }

  const result = role ? merged.filter((u) => u.role === role) : merged;
  return result.sort((a, b) => a.fullName.localeCompare(b.fullName, 'he'));
}

/** Returns a user by ID, searching across all schools (for session restore). */
export function getUserById(id: string): User | null {
  // Try every school by scanning static users for the schoolId
  const staticUser = USERS.find((u) => u.id === id);
  const schoolId = staticUser?.schoolId;
  if (!schoolId) {
    // Not in static list — scan all local stores
    // We only have school keys stored so we try to find it by scanning static users' schools
    const schoolIds = Array.from(new Set(USERS.map((u) => u.schoolId)));
    for (const sid of schoolIds) {
      const found = getLocalUsers(sid).find((u) => u.id === id);
      if (found) {
        const deleted = getDeletedIds(sid);
        if (deleted.includes(id)) return null;
        return found;
      }
    }
    return null;
  }
  const deleted = getDeletedIds(schoolId);
  if (deleted.includes(id)) return null;
  const local = getLocalUsers(schoolId).find((u) => u.id === id);
  return local ?? staticUser ?? null;
}

/** Login lookup: by username + schoolId, case-insensitive. */
export function getUserByUsernameForLogin(
  schoolId: string,
  username: string,
): User | null {
  const norm = username.trim().toLowerCase();
  const all = getAllUsersForSchool(schoolId);
  return all.find((u) => u.username.toLowerCase() === norm) ?? null;
}

/** Checks whether a username is available within the school, optionally excluding a user ID. */
export function isUsernameAvailable(
  schoolId: string,
  username: string,
  excludeId?: string,
): boolean {
  const norm = username.trim().toLowerCase();
  return !getAllUsersForSchool(schoolId).some(
    (u) => u.username.toLowerCase() === norm && u.id !== excludeId,
  );
}

/** Saves (create or update) a user. */
export function saveUser(user: User): void {
  const local = getLocalUsers(user.schoolId);
  const idx = local.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    local[idx] = user;
  } else {
    local.push(user);
  }
  saveLocalUsers(user.schoolId, local);
}

/** Sets isActive: false. User cannot log in. */
export function deactivateUser(id: string, schoolId: string): void {
  const all = getAllUsersForSchool(schoolId);
  const user = all.find((u) => u.id === id);
  if (!user) return;
  saveUser({ ...user, isActive: false });
}

/** Sets isActive: true (or removes flag). */
export function reactivateUser(id: string, schoolId: string): void {
  const all = getAllUsersForSchool(schoolId);
  const user = all.find((u) => u.id === id);
  if (!user) return;
  saveUser({ ...user, isActive: true });
}

/** Resets password. Returns updated user with new password. */
export function resetUserPassword(
  id: string,
  schoolId: string,
  newPassword: string,
): User | null {
  const all = getAllUsersForSchool(schoolId);
  const user = all.find((u) => u.id === id);
  if (!user) return null;
  const updated = { ...user, password: newPassword };
  saveUser(updated);
  return updated;
}

/** Hard deletes a user (adds to deleted list, removes from local). */
export function deleteUser(id: string, schoolId: string): void {
  const local = getLocalUsers(schoolId);
  saveLocalUsers(schoolId, local.filter((u) => u.id !== id));
  const deleted = getDeletedIds(schoolId);
  if (!deleted.includes(id)) {
    saveDeletedIds(schoolId, [...deleted, id]);
  }
}

/** Returns count of active users by role for dashboard widgets. */
export function getActiveUserCount(schoolId: string, role: UserRole): number {
  return getAllUsersForSchool(schoolId, role).filter((u) => u.isActive !== false).length;
}
