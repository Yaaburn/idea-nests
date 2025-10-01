import { CheckCircle2, Circle, Upload, Shield, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const ProjectTimeline = () => {
  const milestones = [
    {
      id: 1,
      title: "Initial Concept",
      date: "Jan 2024",
      status: "completed",
      verified: "auto",
      artifacts: [
        { type: "document", name: "Market Research.pdf" },
        { type: "image", name: "Initial Sketches" },
      ],
      contributors: [
        { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
      ],
      hash: "0x7f3a2...",
    },
    {
      id: 2,
      title: "Prototype v1",
      date: "Mar 2024",
      status: "completed",
      verified: "mentor",
      verifier: "Dr. James Liu, Stanford IoT Lab",
      artifacts: [
        { type: "hardware", name: "Sensor PCB Design" },
        { type: "code", name: "Firmware v0.1" },
        { type: "video", name: "Demo Video" },
      ],
      contributors: [
        { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
        { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
      ],
      hash: "0x9b2c4...",
    },
    {
      id: 3,
      title: "Field Testing Alpha",
      date: "Jun 2024",
      status: "completed",
      verified: "institution",
      verifier: "UC Davis Agricultural Extension",
      artifacts: [
        { type: "data", name: "15 Farm Pilot Results" },
        { type: "report", name: "Performance Analysis" },
      ],
      contributors: [
        { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
        { name: "Maria Garcia", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
        { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
      ],
      hash: "0x4e8f1...",
    },
    {
      id: 4,
      title: "Mobile App Beta",
      date: "Sep 2024",
      status: "in-progress",
      verified: null,
      artifacts: [
        { type: "app", name: "iOS & Android Apps" },
        { type: "code", name: "React Native Codebase" },
      ],
      contributors: [
        { name: "Nina Patel", avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150" },
        { name: "Tom Wilson", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" },
      ],
    },
    {
      id: 5,
      title: "Production Ready",
      date: "Dec 2024",
      status: "upcoming",
      verified: null,
      artifacts: [],
      contributors: [],
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-6 w-6 text-secondary" />;
      case "in-progress":
        return <Circle className="h-6 w-6 text-accent fill-accent" />;
      default:
        return <Circle className="h-6 w-6 text-muted" />;
    }
  };

  const getVerificationBadge = (verified: string | null, verifier?: string) => {
    if (!verified) return null;

    const badges = {
      auto: { icon: Circle, label: "Auto-verified", color: "bg-muted" },
      mentor: { icon: Shield, label: "Mentor Verified", color: "bg-secondary/10 text-secondary border-secondary" },
      institution: { icon: Shield, label: "Institution Verified", color: "bg-accent/10 text-accent border-accent" },
    };

    const badge = badges[verified as keyof typeof badges];
    if (!badge) return null;

    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={badge.color}>
          <badge.icon className="h-3 w-3 mr-1" />
          {badge.label}
        </Badge>
        {verifier && <span className="text-xs text-muted-foreground">by {verifier}</span>}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {milestones.map((milestone, index) => (
        <div key={milestone.id} className="relative flex gap-6 group">
          {/* Timeline line */}
          {index < milestones.length - 1 && (
            <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border group-hover:bg-secondary/30 transition-colors" />
          )}

          {/* Status icon */}
          <div className="relative flex-shrink-0">
            <div className="relative z-10 bg-background">
              {getStatusIcon(milestone.status)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 pb-8">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-lg font-semibold">{milestone.title}</h4>
                <p className="text-sm text-muted-foreground">{milestone.date}</p>
              </div>
              {milestone.status === "completed" && getVerificationBadge(milestone.verified, milestone.verifier)}
            </div>

            {milestone.artifacts.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Artifacts ({milestone.artifacts.length})
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {milestone.artifacts.map((artifact, i) => (
                    <button
                      key={i}
                      className="flex items-center gap-2 p-3 bg-muted/50 hover:bg-muted rounded-lg text-left text-sm transition-colors group/artifact"
                    >
                      <div className="w-10 h-10 rounded bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <Eye className="h-4 w-4 text-secondary" />
                      </div>
                      <span className="truncate group-hover/artifact:text-secondary transition-colors">
                        {artifact.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {milestone.contributors.length > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Contributors:</span>
                <div className="flex -space-x-2">
                  {milestone.contributors.map((contributor, i) => (
                    <Avatar key={i} className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={contributor.avatar} />
                      <AvatarFallback>{contributor.name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            )}

            {milestone.hash && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Hash:</span>
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{milestone.hash}</code>
                <Button variant="ghost" size="sm" className="h-6 text-xs">
                  View Proof
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectTimeline;
