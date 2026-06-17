import React, { useState, useMemo } from 'react';
import {
  ChevronRight, LogOut, Calendar, Plus, Pencil, Trash2,
  X, CheckCircle, AlertTriangle, Copy,
} from 'lucide-react';
import type { User, TimetableEntry, AppScreen } from '../types';
import { getSchool } from '../utils/dataHelpers';
import { getAllClassesForSchool } from '../services/classRepository';
import { getAllUsersForSchool } from '../services/userRepository';
import {
  getTimetableForClass, saveTimetableEntry, deleteTimetableEntry,
  generateTimetableId, findOverlap, duplicateDayEntries,
} from '../services/timetableRepository';

interface Props { activeUser: User; onBack: () => void; onNavigate: (s: AppScreen) => void; onLogout: () => void; }

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];

interface EntryForm {
  id?: string; dayOfWeek: number; startTime: string; endTime: string;
  subject: string; teacherName: string; room: string; isBreak: boolean; period: number;
}

function emptyForm(day: number, period: number): EntryForm {
  return { dayOfWeek: day, startTime: '08:00', endTime: '08:45', subject: '', teacherName: '', room: '', isBreak: false, period };
}

const SUBJECTS = ['עברית', 'חשבון', 'מדעים', 'אנגלית', 'תנ"ך', 'היסטוריה', 'גיאוגרפיה', 'חינוך גופני', 'אמנות', 'מוזיקה', 'כישורי חיים', 'הפסקה'];

