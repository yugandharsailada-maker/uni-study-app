import { useState, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Plus, Trash2 } from 'lucide-react';
import { Semester, Subject } from '@/types/curriculum';
import { SubjectCard } from './SubjectCard';
import { InlineEdit } from './InlineEdit';
import { Button } from '@/components/ui/button';
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
  getSubjectPredictedGrade: (subject: Subject) => number | null;
  hasAtLeastOneGrade: (subject: Subject) => boolean;
  hasEmptyMarks: (subject: Subject) => boolean;
  getLetterGrade: (score: number) => string;
  onAddPDF?: (subjectId: string, file: File) => void;
  onSubjectClick: (subject: Subject) => void;
  onUpdateSemester: (updates: Partial<Semester>) => void;
  onDeleteSemester: () => void;
  onAddSubject: () => void;
  onUpdateSubject: (subjectId: string, updates: Partial<Subject>) => void;
  onDeleteSubject: (subjectId: string) => void;
}

const EMOJI_OPTIONS = ['📚', '🎓', '📖', '✨', '🔬', '🎨', '💻', '📐', '🧪', '🌟', '🏆', '📝'];

export const SemesterBlock = memo(function SemesterBlock({
  semester,
  semesterGPA,
  hasAllGrades,
  hasWallpaper = false,
  getSubjectPredictedGrade,
  hasAtLeastOneGrade,
  hasEmptyMarks,
  getLetterGrade,
  onAddPDF,
  onSubjectClick,
  onUpdateSemester,
  onDeleteSemester,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
}: SemesterBlockProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10 relative"
    >
      <div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 to-transparent rounded-full hidden lg:block opacity-30" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-14 w-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-background to-secondary shadow-sm border hover:scale-105 transition-transform text-2xl cursor-pointer">
                {semester.emoji || '📚'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="grid grid-cols-6 gap-1">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onUpdateSemester({ emoji })}
                    className="p-2 text-lg hover:bg-secondary rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              <InlineEdit
                value={semester.name}
                onSave={(name) => onUpdateSemester({ name })}
                className="hover:bg-primary/5 rounded px-2 -ml-2"
              />
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {semester.subjects.length} subject{semester.subjects.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pl-16 sm:pl-0">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-card border shadow-sm ring-1 ring-border/50">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Semester GPA</span>
            <div className="h-4 w-px bg-border my-auto" />
            <AnimatePresence mode="wait">
              {hasAllGrades && semesterGPA !== null ? (
                <motion.span
                  key="gpa"
                  initial={{ opacity: 0, filter: 'blur(8px)', x: 10 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
                  exit={{ opacity: 0, filter: 'blur(8px)', x: -10 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent"
                >
                  {semesterGPA.toFixed(2)}
                </motion.span>
              ) : (
                <motion.span
                  key="pending"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm gpa-pending px-2"
                >
                  ---
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onDeleteSemester}
            className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {semester.subjects.map((subject) => {
          const predictedGrade = getSubjectPredictedGrade(subject);
          const hasGrade = hasAtLeastOneGrade(subject);
          const emptyMarks = hasEmptyMarks(subject);
          const letterGrade = predictedGrade !== null ? getLetterGrade(predictedGrade) : 'N/A';

          return (
            <SubjectCard
              key={subject.id}
              subject={subject}
              semesterId={semester.id}
              predictedGrade={predictedGrade}
              hasGrade={hasGrade}
              letterGrade={letterGrade}
              hasEmptyMarks={emptyMarks}
              hasWallpaper={hasWallpaper}
              onAddPDF={onAddPDF ? (file) => onAddPDF(subject.id, file) : undefined}
              onClick={() => onSubjectClick(subject)}
              onUpdateSubject={(updates) => onUpdateSubject(subject.id, updates)}
              onDeleteSubject={() => onDeleteSubject(subject.id)}
            />
          );
        })}

        {/* Add Subject Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{
            y: -5,
            scale: 1.02,
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={onAddSubject}
          className="group relative rounded-xl border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 p-6 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[140px] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10 p-4 rounded-full bg-background/50 shadow-sm mb-3 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 ring-1 ring-primary/20">
            <Plus className="h-6 w-6 transition-colors" />
          </div>
          <span className="relative z-10 text-sm font-semibold text-primary/80 group-hover:text-primary transition-colors">
            Add New Subject
          </span>
        </motion.div>
      </motion.div>
    </motion.section>
  );
});
