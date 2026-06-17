import React, { useMemo } from 'react';
import { ChevronRight, LogOut, Bell, AlertTriangle, MessageSquare, Megaphone, FileText } from 'lucide-react';
import type { User, AppScreen } from '../types';
import { getSchool, getInitials } from '../utils/dataHelpers';
import {
  canParentAccessChild, getParentSelectedChildId, getSelectedChild,
  getParentReadMessageIds, getParentReadAnnouncementIds, filterAnnouncementsForChild,
} from '../utils/parentHelpers';
import { getAssignmentsForClass } from '../services/assignmentRepository';
import { getClassMessagesForClass } from '../services/classMessageRepository';
import { getPublishedAnnouncements } from '../services/announcementRepository';
import { getExamsForClass } from '../services/examRepository';

interface Props {
  activeUser: User;
  onBack: () => void;
  onNavigate: (s: AppScreen) => void;
  onLogout: () => void;
}

interface Notification {
  id: string;
  type: 'overdue' | 'exam' | 'message' | 'announcement';
  title: string;
  subtitle: string;
  target: AppScreen;
  urgent?: boolean;
}

export function ParentNotificationsScreen({ activeUser, onBack, onNavigate, onLogout }: Props) {
  const childId = getParentSelectedChildId(activeUser);
  const child = useMemo(
    () => (canParentAccessChild(activeUser, childId) ? getSelectedChild(activeUser, childId) : undefined),
    [activeUser, childId],
  );
  const school = useMemo(() => getSchool(activeUser.schoolId), [activeUser.schoolId]);
  const initials = getInitials(activeUser.fullName);

  const notifications = useMemo<Notification[]>(() => {
    const items: Notification[] = [];
    if (!child) return items;

    const assignments = getAssignmentsForClass(child.classId ?? '');
    const messages = getClassMessagesForClass(child.classId ?? '');
    const announcements = filterAnnouncementsForChild(
      getPublishedAnnouncements(activeUser.schoolId),
      activeUser,
      child.classId,
    );
    const exams = getExamsForClass(child.classId ?? '', child.schoolId);
    const readMsgs = getParentReadMessageIds(activeUser.id);
    const readAnns = getParentReadAnnouncementIds(activeUser.id);

    // Overdue assignments
    for (const a of assignments) {
      if (a.dueDate.includes('אתמול') || a.dueDate.includes('עבר') || a.dueDate.includes('באיחור')) {
        items.push({
          id: `overdue-${a.id}`, type: 'overdue', urgent: true,
          title: `משימה באיחור: ${a.title}`,
          subtitle: `${a.subject} · ${a.teacherName}`,
          target: { id: 'parent-child-assignments' },
        });
      }
    }

    // Upcoming exams (within 3 days)
    for (const e of exams) {
      if (e.dateLabel.includes('מחר') || e.dateLabel.includes('היום') || e.dateLabel.includes('3 ימים')) {
        items.push({
          id: `exam-${e.id}`, type: 'exam', urgent: true,
          title: `מבחן ב${e.subject} קרוב`,
          subtitle: `${e.dateLabel} · ${e.teacherName}`,
          target: { id: 'parent-child-exams' },
        });
      }
    }

    // Unread important messages
    for (const m of messages) {
      if (!readMsgs.includes(m.id) && m.isImportant) {
        items.push({
          id: `msg-${m.id}`, type: 'message',
          title: m.title,
          subtitle: `${m.teacherName} · ${m.publishedAt}`,
          target: { id: 'parent-class-messages' },
        });
      }
    }

    // Unread important announcements
    for (const a of announcements) {
      if (!readAnns.includes(a.id) && a.important) {
        items.push({
          id: `ann-${a.id}`, type: 'announcement',
          title: a.title,
          subtitle: `${a.author} · ${a.date}`,
          target: { id: 'parent-school-announcements' },
        });
      }
    }

    return items;
  }, [child, activeUser]);

  const TYPE_ICON: Record<string, React.ReactNode> = {
    overdue: <AlertTriangle className="w-5 h-5 text-rose-500" />,
    exam: <FileText className="w-5 h-5 text-amber-500" />,
    message: <MessageSquare className="w-5 h-5 text-violet-500" />,
    announcement: <Megaphone className="w-5 h-5 text-sky-500" />,
  };

  const TYPE_BG: Record<string, string> = {
    overdue: 'bg-rose-50 border-rose-100',
    exam: 'bg-amber-50 border-amber-100',
    message: 'bg-violet-50 border-violet-100',
    announcement: 'bg-sky-50 border-sky-100',
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
              <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <Bell className="w-4 h-4" />
                התראות
                {notifications.length > 0 && (
                  <span className="bg-rose-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{notifications.length}</span>
                )}
              </p>
              <p className="text-xs text-gray-500">{school?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
            <button onClick={onLogout} className="text-gray-400 hover:text-rose-500 p-1.5"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Bell className="w-14 h-14 mx-auto mb-4 text-gray-200" />
            <p className="font-semibold text-gray-400">אין התראות חדשות</p>
            <p className="text-xs text-gray-300 mt-1">הכל עדכני!</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => onNavigate(n.target)}
              className={`w-full text-right rounded-xl border shadow-sm px-4 py-3 hover:shadow-md transition-all flex items-start gap-3 ${TYPE_BG[n.type]}`}
            >
              <div className="flex-shrink-0 mt-0.5">{TYPE_ICON[n.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.subtitle}</p>
              </div>
              {n.urgent && <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">דחוף</span>}
            </button>
          ))
        )}
      </main>
    </div>
  );
}
