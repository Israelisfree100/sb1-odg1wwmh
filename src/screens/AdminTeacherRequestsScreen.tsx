import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronRight, LogOut, Check, X, Megaphone,
} from 'lucide-react';
import type { User, TeacherAnnouncementRequest, AnnouncementRequestStatus } from '../types';
import { getSchool, getInitials } from '../utils/dataHelpers';
import { getAllRequests, saveRequest } from '../services/teacherAnnouncementRequestRepository';
import { saveAnnouncement, generateAnnouncementId } from '../services/announcementRepository';

interface Props { activeUser: User; onBack: () => void; onLogout: () => void; }

const STATUS_LABELS: Record<AnnouncementRequestStatus, string> = {
  pending: 'ממתין לאישור',
  approved: 'אושר',
  rejected: 'נדחה',
};

const STATUS_COLORS: Record<AnnouncementRequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

const AUDIENCE_LABELS: Record<string, string> = {
  grade: 'שכבה',
  school: 'כל בית הספר',
  parents: 'הורים',
};

function ConfirmModal({
  title, children, onClose,
}: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div dir="rtl" className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function AdminTeacherRequestsScreen({ activeUser, onBack, onLogout }: Props) {
  const [requests, setRequests] = useState<TeacherAnnouncementRequest[]>(() =>
    getAllRequests(activeUser.schoolId),
  );
  const [actionReq, setActionReq] = useState<TeacherAnnouncementRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'edit' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editContent, setEditContent] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState<AnnouncementRequestStatus | ''>('');

  const school = useMemo(() => getSchool(activeUser.schoolId), [activeUser.schoolId]);
  const initials = getInitials(activeUser.fullName);

  const refresh = useCallback(() => {
    setRequests(getAllRequests(activeUser.schoolId));
  }, [activeUser.schoolId]);

  const showMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3500);
  };

  const visible = useMemo(() =>
    requests.filter((r) => !filterStatus || r.status === filterStatus),
  [requests, filterStatus]);

  const pendingCount = useMemo(() => requests.filter((r) => r.status === 'pending').length, [requests]);

  const openApprove = (r: TeacherAnnouncementRequest) => {
    setActionReq(r);
    setEditContent(r.content);
    setActionType('approve');
  };

  const openReject = (r: TeacherAnnouncementRequest) => {
    setActionReq(r);
    setRejectReason('');
    setActionType('reject');
  };

  const handleApprove = () => {
    if (!actionReq) return;
    const now = new Date().toISOString();

    // Map teacher audience to announcement audience type
    const annAudience: 'school' | 'grade' | 'parents' = actionReq.requestedAudience;

    const ann = {
      id: generateAnnouncementId(),
      schoolId: actionReq.schoolId,
      audience: annAudience,
      targetGrade: actionReq.targetGrade,
      title: actionReq.title,
      content: editContent.trim() || actionReq.content,
      date: now.split('T')[0],
      author: `${actionReq.requestedByName} (אושר על ידי הנהלת בית הספר)`,
      important: actionReq.important,
      isPublished: true,
    };
    saveAnnouncement(actionReq.schoolId, ann);

    const updated: TeacherAnnouncementRequest = {
      ...actionReq,
      status: 'approved',
      updatedAt: now,
    };
    saveRequest(updated);
    refresh();
    setActionReq(null);
    setActionType(null);
    showMsg('הבקשה אושרה — ההודעה פורסמה לקהל היעד');
  };

  const handleReject = () => {
    if (!actionReq) return;
    const updated: TeacherAnnouncementRequest = {
      ...actionReq,
      status: 'rejected',
      rejectionReason: rejectReason.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    saveRequest(updated);
    refresh();
    setActionReq(null);
    setActionType(null);
    showMsg('הבקשה נדחתה');
  };

  const closeModal = () => {
    setActionReq(null);
    setActionType(null);
    setRejectReason('');
    setEditContent('');
  };

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
                {pendingCount > 0 && (
                  <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingCount} ממתינות
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
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-emerald-700 text-sm">
            <Check className="w-4 h-4" /> {success}
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex gap-2">
          {(['', 'pending', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                filterStatus === s
                  ? 'bg-indigo-500 text-white border-indigo-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s === '' ? 'הכל' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <Megaphone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">אין בקשות להצגה</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((r) => (
              <div key={r.id} className={`bg-white rounded-xl border shadow-sm px-4 py-4 ${
                r.status === 'pending' ? 'border-amber-200' : 'border-gray-100'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold text-gray-800">{r.title}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                      {r.important && <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">דחוף</span>}
                    </div>
                    <p className="text-xs text-gray-600 font-medium mb-0.5">
                      מאת: {r.requestedByName}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">
                      קהל מבוקש: {AUDIENCE_LABELS[r.requestedAudience]}
                      {r.targetGrade ? ` — שכבה ${r.targetGrade}` : ''}
                      {r.requestedPublishDate ? ` · ${r.requestedPublishDate}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed mb-1">{r.content.slice(0, 150)}{r.content.length > 150 ? '...' : ''}</p>
                    {r.teacherNote && (
                      <p className="text-xs text-indigo-600 italic">הערת המורה: {r.teacherNote}</p>
                    )}
                    {r.rejectionReason && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">סיבת הדחייה: {r.rejectionReason}</p>
                    )}
                    <p className="text-xs text-gray-300 mt-1">{r.createdAt.split('T')[0]}</p>
                  </div>

                  {r.status === 'pending' && (
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => openApprove(r)}
                        className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                      >
                        <Check className="w-3 h-3" /> אישור
                      </button>
                      <button
                        onClick={() => openReject(r)}
                        className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-1.5 rounded-xl border border-rose-200 transition-colors"
                      >
                        <X className="w-3 h-3" /> דחייה
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Approve modal */}
      {actionType === 'approve' && actionReq && (
        <ConfirmModal title="אישור ופרסום הודעה" onClose={closeModal}>
          <div className="space-y-3">
            <p className="text-xs text-gray-500">ניתן לערוך את תוכן ההודעה לפני פרסומה:</p>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
            <p className="text-xs text-gray-400">
              ייוחס: {actionReq.requestedByName} (אושר ע"י הנהלת בית הספר)
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                אישור ופרסום
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                ביטול
              </button>
            </div>
          </div>
        </ConfirmModal>
      )}

      {/* Reject modal */}
      {actionType === 'reject' && actionReq && (
        <ConfirmModal title="דחיית בקשת הפרסום" onClose={closeModal}>
          <div className="space-y-3">
            <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
              <p className="text-xs font-bold text-rose-800">{actionReq.title}</p>
              <p className="text-xs text-rose-600 mt-0.5">מאת: {actionReq.requestedByName}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">סיבת הדחייה (אופציונלי)</label>
              <input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                placeholder="הסבר קצר למורה..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                דחיית הבקשה
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                ביטול
              </button>
            </div>
          </div>
        </ConfirmModal>
      )}
    </div>
  );
}
