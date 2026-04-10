import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Loader2, Calendar, Lock, Globe, Link as LinkIcon, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task, PROJECT_MILESTONES } from "./taskTypes";

const mockAssignees = [
  { id: "1", name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
  { id: "2", name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
  { id: "3", name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
];

interface InlineTaskComposerProps {
  columnId: string;
  onClose: () => void;
  onCreate: (task: Task) => void;
}

const InlineTaskComposer = memo(({ columnId, onClose, onCreate }: InlineTaskComposerProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [milestone, setMilestone] = useState<string>("");
  const [linkInput, setLinkInput] = useState("");
  const [externalLinks, setExternalLinks] = useState<{ url: string; label?: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const titleRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleAddTag = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim() && tags.length < 5) {
      e.preventDefault();
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput("");
    }
  }, [tagInput, tags.length]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  }, []);

  const handleAddLink = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && linkInput.trim()) {
      e.preventDefault();
      try {
        new URL(linkInput.trim());
        setExternalLinks(prev => [...prev, { url: linkInput.trim() }]);
        setLinkInput("");
      } catch {
        // invalid URL, ignore
      }
    }
  }, [linkInput]);

  const handleSubmit = useCallback(async () => {
    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters");
      return;
    }

    setError("");
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    const assignee = mockAssignees.find(a => a.id === assigneeId);
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      assignee,
      dueDate: dueDate || undefined,
      tags,
      priority,
      visibility,
      milestone: milestone || undefined,
      externalLinks: externalLinks.length > 0 ? externalLinks : undefined,
    };

    onCreate(newTask);
    setIsSubmitting(false);
  }, [title, description, assigneeId, dueDate, tags, priority, visibility, milestone, externalLinks, onCreate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <Card
      ref={containerRef}
      className="p-4 border-2 border-primary/30 shadow-lg animate-fade-in"
      onKeyDown={handleKeyDown}
    >
      <div className="space-y-3">
        {/* Title */}
        <div>
          <Input
            ref={titleRef}
            placeholder="Task name..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={cn(error && "border-destructive")}
          />
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>

        {/* Description */}
        <Textarea
          placeholder="Short description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="resize-none"
        />

        {/* Assignee & Priority */}
        <div className="flex gap-2">
          <Select value={assigneeId} onValueChange={setAssigneeId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {mockAssignees.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={a.avatar} />
                      <AvatarFallback>{a.name[0]}</AvatarFallback>
                    </Avatar>
                    <span>{a.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priority} onValueChange={(v) => setPriority(v as "low" | "medium" | "high")}>
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Milestone & Visibility */}
        <div className="flex gap-2">
          <Select value={milestone} onValueChange={setMilestone}>
            <SelectTrigger className="flex-1">
              <Flag className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Milestone" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="none">No milestone</SelectItem>
              {PROJECT_MILESTONES.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("gap-1.5 shrink-0 h-10", visibility === "private" && "border-primary/50 text-primary")}
            onClick={() => setVisibility(v => v === "public" ? "private" : "public")}
          >
            {visibility === "private" ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
            {visibility === "private" ? "Private" : "Public"}
          </Button>
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* External Links */}
        <div>
          {externalLinks.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {externalLinks.map((link, i) => (
                <Badge key={i} variant="secondary" className="gap-1 text-xs">
                  <LinkIcon className="h-3 w-3" />
                  {new URL(link.url).hostname.replace("www.", "")}
                  <button onClick={() => setExternalLinks(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <Input
            placeholder="Paste link (Drive, Figma, GitHub...)"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={handleAddLink}
            className="h-8 text-sm"
          />
        </div>

        {/* Tags */}
        <div>
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          {tags.length < 5 && (
            <Input
              placeholder="Add tag (Enter to add)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="h-8 text-sm"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">Ctrl+Enter to create</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || title.trim().length < 3}
              className="gradient-primary text-white"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Creating...</>
              ) : (
                <><Plus className="h-4 w-4 mr-1" />Create task</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
});

InlineTaskComposer.displayName = "InlineTaskComposer";

export default InlineTaskComposer;
