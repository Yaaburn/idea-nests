import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle2, 
  GitCommit, 
  MessageSquare, 
  FileText, 
  Palette, 
  Users,
  ExternalLink,
  Shield,
  Quote
} from "lucide-react";

interface ContributionsDrawerProps {
  open: boolean;
  onClose: () => void;
  projectTitle: string;
}

const ContributionsDrawer = ({ open, onClose, projectTitle }: ContributionsDrawerProps) => {
  // Mock data
  const summary = {
    tasks: 24,
    commits: 47,
    reviews: 12,
    docs: 8,
    designIterations: 15,
    meetings: 6,
  };

  const evidenceFeed = [
    {
      id: '1',
      type: 'task',
      title: 'Implemented user authentication flow',
      timestamp: '2 hours ago',
      artifact: 'https://github.com/project/pr/123',
      verified: true,
      reviewer: 'James Liu',
    },
    {
      id: '2',
      type: 'commit',
      title: 'Fixed sensor data sync issue',
      timestamp: '5 hours ago',
      artifact: 'https://github.com/project/commit/abc',
      verified: true,
      reviewer: null,
    },
    {
      id: '3',
      type: 'design',
      title: 'Updated dashboard wireframes v3',
      timestamp: '1 day ago',
      artifact: 'https://figma.com/file/xyz',
      verified: true,
      reviewer: 'Sarah Chen',
    },
    {
      id: '4',
      type: 'review',
      title: 'Reviewed API integration PR',
      timestamp: '2 days ago',
      artifact: 'https://github.com/project/pr/120',
      verified: true,
      reviewer: null,
    },
    {
      id: '5',
      type: 'docs',
      title: 'Wrote technical spec for IoT module',
      timestamp: '3 days ago',
      artifact: 'https://docs.google.com/doc/xyz',
      verified: true,
      reviewer: 'Dr. James Liu',
    },
  ];

  const impactStatement = {
    text: "Led the frontend implementation and significantly improved the dashboard performance by 40%. Key contributor to the MVP launch.",
    approvedBy: "Dr. James Liu",
    role: "Project Lead"
  };

  const typeIcons: Record<string, typeof CheckCircle2> = {
    task: CheckCircle2,
    commit: GitCommit,
    review: MessageSquare,
    docs: FileText,
    design: Palette,
    meeting: Users,
  };

  const typeColors: Record<string, string> = {
    task: 'text-emerald-500',
    commit: 'text-blue-500',
    review: 'text-purple-500',
    docs: 'text-amber-500',
    design: 'text-pink-500',
    meeting: 'text-cyan-500',
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-lg">My Contributions</SheetTitle>
          <p className="text-sm text-muted-foreground">{projectTitle}</p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] pr-4">
          {/* Summary Counters */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Tasks', value: summary.tasks, icon: CheckCircle2 },
              { label: 'Commits', value: summary.commits, icon: GitCommit },
              { label: 'Reviews', value: summary.reviews, icon: MessageSquare },
              { label: 'Docs', value: summary.docs, icon: FileText },
              { label: 'Designs', value: summary.designIterations, icon: Palette },
              { label: 'Meetings', value: summary.meetings, icon: Users },
            ].map((item) => (
              <Card key={item.label} className="p-3 text-center">
                <item.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <div className="text-lg font-bold">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </Card>
            ))}
          </div>

          {/* Impact Statement */}
          <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <Quote className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm mb-2">{impactStatement.text}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Shield className="h-3 w-3" />
                    Approved
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    by {impactStatement.approvedBy} ({impactStatement.role})
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Evidence Feed */}
          <div className="space-y-1">
            <h3 className="text-sm font-medium mb-3">Evidence Feed</h3>
            {evidenceFeed.map((evidence) => {
              const Icon = typeIcons[evidence.type];
              return (
                <Card key={evidence.id} className="p-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${typeColors[evidence.type]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate">{evidence.title}</span>
                        {evidence.verified && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
                            <Shield className="h-2.5 w-2.5" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{evidence.timestamp}</span>
                        {evidence.reviewer && (
                          <>
                            <span>•</span>
                            <span>Reviewed by {evidence.reviewer}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" asChild>
                      <a href={evidence.artifact} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          <Button variant="outline" className="w-full mt-4">
            Load More
          </Button>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default ContributionsDrawer;
