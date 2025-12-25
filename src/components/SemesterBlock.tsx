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
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-2 rounded-lg surface-sunken hover:bg-primary/10 transition-colors text-xl cursor-pointer">
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
            <h2 className="text-xl font-bold tracking-tight">
              <InlineEdit
                value={semester.name}
                onSave={(name) => onUpdateSemester({ name })}
                className="hover:bg-primary/5"
              />
            </h2>
            <p className="text-sm text-muted-foreground">
              {semester.subjects.length} subject{semester.subjects.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg surface-sunken border">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Semester GPA</span>
            <div className="h-4 w-px bg-border" />
            <AnimatePresence mode="wait">
              {hasAllGrades && semesterGPA !== null ? (
                <motion.span
                  key="gpa"
                  initial={{ opacity: 0, filter: 'blur(8px)', x: 10 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
                  exit={{ opacity: 0, filter: 'blur(8px)', x: -10 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-lg font-bold text-primary"
                >
                  {semesterGPA.toFixed(2)}
                </motion.span>
              ) : (
                <motion.span
                  key="pending"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm gpa-pending"
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
            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
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
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          onClick={onAddSubject}
          className="group relative rounded-xl border-2 border-dashed border-muted-foreground/20 p-6 cursor-pointer transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 flex flex-col items-center justify-center min-h-[140px]"
        >
          <div className="p-3 rounded-full bg-muted mb-2 group-hover:bg-primary/10 transition-colors">
            <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Add Subject
          </span>
        </motion.div>
      </motion.div>
    </motion.section>
  );
});
