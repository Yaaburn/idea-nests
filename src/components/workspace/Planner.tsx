import { useState, useMemo, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "day" | "week" | "month";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  type: "meeting" | "deadline" | "milestone" | "task";
  attendees?: { name: string; avatar: string }[];
  location?: string;
  description?: string;
}

const mockEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Sprint Planning",
    date: "2025-01-13",
    startTime: "10:00",
    endTime: "11:30",
    color: "bg-primary",
    type: "meeting",
    attendees: [
      { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
      { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
    ],
  },
  {
    id: "2",
    title: "Design Review",
    date: "2025-01-14",
    startTime: "14:00",
    endTime: "15:00",
    color: "bg-secondary",
    type: "meeting",
    attendees: [
      { name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
    ],
  },
  {
    id: "3",
    title: "MVP Deadline",
    date: "2025-01-15",
    startTime: "23:59",
    endTime: "23:59",
    color: "bg-accent",
    type: "deadline",
  },
  {
    id: "4",
    title: "Team Standup",
    date: "2025-01-13",
    startTime: "09:00",
    endTime: "09:30",
    color: "bg-green-500",
    type: "meeting",
  },
  {
    id: "5",
    title: "Code Review",
    date: "2025-01-16",
    startTime: "11:00",
    endTime: "12:00",
    color: "bg-primary",
    type: "task",
  },
  {
    id: "6",
    title: "Milestone: Alpha Release",
    date: "2025-01-20",
    startTime: "00:00",
    endTime: "23:59",
    color: "bg-accent",
    type: "milestone",
  },
];

const mockAttendees = [
  { id: "1", name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
  { id: "2", name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
  { id: "3", name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
  { id: "4", name: "James Wilson", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOT_HEIGHT = 20; // pixels per 15-minute slot
const DAY_START_HOUR = 7;
const DAY_END_HOUR = 21;

const Planner = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 13)); // Jan 13, 2025
  const [events, setEvents] = useState(mockEvents);
  
  // Quick Event Popover state
  const [showQuickEvent, setShowQuickEvent] = useState(false);
  const [quickEventData, setQuickEventData] = useState({
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    title: "",
    attendees: [] as string[],
    location: "",
    description: "",
  });
  const [showDetails, setShowDetails] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });

  // Drag to create state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ date: Date; hour: number; minute: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ date: Date; hour: number; minute: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const current = new Date(startDate);
    while (current <= lastDay || days.length % 7 !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
      if (days.length > 42) break;
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((e) => e.date === dateStr);
  };

  const formatDateRange = () => {
    if (viewMode === "day") {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } else if (viewMode === "week") {
      const weekDays = getWeekDays();
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
  };

  // Calculate event position and height based on 15-min slots
  const getEventStyle = (event: CalendarEvent) => {
    const [startHour, startMin] = event.startTime.split(":").map(Number);
    const [endHour, endMin] = event.endTime.split(":").map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const dayStartMinutes = DAY_START_HOUR * 60;
    
    const duration = endMinutes - startMinutes;
    const topOffset = ((startMinutes - dayStartMinutes) / 15) * SLOT_HEIGHT;
    const height = Math.max((duration / 15) * SLOT_HEIGHT, SLOT_HEIGHT); // Minimum 1 slot height
    
    return {
      top: `${topOffset}px`,
      height: `${height}px`,
    };
  };

  // Handle time slot click for quick event creation
  const handleSlotClick = (date: Date, hour: number, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dateStr = date.toISOString().split("T")[0];
    
    setQuickEventData({
      date: dateStr,
      startTime: `${hour.toString().padStart(2, "0")}:00`,
      endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
      title: "",
      attendees: [],
      location: "",
      description: "",
    });
    
    setPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setShowQuickEvent(true);
  };

  // Handle drag to create
  const handleMouseDown = (date: Date, hour: number, minute: number, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ date, hour, minute });
    setDragEnd({ date, hour, minute: minute + 15 });
  };

  const handleMouseMove = useCallback((hour: number, minute: number) => {
    if (isDragging && dragStart) {
      setDragEnd({ date: dragStart.date, hour, minute: minute + 15 });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging && dragStart && dragEnd) {
      const dateStr = dragStart.date.toISOString().split("T")[0];
      const startMinutes = dragStart.hour * 60 + dragStart.minute;
      const endMinutes = dragEnd.hour * 60 + dragEnd.minute;
      
      const actualStart = Math.min(startMinutes, endMinutes);
      const actualEnd = Math.max(startMinutes, endMinutes);
      
      const startHour = Math.floor(actualStart / 60);
      const startMin = actualStart % 60;
      const endHour = Math.floor(actualEnd / 60);
      const endMin = actualEnd % 60;
      
      setQuickEventData({
        date: dateStr,
        startTime: `${startHour.toString().padStart(2, "0")}:${startMin.toString().padStart(2, "0")}`,
        endTime: `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`,
        title: "",
        attendees: [],
        location: "",
        description: "",
      });
      
      const rect = e.currentTarget.getBoundingClientRect();
      setPopoverPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setShowQuickEvent(true);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const handleSaveEvent = () => {
    if (!quickEventData.title.trim()) return;
    
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: quickEventData.title,
      date: quickEventData.date,
      startTime: quickEventData.startTime,
      endTime: quickEventData.endTime,
      color: "bg-primary",
      type: "meeting",
      attendees: quickEventData.attendees.map(id => {
        const attendee = mockAttendees.find(a => a.id === id);
        return attendee ? { name: attendee.name, avatar: attendee.avatar } : { name: "Unknown", avatar: "" };
      }),
      location: quickEventData.location,
      description: quickEventData.description,
    };
    
    setEvents(prev => [...prev, newEvent]);
    setShowQuickEvent(false);
    setShowDetails(false);
  };

  const toggleAttendee = (id: string) => {
    setQuickEventData(prev => ({
      ...prev,
      attendees: prev.attendees.includes(id)
        ? prev.attendees.filter(a => a !== id)
        : [...prev.attendees, id]
    }));
  };

  const weekDays = getWeekDays();
  const monthDays = getMonthDays();
  const today = new Date();

  // Generate time slots (15-min increments)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = DAY_START_HOUR; hour < DAY_END_HOUR; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        slots.push({ hour, minute });
      }
    }
    return slots;
  }, []);

  // Hours for display
  const displayHours = useMemo(() => {
    return Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDate("prev")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[250px] text-center">
            {formatDateRange()}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDate("next")}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex border rounded-lg p-1">
            {(["day", "week", "month"] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode)}
                className="capitalize"
              >
                {mode}
              </Button>
            ))}
          </div>

          <Button 
            className="gradient-primary text-white"
            onClick={() => {
              const dateStr = currentDate.toISOString().split("T")[0];
              setQuickEventData({
                date: dateStr,
                startTime: "09:00",
                endTime: "10:00",
                title: "",
                attendees: [],
                location: "",
                description: "",
              });
              setPopoverPosition({ x: window.innerWidth / 2, y: 200 });
              setShowQuickEvent(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        {/* Month View */}
        {viewMode === "month" && (
          <div>
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>
            {/* Days Grid */}
            <div className="grid grid-cols-7">
              {monthDays.map((date, i) => {
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isToday = date.toDateString() === today.toDateString();
                const dayEvents = getEventsForDate(date);
                return (
                  <div
                    key={i}
                    className={cn(
                      "min-h-[100px] p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-muted/50 transition-colors",
                      !isCurrentMonth && "bg-muted/30 text-muted-foreground"
                    )}
                    onClick={(e) => handleSlotClick(date, 9, e)}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-sm mb-1",
                        isToday && "bg-primary text-primary-foreground font-bold"
                      )}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded truncate text-white",
                            event.color
                          )}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week View with proper 15-min slot rendering */}
        {viewMode === "week" && (
          <div>
            {/* Day Headers */}
            <div className="grid grid-cols-8 border-b">
              <div className="p-3 border-r w-20" />
              {weekDays.map((date, i) => {
                const isToday = date.toDateString() === today.toDateString();
                return (
                  <div
                    key={i}
                    className={cn(
                      "p-3 text-center border-r last:border-r-0",
                      isToday && "bg-primary/10"
                    )}
                  >
                    <div className="text-sm text-muted-foreground">{DAYS[i]}</div>
                    <div
                      className={cn(
                        "text-lg font-semibold mt-1",
                        isToday && "text-primary"
                      )}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Time Grid with 15-min slots */}
            <div 
              ref={gridRef}
              className="max-h-[600px] overflow-y-auto"
              onMouseUp={handleMouseUp}
            >
              <div className="grid grid-cols-8">
                {/* Time labels column */}
                <div className="border-r w-20">
                  {displayHours.map((hour) => (
                    <div 
                      key={hour} 
                      className="text-xs text-muted-foreground text-right pr-2 relative"
                      style={{ height: `${SLOT_HEIGHT * 4}px` }}
                    >
                      <span className="absolute -top-2 right-2">
                        {hour.toString().padStart(2, "0")}:00
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Day columns */}
                {weekDays.map((date, dayIndex) => {
                  const dayEvents = getEventsForDate(date);
                  const isToday = date.toDateString() === today.toDateString();
                  
                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        "relative border-r last:border-r-0",
                        isToday && "bg-primary/5"
                      )}
                      style={{ height: `${SLOT_HEIGHT * 4 * (DAY_END_HOUR - DAY_START_HOUR)}px` }}
                    >
                      {/* Hour lines */}
                      {displayHours.map((hour) => (
                        <div
                          key={hour}
                          className="absolute w-full border-t border-border/50"
                          style={{ top: `${(hour - DAY_START_HOUR) * SLOT_HEIGHT * 4}px` }}
                        />
                      ))}
                      
                      {/* Clickable slots for creating events */}
                      {displayHours.map((hour) => (
                        <div
                          key={hour}
                          className="absolute w-full cursor-pointer hover:bg-muted/30 transition-colors"
                          style={{ 
                            top: `${(hour - DAY_START_HOUR) * SLOT_HEIGHT * 4}px`,
                            height: `${SLOT_HEIGHT * 4}px`
                          }}
                          onClick={(e) => handleSlotClick(date, hour, e)}
                          onMouseDown={(e) => handleMouseDown(date, hour, 0, e)}
                          onMouseMove={() => handleMouseMove(hour, 0)}
                        />
                      ))}
                      
                      {/* Drag selection indicator */}
                      {isDragging && dragStart && dragEnd && 
                       dragStart.date.toDateString() === date.toDateString() && (
                        <div
                          className="absolute left-1 right-1 bg-primary/30 rounded border-2 border-primary border-dashed pointer-events-none z-10"
                          style={{
                            top: `${((Math.min(dragStart.hour, dragEnd.hour) - DAY_START_HOUR) * 60 + Math.min(dragStart.minute, dragEnd.minute)) / 15 * SLOT_HEIGHT}px`,
                            height: `${Math.abs((dragEnd.hour * 60 + dragEnd.minute) - (dragStart.hour * 60 + dragStart.minute)) / 15 * SLOT_HEIGHT}px`,
                          }}
                        />
                      )}
                      
                      {/* Events - properly positioned by duration */}
                      {dayEvents.map((event) => {
                        const style = getEventStyle(event);
                        return (
                          <div
                            key={event.id}
                            className={cn(
                              "absolute left-1 right-1 px-2 py-1 rounded text-white text-xs overflow-hidden cursor-pointer hover:opacity-90 transition-opacity z-20",
                              event.color
                            )}
                            style={style}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="opacity-80 truncate">
                              {event.startTime} - {event.endTime}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Day View */}
        {viewMode === "day" && (
          <div className="max-h-[600px] overflow-y-auto">
            <div className="grid grid-cols-[80px_1fr]">
              {/* Time labels */}
              <div className="border-r">
                {displayHours.map((hour) => (
                  <div 
                    key={hour} 
                    className="text-xs text-muted-foreground text-right pr-2 relative"
                    style={{ height: `${SLOT_HEIGHT * 4}px` }}
                  >
                    <span className="absolute -top-2 right-2">
                      {hour.toString().padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Day column */}
              <div
                className="relative"
                style={{ height: `${SLOT_HEIGHT * 4 * (DAY_END_HOUR - DAY_START_HOUR)}px` }}
              >
                {/* Hour lines */}
                {displayHours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-border/50"
                    style={{ top: `${(hour - DAY_START_HOUR) * SLOT_HEIGHT * 4}px` }}
                  />
                ))}
                
                {/* Clickable slots */}
                {displayHours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full cursor-pointer hover:bg-muted/30 transition-colors"
                    style={{ 
                      top: `${(hour - DAY_START_HOUR) * SLOT_HEIGHT * 4}px`,
                      height: `${SLOT_HEIGHT * 4}px`
                    }}
                    onClick={(e) => handleSlotClick(currentDate, hour, e)}
                  />
                ))}
                
                {/* Events */}
                {getEventsForDate(currentDate).map((event) => {
                  const style = getEventStyle(event);
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "absolute left-2 right-2 px-3 py-2 rounded text-white overflow-hidden cursor-pointer hover:opacity-90 transition-opacity z-20",
                        event.color
                      )}
                      style={style}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm opacity-80 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {event.startTime} - {event.endTime}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Quick Event Popover (NO backdrop blur) */}
      {showQuickEvent && (
        <div 
          className="fixed inset-0 z-50"
          onClick={() => {
            setShowQuickEvent(false);
            setShowDetails(false);
          }}
        >
          <div
            className="absolute bg-popover border rounded-xl shadow-xl p-4 w-[360px] animate-fade-in"
            style={{
              left: Math.min(popoverPosition.x - 180, window.innerWidth - 380),
              top: Math.min(popoverPosition.y, window.innerHeight - 400),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Quick Event</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setShowQuickEvent(false);
                  setShowDetails(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Title */}
            <Input
              placeholder="Event title..."
              value={quickEventData.title}
              onChange={(e) => setQuickEventData(prev => ({ ...prev, title: e.target.value }))}
              className="mb-3"
              autoFocus
            />

            {/* Date & Time */}
            <div className="flex gap-2 mb-3">
              <Input
                type="date"
                value={quickEventData.date}
                onChange={(e) => setQuickEventData(prev => ({ ...prev, date: e.target.value }))}
                className="flex-1"
              />
              <Input
                type="time"
                value={quickEventData.startTime}
                onChange={(e) => setQuickEventData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-24"
              />
              <span className="flex items-center text-muted-foreground">–</span>
              <Input
                type="time"
                value={quickEventData.endTime}
                onChange={(e) => setQuickEventData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-24"
              />
            </div>

            {/* Attendees */}
            <div className="mb-3">
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
                      quickEventData.attendees.includes(attendee.id)
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
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showDetails ? "Hide details" : "Show details"}
            </button>

            {/* Collapsible Details */}
            {showDetails && (
              <div className="space-y-3 mb-3 animate-fade-in">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Add location or meeting link..."
                    value={quickEventData.location}
                    onChange={(e) => setQuickEventData(prev => ({ ...prev, location: e.target.value }))}
                    className="flex-1"
                  />
                </div>
                <textarea
                  placeholder="Add description..."
                  value={quickEventData.description}
                  onChange={(e) => setQuickEventData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-md border bg-transparent resize-none min-h-[60px]"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowQuickEvent(false);
                  setShowDetails(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="gradient-primary text-white"
                onClick={handleSaveEvent}
                disabled={!quickEventData.title.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {viewMode === "day" && getEventsForDate(currentDate).length === 0 && !showQuickEvent && (
        <div className="text-center py-8 text-muted-foreground">
          <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No events scheduled for this day</p>
          <Button 
            variant="link" 
            className="mt-2"
            onClick={() => {
              const dateStr = currentDate.toISOString().split("T")[0];
              setQuickEventData({
                date: dateStr,
                startTime: "09:00",
                endTime: "10:00",
                title: "",
                attendees: [],
                location: "",
                description: "",
              });
              setPopoverPosition({ x: window.innerWidth / 2, y: 200 });
              setShowQuickEvent(true);
            }}
          >
            Add an event
          </Button>
        </div>
      )}
    </div>
  );
};

export default Planner;
