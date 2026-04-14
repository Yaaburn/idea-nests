import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Link2,
  Video,
  X,
  UserPlus,
  AlertTriangle,
  Sparkles,
  Bell,
  Mail,
  CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuickEventData, Attendee, CalendarEvent } from "./PlannerTypes";
import { mockAttendees, EVENT_COLORS } from "./PlannerTypes";
import PlannerAddGuestModal from "./PlannerAddGuestModal";
import PlannerEmailModal from "./PlannerEmailModal";
import { toast } from "sonner";

interface Props {
  data: QuickEventData;
  onChange: (data: QuickEventData) => void;
  onSave: () => void;
  onSaveDraft: () => void;
  onClose: () => void;
  existingEvents: CalendarEvent[];
}

const PlannerCreateEventForm = ({ data, onChange, onSave, onSaveDraft, onClose, existingEvents }: Props) => {
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [externalGuests, setExternalGuests] = useState<Attendee[]>([]);

  // Check conflicts
  const selectedAttendees = mockAttendees.filter(a => data.attendees.includes(a.id));
  const allAttendees = [...selectedAttendees, ...externalGuests];

  const conflicts = selectedAttendees.filter(a => {
    return existingEvents.some(evt => {
      if (evt.date !== data.date) return false;
      const hasAttendee = evt.attendees?.some(ea => ea.name === a.name);
      if (!hasAttendee) return false;
      // Time overlap check
      const eStart = parseInt(evt.startTime.replace(":", ""));
      const eEnd = parseInt(evt.endTime.replace(":", ""));
      const dStart = parseInt(data.startTime.replace(":", ""));
      const dEnd = parseInt(data.endTime.replace(":", ""));
      return dStart < eEnd && dEnd > eStart;
    });
  });

  const hasConflict = conflicts.length > 0 && data.date && data.startTime;

  // Suggestions
  const suggestions = [
    { id: "1", label: "Best Time Choice", time: "Tomorrow, 10:30 AM", match: 98, desc: "All participants are free. Focus time protected." },
    { id: "2", label: "Alternative", time: "Friday, 3:00 PM", match: 85, desc: "Available for everyone." },
  ];

  const applySuggestion = (s: typeof suggestions[0]) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    onChange({
      ...data,
      date: tomorrow.toISOString().split("T")[0],
      startTime: "10:30",
      endTime: "11:30",
    });
    toast.success(`Applied: ${s.time}`);
  };

  const toggleAttendee = (id: string) => {
    onChange({
      ...data,
      attendees: data.attendees.includes(id)
        ? data.attendees.filter(a => a !== id)
        : [...data.attendees, id]
    });
  };

  const removeExternalGuest = (email: string) => {
    setExternalGuests(prev => prev.filter(g => g.email !== email));
  };

  const generateMeetLink = () => {
    onChange({ ...data, conferenceLink: "https://meet.google.com/abc-defg-hij" });
    toast.success("Google Meet link generated");
  };

  const renderParticipantsSection = (compact = false) => {
    const allTeammates = mockAttendees;
    
    return (
      <div className={compact ? "mb-2" : "mb-3"}>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Attendees</label>
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {selectedAttendees.map(tm => (
            <div key={tm.id} className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-muted/60 border border-border/50 text-xs">
              <Avatar className="h-5 w-5"><AvatarImage src={tm.avatar} /><AvatarFallback className="text-[8px]">{tm.name[0]}</AvatarFallback></Avatar>
              <span className="font-medium">{tm.name.split(" ")[0]}</span>
              <button onClick={() => toggleAttendee(tm.id)} className="p-0.5 rounded-full hover:bg-muted"><X className="h-2.5 w-2.5 text-muted-foreground" /></button>
            </div>
          ))}
          {externalGuests.map(g => (
            <div key={g.id} className="flex items-center gap-1.5 pl-2 pr-2 py-0.5 rounded-full bg-accent/40 border border-accent/60 text-xs">
              <Mail className="h-3 w-3 text-muted-foreground" /><span className="font-medium">{g.name}</span>
              <button onClick={() => setExternalGuests(p => p.filter(x => x.id !== g.id))} className="p-0.5 rounded-full hover:bg-muted"><X className="h-2.5 w-2.5" /></button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowGuestPicker(!showGuestPicker)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-primary/30 text-[11px] font-medium text-primary hover:bg-primary/5">
              <Plus className="h-3 w-3" /> Team
            </button>
            {showGuestPicker && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-popover border rounded-lg shadow-lg z-50 py-1">
                {allTeammates.filter(t => !selectedAttendees.find(s => s.id === t.id)).map(tm => (
                  <button key={tm.id} onClick={() => { toggleAttendee(tm.id); setShowGuestPicker(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-muted/50">
                    <Avatar className="h-5 w-5"><AvatarImage src={tm.avatar} /><AvatarFallback className="text-[8px]">{tm.name[0]}</AvatarFallback></Avatar>
                    <span className="font-medium text-xs">{tm.name}</span>
                  </button>
                ))}
                {allTeammates.filter(t => !selectedAttendees.find(s => s.id === t.id)).length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">All added</div>
                )}
              </div>
            )}
          </div>
          <button onClick={() => setShowAddGuest(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-muted-foreground/30 text-[11px] font-medium text-muted-foreground hover:text-foreground">
            <UserPlus className="h-3 w-3" /> Guest
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <Card className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Left Column - Form */}
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Create New Event</h2>
                <p className="text-xs uppercase text-muted-foreground tracking-wider">Project Alpha / Workspace</p>
              </div>
            </div>

            {/* Event Title */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Event Title</label>
              <Input
                placeholder="e.g. Q4 Strategy Sync"
                value={data.title}
                onChange={e => onChange({ ...data, title: e.target.value })}
                autoFocus
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                  <CalendarIcon className="h-3.5 w-3.5" /> Date
                </label>
                <Input
                  type="date"
                  value={data.date}
                  onChange={e => onChange({ ...data, date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Time
                  {hasConflict && <AlertTriangle className="h-3 w-3 text-destructive" />}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="time"
                    value={data.startTime}
                    onChange={e => onChange({ ...data, startTime: e.target.value })}
                    className={cn(hasConflict && "border-destructive")}
                  />
                  <Input
                    type="time"
                    value={data.endTime}
                    onChange={e => onChange({ ...data, endTime: e.target.value })}
                    className={cn(hasConflict && "border-destructive")}
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Location
              </label>
              <Input
                placeholder="Add location"
                value={data.location}
                onChange={e => onChange({ ...data, location: e.target.value })}
              />
            </div>

            {/* Conference Link */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <Link2 className="h-3.5 w-3.5" /> Conference Link
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add meeting link"
                  value={data.conferenceLink}
                  onChange={e => onChange({ ...data, conferenceLink: e.target.value })}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={generateMeetLink} className="gap-1.5 flex-shrink-0">
                  <Video className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs">Google Meet</span>
                </Button>
              </div>
            </div>

            {/* Teammates */}
            {renderParticipantsSection(false)}

            {/* Color */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Event Color</label>
              <div className="flex gap-2">
                {EVENT_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => onChange({ ...data, color: c.value })}
                    className={cn(
                      "w-6 h-6 rounded-full transition-all",
                      data.color === c.value && "ring-2 ring-offset-2 ring-primary"
                    )}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Bell className="h-3.5 w-3.5" /> Notifications
              </label>
              <div className="flex gap-2">
                <Button
                  variant={data.notifyInApp ? "default" : "outline"}
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => onChange({ ...data, notifyInApp: !data.notifyInApp })}
                >
                  <Bell className="h-3 w-3" /> In-App
                </Button>
                <Button
                  variant={data.notifyEmail ? "default" : "outline"}
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => {
                    if (!data.notifyEmail) {
                      onChange({ ...data, notifyEmail: true });
                      if (allAttendees.length > 0) setShowEmailModal(true);
                    } else {
                      onChange({ ...data, notifyEmail: false });
                    }
                  }}
                >
                  <Mail className="h-3 w-3" /> Email
                </Button>
                <Button
                  variant={data.syncGoogleCalendar ? "default" : "outline"}
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => onChange({ ...data, syncGoogleCalendar: !data.syncGoogleCalendar })}
                >
                  <CalendarCheck className="h-3 w-3" /> Google Calendar
                </Button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
              <textarea
                placeholder="Add event description..."
                value={data.description}
                onChange={e => onChange({ ...data, description: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-md border bg-transparent resize-none min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* CTA */}
            <div className="flex gap-3 pt-2">
              <Button onClick={onSave} disabled={!data.title.trim()} className="flex-1">
                Create Event
              </Button>
              <Button variant="outline" onClick={onSaveDraft} className="flex-shrink-0">
                Save as Draft
              </Button>
            </div>
          </div>

          {/* Right Column - Availability & Suggestions */}
          <div className="p-6 space-y-5 bg-muted/10">
            {/* Check Availability */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-foreground">Check Availability</h3>
                <Badge className="bg-primary/20 text-primary text-[10px] px-1.5 py-0">LIVE</Badge>
              </div>

              {/* Conflict Warning */}
              {hasConflict && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Scheduling Conflict</p>
                      <p className="text-xs text-destructive/80">
                        {conflicts.map(c => c.name).join(", ")} busy at {data.startTime}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline bars */}
              {selectedAttendees.length > 0 && (
                <div className="space-y-2">
                  {selectedAttendees.map(a => {
                    const isConflict = conflicts.some(c => c.id === a.id);
                    return (
                      <div key={a.id} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-16 truncate font-medium">
                          {a.name.split(" ").map(n => n[0]).join("")} - {a.name}
                        </span>
                        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              isConflict ? "bg-destructive/60" : "bg-primary/40"
                            )}
                            style={{ width: isConflict ? "40%" : "30%", marginLeft: isConflict ? "25%" : "35%" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedAttendees.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Add teammates to check availability</p>
              )}
            </div>

            {/* Luminous Suggestions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Luminous Suggestions</h3>
              </div>
              <div className="space-y-2">
                {suggestions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => applySuggestion(s)}
                    className="w-full text-left bg-card border rounded-lg p-3 hover:border-primary/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-sm font-medium",
                        s.match >= 90 ? "text-primary" : "text-muted-foreground"
                      )}>
                        {s.label}
                      </span>
                      <Badge className={cn(
                        "text-[10px]",
                        s.match >= 90 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {s.match}% Match
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground">{s.time}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                  </button>
                ))}

                {/* Scheduling Tip - partially hidden */}
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 opacity-60">
                  <p className="text-xs font-medium text-primary">Scheduling Tip</p>
                  <p className="text-xs text-muted-foreground mt-1">Try scheduling important meetings before 11 AM for better focus...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* AI Assistant Bar */}
      {hasConflict && (
        <div className="mt-3 mx-auto max-w-xl">
          <div className="bg-sidebar text-sidebar-foreground rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-lg">
            <div className="w-6 h-6 rounded bg-primary/30 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-sm flex-1">
              <span className="text-muted-foreground">Assistant:</span>{" "}
              Conflict found. Try 11 AM?
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="text-primary text-xs font-bold h-7 px-3"
              onClick={() => {
                onChange({ ...data, startTime: "11:00", endTime: "12:00" });
                toast.success("Time updated to 11:00 AM");
              }}
            >
              APPLY
            </Button>
          </div>
        </div>
      )}

      <PlannerAddGuestModal
        open={showAddGuest}
        onClose={() => setShowAddGuest(false)}
        onAdd={(guest) => {
          setExternalGuests(prev => [...prev, {
            id: `ext-${Date.now()}`,
            name: guest.name,
            avatar: "",
            email: guest.email,
            isExternal: true,
          }]);
        }}
      />

      <PlannerEmailModal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        attendees={allAttendees}
        eventTitle={data.title || "Untitled Event"}
      />
    </div>
  );
};

export default PlannerCreateEventForm;
