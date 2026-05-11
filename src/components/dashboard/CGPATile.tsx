import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, Sparkles, Award } from 'lucide-react';
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
        <div className={cn("relative group w-full", className)}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    "relative overflow-hidden p-8 flex flex-col justify-between transition-all duration-300 h-full",
                    // Refined gradients - cleaner, deeper
                    "bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-blue-50/30 dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-blue-950/10",
                    "border border-white/50 dark:border-white/5",
                    "rounded-lg shadow-xl", // 40px hierarchy for Hero Tile
                    isSimulationMode && "ring-2 ring-indigo-500/20 bg-indigo-50/80 dark:bg-indigo-950/20"
                )}
                {...(reduceMotion ? {} : { whileHover: { y: -2, boxShadow: "0 15px 30px -5px rgba(0,0,0,0.05)" } })}
            >
                {/* Simplified Background Decoration */}
                <div className="absolute -top-4 -right-4 opacity-[0.03] dark:opacity-[0.02] pointer-events-none rotate-12 scale-150 transform-gpu">
                    <Award className="w-48 h-48" />
                </div>

                <div className="flex justify-between items-start z-10 relative">
                    <div className="space-y-1">
                        <div className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase",
                            isSimulationMode ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground"
                        )}>
                            {isSimulationMode && <Sparkles className="w-3 h-3" />}
                            {isSimulationMode ? "Predicted" : "Overall CGPA"}
                        </div>
                        <p className={cn("text-xs font-medium pl-1", isSimulationMode ? "text-indigo-600/70" : "text-muted-foreground/60")}>
                            {isSimulationMode ? "Simulation Active" : "Academic Performance"}
                        </p>
                    </div>

                    <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                            "rounded-full h-10 w-10 transition-all duration-300 hover:scale-110 active:scale-95",
                            isSimulationMode ? "text-indigo-600 bg-indigo-100/50 hover:bg-indigo-100" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSimulation();
                        }}
                    >
                        {isSimulationMode ? <Sparkles className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                    </Button>
                </div>

                <div className="z-10 mt-6 relative">
                    {isRevealed ? (
                        <div className="flex flex-col gap-2">
                            <div className="relative inline-block">
                                <span className={cn(
                                    "text-6xl sm:text-7xl font-[800] tracking-tighter transition-all duration-300 tabular-nums leading-none",
                                    // Gradient Text
                                    "bg-clip-text text-transparent bg-gradient-to-r",
                                    isSimulationMode
                                        ? "from-indigo-500 to-purple-600 scale-[1.02] origin-left filter drop-shadow-sm"
                                        : "from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-200 dark:to-slate-400",
                                    !showGrades && !isSimulationMode && "blur-xl select-none grayscale opacity-50"
                                )}>
                                    {cgpa.toFixed(2)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                                <span className="text-sm font-medium text-muted-foreground/80 flex items-center gap-2">
                                    <span className={cn("w-1.5 h-1.5 rounded-full", cgpa >= 8 ? "bg-emerald-500" : "bg-amber-500")} />
                                    {cgpa >= 9 ? "Outstanding" : cgpa >= 8 ? "Excellent" : cgpa >= 7 ? "Good" : "Keep Improving"}
                                </span>

                                {isSimulationMode && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-[10px] px-3 rounded-full border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 transition-colors"
                                        onClick={(e) => { e.stopPropagation(); onToggleSimulation(); }}
                                    >
                                        Exit Mode
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 py-2">
                            <div className="h-12 w-32 bg-muted/30 rounded-lg animate-pulse" />
                            <span className="text-sm text-muted-foreground italic pl-1">Add grades to see performance</span>
                        </div>
                    )}
                </div>

                {/* Simulation Progress Line with Glow */}
                <div className={cn(
                    "absolute inset-x-0 bottom-0 h-[3px] transition-opacity duration-300",
                    isSimulationMode ? "opacity-100 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-pulse" : "opacity-0"
                )} />
            </motion.div>
        </div>
    );
});
