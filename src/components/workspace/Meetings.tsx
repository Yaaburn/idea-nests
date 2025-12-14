import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Video, 
  Calendar, 
  Clock, 
  Users, 
  Plus,
  Play,
  ExternalLink,
  MoreHorizontal
} from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  type: "scheduled" | "past";
  participants: { name: string; avatar: string }[];
  recordingUrl?: string;
}

const meetings: Meeting[] = [
  {
    id: "1",
    title: "Weekly Team Sync",
    date: "2025-01-15",
    time: "10:00 AM",
    duration: "30 min",
    type: "scheduled",
    participants: [
      { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
      { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
      { name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
    ],
  },
  {
    id: "2",
    title: "Design Review Session",
    date: "2025-01-17",
    time: "2:00 PM",
    duration: "1 hr",
    type: "scheduled",
    participants: [
      { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
      { name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
    ],
  },
  {
    id: "3",
    title: "Sprint Planning",
    date: "2025-01-10",
    time: "11:00 AM",
    duration: "45 min",
    type: "past",
    recordingUrl: "#",
    participants: [
      { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
      { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
      { name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
    ],
  },
  {
    id: "4",
    title: "Investor Demo Prep",
    date: "2025-01-08",
    time: "3:00 PM",
    duration: "1 hr",
    type: "past",
    recordingUrl: "#",
    participants: [
      { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
    ],
  },
  {
    id: "5",
    title: "Technical Architecture Discussion",
    date: "2025-01-05",
    time: "10:00 AM",
    duration: "1.5 hr",
    type: "past",
    recordingUrl: "#",
    participants: [
      { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
      { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
    ],
  },
];

const Meetings = () => {
  const scheduledMeetings = meetings.filter(m => m.type === "scheduled");
  const pastMeetings = meetings.filter(m => m.type === "past");

  return (
    <div className="space-y-8">
      {/* Actions */}
      <div className="flex gap-3">
        <Button className="gradient-primary text-white">
          <Video className="h-4 w-4 mr-2" />
          Start Meeting
        </Button>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      {/* Scheduled Meetings */}
      <div>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Meetings
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {scheduledMeetings.map((meeting) => (
            <Card key={meeting.id} className="p-5 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold group-hover:text-primary transition-colors">
                    {meeting.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {meeting.time}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {meeting.duration}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {meeting.participants.slice(0, 3).map((p, i) => (
                      <Avatar key={i} className="h-7 w-7 border-2 border-background">
                        <AvatarImage src={p.avatar} />
                        <AvatarFallback>{p.name[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {meeting.participants.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{meeting.participants.length - 3} more
                    </span>
                  )}
                </div>
                <Button size="sm" className="gradient-primary text-white">
                  <Video className="h-4 w-4 mr-1" />
                  Join
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Past Meetings */}
      <div>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          Past Meetings
        </h3>
        <Card>
          <div className="divide-y">
            {pastMeetings.map((meeting) => (
              <div key={meeting.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Video className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {meeting.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span>•</span>
                    <span>{meeting.time}</span>
                    <span>•</span>
                    <span>{meeting.duration}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1">
                    {meeting.participants.slice(0, 2).map((p, i) => (
                      <Avatar key={i} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={p.avatar} />
                        <AvatarFallback>{p.name[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {meeting.recordingUrl && (
                    <Button variant="outline" size="sm" className="gap-1">
                      <Play className="h-3 w-3" />
                      Recording
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Meetings;
