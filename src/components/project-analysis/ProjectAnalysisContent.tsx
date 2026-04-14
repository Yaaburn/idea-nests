import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  LayoutDashboard, 
  Activity, 
  TrendingUp, 
  Zap,
  Users2,
  AlertTriangle,
  Target,
  Calendar,
  Download,
  Share2,
  Database,
} from "lucide-react";

// Import existing tab components - mounting them as-is
import { OverviewTab } from "./OverviewTab";
import { ProofOfProcessTab } from "./ProofOfProcessTab";
import { DeliveryFlowTab } from "./DeliveryFlowTab";
import { CapacityTab } from "./CapacityTab";
import { CollaborationTab } from "./CollaborationTab";
import { QualityRiskTab } from "./QualityRiskTab";
import { GoalsOutcomesTab } from "./GoalsOutcomesTab";
import { DataAnalysisTab } from "./DataAnalysisTab";

interface ProjectAnalysisContentProps {
  projectId: string;
}

type ViewMode = 'leader' | 'member' | 'investor';
type TimeRange = '7d' | '30d' | '90d' | 'custom';

/**
 * ProjectAnalysisContent - Wrapper to mount ProjectAnalysis inside Workspace
 * This component renders the full Analysis page content WITHOUT AppLayout wrapper
 * to avoid double sidebar when embedded in ProjectWorkspace shell
 */
const ProjectAnalysisContent = ({ projectId }: ProjectAnalysisContentProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [viewMode, setViewMode] = useState<ViewMode>('leader');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Define visible tabs based on viewMode
  const getVisibleTabs = () => {
    const allTabs = [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard, visible: true },
      { id: 'proof', label: 'Proof of Process', icon: Activity, visible: true },
      { id: 'delivery', label: 'Delivery & Flow', icon: TrendingUp, visible: viewMode !== 'member' },
      { id: 'capacity', label: 'Capacity', icon: Zap, visible: viewMode === 'leader' },
      { id: 'collaboration', label: 'Collaboration', icon: Users2, visible: true },
      { id: 'quality', label: 'Quality & Risk', icon: AlertTriangle, visible: viewMode === 'leader' },
      { id: 'goals', label: 'Goals', icon: Target, visible: true },
      { id: 'data', label: 'Dữ liệu', icon: Database, visible: true },
    ];
    return allTabs.filter(tab => tab.visible);
  };

  const visibleTabs = getVisibleTabs();

  // Reset to overview if current tab becomes hidden
  const handleViewModeChange = (newMode: ViewMode) => {
    setViewMode(newMode);
    const newVisibleTabs = [
      { id: 'overview', visible: true },
      { id: 'proof', visible: true },
      { id: 'delivery', visible: newMode !== 'member' },
      { id: 'capacity', visible: newMode === 'leader' },
      { id: 'collaboration', visible: true },
      { id: 'quality', visible: newMode === 'leader' },
      { id: 'goals', visible: true },
    ];
    const currentTabVisible = newVisibleTabs.find(t => t.id === activeTab)?.visible;
    if (!currentTabVisible) {
      setActiveTab('overview');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - No sticky to allow scrolling in workspace */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Analysis</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Proof of Process & Execution Analytics
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range */}
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[100px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {/* View Selector */}
          <Select value={viewMode} onValueChange={(v) => handleViewModeChange(v as ViewMode)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="leader">Leader</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="investor">Investor</SelectItem>
            </SelectContent>
          </Select>

          {/* Export */}
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          {/* Share */}
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* View Mode Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Viewing as:</span>
        <Badge variant="secondary" className="capitalize">
          {viewMode}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto">
          {visibleTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="data-[state=active]:gradient-primary data-[state=active]:text-white gap-2"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="proof" className="mt-6">
          <ProofOfProcessTab viewMode={viewMode} />
        </TabsContent>

        {viewMode !== 'member' && (
          <TabsContent value="delivery" className="mt-6">
            <DeliveryFlowTab viewMode={viewMode} />
          </TabsContent>
        )}

        {viewMode === 'leader' && (
          <TabsContent value="capacity" className="mt-6">
            <CapacityTab />
          </TabsContent>
        )}

        <TabsContent value="collaboration" className="mt-6">
          <CollaborationTab />
        </TabsContent>

        {viewMode === 'leader' && (
          <TabsContent value="quality" className="mt-6">
            <QualityRiskTab />
          </TabsContent>
        )}

        <TabsContent value="goals" className="mt-6">
          <GoalsOutcomesTab />
        </TabsContent>

        <TabsContent value="data" className="mt-6">
          <DataAnalysisTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectAnalysisContent;
