import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Semester, Subject } from '@/types/curriculum';
import { SemesterBlock } from '@/components/SemesterBlock';
import { CGPATile } from './CGPATile';
import { MilestoneTile } from './MilestoneTile';

interface BentoGridProps {
    semesters: Semester[];
    cgpa: number | null;
    wallpaper: string | null;
    isSimulationMode: boolean;
    simulatedGrades: Record<string, string>;
    onToggleSimulation: () => void;

    // Logic Props
    getSemesterGPA: (semester: Semester) => number | null;
    semesterHasAllGrades: (semester: Semester) => boolean;
    getSubjectPredictedGrade: (subject: Subject) => number | null;
    hasAtLeastOneGrade: (subject: Subject) => boolean;
    hasEmptyMarks: (subject: Subject) => boolean;
    getLetterGrade: (score: number) => string;

    // Handlers
    onAddSemester: () => void;
    onUpdateSemester: (id: string, updates: Partial<Semester>) => void;
    onDeleteSemester: (id: string, name: string) => void;
    onAddSubject: (semesterId: string) => void;
    onBulkAddSubjects: (semesterId: string, subjects: Array<{ name: string; code: string; credits: number; midsem_weight: number; endsem_weight: number }>) => void;
    onUpdateSubject: (semesterId: string, subjectId: string, updates: Partial<Subject>) => void;
    onDeleteSubject: (semesterId: string, subjectId: string) => void;
    onSubjectClick: (data: { subject: Subject; semesterId: string }) => void;
    onAddPDF?: (semesterId: string, subjectId: string, file: File) => void;
}

export const BentoGrid = memo(function BentoGrid({
    semesters,
    cgpa,
    wallpaper,
    isSimulationMode,
    simulatedGrades,
    onToggleSimulation,
    getSemesterGPA,
    semesterHasAllGrades,
    onAddSemester,
    onUpdateSemester,
    onDeleteSemester,
    onAddSubject,
    onBulkAddSubjects,
    onUpdateSubject,
    onDeleteSubject,
    onSubjectClick,
    onAddPDF
}: BentoGridProps) {

    // Empty State: Onboarding Tile
    if (semesters.length === 0) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-7xl mx-auto pt-4">
                {/* Welcome/CGPA Tile - Wide on Empty State */}
                <div className="lg:col-span-2 space-y-5">
                    <CGPATile
                        cgpa={cgpa}
                        className="min-h-[220px]"
                        isSimulationMode={isSimulationMode}
                        onToggleSimulation={onToggleSimulation}
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, ease: [0.33, 1, 0.68, 1] }}
                        className="glass border-none shadow-sm rounded-md p-8 flex flex-col items-center justify-center text-center min-h-[300px] bg-white/40 dark:bg-card/20 bg-blueprint"
                    >
                        <div className="p-5 rounded-full bg-primary/5 mb-5 scale-smooth">
                            <Plus className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold mb-2 tracking-tight">Start Your Journey</h2>
                        <p className="text-muted-foreground/80 max-w-md mb-8 text-sm leading-relaxed">
                            Create your first semester to begin calculating your GPA and tracking your academic progress.
                        </p>
                        <Button onClick={onAddSemester} size="lg" className="rounded-full px-8 h-12 text-base shadow-lg hover:shadow-primary/20 transition-all font-medium active:scale-95">
                            Create First Semester
                        </Button>
                    </motion.div>
                </div>

                {/* Side/Milestone Tile */}
                <div className="lg:col-span-1">
                    <MilestoneTile />
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6 lg:gap-8 lg:h-full pt-2">
            {/* ZONE 1: LEFT (CGPA Hero) */}
            <div className="lg:col-span-1 flex flex-col gap-5 lg:sticky lg:top-8 lg:h-[calc(100vh-6rem)] lg:overflow-visible hidden lg:flex">
                <CGPATile
                    cgpa={cgpa}
                    className="flex-1 w-full min-h-[220px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none bg-white dark:bg-card border-none"
                    isSimulationMode={isSimulationMode}
                    onToggleSimulation={onToggleSimulation}
                />
            </div>

            {/* Mobile CGPA (Visible only on small screens) */}
            <div className="lg:hidden">
                <CGPATile
                    cgpa={cgpa}
                    className="min-h-[200px]"
                    isSimulationMode={isSimulationMode}
                    onToggleSimulation={onToggleSimulation}
                />
            </div>

            {/* ZONE 2: CENTER (Semesters) */}
            <div className="lg:col-span-1 flex flex-col gap-8 min-w-0 pb-20 lg:pb-0 lg:overflow-y-auto no-scrollbar lg:pr-1 px-1 lg:px-0">
                <AnimatePresence mode="popLayout">
                    {semesters.map((semester, index) => (
                        <motion.div
                            layout
                            key={semester.id}
                            initial={{ opacity: 0, y: 30, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            transition={{
                                delay: index * 0.05,
                                duration: 0.4,
                                ease: [0.33, 1, 0.68, 1]
                            }}
                        >
                            <SemesterBlock
                                semester={semester}
                                semesterGPA={getSemesterGPA(semester)}
                                hasAllGrades={semesterHasAllGrades(semester)}
                                hasWallpaper={!!wallpaper}
                                isSimulationMode={isSimulationMode}
                                simulatedGrades={simulatedGrades}
                                onSubjectClick={(subject) => onSubjectClick({ subject, semesterId: semester.id })}
                                onUpdateSemester={(updates) => onUpdateSemester(semester.id, updates)}
                                onDeleteSemester={() => onDeleteSemester(semester.id, semester.name)}
                                onAddSubject={() => onAddSubject(semester.id)}
                                onBulkAddSubjects={(subjects) => onBulkAddSubjects(semester.id, subjects)}
                                onUpdateSubject={onUpdateSubject}
                                onDeleteSubject={onDeleteSubject}
                                onAddPDF={onAddPDF ? (subId, file) => onAddPDF(semester.id, subId, file) : undefined}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Add Semester Button */}
                <motion.div className="pb-24 pt-2 flex justify-center">
                    <Button onClick={onAddSemester} size="lg" className="rounded-full shadow-lg hover:shadow-xl hover:shadow-primary/20 h-12 px-8 text-base bg-white dark:bg-primary text-primary dark:text-primary-foreground border-2 border-primary/10 hover:border-primary/30 transition-all active:scale-95">
                        <Plus className="mr-2 h-5 w-5" /> New Semester
                    </Button>
                </motion.div>
            </div>

            {/* ZONE 3: RIGHT (Milestones) */}
            <div className="lg:col-span-1 flex flex-col gap-5 lg:sticky lg:top-8 lg:h-[calc(100vh-6rem)]">
                <MilestoneTile />
            </div >
        </div >
    );
});
