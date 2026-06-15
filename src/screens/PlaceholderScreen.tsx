import React from 'react';
import { ChevronRight, Clock } from 'lucide-react';

interface PlaceholderScreenProps {
  title: string;
  onBack: () => void;
}

export function PlaceholderScreen({ title, onBack }: PlaceholderScreenProps) {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-violet-50 via-sky-50 to-emerald-50 font-sans"
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
          <h1 className="font-bold text-gray-800">{title}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-2xl bg-violet-100 flex items-center justify-center mb-6 shadow-sm">
          <Clock className="w-12 h-12 text-violet-500" />
        </div>

        <h2 className="text-2xl font-extrabold text-gray-800 mb-3">
          {title}
        </h2>

        <p className="text-lg font-semibold text-gray-500 mb-2">
          האזור הזה יהיה מוכן בקרוב ✨
        </p>
        <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
          אנחנו עובדים על זה בשבילך. בינתיים את יכולה לחזור ולתרגל למבחן!
        </p>

        <button
          type="button"
          onClick={onBack}
          className="mt-8 flex items-center gap-2 bg-violet-500 hover:bg-violet-600 active:bg-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-sm"
        >
          <ChevronRight className="w-4 h-4" />
          חזרה למסך הבית
        </button>
      </main>
    </div>
  );
}
