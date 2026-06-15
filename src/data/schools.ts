import type { School, ClassGroup, User } from '../types';

export const SCHOOLS: School[] = [
  { id: 'shaked', name: 'בית ספר השקד', city: 'תל אביב' },
  { id: 'rakafot', name: 'בית ספר הרקפות', city: 'חיפה' },
  {
    id: 'ramat-aviv-g',
    name: 'בית ספר רמת אביב ג׳',
    city: 'תל אביב-יפו',
    fullName: 'בית הספר היסודי רמת אביב ג׳',
    address: 'מאיר פיינשטיין 83, תל אביב-יפו',
    description: 'בית ספר יסודי קהילתי בשכונת רמת אביב ג׳ בתל אביב-יפו.',
  },
];

export const CLASSES: ClassGroup[] = [
  { id: 'shaked-g1', schoolId: 'shaked', name: "ג'1", grade: "ג'", teacherName: 'שרה כהן' },
  { id: 'shaked-g2', schoolId: 'shaked', name: "ג'2", grade: "ג'", teacherName: 'רחל לוי' },
  { id: 'rakafot-g3', schoolId: 'rakafot', name: "ג'3", grade: "ג'", teacherName: 'מירי גרין' },
  { id: 'rakafot-g4', schoolId: 'rakafot', name: "ג'4", grade: "ג'", teacherName: 'אסתר כץ' },
  { id: 'class-rag-g2', schoolId: 'ramat-aviv-g', name: "ג'2", grade: "ג'", teacherName: 'ענת לוי' },
];

export const USERS: User[] = [
  {
    id: 'alma',
    schoolId: 'shaked',
    username: 'alma',
    password: '1234',
    role: 'student',
    fullName: 'עלמה כהן',
    firstName: 'עלמה',
    classId: 'shaked-g2',
  },
  {
    id: 'noam',
    schoolId: 'shaked',
    username: 'noam',
    password: '1234',
    role: 'student',
    fullName: 'נועם לוי',
    firstName: 'נועם',
    classId: 'shaked-g1',
  },
  {
    id: 'maya',
    schoolId: 'rakafot',
    username: 'maya',
    password: '1234',
    role: 'student',
    fullName: 'מאיה ישראלי',
    firstName: 'מאיה',
    classId: 'rakafot-g3',
  },
  {
    id: 'user-rag-alma',
    schoolId: 'ramat-aviv-g',
    username: 'alma-rag',
    password: '1234',
    role: 'student',
    fullName: 'עלמה כהן',
    firstName: 'עלמה',
    classId: 'class-rag-g2',
  },

  // ── School admins ────────────────────────────────────────────────────────────
  {
    id: 'admin-shaked',
    schoolId: 'shaked',
    username: 'admin-shaked',
    password: '1234',
    role: 'school_admin',
    fullName: 'מנהל בית ספר השקד',
    firstName: 'מנהל',
  },
  {
    id: 'admin-rakafot',
    schoolId: 'rakafot',
    username: 'admin-rakafot',
    password: '1234',
    role: 'school_admin',
    fullName: 'מנהל בית ספר הרקפות',
    firstName: 'מנהל',
  },
  {
    id: 'admin-rag',
    schoolId: 'ramat-aviv-g',
    username: 'admin-rag',
    password: '1234',
    role: 'school_admin',
    fullName: 'מנהל בית ספר רמת אביב ג׳',
    firstName: 'מנהל',
  },
];
