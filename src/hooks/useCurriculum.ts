import { useState, useCallback } from 'react';
import { Semester, Subject, Assignment, Exam, StudyMaterial, PDFFile, GRADE_SCALE } from '@/types/curriculum';

const generateId = () => Math.random().toString(36).substr(2, 9);

// Start with empty state - no mock data
const initialData: Semester[] = [];

export function useCurriculum() {
  const [semesters, setSemesters] = useState<Semester[]>(initialData);

  const getSubjectPredictedGrade = useCallback((subject: Subject): number | null => {
    const allItems = [
      ...subject.assignments,
      ...(subject.exams || []),
    ];

    if (allItems.length === 0) return null;

    let earnedPoints = 0;
    let totalWeight = 0;

    subject.assignments.forEach((assignment) => {
      if (assignment.marksObtained !== null && assignment.maxMarks > 0) {
        const percentage = (assignment.marksObtained / assignment.maxMarks) * 100;
        earnedPoints += (percentage * assignment.weight) / 100;
        totalWeight += assignment.weight;
      } else {
        earnedPoints += (assignment.confidence * assignment.weight) / 100;
        totalWeight += assignment.weight;
      }
    });

    (subject.exams || []).forEach((exam) => {
      if (exam.marksObtained !== null && exam.maxMarks > 0) {
        const percentage = (exam.marksObtained / exam.maxMarks) * 100;
        earnedPoints += (percentage * exam.weight) / 100;
        totalWeight += exam.weight;
      }
    });

    if (totalWeight === 0) return null;
    return (earnedPoints / totalWeight) * 100;
  }, []);

  const hasAtLeastOneGrade = useCallback((subject: Subject): boolean => {
    const hasAssignmentGrade = subject.assignments.some((a) => a.marksObtained !== null);
    const hasExamGrade = (subject.exams || []).some((e) => e.marksObtained !== null);
    return hasAssignmentGrade || hasExamGrade;
  }, []);

  const hasEmptyMarks = useCallback((subject: Subject): boolean => {
    const hasEmptyAssignment = subject.assignments.some((a) => a.marksObtained === null);
    const hasEmptyExam = (subject.exams || []).some((e) => e.marksObtained === null);
    return hasEmptyAssignment || hasEmptyExam;
  }, []);

  const semesterHasAllGrades = useCallback((semester: Semester): boolean => {
    if (semester.subjects.length === 0) return false;
    return semester.subjects.every((s) => hasAtLeastOneGrade(s));
  }, [hasAtLeastOneGrade]);

  const getGradePoint = useCallback((score: number): number => {
    const grade = GRADE_SCALE.find((g) => score >= g.minScore && score <= g.maxScore);
    return grade?.points ?? 0;
  }, []);

  const getLetterGrade = useCallback((score: number): string => {
    const grade = GRADE_SCALE.find((g) => score >= g.minScore && score <= g.maxScore);
    return grade?.grade ?? 'F';
  }, []);

  const getSemesterGPA = useCallback(
    (semester: Semester): number | null => {
      if (!semesterHasAllGrades(semester)) return null;

      let totalPoints = 0;
      let totalCredits = 0;

      semester.subjects.forEach((subject) => {
        const predictedGrade = getSubjectPredictedGrade(subject);
        if (predictedGrade !== null) {
          const gradePoint = getGradePoint(predictedGrade);
          totalPoints += gradePoint * subject.credits;
          totalCredits += subject.credits;
        }
      });

      if (totalCredits === 0) return null;
      return totalPoints / totalCredits;
    },
    [semesterHasAllGrades, getSubjectPredictedGrade, getGradePoint]
  );

  const getCGPA = useCallback((): number | null => {
    if (semesters.length === 0) return null;
    const allSemestersComplete = semesters.every((s) => semesterHasAllGrades(s));
    if (!allSemestersComplete) return null;

    let totalPoints = 0;
    let totalCredits = 0;

    semesters.forEach((semester) => {
      semester.subjects.forEach((subject) => {
        const predictedGrade = getSubjectPredictedGrade(subject);
        if (predictedGrade !== null) {
          const gradePoint = getGradePoint(predictedGrade);
          totalPoints += gradePoint * subject.credits;
          totalCredits += subject.credits;
        }
      });
    });

    if (totalCredits === 0) return null;
    return totalPoints / totalCredits;
  }, [semesters, semesterHasAllGrades, getSubjectPredictedGrade, getGradePoint]);

  // Semester CRUD
  const addSemester = useCallback(() => {
    const newSemester: Semester = {
      id: generateId(),
      name: 'New Semester',
      emoji: '📚',
      subjects: [],
    };
    setSemesters((prev) => [...prev, newSemester]);
  }, []);

  const updateSemester = useCallback((semesterId: string, updates: Partial<Semester>) => {
    setSemesters((prev) =>
      prev.map((semester) =>
        semester.id === semesterId ? { ...semester, ...updates } : semester
      )
    );
  }, []);

  const deleteSemester = useCallback((semesterId: string) => {
    setSemesters((prev) => prev.filter((semester) => semester.id !== semesterId));
  }, []);

  // Subject CRUD
  const addSubject = useCallback((semesterId: string) => {
    const newSubject: Subject = {
      id: generateId(),
      name: 'New Subject',
      code: 'CODE',
      credits: 3,
      assignments: [],
      exams: [
        { id: generateId(), name: 'Midsem', weight: 30, marksObtained: null, maxMarks: 100 },
        { id: generateId(), name: 'Endsem', weight: 50, marksObtained: null, maxMarks: 100 },
      ],
      materials: [],
      pdfs: [],
    };
    setSemesters((prev) =>
      prev.map((semester) =>
        semester.id === semesterId
          ? { ...semester, subjects: [...semester.subjects, newSubject] }
          : semester
      )
    );
  }, []);

  const updateSubject = useCallback(
    (semesterId: string, subjectId: string, updates: Partial<Subject>) => {
      setSemesters((prev) =>
        prev.map((semester) =>
          semester.id === semesterId
            ? {
                ...semester,
                subjects: semester.subjects.map((subject) =>
                  subject.id === subjectId ? { ...subject, ...updates } : subject
                ),
              }
            : semester
        )
      );
    },
    []
  );

  const deleteSubject = useCallback((semesterId: string, subjectId: string) => {
    setSemesters((prev) =>
      prev.map((semester) =>
        semester.id === semesterId
          ? {
              ...semester,
              subjects: semester.subjects.filter((s) => s.id !== subjectId),
            }
          : semester
      )
    );
  }, []);

  const updateAssignment = useCallback(
    (semesterId: string, subjectId: string, assignmentId: string, updates: Partial<Assignment>) => {
      setSemesters((prev) =>
        prev.map((semester) =>
          semester.id === semesterId
            ? {
                ...semester,
                subjects: semester.subjects.map((subject) =>
                  subject.id === subjectId
                    ? {
                        ...subject,
                        assignments: subject.assignments.map((assignment) =>
                          assignment.id === assignmentId
                            ? { ...assignment, ...updates }
                            : assignment
                        ),
                      }
                    : subject
                ),
              }
            : semester
        )
      );
    },
    []
  );

  const addAssignment = useCallback((semesterId: string, subjectId: string, assignment: Omit<Assignment, 'id'>) => {
    const newAssignment: Assignment = { ...assignment, id: generateId() };
    setSemesters((prev) =>
      prev.map((semester) =>
        semester.id === semesterId
          ? {
              ...semester,
              subjects: semester.subjects.map((subject) =>
                subject.id === subjectId
                  ? { ...subject, assignments: [...subject.assignments, newAssignment] }
                  : subject
              ),
            }
          : semester
      )
    );
  }, []);

  const deleteAssignment = useCallback((semesterId: string, subjectId: string, assignmentId: string) => {
    setSemesters((prev) =>
      prev.map((semester) =>
        semester.id === semesterId
          ? {
              ...semester,
              subjects: semester.subjects.map((subject) =>
                subject.id === subjectId
                  ? {
                      ...subject,
                      assignments: subject.assignments.filter((a) => a.id !== assignmentId),
                    }
                  : subject
              ),
            }
          : semester
      )
    );
  }, []);

  // Exam CRUD
  const updateExam = useCallback(
    (semesterId: string, subjectId: string, examId: string, updates: Partial<Exam>) => {
      setSemesters((prev) =>
        prev.map((semester) =>
          semester.id === semesterId
            ? {
                ...semester,
                subjects: semester.subjects.map((subject) =>
                  subject.id === subjectId
                    ? {
                        ...subject,
                        exams: (subject.exams || []).map((exam) =>
                          exam.id === examId ? { ...exam, ...updates } : exam
                        ),
                      }
                    : subject
                ),
              }
            : semester
        )
      );
    },
    []
  );

  const addExam = useCallback((semesterId: string, subjectId: string, exam: Omit<Exam, 'id'>) => {
    const newExam: Exam = { ...exam, id: generateId() };
    setSemesters((prev) =>
      prev.map((semester) =>
        semester.id === semesterId
          ? {
              ...semester,
              subjects: semester.subjects.map((subject) =>
                subject.id === subjectId
                  ? { ...subject, exams: [...(subject.exams || []), newExam] }
                  : subject
              ),
            }
          : semester
      )
    );
  }, []);

  const deleteExam = useCallback((semesterId: string, subjectId: string, examId: string) => {
    setSemesters((prev) =>
      prev.map((semester) =>
        semester.id === semesterId
          ? {
              ...semester,
              subjects: semester.subjects.map((subject) =>
                subject.id === subjectId
                  ? { ...subject, exams: (subject.exams || []).filter((e) => e.id !== examId) }
                  : subject
              ),
            }
          : semester
      )
    );
  }, []);

  // Material CRUD
  const addMaterial = useCallback(
    (semesterId: string, subjectId: string, material: Omit<StudyMaterial, 'id' | 'uploadedAt'>) => {
      const newMaterial: StudyMaterial = {
        ...material,
        id: generateId(),
        uploadedAt: new Date(),
      };
      setSemesters((prev) =>
        prev.map((semester) =>
          semester.id === semesterId
            ? {
                ...semester,
                subjects: semester.subjects.map((subject) =>
                  subject.id === subjectId
                    ? { ...subject, materials: [...(subject.materials || []), newMaterial] }
                    : subject
                ),
              }
            : semester
        )
      );
    },
    []
  );

  const updateMaterial = useCallback(
    (semesterId: string, subjectId: string, materialId: string, updates: Partial<StudyMaterial>) => {
      setSemesters((prev) =>
        prev.map((semester) =>
          semester.id === semesterId
            ? {
                ...semester,
                subjects: semester.subjects.map((subject) =>
                  subject.id === subjectId
                    ? {
                        ...subject,
                        materials: (subject.materials || []).map((m) =>
                          m.id === materialId ? { ...m, ...updates } : m
                        ),
                      }
                    : subject
                ),
              }
            : semester
        )
      );
    },
    []
  );

  const deleteMaterial = useCallback((semesterId: string, subjectId: string, materialId: string) => {
    setSemesters((prev) =>
      prev.map((semester) =>
        semester.id === semesterId
          ? {
              ...semester,
              subjects: semester.subjects.map((subject) =>
                subject.id === subjectId
                  ? {
                      ...subject,
                      materials: (subject.materials || []).filter((m) => m.id !== materialId),
                      pdfs: (subject.pdfs || []).filter((p) => p.id !== materialId),
                    }
                  : subject
              ),
            }
          : semester
      )
    );
  }, []);

  const addPDF = useCallback((semesterId: string, subjectId: string, file: File) => {
    const newPDF: PDFFile = {
      id: generateId(),
      name: file.name,
      url: URL.createObjectURL(file),
      uploadedAt: new Date(),
    };

    setSemesters((prev) =>
      prev.map((semester) =>
        semester.id === semesterId
          ? {
              ...semester,
              subjects: semester.subjects.map((subject) =>
                subject.id === subjectId
                  ? { ...subject, pdfs: [...(subject.pdfs || []), newPDF] }
                  : subject
              ),
            }
          : semester
      )
    );
  }, []);

  const deletePDF = useCallback((semesterId: string, subjectId: string, pdfId: string) => {
    setSemesters((prev) =>
      prev.map((semester) =>
        semester.id === semesterId
          ? {
              ...semester,
              subjects: semester.subjects.map((subject) =>
                subject.id === subjectId
                  ? { ...subject, pdfs: (subject.pdfs || []).filter((p) => p.id !== pdfId) }
                  : subject
              ),
            }
          : semester
      )
    );
  }, []);

  return {
    semesters,
    getSubjectPredictedGrade,
    hasAtLeastOneGrade,
    hasEmptyMarks,
    semesterHasAllGrades,
    getSemesterGPA,
    getCGPA,
    getLetterGrade,
    addSemester,
    updateSemester,
    deleteSemester,
    addSubject,
    updateSubject,
    deleteSubject,
    updateAssignment,
    addAssignment,
    deleteAssignment,
    updateExam,
    addExam,
    deleteExam,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addPDF,
    deletePDF,
  };
}
