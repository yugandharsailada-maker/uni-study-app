import { useState, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, ChevronRight, CheckCircle2, Trash2 } from 'lucide-react';
import { Subject } from '@/types/curriculum';
import { InlineEdit } from './InlineEdit';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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

interface SubjectCardProps {
  subject: Subject;
  semesterId: string;
  predictedGrade: number | null;
  hasGrade: boolean;
  letterGrade: string;
  hasEmptyMarks: boolean;
  hasWallpaper?: boolean;
  onAddPDF?: (file: File) => void;
  onClick: () => void;
  onUpdateSubject: (updates: Partial<Subject>) => void;
  onDeleteSubject: () => void;
}

export const SubjectCard = memo(function SubjectCard({
  subject,
  predictedGrade,
  hasGrade,
  letterGrade,
  hasEmptyMarks,
  hasWallpaper = false,
  onAddPDF,
  onClick,
  onUpdateSubject,
  onDeleteSubject,
}: SubjectCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'group relative rounded-xl border p-4 cursor-pointer transition-all duration-200',
          'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
          hasWallpaper ? 'solid-card' : 'bg-card',
          isDragging && 'drop-zone-active border-dashed border-2'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={onClick}
      >
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
            <span className="text-xs font-medium text-muted-foreground">
              <InlineEdit
                value={subject.code}
                onSave={(code) => onUpdateSubject({ code })}
                inputClassName="text-xs w-20"
              />
            </span>
            <h3 className="font-semibold text-foreground mt-0.5 leading-tight">
              <InlineEdit
                value={subject.name}
                onSave={(name) => onUpdateSubject({ name })}
                className="block"
              />
            </h3>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
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
            <span className="text-xs text-muted-foreground">
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
                <span className="text-sm font-bold text-foreground">{predictedGrade.toFixed(1)}%</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  {letterGrade}
                </span>
              </motion.div>
            ) : (
              <motion.span
                key="pending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs gpa-pending"
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
                onDeleteSubject();
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
