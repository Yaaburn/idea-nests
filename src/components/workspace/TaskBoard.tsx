import { useState, useCallback, memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreHorizontal, Pencil, Search, Filter, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TaskCard from "./TaskCard";
import InlineTaskComposer from "./InlineTaskComposer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Task, Column, COLUMN_STATUS_COLORS } from "./taskTypes";
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
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    color: "bg-amber-500",
    tasks: [
      {
        id: "3",
        title: "Design mobile app wireframes",
        description: "Create wireframes for farmer dashboard",
        tags: ["Design", "Mobile"],
        priority: "high",
        dueDate: "2025-01-20",
        milestone: "M01 - Nguyên mẫu",
        assignee: { name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
        externalLinks: [
          { url: "https://figma.com/file/abc123", label: "Wireframes" },
        ],
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
        assignee: { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
        externalLinks: [
          { url: "https://github.com/solarsense/firmware", label: "Repo" },
        ],
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
        assignee: { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
        externalLinks: [
          { url: "https://docs.google.com/document/d/xyz" },
        ],
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
        externalLinks: [
          { url: "https://github.com/solarsense/main" },
        ],
      },
      {
        id: "7",
        title: "Initial team meeting",
        tags: ["Meeting"],
        priority: "low",
      },
    ],
  },
];

const TaskBoard = () => {
  const [columns, setColumns] = useState(initialColumns);
  const [activeComposerColumn, setActiveComposerColumn] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Current user mock
  const currentUser = "Sarah Chen";

  // Log overdue events on mount for tasks past due date
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
          !task.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) {
        return false;
      }
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

  const handleDrop = useCallback((e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData("taskId");
    const sourceColumnId = e.dataTransfer.getData("sourceColumnId");

    if (!taskId || sourceColumnId === targetColumnId) return;

    setColumns(prev => {
      const newColumns = prev.map(col => ({ ...col, tasks: [...col.tasks] }));
      const sourceColumn = newColumns.find(c => c.id === sourceColumnId);
      const targetColumn = newColumns.find(c => c.id === targetColumnId);
      
      if (!sourceColumn || !targetColumn) return prev;

      const taskIndex = sourceColumn.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prev;

      const [task] = sourceColumn.tasks.splice(taskIndex, 1);
      targetColumn.tasks.push(task);

      // Log feed event for task moves
      logFeedEvent({
        type: targetColumnId === "done" ? "task_completed" : "task_moved",
        actor: currentUser,
        data: {
          taskId: task.id,
          taskTitle: task.title,
          columnFrom: sourceColumnId,
          columnTo: targetColumnId,
          milestone: task.milestone,
        },
      });

      return newColumns;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragEnter = useCallback((columnId: string) => {
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, columnId: string) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverColumn(null);
    }
  }, []);

  const handleOpenComposer = useCallback((columnId: string) => {
    setActiveComposerColumn(columnId);
  }, []);

  const handleCloseComposer = useCallback(() => {
    setActiveComposerColumn(null);
  }, []);

  const handleCreateTask = useCallback((task: Task) => {
    if (!activeComposerColumn) return;
    setColumns(prev => 
      prev.map(col => 
        col.id === activeComposerColumn 
          ? { ...col, tasks: [...col.tasks, task] }
          : col
      )
    );

    logFeedEvent({
      type: "task_created",
      actor: currentUser,
      data: {
        taskId: task.id,
        taskTitle: task.title,
        milestone: task.milestone,
      },
    });

    setActiveComposerColumn(null);
  }, [activeComposerColumn, currentUser]);

  return (
    <div className="space-y-4">
      {/* Board Header with Search & Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
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

          <Button
            variant={showMyTasks ? "default" : "outline"}
            size="sm"
            className={cn("gap-1.5 h-9", showMyTasks && "gradient-primary text-white")}
            onClick={() => setShowMyTasks(!showMyTasks)}
          >
            <User className="h-3.5 w-3.5" />
            My Tasks
          </Button>
        </div>

        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="h-3.5 w-3.5" />
          Edit board
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
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragStart={handleDragStart}
            onOpenComposer={handleOpenComposer}
            onCloseComposer={handleCloseComposer}
            onCreateTask={handleCreateTask}
          />
        ))}
      </div>
    </div>
  );
};

// Memoized column component
interface ColumnComponentProps {
  column: Column;
  filteredTasks: Task[];
  isComposerOpen: boolean;
  isDragOver: boolean;
  onDrop: (e: React.DragEvent, columnId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (columnId: string) => void;
  onDragLeave: (e: React.DragEvent, columnId: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string, columnId: string) => void;
  onOpenComposer: (columnId: string) => void;
  onCloseComposer: () => void;
  onCreateTask: (task: Task) => void;
}

const ColumnComponent = memo(({
  column,
  filteredTasks,
  isComposerOpen,
  isDragOver,
  onDrop,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDragStart,
  onOpenComposer,
  onCloseComposer,
  onCreateTask,
}: ColumnComponentProps) => {
  return (
    <div 
      className={cn(
        "flex-shrink-0 w-[320px] rounded-lg p-3 transition-all duration-200",
        isDragOver && "bg-primary/5 ring-2 ring-primary/20 ring-dashed"
      )}
      onDrop={(e) => onDrop(e, column.id)}
      onDragOver={onDragOver}
      onDragEnter={() => onDragEnter(column.id)}
      onDragLeave={(e) => onDragLeave(e, column.id)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full", COLUMN_STATUS_COLORS[column.id] || column.color)} />
          <h3 className="font-semibold">{column.title}</h3>
          <Badge variant="secondary" className="text-xs rounded-full h-5 w-5 p-0 flex items-center justify-center">
            {filteredTasks.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
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
            />
          ))
        )}

        {isComposerOpen ? (
          <InlineTaskComposer
            columnId={column.id}
            onClose={onCloseComposer}
            onCreate={onCreateTask}
          />
        ) : (
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50"
            onClick={() => onOpenComposer(column.id)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add task
          </Button>
        )}
      </div>
    </div>
  );
});

ColumnComponent.displayName = "ColumnComponent";

export default TaskBoard;
