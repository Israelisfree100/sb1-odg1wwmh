/**
 * Announcement Repository
 * Merges static mock data with admin-managed overrides stored in localStorage.
 * Student views call getPublishedAnnouncements(); admin views call getAllAnnouncementsForAdmin().
 */
import type { Announcement } from '../types';
import { ANNOUNCEMENTS } from '../data/mockData';

const KEY = (schoolId: string) => `admin_announcements_${schoolId}`;
const DEL_KEY = (schoolId: string) => `admin_announcements_${schoolId}_deleted`;

function loadAdminItems(schoolId: string): Announcement[] {
  try {
    return JSON.parse(localStorage.getItem(KEY(schoolId)) ?? '[]') as Announcement[];
  } catch {
    return [];
  }
}

function loadDeletedIds(schoolId: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(DEL_KEY(schoolId)) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function generateAnnouncementId(): string {
  return `ann-adm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** All announcements for a school — published + drafts (admin view). */
export function getAllAnnouncementsForAdmin(schoolId: string): Announcement[] {
  const adminItems = loadAdminItems(schoolId);
  const deletedIds = loadDeletedIds(schoolId);
  const adminMap = new Map(adminItems.map((a) => [a.id, a]));
  const mockIds = new Set(
    ANNOUNCEMENTS.filter((a) => a.schoolId === schoolId).map((a) => a.id),
  );

  const mergedMock = ANNOUNCEMENTS.filter(
    (a) => a.schoolId === schoolId && !deletedIds.includes(a.id),
  ).map((a) => adminMap.get(a.id) ?? a);

  const newAdminItems = adminItems.filter(
    (a) => !mockIds.has(a.id) && !deletedIds.includes(a.id),
  );

  return [...mergedMock, ...newAdminItems];
}

/** Published announcements only (student views). */
export function getPublishedAnnouncements(schoolId: string): Announcement[] {
  return getAllAnnouncementsForAdmin(schoolId).filter((a) => a.isPublished !== false);
}

/** Save (create or update) an announcement. */
export function saveAnnouncement(schoolId: string, ann: Announcement): void {
  const items = loadAdminItems(schoolId);
  const idx = items.findIndex((a) => a.id === ann.id);
  const updated =
    idx >= 0 ? items.map((a, i) => (i === idx ? ann : a)) : [...items, ann];
  try {
    localStorage.setItem(KEY(schoolId), JSON.stringify(updated));
  } catch {
    // storage full — silently ignore
  }
}

/** Delete an announcement by ID. */
export function deleteAnnouncement(schoolId: string, id: string): void {
  const items = loadAdminItems(schoolId).filter((a) => a.id !== id);
  try {
    localStorage.setItem(KEY(schoolId), JSON.stringify(items));
  } catch {
    // ignore
  }
  const isMock = ANNOUNCEMENTS.some((a) => a.id === id);
  if (isMock) {
    const deletedIds = loadDeletedIds(schoolId);
    if (!deletedIds.includes(id)) {
      try {
        localStorage.setItem(DEL_KEY(schoolId), JSON.stringify([...deletedIds, id]));
      } catch {
        // ignore
      }
    }
  }
}
