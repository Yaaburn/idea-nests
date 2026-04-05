import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Upload, 
  X,
  Plus,
  Calendar,
  Users,
  FileText,
  Link as LinkIcon,
  Shield,
  GitBranch,
  Milestone,
  Eye,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

// Platform options for integrations step
const PLATFORMS = [
  { id: "google-sheets", name: "Google Sheets", icon: "📊" },
  { id: "trello", name: "Trello", icon: "📋" },
  { id: "notion", name: "Notion", icon: "📝" },
  { id: "github", name: "GitHub", icon: "🐙" },
  { id: "gitlab", name: "GitLab", icon: "🦊" },
  { id: "figma", name: "Figma", icon: "🎨" },
  { id: "slack", name: "Slack", icon: "💬" },
  { id: "asana", name: "Asana", icon: "✅" },
  { id: "jira", name: "Jira", icon: "🔧" },
  { id: "google-drive", name: "Google Drive", icon: "📁" },
  { id: "miro", name: "Miro", icon: "🖼️" },
  { id: "linear", name: "Linear", icon: "⚡" },
];

const EVENT_TYPES = ["Milestone", "Iteration", "Review", "Meeting", "Launch", "Pivot", "Research"];
const VERIFICATION_TYPES = ["Auto", "Mentor", "Institution"];

interface TimelineEntry {
  title: string;
  date: string;
  type: string;
  description: string;
  evidenceUrl: string;
  verification: string;
}

interface IntegrationLink {
  platform: string;
  url: string;
}

