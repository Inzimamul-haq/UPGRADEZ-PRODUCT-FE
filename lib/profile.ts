import { User } from '@/lib/types';

export function isStudentProfileComplete(user: User | null): boolean {
  if (!user || user.role !== 'student') return false;
  return !!(
    user.department?.id &&
    user.year &&
    user.regulation &&
    user.batchYear &&
    user.section
  );
}

export function isStudentProfileReadyForSubjects(user: User | null): boolean {
  if (!user || user.role !== 'student') return false;
  return !!(user.department?.id && user.year && user.regulation);
}
