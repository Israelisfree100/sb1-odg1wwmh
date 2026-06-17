import React, { useMemo } from 'react';
import { ChevronRight, LogOut, Megaphone, Clock, CheckCircle, XCircle, Star } from 'lucide-react';
import type { User, AppScreen } from '../types';
import { getSchool } from '../utils/dataHelpers';
import { getPublishedAnnouncements } from '../services/announcementRepository';
import { getTeacherRequests } from '../services/teacherAnnouncementRequestRepository';
import { getVisibleAnnouncements } from '../utils/announcementVisibility';

interface Props { activeUser: User; onBack: () => void; onNavigate: (s: AppScreen) => void; onLogout: () => void; }

const READ_KEY = (userId: string) => `teacher_school_announcements_read_${userId}`;

function getReadIds(userId: string): string[] {
  try { return JSON.parse(localStorage.getItem(READ_KEY(userId)) ?? '[]') as string[]; } catch { return []; }
}
function markRead(userId: string, id: string): void {
  const ids = getReadIds(userId);
  if (!ids.includes(id)) {
    try { localStorage.setItem(READ_KEY(userId), JSON.stringify([...ids, id])); } catch { /* ignore */ }
  }
}
function markAllRead(userId: string, ids: string[]): void {
  try { localStorage.setItem(READ_KEY(userId), JSON.stringify(ids)); } catch { /* ignore */ }
}

const STATUS_LABELS = { pending: 'ממתינה לאישור', approved: 'אושרה', rejected: 'נדחתה' } as const;
const STATUS_COLORS = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-rose-100 text-rose-700' };

export function TeacherNoticeBoardScreen({ activeUser, onBack, onLogout, onNavigate }: Props) {
  const school = getSchool(activeUser.schoolId);
  const all = useMemo(() => getPublishedAnnouncements(activeUser.schoolId), [activeUser.schoolId]);
  const visible = useMemo(() => getVisibleAnnouncements(all, activeUser), [all, activeUser]);
  const readIds = useMemo(() => getReadIds(activeUser.id), [activeUser.id]);
  const myRequests = useMemo(() => getTeacherRequests(activeUser.schoolId, activeUser.id), [activeUser.id, activeUser.schoolId]);

  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);

  const handleMarkRead = (id: string) => { markRead(activeUser.id, id); forceUpdate(); };
  const handleMarkAll = () => { markAllRead(activeUser.id, visible.map((a) => a.id)); forceUpdate(); };

  const unread = visible.filter((a) => !readIds.includes(a.id)).length;
  const important = visible.filter((a) => a.important);
  const general = visible.filter((a) => !a.important);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 font-sans">
      <header className="bg-sky-700 shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1 text-sky-200 hover:text-white text-sm">
              <ChevronRight className="w-4 h-4" /><span className="hidden sm:inline">לוח המורה</span>
            </button>
            <div className="h-5 w-px bg-sky-500" />
            <div>
              <p className="text-white font-bold text-sm">לוח מודעות לצוות</p>
              <p className="text-sky-300 text-xs">{school?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <span className="bg-rose-500 text-white text-xs font-extrabold px-2 py-0.5 rounded-full">{unread} חדשות</span>
            )}
            <button onClick={onLogout} className="flex items-center gap-1.5 text-sky-200 hover:text-white text-sm">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Actions */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-gray-800">הודעות בית הספר</h2>
          <div className="flex gap-2">
            {unread > 0 && (
              <button onClick={handleMarkAll} className="text-xs font-semibold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl transition-colors">
                סמן הכל כנקרא
              </button>
            )}
            <button onClick={() => onNavigate({ id: 'teacher-announcement-requests' })}
              className="text-xs font-semibold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1">
              <Megaphone className="w-3.5 h-3.5" />בקשות ההודעות שלי
            </button>
          </div>
        </div>

        {/* Important */}
        {important.length > 0 && (
          <section>
            <p className="text-xs font-bold text-amber-600 mb-2 flex items-center gap-1"><Star className="w-3.5 h-3.5" />הודעות חשובות</p>
            <div className="space-y-2">
              {important.map((ann) => {
                const isUnread = !readIds.includes(ann.id);
                return (
                  <div key={ann.id} onClick={() => handleMarkRead(ann.id)}
                    className={`bg-white rounded-xl border shadow-sm px-4 py-3 cursor-pointer transition-all ${isUnread ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          {isUnread && <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />}
                          <p className="text-sm font-bold text-gray-800">{ann.title}</p>
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                        </div>
                        <p className="text-xs text-gray-500">{ann.author} · {ann.date}</p>
                        <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{ann.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* General */}
        <section>
          <p className="text-xs font-bold text-gray-500 mb-2">הודעות כלליות</p>
          {general.length === 0 && important.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
              <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>אין הודעות כרגע</p>
            </div>
          ) : general.length === 0 ? null : (
            <div className="space-y-2">
              {general.map((ann) => {
                const isUnread = !readIds.includes(ann.id);
                return (
                  <div key={ann.id} onClick={() => handleMarkRead(ann.id)}
                    className={`bg-white rounded-xl border shadow-sm px-4 py-3 cursor-pointer transition-all ${isUnread ? 'border-sky-200 bg-sky-50/30' : 'border-gray-100'}`}>
                    <div className="flex items-start gap-3">
                      {isUnread && <span className="w-2 h-2 bg-sky-500 rounded-full flex-shrink-0 mt-1.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 mb-0.5">{ann.title}</p>
                        <p className="text-xs text-gray-500">{ann.author} · {ann.date}</p>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{ann.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* My request statuses */}
        {myRequests.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-extrabold text-gray-800">הבקשות שלי</p>
            </div>
            <div className="space-y-2">
              {myRequests.slice().reverse().map((req) => (
                <div key={req.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-bold text-gray-800">{req.title}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[req.status]}`}>{STATUS_LABELS[req.status]}</span>
                      </div>
                      <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString('he-IL')}</p>
                      {req.status === 'approved' && (
                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />הבקשה אושרה ופורסמה</p>
                      )}
                      {req.status === 'rejected' && (
                        <p className="text-xs text-rose-600 mt-1 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />{req.rejectionReason ?? req.adminNote ?? 'הבקשה נדחתה'}</p>
                      )}
                      {req.status === 'pending' && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />ממתינה לאישור מנהל</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
