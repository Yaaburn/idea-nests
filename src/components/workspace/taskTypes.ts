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
  createdAt?: string;
  completedAt?: string;
  statusHistory?: { status: string; timestamp: string }[];
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
  wipLimit?: number;
}

export interface Milestone {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
}

export interface BoardInfo {
  name: string;
  description: string;
  visibility: "public" | "private";
}

export interface DoDItem {
  id: string;
  label: string;
  required: boolean;
}

// Milestones for the project
export const PROJECT_MILESTONES = [
  "M01 - Nguyên mẫu",
  "M02 - MVP",
  "M03 - Beta Launch",
  "M04 - Public Release",
];

export const DEFAULT_DOD_ITEMS: DoDItem[] = [
  { id: "dod-1", label: "Code đã được review", required: true },
  { id: "dod-2", label: "Đã test trên mobile", required: true },
  { id: "dod-3", label: "Không có console error", required: true },
  { id: "dod-4", label: "Đã deploy lên staging", required: false },
  { id: "dod-5", label: "Documentation đã cập nhật", required: false },
];

// Column status colors aligned with US-19
export const COLUMN_STATUS_COLORS: Record<string, string> = {
  "todo": "bg-muted-foreground/60",
  "in-progress": "bg-amber-500",
  "review": "bg-amber-500",
  "done": "bg-emerald-500",
};

export const STATUS_COLOR_OPTIONS = [
  { label: "Grey", value: "bg-muted-foreground/60" },
  { label: "Yellow", value: "bg-amber-500" },
  { label: "Green", value: "bg-emerald-500" },
  { label: "Blue", value: "bg-blue-500" },
  { label: "Red", value: "bg-destructive" },
  { label: "Purple", value: "bg-purple-500" },
];

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

export const EXISTING_TAGS = ["Research", "Design", "Mobile", "Hardware", "Planning", "Development", "Firmware", "Documentation", "Setup", "Meeting", "UI", "Backend", "Testing", "Bug"];
