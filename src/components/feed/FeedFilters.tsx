import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface FeedFiltersProps {
  onFiltersChange?: (filters: FilterState) => void;
}

interface FilterState {
  type: string;
  role: string;
  tags: string[];
}

const contentTypes = [
  { value: "all", label: "All" },
  { value: "projects", label: "Projects" },
  { value: "blog", label: "Blog" },
  { value: "video", label: "Video" },
  { value: "milestone", label: "Milestone" },
];

const roles = [
  { value: "all", label: "All Roles" },
  { value: "developer", label: "Developer" },
  { value: "designer", label: "Designer" },
  { value: "business", label: "Business" },
  { value: "researcher", label: "Researcher" },
  { value: "marketing", label: "Marketing" },
];

const popularTags = [
  "AI", "Education", "Climate Tech", "HealthTech", "FinTech", 
  "Gaming", "Web3", "Social Impact", "Research", "Open Source"
];

const FeedFilters = ({ onFiltersChange }: FeedFiltersProps) => {
  const [type, setType] = useState("all");
  const [role, setRole] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    onFiltersChange?.({ type, role, tags: newTags });
  };

  const clearFilters = () => {
    setType("all");
    setRole("all");
    setSelectedTags([]);
    onFiltersChange?.({ type: "all", role: "all", tags: [] });
  };

  const hasActiveFilters = type !== "all" || role !== "all" || selectedTags.length > 0;

  return (
    <div className="space-y-4 p-4 bg-card rounded-xl border">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={type} onValueChange={(v) => { setType(v); onFiltersChange?.({ type: v, role, tags: selectedTags }); }}>
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {contentTypes.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={role} onValueChange={(v) => { setRole(v); onFiltersChange?.({ type, role: v, tags: selectedTags }); }}>
          <SelectTrigger className="w-[150px] bg-background">
            <SelectValue placeholder="Role needed" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {roles.map(r => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {popularTags.map(tag => (
          <Badge
            key={tag}
            variant={selectedTags.includes(tag) ? "default" : "outline"}
            className={`cursor-pointer transition-all ${
              selectedTags.includes(tag) 
                ? "gradient-primary border-0 text-primary-foreground" 
                : "hover:bg-primary/10"
            }`}
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default FeedFilters;
