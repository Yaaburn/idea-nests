import { useState } from "react";
import { BarChart3, TrendingUp, Users, CheckCircle2, AlertCircle, Download, Mail, Filter, Lock, Crown } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Dashboard = () => {
  // Mock: in real app, check user role/subscription
  const [isIncubator] = useState(false);
  const [selectedCohort] = useState("YC S23");

  // If not an Incubator/Program Manager, show gating UI
  if (!isIncubator) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="max-w-lg w-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
              <Crown className="h-8 w-8 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Incubator Dashboard</h2>
            <p className="text-muted-foreground mb-6">
              This dashboard is designed for <strong>Incubators & Program Managers</strong> who manage multiple projects and founders within their programs.
            </p>
            <div className="space-y-3 text-left mb-8">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Multi-project oversight</p>
                  <p className="text-xs text-muted-foreground">Track progress across all projects in your cohort</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Users className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Founder analytics</p>
                  <p className="text-xs text-muted-foreground">See each founder's engagement, milestones, and risk flags</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Cohort reports</p>
                  <p className="text-xs text-muted-foreground">Export progress reports for stakeholders and investors</p>
                </div>
              </div>
            </div>
            <Button variant="secondary" className="w-full gap-2">
              <Lock className="h-4 w-4" />
              Upgrade to Incubator Plan
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Contact us to learn about program pricing and onboarding.
            </p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const stats = [
    { label: "Active Projects", value: "24", change: "+3 this month", icon: Users, color: "text-secondary" },
    { label: "Avg Progress", value: "67%", change: "+12% from last month", icon: TrendingUp, color: "text-accent" },
    { label: "MVP Reached", value: "42%", change: "10 projects", icon: CheckCircle2, color: "text-secondary" },
    { label: "Needs Attention", value: "3", change: "Inactive >14 days", icon: AlertCircle, color: "text-destructive" },
  ];

  const projects = [
    { name: "SolarSense", founder: "Sarah Chen", stage: "Prototype", progress: 65, mentor: "Dr. James Liu", lastActive: "2 days ago", status: "on-track" },
    { name: "CodeMentor AI", founder: "Marcus Johnson", stage: "MVP Ready", progress: 80, mentor: "Lisa Wong", lastActive: "1 day ago", status: "on-track" },
    { name: "EcoTrack", founder: "Nina Patel", stage: "Demo Ready", progress: 90, mentor: "Prof. David Kim", lastActive: "5 hours ago", status: "excellent" },
    { name: "HealthSync", founder: "David Kim", stage: "Idea", progress: 30, mentor: "Dr. Emma Chen", lastActive: "16 days ago", status: "at-risk" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "bg-secondary/10 text-secondary border-secondary";
      case "on-track": return "bg-accent/10 text-accent border-accent";
      case "at-risk": return "bg-destructive/10 text-destructive border-destructive";
      default: return "bg-muted";
    }
  };

  return (
    <AppLayout>
      <div className="min-h-0 overflow-auto">
        <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-background py-8 border-b">
          <div className="px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-1">Cohort Dashboard</h1>
                <p className="text-muted-foreground">{selectedCohort} Overview</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="gap-2"><Filter className="h-4 w-4" />Filter</Button>
                <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" />Export</Button>
                <Button variant="secondary" size="sm" className="gap-2"><Mail className="h-4 w-4" />Message All</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-muted">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <Badge variant="outline" className="text-xs">{stat.change}</Badge>
                </div>
                <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="projects" className="space-y-6">
            <TabsList>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="projects">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Mentor</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.name}>
                        <TableCell>
                          <div><div className="font-medium">{project.name}</div><div className="text-sm text-muted-foreground">{project.founder}</div></div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{project.stage}</Badge></TableCell>
                        <TableCell>
                          <div className="space-y-1 min-w-[100px]">
                            <span className="text-sm">{project.progress}%</span>
                            <Progress value={project.progress} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{project.mentor}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{project.lastActive}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(project.status)}>{project.status.replace("-", " ")}</Badge>
                        </TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="sm">View</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5 text-secondary" />
                    <h3 className="font-semibold">Progress Trend</h3>
                  </div>
                  <div className="h-48 flex items-end justify-between gap-2">
                    {[40, 55, 60, 65, 70, 67].map((value, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-gradient-to-t from-secondary to-accent rounded-t" style={{ height: `${value}%` }} />
                        <span className="text-xs text-muted-foreground">W{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    <h3 className="font-semibold">Milestone Completion</h3>
                  </div>
                  <div className="space-y-4 mt-4">
                    {[{ label: "Idea → Prototype", done: 18, total: 24 }, { label: "Prototype → Alpha", done: 12, total: 24 }, { label: "Alpha → MVP", done: 7, total: 24 }].map(m => (
                      <div key={m.label} className="space-y-1.5">
                        <div className="flex justify-between text-sm"><span>{m.label}</span><span className="font-medium">{m.done}/{m.total}</span></div>
                        <Progress value={(m.done / m.total) * 100} />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reports">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-2">Generate Custom Report</h3>
                <p className="text-muted-foreground text-sm mb-6">Export cohort analytics, project summaries, and performance metrics</p>
                <div className="flex gap-3">
                  <Button variant="outline"><Download className="h-4 w-4 mr-2" />Download PDF</Button>
                  <Button variant="outline"><Download className="h-4 w-4 mr-2" />Download CSV</Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