const CreateProject = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8;

  // Step 1: Core Info
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [coverImage, setCoverImage] = useState("");

  // Step 2: Story
  const [whyDoingThis, setWhyDoingThis] = useState("");
  const [howWeWork, setHowWeWork] = useState("");
  const [vision, setVision] = useState("");

  // Step 3: Collaboration Needs
  const [whatWeNeed, setWhatWeNeed] = useState("");
  const [roles, setRoles] = useState<Array<{ title: string; description: string }>>([]);

  // Step 4: Milestones
  const [milestones, setMilestones] = useState<Array<{ title: string; date: string }>>([
    { title: "", date: "" }
  ]);

  // Step 5: Process Timeline (NEW)
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);

  // Step 6: Integrations & Tools (NEW)
  const [integrationLinks, setIntegrationLinks] = useState<IntegrationLink[]>([]);
  const [addingPlatform, setAddingPlatform] = useState<string | null>(null);
  const [newIntegrationUrl, setNewIntegrationUrl] = useState("");

  // Step 7: Visual Identity
  const [founderAvatar, setFounderAvatar] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#1a1f2e");

  // Step 8: Publish Settings
  const [requireNDA, setRequireNDA] = useState(false);
  const [publicTeaser, setPublicTeaser] = useState(true);

  const categories = ["AI/ML", "Climate Tech", "HealthTech", "FinTech", "EdTech", "IoT", "E-commerce", "Blockchain"];

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addRole = () => {
    setRoles([...roles, { title: "", description: "" }]);
  };

  const updateRole = (index: number, field: "title" | "description", value: string) => {
    const newRoles = [...roles];
    newRoles[index][field] = value;
    setRoles(newRoles);
  };

  const removeRole = (index: number) => {
    setRoles(roles.filter((_, i) => i !== index));
  };

  const addMilestone = () => {
    setMilestones([...milestones, { title: "", date: "" }]);
  };

  const updateMilestone = (index: number, field: "title" | "date", value: string) => {
    const newMilestones = [...milestones];
    newMilestones[index][field] = value;
    setMilestones(newMilestones);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  // Timeline helpers
  const addTimelineEntry = () => {
    setTimelineEntries([...timelineEntries, {
      title: "", date: "", type: "Milestone", description: "", evidenceUrl: "", verification: "Auto"
    }]);
  };

  const updateTimelineEntry = (index: number, field: keyof TimelineEntry, value: string) => {
    const updated = [...timelineEntries];
    updated[index] = { ...updated[index], [field]: value };
    setTimelineEntries(updated);
  };

  const removeTimelineEntry = (index: number) => {
    setTimelineEntries(timelineEntries.filter((_, i) => i !== index));
  };

  // Integration helpers
  const addIntegration = (platformId: string) => {
    if (newIntegrationUrl.trim()) {
      const platform = PLATFORMS.find(p => p.id === platformId);
      setIntegrationLinks([...integrationLinks, { platform: platform?.name || platformId, url: newIntegrationUrl.trim() }]);
      setNewIntegrationUrl("");
      setAddingPlatform(null);
    }
  };

  const removeIntegration = (index: number) => {
    setIntegrationLinks(integrationLinks.filter((_, i) => i !== index));
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1: return title && category && tags.length > 0;
      case 2: return whyDoingThis && howWeWork;
      case 3: return whatWeNeed;
      case 4: return milestones.some(m => m.title);
      case 5: return true; // timeline optional
      case 6: return true; // integrations optional
      case 7: return true;
      case 8: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePublish = () => {
    toast.success("Project published successfully! Redirecting...");
    setTimeout(() => navigate("/project/1"), 1500);
  };

  const stepLabels = [
    "Core Info", "Story", "Collaboration", "Milestones",
    "Process Timeline", "Integrations & Tools", "Visual Identity", "Publish Settings"
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Project Title *</Label>
              <Input id="title" placeholder="e.g., SolarSense - Farm Monitoring" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label>Category *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {categories.map((cat) => (
                  <Button key={cat} variant={category === cat ? "secondary" : "outline"} onClick={() => setCategory(cat)} className="justify-start">{cat}</Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Tags * (at least 1)</Label>
              <div className="flex gap-2 mt-2">
                <Input placeholder="e.g., IoT, Agriculture" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
                <Button onClick={addTag} size="sm" variant="secondary"><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">{tag}<X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} /></Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Cover Image URL</Label>
              <Input type="url" placeholder="https://..." value={coverImage} onChange={(e) => setCoverImage(e.target.value)} className="mt-2" />
              {coverImage && (
                <div className="mt-3 rounded-lg overflow-hidden border">
                  <img src={coverImage} alt="Cover preview" className="w-full h-48 object-cover" />
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label>Why I'm doing this *</Label>
              <p className="text-sm text-muted-foreground mb-2">Share your personal motivation and the problem you're solving</p>
              <Textarea placeholder="I'm building this because..." value={whyDoingThis} onChange={(e) => setWhyDoingThis(e.target.value)} className="min-h-[120px]" />
            </div>
            <div>
              <Label>How we work *</Label>
              <p className="text-sm text-muted-foreground mb-2">Describe your team culture and working style</p>
              <Textarea placeholder="Our team works remotely, meets twice weekly..." value={howWeWork} onChange={(e) => setHowWeWork(e.target.value)} className="min-h-[120px]" />
            </div>
            <div>
              <Label>Vision & Impact</Label>
              <p className="text-sm text-muted-foreground mb-2">What's the long-term impact you're aiming for?</p>
              <Textarea placeholder="In 5 years, we envision..." value={vision} onChange={(e) => setVision(e.target.value)} className="min-h-[100px]" />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label>What we need from you *</Label>
              <p className="text-sm text-muted-foreground mb-2">Describe the skills, commitment, and type of collaboration</p>
              <Textarea placeholder="We're looking for passionate individuals who..." value={whatWeNeed} onChange={(e) => setWhatWeNeed(e.target.value)} className="min-h-[120px]" />
            </div>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Specific Roles (Optional)</Label>
                <Button onClick={addRole} size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Add Role</Button>
              </div>
              <div className="space-y-4">
                {roles.map((role, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-muted-foreground mt-2" />
                      <div className="flex-1 space-y-3">
                        <Input placeholder="Role title (e.g., Frontend Developer)" value={role.title} onChange={(e) => updateRole(index, "title", e.target.value)} />
                        <Textarea placeholder="Role description & requirements..." value={role.description} onChange={(e) => updateRole(index, "description", e.target.value)} className="min-h-[80px]" />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeRole(index)}><X className="h-4 w-4" /></Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label>Project Milestones</Label>
                <p className="text-sm text-muted-foreground">Add key milestones and target dates</p>
              </div>
              <Button onClick={addMilestone} size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Add Milestone</Button>
            </div>
            <div className="space-y-3">
              {milestones.map((milestone, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-2" />
                    <div className="flex-1 grid md:grid-cols-2 gap-3">
                      <Input placeholder="Milestone title" value={milestone.title} onChange={(e) => updateMilestone(index, "title", e.target.value)} />
                      <Input type="date" value={milestone.date} onChange={(e) => updateMilestone(index, "date", e.target.value)} />
                    </div>
                    {milestones.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeMilestone(index)}><X className="h-4 w-4" /></Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      // NEW STEP 5: Process Timeline
      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <GitBranch className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold">Process Timeline</h3>
                <p className="text-sm text-muted-foreground">
                  Document your project journey so far — milestones hit, iterations done, reviews completed. This builds your Proof of Process.
                </p>
              </div>
            </div>

            <div className="p-4 bg-secondary/5 rounded-lg border border-secondary/20">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-secondary" />
                <span className="font-medium">Why this matters:</span>
                <span className="text-muted-foreground">Each entry becomes verifiable evidence on your project profile, building trust with investors and collaborators.</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Timeline Events ({timelineEntries.length})</Label>
              <Button onClick={addTimelineEntry} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />Add Event
              </Button>
            </div>

            {timelineEntries.length === 0 && (
              <Card className="p-8 text-center border-dashed">
                <Milestone className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No timeline events yet. Add events to document your project's journey.</p>
                <Button onClick={addTimelineEntry} size="sm" variant="secondary">
                  <Plus className="h-4 w-4 mr-1" />Add First Event
                </Button>
              </Card>
            )}

            <div className="space-y-4">
              {timelineEntries.map((entry, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Event #{index + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeTimelineEntry(index)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <Input placeholder="Event title *" value={entry.title} onChange={(e) => updateTimelineEntry(index, "title", e.target.value)} />
                      <Input type="date" value={entry.date} onChange={(e) => updateTimelineEntry(index, "date", e.target.value)} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Event Type</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {EVENT_TYPES.map(type => (
                            <Badge
                              key={type}
                              variant={entry.type === type ? "secondary" : "outline"}
                              className="cursor-pointer text-xs"
                              onClick={() => updateTimelineEntry(index, "type", type)}
                            >
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Verification</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {VERIFICATION_TYPES.map(v => (
                            <Badge
                              key={v}
                              variant={entry.verification === v ? "secondary" : "outline"}
                              className="cursor-pointer text-xs"
                              onClick={() => updateTimelineEntry(index, "verification", v)}
                            >
                              {v === "Auto" && "🤖 "}{v === "Mentor" && "👨‍🏫 "}{v === "Institution" && "🏛️ "}{v}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Textarea
                      placeholder="Describe what happened, what was achieved..."
                      value={entry.description}
                      onChange={(e) => updateTimelineEntry(index, "description", e.target.value)}
                      className="min-h-[60px]"
                    />
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Evidence (URL to document, screenshot, or file)
                      </Label>
                      <Input
                        placeholder="https://drive.google.com/... or upload link"
                        value={entry.evidenceUrl}
                        onChange={(e) => updateTimelineEntry(index, "evidenceUrl", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      // NEW STEP 6: Integrations & Tools
      case 6:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <LinkIcon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">Integrations & Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Link your existing project management tools. These will appear in your workspace and help build Proof of Process.
                </p>
              </div>
            </div>

            {/* Connected tools */}
            {integrationLinks.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Linked Tools ({integrationLinks.length})</Label>
                {integrationLinks.map((link, index) => (
                  <Card key={index} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg">{PLATFORMS.find(p => p.name === link.platform)?.icon || "🔗"}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{link.platform}</p>
                        <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeIntegration(index)}><X className="h-4 w-4" /></Button>
                  </Card>
                ))}
              </div>
            )}

            {/* Add new */}
            <div>
              <Label className="text-sm mb-2 block">Add a tool</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {PLATFORMS.filter(p => !integrationLinks.some(l => l.platform === p.name)).map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => { setAddingPlatform(addingPlatform === platform.id ? null : platform.id); setNewIntegrationUrl(""); }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all hover:border-secondary/50 hover:bg-secondary/5 ${
                      addingPlatform === platform.id ? "border-secondary bg-secondary/10" : ""
                    }`}
                  >
                    <span className="text-xl">{platform.icon}</span>
                    <span className="text-xs font-medium leading-tight">{platform.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Inline URL input */}
            {addingPlatform && (
              <Card className="p-4 border-secondary/30 bg-secondary/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{PLATFORMS.find(p => p.id === addingPlatform)?.icon}</span>
                  <span className="font-medium text-sm">{PLATFORMS.find(p => p.id === addingPlatform)?.name}</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste your project link here..."
                    value={newIntegrationUrl}
                    onChange={(e) => setNewIntegrationUrl(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addIntegration(addingPlatform)}
                    autoFocus
                  />
                  <Button size="sm" variant="secondary" onClick={() => addIntegration(addingPlatform)} disabled={!newIntegrationUrl.trim()}>
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAddingPlatform(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}

            {integrationLinks.length === 0 && !addingPlatform && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Select a platform above to link your project tools. You can add more later from your workspace.
              </p>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <Label>Founder Avatar URL</Label>
              <Input type="url" placeholder="https://..." value={founderAvatar} onChange={(e) => setFounderAvatar(e.target.value)} className="mt-2" />
              {founderAvatar && (
                <div className="mt-3">
                  <img src={founderAvatar} alt="Avatar preview" className="w-24 h-24 rounded-full object-cover border-4 border-secondary/20" />
                </div>
              )}
            </div>
            <div>
              <Label>Background Color</Label>
              <div className="flex gap-3 mt-2">
                <Input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-20 h-10" />
                <Input type="text" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} placeholder="#1a1f2e" />
              </div>
            </div>
            <div className="mt-6 p-6 rounded-lg border" style={{ backgroundColor }}>
              <p className="text-sm text-white/70">Preview of your project header background</p>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Public Teaser</Label>
                  <p className="text-sm text-muted-foreground">Show basic info publicly (title, tags, stage)</p>
                </div>
                <Switch checked={publicTeaser} onCheckedChange={setPublicTeaser} />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Require NDA</Label>
                  <p className="text-sm text-muted-foreground">Contributors must sign NDA before viewing full details</p>
                </div>
                <Switch checked={requireNDA} onCheckedChange={setRequireNDA} />
              </div>
            </Card>
            <div className="mt-8 p-6 bg-secondary/10 rounded-lg border border-secondary/20">
              <h4 className="font-semibold mb-2">Ready to publish?</h4>
              <p className="text-sm text-muted-foreground">Your project will be visible to the community. You can edit it anytime from your dashboard.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderPreview = () => {
    return (
      <Card className="p-6 sticky top-24">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
          Live Preview
        </h3>
        
        <div className="space-y-4">
          {coverImage && (
            <div className="rounded-lg overflow-hidden">
              <img src={coverImage} alt="Cover" className="w-full h-32 object-cover" />
            </div>
          )}

          {title && (
            <div>
              <h4 className="font-bold text-lg">{title}</h4>
              {category && <Badge variant="secondary" className="mt-1">{category}</Badge>}
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          {whyDoingThis && (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Why I'm doing this</p>
              <p className="line-clamp-3">{whyDoingThis}</p>
            </div>
          )}

          {roles.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Roles ({roles.length})</p>
              <div className="space-y-1">
                {roles.filter(r => r.title).map((role, i) => (
                  <div key={i} className="text-xs px-2 py-1 bg-muted rounded">{role.title}</div>
                ))}
              </div>
            </div>
          )}

          {milestones.some(m => m.title) && (
            <div>
              <p className="text-sm font-medium mb-2">Milestones</p>
              <div className="space-y-1">
                {milestones.filter(m => m.title).map((m, i) => (
                  <div key={i} className="text-xs px-2 py-1 bg-muted rounded flex justify-between">
                    <span>{m.title}</span>
                    {m.date && <span className="text-muted-foreground">{m.date}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {timelineEntries.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1">
                <GitBranch className="h-3.5 w-3.5" /> Process Timeline ({timelineEntries.length})
              </p>
              <div className="space-y-1">
                {timelineEntries.filter(e => e.title).map((e, i) => (
                  <div key={i} className="text-xs px-2 py-1 bg-muted rounded flex items-center justify-between gap-1">
                    <span className="truncate">{e.title}</span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0">{e.type}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {integrationLinks.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1">
                <LinkIcon className="h-3.5 w-3.5" /> Tools ({integrationLinks.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {integrationLinks.map((l, i) => (
                  <Badge key={i} variant="outline" className="text-xs gap-1">
                    {PLATFORMS.find(p => p.name === l.platform)?.icon} {l.platform}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
            
            <h1 className="text-3xl font-bold mb-2">Create Your Project</h1>
            <p className="text-muted-foreground">
              Step {currentStep} of {totalSteps}: {stepLabels[currentStep - 1]}
            </p>
            
            <Progress value={(currentStep / totalSteps) * 100} className="mt-4" />
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="p-6">
                {renderStep()}
                <Separator className="my-6" />
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
                    <ArrowLeft className="h-4 w-4 mr-2" />Back
                  </Button>
                  {currentStep < totalSteps ? (
                    <Button onClick={handleNext} disabled={!canGoNext()} variant="secondary">
                      Next<ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={handlePublish} disabled={!canGoNext()} variant="secondary">
                      <Check className="h-4 w-4 mr-2" />Publish Project
                    </Button>
                  )}
                </div>
              </Card>
            </div>
            <div className="lg:col-span-1">
              {renderPreview()}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default CreateProject;
