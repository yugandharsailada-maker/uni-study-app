import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Semester, Subject } from '@/types/curriculum';
import { SemesterBlock } from '@/components/SemesterBlock';
import { CGPATile } from './CGPATile';
import { DeadlineTile } from './DeadlineTile';
import { MilestoneTile } from './MilestoneTile';

interface BentoGridProps {
    semesters: Semester[];
    cgpa: number | null;
    wallpaper: string | null;
    isSimulationMode: boolean;
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
    onToggleSimulation,
    // Logic props needed for children
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
    onAddPDF // Assuming onAddPDF might be needed or was missing in props, added for consistency if needed or kept if not
}: BentoGridProps) {

    // Empty State: Onboarding Tile
    if (semesters.length === 0) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {/* Welcome/CGPA Tile - Wide on Empty State */}
                <div className="lg:col-span-2 space-y-6">
                    <CGPATile
                        cgpa={cgpa}
                        className="min-h-[220px]"
                        isSimulationMode={isSimulationMode}
                        onToggleSimulation={onToggleSimulation}
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[300px] border-dashed border-2 border-primary/20"
                    >
                        <div className="p-4 rounded-full bg-primary/10 mb-4 animate-pulse">
                            <Plus className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Start Your Journey</h2>
                        <p className="text-muted-foreground max-w-md mb-8">
                            Create your first semester to begin calculating your GPA and tracking your academic progress.
                        </p>
                        <Button onClick={onAddSemester} size="lg" className="rounded-full px-8 text-lg shadow-lg hover:shadow-primary/25 transition-all">
                            Create First Semester
                        </Button>
                    </motion.div>
                </div>

                {/* Side/Deadline Tile */}
                <div className="lg:col-span-1">
                    <DeadlineTile semesters={semesters} className="h-full min-h-[220px]" />
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6 lg:gap-8 lg:h-full">
            {/* ZONE 1: LEFT (CGPA Hero) */}
            <div className="lg:col-span-1 flex flex-col gap-6 lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:overflow-visible">
                <CGPATile
                    cgpa={cgpa}
                    className="flex-1 w-full min-h-[220px]"
                    isSimulationMode={isSimulationMode}
                    onToggleSimulation={onToggleSimulation}
                />
            </div>

            {/* ZONE 2: CENTER (Semesters) */}
            <div className="lg:col-span-1 flex flex-col gap-8 min-w-0 pb-20 lg:pb-0 lg:overflow-y-auto no-scrollbar lg:pr-2">
                <AnimatePresence mode="popLayout">
                    {semesters.map((semester, index) => (
                        <motion.div
                            layout
                            key={semester.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <SemesterBlock
                                semester={semester}
                                semesterGPA={getSemesterGPA(semester)} // Logic Fix: Passing actual GPA
                                hasAllGrades={semesterHasAllGrades(semester)}
                                hasWallpaper={!!wallpaper}

                                // Handlers - Adapting to SemesterBlock props
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

                {/* Add Semester Button (Visible on all screens) */}
                <motion.div className="pb-24 pt-4 flex justify-center">
                    <Button onClick={onAddSemester} size="lg" className="rounded-full shadow-xl">
                        <Plus className="mr-2 h-5 w-5" /> Add New Semester
                    </Button>
                </motion.div>
            </div>

            {/* ZONE 3: RIGHT (Deadlines & Milestones) */}
            <div className="lg:col-span-1 flex flex-col gap-6 lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)]">
                <div className="flex-1 min-h-0">
                    <DeadlineTile semesters={semesters} />
                </div>

                <MilestoneTile />
            </div >
        </div >
    );
});
