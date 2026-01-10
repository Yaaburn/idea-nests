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
  Users,
  Trash2
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

// Grid constants - SINGLE SOURCE OF TRUTH
const SLOT_HEIGHT = 16; // pixels per 15-minute slot
const HOUR_HEIGHT = SLOT_HEIGHT * 4; // 64px per hour
const DAY_START_HOUR = 7;
const DAY_END_HOUR = 21;
const TIME_COLUMN_WIDTH = 72; // Fixed width for time column

// Grid template - shared between header and body
const WEEK_GRID_TEMPLATE = `${TIME_COLUMN_WIDTH}px repeat(7, minmax(0, 1fr))`;
const DAY_GRID_TEMPLATE = `${TIME_COLUMN_WIDTH}px minmax(0, 1fr)`;

const Planner = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 13)); // Jan 13, 2025
  const [events, setEvents] = useState(mockEvents);
  
  // Popover state - unified for create and edit
  const [popoverMode, setPopoverMode] = useState<"create" | "edit" | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
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
  const popoverRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag to create state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ date: Date; hour: number; minute: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ date: Date; hour: number; minute: number } | null>(null);

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
    const height = Math.max((duration / 15) * SLOT_HEIGHT, SLOT_HEIGHT);
    
    return {
      top: `${topOffset}px`,
      height: `${height}px`,
    };
  };

  // Smart popover positioning - clamp to viewport
  const calculateSmartPosition = (clickX: number, clickY: number) => {
    const padding = 16;
    const popoverWidth = 380;
    const popoverHeight = 480;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = clickX + 10; // Offset from click
    let y = clickY + 10;

    // Horizontal clamping
    if (x + popoverWidth > viewportWidth - padding) {
      x = clickX - popoverWidth - 10;
    }
    if (x < padding) {
      x = padding;
    }

    // Vertical clamping
    if (y + popoverHeight > viewportHeight - padding) {
      y = viewportHeight - popoverHeight - padding;
    }
    if (y < padding) {
      y = padding;
    }

    return { x, y };
  };

  // Handle time slot click for quick event creation
  const openCreatePopover = (date: Date, hour: number, minute: number, e: React.MouseEvent) => {
    const dateStr = date.toISOString().split("T")[0];
    const endMinute = minute + 60; // Default 1 hour
    const endHour = hour + Math.floor(endMinute / 60);
    const endMin = endMinute % 60;
    
    setQuickEventData({
      date: dateStr,
      startTime: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
      endTime: `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`,
      title: "",
      attendees: [],
      location: "",
      description: "",
    });
    
    const position = calculateSmartPosition(e.clientX, e.clientY);
    setPopoverPosition(position);
    setSelectedEvent(null);
    setPopoverMode("create");
  };

  // Handle event click for edit
  const openEditPopover = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setSelectedEvent(event);
    setQuickEventData({
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      title: event.title,
      attendees: event.attendees?.map((_, i) => (i + 1).toString()) || [],
      location: event.location || "",
      description: event.description || "",
    });
    
    const position = calculateSmartPosition(e.clientX, e.clientY);
    setPopoverPosition(position);
    setPopoverMode("edit");
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
      
      const position = calculateSmartPosition(e.clientX, e.clientY);
      setPopoverPosition(position);
      setSelectedEvent(null);
      setPopoverMode("create");
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const handleSaveEvent = () => {
    if (!quickEventData.title.trim()) return;
    
    if (popoverMode === "edit" && selectedEvent) {
      // Update existing event
      setEvents(prev => prev.map(evt => 
        evt.id === selectedEvent.id 
          ? {
              ...evt,
              title: quickEventData.title,
              date: quickEventData.date,
              startTime: quickEventData.startTime,
              endTime: quickEventData.endTime,
              attendees: quickEventData.attendees.map(id => {
                const attendee = mockAttendees.find(a => a.id === id);
                return attendee ? { name: attendee.name, avatar: attendee.avatar } : { name: "Unknown", avatar: "" };
              }),
              location: quickEventData.location,
              description: quickEventData.description,
            }
          : evt
      ));
    } else {
      // Create new event
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
    }
    
    closePopover();
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      setEvents(prev => prev.filter(evt => evt.id !== selectedEvent.id));
      closePopover();
    }
  };

  const closePopover = () => {
    setPopoverMode(null);
    setSelectedEvent(null);
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

  // Hours for display
  const displayHours = useMemo(() => {
    return Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);
  }, []);

  const totalGridHeight = displayHours.length * HOUR_HEIGHT;

  return (
    <div className="flex flex-col h-full min-h-0" ref={containerRef}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between flex-shrink-0 mb-4">
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
              setPopoverPosition({ x: window.innerWidth / 2 - 190, y: 150 });
              setSelectedEvent(null);
              setPopoverMode("create");
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Calendar Grid - Flex grow to fill available space */}
      <Card className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {/* Month View */}
        {viewMode === "month" && (
          <div className="flex flex-col h-full">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b flex-shrink-0">
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
            <div className="grid grid-cols-7 flex-1 min-h-0 overflow-auto">
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
                    onClick={(e) => openCreatePopover(date, 9, 0, e)}
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
                            "text-xs px-1.5 py-0.5 rounded truncate text-white cursor-pointer hover:opacity-80",
                            event.color
                          )}
                          onClick={(e) => openEditPopover(event, e)}
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

        {/* Week View - CSS Grid with SHARED template for perfect alignment */}
        {viewMode === "week" && (
          <div className="flex flex-col h-full">
            {/* Header Row - EXACT SAME grid template as body */}
            <div 
              className="grid border-b flex-shrink-0"
              style={{ gridTemplateColumns: WEEK_GRID_TEMPLATE }}
            >
              {/* Time column header - empty */}
              <div className="p-2 border-r bg-muted/30" />
              {/* Day headers */}
              {weekDays.map((date, i) => {
                const isToday = date.toDateString() === today.toDateString();
                return (
                  <div
                    key={i}
                    className={cn(
                      "p-2 text-center border-r last:border-r-0",
                      isToday && "bg-primary/10"
                    )}
                  >
                    <div className="text-xs text-muted-foreground uppercase">{DAYS[i]}</div>
                    <div
                      className={cn(
                        "text-lg font-semibold",
                        isToday && "text-primary"
                      )}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Grid Body - Scrollable, same grid template */}
            <div 
              className="flex-1 min-h-0 overflow-auto"
              onMouseUp={handleMouseUp}
            >
              <div 
                className="grid relative"
                style={{ 
                  gridTemplateColumns: WEEK_GRID_TEMPLATE,
                  height: `${totalGridHeight}px`
                }}
              >
                {/* Time Labels Column */}
                <div className="border-r bg-muted/20 relative">
                  {displayHours.map((hour, idx) => (
                    <div 
                      key={hour}
                      className="absolute text-xs text-muted-foreground text-right pr-2 w-full"
                      style={{ 
                        top: `${idx * HOUR_HEIGHT}px`,
                        height: `${HOUR_HEIGHT}px`,
                        lineHeight: '1'
                      }}
                    >
                      <span className="relative -top-2">
                        {hour.toString().padStart(2, "0")}:00
                      </span>
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
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
                    >
                      {/* Hour grid lines */}
                      {displayHours.map((hour, idx) => (
                        <div
                          key={hour}
                          className="absolute w-full border-t border-border/50"
                          style={{ top: `${idx * HOUR_HEIGHT}px` }}
                        />
                      ))}

                      {/* Half-hour grid lines (lighter) */}
                      {displayHours.map((hour, idx) => (
                        <div
                          key={`half-${hour}`}
                          className="absolute w-full border-t border-border/20"
                          style={{ top: `${idx * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
                        />
                      ))}

                      {/* Clickable hour slots */}
                      {displayHours.map((hour, idx) => (
                        <div
                          key={`slot-${hour}`}
                          className="absolute w-full cursor-pointer hover:bg-muted/30 transition-colors"
                          style={{ 
                            top: `${idx * HOUR_HEIGHT}px`,
                            height: `${HOUR_HEIGHT}px`
                          }}
                          onClick={(e) => openCreatePopover(date, hour, 0, e)}
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
                            height: `${Math.max(Math.abs((dragEnd.hour * 60 + dragEnd.minute) - (dragStart.hour * 60 + dragStart.minute)) / 15 * SLOT_HEIGHT, SLOT_HEIGHT)}px`,
                          }}
                        />
                      )}

                      {/* Events */}
                      {dayEvents.map((event) => {
                        const style = getEventStyle(event);
                        return (
                          <div
                            key={event.id}
                            className={cn(
                              "absolute left-1 right-1 px-2 py-1 rounded text-white text-xs overflow-hidden cursor-pointer hover:opacity-90 hover:shadow-md transition-all z-20",
                              event.color
                            )}
                            style={style}
                            onClick={(e) => openEditPopover(event, e)}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="opacity-80 truncate text-[10px]">
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

        {/* Day View - CSS Grid with shared template logic */}
        {viewMode === "day" && (
          <div className="flex flex-col h-full">
            {/* Day Header */}
            <div 
              className="grid border-b flex-shrink-0"
              style={{ gridTemplateColumns: DAY_GRID_TEMPLATE }}
            >
              <div className="p-2 border-r bg-muted/30" />
              <div className={cn(
                "p-3 text-center",
                currentDate.toDateString() === today.toDateString() && "bg-primary/10"
              )}>
                <div className="text-xs text-muted-foreground uppercase">
                  {DAYS[currentDate.getDay()]}
                </div>
                <div className={cn(
                  "text-2xl font-bold",
                  currentDate.toDateString() === today.toDateString() && "text-primary"
                )}>
                  {currentDate.getDate()}
                </div>
              </div>
            </div>

            {/* Time Grid Body */}
            <div 
              className="flex-1 min-h-0 overflow-auto"
              onMouseUp={handleMouseUp}
            >
              <div 
                className="grid relative"
                style={{ 
                  gridTemplateColumns: DAY_GRID_TEMPLATE,
                  height: `${totalGridHeight}px`
                }}
              >
                {/* Time Labels */}
                <div className="border-r bg-muted/20 relative">
                  {displayHours.map((hour, idx) => (
                    <div 
                      key={hour}
                      className="absolute text-xs text-muted-foreground text-right pr-2 w-full"
                      style={{ 
                        top: `${idx * HOUR_HEIGHT}px`,
                        height: `${HOUR_HEIGHT}px`,
                        lineHeight: '1'
                      }}
                    >
                      <span className="relative -top-2">
                        {hour.toString().padStart(2, "0")}:00
                      </span>
                    </div>
                  ))}
                </div>

                {/* Day Column */}
                <div className="relative">
                  {/* Hour grid lines */}
                  {displayHours.map((hour, idx) => (
                    <div
                      key={hour}
                      className="absolute w-full border-t border-border/50"
                      style={{ top: `${idx * HOUR_HEIGHT}px` }}
                    />
                  ))}

                  {/* Half-hour grid lines */}
                  {displayHours.map((hour, idx) => (
                    <div
                      key={`half-${hour}`}
                      className="absolute w-full border-t border-border/20"
                      style={{ top: `${idx * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
                    />
                  ))}

                  {/* Clickable slots */}
                  {displayHours.map((hour, idx) => (
                    <div
                      key={`slot-${hour}`}
                      className="absolute w-full cursor-pointer hover:bg-muted/30 transition-colors"
                      style={{ 
                        top: `${idx * HOUR_HEIGHT}px`,
                        height: `${HOUR_HEIGHT}px`
                      }}
                      onClick={(e) => openCreatePopover(currentDate, hour, 0, e)}
                      onMouseDown={(e) => handleMouseDown(currentDate, hour, 0, e)}
                      onMouseMove={() => handleMouseMove(hour, 0)}
                    />
                  ))}

                  {/* Drag selection indicator */}
                  {isDragging && dragStart && dragEnd && (
                    <div
                      className="absolute left-2 right-2 bg-primary/30 rounded border-2 border-primary border-dashed pointer-events-none z-10"
                      style={{
                        top: `${((Math.min(dragStart.hour, dragEnd.hour) - DAY_START_HOUR) * 60 + Math.min(dragStart.minute, dragEnd.minute)) / 15 * SLOT_HEIGHT}px`,
                        height: `${Math.max(Math.abs((dragEnd.hour * 60 + dragEnd.minute) - (dragStart.hour * 60 + dragStart.minute)) / 15 * SLOT_HEIGHT, SLOT_HEIGHT)}px`,
                      }}
                    />
                  )}

                  {/* Events */}
                  {getEventsForDate(currentDate).map((event) => {
                    const style = getEventStyle(event);
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "absolute left-2 right-2 px-3 py-2 rounded text-white overflow-hidden cursor-pointer hover:opacity-90 hover:shadow-md transition-all z-20",
                          event.color
                        )}
                        style={style}
                        onClick={(e) => openEditPopover(event, e)}
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
          </div>
        )}
      </Card>

      {/* Quick Event / Edit Popover - STACK LAYOUT (NO backdrop blur for Planner) */}
      {popoverMode && (
        <div 
          className="fixed inset-0 z-50"
          onClick={closePopover}
        >
          <div
            ref={popoverRef}
            className="absolute bg-popover border rounded-xl shadow-2xl w-[380px] max-w-[calc(100vw-32px)] animate-fade-in overflow-hidden"
            style={{
              left: popoverPosition.x,
              top: popoverPosition.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <h3 className="font-semibold text-lg">
                {popoverMode === "edit" ? "Edit Event" : "Quick Event"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={closePopover}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title</label>
                <Input
                  placeholder="Event title..."
                  value={quickEventData.title}
                  onChange={(e) => setQuickEventData(prev => ({ ...prev, title: e.target.value }))}
                  autoFocus
                  className="w-full"
                />
              </div>

              {/* Date - Full width, own row */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date</label>
                <Input
                  type="date"
                  value={quickEventData.date}
                  onChange={(e) => setQuickEventData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full"
                />
              </div>

              {/* Time Range - Separate row with 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Start</label>
                  <Input
                    type="time"
                    value={quickEventData.startTime}
                    onChange={(e) => setQuickEventData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">End</label>
                  <Input
                    type="time"
                    value={quickEventData.endTime}
                    onChange={(e) => setQuickEventData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Attendees */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Attendees</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mockAttendees.map((attendee) => (
                    <button
                      key={attendee.id}
                      onClick={() => toggleAttendee(attendee.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs transition-all",
                        quickEventData.attendees.includes(attendee.id)
                          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={attendee.avatar} />
                        <AvatarFallback className="text-[8px]">{attendee.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="truncate max-w-[60px]">{attendee.name.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hide/Show Details Toggle */}
              <button
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showDetails ? "Hide details" : "Show details"}
              </button>

              {/* Collapsible Details */}
              {showDetails && (
                <div className="space-y-3 animate-fade-in">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Location
                    </label>
                    <Input
                      placeholder="Add location or meeting link..."
                      value={quickEventData.location}
                      onChange={(e) => setQuickEventData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
                    <textarea
                      placeholder="Add description..."
                      value={quickEventData.description}
                      onChange={(e) => setQuickEventData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-md border bg-transparent resize-none min-h-[60px]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions - Sticky footer */}
            <div className="flex justify-between p-4 border-t bg-muted/20">
              {popoverMode === "edit" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteEvent}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
              <div className={cn("flex gap-2", popoverMode !== "edit" && "ml-auto")}>
                <Button variant="ghost" onClick={closePopover}>
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
        </div>
      )}

      {/* Empty State for Day view */}
      {viewMode === "day" && getEventsForDate(currentDate).length === 0 && !popoverMode && (
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
              setPopoverPosition({ x: window.innerWidth / 2 - 190, y: 150 });
              setSelectedEvent(null);
              setPopoverMode("create");
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