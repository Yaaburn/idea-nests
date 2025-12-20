import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, Info, CheckCircle2, Lightbulb } from "lucide-react";

const SkillsBreakdown = () => {
  const skills = [
    {
      name: 'Product Collaboration',
      level: 78,
      artifacts: 45,
      details: '12 planning sessions, 8 reviews, 6 handoffs',
      trend: '+8%',
      category: 'strength',
    },
    {
      name: 'Frontend Development',
      level: 85,
      artifacts: 67,
      details: '47 commits, 12 PRs merged, 8 reviews',
      trend: '+12%',
      category: 'strength',
    },
    {
      name: 'Technical Documentation',
      level: 72,
      artifacts: 23,
      details: '15 specs, 5 research notes, 3 guides',
      trend: '+5%',
      category: 'strength',
    },
    {
      name: 'Design Collaboration',
      level: 65,
      artifacts: 18,
      details: '10 iterations reviewed, 8 handoffs',
      trend: '+15%',
      category: 'developing',
    },
    {
      name: 'Research & Analysis',
      level: 58,
      artifacts: 12,
      details: '8 experiments, 4 insights documented',
      trend: '+3%',
      category: 'developing',
    },
  ];

  const topStrengths = skills.filter(s => s.category === 'strength');
  const developingAreas = skills.filter(s => s.category === 'developing');

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Skills & Capabilities</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Skills are calculated from verified artifacts. Levels increase based on quantity and quality of evidence.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Top Strengths */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-medium">Top Strengths</h3>
        </div>
        <div className="space-y-3">
          {topStrengths.map((skill) => (
            <Card key={skill.name} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{skill.name}</span>
                  <Badge variant="secondary" className="text-xs gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {skill.trend}
                  </Badge>
                </div>
                <span className="text-sm font-bold text-primary">{skill.level}%</span>
              </div>
              <Progress value={skill.level} className="h-2 mb-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{skill.details}</span>
                <span>{skill.artifacts} artifacts</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Developing Areas */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-medium">Developing Areas</h3>
        </div>
        <div className="space-y-3">
          {developingAreas.map((skill) => (
            <Card key={skill.name} className="p-4 border-dashed">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{skill.name}</span>
                  <Badge variant="outline" className="text-xs gap-1 text-emerald-600">
                    <TrendingUp className="h-3 w-3" />
                    {skill.trend}
                  </Badge>
                </div>
                <span className="text-sm font-bold">{skill.level}%</span>
              </div>
              <Progress value={skill.level} className="h-2 mb-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{skill.details}</span>
                <span>{skill.artifacts} artifacts</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillsBreakdown;
