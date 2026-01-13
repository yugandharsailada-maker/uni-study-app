import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Check,
  ClipboardList,
  Copy,
  FileText,
  Plus,
  Trash2,
  ChevronDown,
  Target,
  X,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

import type { Assignment, Exam, StudyMaterial, Subject } from "@/types/curriculum";

import { DeferredNumberInput } from "@/components/DeferredNumberInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { toast } from "sonner";
import { saveFileHandle } from "@/lib/localFileStorage";

interface SubjectModalProps {
  subject: Subject | null;
  semesterId: string;
  predictedGrade: number | null;
  letterGrade: string;
  onClose: () => void;
  onUpdateSubject: (updates: Partial<Subject>) => void;
  onUpdateAssignment: (assignmentId: string, updates: Partial<Assignment>) => void;
  onAddAssignment: (assignment: Omit<Assignment, "id">) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onUpdateExam: (examId: string, updates: Partial<Exam>) => void;
  onAddMaterial: (material: Omit<StudyMaterial, "id" | "uploadedAt">) => void;
  onUpdateMaterial: (materialId: string, updates: Partial<StudyMaterial>) => void;
  onDeleteMaterial: (materialId: string) => void;
}

const DEFAULT_ASSIGNMENT: { name: string; weight: number; maxMarks: number; confidence: number; dueDate: string } = {
  name: "",
  weight: 10,
  maxMarks: 20,
  confidence: 80,
  dueDate: "",
};
const DEFAULT_RESOURCE = { name: "", path: "" };

