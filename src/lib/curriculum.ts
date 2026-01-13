import { Semester, Assignment, Exam } from "@/types/curriculum";
import { isAfter, isToday, isTomorrow, formatDistanceToNow, parseISO, startOfDay } from "date-fns";

export interface DashboardDeadline {
    id: string;
    name: string;
    date: Date;
    displayDate: string;
    type: "assignment" | "exam";
    subjectName: string;
    subjectCode: string;
}

/**
 * Scans all semesters to find the single most urgent upcoming deadline.
 * Returns null if no future deadlines are found.
 */
export const getEarliestDeadline = (semesters: Semester[]): DashboardDeadline | null => {
    if (!semesters?.length) return null;

    const now = startOfDay(new Date());
    const allDeadlines: DashboardDeadline[] = [];

    semesters.forEach((semester) => {
        semester.subjects.forEach((subject) => {
            // Process Assignments
            subject.assignments.forEach((assignment) => {
                if (assignment.dueDate) {
                    const date = new Date(assignment.dueDate);
                    if (isValidDate(date) && (isAfter(date, now) || isToday(date))) {
                        allDeadlines.push({
                            id: assignment.id,
                            name: assignment.name,
                            date: date,
                            displayDate: formatDeadlineDate(date),
                            type: "assignment",
                            subjectName: subject.name,
                            subjectCode: subject.code,
                        });
                    }
                }
            });

            // Process Exams
            if (subject.exams) {
                subject.exams.forEach((exam) => {
                    if (exam.date) {
                        const date = new Date(exam.date);
                        if (isValidDate(date) && (isAfter(date, now) || isToday(date))) {
                            allDeadlines.push({
                                id: exam.id,
                                name: exam.name,
                                date: date,
                                displayDate: formatDeadlineDate(date),
                                type: "exam",
                                subjectName: subject.name,
                                subjectCode: subject.code,
                            });
                        }
                    }
                });
            }
        });
    });

    if (allDeadlines.length === 0) return null;

    // Sort by date ascending (closest first)
    allDeadlines.sort((a, b) => a.date.getTime() - b.date.getTime());

    return allDeadlines[0];
};

const isValidDate = (d: Date) => {
    return d instanceof Date && !isNaN(d.getTime());
};

const formatDeadlineDate = (date: Date): string => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return formatDistanceToNow(date, { addSuffix: true });
};
