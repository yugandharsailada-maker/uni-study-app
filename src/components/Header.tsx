import { ReactNode, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, GraduationCap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

export const Header = memo(function Header({ cgpa, theme, onToggleTheme, hasWallpaper = false, onOpenSettings, onOpenProfile }: HeaderProps) {
  const { profile } = useProfile();
  const isRevealed = cgpa !== null;

  return (
    <header className={cn("sticky top-0 z-50 border-b", hasWallpaper ? "solid-card" : "glass")}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
            onClick={onOpenProfile}
          >
            {profile.profilePic ? (
              <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary transition-colors">
                <AvatarImage src={profile.profilePic} className="object-cover" />
                <AvatarFallback>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Curriculum Dashboard</h1>
            <p className="text-xs text-muted-foreground">Academic Performance Tracker</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg surface-sunken border">
            <span className="text-sm font-medium text-muted-foreground">Live CGPA</span>
            <div className="h-4 w-px bg-border" />
            <AnimatePresence mode="wait">
              {isRevealed ? (
                <motion.span
                  key="cgpa"
                  initial={{ opacity: 0, filter: 'blur(8px)', y: 4 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                  exit={{ opacity: 0, filter: 'blur(8px)', y: -4 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-lg font-bold text-primary glow-primary px-2 py-0.5 rounded"
                >
                  {cgpa.toFixed(2)}
                </motion.span>
              ) : (
                <motion.span
                  key="pending"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm gpa-pending"
                >
                  Calculation Pending
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            className="relative overflow-hidden"
          >
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
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="relative overflow-hidden"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
});
