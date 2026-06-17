import React, { useState, useMemo } from 'react';
import {
  ChevronRight, LogOut, ClipboardList, Plus, Pencil, Trash2,
  Search, X, CheckCircle, AlertTriangle,
} from 'lucide-react';
import type { User, Assignment, AppScreen } from '../types';
import { getSchool } from '../utils/dataHelpers';
import { getAllClassesForSchool } from '../services/classRepository';
import {
  getAllAssignmentsForSchool, saveAssignment, deleteAssignment, generateAssignmentId,
} from '../services/assignmentRepository';

interface Props { activeUser: User; onBack: () => void; onNavigate: (s: AppScreen) => void; onLogout: () => void; }

type PriorityFilter = 'all' | Assignment['priority'];
type CreatorFilter = 'all' | 'admin' | 'teacher';

const PRIORITY_LABELS: Record<Assignment['priority'], string> = { low: 'רגילה', medium: 'חשובה', high: 'דחופה' };
const PRIORITY_COLORS: Record<Assignment['priority'], string> = {
  low: 'bg-gray-100 text-gray-600', medium: 'bg-amber-100 text-amber-700', high: 'bg-rose-100 text-rose-700',
};

interface AForm {
  id?: string; subject: string; title: string; description: string;
  classId: string; dueDate: string; teacherName: string;
  priority: Assignment['priority']; specificStudentId: string;
}

function emptyForm(): AForm {
  return { subject: '', title: '', description: '', classId: '', dueDate: 'השבוע', teacherName: 'הנהלת בית הספר', priority: 'medium', specificStudentId: '' };
}

const SUBJECTS = ['עברית', 'חשבון', 'מדעים', 'אנגלית', 'תנ"ך', 'היסטוריה', 'גיאוגרפיה', 'חינוך גופני', 'אמנות', 'מוזיקה', 'כישורי חיים'];

