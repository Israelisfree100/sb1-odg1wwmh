import React, { useState, useMemo } from 'react';
import {
  ChevronRight, LogOut, Plus, Pencil, Trash2, Eye, EyeOff,
  Star, X, CheckCircle, AlertTriangle, Megaphone, Users,
} from 'lucide-react';
import type {
  User, Announcement, AnnouncementAudienceRole, AnnouncementScopeType,
  TeacherAnnouncementRequest,
} from '../types';
import { getSchool } from '../utils/dataHelpers';
import {
  getAllAnnouncementsForAdmin, saveAnnouncement, deleteAnnouncement, generateAnnouncementId,
} from '../services/announcementRepository';
import {
  getTeacherAnnouncementRequests,
  getAllRequestsForSchool,
  approveRequest,
  rejectRequest,
  publishApprovedRequest,
} from '../services/teacherAnnouncementRequestRepository';
import { getAllClassesForSchool } from '../services/classRepository';
import { getAudiencePreview } from '../utils/announcementVisibility';

interface Props { activeUser: User; onBack: () => void; onLogout: () => void; }

const ROLE_OPTIONS: { value: AnnouncementAudienceRole; label: string }[] = [
  { value: 'students', label: 'תלמידים' },
  { value: 'parents', label: 'הורים' },
  { value: 'teachers', label: 'מורים' },
  { value: 'school_admin', label: 'הנהלה' },
  { value: 'staff', label: 'צוות' },
  { value: 'students_and_parents', label: 'תלמידים והורים' },
  { value: 'all_users', label: 'כל המשתמשים' },
];

const SCOPE_OPTIONS: { value: AnnouncementScopeType; label: string }[] = [
  { value: 'whole_school', label: 'כל בית הספר' },
  { value: 'grade', label: 'שכבה' },
  { value: 'class', label: 'כיתה ספציפית' },
];

interface AnnForm {
  id?: string;
  title: string; content: string; author: string; date: string;
  publishAt: string; expiresAt: string;
  important: boolean; isPublished: boolean;
  audienceRoles: AnnouncementAudienceRole[];
  scopeType: AnnouncementScopeType | '';
  targetGrade: string;
  targetClassIds: string[];
}

function todayStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function emptyForm(): AnnForm {
  return {
    title: '', content: '', author: '', date: todayStr(), publishAt: '', expiresAt: '',
    important: false, isPublished: true,
    audienceRoles: ['all_users'], scopeType: 'whole_school',
    targetGrade: '', targetClassIds: [],
  };
}

function annToForm(ann: Announcement): AnnForm {
  const scopeType = ann.scopeType
    ?? (ann.audience === 'school' ? 'whole_school' : ann.audience === 'grade' ? 'grade' : ann.audience === 'class' ? 'class' : 'whole_school');
  const roles: AnnouncementAudienceRole[] = ann.audienceRoles?.length
    ? ann.audienceRoles
    : ann.audience === 'parents' ? ['parents']
      : ann.audience === 'grade' || ann.audience === 'class' ? ['students', 'parents']
        : ['all_users'];
  return {
    id: ann.id,
    title: ann.title, content: ann.content, author: ann.author, date: ann.date,
    publishAt: ann.publishAt ?? '', expiresAt: ann.expiresAt ?? '',
    important: ann.important, isPublished: ann.isPublished !== false,
    audienceRoles: roles, scopeType,
    targetGrade: ann.targetGrade ?? '',
    targetClassIds: ann.targetClassIds?.length ? ann.targetClassIds : ann.targetClassId ? [ann.targetClassId] : [],
  };
}

/**
 * Maps a teacher's legacy requestedAudience + targetGrade into the new extended
 * targeting fields used in the announcement form and announcement repository.
 * This ensures the admin's approval form is always pre-populated with correct
 * audience / scope, preventing accidental publication to the wrong audience.
 */
function requestToFormDefaults(req: TeacherAnnouncementRequest): Partial<AnnForm> {
  let audienceRoles: AnnouncementAudienceRole[];
  let scopeType: AnnouncementScopeType;
  switch (req.requestedAudience) {
    case 'parents':
      audienceRoles = ['parents'];
      scopeType = 'whole_school';
      break;
    case 'grade':
      audienceRoles = ['students', 'parents'];
      scopeType = 'grade';
      break;
    case 'school':
    default:
      audienceRoles = ['all_users'];
      scopeType = 'whole_school';
  }
  return {
    title: req.title,
    content: req.content,
    // Guaranteed non-empty: requestedByName is required in TeacherAnnouncementRequest
    author: req.requestedByName || (req.requestedBy ?? ''),
    audienceRoles,
    scopeType,
    targetGrade: scopeType === 'grade' ? (req.targetGrade ?? '') : '',
    important: req.important,
    publishAt: req.requestedPublishDate ?? '',
  };
}

