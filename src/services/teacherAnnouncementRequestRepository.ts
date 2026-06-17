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
