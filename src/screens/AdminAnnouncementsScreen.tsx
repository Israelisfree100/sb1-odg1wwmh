import React, { useState, useCallback, useMemo } from 'react';
import {
  ChevronRight,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  X,
  Check,
  AlertTriangle,
  Megaphone,
} from 'lucide-react';
import type { User, Announcement, AnnouncementAudience } from '../types';
import { getSchool, getClass } from '../utils/dataHelpers';
import {
  getAllAnnouncementsForAdmin,
  saveAnnouncement,
  deleteAnnouncement,
  generateAnnouncementId,
} from '../services/announcementRepository';
import { CLASSES } from '../data/schools';

interface Props {
  activeUser: User;
  onBack: () => void;
  onLogout: () => void;
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface AnnForm {
  id: string;
  title: string;
  content: string;
  author: string;
  audience: AnnouncementAudience;
  targetGrade: string;
  targetClassId: string;
  date: string;
  important: boolean;
  isPublished: boolean;
}

function emptyForm(schoolId: string): AnnForm {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  return {
    id: '',
    title: '',
    content: '',
    author: '',
    audience: 'school',
    targetGrade: '',
    targetClassId: '',
    date: `${dd}/${mm}`,
    important: false,
    isPublished: true,
  };
  void schoolId;
}

function announcementToForm(ann: Announcement): AnnForm {
  return {
    id: ann.id,
    title: ann.title,
    content: ann.content,
    author: ann.author,
    audience: ann.audience,
    targetGrade: ann.targetGrade ?? '',
    targetClassId: ann.targetClassId ?? '',
    date: ann.date,
    important: ann.important,
    isPublished: ann.isPublished !== false,
  };
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  school: 'כל בית הספר',
  grade: 'שכבה',
  class: 'כיתה',
  parents: 'הורים',
};

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-gray-100" dir="rtl">
        <div className="flex items-start gap-3 mb-5">
          <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
          <p className="text-gray-800 font-medium leading-snug">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 rounded-xl transition-colors"
          >
            מחיקה
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-xl transition-colors"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminAnnouncementsScreen({ activeUser, onBack, onLogout }: Props) {
  const school = getSchool(activeUser.schoolId);
  const schoolClasses = CLASSES.filter((c) => c.schoolId === activeUser.schoolId);

