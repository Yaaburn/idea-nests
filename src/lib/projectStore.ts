export interface TimelineArtifact {
  type: string;
  name: string;
}

export interface TimelineContributor {
  name: string;
  email?: string;
  avatar?: string;
}

export interface TimelineEntry {
  title: string;
  date: string;
  type: string;
  description: string;
  evidenceUrl: string;
  verification: string;
  artifacts: TimelineArtifact[];
  contributors: TimelineContributor[];
}

export interface ProjectRole {
  title: string;
  description: string;
  type: string; // Full-time, Part-time, Contract, Open
  commitment: string; // e.g. "20-30 hrs/week"
  equity: string; // e.g. "0.5-1.5%"
  skills: string[];
}

export interface CreatedProject {
  id: string;
  createdAt: string;
  // Step 1
  title: string;
  category: string;
  tags: string[];
  coverImage: string;
  // Step 2
  whyDoingThis: string;
  howWeWork: string;
  vision: string;
  // Step 3
  whatWeNeed: string;
  roles: ProjectRole[];
  // Step 4
  milestones: Array<{ title: string; date: string }>;
  // Step 5
  timelineEntries: TimelineEntry[];
  // Step 6
  integrationLinks: Array<{ platform: string; url: string }>;
  // Step 7
  founderAvatar: string;
  backgroundColor: string;
  // Step 8
  requireNDA: boolean;
  publicTeaser: boolean;
  publishedToFeed: boolean;
}

const STORAGE_KEY = "talentnet_created_projects";

export function getCreatedProjects(): CreatedProject[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getCreatedProjectById(id: string): CreatedProject | undefined {
  return getCreatedProjects().find((p) => p.id === id);
}

export function saveCreatedProject(project: CreatedProject): void {
  const projects = getCreatedProjects();
  projects.unshift(project);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function generateProjectId(): string {
  return "user-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
