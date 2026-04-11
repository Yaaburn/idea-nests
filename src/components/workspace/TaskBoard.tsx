import { useState, useCallback, memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreHorizontal, Pencil, Search, Filter, User, Trash2, ArrowDownAZ, ListPlus, Edit3, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import TaskCard from "./TaskCard";
import InlineTaskComposer from "./InlineTaskComposer";
import BoardEditSidebar from "./BoardEditSidebar";
import DoDChecklistDialog from "./DoDChecklistDialog";
import { cn } from "@/lib/utils";
import { Task, Column, COLUMN_STATUS_COLORS, Milestone, BoardInfo, DoDItem, DEFAULT_DOD_ITEMS, PROJECT_MILESTONES } from "./taskTypes";
import { logFeedEvent } from "@/lib/eventLog";

const initialColumns: Column[] = [
  {
    id: "todo",
    title: "To Do",
    color: "bg-muted-foreground/60",
    tasks: [
      {
        id: "1",
        title: "Research competitor sensor systems",
        description: "Analyze existing solutions in the market",
        tags: ["Research"],
        priority: "medium",
        milestone: "M01 - Nguyên mẫu",
        createdAt: "2025-01-10T08:00:00Z",
        assignee: { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
        subtasks: [
          { id: "s1", title: "List competitors", completed: true },
          { id: "s2", title: "Compare features", completed: false },
          { id: "s3", title: "Write report", completed: false },
        ],
      },
      {
        id: "2",
        title: "Define hardware specifications",
        tags: ["Hardware", "Planning"],
        priority: "high",
        milestone: "M01 - Nguyên mẫu",
        visibility: "private",
        createdAt: "2025-01-11T08:00:00Z",
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    color: "bg-amber-500",
    wipLimit: 5,
    tasks: [
      {
        id: "3",
        title: "Design mobile app wireframes",
        description: "Create wireframes for farmer dashboard",
        tags: ["Design", "Mobile"],
        priority: "high",
        dueDate: "2025-01-20",
        milestone: "M01 - Nguyên mẫu",
        createdAt: "2025-01-08T08:00:00Z",
        assignee: { name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
        externalLinks: [{ url: "https://figma.com/file/abc123", label: "Wireframes" }],
        subtasks: [
          { id: "s4", title: "Dashboard layout", completed: true },
          { id: "s5", title: "Data visualization", completed: true },
          { id: "s6", title: "Mobile responsive", completed: false },
          { id: "s7", title: "User testing", completed: false },
        ],
      },
      {
        id: "4",
        title: "Implement sensor firmware v0.1",
        tags: ["Development", "Firmware"],
        priority: "high",
        dueDate: "2025-01-18",
        milestone: "M02 - MVP",
        createdAt: "2025-01-09T08:00:00Z",
        assignee: { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
        externalLinks: [{ url: "https://github.com/solarsense/firmware", label: "Repo" }],
      },
    ],
  },
  {
    id: "review",
    title: "In Review",
    color: "bg-amber-500",
    tasks: [
      {
        id: "5",
        title: "API documentation draft",
        tags: ["Documentation"],
        priority: "low",
        createdAt: "2025-01-12T08:00:00Z",
        assignee: { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
        externalLinks: [{ url: "https://docs.google.com/document/d/xyz" }],
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    color: "bg-emerald-500",
    tasks: [
      {
        id: "6",
        title: "Setup project repository",
        tags: ["Setup"],
        priority: "medium",
        createdAt: "2025-01-05T08:00:00Z",
        completedAt: "2025-01-07T18:00:00Z",
        externalLinks: [{ url: "https://github.com/solarsense/main" }],
      },
      {
        id: "7",
        title: "Initial team meeting",
        tags: ["Meeting"],
        priority: "low",
        createdAt: "2025-01-04T08:00:00Z",
        completedAt: "2025-01-04T12:00:00Z",
      },
    ],
  },
];

const initialMilestones: Milestone[] = PROJECT_MILESTONES.map((name, i) => ({
  id: `ms-${i}`,
  name,
}));

const TaskBoard = () => {
  const [columns, setColumns] = useState(initialColumns);
  const [activeComposerColumn, setActiveComposerColumn] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [editSidebarOpen, setEditSidebarOpen] = useState(false);
  const [boardInfo, setBoardInfo] = useState<BoardInfo>({ name: "SolarSense Project", description: "IoT sensor project for smart agriculture", visibility: "public" });
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [dodItems, setDodItems] = useState<DoDItem[]>(DEFAULT_DOD_ITEMS);

  // DoD dialog state
  const [dodDialogOpen, setDodDialogOpen] = useState(false);
  const [pendingDoDMove, setPendingDoDMove] = useState<{ taskId: string; sourceColumnId: string } | null>(null);

  // Column actions state
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState("");
  const [clearConfirmColumn, setClearConfirmColumn] = useState<string | null>(null);
  const [deleteConfirmColumn, setDeleteConfirmColumn] = useState<string | null>(null);

  const currentUser = "Sarah Chen";

  // Log overdue on mount
  useState(() => {
    const now = new Date();
    initialColumns.forEach(col => {
      if (col.id === "done") return;
      col.tasks.forEach(task => {
        if (task.dueDate && new Date(task.dueDate) < now) {
          logFeedEvent({
            type: "task_overdue",
            actor: "system",
            data: { taskId: task.id, taskTitle: task.title, milestone: task.milestone },
          });
        }
      });
    });
  });

  const filterTasks = useCallback((tasks: Task[]) => {
    return tasks.filter(task => {
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !task.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
      if (filterPriority !== "all" && task.priority !== filterPriority) return false;
      if (showMyTasks && task.assignee?.name !== currentUser) return false;
      return true;
    });
  }, [searchQuery, filterPriority, showMyTasks, currentUser]);

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string, sourceColumnId: string) => {
    if (activeComposerColumn) return;
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.setData("sourceColumnId", sourceColumnId);
  }, [activeComposerColumn]);

  const executeDrop = useCallback((taskId: string, sourceColumnId: string, targetColumnId: string) => {
    setColumns(prev => {
      const newColumns = prev.map(col => ({ ...col, tasks: [...col.tasks] }));
      const sourceColumn = newColumns.find(c => c.id === sourceColumnId);
      const targetColumn = newColumns.find(c => c.id === targetColumnId);
      if (!sourceColumn || !targetColumn) return prev;
      const taskIndex = sourceColumn.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prev;
      const [task] = sourceColumn.tasks.splice(taskIndex, 1);

      // Add timestamp for analytics
      const now = new Date().toISOString();
      task.statusHistory = [...(task.statusHistory || []), { status: targetColumnId, timestamp: now }];
      if (targetColumnId === "done") {
        task.completedAt = now;
      }

      targetColumn.tasks.push(task);

      logFeedEvent({
        type: targetColumnId === "done" ? "task_completed" : "task_moved",
        actor: currentUser,
        data: { taskId: task.id, taskTitle: task.title, columnFrom: sourceColumnId, columnTo: targetColumnId, milestone: task.milestone },
      });

      return newColumns;
    });
  }, [currentUser]);

  const handleDrop = useCallback((e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData("taskId");
    const sourceColumnId = e.dataTransfer.getData("sourceColumnId");
    if (!taskId || sourceColumnId === targetColumnId) return;

    // If moving to done, show DoD checklist
    if (targetColumnId === "done" && dodItems.length > 0) {
      setPendingDoDMove({ taskId, sourceColumnId });
      setDodDialogOpen(true);
      return;
    }

    executeDrop(taskId, sourceColumnId, targetColumnId);
  }, [dodItems.length, executeDrop]);

  const handleDoDConfirm = useCallback(() => {
    if (!pendingDoDMove) return;
    executeDrop(pendingDoDMove.taskId, pendingDoDMove.sourceColumnId, "done");
    setPendingDoDMove(null);
    setDodDialogOpen(false);
  }, [pendingDoDMove, executeDrop]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);
  const handleDragEnter = useCallback((columnId: string) => { setDragOverColumn(columnId); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) setDragOverColumn(null);
  }, []);

  const handleOpenComposer = useCallback((columnId: string) => { setActiveComposerColumn(columnId); }, []);
  const handleCloseComposer = useCallback(() => { setActiveComposerColumn(null); }, []);

  const handleCreateTask = useCallback((task: Task, columnId?: string) => {
    const targetCol = columnId || activeComposerColumn;
    if (!targetCol) return;
    const taskWithTimestamp = { ...task, createdAt: new Date().toISOString() };
    setColumns(prev => prev.map(col => col.id === targetCol ? { ...col, tasks: [...col.tasks, taskWithTimestamp] } : col));
    logFeedEvent({ type: "task_created", actor: currentUser, data: { taskId: task.id, taskTitle: task.title, milestone: task.milestone } });
    setActiveComposerColumn(null);
  }, [activeComposerColumn, currentUser]);

  const handleUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setColumns(prev => prev.map(col => ({
      ...col,
      tasks: col.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t),
    })));
  }, []);

  // Column actions
  const handleSortColumn = useCallback((columnId: string) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    setColumns(prev => prev.map(col => col.id === columnId
      ? { ...col, tasks: [...col.tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]) }
      : col
    ));
  }, []);

  const handleClearColumn = useCallback((columnId: string) => {
    setColumns(prev => prev.map(col => col.id === columnId ? { ...col, tasks: [] } : col));
    setClearConfirmColumn(null);
  }, []);

  const handleDeleteColumn = useCallback((columnId: string) => {
    setColumns(prev => prev.filter(col => col.id !== columnId));
    setDeleteConfirmColumn(null);
  }, []);

  const handleRenameColumn = useCallback((columnId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setColumns(prev => prev.map(col => col.id === columnId ? { ...col, title: newTitle.trim() } : col));
    setEditingColumnId(null);
  }, []);

  // Find pending DoD task title
  const pendingDoDTaskTitle = useMemo(() => {
    if (!pendingDoDMove) return "";
    for (const col of columns) {
      const task = col.tasks.find(t => t.id === pendingDoDMove.taskId);
      if (task) return task.title;
    }
    return "";
  }, [pendingDoDMove, columns]);

  return (
    <div className="space-y-4">
      {/* Board Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[120px] h-9">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button variant={showMyTasks ? "default" : "outline"} size="sm" className={cn("gap-1.5 h-9", showMyTasks && "gradient-primary text-white")} onClick={() => setShowMyTasks(!showMyTasks)}>
            <User className="h-3.5 w-3.5" />My Tasks
          </Button>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditSidebarOpen(true)}>
          <Pencil className="h-3.5 w-3.5" />Edit board
        </Button>
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <ColumnComponent
            key={column.id}
            column={column}
            filteredTasks={filterTasks(column.tasks)}
            isComposerOpen={activeComposerColumn === column.id}
            isDragOver={dragOverColumn === column.id}
            editingColumnId={editingColumnId}
            editingColumnTitle={editingColumnTitle}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragStart={handleDragStart}
            onOpenComposer={handleOpenComposer}
            onCloseComposer={handleCloseComposer}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onSortColumn={handleSortColumn}
            onStartRename={(id: string, title: string) => { setEditingColumnId(id); setEditingColumnTitle(title); }}
            onRenameColumn={handleRenameColumn}
            onEditingTitleChange={setEditingColumnTitle}
            onClearColumn={(id: string) => setClearConfirmColumn(id)}
            onDeleteColumn={(id: string) => setDeleteConfirmColumn(id)}
          />
        ))}
      </div>

      {/* Edit Board Sidebar */}
      <BoardEditSidebar
        open={editSidebarOpen}
        onOpenChange={setEditSidebarOpen}
        columns={columns}
        onColumnsChange={setColumns}
        boardInfo={boardInfo}
        onBoardInfoChange={setBoardInfo}
        milestones={milestones}
        onMilestonesChange={setMilestones}
        dodItems={dodItems}
        onDodItemsChange={setDodItems}
      />

      {/* DoD Checklist Dialog */}
      <DoDChecklistDialog
        open={dodDialogOpen}
        onOpenChange={(open) => { setDodDialogOpen(open); if (!open) setPendingDoDMove(null); }}
        taskTitle={pendingDoDTaskTitle}
        dodItems={dodItems}
        onConfirm={handleDoDConfirm}
      />

      {/* Clear Confirm Dialog */}
      <AlertDialog open={!!clearConfirmColumn} onOpenChange={() => setClearConfirmColumn(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Clear all tasks?</AlertDialogTitle>
            <AlertDialogDescription>This will remove all tasks from this column. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => clearConfirmColumn && handleClearColumn(clearConfirmColumn)}>Clear All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Column Confirm Dialog */}
      <AlertDialog open={!!deleteConfirmColumn} onOpenChange={() => setDeleteConfirmColumn(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Delete column?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this column and all tasks inside it.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteConfirmColumn && handleDeleteColumn(deleteConfirmColumn)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Column component
interface ColumnComponentProps {
  column: Column;
  filteredTasks: Task[];
  isComposerOpen: boolean;
  isDragOver: boolean;
  editingColumnId: string | null;
  editingColumnTitle: string;
  onDrop: (e: React.DragEvent, columnId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (columnId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, taskId: string, columnId: string) => void;
  onOpenComposer: (columnId: string) => void;
  onCloseComposer: () => void;
  onCreateTask: (task: Task, columnId?: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onSortColumn: (columnId: string) => void;
  onStartRename: (id: string, title: string) => void;
  onRenameColumn: (id: string, title: string) => void;
  onEditingTitleChange: (title: string) => void;
  onClearColumn: (id: string) => void;
  onDeleteColumn: (id: string) => void;
}

const ColumnComponent = memo(({
  column, filteredTasks, isComposerOpen, isDragOver,
  editingColumnId, editingColumnTitle,
  onDrop, onDragOver, onDragEnter, onDragLeave, onDragStart,
  onOpenComposer, onCloseComposer, onCreateTask, onUpdateTask,
  onSortColumn, onStartRename, onRenameColumn, onEditingTitleChange,
  onClearColumn, onDeleteColumn,
}: ColumnComponentProps) => {
  const isEditing = editingColumnId === column.id;
  const isOverWipLimit = column.wipLimit ? column.tasks.length > column.wipLimit : false;
  const isAtWipLimit = column.wipLimit ? column.tasks.length >= column.wipLimit : false;

  return (
    <div
      className={cn(
        "flex-shrink-0 w-[320px] rounded-lg p-3 transition-all duration-200",
        isDragOver && "bg-primary/5 ring-2 ring-primary/20 ring-dashed"
      )}
      onDrop={(e) => onDrop(e, column.id)}
      onDragOver={onDragOver}
      onDragEnter={() => onDragEnter(column.id)}
      onDragLeave={onDragLeave}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full", column.color)} />
          {isEditing ? (
            <Input
              autoFocus
              value={editingColumnTitle}
              onChange={(e) => onEditingTitleChange(e.target.value)}
              onBlur={() => onRenameColumn(column.id, editingColumnTitle)}
              onKeyDown={(e) => { if (e.key === "Enter") onRenameColumn(column.id, editingColumnTitle); if (e.key === "Escape") onRenameColumn(column.id, column.title); }}
              className="h-7 w-28 text-sm font-semibold"
            />
          ) : (
            <h3 className="font-semibold">{column.title}</h3>
          )}

          {/* Task count with WIP limit */}
          {column.wipLimit ? (
            <Badge
              variant="secondary"
              className={cn(
                "text-xs rounded-full px-2 h-5",
                isOverWipLimit && "bg-destructive/15 text-destructive border-destructive/30",
                isAtWipLimit && !isOverWipLimit && "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
              )}
            >
              {column.tasks.length}/{column.wipLimit}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs rounded-full h-5 w-5 p-0 flex items-center justify-center">
              {filteredTasks.length}
            </Badge>
          )}
        </div>

        {/* Column dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl bg-popover">
            <DropdownMenuItem onClick={() => onOpenComposer(column.id)} className="gap-2 cursor-pointer">
              <ListPlus className="h-4 w-4" />Add new task
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStartRename(column.id, column.title)} className="gap-2 cursor-pointer">
              <Edit3 className="h-4 w-4" />Edit column
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortColumn(column.id)} className="gap-2 cursor-pointer">
              <ArrowDownAZ className="h-4 w-4" />Sort by priority
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onClearColumn(column.id)} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4" />Clear all tasks
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDeleteColumn(column.id)} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4" />Delete column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3 min-h-[60px]">
        {filteredTasks.length === 0 && !isComposerOpen ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Chưa có task nào</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Nhấn "Add task" để thêm mới</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columnId={column.id}
              onDragStart={(e) => onDragStart(e, task.id, column.id)}
              onUpdateTask={onUpdateTask}
            />
          ))
        )}

        {isComposerOpen ? (
          <InlineTaskComposer columnId={column.id} onClose={onCloseComposer} onCreate={onCreateTask} />
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50"
            onClick={() => onOpenComposer(column.id)}
          >
            <Plus className="h-4 w-4 mr-2" />Add task
          </Button>
        )}
      </div>
    </div>
  );
});

ColumnComponent.displayName = "ColumnComponent";

export default TaskBoard;
