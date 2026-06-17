import type {
  TimetableEntry,
  Assignment,
  Exam,
  Announcement,
  LostFoundItem,
} from '../types';

// ─── TIMETABLE ────────────────────────────────────────────────────────────────
// dayOfWeek: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday

export const TIMETABLE_ENTRIES: TimetableEntry[] = [
  // ── Alma — shaked-g2 ──────────────────────────────────────────────────────
  // Sunday
  { id: 'tt-ag2-01', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 0, period: 1, subject: 'עברית', teacherName: 'שרה כהן', startTime: '08:00', endTime: '08:45' },
  { id: 'tt-ag2-02', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 0, period: 2, subject: 'חשבון', teacherName: 'רחל לוי', startTime: '08:50', endTime: '09:35' },
  { id: 'tt-ag2-03', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 0, period: 3, subject: 'אמנות', teacherName: 'מיכל דוד', startTime: '09:40', endTime: '10:25' },
  // Monday
  { id: 'tt-ag2-11', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 1, period: 1, subject: 'חשבון', teacherName: 'רחל לוי', startTime: '08:00', endTime: '08:45' },
  { id: 'tt-ag2-12', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 1, period: 2, subject: 'עברית', teacherName: 'שרה כהן', startTime: '08:50', endTime: '09:35' },
  { id: 'tt-ag2-13', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 1, period: 3, subject: 'אנגלית', teacherName: 'דניאל ברון', startTime: '09:40', endTime: '10:25' },
  { id: 'tt-ag2-14', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 1, period: 4, subject: 'מדעים', teacherName: 'אורית שפירא', startTime: '10:45', endTime: '11:30' },
  { id: 'tt-ag2-15', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 1, period: 5, subject: 'ספורט', teacherName: 'יוסי אברהם', startTime: '11:35', endTime: '12:20' },
  { id: 'tt-ag2-16', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 1, period: 6, subject: 'אמנות', teacherName: 'מיכל דוד', startTime: '12:25', endTime: '13:10' },
  // Tuesday
  { id: 'tt-ag2-21', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 2, period: 1, subject: 'מדעים', teacherName: 'אורית שפירא', startTime: '08:00', endTime: '08:45' },
  { id: 'tt-ag2-22', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 2, period: 2, subject: 'חשבון', teacherName: 'רחל לוי', startTime: '08:50', endTime: '09:35' },
  { id: 'tt-ag2-23', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 2, period: 3, subject: 'עברית', teacherName: 'שרה כהן', startTime: '09:40', endTime: '10:25' },
  // Wednesday
  { id: 'tt-ag2-31', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 3, period: 1, subject: 'אנגלית', teacherName: 'דניאל ברון', startTime: '08:00', endTime: '08:45' },
  { id: 'tt-ag2-32', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 3, period: 2, subject: 'ספורט', teacherName: 'יוסי אברהם', startTime: '08:50', endTime: '09:35' },
  { id: 'tt-ag2-33', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 3, period: 3, subject: 'חשבון', teacherName: 'רחל לוי', startTime: '09:40', endTime: '10:25' },
  // Thursday
  { id: 'tt-ag2-41', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 4, period: 1, subject: 'עברית', teacherName: 'שרה כהן', startTime: '08:00', endTime: '08:45' },
  { id: 'tt-ag2-42', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 4, period: 2, subject: 'חשבון', teacherName: 'רחל לוי', startTime: '08:50', endTime: '09:35' },
  { id: 'tt-ag2-43', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 4, period: 3, subject: 'מבחן חשבון', teacherName: 'רחל לוי', startTime: '09:40', endTime: '10:25', room: '101' },

  // Wednesday — כישורי חיים with יעל כהן (teacher-shaked)
  { id: 'tt-ag2-34', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 3, period: 4, subject: 'כישורי חיים', teacherName: 'יעל כהן', startTime: '10:35', endTime: '11:20', room: '102' },
  // Thursday — כישורי חיים with יעל כהן
  { id: 'tt-ag2-44', schoolId: 'shaked', classId: 'shaked-g2', dayOfWeek: 4, period: 4, subject: 'כישורי חיים', teacherName: 'יעל כהן', startTime: '10:35', endTime: '11:20', room: '102' },

  // ── Noam — shaked-g1 ──────────────────────────────────────────────────────
  // Monday
  { id: 'tt-ng1-11', schoolId: 'shaked', classId: 'shaked-g1', dayOfWeek: 1, period: 1, subject: 'עברית', teacherName: 'שרה כהן', startTime: '08:00', endTime: '08:45' },
  { id: 'tt-ng1-12', schoolId: 'shaked', classId: 'shaked-g1', dayOfWeek: 1, period: 2, subject: 'חשבון', teacherName: 'יעקב לוי', startTime: '08:50', endTime: '09:35' },
  { id: 'tt-ng1-13', schoolId: 'shaked', classId: 'shaked-g1', dayOfWeek: 1, period: 3, subject: 'מדעים', teacherName: 'אורית שפירא', startTime: '09:40', endTime: '10:25' },
  { id: 'tt-ng1-14', schoolId: 'shaked', classId: 'shaked-g1', dayOfWeek: 1, period: 4, subject: 'אנגלית', teacherName: 'חנה רוזן', startTime: '10:45', endTime: '11:30' },
  { id: 'tt-ng1-15', schoolId: 'shaked', classId: 'shaked-g1', dayOfWeek: 1, period: 5, subject: 'אמנות', teacherName: 'מיכל דוד', startTime: '11:35', endTime: '12:20' },
  { id: 'tt-ng1-16', schoolId: 'shaked', classId: 'shaked-g1', dayOfWeek: 1, period: 6, subject: 'ספורט', teacherName: 'יוסי אברהם', startTime: '12:25', endTime: '13:10' },
  // Wednesday — עברית + כישורי חיים with יעל כהן (teacher-shaked)
  { id: 'tt-ng1-31', schoolId: 'shaked', classId: 'shaked-g1', dayOfWeek: 3, period: 1, subject: 'עברית', teacherName: 'יעל כהן', startTime: '08:00', endTime: '08:45', room: '102' },
  { id: 'tt-ng1-32', schoolId: 'shaked', classId: 'shaked-g1', dayOfWeek: 3, period: 2, subject: 'חשבון', teacherName: 'יעקב לוי', startTime: '08:50', endTime: '09:35' },
  { id: 'tt-ng1-33', schoolId: 'shaked', classId: 'shaked-g1', dayOfWeek: 3, period: 3, subject: 'מדעים', teacherName: 'אורית שפירא', startTime: '09:40', endTime: '10:25' },
  { id: 'tt-ng1-34', schoolId: 'shaked', classId: 'shaked-g1', dayOfWeek: 3, period: 4, subject: 'כישורי חיים', teacherName: 'יעל כהן', startTime: '10:35', endTime: '11:20', room: '102' },

  // ── Maya — rakafot-g3 ─────────────────────────────────────────────────────
  // Monday
  { id: 'tt-mg3-11', schoolId: 'rakafot', classId: 'rakafot-g3', dayOfWeek: 1, period: 1, subject: 'מדעים', teacherName: 'מירי גרין', startTime: '08:00', endTime: '08:45' },
  { id: 'tt-mg3-12', schoolId: 'rakafot', classId: 'rakafot-g3', dayOfWeek: 1, period: 2, subject: 'חשבון', teacherName: 'מיכל לוי', startTime: '08:50', endTime: '09:35' },
  { id: 'tt-mg3-13', schoolId: 'rakafot', classId: 'rakafot-g3', dayOfWeek: 1, period: 3, subject: 'עברית', teacherName: 'נועה פרץ', startTime: '09:40', endTime: '10:25' },
  { id: 'tt-mg3-14', schoolId: 'rakafot', classId: 'rakafot-g3', dayOfWeek: 1, period: 4, subject: 'ספורט', teacherName: 'גיא נחום', startTime: '10:45', endTime: '11:30' },
  { id: 'tt-mg3-15', schoolId: 'rakafot', classId: 'rakafot-g3', dayOfWeek: 1, period: 5, subject: 'אנגלית', teacherName: 'ליאור מור', startTime: '11:35', endTime: '12:20' },
  { id: 'tt-mg3-16', schoolId: 'rakafot', classId: 'rakafot-g3', dayOfWeek: 1, period: 6, subject: 'אמנות', teacherName: 'רות בן-דוד', startTime: '12:25', endTime: '13:10' },
  // Wednesday — מדעים + חשבון with מיכל לוי (teacher-rakafot)
  { id: 'tt-mg3-31', schoolId: 'rakafot', classId: 'rakafot-g3', dayOfWeek: 3, period: 1, subject: 'חשבון', teacherName: 'מיכל לוי', startTime: '08:00', endTime: '08:45', room: 'כיתה ג׳3' },
  { id: 'tt-mg3-32', schoolId: 'rakafot', classId: 'rakafot-g3', dayOfWeek: 3, period: 2, subject: 'עברית', teacherName: 'נועה פרץ', startTime: '08:50', endTime: '09:35' },
  { id: 'tt-mg3-33', schoolId: 'rakafot', classId: 'rakafot-g3', dayOfWeek: 3, period: 3, subject: 'מדעים', teacherName: 'מיכל לוי', startTime: '09:40', endTime: '10:25', room: 'כיתה ג׳3' },
  { id: 'tt-mg3-34', schoolId: 'rakafot', classId: 'rakafot-g3', dayOfWeek: 3, period: 4, subject: 'אנגלית', teacherName: 'ליאור מור', startTime: '10:45', endTime: '11:30' },

  // ── class-rag-g2 (Ramat Aviv G) ───────────────────────────────────────────
  // Bell schedule: 1=08:00-08:45, 2=08:45-09:30, 3=BIG BREAK 09:30-10:15,
  //                4=10:15-11:00, 5=11:00-11:45, 6=SMALL BREAK 11:45-12:00,
  //                7=12:00-12:45, 8=12:45-13:30
  // Sunday
  { id: 'tt-rag-01', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 0, period: 1, subject: 'עברית', teacherName: 'ענת לוי', room: "כיתה ג'2", startTime: '08:00', endTime: '08:45' },
  { id: 'tt-rag-02', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 0, period: 2, subject: 'חשבון', teacherName: 'אמיר שאול', room: "כיתה ג'2", startTime: '08:45', endTime: '09:30' },
  { id: 'tt-rag-0b1', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 0, period: 3, subject: 'הפסקת אוכל והפסקה גדולה', teacherName: '', startTime: '09:30', endTime: '10:15', isBreak: true },
  { id: 'tt-rag-04', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 0, period: 4, subject: 'מדעים', teacherName: 'יונתן רז', room: "כיתה ג'2", startTime: '10:15', endTime: '11:00' },
  { id: 'tt-rag-05', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 0, period: 5, subject: 'ספרייה', teacherName: 'ורד נחמיאס', room: 'ספריית בית הספר', startTime: '11:00', endTime: '11:45' },
  { id: 'tt-rag-0b2', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 0, period: 6, subject: 'הפסקה קטנה', teacherName: '', startTime: '11:45', endTime: '12:00', isBreak: true },
  { id: 'tt-rag-07', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 0, period: 7, subject: 'מוזיקה', teacherName: 'דוד כץ', room: 'חדר מוזיקה', startTime: '12:00', endTime: '12:45' },
  { id: 'tt-rag-08', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 0, period: 8, subject: 'אמנות', teacherName: 'מיה לבנה', room: 'חדר אמנות', startTime: '12:45', endTime: '13:30' },
  // Monday
  { id: 'tt-rag-11', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 1, period: 1, subject: 'עברית', teacherName: 'ענת לוי', room: "כיתה ג'2", startTime: '08:00', endTime: '08:45' },
  { id: 'tt-rag-12', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 1, period: 2, subject: 'חשבון', teacherName: 'אמיר שאול', room: "כיתה ג'2", startTime: '08:45', endTime: '09:30' },
  { id: 'tt-rag-1b1', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 1, period: 3, subject: 'הפסקת אוכל והפסקה גדולה', teacherName: '', startTime: '09:30', endTime: '10:15', isBreak: true },
  { id: 'tt-rag-14', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 1, period: 4, subject: 'אנגלית', teacherName: 'נעמי ברק', room: "כיתה ג'2", startTime: '10:15', endTime: '11:00' },
  { id: 'tt-rag-15', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 1, period: 5, subject: 'מדעים', teacherName: 'יונתן רז', room: "כיתה ג'2", startTime: '11:00', endTime: '11:45' },
  { id: 'tt-rag-1b2', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 1, period: 6, subject: 'הפסקה קטנה', teacherName: '', startTime: '11:45', endTime: '12:00', isBreak: true },
  { id: 'tt-rag-17', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 1, period: 7, subject: 'ספורט', teacherName: 'גיא נחמן', room: 'אולם הספורט', startTime: '12:00', endTime: '12:45' },
  { id: 'tt-rag-18', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 1, period: 8, subject: 'אמנות', teacherName: 'מיה לבנה', room: 'חדר אמנות', startTime: '12:45', endTime: '13:30' },
  // Tuesday
  { id: 'tt-rag-21', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 2, period: 1, subject: 'חשבון', teacherName: 'אמיר שאול', room: "כיתה ג'2", startTime: '08:00', endTime: '08:45' },
  { id: 'tt-rag-22', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 2, period: 2, subject: 'עברית', teacherName: 'ענת לוי', room: "כיתה ג'2", startTime: '08:45', endTime: '09:30' },
  { id: 'tt-rag-2b1', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 2, period: 3, subject: 'הפסקת אוכל והפסקה גדולה', teacherName: '', startTime: '09:30', endTime: '10:15', isBreak: true },
  { id: 'tt-rag-24', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 2, period: 4, subject: 'ספורט', teacherName: 'גיא נחמן', room: 'אולם הספורט', startTime: '10:15', endTime: '11:00' },
  { id: 'tt-rag-25', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 2, period: 5, subject: 'אנגלית', teacherName: 'נעמי ברק', room: "כיתה ג'2", startTime: '11:00', endTime: '11:45' },
  { id: 'tt-rag-2b2', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 2, period: 6, subject: 'הפסקה קטנה', teacherName: '', startTime: '11:45', endTime: '12:00', isBreak: true },
  { id: 'tt-rag-27', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 2, period: 7, subject: 'מדעים', teacherName: 'יונתן רז', room: "כיתה ג'2", startTime: '12:00', endTime: '12:45' },
  { id: 'tt-rag-28', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 2, period: 8, subject: 'ספרייה', teacherName: 'ורד נחמיאס', room: 'ספריית בית הספר', startTime: '12:45', endTime: '13:30' },
  // Wednesday
  { id: 'tt-rag-31', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 3, period: 1, subject: 'עברית', teacherName: 'ענת לוי', room: "כיתה ג'2", startTime: '08:00', endTime: '08:45' },
  { id: 'tt-rag-32', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 3, period: 2, subject: 'מוזיקה', teacherName: 'דוד כץ', room: 'חדר מוזיקה', startTime: '08:45', endTime: '09:30' },
  { id: 'tt-rag-3b1', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 3, period: 3, subject: 'הפסקת אוכל והפסקה גדולה', teacherName: '', startTime: '09:30', endTime: '10:15', isBreak: true },
  { id: 'tt-rag-34', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 3, period: 4, subject: 'חשבון', teacherName: 'אמיר שאול', room: "כיתה ג'2", startTime: '10:15', endTime: '11:00' },
  { id: 'tt-rag-35', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 3, period: 5, subject: 'כישורי חיים', teacherName: 'ענת לוי', room: "כיתה ג'2", startTime: '11:00', endTime: '11:45' },
  { id: 'tt-rag-3b2', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 3, period: 6, subject: 'הפסקה קטנה', teacherName: '', startTime: '11:45', endTime: '12:00', isBreak: true },
  { id: 'tt-rag-37', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 3, period: 7, subject: 'אנגלית', teacherName: 'נעמי ברק', room: "כיתה ג'2", startTime: '12:00', endTime: '12:45' },
  { id: 'tt-rag-38', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 3, period: 8, subject: 'אמנות', teacherName: 'מיה לבנה', room: 'חדר אמנות', startTime: '12:45', endTime: '13:30' },
  // Thursday
  { id: 'tt-rag-41', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 4, period: 1, subject: 'חשבון', teacherName: 'אמיר שאול', room: "כיתה ג'2", startTime: '08:00', endTime: '08:45' },
  { id: 'tt-rag-42', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 4, period: 2, subject: 'עברית', teacherName: 'ענת לוי', room: "כיתה ג'2", startTime: '08:45', endTime: '09:30' },
  { id: 'tt-rag-4b1', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 4, period: 3, subject: 'הפסקת אוכל והפסקה גדולה', teacherName: '', startTime: '09:30', endTime: '10:15', isBreak: true },
  { id: 'tt-rag-44', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 4, period: 4, subject: 'אנגלית', teacherName: 'נעמי ברק', room: "כיתה ג'2", startTime: '10:15', endTime: '11:00' },
  { id: 'tt-rag-45', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 4, period: 5, subject: 'ספורט', teacherName: 'גיא נחמן', room: 'אולם הספורט', startTime: '11:00', endTime: '11:45' },
  { id: 'tt-rag-4b2', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 4, period: 6, subject: 'הפסקה קטנה', teacherName: '', startTime: '11:45', endTime: '12:00', isBreak: true },
  { id: 'tt-rag-47', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 4, period: 7, subject: 'מדעים', teacherName: 'יונתן רז', room: "כיתה ג'2", startTime: '12:00', endTime: '12:45' },
  { id: 'tt-rag-48', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', dayOfWeek: 4, period: 8, subject: 'כישורי חיים', teacherName: 'ענת לוי', room: "כיתה ג'2", startTime: '12:45', endTime: '13:30' },
];

// ─── ASSIGNMENTS ──────────────────────────────────────────────────────────────

export const ASSIGNMENTS: Assignment[] = [
  // Alma — shaked-g2
  { id: 'asgn-a1', schoolId: 'shaked', classId: 'shaked-g2', subject: 'חשבון', title: 'דף עבודה — כפל עד 10', description: 'להשלים 20 תרגילי כפל בעמוד 32', dueDate: 'מחר', teacherName: 'רחל לוי', priority: 'high' },
  { id: 'asgn-a2', schoolId: 'shaked', classId: 'shaked-g2', subject: 'עברית', title: 'קריאת פרק 5 בספר הלימוד', description: 'לקרוא ולענות על שאלות ההבנה בסוף הפרק', dueDate: "יום ו'", teacherName: 'שרה כהן', priority: 'medium' },
  { id: 'asgn-a3', schoolId: 'shaked', classId: 'shaked-g2', subject: 'אנגלית', title: 'Write 5 sentences', description: 'Using vocabulary words from unit 4', dueDate: "יום ה'", teacherName: 'דניאל ברון', priority: 'low' },

  // Noam — shaked-g1
  { id: 'asgn-n1', schoolId: 'shaked', classId: 'shaked-g1', subject: 'עברית', title: 'חיבור על חופש הקיץ', description: 'לכתוב חיבור בן 10 שורות על תוכניות הקיץ', dueDate: 'מחר', teacherName: 'שרה כהן', priority: 'high' },
  { id: 'asgn-n2', schoolId: 'shaked', classId: 'shaked-g1', subject: 'חשבון', title: 'תרגילי חילוק — עמוד 45', description: 'לפתור תרגילים 1 עד 15', dueDate: "יום ה'", teacherName: 'יעקב לוי', priority: 'medium' },

  // Maya — rakafot-g3
  { id: 'asgn-m1', schoolId: 'rakafot', classId: 'rakafot-g3', subject: 'מדעים', title: 'ניסוי מחזור המים בבית', description: 'לבצע את ניסוי מחזור המים ולצלם תמונה', dueDate: 'מחר', teacherName: 'מירי גרין', priority: 'high' },
  { id: 'asgn-m2', schoolId: 'rakafot', classId: 'rakafot-g3', subject: 'אנגלית', title: 'Vocabulary list — unit 3', description: 'ללמוד 10 מילים חדשות לקראת המבחן', dueDate: "יום ד'", teacherName: 'ליאור מור', priority: 'medium' },
  { id: 'asgn-m3', schoolId: 'rakafot', classId: 'rakafot-g3', subject: 'חשבון', title: 'דף תרגול — כפל', description: 'להשלים דף תרגול כפל', dueDate: "יום ו'", teacherName: 'אבי כץ', priority: 'low' },

  // ── Additional assignments due TODAY (extended, not modifying originals) ──
  { id: 'asgn-a4', schoolId: 'shaked', classId: 'shaked-g2', subject: 'חשבון', title: 'חזרה לקראת המבחן', description: 'לחזור על לוח כפל 7 ו-8 — שיעור נוסף להכנה', dueDate: 'היום', teacherName: 'רחל לוי', priority: 'high' },
  { id: 'asgn-n3', schoolId: 'shaked', classId: 'shaked-g1', subject: 'עברית', title: 'לסיים את הטיוטה', description: 'לסיים את טיוטת החיבור ולהביא לכיתה', dueDate: 'היום', teacherName: 'שרה כהן', priority: 'high' },
  { id: 'asgn-m4', schoolId: 'rakafot', classId: 'rakafot-g3', subject: 'מדעים', title: 'לצפות בסרטון', description: 'לצפות בסרטון על מחזור המים בקישור שנשלח', dueDate: 'היום', teacherName: 'מירי גרין', priority: 'medium' },

  // ── class-rag-g2 (Ramat Aviv G) ───────────────────────────────────────────
  { id: 'asgn-rag-1', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', subject: 'עברית', title: 'קריאה בספר', description: 'לקרוא עמודים 20–22 בספר הקריאה ולסכם בשלושה משפטים', dueDate: 'היום', teacherName: 'ענת לוי', priority: 'medium' },
  { id: 'asgn-rag-2', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', subject: 'חשבון', title: 'דף תרגול כפל', description: 'לפתור דף תרגול כפל עמודים 14–15 — לוחות 7, 8 ו-9', dueDate: 'מחר', teacherName: 'אמיר שאול', priority: 'high' },
  { id: 'asgn-rag-3', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', subject: 'אנגלית', title: 'Unit 2 Vocabulary', description: 'ללמוד 10 מילים חדשות מיחידה 2 לקראת תרגיל בכיתה', dueDate: "יום ד'", teacherName: 'נעמי ברק', priority: 'low' },
  { id: 'asgn-rag-4', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', subject: 'מדעים', title: 'תצפית — מחזור המים', description: 'לצפות בסרטון ההסבר על מחזור המים ולרשום שלוש תצפיות', dueDate: "יום ה'", teacherName: 'יונתן רז', priority: 'medium' },
  { id: 'asgn-rag-5', schoolId: 'ramat-aviv-g', classId: 'class-rag-g2', subject: 'ספרייה', title: 'להחזיר ספר לספרייה', description: 'חובה להחזיר את ספר הספרייה עד יום רביעי — לפני שיעור הספרייה', dueDate: "יום ד'", teacherName: 'ורד נחמיאס', priority: 'high' },
];

// ─── EXAMS ────────────────────────────────────────────────────────────────────

export const EXAMS: Exam[] = [
  // Alma — shaked-g2
  {
    id: 'exam-a1',
    schoolId: 'shaked',
    classId: 'shaked-g2',
    subject: 'חשבון',
    dateLabel: "יום חמישי",
    topics: ['כפל עד 10', 'חילוק בסיסי', 'בעיות מילוליות'],
    teacherName: 'רחל לוי',
  },

  // Noam — shaked-g1
  {
    id: 'exam-n1',
    schoolId: 'shaked',
    classId: 'shaked-g1',
    subject: 'עברית',
    dateLabel: "יום רביעי",
    topics: ['כתיב', 'קריאה', 'הבנת הנקרא'],
    teacherName: 'שרה כהן',
  },

  // Maya — rakafot-g3
  {
    id: 'exam-m1',
    schoolId: 'rakafot',
    classId: 'rakafot-g3',
    subject: 'מדעים',
    dateLabel: 'שני הבא',
    topics: ['מחזור המים', 'צמחים ותנאי גידול', 'חיות מחמד'],
    teacherName: 'מירי גרין',
  },

  // ── class-rag-g2 (Ramat Aviv G) ───────────────────────────────────────────
  {
    id: 'exam-rag-1',
    schoolId: 'ramat-aviv-g',
    classId: 'class-rag-g2',
    subject: 'חשבון',
    dateLabel: "יום ד' הקרוב",
    topics: ['כפל עד 10', 'חילוק בסיסי', 'סדר פעולות פשוט', 'בעיות מילוליות'],
    teacherName: 'אמיר שאול',
  },
  {
    id: 'exam-rag-2',
    schoolId: 'ramat-aviv-g',
    classId: 'class-rag-g2',
    subject: 'עברית',
    dateLabel: "יום ה'",
    topics: ['הבנת הנקרא', 'מילים נרדפות', 'כתיבת משפטים'],
    teacherName: 'ענת לוי',
  },
];

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────

export const ANNOUNCEMENTS: Announcement[] = [
  // ── School-wide — shaked ──────────────────────────────────────────────────
  {
    id: 'ann-s1',
    schoolId: 'shaked',
    audience: 'school',
    title: 'יום ספורט בית ספרי',
    content: 'ביום שישי הקרוב יתקיים יום ספורט לכל הכיתות. יש להגיע בבגדי ספורט ובנעלי ריצה.',
    date: '20/06',
    author: 'הנהלת בית הספר',
    important: true,
  },
  {
    id: 'ann-s2',
    schoolId: 'shaked',
    audience: 'school',
    title: 'שינוי בשעת הסיום',
    content: 'ביום שלישי הבא הלימודים יסתיימו ב-12:00. יש לעדכן את ההורים.',
    date: '16/06',
    author: 'מזכירות בית הספר',
    important: true,
  },
  {
    id: 'ann-s3',
    schoolId: 'shaked',
    audience: 'school',
    title: 'הצגה לכבוד סיום השנה',
    content: 'התלמידים מוזמנים להצגה ביום שישי בשעה 18:00 באולם המועצה.',
    date: '14/06',
    author: 'ועד ההורים',
    important: false,
  },
  // Grade-level — shaked g3
  {
    id: 'ann-sg3',
    schoolId: 'shaked',
    audience: 'grade',
    targetGrade: "ג'",
    title: "טיול שכבתי לשכבת ג'",
    content: "הטיול יצא ביום חמישי. חובה להביא: אוכל, שתייה, כובע ונעלי ספורט.",
    date: '15/06',
    author: "מנהלת שכבת ג'",
    important: true,
  },
  // Class-specific — shaked-g2 (Alma)
  {
    id: 'ann-ag2-1',
    schoolId: 'shaked',
    audience: 'class',
    targetClassId: 'shaked-g2',
    title: 'תזכורת מבחן חשבון',
    content: 'המבחן בחשבון יתקיים ביום חמישי. יש לחזור על נושאים: כפל, חילוק ובעיות מילוליות.',
    date: '15/06',
    author: 'רחל לוי',
    important: true,
  },
  {
    id: 'ann-ag2-2',
    schoolId: 'shaked',
    audience: 'class',
    targetClassId: 'shaked-g2',
    title: 'שיעורי בית לסוף השבוע',
    content: 'יש להשלים את קריאת פרק 5 ולענות על כל שאלות ההבנה עד יום ראשון.',
    date: '13/06',
    author: 'שרה כהן',
    important: false,
  },
  // Class-specific — shaked-g1 (Noam)
  {
    id: 'ann-ng1-1',
    schoolId: 'shaked',
    audience: 'class',
    targetClassId: 'shaked-g1',
    title: 'הגשת חיבור',
    content: 'יש להגיש את החיבור עד מחר בבוקר. אנא הכניסו לתוך קלסר כחול.',
    date: '15/06',
    author: 'שרה כהן',
    important: true,
  },

  // ── School-wide — rakafot ─────────────────────────────────────────────────
  {
    id: 'ann-r1',
    schoolId: 'rakafot',
    audience: 'school',
    title: 'טקס סיום שנת הלימודים',
    content: 'טקס סיום שנת הלימודים יתקיים ב-25 ביוני. כל המשפחות מוזמנות לאולם בית הספר.',
    date: '25/06',
    author: 'הנהלת בית הספר',
    important: true,
  },
  {
    id: 'ann-r2',
    schoolId: 'rakafot',
    audience: 'school',
    title: 'יום אמנות',
    content: 'ביום שלישי יתקיים יום אמנות לכל הכיתות. יש להביא חולצה ישנה לעבודות יצירה.',
    date: '18/06',
    author: 'מזכירות בית הספר',
    important: false,
  },
  // Grade-level — rakafot g3
  {
    id: 'ann-rg3',
    schoolId: 'rakafot',
    audience: 'grade',
    targetGrade: "ג'",
    title: "סיור שכבתי לים",
    content: "הסיור יצא ביום שני הבא. יש להביא: בגד ים, מגבת, אוכל ושתייה.",
    date: '22/06',
    author: "מנהלת שכבת ג'",
    important: false,
  },
  // Class-specific — rakafot-g3 (Maya)
  {
    id: 'ann-mg3-1',
    schoolId: 'rakafot',
    audience: 'class',
    targetClassId: 'rakafot-g3',
    title: 'ניסוי מדעים ביחד',
    content: 'ביום שני נבצע ביחד את ניסוי מחזור המים. יש להביא צנצנת זכוכית קטנה.',
    date: '15/06',
    author: 'מירי גרין',
    important: true,
  },
  {
    id: 'ann-mg3-2',
    schoolId: 'rakafot',
    audience: 'class',
    targetClassId: 'rakafot-g3',
    title: 'שיעורי בית אנגלית',
    content: 'יש ללמוד את רשימת המילים מיחידה 3 לקראת הבחינה הקרובה.',
    date: '13/06',
    author: 'ליאור מור',
    important: false,
  },

  // ── ramat-aviv-g ─────────────────────────────────────────────────────────
  {
    id: 'ann-rag-1',
    schoolId: 'ramat-aviv-g',
    audience: 'school',
    title: 'איגרת לפתיחת שבוע',
    content: 'שבוע טוב לכל משפחות בית הספר! השבוע מתחילות פעילויות רבות ומגוונות. נשמח לראות את כולם עם חיוך, בקבוק מים מלא וכובע.',
    date: '15/06',
    author: 'הנהלת בית הספר',
    important: false,
  },
  {
    id: 'ann-rag-2',
    schoolId: 'ramat-aviv-g',
    audience: 'school',
    title: 'יום ספורט בית ספרי — יום שישי',
    content: 'ביום שישי הקרוב יתקיים יום ספורט חגיגי לכל בית הספר בחצר. יש להגיע עם בגדי ספורט, נעלי ריצה ובקבוק מים גדול. הפעילות תתקיים גם במקרה של עננות קלה.',
    date: '14/06',
    author: 'הנהלת בית הספר',
    important: true,
  },
  {
    id: 'ann-rag-3',
    schoolId: 'ramat-aviv-g',
    audience: 'grade',
    targetGrade: "ג'",
    title: "פעילות שכבת ג' — ידע וסקרנות",
    content: "ביום שלישי הקרוב תתקיים פעילות שכבתית לכיתות ג' בנושא סקרנות מדעית. נבצע ניסויים קטנים ונציג לאחד לשני תגליות מרתקות.",
    date: '13/06',
    author: "צוות שכבת ג'",
    important: false,
  },
  {
    id: 'ann-rag-4',
    schoolId: 'ramat-aviv-g',
    audience: 'class',
    targetClassId: 'class-rag-g2',
    title: "מפגש הורים — כיתה ג'2",
    content: "מפגש הורים קרוב! ביום שלישי בשעה 17:30 בכיתה ג'2. נדון בהתקדמות השנה, הכנות לסוף שנה ותכניות לשנה הבאה. נשמח לראות כמה שיותר הורים.",
    date: '12/06',
    author: "ענת לוי, מחנכת ג'2",
    important: true,
  },
  {
    id: 'ann-rag-5',
    schoolId: 'ramat-aviv-g',
    audience: 'school',
    title: 'טקס קהילתי חגיגי — סוף שנה',
    content: 'טקס סיום שנת הלימודים יתקיים ב-26 ביוני בשעה 17:00 בחצר בית הספר. כל המשפחות מוזמנות. תכנית מיוחדת הכוללת הופעות, פרסי הצטיינות ואנשי הכיתה.',
    date: '10/06',
    author: 'הנהלת בית הספר',
    important: true,
  },
  {
    id: 'ann-rag-6',
    schoolId: 'ramat-aviv-g',
    audience: 'school',
    title: 'תזכורת חשובה: כובע ובקבוק מים',
    content: 'עם התחממות מזג האוויר, חשוב להגיע כל יום עם כובע ובקבוק מים מלא. הגוף הקטן צמא! לא מגיעים בלי בקבוק מים.',
    date: '15/06',
    author: 'צוות החינוך',
    important: false,
  },
  {
    id: 'ann-rag-7',
    schoolId: 'ramat-aviv-g',
    audience: 'school',
    title: 'עדכון שעות הצהרון',
    content: 'החל מהשבוע הבא, שעות הצהרון ישתנו: סיום ב-16:30 במקום 17:00. נא לתאם איסוף בהתאם. לפרטים נוספים ניתן לפנות למשרד הצהרון.',
    date: '14/06',
    author: 'הנהלת הצהרון',
    important: true,
  },
  {
    id: 'ann-rag-8',
    schoolId: 'ramat-aviv-g',
    audience: 'grade',
    targetGrade: "ג'",
    title: "שעת סיפור בספרייה — שכבת ג'",
    content: "ביום שלישי הקרוב שכבת ג' מוזמנת לשעת סיפור מיוחדת בספריית בית הספר. נקרא יחד ספר חדש ונחליף המלצות. יש להחזיר ספרים שאולים עד אז.",
    date: '13/06',
    author: 'ורד נחמיאס, רכזת הספרייה',
    important: false,
  },
];

// ─── LOST & FOUND ─────────────────────────────────────────────────────────────

export const LOST_FOUND_ITEMS: LostFoundItem[] = [
  // ── Shaked school ───────────────────────────────────────────────────────────
  {
    id: 'lf-s1', schoolId: 'shaked', reportedByUserId: 'staff',
    reportType: 'found', itemName: 'מחברת כחולה',
    description: 'מחברת כתיבה כחולה עם שם שנמחק', location: 'חצר בית הספר',
    date: '14/06', color: 'כחול', category: 'books', status: 'open',
    createdAt: '2026-06-14T08:00:00',
  },
  {
    id: 'lf-s2', schoolId: 'shaked', reportedByUserId: 'staff',
    reportType: 'found', itemName: 'קלמר אדום',
    description: 'קלמר בד אדום עם עפרונות וסרגל בפנים', location: "כיתה ג'1",
    date: '13/06', color: 'אדום', category: 'bags', status: 'open',
    createdAt: '2026-06-13T08:00:00',
  },
  {
    id: 'lf-s3', schoolId: 'shaked', reportedByUserId: 'alma',
    reportType: 'lost', itemName: 'ציידנית ירוקה',
    description: 'ציידנית ספורט ירוקה עם בקבוק מים', location: 'חדר ספורט',
    date: '12/06', color: 'ירוק', category: 'bags', status: 'open',
    createdAt: '2026-06-12T10:00:00',
  },
  {
    id: 'lf-s4', schoolId: 'shaked', reportedByUserId: 'staff',
    reportType: 'found', itemName: 'בקבוק מים כחול',
    description: 'בקבוק מים כחול עם מכסה שחור', location: 'חצר',
    date: '13/06', color: 'כחול', category: 'bottles-food', status: 'open',
    createdAt: '2026-06-13T09:00:00',
  },
  {
    id: 'lf-s5', schoolId: 'shaked', reportedByUserId: 'noam',
    reportType: 'lost', itemName: 'מעיל אפור',
    description: 'מעיל אפור בהיר עם שני כיסים גדולים', location: 'מגרש הכדורסל',
    date: '12/06', color: 'אפור', category: 'clothing', status: 'open',
    createdAt: '2026-06-12T12:00:00',
  },
  {
    id: 'lf-s6', schoolId: 'shaked', reportedByUserId: 'alma',
    reportType: 'found', itemName: 'ספר עברית כיתה ג',
    description: 'ספר לימוד עברית כיתה ג עם כיסוי ירוק', location: "כיתה ג'2",
    date: '14/06', color: 'ירוק', category: 'books', status: 'open',
    createdAt: '2026-06-14T11:00:00',
  },

  // ── Rakafot school ──────────────────────────────────────────────────────────
  {
    id: 'lf-r1', schoolId: 'rakafot', reportedByUserId: 'staff',
    reportType: 'found', itemName: 'כובע בייסבול',
    description: 'כובע בייסבול אפור עם לוגו כחול', location: 'חצר בית הספר',
    date: '14/06', color: 'אפור', category: 'clothing', status: 'open',
    createdAt: '2026-06-14T08:00:00',
  },
  {
    id: 'lf-r2', schoolId: 'rakafot', reportedByUserId: 'maya',
    reportType: 'lost', itemName: 'תיק ספורט שחור',
    description: 'תיק ספורט שחור עם פסים לבנים', location: 'חדר הלבשה',
    date: '13/06', color: 'שחור', category: 'bags', status: 'open',
    createdAt: '2026-06-13T14:00:00',
  },
  {
    id: 'lf-r3', schoolId: 'rakafot', reportedByUserId: 'staff',
    reportType: 'found', itemName: 'עפרון מכני כחול-לבן',
    description: 'עפרון מכני דק בצבע כחול-לבן', location: 'ספרייה',
    date: '12/06', color: 'כחול-לבן', category: 'writing', status: 'open',
    createdAt: '2026-06-12T09:00:00',
  },
  {
    id: 'lf-r4', schoolId: 'rakafot', reportedByUserId: 'staff',
    reportType: 'found', itemName: 'קופסת אוכל כתומה',
    description: 'קופסת אוכל כתומה עם מכסה כחול', location: 'חדר האוכל',
    date: '14/06', color: 'כתום', category: 'bottles-food', status: 'open',
    createdAt: '2026-06-14T12:00:00',
  },
  {
    id: 'lf-r5', schoolId: 'rakafot', reportedByUserId: 'maya',
    reportType: 'lost', itemName: 'צעיף ורוד',
    description: 'צעיף ורוד עם פסי לבן', location: 'חצר',
    date: '11/06', color: 'ורוד', category: 'clothing', status: 'open',
    createdAt: '2026-06-11T10:00:00',
  },

  // ── Ramat Aviv G school ─────────────────────────────────────────────────────
  {
    id: 'lf-rag-1', schoolId: 'ramat-aviv-g', reportedByUserId: 'staff',
    reportType: 'found', itemName: 'קלמר כחול',
    description: 'קלמר בד כחול עם עפרון, סרגל ומחק בפנים', location: 'החצר',
    date: '15/06', color: 'כחול', category: 'bags', status: 'open',
    createdAt: '2026-06-15T09:00:00',
  },
  {
    id: 'lf-rag-2', schoolId: 'ramat-aviv-g', reportedByUserId: 'staff',
    reportType: 'found', itemName: 'בקבוק מים ירוק',
    description: 'בקבוק מים ירוק עם מכסה לבן — ללא שם', location: 'הספרייה',
    date: '14/06', color: 'ירוק', category: 'bottles-food', status: 'open',
    createdAt: '2026-06-14T10:00:00',
  },
  {
    id: 'lf-rag-3', schoolId: 'ramat-aviv-g', reportedByUserId: 'staff',
    reportType: 'found', itemName: 'סווטשירט אפור',
    description: 'סווטשירט אפור עם כיסים קדמיים, גודל לילד כיתה ג׳', location: 'אולם הספורט',
    date: '13/06', color: 'אפור', category: 'clothing', status: 'open',
    createdAt: '2026-06-13T13:00:00',
  },
  {
    id: 'lf-rag-4', schoolId: 'ramat-aviv-g', reportedByUserId: 'staff',
    reportType: 'found', itemName: 'ספר קריאה',
    description: 'ספר קריאה לילדים — דף הפנים ריק, ללא שם כתוב', location: "ליד כיתה ג'2",
    date: '14/06', color: 'כחול-לבן', category: 'books', status: 'open',
    createdAt: '2026-06-14T08:30:00',
  },
  {
    id: 'lf-rag-5', schoolId: 'ramat-aviv-g', reportedByUserId: 'user-rag-alma',
    reportType: 'lost', itemName: 'קופסת אוכל',
    description: 'קופסת אוכל כחולה עם מכסה שקוף ואטב פתיחה', location: 'שער בית הספר',
    date: '12/06', color: 'כחול', category: 'bottles-food', status: 'open',
    createdAt: '2026-06-12T14:00:00',
  },
];

// ─── DAILY INFO ────────────────────────────────────────────────────────────────

export interface DailyInfo {
  classId: string;
  itemsToBring: string[];
  homeworkDueToday: string[];
  reminder: string;
  upcomingEvent: string;
}

export const DAILY_INFO: DailyInfo[] = [
  {
    classId: 'shaked-g2',
    itemsToBring: ['ספר חשבון', 'ציוד ציור (מכחולים וצבעי מים)', 'בגדי ספורט'],
    homeworkDueToday: ['לקרוא פרק 5 בעברית', 'לחזור על לוח כפל 7 ו-8'],
    reminder: 'לא לשכוח: יש להביא אישור הורים לטיול עד יום חמישי!',
    upcomingEvent: 'טיול שכבתי ביום חמישי הקרוב',
  },
  {
    classId: 'shaked-g1',
    itemsToBring: ['ספר עברית', 'מחברת כתיבה', 'קלמר'],
    homeworkDueToday: ['להשלים טיוטת החיבור', 'לקרוא עמודים 20–22 בקריאה'],
    reminder: 'מבחן עברית ביום רביעי — לחזור על שאלות ההבנה!',
    upcomingEvent: 'יום ספורט בית ספרי ביום שישי',
  },
  {
    classId: 'rakafot-g3',
    itemsToBring: ['ספר מדעים', 'צנצנת זכוכית קטנה לניסוי', 'חולצה ישנה'],
    homeworkDueToday: ['לצפות בסרטון על מחזור המים', 'לרשום 3 תצפיות'],
    reminder: 'להביא חולצה ישנה ליום האמנות ביום שלישי',
    upcomingEvent: 'סיור שכבתי לים ביום שני הבא',
  },
  {
    classId: 'class-rag-g2',
    itemsToBring: ['ספר עברית', 'מחברת כתיבה', 'קלמר', 'בגדי ספורט לשיעור ספורט'],
    homeworkDueToday: ['לקרוא עמודים 20–22 בספר הקריאה', 'לסיים דף תרגול חשבון'],
    reminder: 'להחזיר את ספר הספרייה עד יום רביעי — לפני שיעור הספרייה!',
    upcomingEvent: 'שעת סיפור והחלפת ספרים בספריית בית הספר — יום שלישי הקרוב',
  },
];
