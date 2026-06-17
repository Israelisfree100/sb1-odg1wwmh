/**
 * Parent-specific utility helpers.
 * Handles selected-child persistence, access control, and parent-specific read state.
 */
import type { User, Announcement, ClassMessage } from '../types';
import { USERS } from '../data/schools';
import { canUserSeeAnnouncement } from './announcementVisibility';

// ─── Child selection ──────────────────────────────────────────────────────────

const SELECTED_CHILD_KEY = (parentId: string) => `parent_selected_child_${parentId}`;

/** True only if childUserId is explicitly in the parent's childUserIds list. */
export function canParentAccessChild(parent: User, childUserId: string): boolean {
  return Boolean(parent.childUserIds?.includes(childUserId));
}

/** Returns the currently selected child's userId, validated against the parent's list. */
export function getParentSelectedChildId(parent: User): string {
  const ids = parent.childUserIds ?? [];
  if (ids.length === 0) return '';
  try {
    const stored = localStorage.getItem(SELECTED_CHILD_KEY(parent.id));
    if (stored && ids.includes(stored)) return stored;
  } catch {
    // ignore
  }
  return ids[0];
}

/** Persists the selected child for the given parent. */
export function saveParentSelectedChildId(parent: User, childUserId: string): void {
  if (!canParentAccessChild(parent, childUserId)) return;
  try {
    localStorage.setItem(SELECTED_CHILD_KEY(parent.id), childUserId);
  } catch {
    // ignore
  }
}

/** Resolves the child User object. Returns undefined if not found or not linked. */
export function getSelectedChild(parent: User, childUserId: string): User | undefined {
  if (!canParentAccessChild(parent, childUserId)) return undefined;
  return USERS.find((u) => u.id === childUserId && u.schoolId === parent.schoolId);
}

// ─── Class message read state ─────────────────────────────────────────────────

const MSG_READ_KEY = (parentId: string) => `parent_class_messages_read_${parentId}`;

export function getParentReadMessageIds(parentId: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(MSG_READ_KEY(parentId)) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function markParentMessageRead(parentId: string, messageId: string): void {
  const ids = getParentReadMessageIds(parentId);
  if (ids.includes(messageId)) return;
  try {
    localStorage.setItem(MSG_READ_KEY(parentId), JSON.stringify([...ids, messageId]));
  } catch {
    // ignore
  }
}

export function markAllParentMessagesRead(parentId: string, messageIds: string[]): void {
  const existing = getParentReadMessageIds(parentId);
  const merged = Array.from(new Set([...existing, ...messageIds]));
  try {
    localStorage.setItem(MSG_READ_KEY(parentId), JSON.stringify(merged));
  } catch {
    // ignore
  }
}

// ─── School announcement read state ──────────────────────────────────────────

const ANN_READ_KEY = (parentId: string) => `parent_school_announcements_read_${parentId}`;

export function getParentReadAnnouncementIds(parentId: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(ANN_READ_KEY(parentId)) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function markParentAnnouncementRead(parentId: string, annId: string): void {
  const ids = getParentReadAnnouncementIds(parentId);
  if (ids.includes(annId)) return;
  try {
    localStorage.setItem(ANN_READ_KEY(parentId), JSON.stringify([...ids, annId]));
  } catch {
    // ignore
  }
}

export function markAllParentAnnouncementsRead(parentId: string, annIds: string[]): void {
  const existing = getParentReadAnnouncementIds(parentId);
  const merged = Array.from(new Set([...existing, ...annIds]));
  try {
    localStorage.setItem(ANN_READ_KEY(parentId), JSON.stringify(merged));
  } catch {
    // ignore
  }
}

// ─── Audience filter for announcements ───────────────────────────────────────

/**
 * Returns published announcements visible to a parent for a specific child's class.
 * Uses the shared visibility helper — considers both parent and students_and_parents audiences.
 */
export function filterAnnouncementsForChild(
  announcements: Announcement[],
  parentUser: User,
  childClassId?: string,
): Announcement[] {
  return announcements.filter((ann) => canUserSeeAnnouncement(parentUser, ann, childClassId));
}

// ─── Unread counts ────────────────────────────────────────────────────────────

export function countUnreadMessages(parentId: string, messages: ClassMessage[]): number {
  const read = getParentReadMessageIds(parentId);
  return messages.filter((m) => !read.includes(m.id)).length;
}

export function countUnreadAnnouncements(
  parentId: string,
  announcements: Announcement[],
): number {
  const read = getParentReadAnnouncementIds(parentId);
  return announcements.filter((a) => !read.includes(a.id)).length;
}
