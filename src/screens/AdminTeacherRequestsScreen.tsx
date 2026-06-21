/**
 * AdminTeacherRequestsScreen
 *
 * Two-step flow:
 *   1. pending → "אישור בקשה" → approved   (no announcement yet)
 *   2. approved → "פרסום ההודעה" → published  (announcement created)
 *
 * The screen accepts an optional initialFilter prop (passed from navigation state)
 * to pre-select a tab when navigating from a dashboard widget.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronRight, LogOut, Check, X, Megaphone, AlertTriangle,
  Send, Eye,
} from 'lucide-react';
import type {
  User, TeacherAnnouncementRequest, AnnouncementRequestStatus,
  Announcement, AnnouncementAudienceRole, AnnouncementScopeType,
} from '../types';
import { getSchool, getInitials } from '../utils/dataHelpers';
import {
  getAllRequestsForSchool,
  approveRequest,
  rejectRequest,
  publishApprovedRequest,
} from '../services/teacherAnnouncementRequestRepository';
import { saveAnnouncement, generateAnnouncementId } from '../services/announcementRepository';
import { getAllClassesForSchool } from '../services/classRepository';

interface Props {
  activeUser: User;
  onBack: () => void;
  onLogout: () => void;
  /** Pre-selected tab from navigation state */
  initialFilter?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

type TabKey = 'pending' | 'approved' | 'published' | 'rejected' | 'all';

const TAB_LABELS: Record<TabKey, string> = {
  pending: 'ממתינות',
  approved: 'אושרו',
  published: 'פורסמו',
  rejected: 'נדחו',
  all: 'הכל',
};

const STATUS_BADGE: Record<AnnouncementRequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-sky-100 text-sky-700',
  published: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

const STATUS_LABEL: Record<AnnouncementRequestStatus, string> = {
  pending: 'ממתין לאישור',
  approved: 'אושר — ממתין לפרסום',
  published: 'פורסם',
  rejected: 'נדחה',
};

const AUDIENCE_LABELS: Record<string, string> = {
  grade: 'שכבה',
  school: 'כל בית הספר',
  parents: 'הורים',
};

// ─── Normalization ────────────────────────────────────────────────────────────

function normalizeAudience(req: TeacherAnnouncementRequest): {
  audienceRoles: AnnouncementAudienceRole[];
  scopeType: AnnouncementScopeType;
} {
  switch (req.requestedAudience) {
    case 'parents':
      return { audienceRoles: ['parents'], scopeType: 'whole_school' };
    case 'grade':
      return { audienceRoles: ['students', 'parents'], scopeType: 'grade' };
    case 'school':
    default:
      return { audienceRoles: ['all_users'], scopeType: 'whole_school' };
  }
}

