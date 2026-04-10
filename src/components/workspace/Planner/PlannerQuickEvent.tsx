import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  X,
  Plus,
  UserPlus,
  Mail,
  ChevronDown,
  ChevronUp,
  MapPin,
  Users,
  Trash2,
  Maximize2,
  Palette,
  Video,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuickEventData, CalendarEvent, Attendee } from "./PlannerTypes";
import { mockAttendees, EVENT_COLORS } from "./PlannerTypes";
import PlannerAddGuestModal from "./PlannerAddGuestModal";
import { toast } from "sonner";

interface Props {
  mode: "create" | "edit";
  data: QuickEventData;
  onChange: (data: QuickEventData) => void;
  onSave: () => void;
  onDelete?: () => void;
  onClose: () => void;
  onExpand: () => void;
  position: { x: number; y: number };
  selectedEvent?: CalendarEvent | null;
}

const PlannerQuickEvent = ({ mode, data, onChange, onSave, onDelete, onClose, onExpand, position, selectedEvent }: Props) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [externalGuests, setExternalGuests] = useState<Attendee[]>([]);
  
  // Dragging state
  const [currentPos, setCurrentPos] = useState({ x: position.x, y: position.y });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setCurrentPos({ x: position.x, y: position.y });
  }, [position.x, position.y]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - currentPos.x,
      y: e.clientY - currentPos.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setCurrentPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const toggleAttendee = (id: string) => {
    onChange({
      ...data,
      attendees: data.attendees.includes(id)
        ? data.attendees.filter(a => a !== id)
        : [...data.attendees, id]
    });
  };

  const renderParticipantsSection = (compact = false) => {
    const selectedTeammates = mockAttendees.filter(a => data.attendees.includes(a.id));
    const allTeammates = mockAttendees;
    
    return (
      <div className={compact ? "mb-2" : "mb-3"}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Attendees</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {selectedTeammates.map(tm => (
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
                {allTeammates.filter(t => !selectedTeammates.find(s => s.id === t.id)).map(tm => (
                  <button key={tm.id} onClick={() => { toggleAttendee(tm.id); setShowGuestPicker(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-muted/50">
                    <Avatar className="h-5 w-5"><AvatarImage src={tm.avatar} /><AvatarFallback className="text-[8px]">{tm.name[0]}</AvatarFallback></Avatar>
                    <span className="font-medium text-xs">{tm.name}</span>
                  </button>
                ))}
                {allTeammates.filter(t => !selectedTeammates.find(s => s.id === t.id)).length === 0 && (
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

  const generateMeetLink = () => {
    onChange({ ...data, conferenceLink: "https://meet.google.com/abc-defg-hij" });
    toast.success("Google Meet link generated");
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto" onPointerDown={(e) => {
      // Allow clicking outside to close
      if (e.target === e.currentTarget) onClose();
    }}>
      <div
        className="absolute bg-popover border rounded-xl shadow-2xl w-[480px] max-w-[calc(100vw-32px)] animate-fade-in overflow-hidden"
        style={{ left: currentPos.x, top: currentPos.y }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-3 border-b bg-muted/30 cursor-grab active:cursor-grabbing select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <h3 className="font-semibold text-sm pointer-events-none">
            {mode === "edit" ? "Edit Event" : "Quick Event"}
          </h3>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 pointer-events-auto" onPointerDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onExpand(); }} title="Expand to full form">
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 pointer-events-auto" onPointerDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onClose(); }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Title */}
          <Input
            placeholder="Event title..."
            value={data.title}
            onChange={e => onChange({ ...data, title: e.target.value })}
            autoFocus
            className="h-10 text-base font-medium"
          />

          {/* Date */}
          <Input
            type="date"
            value={data.date}
            onChange={e => onChange({ ...data, date: e.target.value })}
            className="h-9 text-sm"
          />

          {/* Time */}
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="time"
              value={data.startTime}
              onChange={e => onChange({ ...data, startTime: e.target.value })}
              className="h-9 text-sm"
            />
            <Input
              type="time"
              value={data.endTime}
              onChange={e => onChange({ ...data, endTime: e.target.value })}
              className="h-9 text-sm"
            />
          </div>

          {/* Attendees */}
          {renderParticipantsSection(true)}

          {/* Color picker */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Palette className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Event Color</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {EVENT_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => onChange({ ...data, color: c.value })}
                  className={cn(
                    "w-6 h-6 rounded-full transition-transform hover:scale-110",
                    data.color === c.value
                      ? "ring-2 ring-offset-1 ring-primary"
                      : "ring-1 ring-black/10 dark:ring-white/10"
                  )}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Toggle details */}
          <button
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showDetails ? "Hide details" : "Show details"}
          </button>

          {showDetails && (
            <div className="space-y-3 animate-fade-in pb-1">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Location
                </label>
                <Input
                  placeholder="Add location..."
                  value={data.location}
                  onChange={e => onChange({ ...data, location: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Link2 className="h-3 w-3" /> Conference Link
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add meeting link..."
                    value={data.conferenceLink}
                    onChange={e => onChange({ ...data, conferenceLink: e.target.value })}
                    className="flex-1 h-8 text-xs"
                  />
                  <Button variant="outline" size="sm" onClick={generateMeetLink} className="h-8 gap-1.5 flex-shrink-0 pointer-events-auto border-dashed hover:border-primary/50">
                    <Video className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px]">Google Meet</span>
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Description</label>
                <textarea
                  placeholder="Add description..."
                  value={data.description}
                  onChange={e => onChange({ ...data, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-md border bg-transparent resize-none min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between p-3 border-t bg-muted/20">
          {mode === "edit" && onDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs">
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          )}
          <div className={cn("flex gap-2", mode !== "edit" && "ml-auto")}>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs pointer-events-auto">Cancel</Button>
            <Button size="sm" onClick={onSave} disabled={!data.title.trim()} className="h-8 text-xs pointer-events-auto">Save</Button>
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default PlannerQuickEvent;
