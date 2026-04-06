import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, SlidersHorizontal, Rocket, Flower2, User, Users, Clock, ChevronDown } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getCreatedProjects } from "@/lib/projectStore";

type SortOption = "newest" | "oldest" | "az" | "za";
type ProjectStatus = "in-progress" | "completed" | "upcoming";
type ProjectRole = "leader" | "mentor" | "member";

interface Project {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  stage: string;
  status: ProjectStatus;
  role: ProjectRole;
  leader: { name: string; avatar: string; isYou: boolean };
  progress: number;
  tags: string[];
  memberCount: number;
  daysLeft?: number;
  startsIn?: number;
}

const mockProjects: Project[] = [
  {
    id: "1",
    name: "SolarSense - Farm Monitoring",
    description: "Building low-cost solar sensors for farmers to monitor soil conditions and optimize crop yield.",
    coverImage: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400",
    stage: "Prototype",
    status: "in-progress",
    role: "leader",
    leader: { name: "You", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", isYou: true },
    progress: 65,
    tags: ["IoT", "Agriculture", "Hardware"],
    memberCount: 8,
    daysLeft: 45,
  },
  {
    id: "2",
    name: "CodeMentor AI",
    description: "AI-powered mentorship platform connecting junior developers with experienced engineers.",
    coverImage: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400",
    stage: "MVP",
    status: "in-progress",
    role: "mentor",
    leader: { name: "Marcus Johnson", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", isYou: false },
    progress: 80,
    tags: ["EdTech", "AI", "Community"],
    memberCount: 12,
    daysLeft: 30,
  },
  {
    id: "3",
    name: "HealthSync Dashboard",
    description: "Real-time health monitoring dashboard for remote patient care and telemedicine.",
    coverImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400",
    stage: "Alpha",
    status: "in-progress",
    role: "member",
    leader: { name: "Dr. Emily Watson", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", isYou: false },
    progress: 45,
    tags: ["HealthTech", "Dashboard", "React"],
    memberCount: 6,
    daysLeft: 60,
  },
  {
    id: "4",
    name: "EcoTrack Carbon Footprint",
    description: "Track and reduce your carbon footprint with AI-powered suggestions and community challenges.",
    coverImage: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400",
    stage: "Idea",
    status: "upcoming",
    role: "leader",
    leader: { name: "You", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", isYou: true },
    progress: 0,
    tags: ["Climate", "AI", "Mobile"],
    memberCount: 3,
    startsIn: 14,
  },
  {
    id: "5",
    name: "FinWise Budget Tracker",
    description: "Personal finance app with smart categorization and investment recommendations.",
    coverImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400",
    stage: "Demo Ready",
    status: "completed",
    role: "member",
    leader: { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", isYou: false },
    progress: 100,
    tags: ["FinTech", "Mobile", "AI"],
    memberCount: 5,
  },
  {
    id: "6",
    name: "StudyBuddy Platform",
    description: "Collaborative study platform with AI-generated quizzes and progress tracking.",
    coverImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400",
    stage: "Prototype",
    status: "in-progress",
    role: "mentor",
    leader: { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", isYou: false },
    progress: 55,
    tags: ["EdTech", "AI", "Collaboration"],
    memberCount: 7,
    daysLeft: 35,
  },
];

const sortLabels: Record<SortOption, string> = {
  newest: "Newest → Oldest",
  oldest: "Oldest → Newest",
  az: "A → Z",
  za: "Z → A",
};

const roleIcons: Record<ProjectRole, React.ReactNode> = {
  leader: <Rocket className="h-4 w-4" />,
  mentor: <Flower2 className="h-4 w-4" />,
  member: <User className="h-4 w-4" />,
};

const statusColors: Record<ProjectStatus, string> = {
  "in-progress": "bg-primary/20 text-primary",
  completed: "bg-green-500/20 text-green-600",
  upcoming: "bg-secondary/20 text-secondary",
};

const YourProjects = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const allProjects = useMemo(() => {
    const createdProjects = getCreatedProjects();
    const userProjects: Project[] = createdProjects.map((p) => ({
      id: p.id,
      name: p.title,
      description: p.vision || p.whyDoingThis || "No description",
      coverImage: p.coverImage || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400",
      stage: "Idea",
      status: "in-progress" as ProjectStatus,
      role: "leader" as ProjectRole,
      leader: { name: "You", avatar: p.founderAvatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", isYou: true },
      progress: 0,
      tags: p.tags.slice(0, 3),
      memberCount: 1,
      daysLeft: undefined,
    }));
    return [...userProjects, ...mockProjects];
  }, []);

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...allProjects];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    switch (sortBy) {
      case "newest":
        break; // already newest first
      case "oldest":
        result.reverse();
        break;
      case "az":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "za":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return result;
  }, [searchQuery, sortBy, allProjects]);

  const handleProjectClick = (projectId: string) => {
    navigate(`/workspace/${projectId}`);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your Projects</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {mockProjects.length} projects you're involved in
            </p>
          </div>

          {/* Filter & Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">{sortLabels[sortBy]}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={cn(sortBy === option && "bg-primary/10")}
                  >
                    {sortLabels[option]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Projects Grid - 3 per row on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedProjects.map((project) => (
            <Card
              key={project.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-primary/30 transition-all group"
              onClick={() => handleProjectClick(project.id)}
            >
              {/* Cover Image Area (~2/3 height) */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={project.coverImage}
                  alt={project.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Stage Label - Bottom Left */}
                <Badge className="absolute bottom-3 left-3 bg-background/90 text-foreground backdrop-blur-sm">
                  {project.stage}
                </Badge>
                {/* Role Icon - Top Right */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center">
                  {roleIcons[project.role]}
                </div>
              </div>

              {/* Info Area */}
              <div className="p-4 space-y-3">
                {/* Title + Status */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <Badge className={cn("shrink-0 text-xs capitalize", statusColors[project.status])}>
                    {project.status.replace("-", " ")}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>

                {/* Leader */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={project.leader.avatar} />
                    <AvatarFallback>{project.leader.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    By {project.leader.isYou ? "you" : project.leader.name}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <Progress value={project.progress} className="h-1.5" />
                  <span className="text-xs text-muted-foreground">{project.progress}% complete</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {project.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs px-2 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Footer: Members & Time */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{project.memberCount} members</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {project.status === "upcoming" && project.startsIn ? (
                      <span>Starts in {project.startsIn}d</span>
                    ) : project.status === "completed" ? (
                      <span>Completed</span>
                    ) : (
                      <span>{project.daysLeft}d left</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredAndSortedProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No projects found matching your search.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default YourProjects;
