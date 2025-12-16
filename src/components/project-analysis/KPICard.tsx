import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  tooltip?: string;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
}

const variantStyles = {
  default: "bg-card border-border",
  primary: "bg-primary/10 border-primary/20",
  success: "bg-green-500/10 border-green-500/20",
  warning: "bg-yellow-500/10 border-yellow-500/20",
  danger: "bg-destructive/10 border-destructive/20",
};

const iconVariantStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/20 text-primary",
  success: "bg-green-500/20 text-green-500",
  warning: "bg-yellow-500/20 text-yellow-500",
  danger: "bg-destructive/20 text-destructive",
};

export const KPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  tooltip,
  variant = "default",
}: KPICardProps) => {
  const TrendIcon = trend?.direction === "up" 
    ? TrendingUp 
    : trend?.direction === "down" 
    ? TrendingDown 
    : Minus;

  const content = (
    <div className={cn(
      "rounded-xl border p-4 transition-all hover:shadow-md cursor-pointer",
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className={cn("p-2 rounded-lg", iconVariantStyles[variant])}>
          <Icon className="h-4 w-4" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium",
            trend.direction === "up" && "text-green-500",
            trend.direction === "down" && "text-destructive",
            trend.direction === "neutral" && "text-muted-foreground"
          )}>
            <TrendIcon className="h-3 w-3" />
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};
