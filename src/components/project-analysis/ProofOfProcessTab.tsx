import { useState } from "react";
import { EventCard, ProofEvent, EventType } from "./EventCard";
import { CalendarHeatmap } from "./CalendarHeatmap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Search,
  Filter,
  Target,
  CheckSquare,
  GitCommit,
  Palette,
  FileText,
  Video,
  Compass,
  MessageSquare,
  AlertTriangle,
  DollarSign,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Clock,
  Layers,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Generate mock heatmap data
const generateHeatmapData = () => {
  const data = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);
  
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const count = Math.random() > 0.3 ? Math.floor(Math.random() * 12) : 0;
    data.push({
      date: new Date(currentDate),
      count,
      events: count > 0 ? Array(count).fill(null).map(() => 
        ["Task completed", "Code commit", "Design update", "Meeting held"][Math.floor(Math.random() * 4)]
      ) : undefined,
    });
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  }
  return data;
};

const heatmapData = generateHeatmapData();

// Mock proof events
const mockEvents: ProofEvent[] = [
  {
    id: "1",
    type: "milestone",
    title: "User Authentication System completed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    owner: { id: "1", name: "Alex Chen", avatar: "" },
    contributors: [
      { id: "2", name: "Sarah Kim", avatar: "" },
      { id: "3", name: "Mike Johnson", avatar: "" },
    ],
    evidenceLinks: [
      { label: "PR #142", url: "#", type: "github" },
      { label: "Figma Designs", url: "#", type: "figma" },
    ],
    whyItMatters: "Enables secure user onboarding and data protection",
    tags: ["feature", "security"],
    impact: "high",
  },
  {
    id: "2",
    type: "demo",
    title: "Demo v0.3 shipped to beta testers",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    owner: { id: "1", name: "Alex Chen", avatar: "" },
    contributors: [],
    evidenceLinks: [
      { label: "Demo Recording", url: "#", type: "video" },
      { label: "Release Notes", url: "#", type: "notion" },
    ],
    whyItMatters: "First external validation with real users",
    tags: ["growth", "validation"],
    impact: "high",
  },
  {
    id: "3",
    type: "code",
    title: "API Integration - Payment gateway connected",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    owner: { id: "2", name: "Sarah Kim", avatar: "" },
    contributors: [{ id: "4", name: "Tom Wilson", avatar: "" }],
    evidenceLinks: [
      { label: "PR #138", url: "#", type: "github" },
    ],
    whyItMatters: "Enables revenue generation",
    tags: ["feature", "ops"],
    impact: "high",
  },
  {
    id: "4",
    type: "design",
    title: "Dashboard UI redesign iteration",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    owner: { id: "5", name: "Emma Davis", avatar: "" },
    contributors: [],
    evidenceLinks: [
      { label: "Figma File", url: "#", type: "figma" },
    ],
    whyItMatters: "Improves user experience and reduces churn",
    tags: ["feature", "research"],
    impact: "medium",
  },
  {
    id: "5",
    type: "decision",
    title: "Decided to use PostgreSQL over MongoDB",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96),
    owner: { id: "1", name: "Alex Chen", avatar: "" },
    contributors: [
      { id: "2", name: "Sarah Kim", avatar: "" },
      { id: "3", name: "Mike Johnson", avatar: "" },
    ],
    evidenceLinks: [
      { label: "Decision Doc", url: "#", type: "notion" },
    ],
    whyItMatters: "Ensures data consistency and ACID compliance for financial transactions",
    tags: ["ops", "research"],
    impact: "high",
  },
  {
    id: "6",
    type: "feedback",
    title: "User testing session with 5 participants",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120),
    owner: { id: "5", name: "Emma Davis", avatar: "" },
    contributors: [],
    evidenceLinks: [
      { label: "Test Summary", url: "#", type: "drive" },
      { label: "Recording", url: "#", type: "video" },
    ],
    whyItMatters: "Validated core workflow, identified 3 UX improvements",
    tags: ["research", "growth"],
    impact: "medium",
  },
  {
    id: "7",
    type: "risk",
    title: "Database migration delay - 2 day impact",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 144),
    owner: { id: "3", name: "Mike Johnson", avatar: "" },
    contributors: [],
    evidenceLinks: [
      { label: "Incident Report", url: "#", type: "notion" },
    ],
    whyItMatters: "Timeline adjusted, mitigation plan in place",
    tags: ["ops"],
    impact: "medium",
  },
];

// Evidence distribution data
const evidenceDistribution = [
  { type: "Code", count: 45, color: "hsl(217, 91%, 60%)" },
  { type: "Design", count: 23, color: "hsl(330, 81%, 60%)" },
  { type: "Docs", count: 18, color: "hsl(25, 95%, 53%)" },
  { type: "Demo", count: 12, color: "hsl(0, 72%, 51%)" },
  { type: "Decision", count: 15, color: "hsl(280, 68%, 60%)" },
  { type: "Feedback", count: 8, color: "hsl(190, 90%, 50%)" },
  { type: "Task", count: 34, color: "hsl(142, 76%, 36%)" },
];

