import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Semester, Subject, Assignment, Exam, StudyMaterial, GRADE_SCALE } from '@/types/curriculum';
import { toast } from 'sonner';

// Generate temporary IDs for optimistic updates
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function useSupabaseCurriculum() {
  const { user } = useAuth();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track pending operations for optimistic updates
  const pendingOps = useRef<Set<string>>(new Set());

  // Fetch all data from database
  const fetchData = useCallback(async () => {
    if (!user) {
      setSemesters([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch semesters
      const { data: semestersData, error: semestersError } = await supabase
        .from('semesters')
        .select('*')
        .eq('user_id', user.id)
        .order('position');

      if (semestersError) throw semestersError;

      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id);

      if (subjectsError) throw subjectsError;

      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', user.id);

      if (assignmentsError) throw assignmentsError;

      // Fetch exams
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', user.id);

      if (examsError) throw examsError;

      // Fetch study materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('study_materials')
        .select('*')
        .eq('user_id', user.id);

      if (materialsError) throw materialsError;

      // Build nested structure
      const builtSemesters: Semester[] = (semestersData || []).map((sem) => {
        const semSubjects = (subjectsData || []).filter((s) => s.semester_id === sem.id);
        
        const subjects: Subject[] = semSubjects.map((subj) => {
          const subjAssignments: Assignment[] = (assignmentsData || [])
            .filter((a) => a.subject_id === subj.id)
            .map((a) => ({
              id: a.id,
              name: a.name,
              weight: 0, // Weight is calculated from remaining
              marksObtained: a.marks_obtained,
              maxMarks: a.max_marks,
              confidence: 50,
            }));

          const subjExams: Exam[] = (examsData || [])
            .filter((e) => e.subject_id === subj.id)
            .map((e) => ({
              id: e.id,
              name: e.type === 'midsem' ? 'Midsem' : 'Endsem',
              weight: e.type === 'midsem' ? subj.midsem_weight : subj.endsem_weight,
              marksObtained: e.marks_obtained,
              maxMarks: e.max_marks,
            }));

          const subjMaterials: StudyMaterial[] = (materialsData || [])
            .filter((m) => m.subject_id === subj.id)
            .map((m) => ({
              id: m.id,
              name: m.name,
              type: 'pdf' as const,
              localPath: m.local_path,
              uploadedAt: new Date(m.created_at),
            }));

          return {
            id: subj.id,
            name: subj.name,
            code: subj.code,
            credits: subj.credits,
            midsemWeight: subj.midsem_weight,
            endsemWeight: subj.endsem_weight,
            assignments: subjAssignments,
            exams: subjExams,
            materials: subjMaterials,
            pdfs: [],
          };
        });

        return {
          id: sem.id,
          name: sem.name,
          emoji: sem.emoji || '📚',
          subjects,
        };
      });

      setSemesters(builtSemesters);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate weighted aggregate score for a subject
  const getSubjectPredictedGrade = useCallback((subject: Subject): number | null => {
    const midsemWeight = subject.midsemWeight ?? 20;
    const endsemWeight = subject.endsemWeight ?? 40;
    const remainingWeight = 100 - midsemWeight - endsemWeight;

    let totalScore = 0;
    let hasAnyGrade = false;

    // Calculate midsem contribution
    const midsem = (subject.exams || []).find((e) => e.name === 'Midsem');
    if (midsem && midsem.marksObtained !== null && midsem.maxMarks > 0) {
      totalScore += (midsem.marksObtained / midsem.maxMarks) * midsemWeight;
      hasAnyGrade = true;
    }

    // Calculate endsem contribution
    const endsem = (subject.exams || []).find((e) => e.name === 'Endsem');
    if (endsem && endsem.marksObtained !== null && endsem.maxMarks > 0) {
      totalScore += (endsem.marksObtained / endsem.maxMarks) * endsemWeight;
      hasAnyGrade = true;
    }

    // Calculate assignment contribution using weighted aggregate
    // AssignmentScore = (Total Marks Obtained / Total Max Marks) × RemainingWeight
    const assignments = subject.assignments || [];
    let totalObtained = 0;
    let totalMax = 0;

    assignments.forEach((a) => {
      if (a.marksObtained !== null && a.maxMarks > 0) {
        totalObtained += a.marksObtained;
        totalMax += a.maxMarks;
        hasAnyGrade = true;
      }
    });

    if (totalMax > 0) {
      totalScore += (totalObtained / totalMax) * remainingWeight;
    }

    if (!hasAnyGrade) return null;
    return totalScore;
  }, []);

  const hasAtLeastOneGrade = useCallback((subject: Subject): boolean => {
    const hasAssignmentGrade = subject.assignments.some((a) => a.marksObtained !== null);
    const hasExamGrade = (subject.exams || []).some((e) => e.marksObtained !== null);
    return hasAssignmentGrade || hasExamGrade;
  }, []);

  const hasEmptyMarks = useCallback((subject: Subject): boolean => {
    // Only show notification if there are assignments AND at least one is incomplete
    const assignments = subject.assignments || [];
    const exams = subject.exams || [];
    
    // If no assignments and exams, return false (no dot)
    if (assignments.length === 0 && exams.length === 0) return false;
    
    const hasEmptyAssignment = assignments.some((a) => a.marksObtained === null);
    const hasEmptyExam = exams.some((e) => e.marksObtained === null);
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

  // Semester CRUD with Optimistic Updates
  const addSemester = useCallback(async () => {
    if (!user) return;

    const tempId = generateTempId();
    const position = semesters.length;
    const newSemester: Semester = {
      id: tempId,
      name: 'New Semester',
      emoji: '📚',
      subjects: [],
    };

    // Optimistic update - add immediately
    setSemesters((prev) => [...prev, newSemester]);

    try {
      const { data, error } = await supabase
        .from('semesters')
        .insert({ user_id: user.id, name: 'New Semester', emoji: '📚', position })
        .select()
        .single();

      if (error) throw error;

      // Replace temp ID with real ID
      setSemesters((prev) =>
        prev.map((s) =>
          s.id === tempId ? { ...s, id: data.id } : s
        )
      );
    } catch (error) {
      // Rollback on error
      setSemesters((prev) => prev.filter((s) => s.id !== tempId));
      toast.error('Failed to create semester');
    }
  }, [user, semesters.length]);

  const updateSemester = useCallback(async (semesterId: string, updates: Partial<Semester>) => {
    const { error } = await supabase
      .from('semesters')
      .update({ name: updates.name, emoji: updates.emoji })
      .eq('id', semesterId);

    if (error) {
      toast.error('Failed to update semester');
      return;
    }

    setSemesters((prev) =>
      prev.map((s) => (s.id === semesterId ? { ...s, ...updates } : s))
    );
  }, []);

  const deleteSemester = useCallback(async (semesterId: string) => {
    const { error } = await supabase.from('semesters').delete().eq('id', semesterId);

    if (error) {
      toast.error('Failed to delete semester');
      return;
    }

    setSemesters((prev) => prev.filter((s) => s.id !== semesterId));
  }, []);

  // Subject CRUD with Optimistic Updates
  const addSubject = useCallback(async (semesterId: string) => {
    if (!user) return;

    const tempId = generateTempId();
    const newSubject: Subject = {
      id: tempId,
      name: 'New Subject',
      code: 'CODE',
      credits: 3,
      midsemWeight: 20,
      endsemWeight: 40,
      assignments: [],
      exams: [
        { id: `${tempId}_midsem`, name: 'Midsem', weight: 20, marksObtained: null, maxMarks: 100 },
        { id: `${tempId}_endsem`, name: 'Endsem', weight: 40, marksObtained: null, maxMarks: 100 },
      ],
      materials: [],
      pdfs: [],
    };

    // Optimistic update - add immediately
    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id === semesterId
          ? { ...sem, subjects: [...sem.subjects, newSubject] }
          : sem
      )
    );

    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert({
          semester_id: semesterId,
          user_id: user.id,
          name: 'New Subject',
          code: 'CODE',
          credits: 3,
          midsem_weight: 20,
          endsem_weight: 40,
        })
        .select()
        .single();

      if (error) throw error;

      // Create default exams
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .insert([
          { subject_id: data.id, user_id: user.id, type: 'midsem', max_marks: 100 },
          { subject_id: data.id, user_id: user.id, type: 'endsem', max_marks: 100 },
        ])
        .select();

      if (examsError) throw examsError;

      // Replace temp IDs with real IDs
      setSemesters((prev) =>
        prev.map((sem) =>
          sem.id === semesterId
            ? {
                ...sem,
                subjects: sem.subjects.map((s) =>
                  s.id === tempId
                    ? {
                        ...s,
                        id: data.id,
                        exams: examsData.map((e) => ({
                          id: e.id,
                          name: e.type === 'midsem' ? 'Midsem' : 'Endsem',
                          weight: e.type === 'midsem' ? 20 : 40,
                          marksObtained: e.marks_obtained,
                          maxMarks: e.max_marks,
                        })),
                      }
                    : s
                ),
              }
            : sem
        )
      );
    } catch (error) {
      // Rollback on error
      setSemesters((prev) =>
        prev.map((sem) =>
          sem.id === semesterId
            ? { ...sem, subjects: sem.subjects.filter((s) => s.id !== tempId) }
            : sem
        )
      );
      toast.error('Failed to create subject');
    }
  }, [user]);

  const updateSubject = useCallback(async (semesterId: string, subjectId: string, updates: Partial<Subject>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.code !== undefined) dbUpdates.code = updates.code;
    if (updates.credits !== undefined) dbUpdates.credits = updates.credits;
    if (updates.midsemWeight !== undefined) dbUpdates.midsem_weight = updates.midsemWeight;
    if (updates.endsemWeight !== undefined) dbUpdates.endsem_weight = updates.endsemWeight;

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from('subjects').update(dbUpdates).eq('id', subjectId);
      if (error) {
        toast.error('Failed to update subject');
        return;
      }
    }

    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id === semesterId
          ? {
              ...sem,
              subjects: sem.subjects.map((s) => (s.id === subjectId ? { ...s, ...updates } : s)),
            }
          : sem
      )
    );
  }, []);

  const deleteSubject = useCallback(async (semesterId: string, subjectId: string) => {
    const { error } = await supabase.from('subjects').delete().eq('id', subjectId);

    if (error) {
      toast.error('Failed to delete subject');
      return;
    }

    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id === semesterId
          ? { ...sem, subjects: sem.subjects.filter((s) => s.id !== subjectId) }
          : sem
      )
    );
  }, []);

  // Assignment CRUD with Optimistic Updates
  const addAssignment = useCallback(async (semesterId: string, subjectId: string, assignment: Omit<Assignment, 'id'>) => {
    if (!user) return;

    const tempId = generateTempId();
    const newAssignment: Assignment = {
      id: tempId,
      name: assignment.name,
      weight: assignment.weight || 0,
      marksObtained: assignment.marksObtained,
      maxMarks: assignment.maxMarks,
      confidence: assignment.confidence || 50,
    };

    // Optimistic update - add immediately
    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id === semesterId
          ? {
              ...sem,
              subjects: sem.subjects.map((s) =>
                s.id === subjectId ? { ...s, assignments: [...s.assignments, newAssignment] } : s
              ),
            }
          : sem
      )
    );

    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          subject_id: subjectId,
          user_id: user.id,
          name: assignment.name,
          marks_obtained: assignment.marksObtained,
          max_marks: assignment.maxMarks,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp ID with real ID
      setSemesters((prev) =>
        prev.map((sem) =>
          sem.id === semesterId
            ? {
                ...sem,
                subjects: sem.subjects.map((s) =>
                  s.id === subjectId
                    ? {
                        ...s,
                        assignments: s.assignments.map((a) =>
                          a.id === tempId ? { ...a, id: data.id } : a
                        ),
                      }
                    : s
                ),
              }
            : sem
        )
      );
    } catch (error) {
      // Rollback on error
      setSemesters((prev) =>
        prev.map((sem) =>
          sem.id === semesterId
            ? {
                ...sem,
                subjects: sem.subjects.map((s) =>
                  s.id === subjectId
                    ? { ...s, assignments: s.assignments.filter((a) => a.id !== tempId) }
                    : s
                ),
              }
            : sem
        )
      );
      toast.error('Failed to create assignment');
    }
  }, [user]);

  const updateAssignment = useCallback(async (semesterId: string, subjectId: string, assignmentId: string, updates: Partial<Assignment>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.marksObtained !== undefined) dbUpdates.marks_obtained = updates.marksObtained;
    if (updates.maxMarks !== undefined) dbUpdates.max_marks = updates.maxMarks;

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from('assignments').update(dbUpdates).eq('id', assignmentId);
      if (error) {
        toast.error('Failed to update assignment');
        return;
      }
    }

    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id === semesterId
          ? {
              ...sem,
              subjects: sem.subjects.map((s) =>
                s.id === subjectId
                  ? {
                      ...s,
                      assignments: s.assignments.map((a) => (a.id === assignmentId ? { ...a, ...updates } : a)),
                    }
                  : s
              ),
            }
          : sem
      )
    );
  }, []);

  const deleteAssignment = useCallback(async (semesterId: string, subjectId: string, assignmentId: string) => {
    const { error } = await supabase.from('assignments').delete().eq('id', assignmentId);

    if (error) {
      toast.error('Failed to delete assignment');
      return;
    }

    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id === semesterId
          ? {
              ...sem,
              subjects: sem.subjects.map((s) =>
                s.id === subjectId ? { ...s, assignments: s.assignments.filter((a) => a.id !== assignmentId) } : s
              ),
            }
          : sem
      )
    );
  }, []);

  // Exam CRUD
  const updateExam = useCallback(async (semesterId: string, subjectId: string, examId: string, updates: Partial<Exam>) => {
    const dbUpdates: any = {};
    if (updates.marksObtained !== undefined) dbUpdates.marks_obtained = updates.marksObtained;
    if (updates.maxMarks !== undefined) dbUpdates.max_marks = updates.maxMarks;

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from('exams').update(dbUpdates).eq('id', examId);
      if (error) {
        toast.error('Failed to update exam');
        return;
      }
    }

    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id === semesterId
          ? {
              ...sem,
              subjects: sem.subjects.map((s) =>
                s.id === subjectId
                  ? {
                      ...s,
                      exams: (s.exams || []).map((e) => (e.id === examId ? { ...e, ...updates } : e)),
                    }
                  : s
              ),
            }
          : sem
      )
    );
  }, []);

  // Material CRUD
  const addMaterial = useCallback(async (semesterId: string, subjectId: string, material: Omit<StudyMaterial, 'id' | 'uploadedAt'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('study_materials')
      .insert({
        subject_id: subjectId,
        user_id: user.id,
        name: material.name,
        local_path: material.localPath,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add study material');
      return;
    }

    const newMaterial: StudyMaterial = {
      id: data.id,
      name: data.name,
      type: 'pdf',
      localPath: data.local_path,
      uploadedAt: new Date(data.created_at),
    };

    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id === semesterId
          ? {
              ...sem,
              subjects: sem.subjects.map((s) =>
                s.id === subjectId ? { ...s, materials: [...(s.materials || []), newMaterial] } : s
              ),
            }
          : sem
      )
    );
  }, [user]);

  const updateMaterial = useCallback(async (semesterId: string, subjectId: string, materialId: string, updates: Partial<StudyMaterial>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.localPath !== undefined) dbUpdates.local_path = updates.localPath;

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from('study_materials').update(dbUpdates).eq('id', materialId);
      if (error) {
        toast.error('Failed to update study material');
        return;
      }
    }

    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id === semesterId
          ? {
              ...sem,
              subjects: sem.subjects.map((s) =>
                s.id === subjectId
                  ? {
                      ...s,
                      materials: (s.materials || []).map((m) => (m.id === materialId ? { ...m, ...updates } : m)),
                    }
                  : s
              ),
            }
          : sem
      )
    );
  }, []);

  const deleteMaterial = useCallback(async (semesterId: string, subjectId: string, materialId: string) => {
    const { error } = await supabase.from('study_materials').delete().eq('id', materialId);

    if (error) {
      toast.error('Failed to delete study material');
      return;
    }

    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id === semesterId
          ? {
              ...sem,
              subjects: sem.subjects.map((s) =>
                s.id === subjectId ? { ...s, materials: (s.materials || []).filter((m) => m.id !== materialId) } : s
              ),
            }
          : sem
      )
    );
  }, []);

  return {
    semesters,
    loading,
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
    addAssignment,
    updateAssignment,
    deleteAssignment,
    updateExam,
    addMaterial,
    updateMaterial,
    deleteMaterial,
  };
}
