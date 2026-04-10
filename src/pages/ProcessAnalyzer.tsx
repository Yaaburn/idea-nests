import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Users, 
  Target, 
  Award,
  Activity,
  Calendar,
  GitCommit,
  MessageSquare,
  FileText,
  CheckCircle2,
  Clock,
  Zap
} from "lucide-react";

const ProcessAnalyzer = () => {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("month");

  const insights = {
    processScore: 87,
    totalActivities: 342,
    collaborationScore: 92,
    consistencyScore: 78,
    growthRate: 24,
  };

  const skillCategories = [
    {
      name: "Leadership & Management",
      score: 85,
      activities: [
        { type: "Team Meetings", count: 24, platform: "Google Meet" },
        { type: "Project Planning", count: 18, platform: "Notion" },
        { type: "Milestone Reviews", count: 8, platform: "Slack" }
      ]
    },
    {
      name: "Communication & Collaboration",
      score: 92,
      activities: [
        { type: "Team Discussions", count: 156, platform: "Slack" },
        { type: "Document Reviews", count: 43, platform: "Google Drive" },
        { type: "Design Feedback", count: 31, platform: "Figma" }
      ]
    },
    {
      name: "Technical Skills",
      score: 78,
      activities: [
        { type: "Code Commits", count: 87, platform: "GitHub" },
        { type: "Issue Resolution", count: 34, platform: "GitHub" },
        { type: "Technical Docs", count: 12, platform: "Notion" }
      ]
    }
  ];

  const timeline = [
    {
      date: "Week 1",
      commits: 23,
      meetings: 5,
      tasks: 18,
      collaborations: 12
    },
    {
      date: "Week 2",
      commits: 31,
      meetings: 7,
      tasks: 22,
      collaborations: 15
    },
    {
      date: "Week 3",
      commits: 28,
      meetings: 6,
      tasks: 20,
      collaborations: 18
    },
    {
      date: "Week 4",
      commits: 35,
      meetings: 8,
      tasks: 25,
      collaborations: 21
    }
  ];

  const projects = [
    {
      name: "SolarSense",
      role: "Founder",
      completionRate: 65,
      activities: 124,
      collaborators: 8,
      lastActive: "2 hours ago"
    },
    {
      name: "EcoTrack",
      role: "Contributor",
      completionRate: 82,
      activities: 89,
      collaborators: 5,
      lastActive: "1 day ago"
    },
    {
      name: "GreenGrid",
      role: "Advisor",
      completionRate: 45,
      activities: 34,
      collaborators: 3,
      lastActive: "3 days ago"
    }
  ];

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3">Process Analyzer</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              AI-powered insights into your development journey and collaboration patterns
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2 mb-8">
            <Button 
              variant={timeRange === "week" ? "secondary" : "outline"}
              onClick={() => setTimeRange("week")}
            >
              Last Week
            </Button>
            <Button 
              variant={timeRange === "month" ? "secondary" : "outline"}
              onClick={() => setTimeRange("month")}
            >
              Last Month
            </Button>
            <Button 
              variant={timeRange === "quarter" ? "secondary" : "outline"}
              onClick={() => setTimeRange("quarter")}
            >
              Last Quarter
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-5 gap-6 mb-8">
            <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Award className="h-5 w-5 text-secondary" />
                </div>
                <div className="text-3xl font-bold">{insights.processScore}</div>
              </div>
              <div className="text-sm text-muted-foreground">Process Score</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="h-5 w-5 text-accent" />
                <div className="text-3xl font-bold">{insights.totalActivities}</div>
              </div>
              <div className="text-sm text-muted-foreground">Total Activities</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <div className="text-3xl font-bold">{insights.collaborationScore}</div>
              </div>
              <div className="text-sm text-muted-foreground">Collaboration</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-5 w-5 text-secondary" />
                <div className="text-3xl font-bold">{insights.consistencyScore}</div>
              </div>
              <div className="text-sm text-muted-foreground">Consistency</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <div className="text-3xl font-bold">+{insights.growthRate}%</div>
              </div>
              <div className="text-sm text-muted-foreground">Growth Rate</div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Detailed Analysis */}
            <div className="lg:col-span-2 space-y-8">
              {/* Skill Analysis */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Skill Analysis</h2>
                <div className="space-y-6">
                  {skillCategories.map((category) => (
                    <div key={category.name} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{category.name}</h3>
                        <Badge variant="secondary">{category.score}%</Badge>
                      </div>
                      <Progress value={category.score} className="h-2" />
                      <div className="grid grid-cols-3 gap-3">
                        {category.activities.map((activity) => (
                          <div 
                            key={activity.type}
                            className="p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="text-2xl font-bold mb-1">{activity.count}</div>
                            <div className="text-xs text-muted-foreground mb-1">
                              {activity.type}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {activity.platform}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Activity Timeline */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Activity Timeline</h2>
                <div className="space-y-4">
                  {timeline.map((week, index) => (
                    <div key={week.date} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{week.date}</span>
                        <span className="text-sm text-muted-foreground">
                          {week.commits + week.meetings + week.tasks + week.collaborations} activities
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <GitCommit className="h-4 w-4 text-secondary" />
                          <span className="text-sm font-medium">{week.commits}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <Calendar className="h-4 w-4 text-accent" />
                          <span className="text-sm font-medium">{week.meetings}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{week.tasks}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <Users className="h-4 w-4 text-secondary" />
                          <span className="text-sm font-medium">{week.collaborations}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              {/* AI Insight */}
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">AI Insight</h3>
                    <p className="text-sm text-muted-foreground">
                      Your collaboration score increased by 18% this month. You're actively engaging 
                      with 3 teams and maintaining consistent contribution patterns.
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="w-full justify-center py-2">
                  High Engagement Level
                </Badge>
              </Card>

              {/* Active Projects */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Active Projects</h3>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-xs text-muted-foreground">{project.role}</div>
                        </div>
                        <Badge variant="outline">{project.completionRate}%</Badge>
                      </div>
                      <Progress value={project.completionRate} className="h-1.5" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{project.activities} activities</span>
                        <span>{project.collaborators} collaborators</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recommendations */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Recommendations</h3>
                <div className="space-y-3">
                  <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium mb-1">Connect Google Drive</div>
                      <div className="text-xs text-muted-foreground">
                        Track document updates to boost your proof score
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <Clock className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium mb-1">Maintain Consistency</div>
                      <div className="text-xs text-muted-foreground">
                        3 more active days to reach monthly goal
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Export */}
              <Button className="w-full" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Export Process Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ProcessAnalyzer;
