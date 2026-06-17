import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronRight, LogOut, Users, GraduationCap, BookUser, UserRound,
  Plus, Pencil, Trash2, PowerOff, Power, Search, X, Copy, Eye, EyeOff,
  CheckCircle, AlertTriangle, Archive, ArchiveRestore,
} from 'lucide-react';
import type { User, ClassGroup, AppScreen } from '../types';
import { getSchool } from '../utils/dataHelpers';
import {
  getAllUsersForSchool, saveUser, deleteUser, deactivateUser,
  reactivateUser, resetUserPassword, isUsernameAvailable, generateUserId,
  getActiveUserCount,
} from '../services/userRepository';
import {
  getAllClassesForSchool, saveClass, deleteClass, archiveClass,
  unarchiveClass, canDeleteClass, generateClassId, getActiveClassCount,
} from '../services/classRepository';

interface Props {
  activeUser: User;
  onBack: () => void;
  onNavigate: (s: AppScreen) => void;
  onLogout: () => void;
}

type Tab = 'classes' | 'students' | 'teachers' | 'parents';

// ─── Reusable UI atoms ─────────────────────────────────────────────────────────

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{children}</span>;
}

function Btn({
  children, onClick, color = 'indigo', size = 'sm', disabled, type = 'button',
}: {
  children: React.ReactNode; onClick?: () => void; color?: string; size?: 'sm' | 'xs' | 'md';
  disabled?: boolean; type?: 'button' | 'submit';
}) {
  const sz = size === 'xs' ? 'px-2 py-1 text-xs' : size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs';
  const cl: Record<string, string> = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    rose: 'bg-rose-500 hover:bg-rose-600 text-white',
    amber: 'bg-amber-500 hover:bg-amber-600 text-white',
    gray: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    emerald: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`flex items-center gap-1.5 font-semibold rounded-xl transition-colors ${sz} ${cl[color] ?? cl.indigo} disabled:opacity-40 disabled:cursor-not-allowed`}>
      {children}
    </button>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" dir="rtl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-gray-800">{message}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <Btn color="gray" onClick={onCancel}>ביטול</Btn>
          <Btn color="rose" onClick={onConfirm}>אישור</Btn>
        </div>
      </div>
    </div>
  );
}

