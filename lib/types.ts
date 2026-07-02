export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'faculty' | 'admin' | 'super_admin';
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
