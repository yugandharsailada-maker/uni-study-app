import { motion, AnimatePresence } from 'framer-motion';
import { Save, Check, Cloud, CloudOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveIndicatorProps {
    status: SaveStatus;
    lastSaved?: Date;
    className?: string;
}

export function AutoSaveIndicator({ status, lastSaved, className }: AutoSaveIndicatorProps) {
    const getIcon = () => {
        switch (status) {
            case 'saving':
                return <Save className="w-3 h-3 animate-pulse" />;
            case 'saved':
                return <Check className="w-3 h-3" />;
            case 'error':
                return <CloudOff className="w-3 h-3" />;
            default:
                return <Cloud className="w-3 h-3" />;
        }
    };

    const getText = () => {
        switch (status) {
            case 'saving':
                return 'Saving...';
            case 'saved':
                return 'All changes saved';
            case 'error':
                return 'Save failed';
            default:
                return '';
        }
    };

    const getColor = () => {
        switch (status) {
            case 'saving':
                return 'text-blue-600 dark:text-blue-400';
            case 'saved':
                return 'text-green-600 dark:text-green-400';
            case 'error':
                return 'text-destructive';
            default:
                return 'text-muted-foreground';
        }
    };

    if (status === 'idle') return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                    'flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-background/50 backdrop-blur-sm border',
                    getColor(),
                    className
                )}
            >
                {getIcon()}
                <span>{getText()}</span>
                {lastSaved && status === 'saved' && (
                    <span className="text-muted-foreground text-[10px]">
                        {formatTimeAgo(lastSaved)}
                    </span>
                )}
            </motion.div>
        </AnimatePresence>
    );
}

function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}
