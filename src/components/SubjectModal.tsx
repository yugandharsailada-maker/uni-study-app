import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  FileText,
  ChevronDown,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Copy,
  Check,
} from 'lucide-react';
import { Subject, Assignment, Exam, StudyMaterial } from '@/types/curriculum';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useFormPersistence } from '@/hooks/useFormPersistence';

interface SubjectModalProps {
  subject: Subject | null;
  semesterId: string;
  predictedGrade: number | null;
  letterGrade: string;
  onClose: () => void;
  onUpdateAssignment: (assignmentId: string, updates: Partial<Assignment>) => void;
  onAddAssignment: (assignment: Omit<Assignment, 'id'>) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onUpdateExam: (examId: string, updates: Partial<Exam>) => void;
  onAddMaterial: (material: Omit<StudyMaterial, 'id' | 'uploadedAt'>) => void;
  onUpdateMaterial: (materialId: string, updates: Partial<StudyMaterial>) => void;
  onDeleteMaterial: (materialId: string) => void;
}

const DEFAULT_ASSIGNMENT = { name: '', weight: 10, maxMarks: 100 };
const DEFAULT_RESOURCE = { name: '', path: '' };

export function SubjectModal({
  subject,
  semesterId,
  predictedGrade,
  letterGrade,
  onClose,
  onUpdateAssignment,
  onAddAssignment,
  onDeleteAssignment,
  onUpdateExam,
  onAddMaterial,
  onUpdateMaterial,
  onDeleteMaterial,
}: SubjectModalProps) {
  const [activeTab, setActiveTab] = useState('assignments');
  
  // Use form persistence for draft data
  const formKey = subject ? `subject_${subject.id}` : 'subject_new';
  const [newAssignment, setNewAssignment, clearAssignment] = useFormPersistence(
    `${formKey}_assignment`,
    DEFAULT_ASSIGNMENT
  );
  const [newResource, setNewResource, clearResource] = useFormPersistence(
    `${formKey}_resource`,
    DEFAULT_RESOURCE
  );
  
  const [expandedMaterialId, setExpandedMaterialId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!subject) return null;

  const handleAddAssignment = () => {
    if (newAssignment.name.trim()) {
      onAddAssignment({
        name: newAssignment.name,
        weight: newAssignment.weight,
        marksObtained: null,
        maxMarks: newAssignment.maxMarks,
        confidence: 50,
      });
      clearAssignment(); // Clear persisted data after successful add
    }
  };

  const handleAddResource = () => {
    if (newResource.name.trim()) {
      onAddMaterial({ name: newResource.name, localPath: newResource.path, type: 'pdf' });
      clearResource(); // Clear persisted data after successful add
    }
  };

  const handleCopyPath = async (path: string, id: string) => {
    if (path) {
      await navigator.clipboard.writeText(path);
      setCopiedId(id);
      toast.success('Path copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const toggleMaterialExpanded = (id: string) => {
    setExpandedMaterialId(prev => prev === id ? null : id);
  };

  // Initialize exams if not present
  const exams = subject.exams || [
    { id: 'midsem', name: 'Midsem', weight: 30, marksObtained: null, maxMarks: 100 },
    { id: 'endsem', name: 'Endsem', weight: 50, marksObtained: null, maxMarks: 100 },
  ];

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-card border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b bg-card">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {subject.code}
                </span>
                <h2 className="text-lg font-bold">{subject.name}</h2>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Predicted</span>
                <div className="flex items-center gap-2">
                  <AnimatePresence mode="wait">
                    {predictedGrade !== null ? (
                      <motion.span
                        key="grade"
                        initial={{ opacity: 0, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
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
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Tabs Content */}
          <div className="max-h-[calc(85vh-80px)] overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-5 pt-4 border-b">
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
                <div className="space-y-3">
                  {subject.assignments.map((assignment) => (
                    <motion.div
                      key={assignment.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-lg border bg-secondary/30 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">{assignment.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeleteAssignment(assignment.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Weight (%)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={assignment.weight}
                            onChange={(e) =>
                              onUpdateAssignment(assignment.id, {
                                weight: Number(e.target.value),
                              })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Marks Obtained
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={assignment.marksObtained ?? ''}
                            placeholder="---"
                            onChange={(e) =>
                              onUpdateAssignment(assignment.id, {
                                marksObtained: e.target.value ? Number(e.target.value) : null,
                              })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Max Marks
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={assignment.maxMarks}
                            onChange={(e) =>
                              onUpdateAssignment(assignment.id, {
                                maxMarks: Number(e.target.value) || 100,
                              })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      {assignment.marksObtained === null && (
                        <div className="mt-3">
                          <label className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
                            <span>Confidence</span>
                            <span className="font-medium text-foreground">
                              {assignment.confidence}%
                            </span>
                          </label>
                          <Slider
                            value={[assignment.confidence]}
                            onValueChange={([value]) =>
                              onUpdateAssignment(assignment.id, { confidence: value })
                            }
                            min={0}
                            max={100}
                            step={5}
                            className={cn(
                              assignment.confidence < 50
                                ? '[&_[role=slider]]:bg-warning'
                                : assignment.confidence < 80
                                ? '[&_[role=slider]]:bg-primary'
                                : '[&_[role=slider]]:bg-success'
                            )}
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Add Assignment */}
                <div className="p-3 rounded-lg border border-dashed bg-secondary/20">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Assignment name"
                      value={newAssignment.name}
                      onChange={(e) =>
                        setNewAssignment((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="flex-1 h-9"
                    />
                    <Input
                      type="number"
                      placeholder="Weight %"
                      value={newAssignment.weight}
                      onChange={(e) =>
                        setNewAssignment((prev) => ({
                          ...prev,
                          weight: Number(e.target.value),
                        }))
                      }
                      className="w-20 h-9"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={newAssignment.maxMarks}
                      onChange={(e) =>
                        setNewAssignment((prev) => ({
                          ...prev,
                          maxMarks: Number(e.target.value),
                        }))
                      }
                      className="w-16 h-9"
                    />
                    <Button onClick={handleAddAssignment} size="sm" className="h-9">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Exams Tab */}
              <TabsContent value="exams" className="p-5 space-y-4 mt-0">
                <div className="space-y-3">
                  {exams.map((exam) => (
                    <motion.div
                      key={exam.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-lg border bg-secondary/30"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-lg">{exam.name}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Weight (%)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={exam.weight}
                            onChange={(e) =>
                              onUpdateExam(exam.id, { weight: Number(e.target.value) })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Marks Obtained
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={exam.marksObtained ?? ''}
                            placeholder="---"
                            onChange={(e) =>
                              onUpdateExam(exam.id, {
                                marksObtained: e.target.value ? Number(e.target.value) : null,
                              })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Max Marks
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={exam.maxMarks}
                            onChange={(e) =>
                              onUpdateExam(exam.id, {
                                maxMarks: Number(e.target.value) || 100,
                              })
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* Study Material Tab */}
              <TabsContent value="materials" className="p-5 space-y-4 mt-0">
                {/* Add Resource */}
                <div className="p-3 rounded-lg border border-dashed bg-secondary/20">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Add Resource</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Resource name (e.g., Thomas Calculus)"
                      value={newResource.name}
                      onChange={(e) =>
                        setNewResource((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="flex-1 h-9"
                    />
                    <Input
                      placeholder="Local file path"
                      value={newResource.path}
                      onChange={(e) =>
                        setNewResource((prev) => ({ ...prev, path: e.target.value }))
                      }
                      className="flex-1 h-9"
                    />
                    <Button onClick={handleAddResource} size="sm" className="h-9">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Accordion Materials List */}
                <div className="max-h-[300px] overflow-y-auto space-y-1">
                  {subject.materials?.length > 0 ? (
                    subject.materials.map((material) => (
                      <motion.div
                        key={material.id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg border bg-secondary/20 overflow-hidden"
                      >
                        {/* Resource Header - Clickable */}
                        <div
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/40 transition-colors"
                          onClick={() => toggleMaterialExpanded(material.id)}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{material.name}</span>
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

                        {/* Expanded Section */}
                        <AnimatePresence>
                          {expandedMaterialId === material.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-3 pt-1 border-t border-border/50">
                                <div className="flex items-center gap-2">
                                  <Input
                                    placeholder="Enter local file path"
                                    value={material.localPath}
                                    onChange={(e) =>
                                      onUpdateMaterial(material.id, { localPath: e.target.value })
                                    }
                                    className="flex-1 h-8 text-xs text-muted-foreground bg-background/50"
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
                                  <p className="text-xs text-muted-foreground/60 mt-2 truncate">
                                    {material.localPath}
                                  </p>
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
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
