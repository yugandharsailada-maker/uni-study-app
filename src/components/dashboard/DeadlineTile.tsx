import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarClock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Semester } from '@/types/curriculum';
import { getEarliestDeadline } from '@/lib/curriculum';

interface DeadlineTileProps {
    semesters: Semester[];
    className?: string;
    onClick?: () => void;
}

export const DeadlineTile = memo(function DeadlineTile({ semesters, className, onClick }: DeadlineTileProps) {
    const deadline = useMemo(() => getEarliestDeadline(semesters), [semesters]);
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            onClick={onClick}
            className={cn(
                "group cursor-pointer relative overflow-hidden p-6 flex flex-col justify-between min-h-[180px]",
                "gpu-accelerated scale-smooth", // ColorOS smoothness
                "bg-white dark:bg-card", // Solid backgrounds for clarity
                "border border-slate-200 dark:border-border", // Border definition
                "shadow-[0_10px_40px_rgba(138,180,248,0.12)] dark:shadow-lg", // Soft blue glow
                "rounded-[2.5rem]",
                className
            )}
            {...(reduceMotion ? {} : { whileHover: { y: -4, scale: 1.02 } })}
        >
            <div className="flex justify-between items-start z-10">
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Up Next
                    </h3>
                    <p className="text-xs text-muted-foreground/60 mt-1">Deadlines & Exams</p>
                </div>
                <div className="p-2 bg-orange-500/10 rounded-full group-hover:bg-orange-500/20 transition-colors">
                    <CalendarClock className="w-5 h-5 text-orange-500" />
                </div>
            </div>

            <div className="z-10 mt-4">
                {deadline ? (
                    <div className="flex flex-col gap-2">
                        <span className="text-3xl font-bold tracking-tight line-clamp-1">
                            {deadline.displayDate}
                        </span>
                        <div>
                            <p className="font-medium text-foreground line-clamp-1">{deadline.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {deadline.subjectName} ({deadline.type})
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1 items-center justify-center py-6 text-center">
                        <CheckCircle2 className="w-8 h-8 text-muted-foreground/30 mb-2" />
                        <span className="text-sm font-medium text-muted-foreground">All Caught Up!</span>
                        <p className="text-xs text-muted-foreground/60">No pending deadlines</p>
                    </div>
                )}
            </div>

            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                <ArrowRight className="w-5 h-5 text-primary" />
            </div>
        </motion.div>
    );
});
