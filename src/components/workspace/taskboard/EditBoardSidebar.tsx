import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Column, Milestone, DoDCriterion, BoardConfig, STATUS_COLORS } from "./types";

interface EditBoardSidebarProps {
  open: boolean;
  onClose: () => void;
  columns: Column[];
  config: BoardConfig;
  onUpdateConfig: (config: BoardConfig) => void;
  onUpdateColumns: (columns: Column[]) => void;
}

const COLOR_OPTIONS = [
  { label: "Gray", value: "bg-muted" },
  { label: "Yellow", value: "bg-amber-400" },
  { label: "Blue", value: "bg-blue-400" },
  { label: "Green", value: "bg-emerald-400" },
  { label: "Red", value: "bg-red-400" },
  { label: "Purple", value: "bg-purple-400" },
];

const EditBoardSidebar = memo(({ open, onClose, columns, config, onUpdateConfig, onUpdateColumns }: EditBoardSidebarProps) => {
  const [localConfig, setLocalConfig] = useState<BoardConfig>({ ...config });
  const [localColumns, setLocalColumns] = useState<Column[]>(columns.map((c) => ({ ...c })));

  if (!open) return null;

  const updateColumn = (id: string, updates: Partial<Column>) => {
    setLocalColumns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const addMilestone = () => {
    const code = `M${String(localConfig.milestones.length + 1).padStart(2, "0")}`;
    setLocalConfig((prev) => ({
      ...prev,
      milestones: [...prev.milestones, { id: `ms-${Date.now()}`, name: "", code, startDate: "", endDate: "" }],
    }));
  };

  const updateMilestone = (id: string, updates: Partial<Milestone>) => {
    setLocalConfig((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  };

  const removeMilestone = (id: string) => {
    setLocalConfig((prev) => ({ ...prev, milestones: prev.milestones.filter((m) => m.id !== id) }));
  };

  const addDoD = () => {
    setLocalConfig((prev) => ({
      ...prev,
      dodCriteria: [...prev.dodCriteria, { id: `dod-${Date.now()}`, label: "" }],
    }));
  };

  const updateDoD = (id: string, label: string) => {
    setLocalConfig((prev) => ({
      ...prev,
      dodCriteria: prev.dodCriteria.map((d) => (d.id === id ? { ...d, label } : d)),
    }));
  };

  const removeDoD = (id: string) => {
    setLocalConfig((prev) => ({ ...prev, dodCriteria: prev.dodCriteria.filter((d) => d.id !== id) }));
  };

  const handleSave = () => {
    onUpdateConfig(localConfig);
    onUpdateColumns(localColumns);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-[420px] bg-background border-l shadow-2xl z-50 flex flex-col animate-in slide-in-from-right-full duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Edit Board</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <Tabs defaultValue="columns" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-3 grid grid-cols-4">
            <TabsTrigger value="columns" className="text-xs">Columns</TabsTrigger>
            <TabsTrigger value="milestones" className="text-xs">Milestones</TabsTrigger>
            <TabsTrigger value="info" className="text-xs">Board Info</TabsTrigger>
            <TabsTrigger value="dod" className="text-xs">DoD</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Columns Tab */}
            <TabsContent value="columns" className="mt-0 space-y-3">
              {localColumns.map((col) => (
                <div key={col.id} className="p-3 rounded-xl border bg-card space-y-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Input value={col.title} onChange={(e) => updateColumn(col.id, { title: e.target.value })} className="flex-1 h-8" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-20 shrink-0">Color</Label>
                    <div className="flex gap-1">
                      {COLOR_OPTIONS.map((opt) => (
                        <button key={opt.value}
                          className={cn("h-6 w-6 rounded-full transition-all", opt.value,
                            col.color === opt.value && "ring-2 ring-primary ring-offset-2"
                          )}
                          onClick={() => updateColumn(col.id, { color: opt.value })}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-20 shrink-0">WIP Limit</Label>
                    <Input type="number" min={0} value={col.wipLimit || ""} placeholder="∞"
                      onChange={(e) => updateColumn(col.id, { wipLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="h-8 w-20" />
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Milestones Tab */}
            <TabsContent value="milestones" className="mt-0 space-y-3">
              {localConfig.milestones.map((ms) => (
                <div key={ms.id} className="p-3 rounded-xl border bg-card space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="shrink-0">{ms.code}</Badge>
                    <Input value={ms.name} placeholder="Milestone name" onChange={(e) => updateMilestone(ms.id, { name: e.target.value })} className="flex-1 h-8" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeMilestone(ms.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Start</Label>
                      <Input type="date" value={ms.startDate || ""} onChange={(e) => updateMilestone(ms.id, { startDate: e.target.value })} className="h-8" />
                    </div>
                    <div>
                      <Label className="text-xs">End</Label>
                      <Input type="date" value={ms.endDate || ""} onChange={(e) => updateMilestone(ms.id, { endDate: e.target.value })} className="h-8" />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full gap-2" onClick={addMilestone}><Plus className="h-4 w-4" />Add milestone</Button>
            </TabsContent>

            {/* Board Info Tab */}
            <TabsContent value="info" className="mt-0 space-y-4">
              <div>
                <Label>Board Name</Label>
                <Input value={localConfig.name} onChange={(e) => setLocalConfig((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={localConfig.description} onChange={(e) => setLocalConfig((p) => ({ ...p, description: e.target.value }))} rows={3} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={localConfig.isPublic} onCheckedChange={(v) => setLocalConfig((p) => ({ ...p, isPublic: v }))} />
                <Label>{localConfig.isPublic ? "Public" : "Private"}</Label>
              </div>
            </TabsContent>

            {/* DoD Tab */}
            <TabsContent value="dod" className="mt-0 space-y-3">
              <p className="text-xs text-muted-foreground">Tiêu chí kiểm tra trước khi task được coi là hoàn thành:</p>
              {localConfig.dodCriteria.map((d) => (
                <div key={d.id} className="flex items-center gap-2">
                  <Input value={d.label} placeholder="VD: Code review completed"
                    onChange={(e) => updateDoD(d.id, e.target.value)} className="flex-1 h-8" />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeDoD(d.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full gap-2" onClick={addDoD}><Plus className="h-4 w-4" />Add criterion</Button>
            </TabsContent>
          </div>
        </Tabs>

        <div className="p-4 border-t flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 gradient-primary text-white" onClick={handleSave}>Save changes</Button>
        </div>
      </div>
    </>
  );
});

EditBoardSidebar.displayName = "EditBoardSidebar";
export default EditBoardSidebar;
