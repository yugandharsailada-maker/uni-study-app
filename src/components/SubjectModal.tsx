import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Check,
  ClipboardList,
  Copy,
  FileText,
  GraduationCap,
  Plus,
  Trash2,
  ChevronDown,
} from "lucide-react";

import type { Assignment, Exam, StudyMaterial, Subject } from "@/types/curriculum";

import { DeferredNumberInput } from "@/components/DeferredNumberInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const DEFAULT_ASSIGNMENT = { name: "", weight: 10, maxMarks: 100 };
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

  useEffect(() => {
    if (!subject) return;
    setNewMaxMarksDraft(String(newAssignment.maxMarks ?? DEFAULT_ASSIGNMENT.maxMarks));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject?.id]);

  if (!subject) return null;

  const midsemWeight = subject.midsemWeight ?? 20;
  const endsemWeight = subject.endsemWeight ?? 40;

  // Exams are stored in DB, but keep a safe UI fallback.
  const exams: Exam[] = useMemo(() => {
    const existing = subject.exams || [];
    if (existing.length > 0) return existing;
    return [
      { id: "midsem", name: "Midsem", weight: midsemWeight, marksObtained: null, maxMarks: 30 },
      { id: "endsem", name: "Endsem", weight: endsemWeight, marksObtained: null, maxMarks: 50 },
    ];
  }, [subject.exams, midsemWeight, endsemWeight]);

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
      confidence: 50,
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
        className={cn(
          "p-0 bg-background w-full sm:w-[560px] md:w-[640px] max-w-none",
          "border-l",
        )}
        aria-label={drawerTitle}
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="p-5 border-b bg-background">
            <div className="flex items-start justify-between gap-4 pr-10">
              <div className="min-w-0">
                <SheetDescription className="text-xs font-medium uppercase tracking-wider">
                  {subject.code}
                </SheetDescription>
                <SheetTitle className="truncate">{subject.name}</SheetTitle>
              </div>

              <div className="shrink-0 text-right">
                <span className="text-xs text-muted-foreground">Predicted</span>
                <div className="flex items-center justify-end gap-2">
                  <AnimatePresence mode="wait">
                    {predictedGrade !== null ? (
                      <motion.span
                        key="grade"
                        initial={{ opacity: 0, filter: "blur(8px)" }}
                        animate={{ opacity: 1, filter: "blur(0px)" }}
                        className="text-lg font-bold"
                      >
                        {predictedGrade.toFixed(1)}%
                      </motion.span>
                    ) : (
                      <span className="text-sm gpa-pending">---</span>
                    )}
                  </AnimatePresence>
                  <span className="text-sm font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                    {letterGrade}
                  </span>
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-5 pt-4 border-b bg-background">
                <TabsList className="grid w-full grid-cols-3 h-10">
                  <TabsTrigger value="assignments" className="gap-2 text-sm">
                    <ClipboardList className="h-4 w-4" />
                    Assignments
                  </TabsTrigger>
                  <TabsTrigger value="exams" className="gap-2 text-sm">
                    <GraduationCap className="h-4 w-4" />
                    Exams
                  </TabsTrigger>
                  <TabsTrigger value="materials" className="gap-2 text-sm">
                    <BookOpen className="h-4 w-4" />
                    Study Material
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Assignments Tab */}
              <TabsContent value="assignments" className="p-5 space-y-4 mt-0">
                <section className="rounded-lg border bg-card overflow-hidden">
                  <Table className="bg-card">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[60%]">Assignment Name</TableHead>
                        <TableHead className="w-[20%]">Max Marks</TableHead>
                        <TableHead className="w-[20%]">Obtained</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subject.assignments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-sm text-muted-foreground">
                            No assignments yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        subject.assignments.map((assignment) => (
                          <FragmentAssignmentRow
                            key={assignment.id}
                            assignment={assignment}
                            onDelete={() => onDeleteAssignment(assignment.id)}
                            onUpdate={(updates) => onUpdateAssignment(assignment.id, updates)}
                          />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </section>

                {/* Add Assignment */}
                <section className="p-3 rounded-lg border border-dashed bg-card">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Assignment name"
                      value={newAssignment.name}
                      onChange={(e) => setNewAssignment((prev) => ({ ...prev, name: e.target.value }))}
                      className="flex-1 h-9"
                      aria-label="New assignment name"
                    />
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Max"
                      value={newMaxMarksDraft}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d*$/.test(val)) setNewMaxMarksDraft(val);
                      }}
                      className="w-24 h-9"
                      aria-label="New assignment max marks"
                    />
                    <Button onClick={handleAddAssignment} size="sm" className="h-9" aria-label="Add assignment">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </section>
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
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
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
  return (
    <>
      <TableRow>
        <TableCell className="py-2">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium truncate">{assignment.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
              aria-label="Delete assignment"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>

        <TableCell className="py-2">
          <DeferredNumberInput
            value={assignment.maxMarks}
            min={1}
            emptyCommitValue={100}
            debounceMs={1000}
            onCommit={(v) => {
              const next = v ?? 100;
              onUpdate({ maxMarks: next });
            }}
            aria-label="Assignment max marks"
          />
        </TableCell>

        <TableCell className="py-2">
          <DeferredNumberInput
            value={assignment.marksObtained}
            allowDecimal
            placeholder="---"
            min={0}
            emptyCommitValue={null}
            debounceMs={1000}
            onCommit={(v) => onUpdate({ marksObtained: v })}
            aria-label="Assignment marks obtained"
          />
        </TableCell>
      </TableRow>

      {assignment.marksObtained === null && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={3} className="pt-2 pb-4">
            <label className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
              <span>Confidence</span>
              <span className="font-medium text-foreground">{assignment.confidence}%</span>
            </label>
            <Slider
              value={[assignment.confidence]}
              onValueChange={([value]) => onUpdate({ confidence: value })}
              min={0}
              max={100}
              step={5}
              className={cn(
                assignment.confidence < 50
                  ? "[&_[role=slider]]:bg-warning"
                  : assignment.confidence < 80
                    ? "[&_[role=slider]]:bg-primary"
                    : "[&_[role=slider]]:bg-success",
              )}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
