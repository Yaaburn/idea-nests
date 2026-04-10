import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Lock, Globe, CheckSquare, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task, getExternalLinkIcon, getExternalLinkLabel } from "./taskTypes";

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  high: "bg-destructive/15 text-destructive",
};

interface TaskCardProps {
  task: Task;
  columnId: string;
  onDragStart: (e: React.DragEvent) => void;
}

const TaskCard = ({ task, columnId, onDragStart }: TaskCardProps) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && columnId !== "done";

  const completedSubtasks = task.subtasks?.filter(s => s.completed).length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;

  return (
    <Card 
      className={cn(
        "p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group",
        isOverdue && "border-destructive/50 bg-destructive/5"
      )}
      draggable
      onDragStart={onDragStart}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {task.visibility === "private" && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
          <h4 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors truncate">
            {task.title}
          </h4>
        </div>
        <Badge className={cn("text-xs shrink-0", priorityColors[task.priority])}>
          {task.priority}
        </Badge>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Milestone badge */}
      {task.milestone && (
        <Badge variant="outline" className="text-xs mb-2 border-primary/30 text-primary">
          {task.milestone}
        </Badge>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {task.tags.map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs px-2 py-0">
            {tag}
          </Badge>
        ))}
      </div>

      {/* External links */}
      {task.externalLinks && task.externalLinks.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.externalLinks.map((link, i) => {
            const Icon = getExternalLinkIcon(link.url);
            const label = getExternalLinkLabel(link.url);
            return (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors bg-muted/50 rounded px-1.5 py-0.5"
                title={link.label || label}
                onClick={(e) => e.stopPropagation()}
              >
                <Icon className="h-3 w-3" />
                <span className="truncate max-w-[80px]">{link.label || label}</span>
              </a>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignee.avatar} />
              <AvatarFallback>{task.assignee.name[0]}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">?</span>
            </div>
          )}

          {/* Subtask progress */}
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckSquare className="h-3 w-3" />
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}
        </div>

        {task.dueDate && (
          <div className={cn(
            "flex items-center gap-1 text-xs",
            isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
          )}>
            <Calendar className="h-3 w-3" />
            <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TaskCard;
