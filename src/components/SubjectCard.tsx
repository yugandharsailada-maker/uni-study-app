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
  isSimulationMode?: boolean;
  simulatedGrade?: string;
  onAddPDF?: (file: File) => void;
  onClick: () => void;
  onUpdateSubject: (subjectId: string, updates: Partial<Subject>) => void;
  onDeleteSubject: (subjectId: string) => void;
}

export const SubjectCard = memo(function SubjectCard({
  subject,
  hasWallpaper = false,
  isSimulationMode = false,
  simulatedGrade,
  onAddPDF,
  onClick,
  onUpdateSubject,
  onDeleteSubject,
}: SubjectCardProps) {
  const { showGrades } = usePreferences();
  const [isDragging, setIsDragging] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Derived state
  const predictedGrade = useMemo(() => GradeLib.getSubjectPredictedGrade(subject), [subject]);
  const hasActualGrade = useMemo(() => GradeLib.hasAtLeastOneGrade(subject), [subject]);
  const hasEmptyMarks = useMemo(() => GradeLib.hasEmptyMarks(subject), [subject]);
  
  const letterGrade = useMemo(() => {
    if (isSimulationMode && simulatedGrade) return simulatedGrade;
    return predictedGrade !== null ? GradeLib.getLetterGrade(predictedGrade) : 'N/A';
  }, [predictedGrade, isSimulationMode, simulatedGrade]);

  const hasBackgroundDisplay = hasActualGrade || (isSimulationMode && !!simulatedGrade);
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
    if (showGrades && hasBackgroundDisplay && !hasWallpaper) {
      if (['S', 'A', 'B', 'C', 'D', 'E', 'F'].includes(letterGrade)) {
        return {
          backgroundColor: 'transparent',
          color: '#ffffff',
          borderColor: 'rgba(255,255,255,0.15)',
          textShadow: '0 2px 4px rgba(0,0,0,0.2)'
        };
      }
    }
    return {
      backgroundColor: 'hsl(var(--subject-card-bg))',
      color: 'hsl(var(--subject-card-fg))'
    };
  }, [showGrades, hasBackgroundDisplay, letterGrade, hasWallpaper]);

  const reducedMotion = useReducedMotion();

  return (
    <>
      <motion.button
        type="button"
        layout
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={reducedMotion ? {} : {
          y: -2,
          scale: 1.005,
          boxShadow: "0 10px 30px -10px rgba(0,0,0,0.08)"
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }} // ColorOS smooth
        style={cardStyle}
        className={cn(
          'group relative p-6 cursor-pointer overflow-hidden isolation-isolate h-[180px] flex flex-col justify-between text-left w-full',
          'gpu-accelerated adaptive-motion',
          'bg-card dark:bg-card/90 border border-border/40 shadow-sm rounded-3xl',
          'hover:border-border/80 dark:hover:border-border/60',
          hasWallpaper ? 'solid-card' : '',
          isDragging && 'drop-zone-active border-dashed border-2'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {/* Shine Glance Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0">
          <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-25deg]" />
        </div>

        {/* Static High-Res Backgrounds for Grades */}
        {showGrades && hasBackgroundDisplay && !hasWallpaper && (
          <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none rounded-3xl">
            <img
              src={`/grade-assets/grade-${letterGrade.toLowerCase()}.png`}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
            {/* Subtle overlay for text readability */}
            {letterGrade !== 'A' && (
              <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />
            )}
            {letterGrade === 'A' && (
              <div className="absolute inset-0 bg-white/20 mix-blend-overlay" />
            )}
          </div>
        )}

        {/* Red notification badge */}
        {hasEmptyMarks && (
          <span className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse ring-2 ring-background/50" />
        )}

        {/* Delete button (Visible on hover or touch) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteDialogOpen(true);
          }}
          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 touch-friendly:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all z-20"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        {/* Drag overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-primary/5 rounded-3xl z-10 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-2 text-primary">
                <Upload className="h-8 w-8" />
                <span className="text-sm font-medium">Drop files here</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-start justify-between min-w-0 z-10 w-full">
          <div className="min-w-0 flex-1 pr-8" onClick={(e) => e.stopPropagation()}>
            <span className="text-xxs font-bold tracking-wider uppercase opacity-60 mb-1 block">
              <InlineEdit
                value={subject.code}
                onSave={(code) => onUpdateSubject(subject.id, { code })}
                inputClassName="text-xxs w-16"
              />
            </span>
            <h3 className="font-semibold text-lg leading-tight truncate pr-2">
              <InlineEdit
                value={subject.name}
                onSave={(name) => onUpdateSubject(subject.id, { name })}
                className="block"
              />
            </h3>
          </div>
        </div>

        <div className="flex flex-col gap-3 z-10 mt-auto">
          <div className="flex items-center gap-2">
            <div className={cn(
              "text-xxs px-2 py-0.5 rounded-full border",
              hasBackgroundDisplay && showGrades && !hasWallpaper ? "bg-white/10 border-white/10 text-inherit" : "bg-secondary text-secondary-foreground border-transparent"
            )}>
              {subject.credits} Credits
            </div>
            {materialsCount > 0 && (
              <div className={cn(
                "text-xxs px-2 py-0.5 rounded-full border flex items-center gap-1",
                hasBackgroundDisplay && showGrades && !hasWallpaper ? "bg-white/10 border-white/10 text-inherit" : "bg-primary/5 text-primary border-primary/10"
              )}>
                <FileText className="h-2.5 w-2.5" />
                {materialsCount}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasActualGrade ? (
                <CheckCircle2 className={cn("h-4 w-4", showGrades && !hasWallpaper && hasBackgroundDisplay ? "text-inherit opacity-80" : "text-success")} />
              ) : (
                <div className={cn("h-4 w-4 rounded-full border-2 border-dashed", showGrades && !hasWallpaper && hasBackgroundDisplay ? "border-white/30" : "border-muted-foreground/30")} />
              )}
              <span className="text-xs opacity-60 font-medium">
                {gradedCount}/{totalCount}
              </span>
            </div>

            <AnimatePresence mode="wait">
              {hasBackgroundDisplay ? (
                <motion.div
                  key="grade"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex items-center gap-2">
                    {/* Simulated Badge */}
                    {isSimulationMode && (
                        <span className={cn("text-[9px] uppercase font-bold px-1.5 py-0.5 rounded backdrop-blur-md", "bg-white/20 text-white/90 border border-white/30")}>
                           Simulated
                        </span>
                    )}

                    {!isSimulationMode && predictedGrade !== null && (
                        <span className={cn(
                        "text-sm font-bold transition-all duration-300 tabular-nums",
                        !showGrades && "blur-md select-none"
                        )}>
                        {predictedGrade.toFixed(1)}%
                        </span>
                    )}
                    <span className={cn(
                      "text-xxs font-bold px-2 py-0.5 rounded-md transition-all duration-300 border shadow-sm backdrop-blur-md",
                      hasBackgroundDisplay && showGrades && !hasWallpaper
                        ? "bg-white/20 border-white/20 text-inherit"
                        : "bg-background border-border text-foreground",
                      !showGrades && "blur-sm select-none"
                    )}>
                      {letterGrade}
                    </span>
                    {!showGrades && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <EyeOff className="h-3 w-3 opacity-50" />
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
                  className="text-xs italic opacity-50"
                >
                  ---
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className={cn("h-1 rounded-full overflow-hidden w-full", showGrades && hasBackgroundDisplay && !hasWallpaper ? "bg-white/20" : "bg-black/10 dark:bg-white/10")}>
            <motion.div
              className={cn("h-full rounded-full", showGrades && hasBackgroundDisplay && !hasWallpaper ? "bg-white" : "bg-primary")}
              initial={{ width: 0 }}
              animate={{ width: `${(gradedCount / Math.max(totalCount, 1)) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
            />
          </div>
        </div>
      </motion.button>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {subject.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All grades and materials for this subject will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDeleteSubject(subject.id);
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              Delete Subject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog >
    </>
  );
});
