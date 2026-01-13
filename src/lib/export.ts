import { Semester, Subject } from '@/types/curriculum';
import * as GradeLib from '@/lib/grades';

export function exportToCSV(semesters: Semester[]): string {
    const headers = ['Semester', 'Subject Code', 'Subject Name', 'Credits', 'Grade', 'Points', 'GPA'];
    const rows: string[][] = [headers];

    semesters.forEach(semester => {
        semester.subjects.forEach(subject => {
            const predictedGrade = GradeLib.getSubjectPredictedGrade(subject);
            const letterGrade = predictedGrade !== null ? GradeLib.getLetterGrade(predictedGrade) : 'N/A';
            const points = predictedGrade !== null ? GradeLib.getGradePoint(predictedGrade) : 'N/A';

            rows.push([
                semester.name,
                subject.code,
                subject.name,
                subject.credits.toString(),
                letterGrade,
                points.toString(),
                '' // GPA calculated separately
            ]);
        });

        // Add semester GPA row
        const semesterGPA = GradeLib.getSemesterGPA(semester, {}, false);
        rows.push([
            `${semester.name} - GPA`,
            '',
            '',
            '',
            '',
            '',
            semesterGPA !== null ? semesterGPA.toFixed(2) : 'N/A'
        ]);
        rows.push([]); // Empty row for spacing
    });

    // Add CGPA
    const cgpa = GradeLib.getCGPA(semesters, {}, false);
    rows.push(['Overall CGPA', '', '', '', '', '', cgpa !== null ? cgpa.toFixed(2) : 'N/A']);

    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

export function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function exportGradesData(semesters: Semester[]) {
    const csv = exportToCSV(semesters);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `grades_export_${timestamp}.csv`);
}
