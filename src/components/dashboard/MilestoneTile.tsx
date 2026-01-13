import { motion, useReducedMotion } from "framer-motion";
import { Check, Clock, Flame, Info } from "lucide-react";
import { useSupabaseCurriculum } from "@/hooks/useSupabaseCurriculum";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Subject, Topic } from "@/types/curriculum";
import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ScoredTopic extends Topic {
    subjectName: string;
    subjectColor: string;
    score: number; // Urgency score
}

export function MilestoneTile() {
    const { semesters } = useSupabaseCurriculum();

    // Process all topics across all subjects
    const milestones: ScoredTopic[] = useMemo(() => {
        const allSubjects: Subject[] = semesters.flatMap((sem) => sem.subjects);
        const allTopics: ScoredTopic[] = [];

        allSubjects.forEach((subject) => {
            (subject.topics || []).forEach((topic) => {
                if (!topic.completed) {
                    // Simple Urgency Score Calculation
                    // High importance = 3 pts, Medium = 2, Low = 1
                    // Multiplied by Subject Credits (proxy for weight)
                    // You could refine this with Days Remaining if deadlines existed.

                    let importanceVal = 1;
                    if (topic.importance === 'high') importanceVal = 3;
                    if (topic.importance === 'medium') importanceVal = 2;

                    const score = importanceVal * ((subject.credits || 3) / 3);

                    allTopics.push({
                        ...topic,
                        subjectName: subject.name,
                        subjectColor: subject.color || '#6366f1', // Fallback color
                        score,
                    });
                }
            });
        });

        // Sort by score descending
        return allTopics.sort((a, b) => b.score - a.score).slice(0, 3);
    }, [semesters]);

    if (milestones.length === 0) {
        return (
            <Card className="col-span-1 md:col-span-2 h-full min-h-[160px] flex items-center justify-center p-6 border border-border dark:border-border bg-card shadow-lg rounded-3xl">
                <div className="text-center space-y-2">
                    <div className="bg-muted/50 dark:bg-muted/20 p-3 rounded-full w-fit mx-auto shadow-sm">
                        <Clock className="w-6 h-6 text-slate-500" />
                    </div>
                    <h3 className="font-semibold text-muted-foreground">No Active Milestones</h3>
                    <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                        Use "Magic Import" on a subject to generate your study strategy.
                    </p>
                </div>
            </Card>
        );
    }

    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            {...(reduceMotion ? {} : { whileHover: { y: -6, scale: 1.015, boxShadow: "0 20px 50px rgba(0,0,0,0.08)" } })}
            className="col-span-1 md:col-span-2 h-full overflow-hidden relative group bg-card border border-border shadow-lg rounded-3xl gpu-accelerated"
        >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Flame className="w-16 h-16 sm:w-20 sm:h-20 rotate-12" />
            </div>

            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                        Next Milestones
                    </CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="w-4 h-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Top 3 high-impact topics based on credit weight & importance.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {
                    milestones.map((milestone, index) => (
                        <motion.div
                            key={milestone.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors border border-transparent hover:border-border/50"
                        >
                            {/* Status Indicator */}
                            <div className={cn("w-1.5 h-8 rounded-full shrink-0",
                                milestone.importance === 'high' ? "bg-red-500" :
                                    milestone.importance === 'medium' ? "bg-amber-500" : "bg-blue-500"
                            )} />

                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{milestone.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: milestone.subjectColor }}
                                    />
                                    <span className="truncate max-w-[120px]">{milestone.subjectName}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {milestone.estimatedHours}h
                                    </span>
                                </div>
                            </div>

                            <button className="h-8 w-8 rounded-full border-2 border-muted-foreground/20 hover:border-primary hover:bg-primary/10 flex items-center justify-center transition-all group/btn">
                                <Check className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 text-primary transition-opacity" />
                            </button>
                        </motion.div>
                    ))
                }
            </CardContent>
        </motion.div>
    );
}
