import { KPICard } from "./KPICard";
import { HealthGauge } from "./HealthGauge";
import { 
  CalendarDays, 
  Target, 
  Clock, 
  CheckCircle2, 
  Activity, 
  Gauge, 
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Mock data
const healthData = {
  score: 78,
  components: [
    { name: "Satisfaction", score: 85, description: "Team pulse checks & friction flags", weight: 20 },
    { name: "Performance", score: 72, description: "Milestone on-time rate & progress", weight: 25 },
    { name: "Activity", score: 88, description: "Tasks closed, commits, iterations", weight: 20 },
    { name: "Collaboration", score: 65, description: "Review/feedback loops, response time", weight: 15 },
    { name: "Efficiency", score: 80, description: "Cycle time, WIP, throughput", weight: 20 },
  ],
  drivers: [
    { label: "3 milestones completed this week", direction: "up" as const, impact: 8 },
    { label: "Review response time improved", direction: "up" as const, impact: 5 },
    { label: "2 tasks blocked > 5 days", direction: "down" as const, impact: 4 },
  ],
};

const kpiData = [
  { 
    title: "Active Project Days", 
    value: 45, 
    subtitle: "out of 60 days",
    icon: CalendarDays, 
    trend: { value: 12, direction: "up" as const },
    tooltip: "Days with at least one verified activity",
    variant: "default" as const
  },
  { 
    title: "Milestone Progress", 
    value: "68%", 
    subtitle: "17 of 25 milestones",
    icon: Target, 
    trend: { value: 8, direction: "up" as const },
    tooltip: "Percentage of milestones completed",
    variant: "primary" as const
  },
  { 
    title: "On-time Rate", 
    value: "82%", 
    subtitle: "14 of 17 on time",
    icon: Clock, 
    trend: { value: 5, direction: "up" as const },
    tooltip: "Milestones delivered on or before deadline",
    variant: "success" as const
  },
  { 
    title: "Verified Proof Events", 
    value: 127, 
    subtitle: "Last 30 days",
    icon: CheckCircle2, 
    trend: { value: 23, direction: "up" as const },
    tooltip: "Evidence-backed activities logged",
    variant: "primary" as const
  },
  { 
    title: "Throughput", 
    value: "18/wk", 
    subtitle: "items completed",
    icon: Activity, 
    trend: { value: 3, direction: "up" as const },
    tooltip: "Average items completed per week",
    variant: "default" as const
  },
  { 
    title: "Median Cycle Time", 
    value: "3.2d", 
    subtitle: "from start to done",
    icon: Gauge, 
    trend: { value: 15, direction: "down" as const },
    tooltip: "Median time from first work to completion",
    variant: "success" as const
  },
  { 
    title: "Capacity Utilization", 
    value: "76%", 
    subtitle: "of planned hours",
    icon: TrendingUp, 
    trend: { value: 2, direction: "neutral" as const },
    tooltip: "Logged effort vs planned capacity",
    variant: "default" as const
  },
  { 
    title: "Blockers Open", 
    value: 3, 
    subtitle: "need attention",
    icon: AlertCircle, 
    trend: { value: 1, direction: "down" as const },
    tooltip: "Active blockers requiring resolution",
    variant: "warning" as const
  },
];

const executiveSummary = {
  changedThisWeek: [
    "Completed 3 key milestones: Auth System, API Integration, Dashboard MVP",
    "Onboarded 2 new contributors (React dev, UI designer)",
    "Shipped demo v0.3 to 12 beta testers",
  ],
  currentBottleneck: "Code review queue is growing — avg wait time up to 2.1 days",
  nextWeekFocus: [
    "Clear review backlog (target: < 1 day wait)",
    "Complete milestone: User Analytics Dashboard",
    "Conduct user testing session with 5 participants",
  ],
  evidenceLinks: [
    { label: "Auth System PR #142", anchor: "proof" },
    { label: "Demo Recording v0.3", anchor: "proof" },
    { label: "Blocker: DB Migration", anchor: "quality" },
  ],
};

export const OverviewTab = () => {
  return (
    <div className="space-y-6">
      {/* Health Score + KPIs Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Health Gauge - Takes 1/3 */}
        <div className="lg:col-span-1">
          <HealthGauge 
            score={healthData.score}
            components={healthData.components}
            drivers={healthData.drivers}
          />
        </div>

        {/* KPI Cards - Takes 2/3 */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpiData.map((kpi) => (
              <KPICard key={kpi.title} {...kpi} />
            ))}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Executive Summary</h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* What changed this week */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                This Week
              </Badge>
            </div>
            <ul className="space-y-2">
              {executiveSummary.changedThisWeek.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Current Bottleneck */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                Bottleneck
              </Badge>
            </div>
            <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/10">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{executiveSummary.currentBottleneck}</p>
              </div>
            </div>
          </div>

          {/* Next 7 days focus */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Next 7 Days
              </Badge>
            </div>
            <ul className="space-y-2">
              {executiveSummary.nextWeekFocus.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Evidence Links */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                Evidence
              </Badge>
            </div>
            <div className="space-y-2">
              {executiveSummary.evidenceLinks.map((link, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm h-auto py-2"
                >
                  <ExternalLink className="h-3 w-3 mr-2 text-primary" />
                  {link.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
