import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  X, 
  ChevronRight, 
  LayoutGrid, 
  Activity,
  ListTodo, 
  FileText, 
  MessageSquare, 
  Calendar as CalendarIcon,
  Video, 
  Users,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/layout/AppLayout";

// Workspace tab components
import TaskBoard from "@/components/workspace/TaskBoard";
import DocumentStages from "@/components/workspace/DocumentStages";
import Discussions from "@/components/workspace/Discussions";
import Meetings from "@/components/workspace/Meetings";
import Planner from "@/components/workspace/Planner/Planner";
import TeamMembers from "@/components/workspace/TeamMembers";

// Analysis - mount as-is
import ProjectAnalysisContent from "@/components/project-analysis/ProjectAnalysisContent";

type WorkspaceSection = "tasks" | "documents" | "discussion" | "planner" | "meeting" | "team" | "analysis";

interface SubItem {
  id: WorkspaceSection;
  label: string;
  icon: React.ElementType;
}

const workspaceSubItems: SubItem[] = [
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "discussion", label: "Discussion", icon: MessageSquare },
  { id: "planner", label: "Planner", icon: CalendarIcon },
  { id: "meeting", label: "Meeting", icon: Video },
  { id: "team", label: "Team", icon: Users },
];

// Mock project data
const getProjectData = (id: string) => ({
  id,
  name: id === "1" ? "SolarSense - Farm Monitoring" : 
        id === "2" ? "CodeMentor AI" : 
        id === "3" ? "HealthSync Dashboard" : `Project ${id}`,
  status: "in-progress" as const,
  notifications: 5,
});

const ProjectWorkspaceContent = () => {
  const { projectId, section } = useParams();
  const navigate = useNavigate();
  
  const [activeSection, setActiveSection] = useState<WorkspaceSection>(
    (section as WorkspaceSection) || "tasks"
  );
  const [isHoveringWorkspace, setIsHoveringWorkspace] = useState(false);

  const project = getProjectData(projectId || "1");

  // Sync section from URL
  useEffect(() => {
    if (section && section !== activeSection) {
      setActiveSection(section as WorkspaceSection);
    }
  }, [section]);

  const handleSectionChange = (newSection: WorkspaceSection) => {
    setActiveSection(newSection);
    navigate(`/workspace/${projectId}/${newSection}`, { replace: true });
  };

  const handleClose = () => {
    navigate("/your-projects");
  };

  const isAnalysis = activeSection === "analysis";
  const isWorkspaceSection = !isAnalysis;

  const getSectionLabel = () => {
    if (isAnalysis) return "Analysis";
    return workspaceSubItems.find((item) => item.id === activeSection)?.label || "Tasks";
  };

  return (
    <div className="flex h-screen">
      {/* Inner Sidebar (Project-specific) */}
      <aside className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0 animate-fade-in h-full">
        {/* Project Header */}
        <div className="p-4 border-b border-sidebar-border">
          <h2 className="font-bold text-sidebar-foreground truncate">{project.name}</h2>
          <Badge
            className={cn(
              "mt-2 text-xs capitalize",
              project.status === "in-progress"
                ? "bg-primary/20 text-primary"
                : project.status === "completed"
                ? "bg-green-500/20 text-green-400"
                : "bg-secondary/20 text-secondary"
            )}
          >
            {project.status.replace("-", " ")}
          </Badge>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto min-h-0">
          {/* Workspace - Main Item */}
          <div
            className={cn(
              "relative rounded-lg transition-all",
              isWorkspaceSection && "ring-1 ring-sidebar-border"
            )}
            onMouseEnter={() => setIsHoveringWorkspace(true)}
            onMouseLeave={() => setIsHoveringWorkspace(false)}
          >
            <button
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                "text-sidebar-foreground font-medium text-base",
                isWorkspaceSection && "bg-sidebar-primary/10"
              )}
            >
              <LayoutGrid className="h-5 w-5 text-sidebar-primary" />
              <span>Workspace</span>
            </button>

            {/* Sub-items */}
            <div className="pl-4 pb-2 space-y-0.5">
              {workspaceSubItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                      "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10",
                      isActive && "ring-2 ring-purple-400/50 bg-purple-500/10 text-sidebar-foreground font-medium"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive && "text-purple-400")} />
                    <span className="italic">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Analysis - Main Item */}
          <button
            onClick={() => handleSectionChange("analysis")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
              "text-sidebar-foreground font-medium text-base",
              "hover:bg-sidebar-accent/10",
              isAnalysis && "ring-2 ring-purple-400/50 bg-purple-500/10"
            )}
          >
            <Activity className={cn("h-5 w-5", isAnalysis && "text-purple-400")} />
            <span>Analysis</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Top Header Bar */}
        <header className="h-14 bg-background border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate("/your-projects")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Your Projects
            </button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground truncate max-w-[150px]">{project.name}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{getSectionLabel()}</span>
          </nav>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            aria-label="Close project workspace"
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-5 w-5" />
          </Button>
        </header>

        {/* Content Slot - Full height with proper overflow */}
        <main className="flex-1 min-h-0 overflow-auto">
          <div className="h-full p-6">
            {activeSection === "tasks" && <TaskBoard />}
            {activeSection === "documents" && <DocumentStages />}
            {activeSection === "discussion" && <Discussions />}
            {activeSection === "planner" && <Planner />}
            {activeSection === "meeting" && <Meetings />}
            {activeSection === "team" && <TeamMembers />}
            {activeSection === "analysis" && (
              <ProjectAnalysisContent projectId={projectId || "demo"} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

// Wrap with AppLayout to keep outer Sidebar
const ProjectWorkspace = () => {
  return (
    <AppLayout>
      <ProjectWorkspaceContent />
    </AppLayout>
  );
};

export default ProjectWorkspace;
