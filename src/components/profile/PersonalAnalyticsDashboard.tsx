import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Activity, 
  Users, 
  Calendar, 
  TrendingUp, 
  Info,
  Target,
  Zap
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip as RechartsTooltip
} from "recharts";

interface PersonalAnalyticsDashboardProps {
  viewMode: 'public' | 'member' | 'leader';
}

const PersonalAnalyticsDashboard = ({ viewMode }: PersonalAnalyticsDashboardProps) => {
  // Mock data
  const scores = {
    execution: 82,
    collaboration: 78,
    consistency: 85,
    growth: 12, // delta
  };

  const trendData = [
    { week: 'W1', score: 68 },
    { week: 'W2', score: 72 },
    { week: 'W3', score: 70 },
    { week: 'W4', score: 75 },
    { week: 'W5', score: 78 },
    { week: 'W6', score: 80 },
    { week: 'W7', score: 82 },
    { week: 'W8', score: 82 },
  ];

  const radarData = [
    { axis: 'Execution', value: 82, fullMark: 100 },
    { axis: 'Collaboration', value: 78, fullMark: 100 },
    { axis: 'Craft', value: 75, fullMark: 100 },
    { axis: 'Reliability', value: 88, fullMark: 100 },
    { axis: 'Leadership', value: 65, fullMark: 100 },
    { axis: 'Learning', value: 72, fullMark: 100 },
  ];

  const nextProof = {
    action: "Complete 1 more verified milestone",
    benefit: "to reach Tier A",
    progress: 4,
    target: 5,
  };

  const kpiCards = [
    {
      label: "Execution Score",
      value: scores.execution,
      suffix: "/100",
      icon: Activity,
      color: "text-primary",
      tooltip: "Calculated from verified tasks, commits, and milestones completed"
    },
    {
      label: "Collaboration",
      value: scores.collaboration,
      suffix: "/100",
      icon: Users,
      color: "text-blue-500",
      tooltip: "Based on review participation, feedback loops, and response time"
    },
    {
      label: "Consistency",
      value: scores.consistency,
      suffix: "%",
      icon: Calendar,
      color: "text-emerald-500",
      tooltip: "Weekly activity streak and regular contribution pattern"
    },
    {
      label: "Growth",
      value: `+${scores.growth}`,
      suffix: "%",
      icon: TrendingUp,
      color: "text-amber-500",
      tooltip: "Score change over the last 30 days"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Personal Analytics</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Scores are calculated from verified activities (commits, tasks, reviews, milestones). No self-reported data.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
          How scoring works →
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <TooltipProvider key={kpi.label}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-help">
                  <div className="flex items-center gap-2 mb-2">
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{kpi.value}</span>
                    <span className="text-sm text-muted-foreground">{kpi.suffix}</span>
                  </div>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>{kpi.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Trend Line */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Execution Trend (8 weeks)</h3>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">30d</Badge>
              <Badge variant="secondary" className="text-xs">90d</Badge>
            </div>
          </div>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis 
                  dataKey="week" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  domain={[50, 100]} 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Radar Chart */}
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-4">Capability Profile</h3>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="axis" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Radar
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Next Proof Widget */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Next Proof</span>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{nextProof.action}</span> {nextProof.benefit}
            </p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-primary">{nextProof.progress}/{nextProof.target}</span>
            <p className="text-xs text-muted-foreground">milestones</p>
          </div>
        </div>
      </Card>

      {/* Leader-only: Risk Flags */}
      {viewMode === 'leader' && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="border-amber-500 text-amber-600">Leader View</Badge>
            <span className="text-sm font-medium">Risk Flags</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Burnout Risk</span>
              <Badge variant="secondary">Low</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Inactivity Risk</span>
              <Badge variant="secondary">None</Badge>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PersonalAnalyticsDashboard;
