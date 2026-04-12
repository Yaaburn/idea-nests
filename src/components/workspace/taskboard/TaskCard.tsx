import { memo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, CheckSquare, Link2, Flag, Lock, Globe, Figma, Github } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task, Milestone, LINK_TYPE_LABELS } from "./types";

interface TaskCardProps {
  task: Task;
  milestones: Milestone[];
  onDragStart: (e: React.DragEvent) => void;
  onQuickEditPriority?: (taskId: string, priority: Task["priority"]) => void;
  onQuickEditAssignee?: (taskId: string, assigneeId: string | undefined) => void;
}

const priorityConfig = {
  low: { class: "bg-muted text-muted-foreground", icon: "↓" },
  medium: { class: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", icon: "→" },
  high: { class: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300", icon: "↑" },
};

const linkIcons: Record<string, React.ReactNode> = {
  figma: <Figma className="h-3 w-3" />,
  github: <Github className="h-3 w-3" />,
  drive: <span className="text-[10px] font-bold">G</span>,
  notion: <span className="text-[10px] font-bold">N</span>,
  other: <Link2 className="h-3 w-3" />,
};

const TaskCard = memo(({ task, milestones, onDragStart, onQuickEditPriority }: TaskCardProps) => {
  const [priorityCycling, setPriorityCycling] = useState(false);

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completedAt;
  const daysOverdue = isOverdue
    ? Math.ceil((Date.now() - new Date(task.dueDate!).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const milestone = milestones.find((m) => m.id === task.milestoneId);
  const completedSubs = task.subtasks.filter((s) => s.completed).length;
  const totalSubs = task.subtasks.length;

  const completionDays = task.completedAt && task.createdAt
    ? Math.ceil((new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const cyclePriority = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onQuickEditPriority) return;
    const order: Task["priority"][] = ["low", "medium", "high"];
    const idx = order.indexOf(task.priority);
    const next = order[(idx + 1) % 3];
    setPriorityCycling(true);
    onQuickEditPriority(task.id, next);
    setTimeout(() => setPriorityCycling(false), 200);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Card
        className={cn(
          "p-3.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group border-l-4",
          isOverdue ? "border-l-red-500 bg-red-50/30 dark:bg-red-500/5" : "border-l-transparent",
          task.visibility === "private" && "border-l-purple-400"
        )}
        draggable
        onDragStart={onDragStart}
      >
        {/* Top row: title + priority */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h4 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors flex-1">
            {task.visibility === "private" && <Lock className="h-3 w-3 inline mr-1 text-purple-500" />}
            {task.title}
          </h4>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                className={cn("text-xs shrink-0 cursor-pointer select-none transition-transform",
                  priorityConfig[task.priority].class,
                  priorityCycling && "scale-110"
                )}
                onClick={cyclePriority}
              >
                {priorityConfig[task.priority].icon} {task.priority}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">Click to change priority</TooltipContent>
          </Tooltip>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
        )}

        {/* Milestone badge */}
        {milestone && (
          <Badge variant="outline" className="text-xs mb-2 bg-primary/5 border-primary/20 text-primary">
            <Flag className="h-3 w-3 mr-1" />{milestone.code} — {milestone.name}
          </Badge>
        )}

        {/* Tags row */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-2 py-0">{tag}</Badge>
            ))}
          </div>
        )}

        {/* External links */}
        {task.externalLinks.length > 0 && (
          <div className="flex gap-1 mb-2">
            {task.externalLinks.map((link) => (
              <Tooltip key={link.id}>
                <TooltipTrigger asChild>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 w-6 rounded bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
                  >
                    {linkIcons[link.type]}
                  </a>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">{LINK_TYPE_LABELS[link.type]}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        {/* Bottom row: assignee, subtask progress, due date */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            {task.assignee ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={task.assignee.avatar} />
                    <AvatarFallback>{task.assignee.name[0]}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{task.assignee.name}</TooltipContent>
              </Tooltip>
            ) : (
              <div className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">?</span>
              </div>
            )}

            {totalSubs > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn("flex items-center gap-1 text-xs",
                    completedSubs === totalSubs ? "text-emerald-600" : "text-muted-foreground"
                  )}>
                    <CheckSquare className="h-3 w-3" />{completedSubs}/{totalSubs}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {completedSubs}/{totalSubs} subtasks completed
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="flex items-center gap-2">
            {completionDays !== null && (
              <span className="text-[10px] text-muted-foreground italic">
                Done in {completionDays}d
              </span>
            )}
            {task.dueDate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn("flex items-center gap-1 text-xs",
                    isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"
                  )}>
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                </TooltipTrigger>
                {isOverdue && (
                  <TooltipContent side="bottom" className="text-xs text-red-600">
                    Task này đã trễ {daysOverdue} ngày!
                  </TooltipContent>
                )}
              </Tooltip>
            )}
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
});

TaskCard.displayName = "EnhancedTaskCard";
export default TaskCard;
