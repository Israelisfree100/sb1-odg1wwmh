import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronRight, LogOut, Plus, Pencil, Trash2, X, Check, AlertTriangle, Megaphone,
} from 'lucide-react';
import type { User, TeacherAnnouncementRequest, AnnouncementRequestStatus } from '../types';
import { getSchool, getInitials } from '../utils/dataHelpers';
import {
  getTeacherRequests, saveRequest, deleteRequest, generateRequestId,
} from '../services/teacherAnnouncementRequestRepository';

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

interface FormState {
  id: string;
  title: string;
  content: string;
  requestedAudience: 'grade' | 'school' | 'parents';
  targetGrade: string;
  requestedPublishDate: string;
  important: boolean;
  teacherNote: string;
}

const EMPTY_FORM = (): FormState => ({
  id: '', title: '', content: '',
  requestedAudience: 'school', targetGrade: '',
  requestedPublishDate: '', important: false, teacherNote: '',
});

function ConfirmDialog({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div dir="rtl" className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-gray-700">{message}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">ביטול</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600">מחיקה</button>
        </div>
      </div>
    </div>
  );
}

export function TeacherAnnouncementRequestsScreen({ activeUser, onBack, onLogout }: Props) {
  const [requests, setRequests] = useState<TeacherAnnouncementRequest[]>(() =>
    getTeacherRequests(activeUser.schoolId, activeUser.id),
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  const school = useMemo(() => getSchool(activeUser.schoolId), [activeUser.schoolId]);
  const initials = getInitials(activeUser.fullName);

  const refresh = useCallback(() => {
    setRequests(getTeacherRequests(activeUser.schoolId, activeUser.id));
  }, [activeUser.schoolId, activeUser.id]);

  const showMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const openCreate = () => {
    setForm(EMPTY_FORM());
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (r: TeacherAnnouncementRequest) => {
    if (r.status !== 'pending') return;
    setForm({
      id: r.id, title: r.title, content: r.content,
      requestedAudience: r.requestedAudience, targetGrade: r.targetGrade ?? '',
      requestedPublishDate: r.requestedPublishDate ?? '', important: r.important,
      teacherNote: r.teacherNote ?? '',
    });
    setErrors({});
    setShowForm(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'יש להזין כותרת';
    if (!form.content.trim()) e.content = 'יש להזין תוכן';
    if (form.requestedAudience === 'grade' && !form.targetGrade.trim())
      e.targetGrade = 'יש להזין שכבה';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const now = new Date().toISOString();
    const req: TeacherAnnouncementRequest = {
      id: form.id || generateRequestId(),
      schoolId: activeUser.schoolId,
      requestedByUserId: activeUser.id,
      requestedByName: activeUser.fullName,
      title: form.title.trim(),
      content: form.content.trim(),
      requestedAudience: form.requestedAudience,
      targetGrade: form.targetGrade.trim() || undefined,
      requestedPublishDate: form.requestedPublishDate.trim() || undefined,
      important: form.important,
      teacherNote: form.teacherNote.trim() || undefined,
      status: 'pending',
      createdAt: form.id ? requests.find((r) => r.id === form.id)?.createdAt ?? now : now,
      updatedAt: now,
    };
    saveRequest(req);
    refresh();
    setShowForm(false);
    showMsg(form.id ? 'הבקשה עודכנה' : 'הבקשה נשלחה להנהלה');
  };

  const handleDelete = (id: string) => {
    deleteRequest(activeUser.schoolId, id);
    refresh();
    setDeleteId(null);
    showMsg('הבקשה נמחקה');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 font-sans">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm">
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">לוח מורה</span>
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <div>
              <p className="text-sm font-bold text-gray-800">בקשות פרסום</p>
              <p className="text-xs text-gray-500">{school?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              בקשה חדשה
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <button onClick={onLogout} className="text-gray-400 hover:text-rose-500 transition-colors p-1.5">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Info banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
          <p className="font-bold mb-1">📢 כיצד עובד תהליך הפרסום?</p>
          <p className="text-xs leading-relaxed">
            כאשר ברצונך לפרסם הודעה לכל בית הספר, לשכבה, או להורים — יש להגיש בקשה להנהלה.
            ההנהלה תבחן את הבקשה ותאשר או תדחה אותה. הודעות לכיתה שלך ניתן לשלוח ישירות דרך "הודעות כיתה".
          </p>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-emerald-700 text-sm">
            <Check className="w-4 h-4" /> {success}
          </div>
        )}

        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <Megaphone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">עדיין לא הגשת בקשות פרסום</p>
            <button onClick={openCreate} className="mt-3 text-emerald-600 text-sm underline">
              הגש בקשה ראשונה
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold text-gray-800">{r.title}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                      {r.important && <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">דחוף</span>}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      קהל: {AUDIENCE_LABELS[r.requestedAudience]}
                      {r.targetGrade ? ` — שכבה ${r.targetGrade}` : ''}
                      {r.requestedPublishDate ? ` · תאריך מבוקש: ${r.requestedPublishDate}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed">{r.content.slice(0, 120)}{r.content.length > 120 ? '...' : ''}</p>
                    {r.rejectionReason && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">סיבת הדחייה: {r.rejectionReason}</p>
                    )}
                    <p className="text-xs text-gray-300 mt-1">{r.createdAt.split('T')[0]}</p>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(r.id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Form overlay */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
          <div dir="rtl" className="bg-white rounded-2xl shadow-xl w-full max-w-lg mt-8 mb-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">
                {form.id ? 'עריכת בקשת פרסום' : 'בקשת פרסום חדשה'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">כותרת *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="כותרת ההודעה"
                />
                {errors.title && <p className="text-xs text-rose-600 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">תוכן *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                  placeholder="תוכן ההודעה"
                />
                {errors.content && <p className="text-xs text-rose-600 mt-1">{errors.content}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">קהל מבוקש *</label>
                <div className="flex gap-2 flex-wrap">
                  {(['school', 'grade', 'parents'] as const).map((aud) => (
                    <button
                      key={aud}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, requestedAudience: aud }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        form.requestedAudience === aud
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {AUDIENCE_LABELS[aud]}
                    </button>
                  ))}
                </div>
              </div>

              {form.requestedAudience === 'grade' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">שכבה *</label>
                  <input
                    value={form.targetGrade}
                    onChange={(e) => setForm((f) => ({ ...f, targetGrade: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="לדוגמה: ג׳"
                  />
                  {errors.targetGrade && <p className="text-xs text-rose-600 mt-1">{errors.targetGrade}</p>}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">תאריך פרסום מבוקש (אופציונלי)</label>
                <input
                  type="date"
                  value={form.requestedPublishDate}
                  onChange={(e) => setForm((f) => ({ ...f, requestedPublishDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">הערה להנהלה (אופציונלי)</label>
                <input
                  value={form.teacherNote}
                  onChange={(e) => setForm((f) => ({ ...f, teacherNote: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="הקשר או הסבר לצוות ההנהלה"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.important}
                  onChange={(e) => setForm((f) => ({ ...f, important: e.target.checked }))}
                  className="w-4 h-4 rounded accent-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700">הודעה דחופה / חשובה</span>
              </label>
            </div>

            <div className="flex gap-2 p-5 border-t border-gray-100">
              <button
                onClick={handleSave}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                {form.id ? 'עדכון הבקשה' : 'שליחת בקשה להנהלה'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          message="האם למחוק את הבקשה? פעולה זו בלתי הפיכה."
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
