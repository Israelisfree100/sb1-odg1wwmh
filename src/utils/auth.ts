import type { User } from '../types';
import { USERS } from '../data/schools';

const SESSION_KEY = 'chaveri_session';

interface StoredSession {
  userId: string;
  schoolId: string;
}

/** Returns the matching User or null if credentials are wrong / school mismatch. */
export function login(
  schoolId: string,
  username: string,
  password: string,
): User | null {
  const normalizedUsername = username.trim().toLowerCase();
  return (
    USERS.find(
      (u) =>
        u.schoolId === schoolId &&
        u.username.toLowerCase() === normalizedUsername &&
        u.password === password,
    ) ?? null
  );
}

export function saveSession(user: User): void {
  const session: StoredSession = { userId: user.id, schoolId: user.schoolId };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // localStorage unavailable — silently skip
  }
}

/** Restores a saved session. Returns null if no valid session exists. */
export function loadSessionUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { userId, schoolId }: StoredSession = JSON.parse(raw);
    return (
      USERS.find((u) => u.id === userId && u.schoolId === schoolId) ?? null
    );
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
