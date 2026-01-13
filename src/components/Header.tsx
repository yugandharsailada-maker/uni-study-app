import { ReactNode, memo, useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Moon, Sun, Settings } from 'lucide-react';
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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-500",
        hasWallpaper ? "solid-card border-border/20" : "glass border-transparent",
        !hasWallpaper && isScrolled ? "bg-card/95 backdrop-blur-md border-border/20 shadow-sm" : "bg-transparent border-transparent"
      )}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Open profile"
            onClick={onOpenProfile}
            className="group cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="relative">
              {/* Double Ring Effect */}
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-primary to-primary/0 opacity-50 blur-[1px] group-hover:opacity-100 transition-opacity duration-500" />

              {profile.profilePic ? (
                <Avatar className="h-10 w-10 border-2 border-background relative z-10 transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                  <AvatarImage src={profile.profilePic} alt={profile.name ?? 'Profile picture'} className="object-cover" />
                  <AvatarFallback>
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                      <Logo className="h-5 w-5" />
                    </div>
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 relative z-10 border-2 border-transparent group-hover:border-primary/10">
                  <Logo className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>
          </button>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold tracking-tight leading-none">Curriculum Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium hidden md:block">Academic Performance Tracker</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className={cn(
            "flex items-center gap-3 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border transition-colors",
            hasWallpaper ? "bg-background/95 border-primary/20" : "surface-sunken border-transparent"
          )}>
            <span className="text-xs sm:text-sm font-medium text-muted-foreground hidden xs:inline">CGPA</span>
            <div className="h-4 w-px bg-border hidden xs:block" />

            {reduceMotion ? (
              isRevealed ? (
                <div className="relative flex items-center">
                  <span
                    aria-hidden={!showGrades}
                    className={cn(
                      "text-base sm:text-lg font-bold text-primary px-1",
                      !showGrades && "blur-md select-none"
                    )}
                  >
                    {cgpa.toFixed(2)}
                  </span>
                  {!showGrades && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <EyeOff className="h-4 w-4 text-muted-foreground/50" aria-hidden />
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs sm:text-sm gpa-pending">Pending</span>
              )
            ) : (
              <AnimatePresence mode="wait">
                {isRevealed ? (
                  <motion.div
                    key="cgpa"
                    initial={{ opacity: 0, filter: 'blur(8px)', y: 4 }}
                    animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                    exit={{ opacity: 0, filter: 'blur(8px)', y: -4 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="relative flex items-center"
                  >
                    <span
                      aria-hidden={!showGrades}
                      className={cn(
                        "text-base sm:text-lg font-bold text-primary glow-primary px-1 rounded transition-all duration-300",
                        !showGrades && "blur-md select-none"
                      )}
                    >
                      {cgpa.toFixed(2)}
                    </span>
                    {!showGrades && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <EyeOff className="h-4 w-4 text-muted-foreground/50" aria-hidden />
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.span
                    key="pending"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs sm:text-sm gpa-pending"
                  >
                    Pending
                  </motion.span>
                )}
              </AnimatePresence>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              className="rounded-full w-9 h-9 sm:w-10 sm:h-10 hover:bg-muted"
            >
              {reduceMotion ? (
                theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />
              ) : (
                <AnimatePresence mode="wait">
                  {theme === 'dark' ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              className="rounded-full w-9 h-9 sm:w-10 sm:h-10 hover:bg-muted"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
});
