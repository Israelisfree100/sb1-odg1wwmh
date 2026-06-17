/**
 * Teacher permission helpers.
 * All permission checks are validated here rather than only in the UI,
 * so repositories can also call these guards.
 */
import type { User, Assignment, Exam, ClassMessage } from '../types';

/** True if the teacher is assigned to teach the given class. */
export function canTeacherManageClass(teacher: User, classId: string): boolean {
  return teacher.classIds?.includes(classId) ?? false;
}

/** True if the given subject is in the teacher's taught subjects. */
export function canTeacherManageSubject(teacher: User, subject: string): boolean {
  return teacher.subjects?.includes(subject) ?? false;
}

/** True if the teacher owns (created) this assignment. */
export function canTeacherManageAssignment(teacher: User, assignment: Assignment): boolean {
  return assignment.createdByUserId === teacher.id;
}

/** True if the teacher owns (created) this exam. */
export function canTeacherManageExam(teacher: User, exam: Exam): boolean {
  return exam.createdByUserId === teacher.id;
}

/** True if the teacher owns (created) this class message. */
export function canTeacherManageClassMessage(
  teacher: User,
  message: ClassMessage,
): boolean {
  return message.createdByUserId === teacher.id;
}

/**
 * True if the teacher may submit a school-announcement request.
 * Any teacher belonging to a school may request.
 */
export function canTeacherRequestSchoolAnnouncement(teacher: User): boolean {
  return Boolean(teacher.schoolId && teacher.role === 'teacher');
}

/**
 * True if the teacher may create/edit this assignment
 * (right class and right subject, same school).
 */
export function canTeacherCreateInClass(
  teacher: User,
  classId: string,
  subject: string,
): boolean {
  return (
    teacher.schoolId !== undefined &&
    canTeacherManageClass(teacher, classId) &&
    canTeacherManageSubject(teacher, subject)
  );
}
