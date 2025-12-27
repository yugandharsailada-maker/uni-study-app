import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Semester, Subject } from '@/types/curriculum';
import { SemesterBlock } from '@/components/SemesterBlock';

interface SemesterSectionProps {
    index: number;
    semester: Semester;
    wallpaper: string | null;
    getSemesterGPA: (semester: Semester) => number | null;
    semesterHasAllGrades: (semester: Semester) => boolean;
    getSubjectPredictedGrade: (subject: Subject) => number | null;
    hasAtLeastOneGrade: (subject: Subject) => boolean;
    hasEmptyMarks: (subject: Subject) => boolean;
    getLetterGrade: (score: number) => string;
    setSelectedSubject: (data: { subject: Subject; semesterId: string }) => void;
    updateSemester: (id: string, updates: Partial<Semester>) => void;
    handleDeleteSemester: (id: string, name: string) => void;
    addSubject: (id: string) => void;
    updateSubject: (semesterId: string, subjectId: string, updates: Partial<Subject>) => void;
    deleteSubject: (semesterId: string, subjectId: string) => void;
}

export const SemesterSection = memo(function SemesterSection({
    index,
    semester,
    wallpaper,
    getSemesterGPA,
    semesterHasAllGrades,
    getSubjectPredictedGrade,
    hasAtLeastOneGrade,
    hasEmptyMarks,
    getLetterGrade,
    setSelectedSubject,
    updateSemester,
    handleDeleteSemester,
    addSubject,
    updateSubject,
    deleteSubject,
}: SemesterSectionProps) {
    // Stable handlers that close over the semester ID
    const handleUpdateSemester = useCallback((updates: Partial<Semester>) => {
        updateSemester(semester.id, updates);
    }, [semester.id, updateSemester]);

    const handleDelete = useCallback(() => {
        handleDeleteSemester(semester.id, semester.name);
    }, [semester.id, semester.name, handleDeleteSemester]);

    const handleAddSubject = useCallback(() => {
        addSubject(semester.id);
    }, [semester.id, addSubject]);

    const handleSubjectClick = useCallback((subject: Subject) => {
        setSelectedSubject({ subject, semesterId: semester.id });
    }, [semester.id, setSelectedSubject]);

    const handleUpdateSubject = useCallback((subjectId: string, updates: Partial<Subject>) => {
        updateSubject(semester.id, subjectId, updates);
    }, [semester.id, updateSubject]);

    const handleDeleteSubject = useCallback((subjectId: string) => {
        deleteSubject(semester.id, subjectId);
    }, [semester.id, deleteSubject]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
        >
            <SemesterBlock
                semester={semester}
                semesterGPA={getSemesterGPA(semester)}
                hasAllGrades={semesterHasAllGrades(semester)}
                hasWallpaper={!!wallpaper}
                getSubjectPredictedGrade={getSubjectPredictedGrade}
                hasAtLeastOneGrade={hasAtLeastOneGrade}
                hasEmptyMarks={hasEmptyMarks}
                getLetterGrade={getLetterGrade}
                onSubjectClick={handleSubjectClick}
                onUpdateSemester={handleUpdateSemester}
                onDeleteSemester={handleDelete}
                onAddSubject={handleAddSubject}
                onUpdateSubject={handleUpdateSubject}
                onDeleteSubject={handleDeleteSubject}
            />
        </motion.div>
    );
});
