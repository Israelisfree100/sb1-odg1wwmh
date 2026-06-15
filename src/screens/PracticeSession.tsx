import React, { useState } from 'react';
import {
  ChevronRight,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  ArrowLeft,
  Calculator,
  Divide,
  FileText,
} from 'lucide-react';
import type { PracticeMode, TopicKey, Question } from '../types';
import {
  ALL_QUESTIONS,
  shuffleArray,
  getQuestionsForMode,
  getQuestionsForTopic,
} from '../data/questions';

// ─── types ────────────────────────────────────────────────────────────────────

interface PracticeSessionProps {
  mode: PracticeMode;
  onBack: () => void;
}

type Phase = 'topic-select' | 'quiz' | 'results';

// ─── topic selection screen ───────────────────────────────────────────────────

const TOPIC_OPTIONS: { key: TopicKey; label: string; sub: string; icon: React.ReactNode; bg: string; border: string }[] = [
  {
    key: 'multiplication',
    label: 'כפל עד 10',
    sub: '5 שאלות כפל',
    icon: <Calculator className="w-6 h-6 text-sky-600" />,
    bg: 'bg-sky-50 hover:bg-sky-100',
    border: 'border-sky-100',
  },
  {
    key: 'division',
    label: 'חילוק בסיסי',
    sub: '5 שאלות חילוק',
    icon: <Divide className="w-6 h-6 text-violet-600" />,
    bg: 'bg-violet-50 hover:bg-violet-100',
    border: 'border-violet-100',
  },
  {
    key: 'word-problem',
    label: 'בעיות מילוליות',
    sub: '5 שאלות מילוליות',
    icon: <FileText className="w-6 h-6 text-amber-600" />,
    bg: 'bg-amber-50 hover:bg-amber-100',
    border: 'border-amber-100',
  },
];

// ─── score helpers ─────────────────────────────────────────────────────────────

function getScoreMessage(correct: number, total: number): { emoji: string; message: string } {
  const pct = correct / total;
  if (pct === 1) return { emoji: '🌟', message: 'וואו! מושלם לגמרי! את פשוט מדהימה!' };
  if (pct >= 0.8) return { emoji: '👏', message: 'כל הכבוד! עוד מעט תהיי מושלמת!' };
  if (pct >= 0.6) return { emoji: '😊', message: 'יפה מאוד! כדאי לתרגל עוד קצת.' };
  if (pct >= 0.4) return { emoji: '💪', message: 'לא נורא! בואי נתרגל שוב ונשתפר.' };
  return { emoji: '🤗', message: 'זה קצת קשה עכשיו, אבל עם תרגול תשתפרי!' };
}

function getScoreStars(correct: number, total: number): number {
  const pct = correct / total;
  if (pct === 1) return 3;
  if (pct >= 0.6) return 2;
  return 1;
}

// ─── option button class ───────────────────────────────────────────────────────

function getOptionClass(
  index: number,
  selectedOption: number | null,
  isAnswered: boolean,
  correctIndex: number,
): string {
  const base =
    'w-full text-right rounded-xl px-4 py-3 border-2 font-semibold text-sm transition-all duration-150 active:scale-95 ';

  if (!isAnswered) {
    if (selectedOption === index) {
      return base + 'bg-teal-50 border-teal-400 text-teal-800';
    }
    return base + 'bg-white border-gray-200 text-gray-800 hover:border-teal-300 hover:bg-teal-50/50';
  }

  if (index === correctIndex) {
    return base + 'bg-emerald-50 border-emerald-400 text-emerald-800';
  }
  if (selectedOption === index) {
    return base + 'bg-rose-50 border-rose-400 text-rose-800';
  }
  return base + 'bg-white border-gray-100 text-gray-400 cursor-default';
}

// ─── shared page wrapper ───────────────────────────────────────────────────────

function PageShell({
  children,
  headerLeft,
  headerCenter,
}: {
  children: React.ReactNode;
  headerLeft: React.ReactNode;
  headerCenter?: React.ReactNode;
}) {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-violet-50 via-sky-50 to-emerald-50 font-sans"
    >
      <header className="bg-white/80 backdrop-blur-md border-b border-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {headerLeft}
          {headerCenter && (
            <h1 className="font-bold text-gray-800 text-sm">{headerCenter}</h1>
          )}
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}

// ─── main component ────────────────────────────────────────────────────────────

