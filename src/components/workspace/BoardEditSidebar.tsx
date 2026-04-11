import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Column, Milestone, BoardInfo, DoDItem, DEFAULT_DOD_ITEMS, STATUS_COLOR_OPTIONS, PROJECT_MILESTONES } from "./taskTypes";
import { Columns3, Flag, Info, ListChecks, Plus, Trash2, GripVertical, Lock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoardEditSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: Column[];
  onColumnsChange: (columns: Column[]) => void;
  boardInfo: BoardInfo;
  onBoardInfoChange: (info: BoardInfo) => void;
  milestones: Milestone[];
  onMilestonesChange: (milestones: Milestone[]) => void;
  dodItems: DoDItem[];
  onDodItemsChange: (items: DoDItem[]) => void;
}

const BoardEditSidebar = ({
  open,
  onOpenChange,
  columns,
  onColumnsChange,
  boardInfo,
  onBoardInfoChange,
  milestones,
  onMilestonesChange,
  dodItems,
  onDodItemsChange,
}: BoardEditSidebarProps) => {
  const [newDodLabel, setNewDodLabel] = useState("");
  const [newMilestoneName, setNewMilestoneName] = useState("");

  const updateColumn = (id: string, updates: Partial<Column>) => {
    onColumnsChange(columns.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addMilestone = () => {
    if (!newMilestoneName.trim()) return;
    onMilestonesChange([
      ...milestones,
      { id: `ms-${Date.now()}`, name: newMilestoneName.trim() },
    ]);
    setNewMilestoneName("");
  };

  const removeMilestone = (id: string) => {
    onMilestonesChange(milestones.filter(m => m.id !== id));
  };

  const addDodItem = () => {
    if (!newDodLabel.trim()) return;
    onDodItemsChange([
      ...dodItems,
      { id: `dod-${Date.now()}`, label: newDodLabel.trim(), required: false },
    ]);
    setNewDodLabel("");
  };

  const removeDodItem = (id: string) => {
    onDodItemsChange(dodItems.filter(d => d.id !== id));
  };

  const toggleDodRequired = (id: string) => {
    onDodItemsChange(dodItems.map(d => d.id === id ? { ...d, required: !d.required } : d));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:w-[480px] p-0 rounded-l-2xl overflow-y-auto">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="text-lg font-bold">Edit Board</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="columns" className="px-6 pb-6">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="columns" className="text-xs gap-1">
              <Columns3 className="h-3.5 w-3.5" />
              Columns
            </TabsTrigger>
            <TabsTrigger value="milestones" className="text-xs gap-1">
              <Flag className="h-3.5 w-3.5" />
              Milestones
            </TabsTrigger>
            <TabsTrigger value="info" className="text-xs gap-1">
              <Info className="h-3.5 w-3.5" />
              Board Info
            </TabsTrigger>
            <TabsTrigger value="dod" className="text-xs gap-1">
              <ListChecks className="h-3.5 w-3.5" />
              DoD
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Columns */}
          <TabsContent value="columns" className="space-y-4 mt-0">
            {columns.map((col) => (
              <div key={col.id} className="flex items-start gap-3 p-3 rounded-xl border bg-card">
                <GripVertical className="h-4 w-4 mt-2.5 text-muted-foreground shrink-0" />
                <div className="flex-1 space-y-3">
                  <Input
                    value={col.title}
                    onChange={(e) => updateColumn(col.id, { title: e.target.value })}
                    className="font-medium"
                  />
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-muted-foreground shrink-0">Color</Label>
                    <div className="flex gap-1.5">
                      {STATUS_COLOR_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 transition-all",
                            opt.value,
                            col.color === opt.value ? "border-primary scale-110" : "border-transparent"
                          )}
                          onClick={() => updateColumn(col.id, { color: opt.value })}
                          title={opt.label}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-muted-foreground shrink-0">WIP Limit</Label>
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      value={col.wipLimit ?? ""}
                      onChange={(e) => updateColumn(col.id, { wipLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="No limit"
                      className="w-24 h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Tab 2: Milestones */}
          <TabsContent value="milestones" className="space-y-4 mt-0">
            {milestones.map((ms) => (
              <div key={ms.id} className="flex items-start gap-3 p-3 rounded-xl border bg-card">
                <Flag className="h-4 w-4 mt-2 text-primary shrink-0" />
                <div className="flex-1 space-y-2">
                  <Input
                    value={ms.name}
                    onChange={(e) => onMilestonesChange(milestones.map(m => m.id === ms.id ? { ...m, name: e.target.value } : m))}
                    className="font-medium h-9"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Start</Label>
                      <Input
                        type="date"
                        value={ms.startDate || ""}
                        onChange={(e) => onMilestonesChange(milestones.map(m => m.id === ms.id ? { ...m, startDate: e.target.value } : m))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">End</Label>
                      <Input
                        type="date"
                        value={ms.endDate || ""}
                        onChange={(e) => onMilestonesChange(milestones.map(m => m.id === ms.id ? { ...m, endDate: e.target.value } : m))}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeMilestone(ms.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="New milestone name..."
                value={newMilestoneName}
                onChange={(e) => setNewMilestoneName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMilestone()}
                className="flex-1"
              />
              <Button size="sm" onClick={addMilestone} disabled={!newMilestoneName.trim()}>
                <Plus className="h-4 w-4 mr-1" />Add
              </Button>
            </div>
          </TabsContent>

          {/* Tab 3: Board Info */}
          <TabsContent value="info" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input
                value={boardInfo.name}
                onChange={(e) => onBoardInfoChange({ ...boardInfo, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={boardInfo.description}
                onChange={(e) => onBoardInfoChange({ ...boardInfo, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border bg-card">
              <div className="flex items-center gap-2">
                {boardInfo.visibility === "private" ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Globe className="h-4 w-4 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium">{boardInfo.visibility === "private" ? "Private" : "Public"} Board</p>
                  <p className="text-xs text-muted-foreground">
                    {boardInfo.visibility === "private" ? "Only team members can see" : "Anyone with the link can view"}
                  </p>
                </div>
              </div>
              <Switch
                checked={boardInfo.visibility === "private"}
                onCheckedChange={(checked) => onBoardInfoChange({ ...boardInfo, visibility: checked ? "private" : "public" })}
              />
            </div>
          </TabsContent>

          {/* Tab 4: DoD */}
          <TabsContent value="dod" className="space-y-4 mt-0">
            <p className="text-sm text-muted-foreground">
              Define criteria a task must meet before moving to "Done". Required items must be checked.
            </p>
            <Separator />
            {dodItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-card group">
                <Checkbox
                  checked={item.required}
                  onCheckedChange={() => toggleDodRequired(item.id)}
                />
                <span className="flex-1 text-sm">{item.label}</span>
                {item.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={() => removeDodItem(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Add DoD criteria..."
                value={newDodLabel}
                onChange={(e) => setNewDodLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addDodItem()}
                className="flex-1"
              />
              <Button size="sm" onClick={addDodItem} disabled={!newDodLabel.trim()}>
                <Plus className="h-4 w-4 mr-1" />Add
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default BoardEditSidebar;
