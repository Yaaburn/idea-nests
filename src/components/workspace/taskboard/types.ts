export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ExternalLink {
  id: string;
  url: string;
  type: "figma" | "github" | "drive" | "notion" | "other";
}

export interface StatusTransition {
  from: string;
  to: string;
  timestamp: string;
}

export interface Task {
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
  visibility: "private" | "public";
  milestoneId?: string;
  subtasks: SubTask[];
  externalLinks: ExternalLink[];
  transitions: StatusTransition[];
  createdAt: string;
  completedAt?: string;
}

export interface Milestone {
  id: string;
  name: string;
  code: string; // e.g. "M01"
  startDate?: string;
  endDate?: string;
}

export interface DoDCriterion {
  id: string;
  label: string;
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
  wipLimit?: number;
}

export interface BoardConfig {
  name: string;
  description: string;
  isPublic: boolean;
  milestones: Milestone[];
  dodCriteria: DoDCriterion[];
}

export interface EventLog {
  id: string;
  type: "task_completed" | "task_overdue" | "file_attached" | "status_changed";
  taskTitle: string;
  timestamp: string;
  details?: string;
}

// Utility: detect link type from URL
export function detectLinkType(url: string): ExternalLink["type"] {
  if (url.includes("figma.com")) return "figma";
  if (url.includes("github.com")) return "github";
  if (url.includes("drive.google.com")) return "drive";
  if (url.includes("notion.so") || url.includes("notion.site")) return "notion";
  return "other";
}

export const LINK_TYPE_LABELS: Record<ExternalLink["type"], string> = {
  figma: "Figma",
  github: "GitHub",
  drive: "Google Drive",
  notion: "Notion",
  other: "Link",
};

export const STATUS_COLORS: Record<string, string> = {
  "to-do": "bg-muted",
  "in-progress": "bg-amber-400",
  "review": "bg-blue-400",
  "done": "bg-emerald-400",
};

export const mockAssignees = [
  { id: "1", name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
  { id: "2", name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
  { id: "3", name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
];

export const EXISTING_TAGS = ["Design", "Development", "Research", "Bug", "Feature", "Documentation", "Testing", "UI", "UX", "API", "Mobile", "Backend", "Frontend", "DevOps", "Planning"];
