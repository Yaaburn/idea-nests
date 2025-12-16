import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HealthComponent {
  name: string;
  score: number;
  description: string;
  weight: number;
}

interface HealthGaugeProps {
  score: number;
  components: HealthComponent[];
  drivers: {
    label: string;
    direction: "up" | "down";
    impact: number;
  }[];
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-destructive";
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Attention";
};

const getProgressColor = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-destructive";
};

export const HealthGauge = ({ score, components, drivers }: HealthGaugeProps) => {
  const [showMethodology, setShowMethodology] = useState(false);

  // Calculate the stroke offset for the circular gauge
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Project Health Score</h3>
          <p className="text-sm text-muted-foreground">Based on SPACE Framework</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Info className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>Composite score from Satisfaction, Performance, Activity, Collaboration, and Efficiency metrics.</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-8">
        {/* Circular Gauge */}
        <div className="relative">
          <svg width="160" height="160" className="transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-muted/20"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={getScoreColor(score)}
              style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-4xl font-bold", getScoreColor(score))}>
              {score}
            </span>
            <span className="text-sm text-muted-foreground">{getScoreLabel(score)}</span>
          </div>
        </div>

        {/* Score Drivers */}
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground mb-3">What moved this score?</p>
          <div className="space-y-2">
            {drivers.map((driver, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className={cn(
                  "flex items-center justify-center w-5 h-5 rounded-full text-xs",
                  driver.direction === "up" 
                    ? "bg-green-500/20 text-green-500" 
                    : "bg-destructive/20 text-destructive"
                )}>
                  {driver.direction === "up" ? "↑" : "↓"}
                </span>
                <span className="text-muted-foreground">{driver.label}</span>
                <span className={cn(
                  "ml-auto font-medium",
                  driver.direction === "up" ? "text-green-500" : "text-destructive"
                )}>
                  {driver.direction === "up" ? "+" : "-"}{driver.impact}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Methodology Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowMethodology(!showMethodology)}
        className="mt-4 w-full justify-between text-muted-foreground"
      >
        <span>Show methodology</span>
        {showMethodology ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {showMethodology && (
        <div className="mt-4 space-y-3 animate-fade-in">
          {components.map((component) => (
            <div key={component.name}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">
                  {component.name} ({component.weight}%)
                </span>
                <span className="font-medium">{component.score}/100</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", getProgressColor(component.score))}
                  style={{ width: `${component.score}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1">{component.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
