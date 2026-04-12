import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Loader2, Calendar, Lock, Globe, Link2, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task, Milestone, SubTask, ExternalLink, detectLinkType, mockAssignees, EXISTING_TAGS } from "./types";

interface EnhancedTaskComposerProps {
  columnId: string;
  milestones: Milestone[];
  onClose: () => void;
  onCreate: (task: Task) => void;
}

const EnhancedTaskComposer = memo(({ columnId, milestones, onClose, onCreate }: EnhancedTaskComposerProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("1"); // smart default: current user
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [milestoneId, setMilestoneId] = useState<string>("");
  const [subtaskInput, setSubtaskInput] = useState("");
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleTagInput = useCallback((val: string) => {
    setTagInput(val);
    if (val.trim()) {
      const filtered = EXISTING_TAGS.filter(
        (t) => t.toLowerCase().includes(val.toLowerCase()) && !tags.includes(t)
      ).slice(0, 5);
      setTagSuggestions(filtered);
    } else {
      setTagSuggestions([]);
    }
  }, [tags]);

  const addTag = useCallback((tag: string) => {
    if (tags.length < 5 && !tags.includes(tag)) {
      setTags((p) => [...p, tag]);
    }
    setTagInput("");
    setTagSuggestions([]);
  }, [tags]);

  const handleAddTag = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim() && tags.length < 5) {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  }, [tagInput, tags.length, addTag]);

  const addSubtask = useCallback(() => {
    if (subtaskInput.trim()) {
      setSubtasks((p) => [...p, { id: `sub-${Date.now()}`, title: subtaskInput.trim(), completed: false }]);
      setSubtaskInput("");
    }
  }, [subtaskInput]);

  const addLink = useCallback(() => {
    if (linkInput.trim()) {
      const type = detectLinkType(linkInput.trim());
      setLinks((p) => [...p, { id: `link-${Date.now()}`, url: linkInput.trim(), type }]);
      setLinkInput("");
    }
  }, [linkInput]);

  const handleSubmit = useCallback(async () => {
    if (title.trim().length < 3) {
      setError("Tên task tối thiểu 3 ký tự");
      return;
    }
    setError("");
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 200));

    const assignee = mockAssignees.find((a) => a.id === assigneeId);
    const task: Task = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      assignee,
      dueDate: dueDate || undefined,
      tags,
      priority,
      visibility,
      milestoneId: milestoneId || undefined,
      subtasks,
      externalLinks: links,
      transitions: [],
      createdAt: new Date().toISOString(),
    };
    onCreate(task);
    setIsSubmitting(false);
  }, [title, description, assigneeId, dueDate, tags, priority, visibility, milestoneId, subtasks, links, onCreate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); handleSubmit(); }
  }, [handleSubmit]);

  return (
    <Card className="p-4 border-2 border-primary/30 shadow-lg animate-fade-in" onKeyDown={handleKeyDown}>
      <div className="space-y-3">
        {/* Title */}
        <Input ref={titleRef} placeholder="Tên task..." value={title} onChange={(e) => setTitle(e.target.value)}
          className={cn(error && "border-destructive")} />
        {error && <p className="text-xs text-destructive">{error}</p>}

        {/* Description */}
        <Textarea placeholder="Mô tả ngắn (tùy chọn)" value={description}
          onChange={(e) => setDescription(e.target.value)} rows={2} className="resize-none" />

        {/* Row: Assignee + Priority + Visibility */}
        <div className="grid grid-cols-3 gap-2">
          <Select value={assigneeId} onValueChange={setAssigneeId}>
            <SelectTrigger><SelectValue placeholder="Assignee" /></SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {mockAssignees.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5"><AvatarImage src={a.avatar} /><AvatarFallback>{a.name[0]}</AvatarFallback></Avatar>
                    <span className="truncate">{a.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="low">↓ Low</SelectItem>
              <SelectItem value="medium">→ Medium</SelectItem>
              <SelectItem value="high">↑ High</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 justify-end">
            {visibility === "private" ? <Lock className="h-4 w-4 text-purple-500" /> : <Globe className="h-4 w-4 text-muted-foreground" />}
            <Switch checked={visibility === "private"} onCheckedChange={(v) => setVisibility(v ? "private" : "public")} />
            <span className="text-xs">{visibility === "private" ? "Private" : "Public"}</span>
          </div>
        </div>

        {/* Row: Date + Milestone */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          {milestones.length > 0 && (
            <Select value={milestoneId} onValueChange={setMilestoneId}>
              <SelectTrigger><SelectValue placeholder="Milestone" /></SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="none">No milestone</SelectItem>
                {milestones.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-1"><Flag className="h-3 w-3" />{m.code} — {m.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Tags with suggestions */}
        <div>
          <div className="flex flex-wrap gap-1 mb-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">{tag}
                <button onClick={() => setTags((p) => p.filter((t) => t !== tag))} className="hover:text-destructive"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
          {tags.length < 5 && (
            <div className="relative">
              <Input placeholder="Add tag (Enter)" value={tagInput} onChange={(e) => handleTagInput(e.target.value)} onKeyDown={handleAddTag} className="h-8 text-sm" />
              {tagSuggestions.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-lg shadow-lg p-1">
                  {tagSuggestions.map((s) => (
                    <button key={s} onClick={() => addTag(s)} className="w-full text-left px-2 py-1 text-sm rounded hover:bg-muted transition-colors">{s}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Subtasks */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Subtasks</Label>
          {subtasks.map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-xs py-0.5">
              <span className="flex-1">{s.title}</span>
              <button onClick={() => setSubtasks((p) => p.filter((x) => x.id !== s.id))} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
            </div>
          ))}
          <div className="flex gap-1">
            <Input placeholder="Add subtask" value={subtaskInput} onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } }} className="h-7 text-xs flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addSubtask}><Plus className="h-3 w-3" /></Button>
          </div>
        </div>

        {/* External links */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">External links</Label>
          {links.map((l) => (
            <div key={l.id} className="flex items-center gap-2 text-xs py-0.5">
              <Link2 className="h-3 w-3 shrink-0" /><span className="truncate flex-1">{l.url}</span>
              <button onClick={() => setLinks((p) => p.filter((x) => x.id !== l.id))} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
            </div>
          ))}
          <div className="flex gap-1">
            <Input placeholder="Paste link (Figma, GitHub...)" value={linkInput} onChange={(e) => setLinkInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }} className="h-7 text-xs flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addLink}><Plus className="h-3 w-3" /></Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">Ctrl+Enter to create</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || title.trim().length < 3} className="gradient-primary text-white">
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Creating...</> : <><Plus className="h-4 w-4 mr-1" />Create</>}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
});

EnhancedTaskComposer.displayName = "EnhancedTaskComposer";
export default EnhancedTaskComposer;
