import { useState, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { FileText, Upload, ChevronRight, CheckCircle2, Trash2 } from 'lucide-react';
import { Subject } from '@/types/curriculum';
import { InlineEdit } from './InlineEdit';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/contexts/PreferencesContext';
import { EyeOff } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import * as GradeLib from '@/lib/grades';

interface SubjectCardProps {
  subject: Subject;
  semesterId: string;
  hasWallpaper?: boolean;
  onAddPDF?: (file: File) => void;
  onClick: () => void;
  onUpdateSubject: (subjectId: string, updates: Partial<Subject>) => void;
  onDeleteSubject: (subjectId: string) => void;
}

export const SubjectCard = memo(function SubjectCard({
  subject,
  hasWallpaper = false,
  onAddPDF,
  onClick,
  onUpdateSubject,
  onDeleteSubject,
}: SubjectCardProps) {
  const { showGrades } = usePreferences();
  const [isDragging, setIsDragging] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Derived state using library functions - these are fast and don't need excessive memoization
  // providing the subject object itself is stable or we don't mind re-calculating on render (cheap math)
  const predictedGrade = useMemo(() => GradeLib.getSubjectPredictedGrade(subject), [subject]);
  const hasGrade = useMemo(() => GradeLib.hasAtLeastOneGrade(subject), [subject]);
  const hasEmptyMarks = useMemo(() => GradeLib.hasEmptyMarks(subject), [subject]);
  const letterGrade = useMemo(() => predictedGrade !== null ? GradeLib.getLetterGrade(predictedGrade) : 'N/A', [predictedGrade]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const pdfFiles = files.filter((file) => file.type === 'application/pdf');
      pdfFiles.forEach((file) => onAddPDF?.(file));
    },
    [onAddPDF]
  );

  const gradedCount = useMemo(() =>
    subject.assignments.filter((a) => a.marksObtained !== null).length +
    (subject.exams || []).filter((e) => e.marksObtained !== null).length,
    [subject.assignments, subject.exams]
  );
  const totalCount = useMemo(() =>
    subject.assignments.length + (subject.exams || []).length,
    [subject.assignments, subject.exams]
  );
  const materialsCount = useMemo(() =>
    (subject.materials?.length || 0) + (subject.pdfs?.length || 0),
    [subject.materials, subject.pdfs]
  );

  const cardStyle = useMemo(() => {
    // ... (unchanged)
    if (showGrades && hasGrade && !hasWallpaper) {
      if (['S', 'B', 'C', 'D', 'E', 'F'].includes(letterGrade)) {
        return {
          backgroundColor: 'transparent',
          color: '#ffffff',
          borderColor: 'rgba(255,255,255,0.2)',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        };
      }
      if (letterGrade === 'A') {
        return {
          backgroundColor: 'transparent',
          color: '#1e293b',
          borderColor: 'rgba(0,0,0,0.1)',
          textShadow: 'none'
        };
      }
    }
    return {
      backgroundColor: 'hsl(var(--subject-card-bg))',
      color: 'hsl(var(--subject-card-fg))'
    };
  }, [showGrades, hasGrade, letterGrade, hasWallpaper]);

  // Handler helpers
  const handleUpdate = useCallback((updates: Partial<Subject>) => {
    onUpdateSubject(subject.id, updates);
  }, [onUpdateSubject, subject.id]);

  const handleDelete = useCallback(() => {
    onDeleteSubject(subject.id);
  }, [onDeleteSubject, subject.id]);

  // Usage in JSX needs to change to use these helpers OR update the call sites in JSX
  // For minimally invasive change, I'll update the JSX call sites in a moment or use helpers.
  // Actually, using helpers `handleUpdate` and `handleDelete` is cleaner for the JSX below.

  // Use reduced motion hook
  const reducedMotion = useReducedMotion();

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={reducedMotion ? {} : {
          y: -6,
          scale: 1.015,
          boxShadow: "0 20px 50px rgba(0,0,0,0.08)"
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25, layout: { duration: 0.3 } }}
        style={cardStyle}
        className={cn(
          'group relative p-8 cursor-pointer overflow-hidden isolation-isolate',
          'gpu-accelerated scale-smooth', // GPU acceleration
          'bg-card/90 dark:bg-card/85 border border-border/60 dark:border-border/40 shadow-lg rounded-3xl',
          'hover:border-border dark:hover:border-border/60 hover:shadow-xl',
          hasWallpaper ? 'solid-card' : '',
          isDragging && 'drop-zone-active border-dashed border-2'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={onClick}
      >
        {/* Shine Glance Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0">
          <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg]" />
        </div>

        {/* Static High-Res Backgrounds for Grades */}
        {showGrades && hasGrade && !hasWallpaper && (
          <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
            <img
              src={`/grade-assets/grade-${letterGrade.toLowerCase()}.png`}
              alt={`Grade ${letterGrade} background`}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.style.backgroundColor = 'hsl(var(--subject-card-bg))';
              }}
              style={{
                backgroundColor: 'hsl(var(--subject-card-bg))'
              }}
            />
            {/* Subtle overlay for text readability on darker grades */}
            {letterGrade !== 'A' && (
              <div className="absolute inset-0 bg-black/25" />
            )}
            {/* Light overlay for A grade to keep it vibrant but readable */}
            {letterGrade === 'A' && (
              <div className="absolute inset-0 bg-white/10" />
            )}
          </div>
        )}

        {/* Red notification badge */}
        {hasEmptyMarks && (
          <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-destructive animate-pulse" />
        )}

        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteDialogOpen(true);
          }}
          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>

        {/* Drag overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-primary/5 rounded-xl z-10"
            >
              <div className="flex flex-col items-center gap-2 text-primary">
                <Upload className="h-8 w-8" />
                <span className="text-sm font-medium">Drop files here</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-start justify-between mb-3 pr-6">
          <div className="min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs font-medium text-inherit opacity-70">
              <InlineEdit
                value={subject.code}
                onSave={(code) => onUpdateSubject(subject.id, { code })}
                inputClassName="text-xs w-20"
              />
            </span>
            <h3 className="font-semibold text-inherit mt-0.5 leading-tight">
              <InlineEdit
                value={subject.name}
                onSave={(name) => onUpdateSubject(subject.id, { name })}
                className="block"
              />
            </h3>
          </div>
          <ChevronRight className="h-4 w-4 text-inherit opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary dark:bg-muted text-secondary-foreground dark:text-muted-foreground">
            {subject.credits} Credits
          </span>
          {materialsCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {materialsCount}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasGrade ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
            )}
            <span className="text-xs text-inherit opacity-70">
              {gradedCount}/{totalCount} graded
            </span>
          </div>

          <AnimatePresence mode="wait">
            {hasGrade && predictedGrade !== null ? (
              <motion.div
                key="grade"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <div className="relative flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-bold text-inherit transition-all duration-300",
                    !showGrades && "blur-md select-none"
                  )}>
                    {predictedGrade.toFixed(1)}%
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 border shadow-sm",
                    letterGrade === 'A'
                      ? "bg-slate-900/10 text-slate-900 border-black/10"
                      : "bg-white/20 text-white border-white/20",
                    !showGrades && "blur-sm select-none"
                  )}>
                    {letterGrade}
                  </span>
                  {!showGrades && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <EyeOff className="h-3 w-3 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.span
                key="pending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs italic text-inherit opacity-70"
              >
                ---
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(gradedCount / Math.max(totalCount, 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{subject.name}"? This will remove all assignments, exams, and study materials.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDeleteSubject(subject.id);
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
