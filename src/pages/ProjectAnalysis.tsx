import { useState, useMemo } from "react";
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
  FileText,
} from "lucide-react";
import { OverviewTab } from "@/components/project-analysis/OverviewTab";
import { ProofOfProcessTab } from "@/components/project-analysis/ProofOfProcessTab";
import { DeliveryFlowTab } from "@/components/project-analysis/DeliveryFlowTab";
import { CapacityTab } from "@/components/project-analysis/CapacityTab";
import { CollaborationTab } from "@/components/project-analysis/CollaborationTab";
import { QualityRiskTab } from "@/components/project-analysis/QualityRiskTab";
import { GoalsOutcomesTab } from "@/components/project-analysis/GoalsOutcomesTab";

export type ViewMode = "leader" | "member" | "investor";

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
  const [viewMode, setViewMode] = useState<ViewMode>("leader");
  const [activeTab, setActiveTab] = useState("overview");

  // Define tabs with view-based visibility
  const tabs = useMemo(() => {
    return [
      { id: "overview", label: "Overview", icon: LayoutDashboard, visible: true },
      { id: "proof", label: "Proof of Process", icon: Activity, visible: true },
      { id: "delivery", label: "Delivery & Flow", icon: TrendingUp, visible: viewMode !== "member" },
      { id: "capacity", label: "Capacity", icon: Zap, visible: viewMode === "leader" },
      { id: "collaboration", label: "Collaboration", icon: Users2, visible: true },
      { id: "quality", label: "Quality & Risk", icon: AlertTriangle, visible: viewMode === "leader" },
      { id: "goals", label: "Goals", icon: Target, visible: true },
    ];
  }, [viewMode]);

  const visibleTabs = tabs.filter((tab) => tab.visible);

  // Reset to overview tab if current tab becomes hidden
  const handleViewModeChange = (newViewMode: string) => {
    const mode = newViewMode as ViewMode;
    setViewMode(mode);
    
    // Check if current tab will be visible in the new view mode
    const currentTabConfig = tabs.find(t => t.id === activeTab);
    if (currentTabConfig) {
      let willBeVisible = true;
      if (activeTab === "delivery" && mode === "member") willBeVisible = false;
      if (activeTab === "capacity" && mode !== "leader") willBeVisible = false;
      if (activeTab === "quality" && mode !== "leader") willBeVisible = false;
      
      if (!willBeVisible) {
        setActiveTab("overview");
      }
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Fixed Header with Global Controls */}
        <div className="bg-card rounded-xl border border-border p-6 sticky top-0 z-10">
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

            {/* Global Controls - Always visible, pinned top-right */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Time Range */}
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

              {/* View Mode Selector */}
              <Select value={viewMode} onValueChange={handleViewModeChange}>
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
                  <FileText className="h-4 w-4 mr-2" />
                  Add to Data Room
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border border-border p-1 h-auto flex-wrap">
            {visibleTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="proof">
            <ProofOfProcessTab viewMode={viewMode} />
          </TabsContent>
          {viewMode !== "member" && (
            <TabsContent value="delivery">
              <DeliveryFlowTab viewMode={viewMode} />
            </TabsContent>
          )}
          {viewMode === "leader" && (
            <TabsContent value="capacity">
              <CapacityTab />
            </TabsContent>
          )}
          <TabsContent value="collaboration">
            <CollaborationTab />
          </TabsContent>
          {viewMode === "leader" && (
            <TabsContent value="quality">
              <QualityRiskTab />
            </TabsContent>
          )}
          <TabsContent value="goals">
            <GoalsOutcomesTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ProjectAnalysis;
