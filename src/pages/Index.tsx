import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import { Header } from '@/components/Header';
import { SubjectModal } from '@/components/SubjectModal';
import { DeleteSemesterDialog } from '@/components/DeleteSemesterDialog';
import { SettingsSidebar } from '@/components/SettingsSidebar';
import { ProfileSidebar } from '@/components/ProfileSidebar';
import { useSupabaseCurriculum } from '@/hooks/useSupabaseCurriculum';
import { useTheme } from '@/hooks/useTheme';
import { useWallpaper } from '@/hooks/useWallpaper';
import { useAuth } from '@/contexts/AuthContext';
import { Subject } from '@/types/curriculum';
import { BentoGrid } from '@/components/dashboard/BentoGrid';
import { SimulationModal } from '@/components/simulation/SimulationModal';
import { BentoGridSkeleton } from '@/components/dashboard/BentoGridSkeleton';
import { CommandPalette } from '@/components/CommandPalette';

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  const { wallpaper, setWallpaper } = useWallpaper();
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const {
    semesters,
    loading: dataLoading,
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
    updateAssignment,
    addAssignment,
    deleteAssignment,
    updateExam,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    bulkAddSubjects,
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
  const [simulationModalOpen, setSimulationModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc - Close all modals
      if (e.key === 'Escape') {
        setSelectedSubject(null);
        setSimulationModalOpen(false);
        setSettingsOpen(false);
        setProfileOpen(false);
        if (deleteDialog.isOpen) {
          setDeleteDialog({ isOpen: false, semesterId: '', semesterName: '' });
        }
      }

      // Ctrl/Cmd + N - New Semester
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        addSemester();
      }

      // Ctrl/Cmd + K - Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addSemester, deleteDialog.isOpen]);

  // Memoize expensive calculations
  // For the header, we typically want the authentic CGPA unless we want to show simulated there too.
  // Requirement: "Dashboard CGPATile should reflect the simulated score... Add a 'PREDICTED' badge".
  // The Header component normally shows CGPA too. Let's force Authentic for the Header for now to differentiate,
  // or use the main one. Let's make the Header show authentic to keep it "safe".
  // Actually, standard behavior: Header is "Official", Dashboard Tile is "Interactive".
  const authenticCGPA = useMemo(() => getCGPA(true), [semesters, getCGPA, isSimulationMode]);
  const displayCGPA = useMemo(() => getCGPA(false), [semesters, getCGPA, isSimulationMode, simulatedGrades]);

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

  // Handle Simulation Grade Set
  const handleSetSimulatedGrade = useCallback((subjectId: string, grade: string) => {
    if (!isSimulationMode) {
      toggleSimulationMode();
    }
    setSimulatedGrade(subjectId, grade);
  }, [isSimulationMode, toggleSimulationMode, setSimulatedGrade]);

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
      <div className="min-h-screen bg-background lg:h-screen lg:overflow-hidden p-6 lg:p-0">
        <div className="max-w-[1400px] w-full mx-auto lg:h-full lg:pt-20">
          <BentoGridSkeleton />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col relative selection:bg-primary/20 bg-[radial-gradient(at_top_left,_#f8fafc,_#f1f5f9,_#e2e8f0)] dark:bg-none dark:bg-background transition-colors duration-500">
      {/* Wallpaper layer */}
      {wallpaper && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
          style={{ backgroundImage: `url(${wallpaper})` }}
        />
      )}

      {/* Glass overlay when wallpaper is active to improve readability */}
      {wallpaper && (
        <div className="fixed inset-0 z-0 bg-background/30 backdrop-blur-[2px]" />
      )}

      <div className="relative z-10 flex flex-col lg:h-full">
        <Header
          cgpa={authenticCGPA}
          theme={theme}
          onToggleTheme={toggleTheme}
          hasWallpaper={!!wallpaper}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
        />

        <main className="relative lg:flex-1 lg:overflow-hidden min-h-0">
          <div className="max-w-[1400px] w-full mx-auto px-6 lg:h-full">
            <BentoGrid
              semesters={semesters}
              cgpa={displayCGPA} // Shows Simulated if mode is ON
              wallpaper={wallpaper}
              isSimulationMode={isSimulationMode}
              onToggleSimulation={() => setSimulationModalOpen(true)}
              getSemesterGPA={getSemesterGPA}
              semesterHasAllGrades={semesterHasAllGrades}
              getSubjectPredictedGrade={getSubjectPredictedGrade}
              hasAtLeastOneGrade={hasAtLeastOneGrade}
              hasEmptyMarks={hasEmptyMarks}
              getLetterGrade={getLetterGrade}
              onAddSemester={addSemester}
              onUpdateSemester={updateSemester}
              onDeleteSemester={handleDeleteSemester}
              onAddSubject={addSubject}
              onBulkAddSubjects={bulkAddSubjects}
              onUpdateSubject={updateSubject}
              onDeleteSubject={deleteSubject}
              onSubjectClick={setSelectedSubject}
            />
          </div>
        </main>
      </div>

      {/* Simulation Modal */}
      <SimulationModal
        isOpen={simulationModalOpen}
        onClose={() => setSimulationModalOpen(false)}
        semesters={semesters}
        simulatedGrades={simulatedGrades}
        setSimulatedGrade={handleSetSimulatedGrade}
        resetSimulation={resetSimulation}
        actualCGPA={authenticCGPA}
        simulatedCGPA={displayCGPA}
      />

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
  );
};

export default Index;
