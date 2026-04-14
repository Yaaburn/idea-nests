import { useState, useCallback, memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Search, Filter, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import TaskCard from "./taskboard/TaskCard";
import ColumnMenu from "./taskboard/ColumnMenu";
import EnhancedTaskComposer from "./taskboard/EnhancedTaskComposer";
import EditBoardSidebar from "./taskboard/EditBoardSidebar";
import DoDChecklist from "./taskboard/DoDChecklist";
import { Task, Column, BoardConfig, Milestone, STATUS_COLORS, mockAssignees } from "./taskboard/types";
import { addEventLog } from "./taskboard/eventLog";

// Initial data
const defaultMilestones: Milestone[] = [
  { id: "ms-1", name: "Prototype", code: "M01", startDate: "2025-01-01", endDate: "2025-02-15" },
  { id: "ms-2", name: "MVP Launch", code: "M02", startDate: "2025-02-16", endDate: "2025-04-01" },
];

const defaultDoD = [
  { id: "dod-1", label: "Code review completed" },
  { id: "dod-2", label: "Tested on mobile" },
  { id: "dod-3", label: "No console errors" },
  { id: "dod-4", label: "Deployed to staging" },
];

const initialColumns: Column[] = [
  {
    id: "to-do", title: "To Do", color: "bg-muted", wipLimit: undefined,
    tasks: [
      {
        id: "1", title: "Research competitor sensor systems",
        description: "Analyze existing solutions in the market",
        tags: ["Research"], priority: "medium", visibility: "public",
        milestoneId: "ms-1", subtasks: [], externalLinks: [], transitions: [],
        createdAt: "2025-01-10T00:00:00Z",
        assignee: { id: "1", name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
      },
      {
        id: "2", title: "Define hardware specifications",
        tags: ["Hardware", "Planning"], priority: "high", visibility: "public",
        milestoneId: "ms-1", subtasks: [
          { id: "s1", title: "List sensor requirements", completed: true },
          { id: "s2", title: "Define power budget", completed: false },
          { id: "s3", title: "Select microcontroller", completed: false },
        ], externalLinks: [
          { id: "l1", url: "https://docs.google.com/document/d/example", type: "drive" },
        ], transitions: [], createdAt: "2025-01-08T00:00:00Z",
      },
    ],
  },
  {
    id: "in-progress", title: "In Progress", color: "bg-amber-400", wipLimit: 5,
    tasks: [
      {
        id: "3", title: "Design mobile app wireframes",
        description: "Create wireframes for farmer dashboard",
        tags: ["Design", "Mobile"], priority: "high", visibility: "public",
        dueDate: "2025-01-20", milestoneId: "ms-1",
        subtasks: [
          { id: "s4", title: "Home screen", completed: true },
          { id: "s5", title: "Dashboard view", completed: true },
          { id: "s6", title: "Settings page", completed: false },
          { id: "s7", title: "Notifications", completed: false },
        ],
        externalLinks: [
          { id: "l2", url: "https://figma.com/file/example", type: "figma" },
        ], transitions: [], createdAt: "2025-01-05T00:00:00Z",
        assignee: { id: "3", name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
      },
      {
        id: "4", title: "Implement sensor firmware v0.1",
        tags: ["Development", "Firmware"], priority: "high", visibility: "public",
        dueDate: "2025-01-18", milestoneId: "ms-2",
        subtasks: [], externalLinks: [
          { id: "l3", url: "https://github.com/example/repo", type: "github" },
        ], transitions: [], createdAt: "2025-01-06T00:00:00Z",
        assignee: { id: "2", name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
      },
    ],
  },
  {
    id: "review", title: "In Review", color: "bg-blue-400", wipLimit: undefined,
    tasks: [
      {
        id: "5", title: "API documentation draft",
        tags: ["Documentation"], priority: "low", visibility: "public",
        subtasks: [{ id: "s8", title: "Auth endpoints", completed: true }, { id: "s9", title: "Data endpoints", completed: false }],
        externalLinks: [{ id: "l4", url: "https://notion.so/example", type: "notion" }],
        transitions: [], createdAt: "2025-01-03T00:00:00Z",
        assignee: { id: "2", name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
      },
    ],
  },
  {
    id: "done", title: "Done", color: "bg-emerald-400", wipLimit: undefined,
    tasks: [
      {
        id: "6", title: "Setup project repository",
        tags: ["Setup"], priority: "medium", visibility: "public",
        subtasks: [], externalLinks: [{ id: "l5", url: "https://github.com/example/setup", type: "github" }],
        transitions: [], createdAt: "2025-01-01T00:00:00Z", completedAt: "2025-01-03T00:00:00Z",
      },
      {
        id: "7", title: "Initial team meeting",
        tags: ["Meeting"], priority: "low", visibility: "public",
        subtasks: [], externalLinks: [], transitions: [],
        createdAt: "2025-01-02T00:00:00Z", completedAt: "2025-01-02T00:00:00Z",
      },
    ],
  },
];

const TaskBoard = () => {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [activeComposerColumn, setActiveComposerColumn] = useState<string | null>(null);
  const [editBoardOpen, setEditBoardOpen] = useState(false);
  const [boardConfig, setBoardConfig] = useState<BoardConfig>({
    name: "SolarSense Board", description: "Main project board", isPublic: true,
    milestones: defaultMilestones, dodCriteria: defaultDoD,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterVisibility, setFilterVisibility] = useState<string>("all");

  // Column editing
  const [renamingColumnId, setRenamingColumnId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmClear, setConfirmClear] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // DoD checklist
  const [dodPending, setDodPending] = useState<{ taskId: string; sourceColId: string; targetColId: string } | null>(null);

  // Drag state
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Filter tasks
  const filterTask = useCallback((task: Task) => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !task.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    if (filterAssignee !== "all" && task.assignee?.id !== filterAssignee) return false;
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    if (filterVisibility !== "all" && task.visibility !== filterVisibility) return false;
    return true;
  }, [searchQuery, filterAssignee, filterPriority, filterVisibility]);

  // Milestone progress
  const getMilestoneProgress = useCallback((milestoneId: string) => {
    let total = 0, done = 0;
    columns.forEach((col) => {
      col.tasks.forEach((t) => {
        if (t.milestoneId === milestoneId) {
          total++;
          if (col.id === "done") done++;
        }
      });
    });
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [columns]);

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string, sourceColumnId: string) => {
    if (activeComposerColumn) return;
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.setData("sourceColumnId", sourceColumnId);
  }, [activeComposerColumn]);

  const executeDrop = useCallback((taskId: string, sourceColumnId: string, targetColumnId: string) => {
    setColumns((prev) => {
      const newCols = prev.map((c) => ({ ...c, tasks: [...c.tasks] }));
      const srcCol = newCols.find((c) => c.id === sourceColumnId);
      const tgtCol = newCols.find((c) => c.id === targetColumnId);
      if (!srcCol || !tgtCol) return prev;

      const taskIdx = srcCol.tasks.findIndex((t) => t.id === taskId);
      if (taskIdx === -1) return prev;

      const [task] = srcCol.tasks.splice(taskIdx, 1);
      task.transitions = [...task.transitions, {
        from: sourceColumnId, to: targetColumnId, timestamp: new Date().toISOString(),
      }];
      if (targetColumnId === "done" && !task.completedAt) {
        task.completedAt = new Date().toISOString();
        addEventLog({ type: "task_completed", taskTitle: task.title, details: `Moved to Done` });
        toast.success(`"${task.title}" hoàn thành! 🎉`);
      }
      tgtCol.tasks.push(task);
      return newCols;
    });
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const sourceColumnId = e.dataTransfer.getData("sourceColumnId");
    if (!taskId || sourceColumnId === targetColumnId) { setDragOverColumn(null); return; }

    if (targetColumnId === "done" && boardConfig.dodCriteria.length > 0) {
      setDodPending({ taskId, sourceColId: sourceColumnId, targetColId: targetColumnId });
      setDragOverColumn(null);
      return;
    }

    executeDrop(taskId, sourceColumnId, targetColumnId);
  }, [boardConfig.dodCriteria.length, executeDrop]);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback(() => { setDragOverColumn(null); }, []);

  const handleCreateTask = useCallback((task: Task) => {
    if (!activeComposerColumn) return;
    setColumns((prev) => prev.map((col) =>
      col.id === activeComposerColumn ? { ...col, tasks: [...col.tasks, task] } : col
    ));
    setActiveComposerColumn(null);
    addEventLog({ type: "status_changed", taskTitle: task.title, details: `Created in ${activeComposerColumn}` });
  }, [activeComposerColumn]);

  const handleQuickEditPriority = useCallback((taskId: string, priority: Task["priority"]) => {
    setColumns((prev) => prev.map((col) => ({
      ...col, tasks: col.tasks.map((t) => t.id === taskId ? { ...t, priority } : t),
    })));
  }, []);

  const handleSortByPriority = useCallback((columnId: string) => {
    const order = { high: 0, medium: 1, low: 2 };
    setColumns((prev) => prev.map((col) =>
      col.id === columnId ? { ...col, tasks: [...col.tasks].sort((a, b) => order[a.priority] - order[b.priority]) } : col
    ));
    toast.success("Tasks sorted by priority");
  }, []);

  const handleClearTasks = useCallback((columnId: string) => {
    setColumns((prev) => prev.map((col) => col.id === columnId ? { ...col, tasks: [] } : col));
    setConfirmClear(null);
    toast.success("All tasks cleared");
  }, []);

  const handleDeleteColumn = useCallback((columnId: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== columnId));
    setConfirmDelete(null);
    toast.success("Column deleted");
  }, []);

  const handleRenameColumn = useCallback((columnId: string) => {
    if (!renameValue.trim()) return;
    setColumns((prev) => prev.map((col) => col.id === columnId ? { ...col, title: renameValue.trim() } : col));
    setRenamingColumnId(null);
    setRenameValue("");
  }, [renameValue]);

  const dodTask = useMemo(() => {
    if (!dodPending) return null;
    for (const col of columns) {
      const t = col.tasks.find((t) => t.id === dodPending.taskId);
      if (t) return t;
    }
    return null;
  }, [dodPending, columns]);

  const hasActiveFilters = searchQuery || filterAssignee !== "all" || filterPriority !== "all" || filterVisibility !== "all";

  return (
    <div className="space-y-4">
      {/* Board Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9" />
          </div>
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Assignee" /></SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All members</SelectItem>
              {mockAssignees.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="high">↑ High</SelectItem>
              <SelectItem value="medium">→ Medium</SelectItem>
              <SelectItem value="low">↓ Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterVisibility} onValueChange={setFilterVisibility}>
            <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Visibility" /></SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">My tasks</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditBoardOpen(true)}>
          <Pencil className="h-3.5 w-3.5" />Edit board
        </Button>
      </div>

      {/* Milestone progress */}
      {boardConfig.milestones.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {boardConfig.milestones.map((ms) => {
            const pct = getMilestoneProgress(ms.id);
            return (
              <div key={ms.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card text-sm shrink-0">
                <Badge variant="outline" className="text-xs">{ms.code}</Badge>
                <span className="font-medium text-xs">{ms.name}</span>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{pct}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const filteredTasks = column.tasks.filter(filterTask);
          const isOverWip = column.wipLimit && column.tasks.length > column.wipLimit;

          return (
            <div key={column.id} className="flex-shrink-0 w-[320px]"
              onDrop={(e) => handleDrop(e, column.id)}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", column.color)} />
                  {renamingColumnId === column.id ? (
                    <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleRenameColumn(column.id)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleRenameColumn(column.id); if (e.key === "Escape") setRenamingColumnId(null); }}
                      autoFocus className="h-7 w-32" />
                  ) : (
                    <h3 className="font-semibold">{column.title}</h3>
                  )}
                  <Badge variant="secondary" className={cn(
                    "text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center",
                    isOverWip && "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                  )}>
                    {column.tasks.length}{column.wipLimit ? `/${column.wipLimit}` : ""}
                  </Badge>
                  {isOverWip && (
                    <span className="text-[10px] text-red-500 font-medium">WIP exceeded!</span>
                  )}
                </div>
                <ColumnMenu
                  columnId={column.id}
                  onAddTask={() => setActiveComposerColumn(column.id)}
                  onRenameColumn={() => { setRenamingColumnId(column.id); setRenameValue(column.title); }}
                  onSortByPriority={() => handleSortByPriority(column.id)}
                  onClearTasks={() => setConfirmClear(column.id)}
                  onDeleteColumn={() => setConfirmDelete(column.id)}
                />
              </div>

              {/* Drop zone */}
              <div className={cn(
                "space-y-3 min-h-[80px] rounded-xl p-1 transition-all duration-200",
                dragOverColumn === column.id && "bg-primary/5 ring-2 ring-primary/20 ring-dashed"
              )}>
                {filteredTasks.length === 0 && !activeComposerColumn ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ClipboardList className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {hasActiveFilters ? "Không tìm thấy task phù hợp" : "Chưa có task nào, hãy thêm mới!"}
                    </p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      milestones={boardConfig.milestones}
                      onDragStart={(e) => handleDragStart(e, task.id, column.id)}
                      onQuickEditPriority={handleQuickEditPriority}
                    />
                  ))
                )}

                {activeComposerColumn === column.id ? (
                  <EnhancedTaskComposer
                    columnId={column.id}
                    milestones={boardConfig.milestones}
                    onClose={() => setActiveComposerColumn(null)}
                    onCreate={handleCreateTask}
                  />
                ) : (
                  <Button variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    onClick={() => setActiveComposerColumn(column.id)}>
                    <Plus className="h-4 w-4 mr-2" />Add task
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Board Sidebar */}
      <EditBoardSidebar
        open={editBoardOpen}
        onClose={() => setEditBoardOpen(false)}
        columns={columns}
        config={boardConfig}
        onUpdateConfig={setBoardConfig}
        onUpdateColumns={setColumns}
      />

      {/* DoD Checklist Dialog */}
      {dodPending && dodTask && (
        <DoDChecklist
          open={true}
          criteria={boardConfig.dodCriteria}
          taskTitle={dodTask.title}
          onConfirm={() => { executeDrop(dodPending.taskId, dodPending.sourceColId, dodPending.targetColId); setDodPending(null); }}
          onCancel={() => setDodPending(null)}
        />
      )}

      {/* Confirm Clear */}
      <AlertDialog open={!!confirmClear} onOpenChange={(v) => { if (!v) setConfirmClear(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tất cả task?</AlertDialogTitle>
            <AlertDialogDescription>Tất cả task trong cột này sẽ bị xóa vĩnh viễn.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmClear && handleClearTasks(confirmClear)} className="bg-destructive text-destructive-foreground">Xóa tất cả</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete Column */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => { if (!v) setConfirmDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa cột này?</AlertDialogTitle>
            <AlertDialogDescription>Cột và tất cả task bên trong sẽ bị xóa vĩnh viễn.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && handleDeleteColumn(confirmDelete)} className="bg-destructive text-destructive-foreground">Xóa cột</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TaskBoard;
