import { useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Plus, Trash2, Sparkles } from 'lucide-react';
import { MagicImportModal } from "./MagicImportModal";
import { Semester, Subject } from '@/types/curriculum';
import { SubjectCard } from './SubjectCard';
import { InlineEdit } from './InlineEdit';
import { Button } from '@/components/ui/button';
import { usePreferences } from '@/contexts/PreferencesContext';
import { EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SemesterBlockProps {
  semester: Semester;
  semesterGPA: number | null;
  hasAllGrades: boolean;
  hasWallpaper?: boolean;
  onAddPDF?: (subjectId: string, file: File) => void;
  onSubjectClick: (subject: Subject) => void;
  onUpdateSemester: (updates: Partial<Semester>) => void;
  onDeleteSemester: () => void;
  onAddSubject: () => void;
  onBulkAddSubjects: (subjects: Array<{ name: string; code: string; credits: number; midsem_weight: number; endsem_weight: number }>) => void;
  onUpdateSubject: (semesterId: string, subjectId: string, updates: Partial<Subject>) => void;
  onDeleteSubject: (semesterId: string, subjectId: string) => void;
  isSimulationMode?: boolean;
  simulatedGrades?: Record<string, string>;
}

const EMOJI_OPTIONS = ['📚', '🎓', '📖', '✨', '🔬', '🎨', '💻', '📐', '🧪', '🌟', '🏆', '📝', '🧠', '⚙️', '📊'];

export const SemesterBlock = memo(function SemesterBlock({
  semester,
  semesterGPA,
  hasAllGrades,
  hasWallpaper = false,
  onAddPDF,
  onSubjectClick,
  onUpdateSemester,
  onDeleteSemester,
  onAddSubject,
  onBulkAddSubjects,
  onUpdateSubject,
  onDeleteSubject,
  isSimulationMode = false,
  simulatedGrades = {},
}: SemesterBlockProps) {
  const [isMagicImportOpen, setIsMagicImportOpen] = useState(false);
  const { showGrades } = usePreferences();

  // Create stable handlers for SubjectCard
  const handleUpdateSubject = useCallback((subjectId: string, updates: Partial<Subject>) => {
    onUpdateSubject(semester.id, subjectId, updates);
  }, [semester.id, onUpdateSubject]);

  const handleDeleteSubject = useCallback((subjectId: string) => {
    onDeleteSubject(semester.id, subjectId);
  }, [semester.id, onDeleteSubject]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04, // Faster stagger
      },
    },
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
      className="mb-8 relative group/semester"
    >
      {/* Decorative left line - simplified */}
      <div className="absolute -left-5 top-2 bottom-2 w-px bg-primary/10 hidden lg:block" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 px-1">
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white dark:bg-card shadow-sm border border-border/40 hover:scale-105 hover:shadow-md transition-all duration-300 text-2xl cursor-pointer ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 scale-smooth"
                title="Change Icon"
              >
                {semester.emoji || '📚'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 rounded-2xl shadow-xl border-border bg-background" align="start">
              <div
                className="grid grid-cols-5 gap-2"
                role="grid"
                aria-label="Emoji selection"
              >
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onUpdateSemester({ emoji })}
                    className="aspect-square flex items-center justify-center text-xl hover:bg-primary/10 hover:scale-110 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                    aria-label={`Select emoji ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <InlineEdit
                value={semester.name}
                onSave={(name) => onUpdateSemester({ name })}
                className="hover:bg-primary/5 rounded px-2 -ml-2 transition-colors cursor-text"
                inputClassName="text-xl font-bold"
              />
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground/70">
                {semester.subjects.length} Subject{semester.subjects.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:pl-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMagicImportOpen(true)}
            className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-all relative group"
            title="Magic Syllabus Import"
          >
            <Sparkles className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onDeleteSemester}
            className="h-9 w-9 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
            title="Delete Semester"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-white dark:bg-card border border-border/50 shadow-sm ml-2">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase opacity-70">GPA</span>
            <div className="h-3.5 w-px bg-border my-auto" />
            <AnimatePresence mode="wait">
              {semesterGPA !== null ? (
                <motion.div
                  key="gpa"
                  initial={{ opacity: 0, filter: 'blur(4px)', x: 5 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
                  exit={{ opacity: 0, filter: 'blur(4px)', x: -5 }}
                  transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
                  className="relative flex items-center"
                >
                  <span className={cn(
                    "text-sm font-bold text-foreground transition-all duration-300 tabular-nums",
                    !showGrades && "blur-sm select-none"
                  )}>
                    {semesterGPA.toFixed(2)}
                  </span>
                  {!showGrades && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <EyeOff className="h-3 w-3 text-muted-foreground/40" />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.span
                  key="pending"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs gpa-pending px-1"
                >
                  ---
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {semester.subjects.map((subject) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            semesterId={semester.id}
            hasWallpaper={hasWallpaper}
            onAddPDF={onAddPDF ? (file) => onAddPDF(subject.id, file) : undefined}
            onClick={() => onSubjectClick(subject)}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
            isSimulationMode={isSimulationMode}
            simulatedGrade={simulatedGrades[subject.id]}
          />
        ))}

        {/* Add Subject Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{
            y: -2,
            scale: 1.005,
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={onAddSubject}
          className="group relative h-[180px] rounded-3xl border border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center overflow-hidden bg-blueprint gpu-accelerated adaptive-motion"
        >
          <div className="relative z-10 p-4 rounded-full bg-background/50 shadow-sm mb-3 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <Plus className="h-6 w-6 transition-colors" />
          </div>
          <span className="relative z-10 text-sm font-semibold text-primary/70 group-hover:text-primary transition-colors">
            Add Subject
          </span>
        </motion.div>
      </motion.div>

      <MagicImportModal
        isOpen={isMagicImportOpen}
        onClose={() => setIsMagicImportOpen(false)}
        onImport={(extractedSubjects) => {
          onBulkAddSubjects(extractedSubjects.map(sub => ({
            name: sub.name,
            code: sub.code,
            credits: sub.credits,
            midsem_weight: sub.gradingWeights?.midsem || 30,
            endsem_weight: sub.gradingWeights?.endsem || 50
          })));
          setIsMagicImportOpen(false);
        }}
      />
    </motion.section>
  );
});