function todayDisplay(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Publish form state ───────────────────────────────────────────────────────

interface PublishForm {
  title: string;
  content: string;
  author: string;
  audienceRoles: AnnouncementAudienceRole[];
  scopeType: AnnouncementScopeType | '';
  targetGrade: string;
  targetClassIds: string[];
  publishAt: string;
  expiresAt: string;
  isImportant: boolean;
}

const ROLE_OPTIONS: { value: AnnouncementAudienceRole; label: string }[] = [
  { value: 'students', label: 'תלמידים' },
  { value: 'parents', label: 'הורים' },
  { value: 'teachers', label: 'מורים' },
  { value: 'school_admin', label: 'הנהלה' },
  { value: 'all_users', label: 'כל המשתמשים' },
];

const SCOPE_OPTIONS: { value: AnnouncementScopeType; label: string }[] = [
  { value: 'whole_school', label: 'כל בית הספר' },
  { value: 'grade', label: 'שכבה' },
  { value: 'class', label: 'כיתה ספציפית' },
];

// ─── Shared modal wrapper ─────────────────────────────────────────────────────

function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
      <div dir="rtl" className="bg-white rounded-2xl shadow-xl w-full max-w-lg mt-8 mb-8">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminTeacherRequestsScreen({
  activeUser, onBack, onLogout, initialFilter,
}: Props) {
  const schoolId = activeUser.schoolId;
  const school = useMemo(() => getSchool(schoolId), [schoolId]);
  const initials = getInitials(activeUser.fullName);
  const classes = useMemo(() => getAllClassesForSchool(schoolId).filter((c) => c.isActive !== false), [schoolId]);
  const grades = useMemo(() => [...new Set(classes.map((c) => c.grade))].sort(), [classes]);

  const validTab = (s?: string): TabKey =>
    (['pending', 'approved', 'published', 'rejected', 'all'] as TabKey[]).includes(s as TabKey)
      ? (s as TabKey)
      : 'pending';

  const [tab, setTab] = useState<TabKey>(() => validTab(initialFilter));
  const [requests, setRequests] = useState<TeacherAnnouncementRequest[]>(() =>
    getAllRequestsForSchool(schoolId),
  );

  // Approve confirmation
  const [approveTarget, setApproveTarget] = useState<TeacherAnnouncementRequest | null>(null);

  // Reject flow
  const [rejectTarget, setRejectTarget] = useState<TeacherAnnouncementRequest | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  // Publish form
  const [publishTarget, setPublishTarget] = useState<TeacherAnnouncementRequest | null>(null);
  const [publishForm, setPublishForm] = useState<PublishForm | null>(null);
  const [publishErrors, setPublishErrors] = useState<Record<string, string>>({});

  // Toast messages
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    setRequests(getAllRequestsForSchool(schoolId));
  }, [schoolId]);

  const showMsg = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); };
  const showErr = (msg: string) => { setError(msg); setTimeout(() => setError(''), 4000); };

  // ── Derived data ──────────────────────────────────────────────────────────

  const visible = useMemo(() =>
    tab === 'all' ? requests : requests.filter((r) => r.status === tab),
  [requests, tab]);

  const counts = useMemo(() => ({
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    published: requests.filter((r) => r.status === 'published').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
    all: requests.length,
  }), [requests]);

  // ── Approve step 1 ────────────────────────────────────────────────────────

  const handleApprove = () => {
    if (!approveTarget) return;
    if (activeUser.role !== 'school_admin') { showErr('רק מנהל בית ספר רשאי לאשר בקשות'); return; }
    if (approveTarget.schoolId !== schoolId) { showErr('הבקשה שייכת לבית ספר אחר'); return; }

    // Re-fetch live state
    const live = getAllRequestsForSchool(schoolId).find((r) => r.id === approveTarget.id);
    if (!live) { showErr('הבקשה לא נמצאה'); setApproveTarget(null); refresh(); return; }
    if (live.status !== 'pending') {
      showErr(live.status === 'approved' ? 'הבקשה כבר אושרה' : `הבקשה כבר בסטטוס: ${STATUS_LABEL[live.status]}`);
      setApproveTarget(null); refresh(); return;
    }

    try {
      approveRequest(approveTarget.id, schoolId, activeUser.id);
    } catch (e) {
      showErr(e instanceof Error ? e.message : 'שגיאה בלתי צפויה');
      return;
    }
    refresh();
    setApproveTarget(null);
    showMsg('הבקשה אושרה. כעת ניתן לפרסם את ההודעה.');
  };

  // ── Reject ────────────────────────────────────────────────────────────────

  const handleReject = () => {
    if (!rejectTarget) return;
    const live = getAllRequestsForSchool(schoolId).find((r) => r.id === rejectTarget.id);
    if (!live || live.status === 'published') {
      showErr('לא ניתן לדחות בקשה שפורסמה'); setRejectTarget(null); refresh(); return;
    }
    try {
      rejectRequest(rejectTarget.id, schoolId, rejectNote.trim() || undefined);
    } catch (e) {
      showErr(e instanceof Error ? e.message : 'שגיאה בלתי צפויה');
      return;
    }
    refresh();
    setRejectTarget(null);
    setRejectNote('');
    showMsg('הבקשה נדחתה');
  };

  // ── Publish step 2 — open form ────────────────────────────────────────────

  const openPublishForm = (req: TeacherAnnouncementRequest) => {
    if (req.status !== 'approved') { showErr('ניתן לפרסם רק בקשות שאושרו'); return; }
    const { audienceRoles, scopeType } = normalizeAudience(req);
    setPublishTarget(req);
    setPublishForm({
      title: req.title,
      content: req.content,
      author: req.requestedByName,
      audienceRoles,
      scopeType,
      targetGrade: scopeType === 'grade' ? (req.targetGrade ?? '') : '',
      targetClassIds: [],
      publishAt: req.requestedPublishDate ?? '',
      expiresAt: '',
      isImportant: req.important,
    });
    setPublishErrors({});
  };

  const validatePublish = (f: PublishForm): boolean => {
    const e: Record<string, string> = {};
    if (!f.title?.trim()) e.title = 'חובה';
    if (!f.content?.trim()) e.content = 'חובה';
    if (!f.author?.trim()) e.author = 'חובה';
    if (!f.audienceRoles?.length) e.audienceRoles = 'בחר קהל יעד';
    if (!f.scopeType) e.scopeType = 'חובה';
    if (f.scopeType === 'grade' && !f.targetGrade?.trim()) e.targetGrade = 'חובה';
    if (f.scopeType === 'class' && !f.targetClassIds?.length) e.targetClassIds = 'בחר כיתה';
    setPublishErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePublish = () => {
    if (!publishTarget || !publishForm) return;
    if (activeUser.role !== 'school_admin') { showErr('רק מנהל בית ספר רשאי לפרסם הודעות'); return; }
    if (!validatePublish(publishForm)) return;

    // Re-fetch live state
    const live = getAllRequestsForSchool(schoolId).find((r) => r.id === publishTarget.id);
    if (!live) { showErr('הבקשה לא נמצאה'); setPublishTarget(null); setPublishForm(null); refresh(); return; }
    if (live.status === 'published') { showErr('ההודעה כבר פורסמה'); setPublishTarget(null); setPublishForm(null); refresh(); return; }
    if (live.status !== 'approved') { showErr('ניתן לפרסם רק בקשות שאושרו'); return; }

    const f = publishForm;
    const ann: Announcement = {
      id: generateAnnouncementId(),
      schoolId,
      audience: f.scopeType === 'grade' ? 'grade'
        : f.scopeType === 'class' ? 'class'
        : (f.audienceRoles.includes('parents') && f.audienceRoles.length === 1) ? 'parents'
        : 'school',
      targetGrade: f.scopeType === 'grade' ? f.targetGrade : undefined,
      targetClassId: f.scopeType === 'class' && f.targetClassIds.length > 0 ? f.targetClassIds[0] : undefined,
      audienceRoles: f.audienceRoles,
      scopeType: f.scopeType as AnnouncementScopeType,
      targetClassIds: f.scopeType === 'class' ? f.targetClassIds : undefined,
      title: f.title.trim(),
      content: f.content.trim(),
      author: `${f.author.trim()} (אושר ע"י הנהלת בית הספר)`,
      date: todayDisplay(),
      important: f.isImportant,
      isPublished: true,
      publishAt: f.publishAt || undefined,
      expiresAt: f.expiresAt || undefined,
      createdByUserId: activeUser.id,
      createdByRole: 'school_admin',
    };

    try {
      saveAnnouncement(schoolId, ann);
      publishApprovedRequest(publishTarget.id, schoolId, ann.id, activeUser.id);
    } catch (e) {
      showErr(e instanceof Error ? e.message : 'שגיאה בפרסום ההודעה');
      return;
    }

    refresh();
    setPublishTarget(null);
    setPublishForm(null);
    showMsg('ההודעה פורסמה בהצלחה.');
  };

  const toggleRole = (role: AnnouncementAudienceRole) => {
    if (!publishForm) return;
    const cur = publishForm.audienceRoles;
    setPublishForm({
      ...publishForm,
      audienceRoles: cur.includes(role) ? cur.filter((r) => r !== role) : [...cur, role],
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 font-sans">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm">
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">לוח ניהול</span>
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <div>
              <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                בקשות פרסום ממורים
                {counts.pending > 0 && (
                  <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {counts.pending}
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500">{school?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <button onClick={onLogout} className="text-gray-400 hover:text-rose-500 transition-colors p-1.5">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Toast messages */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-emerald-700 text-sm">
            <Check className="w-4 h-4" /> {success}
          </div>
        )}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-rose-700 text-sm">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex gap-1 flex-wrap">
          {(Object.keys(TAB_LABELS) as TabKey[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                tab === t
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {TAB_LABELS[t]}
              {counts[t] > 0 && (
                <span className={`text-[10px] font-extrabold rounded-full px-1.5 py-0.5 min-w-[18px] text-center ${
                  tab === t ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {counts[t]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {visible.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <Megaphone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">
              {tab === 'pending'
                ? 'אין בקשות ממתינות לאישור'
                : tab === 'approved'
                  ? 'אין בקשות שאושרו וממתינות לפרסום'
                  : 'אין בקשות להצגה בלשונית זו'}
            </p>
            {tab !== 'all' && requests.length > 0 && (
              <button onClick={() => setTab('all')} className="mt-2 text-indigo-500 text-xs underline">
                הצג את כל הבקשות ({requests.length})
              </button>
            )}
          </div>
        )}

        {/* Request list */}
        <div className="space-y-3">
          {visible.map((r) => (
            <div
              key={r.id}
              className={`bg-white rounded-xl border shadow-sm px-4 py-4 ${
                r.status === 'pending' ? 'border-amber-200'
                : r.status === 'approved' ? 'border-sky-200'
                : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-bold text-gray-800">{r.title}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                    {r.important && (
                      <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">דחוף</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 font-medium mb-0.5">מאת: {r.requestedByName}</p>
                  <p className="text-xs text-gray-500 mb-1">
                    קהל מבוקש: {AUDIENCE_LABELS[r.requestedAudience]}
                    {r.targetGrade ? ` — שכבה ${r.targetGrade}` : ''}
                    {r.requestedPublishDate ? ` · ${r.requestedPublishDate}` : ''}
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed mb-1">
                    {r.content.slice(0, 150)}{r.content.length > 150 ? '...' : ''}
                  </p>
                  {r.teacherNote && (
                    <p className="text-xs text-indigo-600 italic">הערת המורה: {r.teacherNote}</p>
                  )}
                  {r.status === 'rejected' && r.rejectionReason && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">סיבת הדחייה: {r.rejectionReason}</p>
                  )}
                  {r.status === 'approved' && r.approvedAt && (
                    <p className="text-xs text-sky-600 mt-1">אושר ב-{r.approvedAt.split('T')[0]}</p>
                  )}
                  {r.status === 'published' && r.publishedAt && (
                    <p className="text-xs text-emerald-600 mt-1 font-medium">פורסם ב-{r.publishedAt.split('T')[0]}</p>
                  )}
                  <p className="text-xs text-gray-300 mt-1">{r.createdAt.split('T')[0]}</p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {r.status === 'pending' && (
                    <>
                      <button
                        onClick={() => setApproveTarget(r)}
                        className="flex items-center gap-1 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                      >
                        <Check className="w-3 h-3" /> אישור בקשה
                      </button>
                      <button
                        onClick={() => { setRejectTarget(r); setRejectNote(''); }}
                        className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-xl border border-rose-200 transition-colors"
                      >
                        <X className="w-3 h-3" /> דחייה
                      </button>
                    </>
                  )}
                  {r.status === 'approved' && (
                    <>
                      <button
                        onClick={() => openPublishForm(r)}
                        className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                      >
                        <Send className="w-3 h-3" /> פרסום ההודעה
                      </button>
                      <button
                        onClick={() => { setRejectTarget(r); setRejectNote(''); }}
                        className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-xl border border-rose-200 transition-colors"
                      >
                        <X className="w-3 h-3" /> דחייה
                      </button>
                    </>
                  )}
                  {r.status === 'published' && (
                    <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold px-2 py-1">
                      <Eye className="w-3 h-3" /> פורסם
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ── Approve confirmation modal ── */}
      {approveTarget && (
        <Modal title="אישור בקשת פרסום" onClose={() => setApproveTarget(null)}>
          <div className="space-y-4">
            <div className="bg-sky-50 rounded-xl p-3 border border-sky-100">
              <p className="text-xs font-bold text-sky-800">{approveTarget.title}</p>
              <p className="text-xs text-sky-600 mt-0.5">מאת: {approveTarget.requestedByName}</p>
              <p className="text-xs text-sky-600 mt-0.5">
                קהל: {AUDIENCE_LABELS[approveTarget.requestedAudience]}
                {approveTarget.targetGrade ? ` — שכבה ${approveTarget.targetGrade}` : ''}
              </p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              אישור הבקשה לא יפרסם אוטומטית את ההודעה. לאחר האישור תוכל לסקור ולערוך את הפרסום לפני שתשלח אותו.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl text-sm"
              >
                <Check className="w-4 h-4 inline ml-1" />אישור הבקשה
              </button>
              <button
                onClick={() => setApproveTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                ביטול
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Reject modal ── */}
      {rejectTarget && (
        <Modal title="דחיית בקשת הפרסום" onClose={() => { setRejectTarget(null); setRejectNote(''); }}>
          <div className="space-y-3">
            <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
              <p className="text-xs font-bold text-rose-800">{rejectTarget.title}</p>
              <p className="text-xs text-rose-600 mt-0.5">מאת: {rejectTarget.requestedByName}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">סיבת הדחייה (אופציונלי)</label>
              <input
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                placeholder="הסבר קצר למורה..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 rounded-xl text-sm"
              >
                דחיית הבקשה
              </button>
              <button
                onClick={() => { setRejectTarget(null); setRejectNote(''); }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                ביטול
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Publish form modal (step 2) ── */}
      {publishTarget && publishForm && (
        <Modal title="פרסום ההודעה — עריכה לפני שליחה" onClose={() => { setPublishTarget(null); setPublishForm(null); setPublishErrors({}); }}>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {publishErrors._global && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {publishErrors._global}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">כותרת *</label>
              <input
                value={publishForm.title}
                onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value })}
                className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${publishErrors.title ? 'border-rose-400' : 'border-gray-200'}`}
              />
              {publishErrors.title && <p className="text-xs text-rose-500 mt-0.5">{publishErrors.title}</p>}
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">תוכן *</label>
              <textarea
                value={publishForm.content}
                onChange={(e) => setPublishForm({ ...publishForm, content: e.target.value })}
                rows={4}
                className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none ${publishErrors.content ? 'border-rose-400' : 'border-gray-200'}`}
              />
              {publishErrors.content && <p className="text-xs text-rose-500 mt-0.5">{publishErrors.content}</p>}
            </div>

            {/* Author */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">שם הכותב *</label>
              <input
                value={publishForm.author}
                onChange={(e) => setPublishForm({ ...publishForm, author: e.target.value })}
                className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${publishErrors.author ? 'border-rose-400' : 'border-gray-200'}`}
              />
              {publishErrors.author && <p className="text-xs text-rose-500 mt-0.5">{publishErrors.author}</p>}
            </div>

            {/* Audience roles */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">קהל יעד *</label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleRole(value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      publishForm.audienceRoles.includes(value)
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {publishErrors.audienceRoles && <p className="text-xs text-rose-500 mt-0.5">{publishErrors.audienceRoles}</p>}
            </div>

            {/* Scope */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">היקף *</label>
              <div className="flex gap-2 flex-wrap">
                {SCOPE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPublishForm({ ...publishForm, scopeType: value, targetGrade: '', targetClassIds: [] })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      publishForm.scopeType === value
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {publishErrors.scopeType && <p className="text-xs text-rose-500 mt-0.5">{publishErrors.scopeType}</p>}
            </div>

            {/* Grade target */}
            {publishForm.scopeType === 'grade' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">שכבה *</label>
                <select
                  value={publishForm.targetGrade}
                  onChange={(e) => setPublishForm({ ...publishForm, targetGrade: e.target.value })}
                  className={`w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 ${publishErrors.targetGrade ? 'border-rose-400' : 'border-gray-200'}`}
                >
                  <option value="">בחר שכבה...</option>
                  {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                {publishErrors.targetGrade && <p className="text-xs text-rose-500 mt-0.5">{publishErrors.targetGrade}</p>}
              </div>
            )}

            {/* Class target */}
            {publishForm.scopeType === 'class' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">כיתה *</label>
                <div className="flex flex-wrap gap-2">
                  {classes.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        const cur = publishForm.targetClassIds;
                        setPublishForm({
                          ...publishForm,
                          targetClassIds: cur.includes(c.id) ? cur.filter((x) => x !== c.id) : [...cur, c.id],
                        });
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                        publishForm.targetClassIds.includes(c.id)
                          ? 'bg-indigo-500 text-white border-indigo-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
                {publishErrors.targetClassIds && <p className="text-xs text-rose-500 mt-0.5">{publishErrors.targetClassIds}</p>}
              </div>
            )}

            {/* Important */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={publishForm.isImportant}
                onChange={(e) => setPublishForm({ ...publishForm, isImportant: e.target.checked })}
                className="w-4 h-4 rounded accent-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">הודעה דחופה / חשובה</span>
            </label>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">תאריך פרסום (אופציונלי)</label>
                <input
                  type="date"
                  value={publishForm.publishAt}
                  onChange={(e) => setPublishForm({ ...publishForm, publishAt: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">תפוגה (אופציונלי)</label>
                <input
                  type="date"
                  value={publishForm.expiresAt}
                  onChange={(e) => setPublishForm({ ...publishForm, expiresAt: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handlePublish}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" /> פרסם הודעה
              </button>
              <button
                onClick={() => { setPublishTarget(null); setPublishForm(null); setPublishErrors({}); }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                ביטול
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