  const [items, setItems] = useState<Announcement[]>(() =>
    getAllAnnouncementsForAdmin(activeUser.schoolId),
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AnnForm>(() => emptyForm(activeUser.schoolId));
  const [errors, setErrors] = useState<Partial<Record<keyof AnnForm, string>>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const reload = useCallback(() => {
    setItems(getAllAnnouncementsForAdmin(activeUser.schoolId));
  }, [activeUser.schoolId]);

  const showSuccess = useCallback((msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(): boolean {
    const e: Partial<Record<keyof AnnForm, string>> = {};
    if (!form.title.trim()) e.title = 'נא להזין כותרת';
    if (!form.content.trim()) e.content = 'נא להזין תוכן';
    if (!form.author.trim()) e.author = 'נא להזין שם מחבר';
    if (!form.audience) e.audience = 'נא לבחור קהל';
    if (form.audience === 'grade' && !form.targetGrade.trim())
      e.targetGrade = 'נא להזין שכבה';
    if (form.audience === 'class' && !form.targetClassId)
      e.targetClassId = 'נא לבחור כיתה';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  function handleSave() {
    if (!validate()) return;
    const ann: Announcement = {
      id: form.id || generateAnnouncementId(),
      schoolId: activeUser.schoolId,
      title: form.title.trim(),
      content: form.content.trim(),
      author: form.author.trim(),
      audience: form.audience,
      targetGrade: form.audience === 'grade' ? form.targetGrade.trim() : undefined,
      targetClassId: form.audience === 'class' ? form.targetClassId : undefined,
      date: form.date.trim() || new Date().toLocaleDateString('he-IL'),
      important: form.important,
      isPublished: form.isPublished,
    };
    saveAnnouncement(activeUser.schoolId, ann);
    reload();
    setShowForm(false);
    showSuccess(form.id ? 'ההודעה עודכנה בהצלחה ✓' : 'ההודעה נוצרה בהצלחה ✓');
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  function handleDeleteConfirmed() {
    if (!confirmId) return;
    deleteAnnouncement(activeUser.schoolId, confirmId);
    reload();
    setConfirmId(null);
    showSuccess('ההודעה נמחקה ✓');
  }

  // ── Toggle publish ──────────────────────────────────────────────────────────

  function togglePublish(ann: Announcement) {
    saveAnnouncement(activeUser.schoolId, {
      ...ann,
      isPublished: ann.isPublished === false ? true : false,
    });
    reload();
  }

  // ── Open edit form ──────────────────────────────────────────────────────────

  function openEdit(ann: Announcement) {
    setForm(announcementToForm(ann));
    setErrors({});
    setShowForm(true);
  }

  function openCreate() {
    setForm(emptyForm(activeUser.schoolId));
    setErrors({});
    setShowForm(true);
  }

  // ── Audience label helper ───────────────────────────────────────────────────

  function audienceLabel(ann: Announcement): string {
    if (ann.audience === 'grade') return `שכבה ${ann.targetGrade ?? ''}`;
    if (ann.audience === 'class') {
      const cls = ann.targetClassId ? getClass(ann.targetClassId) : undefined;
      return `כיתה ${cls?.name ?? ann.targetClassId ?? ''}`;
    }
    return AUDIENCE_LABELS[ann.audience];
  }

  const draftCount = useMemo(
    () => items.filter((a) => a.isPublished === false).length,
    [items],
  );

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-indigo-700 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-indigo-200 hover:text-white transition-colors text-sm font-medium"
          >
            <ChevronRight className="w-4 h-4" />
            לוח בקרה
          </button>
          <div className="text-center">
            <p className="text-white font-bold text-sm">ניהול הודעות</p>
            <p className="text-indigo-200 text-xs">{school?.name}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="התנתקות"
            className="text-indigo-200 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* ── Success banner ── */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-indigo-600" />
              לוח המודעות
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {items.length} הודעות סה"כ
              {draftCount > 0 && ` — ${draftCount} טיוטות`}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition-colors text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            הודעה חדשה
          </button>
        </div>

        {/* ── Announcements list ── */}
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
            <p className="text-4xl mb-3">📢</p>
            <p className="font-bold text-gray-700">אין הודעות עדיין</p>
            <p className="text-sm text-gray-400 mt-1">לחצו על "הודעה חדשה" כדי ליצור את ההודעה הראשונה</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((ann) => (
              <div
                key={ann.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
                  ann.isPublished === false
                    ? 'border-amber-200 bg-amber-50/30'
                    : 'border-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {ann.important && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
                          <Star className="w-3 h-3 fill-amber-500" />
                          חשוב
                        </span>
                      )}
                      <span className="text-xs text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5 font-medium">
                        {audienceLabel(ann)}
                      </span>
                      {ann.isPublished === false ? (
                        <span className="text-xs text-amber-700 bg-amber-100 rounded-full px-2 py-0.5 font-medium">
                          טיוטה
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 font-medium">
                          פעיל
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-gray-800 text-sm leading-snug">{ann.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{ann.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{ann.author} · {ann.date}</p>
                  </div>

                  {/* ── Actions ── */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(ann)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="עריכה"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePublish(ann)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        ann.isPublished === false
                          ? 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                          : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                      }`}
                      title={ann.isPublished === false ? 'פרסם' : 'הסתר'}
                    >
                      {ann.isPublished === false ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(ann.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="מחיקה"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="h-6" />
      </main>

      {/* ── Create / Edit form overlay ── */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40">
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            dir="rtl"
          >
            {/* Form header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-3xl">
              <h2 className="font-bold text-gray-900 text-base">
                {form.id ? 'עריכת הודעה' : 'הודעה חדשה'}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form body */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSave(); }}
              className="px-5 py-4 space-y-4"
            >
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  כותרת <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="כותרת ההודעה"
                  className={`w-full border rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.title ? 'border-rose-400' : 'border-gray-200'}`}
                />
                {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  תוכן <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="תוכן ההודעה..."
                  className={`w-full border rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none ${errors.content ? 'border-rose-400' : 'border-gray-200'}`}
                />
                {errors.content && <p className="text-xs text-rose-500 mt-1">{errors.content}</p>}
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  כותב/ת <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  placeholder="שם המחבר/ת או תפקיד"
                  className={`w-full border rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.author ? 'border-rose-400' : 'border-gray-200'}`}
                />
                {errors.author && <p className="text-xs text-rose-500 mt-1">{errors.author}</p>}
              </div>

              {/* Audience */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  קהל יעד <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.audience}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, audience: e.target.value as AnnouncementAudience, targetGrade: '', targetClassId: '' }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {(Object.keys(AUDIENCE_LABELS) as AnnouncementAudience[]).map((k) => (
                    <option key={k} value={k}>
                      {AUDIENCE_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grade (conditional) */}
              {form.audience === 'grade' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    שכבה <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.targetGrade}
                    onChange={(e) => setForm((f) => ({ ...f, targetGrade: e.target.value }))}
                    placeholder="למשל: ג׳"
                    className={`w-full border rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.targetGrade ? 'border-rose-400' : 'border-gray-200'}`}
                  />
                  {errors.targetGrade && <p className="text-xs text-rose-500 mt-1">{errors.targetGrade}</p>}
                </div>
              )}

              {/* Class (conditional) */}
              {form.audience === 'class' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    כיתה <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.targetClassId}
                    onChange={(e) => setForm((f) => ({ ...f, targetClassId: e.target.value }))}
                    className={`w-full border rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.targetClassId ? 'border-rose-400' : 'border-gray-200'}`}
                  >
                    <option value="">— בחרו כיתה —</option>
                    {schoolClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.teacherName})
                      </option>
                    ))}
                  </select>
                  {errors.targetClassId && <p className="text-xs text-rose-500 mt-1">{errors.targetClassId}</p>}
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">תאריך</label>
                <input
                  type="text"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  placeholder="dd/mm"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex gap-5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.important}
                    onChange={(e) => setForm((f) => ({ ...f, important: e.target.checked }))}
                    className="w-4 h-4 rounded accent-amber-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">הודעה חשובה</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                    className="w-4 h-4 rounded accent-indigo-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">פרסם עכשיו</span>
                </label>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
                >
                  {form.id ? 'שמור שינויים' : 'צור הודעה'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl transition-colors text-sm"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {confirmId && (
        <ConfirmDialog
          message="האם למחוק את ההודעה לצמיתות? הפעולה אינה הפיכה."
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
