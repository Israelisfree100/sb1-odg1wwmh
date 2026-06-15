import type { School, ClassGroup, User } from '../types';

export const SCHOOLS: School[] = [
  { id: 'shaked', name: 'בית ספר השקד', city: 'תל אביב' },
  { id: 'rakafot', name: 'בית ספר הרקפות', city: 'חיפה' },
];

export const CLASSES: ClassGroup[] = [
  { id: 'shaked-g1', schoolId: 'shaked', name: "ג'1", grade: "ג'", teacherName: 'שרה כהן' },
  { id: 'shaked-g2', schoolId: 'shaked', name: "ג'2", grade: "ג'", teacherName: 'רחל לוי' },
  { id: 'rakafot-g3', schoolId: 'rakafot', name: "ג'3", grade: "ג'", teacherName: 'מירי גרין' },
  { id: 'rakafot-g4', schoolId: 'rakafot', name: "ג'4", grade: "ג'", teacherName: 'אסתר כץ' },
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
];
