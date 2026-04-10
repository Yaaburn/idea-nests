import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  FolderOpen,
  ChevronLeft,
  FileText,
  Trash2,
  FileSpreadsheet,
  FileImage,
  File,
  Upload,
  Pencil,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import FileManager from "./FileManager";

interface Stage {
  id: string;
  name: string;
  description: string;
  fileCount: number;
  updatedAt: string;
  color: string;
}

const suggestedStages = ["Research", "Design", "Development", "Testing", "Launch"];

const mockStages: Stage[] = [
  {
    id: "1",
    name: "Research",
    description: "Market analysis and competitor research documents",
    fileCount: 12,
    updatedAt: "2025-01-10",
    color: "from-blue-500 to-cyan-400",
  },
  {
    id: "2",
    name: "Design",
    description: "Wireframes, mockups, and design specifications",
    fileCount: 8,
    updatedAt: "2025-01-09",
    color: "from-purple-500 to-pink-400",
  },
  {
    id: "3",
    name: "Development",
    description: "Technical documentation and architecture",
    fileCount: 15,
    updatedAt: "2025-01-12",
    color: "from-green-500 to-emerald-400",
  },
];

const DocumentStages = () => {
  const [stages, setStages] = useState(mockStages);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStage, setActiveStage] = useState<Stage | null>(null);
  const [showNewStage, setShowNewStage] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageDescription, setNewStageDescription] = useState("");

  const filteredStages = stages.filter(
    (stage) =>
      stage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stage.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateStage = () => {
    if (!newStageName.trim()) return;

    const colors = [
      "from-blue-500 to-cyan-400",
      "from-purple-500 to-pink-400",
      "from-green-500 to-emerald-400",
      "from-orange-500 to-amber-400",
      "from-red-500 to-rose-400",
    ];

    const newStage: Stage = {
      id: `stage-${Date.now()}`,
      name: newStageName.trim(),
      description: newStageDescription.trim() || "No description",
      fileCount: 0,
      updatedAt: new Date().toISOString().split("T")[0],
      color: colors[Math.floor(Math.random() * colors.length)],
    };

    setStages((prev) => [...prev, newStage]);
    setShowNewStage(false);
    setNewStageName("");
    setNewStageDescription("");
  };

  // Inside Stage View (uses existing FileManager)
  if (activeStage) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb & Back */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveStage(null)}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Documents
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{activeStage.name}</span>
        </div>

        {/* Top Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button className="gradient-primary text-white">
              <Plus className="h-4 w-4 mr-2" />
              New document
            </Button>
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search files..." className="pl-10" />
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Bins
          </Button>
        </div>

        {/* Upload Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Doc", icon: FileText, color: "text-blue-500" },
            { label: "PDF", icon: File, color: "text-red-500" },
            { label: "Excel", icon: FileSpreadsheet, color: "text-green-500" },
            { label: "PPT", icon: FileImage, color: "text-orange-500" },
            { label: "My device", icon: Upload, color: "text-muted-foreground" },
          ].map((tile) => (
            <button
              key={tile.label}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className={cn("p-2 rounded-lg bg-muted group-hover:bg-primary/10", tile.color)}>
                <tile.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{tile.label}</span>
              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </button>
          ))}
        </div>

        {/* File Manager (existing component) */}
        <FileManager />
      </div>
    );
  }

  // Stages Grid View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Stages</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organize files by roadmap stages
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            className="gradient-primary text-white"
            onClick={() => setShowNewStage(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New stage
          </Button>
        </div>
      </div>

      {/* Stage Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStages.map((stage) => (
          <Card
            key={stage.id}
            className="overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all group"
            onClick={() => setActiveStage(stage)}
          >
            {/* Cover with gradient */}
            <div className={cn("h-28 bg-gradient-to-br relative", stage.color)}>
              <div className="absolute inset-0 flex items-center justify-center">
                <FolderOpen className="h-12 w-12 text-white/80" />
              </div>
              {/* Edit button on hover */}
              <button
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 hover:bg-white/40 opacity-0 group-hover:opacity-100 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  // Edit functionality
                }}
              >
                <Pencil className="h-3.5 w-3.5 text-white" />
              </button>
            </div>

            {/* Info */}
            <div className="p-4 space-y-2">
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                {stage.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {stage.description}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                <div className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{stage.fileCount} files</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {new Date(stage.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredStages.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "No stages found matching your search."
              : "No stages yet. Create your first stage to organize documents."}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setShowNewStage(true)}
              className="gradient-primary text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create your first stage
            </Button>
          )}
        </div>
      )}

      {/* New Stage Dialog */}
      <Dialog open={showNewStage} onOpenChange={setShowNewStage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Stage</DialogTitle>
            <DialogDescription>
              Organize your documents by project phase or category.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Suggested chips */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Suggested stages
              </label>
              <div className="flex flex-wrap gap-2">
                {suggestedStages.map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant={newStageName === suggestion ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setNewStageName(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Name input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Stage name *</label>
              <Input
                placeholder="Enter stage name..."
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Description (optional)
              </label>
              <Input
                placeholder="Brief description of this stage..."
                value={newStageDescription}
                onChange={(e) => setNewStageDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewStage(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateStage}
              disabled={!newStageName.trim()}
              className="gradient-primary text-white"
            >
              Create Stage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentStages;
