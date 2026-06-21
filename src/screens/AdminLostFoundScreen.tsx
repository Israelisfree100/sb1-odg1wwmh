import React, { useState, useMemo } from 'react';
import {
  ChevronRight, LogOut, Package, Plus, Pencil, Trash2,
  Search, X, CheckCircle, AlertTriangle, RotateCcw, Archive,
} from 'lucide-react';
import type { User, LostFoundItem, LostFoundCategory, AppScreen } from '../types';
import { getSchool } from '../utils/dataHelpers';
import { getAllClassesForSchool } from '../services/classRepository';
import { getMergedLostFoundItems, saveLostFoundItem, deleteLostFoundItemById } from '../utils/dataHelpers';

interface Props { activeUser: User; onBack: () => void; onNavigate: (s: AppScreen) => void; onLogout: () => void; initialFilter?: string; }

type StatusFilter = 'all' | LostFoundItem['status'];
type TypeFilter = 'all' | 'found' | 'lost';

const STATUS_LABELS: Record<LostFoundItem['status'], string> = {
  open: 'פתוח', claimed: 'נתבע', returned: 'הוחזר', archived: 'ארכיון',
};
const STATUS_COLORS: Record<LostFoundItem['status'], string> = {
  open: 'bg-sky-100 text-sky-700',
  claimed: 'bg-amber-100 text-amber-700',
  returned: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-gray-100 text-gray-500',
};
const CAT_LABELS: Record<LostFoundCategory, string> = {
  writing: 'כתיבה', clothing: 'ביגוד', bags: 'תיקים',
  'bottles-food': 'בקבוקים ואוכל', books: 'ספרים', other: 'אחר',
};
const SOURCE_LABELS: Record<string, string> = {
  student: 'תלמיד', teacher: 'מורה', parent: 'הורה', office: 'משרד', staff: 'צוות',
};

function generateLFId(): string { return `lf-adm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`; }

interface LFForm {
  id?: string; reportType: 'found' | 'lost'; itemName: string; description: string;
  location: string; color: string; category: LostFoundCategory; classId: string;
  reportingSource: string;
}

function emptyForm(): LFForm {
  return { reportType: 'found', itemName: '', description: '', location: '', color: '', category: 'other', classId: '', reportingSource: 'office' };
}

