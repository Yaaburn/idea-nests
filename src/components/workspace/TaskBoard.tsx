import { useState, useCallback, memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Pencil } from "lucide-react";
import TaskCard from "./TaskCard";
import InlineTaskComposer from "./InlineTaskComposer";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description?: string;
  assignee?: {
    id?: string;
    name: string;
    avatar: string;
  };
  dueDate?: string;
  tags: string[];
  priority: "low" | "medium" | "high";
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
}

const initialColumns: Column[] = [
  {
    id: "backlog",
    title: "Backlog",
    color: "bg-muted",
    tasks: [
      {
        id: "1",
        title: "Research competitor sensor systems",
        description: "Analyze existing solutions in the market",
        tags: ["Research"],
        priority: "medium",
        assignee: { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
      },
      {
        id: "2",
        title: "Define hardware specifications",
        tags: ["Hardware", "Planning"],
        priority: "high",
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    color: "bg-primary/20",
    tasks: [
      {
        id: "3",
        title: "Design mobile app wireframes",
        description: "Create wireframes for farmer dashboard",
        tags: ["Design", "Mobile"],
        priority: "high",
        dueDate: "2025-01-20",
        assignee: { name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
      },
      {
        id: "4",
        title: "Implement sensor firmware v0.1",
        tags: ["Development", "Firmware"],
        priority: "high",
        dueDate: "2025-01-18",
        assignee: { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
      },
    ],
  },
  {
    id: "review",
    title: "In Review",
    color: "bg-secondary/20",
    tasks: [
      {
        id: "5",
        title: "API documentation draft",
        tags: ["Documentation"],
        priority: "low",
        assignee: { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    color: "bg-accent/20",
    tasks: [
      {
        id: "6",
        title: "Setup project repository",
        tags: ["Setup"],
        priority: "medium",
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

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string, sourceColumnId: string) => {
    // Don't start drag if composer is open
    if (activeComposerColumn) return;
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.setData("sourceColumnId", sourceColumnId);
  }, [activeComposerColumn]);

  const handleDrop = useCallback((e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
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

      return newColumns;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
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
    setActiveComposerColumn(null);
  }, [activeComposerColumn]);

  return (
    <div className="space-y-4">
      {/* Board Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          This is a pre-made template, you can customize it to your needs
        </p>
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
            isComposerOpen={activeComposerColumn === column.id}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
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

// Memoized column component to prevent unnecessary re-renders
interface ColumnComponentProps {
  column: Column;
  isComposerOpen: boolean;
  onDrop: (e: React.DragEvent, columnId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, taskId: string, columnId: string) => void;
  onOpenComposer: (columnId: string) => void;
  onCloseComposer: () => void;
  onCreateTask: (task: Task) => void;
}

const ColumnComponent = memo(({
  column,
  isComposerOpen,
  onDrop,
  onDragOver,
  onDragStart,
  onOpenComposer,
  onCloseComposer,
  onCreateTask,
}: ColumnComponentProps) => {
  return (
    <div 
      className="flex-shrink-0 w-[320px]"
      onDrop={(e) => onDrop(e, column.id)}
      onDragOver={onDragOver}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full", column.color)} />
          <h3 className="font-semibold">{column.title}</h3>
          <Badge variant="secondary" className="text-xs rounded-full h-5 w-5 p-0 flex items-center justify-center">
            {column.tasks.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {column.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={(e) => onDragStart(e, task.id, column.id)}
          />
        ))}

        {/* Inline Task Composer */}
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
