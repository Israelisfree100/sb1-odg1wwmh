import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  LogOut,
  Search,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Package,
  X,
  AlertTriangle,
} from 'lucide-react';
import type { User, LostFoundItem, LostFoundCategory } from '../types';
import {
  getMergedLostFoundItems,
  saveLostFoundItem,
  deleteLostFoundItemById,
  getSchool,
  getClass,
  getInitials,
} from '../utils/dataHelpers';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<LostFoundCategory, string> = {
  writing: 'כלי כתיבה',
  clothing: 'בגדים',
  bags: 'תיקים וקלמרים',
  'bottles-food': 'בקבוקים וקופסאות אוכל',
  books: 'ספרים ומחברות',
  other: 'אחר',
};

const CATEGORY_ICONS: Record<LostFoundCategory, string> = {
  writing: '✏️',
  clothing: '👕',
  bags: '🎒',
  'bottles-food': '🥤',
  books: '📚',
  other: '📦',
};

type Tab = 'all' | 'found' | 'lost' | 'mine';
type StatusFilter = 'all' | 'open' | 'claimed' | 'returned';

interface FormState {
  reportType: 'found' | 'lost';
  itemName: string;
  category: LostFoundCategory | '';
  color: string;
  description: string;
  location: string;
  date: string;
  visibility: 'school' | 'class';
}

