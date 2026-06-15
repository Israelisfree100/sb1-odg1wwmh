import React from 'react';
import { BookOpen, Calendar, List, Play } from 'lucide-react';

interface ExamInfo {
  subject: string;
  date: string;
  topics: string;
}

interface ExamCardProps {
  exam: ExamInfo;
  onClick?: () => void;
  onPractice?: () => void;
  className?: string;
}

export function ExamCard({ exam, onClick, onPractice, className = '' }: ExamCardProps) {
  const handlePracticeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPractice?.();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={`rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-50 border border-teal-100 ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-teal-100 flex-shrink-0">
          <BookOpen className="w-6 h-6 text-teal-600" />
        </div>
        <span className="text-xs font-bold bg-teal-100 text-teal-700 px-3 py-1 rounded-full">
          מבחן קרוב ⚡
        </span>
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-4">עוזר למבחנים</h3>

      <ul className="space-y-2.5 mb-5">
        <li className="flex items-center gap-2.5 text-sm text-gray-600">
          <BookOpen className="w-4 h-4 text-teal-500 flex-shrink-0" />
          <span>
            המבחן הבא:{' '}
            <strong className="text-gray-800 font-bold">{exam.subject}</strong>
          </span>
        </li>
        <li className="flex items-center gap-2.5 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-teal-500 flex-shrink-0" />
          <span>
            תאריך:{' '}
            <strong className="text-gray-800 font-bold">{exam.date}</strong>
          </span>
        </li>
        <li className="flex items-start gap-2.5 text-sm text-gray-600">
          <List className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
          <span>
            נושאים:{' '}
            <strong className="text-gray-800 font-bold">{exam.topics}</strong>
          </span>
        </li>
      </ul>

      <button
        type="button"
        onClick={handlePracticeClick}
        className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm text-sm"
      >
        <Play className="w-4 h-4 fill-white" />
        בואו נתרגל
      </button>
    </div>
  );
}
