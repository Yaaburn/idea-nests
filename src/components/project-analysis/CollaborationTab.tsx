import { KPICard } from "./KPICard";
import {
  Users,
  MessageSquare,
  Clock,
  GitPullRequest,
  ExternalLink,
  Target,
  CheckCircle2,
  Star
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import NetworkCanvas from "./collaboration/NetworkCanvas";
import ContributionChart from "./collaboration/ContributionChart";

// Top contributors – synced with Workspace › Team Members
const topContributors = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "Founder & Lead",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    contributions: 156,
    milestones: 8,
    reliability: 95,
    evidenceLinks: ["PR #142", "PR #138", "Design Review #23"],
    responsibilities: "Product strategy, architecture, team mentoring",
  },
  {
    id: "2",
    name: "Alex Kim",
    role: "Lead Developer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    contributions: 124,
    milestones: 6,
    reliability: 92,
    evidenceLinks: ["PR #140", "PR #135", "API Docs"],
    responsibilities: "TypeScript, Node.js, firmware development",
  },
  {
    id: "3",
    name: "Maria Lopez",
    role: "UX Designer",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    contributions: 98,
    milestones: 5,
    reliability: 88,
    evidenceLinks: ["Figma v3.2", "User Test Report", "Design System"],
    responsibilities: "UI design, user research, prototyping",
  },
  {
    id: "4",
    name: "James Wilson",
    role: "Backend Developer",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    contributions: 89,
    milestones: 5,
    reliability: 98,
    evidenceLinks: ["PR #137", "PR #132", "Migration Script"],
    responsibilities: "Python, PostgreSQL, Docker, infrastructure",
  },
  {
    id: "5",
    name: "Emily Watson",
    role: "Marketing Lead",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    contributions: 76,
    milestones: 4,
    reliability: 91,
    evidenceLinks: ["PR #141", "Content Strategy", "SEO Report"],
    responsibilities: "Content strategy, SEO, social media",
  },
];

// Mock collaboration metrics
const collaborationKpis = [
  {
    title: "Review Participation",
    value: "87%",
    subtitle: "of team members",
    icon: GitPullRequest,
    trend: { value: 12, direction: "up" as const },
    tooltip: "Team members who participated in code/design reviews",
    variant: "primary" as const,
  },
  {
    title: "Avg Response Time",
    value: "4.2h",
    subtitle: "to review requests",
    icon: Clock,
    trend: { value: 18, direction: "down" as const },
    tooltip: "Average time to respond to review or feedback requests",
    variant: "success" as const,
  },
  {
    title: "Feedback Comments",
    value: "234",
    subtitle: "this period",
    icon: MessageSquare,
    trend: { value: 8, direction: "up" as const },
    tooltip: "Total feedback comments across all work items",
    variant: "default" as const,
  },
  {
    title: "Active Collaborators",
    value: "8",
    subtitle: "team members",
    icon: Users,
    trend: { value: 2, direction: "up" as const },
    tooltip: "Team members with recent collaborative activity",
    variant: "default" as const,
  },
];

export const CollaborationTab = () => {
  return (
    <div className="space-y-6">
      {/* Collaboration KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {collaborationKpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Contribution Over Time – Enhanced Chart */}
      <ContributionChart />

      {/* Collaboration Network - Interactive Canvas */}
      <div>
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-foreground">Collaboration Network</h3>
          <p className="text-sm text-muted-foreground">
            Click a member to focus their connections. Click an edge to see AI-powered interaction summary. Use the task filter to scope by work context.
          </p>
        </div>
        <NetworkCanvas />
      </div>

      {/* Top Contributors Leaderboard */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Top Contributors</h3>
            <p className="text-sm text-muted-foreground">Ranked by verified contributions</p>
          </div>
          <Badge variant="outline" className="text-primary border-primary/20">
            This Period
          </Badge>
        </div>

        <div className="space-y-4">
          {topContributors.map((contributor, index) => (
            <div
              key={contributor.id}
              className="bg-muted/30 rounded-lg p-4 border border-border/50"
            >
              <div className="flex items-start gap-4">
                {/* Rank */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  {index < 3 ? (
                    <Star className={`h-4 w-4 ${index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-orange-400"}`} />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">{index + 1}</span>
                  )}
                </div>

                {/* Avatar & Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={contributor.avatar} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {contributor.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{contributor.name}</p>
                      <p className="text-xs text-muted-foreground">{contributor.role}</p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Contributions</p>
                      <p className="text-lg font-bold text-foreground">{contributor.contributions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Milestones</p>
                      <p className="text-lg font-bold text-foreground">{contributor.milestones}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reliability</p>
                      <div className="flex items-center gap-2">
                        <Progress value={contributor.reliability} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium text-foreground">{contributor.reliability}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Responsibilities */}
                  <p className="text-xs text-muted-foreground mb-2">{contributor.responsibilities}</p>

                  {/* Evidence Links */}
                  <div className="flex flex-wrap gap-1.5">
                    {contributor.evidenceLinks.map((link, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] gap-1 cursor-pointer hover:bg-secondary/80">
                        <ExternalLink className="h-2.5 w-2.5" />
                        {link}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* View Profile */}
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  <Target className="h-4 w-4 mr-1" />
                  Profile
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
