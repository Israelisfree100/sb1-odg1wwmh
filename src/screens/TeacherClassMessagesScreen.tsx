import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronRight, LogOut, Plus, Pencil, Trash2, X, Check, AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import type { User, ClassMessage, MessageCategory } from '../types';
import { getSchool, getInitials, getClass } from '../utils/dataHelpers';
import { getTeacherClasses } from '../utils/roleHelpers';
import {
  getAllMessagesForSchool, saveClassMessage, deleteClassMessage, generateMessageId,
} from '../services/classMessageRepository';
import { canTeacherManageClass, canTeacherManageClassMessage } from '../utils/teacherPermissions';

interface Props { activeUser: User; onBack: () => void; onLogout: () => void; }

const CATEGORY_LABELS: Record<MessageCategory, string> = {
  general: 'הודעות כלליות',
  homework: 'שיעורי בית',
  exam: 'מבחנים',
  activity: 'פעילויות',
};

const CATEGORY_COLORS: Record<MessageCategory, string> = {
  general: 'bg-sky-100 text-sky-700',
  homework: 'bg-violet-100 text-violet-700',
  exam: 'bg-rose-100 text-rose-700',
  activity: 'bg-emerald-100 text-emerald-700',
};

interface FormState {
  id: string; classId: string; category: MessageCategory;
  title: string; content: string; publishedAt: string; isImportant: boolean;
}

const today = () => new Date().toISOString().split('T')[0];

const EMPTY_FORM = (defaultClassId = ''): FormState => ({
  id: '', classId: defaultClassId, category: 'general',
  title: '', content: '', publishedAt: today(), isImportant: false,
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

export function TeacherClassMessagesScreen({ activeUser, onBack, onLogout }: Props) {
  const [messages, setMessages] = useState<ClassMessage[]>(() =>
    getAllMessagesForSchool(activeUser.schoolId),
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterCategory, setFilterCategory] = useState<MessageCategory | ''>('');

  const classes = useMemo(() => getTeacherClasses(activeUser), [activeUser]);
  const school = useMemo(() => getSchool(activeUser.schoolId), [activeUser.schoolId]);
  const initials = getInitials(activeUser.fullName);

  const refresh = useCallback(() => {
    setMessages(getAllMessagesForSchool(activeUser.schoolId));
  }, [activeUser.schoolId]);

  const showMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const visible = useMemo(() =>
    messages.filter((m) => {
      if (!canTeacherManageClass(activeUser, m.classId)) return false;
      if (filterClass && m.classId !== filterClass) return false;
      if (filterCategory && m.category !== filterCategory) return false;
      return true;
    }),
  [messages, filterClass, filterCategory, activeUser]);

  const openCreate = () => {
    setForm(EMPTY_FORM(classes[0]?.id ?? ''));
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (m: ClassMessage) => {
    if (!canTeacherManageClassMessage(activeUser, m)) return;
    setForm({
      id: m.id, classId: m.classId, category: m.category,
      title: m.title, content: m.content, publishedAt: m.publishedAt,
      isImportant: m.isImportant,
    });
    setErrors({});
    setShowForm(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.classId) e.classId = 'יש לבחור כיתה';
    if (!form.title.trim()) e.title = 'יש להזין כותרת';
    if (!form.content.trim()) e.content = 'יש להזין תוכן';
    if (form.classId && !canTeacherManageClass(activeUser, form.classId))
      e.classId = 'אינך מורה בכיתה זו';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const cls = getClass(form.classId);
    const msg: ClassMessage = {
      id: form.id || generateMessageId(),
      schoolId: activeUser.schoolId,
      classId: form.classId,
      grade: cls?.grade ?? '',
      teacherName: activeUser.fullName,
      category: form.category,
      title: form.title.trim(),
      content: form.content.trim(),
      publishedAt: form.publishedAt,
      isImportant: form.isImportant,
      createdByUserId: activeUser.id,
    };
    saveClassMessage(activeUser.schoolId, msg);
    refresh();
    setShowForm(false);
    showMsg(form.id ? 'ההודעה עודכנה בהצלחה' : 'ההודעה נשלחה בהצלחה');
  };

  const handleDelete = (id: string) => {
    deleteClassMessage(activeUser.schoolId, id);
    refresh();
    setDeleteId(null);
    showMsg('ההודעה נמחקה');
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
              <p className="text-sm font-bold text-gray-800">הודעות כיתה</p>
              <p className="text-xs text-gray-500">{school?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              הודעה חדשה
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
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
          >
            <option value="">כל הכיתות</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as MessageCategory | '')}
            className="border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
          >
            <option value="">כל הקטגוריות</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* List */}
        {visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">אין הודעות להצגה</p>
            <button onClick={openCreate} className="mt-3 text-emerald-600 text-sm underline">
              שלח הודעה ראשונה
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((m) => {
              const cls = getClass(m.classId);
              const isOwner = canTeacherManageClassMessage(activeUser, m);
              return (
                <div key={m.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-800">{m.title}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[m.category]}`}>
                          {CATEGORY_LABELS[m.category]}
                        </span>
                        {m.isImportant && (
                          <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">חשוב</span>
                        )}
                        {isOwner && (
                          <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">שלי</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{cls?.name ?? m.classId} · {m.publishedAt}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{m.content.slice(0, 100)}{m.content.length > 100 ? '...' : ''}</p>
                    </div>
                    {isOwner && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(m)} className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(m.id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
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
                {form.id ? 'עריכת הודעה' : 'הודעה חדשה'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
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

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">קטגוריה</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(CATEGORY_LABELS) as [MessageCategory, string][]).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: k }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        form.category === k ? CATEGORY_COLORS[k] + ' border-current' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

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
                <label className="block text-xs font-semibold text-gray-700 mb-1">תאריך פרסום</label>
                <input
                  type="date"
                  value={form.publishedAt}
                  onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isImportant}
                  onChange={(e) => setForm((f) => ({ ...f, isImportant: e.target.checked }))}
                  className="w-4 h-4 rounded accent-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700">הודעה חשובה</span>
              </label>
            </div>

            <div className="flex gap-2 p-5 border-t border-gray-100">
              <button
                onClick={handleSave}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                {form.id ? 'שמירת שינויים' : 'שליחת הודעה'}
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
          message="האם למחוק את ההודעה? פעולה זו בלתי הפיכה."
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
