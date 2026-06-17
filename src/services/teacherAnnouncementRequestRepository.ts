/**
 * Teacher Announcement Request Repository
 * Manages the full lifecycle of teacher-to-admin announcement requests.
 * localStorage key: teacher_announcement_requests_<schoolId>
 */
import type { TeacherAnnouncementRequest } from '../types';

const KEY = (schoolId: string) => `teacher_announcement_requests_${schoolId}`;

export function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadRequests(schoolId: string): TeacherAnnouncementRequest[] {
  try {
    return JSON.parse(
      localStorage.getItem(KEY(schoolId)) ?? '[]',
    ) as TeacherAnnouncementRequest[];
  } catch {
    return [];
  }
}

function saveAll(schoolId: string, requests: TeacherAnnouncementRequest[]): void {
  try {
    localStorage.setItem(KEY(schoolId), JSON.stringify(requests));
  } catch {
    // ignore
  }
}

/** All requests for a school (admin view — all statuses). */
export function getAllRequests(schoolId: string): TeacherAnnouncementRequest[] {
  return loadRequests(schoolId);
}

/** Requests created by a specific teacher. */
export function getTeacherRequests(
  schoolId: string,
  teacherUserId: string,
): TeacherAnnouncementRequest[] {
  return loadRequests(schoolId).filter((r) => r.requestedByUserId === teacherUserId);
}

/** Pending requests count for a school (admin badge). */
export function getPendingCount(schoolId: string): number {
  return loadRequests(schoolId).filter((r) => r.status === 'pending').length;
}

/** Save (create or update) a request. */
export function saveRequest(request: TeacherAnnouncementRequest): void {
  const all = loadRequests(request.schoolId);
  const idx = all.findIndex((r) => r.id === request.id);
  const updated =
    idx >= 0
      ? all.map((r, i) => (i === idx ? request : r))
      : [...all, request];
  saveAll(request.schoolId, updated);
}

/** Delete a request by ID. */
export function deleteRequest(schoolId: string, requestId: string): void {
  const updated = loadRequests(schoolId).filter((r) => r.id !== requestId);
  saveAll(schoolId, updated);
}

/** Alias for getAllRequests — used by admin announcement screen. */
export function getTeacherAnnouncementRequests(schoolId: string): TeacherAnnouncementRequest[] {
  return loadRequests(schoolId).map((r) => ({ ...r, requestedBy: r.requestedByName }));
}

/** Approve a request and link the created announcement ID. */
export function approveRequest(requestId: string, schoolId: string, announcementId: string): void {
  const all = loadRequests(schoolId);
  const updated = all.map((r) =>
    r.id === requestId
      ? { ...r, status: 'approved' as const, approvedAnnouncementId: announcementId, updatedAt: new Date().toISOString() }
      : r,
  );
  saveAll(schoolId, updated);
}

/** Reject a request with an optional admin note. */
export function rejectRequest(requestId: string, schoolId: string, adminNote?: string): void {
  const all = loadRequests(schoolId);
  const updated = all.map((r) =>
    r.id === requestId
      ? { ...r, status: 'rejected' as const, adminNote, updatedAt: new Date().toISOString() }
      : r,
  );
  saveAll(schoolId, updated);
}