export function SubjectModal({
  subject,
  semesterId,
  predictedGrade,
  letterGrade,
  onClose,
  onUpdateSubject,
  onUpdateAssignment,
  onAddAssignment,
  onDeleteAssignment,
  onUpdateExam,
  onAddMaterial,
  onUpdateMaterial,
  onDeleteMaterial,
}: SubjectModalProps) {
  const [activeTab, setActiveTab] = useState("assignments");

  // Use form persistence for draft data
  const formKey = subject ? `subject_${subject.id}` : "subject_new";
  const [newAssignment, setNewAssignment, clearAssignment] = useFormPersistence(
    `${formKey}_assignment`,
    DEFAULT_ASSIGNMENT,
  );
  const [newResource, setNewResource, clearResource] = useFormPersistence(
    `${formKey}_resource`,
    DEFAULT_RESOURCE,
  );

  // Local string draft for add-assignment inputs (so backspace works)
  const [newMaxMarksDraft, setNewMaxMarksDraft] = useState<string>(String(DEFAULT_ASSIGNMENT.maxMarks));

  const [expandedMaterialId, setExpandedMaterialId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!subject) return;
    setNewMaxMarksDraft(String(newAssignment.maxMarks ?? DEFAULT_ASSIGNMENT.maxMarks));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject?.id]);

  if (!subject) return null;

  const midsemWeight = subject.midsemWeight ?? 30;
  const endsemWeight = subject.endsemWeight ?? 50;

  // Exams are stored in DB, but keep a safe UI fallback.
  const exams: Exam[] = useMemo(() => {
    const existing = subject.exams || [];
    if (existing.length > 0) return existing;
    return [
      { id: "midsem", name: "Midsem", weight: midsemWeight, marksObtained: null, maxMarks: 30 },
      { id: "endsem", name: "Endsem", weight: endsemWeight, marksObtained: null, maxMarks: 50 },
    ];
  }, [subject.exams, midsemWeight, endsemWeight]);

  // Grade Target Calculator Logic
  const targetCalculation = useMemo(() => {
    if (!subject) return null;

    const midsemWeight = subject.midsemWeight ?? 30;
    const endsemWeight = subject.endsemWeight ?? 50;
    const remainingWeight = 100 - midsemWeight - endsemWeight;

    let currentScore = 0;

    // Midsem contribution
    const midsem = (subject.exams || []).find(e => e.name === 'Midsem');
    if (midsem && midsem.marksObtained !== null && midsem.maxMarks > 0) {
      currentScore += (midsem.marksObtained / midsem.maxMarks) * midsemWeight;
    }

    // Assignment contribution
    let totalObtained = 0;
    let totalMax = 0;
    (subject.assignments || []).forEach(a => {
      if (a.marksObtained !== null && a.maxMarks > 0) {
        totalObtained += a.marksObtained;
        totalMax += a.maxMarks;
      }
    });
    if (totalMax > 0) {
      currentScore += (totalObtained / totalMax) * remainingWeight;
    }

    const endsem = (subject.exams || []).find(e => e.name === 'Endsem');
    if (!endsem) return null;

    const targets = [
      { grade: 'A', score: 80 },
      { grade: 'B', score: 70 },
      { grade: 'C', score: 60 },
      { grade: 'D', score: 50 },
    ];

    return targets.map(t => {
      const neededFromEndsem = t.score - currentScore;
      const requiredMarks = (neededFromEndsem / endsemWeight) * endsem.maxMarks;
      return {
        ...t,
        requiredMarks: Math.max(0, requiredMarks),
        isPossible: requiredMarks <= endsem.maxMarks,
        alreadyReached: currentScore >= t.score
      };
    });
  }, [subject]);

  const handleMagicImport = async () => {
    try {
      // @ts-expect-error - File System Access API types might be missing in some envs
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{ description: 'PDF Files', accept: { 'application/pdf': ['.pdf'] } }],
        multiple: false,
      });

      if (!fileHandle) return;

      setIsAnalyzing(true);
      toast.info("Scanning Syllabus...", { description: "Extracting weightages and assignments." });

      // Persist handle locally
      await saveFileHandle(subject.id, fileHandle);

      // OLD: Edge Function approach (doesn't exist in new project)
      // const file = await fileHandle.getFile();
      // const text = await extractTextLocally(file);
      // const aiData = await parseSyllabusWithAI(text);

      // Redirect to new feature
      toast.info("🪄 AI Syllabus Import Moved!", {
        description: "Use the ✨ Magic Import button next to your Semester name for bulk AI subject creation!"
      });
      setIsAnalyzing(false);
      return;

      /* OLD CODE - DISABLED (unreachable after return above)
      // Apply updates (OLD CODE - DISABLED)
      onUpdateSubject({
        credits: aiData.credits,
        midsemWeight: aiData.weightages.midsem,
        endsemWeight: aiData.weightages.endsem,
      });

      // Update exam weights
      const midsem = subject.exams?.find(e => e.name === 'Midsem');
      const endsem = subject.exams?.find(e => e.name === 'Endsem');
      if (midsem) onUpdateExam(midsem.id, { weight: aiData.weightages.midsem });
      if (midsem) onUpdateExam(midsem.id, { weight: aiData.weightages.midsem });
      if (endsem) onUpdateExam(endsem.id, { weight: aiData.weightages.endsem });

      // Update topics (map AI topics to Subject topics structure)
      const newTopics = aiData.topics?.map(t => ({
        id: crypto.randomUUID(),
        title: t.title,
        importance: t.importance,
        estimatedHours: t.estimatedHours,
        completed: false
      })) || [];

      onUpdateSubject({ topics: newTopics });

      // Add suggested assignments
      if (aiData.assignments.length > 0) {
        aiData.assignments.forEach(a => {
          onAddAssignment({
            name: a.name,
            weight: a.weight,
            maxMarks: a.maxMarks || 100,
            marksObtained: null,
            confidence: 50
          });
        });
      }

      toast.success("Syllabus Imported!", {
        description: `Updated weights and added ${aiData.assignments.length} assignments.`
      });
      */

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Import failed:", error);
        toast.error("Import Failed", { description: error.message });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddAssignment = () => {
    const name = newAssignment.name.trim();
    if (!name) return;

    const parsedMax = newMaxMarksDraft.trim() === "" ? DEFAULT_ASSIGNMENT.maxMarks : Number(newMaxMarksDraft);
    const maxMarks = Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : DEFAULT_ASSIGNMENT.maxMarks;

    onAddAssignment({
      name,
      weight: newAssignment.weight,
      marksObtained: null,
      maxMarks,
      confidence: newAssignment.confidence,
      dueDate: newAssignment.dueDate ? new Date(newAssignment.dueDate) : undefined,
    });

    clearAssignment();
    setNewMaxMarksDraft(String(DEFAULT_ASSIGNMENT.maxMarks));
  };

  const handleAddResource = () => {
    if (newResource.name.trim()) {
      onAddMaterial({ name: newResource.name, localPath: newResource.path, type: "pdf" });
      clearResource();
    }
  };

  const handleCopyPath = async (path: string, id: string) => {
    if (path) {
      await navigator.clipboard.writeText(path);
      setCopiedId(id);
      toast.success("Path copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const toggleMaterialExpanded = (id: string) => {
    setExpandedMaterialId((prev) => (prev === id ? null : id));
  };

  const drawerTitle = `${subject.code} — ${subject.name}`;

  return (
    <Sheet
      open={!!subject}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 border-l border-border bg-background transition-all duration-300 ease-in-out z-[150] overflow-hidden flex flex-col"
        aria-label={drawerTitle}
      >
        {/* Loading Overlay */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center flex-col gap-4"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">Scanning Syllabus...</p>
            </motion.div>
          )}
        </AnimatePresence>

        <SheetHeader className="p-0 border-b border-border/10 bg-background relative z-20">
          {/* Main Header Card */}
          <div className="p-6 bg-gradient-to-b from-primary/5 to-transparent relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />

            <div className="flex flex-col gap-6 relative z-10">
              {/* Row 1: Title, Code, Credits */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md bg-secondary border border-border/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {subject.code}
                  </span>
                  <SheetTitle className="text-2xl font-bold tracking-tight text-foreground mb-0">
                    {subject.name}
                  </SheetTitle>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 bg-background/50 backdrop-blur border-primary/20 hover:border-primary/50 text-foreground hover:bg-primary/5"
                    onClick={handleMagicImport}
                    disabled={isAnalyzing}
                  >
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="hidden sm:inline">Import Syllabus</span>
                  </Button>

                  {/* Credits Aligned with Title */}
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border/10 hover:bg-secondary transition-colors">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Credits</span>
                    <div className="h-3 w-[1px] bg-border/20" />
                    <DeferredNumberInput
                      id="subject-credits"
                      value={subject.credits}
                      min={1}
                      max={20}
                      emptyCommitValue={3}
                      onCommit={(v) => onUpdateSubject({ credits: v ?? 3 })}
                      debounceMs={1000}
                      className="w-4 h-5 text-center bg-transparent border-0 p-0 text-sm font-bold text-foreground focus:ring-0"
                      aria-label="Subject credits"
                    />
                    <label htmlFor="subject-credits" className="sr-only">Credits</label>
                  </div>
                </div>
              </div>

              {/* Row 2: Stats Container (Predicted + Goal) */}
              <div className="grid grid-cols-2 gap-px bg-border/10 border border-border/10 rounded-2xl overflow-hidden">
                <div className="bg-card/30 p-4 flex flex-col items-center justify-center gap-1 hover:bg-card/50 transition-colors">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Predicted Grade</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-foreground">
                      {predictedGrade !== null ? `${predictedGrade.toFixed(1)}%` : "--"}
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      {letterGrade}
                    </span>
                  </div>
                </div>

                <div className="bg-card/30 p-4 flex flex-col items-center justify-center gap-1 hover:bg-card/50 transition-colors">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Target Goal</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-success/80">
                      {targetCalculation?.find(t => t.grade === 'A')?.isPossible ? '80%' : 'Max'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">for A</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-5 pt-2 border-b bg-background/20 sticky top-0 z-10 backdrop-blur-xl">
              <TabsList className="grid w-full grid-cols-4 h-9 mb-2 bg-muted/20">
                <TabsTrigger value="assignments" className="text-xs">Assignments</TabsTrigger>
                <TabsTrigger value="exams" className="text-xs">Exams</TabsTrigger>
                <TabsTrigger value="materials" className="text-xs">Materials</TabsTrigger>
                <TabsTrigger value="strategy" className="text-xs">Strategy</TabsTrigger>
              </TabsList>
            </div>

            {/* Assignments Tab */}
            <TabsContent value="assignments" className="p-3 space-y-3 mt-0">
              {/* Compact Add Section */}
              <div className="space-y-2 bg-muted/20 p-3 rounded-xl border border-border/10">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="New Assignment Name"
                      value={newAssignment.name}
                      onChange={(e) => setNewAssignment((prev) => ({ ...prev, name: e.target.value }))}
                      className="h-9 bg-background/50 border-border/10 focus:border-primary/50 text-sm placeholder:text-muted-foreground/50"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddAssignment()}
                      aria-label="New assignment name"
                    />
                  </div>
                  <div className="relative w-20">
                    <Input
                      type="number"
                      placeholder="100"
                      value={newMaxMarksDraft}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d*$/.test(val)) setNewMaxMarksDraft(val);
                      }}
                      className="h-9 bg-background/50 border-border/10 text-right pr-6 text-sm"
                      aria-label="Assignment max marks"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">pts</span>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-2">
                    <Input
                      type="datetime-local"
                      value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="h-9 flex-1 bg-background/50 border-border/10 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Due date and time"
                    />
                    <Button
                      onClick={handleAddAssignment}
                      disabled={!newAssignment.name.trim()}
                      className="flex-1 h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Assignment
                    </Button>
                  </div>

                  {/* Confidence Slider (Optional) */}
                  <div className="px-1 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      <span>Confidence Level</span>
                      <span>{newAssignment.confidence}%</span>
                    </div>
                    <Slider
                      value={[newAssignment.confidence]}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={(vals) => setNewAssignment(prev => ({ ...prev, confidence: vals[0] }))}
                      className="py-1 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {subject.assignments.length === 0 ? (
                    <div className="text-center p-6 border border-dashed border-border/20 rounded-xl bg-muted/5">
                      <p className="text-xs text-muted-foreground">No assignments yet. Add one above!</p>
                    </div>
                  ) : (
                    subject.assignments.map((assignment) => (
                      <motion.div
                        key={assignment.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <FragmentAssignmentRow
                          assignment={assignment}
                          onUpdate={(updates) => onUpdateAssignment(assignment.id, updates)}
                          onDelete={() => onDeleteAssignment(assignment.id)}
                        />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>

            {/* Exams Tab */}
            <TabsContent value="exams" className="p-5 space-y-3 mt-0">
              <section className="rounded-lg border bg-card overflow-hidden">
                <Table className="bg-card">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[40%]">Exam</TableHead>
                      <TableHead className="w-[20%]">Weight %</TableHead>
                      <TableHead className="w-[20%]">Max</TableHead>
                      <TableHead className="w-[20%]">Obtained</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams.map((exam) => {
                      const weightValue = exam.name === "Midsem" ? midsemWeight : endsemWeight;
                      const defaultMax = exam.name === "Midsem" ? 30 : 50;

                      return (
                        <TableRow key={exam.id}>
                          <TableCell className="font-medium">{exam.name}</TableCell>

                          <TableCell>
                            <DeferredNumberInput
                              value={weightValue}
                              min={0}
                              max={100}
                              emptyCommitValue={weightValue}
                              onCommit={(v) => {
                                const next = v ?? weightValue;
                                onUpdateSubject(exam.name === "Midsem" ? { midsemWeight: next } : { endsemWeight: next });
                              }}
                              debounceMs={1000}
                              aria-label={`${exam.name} weight`}
                            />
                          </TableCell>

                          <TableCell>
                            <DeferredNumberInput
                              value={exam.maxMarks ?? defaultMax}
                              min={1}
                              emptyCommitValue={defaultMax}
                              onCommit={(v) => {
                                const next = v ?? defaultMax;
                                onUpdateExam(exam.id, { maxMarks: next });
                              }}
                              debounceMs={1000}
                              aria-label={`${exam.name} max marks`}
                            />
                          </TableCell>

                          <TableCell>
                            <DeferredNumberInput
                              value={exam.marksObtained}
                              allowDecimal
                              placeholder="---"
                              min={0}
                              emptyCommitValue={null}
                              onCommit={(v) => onUpdateExam(exam.id, { marksObtained: v })}
                              debounceMs={1000}
                              aria-label={`${exam.name} marks obtained`}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </section>
            </TabsContent>

            {/* Study Material Tab */}
            <TabsContent value="materials" className="p-5 space-y-4 mt-0">
              {/* Add Resource */}
              <section className="p-3 rounded-lg border border-dashed bg-card">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Add Resource</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Resource name (e.g., Thomas Calculus)"
                    value={newResource.name}
                    onChange={(e) => setNewResource((prev) => ({ ...prev, name: e.target.value }))}
                    className="flex-1 h-9"
                    aria-label="Resource name"
                  />
                  <Input
                    placeholder="Local file path"
                    value={newResource.path}
                    onChange={(e) => setNewResource((prev) => ({ ...prev, path: e.target.value }))}
                    className="flex-1 h-9"
                    aria-label="Resource path"
                  />
                  <Button onClick={handleAddResource} size="sm" className="h-9" aria-label="Add resource">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </section>

              {/* Accordion Materials List */}
              <section className="space-y-1">
                {subject.materials?.length > 0 ? (
                  subject.materials.map((material) => (
                    <motion.div
                      key={material.id}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border bg-card overflow-hidden"
                    >
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleMaterialExpanded(material.id)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium truncate">{material.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteMaterial(material.id);
                            }}
                            aria-label="Delete resource"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <motion.div
                            animate={{ rotate: expandedMaterialId === material.id ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </motion.div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedMaterialId === material.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 pt-1 border-t border-border">
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Enter local file path"
                                  value={material.localPath}
                                  onChange={(e) => onUpdateMaterial(material.id, { localPath: e.target.value })}
                                  className="flex-1 h-8 text-xs"
                                  aria-label="Material local path"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1 shrink-0"
                                  onClick={() => handleCopyPath(material.localPath, material.id)}
                                  disabled={!material.localPath}
                                >
                                  {copiedId === material.id ? (
                                    <Check className="h-3.5 w-3.5" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                  Copy
                                </Button>
                              </div>
                              {material.localPath && (
                                <p className="text-xs text-muted-foreground mt-2 truncate">{material.localPath}</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No resources added yet</p>
                    <p className="text-xs opacity-70">Add study materials above</p>
                  </div>
                )}
              </section>
            </TabsContent>

            {/* Strategy Tab */}
            <TabsContent value="strategy" className="p-5 space-y-4 mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Target className="w-5 h-5 text-indigo-500" />
                      Tactical Roadmap
                    </h3>
                    <p className="text-xs text-muted-foreground">Priority topics based on credit weighting.</p>
                  </div>
                  {subject.topics && subject.topics.length > 0 && (
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {subject.topics.filter(t => t.completed).length} / {subject.topics.length} Covered
                    </span>
                  )}
                </div>

                {(!subject.topics || subject.topics.length === 0) ? (
                  <div className="text-center py-10 border-2 border-dashed rounded-xl bg-muted/10">
                    <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No strategy generated yet.</p>
                    <Button
                      variant="link"
                      className="text-xs text-indigo-500 h-auto p-0 mt-1"
                      onClick={handleMagicImport}
                    >
                      Run Magic Import to generate topics
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {subject.topics.map((topic) => (
                      <div
                        key={topic.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all",
                          topic.completed ? "bg-muted/30 opacity-60" : "bg-card hover:border-indigo-200"
                        )}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-6 w-6 rounded-full border-2 shrink-0", topic.completed ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30")}
                          onClick={() => {
                            const newTopics = subject.topics?.map(t =>
                              t.id === topic.id ? { ...t, completed: !t.completed } : t
                            );
                            onUpdateSubject({ topics: newTopics });
                          }}
                        >
                          {topic.completed && <Check className="w-3 h-3" />}
                        </Button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={cn("text-sm font-medium", topic.completed && "line-through")}>
                              {topic.title}
                            </p>
                            <span className={cn(
                              "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                              topic.importance === 'high' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                                topic.importance === 'medium' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                                  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            )}>
                              {topic.importance}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            Est. {topic.estimatedHours}h effort
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs >
        </div >
      </SheetContent >
    </Sheet >
  );
}

function FragmentAssignmentRow({
  assignment,
  onUpdate,
  onDelete,
}: {
  assignment: Assignment;
  onUpdate: (updates: Partial<Assignment>) => void;
  onDelete: () => void;
}) {
  const progress = assignment.marksObtained && assignment.maxMarks
    ? (assignment.marksObtained / assignment.maxMarks) * 100
    : 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 p-6 transition-all hover:bg-white hover:shadow-md">
      {/* Liquid Progress Background */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100/50 dark:bg-slate-800/50">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
        />
      </div>

      <div className="flex items-center justify-between gap-4 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="text-base font-semibold text-slate-700 dark:text-slate-200 truncate group-hover:text-indigo-600 transition-colors">
                {assignment.name}
              </span>
              {assignment.dueDate && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  Due {new Date(assignment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive -mr-2"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {/* Marks Input Group */}
            <div className="flex items-baseline gap-1 bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
              <DeferredNumberInput
                value={assignment.marksObtained}
                allowDecimal
                placeholder="--"
                className="w-12 text-2xl font-bold bg-transparent border-none p-0 h-auto focus:ring-0 text-foreground text-right placeholder:text-muted-foreground/30"
                debounceMs={1000}
                onCommit={(v) => onUpdate({ marksObtained: v })}
              />
              <span className="text-sm text-muted-foreground font-medium">/</span>
              <DeferredNumberInput
                value={assignment.maxMarks}
                min={1}
                className="w-8 text-sm text-muted-foreground font-medium bg-transparent border-none p-0 h-auto focus:ring-0"
                debounceMs={1000}
                onCommit={(v) => onUpdate({ maxMarks: v ?? 100 })}
              />
            </div>

            {/* Percentage Badge */}
            {assignment.marksObtained !== null && assignment.maxMarks > 0 && (
              <span className={cn(
                "text-xs font-bold px-2 py-1 rounded-md border",
                progress >= 80 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                  progress >= 40 ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                    "bg-rose-500/10 text-rose-600 border-rose-500/20"
              )}>
                {progress.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
