import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export type PaperKind = 'IMPORTANT_QUESTIONS' | 'EXAM_PAPER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'faculty' | 'admin' | 'super_admin';
  year?: number | null;
  branch?: string | null;
  section?: string | null;
  regulation?: string | null;
  batchYear?: string | null;
  department?: { id: string; name: string; branch: string } | null;
}

export interface StudentSubject {
  id: string;
  name: string;
  code: string;
  year: number | null;
  regulation: string | null;
}

export interface AssignModalProps {
  sessionData: SessionData;
  rawText: string;
  onClose: () => void;
  onSuccess: (msg: string, kind: PaperKind, paperId: string) => void;
}

export type GateState = 'loading' | 'need_exam_date' | 'locked' | 'ready';

export interface Department {
  id: string;
  name: string;
  branch: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  year: string;
}

export interface Paper {
  id: string;
  subject_id: string;
  exam_type: string;
  academic_year: string;
  source: 'historical' | 'generated';
  kind: PaperKind;
}

export interface ChatInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
  questionsToday: number;
}

export interface ChatHeaderProps {
  subjectName: string;
  examType: string;
  questionsToday: number;
}

export interface Question {
  id: string;
  paper_id: string;
  question_text: string;
  mark_type: string;
}

export interface ChatSession {
  id: string;
  subject_id: string;
  subject_name: string;
  exam_type: string;
  created_at: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  rag_used?: boolean;
  actions?: {
    id: string;
    label: string;
    icon?: string;
  }[];
}

export interface Notification {
  id: string;
  type: 'new_paper' | 'syllabus_update' | 'study_recap' | 'general';
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface SessionData {
  year?: string;
  branch?: string;
  department?: string;
  departmentId?: string;
  section?: string;

  subjectId: string;
  subjectName?: string;
  subject?: Subject;

  examType: string;

  paperKind: PaperKind | null;

  hasLinkedIQ: boolean;
  linkedIQPaperId?: string;
  linkedIQExamDate?: string | null;

  linkedIQAssignment?: {
    assignedToYear: number | null;
    assignedToDepartmentId: string | null;
    assignedToSection: string | null;
  };
}

export interface ChatContainerProps {
  initialShowOverlay?: boolean;
  initialSessionId?: string;
  initialPaperId?: string;
  role?: string;
}
export interface ChatMessageProps {
  message: Message;
  onAction?: (messageId: string, actionId: string) => void;
}

export interface ChatMessagesProps {
  messages: Message[];
  isStreaming: boolean;
  onAction?: (messageId: string, actionId: string) => void;
}

export interface ChatStepOverlayProps {
  role?: string;
  onComplete: (data: { year?: string; branch?: string; department?: string; departmentId?: string; section?: string; subject: Subject; examType: string }) => void;
}

export interface DiagramCardProps {
  diagramName: string;
  pageNumber: number;
  url: string;
}

export interface AssistantMessageOptions {
  content: string;
  actions?: Message["actions"];
}

export interface EditExamDateModalProps {
  paperId: string;
  currentDate: string | null;
  subjectName: string;
  examType: string;
  onClose: () => void;
  onSaved: (newDate: string) => void;
}

export interface College {
  id: string;
  name: string;
  status: 'active' | 'suspended' | 'expired';
  studentsCount: number;
  tokenUsed: number;
  tokenLimit: number;
  expiresAt: string;
  startDate: string;
}

export interface CollegeCardProps {
  college: College;
  isExpandedVariant?: boolean;
  onUpdateLimit?: (id: string, limit: number) => void;
  onUpdateExpiry?: (id: string, date: string) => void;
  onSuspend?: (id: string) => void;
  onReactivate?: (id: string) => void;
  onManage?: (id: string) => void;
}

export interface InlineConfirmProps {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  branch: string;
  department: string;
  joined: string;
}

export interface FacultyTableRowProps {
  faculty: Faculty;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export type DepartmentOption = {
  id: string;
  name: string;
  branch: string;
};

export interface Student {
  id: string;
  name: string;
  email: string;
  year: string;
  branch: string;
  department: string;
  departmentId?: string;
  section?: string;
  joined: string;
  role?: string;
}

export interface StudentTableRowProps {
  student: Student;
  onDelete: (id: string) => void;
  onPromoteSuccess: () => void;
}


export type SubjectFormValues = {
  name: string;
  code: string;
  departmentIds: string[];
  year: string;
  regulation: string;
  files: File[];
  pdfUrl?: string | null;
  uploadMode?: "replace" | "append";
};

export type SubjectFormModalProps = {
  open: boolean;
  mode: "add" | "edit";
  title: string;
  initialValues?: Partial<SubjectFormValues>;
  isSubmitting?: boolean;
  serverError?: string;
  onClose: () => void;
  onSubmit: (values: SubjectFormValues) => Promise<void> | void;
};

export interface StatCardProps {
  value: string | number;
  label: string;
  subtext?: string;
  valueColor?: string;
}

export interface TokenUsageBarProps {
  used: number;
  limit: number;
  showLabel?: boolean;
}

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export interface AppShellProps {
  children: React.ReactNode;
  role: string;
  navItems: NavItem[];
}

export interface SidebarProps {
  role: string;
  navItems: NavItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export interface SidebarNavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
}

export interface DeleteConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface EmptyStateProps {
  icon: LucideIcon;
  heading: string;
  subtext?: string;
  action?: ReactNode;
  description?: string;

}