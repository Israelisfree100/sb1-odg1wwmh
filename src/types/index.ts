// ─── Practice / Exam Assistant ───────────────────────────────────────────────

export type AppScreen =
  | { id: 'dashboard' }
  | { id: 'daily-schedule' }
  | { id: 'assignments' }
  | { id: 'class-messages' }
  | { id: 'lost-found' }
  | { id: 'smart-assistant' }
  | { id: 'exam-assistant' }
  | { id: 'practice'; mode: PracticeMode; subject?: string }
  | { id: 'announcements' }
  | { id: 'placeholder'; title: string }
  | { id: 'admin-dashboard' }
  | { id: 'admin-announcements' }
  | { id: 'admin-exams' };

export type PracticeMode = 'quick' | 'full' | 'by-topic';

export type TopicKey = 'multiplication' | 'division' | 'word-problem';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
  topic: TopicKey;
}

// ─── Platform / Multi-school ──────────────────────────────────────────────────

export type UserRole =
  | 'student'
  | 'teacher'
  | 'parent'
  | 'school_admin'
  | 'platform_admin';

export interface School {
  id: string;
  name: string;
  city?: string;
  fullName?: string;
  address?: string;
  description?: string;
}

export interface User {
  id: string;
  schoolId: string;
  username: string;
  /** Mock-only — never store plaintext passwords in production */
  password: string;
  role: UserRole;
  fullName: string;
  firstName: string;
  classId?: string;
}

export interface ClassGroup {
  id: string;
  schoolId: string;
  name: string;
  grade: string;
  teacherName: string;
}

export interface TimetableEntry {
  id: string;
  schoolId: string;
  classId: string;
  /** 0 = Sunday … 4 = Thursday (Israeli school week) */
  dayOfWeek: number;
  /** Sort order within the day (includes break slots for schools that define them). */
  period: number;
  subject: string;
  teacherName: string;
  room?: string;
  startTime: string;
  endTime: string;
  /** When true, this entry is a break period (lunch, recess…). */
  isBreak?: boolean;
}

export interface Assignment {
  id: string;
  schoolId: string;
  classId: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  teacherName: string;
  priority: 'low' | 'medium' | 'high';
}

export type AnnouncementAudience = 'school' | 'grade' | 'class' | 'parents';

export interface Announcement {
  id: string;
  schoolId: string;
  targetGrade?: string;
  targetClassId?: string;
  audience: AnnouncementAudience;
  title: string;
  content: string;
  date: string;
  author: string;
  important: boolean;
  /** undefined or true = published (visible to students); false = draft (admin-only). */
  isPublished?: boolean;
}

export interface Exam {
  id: string;
  schoolId: string;
  classId: string;
  subject: string;
  dateLabel: string;
  topics: string[];
  teacherName: string;
  notes?: string;
}

// ─── Lost & Found ─────────────────────────────────────────────────────────────

export type LostFoundCategory =
  | 'writing'
  | 'clothing'
  | 'bags'
  | 'bottles-food'
  | 'books'
  | 'other';

export interface LostFoundItem {
  id: string;
  schoolId: string;
  classId?: string;
  reportedByUserId: string;
  reportType: 'found' | 'lost';
  itemName: string;
  description: string;
  location: string;
  date: string;
  color?: string;
  category: LostFoundCategory;
  status: 'open' | 'claimed' | 'returned';
  claimedByUserId?: string;
  createdAt: string;
}

// ─── Class Messages ───────────────────────────────────────────────────────────

export type MessageCategory = 'general' | 'homework' | 'exam' | 'activity';

export interface ClassMessage {
  id: string;
  schoolId: string;
  classId: string;
  grade: string;
  teacherName: string;
  category: MessageCategory;
  title: string;
  content: string;
  publishedAt: string;
  isImportant: boolean;
}

// ─── Smart Assistant chat ─────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
