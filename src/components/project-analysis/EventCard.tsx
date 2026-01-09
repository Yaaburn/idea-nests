import { cn } from "@/lib/utils";
import { 
  Target, 
  CheckSquare, 
  GitCommit, 
  Palette, 
  FileText, 
  Video, 
  Compass, 
  MessageSquare, 
  AlertTriangle, 
  DollarSign,
  ExternalLink,
  Users
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type EventType = 
  | "milestone" 
  | "task" 
  | "code" 
  | "design" 
  | "docs" 
  | "demo" 
  | "decision" 
  | "feedback" 
  | "risk" 
  | "funding";

interface Contributor {
  id: string;
  name: string;
  avatar?: string;
}

interface EvidenceLink {
  label: string;
  url: string;
  type: "github" | "figma" | "drive" | "notion" | "video" | "external";
}

export interface ProofEvent {
  id: string;
  type: EventType;
  title: string;
  timestamp: Date;
  owner: Contributor;
  contributors: Contributor[];
  evidenceLinks: EvidenceLink[];
  whyItMatters?: string;
  tags: string[];
  impact?: "high" | "medium" | "low";
}

const eventConfig: Record<EventType, { icon: typeof Target; color: string; bgColor: string; label: string }> = {
  milestone: { icon: Target, color: "text-primary", bgColor: "bg-primary/20", label: "Milestone" },
  task: { icon: CheckSquare, color: "text-green-500", bgColor: "bg-green-500/20", label: "Task" },
  code: { icon: GitCommit, color: "text-blue-500", bgColor: "bg-blue-500/20", label: "Code" },
  design: { icon: Palette, color: "text-pink-500", bgColor: "bg-pink-500/20", label: "Design" },
  docs: { icon: FileText, color: "text-orange-500", bgColor: "bg-orange-500/20", label: "Docs" },
  demo: { icon: Video, color: "text-red-500", bgColor: "bg-red-500/20", label: "Demo" },
  decision: { icon: Compass, color: "text-purple-500", bgColor: "bg-purple-500/20", label: "Decision" },
  feedback: { icon: MessageSquare, color: "text-cyan-500", bgColor: "bg-cyan-500/20", label: "Feedback" },
  risk: { icon: AlertTriangle, color: "text-yellow-500", bgColor: "bg-yellow-500/20", label: "Risk" },
  funding: { icon: DollarSign, color: "text-emerald-500", bgColor: "bg-emerald-500/20", label: "Funding" },
};

const impactStyles = {
  high: "border-l-primary",
  medium: "border-l-yellow-500",
  low: "border-l-muted-foreground",
};

interface EventCardProps {
  event: ProofEvent;
  className?: string;
}

export const EventCard = ({ event, className }: EventCardProps) => {
  const config = eventConfig[event.type];
  const Icon = config.icon;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className={cn(
      "bg-card rounded-lg border border-border p-4 hover:shadow-md transition-all",
      event.impact && `border-l-4 ${impactStyles[event.impact]}`,
      className
    )}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", config.bgColor)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("text-xs", config.color)}>
              {config.label}
            </Badge>
            {event.impact === "high" && (
              <Badge variant="default" className="text-xs bg-primary/20 text-primary">
                High Impact
              </Badge>
            )}
          </div>
          <h4 className="font-medium text-foreground mt-1 line-clamp-2">{event.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{formatDate(event.timestamp)}</p>
        </div>
      </div>

      {/* Why it matters */}
      {event.whyItMatters && (
        <p className="text-sm text-muted-foreground mt-3 italic">
          "{event.whyItMatters}"
        </p>
      )}

      {/* Owner & Contributors */}
      <div className="flex items-center gap-3 mt-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={event.owner.avatar} />
            <AvatarFallback className="text-xs">
              {event.owner.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-foreground">{event.owner.name}</span>
        </div>
        
        {event.contributors.length > 0 && (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <div className="flex -space-x-1">
              {event.contributors.slice(0, 3).map((contributor) => (
                <Avatar key={contributor.id} className="h-5 w-5 border-2 border-card">
                  <AvatarImage src={contributor.avatar} />
                  <AvatarFallback className="text-[10px]">
                    {contributor.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
              ))}
              {event.contributors.length > 3 && (
                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground border-2 border-card">
                  +{event.contributors.length - 3}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      {event.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {event.tags.map((tag) => (
            <span 
              key={tag} 
              className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Evidence Links */}
      {event.evidenceLinks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Evidence</p>
          <div className="flex flex-wrap gap-2">
            {event.evidenceLinks.map((link, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => window.open(link.url, "_blank")}
              >
                <ExternalLink className="h-3 w-3" />
                {link.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
