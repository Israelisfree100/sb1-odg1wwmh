import React, { useMemo, useState } from 'react';
import {
  LogOut, Users, ClipboardList, FileText, MessageSquare, BellRing, TrendingUp,
  Calendar, ChevronDown, AlertCircle, Bell, AlertTriangle,
} from 'lucide-react';
import type { User, AppScreen } from '../types';
import { getSchool, getInitials } from '../utils/dataHelpers';
import { getParentChildren, getParentSelectedChildData } from '../utils/roleHelpers';
import {
  canParentAccessChild, getParentSelectedChildId, saveParentSelectedChildId,
  getParentReadMessageIds, getParentReadAnnouncementIds, filterAnnouncementsForChild,
  countUnreadMessages, countUnreadAnnouncements,
} from '../utils/parentHelpers';
import { getClassMessagesForClass } from '../services/classMessageRepository';
import { getPublishedAnnouncements } from '../services/announcementRepository';
import { getPracticeHistory } from '../services/practiceHistoryRepository';

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatChip({
  icon, label, value, color, onClick,
}: {
  icon: React.ReactNode; label: string; value: string | number; color: string; onClick?: () => void;
}) {
  const base = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 w-full text-right';
  const interactive = onClick
    ? 'hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400'
    : '';
  return onClick ? (
    <button type="button" onClick={onClick} className={`${base} ${interactive}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xl font-extrabold text-gray-800 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </button>
  ) : (
    <div className={base}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-xl font-extrabold text-gray-800 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function NavCard({
  icon, title, description, color, onClick, badge,
}: {
  icon: React.ReactNode; title: string; description: string; color: string;
  onClick: () => void; badge?: string | number;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-right hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 w-full"
    >
      {badge !== undefined && badge !== 0 && badge !== '' && (
        <span className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      )}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${color}`}>{icon}</div>
      <h3 className="text-sm font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ParentDashboardProps {
  activeUser: User;
  onNavigate: (screen: AppScreen) => void;
  onLogout: () => void;
}

export function ParentDashboard({ activeUser, onNavigate, onLogout }: ParentDashboardProps) {
  const school = useMemo(() => getSchool(activeUser.schoolId), [activeUser.schoolId]);
  const children = useMemo(() => getParentChildren(activeUser), [activeUser]);

  const [selectedChildId, setSelectedChildId] = useState<string>(
    () => getParentSelectedChildId(activeUser),
  );

  const validChildId = useMemo(() => {
    if (canParentAccessChild(activeUser, selectedChildId)) return selectedChildId;
    return children[0]?.id ?? '';
  }, [activeUser, selectedChildId, children]);

  const snapshot = useMemo(
    () => (validChildId ? getParentSelectedChildData(activeUser, validChildId) : null),
    [activeUser, validChildId],
  );

  const handleChangeChild = (id: string) => {
    if (!canParentAccessChild(activeUser, id)) return;
    setSelectedChildId(id);
    saveParentSelectedChildId(activeUser, id);
  };

  // Live repository data for badges and "מה חשוב" section
  const classMessages = useMemo(
    () => (snapshot?.child.classId ? getClassMessagesForClass(snapshot.child.classId) : []),
    [snapshot],
  );
  const publishedAnns = useMemo(
    () => getPublishedAnnouncements(activeUser.schoolId),
    [activeUser.schoolId],
  );
  const childAnns = useMemo(() => {
    if (!snapshot?.child) return [];
    return filterAnnouncementsForChild(publishedAnns, activeUser, snapshot.child.classId);
  }, [publishedAnns, snapshot, activeUser]);

  const unreadMsgs = useMemo(
    () => countUnreadMessages(activeUser.id, classMessages),
    [activeUser.id, classMessages],
  );
  const unreadAnns = useMemo(
    () => countUnreadAnnouncements(activeUser.id, childAnns),
    [activeUser.id, childAnns],
  );

  const practiceHistory = useMemo(
    () => (snapshot?.child ? getPracticeHistory(snapshot.child.id) : []),
    [snapshot],
  );
  const latestPractice = practiceHistory[0];

  const initials = getInitials(activeUser.fullName);
  const remainingAssignments = snapshot
    ? snapshot.assignments.length - snapshot.completedCount : 0;
  const overdueCount = snapshot
    ? snapshot.assignments.filter((a) => a.dueDate.includes('אתמול') || a.dueDate.includes('עבר') || a.dueDate.includes('באיחור')).length
    : 0;
  const completionPct = snapshot && snapshot.assignments.length > 0
    ? Math.round((snapshot.completedCount / snapshot.assignments.length) * 100) : 0;

  // "מה חשוב לדעת עכשיו" — priority alerts, no duplicates
  const urgentAlerts = useMemo(() => {
    const alerts: { id: string; icon: React.ReactNode; text: string; target: AppScreen; urgency: 'high' | 'medium' | 'low' }[] = [];
    if (!snapshot) return alerts;
    const readMsgs = getParentReadMessageIds(activeUser.id);
    const readAnns = getParentReadAnnouncementIds(activeUser.id);
    // 1. Overdue
    if (overdueCount > 0) alerts.push({ id: 'overdue', urgency: 'high',
      icon: <AlertTriangle className="w-4 h-4 text-rose-500" />,
      text: `${overdueCount} משימות באיחור`,
      target: { id: 'parent-child-assignments' } });
    // 2. Exam in 7 days
    if (snapshot.nextExam) alerts.push({ id: 'exam', urgency: 'high',
      icon: <FileText className="w-4 h-4 text-amber-500" />,
      text: `מבחן ב${snapshot.nextExam.subject} — ${snapshot.nextExam.dateLabel}`,
      target: { id: 'parent-child-exams' } });
    // 3. Unread important messages
    const importantUnread = classMessages.find((m) => m.isImportant && !readMsgs.includes(m.id));
    if (importantUnread) alerts.push({ id: 'imp-msg', urgency: 'medium',
      icon: <MessageSquare className="w-4 h-4 text-violet-500" />,
      text: importantUnread.title,
      target: { id: 'parent-class-messages' } });
    // 4. Unread important announcements
    const importantUnreadAnn = childAnns.find((a) => a.important && !readAnns.includes(a.id));
    if (importantUnreadAnn) alerts.push({ id: 'imp-ann', urgency: 'medium',
      icon: <BellRing className="w-4 h-4 text-sky-500" />,
      text: importantUnreadAnn.title,
      target: { id: 'parent-school-announcements' } });
    // 5. Schedule reminder
    if (snapshot.todayLessons.length > 0) alerts.push({ id: 'schedule', urgency: 'low',
      icon: <Calendar className="w-4 h-4 text-teal-500" />,
      text: `${snapshot.todayLessons.length} שיעורים היום`,
      target: { id: 'parent-child-timetable' } });
    return alerts.slice(0, 5);
  }, [snapshot, overdueCount, classMessages, childAnns, activeUser.id]);

  // Notification badge count
  const notifCount = unreadMsgs + unreadAnns + (overdueCount > 0 ? 1 : 0);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-sky-50 font-sans">
      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{school?.name ?? activeUser.schoolId}</p>
              <span className="inline-block bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">הורה</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification button */}
            <button
              onClick={() => onNavigate({ id: 'parent-notifications' })}
              className="relative p-1.5 rounded-lg text-gray-500 hover:text-violet-600 hover:bg-violet-50 transition-colors"
              aria-label="התראות"
            >
              <Bell className="w-5 h-5" />
              {notifCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800">{activeUser.fullName}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <button
              onClick={onLogout}
              aria-label="יציאה"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-rose-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">יציאה</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">שלום {activeUser.firstName}! 👋</h1>
          <p className="text-gray-500 mt-1">הנה העדכונים החשובים מהילדים</p>
        </div>

        {children.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">לא נמצאו ילדים משויכים לחשבון זה</p>
          </div>
        )}

        {children.length > 0 && (
          <>
            {/* Child selector */}
            {children.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <label htmlFor="child-select" className="block text-xs font-semibold text-gray-500 mb-2">
                  בחר/י ילד לצפייה
                </label>
                <div className="relative">
                  <select
                    id="child-select"
                    value={validChildId}
                    onChange={(e) => handleChangeChild(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-800"
                  >
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>{c.fullName}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {snapshot && (
              <>
                {/* Child identity */}
                <div className="bg-gradient-to-l from-violet-500 to-purple-600 rounded-2xl p-5 text-white">
                  <p className="text-xs opacity-70 mb-1">צפייה במידע של</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                      {getInitials(snapshot.child.fullName)}
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold">{snapshot.child.fullName}</h2>
                      <p className="text-sm opacity-80">
                        {snapshot.classGroup?.name ?? snapshot.child.classId ?? ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats row — clickable */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatChip
                    icon={<Calendar className="w-5 h-5 text-sky-600" />}
                    label="שיעורים היום" value={snapshot.todayLessons.length} color="bg-sky-100"
                    onClick={() => onNavigate({ id: 'parent-child-timetable' })}
                  />
                  <StatChip
                    icon={<ClipboardList className="w-5 h-5 text-rose-600" />}
                    label="משימות שנותרו" value={remainingAssignments} color="bg-rose-100"
                    onClick={() => onNavigate({ id: 'parent-child-assignments', initialFilter: 'incomplete' })}
                  />
                  <StatChip
                    icon={<FileText className="w-5 h-5 text-violet-600" />}
                    label="מבחן הבא" value={snapshot.nextExam?.dateLabel ?? 'אין'} color="bg-violet-100"
                    onClick={() => onNavigate({ id: 'parent-child-exams' })}
                  />
                  <StatChip
                    icon={<MessageSquare className="w-5 h-5 text-amber-600" />}
                    label="הודעות כיתה" value={classMessages.length} color="bg-amber-100"
                    onClick={() => onNavigate({ id: 'parent-class-messages' })}
                  />
                </div>

                {/* ─── מה חשוב לדעת עכשיו ──────────────────────────────── */}
                {urgentAlerts.length > 0 && (
                  <section className="bg-white rounded-2xl border border-violet-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 text-violet-600" />
                      <h2 className="text-base font-bold text-gray-800">מה חשוב לדעת עכשיו</h2>
                    </div>
                    <div className="space-y-2">
                      {urgentAlerts.map((alert) => (
                        <button
                          key={alert.id}
                          onClick={() => onNavigate(alert.target)}
                          className={`w-full text-right flex items-center gap-3 rounded-xl px-4 py-3 border hover:shadow-md transition-all ${
                            alert.urgency === 'high'
                              ? 'bg-rose-50 border-rose-100'
                              : alert.urgency === 'medium'
                                ? 'bg-violet-50 border-violet-100'
                                : 'bg-sky-50 border-sky-100'
                          }`}
                        >
                          <span className="flex-shrink-0">{alert.icon}</span>
                          <span className="text-sm font-semibold text-gray-800 flex-1">{alert.text}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">←</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Today's schedule */}
                {snapshot.todayLessons.length > 0 && (
                  <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-violet-600" />
                      <h2 className="text-base font-bold text-gray-800">
                        מערכת השעות של {snapshot.child.firstName} — היום
                      </h2>
                    </div>
                    <div className="space-y-2">
                      {snapshot.todayLessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-violet-50 border border-violet-100">
                          <span className="text-xs font-bold text-violet-700 w-24 flex-shrink-0">{lesson.startTime}–{lesson.endTime}</span>
                          <span className="text-sm font-semibold text-gray-800 flex-1">{lesson.subject}</span>
                          {lesson.room && <span className="text-xs text-gray-400">{lesson.room}</span>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Progress bar — clickable */}
                {snapshot.assignments.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onNavigate({ id: 'parent-child-assignments' })}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full text-right hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <h2 className="text-base font-bold text-gray-800">התקדמות במשימות</h2>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>{snapshot.completedCount} הושלמו מתוך {snapshot.assignments.length}</span>
                      <span className="font-bold text-emerald-600">{completionPct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className="bg-gradient-to-l from-emerald-400 to-teal-500 h-2.5 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                    </div>
                    {overdueCount > 0 && (
                      <p className="text-xs text-rose-600 mt-2 font-semibold">⚠️ {overdueCount} משימות באיחור</p>
                    )}
                  </button>
                )}

                {/* Latest practice score — clickable */}
                {latestPractice && (
                  <button
                    type="button"
                    onClick={() => onNavigate({ id: 'parent-practice-progress' })}
                    className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 w-full text-right hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <h2 className="text-base font-bold text-gray-800">תוצאת תרגול אחרונה</h2>
                    </div>
                    <div className="flex items-center gap-4 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                      <p className={`text-3xl font-extrabold ${latestPractice.percentage >= 80 ? 'text-emerald-600' : latestPractice.percentage >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {latestPractice.percentage}%
                      </p>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{latestPractice.subject}</p>
                        <p className="text-xs text-gray-500">{latestPractice.correctAnswers}/{latestPractice.totalQuestions} נכון · {new Date(latestPractice.completedAt).toLocaleDateString('he-IL')}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">הנתונים לא מהווים ציון בית-ספרי</p>
                  </button>
                )}

                {/* Navigation cards — all functional */}
                <section>
                  <h2 className="text-base font-bold text-gray-700 mb-3">כל המידע</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <NavCard
                      icon={<Calendar className="w-5 h-5 text-sky-600" />}
                      title="מערכת השעות"
                      description="לוח שעות שבועי"
                      color="bg-sky-100"
                      onClick={() => onNavigate({ id: 'parent-child-timetable' })}
                    />
                    <NavCard
                      icon={<ClipboardList className="w-5 h-5 text-rose-600" />}
                      title="משימות ושיעורי בית"
                      description="עקבי אחר המשימות"
                      color="bg-rose-100"
                      badge={overdueCount > 0 ? overdueCount : undefined}
                      onClick={() => onNavigate({ id: 'parent-child-assignments' })}
                    />
                    <NavCard
                      icon={<FileText className="w-5 h-5 text-violet-600" />}
                      title="מבחנים"
                      description="מועדים קרובים ונושאים"
                      color="bg-violet-100"
                      onClick={() => onNavigate({ id: 'parent-child-exams' })}
                    />
                    <NavCard
                      icon={<MessageSquare className="w-5 h-5 text-amber-600" />}
                      title="הודעות הכיתה"
                      description="הודעות מהמורה"
                      color="bg-amber-100"
                      badge={unreadMsgs || undefined}
                      onClick={() => onNavigate({ id: 'parent-class-messages' })}
                    />
                    <NavCard
                      icon={<BellRing className="w-5 h-5 text-teal-600" />}
                      title="הודעות בית הספר"
                      description="עדכונים מבית הספר"
                      color="bg-teal-100"
                      badge={unreadAnns || undefined}
                      onClick={() => onNavigate({ id: 'parent-school-announcements' })}
                    />
                    <NavCard
                      icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                      title="התקדמות בתרגול"
                      description={latestPractice ? `אחרון: ${latestPractice.percentage}%` : 'מעקב למידה'}
                      color="bg-emerald-100"
                      onClick={() => onNavigate({ id: 'parent-practice-progress' })}
                    />
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
