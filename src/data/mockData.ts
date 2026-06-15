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

  // ── Noam — shaked-g1 ──────────────────────────────────────────────────────
  // Monday
  { id: 'tt-ng1-11', schoolId: 'shaked', classId: 'shaked-g1', dayOfWeek: 1, period: 1, subject: 'עברית', teacherName: 'שרה כהן', startTime: '08:00', endTime: '08:45' },
  { id: 'tt-ng1-12', schoolId: 'shaked', classId: 'shaked-g1', dayOfWeek: 1, period: 2, subject: 'חשבון', teacherName: 'יעקב לוי', startTime: '08:50', endTime: '09:35' },
  { id: 'tt-ng1-13', schoolId: 'shaked', classId: 'shaked-g1', dayOfWeek: 1, period: 3, subject: 'מדעים', teacherName: 'אורית שפירא', startTime: '09:40', endTime: '10:25' },
  { id: 'tt-ng1-14', schoolId: 'shaked', classId: 'shaked-g1', dayOfWeek: 1, period: 4, subject: 'אנגלית', teacherName: 'חנה רוזן', startTime: '10:45', endTime: '11:30' },
  { id: 'tt-ng1-15', schoolId: 'shaked', classId: 'shaked-g1', dayOfWeek: 1, period: 5, subject: 'אמנות', teacherName: 'מיכל דוד', startTime: '11:35', endTime: '12:20' },
  { id: 'tt-ng1-16', schoolId: 'shaked', classId: 'shaked-g1', dayOfWeek: 1, period: 6, subject: 'ספורט', teacherName: 'יוסי אברהם', startTime: '12:25', endTime: '13:10' },

  // ── Maya — rakafot-g3 ─────────────────────────────────────────────────────
  // Monday
  { id: 'tt-mg3-11', schoolId: 'rakafot', classId: 'rakafot-g3', dayOfWeek: 1, period: 1, subject: 'מדעים', teacherName: 'מירי גרין', startTime: '08:00', endTime: '08:45' },
  { id: 'tt-mg3-12', schoolId: 'rakafot', classId: 'rakafot-g3', dayOfWeek: 1, period: 2, subject: 'חשבון', teacherName: 'אבי כץ', startTime: '08:50', endTime: '09:35' },
  { id: 'tt-mg3-13', schoolId: 'rakafot', classId: 'rakafot-g3', dayOfWeek: 1, period: 3, subject: 'עברית', teacherName: 'נועה פרץ', startTime: '09:40', endTime: '10:25' },
  { id: 'tt-mg3-14', schoolId: 'rakafot', classId: 'rakafot-g3', dayOfWeek: 1, period: 4, subject: 'ספורט', teacherName: 'גיא נחום', startTime: '10:45', endTime: '11:30' },
  { id: 'tt-mg3-15', schoolId: 'rakafot', classId: 'rakafot-g3', dayOfWeek: 1, period: 5, subject: 'אנגלית', teacherName: 'ליאור מור', startTime: '11:35', endTime: '12:20' },
  { id: 'tt-mg3-16', schoolId: 'rakafot', classId: 'rakafot-g3', dayOfWeek: 1, period: 6, subject: 'אמנות', teacherName: 'רות בן-דוד', startTime: '12:25', endTime: '13:10' },
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
];

// ─── LOST & FOUND ─────────────────────────────────────────────────────────────

export const LOST_FOUND_ITEMS: LostFoundItem[] = [
  // shaked
  { id: 'lf-s1', schoolId: 'shaked', type: 'found', itemName: 'מחברת כחולה', description: 'מחברת כתיבה כחולה עם שם שנמחק', location: 'חצר בית הספר', date: '14/06', status: 'open', color: 'כחול' },
  { id: 'lf-s2', schoolId: 'shaked', type: 'found', itemName: 'קלמר אדום', description: 'קלמר בד אדום עם עפרונות וסרגל בפנים', location: "כיתה ג'1", date: '13/06', status: 'open', color: 'אדום' },
  { id: 'lf-s3', schoolId: 'shaked', type: 'lost', itemName: 'ציידנית ירוקה', description: 'ציידנית ספורט ירוקה עם בקבוק מים', location: 'חדר ספורט', date: '12/06', status: 'open', color: 'ירוק', reportedBy: 'alma' },
  // rakafot
  { id: 'lf-r1', schoolId: 'rakafot', type: 'found', itemName: 'כובע בייסבול', description: 'כובע בייסבול אפור עם לוגו כחול', location: 'חצר בית הספר', date: '14/06', status: 'open', color: 'אפור' },
  { id: 'lf-r2', schoolId: 'rakafot', type: 'lost', itemName: 'תיק ספורט', description: 'תיק ספורט שחור עם פסים לבנים', location: 'חדר הלבשה', date: '13/06', status: 'open', color: 'שחור', reportedBy: 'maya' },
  { id: 'lf-r3', schoolId: 'rakafot', type: 'found', itemName: 'עפרון מכני', description: 'עפרון מכני כחול-לבן', location: 'ספרייה', date: '12/06', status: 'open', color: 'כחול-לבן' },
];
