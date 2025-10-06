import { Badge } from "@/components/ui/badge";
import { Award, Shield, CheckCircle2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProofScoreProps {
  score: number;
  verifications?: number;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
}

const ProofScore = ({ 
  score, 
  verifications = 0, 
  size = "md",
  showDetails = false 
}: ProofScoreProps) => {
  const getScoreLevel = (score: number) => {
    if (score >= 80) return { label: "Verified", color: "text-secondary", icon: Shield };
    if (score >= 60) return { label: "Strong", color: "text-accent", icon: CheckCircle2 };
    if (score >= 40) return { label: "Building", color: "text-primary", icon: Award };
    return { label: "Starting", color: "text-muted-foreground", icon: Award };
  };

  const level = getScoreLevel(score);
  const Icon = level.icon;

  const sizeClasses = {
    sm: {
      badge: "text-xs px-2 py-0.5",
      icon: "h-3 w-3",
      text: "text-xs"
    },
    md: {
      badge: "text-sm px-3 py-1",
      icon: "h-4 w-4",
      text: "text-sm"
    },
    lg: {
      badge: "text-base px-4 py-1.5",
      icon: "h-5 w-5",
      text: "text-base"
    }
  };

  const classes = sizeClasses[size];

  if (showDetails) {
    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
          score >= 80 ? 'bg-secondary/10 border-secondary/30' :
          score >= 60 ? 'bg-accent/10 border-accent/30' :
          'bg-muted border-border'
        }`}>
          <Icon className={`${classes.icon} ${level.color}`} />
          <span className={`font-semibold ${classes.text}`}>{score}</span>
          <span className={`${classes.text} text-muted-foreground`}>Proof Score</span>
        </div>
        {verifications > 0 && (
          <Badge variant="outline" className={classes.badge}>
            <CheckCircle2 className={`${classes.icon} mr-1`} />
            {verifications} verified
          </Badge>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className={`gap-1.5 cursor-help ${classes.badge}`}
          >
            <Icon className={`${classes.icon} ${level.color}`} />
            <span className="font-semibold">{score}</span>
            <span className="font-normal">{level.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div className="font-semibold mb-1">Proof Score: {score}/100</div>
            <div className="text-muted-foreground">
              Based on {verifications} verifications and activity data
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ProofScore;
