import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus,
  X,
  ExternalLink,
  Search,
  Link as LinkIcon,
  Pencil,
  Trash2,
  Check,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const PLATFORMS = [
  { id: "google-sheets", name: "Google Sheets", icon: "📊", description: "Spreadsheets & data tracking", category: "Productivity" },
  { id: "trello", name: "Trello", icon: "📋", description: "Kanban boards & task management", category: "Project Management" },
  { id: "asana", name: "Asana", icon: "✅", description: "Team task & project tracking", category: "Project Management" },
  { id: "jira", name: "Jira", icon: "🔧", description: "Issue tracking & agile boards", category: "Project Management" },
  { id: "github", name: "GitHub", icon: "🐙", description: "Code repos & version control", category: "Development" },
  { id: "gitlab", name: "GitLab", icon: "🦊", description: "DevOps & CI/CD pipelines", category: "Development" },
  { id: "figma", name: "Figma", icon: "🎨", description: "UI/UX design & prototyping", category: "Design" },
  { id: "notion", name: "Notion", icon: "📝", description: "Docs, wikis & databases", category: "Productivity" },
  { id: "slack", name: "Slack", icon: "💬", description: "Team messaging & channels", category: "Communication" },
  { id: "google-drive", name: "Google Drive", icon: "📁", description: "Cloud file storage & sharing", category: "Storage" },
  { id: "miro", name: "Miro", icon: "🖼️", description: "Collaborative whiteboarding", category: "Design" },
  { id: "linear", name: "Linear", icon: "⚡", description: "Modern issue tracking", category: "Project Management" },
];

interface ConnectedTool {
  id: string;
  platform: string;
  url: string;
  addedAt: string;
}

const IntegrationHub = () => {
  const [connectedTools, setConnectedTools] = useState<ConnectedTool[]>([
    { id: "1", platform: "GitHub", url: "https://github.com/team/solarsense", addedAt: "2 weeks ago" },
    { id: "2", platform: "Notion", url: "https://notion.so/workspace/solarsense", addedAt: "1 month ago" },
    { id: "3", platform: "Figma", url: "https://figma.com/file/solarsense-design", addedAt: "3 weeks ago" },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [addingPlatformId, setAddingPlatformId] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");

  const filteredPlatforms = PLATFORMS.filter(p => 
    !connectedTools.some(t => t.platform === p.name) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAdd = (platformId: string) => {
    if (!newUrl.trim()) return;
    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform) return;
    setConnectedTools(prev => [...prev, {
      id: Date.now().toString(),
      platform: platform.name,
      url: newUrl.trim(),
      addedAt: "Just now",
    }]);
    setNewUrl("");
    setAddingPlatformId(null);
    toast.success(`${platform.name} linked successfully!`);
  };

  const handleRemove = (id: string) => {
    const tool = connectedTools.find(t => t.id === id);
    setConnectedTools(prev => prev.filter(t => t.id !== id));
    toast.info(`${tool?.platform} removed`);
  };

  const handleEditSave = (id: string) => {
    if (!editUrl.trim()) return;
    setConnectedTools(prev => prev.map(t => t.id === id ? { ...t, url: editUrl.trim() } : t));
    setEditingId(null);
    setEditUrl("");
    toast.success("Link updated");
  };

  const categories = Array.from(new Set(filteredPlatforms.map(p => p.category)));

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Integrations & Tools</h1>
          <p className="text-muted-foreground">
            Link your project management tools to keep everything connected. These links appear in your workspace and contribute to your Proof of Process.
          </p>
        </div>

        {/* Connected Tools */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-secondary" />
            Your Connected Tools ({connectedTools.length})
          </h2>

          {connectedTools.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <LinkIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No tools connected yet. Add your first integration below.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {connectedTools.map(tool => {
                const platformData = PLATFORMS.find(p => p.name === tool.platform);
                const isEditing = editingId === tool.id;

                return (
                  <Card key={tool.id} className="p-4 flex items-center gap-4">
                    <span className="text-2xl flex-shrink-0">{platformData?.icon || "🔗"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{tool.platform}</p>
                      {isEditing ? (
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            className="h-8 text-xs"
                            autoFocus
                            onKeyPress={(e) => e.key === "Enter" && handleEditSave(tool.id)}
                          />
                          <Button size="sm" variant="secondary" className="h-8" onClick={() => handleEditSave(tool.id)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingId(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <a href={tool.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground truncate block">
                          {tool.url}
                        </a>
                      )}
                      <span className="text-[10px] text-muted-foreground">Added {tool.addedAt}</span>
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={tool.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingId(tool.id); setEditUrl(tool.url); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRemove(tool.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Add New Integration */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-accent" />
            Add New Integration
          </h2>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search platforms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredPlatforms.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {searchQuery ? "No platforms match your search." : "All platforms are already connected!"}
            </p>
          ) : (
            categories.map(category => {
              const catPlatforms = filteredPlatforms.filter(p => p.category === category);
              if (catPlatforms.length === 0) return null;
              return (
                <div key={category} className="mb-6">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">{category}</Label>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {catPlatforms.map(platform => (
                      <div key={platform.id}>
                        <Card
                          className={`p-4 cursor-pointer transition-all hover:border-secondary/50 hover:shadow-sm ${
                            addingPlatformId === platform.id ? "border-secondary bg-secondary/5" : ""
                          }`}
                          onClick={() => {
                            setAddingPlatformId(addingPlatformId === platform.id ? null : platform.id);
                            setNewUrl("");
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{platform.icon}</span>
                            <div className="min-w-0">
                              <p className="font-medium text-sm">{platform.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{platform.description}</p>
                            </div>
                            <Plus className="h-4 w-4 text-muted-foreground ml-auto flex-shrink-0" />
                          </div>
                        </Card>

                        {addingPlatformId === platform.id && (
                          <Card className="mt-2 p-3 border-secondary/30 bg-secondary/5">
                            <Label className="text-xs mb-1.5 block">Paste your {platform.name} project link</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="https://..."
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleAdd(platform.id)}
                                autoFocus
                                className="h-9"
                              />
                              <Button size="sm" variant="secondary" onClick={() => handleAdd(platform.id)} disabled={!newUrl.trim()}>
                                Add
                              </Button>
                            </div>
                          </Card>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Info */}
        <Card className="p-4 mt-8 bg-primary/5 border-primary/20">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Your links are private</h4>
              <p className="text-xs text-muted-foreground">
                Integration links are only visible to your team members. You can manage access from your workspace settings.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default IntegrationHub;
