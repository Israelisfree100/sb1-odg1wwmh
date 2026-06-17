import React, { useState, useMemo } from 'react';
import { ChevronRight, LogOut, TrendingUp, Star } from 'lucide-react';
import type { User, AppScreen } from '../types';
import { getSchool, getInitials, getClass } from '../utils/dataHelpers';
import { getParentChildren } from '../utils/roleHelpers';
import {
  canParentAccessChild, getParentSelectedChildId, saveParentSelectedChildId, getSelectedChild,
} from '../utils/parentHelpers';
import { getPracticeHistory } from '../services/practiceHistoryRepository';

interface Props { activeUser: User; onBack: () => void; onNavigate: (s: AppScreen) => void; onLogout: () => void; }

export function ParentPracticeProgressScreen({ activeUser, onBack, onLogout }: Props) {
  const [childId, setChildId] = useState(() => getParentSelectedChildId(activeUser));
  const children = useMemo(() => getParentChildren(activeUser), [activeUser]);
  const child = useMemo(
    () => (canParentAccessChild(activeUser, childId) ? getSelectedChild(activeUser, childId) : undefined),
    [activeUser, childId],
  );
  const cls = useMemo(() => (child?.classId ? getClass(child.classId) : undefined), [child]);
  const school = useMemo(() => getSchool(activeUser.schoolId), [activeUser.schoolId]);
  const initials = getInitials(activeUser.fullName);

  const history = useMemo(
    () => (child ? getPracticeHistory(child.id) : []),
    [child],
  );

  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const avg = Math.round(history.reduce((s, e) => s + e.percentage, 0) / history.length);
    const latest = history[0].percentage;
    const topicMap: Record<string, { total: number; correct: number }> = {};
    for (const e of history) {
      for (const t of e.topics) {
        if (!topicMap[t]) topicMap[t] = { total: 0, correct: 0 };
        topicMap[t].total += e.totalQuestions;
        topicMap[t].correct += e.correctAnswers;
      }
    }
    const topicEntries = Object.entries(topicMap).map(([topic, data]) => ({
      topic,
      pct: Math.round((data.correct / data.total) * 100),
    })).sort((a, b) => b.pct - a.pct);
    return {
      avg, latest, sessions: history.length,
      topics: Array.from(new Set(history.flatMap((e) => e.topics))),
      strongest: topicEntries[0],
      weakest: topicEntries[topicEntries.length - 1],
    };
  }, [history]);

  const handleChangeChild = (id: string) => {
    if (!canParentAccessChild(activeUser, id)) return;
    setChildId(id); saveParentSelectedChildId(activeUser, id);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-sky-50 font-sans">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm">
              <ChevronRight className="w-4 h-4" /><span className="hidden sm:inline">לוח הורה</span>
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <div>
              <p className="text-sm font-bold text-gray-800">התקדמות בתרגול</p>
              <p className="text-xs text-gray-500">{school?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
            <button onClick={onLogout} className="text-gray-400 hover:text-rose-500 p-1.5"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {children.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
            <select value={childId} onChange={(e) => handleChangeChild(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400">
              {children.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
          </div>
        )}

        {!child ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">לא נמצא ילד מקושר</p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-l from-violet-500 to-purple-600 rounded-2xl p-4 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">{getInitials(child.fullName)}</div>
              <div>
                <p className="font-bold">{child.fullName}</p>
                <p className="text-xs opacity-80">{cls?.name ?? child.classId}</p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
              <strong>הערה:</strong> הנתונים נועדו לסייע ולעודד תרגול, ואינם מהווים ציון בית־ספרי.
            </div>

            {!stats ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">עדיין לא הושלמו תרגולים.</p>
                <p className="text-xs mt-1">ברגע שהילד/ה יסיים/תסיים תרגול, הסיכום יופיע כאן.</p>
              </div>
            ) : (
              <>
                {/* Key stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'ציון אחרון', value: `${stats.latest}%`, color: 'text-violet-700', bg: 'bg-violet-50' },
                    { label: 'ממוצע', value: `${stats.avg}%`, color: 'text-sky-700', bg: 'bg-sky-50' },
                    { label: 'תרגולים', value: stats.sessions.toString(), color: 'text-emerald-700', bg: 'bg-emerald-50' },
                    { label: 'נושאים', value: stats.topics.length.toString(), color: 'text-amber-700', bg: 'bg-amber-50' },
                  ].map((s) => (
                    <div key={s.label} className={`rounded-xl p-3 text-center border border-gray-100 ${s.bg}`}>
                      <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Strengths */}
                {stats.strongest && stats.strongest.pct >= 70 && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                    <Star className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-emerald-800">נושא חזק: {stats.strongest.topic}</p>
                      <p className="text-xs text-emerald-600">{stats.strongest.pct}% הצלחה</p>
                    </div>
                  </div>
                )}
                {stats.weakest && stats.weakest !== stats.strongest && stats.weakest.pct < 70 && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-rose-800">מומלץ לתרגל: {stats.weakest.topic}</p>
                      <p className="text-xs text-rose-600">{stats.weakest.pct}% הצלחה</p>
                    </div>
                  </div>
                )}

                {/* History */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <p className="text-sm font-bold text-gray-800">היסטוריית תרגולים</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {history.map((e) => (
                      <div key={e.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{e.subject}</p>
                          <p className="text-xs text-gray-500">{new Date(e.completedAt).toLocaleDateString('he-IL')} · {e.topics.join(', ')}</p>
                        </div>
                        <div className="text-center flex-shrink-0">
                          <p className={`text-lg font-extrabold ${
                            e.percentage >= 80 ? 'text-emerald-600'
                            : e.percentage >= 60 ? 'text-amber-600'
                            : 'text-rose-600'
                          }`}>{e.percentage}%</p>
                          <p className="text-xs text-gray-400">{e.correctAnswers}/{e.totalQuestions}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
