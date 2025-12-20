import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CalendarHeatmap } from "@/components/project-analysis/CalendarHeatmap";
import { 
  CheckCircle2, 
  GitCommit, 
  MessageSquare, 
  FileText, 
  Palette, 
  Users,
  Target,
  ExternalLink,
  Shield,
  Filter
} from "lucide-react";

interface PersonalPoPTimelineProps {
  viewMode: 'public' | 'member' | 'leader';
}

const PersonalPoPTimeline = ({ viewMode }: PersonalPoPTimelineProps) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(viewMode === 'public');

  const filters = [
    { id: 'all', label: 'All', icon: Filter },
    { id: 'code', label: 'Code', icon: GitCommit },
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'docs', label: 'Docs', icon: FileText },
    { id: 'milestones', label: 'Milestones', icon: Target },
    { id: 'meetings', label: 'Meetings', icon: Users },
  ];

  const timelineEvents = [
    {
      id: '1',
      type: 'milestone',
      title: 'Completed MVP Dashboard',
      project: 'SolarSense',
      timestamp: 'Today, 2:30 PM',
      verified: true,
      artifactUrl: '#',
    },
    {
      id: '2',
      type: 'code',
      title: 'Merged PR: Sensor data optimization',
      project: 'SolarSense',
      timestamp: 'Yesterday, 4:15 PM',
      verified: true,
      artifactUrl: 'https://github.com/...',
    },
    {
      id: '3',
      type: 'design',
      title: 'Published wireframe iteration v4',
      project: 'EcoTrack',
      timestamp: '2 days ago',
      verified: true,
      artifactUrl: 'https://figma.com/...',
    },
    {
      id: '4',
      type: 'docs',
      title: 'Updated API documentation',
      project: 'SolarSense',
      timestamp: '3 days ago',
      verified: false,
      artifactUrl: '#',
    },
    {
      id: '5',
      type: 'review',
      title: 'Reviewed authentication module',
      project: 'GreenGrid',
      timestamp: '4 days ago',
      verified: true,
      artifactUrl: '#',
    },
  ];

  const typeIcons: Record<string, typeof CheckCircle2> = {
    milestone: Target,
    code: GitCommit,
    design: Palette,
    docs: FileText,
    review: MessageSquare,
    meeting: Users,
  };

  const typeColors: Record<string, string> = {
    milestone: 'bg-emerald-500',
    code: 'bg-blue-500',
    design: 'bg-pink-500',
    docs: 'bg-amber-500',
    review: 'bg-purple-500',
    meeting: 'bg-cyan-500',
  };

  const filteredEvents = timelineEvents.filter(event => {
    if (verifiedOnly && !event.verified) return false;
    if (activeFilter === 'all') return true;
    if (activeFilter === 'code') return event.type === 'code';
    if (activeFilter === 'design') return event.type === 'design';
    if (activeFilter === 'docs') return event.type === 'docs';
    if (activeFilter === 'milestones') return event.type === 'milestone';
    if (activeFilter === 'meetings') return event.type === 'meeting';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Proof of Process Timeline</h2>
        <div className="flex items-center gap-2">
          <Switch 
            id="verified-only" 
            checked={verifiedOnly} 
            onCheckedChange={setVerifiedOnly}
          />
          <Label htmlFor="verified-only" className="text-sm text-muted-foreground">
            Verified only
          </Label>
        </div>
      </div>

      {/* Heatmap */}
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Activity Consistency</h3>
        <CalendarHeatmap 
          data={[
            { date: new Date('2024-01-15'), count: 3 },
            { date: new Date('2024-01-16'), count: 5 },
            { date: new Date('2024-01-17'), count: 2 },
            { date: new Date('2024-01-18'), count: 8 },
            { date: new Date('2024-01-19'), count: 4 },
          ]}
          startDate={new Date('2024-01-01')}
          endDate={new Date('2024-03-31')}
        />
      </Card>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant={activeFilter === filter.id ? "secondary" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(filter.id)}
            className="gap-1.5"
          >
            <filter.icon className="h-3.5 w-3.5" />
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const Icon = typeIcons[event.type];
            return (
              <div key={event.id} className="relative pl-8">
                {/* Dot */}
                <div className={`absolute left-0 top-1 w-6 h-6 rounded-full ${typeColors[event.type]} flex items-center justify-center`}>
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>

                {/* Content */}
                <Card className="p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{event.title}</span>
                        {event.verified && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
                            <Shield className="h-2.5 w-2.5" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">{event.project}</Badge>
                        <span>{event.timestamp}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <a href={event.artifactUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      <Button variant="outline" className="w-full">
        Load More
      </Button>
    </div>
  );
};

export default PersonalPoPTimeline;
