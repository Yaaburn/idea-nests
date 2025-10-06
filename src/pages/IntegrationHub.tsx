import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { 
  Github, 
  FileText, 
  MessageSquare, 
  Calendar,
  Figma,
  Database,
  Cloud,
  CheckCircle2,
  Loader2,
  Settings,
  Plus,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface Integration {
  id: string;
  name: string;
  icon: any;
  description: string;
  connected: boolean;
  syncing: boolean;
  lastSync?: string;
  dataPoints?: number;
  category: string;
}

const IntegrationHub = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "github",
      name: "GitHub",
      icon: Github,
      description: "Sync commits, issues, and releases to prove technical progress",
      connected: true,
      syncing: false,
      lastSync: "2 hours ago",
      dataPoints: 247,
      category: "Development"
    },
    {
      id: "notion",
      name: "Notion",
      icon: FileText,
      description: "Track tasks, milestones, and project documentation",
      connected: true,
      syncing: false,
      lastSync: "1 day ago",
      dataPoints: 142,
      category: "Productivity"
    },
    {
      id: "slack",
      name: "Slack",
      icon: MessageSquare,
      description: "Capture team collaboration and communication frequency",
      connected: false,
      syncing: false,
      category: "Communication"
    },
    {
      id: "figma",
      name: "Figma",
      icon: Figma,
      description: "Sync design iterations and prototype updates",
      connected: true,
      syncing: false,
      lastSync: "3 days ago",
      dataPoints: 89,
      category: "Design"
    },
    {
      id: "google-drive",
      name: "Google Drive",
      icon: Cloud,
      description: "Monitor document updates and file activity",
      connected: false,
      syncing: false,
      category: "Storage"
    },
    {
      id: "google-meet",
      name: "Google Meet",
      icon: Calendar,
      description: "Track meeting frequency and team engagement",
      connected: false,
      syncing: false,
      category: "Communication"
    },
    {
      id: "trello",
      name: "Trello",
      icon: Database,
      description: "Sync board activity and task completion",
      connected: false,
      syncing: false,
      category: "Productivity"
    }
  ]);

  const [autoSync, setAutoSync] = useState(true);

  const handleConnect = (id: string) => {
    setIntegrations(prev => prev.map(int => 
      int.id === id 
        ? { ...int, syncing: true }
        : int
    ));

    setTimeout(() => {
      setIntegrations(prev => prev.map(int => 
        int.id === id 
          ? { ...int, connected: true, syncing: false, lastSync: "Just now", dataPoints: 0 }
          : int
      ));
      toast.success(`Connected to ${integrations.find(i => i.id === id)?.name} successfully!`);
    }, 2000);
  };

  const handleDisconnect = (id: string) => {
    setIntegrations(prev => prev.map(int => 
      int.id === id 
        ? { ...int, connected: false, lastSync: undefined, dataPoints: undefined }
        : int
    ));
    toast.info(`Disconnected from ${integrations.find(i => i.id === id)?.name}`);
  };

  const handleSync = (id: string) => {
    setIntegrations(prev => prev.map(int => 
      int.id === id 
        ? { ...int, syncing: true }
        : int
    ));

    setTimeout(() => {
      setIntegrations(prev => prev.map(int => 
        int.id === id 
          ? { 
              ...int, 
              syncing: false, 
              lastSync: "Just now",
              dataPoints: (int.dataPoints || 0) + Math.floor(Math.random() * 20) + 5
            }
          : int
      ));
      toast.success("Sync completed successfully!");
    }, 3000);
  };

  const connectedCount = integrations.filter(i => i.connected).length;
  const totalDataPoints = integrations.reduce((sum, int) => sum + (int.dataPoints || 0), 0);

  const categories = Array.from(new Set(integrations.map(i => i.category)));

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3">Integration Hub</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Connect your work platforms to automatically build your Proof of Process. 
              Show real progress through authentic data.
            </p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{connectedCount}</div>
                  <div className="text-sm text-muted-foreground">Connected Platforms</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Database className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalDataPoints}</div>
                  <div className="text-sm text-muted-foreground">Data Points Synced</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Auto-sync</span>
                    <Switch checked={autoSync} onCheckedChange={setAutoSync} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Sync every 24 hours
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Proof Strength */}
          <Card className="p-6 mb-8 bg-gradient-to-br from-secondary/5 to-accent/5 border-secondary/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Proof Strength Score</h3>
                <p className="text-sm text-muted-foreground">
                  Connect more platforms to increase your credibility
                </p>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {Math.round((connectedCount / integrations.length) * 100)}%
              </Badge>
            </div>
            <Progress value={(connectedCount / integrations.length) * 100} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {connectedCount} of {integrations.length} recommended integrations connected
            </p>
          </Card>

          {/* Integration Cards by Category */}
          {categories.map(category => (
            <div key={category} className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{category}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations
                  .filter(int => int.category === category)
                  .map((integration) => {
                    const Icon = integration.icon;
                    return (
                      <Card 
                        key={integration.id} 
                        className={`p-6 transition-all ${
                          integration.connected 
                            ? 'border-secondary/50 bg-secondary/5' 
                            : 'hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            integration.connected 
                              ? 'bg-secondary/20' 
                              : 'bg-muted'
                          }`}>
                            <Icon className={`h-6 w-6 ${
                              integration.connected 
                                ? 'text-secondary' 
                                : 'text-muted-foreground'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{integration.name}</h3>
                              {integration.connected && (
                                <CheckCircle2 className="h-4 w-4 text-secondary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {integration.description}
                            </p>
                          </div>
                        </div>

                        {integration.connected && (
                          <div className="mb-4 p-3 bg-background rounded-lg border space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Last synced</span>
                              <span className="font-medium">{integration.lastSync}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Data points</span>
                              <span className="font-medium">{integration.dataPoints}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {!integration.connected ? (
                            <Button 
                              className="flex-1"
                              variant="secondary"
                              onClick={() => handleConnect(integration.id)}
                              disabled={integration.syncing}
                            >
                              {integration.syncing ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Connecting...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Connect
                                </>
                              )}
                            </Button>
                          ) : (
                            <>
                              <Button 
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleSync(integration.id)}
                                disabled={integration.syncing}
                              >
                                {integration.syncing ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Syncing...
                                  </>
                                ) : (
                                  'Sync Now'
                                )}
                              </Button>
                              <Button 
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDisconnect(integration.id)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </div>
          ))}

          {/* Info Banner */}
          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="flex gap-4">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Your data is secure</h4>
                <p className="text-sm text-muted-foreground">
                  We only access metadata and activity logs, never your actual content. 
                  You can disconnect any integration at any time, and all associated data will be removed.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default IntegrationHub;
