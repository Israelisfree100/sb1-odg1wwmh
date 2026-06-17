import type { User, UserRole } from '../types';
import { getUserByUsernameForLogin, getUserById } from '../services/userRepository';

const SESSION_KEY = 'chaveri_session';

interface StoredSession {
  userId: string;
  schoolId: string;
}

/**
 * Returns the matching User or null if credentials are wrong / school mismatch.
 * Reads from the merged user repository (static + admin-created users).
 * Deactivated users (isActive === false) cannot log in.
 * If selectedRole is provided, the user's role must also match.
 */
export function login(
  schoolId: string,
  username: string,
  password: string,
  selectedRole?: UserRole,
): User | null {
  const user = getUserByUsernameForLogin(schoolId, username);
  if (!user) return null;
  if (user.password !== password) return null;
  if (user.isActive === false) return null;
  if (selectedRole && user.role !== selectedRole) return null;
  return user;
}

export function saveSession(user: User): void {
  const session: StoredSession = { userId: user.id, schoolId: user.schoolId };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // localStorage unavailable — silently skip
  }
}

/** Restores a saved session. Returns null if no valid session or user deactivated. */
export function loadSessionUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { userId }: StoredSession = JSON.parse(raw);
    const user = getUserById(userId);
    if (!user) return null;
    // If admin deactivated the user while they were logged in, force them out on next load
    if (user.isActive === false) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
