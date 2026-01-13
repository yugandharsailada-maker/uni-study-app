import { useState, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Plus, Trash2, MoreHorizontal, Sparkles, Wand2 } from 'lucide-react';
import { MagicImportModal } from "./MagicImportModal";
import { ExtractedSubject } from "@/hooks/useGemini";
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
        staggerChildren: 0.08,
      },
    },
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10 relative group/semester"
    >
      {/* Decorative left line */}
      <div className="absolute -left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/30 to-transparent hidden lg:block opacity-30 group-hover/semester:opacity-60 transition-opacity" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 px-1">
        <div className="flex items-center gap-5">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-background to-secondary/50 shadow-sm border border-border/50 hover:scale-105 hover:shadow-md transition-all duration-300 text-3xl cursor-pointer ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <InlineEdit
                value={semester.name}
                onSave={(name) => onUpdateSemester({ name })}
                className="hover:bg-primary/5 rounded px-2 -ml-2 transition-colors cursor-text"
              />
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/10">
                {semester.subjects.length} Subject{semester.subjects.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:pl-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMagicImportOpen(true)}
            className="h-10 w-10 text-primary/60 hover:text-primary hover:bg-primary/10 rounded-full transition-colors relative group"
            title="Magic Syllabus Import"
          >
            <Sparkles className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onDeleteSemester}
            className="h-10 w-10 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
            title="Delete Semester"
          >
            <Trash2 className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-card/90 border shadow-sm ring-1 ring-border/40">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">GPA</span>
            <div className="h-4 w-px bg-border/60 my-auto" />
            <AnimatePresence mode="wait">
              {semesterGPA !== null ? (
                <motion.div
                  key="gpa"
                  initial={{ opacity: 0, filter: 'blur(8px)', x: 10 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
                  exit={{ opacity: 0, filter: 'blur(8px)', x: -10 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="relative flex items-center"
                >
                  <span className={cn(
                    "text-lg font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent transition-all duration-300",
                    !showGrades && "blur-md select-none"
                  )}>
                    {semesterGPA.toFixed(2)}
                  </span>
                  {!showGrades && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <EyeOff className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.span
                  key="pending"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm gpa-pending px-1 font-medium"
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
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
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
          />
        ))}

        {/* Add Subject Card - Polished with Blueprint Pattern */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{
            y: -4,
            scale: 1.01,
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={onAddSubject}
          className="group relative h-[220px] rounded-3xl border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center overflow-hidden bg-blueprint"
        >
          {/* Subtle animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="relative z-10 p-5 rounded-full bg-background shadow-sm mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 ring-4 ring-background/50">
            <Plus className="h-7 w-7 transition-colors" />
          </div>
          <span className="relative z-10 text-base font-semibold text-primary/70 group-hover:text-primary transition-colors">
            Add Subject
          </span>
          <span className="relative z-10 text-xs text-muted-foreground/60 mt-1">Tap to create new</span>
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
