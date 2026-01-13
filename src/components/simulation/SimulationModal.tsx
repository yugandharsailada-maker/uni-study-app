import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCcw, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Semester, Subject, GRADE_SCALE } from '@/types/curriculum';
import { cn } from '@/lib/utils';

interface SimulationModalProps {
    isOpen: boolean;
    onClose: () => void;
    semesters: Semester[];
    simulatedGrades: Record<string, string>;
    setSimulatedGrade: (subjectId: string, grade: string) => void;
    resetSimulation: () => void;
    actualCGPA: number | null;
    simulatedCGPA: number | null;
}

export const SimulationModal = memo(function SimulationModal({
    isOpen,
    onClose,
    semesters,
    simulatedGrades,
    setSimulatedGrade,
    resetSimulation,
    actualCGPA,
    simulatedCGPA,
}: SimulationModalProps) {

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-none bg-background/95 backdrop-blur-xl">

                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-background/95 z-20">
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            Grade Simulator
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Project your CGPA by setting target grades.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={resetSimulation} className="text-muted-foreground hover:text-foreground">
                            <RefreshCcw className="w-4 h-4 mr-2" /> Reset
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Comparison HUD */}
                <div className="p-6 bg-secondary/30 border-b flex flex-wrap gap-8 items-center justify-center">
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Actual CGPA</span>
                        <span className="text-2xl font-bold text-foreground/70">
                            {actualCGPA ? actualCGPA.toFixed(2) : "---"}
                        </span>
                    </div>

                    <div className="h-8 w-px bg-border hidden sm:block" />

                    <div className="flex flex-col items-center relative">
                        <span className="text-sm font-medium text-primary uppercase tracking-wide flex items-center gap-1">
                            Simulated <TrendingUp className="w-3 h-3" />
                        </span>
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={simulatedCGPA}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className={cn(
                                    "text-4xl font-extrabold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent",
                                    (simulatedCGPA || 0) > (actualCGPA || 0) && "scale-110 transition-transform"
                                )}
                            >
                                {simulatedCGPA ? simulatedCGPA.toFixed(2) : "---"}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Scrollable Subject List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {semesters.map(semester => (
                        <div key={semester.id} className="space-y-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground/80">
                                {semester.emoji} {semester.name}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {semester.subjects.map(subject => {
                                    const currentSimulated = simulatedGrades[subject.id];
                                    return (
                                        <div
                                            key={subject.id}
                                            className={cn(
                                                "p-3 rounded-xl border transition-all duration-200",
                                                currentSimulated
                                                    ? "bg-primary/5 border-primary/30 shadow-sm"
                                                    : "bg-card hover:bg-secondary/50 border-border"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate text-sm" title={subject.name}>{subject.name}</p>
                                                    <p className="text-xs text-muted-foreground">{subject.credits} Credits</p>
                                                </div>
                                                {currentSimulated && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary text-primary-foreground uppercase">
                                                        Simulated
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {GRADE_SCALE.map(g => (
                                                    <button
                                                        key={g.grade}
                                                        onClick={() => setSimulatedGrade(subject.id, g.grade)}
                                                        className={cn(
                                                            "w-7 h-7 text-xs rounded-md flex items-center justify-center font-medium transition-colors",
                                                            currentSimulated === g.grade
                                                                ? "bg-primary text-primary-foreground shadow-sm scale-110"
                                                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                                        )}
                                                    >
                                                        {g.grade}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-background/95 flex justify-end">
                    <Button onClick={onClose}>Done</Button>
                </div>

            </DialogContent>
        </Dialog>
    );
});
