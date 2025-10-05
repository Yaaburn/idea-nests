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
  Users
} from "lucide-react";
import { toast } from "sonner";

const CreateProject = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

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

  // Step 5: Visual Identity
  const [founderAvatar, setFounderAvatar] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#1a1f2e");

  // Step 6: Publish Settings
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

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return title && category && tags.length > 0;
      case 2:
        return whyDoingThis && howWeWork;
      case 3:
        return whatWeNeed;
      case 4:
        return milestones.some(m => m.title);
      case 5:
        return true;
      case 6:
        return true;
      default:
        return false;
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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                placeholder="e.g., SolarSense - Farm Monitoring"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={category === cat ? "secondary" : "outline"}
                    onClick={() => setCategory(cat)}
                    className="justify-start"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags * (at least 1)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="tags"
                  placeholder="e.g., IoT, Agriculture, Hardware"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button onClick={addTag} size="sm" variant="secondary">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="cover">Cover Image URL</Label>
              <Input
                id="cover"
                type="url"
                placeholder="https://..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="mt-2"
              />
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
              <Label htmlFor="why">Why I'm doing this *</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Share your personal motivation and the problem you're solving
              </p>
              <Textarea
                id="why"
                placeholder="I'm building this because..."
                value={whyDoingThis}
                onChange={(e) => setWhyDoingThis(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div>
              <Label htmlFor="how">How we work *</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Describe your team culture and working style
              </p>
              <Textarea
                id="how"
                placeholder="Our team works remotely, meets twice weekly..."
                value={howWeWork}
                onChange={(e) => setHowWeWork(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div>
              <Label htmlFor="vision">Vision & Impact</Label>
              <p className="text-sm text-muted-foreground mb-2">
                What's the long-term impact you're aiming for?
              </p>
              <Textarea
                id="vision"
                placeholder="In 5 years, we envision..."
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="needs">What we need from you *</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Describe the skills, commitment, and type of collaboration you're looking for
              </p>
              <Textarea
                id="needs"
                placeholder="We're looking for passionate individuals who..."
                value={whatWeNeed}
                onChange={(e) => setWhatWeNeed(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Specific Roles (Optional)</Label>
                <Button onClick={addRole} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Role
                </Button>
              </div>

              <div className="space-y-4">
                {roles.map((role, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-muted-foreground mt-2" />
                      <div className="flex-1 space-y-3">
                        <Input
                          placeholder="Role title (e.g., Frontend Developer)"
                          value={role.title}
                          onChange={(e) => updateRole(index, "title", e.target.value)}
                        />
                        <Textarea
                          placeholder="Role description & requirements..."
                          value={role.description}
                          onChange={(e) => updateRole(index, "description", e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRole(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
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
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label>Project Milestones</Label>
                  <p className="text-sm text-muted-foreground">
                    Add key milestones and target dates
                  </p>
                </div>
                <Button onClick={addMilestone} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Milestone
                </Button>
              </div>

              <div className="space-y-3">
                {milestones.map((milestone, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-2" />
                      <div className="flex-1 grid md:grid-cols-2 gap-3">
                        <Input
                          placeholder="Milestone title"
                          value={milestone.title}
                          onChange={(e) => updateMilestone(index, "title", e.target.value)}
                        />
                        <Input
                          type="date"
                          value={milestone.date}
                          onChange={(e) => updateMilestone(index, "date", e.target.value)}
                        />
                      </div>
                      {milestones.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMilestone(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="avatar">Founder Avatar URL</Label>
              <Input
                id="avatar"
                type="url"
                placeholder="https://..."
                value={founderAvatar}
                onChange={(e) => setFounderAvatar(e.target.value)}
                className="mt-2"
              />
              {founderAvatar && (
                <div className="mt-3">
                  <img
                    src={founderAvatar}
                    alt="Avatar preview"
                    className="w-24 h-24 rounded-full object-cover border-4 border-secondary/20"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="bg">Background Color</Label>
              <div className="flex gap-3 mt-2">
                <Input
                  id="bg"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  placeholder="#1a1f2e"
                />
              </div>
            </div>

            <div className="mt-6 p-6 rounded-lg border" style={{ backgroundColor }}>
              <p className="text-sm text-white/70">Preview of your project header background</p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="teaser" className="text-base">Public Teaser</Label>
                  <p className="text-sm text-muted-foreground">
                    Show basic info publicly (title, tags, stage)
                  </p>
                </div>
                <Switch
                  id="teaser"
                  checked={publicTeaser}
                  onCheckedChange={setPublicTeaser}
                />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="nda" className="text-base">Require NDA</Label>
                  <p className="text-sm text-muted-foreground">
                    Contributors must sign NDA before viewing full details
                  </p>
                </div>
                <Switch
                  id="nda"
                  checked={requireNDA}
                  onCheckedChange={setRequireNDA}
                />
              </div>
            </Card>

            <div className="mt-8 p-6 bg-secondary/10 rounded-lg border border-secondary/20">
              <h4 className="font-semibold mb-2">Ready to publish?</h4>
              <p className="text-sm text-muted-foreground">
                Your project will be visible to the community. You can edit it anytime from your dashboard.
              </p>
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
                  <div key={i} className="text-xs px-2 py-1 bg-muted rounded">
                    {role.title}
                  </div>
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
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <h1 className="text-3xl font-bold mb-2">Create Your Project</h1>
            <p className="text-muted-foreground">
              Step {currentStep} of {totalSteps}: {
                ["Core Info", "Story", "Collaboration", "Milestones", "Visual Identity", "Publish Settings"][currentStep - 1]
              }
            </p>
            
            <Progress value={(currentStep / totalSteps) * 100} className="mt-4" />
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                {renderStep()}

                <Separator className="my-6" />

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>

                  {currentStep < totalSteps ? (
                    <Button
                      onClick={handleNext}
                      disabled={!canGoNext()}
                      variant="secondary"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePublish}
                      disabled={!canGoNext()}
                      variant="secondary"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Publish Project
                    </Button>
                  )}
                </div>
              </Card>
            </div>

            {/* Preview */}
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
