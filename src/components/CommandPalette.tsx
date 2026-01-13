import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, Settings, User, TrendingUp, Calculator, X, Download, Sparkles } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onAddSemester?: () => void;
    onOpenSettings?: () => void;
    onOpenProfile?: () => void;
}

interface Command {
    id: string;
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    action: () => void;
    keywords: string[];
}

export function CommandPalette({
    isOpen,
    onClose,
    onAddSemester,
    onOpenSettings,
    onOpenProfile,
}: CommandPaletteProps) {
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const commands: Command[] = [
        {
            id: 'new-semester',
            title: 'New Semester',
            subtitle: 'Create a new semester',
            icon: <Plus className="w-4 h-4" />,
            action: () => {
                onAddSemester?.();
                onClose();
            },
            keywords: ['new', 'create', 'semester', 'add'],
        },
        {
            id: 'settings',
            title: 'Open Settings',
            subtitle: 'Customize your preferences',
            icon: <Settings className="w-4 h-4" />,
            action: () => {
                onOpenSettings?.();
                onClose();
            },
            keywords: ['settings', 'preferences', 'config', 'customize'],
        },
        {
            id: 'profile',
            title: 'View Profile',
            subtitle: 'Manage your profile',
            icon: <User className="w-4 h-4" />,
            action: () => {
                onOpenProfile?.();
                onClose();
            },
            keywords: ['profile', 'account', 'user', 'me'],
        },
        {
            id: 'calculator',
            title: 'Grade Calculator',
            subtitle: 'Calculate what you need',
            icon: <Calculator className="w-4 h-4" />,
            action: () => {
                // Future: Open grade calculator
                onClose();
            },
            keywords: ['calculator', 'grade', 'calculate', 'predict'],
        },
    ];

    const filteredCommands = commands.filter((cmd) =>
        cmd.keywords.some((keyword) =>
            keyword.toLowerCase().includes(search.toLowerCase())
        ) ||
        cmd.title.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        if (isOpen) {
            setSearch('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < filteredCommands.length - 1 ? prev + 1 : prev
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                filteredCommands[selectedIndex]?.action();
            }
        },
        [filteredCommands, selectedIndex]
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden border-2 border-primary/20">
                <div className="flex items-center gap-3 border-b px-4 py-3 bg-muted/30">
                    <Search className="w-5 h-5 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a command or search..."
                        className="border-0 focus-visible:ring-0 bg-transparent text-base"
                        autoFocus
                    />
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-muted transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="max-h-[400px] overflow-y-auto p-2">
                    <AnimatePresence mode="popLayout">
                        {filteredCommands.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="p-8 text-center text-muted-foreground"
                            >
                                No commands found
                            </motion.div>
                        ) : (
                            filteredCommands.map((command, index) => (
                                <motion.button
                                    key={command.id}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.02 }}
                                    onClick={command.action}
                                    className={cn(
                                        'w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left',
                                        selectedIndex === index
                                            ? 'bg-primary/10 ring-2 ring-primary/30'
                                            : 'hover:bg-muted/50'
                                    )}
                                >
                                    <div className={cn(
                                        "p-2 rounded-md",
                                        selectedIndex === index ? "bg-primary text-primary-foreground" : "bg-muted"
                                    )}>
                                        {command.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium">{command.title}</div>
                                        {command.subtitle && (
                                            <div className="text-xs text-muted-foreground">
                                                {command.subtitle}
                                            </div>
                                        )}
                                    </div>
                                    {selectedIndex === index && (
                                        <div className="text-xs text-primary font-medium">↵</div>
                                    )}
                                </motion.button>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                <div className="border-t px-4 py-2 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex gap-3">
                        <span><kbd className="px-1.5 py-0.5 bg-background rounded">↑↓</kbd> Navigate</span>
                        <span><kbd className="px-1.5 py-0.5 bg-background rounded">↵</kbd> Select</span>
                        <span><kbd className="px-1.5 py-0.5 bg-background rounded">Esc</kbd> Close</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
