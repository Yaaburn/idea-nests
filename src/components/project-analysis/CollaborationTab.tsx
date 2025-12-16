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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Mock contribution over time data
const contributionData = [
  { week: "W1", code: 15, design: 8, docs: 5, demo: 2 },
  { week: "W2", code: 18, design: 10, docs: 6, demo: 3 },
  { week: "W3", code: 22, design: 7, docs: 8, demo: 1 },
  { week: "W4", code: 20, design: 12, docs: 4, demo: 4 },
  { week: "W5", code: 25, design: 9, docs: 7, demo: 2 },
  { week: "W6", code: 28, design: 11, docs: 6, demo: 5 },
];

// Mock top contributors
const topContributors = [
  {
    id: "1",
    name: "Alex Chen",
    role: "Tech Lead",
    avatar: "",
    contributions: 156,
    milestones: 8,
    reliability: 95,
    evidenceLinks: ["PR #142", "PR #138", "Design Review #23"],
    responsibilities: "Architecture, code review, team mentoring",
  },
  {
    id: "2",
    name: "Sarah Kim",
    role: "Full-Stack Dev",
    avatar: "",
    contributions: 124,
    milestones: 6,
    reliability: 92,
    evidenceLinks: ["PR #140", "PR #135", "API Docs"],
    responsibilities: "Backend development, API design, database",
  },
  {
    id: "3",
    name: "Emma Davis",
    role: "UI/UX Designer",
    avatar: "",
    contributions: 89,
    milestones: 5,
    reliability: 98,
    evidenceLinks: ["Figma v3.2", "User Test Report", "Design System"],
    responsibilities: "UI design, user research, prototyping",
  },
  {
    id: "4",
    name: "Mike Johnson",
    role: "Backend Dev",
    avatar: "",
    contributions: 98,
    milestones: 5,
    reliability: 88,
    evidenceLinks: ["PR #137", "PR #132", "Migration Script"],
    responsibilities: "Database optimization, DevOps, infrastructure",
  },
  {
    id: "5",
    name: "Tom Wilson",
    role: "Frontend Dev",
    avatar: "",
    contributions: 76,
    milestones: 4,
    reliability: 91,
    evidenceLinks: ["PR #141", "PR #136", "Component Library"],
    responsibilities: "React development, state management, testing",
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

// Mock network graph data (simplified for display)
const networkNodes = [
  { id: "Alex", role: "Lead", x: 50, y: 50 },
  { id: "Sarah", role: "Dev", x: 80, y: 30 },
  { id: "Mike", role: "Dev", x: 80, y: 70 },
  { id: "Emma", role: "Design", x: 20, y: 30 },
  { id: "Tom", role: "Dev", x: 20, y: 70 },
];

const networkEdges = [
  { from: "Alex", to: "Sarah", strength: 25 },
  { from: "Alex", to: "Mike", strength: 20 },
  { from: "Alex", to: "Emma", strength: 15 },
  { from: "Alex", to: "Tom", strength: 18 },
  { from: "Sarah", to: "Mike", strength: 12 },
  { from: "Sarah", to: "Tom", strength: 8 },
  { from: "Emma", to: "Tom", strength: 6 },
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

      {/* Contribution Over Time */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Contribution by Type</h3>
          <p className="text-sm text-muted-foreground">Weekly contribution breakdown by artifact type</p>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={contributionData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="week"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="code"
                stackId="1"
                stroke="hsl(217, 91%, 60%)"
                fill="hsl(217, 91%, 60%)"
                fillOpacity={0.8}
                name="Code"
              />
              <Area
                type="monotone"
                dataKey="design"
                stackId="1"
                stroke="hsl(330, 81%, 60%)"
                fill="hsl(330, 81%, 60%)"
                fillOpacity={0.8}
                name="Design"
              />
              <Area
                type="monotone"
                dataKey="docs"
                stackId="1"
                stroke="hsl(25, 95%, 53%)"
                fill="hsl(25, 95%, 53%)"
                fillOpacity={0.8}
                name="Docs"
              />
              <Area
                type="monotone"
                dataKey="demo"
                stackId="1"
                stroke="hsl(0, 72%, 51%)"
                fill="hsl(0, 72%, 51%)"
                fillOpacity={0.8}
                name="Demo"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Collaboration Network (Simplified) */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Collaboration Network</h3>
          <p className="text-sm text-muted-foreground">Who interacts with whom through reviews and feedback</p>
        </div>
        
        <div className="relative h-[250px] bg-muted/30 rounded-lg">
          <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible">
            {/* Edges */}
            {networkEdges.map((edge, i) => {
              const from = networkNodes.find(n => n.id === edge.from)!;
              const to = networkNodes.find(n => n.id === edge.to)!;
              return (
                <line
                  key={i}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="hsl(var(--primary))"
                  strokeWidth={edge.strength / 10}
                  strokeOpacity={0.3}
                />
              );
            })}
            {/* Nodes */}
            {networkNodes.map((node) => (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={6}
                  fill="hsl(var(--primary))"
                  className="transition-all hover:r-8"
                />
                <text
                  x={node.x}
                  y={node.y + 12}
                  textAnchor="middle"
                  className="text-[3px] fill-foreground"
                >
                  {node.id}
                </text>
              </g>
            ))}
          </svg>
        </div>
        
        <p className="text-xs text-muted-foreground mt-4">
          Line thickness represents interaction frequency. Hover over nodes to see details.
        </p>
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
                      <AvatarFallback>
                        {contributor.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-foreground">{contributor.name}</h4>
                      <Badge variant="outline" className="text-xs">{contributor.role}</Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{contributor.responsibilities}</p>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 mb-3">
                    <div className="flex items-center gap-1 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="font-medium">{contributor.contributions}</span>
                      <span className="text-muted-foreground">contributions</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Target className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{contributor.milestones}</span>
                      <span className="text-muted-foreground">milestones</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-muted-foreground">Reliability:</span>
                      <span className={`font-medium ${contributor.reliability >= 90 ? "text-green-500" : "text-yellow-500"}`}>
                        {contributor.reliability}%
                      </span>
                    </div>
                  </div>

                  {/* Evidence Links */}
                  <div className="flex flex-wrap gap-2">
                    {contributor.evidenceLinks.map((link) => (
                      <Button key={link} variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <ExternalLink className="h-3 w-3" />
                        {link}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
