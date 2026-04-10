import { KPICard } from "./KPICard";
import { 
  Gauge, 
  Users, 
  Calendar, 
  Zap,
  Layers,
  Clock
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";

// Mock utilization by role data
const utilizationByRole = [
  { role: "Development", planned: 120, logged: 98, utilization: 82 },
  { role: "Design", planned: 60, logged: 52, utilization: 87 },
  { role: "Research", planned: 40, logged: 35, utilization: 88 },
  { role: "Ops", planned: 30, logged: 22, utilization: 73 },
];

// Mock workload heatmap data
const workloadHeatmap = [
  { name: "Alex Chen", role: "Lead", w1: 42, w2: 38, w3: 45, w4: 40, w5: 35, w6: 38 },
  { name: "Sarah Kim", role: "Dev", w1: 35, w2: 40, w3: 38, w4: 42, w5: 40, w6: 36 },
  { name: "Mike Johnson", role: "Dev", w1: 38, w2: 36, w3: 40, w4: 35, w5: 42, w6: 40 },
  { name: "Emma Davis", role: "Design", w1: 32, w2: 35, w3: 30, w4: 38, w5: 36, w6: 34 },
  { name: "Tom Wilson", role: "Dev", w1: 40, w2: 38, w3: 35, w4: 40, w5: 38, w6: 42 },
];

// Mock burn-up data
const burnUpData = [
  { week: "W1", effort: 150, planned: 180 },
  { week: "W2", effort: 320, planned: 360 },
  { week: "W3", effort: 510, planned: 540 },
  { week: "W4", effort: 680, planned: 720 },
  { week: "W5", effort: 870, planned: 900 },
  { week: "W6", effort: 1020, planned: 1080 },
];

// Mock focus metrics
const focusMetrics = [
  { name: "Alex Chen", activeStreams: 3, meetingHours: 8, deepWorkBlocks: 12 },
  { name: "Sarah Kim", activeStreams: 2, meetingHours: 5, deepWorkBlocks: 18 },
  { name: "Mike Johnson", activeStreams: 4, meetingHours: 10, deepWorkBlocks: 8 },
  { name: "Emma Davis", activeStreams: 2, meetingHours: 6, deepWorkBlocks: 15 },
  { name: "Tom Wilson", activeStreams: 3, meetingHours: 7, deepWorkBlocks: 14 },
];

const getHeatmapColor = (hours: number) => {
  if (hours >= 42) return "bg-destructive/80";
  if (hours >= 38) return "bg-yellow-500/80";
  if (hours >= 32) return "bg-green-500/80";
  return "bg-muted";
};

const capacityKpis = [
  {
    title: "Overall Utilization",
    value: "76%",
    subtitle: "of planned capacity",
    icon: Gauge,
    trend: { value: 5, direction: "up" as const },
    tooltip: "Logged effort vs planned capacity across all roles",
    variant: "primary" as const,
  },
  {
    title: "Team Size",
    value: "8",
    subtitle: "active contributors",
    icon: Users,
    trend: { value: 2, direction: "up" as const },
    tooltip: "Number of team members with logged activity",
    variant: "default" as const,
  },
  {
    title: "Avg Hours/Week",
    value: "37.5h",
    subtitle: "per contributor",
    icon: Clock,
    trend: { value: 3, direction: "neutral" as const },
    tooltip: "Average logged hours per team member per week",
    variant: "default" as const,
  },
  {
    title: "Meeting Load",
    value: "7.2h",
    subtitle: "avg per week",
    icon: Calendar,
    trend: { value: 8, direction: "down" as const },
    tooltip: "Average meeting hours per team member",
    variant: "success" as const,
  },
];

export const CapacityTab = () => {
  return (
    <div className="space-y-6">
      {/* Capacity KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {capacityKpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Utilization by Role */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Utilization by Role</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationByRole} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis 
                  dataKey="role" 
                  type="category" 
                  width={90}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="planned" fill="hsl(var(--muted))" name="Planned (hrs)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="logged" fill="hsl(var(--primary))" name="Logged (hrs)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {utilizationByRole.map((role) => (
              <div key={role.role}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{role.role}</span>
                  <span className="text-sm text-muted-foreground">
                    {role.logged}h / {role.planned}h ({role.utilization}%)
                  </span>
                </div>
                <Progress 
                  value={role.utilization} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workload Heatmap */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Workload Heatmap</h3>
          <p className="text-sm text-muted-foreground">Hours logged per person per week</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Team Member</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">W1</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">W2</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">W3</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">W4</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">W5</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">W6</th>
              </tr>
            </thead>
            <tbody>
              {workloadHeatmap.map((person) => (
                <tr key={person.name}>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {person.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-sm text-foreground">{person.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">{person.role}</Badge>
                      </div>
                    </div>
                  </td>
                  {[person.w1, person.w2, person.w3, person.w4, person.w5, person.w6].map((hours, i) => (
                    <td key={i} className="py-2 px-3 text-center">
                      <div className={`w-12 h-8 rounded flex items-center justify-center text-xs font-medium text-white mx-auto ${getHeatmapColor(hours)}`}>
                        {hours}h
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-muted" />
            <span>&lt;32h (low)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500/80" />
            <span>32-37h (optimal)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500/80" />
            <span>38-41h (high)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-destructive/80" />
            <span>42h+ (overload)</span>
          </div>
        </div>
      </div>

      {/* Burn-up Chart */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Effort Burn-up</h3>
          <p className="text-sm text-muted-foreground">Cumulative effort vs planned trajectory</p>
        </div>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={burnUpData}>
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
                dataKey="planned"
                stroke="hsl(var(--muted-foreground))"
                fill="hsl(var(--muted))"
                fillOpacity={0.3}
                strokeDasharray="5 5"
                name="Planned"
              />
              <Area
                type="monotone"
                dataKey="effort"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                name="Actual Effort"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Focus & Context Switching */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Focus & Context Switching</h3>
          <p className="text-sm text-muted-foreground">Active workstreams and meeting load per member</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Team Member</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                  <div className="flex items-center justify-center gap-1">
                    <Layers className="h-4 w-4" />
                    Active Streams
                  </div>
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Meeting Hours
                  </div>
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                  <div className="flex items-center justify-center gap-1">
                    <Zap className="h-4 w-4" />
                    Deep Work Blocks
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {focusMetrics.map((person) => (
                <tr key={person.name} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {person.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">{person.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge 
                      variant="outline" 
                      className={person.activeStreams > 3 ? "text-yellow-500 border-yellow-500/20" : ""}
                    >
                      {person.activeStreams} streams
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-sm ${person.meetingHours > 8 ? "text-yellow-500" : "text-muted-foreground"}`}>
                      {person.meetingHours}h/week
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-sm ${person.deepWorkBlocks >= 15 ? "text-green-500" : "text-muted-foreground"}`}>
                      {person.deepWorkBlocks} blocks
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