interface Props {
  activeUser: User;
  onBack: () => void;
  onLogout: () => void;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function todayInputDate(): string {
  return new Date().toISOString().split('T')[0];
}

function inputDateToDisplay(d: string): string {
  if (!d) return '';
  const parts = d.split('-');
  return `${parts[2]}/${parts[1]}`;
}

function displayDateToInput(d: string): string {
  if (!d || !d.includes('/')) return todayInputDate();
  const [day, month] = d.split('/');
  const year = new Date().getFullYear();
  return `${year}-${(month ?? '01').padStart(2, '0')}-${(day ?? '01').padStart(2, '0')}`;
}

function genItemId(): string {
  return 'lf-u-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LostFoundScreen({ activeUser, onBack, onLogout }: Props) {
  const school = getSchool(activeUser.schoolId);
  const cls = activeUser.classId ? getClass(activeUser.classId) : undefined;
  const initials = getInitials(activeUser.fullName);

  const [items, setItems] = useState<LostFoundItem[]>(() =>
    getMergedLostFoundItems(activeUser.schoolId),
  );

  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<LostFoundCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<LostFoundItem | null>(null);
  const [claimTarget, setClaimTarget] = useState<LostFoundItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LostFoundItem | null>(null);

  const emptyForm: FormState = {
    reportType: 'found',
    itemName: '',
    category: '',
    color: '',
    description: '',
    location: '',
    date: todayInputDate(),
    visibility: 'school',
  };

  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  function refreshItems() {
    setItems(getMergedLostFoundItems(activeUser.schoolId));
  }

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = items;
    if (activeTab === 'found') list = list.filter((i) => i.reportType === 'found');
    else if (activeTab === 'lost') list = list.filter((i) => i.reportType === 'lost');
    else if (activeTab === 'mine') list = list.filter((i) => i.reportedByUserId === activeUser.id);

    if (catFilter !== 'all') list = list.filter((i) => i.category === catFilter);
    if (statusFilter !== 'all') list = list.filter((i) => i.status === statusFilter);

    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.itemName.toLowerCase().includes(s) ||
          i.description.toLowerCase().includes(s) ||
          (i.color?.toLowerCase().includes(s) ?? false) ||
          i.location.toLowerCase().includes(s),
      );
    }
    return list;
  }, [items, activeTab, catFilter, statusFilter, search, activeUser.id]);

  // ── Form open/close ────────────────────────────────────────────────────────

  function openNewForm() {
    setEditItem(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowForm(true);
  }

  function openEditForm(item: LostFoundItem) {
    setEditItem(item);
    setForm({
      reportType: item.reportType,
      itemName: item.itemName,
      category: item.category,
      color: item.color ?? '',
      description: item.description,
      location: item.location,
      date: displayDateToInput(item.date),
      visibility: item.classId ? 'class' : 'school',
    });
    setFormErrors({});
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditItem(null);
    setForm(emptyForm);
    setFormErrors({});
  }

  // ── Form submit ────────────────────────────────────────────────────────────

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (!form.itemName.trim()) errors.itemName = 'יש להזין שם פריט';
    if (!form.category) errors.category = 'יש לבחור קטגוריה';
    if (!form.location.trim()) errors.location = 'יש להזין מיקום';
    if (!form.date) errors.date = 'יש לבחור תאריך';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const saved: LostFoundItem = {
      id: editItem?.id ?? genItemId(),
      schoolId: activeUser.schoolId,
      classId:
        form.visibility === 'class' ? activeUser.classId : undefined,
      reportedByUserId: activeUser.id,
      reportType: form.reportType,
      itemName: form.itemName.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      date: inputDateToDisplay(form.date),
      color: form.color.trim() || undefined,
      category: form.category as LostFoundCategory,
      status: editItem?.status ?? 'open',
      claimedByUserId: editItem?.claimedByUserId,
      createdAt: editItem?.createdAt ?? new Date().toISOString(),
    };

    saveLostFoundItem(activeUser.schoolId, saved);
    refreshItems();
    closeForm();
  }

  // ── Claim ──────────────────────────────────────────────────────────────────

  function handleClaim() {
    if (!claimTarget) return;
    const updated: LostFoundItem = {
      ...claimTarget,
      status: 'claimed',
      claimedByUserId: activeUser.id,
    };
    saveLostFoundItem(activeUser.schoolId, updated);
    refreshItems();
    setClaimTarget(null);
  }

  // ── Mark returned ──────────────────────────────────────────────────────────

  function handleMarkReturned(item: LostFoundItem) {
    saveLostFoundItem(activeUser.schoolId, { ...item, status: 'returned' });
    refreshItems();
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  function handleDelete() {
    if (!deleteTarget) return;
    deleteLostFoundItemById(activeUser.schoolId, deleteTarget.id);
    refreshItems();
    setDeleteTarget(null);
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all', label: 'כל הפריטים' },
    { key: 'found', label: 'מצאתי' },
    { key: 'lost', label: 'איבדתי' },
    { key: 'mine', label: 'הפריטים שלי' },
  ];

  const openCount = items.filter((i) => i.status === 'open').length;

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* ── Header ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/60 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            חזרה
          </button>
          <div className="text-center min-w-0">
            <p className="font-bold text-gray-800 text-sm flex items-center justify-center gap-1.5">
              אבדות ומציאות
              {openCount > 0 && (
                <span className="bg-amber-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {openCount}
                </span>
              )}
            </p>
            {school && (
              <p className="text-xs text-gray-400 truncate">{school.name}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs select-none">
              {initials}
            </div>
            <button type="button" onClick={onLogout} title="התנתקות" className="text-gray-400 hover:text-rose-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* ── Summary strip ── */}
        <div className="bg-gradient-to-l from-amber-500 to-orange-500 rounded-2xl p-4 text-white shadow-md flex items-center justify-between gap-4">
          <div>
            <p className="text-amber-100 text-xs font-medium">פריטים פתוחים</p>
            <p className="text-3xl font-bold">{openCount}</p>
          </div>
          <div className="text-center">
            <p className="text-amber-100 text-xs">{school?.name}</p>
            {cls && <p className="text-white font-semibold text-sm">{cls.name}</p>}
          </div>
          <button
            type="button"
            onClick={openNewForm}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            דיווח על פריט
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === key
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-300'
              }`}
            >
              {label}
              {key === 'mine' && (
                <span className="mr-1 text-xs opacity-70">
                  ({items.filter((i) => i.reportedByUserId === activeUser.id).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש חופשי..."
              className="w-full bg-white border border-gray-200 rounded-xl pr-8 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-gray-800 placeholder:text-gray-400"
              dir="rtl"
            />
          </div>
          {/* Category filter */}
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value as LostFoundCategory | 'all')}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <option value="all">כל הקטגוריות</option>
            {(Object.keys(CATEGORY_LABELS) as LostFoundCategory[]).map((k) => (
              <option key={k} value={k}>
                {CATEGORY_ICONS[k]} {CATEGORY_LABELS[k]}
              </option>
            ))}
          </select>
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <option value="all">כל המצבים</option>
            <option value="open">פתוח</option>
            <option value="claimed">נתבע</option>
            <option value="returned">הוחזר</option>
          </select>
        </div>

        {/* ── Items ── */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-600 text-lg">לא נמצאו פריטים</p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === 'mine'
                ? 'טרם דיווחת על פריטים. לחץ על "דיווח על פריט" להתחיל!'
                : 'נסה/י לשנות את הפילטרים או לחפש משהו אחר'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                activeUser={activeUser}
                onClaim={() => setClaimTarget(item)}
                onEdit={() => openEditForm(item)}
                onDelete={() => setDeleteTarget(item)}
                onMarkReturned={() => handleMarkReturned(item)}
              />
            ))}
          </div>
        )}

        <div className="h-6" />
      </main>

      {/* ── Report / Edit form overlay ── */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={closeForm}
        >
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800 text-base">
                {editItem ? 'עריכת פריט' : 'דיווח על פריט'}
              </h2>
              <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4" noValidate>
              {/* Found / Lost toggle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">סוג הדיווח</label>
                <div className="flex gap-2">
                  {(['found', 'lost'] as const).map((rt) => (
                    <button
                      key={rt}
                      type="button"
                      onClick={() => setForm({ ...form, reportType: rt })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                        form.reportType === rt
                          ? rt === 'found'
                            ? 'bg-teal-500 text-white border-teal-500'
                            : 'bg-rose-500 text-white border-rose-500'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      {rt === 'found' ? '✓ מצאתי' : '✗ איבדתי'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Item name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  שם הפריט <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.itemName}
                  onChange={(e) => {
                    setForm({ ...form, itemName: e.target.value });
                    setFormErrors({ ...formErrors, itemName: undefined });
                  }}
                  placeholder="למשל: קלמר, מחברת, מעיל..."
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-gray-800 placeholder:text-gray-400 ${
                    formErrors.itemName ? 'border-rose-300' : 'border-gray-200'
                  }`}
                />
                {formErrors.itemName && (
                  <p className="text-rose-500 text-xs mt-1">{formErrors.itemName}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  קטגוריה <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => {
                    setForm({ ...form, category: e.target.value as LostFoundCategory | '' });
                    setFormErrors({ ...formErrors, category: undefined });
                  }}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-gray-800 ${
                    formErrors.category ? 'border-rose-300' : 'border-gray-200'
                  }`}
                >
                  <option value="">— בחרי קטגוריה —</option>
                  {(Object.keys(CATEGORY_LABELS) as LostFoundCategory[]).map((k) => (
                    <option key={k} value={k}>
                      {CATEGORY_ICONS[k]} {CATEGORY_LABELS[k]}
                    </option>
                  ))}
                </select>
                {formErrors.category && (
                  <p className="text-rose-500 text-xs mt-1">{formErrors.category}</p>
                )}
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">צבע</label>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="למשל: כחול, אדום, ירוק..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-gray-800 placeholder:text-gray-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">תיאור</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="תיאור קצר של הפריט..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-gray-800 placeholder:text-gray-400 resize-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  מקום <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => {
                    setForm({ ...form, location: e.target.value });
                    setFormErrors({ ...formErrors, location: undefined });
                  }}
                  placeholder="למשל: חצר, ספרייה, חדר ספורט..."
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-gray-800 placeholder:text-gray-400 ${
                    formErrors.location ? 'border-rose-300' : 'border-gray-200'
                  }`}
                />
                {formErrors.location && (
                  <p className="text-rose-500 text-xs mt-1">{formErrors.location}</p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  תאריך <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => {
                    setForm({ ...form, date: e.target.value });
                    setFormErrors({ ...formErrors, date: undefined });
                  }}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-gray-800 ${
                    formErrors.date ? 'border-rose-300' : 'border-gray-200'
                  }`}
                />
                {formErrors.date && (
                  <p className="text-rose-500 text-xs mt-1">{formErrors.date}</p>
                )}
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">נראות</label>
                <div className="flex gap-2">
                  {(['school', 'class'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm({ ...form, visibility: v })}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                        form.visibility === v
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      {v === 'school' ? '🏫 כל בית הספר' : '🏠 הכיתה שלי'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-gradient-to-l from-amber-500 to-orange-500 text-white font-bold py-3 rounded-xl text-base mt-2 hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm"
              >
                {editItem ? 'שמירת שינויים' : 'שליחת דיווח'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Claim confirm dialog ── */}
      {claimTarget && (
        <ConfirmDialog
          title="זה שלי!"
          message={`האם הפריט "${claimTarget.itemName}" שייך לך? הפריט יסומן כנתבע.`}
          confirmLabel="כן, זה שלי"
          confirmStyle="teal"
          onConfirm={handleClaim}
          onCancel={() => setClaimTarget(null)}
        />
      )}

      {/* ── Delete confirm dialog ── */}
      {deleteTarget && (
        <ConfirmDialog
          title="מחיקת פריט"
          message={`האם למחוק את "${deleteTarget.itemName}"? לא ניתן לשחזר.`}
          confirmLabel="מחק"
          confirmStyle="rose"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────

function ItemCard({
  item,
  activeUser,
  onClaim,
  onEdit,
  onDelete,
  onMarkReturned,
}: {
  item: LostFoundItem;
  activeUser: User;
  onClaim: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkReturned: () => void;
}) {
  const isOwn = item.reportedByUserId === activeUser.id;
  const isOpenFound = item.reportType === 'found' && item.status === 'open' && !isOwn;

  const statusStyle =
    item.status === 'open'
      ? 'bg-emerald-100 text-emerald-700'
      : item.status === 'claimed'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-gray-100 text-gray-500';

  const statusLabel =
    item.status === 'open'
      ? 'פתוח'
      : item.status === 'claimed'
      ? 'נתבע'
      : 'הוחזר';

  return (
    <div
      className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
        item.status !== 'open' ? 'border-gray-100 opacity-75' : 'border-gray-100 hover:shadow-md'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Found / Lost badge */}
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              item.reportType === 'found'
                ? 'bg-teal-100 text-teal-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {item.reportType === 'found' ? '✓ נמצא' : '✗ אבד'}
          </span>
          {/* Category */}
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {CATEGORY_ICONS[item.category]} {CATEGORY_LABELS[item.category]}
          </span>
          {/* Status */}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle}`}>
            {statusLabel}
          </span>
          {/* Own item badge */}
          {isOwn && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              שלי
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 shrink-0 tabular-nums">{item.date}</span>
      </div>

      {/* Item name */}
      <h3 className="font-bold text-gray-800 text-base leading-snug">{item.itemName}</h3>

      {/* Color */}
      {item.color && (
        <p className="text-xs text-gray-500 mt-0.5">צבע: {item.color}</p>
      )}

      {/* Description */}
      {item.description && (
        <p className="text-sm text-gray-600 mt-1.5 leading-snug">{item.description}</p>
      )}

      {/* Location */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
        <MapPin className="w-3.5 h-3.5 shrink-0" />
        {item.location}
        {item.classId && (
          <span className="mr-2 bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded-full">
            כיתה בלבד
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap mt-3">
        {isOpenFound && (
          <button
            type="button"
            onClick={onClaim}
            className="flex items-center gap-1 text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-1.5 rounded-xl transition-colors border border-teal-200"
          >
            ✋ זה שלי!
          </button>
        )}
        {isOwn && (
          <>
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-1 text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 px-3 py-1.5 rounded-xl transition-colors border border-sky-200"
            >
              <Pencil className="w-3 h-3" />
              עריכה
            </button>
            {item.status === 'claimed' && (
              <button
                type="button"
                onClick={onMarkReturned}
                className="flex items-center gap-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl transition-colors border border-emerald-200"
              >
                <CheckCircle2 className="w-3 h-3" />
                סמן כהוחזר
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-xl transition-colors border border-rose-200"
            >
              <Trash2 className="w-3 h-3" />
              מחיקה
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmStyle,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmStyle: 'teal' | 'rose';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle
            className={`w-5 h-5 ${
              confirmStyle === 'rose' ? 'text-rose-500' : 'text-teal-500'
            }`}
          />
          <h3 className="font-bold text-gray-800">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all ${
              confirmStyle === 'rose'
                ? 'bg-rose-500 hover:bg-rose-600'
                : 'bg-teal-500 hover:bg-teal-600'
            }`}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}
