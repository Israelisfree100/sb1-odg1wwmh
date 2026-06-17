import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronRight, LogOut, Plus, Pencil, Trash2, X, Check, AlertTriangle,
  ClipboardList, Search,
} from 'lucide-react';
import type { User, Assignment } from '../types';
import { getSchool, getInitials, getClass } from '../utils/dataHelpers';
import { getTeacherClasses } from '../utils/roleHelpers';
import {
  getAllAssignmentsForSchool, saveAssignment, deleteAssignment, generateAssignmentId,
} from '../services/assignmentRepository';
import {
  canTeacherManageClass, canTeacherManageSubject, canTeacherManageAssignment,
  canTeacherCreateInClass,
} from '../utils/teacherPermissions';

interface Props { activeUser: User; onBack: () => void; onLogout: () => void; }

interface FormState {
  id: string; classId: string; subject: string; title: string;
  description: string; dueDate: string; priority: 'low' | 'medium' | 'high';
}

const EMPTY_FORM = (defaultClassId = '', defaultSubject = ''): FormState => ({
  id: '', classId: defaultClassId, subject: defaultSubject,
  title: '', description: '', dueDate: '', priority: 'medium',
});

const PRIORITY_LABELS: Record<string, string> = {
  low: 'רגילה', medium: 'חשובה', high: 'דחופה',
};

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
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">ביטול</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-colors">מחיקה</button>
        </div>
      </div>
    </div>
  );
}

