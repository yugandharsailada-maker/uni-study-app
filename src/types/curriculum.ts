export interface Assignment {
  id: string;
  name: string;
  weight: number;
  marksObtained: number | null;
  maxMarks: number;
  confidence: number;
}

export interface Exam {
  id: string;
  name: string;
  weight: number;
  marksObtained: number | null;
  maxMarks: number;
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

export interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  midsemWeight?: number;
  endsemWeight?: number;
  assignments: Assignment[];
  exams?: Exam[];
  materials?: StudyMaterial[];
  pdfs?: PDFFile[];
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
  maxScore: number;
  points: number;
};

export const GRADE_SCALE: GradePoint[] = [
  { grade: 'A+', minScore: 90, maxScore: 100, points: 4.0 },
  { grade: 'A', minScore: 85, maxScore: 89.99, points: 4.0 },
  { grade: 'A-', minScore: 80, maxScore: 84.99, points: 3.7 },
  { grade: 'B+', minScore: 75, maxScore: 79.99, points: 3.3 },
  { grade: 'B', minScore: 70, maxScore: 74.99, points: 3.0 },
  { grade: 'B-', minScore: 65, maxScore: 69.99, points: 2.7 },
  { grade: 'C+', minScore: 60, maxScore: 64.99, points: 2.3 },
  { grade: 'C', minScore: 55, maxScore: 59.99, points: 2.0 },
  { grade: 'C-', minScore: 50, maxScore: 54.99, points: 1.7 },
  { grade: 'D', minScore: 45, maxScore: 49.99, points: 1.0 },
  { grade: 'F', minScore: 0, maxScore: 44.99, points: 0.0 },
];