function CredentialCard({ username, password, onClose }: { username: string; password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(`שם משתמש: ${username}\nסיסמה: ${password}`).catch(() => null);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" dir="rtl">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <p className="font-bold text-gray-800">פרטי כניסה זמניים</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 mb-4 font-mono text-sm">
          <p>שם משתמש: <strong>{username}</strong></p>
          <p>סיסמה: <strong>{password}</strong></p>
        </div>
        <p className="text-xs text-amber-600 mb-4">⚠️ שמור/י את הסיסמה עכשיו — היא לא תוצג שוב.</p>
        <div className="flex gap-2">
          <Btn color="gray" onClick={copy}>{copied ? <><CheckCircle className="w-3.5 h-3.5" />הועתק</> : <><Copy className="w-3.5 h-3.5" />העתק</>}</Btn>
          <Btn color="indigo" onClick={onClose}>סגור</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Classes Tab ───────────────────────────────────────────────────────────────

function ClassesTab({ schoolId }: { schoolId: string }) {
  const [classes, setClasses] = useState<ClassGroup[]>(() => getAllClassesForSchool(schoolId));
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [form, setForm] = useState<Partial<ClassGroup> | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<{ id: string; msg: string } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refresh = () => setClasses(getAllClassesForSchool(schoolId));

  const grades = useMemo(() => Array.from(new Set(classes.map((c) => c.grade))).sort(), [classes]);

  const visible = useMemo(() => classes.filter((c) => {
    if (search && !c.name.includes(search) && !c.grade.includes(search)) return false;
    if (gradeFilter && c.grade !== gradeFilter) return false;
    return true;
  }), [classes, search, gradeFilter]);

  const grouped = useMemo(() => {
    const map: Record<string, ClassGroup[]> = {};
    for (const c of visible) {
      if (!map[c.grade]) map[c.grade] = [];
      map[c.grade].push(c);
    }
    return map;
  }, [visible]);

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 2500); };

  const validate = (f: Partial<ClassGroup>): boolean => {
    const errs: Record<string, string> = {};
    if (!f.name?.trim()) errs.name = 'חובה';
    if (!f.grade?.trim()) errs.grade = 'חובה';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!form || !validate(form)) return;
    const isNew = !form.id;
    const cls: ClassGroup = {
      id: form.id ?? generateClassId(schoolId),
      schoolId,
      name: form.name!.trim(),
      grade: form.grade!.trim(),
      teacherName: form.teacherName?.trim() ?? '',
      homeroomTeacherId: form.homeroomTeacherId,
      schoolYear: form.schoolYear?.trim(),
      isActive: form.isActive ?? true,
    };
    saveClass(cls);
    refresh();
    setForm(null);
    showSuccess(isNew ? 'הכיתה נוצרה בהצלחה' : 'הכיתה עודכנה בהצלחה');
  };

  const handleDelete = (id: string) => {
    const { canDelete, reason } = canDeleteClass(id, schoolId);
    if (!canDelete) { setError(reason ?? 'לא ניתן למחוק כיתה זו'); setTimeout(() => setError(''), 3000); return; }
    setConfirm({ id, msg: 'האם למחוק את הכיתה? פעולה זו בלתי הפיכה.' });
  };

  const confirmDelete = (id: string) => { deleteClass(id, schoolId); refresh(); setConfirm(null); showSuccess('הכיתה נמחקה'); };

  return (
    <div className="space-y-4">
      {success && <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm text-emerald-800 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}
      {error && <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 text-sm text-rose-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש כיתה..."
            className="w-full border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">כל השכבות</option>
          {grades.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <Btn color="indigo" size="md" onClick={() => { setForm({ isActive: true }); setFormErrors({}); }}>
          <Plus className="w-4 h-4" />כיתה חדשה
        </Btn>
      </div>

      {/* Count badge */}
      <p className="text-xs text-gray-500">
        <strong>{getActiveClassCount(schoolId)}</strong> כיתות פעילות · <strong>{classes.length}</strong> סה"כ
      </p>

      {/* Grouped list */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">אין כיתות להצגה</div>
      ) : (
        Object.entries(grouped).map(([grade, gradeClasses]) => (
          <div key={grade}>
            <p className="text-xs font-bold text-indigo-600 uppercase mb-2">שכבה {grade}</p>
            <div className="space-y-2">
              {gradeClasses.map((c) => (
                <div key={c.id} className={`bg-white rounded-xl border shadow-sm px-4 py-3 flex items-center justify-between gap-3 ${c.isActive === false ? 'opacity-50' : ''}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800">{c.name}</p>
                      {c.isActive === false
                        ? <Badge color="bg-gray-100 text-gray-500">ארכיון</Badge>
                        : <Badge color="bg-emerald-100 text-emerald-700">פעיל</Badge>}
                    </div>
                    <p className="text-xs text-gray-400">{c.teacherName ? `מחנך/ת: ${c.teacherName}` : 'אין מחנך/ת'}{c.schoolYear ? ` · ${c.schoolYear}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Btn color="gray" size="xs" onClick={() => { setForm({ ...c }); setFormErrors({}); }}><Pencil className="w-3.5 h-3.5" /></Btn>
                    {c.isActive === false
                      ? <Btn color="emerald" size="xs" onClick={() => { unarchiveClass(c.id, schoolId); refresh(); showSuccess('הכיתה שוחזרה'); }}><ArchiveRestore className="w-3.5 h-3.5" /></Btn>
                      : <Btn color="amber" size="xs" onClick={() => { archiveClass(c.id, schoolId); refresh(); showSuccess('הכיתה הועברה לארכיון'); }}><Archive className="w-3.5 h-3.5" /></Btn>
                    }
                    <Btn color="rose" size="xs" onClick={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5" /></Btn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Form modal */}
      {form && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" dir="rtl">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-gray-800">{form.id ? 'עריכת כיתה' : 'כיתה חדשה'}</p>
              <button onClick={() => setForm(null)}><X className="w-5 h-5 text-gray-400 hover:text-gray-700" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">שם כיתה <span className="text-rose-500">*</span></label>
                <input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder='לדוגמה: ג׳2' className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors.name ? 'border-rose-400' : 'border-gray-200'}`} />
                {formErrors.name && <p className="text-xs text-rose-500 mt-0.5">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">שכבה <span className="text-rose-500">*</span></label>
                <input value={form.grade ?? ''} onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  placeholder="לדוגמה: ג'" className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors.grade ? 'border-rose-400' : 'border-gray-200'}`} />
                {formErrors.grade && <p className="text-xs text-rose-500 mt-0.5">{formErrors.grade}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">שם מחנך/ת</label>
                <input value={form.teacherName ?? ''} onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">שנת לימודים</label>
                <input value={form.schoolYear ?? ''} onChange={(e) => setForm({ ...form, schoolYear: e.target.value })}
                  placeholder='לדוגמה: תשפ"ה' className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="cls-active" checked={form.isActive !== false}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                <label htmlFor="cls-active" className="text-sm text-gray-700">כיתה פעילה</label>
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <Btn color="gray" onClick={() => setForm(null)}>ביטול</Btn>
              <Btn color="indigo" onClick={handleSave}>שמור</Btn>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog message={confirm.msg}
          onConfirm={() => confirmDelete(confirm.id)}
          onCancel={() => setConfirm(null)} />
      )}
    </div>
  );
}

// ─── Generic User Tab ──────────────────────────────────────────────────────────

interface UserFormState {
  id?: string;
  fullName: string;
  username: string;
  password: string;
  classId?: string;       // student
  classIds?: string[];    // teacher
  subjects?: string[];    // teacher
  homeroomClassId?: string; // teacher
  childUserIds?: string[]; // parent
  isActive: boolean;
}

function buildInitialForm(user?: User): UserFormState {
  return {
    id: user?.id,
    fullName: user?.fullName ?? '',
    username: user?.username ?? '',
    password: '',
    classId: user?.classId,
    classIds: user?.classIds ?? [],
    subjects: user?.subjects ?? [],
    homeroomClassId: user?.homeroomClassId,
    childUserIds: user?.childUserIds ?? [],
    isActive: user?.isActive !== false,
  };
}

function UserRow({
  u, onEdit, onToggleActive, onDelete, onResetPassword,
}: {
  u: User;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onResetPassword: () => void;
}) {
  const active = u.isActive !== false;
  return (
    <div className={`bg-white rounded-xl border shadow-sm px-4 py-3 ${!active ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-800 truncate">{u.fullName}</p>
            <Badge color={active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}>
              {active ? 'פעיל' : 'מושהה'}
            </Badge>
          </div>
          <p className="text-xs text-gray-500">@{u.username}</p>
          {u.classId && <p className="text-xs text-indigo-600 mt-0.5">כיתה: {u.classId}</p>}
          {u.classIds && u.classIds.length > 0 && <p className="text-xs text-indigo-600 mt-0.5">כיתות: {u.classIds.join(', ')}</p>}
          {u.childUserIds && u.childUserIds.length > 0 && <p className="text-xs text-indigo-600 mt-0.5">ילדים: {u.childUserIds.join(', ')}</p>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Btn color="gray" size="xs" onClick={onEdit}><Pencil className="w-3.5 h-3.5" /></Btn>
          <Btn color="amber" size="xs" onClick={onResetPassword}><Eye className="w-3.5 h-3.5" /></Btn>
          <Btn color={active ? 'amber' : 'emerald'} size="xs" onClick={onToggleActive}>
            {active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
          </Btn>
          <Btn color="rose" size="xs" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Students Tab ──────────────────────────────────────────────────────────────

function StudentsTab({ schoolId }: { schoolId: string }) {
  const [users, setUsers] = useState(() => getAllUsersForSchool(schoolId, 'student'));
  const classes = useMemo(() => getAllClassesForSchool(schoolId), [schoolId]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [form, setForm] = useState<UserFormState | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<{ id: string } | null>(null);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [success, setSuccess] = useState('');
  const [showPw, setShowPw] = useState(false);

  const refresh = () => setUsers(getAllUsersForSchool(schoolId, 'student'));
  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 2500); };

  const visible = useMemo(() => users.filter((u) => {
    if (search && !u.fullName.includes(search) && !u.username.includes(search)) return false;
    if (classFilter && u.classId !== classFilter) return false;
    if (activeFilter === 'active' && u.isActive === false) return false;
    if (activeFilter === 'inactive' && u.isActive !== false) return false;
    return true;
  }), [users, search, classFilter, activeFilter]);

  const validate = (f: UserFormState): boolean => {
    const errs: Record<string, string> = {};
    if (!f.fullName.trim()) errs.fullName = 'חובה';
    if (!f.username.trim()) errs.username = 'חובה';
    else if (!isUsernameAvailable(schoolId, f.username.trim(), f.id)) errs.username = 'שם המשתמש קיים כבר';
    if (!f.classId) errs.classId = 'חובה';
    if (!f.id && !f.password.trim()) errs.password = 'חובה לחשבון חדש';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!form || !validate(form)) return;
    const isNew = !form.id;
    const cls = classes.find((c) => c.id === form.classId);
    const user: User = {
      id: form.id ?? generateUserId(schoolId, 'student'),
      schoolId,
      username: form.username.trim(),
      password: form.password.trim() || (isNew ? '1234' : users.find((u) => u.id === form.id)?.password ?? '1234'),
      role: 'student',
      fullName: form.fullName.trim(),
      firstName: form.fullName.trim().split(' ')[0],
      classId: form.classId,
      grade: cls?.grade,
      isActive: form.isActive,
    };
    saveUser(user);
    refresh();
    const pw = form.password.trim() || (isNew ? '1234' : '');
    if (isNew) setCredentials({ username: user.username, password: pw || user.password });
    setForm(null);
    showSuccess(isNew ? 'התלמיד/ה נוצר/ה בהצלחה' : 'התלמיד/ה עודכן/ה');
  };

  const handleResetPassword = (u: User) => {
    const pw = `tmp${Math.floor(1000 + Math.random() * 9000)}`;
    resetUserPassword(u.id, schoolId, pw);
    refresh();
    setCredentials({ username: u.username, password: pw });
  };

  return (
    <div className="space-y-4">
      {success && <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm text-emerald-800 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש לפי שם..."
            className="w-full border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">כל הכיתות</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="all">כל הסטטוסים</option>
          <option value="active">פעילים</option>
          <option value="inactive">מושהים</option>
        </select>
        <Btn color="indigo" size="md" onClick={() => { setForm(buildInitialForm()); setFormErrors({}); setShowPw(false); }}>
          <Plus className="w-4 h-4" />תלמיד חדש
        </Btn>
      </div>

      <p className="text-xs text-gray-500">
        <strong>{getActiveUserCount(schoolId, 'student')}</strong> תלמידים פעילים · מציג <strong>{visible.length}</strong>
      </p>

      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">אין תלמידים להצגה</div>
      ) : (
        <div className="space-y-2">
          {visible.map((u) => (
            <UserRow key={u.id} u={u}
              onEdit={() => { setForm(buildInitialForm(u)); setFormErrors({}); setShowPw(false); }}
              onToggleActive={() => {
                if (u.isActive === false) reactivateUser(u.id, schoolId); else deactivateUser(u.id, schoolId);
                refresh();
                showSuccess(u.isActive === false ? 'החשבון הופעל' : 'החשבון הושהה');
              }}
              onDelete={() => setConfirm({ id: u.id })}
              onResetPassword={() => handleResetPassword(u)}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      {form && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 my-4" dir="rtl">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-gray-800">{form.id ? 'עריכת תלמיד/ה' : 'תלמיד/ה חדש/ה'}</p>
              <button onClick={() => setForm(null)}><X className="w-5 h-5 text-gray-400 hover:text-gray-700" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">שם מלא <span className="text-rose-500">*</span></label>
                <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors.fullName ? 'border-rose-400' : 'border-gray-200'}`} />
                {formErrors.fullName && <p className="text-xs text-rose-500 mt-0.5">{formErrors.fullName}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">שם משתמש <span className="text-rose-500">*</span></label>
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors.username ? 'border-rose-400' : 'border-gray-200'}`} />
                {formErrors.username && <p className="text-xs text-rose-500 mt-0.5">{formErrors.username}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {form.id ? 'סיסמה חדשה (השאר ריק לשמור קיימת)' : 'סיסמה זמנית'} {!form.id && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pl-9 ${formErrors.password ? 'border-rose-400' : 'border-gray-200'}`} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.password && <p className="text-xs text-rose-500 mt-0.5">{formErrors.password}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">כיתה <span className="text-rose-500">*</span></label>
                <select value={form.classId ?? ''} onChange={(e) => setForm({ ...form, classId: e.target.value || undefined })}
                  className={`w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors.classId ? 'border-rose-400' : 'border-gray-200'}`}>
                  <option value="">בחר כיתה</option>
                  {classes.filter((c) => c.isActive !== false).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {formErrors.classId && <p className="text-xs text-rose-500 mt-0.5">{formErrors.classId}</p>}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="st-active" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                <label htmlFor="st-active" className="text-sm text-gray-700">חשבון פעיל</label>
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <Btn color="gray" onClick={() => setForm(null)}>ביטול</Btn>
              <Btn color="indigo" onClick={handleSave}>שמור</Btn>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog message="האם למחוק את התלמיד/ה? פעולה זו בלתי הפיכה."
          onConfirm={() => { deleteUser(confirm.id, schoolId); refresh(); setConfirm(null); showSuccess('התלמיד/ה נמחק/ה'); }}
          onCancel={() => setConfirm(null)} />
      )}

      {credentials && <CredentialCard {...credentials} onClose={() => setCredentials(null)} />}
    </div>
  );
}

// ─── Teachers Tab ──────────────────────────────────────────────────────────────

const SUBJECTS_LIST = ['עברית', 'חשבון', 'מדעים', 'אנגלית', 'תנ"ך', 'היסטוריה', 'גיאוגרפיה', 'חינוך גופני', 'אמנות', 'מוזיקה', 'כישורי חיים'];

function TeachersTab({ schoolId }: { schoolId: string }) {
  const [users, setUsers] = useState(() => getAllUsersForSchool(schoolId, 'teacher'));
  const classes = useMemo(() => getAllClassesForSchool(schoolId), [schoolId]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [form, setForm] = useState<UserFormState | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<{ id: string } | null>(null);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [success, setSuccess] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [subjectInput, setSubjectInput] = useState('');

  const refresh = () => setUsers(getAllUsersForSchool(schoolId, 'teacher'));
  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 2500); };

  const visible = useMemo(() => users.filter((u) => {
    if (search && !u.fullName.includes(search) && !u.username.includes(search)) return false;
    if (classFilter && !u.classIds?.includes(classFilter)) return false;
    if (activeFilter === 'active' && u.isActive === false) return false;
    if (activeFilter === 'inactive' && u.isActive !== false) return false;
    return true;
  }), [users, search, classFilter, activeFilter]);

  const validate = (f: UserFormState): boolean => {
    const errs: Record<string, string> = {};
    if (!f.fullName.trim()) errs.fullName = 'חובה';
    if (!f.username.trim()) errs.username = 'חובה';
    else if (!isUsernameAvailable(schoolId, f.username.trim(), f.id)) errs.username = 'שם משתמש קיים';
    if (!f.subjects || f.subjects.length === 0) errs.subjects = 'נדרש לפחות מקצוע אחד';
    if (!f.id && !f.password.trim()) errs.password = 'חובה לחשבון חדש';
    if (f.homeroomClassId && !f.classIds?.includes(f.homeroomClassId)) errs.homeroomClassId = 'כיתת אם חייבת להיות בין הכיתות המשויכות';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!form || !validate(form)) return;
    const isNew = !form.id;
    const user: User = {
      id: form.id ?? generateUserId(schoolId, 'teacher'),
      schoolId,
      username: form.username.trim(),
      password: form.password.trim() || (isNew ? '1234' : users.find((u) => u.id === form.id)?.password ?? '1234'),
      role: 'teacher',
      fullName: form.fullName.trim(),
      firstName: form.fullName.trim().split(' ')[0],
      teacherId: `tid-${schoolId}-${form.username.trim()}`,
      classIds: form.classIds ?? [],
      subjects: form.subjects ?? [],
      homeroomClassId: form.homeroomClassId || undefined,
      isActive: form.isActive,
    };
    saveUser(user);
    refresh();
    if (isNew) setCredentials({ username: user.username, password: form.password.trim() || user.password });
    setForm(null);
    showSuccess(isNew ? 'המורה נוצר/ה בהצלחה' : 'המורה עודכן/ה');
  };

  const toggleClass = (classId: string, f: UserFormState) => {
    const ids = f.classIds ?? [];
    const updated = ids.includes(classId) ? ids.filter((id) => id !== classId) : [...ids, classId];
    const homeroom = f.homeroomClassId && !updated.includes(f.homeroomClassId) ? undefined : f.homeroomClassId;
    setForm({ ...f, classIds: updated, homeroomClassId: homeroom });
  };

  const toggleSubject = (s: string, f: UserFormState) => {
    const subs = f.subjects ?? [];
    setForm({ ...f, subjects: subs.includes(s) ? subs.filter((x) => x !== s) : [...subs, s] });
  };

  return (
    <div className="space-y-4">
      {success && <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm text-emerald-800 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש מורה..."
            className="w-full border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">כל הכיתות</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="all">כל הסטטוסים</option><option value="active">פעילים</option><option value="inactive">מושהים</option>
        </select>
        <Btn color="indigo" size="md" onClick={() => { setForm(buildInitialForm()); setFormErrors({}); setShowPw(false); setSubjectInput(''); }}>
          <Plus className="w-4 h-4" />מורה חדש/ה
        </Btn>
      </div>

      <p className="text-xs text-gray-500">
        <strong>{getActiveUserCount(schoolId, 'teacher')}</strong> מורים פעילים · מציג <strong>{visible.length}</strong>
      </p>

      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">אין מורים להצגה</div>
      ) : (
        <div className="space-y-2">
          {visible.map((u) => (
            <div key={u.id} className={`bg-white rounded-xl border shadow-sm px-4 py-3 ${u.isActive === false ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-800">{u.fullName}</p>
                    <Badge color={u.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}>
                      {u.isActive !== false ? 'פעיל' : 'מושהה'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">@{u.username}</p>
                  {u.subjects && u.subjects.length > 0 && <p className="text-xs text-indigo-600 mt-0.5">מקצועות: {u.subjects.join(', ')}</p>}
                  {u.classIds && u.classIds.length > 0 && <p className="text-xs text-gray-500 mt-0.5">כיתות: {u.classIds.join(', ')}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Btn color="gray" size="xs" onClick={() => { setForm(buildInitialForm(u)); setFormErrors({}); setShowPw(false); setSubjectInput(''); }}><Pencil className="w-3.5 h-3.5" /></Btn>
                  <Btn color="amber" size="xs" onClick={() => { const pw = `tmp${Math.floor(1000 + Math.random() * 9000)}`; resetUserPassword(u.id, schoolId, pw); refresh(); setCredentials({ username: u.username, password: pw }); }}><Eye className="w-3.5 h-3.5" /></Btn>
                  <Btn color={u.isActive !== false ? 'amber' : 'emerald'} size="xs" onClick={() => { if (u.isActive === false) reactivateUser(u.id, schoolId); else deactivateUser(u.id, schoolId); refresh(); showSuccess(u.isActive === false ? 'הופעל' : 'הושהה'); }}>
                    {u.isActive !== false ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                  </Btn>
                  <Btn color="rose" size="xs" onClick={() => setConfirm({ id: u.id })}><Trash2 className="w-3.5 h-3.5" /></Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 my-4" dir="rtl">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-gray-800">{form.id ? 'עריכת מורה' : 'מורה חדש/ה'}</p>
              <button onClick={() => setForm(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              {[
                { field: 'fullName' as const, label: 'שם מלא', req: true, placeholder: '' },
                { field: 'username' as const, label: 'שם משתמש', req: true, placeholder: '' },
              ].map(({ field, label, req }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}{req && <span className="text-rose-500"> *</span>}</label>
                  <input value={form[field] as string} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors[field] ? 'border-rose-400' : 'border-gray-200'}`} />
                  {formErrors[field] && <p className="text-xs text-rose-500 mt-0.5">{formErrors[field]}</p>}
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {form.id ? 'סיסמה חדשה (ריק = ללא שינוי)' : 'סיסמה זמנית'}{!form.id && <span className="text-rose-500"> *</span>}
                </label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pl-9 ${formErrors.password ? 'border-rose-400' : 'border-gray-200'}`} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.password && <p className="text-xs text-rose-500 mt-0.5">{formErrors.password}</p>}
              </div>
              {/* Subjects */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">מקצועות <span className="text-rose-500">*</span></label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(form.subjects ?? []).map((s) => (
                    <span key={s} className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      {s}<button type="button" onClick={() => toggleSubject(s, form)}><X className="w-2.5 h-2.5" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <select value={subjectInput} onChange={(e) => setSubjectInput(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="">בחר מקצוע</option>
                    {SUBJECTS_LIST.filter((s) => !form.subjects?.includes(s)).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <Btn color="indigo" size="xs" onClick={() => { if (subjectInput) { toggleSubject(subjectInput, form); setSubjectInput(''); } }}>הוסף</Btn>
                </div>
                {formErrors.subjects && <p className="text-xs text-rose-500 mt-0.5">{formErrors.subjects}</p>}
              </div>
              {/* Classes */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">כיתות מקושרות</label>
                <div className="flex flex-wrap gap-1.5">
                  {classes.filter((c) => c.isActive !== false).map((c) => (
                    <button type="button" key={c.id} onClick={() => toggleClass(c.id, form)}
                      className={`text-xs font-bold px-2 py-1 rounded-xl border transition-colors ${
                        form.classIds?.includes(c.id) ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'
                      }`}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              {/* Homeroom */}
              {(form.classIds ?? []).length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">כיתת אם</label>
                  <select value={form.homeroomClassId ?? ''} onChange={(e) => setForm({ ...form, homeroomClassId: e.target.value || undefined })}
                    className={`w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors.homeroomClassId ? 'border-rose-400' : 'border-gray-200'}`}>
                    <option value="">אין כיתת אם</option>
                    {(form.classIds ?? []).map((id) => {
                      const c = classes.find((cl) => cl.id === id);
                      return c ? <option key={id} value={id}>{c.name}</option> : null;
                    })}
                  </select>
                  {formErrors.homeroomClassId && <p className="text-xs text-rose-500 mt-0.5">{formErrors.homeroomClassId}</p>}
                </div>
              )}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="tc-active" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                <label htmlFor="tc-active" className="text-sm text-gray-700">חשבון פעיל</label>
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <Btn color="gray" onClick={() => setForm(null)}>ביטול</Btn>
              <Btn color="indigo" onClick={handleSave}>שמור</Btn>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog message="האם למחוק את המורה? פעולה זו בלתי הפיכה."
          onConfirm={() => { deleteUser(confirm.id, schoolId); refresh(); setConfirm(null); showSuccess('המורה נמחק/ה'); }}
          onCancel={() => setConfirm(null)} />
      )}
      {credentials && <CredentialCard {...credentials} onClose={() => setCredentials(null)} />}
    </div>
  );
}

// ─── Parents Tab ───────────────────────────────────────────────────────────────

function ParentsTab({ schoolId }: { schoolId: string }) {
  const [users, setUsers] = useState(() => getAllUsersForSchool(schoolId, 'parent'));
  const students = useMemo(() => getAllUsersForSchool(schoolId, 'student').filter((u) => u.isActive !== false), [schoolId]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [form, setForm] = useState<UserFormState | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<{ id: string } | null>(null);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [success, setSuccess] = useState('');
  const [showPw, setShowPw] = useState(false);

  const refresh = useCallback(() => setUsers(getAllUsersForSchool(schoolId, 'parent')), [schoolId]);
  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 2500); };

  const visible = useMemo(() => users.filter((u) => {
    if (search && !u.fullName.includes(search) && !u.username.includes(search)) return false;
    if (activeFilter === 'active' && u.isActive === false) return false;
    if (activeFilter === 'inactive' && u.isActive !== false) return false;
    return true;
  }), [users, search, activeFilter]);

  const validate = (f: UserFormState): boolean => {
    const errs: Record<string, string> = {};
    if (!f.fullName.trim()) errs.fullName = 'חובה';
    if (!f.username.trim()) errs.username = 'חובה';
    else if (!isUsernameAvailable(schoolId, f.username.trim(), f.id)) errs.username = 'שם משתמש קיים';
    if (!f.childUserIds || f.childUserIds.length === 0) errs.childUserIds = 'נדרש לפחות ילד מקושר אחד';
    if (!f.id && !f.password.trim()) errs.password = 'חובה לחשבון חדש';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!form || !validate(form)) return;
    const isNew = !form.id;
    const user: User = {
      id: form.id ?? generateUserId(schoolId, 'parent'),
      schoolId,
      username: form.username.trim(),
      password: form.password.trim() || (isNew ? '1234' : users.find((u) => u.id === form.id)?.password ?? '1234'),
      role: 'parent',
      fullName: form.fullName.trim(),
      firstName: form.fullName.trim().split(' ')[0],
      parentId: `pid-${schoolId}-${form.username.trim()}`,
      childUserIds: form.childUserIds ?? [],
      isActive: form.isActive,
    };
    saveUser(user);
    refresh();
    if (isNew) setCredentials({ username: user.username, password: form.password.trim() || user.password });
    setForm(null);
    showSuccess(isNew ? 'ההורה נוצר/ה בהצלחה' : 'ההורה עודכן/ה');
  };

  const toggleChild = (childId: string, f: UserFormState) => {
    const ids = f.childUserIds ?? [];
    setForm({ ...f, childUserIds: ids.includes(childId) ? ids.filter((id) => id !== childId) : [...ids, childId] });
  };

  return (
    <div className="space-y-4">
      {success && <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm text-emerald-800 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש הורה..."
            className="w-full border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="all">כל הסטטוסים</option><option value="active">פעילים</option><option value="inactive">מושהים</option>
        </select>
        <Btn color="indigo" size="md" onClick={() => { setForm(buildInitialForm()); setFormErrors({}); setShowPw(false); }}>
          <Plus className="w-4 h-4" />הורה חדש/ה
        </Btn>
      </div>

      <p className="text-xs text-gray-500">
        <strong>{getActiveUserCount(schoolId, 'parent')}</strong> הורים פעילים · מציג <strong>{visible.length}</strong>
      </p>

      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">אין הורים להצגה</div>
      ) : (
        <div className="space-y-2">
          {visible.map((u) => (
            <div key={u.id} className={`bg-white rounded-xl border shadow-sm px-4 py-3 ${u.isActive === false ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-800">{u.fullName}</p>
                    <Badge color={u.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}>
                      {u.isActive !== false ? 'פעיל' : 'מושהה'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">@{u.username}</p>
                  {u.childUserIds && u.childUserIds.length > 0 && (
                    <p className="text-xs text-indigo-600 mt-0.5">
                      ילדים: {u.childUserIds.map((cid) => students.find((s) => s.id === cid)?.fullName ?? cid).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Btn color="gray" size="xs" onClick={() => { setForm(buildInitialForm(u)); setFormErrors({}); setShowPw(false); }}><Pencil className="w-3.5 h-3.5" /></Btn>
                  <Btn color="amber" size="xs" onClick={() => { const pw = `tmp${Math.floor(1000 + Math.random() * 9000)}`; resetUserPassword(u.id, schoolId, pw); refresh(); setCredentials({ username: u.username, password: pw }); }}><Eye className="w-3.5 h-3.5" /></Btn>
                  <Btn color={u.isActive !== false ? 'amber' : 'emerald'} size="xs" onClick={() => { if (u.isActive === false) reactivateUser(u.id, schoolId); else deactivateUser(u.id, schoolId); refresh(); showSuccess(u.isActive === false ? 'הופעל' : 'הושהה'); }}>
                    {u.isActive !== false ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                  </Btn>
                  <Btn color="rose" size="xs" onClick={() => setConfirm({ id: u.id })}><Trash2 className="w-3.5 h-3.5" /></Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 my-4" dir="rtl">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-gray-800">{form.id ? 'עריכת הורה' : 'הורה חדש/ה'}</p>
              <button onClick={() => setForm(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              {[
                { field: 'fullName' as const, label: 'שם מלא' },
                { field: 'username' as const, label: 'שם משתמש' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label} <span className="text-rose-500">*</span></label>
                  <input value={form[field] as string} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors[field] ? 'border-rose-400' : 'border-gray-200'}`} />
                  {formErrors[field] && <p className="text-xs text-rose-500 mt-0.5">{formErrors[field]}</p>}
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {form.id ? 'סיסמה חדשה (ריק = ללא שינוי)' : 'סיסמה זמנית'} {!form.id && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pl-9 ${formErrors.password ? 'border-rose-400' : 'border-gray-200'}`} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.password && <p className="text-xs text-rose-500 mt-0.5">{formErrors.password}</p>}
              </div>
              {/* Child links */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ילדים מקושרים <span className="text-rose-500">*</span></label>
                {students.length === 0 ? (
                  <p className="text-xs text-gray-400">אין תלמידים פעילים בבית הספר</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {students.map((s) => (
                      <button type="button" key={s.id} onClick={() => toggleChild(s.id, form)}
                        className={`text-xs font-bold px-2 py-1 rounded-xl border transition-colors ${
                          form.childUserIds?.includes(s.id) ? 'bg-violet-500 text-white border-violet-500' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-400'
                        }`}>
                        {s.fullName}
                      </button>
                    ))}
                  </div>
                )}
                {formErrors.childUserIds && <p className="text-xs text-rose-500 mt-0.5">{formErrors.childUserIds}</p>}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pr-active" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                <label htmlFor="pr-active" className="text-sm text-gray-700">חשבון פעיל</label>
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <Btn color="gray" onClick={() => setForm(null)}>ביטול</Btn>
              <Btn color="indigo" onClick={handleSave}>שמור</Btn>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog message="האם למחוק את ההורה? פעולה זו בלתי הפיכה."
          onConfirm={() => { deleteUser(confirm.id, schoolId); refresh(); setConfirm(null); showSuccess('ההורה נמחק/ה'); }}
          onCancel={() => setConfirm(null)} />
      )}
      {credentials && <CredentialCard {...credentials} onClose={() => setCredentials(null)} />}
    </div>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

const TAB_CONFIG: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'classes', label: 'כיתות ושכבות', icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'students', label: 'תלמידים', icon: <Users className="w-4 h-4" /> },
  { id: 'teachers', label: 'מורים', icon: <BookUser className="w-4 h-4" /> },
  { id: 'parents', label: 'הורים', icon: <UserRound className="w-4 h-4" /> },
];

export function AdminUsersClassesScreen({ activeUser, onBack, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>('classes');
  const school = getSchool(activeUser.schoolId);
  const schoolId = activeUser.schoolId;

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
              <p className="text-white font-bold text-sm">תלמידים, כיתות ומשתמשים</p>
              <p className="text-indigo-300 text-xs">{school?.name}</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm">
            <LogOut className="w-4 h-4" /><span className="hidden sm:inline">יציאה</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Summary bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'כיתות פעילות', value: getActiveClassCount(schoolId), color: 'text-indigo-700', bg: 'bg-indigo-50' },
            { label: 'תלמידים פעילים', value: getActiveUserCount(schoolId, 'student'), color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'מורים פעילים', value: getActiveUserCount(schoolId, 'teacher'), color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'הורים פעילים', value: getActiveUserCount(schoolId, 'parent'), color: 'text-violet-700', bg: 'bg-violet-50' },
          ].map((s) => (
            <div key={s.label} className={`bg-white rounded-xl border border-gray-100 shadow-sm p-3 ${s.bg} text-center`}>
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm overflow-x-auto">
          {TAB_CONFIG.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'classes' && <ClassesTab schoolId={schoolId} />}
        {tab === 'students' && <StudentsTab schoolId={schoolId} />}
        {tab === 'teachers' && <TeachersTab schoolId={schoolId} />}
        {tab === 'parents' && <ParentsTab schoolId={schoolId} />}
      </main>
    </div>
  );
}
