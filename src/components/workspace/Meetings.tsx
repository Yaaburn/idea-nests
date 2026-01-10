import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Video, 
  Calendar, 
  Clock, 
  Plus,
  Play,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  MapPin,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const mockAttendees = [
  { id: "1", name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
  { id: "2", name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
  { id: "3", name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
  { id: "4", name: "James Wilson", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" },
];

const Meetings = () => {
  const [meetingsList, setMeetingsList] = useState(meetings);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:00",
    attendees: [] as string[],
    location: "",
    description: "",
  });

  const scheduledMeetings = meetingsList.filter(m => m.type === "scheduled");
  const pastMeetings = meetingsList.filter(m => m.type === "past");

  const toggleAttendee = (id: string) => {
    setScheduleData(prev => ({
      ...prev,
      attendees: prev.attendees.includes(id)
        ? prev.attendees.filter(a => a !== id)
        : [...prev.attendees, id]
    }));
  };

  const handleScheduleMeeting = () => {
    if (!scheduleData.title.trim()) return;

    const newMeeting: Meeting = {
      id: `meeting-${Date.now()}`,
      title: scheduleData.title,
      date: scheduleData.date,
      time: scheduleData.startTime,
      duration: "1 hr",
      type: "scheduled",
      participants: scheduleData.attendees.map(id => {
        const attendee = mockAttendees.find(a => a.id === id);
        return attendee ? { name: attendee.name, avatar: attendee.avatar } : { name: "Unknown", avatar: "" };
      }),
    };

    setMeetingsList(prev => [...prev, newMeeting]);
    closeModal();
  };

  const closeModal = () => {
    setShowScheduleModal(false);
    setShowDetails(false);
    setScheduleData({
      title: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "10:00",
      attendees: [],
      location: "",
      description: "",
    });
  };

  return (
    <div className="space-y-8">
      {/* Actions */}
      <div className="flex gap-3">
        <Button className="gradient-primary text-white">
          <Video className="h-4 w-4 mr-2" />
          Start Meeting
        </Button>
        <Button variant="outline" onClick={() => setShowScheduleModal(true)}>
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

      {/* Schedule Meeting Modal - iOS-style blur fullscreen */}
      {showScheduleModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={closeModal}
          onKeyDown={(e) => e.key === "Escape" && closeModal()}
        >
          {/* Backdrop with iOS-style blur - covers entire viewport */}
          <div className="fixed inset-0 bg-background/40 backdrop-blur-2xl" />
          
          {/* Modal Card - centered, no X button */}
          <div
            className="relative bg-popover border rounded-xl shadow-2xl p-6 w-[400px] max-w-[90vw] animate-fade-in z-[101]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - NO X button per spec */}
            <h3 className="font-semibold text-xl mb-4">Schedule Meeting</h3>

            {/* Title */}
            <Input
              placeholder="New meeting..."
              value={scheduleData.title}
              onChange={(e) => setScheduleData(prev => ({ ...prev, title: e.target.value }))}
              className="mb-4"
              autoFocus
            />

            {/* Date & Time */}
            <div className="flex gap-2 mb-4">
              <Input
                type="date"
                value={scheduleData.date}
                onChange={(e) => setScheduleData(prev => ({ ...prev, date: e.target.value }))}
                className="flex-1"
              />
              <Input
                type="time"
                value={scheduleData.startTime}
                onChange={(e) => setScheduleData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-24"
              />
              <span className="flex items-center text-muted-foreground">–</span>
              <Input
                type="time"
                value={scheduleData.endTime}
                onChange={(e) => setScheduleData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-24"
              />
            </div>

            {/* Attendees */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Attendees</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {mockAttendees.map((attendee) => (
                  <button
                    key={attendee.id}
                    onClick={() => toggleAttendee(attendee.id)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1 rounded-full border transition-all",
                      scheduleData.attendees.includes(attendee.id)
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={attendee.avatar} />
                      <AvatarFallback>{attendee.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{attendee.name.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hide/Show Details Toggle */}
            <button
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showDetails ? "Hide details" : "Show details"}
            </button>

            {/* Collapsible Details */}
            {showDetails && (
              <div className="space-y-3 mb-4 animate-fade-in">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Add location or meeting link..."
                    value={scheduleData.location}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, location: e.target.value }))}
                    className="flex-1"
                  />
                </div>
                <textarea
                  placeholder="Add description..."
                  value={scheduleData.description}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-md border bg-transparent resize-none min-h-[60px]"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                className="gradient-primary text-white"
                onClick={handleScheduleMeeting}
                disabled={!scheduleData.title.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;
