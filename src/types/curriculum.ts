export interface Assignment {
  id: string;
  name: string;
  weight: number;
  marksObtained: number | null;
  maxMarks: number;
  confidence: number;
  dueDate?: Date;
}

export interface Exam {
  id: string;
  name: string;
  weight: number;
  marksObtained: number | null;
  maxMarks: number;
  date?: Date;
}

export interface StudyMaterial {
  id: string;
  name: string;
  localPath?: string;
  type: 'pdf' | 'image' | 'link';
  uploadedAt: Date;
}

export interface PDFFile {
  id: string;
  name: string;
  url: string;
  uploadedAt: Date;
}

export interface Topic {
  id: string;
  title: string;
  importance: 'high' | 'medium' | 'low';
  estimatedHours: number;
  completed: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  color?: string; // Added color
  credits: number;
  midsemWeight?: number;
  endsemWeight?: number;
  assignments: Assignment[];
  exams?: Exam[];
  materials?: StudyMaterial[];
  pdfs?: PDFFile[];
  topics?: Topic[];
  draft_topics?: Topic[];
}

export interface Semester {
  id: string;
  name: string;
  emoji?: string;
  subjects: Subject[];
}

export type GradePoint = {
  grade: string;
  minScore: number;
  points: number;
};

export const GRADE_SCALE: GradePoint[] = [
  { grade: 'S', minScore: 90, points: 10.0 },
  { grade: 'A', minScore: 80, points: 9.0 },
  { grade: 'B', minScore: 70, points: 8.0 },
  { grade: 'C', minScore: 60, points: 7.0 },
  { grade: 'D', minScore: 50, points: 6.0 },
  { grade: 'E', minScore: 40, points: 5.0 },
  { grade: 'F', minScore: 0, points: 0.0 },
];
