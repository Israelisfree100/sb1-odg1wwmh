import React from 'react';
import {
  LogOut,
  Megaphone,
  BookOpen,
  Users,
  Package,
  ShieldCheck,
  ClipboardList,
  LayoutDashboard,
  GraduationCap,
  CalendarClock,
  Layers,
  MessageCircle,
  AlertTriangle,
} from 'lucide-react';
import type { User, AppScreen } from '../types';
import { getSchool, getMergedLostFoundItems } from '../utils/dataHelpers';
import { getAllAnnouncementsForAdmin } from '../services/announcementRepository';
import { getAllExamsForAdmin } from '../services/examRepository';
import { getAllAssignmentsForSchool } from '../services/assignmentRepository';
import { getPendingCount } from '../services/teacherAnnouncementRequestRepository';
import { getActiveUserCount } from '../services/userRepository';
import { getActiveClassCount } from '../services/classRepository';
import { getTimetableEntryCount } from '../services/timetableRepository';

interface Props {
  activeUser: User;
  onNavigate: (screen: AppScreen) => void;
  onLogout: () => void;
}

// ─── Stat widget ─────────────────────────────────────────────────────────────

import { ChevronLeft } from 'lucide-react';

interface StatProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  colour: string;
  onClick?: () => void;
}

function StatCard({ label, value, icon, colour, onClick }: StatProps) {
  const base = 'bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 w-full text-right';
  const interactive = onClick
    ? 'hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400'
    : '';
  return onClick ? (
    <button type="button" onClick={onClick} className={`${base} ${interactive}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colour}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold text-gray-800 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{label}</p>
      </div>
      <ChevronLeft className="w-3.5 h-3.5 text-gray-300 shrink-0" />
    </button>
  ) : (
    <div className={base}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colour}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-800 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{label}</p>
      </div>
    </div>
  );
}

// ─── Management card ─────────────────────────────────────────────────────────

interface MgmtCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  badge?: number;
}

function MgmtCard({ title, description, icon, onClick, disabled, badge }: MgmtCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full text-right bg-white rounded-2xl p-5 shadow-sm border transition-all text-start ${
        disabled
          ? 'border-gray-100 opacity-60 cursor-not-allowed'
          : 'border-gray-200 hover:border-indigo-300 hover:shadow-md active:scale-[0.98] cursor-pointer'
      }`}
    >
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-3 left-3 min-w-[22px] h-[22px] bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${disabled ? 'bg-gray-100' : 'bg-indigo-50'}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className={`font-bold text-sm leading-snug ${disabled ? 'text-gray-400' : 'text-gray-800'}`}>
            {title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 leading-snug">{description}</p>
        </div>
      </div>
      {disabled && (
        <span className="absolute top-3 left-3 text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
          בקרוב
        </span>
      )}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminDashboard({ activeUser, onNavigate, onLogout }: Props) {
  const school = getSchool(activeUser.schoolId);
  const schoolId = activeUser.schoolId;

  const publishedCount = getAllAnnouncementsForAdmin(schoolId).filter(
    (a) => a.isPublished !== false,
  ).length;
  const totalAnnCount = getAllAnnouncementsForAdmin(schoolId).length;
  const examCount = getAllExamsForAdmin(schoolId).length;
  const classCount = getActiveClassCount(schoolId);
  const studentCount = getActiveUserCount(schoolId, 'student');
  const teacherCount = getActiveUserCount(schoolId, 'teacher');
  const parentCount = getActiveUserCount(schoolId, 'parent');
  const openLFCount = getMergedLostFoundItems(schoolId).filter(
    (i) => i.status === 'open',
  ).length;
  const assignments = getAllAssignmentsForSchool(schoolId);
  const activeAssignments = assignments.length;
  const urgentAssignments = assignments.filter((a) => a.priority === 'high').length;
  const timetableCount = getTimetableEntryCount(schoolId);
  const pendingTeacherRequests = getPendingCount(schoolId);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* ── Header ── */}
      <header className="bg-indigo-700 shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">
                {school?.name ?? 'בית הספר'}
              </p>
              <p className="text-indigo-200 text-xs">מנהל בית הספר</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline text-indigo-200 text-xs">{activeUser.username}</span>
            <button
              type="button"
              onClick={onLogout}
              title="התנתקות"
              className="flex items-center gap-1.5 text-indigo-200 hover:text-white transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">יציאה</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Title ── */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-900">מערכת ניהול בית הספר</h1>
          </div>
          <p className="text-sm text-gray-500">{school?.fullName ?? school?.name}</p>
        </div>

        {/* ── Teacher requests banner ── */}
        {pendingTeacherRequests > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <MessageCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">
                  {pendingTeacherRequests} בקשות פרסום ממורים ממתינות לאישורך
                </p>
                <p className="text-xs text-amber-600">בקשות שלא אושרו לא מוצגות לתלמידים</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate({ id: 'admin-teacher-announcement-requests' })}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors flex-shrink-0"
            >
              לטיפול
            </button>
          </div>
        )}

        {/* ── Stat widgets ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard label="הודעות פעילות" value={publishedCount}
            icon={<Megaphone className="w-5 h-5 text-violet-600" />} colour="bg-violet-50"
            onClick={() => onNavigate({ id: 'admin-announcements' })} />
          <StatCard label="משימות פעילות" value={activeAssignments}
            icon={<ClipboardList className="w-5 h-5 text-sky-600" />} colour="bg-sky-50"
            onClick={() => onNavigate({ id: 'admin-assignments' })} />
          <StatCard label="משימות דחופות" value={urgentAssignments}
            icon={<AlertTriangle className="w-5 h-5 text-rose-600" />} colour="bg-rose-50"
            onClick={() => onNavigate({ id: 'admin-assignments', initialFilter: 'urgent' })} />
          <StatCard label="שיעורים במערכת" value={timetableCount}
            icon={<CalendarClock className="w-5 h-5 text-indigo-600" />} colour="bg-indigo-50"
            onClick={() => onNavigate({ id: 'admin-timetable' })} />
          <StatCard label="אבדות פתוחות" value={openLFCount}
            icon={<Package className="w-5 h-5 text-amber-600" />} colour="bg-amber-50"
            onClick={() => onNavigate({ id: 'admin-lost-found', initialFilter: 'open' })} />
          <StatCard label="מבחנים קרובים" value={examCount}
            icon={<GraduationCap className="w-5 h-5 text-blue-600" />} colour="bg-blue-50"
            onClick={() => onNavigate({ id: 'admin-exams' })} />
          <StatCard label="כיתות" value={classCount}
            icon={<Layers className="w-5 h-5 text-emerald-600" />} colour="bg-emerald-50"
            onClick={() => onNavigate({ id: 'admin-users-classes', initialTab: 'classes' })} />
          <StatCard label="תלמידים פעילים" value={studentCount}
            icon={<Users className="w-5 h-5 text-amber-600" />} colour="bg-amber-50"
            onClick={() => onNavigate({ id: 'admin-users-classes', initialTab: 'students' })} />
        </div>

        {/* ── Management cards ── */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            מודולי ניהול
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MgmtCard
              title="לוח מודעות"
              description={`${totalAnnCount} הודעות — ${publishedCount} פעילות`}
              icon={<Megaphone className="w-5 h-5 text-indigo-600" />}
              badge={totalAnnCount - publishedCount > 0 ? totalAnnCount - publishedCount : undefined}
              onClick={() => onNavigate({ id: 'admin-announcements' })}
            />
            <MgmtCard
              title="מבחנים"
              description={`${examCount} מבחנים מוגדרים`}
              icon={<GraduationCap className="w-5 h-5 text-indigo-600" />}
              onClick={() => onNavigate({ id: 'admin-exams' })}
            />
            <MgmtCard
              title="משימות ושיעורי בית"
              description={`${activeAssignments} משימות — ${urgentAssignments} דחופות`}
              icon={<BookOpen className="w-5 h-5 text-indigo-600" />}
              badge={urgentAssignments}
              onClick={() => onNavigate({ id: 'admin-assignments' })}
            />
            <MgmtCard
              title="מערכת שעות"
              description={`${timetableCount} שיעורים במערכת`}
              icon={<CalendarClock className="w-5 h-5 text-indigo-600" />}
              onClick={() => onNavigate({ id: 'admin-timetable' })}
            />
            <MgmtCard
              title="תלמידים וכיתות"
              description={`${studentCount} תלמידים · ${classCount} כיתות · ${teacherCount} מורים`}
              icon={<Users className="w-5 h-5 text-indigo-600" />}
              onClick={() => onNavigate({ id: 'admin-users-classes' })}
            />
            <MgmtCard
              title="אבדות ומציאות"
              description={`${openLFCount} פריטים פתוחים`}
              icon={<Package className="w-5 h-5 text-indigo-600" />}
              badge={openLFCount}
              onClick={() => onNavigate({ id: 'admin-lost-found' })}
            />
            <MgmtCard
              title="בקשות פרסום ממורים"
              description={pendingTeacherRequests > 0
                ? `${pendingTeacherRequests} בקשות ממתינות לאישור`
                : 'בקשות מורים לפרסום כלל-בית-ספרי'}
              icon={<MessageCircle className="w-5 h-5 text-indigo-600" />}
              badge={pendingTeacherRequests > 0 ? pendingTeacherRequests : undefined}
              onClick={() => onNavigate({ id: 'admin-teacher-announcement-requests' })}
            />
          </div>
        </div>

        {/* ── Users summary card ── */}
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-gray-800">משתמשים במערכת</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'תלמידים', value: studentCount, color: 'text-amber-700', bg: 'bg-amber-50', tab: 'students' },
              { label: 'מורים', value: teacherCount, color: 'text-emerald-700', bg: 'bg-emerald-50', tab: 'teachers' },
              { label: 'הורים', value: parentCount, color: 'text-violet-700', bg: 'bg-violet-50', tab: 'parents' },
              { label: 'כיתות', value: classCount, color: 'text-indigo-700', bg: 'bg-indigo-50', tab: 'classes' },
            ].map((s) => (
              <button key={s.label}
                onClick={() => onNavigate({ id: 'admin-users-classes', initialTab: s.tab })}
                className={`rounded-xl border border-gray-100 p-3 text-center hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 cursor-pointer ${s.bg}`}
                aria-label={`פתח רשימת ${s.label}`}>
                <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Secretary note ── */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
          <LayoutDashboard className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-indigo-800">מודול מזכירות</p>
            <p className="text-xs text-indigo-600 mt-0.5">
              ניהול אבדות ומציאות, יצירת הודעות כלל-בית-ספריות ועדכון מערכת שעות זמינים עבורך כמנהל בית הספר.
            </p>
          </div>
        </div>

        <div className="h-6" />
      </main>
    </div>
  );
}
