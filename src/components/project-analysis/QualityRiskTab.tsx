import { useState } from "react";
import { KPICard } from "./KPICard";
import { 
  AlertTriangle, 
  Bug, 
  RefreshCw, 
  Clock,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingDown,
  Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { cn } from "@/lib/utils";

// Mock risk register data
const riskRegister = [
  {
    id: "R1",
    item: "Database migration complexity",
    severity: "high",
    likelihood: "medium",
    owner: "Mike Johnson",
    mitigation: "Incremental migration with rollback plan",
    status: "mitigating",
  },
  {
    id: "R2",
    item: "Third-party API rate limits",
    severity: "medium",
    likelihood: "high",
    owner: "Sarah Kim",
    mitigation: "Implement caching and request batching",
    status: "mitigating",
  },
  {
    id: "R3",
    item: "Key contributor availability",
    severity: "high",
    likelihood: "low",
    owner: "Alex Chen",
    mitigation: "Knowledge sharing sessions, documentation",
    status: "monitoring",
  },
  {
    id: "R4",
    item: "Security vulnerability in dependencies",
    severity: "high",
    likelihood: "medium",
    owner: "Tom Wilson",
    mitigation: "Regular dependency updates, security scanning",
    status: "resolved",
  },
];

// Mock risk burndown data
const riskBurndownData = [
  { week: "W1", open: 8, resolved: 0 },
  { week: "W2", open: 7, resolved: 1 },
  { week: "W3", open: 6, resolved: 2 },
  { week: "W4", open: 5, resolved: 3 },
  { week: "W5", open: 4, resolved: 4 },
  { week: "W6", open: 3, resolved: 5 },
];

// Mock bug trend data
const bugTrendData = [
  { week: "W1", opened: 12, closed: 8 },
  { week: "W2", opened: 8, closed: 10 },
  { week: "W3", opened: 10, closed: 12 },
  { week: "W4", opened: 6, closed: 9 },
  { week: "W5", opened: 5, closed: 8 },
  { week: "W6", opened: 4, closed: 7 },
];

// Mock release cadence
const releaseCadence = [
  { version: "v0.1.0", date: "Nov 15", type: "major", changes: 45 },
  { version: "v0.1.1", date: "Nov 22", type: "patch", changes: 12 },
  { version: "v0.2.0", date: "Dec 1", type: "minor", changes: 28 },
  { version: "v0.2.1", date: "Dec 8", type: "patch", changes: 8 },
  { version: "v0.3.0", date: "Dec 14", type: "minor", changes: 35 },
];

const qualityKpis = [
  {
    title: "Open Risks",
    value: "3",
    subtitle: "active risks",
    icon: AlertTriangle,
    trend: { value: 25, direction: "down" as const },
    tooltip: "Number of unresolved risks in the register",
    variant: "warning" as const,
  },
  {
    title: "Bug Count",
    value: "12",
    subtitle: "open issues",
    icon: Bug,
    trend: { value: 40, direction: "down" as const },
    tooltip: "Total open bugs and issues",
    variant: "default" as const,
  },
  {
    title: "Reopen Rate",
    value: "4%",
    subtitle: "items reopened",
    icon: RefreshCw,
    trend: { value: 2, direction: "down" as const },
    tooltip: "Percentage of items reopened after closing",
    variant: "success" as const,
  },
  {
    title: "PR Review Time",
    value: "1.8d",
    subtitle: "avg time",
    icon: Clock,
    trend: { value: 15, direction: "down" as const },
    tooltip: "Average time for PR review completion",
    variant: "success" as const,
  },
];

const severityColors = {
  high: "text-destructive bg-destructive/10 border-destructive/20",
  medium: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  low: "text-green-500 bg-green-500/10 border-green-500/20",
};

const statusColors = {
  monitoring: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  mitigating: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  resolved: "text-green-500 bg-green-500/10 border-green-500/20",
};

const statusIcons = {
  monitoring: AlertCircle,
  mitigating: RefreshCw,
  resolved: CheckCircle2,
};

export const QualityRiskTab = () => {
  const [riskFilter, setRiskFilter] = useState("all");

  const filteredRisks = riskRegister.filter(
    (risk) => riskFilter === "all" || risk.status === riskFilter
  );

  return (
    <div className="space-y-6">
      {/* Quality KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {qualityKpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Risk Register */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Risk Register</h3>
            <p className="text-sm text-muted-foreground">Active project risks and mitigations</p>
          </div>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risks</SelectItem>
              <SelectItem value="monitoring">Monitoring</SelectItem>
              <SelectItem value="mitigating">Mitigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Risk</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Severity</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Likelihood</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Owner</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Mitigation</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRisks.map((risk) => {
                const StatusIcon = statusIcons[risk.status as keyof typeof statusIcons];
                return (
                  <tr key={risk.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{risk.item}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", severityColors[risk.severity as keyof typeof severityColors])}
                      >
                        {risk.severity}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", severityColors[risk.likelihood as keyof typeof severityColors])}
                      >
                        {risk.likelihood}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-muted-foreground">{risk.owner}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-muted-foreground">{risk.mitigation}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs gap-1", statusColors[risk.status as keyof typeof statusColors])}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {risk.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Risk Burndown */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Risk Burndown</h3>
            <p className="text-sm text-muted-foreground">Open vs resolved risks over time</p>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskBurndownData}>
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
                <Area
                  type="monotone"
                  dataKey="open"
                  stroke="hsl(var(--destructive))"
                  fill="hsl(var(--destructive))"
                  fillOpacity={0.3}
                  name="Open Risks"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stroke="hsl(142, 76%, 36%)"
                  fill="hsl(142, 76%, 36%)"
                  fillOpacity={0.3}
                  name="Resolved"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <TrendingDown className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">
              Open risks down 62.5% over 6 weeks
            </span>
          </div>
        </div>

        {/* Bug Trend */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Bug Trend</h3>
            <p className="text-sm text-muted-foreground">Bugs opened vs closed per week</p>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bugTrendData}>
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
                <Line
                  type="monotone"
                  dataKey="opened"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--destructive))" }}
                  name="Opened"
                />
                <Line
                  type="monotone"
                  dataKey="closed"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(142, 76%, 36%)" }}
                  name="Closed"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">
              Closing more bugs than opening — healthy trend
            </span>
          </div>
        </div>
      </div>

      {/* Release Cadence */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Release Cadence</h3>
          <p className="text-sm text-muted-foreground">Deployment history and release frequency</p>
        </div>

        <div className="relative">
          {/* Timeline */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-4">
            {releaseCadence.map((release, index) => (
              <div key={release.version} className="relative pl-10">
                {/* Timeline dot */}
                <div className={cn(
                  "absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 border-background",
                  release.type === "major" ? "bg-primary" : 
                  release.type === "minor" ? "bg-blue-500" : "bg-muted-foreground"
                )} />
                
                <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "font-mono",
                          release.type === "major" ? "text-primary border-primary/20" : 
                          release.type === "minor" ? "text-blue-500 border-blue-500/20" : 
                          "text-muted-foreground"
                        )}
                      >
                        {release.version}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{release.type}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {release.date}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {release.changes} changes included
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Release frequency:</span> ~1 release per week (healthy cadence)
          </p>
        </div>
      </div>
    </div>
  );
};
