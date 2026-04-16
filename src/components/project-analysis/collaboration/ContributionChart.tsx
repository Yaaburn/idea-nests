import { useState, useMemo, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart3,
  Percent,
  ExternalLink,
  GitBranch,
  Palette,
  FileText,
  Rocket,
  Users,
  TrendingUp,
  Info,
  MousePointerClick,
} from "lucide-react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface ContributionDetail {
  id: string;
  title: string;
  source: string;
  author: string;
  authorId: string;
  link: string;
  metric: string;
}

interface WeekData {
  week: string;
  weekLabel: string;
  code: number;
  design: number;
  docs: number;
  demo: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Constants
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CONTRIBUTION_TYPES = [
  {
    key: "code",
    label: "Code",
    color: "hsl(217, 91%, 60%)",
    icon: GitBranch,
    sources: ["GitHub", "GitLab", "Bitbucket"],
    metricsDesc: "PRs merged · Commits · LOC changed",
  },
  {
    key: "design",
    label: "Design",
    color: "hsl(330, 81%, 60%)",
    icon: Palette,
    sources: ["Figma", "Sketch", "Adobe XD"],
    metricsDesc: "Frames published · Comments resolved · Components added",
  },
  {
    key: "docs",
    label: "Docs",
    color: "hsl(25, 95%, 53%)",
    icon: FileText,
    sources: ["Confluence", "Notion", "Google Docs"],
    metricsDesc: "Pages created/updated · Stories with AC completed",
  },
  {
    key: "demo",
    label: "Demo",
    color: "hsl(0, 72%, 51%)",
    icon: Rocket,
    sources: ["Jira", "Linear", "CI/CD Pipelines"],
    metricsDesc: "Tasks deployed · Builds succeeded · Demos delivered",
  },
] as const;

const SOURCE_EMOJI: Record<string, string> = {
  GitHub: "🐙",
  GitLab: "🦊",
  Bitbucket: "🪣",
  Figma: "🎨",
  Sketch: "✏️",
  "Adobe XD": "💎",
  Confluence: "📘",
  Notion: "📝",
  "Google Docs": "📄",
  Jira: "📋",
  Linear: "⚡",
  "CI/CD Pipelines": "🚀",
};

const TEAM_MEMBERS = [
  { id: "all", name: "All Members" },
  { id: "m1", name: "Sarah Chen" },
  { id: "m2", name: "Alex Kim" },
  { id: "m3", name: "Maria Lopez" },
  { id: "m4", name: "James Wilson" },
  { id: "m5", name: "Emily Watson" },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Mock Data – All team aggregate
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const allWeekData: WeekData[] = [
  { week: "W1", weekLabel: "Jan 6 – Jan 12", code: 15, design: 8, docs: 5, demo: 2 },
  { week: "W2", weekLabel: "Jan 13 – Jan 19", code: 18, design: 10, docs: 6, demo: 3 },
  { week: "W3", weekLabel: "Jan 20 – Jan 26", code: 22, design: 7, docs: 8, demo: 1 },
  { week: "W4", weekLabel: "Jan 27 – Feb 2", code: 20, design: 12, docs: 4, demo: 4 },
  { week: "W5", weekLabel: "Feb 3 – Feb 9", code: 25, design: 9, docs: 7, demo: 2 },
  { week: "W6", weekLabel: "Feb 10 – Feb 16", code: 28, design: 11, docs: 6, demo: 5 },
];

// Per-member weekly data (role-aligned contribution patterns)
const memberWeekData: Record<string, WeekData[]> = {
  m1: [ // Sarah Chen – Founder & Lead (balanced across all types)
    { week: "W1", weekLabel: "Jan 6 – Jan 12", code: 3, design: 2, docs: 3, demo: 1 },
    { week: "W2", weekLabel: "Jan 13 – Jan 19", code: 2, design: 3, docs: 4, demo: 1 },
    { week: "W3", weekLabel: "Jan 20 – Jan 26", code: 4, design: 1, docs: 5, demo: 0 },
    { week: "W4", weekLabel: "Jan 27 – Feb 2", code: 3, design: 3, docs: 2, demo: 2 },
    { week: "W5", weekLabel: "Feb 3 – Feb 9", code: 5, design: 2, docs: 4, demo: 1 },
    { week: "W6", weekLabel: "Feb 10 – Feb 16", code: 6, design: 2, docs: 3, demo: 2 },
  ],
  m2: [ // Alex Kim – Lead Developer (heavy code)
    { week: "W1", weekLabel: "Jan 6 – Jan 12", code: 8, design: 0, docs: 1, demo: 1 },
    { week: "W2", weekLabel: "Jan 13 – Jan 19", code: 10, design: 0, docs: 1, demo: 1 },
    { week: "W3", weekLabel: "Jan 20 – Jan 26", code: 12, design: 0, docs: 2, demo: 0 },
    { week: "W4", weekLabel: "Jan 27 – Feb 2", code: 11, design: 0, docs: 1, demo: 1 },
    { week: "W5", weekLabel: "Feb 3 – Feb 9", code: 14, design: 0, docs: 1, demo: 0 },
    { week: "W6", weekLabel: "Feb 10 – Feb 16", code: 15, design: 0, docs: 2, demo: 1 },
  ],
  m3: [ // Maria Lopez – UX Designer (heavy design)
    { week: "W1", weekLabel: "Jan 6 – Jan 12", code: 0, design: 6, docs: 0, demo: 0 },
    { week: "W2", weekLabel: "Jan 13 – Jan 19", code: 0, design: 7, docs: 0, demo: 0 },
    { week: "W3", weekLabel: "Jan 20 – Jan 26", code: 0, design: 5, docs: 1, demo: 0 },
    { week: "W4", weekLabel: "Jan 27 – Feb 2", code: 0, design: 9, docs: 0, demo: 0 },
    { week: "W5", weekLabel: "Feb 3 – Feb 9", code: 0, design: 7, docs: 1, demo: 0 },
    { week: "W6", weekLabel: "Feb 10 – Feb 16", code: 0, design: 8, docs: 0, demo: 0 },
  ],
  m4: [ // James Wilson – Backend Developer (code + demo)
    { week: "W1", weekLabel: "Jan 6 – Jan 12", code: 4, design: 0, docs: 1, demo: 0 },
    { week: "W2", weekLabel: "Jan 13 – Jan 19", code: 6, design: 0, docs: 0, demo: 1 },
    { week: "W3", weekLabel: "Jan 20 – Jan 26", code: 6, design: 0, docs: 0, demo: 1 },
    { week: "W4", weekLabel: "Jan 27 – Feb 2", code: 5, design: 0, docs: 1, demo: 1 },
    { week: "W5", weekLabel: "Feb 3 – Feb 9", code: 6, design: 0, docs: 1, demo: 1 },
    { week: "W6", weekLabel: "Feb 10 – Feb 16", code: 7, design: 0, docs: 0, demo: 2 },
  ],
  m5: [ // Emily Watson – Marketing Lead (docs + demo)
    { week: "W1", weekLabel: "Jan 6 – Jan 12", code: 0, design: 0, docs: 0, demo: 0 },
    { week: "W2", weekLabel: "Jan 13 – Jan 19", code: 0, design: 0, docs: 1, demo: 0 },
    { week: "W3", weekLabel: "Jan 20 – Jan 26", code: 0, design: 1, docs: 0, demo: 0 },
    { week: "W4", weekLabel: "Jan 27 – Feb 2", code: 1, design: 0, docs: 0, demo: 0 },
    { week: "W5", weekLabel: "Feb 3 – Feb 9", code: 0, design: 0, docs: 0, demo: 0 },
    { week: "W6", weekLabel: "Feb 10 – Feb 16", code: 0, design: 1, docs: 1, demo: 0 },
  ],
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Drill-down detail pools (realistic mock items per type)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CODE_POOL: ContributionDetail[] = [
  { id: "cd1", title: "PR #142 – Sensor comparison matrix", source: "GitHub", author: "Alex Kim", authorId: "m2", link: "#", metric: "+342 LOC" },
  { id: "cd2", title: "PR #143 – Auth middleware refactor", source: "GitHub", author: "James Wilson", authorId: "m4", link: "#", metric: "+128 LOC" },
  { id: "cd3", title: "PR #144 – Mobile dashboard components", source: "GitHub", author: "Alex Kim", authorId: "m2", link: "#", metric: "+567 LOC" },
  { id: "cd4", title: "PR #145 – Database schema migration", source: "GitHub", author: "James Wilson", authorId: "m4", link: "#", metric: "+89 LOC" },
  { id: "cd5", title: "PR #146 – API rate limiting", source: "GitHub", author: "Alex Kim", authorId: "m2", link: "#", metric: "+215 LOC" },
  { id: "cd6", title: "PR #147 – Environment config update", source: "GitLab", author: "Sarah Chen", authorId: "m1", link: "#", metric: "+43 LOC" },
  { id: "cd7", title: "PR #148 – Notification service", source: "GitHub", author: "James Wilson", authorId: "m4", link: "#", metric: "+398 LOC" },
  { id: "cd8", title: "Commit: Fix CI pipeline config", source: "GitHub", author: "Sarah Chen", authorId: "m1", link: "#", metric: "3 files" },
  { id: "cd9", title: "PR #149 – Data export module", source: "GitHub", author: "Alex Kim", authorId: "m2", link: "#", metric: "+276 LOC" },
  { id: "cd10", title: "PR #150 – WebSocket integration", source: "GitHub", author: "James Wilson", authorId: "m4", link: "#", metric: "+451 LOC" },
  { id: "cd11", title: "PR #151 – Unit test coverage boost", source: "GitHub", author: "Sarah Chen", authorId: "m1", link: "#", metric: "+189 LOC" },
  { id: "cd12", title: "Commit: Dependency security patch", source: "GitLab", author: "Alex Kim", authorId: "m2", link: "#", metric: "5 files" },
];

const DESIGN_POOL: ContributionDetail[] = [
  { id: "dd1", title: "Dashboard wireframes v3", source: "Figma", author: "Maria Lopez", authorId: "m3", link: "#", metric: "3 frames" },
  { id: "dd2", title: "Onboarding flow mockups", source: "Figma", author: "Maria Lopez", authorId: "m3", link: "#", metric: "5 frames" },
  { id: "dd3", title: "Design System – Button variants", source: "Figma", author: "Maria Lopez", authorId: "m3", link: "#", metric: "4 components" },
  { id: "dd4", title: "Mobile settings page", source: "Figma", author: "Maria Lopez", authorId: "m3", link: "#", metric: "2 frames" },
  { id: "dd5", title: "Data visualization chart components", source: "Figma", author: "Maria Lopez", authorId: "m3", link: "#", metric: "6 components" },
  { id: "dd6", title: "Icon set update – Sensor icons", source: "Figma", author: "Sarah Chen", authorId: "m1", link: "#", metric: "12 icons" },
  { id: "dd7", title: "Landing page redesign concepts", source: "Figma", author: "Maria Lopez", authorId: "m3", link: "#", metric: "3 concepts" },
  { id: "dd8", title: "Notification center UI", source: "Sketch", author: "Maria Lopez", authorId: "m3", link: "#", metric: "2 frames" },
  { id: "dd9", title: "Color palette & typography audit", source: "Figma", author: "Sarah Chen", authorId: "m1", link: "#", metric: "1 report" },
  { id: "dd10", title: "Responsive grid system", source: "Figma", author: "Emily Watson", authorId: "m5", link: "#", metric: "3 layouts" },
];

const DOCS_POOL: ContributionDetail[] = [
  { id: "dc1", title: "API Specification – Auth endpoints", source: "Confluence", author: "Sarah Chen", authorId: "m1", link: "#", metric: "8 pages" },
  { id: "dc2", title: "ERD – Database schema v2", source: "Notion", author: "Sarah Chen", authorId: "m1", link: "#", metric: "1 diagram" },
  { id: "dc3", title: "User Stories – Sprint 3 backlog", source: "Confluence", author: "Sarah Chen", authorId: "m1", link: "#", metric: "12 stories" },
  { id: "dc4", title: "Technical Decision Record #5", source: "Notion", author: "Alex Kim", authorId: "m2", link: "#", metric: "3 pages" },
  { id: "dc5", title: "Onboarding Guide for new devs", source: "Google Docs", author: "Emily Watson", authorId: "m5", link: "#", metric: "5 pages" },
  { id: "dc6", title: "Product Requirements Document", source: "Confluence", author: "Sarah Chen", authorId: "m1", link: "#", metric: "15 pages" },
  { id: "dc7", title: "Release Notes v0.2", source: "Notion", author: "Emily Watson", authorId: "m5", link: "#", metric: "2 pages" },
  { id: "dc8", title: "Architecture Overview – System Design", source: "Confluence", author: "Alex Kim", authorId: "m2", link: "#", metric: "4 pages" },
  { id: "dc9", title: "Sensor calibration manual", source: "Google Docs", author: "James Wilson", authorId: "m4", link: "#", metric: "6 pages" },
  { id: "dc10", title: "UX Research Report – User interviews", source: "Notion", author: "Maria Lopez", authorId: "m3", link: "#", metric: "1 report" },
];

const DEMO_POOL: ContributionDetail[] = [
  { id: "dm1", title: "Deploy to staging – v0.1.3", source: "CI/CD Pipelines", author: "James Wilson", authorId: "m4", link: "#", metric: "Build #87" },
  { id: "dm2", title: "Sprint 2 Demo – Product walkthrough", source: "Jira", author: "Sarah Chen", authorId: "m1", link: "#", metric: "15 min" },
  { id: "dm3", title: "Build #89 – All tests passing", source: "CI/CD Pipelines", author: "Alex Kim", authorId: "m2", link: "#", metric: "142 tests" },
  { id: "dm4", title: "Feature flag: sensor-dashboard", source: "Linear", author: "James Wilson", authorId: "m4", link: "#", metric: "Deployed" },
  { id: "dm5", title: "Client demo – Investor presentation", source: "Jira", author: "Emily Watson", authorId: "m5", link: "#", metric: "30 min" },
  { id: "dm6", title: "Staging deploy – Auth module v2", source: "CI/CD Pipelines", author: "James Wilson", authorId: "m4", link: "#", metric: "Build #92" },
  { id: "dm7", title: "Build #94 – Perf benchmarks", source: "CI/CD Pipelines", author: "Alex Kim", authorId: "m2", link: "#", metric: "98% pass" },
  { id: "dm8", title: "Release candidate – v0.2.0-rc1", source: "CI/CD Pipelines", author: "Sarah Chen", authorId: "m1", link: "#", metric: "Build #96" },
];

const DETAIL_POOLS: Record<string, ContributionDetail[]> = {
  code: CODE_POOL,
  design: DESIGN_POOL,
  docs: DOCS_POOL,
  demo: DEMO_POOL,
};

/** Pick `count` items from a pool, rotating by weekIndex so each week shows different items */
function pickFromPool(
  pool: ContributionDetail[],
  weekIndex: number,
  count: number,
  memberId?: string,
): ContributionDetail[] {
  let src = memberId && memberId !== "all"
    ? pool.filter((d) => d.authorId === memberId)
    : pool;
  if (src.length === 0 || count === 0) return [];
  const result: ContributionDetail[] = [];
  for (let i = 0; i < count; i++) {
    result.push(src[(weekIndex * 3 + i) % src.length]);
  }
  return result;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Custom Tooltip Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  viewMode: "absolute" | "percentage";
}

const CustomTooltip = ({ active, payload, label, viewMode }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;

  const raw = payload[0]?.payload as WeekData;
  const types = ["code", "design", "docs", "demo"] as const;
  const total = types.reduce((s, k) => s + ((raw as any)[k] || 0), 0);

  return (
    <div className="bg-popover/95 backdrop-blur-md border border-border rounded-xl p-3.5 shadow-2xl min-w-[200px]">
      <p className="text-xs font-bold text-foreground mb-0.5">{raw.weekLabel || label}</p>
      <p className="text-[10px] text-muted-foreground mb-2.5">{label}</p>

      <div className="space-y-1.5">
        {CONTRIBUTION_TYPES.map((ct) => {
          const val = (raw as any)[ct.key] || 0;
          const pct = total > 0 ? Math.round((val / total) * 100) : 0;
          return (
            <div key={ct.key} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: ct.color }}
                />
                <span className="text-foreground">{ct.label}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-semibold text-foreground">{val}</span>
                <span className="text-muted-foreground text-[10px]">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border mt-2.5 pt-2 flex items-center justify-between text-xs font-bold">
        <span className="text-foreground">Total</span>
        <span className="font-mono text-foreground">{total}</span>
      </div>

      <p className="text-[9px] text-muted-foreground mt-2 flex items-center gap-1">
        <MousePointerClick className="h-2.5 w-2.5" />
        Click to view details
      </p>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Custom Y-axis tick formatter
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const pctFormatter = (v: number) => `${Math.round(v * 100)}%`;
const absFormatter = (v: number) => String(v);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ContributionChart = () => {
  const [viewMode, setViewMode] = useState<"absolute" | "percentage">("absolute");
  const [selectedMemberId, setSelectedMemberId] = useState("all");
  const [drillDown, setDrillDown] = useState<{ week: string; weekIndex: number } | null>(null);
  const [showSources, setShowSources] = useState(false);

  // Derive chart data based on member filter
  const chartData = useMemo(() => {
    if (selectedMemberId === "all") return allWeekData;
    return memberWeekData[selectedMemberId] || allWeekData;
  }, [selectedMemberId]);

  // Total for the selected period
  const periodTotal = useMemo(() => {
    return chartData.reduce(
      (acc, w) => ({
        code: acc.code + w.code,
        design: acc.design + w.design,
        docs: acc.docs + w.docs,
        demo: acc.demo + w.demo,
      }),
      { code: 0, design: 0, docs: 0, demo: 0 },
    );
  }, [chartData]);

  const grandTotal = periodTotal.code + periodTotal.design + periodTotal.docs + periodTotal.demo;

  // Handle click on chart for drill-down
  const handleChartClick = useCallback((state: any) => {
    if (state?.activeLabel) {
      const idx = chartData.findIndex((w) => w.week === state.activeLabel);
      setDrillDown({ week: state.activeLabel, weekIndex: idx >= 0 ? idx : 0 });
    }
  }, [chartData]);

  // Drill-down data
  const drillDownData = useMemo(() => {
    if (!drillDown) return null;
    const weekRow = chartData.find((w) => w.week === drillDown.week);
    if (!weekRow) return null;

    const types = ["code", "design", "docs", "demo"] as const;
    const sections = types.map((key) => ({
      key,
      config: CONTRIBUTION_TYPES.find((ct) => ct.key === key)!,
      count: (weekRow as any)[key] as number,
      items: pickFromPool(DETAIL_POOLS[key], drillDown.weekIndex, (weekRow as any)[key], selectedMemberId),
    }));

    return { weekRow, sections };
  }, [drillDown, chartData, selectedMemberId]);

  const selectedMemberName = TEAM_MEMBERS.find((m) => m.id === selectedMemberId)?.name || "All";

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Contribution by Type</h3>
          <p className="text-sm text-muted-foreground">
            Weekly contribution breakdown by artifact type
          </p>
        </div>

        {/* Period summary badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs gap-1 font-mono">
            <TrendingUp className="h-3 w-3" />
            {grandTotal} total
          </Badge>
          {selectedMemberId !== "all" && (
            <Badge variant="secondary" className="text-xs">
              {selectedMemberName}
            </Badge>
          )}
        </div>
      </div>

      {/* ── Controls Row ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        {/* Personal filter */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Filter by member" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {TEAM_MEMBERS.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-xs">
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View mode toggle + sources toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] gap-1"
            onClick={() => setShowSources((s) => !s)}
          >
            <Info className="h-3 w-3" />
            Data Sources
          </Button>

          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("absolute")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                viewMode === "absolute"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="h-3 w-3" />
              Volume
            </button>
            <button
              onClick={() => setViewMode("percentage")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                viewMode === "percentage"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Percent className="h-3 w-3" />
              Percentage
            </button>
          </div>
        </div>
      </div>

      {/* ── Data Sources Panel (collapsible) ── */}
      {showSources && (
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg border border-border/50 animate-in fade-in slide-in-from-top-2 duration-200">
          {CONTRIBUTION_TYPES.map((ct) => {
            const Icon = ct.icon;
            return (
              <div key={ct.key} className="flex items-start gap-2.5 p-2 rounded-md">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${ct.color}20` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: ct.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{ct.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {ct.sources.map((s, i) => (
                      <span key={s}>
                        {i > 0 && " · "}
                        {SOURCE_EMOJI[s]} {s}
                      </span>
                    ))}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic">{ct.metricsDesc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Chart ── */}
      <div className="h-[300px]" style={{ cursor: "pointer" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            stackOffset={viewMode === "percentage" ? "expand" : "none"}
            onClick={handleChartClick}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="week"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickFormatter={viewMode === "percentage" ? pctFormatter : absFormatter}
              width={viewMode === "percentage" ? 45 : 35}
            />
            <RechartsTooltip
              content={<CustomTooltip viewMode={viewMode} />}
              cursor={{
                stroke: "hsl(var(--muted-foreground))",
                strokeWidth: 1,
                strokeDasharray: "6 3",
                strokeOpacity: 0.5,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="square"
              iconSize={10}
            />
            <Area
              type="monotone"
              dataKey="code"
              stackId="1"
              stroke="hsl(217, 91%, 60%)"
              fill="hsl(217, 91%, 60%)"
              fillOpacity={0.8}
              name="Code"
              animationDuration={600}
            />
            <Area
              type="monotone"
              dataKey="design"
              stackId="1"
              stroke="hsl(330, 81%, 60%)"
              fill="hsl(330, 81%, 60%)"
              fillOpacity={0.8}
              name="Design"
              animationDuration={600}
            />
            <Area
              type="monotone"
              dataKey="docs"
              stackId="1"
              stroke="hsl(25, 95%, 53%)"
              fill="hsl(25, 95%, 53%)"
              fillOpacity={0.8}
              name="Docs"
              animationDuration={600}
            />
            <Area
              type="monotone"
              dataKey="demo"
              stackId="1"
              stroke="hsl(0, 72%, 51%)"
              fill="hsl(0, 72%, 51%)"
              fillOpacity={0.8}
              name="Demo"
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Chart hint ── */}
      <p className="text-[10px] text-muted-foreground mt-2 text-center flex items-center justify-center gap-1">
        <MousePointerClick className="h-3 w-3" />
        Click on any data point to drill down into contribution details
      </p>

      {/* ── Drill-Down Dialog ── */}
      <Dialog open={!!drillDown} onOpenChange={(open) => { if (!open) setDrillDown(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{drillDownData?.weekRow.weekLabel}</span>
              <Badge variant="outline" className="text-xs font-mono">
                {drillDownData?.weekRow.week}
              </Badge>
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {(() => {
                if (!drillDownData) return "";
                const t = drillDownData.sections.reduce((s, sec) => s + sec.count, 0);
                return `${t} total contributions${selectedMemberId !== "all" ? ` by ${selectedMemberName}` : ""}`;
              })()}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4 mt-2">
            {drillDownData?.sections.map((section) => {
              if (section.count === 0) return null;
              const Icon = section.config.icon;
              return (
                <div key={section.key}>
                  {/* Section header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: `${section.config.color}20` }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: section.config.color }} />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{section.config.label}</span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 px-1.5 font-mono"
                    >
                      {section.count}
                    </Badge>
                  </div>

                  {/* Items */}
                  <div className="space-y-1.5 ml-8">
                    {section.items.map((item, i) => (
                      <div
                        key={`${item.id}-${i}`}
                        className="flex items-start gap-3 p-2.5 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/60 transition-colors group"
                      >
                        <span className="text-sm flex-shrink-0 mt-0.5">
                          {SOURCE_EMOJI[item.source] || "📦"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">{item.author}</span>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <span className="text-[10px] text-muted-foreground">{item.source}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Badge variant="outline" className="text-[9px] font-mono h-5 px-1.5">
                            {item.metric}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {drillDownData && drillDownData.sections.every((s) => s.count === 0) && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No contributions recorded this week.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContributionChart;