export function PracticeSession({ mode, onBack }: PracticeSessionProps) {
  const [phase, setPhase] = useState<Phase>(
    mode === 'by-topic' ? 'topic-select' : 'quiz',
  );
  const [selectedTopic, setSelectedTopic] = useState<TopicKey | null>(null);
  const [questions, setQuestions] = useState<Question[]>(() =>
    mode !== 'by-topic' ? getQuestionsForMode(mode) : [],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];

  // ── topic select ─────────────────────────────────────────────────────────────

  const handleTopicSelect = (topic: TopicKey) => {
    const qs = getQuestionsForTopic(topic);
    setSelectedTopic(topic);
    setQuestions(qs);
    setPhase('quiz');
  };

  if (phase === 'topic-select') {
    return (
      <PageShell
        headerLeft={
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors font-medium text-sm rounded-lg px-2 py-1 hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5" />
            חזרה
          </button>
        }
        headerCenter="תרגול לפי נושא"
      >
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-800">
              בחרי נושא לתרגול 🎯
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              בכל נושא יש 5 שאלות
            </p>
          </div>
          <div className="space-y-3">
            {TOPIC_OPTIONS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => handleTopicSelect(t.key)}
                className={`w-full flex items-center gap-4 rounded-2xl px-5 py-4 border transition-all duration-150 active:scale-95 text-right shadow-sm hover:shadow ${t.bg} ${t.border}`}
              >
                <div className="w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-lg leading-tight">
                    {t.label}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">{t.sub}</p>
                </div>
                <ArrowLeft className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  // ── results ──────────────────────────────────────────────────────────────────

  const handleRetry = () => {
    let newQs: Question[];
    if (mode === 'by-topic' && selectedTopic) {
      newQs = getQuestionsForTopic(selectedTopic);
    } else {
      newQs = mode !== 'by-topic' ? getQuestionsForMode(mode) : shuffleArray([...ALL_QUESTIONS]).slice(0, 5);
    }
    setQuestions(newQs);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setShowHint(false);
    setCorrectCount(0);
    setPhase('quiz');
  };

  if (phase === 'results') {
    const { emoji, message } = getScoreMessage(correctCount, totalQuestions);
    const stars = getScoreStars(correctCount, totalQuestions);

    return (
      <PageShell
        headerLeft={
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors font-medium text-sm rounded-lg px-2 py-1 hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5" />
            חזרה לעוזר למבחנים
          </button>
        }
        headerCenter="סיום תרגול"
      >
        <div className="flex flex-col items-center text-center space-y-6 pt-4">
          {/* Trophy */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center shadow-md">
            <Trophy className="w-12 h-12 text-amber-500" />
          </div>

          {/* Score */}
          <div>
            <p className="text-6xl font-black text-gray-800 leading-none">
              {correctCount}
              <span className="text-3xl font-bold text-gray-400">
                /{totalQuestions}
              </span>
            </p>
            <p className="text-gray-500 mt-2 text-base">ענית נכון</p>
          </div>

          {/* Stars */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`text-4xl transition-opacity ${s <= stars ? 'opacity-100' : 'opacity-20'}`}
              >
                ⭐
              </span>
            ))}
          </div>

          {/* Message */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 max-w-xs">
            <p className="text-3xl mb-2">{emoji}</p>
            <p className="text-base font-bold text-gray-800">{message}</p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button
              type="button"
              onClick={handleRetry}
              className="flex-1 flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              תרגל שוב
            </button>
            <button
              type="button"
              onClick={onBack}
              className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-bold py-3 rounded-xl transition-colors border border-gray-200 shadow-sm"
            >
              חזרה
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── quiz ─────────────────────────────────────────────────────────────────────

  if (!currentQuestion) return null;

  const isCorrect = selectedOption === currentQuestion.correctIndex;

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswered(true);
    if (selectedOption === currentQuestion.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= totalQuestions) {
      setPhase('results');
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setShowHint(false);
    }
  };

  const progressPct = Math.round((currentIndex / totalQuestions) * 100);

  return (
    <PageShell
      headerLeft={
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors font-medium text-sm rounded-lg px-2 py-1 hover:bg-gray-100"
        >
          <ChevronRight className="w-5 h-5" />
          חזרה
        </button>
      }
      headerCenter={`שאלה ${currentIndex + 1} מתוך ${totalQuestions}`}
    >
      <div className="space-y-5">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>
              {currentIndex + 1} / {totalQuestions}
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-teal-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-3">
            {currentQuestion.topic === 'multiplication'
              ? '✖️ כפל'
              : currentQuestion.topic === 'division'
                ? '➗ חילוק'
                : '📝 בעיה מילולית'}
          </p>
          <p className="text-2xl font-extrabold text-gray-800 leading-snug whitespace-pre-line">
            {currentQuestion.text}
          </p>
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-2 gap-3">
          {currentQuestion.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              disabled={isAnswered}
              onClick={() => !isAnswered && setSelectedOption(i)}
              className={getOptionClass(
                i,
                selectedOption,
                isAnswered,
                currentQuestion.correctIndex,
              )}
            >
              <span className="text-base">{opt}</span>
              {isAnswered && i === currentQuestion.correctIndex && (
                <CheckCircle2 className="inline-block w-4 h-4 text-emerald-500 mr-1.5" />
              )}
              {isAnswered && selectedOption === i && !isCorrect && (
                <XCircle className="inline-block w-4 h-4 text-rose-500 mr-1.5" />
              )}
            </button>
          ))}
        </div>

        {/* Hint section */}
        {!isAnswered && (
          <div>
            {!showHint ? (
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="flex items-center gap-2 text-sm text-amber-600 font-semibold hover:text-amber-700 transition-colors"
              >
                <Lightbulb className="w-4 h-4" />
                רמז קטן 💡
              </button>
            ) : (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 font-medium">
                  {currentQuestion.hint}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Feedback after answering */}
        {isAnswered && (
          <div
            className={`flex items-start gap-3 rounded-xl px-4 py-4 border ${
              isCorrect
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-rose-50 border-rose-200'
            }`}
          >
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p
                className={`font-bold text-sm ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}
              >
                {isCorrect ? '✅ נכון מאוד! כל הכבוד!' : '❌ לא נכון הפעם'}
              </p>
              {!isCorrect && (
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!isAnswered ? (
          <button
            type="button"
            disabled={selectedOption === null}
            onClick={handleCheckAnswer}
            className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed active:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm text-base"
          >
            בדיקת תשובה
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="w-full bg-violet-500 hover:bg-violet-600 active:bg-violet-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm text-base flex items-center justify-center gap-2"
          >
            {currentIndex + 1 >= totalQuestions ? 'לראות את הציון שלי 🏆' : 'לשאלה הבאה ←'}
          </button>
        )}
      </div>
    </PageShell>
  );
}
