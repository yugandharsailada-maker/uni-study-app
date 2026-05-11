import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Semester, Subject, Assignment, Exam, StudyMaterial, GRADE_SCALE } from '@/types/curriculum';
import { toast } from 'sonner';
import * as GradeLib from '@/lib/grades';

// Generate temporary IDs for optimistic updates
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

interface DBAssignment {
  id: string;
  name: string;
  marks_obtained: number | null;
  max_marks: number;
  due_date: string | null;
  weight: number;
  confidence: number;
}

interface DBExam {
  id: string;
  type: string;
  marks_obtained: number | null;
  max_marks: number;
  date: string | null;
}

interface DBStudyMaterial {
  id: string;
  name: string;
  local_path: string;
  created_at: string;
}

interface DBSubject {
  id: string;
  name: string;
  code: string;
  credits: number;
  midsem_weight: number;
  endsem_weight: number;
  assignments: DBAssignment[];
  exams: DBExam[];
  study_materials: DBStudyMaterial[];
}

export function useSupabaseCurriculum() {
  const { user, isGuestMode } = useAuth();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulation State
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [simulatedGrades, setSimulatedGrades] = useState<Record<string, string>>({});

  // Track pending operations for optimistic updates
  const pendingOps = useRef<Set<string>>(new Set());

  // Fetch all data from database - optimized with parallel queries
  const fetchData = useCallback(async () => {
    if (!user && !isGuestMode) {
      setSemesters([]);
      setLoading(false);
      return;
    }

    if (isGuestMode) {
      const saved = localStorage.getItem('guest_semesters');
      if (saved) {
        setSemesters(JSON.parse(saved));
      }
      setLoading(false);
      return;
    }

    try {
      // Fetch all data in a single relational query for maximum performance
      const { data: semestersData, error: semestersError } = await supabase
        .from('semesters')
        .select(`
          id,
          name,
          emoji,
          position,
          subjects (
            id,
            name,
            code,
            credits,
            midsem_weight,
            endsem_weight,
            assignments (
              id,
              name,
              marks_obtained,
              max_marks,
              due_date,
              weight,
              confidence
            ),
            exams (
              id,
              type,
              marks_obtained,
              max_marks,
              date
            ),
            study_materials (
              id,
              name,
              local_path,
              created_at
            )
          )
        `)
        .eq('user_id', user!.id)
        .order('position');

      if (semestersError) throw semestersError;

      // Build nested structure from the single response
      const builtSemesters: Semester[] = (semestersData || []).map((sem) => {
        const subjects: Subject[] = (sem.subjects as unknown as DBSubject[]).map((subj) => {
          const subjAssignments: Assignment[] = (subj.assignments || []).map((a) => ({
            id: a.id,
            name: a.name,
            weight: a.weight,
            marksObtained: a.marks_obtained,
            maxMarks: a.max_marks,
            confidence: a.confidence,
            dueDate: a.due_date ? new Date(a.due_date) : undefined
          }));

          const subjExams: Exam[] = (subj.exams || []).map((e) => ({
            id: e.id,
            name: e.type === 'midsem' ? 'Midsem' : 'Endsem',
            weight: e.type === 'midsem' ? subj.midsem_weight : subj.endsem_weight,
            marksObtained: e.marks_obtained,
            maxMarks: e.max_marks,
            date: e.date ? new Date(e.date) : undefined
          }));

          const subjMaterials: StudyMaterial[] = (subj.study_materials || []).map((m) => ({
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
    } catch (error: unknown) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user, isGuestMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save guest data on change
  useEffect(() => {
    if (isGuestMode) {
      localStorage.setItem('guest_semesters', JSON.stringify(semesters));
    }
  }, [semesters, isGuestMode]);

  // Simulation Controls
  const toggleSimulationMode = useCallback(() => {
    setIsSimulationMode(prev => !prev);
  }, []);

  const setSimulatedGrade = useCallback((subjectId: string, grade: string) => {
    setSimulatedGrades(prev => ({
      ...prev,
      [subjectId]: grade
    }));
  }, []);

  const resetSimulation = useCallback(() => {
    setSimulatedGrades({});
    setIsSimulationMode(false);
  }, []);

  // Helper to get points from letter grade
  const getPointsFromLetterGrade = useCallback((grade: string): number => {
    return GradeLib.getPointsFromLetterGrade(grade);
  }, []);

  // Calculate weighted aggregate score for a subject
  const getSubjectPredictedGrade = useCallback((subject: Subject): number | null => {
    return GradeLib.getSubjectPredictedGrade(subject);
  }, []);

  const hasAtLeastOneGrade = useCallback((subject: Subject): boolean => {
    return GradeLib.hasAtLeastOneGrade(subject);
  }, []);

  const hasEmptyMarks = useCallback((subject: Subject): boolean => {
    return GradeLib.hasEmptyMarks(subject);
  }, []);

  const semesterHasAllGrades = useCallback((semester: Semester): boolean => {
    return GradeLib.semesterHasAllGrades(semester);
  }, []);

  const getGradePoint = useCallback((score: number): number => {
    return GradeLib.getGradePoint(score);
  }, []);

  const getLetterGrade = useCallback((score: number): string => {
    return GradeLib.getLetterGrade(score);
  }, []);

  // Note: These depend on isSimulationMode/simulatedGrades state, so they must update when *that* changes.
  // BUT they don't need to depend on `semesters` anymore because they take the semester data as an argument!
  const getSemesterGPA = useCallback(
    (semester: Semester, forceAuthentic = false): number | null => {
      // Pass the current simulation state to the pure function
      return GradeLib.getSemesterGPA(semester, simulatedGrades, isSimulationMode && !forceAuthentic);
    },
    [isSimulationMode, simulatedGrades]
  );

  const getCGPA = useCallback((forceAuthentic = false): number | null => {
    // This one DOES depend on `semesters` state because it aggregates *all* semesters from the hook state.
    // However, for pure stability in children, maybe we should pass semesters as an arg? 
    // For now, let's just use the lib function.
    return GradeLib.getCGPA(semesters, simulatedGrades, isSimulationMode && !forceAuthentic);
  }, [semesters, isSimulationMode, simulatedGrades]);

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

    if (isGuestMode) {
      toast.success('Semester created successfully (Guest Mode)');
      return;
    }

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
      toast.success('Semester created successfully');
    } catch (error) {
      // Rollback on error
      setSemesters((prev) => prev.filter((s) => s.id !== tempId));
      toast.error('Failed to create semester');
    }
  }, [user, semesters.length]);

  const updateSemester = useCallback(async (semesterId: string, updates: Partial<Semester>) => {
    if (isGuestMode) {
      setSemesters((prev) =>
        prev.map((s) => (s.id === semesterId ? { ...s, ...updates } : s))
      );
      return;
    }

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
    if (isGuestMode) {
      setSemesters((prev) => prev.filter((s) => s.id !== semesterId));
      toast.success('Semester deleted (Guest Mode)');
      return;
    }

    const { error } = await supabase.from('semesters').delete().eq('id', semesterId);

    if (error) {
      toast.error('Failed to delete semester');
      return;
    }

    setSemesters((prev) => prev.filter((s) => s.id !== semesterId));
    toast.success('Semester deleted');
  }, []);

  // Track adding state to prevent duplicates
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  // Bulk add subjects for AI import
  const bulkAddSubjects = useCallback(async (semesterId: string, subjectsData: Array<{ name: string; code: string; credits: number; midsem_weight: number; endsem_weight: number }>) => {
    if (!user || subjectsData.length === 0) return;

    const subjectsWithTempIds = subjectsData.map(s => {
      const tempId = generateTempId();
      return {
        ...s,
        id: tempId,
        semester_id: semesterId,
        user_id: user.id,
        assignments: [],
        exams: [
          { id: `${tempId}_midsem`, name: 'Midsem', weight: s.midsem_weight, marksObtained: null, maxMarks: 30 },
          { id: `${tempId}_endsem`, name: 'Endsem', weight: s.endsem_weight, marksObtained: null, maxMarks: 50 },
        ],
        materials: [],
        pdfs: [],
      };
    });

    // Optimistic update
    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id === semesterId
          ? { ...sem, subjects: [...sem.subjects, ...subjectsWithTempIds as unknown as Subject[]] }
          : sem
      )
    );

    try {
      const insertData = subjectsData.map(s => ({
        semester_id: semesterId,
        user_id: user.id,
        name: s.name,
        code: s.code,
        credits: s.credits,
        midsem_weight: s.midsem_weight,
        endsem_weight: s.endsem_weight
      }));

      const { data, error } = await supabase
        .from('subjects')
        .insert(insertData)
        .select();

      if (error) throw error;

      // Replace temp IDs with real IDs
      setSemesters((prev) =>
        prev.map((sem) => {
          if (sem.id !== semesterId) return sem;
          const updatedSubjects = sem.subjects.map(subj => {
            const match = (data as { code: string; name: string; id: string }[]).find(d => d.code === subj.code && d.name === subj.name);
            return match ? { ...subj, id: match.id } : subj;
          });
          return { ...sem, subjects: updatedSubjects };
        })
      );
    } catch (error) {
      // Fetch fresh data on error to be safe
      fetchData();
      toast.error('Failed to import some subjects');
    }
  }, [user, fetchData]);

  // Subject CRUD with Optimistic Updates
  const addSubject = useCallback(async (semesterId: string) => {
    if (!user || isAddingSubject) return;

    setIsAddingSubject(true);
    const tempId = generateTempId();
    const newSubject: Subject = {
      id: tempId,
      name: 'New Subject',
      code: 'CODE',
      credits: 3,
      midsemWeight: 30,
      endsemWeight: 50,
      assignments: [],
      exams: [
        { id: `${tempId}_midsem`, name: 'Midsem', weight: 30, marksObtained: null, maxMarks: 30 },
        { id: `${tempId}_endsem`, name: 'Endsem', weight: 50, marksObtained: null, maxMarks: 50 },
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
          midsem_weight: 30,
          endsem_weight: 50,
        })
        .select()
        .single();

      if (error) throw error;

      // Create default exams
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .insert([
          { subject_id: data.id, user_id: user.id, type: 'midsem', max_marks: 30 },
          { subject_id: data.id, user_id: user.id, type: 'endsem', max_marks: 50 },
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
      toast.success('Subject created successfully');
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
    } finally {
      setIsAddingSubject(false);
    }
  }, [user, isAddingSubject]);

  const updateSubject = useCallback(async (semesterId: string, subjectId: string, updates: Partial<Subject>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.code !== undefined) dbUpdates.code = updates.code;
    if (updates.credits !== undefined) dbUpdates.credits = updates.credits;
    if (updates.midsemWeight !== undefined) dbUpdates.midsem_weight = updates.midsemWeight;
    if (updates.endsemWeight !== undefined) dbUpdates.endsem_weight = updates.endsemWeight;

    if (isGuestMode) {
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
      return;
    }

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
    if (isGuestMode) {
      setSemesters((prev) =>
        prev.map((sem) =>
          sem.id === semesterId
            ? { ...sem, subjects: sem.subjects.filter((s) => s.id !== subjectId) }
            : sem
        )
      );
      toast.success('Subject deleted (Guest Mode)');
      return;
    }

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
      weight: assignment.weight,
      marksObtained: assignment.marksObtained,
      maxMarks: assignment.maxMarks || 20,
      confidence: assignment.confidence,
      dueDate: assignment.dueDate,
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
          max_marks: assignment.maxMarks || 20,
          weight: assignment.weight,
          confidence: assignment.confidence,
          due_date: assignment.dueDate ? assignment.dueDate.toISOString() : null,
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
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.marksObtained !== undefined) dbUpdates.marks_obtained = updates.marksObtained;
    if (updates.maxMarks !== undefined) dbUpdates.max_marks = updates.maxMarks;
    if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
    if (updates.confidence !== undefined) dbUpdates.confidence = updates.confidence;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate ? updates.dueDate.toISOString() : null;

    if (isGuestMode) {
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
      return;
    }

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
    if (isGuestMode) {
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
      toast.success('Assignment deleted (Guest Mode)');
      return;
    }

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
    if (isGuestMode) {
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
      return;
    }

    const dbUpdates: Record<string, unknown> = {};
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
    if (!user && !isGuestMode) return;

    if (isGuestMode) {
      const newMaterial: StudyMaterial = {
        id: generateTempId(),
        name: material.name,
        type: 'pdf',
        localPath: material.localPath,
        uploadedAt: new Date(),
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
      return;
    }

    const { data, error } = await supabase
      .from('study_materials')
      .insert({
        subject_id: subjectId,
        user_id: user!.id,
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
    const dbUpdates: Record<string, unknown> = {};
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
    isSimulationMode,
    simulatedGrades,
    getSubjectPredictedGrade,
    hasAtLeastOneGrade,
    hasEmptyMarks,
    semesterHasAllGrades,
    getSemesterGPA,
    getCGPA,
    getLetterGrade,
    toggleSimulationMode,
    setSimulatedGrade,
    resetSimulation,
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
    bulkAddSubjects,
  };
}
