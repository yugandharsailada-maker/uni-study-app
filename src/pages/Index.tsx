import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FolderOpen, GraduationCap } from 'lucide-react';
import { Header } from '@/components/Header';
import { SemesterBlock } from '@/components/SemesterBlock';
import { SemesterSection } from '@/components/SemesterSection';
import { SubjectModal } from '@/components/SubjectModal';
import { DeleteSemesterDialog } from '@/components/DeleteSemesterDialog';
import { SettingsSidebar } from '@/components/SettingsSidebar';
import { ProfileSidebar } from '@/components/ProfileSidebar';
import { useSupabaseCurriculum } from '@/hooks/useSupabaseCurriculum';
import { useTheme } from '@/hooks/useTheme';
import { useWallpaper } from '@/hooks/useWallpaper';
import { useAuth } from '@/contexts/AuthContext';
import { Subject } from '@/types/curriculum';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  const { wallpaper, setWallpaper } = useWallpaper();
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

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Memoize expensive calculations
  const cgpa = useMemo(() => getCGPA(), [semesters, getCGPA]);

  const handleDeleteSemester = useCallback((semesterId: string, semesterName: string) => {
    setDeleteDialog({ isOpen: true, semesterId, semesterName });
  }, []);

  const confirmDeleteSemester = useCallback(() => {
    deleteSemester(deleteDialog.semesterId);
  }, [deleteSemester, deleteDialog.semesterId]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/auth');
  }, [signOut, navigate]);

  // Get the latest subject data from state - memoized
  const currentSubject = useMemo(() => {
    if (!selectedSubject) return null;
    return semesters
      .find((s) => s.id === selectedSubject.semesterId)
      ?.subjects.find((sub) => sub.id === selectedSubject.subject.id) || null;
  }, [selectedSubject, semesters]);

  // Memoize subject modal props to prevent unnecessary re-renders
  const subjectModalProps = useMemo(() => {
    if (!currentSubject) return null;
    const predictedGrade = getSubjectPredictedGrade(currentSubject);
    return {
      predictedGrade,
      letterGrade: predictedGrade !== null ? getLetterGrade(predictedGrade) : 'N/A',
    };
  }, [currentSubject, getSubjectPredictedGrade, getLetterGrade]);

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
    <div className="min-h-screen bg-background relative">
      {/* Wallpaper layer */}
      {wallpaper && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${wallpaper})` }}
        />
      )}

      <div className="relative z-10">
        <Header
          cgpa={cgpa}
          theme={theme}
          onToggleTheme={toggleTheme}
          hasWallpaper={!!wallpaper}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
        />

        <main className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 flex items-end justify-between"
          >
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
                Academic Overview
              </h1>
              <p className="text-muted-foreground text-lg">
                Track your progress, manage assignments, and predict your grades.
              </p>
            </div>
            {semesters.length > 0 && (
              <Button onClick={addSemester} className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-300">
                <Plus className="h-5 w-5" />
                Add Semester
              </Button>
            )}
          </motion.div>

          {semesters.map((semester, index) => (
            <SemesterSection
              key={semester.id}
              index={index}
              semester={semester}
              wallpaper={wallpaper}
              getSemesterGPA={getSemesterGPA}
              semesterHasAllGrades={semesterHasAllGrades}
              getSubjectPredictedGrade={getSubjectPredictedGrade}
              hasAtLeastOneGrade={hasAtLeastOneGrade}
              hasEmptyMarks={hasEmptyMarks}
              getLetterGrade={getLetterGrade}
              setSelectedSubject={setSelectedSubject}
              updateSemester={updateSemester}
              handleDeleteSemester={handleDeleteSemester}
              addSubject={addSubject}
              updateSubject={updateSubject}
              deleteSubject={deleteSubject}
            />
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
        {selectedSubject && currentSubject && subjectModalProps && (
          <SubjectModal
            subject={currentSubject}
            semesterId={selectedSubject.semesterId}
            predictedGrade={subjectModalProps.predictedGrade}
            letterGrade={subjectModalProps.letterGrade}
            onClose={() => setSelectedSubject(null)}
            onUpdateSubject={(updates) =>
              updateSubject(selectedSubject.semesterId, currentSubject.id, updates)
            }
            onUpdateAssignment={(assignmentId, updates) =>
              updateAssignment(
                selectedSubject.semesterId,
                currentSubject.id,
                assignmentId,
                updates
              )
            }
            onAddAssignment={(assignment) =>
              addAssignment(selectedSubject.semesterId, currentSubject.id, assignment)
            }
            onDeleteAssignment={(assignmentId) =>
              deleteAssignment(selectedSubject.semesterId, currentSubject.id, assignmentId)
            }
            onUpdateExam={(examId, updates) =>
              updateExam(selectedSubject.semesterId, currentSubject.id, examId, updates)
            }
            onAddMaterial={(material) =>
              addMaterial(selectedSubject.semesterId, currentSubject.id, material)
            }
            onUpdateMaterial={(materialId, updates) =>
              updateMaterial(
                selectedSubject.semesterId,
                currentSubject.id,
                materialId,
                updates
              )
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

        {/* Settings Sidebar */}
        <SettingsSidebar
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          wallpaper={wallpaper}
          onSetWallpaper={setWallpaper}
          onSignOut={handleSignOut}
        />

        <ProfileSidebar
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
        />
      </div>
    </div>
  );
};

export default Index;
