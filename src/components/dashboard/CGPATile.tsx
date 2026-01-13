import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, Award, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Button } from '@/components/ui/button';

interface CGPATileProps {
    cgpa: number | null;
    isSimulationMode: boolean;
    onToggleSimulation: () => void;
    className?: string;
}

export const CGPATile = memo(function CGPATile({ cgpa, isSimulationMode, onToggleSimulation, className }: CGPATileProps) {
    const { showGrades } = usePreferences();
    const isRevealed = cgpa !== null;
    const reduceMotion = useReducedMotion();

    return (
        <div className={cn("relative group", className)}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    "relative overflow-hidden p-8 flex flex-col justify-between transition-all duration-300 h-full",
                    "bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-orange-500/5 dark:from-violet-500/10 dark:via-fuchsia-500/10 dark:to-orange-500/10", // RICHER GRADIENT
                    "border border-slate-200 dark:border-border", // Border definition
                    "shadow-[0_10px_40px_rgba(138,180,248,0.12)] dark:shadow-lg", // Soft blue glow
                    "rounded-[2.5rem]",
                    "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/40 before:to-transparent before:opacity-50 dark:before:opacity-0 pointer-events-none",
                    isSimulationMode && "bg-indigo-50/80 dark:bg-indigo-950/20 border-indigo-200/50 dark:border-indigo-500/30"
                )}
                {...(reduceMotion ? {} : { whileHover: { y: -4, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.08)" } })}
            >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-5 pointer-events-none">
                    <Award className="w-32 h-32 -rotate-12 translate-x-8 -translate-y-8" />
                </div>

                <div className="flex justify-between items-center z-10 relative">
                    <div>
                        <h3 className="text-sm font-bold text-muted-foreground/80 uppercase tracking-widest flex items-center gap-2">
                            {isSimulationMode ? (
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Predicted CGPA
                                </span>
                            ) : (
                                "Overall CGPA"
                            )}
                        </h3>
                        <p className="text-xs font-medium text-muted-foreground/50 mt-1">
                            {isSimulationMode ? "What-If Scenario Active" : "Live Performance"}
                        </p>
                    </div>

                    <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                            "rounded-full h-10 w-10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors -mr-2",
                            isSimulationMode ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSimulation();
                        }}
                    >
                        {isSimulationMode ? <Sparkles className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                    </Button>
                </div>

                <div className="z-10 mt-4">
                    {isRevealed ? (
                        <div className="flex flex-col gap-1">
                            <span className={cn(
                                "text-5xl sm:text-6xl md:text-7xl font-extrabold bg-gradient-to-r bg-clip-text text-transparent tracking-tighter transition-all duration-300",
                                isSimulationMode ? "from-indigo-600 to-purple-600 scale-105 origin-left" : "from-slate-900 to-slate-700 dark:from-white dark:to-slate-300",
                                !showGrades && !isSimulationMode && "blur-xl select-none"
                            )}>
                                {cgpa.toFixed(2)}
                            </span>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">
                                    {cgpa >= 9 ? "Outstanding! 🌟" : cgpa >= 8 ? "Excellent work! 🎯" : cgpa >= 7 ? "Great progress! 📈" : cgpa >= 6 ? "You're doing well! 💪" : "Keep pushing forward! 🚀"}
                                </span>
                                {isSimulationMode && (
                                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={(e) => { e.stopPropagation(); onToggleSimulation(); }}>
                                        Exit Simulation
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="h-10 w-24 bg-muted/50 rounded animate-pulse" />
                            <span className="text-sm text-muted-foreground italic">Add grades to calculate</span>
                        </div>
                    )}
                </div>

                {/* Progress Glow (Stage 4 Hook) */}
                <div className={cn(
                    "absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent transition-opacity duration-300",
                    isSimulationMode ? "opacity-100 animate-pulse via-indigo-500/50" : "opacity-0"
                )} />
            </motion.div>
        </div>
    );
});
