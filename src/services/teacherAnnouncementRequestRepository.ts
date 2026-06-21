/**
 * Teacher Announcement Request Repository
 *
 * Single source of truth for teacher → admin publication requests.
 * localStorage key (school-scoped): teacher_announcement_requests_<schoolId>
 *
 * Two-step lifecycle:
 *   pending → approved → published
 *   pending → rejected
 */
import type { TeacherAnnouncementRequest, AnnouncementRequestStatus } from '../types';

const KEY = (schoolId: string) => `teacher_announcement_requests_${schoolId}`;

// ─── Internal I/O ─────────────────────────────────────────────────────────────

function loadAll(schoolId: string): TeacherAnnouncementRequest[] {
  try {
    const raw = localStorage.getItem(KEY(schoolId));
    if (!raw) return [];
    return JSON.parse(raw) as TeacherAnnouncementRequest[];
  } catch {
    return [];
  }
}

function persistAll(schoolId: string, requests: TeacherAnnouncementRequest[]): void {
  try {
    localStorage.setItem(KEY(schoolId), JSON.stringify(requests));
  } catch {
    // storage full — silently ignore
  }
}

// ─── ID generation ────────────────────────────────────────────────────────────

export function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Read helpers ─────────────────────────────────────────────────────────────

/** All requests for a school — used by both teacher and admin views. */
export function getAllRequestsForSchool(schoolId: string): TeacherAnnouncementRequest[] {
  return loadAll(schoolId);
}

/** Alias for backward compatibility. */
export const getAllRequests = getAllRequestsForSchool;

/** Requests submitted by a specific teacher. */
export function getRequestsByTeacher(
  schoolId: string,
  teacherUserId: string,
): TeacherAnnouncementRequest[] {
  return loadAll(schoolId).filter((r) => r.requestedByUserId === teacherUserId);
}

/** Alias for backward compatibility. */
export const getTeacherRequests = getRequestsByTeacher;

/** Only pending requests for a school — used by admin badge / dashboard widget. */
export function getPendingRequestsForSchool(
  schoolId: string,
): TeacherAnnouncementRequest[] {
  return loadAll(schoolId).filter((r) => r.status === 'pending');
}

/** Pending count — used by dashboard badge. */
export function getPendingCount(schoolId: string): number {
  return getPendingRequestsForSchool(schoolId).length;
}

/** Look up a single request by ID. Returns undefined if not found. */
export function getRequestById(
  schoolId: string,
  requestId: string,
): TeacherAnnouncementRequest | undefined {
  return loadAll(schoolId).find((r) => r.id === requestId);
}

/**
 * Returns all requests enriched with `requestedBy` alias.
 * Used by admin screens that reference req.requestedBy.
 */
export function getTeacherAnnouncementRequests(
  schoolId: string,
): TeacherAnnouncementRequest[] {
  return loadAll(schoolId).map((r) => ({ ...r, requestedBy: r.requestedByName }));
}

// ─── Write helpers ────────────────────────────────────────────────────────────

/**
 * Create or update a request.
 * Validates required fields before persisting.
 */
export function saveRequest(request: TeacherAnnouncementRequest): void {
  if (!request.schoolId || !request.requestedByUserId || !request.requestedByName) {
    throw new Error('saveRequest: schoolId, requestedByUserId and requestedByName are required');
  }
  if (!request.title?.trim() || !request.content?.trim()) {
    throw new Error('saveRequest: title and content are required');
  }
  if (!request.status) {
    throw new Error('saveRequest: status is required');
  }

  const all = loadAll(request.schoolId);
  const idx = all.findIndex((r) => r.id === request.id);
  const updated =
    idx >= 0
      ? all.map((r, i) => (i === idx ? request : r))
      : [...all, request];
  persistAll(request.schoolId, updated);
}

/** Delete a request by ID. */
export function deleteRequest(schoolId: string, requestId: string): void {
  const updated = loadAll(schoolId).filter((r) => r.id !== requestId);
  persistAll(schoolId, updated);
}

// ─── Status transitions ───────────────────────────────────────────────────────

/**
 * Step 1 of 2 — mark request as approved (no announcement created yet).
 * The admin must then call publishApprovedRequest to create the announcement.
 */
export function approveRequest(
  requestId: string,
  schoolId: string,
  approvedByUserId: string,
): void {
  const all = loadAll(schoolId);
  const req = all.find((r) => r.id === requestId);
  if (!req) throw new Error(`approveRequest: request ${requestId} not found`);
  if (req.status !== 'pending') {
    throw new Error(`approveRequest: expected status 'pending', got '${req.status}'`);
  }
  const updated = all.map((r) =>
    r.id === requestId
      ? {
          ...r,
          status: 'approved' as AnnouncementRequestStatus,
          approvedAt: new Date().toISOString(),
          approvedByUserId,
          updatedAt: new Date().toISOString(),
        }
      : r,
  );
  persistAll(schoolId, updated);
}

/**
 * Step 2 of 2 — mark request as published and store the created announcement ID.
 * Call this AFTER saveAnnouncement() succeeds.
 */
export function publishApprovedRequest(
  requestId: string,
  schoolId: string,
  announcementId: string,
  publishedByUserId: string,
): void {
  const all = loadAll(schoolId);
  const req = all.find((r) => r.id === requestId);
  if (!req) throw new Error(`publishApprovedRequest: request ${requestId} not found`);
  if (req.status !== 'approved') {
    throw new Error(`publishApprovedRequest: expected status 'approved', got '${req.status}'`);
  }
  const now = new Date().toISOString();
  const updated = all.map((r) =>
    r.id === requestId
      ? {
          ...r,
          status: 'published' as AnnouncementRequestStatus,
          publishedAt: now,
          publishedByUserId,
          publishedAnnouncementId: announcementId,
          // Legacy alias for backward compat
          approvedAnnouncementId: announcementId,
          updatedAt: now,
        }
      : r,
  );
  persistAll(schoolId, updated);
}

/** Reject a request with an optional note. */
export function rejectRequest(
  requestId: string,
  schoolId: string,
  adminNote?: string,
): void {
  const all = loadAll(schoolId);
  const req = all.find((r) => r.id === requestId);
  if (!req) throw new Error(`rejectRequest: request ${requestId} not found`);
  const updated = all.map((r) =>
    r.id === requestId
      ? {
          ...r,
          status: 'rejected' as AnnouncementRequestStatus,
          adminNote,
          rejectionReason: adminNote,
          updatedAt: new Date().toISOString(),
        }
      : r,
  );
  persistAll(schoolId, updated);
}
