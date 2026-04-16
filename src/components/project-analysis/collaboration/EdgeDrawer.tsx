import { memo } from "react";
import { X, MessageSquare, CheckCircle2, CalendarPlus, Sparkles, FileText, GitPullRequest, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EdgeInteraction } from "./types";
import { mockAISummaries } from "./mockData";

interface EdgeDrawerProps {
  interaction: EdgeInteraction | null;
  onClose: () => void;
}

const REF_ICONS: Record<string, React.ElementType> = {
  PR: GitPullRequest,
  Task: CheckCircle2,
  Comment: MessagesSquare,
  File: FileText,
};

const EdgeDrawer = memo(({ interaction, onClose }: EdgeDrawerProps) => {
  if (!interaction) return null;

  const { edge, fromMember, toMember } = interaction;
  const aiData = mockAISummaries[edge.id];

  const fallbackSummary = `${fromMember.name} and ${toMember.name} have been collaborating on ${edge.taskIds.length} task(s). Their interaction strength is ${edge.strength}/10, primarily through ${edge.type.replace("_", " ")}.`;

  return (
    <div className="absolute top-0 right-0 bottom-0 w-[360px] z-30 bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary border-2 border-card">
              {fromMember.initials}
            </div>
            <div className="w-8 h-8 rounded-full bg-accent/80 flex items-center justify-center text-[10px] font-bold text-foreground border-2 border-card">
              {toMember.initials}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {fromMember.name} & {toMember.name}
            </p>
            <Badge variant="outline" className="text-[10px] capitalize">
              {edge.type.replace("_", " ")}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* AI Summary */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">AI Summary</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {aiData?.summary || fallbackSummary}
          </p>
        </div>

        {/* References */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Evidence & References
          </p>
          <div className="space-y-2">
            {(aiData?.references || []).map((ref, i) => {
              const Icon = REF_ICONS[ref.type] || FileText;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 bg-muted/40 rounded-lg border border-border/50 hover:bg-muted/70 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{ref.title}</p>
                    <p className="text-[10px] text-muted-foreground">{ref.date}</p>
                  </div>
                  <Badge variant="secondary" className="text-[9px] flex-shrink-0">
                    {ref.type}
                  </Badge>
                </div>
              );
            })}
            {(!aiData?.references || aiData.references.length === 0) && (
              <p className="text-xs text-muted-foreground italic">No specific references available.</p>
            )}
          </div>
        </div>

        {/* Interaction Stats */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Interaction Metrics
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/40 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-foreground">{edge.strength}/10</p>
              <p className="text-[10px] text-muted-foreground">Strength</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-foreground">{edge.taskIds.length}</p>
              <p className="text-[10px] text-muted-foreground">Shared Tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Button className="w-full gap-2" size="sm">
          <MessageSquare className="h-4 w-4" />
          Send Message
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" size="sm">
            <CheckCircle2 className="h-4 w-4" />
            Review Tasks
          </Button>
          <Button variant="outline" className="flex-1 gap-2" size="sm">
            <CalendarPlus className="h-4 w-4" />
            Schedule Meeting
          </Button>
        </div>
      </div>
    </div>
  );
});

EdgeDrawer.displayName = "EdgeDrawer";
export default EdgeDrawer;