export function AdminTimetableScreen({ activeUser, onBack, onLogout }: Props) {
  const schoolId = activeUser.schoolId;
  const school = getSchool(schoolId);
  const classes = useMemo(() => getAllClassesForSchool(schoolId).filter((c) => c.isActive !== false), [schoolId]);
  const teachers = useMemo(() => getAllUsersForSchool(schoolId, 'teacher').filter((u) => u.isActive !== false), [schoolId]);

  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? '');
  const [activeDay, setActiveDay] = useState(0);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [form, setForm] = useState<EntryForm | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<string | null>(null);
  const [dupDay, setDupDay] = useState<{ from: number; to: number } | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const refresh = () => {
    if (selectedClassId) setEntries(getTimetableForClass(selectedClassId, schoolId));
  };

  useMemo(() => { if (selectedClassId) setEntries(getTimetableForClass(selectedClassId, schoolId)); }, [selectedClassId, schoolId]);

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 2500); };
  const showError = (msg: string) => { setError(msg); setTimeout(() => setError(''), 3000); };

  const dayEntries = useMemo(() =>
    entries.filter((e) => e.dayOfWeek === activeDay).sort((a, b) => a.period - b.period),
  [entries, activeDay]);

  const validate = (f: EntryForm): boolean => {
    const e: Record<string, string> = {};
    const toMins = (t: string) => { const [h = 0, m = 0] = t.split(':').map(Number); return h * 60 + m; };
    if (!f.subject.trim()) e.subject = 'חובה';
    if (!f.startTime) e.startTime = 'חובה';
    if (!f.endTime) e.endTime = 'חובה';
    if (f.startTime && f.endTime && toMins(f.startTime) >= toMins(f.endTime)) e.endTime = 'שעת סיום חייבת להיות אחרי שעת התחלה';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!form || !validate(form) || !selectedClassId) return;
    const entry: TimetableEntry = {
      id: form.id ?? generateTimetableId(),
      schoolId,
      classId: selectedClassId,
      dayOfWeek: form.dayOfWeek,
      period: form.period,
      subject: form.subject.trim(),
      teacherName: form.teacherName.trim(),
      room: form.room.trim() || undefined,
      startTime: form.startTime,
      endTime: form.endTime,
      isBreak: form.isBreak,
    };
    const overlap = findOverlap(schoolId, entry, form.id);
    if (overlap) {
      showError(`חפיפה עם "${overlap.subject}" (${overlap.startTime}–${overlap.endTime})`);
      return;
    }
    saveTimetableEntry(entry);
    refresh();
    setForm(null);
    showSuccess(form.id ? 'הרשומה עודכנה' : 'הרשומה נוצרה');
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
              <p className="text-white font-bold text-sm">ניהול מערכת שעות</p>
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
        {error && <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 text-sm text-rose-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}

        {/* Class selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <label className="block text-xs font-semibold text-gray-600 mb-2">בחר כיתה לעריכה</label>
          <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full sm:w-64 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">בחר כיתה</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {!selectedClassId ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>בחר כיתה כדי לנהל את המערכת</p>
          </div>
        ) : (
          <>
            {/* Day tabs */}
            <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm overflow-x-auto">
              {DAY_NAMES.map((name, idx) => (
                <button key={idx} onClick={() => setActiveDay(idx)}
                  className={`flex-1 min-w-[64px] py-2 rounded-xl text-sm font-semibold transition-all ${
                    activeDay === idx ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
                  }`}>
                  {name}
                  <span className="block text-[10px] opacity-60">
                    {entries.filter((e) => e.dayOfWeek === idx).length} שיעורים
                  </span>
                </button>
              ))}
            </div>

            {/* Day actions */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-gray-700">יום {DAY_NAMES[activeDay]} — {dayEntries.length} רשומות</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDupDay({ from: activeDay, to: (activeDay + 1) % 5 })}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:border-indigo-400 px-3 py-1.5 rounded-xl transition-colors">
                  <Copy className="w-3.5 h-3.5" />שכפל יום
                </button>
                <button
                  onClick={() => {
                    const nextPeriod = dayEntries.length > 0 ? Math.max(...dayEntries.map((e) => e.period)) + 1 : 1;
                    setForm(emptyForm(activeDay, nextPeriod)); setFormErrors({});
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-xl transition-colors">
                  <Plus className="w-3.5 h-3.5" />הוסף שיעור
                </button>
              </div>
            </div>

            {/* Entry list */}
            {dayEntries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">אין שיעורים ביום זה</div>
            ) : (
              <div className="space-y-2">
                {dayEntries.map((e) => (
                  <div key={e.id} className={`bg-white rounded-xl border shadow-sm px-4 py-3 flex items-center gap-3 ${e.isBreak ? 'border-amber-100 bg-amber-50' : 'border-gray-100'}`}>
                    <div className="w-16 text-center flex-shrink-0">
                      <p className="text-xs font-bold text-gray-600">{e.startTime}</p>
                      <p className="text-xs text-gray-400">{e.endTime}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${e.isBreak ? 'text-amber-700' : 'text-gray-800'}`}>{e.subject}</p>
                      {!e.isBreak && <p className="text-xs text-gray-500">{e.teacherName}{e.room ? ` · ${e.room}` : ''}</p>}
                    </div>
                    {e.isBreak && <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">הפסקה</span>}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => { setForm({ id: e.id, dayOfWeek: e.dayOfWeek, startTime: e.startTime, endTime: e.endTime, subject: e.subject, teacherName: e.teacherName, room: e.room ?? '', isBreak: e.isBreak ?? false, period: e.period }); setFormErrors({}); }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setConfirm(e.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Entry form modal */}
        {form && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 my-4" dir="rtl">
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-gray-800">{form.id ? 'עריכת שיעור' : 'שיעור חדש'} — יום {DAY_NAMES[form.dayOfWeek]}</p>
                <button onClick={() => setForm(null)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is-break" checked={form.isBreak} onChange={(e) => setForm({ ...form, isBreak: e.target.checked, subject: e.target.checked ? 'הפסקה' : '' })} className="rounded" />
                  <label htmlFor="is-break" className="text-sm text-gray-700 font-semibold">הפסקה (לא שיעור לימוד)</label>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{form.isBreak ? 'שם ההפסקה' : 'מקצוע'} <span className="text-rose-500">*</span></label>
                  {form.isBreak ? (
                    <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  ) : (
                    <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className={`w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors.subject ? 'border-rose-400' : 'border-gray-200'}`}>
                      <option value="">בחר מקצוע</option>
                      {SUBJECTS.filter((s) => s !== 'הפסקה').map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                  {formErrors.subject && <p className="text-xs text-rose-500 mt-0.5">{formErrors.subject}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">שעת התחלה <span className="text-rose-500">*</span></label>
                    <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors.startTime ? 'border-rose-400' : 'border-gray-200'}`} />
                    {formErrors.startTime && <p className="text-xs text-rose-500 mt-0.5">{formErrors.startTime}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">שעת סיום <span className="text-rose-500">*</span></label>
                    <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${formErrors.endTime ? 'border-rose-400' : 'border-gray-200'}`} />
                    {formErrors.endTime && <p className="text-xs text-rose-500 mt-0.5">{formErrors.endTime}</p>}
                  </div>
                </div>
                {!form.isBreak && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">מורה</label>
                      <select value={form.teacherName} onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                        <option value="">בחר מורה</option>
                        {teachers.map((t) => <option key={t.id} value={t.fullName}>{t.fullName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">חדר/מיקום</label>
                      <input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">מספר שיעור (לסידור)</label>
                  <input type="number" value={form.period} min={1} max={12} onChange={(e) => setForm({ ...form, period: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <div className="flex gap-2 mt-5 justify-end">
                <button onClick={() => setForm(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">ביטול</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">שמור</button>
              </div>
            </div>
          </div>
        )}

        {/* Duplicate day dialog */}
        {dupDay && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" dir="rtl">
              <p className="font-bold text-gray-800 mb-3">שכפל יום {DAY_NAMES[dupDay.from]} אל:</p>
              <select value={dupDay.to} onChange={(e) => setDupDay({ ...dupDay, to: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-4">
                {DAY_NAMES.map((n, i) => i !== dupDay.from && <option key={i} value={i}>{n}</option>)}
              </select>
              <p className="text-xs text-amber-600 mb-4">⚠️ פעולה זו תוסיף את שיעורי יום {DAY_NAMES[dupDay.from]} ליום {DAY_NAMES[dupDay.to]} (לא תמחק שיעורים קיימים).</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDupDay(null)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">ביטול</button>
                <button onClick={() => {
                  duplicateDayEntries(selectedClassId, schoolId, dupDay.from, dupDay.to);
                  refresh(); setDupDay(null); showSuccess(`יום ${DAY_NAMES[dupDay.from]} שוכפל ליום ${DAY_NAMES[dupDay.to]}`);
                }} className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">שכפל</button>
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
                <p className="text-sm font-semibold text-gray-800">האם למחוק שיעור/הפסקה זו?</p>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setConfirm(null)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">ביטול</button>
                <button onClick={() => { deleteTimetableEntry(confirm, schoolId); refresh(); setConfirm(null); showSuccess('הרשומה נמחקה'); }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl">מחק</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
