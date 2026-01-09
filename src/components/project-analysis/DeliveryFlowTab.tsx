import { KPICard } from "./KPICard";
import { CFDChart } from "./CFDChart";
import { 
  Clock, 
  Gauge, 
  Activity, 
  Layers, 
  RefreshCw,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
} from "recharts";

// Mock CFD data
const cfdData = [
  { date: "Week 1", backlog: 25, inProgress: 8, review: 3, done: 5 },
  { date: "Week 2", backlog: 22, inProgress: 10, review: 5, done: 12 },
  { date: "Week 3", backlog: 20, inProgress: 12, review: 4, done: 20 },
  { date: "Week 4", backlog: 18, inProgress: 9, review: 6, done: 28 },
  { date: "Week 5", backlog: 15, inProgress: 11, review: 3, done: 38 },
  { date: "Week 6", backlog: 12, inProgress: 8, review: 5, done: 48 },
];

// Mock throughput data
const throughputData = [
  { week: "W1", completed: 5 },
  { week: "W2", completed: 7 },
  { week: "W3", completed: 8 },
  { week: "W4", completed: 8 },
  { week: "W5", completed: 10 },
  { week: "W6", completed: 10 },
];

// Mock control chart data (cycle time distribution)
const controlChartData = [
  { id: 1, cycleTime: 2.5, date: "Dec 1" },
  { id: 2, cycleTime: 3.2, date: "Dec 2" },
  { id: 3, cycleTime: 1.8, date: "Dec 3" },
  { id: 4, cycleTime: 4.5, date: "Dec 5" },
  { id: 5, cycleTime: 2.1, date: "Dec 6" },
  { id: 6, cycleTime: 3.8, date: "Dec 7" },
  { id: 7, cycleTime: 2.9, date: "Dec 8" },
  { id: 8, cycleTime: 5.2, date: "Dec 9" },
  { id: 9, cycleTime: 2.4, date: "Dec 10" },
  { id: 10, cycleTime: 3.1, date: "Dec 11" },
  { id: 11, cycleTime: 2.7, date: "Dec 12" },
  { id: 12, cycleTime: 1.9, date: "Dec 13" },
];

// Work item aging data
const agingItems = [
  { id: "TASK-234", title: "Fix mobile responsive issues", days: 8, assignee: "Sarah Kim", status: "In Progress" },
  { id: "TASK-189", title: "Database migration script", days: 6, assignee: "Mike Johnson", status: "Review" },
  { id: "TASK-201", title: "API rate limiting", days: 5, assignee: "Tom Wilson", status: "In Progress" },
];

// KPI data
const flowKpis = [
  {
    title: "Lead Time",
    value: "5.2d",
    subtitle: "issue created → closed",
    icon: Clock,
    trend: { value: 8, direction: "down" as const },
    tooltip: "Average time from issue creation to completion",
    variant: "default" as const,
  },
  {
    title: "Cycle Time",
    value: "3.2d",
    subtitle: "first work → done",
    icon: Gauge,
    trend: { value: 15, direction: "down" as const },
    tooltip: "Average time from first commit to completion",
    variant: "success" as const,
  },
  {
    title: "Throughput",
    value: "10/wk",
    subtitle: "items completed",
    icon: Activity,
    trend: { value: 12, direction: "up" as const },
    tooltip: "Items completed per week",
    variant: "primary" as const,
  },
  {
    title: "WIP Count",
    value: "8",
    subtitle: "in progress now",
    icon: Layers,
    trend: { value: 2, direction: "neutral" as const },
    tooltip: "Work items currently in progress",
    variant: "default" as const,
  },
  {
    title: "Rework Rate",
    value: "4%",
    subtitle: "items reopened",
    icon: RefreshCw,
    trend: { value: 3, direction: "down" as const },
    tooltip: "Percentage of items reopened after completion",
    variant: "success" as const,
  },
];

export const DeliveryFlowTab = () => {
  // Calculate control chart bounds
  const cycleTimesValues = controlChartData.map(d => d.cycleTime);
  const mean = cycleTimesValues.reduce((a, b) => a + b, 0) / cycleTimesValues.length;
  const stdDev = Math.sqrt(
    cycleTimesValues.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / cycleTimesValues.length
  );
  const upperBound = mean + 2 * stdDev;
  const lowerBound = Math.max(0, mean - 2 * stdDev);

  return (
    <div className="space-y-6">
      {/* Flow KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {flowKpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* CFD Chart */}
      <CFDChart data={cfdData} />

      {/* Control Chart & Throughput */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Control Chart */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Cycle Time Distribution</h3>
            <p className="text-sm text-muted-foreground">
              Control chart showing cycle time variability
            </p>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  name="Date"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis 
                  dataKey="cycleTime" 
                  name="Cycle Time (days)"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  domain={[0, 'auto']}
                />
                <ZAxis range={[60, 60]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)} days`, "Cycle Time"]}
                />
                <ReferenceLine 
                  y={mean} 
                  stroke="hsl(var(--primary))" 
                  strokeDasharray="5 5"
                  label={{ value: `Mean: ${mean.toFixed(1)}d`, fill: "hsl(var(--primary))", fontSize: 11 }}
                />
                <ReferenceLine 
                  y={upperBound} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="3 3"
                  label={{ value: "UCL", fill: "hsl(var(--destructive))", fontSize: 10 }}
                />
                <ReferenceLine 
                  y={lowerBound} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="3 3"
                  label={{ value: "LCL", fill: "hsl(var(--destructive))", fontSize: 10 }}
                />
                <Scatter 
                  name="Items" 
                  data={controlChartData} 
                  fill="hsl(var(--primary))"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Items outside control limits may indicate process issues
          </p>
        </div>

        {/* Throughput Trend */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Throughput Trend</h3>
            <p className="text-sm text-muted-foreground">
              Items completed per week
            </p>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={throughputData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="week"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">
              Throughput increased 100% over 6 weeks
            </span>
          </div>
        </div>
      </div>

      {/* Work Item Aging */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Work Item Aging</h3>
            <p className="text-sm text-muted-foreground">Items stuck longer than 5 days</p>
          </div>
          <Badge variant="outline" className="text-yellow-500 border-yellow-500/20">
            {agingItems.length} items need attention
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Title</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Days</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Assignee</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {agingItems.map((item) => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <span className="text-sm font-mono text-primary">{item.id}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-foreground">{item.title}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className={`h-4 w-4 ${item.days > 7 ? 'text-destructive' : 'text-yellow-500'}`} />
                      <span className={`text-sm font-medium ${item.days > 7 ? 'text-destructive' : 'text-yellow-500'}`}>
                        {item.days} days
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-muted-foreground">{item.assignee}</span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{item.status}</Badge>
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
