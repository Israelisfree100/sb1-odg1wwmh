import React from 'react';
import {
  ChevronRight,
  BookOpen,
  Calendar,
  CheckSquare,
  Zap,
  BookMarked,
  Layers,
} from 'lucide-react';
import type { PracticeMode } from '../types';

interface ExamAssistantProps {
  onBack: () => void;
  onStartPractice: (mode: PracticeMode) => void;
}

const TOPICS = [
  { label: 'כפל עד 10', emoji: '✖️' },
  { label: 'חילוק בסיסי', emoji: '➗' },
  { label: 'בעיות מילוליות', emoji: '📝' },
];

const PRACTICE_OPTIONS: {
  mode: PracticeMode;
  title: string;
  description: string;
  detail: string;
  icon: React.ReactNode;
  iconBg: string;
  borderColor: string;
  bg: string;
}[] = [
  {
    mode: 'quick',
    title: 'תרגול מהיר',
    description: '5 שאלות אקראיות',
    detail: 'מושלם לחזרה מהירה לפני השיעור',
    icon: <Zap className="w-5 h-5 text-amber-600" />,
    iconBg: 'bg-amber-100',
    borderColor: 'border-amber-100',
    bg: 'bg-amber-50 hover:bg-amber-100',
  },
  {
    mode: 'full',
    title: 'תרגול מלא',
    description: '10 שאלות מכל הנושאים',
    detail: 'כיסוי מלא של כל החומר',
    icon: <BookMarked className="w-5 h-5 text-violet-600" />,
    iconBg: 'bg-violet-100',
    borderColor: 'border-violet-100',
    bg: 'bg-violet-50 hover:bg-violet-100',
  },
  {
    mode: 'by-topic',
    title: 'תרגול לפי נושא',
    description: 'בחרי נושא ספציפי',
    detail: 'להתמקד בנושא שקשה לך',
    icon: <Layers className="w-5 h-5 text-teal-600" />,
    iconBg: 'bg-teal-100',
    borderColor: 'border-teal-100',
    bg: 'bg-teal-50 hover:bg-teal-100',
  },
];

export function ExamAssistant({ onBack, onStartPractice }: ExamAssistantProps) {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-50 font-sans"
    >
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors font-medium text-sm rounded-lg px-2 py-1 hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5" />
            חזרה למסך הבית
          </button>
          <h1 className="font-bold text-gray-800">עוזר למבחנים</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Exam info card */}
        <section>
          <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide">
                  המבחן הקרוב שלך
                </p>
                <h2 className="text-xl font-extrabold text-gray-800 leading-tight">
                  חשבון 📐
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <Calendar className="w-4 h-4 text-teal-500 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  תאריך המבחן:{' '}
                  <strong className="text-gray-800">יום חמישי</strong>
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 mb-2.5">
                  <CheckSquare className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-700">
                    נושאים למבחן:
                  </span>
                </div>
                <ul className="space-y-1.5 mr-7">
                  {TOPICS.map((t) => (
                    <li
                      key={t.label}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <span className="text-base leading-none">{t.emoji}</span>
                      {t.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Practice options */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 mb-3">
            איך תרצי לתרגל?
          </h2>
          <div className="space-y-3">
            {PRACTICE_OPTIONS.map((opt) => (
              <button
                key={opt.mode}
                type="button"
                onClick={() => onStartPractice(opt.mode)}
                className={`w-full flex items-center gap-4 rounded-2xl px-5 py-4 border transition-all duration-150 active:scale-95 text-right shadow-sm hover:shadow ${opt.bg} ${opt.borderColor}`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${opt.iconBg}`}
                >
                  {opt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-base leading-tight">
                    {opt.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">{opt.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.detail}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 rotate-180" />
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