// Proof Index metrics
const proofIndex = {
  coverage: 85,
  recency: 2,
  depth: 7,
  continuity: 12,
};

// Milestone Evidence Packs
const milestoneEvidencePacks = [
  {
    id: "m1",
    title: "User Authentication System",
    status: "completed",
    goal: "Implement secure login/signup with OAuth support",
    artifacts: ["PR #142", "Figma Auth Flows", "API Docs"],
    contributors: ["Alex Chen", "Sarah Kim", "Mike Johnson"],
    metricsBefore: { signupRate: "N/A", securityScore: "N/A" },
    metricsAfter: { signupRate: "Ready", securityScore: "A+" },
    demoProof: "Demo Recording v0.3",
    learnings: "OAuth integration took longer than expected. Document provider-specific quirks.",
  },
  {
    id: "m2",
    title: "Payment Integration",
    status: "completed",
    goal: "Connect Stripe for subscription billing",
    artifacts: ["PR #138", "Webhook Tests", "Pricing Page"],
    contributors: ["Sarah Kim", "Tom Wilson"],
    metricsBefore: { revenue: "$0", transactions: "0" },
    metricsAfter: { revenue: "Ready", transactions: "Ready" },
    demoProof: "Payment Flow Demo",
    learnings: "Webhook handling requires careful idempotency checks.",
  },
];

const eventTypeFilters: { type: EventType; icon: typeof Target; label: string }[] = [
  { type: "milestone", icon: Target, label: "Milestones" },
  { type: "task", icon: CheckSquare, label: "Tasks" },
  { type: "code", icon: GitCommit, label: "Code" },
  { type: "design", icon: Palette, label: "Design" },
  { type: "docs", icon: FileText, label: "Docs" },
  { type: "demo", icon: Video, label: "Demo" },
  { type: "decision", icon: Compass, label: "Decisions" },
  { type: "feedback", icon: MessageSquare, label: "Feedback" },
  { type: "risk", icon: AlertTriangle, label: "Risk" },
  { type: "funding", icon: DollarSign, label: "Funding" },
];

export const ProofOfProcessTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<EventType[]>([]);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);

  const filteredEvents = mockEvents.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(event.type);
    return matchesSearch && matchesType;
  });

  const toggleType = (type: EventType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="space-y-6">
      {/* Proof Index Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Layers className="h-4 w-4" />
            <span className="text-sm">Evidence Coverage</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-foreground">{proofIndex.coverage}%</span>
          </div>
          <Progress value={proofIndex.coverage} className="mt-2 h-1.5" />
          <p className="text-xs text-muted-foreground mt-1">milestones with evidence</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Recency</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-foreground">{proofIndex.recency}</span>
            <span className="text-sm text-muted-foreground mb-1">days ago</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">last verified proof</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm">Depth</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-foreground">{proofIndex.depth}</span>
            <span className="text-sm text-muted-foreground mb-1">types</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">evidence categories</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Flame className="h-4 w-4" />
            <span className="text-sm">Continuity</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-foreground">{proofIndex.continuity}</span>
            <span className="text-sm text-muted-foreground mb-1">day streak</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">consecutive active days</p>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <CalendarHeatmap
        data={heatmapData}
        startDate={new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)}
        endDate={new Date()}
      />

      {/* Evidence Type Distribution */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Evidence Distribution</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={evidenceDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis 
                dataKey="type" 
                type="category" 
                width={80}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {evidenceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Proof Timeline */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <h4 className="font-medium text-foreground mb-3">Filter Events</h4>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-2">
              {eventTypeFilters.map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                    selectedTypes.includes(type)
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {selectedTypes.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTypes([])}
                className="w-full mt-3"
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Proof Timeline</h3>
            <Badge variant="outline">{filteredEvents.length} events</Badge>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div key={event.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className="absolute left-2.5 top-4 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Milestone Evidence Packs */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Milestone Evidence Packs</h3>
        <div className="space-y-3">
          {milestoneEvidencePacks.map((milestone) => (
            <div key={milestone.id} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedMilestone(
                  expandedMilestone === milestone.id ? null : milestone.id
                )}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground">{milestone.title}</span>
                  <Badge variant="outline" className="text-green-500 border-green-500/20">
                    {milestone.status}
                  </Badge>
                </div>
                {expandedMilestone === milestone.id ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {expandedMilestone === milestone.id && (
                <div className="p-4 pt-0 border-t border-border bg-muted/30 animate-fade-in">
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Goal (Definition of Done)</p>
                      <p className="text-sm text-foreground">{milestone.goal}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Contributors</p>
                      <div className="flex flex-wrap gap-1">
                        {milestone.contributors.map((name) => (
                          <Badge key={name} variant="secondary" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Artifacts</p>
                      <div className="flex flex-wrap gap-1">
                        {milestone.artifacts.map((artifact) => (
                          <Button key={artifact} variant="outline" size="sm" className="h-7 text-xs gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {artifact}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Demo Proof</p>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <Video className="h-3 w-3" />
                        {milestone.demoProof}
                      </Button>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Learnings</p>
                      <p className="text-sm text-muted-foreground italic">"{milestone.learnings}"</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
