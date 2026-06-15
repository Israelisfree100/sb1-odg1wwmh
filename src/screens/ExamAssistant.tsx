import React, { useState } from 'react';
import {
  ChevronRight,
  BookOpen,
  Calendar,
  CheckSquare,
  Zap,
  BookMarked,
  Layers,
  LogOut,
} from 'lucide-react';
import type { PracticeMode, User, Exam } from '../types';
import { getExams, getSchool, getInitials } from '../utils/dataHelpers';

interface ExamAssistantProps {
  activeUser: User;
  onBack: () => void;
  onStartPractice: (mode: PracticeMode, subject: string) => void;
  onLogout: () => void;
}

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

function ExamInfoCard({ exam }: { exam: Exam }) {
  const topicRows = exam.topics.map((t, i) => {
    const emojis = ['✖️', '➗', '📝', '📖', '🔬'];
    return { label: t, emoji: emojis[i] ?? '📌' };
  });

  return (
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
            {exam.subject}{' '}
            {exam.subject === 'חשבון'
              ? '📐'
              : exam.subject === 'עברית'
                ? '📚'
                : exam.subject === 'מדעים'
                  ? '🔬'
                  : '📖'}
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
          <Calendar className="w-4 h-4 text-teal-500 flex-shrink-0" />
          <span className="text-sm text-gray-600">
            תאריך המבחן:{' '}
            <strong className="text-gray-800">{exam.dateLabel}</strong>
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
            {topicRows.map((t) => (
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

        <p className="text-xs text-gray-400 text-left">
          מורה: {exam.teacherName}
        </p>
      </div>
    </div>
  );
}

export function ExamAssistant({
  activeUser,
  onBack,
  onStartPractice,
  onLogout,
}: ExamAssistantProps) {
  const exams = activeUser.classId ? getExams(activeUser.classId) : [];
  const [selectedExamId, setSelectedExamId] = useState<string>(
    exams[0]?.id ?? '',
  );
  const selectedExam = exams.find((e) => e.id === selectedExamId) ?? exams[0];
  const school = getSchool(activeUser.schoolId);
  const initials = getInitials(activeUser.fullName);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-50 font-sans"
    >
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors font-medium text-sm rounded-lg px-2 py-1 hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5" />
            חזרה למסך הבית
          </button>
          <div className="text-center min-w-0">
            <p className="font-bold text-gray-800 text-sm">עוזר למבחנים</p>
            {school && (
              <p className="text-xs text-gray-400 truncate">{school.name}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-sky-400 flex items-center justify-center text-white font-bold text-xs">
              {initials}
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="התנתקות"
              aria-label="התנתקות"
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-rose-100 flex items-center justify-center text-gray-500 hover:text-rose-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* No exams state */}
        {exams.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <p className="text-3xl mb-3">📅</p>
            <p className="font-bold text-gray-700 text-lg">אין מבחנים קרובים</p>
            <p className="text-sm text-gray-400 mt-1">כשיתווסף מבחן הוא יופיע כאן</p>
          </div>
        )}

        {/* Exam selector (if multiple exams) */}
        {exams.length > 1 && (
          <section>
            <h2 className="text-sm font-bold text-gray-500 mb-3">
              בחרי מבחן לתרגול:
            </h2>
            <div className="flex gap-2 flex-wrap">
              {exams.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelectedExamId(e.id)}
                  className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors border ${
                    selectedExamId === e.id
                      ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'
                  }`}
                >
                  {e.subject} · {e.dateLabel}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Exam info card */}
        {selectedExam && (
          <section>
            <ExamInfoCard exam={selectedExam} />
          </section>
        )}

        {/* Practice options */}
        {selectedExam && (
          <section>
            <h2 className="text-sm font-bold text-gray-500 mb-3">
              איך תרצי לתרגל?
            </h2>
            <div className="space-y-3">
              {PRACTICE_OPTIONS.map((opt) => (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() =>
                    onStartPractice(opt.mode, selectedExam.subject)
                  }
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
                    <p className="text-sm text-gray-500 mt-0.5">
                      {opt.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.detail}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 rotate-180" />
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
