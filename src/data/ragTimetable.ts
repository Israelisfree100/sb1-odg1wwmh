import type { TimetableEntry } from '../types';
import { RAG_CLASS_G3_ID, RAG_SCHOOL_ID } from './ragSchoolInfo';

const SID = RAG_SCHOOL_ID;
const CID = RAG_CLASS_G3_ID;
const ROOM = "כיתה ג'3";
const STAFF = 'צוות בית הספר';

function lesson(
  id: string,
  day: number,
  period: number,
  subject: string,
  teacherName: string,
  startTime: string,
  endTime: string,
  extra?: Partial<TimetableEntry>,
): TimetableEntry {
  return {
    id,
    schoolId: SID,
    classId: CID,
    dayOfWeek: day,
    period,
    subject,
    teacherName,
    room: extra?.room ?? ROOM,
    startTime,
    endTime,
    ...extra,
  };
}

function breakEntry(id: string, day: number, period: number, subject: string, start: string, end: string): TimetableEntry {
  return lesson(id, day, period, subject, '', start, end, { isBreak: true, room: undefined });
}

/** Grade 3 weekly timetable — Sunday (0) through Friday (5). */
export const RAG_G3_TIMETABLE: TimetableEntry[] = [
  // ── Sunday ──
  lesson('tt-rag3-01', 0, 1, 'זואולוגיה', STAFF, '08:00', '08:45'),
  lesson('tt-rag3-02', 0, 2, 'שפה', 'לאה קמחזי', '08:45', '09:30'),
  breakEntry('tt-rag3-0b', 0, 3, 'הפסקת אוכל והפסקה גדולה', '09:30', '10:15'),
  lesson('tt-rag3-04', 0, 4, 'מיומנויות קריאה', 'לאה קמחזי', '10:15', '11:00'),
  lesson('tt-rag3-05', 0, 5, 'אמנות', STAFF, '11:00', '11:45', { room: 'חדר אמנות' }),
  lesson('tt-rag3-06', 0, 7, 'מולדת', STAFF, '12:00', '12:45'),
  lesson('tt-rag3-07', 0, 8, 'שפה', 'לאה קמחזי', '12:45', '13:30'),

  // ── Monday ──
  lesson('tt-rag3-11', 1, 1, 'שפה', 'לאה קמחזי', '08:00', '08:45'),
  lesson('tt-rag3-12', 1, 2, 'שפה', 'לאה קמחזי', '08:45', '09:30'),
  breakEntry('tt-rag3-1b', 1, 3, 'הפסקת אוכל והפסקה גדולה', '09:30', '10:15'),
  lesson('tt-rag3-14', 1, 4, 'מתמטיקה', 'דלית שלג', '10:15', '11:00'),
  lesson('tt-rag3-15', 1, 5, 'מורשת', STAFF, '11:00', '11:45'),
  lesson('tt-rag3-16', 1, 7, 'חינוך גופני', 'בן', '12:00', '12:45', { room: 'אולם הספורט' }),

  // ── Tuesday ──
  lesson('tt-rag3-21', 2, 1, 'מפתח הלב / תיאטרון', 'לאה קמחזי', '08:00', '08:45', { room: 'אולם תיאטרון' }),
  lesson('tt-rag3-22', 2, 2, 'תורה', 'דלית שלג', '08:45', '09:30'),
  breakEntry('tt-rag3-2b', 2, 3, 'הפסקת אוכל והפסקה גדולה', '09:30', '10:15'),
  lesson('tt-rag3-24', 2, 4, 'מתמטיקה', 'דלית שלג', '10:15', '11:00'),
  lesson('tt-rag3-25', 2, 5, 'אנגלית', 'טל', '11:00', '11:45'),
  lesson('tt-rag3-26', 2, 7, 'שפה', 'לאה קמחזי', '12:00', '12:45'),
  lesson('tt-rag3-27', 2, 8, 'זה״ב', STAFF, '12:45', '13:30'),

  // ── Wednesday ──
  lesson('tt-rag3-31', 3, 1, 'מתמטיקה', 'דלית שלג', '08:00', '08:45'),
  lesson('tt-rag3-32', 3, 2, 'גאומטריה', 'דלית שלג', '08:45', '09:30'),
  breakEntry('tt-rag3-3b', 3, 3, 'הפסקת אוכל והפסקה גדולה', '09:30', '10:15'),
  lesson('tt-rag3-34', 3, 4, 'שפה', 'לאה קמחזי', '10:15', '11:00'),
  lesson('tt-rag3-35', 3, 5, 'שפה', 'לאה קמחזי', '11:00', '11:45'),
  lesson('tt-rag3-36', 3, 7, 'חינוך גופני', 'בן', '12:00', '12:45', { room: 'אולם הספורט' }),
  lesson('tt-rag3-37', 3, 8, 'מדעים', 'דנית', '12:45', '13:30', { room: 'מעבדת מדעים' }),

  // ── Thursday ──
  lesson('tt-rag3-41', 4, 1, 'אנגלית', 'טל', '08:00', '08:45'),
  lesson('tt-rag3-42', 4, 2, 'מתמטיקה', 'דלית שלג', '08:45', '09:30'),
  breakEntry('tt-rag3-4b', 4, 3, 'הפסקת אוכל והפסקה גדולה', '09:30', '10:15'),
  lesson('tt-rag3-44', 4, 4, 'חלון גלילאו', STAFF, '10:15', '11:00', { room: 'חדר מדעים' }),
  lesson('tt-rag3-45', 4, 5, 'מוזיקה', 'מקסים', '11:00', '11:45', { room: 'חדר מוזיקה' }),
  lesson('tt-rag3-46', 4, 7, 'תורה', 'דלית שלג', '12:00', '12:45'),
  lesson('tt-rag3-47', 4, 8, 'מתמטיקה', 'דלית שלג', '12:45', '13:30'),

  // ── Friday ──
  lesson('tt-rag3-51', 5, 1, 'כישורי חיים', 'דלית שלג', '08:00', '08:45'),
  lesson('tt-rag3-52', 5, 2, 'מדעים', 'דנית', '08:45', '09:30', { room: 'מעבדת מדעים' }),
  breakEntry('tt-rag3-5b', 5, 3, 'הפסקת אוכל והפסקה גדולה', '09:30', '10:15'),
  lesson('tt-rag3-54', 5, 4, 'מדעים', 'דנית', '10:15', '11:00', { room: 'מעבדת מדעים' }),
  lesson('tt-rag3-55', 5, 5, 'אנגלית', 'טל', '11:00', '11:45'),
];
