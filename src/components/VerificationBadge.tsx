import { Badge } from "@/components/ui/badge";
import { Shield, User, Building2, Bot } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerificationBadgeProps {
  type: "auto" | "mentor" | "institution" | "investor";
  verifier?: string;
  date?: string;
  size?: "sm" | "md";
}

const VerificationBadge = ({ 
  type, 
  verifier, 
  date,
  size = "md" 
}: VerificationBadgeProps) => {
  const getConfig = (type: string) => {
    switch (type) {
      case "auto":
        return {
          label: "Auto-verified",
          icon: Bot,
          variant: "outline" as const,
          description: "Automatically verified by system heuristics"
        };
      case "mentor":
        return {
          label: "Mentor Verified",
          icon: User,
          variant: "secondary" as const,
          description: "Verified by project mentor"
        };
      case "institution":
        return {
          label: "Institution Verified",
          icon: Building2,
          variant: "default" as const,
          description: "Verified by institution or organization"
        };
      case "investor":
        return {
          label: "Investor Verified",
          icon: Shield,
          variant: "default" as const,
          description: "Verified by investor"
        };
      default:
        return {
          label: "Verified",
          icon: Shield,
          variant: "outline" as const,
          description: "Verified"
        };
    }
  };

  const config = getConfig(type);
  const Icon = config.icon;

  const sizeClasses = size === "sm" ? "text-xs h-5" : "text-sm h-6";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={config.variant} 
            className={`gap-1.5 cursor-help ${sizeClasses}`}
          >
            <Icon className={iconSize} />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm max-w-xs">
            <div className="font-semibold mb-1">{config.description}</div>
            {verifier && (
              <div className="text-muted-foreground">
                Verified by: {verifier}
              </div>
            )}
            {date && (
              <div className="text-muted-foreground text-xs mt-1">
                {date}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VerificationBadge;
