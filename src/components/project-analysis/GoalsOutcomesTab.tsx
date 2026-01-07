import { useState } from "react";
import { KPICard } from "./KPICard";
import { 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  Activity,
  Users,
  Rocket,
  FileText,
  Video,
  Lightbulb
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Mock OKRs
const okrs = [
  {
    id: "O1",
    objective: "Launch MVP to first 100 users",
    progress: 75,
    confidence: "high",
    keyResults: [
      { id: "KR1", title: "Complete core authentication flow", progress: 100, status: "done" },
      { id: "KR2", title: "Ship dashboard with key metrics", progress: 80, status: "on-track" },
      { id: "KR3", title: "Onboard 50 beta testers", progress: 48, status: "at-risk" },
    ],
  },
  {
    id: "O2",
    objective: "Build foundation for scale",
    progress: 60,
    confidence: "medium",
    keyResults: [
      { id: "KR4", title: "Implement payment integration", progress: 100, status: "done" },
      { id: "KR5", title: "Set up CI/CD pipeline", progress: 90, status: "on-track" },
      { id: "KR6", title: "Document API endpoints", progress: 40, status: "on-track" },
    ],
  },
];

// Mock milestone roadmap
const milestones = [
  { id: "M1", title: "Authentication System", status: "done", startWeek: 1, endWeek: 3, dependencies: [] },
  { id: "M2", title: "Core API Development", status: "done", startWeek: 2, endWeek: 5, dependencies: ["M1"] },
  { id: "M3", title: "Dashboard MVP", status: "in-progress", startWeek: 4, endWeek: 7, dependencies: ["M2"] },
  { id: "M4", title: "Payment Integration", status: "done", startWeek: 3, endWeek: 5, dependencies: ["M1"] },
  { id: "M5", title: "User Analytics", status: "upcoming", startWeek: 6, endWeek: 8, dependencies: ["M3"] },
  { id: "M6", title: "Mobile Responsive", status: "upcoming", startWeek: 7, endWeek: 9, dependencies: ["M3"] },
  { id: "M7", title: "Beta Launch", status: "upcoming", startWeek: 8, endWeek: 9, dependencies: ["M5", "M6"] },
];

// Mock outcome vs output data
const outcomeVsOutput = {
  outputs: [
    { label: "Tasks Completed", value: 127, icon: CheckCircle2 },
    { label: "Code Commits", value: 342, icon: Activity },
    { label: "Design Iterations", value: 28, icon: FileText },
    { label: "Documents Created", value: 15, icon: FileText },
  ],
  outcomes: [
    { label: "Demos Shipped", value: 3, icon: Video },
    { label: "User Tests Conducted", value: 5, icon: Users },
    { label: "Beta Signups", value: 48, icon: Rocket },
    { label: "Validated Learnings", value: 12, icon: Lightbulb },
  ],
};

const goalsKpis = [
  {
    title: "OKR Progress",
    value: "68%",
    subtitle: "overall completion",
    icon: Target,
    trend: { value: 12, direction: "up" as const },
    tooltip: "Average progress across all objectives",
    variant: "primary" as const,
  },
  {
    title: "On-track KRs",
    value: "5/6",
    subtitle: "key results",
    icon: TrendingUp,
    trend: { value: 1, direction: "up" as const },
    tooltip: "Key results on track or completed",
    variant: "success" as const,
  },
  {
    title: "Milestones Done",
    value: "3/7",
    subtitle: "completed",
    icon: CheckCircle2,
    trend: { value: 1, direction: "up" as const },
    tooltip: "Milestones completed this period",
    variant: "default" as const,
  },
  {
    title: "Days to Launch",
    value: "21",
    subtitle: "estimated",
    icon: Clock,
    trend: { value: 5, direction: "down" as const },
    tooltip: "Days until planned beta launch",
    variant: "primary" as const,
  },
];

const confidenceColors = {
  high: "text-green-500 bg-green-500/10",
  medium: "text-yellow-500 bg-yellow-500/10",
  low: "text-destructive bg-destructive/10",
};

const statusColors = {
  done: "bg-green-500",
  "on-track": "bg-blue-500",
  "at-risk": "bg-yellow-500",
  delayed: "bg-destructive",
  upcoming: "bg-muted-foreground",
  "in-progress": "bg-primary",
};

const totalWeeks = 10;

export const GoalsOutcomesTab = () => {
  const [expandedOkr, setExpandedOkr] = useState<string | null>("O1");

  // TODO: Future implementation - auto-update progress based on milestone/task completion
  // Milestone completion depends on "criteria that must be done" and those criteria include tasks.
  // Progress % should be computed from completed tasks.

  return (
    <div className="space-y-6">
      {/* Goals KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {goalsKpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* OKRs Section */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Objectives & Key Results</h3>
          <p className="text-sm text-muted-foreground">Track progress towards strategic goals</p>
        </div>

        <div className="space-y-4">
          {okrs.map((okr) => (
            <div key={okr.id} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedOkr(expandedOkr === okr.id ? null : okr.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <h4 className="font-medium text-foreground">{okr.objective}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={okr.progress} className="w-24 h-2" />
                      <span className="text-sm text-muted-foreground">{okr.progress}%</span>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", confidenceColors[okr.confidence as keyof typeof confidenceColors])}
                      >
                        {okr.confidence} confidence
                      </Badge>
                    </div>
                  </div>
                </div>
                <ChevronRight className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  expandedOkr === okr.id && "rotate-90"
                )} />
              </button>

              {expandedOkr === okr.id && (
                <div className="p-4 pt-0 border-t border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-3">Key Results</p>
                  <div className="space-y-3">
                    {okr.keyResults.map((kr) => (
                      <div key={kr.id} className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          statusColors[kr.status as keyof typeof statusColors]
                        )} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground">{kr.title}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {kr.status}
                              </Badge>
                              <span className="text-sm font-medium">{kr.progress}%</span>
                            </div>
                          </div>
                          <Progress value={kr.progress} className="h-1.5 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Milestone Roadmap (Gantt-style) */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Milestone Roadmap</h3>
          <p className="text-sm text-muted-foreground">Project timeline and dependencies</p>
        </div>

        {/* Week headers */}
        <div className="flex mb-2">
          <div className="w-48 flex-shrink-0" />
          <div className="flex-1 flex">
            {Array.from({ length: totalWeeks }, (_, i) => (
              <div key={i} className="flex-1 text-center text-xs text-muted-foreground">
                W{i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Milestone bars */}
        <div className="space-y-2">
          {milestones.map((milestone) => (
            <div key={milestone.id} className="flex items-center">
              <div className="w-48 flex-shrink-0 pr-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    statusColors[milestone.status as keyof typeof statusColors]
                  )} />
                  <span className="text-sm text-foreground truncate">{milestone.title}</span>
                </div>
              </div>
              <div className="flex-1 flex h-6 relative">
                {/* Grid lines */}
                {Array.from({ length: totalWeeks }, (_, i) => (
                  <div key={i} className="flex-1 border-l border-border/30" />
                ))}
                {/* Milestone bar */}
                <div
                  className={cn(
                    "absolute top-1 h-4 rounded-full",
                    statusColors[milestone.status as keyof typeof statusColors]
                  )}
                  style={{
                    left: `${((milestone.startWeek - 1) / totalWeeks) * 100}%`,
                    width: `${((milestone.endWeek - milestone.startWeek + 1) / totalWeeks) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className={cn("w-2 h-2 rounded-full", color)} />
              <span className="capitalize">{status.replace("-", " ")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Outcome vs Output */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Outcome vs Output</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Outputs */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="bg-muted">Outputs (Activity)</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {outcomeVsOutput.outputs.map((item) => (
                <div key={item.label} className="bg-muted/30 rounded-lg p-4 border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <item.icon className="h-4 w-4" />
                    <span className="text-xs">{item.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Outcomes */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Outcomes (Impact)
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {outcomeVsOutput.outcomes.map((item) => (
                <div key={item.label} className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                  <div className="flex items-center gap-2 text-primary/70 mb-2">
                    <item.icon className="h-4 w-4" />
                    <span className="text-xs">{item.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
