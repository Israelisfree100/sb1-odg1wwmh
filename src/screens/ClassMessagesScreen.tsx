import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  LogOut,
  CheckCheck,
  AlertTriangle,
  BookOpen,
  FlaskConical,
  Megaphone,
  PartyPopper,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { User, ClassMessage, MessageCategory } from '../types';
import {
  getClassMessages,
  getReadMessageIds,
  markMessageRead,
  markAllMessagesRead,
  getSchool,
  getClass,
  getInitials,
} from '../utils/dataHelpers';

// ─── Types & constants ────────────────────────────────────────────────────────

type Filter = MessageCategory | 'all';

interface Props {
  activeUser: User;
  onBack: () => void;
  onLogout: () => void;
}

const CATEGORY_LABEL: Record<MessageCategory, string> = {
  general: 'הודעות כלליות',
  homework: 'שיעורי בית',
  exam: 'מבחנים',
  activity: 'פעילויות',
};

const CATEGORY_STYLE: Record<MessageCategory, string> = {
  general: 'bg-sky-100 text-sky-700',
  homework: 'bg-amber-100 text-amber-700',
  exam: 'bg-rose-100 text-rose-700',
  activity: 'bg-emerald-100 text-emerald-700',
};

function CategoryIcon({ cat }: { cat: MessageCategory }) {
  const cls = 'w-3.5 h-3.5';
  if (cat === 'homework') return <BookOpen className={cls} />;
  if (cat === 'exam') return <FlaskConical className={cls} />;
  if (cat === 'activity') return <PartyPopper className={cls} />;
  return <Megaphone className={cls} />;
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'general', label: CATEGORY_LABEL.general },
  { key: 'homework', label: CATEGORY_LABEL.homework },
  { key: 'exam', label: CATEGORY_LABEL.exam },
  { key: 'activity', label: CATEGORY_LABEL.activity },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ClassMessagesScreen({ activeUser, onBack, onLogout }: Props) {
  const school = getSchool(activeUser.schoolId);
  const cls = activeUser.classId ? getClass(activeUser.classId) : undefined;
  const initials = getInitials(activeUser.fullName);

  const messages = useMemo(
    () => getClassMessages(activeUser.classId ?? ''),
    [activeUser.classId],
  );

  const [readIds, setReadIds] = useState<string[]>(() =>
    getReadMessageIds(activeUser.id),
  );
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const unreadCount = messages.filter((m) => !readIds.includes(m.id)).length;

  function handleOpen(messageId: string) {
    if (expandedId === messageId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(messageId);
    markMessageRead(activeUser.id, messageId);
    setReadIds(getReadMessageIds(activeUser.id));
  }

  function handleMarkAll() {
    const allIds = messages.map((m) => m.id);
    markAllMessagesRead(activeUser.id, allIds);
    setReadIds(allIds);
  }

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return messages;
    return messages.filter((m) => m.category === activeFilter);
  }, [messages, activeFilter]);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
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
              הודעות הכיתה
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {unreadCount}
                </span>
              )}
            </p>
            {cls && (
              <p className="text-xs text-gray-400 truncate">
                {school?.name} · {cls.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs select-none">
              {initials}
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="התנתקות"
              className="text-gray-400 hover:text-rose-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* ── Summary strip ── */}
        <div className="bg-gradient-to-l from-teal-500 to-cyan-600 rounded-2xl p-4 text-white shadow-md flex items-center justify-between gap-4">
          <div>
            <p className="text-teal-100 text-xs font-medium">סה"כ הודעות</p>
            <p className="text-2xl font-bold">{messages.length}</p>
          </div>
          <div className="text-center">
            <p className="text-teal-100 text-xs font-medium">לא נקראו</p>
            <p className="text-2xl font-bold">{unreadCount}</p>
          </div>
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 text-sm font-semibold bg-white/20 hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl px-3 py-2 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            סמן הכל כנקרא
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(({ key, label }) => {
            const hasUnread =
              key !== 'all' &&
              messages.some(
                (m) => m.category === key && !readIds.includes(m.id),
              );
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter(key)}
                className={`relative px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  activeFilter === key
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300'
                }`}
              >
                {label}
                {hasUnread && (
                  <span className="absolute -top-0.5 -left-0.5 w-2 h-2 bg-rose-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Messages ── */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-600">אין הודעות בקטגוריה זו</p>
            <p className="text-sm text-gray-400 mt-1">לחץ על "הכל" כדי לראות את כל ההודעות</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((msg) => {
              const isRead = readIds.includes(msg.id);
              const isExpanded = expandedId === msg.id;
              return (
                <MessageCard
                  key={msg.id}
                  message={msg}
                  isRead={isRead}
                  isExpanded={isExpanded}
                  onOpen={() => handleOpen(msg.id)}
                />
              );
            })}
          </div>
        )}

        <div className="h-6" />
      </main>
    </div>
  );
}

// ─── Message Card ─────────────────────────────────────────────────────────────

function MessageCard({
  message,
  isRead,
  isExpanded,
  onOpen,
}: {
  message: ClassMessage;
  isRead: boolean;
  isExpanded: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full text-right bg-white rounded-2xl shadow-sm border transition-all ${
        !isRead
          ? 'border-teal-200 ring-1 ring-teal-100'
          : 'border-gray-100'
      } ${isExpanded ? 'shadow-md' : 'hover:shadow-md'}`}
    >
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Unread dot */}
            {!isRead && (
              <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-0.5" />
            )}
            {/* Important badge */}
            {message.isImportant && (
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
                <AlertTriangle className="w-3 h-3" />
                חשוב
              </span>
            )}
            {/* Category badge */}
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-0.5 ${
                CATEGORY_STYLE[message.category]
              }`}
            >
              <CategoryIcon cat={message.category} />
              {CATEGORY_LABEL[message.category]}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-400 tabular-nums">
              {message.publishedAt}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          className={`font-bold text-base leading-snug mt-2 ${
            isRead ? 'text-gray-700' : 'text-gray-900'
          }`}
        >
          {message.title}
        </h3>

        {/* Teacher */}
        <p className="text-xs text-gray-400 mt-1">{message.teacherName}</p>

        {/* Content — expanded */}
        {isExpanded && (
          <p className="text-sm text-gray-600 leading-relaxed mt-3 border-t border-gray-100 pt-3 text-right">
            {message.content}
          </p>
        )}

        {/* Preview when collapsed */}
        {!isExpanded && (
          <p className="text-sm text-gray-400 mt-1 line-clamp-1">
            {message.content}
          </p>
        )}
      </div>
    </button>
  );
}