export function AdminAssignmentsScreen({ activeUser, onBack, onLogout }: Props) {
  const schoolId = activeUser.schoolId;
  const school = getSchool(schoolId);
  const classes = useMemo(() => getAllClassesForSchool(schoolId).filter((c) => c.isActive !== false), [schoolId]);
  const [assignments, setAssignments] = useState(() => getAllAssignmentsForSchool(schoolId));
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [creatorFilter, setCreatorFilter] = useState<CreatorFilter>('all');
  const [form, setForm] = useState<AForm | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  const refresh = () => setAssignments(getAllAssignmentsForSchool(schoolId));
  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 2500); };

  const visible = useMemo(() => assignments.filter((a) => {
    if (search && !a.title.includes(search) && !a.subject.includes(search)) return false;
    if (classFilter && a.classId !== classFilter) return false;
    if (priorityFilter !== 'all' && a.priority !== priorityFilter) return false;
    if (creatorFilter === 'admin' && a.createdByRole !== 'admin') return false;
    if (creatorFilter === 'teacher' && a.createdByRole !== 'teacher') return false;
    return true;
  }), [assignments, search, classFilter, priorityFilter, creatorFilter]);

  const validate = (f: AForm): boolean => {
    const e: Record<string, string> = {};
    if (!f.title.trim()) e.title = 'חובה';
    if (!f.subject.trim()) e.subject = 'חובה';
    if (!f.classId) e.classId = 'חובה';
    if (!f.dueDate.trim()) e.dueDate = 'חובה';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!form || !validate(form)) return;
    const cls = classes.find((c) => c.id === form.classId);
    const asgn: Assignment = {
      id: form.id ?? generateAssignmentId(),
      schoolId,
      classId: form.classId,
      subject: form.subject.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate.trim(),
      teacherName: form.teacherName.trim() || 'הנהלת בית הספר',
      priority: form.priority,
      createdByUserId: activeUser.id,
      createdByRole: 'admin',
      updatedAt: new Date().toISOString(),
    };
    if (cls) Object.assign(asgn, { grade: cls.grade });
    saveAssignment(schoolId, asgn);
    refresh();
    setForm(null);
    showSuccess(form.id ? 'המשימה עודכנה' : 'המשימה נוצרה בהצלחה');
  };

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
              <p className="text-white font-bold text-sm">ניהול משימות ושיעורי בית</p>
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

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש משימה..."
              className="w-full border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">כל הכיתות</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="all">כל העדיפויות</option>
            {(['low', 'medium', 'high'] as Assignment['priority'][]).map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>
          <select value={creatorFilter} onChange={(e) => setCreatorFilter(e.target.value as CreatorFilter)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="all">כל היוצרים</option>
            <option value="admin">הנהלה</option>
            <option value="teacher">מורה</option>
          </select>
          <button onClick={() => { setForm(emptyForm()); setFormErrors({}); }}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
            <Plus className="w-4 h-4" />משימה חדשה
          </button>
        </div>

        <p className="text-xs text-gray-500">מציג <strong>{visible.length}</strong> מתוך <strong>{assignments.length}</strong> משימות</p>

        {visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>אין משימות להצגה</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((a) => {
              const cls = classes.find((c) => c.id === a.classId);
              return (
                <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-bold text-gray-800">{a.title}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[a.priority]}`}>{PRIORITY_LABELS[a.priority]}</span>
                        {a.createdByRole === 'admin' && <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">הנהלה</span>}
                        {a.createdByRole === 'teacher' && <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2 py-0.5 rounded-full">מורה</span>}
                      </div>
                      <p className="text-xs text-gray-500">{a.subject} · {cls?.name ?? a.classId} · {a.teacherName}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{a.description.slice(0, 80)}</p>
                      <p className="text-xs text-indigo-700 font-semibold mt-1">מועד: {a.dueDate}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => { setForm({ id: a.id, subject: a.subject, title: a.title, description: a.description, classId: a.classId, dueDate: a.dueDate, teacherName: a.teacherName, priority: a.priority, specificStudentId: '' }); setFormErrors({}); }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setConfirm(a.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Form modal */}
        {form && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 my-4" dir="rtl">
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-gray-800">{form.id ? 'עריכת משימה' : 'משימה חדשה'}</p>
                <button onClick={() => setForm(null)}><X className="w-5 h-5 text-gray-400 hover:text-gray-700" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">כותרת <span className="text-rose-500">*</span></label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors.title ? 'border-rose-400' : 'border-gray-200'}`} />
                  {formErrors.title && <p className="text-xs text-rose-500 mt-0.5">{formErrors.title}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">מקצוע <span className="text-rose-500">*</span></label>
                    <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className={`w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors.subject ? 'border-rose-400' : 'border-gray-200'}`}>
                      <option value="">בחר</option>
                      {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {formErrors.subject && <p className="text-xs text-rose-500 mt-0.5">{formErrors.subject}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">כיתה <span className="text-rose-500">*</span></label>
                    <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}
                      className={`w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors.classId ? 'border-rose-400' : 'border-gray-200'}`}>
                      <option value="">בחר</option>
                      {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {formErrors.classId && <p className="text-xs text-rose-500 mt-0.5">{formErrors.classId}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">הוראות</label>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">מועד הגשה <span className="text-rose-500">*</span></label>
                    <input value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors.dueDate ? 'border-rose-400' : 'border-gray-200'}`} />
                    {formErrors.dueDate && <p className="text-xs text-rose-500 mt-0.5">{formErrors.dueDate}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">עדיפות</label>
                    <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Assignment['priority'] })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                      {(['low', 'medium', 'high'] as Assignment['priority'][]).map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">שם המורה / אחראי</label>
                  <input value={form.teacherName} onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <div className="flex gap-2 mt-5 justify-end">
                <button onClick={() => setForm(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">ביטול</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">שמור</button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm delete */}
        {confirm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" dir="rtl">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
                <p className="text-sm font-semibold text-gray-800">האם למחוק את המשימה? פעולה זו בלתי הפיכה.</p>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setConfirm(null)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">ביטול</button>
                <button onClick={() => { deleteAssignment(schoolId, confirm); refresh(); setConfirm(null); showSuccess('המשימה נמחקה'); }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl">מחק</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
