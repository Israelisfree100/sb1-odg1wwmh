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
} from 'lucide-react';

import { NavCard } from '../components/NavCard';
import { SummaryWidget } from '../components/SummaryWidget';
import { ExamCard } from '../components/ExamCard';
import type { AppScreen } from '../types';

interface DashboardProps {
  onNavigate: (screen: AppScreen) => void;
}

const SUMMARY_WIDGETS = [
  {
    id: 'reminder',
    label: 'תזכורת חשובה להיום',
    value: 'להביא ציוד ציור לשיעור',
    icon: <Bell className="w-5 h-5 text-amber-600" />,
    iconBg: 'bg-amber-100',
    widgetBg: 'bg-amber-50',
    borderColor: 'border-amber-100',
  },
  {
    id: 'tasks',
    label: 'משימות שנותרו',
    value: '3 משימות פתוחות',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    iconBg: 'bg-emerald-100',
    widgetBg: 'bg-emerald-50',
    borderColor: 'border-emerald-100',
  },
  {
    id: 'message',
    label: 'הודעה חדשה מהמורה',
    value: 'שיעורי בית בחשבון לפרק 7',
    icon: <MessageCircle className="w-5 h-5 text-violet-600" />,
    iconBg: 'bg-violet-100',
    widgetBg: 'bg-violet-50',
    borderColor: 'border-violet-100',
  },
  {
    id: 'found',
    label: 'פריט חדש שנמצא',
    value: "מחברת כחולה — כיתה ג'",
    icon: <Package className="w-5 h-5 text-orange-600" />,
    iconBg: 'bg-orange-100',
    widgetBg: 'bg-orange-50',
    borderColor: 'border-orange-100',
  },
];

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

const MOCK_EXAM = {
  subject: 'חשבון',
  date: 'יום חמישי',
  topics: 'כפל, חילוק ובעיות מילוליות',
};

export function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-violet-50 via-sky-50 to-emerald-50 font-sans"
    >
      {/* Top navigation bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">ח</span>
            </div>
            <span className="font-bold text-gray-800 text-sm hidden sm:block">
              החבר שלי לבית הספר
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2 h-2 bg-rose-500 rounded-full absolute -top-0.5 -right-0.5 ring-2 ring-white" />
              <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
                <Bell className="w-4 h-4 text-violet-600" />
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-sky-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              ע
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Greeting */}
        <section className="pt-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 leading-tight">
            בוקר טוב, עלמה 👋
          </h1>
          <p className="text-lg text-gray-500 mt-2 font-medium">
            מה מחכה לך היום?
          </p>
        </section>

        {/* Summary widgets */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            סיכום מהיר
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SUMMARY_WIDGETS.map((widget) => (
              <SummaryWidget
                key={widget.id}
                icon={widget.icon}
                label={widget.label}
                value={widget.value}
                iconBg={widget.iconBg}
                widgetBg={widget.widgetBg}
                borderColor={widget.borderColor}
              />
            ))}
          </div>
        </section>

        {/* Navigation cards */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            מה תרצי לעשות?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

            {/* Featured exam card — spans 2 cols on tablets */}
            <ExamCard
              exam={MOCK_EXAM}
              className="sm:col-span-2 lg:col-span-1"
              onClick={() => onNavigate({ id: 'exam-assistant' })}
              onPractice={() => onNavigate({ id: 'exam-assistant' })}
            />
          </div>
        </section>

        <div className="h-6" />
      </main>
    </div>
  );
}
