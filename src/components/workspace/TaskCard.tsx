import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    assignee?: {
      name: string;
      avatar: string;
    };
    dueDate?: string;
    tags: string[];
    priority: "low" | "medium" | "high";
  };
  onDragStart: (e: React.DragEvent) => void;
}

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-secondary/20 text-secondary",
  high: "bg-accent/20 text-accent",
};

const TaskCard = ({ task, onDragStart }: TaskCardProps) => {
  return (
    <Card
      className="p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
      draggable
      onDragStart={onDragStart}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
          {task.title}
        </h4>
        <Badge className={cn("text-xs shrink-0", priorityColors[task.priority])}>
          {task.priority}
        </Badge>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        {task.tags.map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs px-2 py-0">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-between">
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

        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TaskCard;
