import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DeleteSemesterDialogProps {
  semesterName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

type Step = 1 | 2 | 3;

export function DeleteSemesterDialog({
  semesterName,
  isOpen,
  onClose,
  onConfirm,
}: DeleteSemesterDialogProps) {
  const [step, setStep] = useState<Step>(1);
  const [confirmText, setConfirmText] = useState('');

  const handleClose = () => {
    setStep(1);
    setConfirmText('');
    onClose();
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const handleFinalConfirm = () => {
    if (confirmText === 'DELETE') {
      onConfirm();
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-card border rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Trash2 className="h-4 w-4 text-destructive" />
              </div>
              <h2 className="font-semibold">Delete Semester</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Step indicator */}
          <div className="flex gap-2 p-4 border-b">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  s <= step ? 'bg-destructive' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <h3 className="font-medium">Are you sure?</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        You are about to delete <strong>"{semesterName}"</strong>. This action
                        cannot be undone.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <h3 className="font-medium text-destructive">Warning: Permanent Deletion</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        All grades, assignments, and PDFs within this semester will be{' '}
                        <strong>permanently deleted</strong>. This data cannot be recovered.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="font-medium mb-2">Type "DELETE" to confirm</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter the word DELETE in capital letters to permanently remove this semester.
                    </p>
                    <Input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Type DELETE here"
                      className="text-center font-mono uppercase tracking-widest"
                      autoFocus
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-4 border-t bg-muted/30">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            {step < 3 ? (
              <Button variant="destructive" onClick={handleNext} className="flex-1">
                Continue
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleFinalConfirm}
                disabled={confirmText !== 'DELETE'}
                className="flex-1"
              >
                Delete Semester
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
