import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FolderOpen, LogOut, GraduationCap } from 'lucide-react';
import { Header } from '@/components/Header';
import { SemesterBlock } from '@/components/SemesterBlock';
import { SubjectModal } from '@/components/SubjectModal';
import { DeleteSemesterDialog } from '@/components/DeleteSemesterDialog';
import { useSupabaseCurriculum } from '@/hooks/useSupabaseCurriculum';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Subject } from '@/types/curriculum';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const {
    semesters,
    loading: dataLoading,
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
    addMaterial,
    updateMaterial,
    deleteMaterial,
  } = useSupabaseCurriculum();

  const [selectedSubject, setSelectedSubject] = useState<{
    subject: Subject;
    semesterId: string;
  } | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    semesterId: string;
    semesterName: string;
  }>({ isOpen: false, semesterId: '', semesterName: '' });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const cgpa = getCGPA();

  const handleDeleteSemester = (semesterId: string, semesterName: string) => {
    setDeleteDialog({ isOpen: true, semesterId, semesterName });
  };

  const confirmDeleteSemester = () => {
    deleteSemester(deleteDialog.semesterId);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Get the latest subject data from state
  const currentSubject = selectedSubject
    ? semesters
        .find((s) => s.id === selectedSubject.semesterId)
        ?.subjects.find((sub) => sub.id === selectedSubject.subject.id)
    : null;

  // Show loading while checking auth
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <GraduationCap className="h-12 w-12 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header cgpa={cgpa} theme={theme} onToggleTheme={toggleTheme}>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </Header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex items-end justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Academic Overview</h1>
            <p className="text-muted-foreground">
              Track your progress, manage assignments, and predict your grades.
            </p>
          </div>
          {semesters.length > 0 && (
            <Button onClick={addSemester} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Semester
            </Button>
          )}
        </motion.div>

        {semesters.map((semester, index) => (
          <motion.div
            key={semester.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
          >
            <SemesterBlock
              semester={semester}
              semesterGPA={getSemesterGPA(semester)}
              hasAllGrades={semesterHasAllGrades(semester)}
              getSubjectPredictedGrade={getSubjectPredictedGrade}
              hasAtLeastOneGrade={hasAtLeastOneGrade}
              hasEmptyMarks={hasEmptyMarks}
              getLetterGrade={getLetterGrade}
              onSubjectClick={(subject) =>
                setSelectedSubject({ subject, semesterId: semester.id })
              }
              onUpdateSemester={(updates) => updateSemester(semester.id, updates)}
              onDeleteSemester={() => handleDeleteSemester(semester.id, semester.name)}
              onAddSubject={() => addSubject(semester.id)}
              onUpdateSubject={(subjectId, updates) =>
                updateSubject(semester.id, subjectId, updates)
              }
              onDeleteSubject={(subjectId) => deleteSubject(semester.id, subjectId)}
            />
          </motion.div>
        ))}

        {/* Empty state */}
        {semesters.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="p-4 rounded-2xl surface-sunken mb-4">
              <FolderOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No semesters yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Get started by creating your first semester to track your academic progress.
            </p>
            <Button onClick={addSemester} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Semester
            </Button>
          </motion.div>
        )}
      </main>

      {/* Subject Modal */}
      {selectedSubject && currentSubject && (
        <SubjectModal
          subject={currentSubject}
          semesterId={selectedSubject.semesterId}
          predictedGrade={getSubjectPredictedGrade(currentSubject)}
          letterGrade={
            getSubjectPredictedGrade(currentSubject) !== null
              ? getLetterGrade(getSubjectPredictedGrade(currentSubject)!)
              : 'N/A'
          }
          onClose={() => setSelectedSubject(null)}
          onUpdateAssignment={(assignmentId, updates) =>
            updateAssignment(
              selectedSubject.semesterId,
              currentSubject.id,
              assignmentId,
              updates
            )
          }
          onAddAssignment={(assignment) =>
            addAssignment(
              selectedSubject.semesterId,
              currentSubject.id,
              assignment
            )
          }
          onDeleteAssignment={(assignmentId) =>
            deleteAssignment(
              selectedSubject.semesterId,
              currentSubject.id,
              assignmentId
            )
          }
          onUpdateExam={(examId, updates) =>
            updateExam(
              selectedSubject.semesterId,
              currentSubject.id,
              examId,
              updates
            )
          }
          onAddMaterial={(material) =>
            addMaterial(selectedSubject.semesterId, currentSubject.id, material)
          }
          onUpdateMaterial={(materialId, updates) =>
            updateMaterial(selectedSubject.semesterId, currentSubject.id, materialId, updates)
          }
          onDeleteMaterial={(materialId) =>
            deleteMaterial(selectedSubject.semesterId, currentSubject.id, materialId)
          }
        />
      )}

      {/* Delete Semester Dialog */}
      <DeleteSemesterDialog
        semesterName={deleteDialog.semesterName}
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, semesterId: '', semesterName: '' })}
        onConfirm={confirmDeleteSemester}
      />
    </div>
  );
};

export default Index;