export function TeacherAssignmentsScreen({ activeUser, onBack, onLogout }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>(() =>
    getAllAssignmentsForSchool(activeUser.schoolId),
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM());
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [search, setSearch] = useState('');

  const classes = useMemo(() => getTeacherClasses(activeUser), [activeUser]);
  const school = useMemo(() => getSchool(activeUser.schoolId), [activeUser.schoolId]);
  const initials = getInitials(activeUser.fullName);

  const refresh = useCallback(() => {
    setAssignments(getAllAssignmentsForSchool(activeUser.schoolId));
  }, [activeUser.schoolId]);

  const showMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const visibleAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (!canTeacherManageClass(activeUser, a.classId)) return false;
      if (filterClass && a.classId !== filterClass) return false;
      if (filterSubject && a.subject !== filterSubject) return false;
      if (search && !a.title.includes(search) && !a.subject.includes(search)) return false;
      return true;
    });
  }, [assignments, filterClass, filterSubject, search, activeUser]);

  const openCreate = () => {
    setForm(EMPTY_FORM(classes[0]?.id ?? '', activeUser.subjects?.[0] ?? ''));
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (a: Assignment) => {
    if (!canTeacherManageAssignment(activeUser, a)) return;
    setForm({
      id: a.id, classId: a.classId, subject: a.subject,
      title: a.title, description: a.description, dueDate: a.dueDate,
      priority: a.priority,
    });
    setErrors({});
    setShowForm(true);
  };

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.classId) e.classId = 'יש לבחור כיתה';
    if (!form.subject) e.subject = 'יש לבחור מקצוע';
    if (!form.title.trim()) e.title = 'יש להזין כותרת';
    if (!form.description.trim()) e.description = 'יש להזין הוראות';
    if (!form.dueDate.trim()) e.dueDate = 'יש להזין מועד הגשה';
    if (form.classId && !canTeacherManageClass(activeUser, form.classId))
      e.classId = 'אינך מורה בכיתה זו';
    if (form.subject && !canTeacherManageSubject(activeUser, form.subject))
      e.subject = 'אינך מלמד מקצוע זה';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (!canTeacherCreateInClass(activeUser, form.classId, form.subject)) {
      setErrors({ classId: 'אין הרשאה ליצור משימה זו' });
      return;
    }
    const cls = getClass(form.classId);
    const assignment: Assignment = {
      id: form.id || generateAssignmentId(),
      schoolId: activeUser.schoolId,
      classId: form.classId,
      subject: form.subject,
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate.trim(),
      teacherName: activeUser.fullName,
      priority: form.priority,
      createdByUserId: activeUser.id,
      createdByRole: 'teacher',
      updatedAt: new Date().toISOString(),
    };
    // suppress lint warning about cls usage
    void cls;
    saveAssignment(activeUser.schoolId, assignment);
    refresh();
    setShowForm(false);
    showMsg(form.id ? 'המשימה עודכנה בהצלחה' : 'המשימה נוצרה בהצלחה');
  };

  const handleDelete = (id: string) => {
    deleteAssignment(activeUser.schoolId, id);
    refresh();
    setDeleteId(null);
    showMsg('המשימה נמחקה');
  };

  const subjectsForClass = useMemo(() => {
    if (!form.classId) return activeUser.subjects ?? [];
    return activeUser.subjects ?? [];
  }, [form.classId, activeUser.subjects]);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm">
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">לוח מורה</span>
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <div>
              <p className="text-sm font-bold text-gray-800">משימות הכיתה</p>
              <p className="text-xs text-gray-500">{school?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              משימה חדשה
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
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-emerald-700 text-sm">
            <Check className="w-4 h-4" /> {success}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-36">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש..."
              className="w-full border border-gray-200 rounded-xl pr-8 pl-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
          >
            <option value="">כל הכיתות</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
          >
            <option value="">כל המקצועות</option>
            {(activeUser.subjects ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* List */}
        {visibleAssignments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">אין משימות להצגה</p>
            <button onClick={openCreate} className="mt-3 text-emerald-600 text-sm underline">
              צור משימה ראשונה
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleAssignments.map((a) => {
              const cls = getClass(a.classId);
              const isOwner = canTeacherManageAssignment(activeUser, a);
              return (
                <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-800">{a.title}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          a.priority === 'high' ? 'bg-rose-100 text-rose-700'
                          : a.priority === 'medium' ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                        }`}>
                          {PRIORITY_LABELS[a.priority]}
                        </span>
                        {isOwner && (
                          <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">שלי</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {a.subject} · {cls?.name ?? a.classId} · {a.teacherName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{a.description.slice(0, 80)}{a.description.length > 80 ? '...' : ''}</p>
                      <p className="text-xs text-emerald-700 mt-1 font-semibold">מועד: {a.dueDate}</p>
                    </div>
                    {isOwner && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => openEdit(a)}
                          className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          aria-label="עריכה"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(a.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          aria-label="מחיקה"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Form overlay */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
          <div dir="rtl" className="bg-white rounded-2xl shadow-xl w-full max-w-lg mt-8 mb-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">
                {form.id ? 'עריכת משימה' : 'משימה חדשה'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Class */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">כיתה *</label>
                <select
                  value={form.classId}
                  onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                >
                  <option value="">בחר כיתה</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.classId && <p className="text-xs text-rose-600 mt-1">{errors.classId}</p>}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">מקצוע *</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                >
                  <option value="">בחר מקצוע</option>
                  {subjectsForClass.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.subject && <p className="text-xs text-rose-600 mt-1">{errors.subject}</p>}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">כותרת *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="כותרת המשימה"
                />
                {errors.title && <p className="text-xs text-rose-600 mt-1">{errors.title}</p>}
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">הוראות *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                  placeholder="תיאור ואוראות המשימה"
                />
                {errors.description && <p className="text-xs text-rose-600 mt-1">{errors.description}</p>}
              </div>

              {/* Due date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">מועד הגשה *</label>
                <input
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder='לדוגמה: יום חמישי / 20.6'
                />
                {errors.dueDate && <p className="text-xs text-rose-600 mt-1">{errors.dueDate}</p>}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">עדיפות</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, priority: p }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                        form.priority === p
                          ? p === 'high' ? 'bg-rose-500 text-white border-rose-500'
                            : p === 'medium' ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-gray-500 text-white border-gray-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {PRIORITY_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 p-5 border-t border-gray-100">
              <button
                onClick={handleSave}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                {form.id ? 'שמירת שינויים' : 'יצירת משימה'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <ConfirmDialog
          message="האם למחוק את המשימה? פעולה זו בלתי הפיכה."
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
