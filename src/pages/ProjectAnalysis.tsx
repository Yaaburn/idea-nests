import { useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Download,
  Share2,
  StickyNote,
  Users,
  Eye,
  Shield,
  LayoutDashboard,
  Activity,
  TrendingUp,
  Users2,
  AlertTriangle,
  Target,
  Zap,
} from "lucide-react";
import { OverviewTab } from "@/components/project-analysis/OverviewTab";
import { ProofOfProcessTab } from "@/components/project-analysis/ProofOfProcessTab";
import { DeliveryFlowTab } from "@/components/project-analysis/DeliveryFlowTab";
import { CapacityTab } from "@/components/project-analysis/CapacityTab";
import { CollaborationTab } from "@/components/project-analysis/CollaborationTab";
import { QualityRiskTab } from "@/components/project-analysis/QualityRiskTab";
import { GoalsOutcomesTab } from "@/components/project-analysis/GoalsOutcomesTab";

const mockProject = {
  name: "TalentNet Platform",
  stage: "Building",
  tags: ["SaaS", "AI", "Productivity"],
  teamSize: 8,
  openRoles: 3,
};

const ProjectAnalysis = () => {
  const { projectId } = useParams();
  const [dateRange, setDateRange] = useState("30d");
  const [viewMode, setViewMode] = useState("leader");

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Fixed Header */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Project Info */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {mockProject.name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-foreground">
                    {mockProject.name}
                  </h1>
                  <Badge variant="outline" className="text-primary border-primary">
                    {mockProject.stage}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex gap-1">
                    {mockProject.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {mockProject.teamSize} members
                  </span>
                  <span className="text-sm text-primary flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {mockProject.openRoles} open roles
                  </span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Date Range */}
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leader">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3" />
                      Leader View
                    </div>
                  </SelectItem>
                  <SelectItem value="member">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      Member View
                    </div>
                  </SelectItem>
                  <SelectItem value="investor">
                    <div className="flex items-center gap-2">
                      <Eye className="h-3 w-3" />
                      Investor View
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <StickyNote className="h-4 w-4 mr-2" />
                  Note
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card border border-border p-1 h-auto flex-wrap">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="proof" className="gap-2">
              <Activity className="h-4 w-4" />
              Proof of Process
            </TabsTrigger>
            <TabsTrigger value="delivery" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Delivery & Flow
            </TabsTrigger>
            <TabsTrigger value="capacity" className="gap-2">
              <Zap className="h-4 w-4" />
              Capacity
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="gap-2">
              <Users2 className="h-4 w-4" />
              Collaboration
            </TabsTrigger>
            <TabsTrigger value="quality" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Quality & Risk
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-2">
              <Target className="h-4 w-4" />
              Goals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="proof">
            <ProofOfProcessTab />
          </TabsContent>
          <TabsContent value="delivery">
            <DeliveryFlowTab />
          </TabsContent>
          <TabsContent value="capacity">
            <CapacityTab />
          </TabsContent>
          <TabsContent value="collaboration">
            <CollaborationTab />
          </TabsContent>
          <TabsContent value="quality">
            <QualityRiskTab />
          </TabsContent>
          <TabsContent value="goals">
            <GoalsOutcomesTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ProjectAnalysis;
