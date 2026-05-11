import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2, Sparkles, CheckCircle2, History } from "lucide-react";
import { useGemini, ExtractedSubject } from "@/hooks/useGemini";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface MagicImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (subjects: ExtractedSubject[]) => void;
}

export function MagicImportModal({ isOpen, onClose, onImport }: MagicImportModalProps) {
    const [text, setText] = useState("");
    const { extractSyllabusData, isExtracting, fetchExtractionHistory, history } = useGemini();
    const [extractedPreview, setExtractedPreview] = useState<ExtractedSubject[] | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchExtractionHistory();
        }
    }, [isOpen, fetchExtractionHistory]);

    const handleExtract = async () => {
        if (!text.trim()) {
            toast.error("Please paste some text first!");
            return;
        }

        const data = await extractSyllabusData(text);
        if (data) {
            setExtractedPreview(data);
        }
    };

    const handleConfirm = () => {
        if (extractedPreview) {
            onImport(extractedPreview);
            toast.success(`Successfully added ${extractedPreview.length} subjects!`);
            handleClose();
        }
    };

    const handleClose = () => {
        setText("");
        setExtractedPreview(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                        <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                        Magic Syllabus Import
                    </DialogTitle>
                    <DialogDescription>
                        Paste your syllabus text below and let the AI extract subjects, codes, and credits automatically.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                    {!extractedPreview ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Syllabus Text</label>
                                <Textarea
                                    placeholder="Paste subject list, syllabus content, or course descriptions here..."
                                    className="min-h-[200px] resize-none focus-visible:ring-primary/20 transition-all border-border/60"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground italic">
                                    Tip: You can copy-paste from a PDF or website.
                                </p>
                            </div>

                            {history.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <History className="w-4 h-4" />
                                        Recent Imports
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {history.slice(0, 3).map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setExtractedPreview(item.subjects)}
                                                className="w-full text-left p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-all group"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium truncate max-w-[300px]">
                                                        {item.subjects.map(s => s.name).join(", ")}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(item.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {item.subjects.length} subjects found
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-foreground">Extracted Subjects ({extractedPreview.length})</h4>
                                <Button variant="ghost" size="sm" onClick={() => setExtractedPreview(null)} className="text-xs underline">
                                    Back to edit text
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {extractedPreview.map((subject, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 rounded-xl border bg-card/50 flex items-center justify-between group hover:border-primary/30 transition-colors"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-mono text-muted-foreground">{subject.code}</span>
                                            <span className="font-medium text-sm">{subject.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                                {subject.credits} Credits
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>

                <DialogFooter className="pt-4 border-t border-border/60">
                    {!extractedPreview ? (
                        <Button
                            onClick={handleExtract}
                            disabled={isExtracting || !text.trim()}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                        >
                            {isExtracting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Extracting Magic...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    Extract Subjects
                                </>
                            )}
                        </Button>
                    ) : (
                        <div className="flex gap-3 w-full">
                            <Button variant="outline" onClick={handleClose} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={handleConfirm} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Add All Subjects
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
