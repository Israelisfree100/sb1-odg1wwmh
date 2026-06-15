import React, { useState, useCallback } from 'react';
import {
  ChevronRight,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';
import type { User, Exam } from '../types';
import { getSchool, getClass } from '../utils/dataHelpers';
import {
  getAllExamsForAdmin,
  saveExam,
  deleteExam,
  generateExamId,
} from '../services/examRepository';
import { CLASSES } from '../data/schools';

interface Props {
  activeUser: User;
  onBack: () => void;
  onLogout: () => void;
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface ExamForm {
  id: string;
  subject: string;
  classId: string;
  dateLabel: string;
  topicsRaw: string;
  teacherName: string;
  notes: string;
}

function emptyForm(): ExamForm {
  return {
    id: '',
    subject: '',
    classId: '',
    dateLabel: '',
    topicsRaw: '',
    teacherName: '',
    notes: '',
  };
}

function examToForm(exam: Exam): ExamForm {
  return {
    id: exam.id,
    subject: exam.subject,
    classId: exam.classId,
    dateLabel: exam.dateLabel,
    topicsRaw: exam.topics.join('\n'),
    teacherName: exam.teacherName,
    notes: exam.notes ?? '',
  };
}

function parseTopics(raw: string): string[] {
  return raw
    .split(/[\n,،]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

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

export function AdminExamsScreen({ activeUser, onBack, onLogout }: Props) {
  const school = getSchool(activeUser.schoolId);
  const schoolClasses = CLASSES.filter((c) => c.schoolId === activeUser.schoolId);

  const [items, setItems] = useState<Exam[]>(() =>
    getAllExamsForAdmin(activeUser.schoolId),
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ExamForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ExamForm, string>>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const reload = useCallback(() => {
    setItems(getAllExamsForAdmin(activeUser.schoolId));
  }, [activeUser.schoolId]);

  const showSuccess = useCallback((msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(): boolean {
    const e: Partial<Record<keyof ExamForm, string>> = {};
    if (!form.subject.trim()) e.subject = 'נא להזין מקצוע';
    if (!form.classId) e.classId = 'נא לבחור כיתה';
    if (!form.dateLabel.trim()) e.dateLabel = 'נא להזין תאריך';
    const topics = parseTopics(form.topicsRaw);
    if (topics.length === 0) e.topicsRaw = 'נא להזין נושא אחד לפחות';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  function handleSave() {
    if (!validate()) return;
    const cls = getClass(form.classId);
    const exam: Exam = {
      id: form.id || generateExamId(),
      schoolId: activeUser.schoolId,
      classId: form.classId,
      subject: form.subject.trim(),
      dateLabel: form.dateLabel.trim(),
      topics: parseTopics(form.topicsRaw),
      teacherName: form.teacherName.trim(),
      notes: form.notes.trim() || undefined,
    };
    void cls;
    saveExam(activeUser.schoolId, exam);
    reload();
    setShowForm(false);
    showSuccess(form.id ? 'המבחן עודכן בהצלחה ✓' : 'המבחן נוצר בהצלחה ✓');
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  function handleDeleteConfirmed() {
    if (!confirmId) return;
    deleteExam(activeUser.schoolId, confirmId);
    reload();
    setConfirmId(null);
    showSuccess('המבחן נמחק ✓');
  }

  // ── Open edit / create form ─────────────────────────────────────────────────

  function openEdit(exam: Exam) {
    setForm(examToForm(exam));
    setErrors({});
    setShowForm(true);
  }

  function openCreate() {
    setForm(emptyForm());
    setErrors({});
    setShowForm(true);
  }

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
            <p className="text-white font-bold text-sm">ניהול מבחנים</p>
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
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              מבחנים
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">{items.length} מבחנים מוגדרים</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition-colors text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            מבחן חדש
          </button>
        </div>

        {/* ── Exams list ── */}
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
            <p className="text-4xl mb-3">📝</p>
            <p className="font-bold text-gray-700">אין מבחנים עדיין</p>
            <p className="text-sm text-gray-400 mt-1">לחצו על "מבחן חדש" כדי להוסיף מבחן</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((exam) => {
              const cls = getClass(exam.classId);
              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 rounded-full px-2.5 py-0.5">
                          {exam.subject}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                          {cls?.name ?? exam.classId}
                        </span>
                        <span className="text-xs text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                          {exam.dateLabel}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium leading-snug">
                        {exam.teacherName && (
                          <span className="text-gray-500">{exam.teacherName} · </span>
                        )}
                        {exam.topics.length} נושאים: {exam.topics.join(', ')}
                      </p>
                      {exam.notes && (
                        <p className="text-xs text-gray-400 mt-0.5">{exam.notes}</p>
                      )}
                    </div>

                    {/* ── Actions ── */}
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(exam)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="עריכה"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(exam.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="מחיקה"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
                {form.id ? 'עריכת מבחן' : 'מבחן חדש'}
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
              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  מקצוע <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="חשבון, עברית, אנגלית..."
                  className={`w-full border rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.subject ? 'border-rose-400' : 'border-gray-200'}`}
                />
                {errors.subject && <p className="text-xs text-rose-500 mt-1">{errors.subject}</p>}
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  כיתה <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.classId}
                  onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                  className={`w-full border rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.classId ? 'border-rose-400' : 'border-gray-200'}`}
                >
                  <option value="">— בחרו כיתה —</option>
                  {schoolClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.teacherName})
                    </option>
                  ))}
                </select>
                {errors.classId && <p className="text-xs text-rose-500 mt-1">{errors.classId}</p>}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  תאריך / תיאור מועד <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.dateLabel}
                  onChange={(e) => setForm((f) => ({ ...f, dateLabel: e.target.value }))}
                  placeholder="למשל: יום ד׳ הקרוב, 25/06"
                  className={`w-full border rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.dateLabel ? 'border-rose-400' : 'border-gray-200'}`}
                />
                {errors.dateLabel && <p className="text-xs text-rose-500 mt-1">{errors.dateLabel}</p>}
              </div>

              {/* Topics */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  נושאים <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={form.topicsRaw}
                  onChange={(e) => setForm((f) => ({ ...f, topicsRaw: e.target.value }))}
                  placeholder="נושא אחד בכל שורה או מופרד בפסיקים"
                  className={`w-full border rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none ${errors.topicsRaw ? 'border-rose-400' : 'border-gray-200'}`}
                />
                {errors.topicsRaw && <p className="text-xs text-rose-500 mt-1">{errors.topicsRaw}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {parseTopics(form.topicsRaw).length} נושאים מזוהים
                </p>
              </div>

              {/* Teacher */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">שם המורה</label>
                <input
                  type="text"
                  value={form.teacherName}
                  onChange={(e) => setForm((f) => ({ ...f, teacherName: e.target.value }))}
                  placeholder="שם המורה"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">הערות (אופציונלי)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="הערות נוספות..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
                >
                  {form.id ? 'שמור שינויים' : 'צור מבחן'}
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
          message="האם למחוק את המבחן לצמיתות? הוא ייעלם ממסך הבית של התלמידים."
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
