export interface ProjectAllocation {
  projectId: string;
  projectName: string;
  color: string;
  percentage: number;
}

export interface NetworkMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  initials: string;
  projects: ProjectAllocation[];
  contributions: number;
  reliability: number;
}

export interface NetworkEdge {
  id: string;
  fromId: string;
  toId: string;
  type: "code_review" | "discussion" | "task_collab" | "general";
  strength: number; // 1-10
  taskIds: string[];
}

export interface TaskFilter {
  id: string;
  name: string;
  projectId: string;
}

export interface EdgeInteraction {
  edge: NetworkEdge;
  fromMember: NetworkMember;
  toMember: NetworkMember;
}

export interface NodePosition {
  id: string;
  x: number;
  y: number;
}

export const EDGE_TYPE_CONFIG: Record<NetworkEdge["type"], { color: string; label: string; dashArray?: string }> = {
  code_review: { color: "hsl(217, 91%, 60%)", label: "Code Review" },
  discussion: { color: "hsl(142, 71%, 45%)", label: "Discussion" },
  task_collab: { color: "hsl(25, 95%, 53%)", label: "Task Collaboration" },
  general: { color: "hsl(var(--muted-foreground))", label: "General Communication", dashArray: "4 2" },
};

export const PROJECT_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(25, 95%, 53%)",
  "hsl(330, 81%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(262, 83%, 58%)",
  "hsl(0, 72%, 51%)",
];
