import React from 'react';
import {
  CalendarDays,
  ClipboardCheck,
  MessageSquare,
  Search,
  Sparkles,
  Bell,
  CheckCircle2,
  MessageCircle,
  Package,
  LogOut,
} from 'lucide-react';

import { NavCard } from '../components/NavCard';
import { SummaryWidget } from '../components/SummaryWidget';
import { ExamCard } from '../components/ExamCard';
import { NoticeBoardPanel } from '../components/NoticeBoardPanel';
import type { AppScreen, User } from '../types';
import {
  getSchool,
  getClass,
  getInitials,
  getAssignments,
  getCompletedAssignmentIds,
  getNextExam,
  getRelevantAnnouncements,
  getMergedLostFoundItems,
  getClassMessages,
  getReadMessageIds,
} from '../utils/dataHelpers';

interface DashboardProps {
  activeUser: User;
  onNavigate: (screen: AppScreen) => void;
  onLogout: () => void;
}

export function Dashboard({ activeUser, onNavigate, onLogout }: DashboardProps) {
  const school = getSchool(activeUser.schoolId);
  const cls = activeUser.classId ? getClass(activeUser.classId) : undefined;
  const initials = getInitials(activeUser.fullName);

  // ── Assignments summary ────────────────────────────────────────────────────
  const allAssignments = activeUser.classId
    ? getAssignments(activeUser.classId)
    : [];
  const completedIds = getCompletedAssignmentIds(activeUser.id);
  const remainingCount = allAssignments.filter(
    (a) => !completedIds.includes(a.id),
  ).length;

  // ── Exam ──────────────────────────────────────────────────────────────────
  const nextExam = activeUser.classId
    ? getNextExam(activeUser.classId, activeUser.schoolId)
    : undefined;

  // ── Announcements (notice board) ──────────────────────────────────────────
  const announcements = getRelevantAnnouncements(activeUser);

  // ── Class messages ────────────────────────────────────────────────────────
  const classMessages = activeUser.classId
    ? getClassMessages(activeUser.classId)
    : [];
  const readMessageIds = getReadMessageIds(activeUser.id);
  const unreadCount = classMessages.filter(
    (m) => !readMessageIds.includes(m.id),
  ).length;
  const latestMessage =
    classMessages.find((m) => !readMessageIds.includes(m.id)) ??
    classMessages[0];

  // ── Lost & found ──────────────────────────────────────────────────────────
  const lostFoundItems = getMergedLostFoundItems(activeUser.schoolId);
  const openFoundItems = lostFoundItems.filter(
    (i) => i.reportType === 'found' && i.status === 'open',
  );
  const latestFound = openFoundItems[0];
  const openLostFoundCount = lostFoundItems.filter((i) => i.status === 'open').length;

  // ── Reminder ──────────────────────────────────────────────────────────────
  let reminderValue = 'אין תזכורות מיוחדות להיום';
  if (nextExam) {
    reminderValue = `מבחן ${nextExam.subject} — ${nextExam.dateLabel}`;
  } else {
    const urgent = allAssignments.find(
      (a) => a.priority === 'high' && !completedIds.includes(a.id),
    );
    if (urgent) reminderValue = `${urgent.title} — ${urgent.dueDate}`;
  }

  // ── Exam card ─────────────────────────────────────────────────────────────
  const examInfo = nextExam
    ? {
        subject: nextExam.subject,
        date: nextExam.dateLabel,
        topics: nextExam.topics.join(', '),
      }
    : { subject: '—', date: '—', topics: 'אין מבחן קרוב' };

  // ── Summary widgets ───────────────────────────────────────────────────────
  const summaryWidgets = [
    {
      id: 'reminder',
      label: 'תזכורת חשובה להיום',
      value: reminderValue,
      icon: <Bell className="w-5 h-5 text-amber-600" />,
      iconBg: 'bg-amber-100',
      widgetBg: 'bg-amber-50',
      borderColor: 'border-amber-100',
    },
    {
      id: 'tasks',
      label: 'משימות שנותרו',
      value:
        remainingCount === 0
          ? 'כל המשימות הושלמו ✅'
          : `${remainingCount} מתוך ${allAssignments.length} פתוחות`,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      iconBg: 'bg-emerald-100',
      widgetBg: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    },
    {
      id: 'message',
      label:
        unreadCount > 0 ? `${unreadCount} הודעות שלא נקראו` : 'הודעות הכיתה',
      value: latestMessage ? latestMessage.title : 'אין הודעות חדשות',
      icon: <MessageCircle className="w-5 h-5 text-violet-600" />,
      iconBg: 'bg-violet-100',
      widgetBg: 'bg-violet-50',
      borderColor: 'border-violet-100',
    },
    {
      id: 'found',
      label:
        openLostFoundCount > 0
          ? `${openLostFoundCount} פריטים פתוחים`
          : 'אבדות ומציאות',
      value: latestFound ? latestFound.itemName : 'אין פריטים חדשים',
      icon: <Package className="w-5 h-5 text-orange-600" />,
      iconBg: 'bg-orange-100',
      widgetBg: 'bg-orange-50',
      borderColor: 'border-orange-100',
    },
  ];

  // ── Navigation cards ──────────────────────────────────────────────────────
  const navCards = [
    {
      id: 'schedule',
      title: 'היום שלי',
      description: 'מה יש לך היום בלוח הזמנים',
      icon: <CalendarDays className="w-6 h-6 text-sky-600" />,
      iconBg: 'bg-sky-100',
      cardBg: 'bg-sky-50',
      borderColor: 'border-sky-100',
      badge: undefined as number | undefined,
      screen: { id: 'daily-schedule' } as AppScreen,
    },
    {
      id: 'tasks',
      title: 'המשימות שלי',
      description: 'בדוק מה צריך לסיים',
      icon: <ClipboardCheck className="w-6 h-6 text-emerald-600" />,
      iconBg: 'bg-emerald-100',
      cardBg: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      badge: remainingCount > 0 ? remainingCount : undefined,
      screen: { id: 'assignments' } as AppScreen,
    },
    {
      id: 'messages',
      title: 'הודעות הכיתה',
      description: 'הודעות מהמורה ומהכיתה',
      icon: <MessageSquare className="w-6 h-6 text-violet-600" />,
      iconBg: 'bg-violet-100',
      cardBg: 'bg-violet-50',
      borderColor: 'border-violet-100',
      badge: unreadCount > 0 ? unreadCount : undefined,
      screen: { id: 'class-messages' } as AppScreen,
    },
    {
      id: 'lost-found',
      title: 'אבדות ומציאות',
      description: 'מצאת משהו? איבדת משהו?',
      icon: <Search className="w-6 h-6 text-amber-600" />,
      iconBg: 'bg-amber-100',
      cardBg: 'bg-amber-50',
      borderColor: 'border-amber-100',
      badge: openLostFoundCount > 0 ? openLostFoundCount : undefined,
      screen: { id: 'lost-found' } as AppScreen,
    },
    {
      id: 'smart-helper',
      title: 'העוזר החכם',
      description: 'שאל אותי כל שאלה שתרצה',
      icon: <Sparkles className="w-6 h-6 text-rose-600" />,
      iconBg: 'bg-rose-100',
      cardBg: 'bg-rose-50',
      borderColor: 'border-rose-100',
      badge: undefined as number | undefined,
      screen: { id: 'smart-assistant' } as AppScreen,
    },
  ];

  const NoticeBoard = (
    <NoticeBoardPanel
      announcements={announcements}
      onViewAll={() => onNavigate({ id: 'announcements' })}
    />
  );

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-violet-50 via-sky-50 to-emerald-50 font-sans"
    >
      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Start (right in RTL): brand + school */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">ח</span>
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="font-bold text-gray-800 text-sm leading-tight truncate">
                החבר שלי לבית הספר
              </p>
              {school && (
                <p className="text-xs text-gray-400 leading-tight truncate">
                  {school.name}
                </p>
              )}
            </div>
          </div>

          {/* End (left in RTL): user info + logout */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {cls && (
              <span className="hidden sm:inline-flex text-xs font-bold bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full">
                {cls.name}
              </span>
            )}
            {/* Notification bell — show unread class messages count */}
            <div className="relative">
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 ring-2 ring-white z-10">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <button
                type="button"
                onClick={() => onNavigate({ id: 'class-messages' })}
                title="הודעות הכיתה"
                className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center hover:bg-violet-200 transition-colors"
              >
                <Bell className="w-4 h-4 text-violet-600" />
              </button>
            </div>
            {/* Avatar */}
            <div
              title={activeUser.fullName}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-sky-400 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0 select-none"
            >
              {initials}
            </div>
            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              title="התנתקות"
              aria-label="התנתקות"
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-rose-100 flex items-center justify-center text-gray-500 hover:text-rose-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Page body ────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="lg:flex lg:gap-6 lg:items-start">
          {/* Notice board sidebar (desktop, RIGHT side in RTL) */}
          <aside className="hidden lg:block lg:w-72 lg:flex-shrink-0 lg:sticky lg:top-20">
            {NoticeBoard}
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 space-y-8">
            {/* Greeting */}
            <section className="pt-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 leading-tight">
                בוקר טוב, {activeUser.firstName} 👋
              </h1>
              <p className="text-base text-gray-500 mt-1.5 font-medium">
                מה מחכה לך היום?
                {school && (
                  <span className="text-gray-400 text-sm mr-2">
                    · {school.name}
                  </span>
                )}
              </p>
            </section>

            {/* Summary widgets */}
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                סיכום מהיר
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {summaryWidgets.map((w) => (
                  <SummaryWidget
                    key={w.id}
                    icon={w.icon}
                    label={w.label}
                    value={w.value}
                    iconBg={w.iconBg}
                    widgetBg={w.widgetBg}
                    borderColor={w.borderColor}
                  />
                ))}
              </div>
            </section>

            {/* Notice board — mobile only */}
            <section className="lg:hidden">{NoticeBoard}</section>

            {/* Navigation cards */}
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                מה תרצה לעשות?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {navCards.map((card) => (
                  <NavCard
                    key={card.id}
                    title={card.title}
                    description={card.description}
                    icon={card.icon}
                    iconBg={card.iconBg}
                    cardBg={card.cardBg}
                    borderColor={card.borderColor}
                    badge={card.badge}
                    onClick={() => onNavigate(card.screen)}
                  />
                ))}

                {/* Featured exam card */}
                <ExamCard
                  exam={examInfo}
                  className="sm:col-span-2"
                  onClick={() => onNavigate({ id: 'exam-assistant' })}
                  onPractice={() => onNavigate({ id: 'exam-assistant' })}
                />
              </div>
            </section>

            <div className="h-6" />
          </main>
        </div>
      </div>
    </div>
  );
}
