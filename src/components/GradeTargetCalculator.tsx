import { Target, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Subject } from '@/types/curriculum';

interface GradeTargetCalculatorProps {
    subject: Subject;
    predictedGrade: number | null;
}

export function GradeTargetCalculator({ subject, predictedGrade }: GradeTargetCalculatorProps) {
    const midsemWeight = subject.midsemWeight ?? 30;
    const endsemWeight = subject.endsemWeight ?? 50;
    const remainingWeight = 100 - midsemWeight - endsemWeight;

    let currentScore = 0;

    // Calculate current score from midsem and assignments
    const midsem = (subject.exams || []).find(e => e.name === 'Midsem');
    if (midsem && midsem.marksObtained !== null && midsem.maxMarks > 0) {
        currentScore += (midsem.marksObtained / midsem.maxMarks) * midsemWeight;
    }

    let totalObtained = 0;
    let totalMax = 0;
    (subject.assignments || []).forEach(a => {
        if (a.marksObtained !== null && a.maxMarks > 0) {
            totalObtained += a.marksObtained;
            totalMax += a.maxMarks;
        }
    });
    if (totalMax > 0) {
        currentScore += (totalObtained / totalMax) * remainingWeight;
    }

    const endsem = (subject.exams || []).find(e => e.name === 'Endsem');
    if (!endsem) return null;

    const targets = [
        { grade: 'A', score: 80, color: 'text-green-600 dark:text-green-400' },
        { grade: 'B', score: 70, color: 'text-blue-600 dark:text-blue-400' },
        { grade: 'C', score: 60, color: 'text-yellow-600 dark:text-yellow-400' },
    ];

    const calculations = targets.map(t => {
        const neededFromEndsem = t.score - currentScore;
        const requiredMarks = (neededFromEndsem / endsemWeight) * endsem.maxMarks;
        return {
            ...t,
            requiredMarks: Math.max(0, requiredMarks),
            isPossible: requiredMarks <= endsem.maxMarks,
            alreadyReached: currentScore >= t.score
        };
    });

    return (
        <Card className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200/50 dark:border-indigo-800/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="w-4 h-4 text-indigo-500" />
                    What You Need on Final
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current Score</span>
                    <span className="font-bold">{currentScore.toFixed(1)}%</span>
                </div>

                <div className="space-y-2">
                    {calculations.map((calc) => (
                        <div
                            key={calc.grade}
                            className="flex items-center justify-between p-2 rounded-lg bg-background/60 backdrop-blur-sm"
                        >
                            <div className="flex items-center gap-2">
                                <div className={`font-bold text-lg ${calc.color}`}>
                                    {calc.grade}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    ({calc.score}%)
                                </div>
                            </div>
                            <div className="text-right">
                                {calc.alreadyReached ? (
                                    <div className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        Achieved!
                                    </div>
                                ) : calc.isPossible ? (
                                    <div className="text-sm">
                                        <div className="font-bold">{calc.requiredMarks.toFixed(1)}</div>
                                        <div className="text-xs text-muted-foreground">
                                            / {endsem.maxMarks} pts
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-destructive flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Not possible
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                        <div className="flex justify-between mb-1">
                            <span>Exam Weight</span>
                            <span className="font-medium">{endsemWeight}%</span>
                        </div>
                        <Progress
                            value={(currentScore / 100) * 100}
                            className="h-1.5"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