type ActiveTab = 'announcements' | 'requests';

export function AdminAnnouncementsScreen({ activeUser, onBack, onLogout }: Props) {
  const schoolId = activeUser.schoolId;
  const school = getSchool(schoolId);
  const classes = useMemo(() => getAllClassesForSchool(schoolId).filter((c) => c.isActive !== false), [schoolId]);
  const classNameMap = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes]);
  const grades = useMemo(() => [...new Set(classes.map((c) => c.grade))].sort(), [classes]);

  const [tab, setTab] = useState<ActiveTab>('announcements');
  const [announcements, setAnnouncements] = useState(() => getAllAnnouncementsForAdmin(schoolId));
  const [requests, setRequests] = useState(() => getTeacherAnnouncementRequests(schoolId));
  const [form, setForm] = useState<AnnForm | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [approveReqId, setApproveReqId] = useState<string | null>(null);
  const [approveForm, setApproveForm] = useState<AnnForm | null>(null);

  const refresh = () => {
    setAnnouncements(getAllAnnouncementsForAdmin(schoolId));
    setRequests(getTeacherAnnouncementRequests(schoolId));
  };
  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 2500); };
  const showErr = (msg: string) => { setSuccess(''); setFormErrors((prev) => ({ ...prev, _global: msg })); };

  const validate = (f: AnnForm): boolean => {
    const e: Record<string, string> = {};
    if (!f.title?.trim()) e.title = 'חובה';
    if (!f.content?.trim()) e.content = 'חובה';
    if (!f.author?.trim()) e.author = 'חובה — שם הכותב חסר';
    if (!f.audienceRoles?.length) e.audienceRoles = 'בחר קהל יעד אחד לפחות';
    if (!f.scopeType) e.scopeType = 'חובה';
    if (f.scopeType === 'grade' && !f.targetGrade) e.targetGrade = 'חובה — הזן שכבת יעד';
    if (f.scopeType === 'class' && !f.targetClassIds?.length) e.targetClassIds = 'בחר כיתה אחת לפחות';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  /** Builds the common Announcement object from an AnnForm, shared by save and approve. */
  const buildAnnouncement = (f: AnnForm, overrideId?: string): Announcement => ({
    id: overrideId ?? f.id ?? generateAnnouncementId(),
    schoolId,
    title: f.title.trim(),
    content: f.content.trim(),
    author: (f.author ?? '').trim(),
    date: f.date,
    audience: f.scopeType === 'grade' ? 'grade'
      : f.scopeType === 'class' ? 'class'
      : (f.audienceRoles.includes('parents') && f.audienceRoles.length === 1) ? 'parents'
      : 'school',
    targetGrade: f.scopeType === 'grade' ? f.targetGrade : undefined,
    targetClassId: f.scopeType === 'class' && f.targetClassIds.length > 0
      ? f.targetClassIds[0] : undefined,
    important: f.important,
    isPublished: f.isPublished,
    audienceRoles: f.audienceRoles,
    scopeType: f.scopeType as AnnouncementScopeType,
    targetClassIds: f.scopeType === 'class' ? f.targetClassIds : undefined,
    publishAt: f.publishAt || undefined,
    expiresAt: f.expiresAt || undefined,
    createdByUserId: activeUser.id,
    createdByRole: 'school_admin',
  });

  const handleSave = (f: AnnForm) => {
    if (!validate(f)) return;
    const ann = buildAnnouncement(f);
    saveAnnouncement(schoolId, ann);
    refresh(); setForm(null); setApproveForm(null); setApproveReqId(null);
    showSuccess(f.id ? 'ההודעה עודכנה' : 'ההודעה נוצרה בהצלחה');
  };

  /** Step 1: approve only — no announcement created yet. */
  const handleApproveRequest = (reqId: string) => {
    if (activeUser.role !== 'school_admin') { showErr('רק מנהל בית ספר רשאי לאשר בקשות'); return; }
    const live = getAllRequestsForSchool(schoolId).find((r) => r.id === reqId);
    if (!live) { showErr('הבקשה לא נמצאה'); refresh(); return; }
    if (live.status !== 'pending') { showErr(`הבקשה כבר בסטטוס: ${live.status}`); refresh(); return; }
    if (live.schoolId !== schoolId) { showErr('הבקשה שייכת לבית ספר אחר'); return; }
    try {
      approveRequest(reqId, schoolId, activeUser.id);
    } catch (e) {
      showErr(e instanceof Error ? e.message : 'שגיאה בלתי צפויה');
      return;
    }
    refresh();
    showSuccess('הבקשה אושרה. כעת ניתן לפרסם את ההודעה.');
  };

  /** Step 2: publish — creates announcement and marks request as published. */
  const handlePublishRequest = (reqId: string, f: AnnForm) => {
    if (activeUser.role !== 'school_admin') { showErr('רק מנהל בית ספר רשאי לפרסם הודעות'); return; }
    const live = getAllRequestsForSchool(schoolId).find((r) => r.id === reqId);
    if (!live) { showErr('הבקשה לא נמצאה'); setApproveForm(null); setApproveReqId(null); refresh(); return; }
    if (live.status === 'published') { showErr('ההודעה כבר פורסמה'); setApproveForm(null); setApproveReqId(null); refresh(); return; }
    if (live.status !== 'approved') { showErr('ניתן לפרסם רק בקשות שאושרו'); return; }
    if (!validate(f)) return;
    const ann = buildAnnouncement(f, generateAnnouncementId());
    try {
      saveAnnouncement(schoolId, ann);
      publishApprovedRequest(reqId, schoolId, ann.id, activeUser.id);
    } catch (e) {
      showErr(e instanceof Error ? e.message : 'שגיאה בפרסום ההודעה');
      return;
    }
    refresh(); setApproveForm(null); setApproveReqId(null);
    showSuccess('ההודעה פורסמה בהצלחה.');
  };

  const pendingRequests = useMemo(
    () => requests.filter((r) => r.status === 'pending' || r.status === 'approved'),
    [requests],
  );

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 font-sans">
      <header className="bg-indigo-700 shadow-lg sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1 text-indigo-200 hover:text-white text-sm">
              <ChevronRight className="w-4 h-4" /><span className="hidden sm:inline">לוח ניהול</span>
            </button>
            <div className="h-5 w-px bg-indigo-500" />
            <div>
              <p className="text-white font-bold text-sm">לוח מודעות והודעות</p>
              <p className="text-indigo-300 text-xs">{school?.name}</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm">
            <LogOut className="w-4 h-4" /><span className="hidden sm:inline">יציאה</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {success && <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm text-emerald-800 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}
        {formErrors._global && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 text-sm text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />{formErrors._global}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm">
          <button onClick={() => setTab('announcements')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === 'announcements' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Megaphone className="w-4 h-4" />הודעות
          </button>
          <button onClick={() => setTab('requests')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === 'requests' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Users className="w-4 h-4" />בקשות מורים
            {pendingRequests.length > 0 && <span className="bg-rose-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>}
          </button>
        </div>

        {tab === 'announcements' && (
          <>
            <div className="flex justify-end">
              <button onClick={() => { setForm(emptyForm()); setFormErrors({}); }}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                <Plus className="w-4 h-4" />הודעה חדשה
              </button>
            </div>

            {announcements.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
                <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">אין הודעות</p>
              </div>
            ) : (
              <div className="space-y-2">
                {announcements.map((ann) => {
                  const preview = getAudiencePreview(
                    ann.audienceRoles?.length ? ann.audienceRoles : ['all_users'],
                    ann.scopeType ?? 'whole_school',
                    ann.targetGrade ?? '',
                    ann.targetClassIds ?? (ann.targetClassId ? [ann.targetClassId] : []),
                    classNameMap,
                  );
                  return (
                    <div key={ann.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-bold text-gray-800">{ann.title}</p>
                            {ann.important && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />}
                            {ann.isPublished === false
                              ? <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">טיוטה</span>
                              : <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">פורסם</span>}
                          </div>
                          <p className="text-xs text-indigo-600 font-semibold mb-0.5">{preview}</p>
                          <p className="text-xs text-gray-400">{ann.author} · {ann.date}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ann.content}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => {
                            saveAnnouncement(schoolId, { ...ann, isPublished: ann.isPublished === false ? true : false });
                            refresh();
                          }} className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50" title={ann.isPublished === false ? 'פרסם' : 'העבר לטיוטה'}>
                            {ann.isPublished === false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => { setForm(annToForm(ann)); setFormErrors({}); }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setConfirm(ann.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">אין בקשות מורים</div>
            ) : requests.map((req) => (
              <div key={req.id} className={`bg-white rounded-xl border shadow-sm px-4 py-3 ${
                req.status === 'pending' ? 'border-amber-200 bg-amber-50/30'
                : req.status === 'approved' ? 'border-sky-200 bg-sky-50/20'
                : 'border-gray-100'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-gray-800">{req.title}</p>
                      {req.status === 'pending' && <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">ממתין לאישור</span>}
                      {req.status === 'approved' && <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2 py-0.5 rounded-full">אושר — ממתין לפרסום</span>}
                      {req.status === 'published' && <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">פורסם</span>}
                      {req.status === 'rejected' && <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">נדחה</span>}
                    </div>
                    <p className="text-xs text-gray-500">{req.requestedBy ?? req.requestedByName} · קהל: {req.requestedAudience}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{req.content}</p>
                    {req.status === 'published' && req.publishedAt && (
                      <p className="text-xs text-emerald-600 mt-1">פורסם ב-{req.publishedAt.split('T')[0]}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveRequest(req.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors">
                          אישור בקשה
                        </button>
                        <button onClick={() => { setRejectId(req.id); setRejectNote(''); }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors">דחה</button>
                      </>
                    )}
                    {req.status === 'approved' && (
                      <button
                        onClick={() => {
                          const defaults = requestToFormDefaults(req);
                          setApproveReqId(req.id);
                          setApproveForm({ ...emptyForm(), ...defaults });
                          setFormErrors({});
                        }}
                        className="px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">
                        פרסום ההודעה
                      </button>
                    )}
                  </div>
                </div>
                {req.adminNote && <p className="text-xs text-gray-400 mt-1.5 bg-gray-50 rounded-lg px-2 py-1">הערת מנהל: {req.adminNote}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Announcement form — shown for both create/edit and approval flows */}
        {(form || approveForm) && (
          <AnnouncementFormModal
            form={(form ?? approveForm)!}
            setForm={form ? setForm : setApproveForm}
            formErrors={formErrors}
            setFormErrors={setFormErrors}
            grades={grades}
            classes={classes}
            classNameMap={classNameMap}
            onSave={(latestForm) => {
              if (form) {
                handleSave(latestForm);
              } else {
                // approveForm is open for the "publish" step (step 2)
                handlePublishRequest(approveReqId!, latestForm);
              }
            }}
            onClose={() => { setForm(null); setApproveForm(null); setApproveReqId(null); setFormErrors({}); }}
            isApproval={!!approveReqId}
          />
        )}

        {/* Reject modal */}
        {rejectId && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" dir="rtl">
              <p className="font-bold text-gray-800 mb-3">דחיית בקשה</p>
              <textarea rows={3} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="הערה לדחייה (אופציונלי)"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none mb-4" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setRejectId(null)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">ביטול</button>
                <button onClick={() => { rejectRequest(rejectId, schoolId, rejectNote); refresh(); setRejectId(null); showSuccess('הבקשה נדחתה'); }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl">דחה</button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm delete */}
        {confirm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" dir="rtl">
              <div className="flex items-center gap-3 mb-4"><AlertTriangle className="w-6 h-6 text-amber-500" />
                <p className="text-sm font-semibold text-gray-800">האם למחוק הודעה זו?</p>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setConfirm(null)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">ביטול</button>
                <button onClick={() => { deleteAnnouncement(schoolId, confirm); refresh(); setConfirm(null); showSuccess('ההודעה נמחקה'); }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl">מחק</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Shared form modal ────────────────────────────────────────────────────────

interface FormProps {
  form: AnnForm;
  setForm: (f: AnnForm | null) => void;
  formErrors: Record<string, string>;
  setFormErrors: (e: Record<string, string>) => void;
  grades: string[];
  classes: { id: string; name: string; grade: string }[];
  classNameMap: Map<string, string>;
  /** Called with the current form value so the parent always gets the freshest data. */
  onSave: (f: AnnForm) => void;
  onClose: () => void;
  isApproval: boolean;
}

function AnnouncementFormModal({
  form, setForm, formErrors, grades, classes, classNameMap, onSave, onClose, isApproval,
}: FormProps) {
  const preview = getAudiencePreview(
    form.audienceRoles.length ? form.audienceRoles : ['all_users'],
    form.scopeType,
    form.targetGrade,
    form.targetClassIds,
    classNameMap,
  );

  const toggleRole = (role: AnnouncementAudienceRole) => {
    const current = form.audienceRoles;
    const updated = current.includes(role) ? current.filter((r) => r !== role) : [...current, role];
    setForm({ ...form, audienceRoles: updated });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 my-4" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-gray-800">{isApproval ? 'אישור בקשה — עריכת הודעה' : form.id ? 'עריכת הודעה' : 'הודעה חדשה'}</p>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="space-y-3">
          {/* Global error message */}
          {formErrors._global && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{formErrors._global}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">כותרת <span className="text-rose-500">*</span></label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors.title ? 'border-rose-400' : 'border-gray-200'}`} />
            {formErrors.title && <p className="text-xs text-rose-500 mt-0.5">{formErrors.title}</p>}
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">תוכן <span className="text-rose-500">*</span></label>
            <textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none ${formErrors.content ? 'border-rose-400' : 'border-gray-200'}`} />
            {formErrors.content && <p className="text-xs text-rose-500 mt-0.5">{formErrors.content}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">שם הכותב <span className="text-rose-500">*</span></label>
              <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
                className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors.author ? 'border-rose-400' : 'border-gray-200'}`} />
              {formErrors.author && <p className="text-xs text-rose-500 mt-0.5">{formErrors.author}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">תאריך</label>
              <input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">תאריך פרסום (אופציונלי)</label>
              <input type="date" value={form.publishAt} onChange={(e) => setForm({ ...form, publishAt: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">תפוגה (אופציונלי)</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>

          {/* Audience roles */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">קהל יעד <span className="text-rose-500">*</span></label>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_OPTIONS.map((r) => (
                <button key={r.value} onClick={() => toggleRole(r.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${form.audienceRoles.includes(r.value) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {r.label}
                </button>
              ))}
            </div>
            {formErrors.audienceRoles && <p className="text-xs text-rose-500 mt-0.5">{formErrors.audienceRoles}</p>}
          </div>

          {/* Scope */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">היקף ארגוני <span className="text-rose-500">*</span></label>
            <div className="flex gap-1.5">
              {SCOPE_OPTIONS.map((s) => (
                <button key={s.value} onClick={() => setForm({ ...form, scopeType: s.value, targetGrade: '', targetClassIds: [] })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${form.scopeType === s.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {s.label}
                </button>
              ))}
            </div>
            {formErrors.scopeType && <p className="text-xs text-rose-500 mt-0.5">{formErrors.scopeType}</p>}
          </div>

          {form.scopeType === 'grade' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">שכבה <span className="text-rose-500">*</span></label>
              <select value={form.targetGrade} onChange={(e) => setForm({ ...form, targetGrade: e.target.value })}
                className={`w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors.targetGrade ? 'border-rose-400' : 'border-gray-200'}`}>
                <option value="">בחר שכבה</option>
                {grades.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              {formErrors.targetGrade && <p className="text-xs text-rose-500 mt-0.5">{formErrors.targetGrade}</p>}
            </div>
          )}

          {form.scopeType === 'class' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">כיתות <span className="text-rose-500">*</span></label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto border border-gray-200 rounded-xl p-2">
                {classes.map((c) => (
                  <button key={c.id} onClick={() => {
                    const ids = form.targetClassIds;
                    setForm({ ...form, targetClassIds: ids.includes(c.id) ? ids.filter((id) => id !== c.id) : [...ids, c.id] });
                  }} className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-colors ${form.targetClassIds.includes(c.id) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {c.name}
                  </button>
                ))}
              </div>
              {formErrors.targetClassIds && <p className="text-xs text-rose-500 mt-0.5">{formErrors.targetClassIds}</p>}
            </div>
          )}

          {/* Options */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={form.important} onChange={(e) => setForm({ ...form, important: e.target.checked })} className="rounded" />
              <span className="text-xs font-semibold text-gray-700">חשוב</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="rounded" />
              <span className="text-xs font-semibold text-gray-700">פרסם עכשיו</span>
            </label>
          </div>

          {/* Preview */}
          {preview && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
              <p className="text-xs text-gray-500 mb-0.5 font-semibold">מי יראה את ההודעה?</p>
              <p className="text-sm font-bold text-indigo-700">{preview}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">ביטול</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">
            {isApproval ? 'אשר ופרסם' : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  );
}
