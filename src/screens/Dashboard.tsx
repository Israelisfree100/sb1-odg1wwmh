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
  getLostFoundItems,
} from '../utils/dataHelpers';

interface DashboardProps {
  activeUser: User;
  onNavigate: (screen: AppScreen) => void;
  onLogout: () => void;
}

const NAV_CARD_DATA = [
  {
    id: 'schedule',
    title: 'היום שלי',
    description: 'מה יש לך היום בלוח הזמנים',
    icon: <CalendarDays className="w-6 h-6 text-sky-600" />,
    iconBg: 'bg-sky-100',
    cardBg: 'bg-sky-50',
    borderColor: 'border-sky-100',
  },
  {
    id: 'tasks',
    title: 'המשימות שלי',
    description: 'בדקי מה צריך לסיים',
    icon: <ClipboardCheck className="w-6 h-6 text-emerald-600" />,
    iconBg: 'bg-emerald-100',
    cardBg: 'bg-emerald-50',
    borderColor: 'border-emerald-100',
  },
  {
    id: 'messages',
    title: 'הודעות הכיתה',
    description: 'הודעות מהמורה ומהכיתה',
    icon: <MessageSquare className="w-6 h-6 text-violet-600" />,
    iconBg: 'bg-violet-100',
    cardBg: 'bg-violet-50',
    borderColor: 'border-violet-100',
  },
  {
    id: 'lost-found',
    title: 'אבדות ומציאות',
    description: 'מצאת משהו? איבדת משהו?',
    icon: <Search className="w-6 h-6 text-amber-600" />,
    iconBg: 'bg-amber-100',
    cardBg: 'bg-amber-50',
    borderColor: 'border-amber-100',
  },
  {
    id: 'smart-helper',
    title: 'העוזר החכם',
    description: 'שאלי אותי כל שאלה שתרצי',
    icon: <Sparkles className="w-6 h-6 text-rose-600" />,
    iconBg: 'bg-rose-100',
    cardBg: 'bg-rose-50',
    borderColor: 'border-rose-100',
  },
];

const CARD_TITLES: Record<string, string> = {
  schedule: 'היום שלי',
  tasks: 'המשימות שלי',
  messages: 'הודעות הכיתה',
  'lost-found': 'אבדות ומציאות',
  'smart-helper': 'העוזר החכם',
};

export function Dashboard({ activeUser, onNavigate, onLogout }: DashboardProps) {
  const school = getSchool(activeUser.schoolId);
  const cls = activeUser.classId ? getClass(activeUser.classId) : undefined;
  const initials = getInitials(activeUser.fullName);

  // Dynamic summary data
  const allAssignments = activeUser.classId
    ? getAssignments(activeUser.classId)
    : [];
  const completedIds = getCompletedAssignmentIds(activeUser.id);
  const remainingCount = allAssignments.filter(
    (a) => !completedIds.includes(a.id),
  ).length;

  const nextExam = activeUser.classId
    ? getNextExam(activeUser.classId)
    : undefined;

  const announcements = getRelevantAnnouncements(activeUser);
  const latestClassAnn = announcements.find((a) => a.audience === 'class');

  const lostFoundItems = getLostFoundItems(activeUser.schoolId);
  const latestFound = lostFoundItems.find(
    (i) => i.type === 'found' && i.status === 'open',
  );

  // Reminder: prioritise exam, then high-priority assignment
  let reminderValue = 'אין תזכורות מיוחדות להיום';
  if (nextExam) {
    reminderValue = `מבחן ${nextExam.subject} — ${nextExam.dateLabel}`;
  } else {
    const urgent = allAssignments.find(
      (a) => a.priority === 'high' && !completedIds.includes(a.id),
    );
    if (urgent) reminderValue = `${urgent.title} — ${urgent.dueDate}`;
  }

  // Exam card data
  const examInfo = nextExam
    ? {
        subject: nextExam.subject,
        date: nextExam.dateLabel,
        topics: nextExam.topics.join(', '),
      }
    : { subject: '—', date: '—', topics: 'אין מבחן קרוב' };

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
      label: 'הודעה חדשה מהמורה',
      value: latestClassAnn ? latestClassAnn.title : 'אין הודעות חדשות',
      icon: <MessageCircle className="w-5 h-5 text-violet-600" />,
      iconBg: 'bg-violet-100',
      widgetBg: 'bg-violet-50',
      borderColor: 'border-violet-100',
    },
    {
      id: 'found',
      label: 'פריט שנמצא לאחרונה',
      value: latestFound ? latestFound.itemName : 'אין פריטים חדשים',
      icon: <Package className="w-5 h-5 text-orange-600" />,
      iconBg: 'bg-orange-100',
      widgetBg: 'bg-orange-50',
      borderColor: 'border-orange-100',
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
            {/* Class badge */}
            {cls && (
              <span className="hidden sm:inline-flex text-xs font-bold bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full">
                {cls.name}
              </span>
            )}
            {/* Notification bell */}
            <div className="relative">
              <div className="w-2 h-2 bg-rose-500 rounded-full absolute -top-0.5 -right-0.5 ring-2 ring-white" />
              <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
                <Bell className="w-4 h-4 text-violet-600" />
              </div>
            </div>
            {/* Avatar */}
            <div
              title={activeUser.fullName}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-sky-400 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
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
        {/*
          Two-column on desktop (lg):
          In RTL flex, first child → RIGHT side → notice board sidebar
          Second child → LEFT side → main content
        */}
        <div className="lg:flex lg:gap-6 lg:items-start">
          {/* ── Notice board sidebar (desktop only, RIGHT side in RTL) ────── */}
          <aside className="hidden lg:block lg:w-72 lg:flex-shrink-0 lg:sticky lg:top-20">
            {NoticeBoard}
          </aside>

          {/* ── Main content ─────────────────────────────────────────────── */}
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

            {/* Notice board — mobile only, between summary and nav cards */}
            <section className="lg:hidden">
              {NoticeBoard}
            </section>

            {/* Navigation cards */}
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                מה תרצי לעשות?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {NAV_CARD_DATA.map((card) => (
                  <NavCard
                    key={card.id}
                    title={card.title}
                    description={card.description}
                    icon={card.icon}
                    iconBg={card.iconBg}
                    cardBg={card.cardBg}
                    borderColor={card.borderColor}
                    onClick={() =>
                      onNavigate({
                        id: 'placeholder',
                        title: CARD_TITLES[card.id] ?? card.title,
                      })
                    }
                  />
                ))}

                {/* Featured exam card — spans full width on small screens */}
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