export function AdminLostFoundScreen({ activeUser, onBack, onLogout, initialFilter }: Props) {
  const schoolId = activeUser.schoolId;
  const school = getSchool(schoolId);
  const classes = useMemo(() => getAllClassesForSchool(schoolId).filter((c) => c.isActive !== false), [schoolId]);
  const [items, setItems] = useState<LostFoundItem[]>(() => getMergedLostFoundItems(schoolId));
  const [search, setSearch] = useState('');
  const validStatuses = ['all', 'open', 'claimed', 'returned', 'archived'] as StatusFilter[];
  const initStatus: StatusFilter = validStatuses.includes(initialFilter as StatusFilter)
    ? (initialFilter as StatusFilter) : 'all';
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initStatus);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [classFilter, setClassFilter] = useState('');
  const [catFilter, setCatFilter] = useState<'' | LostFoundCategory>('');
  const [form, setForm] = useState<LFForm | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<string | null>(null);
  const [detail, setDetail] = useState<LostFoundItem | null>(null);
  const [success, setSuccess] = useState('');

  const refresh = () => setItems(getMergedLostFoundItems(schoolId));
  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 2500); };

  const visible = useMemo(() => items.filter((i) => {
    if (search && !i.itemName.includes(search) && !i.description.includes(search) && !i.location.includes(search)) return false;
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (typeFilter !== 'all' && i.reportType !== typeFilter) return false;
    if (classFilter && i.classId !== classFilter) return false;
    if (catFilter && i.category !== catFilter) return false;
    return true;
  }), [items, search, statusFilter, typeFilter, classFilter, catFilter]);

  const validate = (f: LFForm) => {
    const e: Record<string, string> = {};
    if (!f.itemName.trim()) e.itemName = 'חובה';
    if (!f.location.trim()) e.location = 'חובה';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!form || !validate(form)) return;
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const item: LostFoundItem = {
      id: form.id ?? generateLFId(),
      schoolId,
      classId: form.classId || undefined,
      reportedByUserId: activeUser.id,
      reportType: form.reportType,
      itemName: form.itemName.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      date: dateStr,
      color: form.color.trim() || undefined,
      category: form.category,
      status: 'open',
      reportingSource: (form.reportingSource || 'office') as LostFoundItem['reportingSource'],
      createdAt: now.toISOString(),
    };
    if (form.id) {
      const existing = items.find((i) => i.id === form.id);
      if (existing) Object.assign(item, { status: existing.status, claimedByUserId: existing.claimedByUserId, date: existing.date, createdAt: existing.createdAt });
    }
    saveLostFoundItem(schoolId, item);
    refresh();
    setForm(null);
    showSuccess(form.id ? 'הפריט עודכן' : 'פריט חדש נוצר');
  };

  const updateStatus = (id: string, status: LostFoundItem['status']) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    saveLostFoundItem(schoolId, { ...item, status });
    refresh();
    showSuccess(`הסטטוס עודכן ל${STATUS_LABELS[status]}`);
  };

  const statsBar = useMemo(() => {
    const open = items.filter((i) => i.status === 'open').length;
    const claimed = items.filter((i) => i.status === 'claimed').length;
    const returned = items.filter((i) => i.status === 'returned').length;
    const archived = items.filter((i) => i.status === 'archived').length;
    return { open, claimed, returned, archived, total: items.length };
  }, [items]);

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
              <p className="text-white font-bold text-sm">ניהול אבדות ומציאות</p>
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

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'פתוחים', count: statsBar.open, color: 'text-sky-600 bg-sky-50 border-sky-100' },
            { label: 'נתבעו', count: statsBar.claimed, color: 'text-amber-600 bg-amber-50 border-amber-100' },
            { label: 'הוחזרו', count: statsBar.returned, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
            { label: 'בארכיון', count: statsBar.archived, color: 'text-gray-500 bg-gray-50 border-gray-100' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
              <p className="text-2xl font-extrabold">{s.count}</p>
              <p className="text-xs font-semibold">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש פריטים..."
              className="w-full border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="all">מצאתי / אבדתי</option>
            <option value="found">מצאתי</option>
            <option value="lost">אבדתי</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="all">כל הסטטוסים</option>
            {(['open', 'claimed', 'returned', 'archived'] as LostFoundItem['status'][]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value as '' | LostFoundCategory)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">כל הקטגוריות</option>
            {(Object.keys(CAT_LABELS) as LostFoundCategory[]).map((k) => <option key={k} value={k}>{CAT_LABELS[k]}</option>)}
          </select>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">כל הכיתות</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => { setForm(emptyForm()); setFormErrors({}); }}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
            <Plus className="w-4 h-4" />פריט חדש
          </button>
        </div>

        <p className="text-xs text-gray-500">מציג <strong>{visible.length}</strong> מתוך <strong>{items.length}</strong> פריטים</p>

        {/* Item list */}
        {visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>אין פריטים להצגה</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((item) => {
              const cls = classes.find((c) => c.id === item.classId);
              return (
                <div key={item.id} className={`bg-white rounded-xl border shadow-sm px-4 py-3 ${item.status === 'archived' ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-bold text-gray-800">{item.itemName}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.reportType === 'found' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {item.reportType === 'found' ? 'נמצא' : 'אבד'}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}>{STATUS_LABELS[item.status]}</span>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{CAT_LABELS[item.category]}</span>
                      </div>
                      <p className="text-xs text-gray-500">{item.location}{item.color ? ` · צבע: ${item.color}` : ''}{cls ? ` · ${cls.name}` : ''}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{item.description}</p>
                      <p className="text-xs text-gray-400 mt-1">דווח: {item.date}{item.reportingSource ? ` · ע"י ${SOURCE_LABELS[item.reportingSource] ?? item.reportingSource}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setDetail(item)} className="p-1.5 text-gray-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 text-xs">פרטים</button>
                      <button onClick={() => {
                        setForm({ id: item.id, reportType: item.reportType, itemName: item.itemName, description: item.description, location: item.location, color: item.color ?? '', category: item.category, classId: item.classId ?? '', reportingSource: item.reportingSource ?? 'office' });
                        setFormErrors({});
                      }} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setConfirm(item.id)} className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  {/* Status actions */}
                  {item.status !== 'archived' && (
                    <div className="flex gap-2 mt-2.5 flex-wrap">
                      {item.status === 'open' && (
                        <button onClick={() => updateStatus(item.id, 'claimed')} className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors">
                          <CheckCircle className="w-3.5 h-3.5" />אישור תביעה
                        </button>
                      )}
                      {(item.status === 'open' || item.status === 'claimed') && (
                        <button onClick={() => updateStatus(item.id, 'returned')} className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors">
                          <CheckCircle className="w-3.5 h-3.5" />סמן כהוחזר
                        </button>
                      )}
                      {item.status === 'claimed' && (
                        <button onClick={() => updateStatus(item.id, 'open')} className="flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-lg transition-colors">
                          <RotateCcw className="w-3.5 h-3.5" />דחיית תביעה
                        </button>
                      )}
                      <button onClick={() => updateStatus(item.id, 'archived')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-lg transition-colors">
                        <Archive className="w-3.5 h-3.5" />ארכיון
                      </button>
                    </div>
                  )}
                  {item.status === 'archived' && (
                    <button onClick={() => updateStatus(item.id, 'open')} className="mt-2 flex items-center gap-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition-colors">
                      <RotateCcw className="w-3.5 h-3.5" />פתח מחדש
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Detail modal */}
        {detail && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" dir="rtl">
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-gray-800">פרטי דיווח</p>
                <button onClick={() => setDetail(null)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">שם:</span><span className="font-semibold">{detail.itemName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">סוג:</span><span>{detail.reportType === 'found' ? 'נמצא' : 'אבד'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">קטגוריה:</span><span>{CAT_LABELS[detail.category]}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">מיקום:</span><span>{detail.location}</span></div>
                {detail.color && <div className="flex justify-between"><span className="text-gray-500">צבע:</span><span>{detail.color}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">תאריך:</span><span>{detail.date}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">סטטוס:</span><span className={`font-bold ${STATUS_COLORS[detail.status]} px-2 py-0.5 rounded-full text-xs`}>{STATUS_LABELS[detail.status]}</span></div>
                {detail.classId && <div className="flex justify-between"><span className="text-gray-500">כיתה:</span><span>{classes.find((c) => c.id === detail.classId)?.name ?? detail.classId}</span></div>}
                {detail.reportingSource && <div className="flex justify-between"><span className="text-gray-500">מקור הדיווח:</span><span>{SOURCE_LABELS[detail.reportingSource] ?? detail.reportingSource}</span></div>}
                {detail.description && <div><p className="text-gray-500 mb-1">תיאור:</p><p className="bg-gray-50 rounded-lg p-2 text-xs">{detail.description}</p></div>}
              </div>
            </div>
          </div>
        )}

        {/* Form modal */}
        {form && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 my-4" dir="rtl">
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-gray-800">{form.id ? 'עריכת פריט' : 'פריט חדש'}</p>
                <button onClick={() => setForm(null)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(['found', 'lost'] as const).map((t) => (
                    <button key={t} onClick={() => setForm({ ...form, reportType: t })}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${form.reportType === t ? (t === 'found' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700') : 'bg-gray-100 text-gray-500'}`}>
                      {t === 'found' ? 'מצאתי' : 'אבדתי'}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">שם הפריט <span className="text-rose-500">*</span></label>
                  <input value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors.itemName ? 'border-rose-400' : 'border-gray-200'}`} />
                  {formErrors.itemName && <p className="text-xs text-rose-500 mt-0.5">{formErrors.itemName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">תיאור</label>
                  <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">מיקום <span className="text-rose-500">*</span></label>
                    <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors.location ? 'border-rose-400' : 'border-gray-200'}`} />
                    {formErrors.location && <p className="text-xs text-rose-500 mt-0.5">{formErrors.location}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">צבע</label>
                    <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">קטגוריה</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as LostFoundCategory })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                      {(Object.keys(CAT_LABELS) as LostFoundCategory[]).map((k) => <option key={k} value={k}>{CAT_LABELS[k]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">כיתה</label>
                    <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                      <option value="">ללא כיתה</option>
                      {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">מקור הדיווח</label>
                  <select value={form.reportingSource} onChange={(e) => setForm({ ...form, reportingSource: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-5 justify-end">
                <button onClick={() => setForm(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">ביטול</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">שמור</button>
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
                <p className="text-sm font-semibold text-gray-800">האם למחוק דיווח זה? פעולה בלתי הפיכה.</p>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setConfirm(null)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">ביטול</button>
                <button onClick={() => { deleteLostFoundItemById(schoolId, confirm); refresh(); setConfirm(null); showSuccess('הדיווח נמחק'); }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl">מחק</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
