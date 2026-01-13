import { Subject, Semester, GRADE_SCALE } from '@/types/curriculum';

/**
 * Gets the confidential points for a letter grade (e.g., 'A' -> 9.0)
 */
export function getPointsFromLetterGrade(grade: string): number {
    const found = GRADE_SCALE.find(g => g.grade === grade);
    return found?.points ?? 0;
}

/**
 * Converts a numeric score to a letter grade (e.g., 85 -> 'A')
 */
export function getLetterGrade(score: number): string {
    const grade = GRADE_SCALE.find((g) => score >= g.minScore);
    return grade?.grade ?? 'F';
}

/**
 * Converts a numeric score to grade points (e.g., 85 -> 9.0)
 */
export function getGradePoint(score: number): number {
    const grade = GRADE_SCALE.find((g) => score >= g.minScore);
    return grade?.points ?? 0;
}

/**
 * Calculates the predicted score (0-100) for a subject based on current assignments and exams.
 * Returns null if no grades are present.
 */
export function getSubjectPredictedGrade(subject: Subject): number | null {
    const midsemWeight = subject.midsemWeight ?? 30;
    const endsemWeight = subject.endsemWeight ?? 50;
    const remainingWeight = 100 - midsemWeight - endsemWeight;

    let totalScore = 0;
    let hasAnyGrade = false;

    // 1. Midsem contribution
    const midsem = (subject.exams || []).find((e) => e.name === 'Midsem');
    if (midsem && midsem.marksObtained !== null && midsem.maxMarks > 0) {
        totalScore += (midsem.marksObtained / midsem.maxMarks) * midsemWeight;
        hasAnyGrade = true;
    }

    // 2. Endsem contribution
    const endsem = (subject.exams || []).find((e) => e.name === 'Endsem');
    if (endsem && endsem.marksObtained !== null && endsem.maxMarks > 0) {
        totalScore += (endsem.marksObtained / endsem.maxMarks) * (subject.endsemWeight ?? 50);
        hasAnyGrade = true;
    }

    // 3. Assignments contribution
    let totalObtained = 0;
    let totalMax = 0;
    const assignments = subject.assignments || [];

    assignments.forEach((a) => {
        if (a.marksObtained !== null && a.maxMarks > 0) {
            totalObtained += a.marksObtained;
            totalMax += a.maxMarks;
            hasAnyGrade = true;
        }
    });

    if (totalMax > 0) {
        totalScore += (totalObtained / totalMax) * remainingWeight;
    }

    if (!hasAnyGrade) return null;
    return totalScore;
}

/**
 * Checks if a subject has at least one graded item.
 */
export function hasAtLeastOneGrade(subject: Subject): boolean {
    const hasAssignmentGrade = subject.assignments.some((a) => a.marksObtained !== null);
    const hasExamGrade = (subject.exams || []).some((e) => e.marksObtained !== null);
    return hasAssignmentGrade || hasExamGrade;
}

/**
 * Checks if a subject has unfinished assignments (null marks).
 */
export function hasEmptyMarks(subject: Subject): boolean {
    const assignments = subject.assignments || [];
    if (assignments.length === 0) return false;
    return assignments.some((a) => a.marksObtained === null);
}

/**
 * Checks if an entire semester has at least one grade in every subject.
 */
export function semesterHasAllGrades(semester: Semester): boolean {
    if (semester.subjects.length === 0) return false;
    return semester.subjects.every((s) => hasAtLeastOneGrade(s));
}

/**
 * Calculates the GPA for a semester.
 * Handles simulation mode if simulatedGrades are provided.
 */
export function getSemesterGPA(
    semester: Semester,
    simulatedGrades?: Record<string, string>,
    isSimulationMode = false
): number | null {
    let totalPoints = 0;
    let totalCredits = 0;

    semester.subjects.forEach((subject) => {
        let points: number | null = null;

        // 1. Check Simulation Override
        if (isSimulationMode && simulatedGrades && simulatedGrades[subject.id]) {
            points = getPointsFromLetterGrade(simulatedGrades[subject.id]);
        }
        // 2. Check Authentic Grade
        else {
            const predictedGrade = getSubjectPredictedGrade(subject);
            if (predictedGrade !== null) {
                points = getGradePoint(predictedGrade);
            }
        }

        if (points !== null) {
            totalPoints += points * subject.credits;
            totalCredits += subject.credits;
        }
    });

    if (totalCredits === 0) return null;
    return totalPoints / totalCredits;
}

/**
 * Calculates the CGPA across all semesters.
 * Handles simulation mode if simulatedGrades are provided.
 */
export function getCGPA(
    semesters: Semester[],
    simulatedGrades?: Record<string, string>,
    isSimulationMode = false
): number | null {
    if (semesters.length === 0) return null;

    let totalPoints = 0;
    let totalCredits = 0;

    semesters.forEach((semester) => {
        semester.subjects.forEach((subject) => {
            let points: number | null = null;

            // 1. Check Simulation Override
            if (isSimulationMode && simulatedGrades && simulatedGrades[subject.id]) {
                points = getPointsFromLetterGrade(simulatedGrades[subject.id]);
            }
            // 2. Check Authentic Grade
            else if (hasAtLeastOneGrade(subject)) {
                const predictedGrade = getSubjectPredictedGrade(subject);
                if (predictedGrade !== null) {
                    points = getGradePoint(predictedGrade);
                }
            }

            if (points !== null) {
                totalPoints += points * subject.credits;
                totalCredits += subject.credits;
            }
        });
    });

    if (totalCredits === 0) return null;
    return totalPoints / totalCredits;
}
