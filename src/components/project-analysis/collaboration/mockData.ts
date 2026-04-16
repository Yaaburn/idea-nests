import { NetworkMember, NetworkEdge, TaskFilter, NodePosition } from "./types";

// ──────────────────────────────────────────────────────────────
// Members – synced with Workspace › Team Members
// ──────────────────────────────────────────────────────────────
export const mockMembers: NetworkMember[] = [
  {
    id: "m1",
    name: "Sarah Chen",
    role: "Founder & Lead",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    initials: "SC",
    projects: [
      { projectId: "p1", projectName: "SolarSense Board", color: "hsl(217, 91%, 60%)", percentage: 60 },
      { projectId: "p2", projectName: "TalentNet Platform", color: "hsl(330, 81%, 60%)", percentage: 40 },
    ],
    contributions: 156,
    reliability: 95,
  },
  {
    id: "m2",
    name: "Alex Kim",
    role: "Lead Developer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    initials: "AK",
    projects: [
      { projectId: "p1", projectName: "SolarSense Board", color: "hsl(217, 91%, 60%)", percentage: 70 },
      { projectId: "p2", projectName: "TalentNet Platform", color: "hsl(330, 81%, 60%)", percentage: 30 },
    ],
    contributions: 124,
    reliability: 92,
  },
  {
    id: "m3",
    name: "Maria Lopez",
    role: "UX Designer",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    initials: "ML",
    projects: [
      { projectId: "p1", projectName: "SolarSense Board", color: "hsl(217, 91%, 60%)", percentage: 100 },
    ],
    contributions: 98,
    reliability: 88,
  },
  {
    id: "m4",
    name: "James Wilson",
    role: "Backend Developer",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    initials: "JW",
    projects: [
      { projectId: "p1", projectName: "SolarSense Board", color: "hsl(217, 91%, 60%)", percentage: 50 },
      { projectId: "p2", projectName: "TalentNet Platform", color: "hsl(330, 81%, 60%)", percentage: 50 },
    ],
    contributions: 89,
    reliability: 98,
  },
  {
    id: "m5",
    name: "Emily Watson",
    role: "Marketing Lead",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    initials: "EW",
    projects: [
      { projectId: "p2", projectName: "TalentNet Platform", color: "hsl(330, 81%, 60%)", percentage: 80 },
      { projectId: "p1", projectName: "SolarSense Board", color: "hsl(217, 91%, 60%)", percentage: 20 },
    ],
    contributions: 76,
    reliability: 91,
  },
];

// ──────────────────────────────────────────────────────────────
// Edges – collaboration links between team members
// ──────────────────────────────────────────────────────────────
export const mockEdges: NetworkEdge[] = [
  { id: "e1", fromId: "m1", toId: "m2", type: "code_review", strength: 8, taskIds: ["t1", "t2"] },
  { id: "e2", fromId: "m1", toId: "m3", type: "task_collab", strength: 7, taskIds: ["t3"] },
  { id: "e3", fromId: "m2", toId: "m3", type: "code_review", strength: 6, taskIds: ["t3"] },
  { id: "e4", fromId: "m1", toId: "m4", type: "discussion", strength: 5, taskIds: ["t4", "t5"] },
  { id: "e5", fromId: "m2", toId: "m4", type: "task_collab", strength: 6, taskIds: ["t4"] },
  { id: "e6", fromId: "m4", toId: "m5", type: "general", strength: 4, taskIds: ["t5", "t7"] },
  { id: "e7", fromId: "m1", toId: "m5", type: "discussion", strength: 3, taskIds: ["t7"] },
  { id: "e8", fromId: "m3", toId: "m5", type: "task_collab", strength: 5, taskIds: ["t3", "t7"] },
  { id: "e9", fromId: "m2", toId: "m5", type: "general", strength: 3, taskIds: ["t6"] },
  { id: "e10", fromId: "m3", toId: "m4", type: "discussion", strength: 3, taskIds: ["t3"] },
];

// ──────────────────────────────────────────────────────────────
// Tasks – synced with Workspace › TaskBoard
// ──────────────────────────────────────────────────────────────
export const mockTasks: TaskFilter[] = [
  { id: "t1", name: "Research competitor sensor systems", projectId: "p1" },
  { id: "t2", name: "Define hardware specifications", projectId: "p1" },
  { id: "t3", name: "Design mobile app wireframes", projectId: "p1" },
  { id: "t4", name: "Implement sensor firmware v0.1", projectId: "p1" },
  { id: "t5", name: "API documentation draft", projectId: "p1" },
  { id: "t6", name: "Setup project repository", projectId: "p1" },
  { id: "t7", name: "Initial team meeting", projectId: "p1" },
];

// ──────────────────────────────────────────────────────────────
// Projects
// ──────────────────────────────────────────────────────────────
export const mockProjects = [
  { id: "p1", name: "SolarSense Board", color: "hsl(217, 91%, 60%)" },
  { id: "p2", name: "TalentNet Platform", color: "hsl(330, 81%, 60%)" },
];

// ──────────────────────────────────────────────────────────────
// Positions – force-layout-like arrangement (canvas coordinates)
// ──────────────────────────────────────────────────────────────
export const mockPositions: NodePosition[] = [
  { id: "m1", x: 400, y: 300 },  // Sarah - center (Founder)
  { id: "m2", x: 220, y: 180 },  // Alex - top left (Lead Dev)
  { id: "m3", x: 580, y: 180 },  // Maria - top right (UX Designer)
  { id: "m4", x: 220, y: 420 },  // James - bottom left (Backend Dev)
  { id: "m5", x: 580, y: 420 },  // Emily - bottom right (Marketing)
];

// ──────────────────────────────────────────────────────────────
// AI Summaries for edge interactions
// ──────────────────────────────────────────────────────────────
export const mockAISummaries: Record<string, { summary: string; references: { type: string; title: string; date: string }[]; }> = {
  "e1": {
    summary: "Sarah and Alex have been closely collaborating on the sensor research and hardware spec tasks. Sarah reviewed 2 PRs from Alex and left 8 comments on the hardware specification document. Alex has 1 pending task awaiting Sarah's approval.",
    references: [
      { type: "PR", title: "PR #142 - Sensor comparison matrix", date: "2 hours ago" },
      { type: "Task", title: "Research competitor sensor systems", date: "Active" },
      { type: "Task", title: "Define hardware specifications", date: "Active" },
    ],
  },
  "e2": {
    summary: "Sarah and Maria are working together on the mobile app wireframes. Sarah provided product requirements and Maria translated them into wireframe prototypes. They have a weekly sync every Tuesday.",
    references: [
      { type: "Task", title: "Design mobile app wireframes", date: "Active" },
      { type: "Comment", title: "Dashboard layout feedback", date: "5 hours ago" },
      { type: "Figma", title: "Mobile App Wireframes v3", date: "Updated today" },
    ],
  },
  "e3": {
    summary: "Alex and Maria are reviewing the mobile app wireframes together. Alex provided technical feasibility feedback on Maria's designs, and Maria adjusted the UI based on API constraints.",
    references: [
      { type: "PR", title: "PR #144 - Component library setup", date: "3 hours ago" },
      { type: "Task", title: "Design mobile app wireframes", date: "Active" },
    ],
  },
};
