import { Github, Figma, FileText, Link as LinkIcon, type LucideIcon } from "lucide-react";

export interface ExternalLink {
  url: string;
  label?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
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
  visibility?: "public" | "private";
  milestone?: string;
  externalLinks?: ExternalLink[];
  subtasks?: Subtask[];
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
}

// Milestones for the project
export const PROJECT_MILESTONES = [
  "M01 - Nguyên mẫu",
  "M02 - MVP",
  "M03 - Beta Launch",
  "M04 - Public Release",
];

// Column status colors aligned with US-19
export const COLUMN_STATUS_COLORS: Record<string, string> = {
  "todo": "bg-muted-foreground/60",       // Grey - Planned
  "in-progress": "bg-amber-500",           // Yellow - In Progress
  "review": "bg-amber-500",               // Yellow - In Review
  "done": "bg-emerald-500",               // Green - Done
};

// External link icon detection
const LINK_PATTERNS: { pattern: RegExp; icon: LucideIcon; label: string }[] = [
  { pattern: /github\.com/i, icon: Github, label: "GitHub" },
  { pattern: /figma\.com/i, icon: Figma, label: "Figma" },
  { pattern: /docs\.google\.com|drive\.google\.com/i, icon: FileText, label: "Google Drive" },
  { pattern: /notion\.so/i, icon: FileText, label: "Notion" },
  { pattern: /trello\.com/i, icon: FileText, label: "Trello" },
];

export function getExternalLinkIcon(url: string): LucideIcon {
  const match = LINK_PATTERNS.find(p => p.pattern.test(url));
  return match?.icon ?? LinkIcon;
}

export function getExternalLinkLabel(url: string): string {
  const match = LINK_PATTERNS.find(p => p.pattern.test(url));
  return match?.label ?? "Link";
}
