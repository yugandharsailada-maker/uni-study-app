import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/contexts/PreferencesContext';
import { EyeOff } from 'lucide-react';

import { useProfile } from '@/contexts/ProfileContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface HeaderProps {
  cgpa: number | null;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  hasWallpaper?: boolean;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
}

export const Header = memo(function Header({ cgpa, theme, onToggleTheme, hasWallpaper = false, onOpenSettings,
  onOpenProfile,
}: HeaderProps) {
  const { profile } = useProfile();
  const { showGrades } = usePreferences();
  const isRevealed = cgpa !== null;
  const reduceMotion = useReducedMotion();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-500 ease-out",
        hasWallpaper ? "border-transparent" : "border-b border-transparent",
        !hasWallpaper && isScrolled ? "bg-background/80 backdrop-blur-xl border-border/40 shadow-sm" : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-6 h-18 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Open profile"
            onClick={onOpenProfile}
            className="group cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary scale-smooth"
          >
            <div className="relative">
              {profile.profilePic ? (
                <Avatar className="h-10 w-10 border border-border/50 relative z-10 transition-transform duration-300 group-hover:scale-105 group-active:scale-95 shadow-sm">
                  <AvatarImage src={profile.profilePic} alt={profile.name ?? 'Profile picture'} className="object-cover" />
                  <AvatarFallback>
                    <div className="flex h-full w-full items-center justify-center bg-primary/5 text-primary">
                      <Logo className="h-5 w-5" />
                    </div>
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="p-2.5 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors duration-300 relative z-10">
                  <Logo className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>
          </button>

          <div className="hidden sm:block opacity-0 animate-[fadeIn_0.5s_ease-out_forwards] translate-y-1">
            <h1 className="text-base font-semibold tracking-tight text-foreground/90">Curriculum</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-300 touch-friendly",
            hasWallpaper ? "bg-black/20 backdrop-blur-md border border-white/10 text-white" : "bg-secondary/50 hover:bg-secondary/80 border border-transparent"
          )}>
            <span className={cn(
              "text-xs font-medium uppercase tracking-wider opacity-60",
              hasWallpaper ? "text-white" : "text-muted-foreground"
            )}>CGPA</span>

            <div className={cn(
              "h-3 w-px mx-1",
              hasWallpaper ? "bg-white/20" : "bg-border"
            )} />

            {reduceMotion ? (
              isRevealed ? (
                <div className="relative flex items-center">
                  <span
                    aria-hidden={!showGrades}
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      !showGrades && "blur-md select-none"
                    )}
                  >
                    {cgpa.toFixed(2)}
                  </span>
                  {!showGrades && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <EyeOff className="h-3 w-3 opacity-50" aria-hidden />
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs opacity-60 inset-0">Pending</span>
              )
            ) : (
              <AnimatePresence mode="wait">
                {isRevealed ? (
                  <motion.div
                    key="cgpa"
                    initial={{ opacity: 0, filter: 'blur(4px)', y: 4 }}
                    animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                    exit={{ opacity: 0, filter: 'blur(4px)', y: -4 }}
                    transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }} // ColorOS smooth
                    className="relative flex items-center"
                  >
                    <span
                      aria-hidden={!showGrades}
                      className={cn(
                        "text-sm font-bold tabular-nums tracking-tight",
                        hasWallpaper ? "text-white" : "text-primary",
                        !showGrades && "blur-md select-none"
                      )}
                    >
                      {cgpa.toFixed(2)}
                    </span>
                    {!showGrades && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <EyeOff className="h-3.5 w-3.5 opacity-50" aria-hidden />
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.span
                    key="pending"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs opacity-60"
                  >
                    Pending
                  </motion.span>
                )}
              </AnimatePresence>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className={cn(
                "rounded-full w-10 h-10 transition-colors duration-300",
                hasWallpaper ? "text-white hover:bg-white/10" : "hover:bg-secondary/80"
              )}
            >
              <AnimatePresence mode="wait">
                {theme === 'dark' ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Sun className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Moon className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              className={cn(
                "rounded-full w-10 h-10 transition-colors duration-300",
                hasWallpaper ? "text-white hover:bg-white/10" : "hover:bg-secondary/80"
              )}
            >
              <div className="flex flex-col gap-[3px] items-end justify-center w-5 h-5">
                <span className="w-5 h-0.5 bg-current rounded-full" />
                <span className="w-3.5 h-0.5 bg-current rounded-full" />
                <span className="w-2 h-0.5 bg-current rounded-full" />
              </div>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
});
