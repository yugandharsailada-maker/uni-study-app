import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';

interface DeleteSemesterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  semesterName: string;
}

export function DeleteSemesterDialog({
  isOpen,
  onClose,
  onConfirm,
  semesterName,
}: DeleteSemesterDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const isConfirmed = confirmText === semesterName;

  // Reset confirmation text when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmText('');
    }
  }, [isOpen]);

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-left">Delete Semester?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-4">
            <p className="text-sm">
              You're about to <strong className="text-foreground">permanently delete</strong> the semester:
            </p>
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="font-semibold text-foreground">{semesterName}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">⚠️ This will delete:</p>
              <ul className="text-xs space-y-1 pl-4 list-disc text-muted-foreground">
                <li>All subjects in this semester</li>
                <li>All grades and assignments</li>
                <li>All study materials</li>
                <li>All progress and history</li>
              </ul>
            </div>
            <div className="border-t border-border pt-3 mt-3 space-y-2">
              <p className="text-sm font-medium">Type <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs">{semesterName}</code> to confirm:</p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type semester name here"
                className={`font-mono ${!isConfirmed && confirmText.length > 0 ? 'border-destructive/50' : ''}`}
                autoFocus
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={!isConfirmed}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete Forever
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
