import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Search,
    ChevronDown,
    Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import type { ViewMode, CalendarEvent, QuickEventData } from "./PlannerTypes";
import {
    SLOT_HEIGHT, HOUR_HEIGHT, DAY_START_HOUR, DAY_END_HOUR,
    TIME_COLUMN_WIDTH, DAYS, WEEK_GRID_TEMPLATE, DAY_GRID_TEMPLATE,
    mockEvents as initialEvents, mockAttendees, defaultQuickEventData,
} from "./PlannerTypes";
import PlannerTimeIndicator from "./PlannerTimeIndicator";
import PlannerRightSidebar from "./PlannerRightSidebar";
import PlannerQuickEvent from "./PlannerQuickEvent";
import PlannerCreateEventForm from "./PlannerCreateEventForm";
import { PlannerSettingsModal } from "./PlannerSettingsModal";

const Planner = () => {
    const [viewMode, setViewMode] = useState<ViewMode>("week");
    const [customDays, setCustomDays] = useState<number | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
    const [searchQuery, setSearchQuery] = useState("");

    // UI state
    const [showFullForm, setShowFullForm] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showWeekends, setShowWeekends] = useState(true);
    const [startOfWeek, setStartOfWeek] = useState("monday");

    // Popover state
    const [popoverMode, setPopoverMode] = useState<"create" | "edit" | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [quickEventData, setQuickEventData] = useState<QuickEventData>({ ...defaultQuickEventData });
    const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });

    // Drag state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<{ date: Date; hour: number; minute: number } | null>(null);
    const [dragEnd, setDragEnd] = useState<{ date: Date; hour: number; minute: number } | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to current time on mount
    useEffect(() => {
        if (scrollRef.current) {
            const now = new Date();
            const minutesSinceStart = (now.getHours() - DAY_START_HOUR) * 60 + now.getMinutes();
            const scrollTo = Math.max(0, (minutesSinceStart / 15) * SLOT_HEIGHT - 200);
            scrollRef.current.scrollTop = scrollTo;
        }
    }, [viewMode]);

    const navigateDate = (direction: "prev" | "next") => {
        const d = new Date(currentDate);
        const days = customDays || (viewMode === "day" ? 1 : viewMode === "week" ? 7 : 30);
        d.setDate(d.getDate() + (direction === "next" ? days : -days));
        setCurrentDate(d);
    };

    const goToToday = () => setCurrentDate(new Date());

    const getWeekDays = () => {
        const start = new Date(currentDate);
        const map: Record<string, number> = { sunday: 0, monday: 1, saturday: 6 };
        const target = map[startOfWeek] || 0;
        const diff = (currentDate.getDay() - target + 7) % 7;
        start.setDate(currentDate.getDate() - diff);
        
        return Array.from({ length: customDays || 7 }, (_, i) => {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            return day;
        });
    };

    const getMonthDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const map: Record<string, number> = { sunday: 0, monday: 1, saturday: 6 };
        const target = map[startOfWeek] || 0;
        
        const startDate = new Date(firstDay);
        const diff = (firstDay.getDay() - target + 7) % 7;
        startDate.setDate(firstDay.getDate() - diff);
        
        const days: Date[] = [];
        const c = new Date(startDate);
        while (c <= lastDay || days.length % 7 !== 0) {
            days.push(new Date(c));
            c.setDate(c.getDate() + 1);
            if (days.length > 42) break;
        }
        return days;
    };

    const getEventsForDate = (date: Date) => {
        const ds = date.toISOString().split("T")[0];
        return events.filter(e => e.date === ds);
    };

    const formatDateRange = () => {
        if (viewMode === "day") {
            return currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
        } else if (viewMode === "week" || customDays) {
            const days = getWeekDays();
            const s = days[0];
            const e = days[days.length - 1];
            return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
        }
        return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    };

    const getEventStyle = (event: CalendarEvent) => {
        const [sH, sM] = event.startTime.split(":").map(Number);
        const [eH, eM] = event.endTime.split(":").map(Number);
        const startMin = sH * 60 + sM;
        const endMin = eH * 60 + eM;
        const dayStartMin = DAY_START_HOUR * 60;
        const top = ((startMin - dayStartMin) / 15) * SLOT_HEIGHT;
        const height = Math.max(((endMin - startMin) / 15) * SLOT_HEIGHT, SLOT_HEIGHT);
        return { top: `${top}px`, height: `${height}px` };
    };

    const calculateSmartPosition = (cx: number, cy: number) => {
        const pad = 16;
        const pw = 480;
        const ph = 520; // Slightly bigger height to account for larger contents
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let x = cx + 10;
        let y = cy + 10;
        if (x + pw > vw - pad) x = cx - pw - 10;
        if (x < pad) x = pad;
        if (y + ph > vh - pad) y = vh - ph - pad;
        if (y < pad) y = pad;
        return { x, y };
    };

    const openCreatePopover = (date: Date, hour: number, minute: number, e: React.MouseEvent) => {
        if (showFullForm) return;
        const ds = date.toISOString().split("T")[0];
        const endH = hour + 1;
        setQuickEventData({
            ...defaultQuickEventData,
            date: ds,
            startTime: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
            endTime: `${endH.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
        });
        setPopoverPosition(calculateSmartPosition(e.clientX, e.clientY));
        setSelectedEvent(null);
        setPopoverMode("create");
    };

    const openEditPopover = (event: CalendarEvent, e: React.MouseEvent) => {
        e.stopPropagation();
        if (showFullForm) return;
        setSelectedEvent(event);
        setQuickEventData({
            ...defaultQuickEventData,
            date: event.date,
            startTime: event.startTime,
            endTime: event.endTime,
            title: event.title,
            attendees: event.attendees?.map((_, i) => (i + 1).toString()) || [],
            location: event.location || "",
            conferenceLink: event.conferenceLink || "",
            description: event.description || "",
            color: event.color,
        });
        setPopoverPosition(calculateSmartPosition(e.clientX, e.clientY));
        setPopoverMode("edit");
    };

    // Drag handlers
    const handleMouseDown = (date: Date, hour: number, minute: number, e: React.MouseEvent) => {
        if (showFullForm) return;
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
            const ds = dragStart.date.toISOString().split("T")[0];
            const sMin = Math.min(dragStart.hour * 60 + dragStart.minute, dragEnd.hour * 60 + dragEnd.minute);
            const eMin = Math.max(dragStart.hour * 60 + dragStart.minute, dragEnd.hour * 60 + dragEnd.minute);
            setQuickEventData({
                ...defaultQuickEventData,
                date: ds,
                startTime: `${Math.floor(sMin / 60).toString().padStart(2, "0")}:${(sMin % 60).toString().padStart(2, "0")}`,
                endTime: `${Math.floor(eMin / 60).toString().padStart(2, "0")}:${(eMin % 60).toString().padStart(2, "0")}`,
            });
            setPopoverPosition(calculateSmartPosition(e.clientX, e.clientY));
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
            setEvents(prev => prev.map(evt =>
                evt.id === selectedEvent.id
                    ? {
                        ...evt,
                        title: quickEventData.title,
                        date: quickEventData.date,
                        startTime: quickEventData.startTime,
                        endTime: quickEventData.endTime,
                        color: quickEventData.color,
                        location: quickEventData.location,
                        conferenceLink: quickEventData.conferenceLink,
                        description: quickEventData.description,
                        attendees: quickEventData.attendees.map(id => {
                            const a = mockAttendees.find(at => at.id === id);
                            return a || { id, name: "Unknown", avatar: "" };
                        }),
                    }
                    : evt
            ));
            toast.success("Event updated");
        } else {
            const newEvent: CalendarEvent = {
                id: `event-${Date.now()}`,
                title: quickEventData.title,
                date: quickEventData.date,
                startTime: quickEventData.startTime,
                endTime: quickEventData.endTime,
                color: quickEventData.color,
                type: "meeting",
                location: quickEventData.location,
                conferenceLink: quickEventData.conferenceLink,
                description: quickEventData.description,
                attendees: quickEventData.attendees.map(id => {
                    const a = mockAttendees.find(at => at.id === id);
                    return a || { id, name: "Unknown", avatar: "" };
                }),
            };
            setEvents(prev => [...prev, newEvent]);
            toast.success("Event Created", {
                description: `'${quickEventData.title}' has been added to your calendar.`,
            });
        }
        closePopover();
    };

    const handleDeleteEvent = () => {
        if (selectedEvent) {
            setEvents(prev => prev.filter(evt => evt.id !== selectedEvent.id));
            toast.success("Event deleted");
            closePopover();
        }
    };

    const closePopover = () => {
        setPopoverMode(null);
        setSelectedEvent(null);
    };

    const expandToFullForm = () => {
        closePopover();
        setShowFullForm(true);
    };

    const openNewFullForm = () => {
        const ds = currentDate.toISOString().split("T")[0];
        setQuickEventData({ ...defaultQuickEventData, date: ds });
        setSelectedEvent(null);
        setShowFullForm(true);
    };

    const handleFullFormSave = () => {
        if (!quickEventData.title.trim()) return;
        const newEvent: CalendarEvent = {
            id: `event-${Date.now()}`,
            title: quickEventData.title,
            date: quickEventData.date,
            startTime: quickEventData.startTime,
            endTime: quickEventData.endTime,
            color: quickEventData.color,
            type: "meeting",
            location: quickEventData.location,
            conferenceLink: quickEventData.conferenceLink,
            description: quickEventData.description,
            attendees: quickEventData.attendees.map(id => {
                const a = mockAttendees.find(at => at.id === id);
                return a || { id, name: "Unknown", avatar: "" };
            }),
        };
        setEvents(prev => [...prev, newEvent]);
        toast.success("Event Created", {
            description: `'${quickEventData.title}' has been added to your calendar.`,
        });
        setShowFullForm(false);
        setQuickEventData({ ...defaultQuickEventData });
    };

    // ── Computed columns ──
    const visibleDays = useMemo(() => {
        if (viewMode === "day") return [new Date(currentDate)];
        if (viewMode === "month") return []; // month uses different rendering
        if (customDays) {
            return Array.from({ length: customDays }, (_, i) => {
                const d = new Date(currentDate); d.setDate(d.getDate() + i); return d;
            });
        }
        // week
        const days = getWeekDays();
        return showWeekends ? days : days.filter(d => d.getDay() !== 0 && d.getDay() !== 6);
    }, [viewMode, currentDate, customDays, showWeekends, startOfWeek]);

    const monthDays = getMonthDays();
    const today = new Date();
    const displayHours = useMemo(() => Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i), []);
    const totalGridHeight = displayHours.length * HOUR_HEIGHT;

    const currentViewLabel = customDays ? `${customDays} Days` : viewMode.charAt(0).toUpperCase() + viewMode.slice(1);

    // Determine if we should show timegrid (day, week, custom days)
    const isTimeGrid = viewMode === "day" || viewMode === "week" || !!customDays;
    const gridColumns = viewMode === "day"
        ? DAY_GRID_TEMPLATE
        : `${TIME_COLUMN_WIDTH}px repeat(${visibleDays.length}, minmax(0, 1fr))`;
    const gridDays = visibleDays;

    // Full form view
    if (showFullForm) {
        return (
            <div className="flex flex-col h-full min-h-0">
                {/* Top bar */}
                <div className="flex items-center justify-between flex-shrink-0 mb-4">
                    <Button variant="ghost" onClick={() => setShowFullForm(false)}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Calendar
                    </Button>
                </div>
                <PlannerCreateEventForm
                    data={quickEventData}
                    onChange={setQuickEventData}
                    onSave={handleFullFormSave}
                    onSaveDraft={() => { toast.info("Draft saved"); setShowFullForm(false); }}
                    onClose={() => setShowFullForm(false)}
                    existingEvents={events}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Top Bar - ABOVE the flex row so it spans full width */}
            <div className="flex items-center gap-3 flex-shrink-0 mb-3 relative z-10">
                {/* Search */}
                <div className="relative w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-sm"
                    />
                </div>

                <div className="flex-1" />

                {/* Navigation */}
                <Button variant="outline" size="sm" onClick={goToToday} className="text-xs h-8">
                    Today
                </Button>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate("prev")}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[180px] text-center">{formatDateRange()}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate("next")}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* View Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
                            {currentViewLabel}
                            <ChevronDown className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => { setViewMode("day"); setCustomDays(null); }}>
                            Day
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setViewMode("week"); setCustomDays(null); }}>
                            Week
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setViewMode("month"); setCustomDays(null); }}>
                            Month
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Custom Days</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                {[2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                    <DropdownMenuItem key={n} onClick={() => { setViewMode("week"); setCustomDays(n); }}>
                                        {n} Days
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setShowSettings(true)}>
                            <Settings2 className="h-3.5 w-3.5 mr-2" />
                            Settings
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* + New */}
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openNewFullForm}>
                    <Plus className="h-3.5 w-3.5" />
                    New
                </Button>
            </div>

            {/* Calendar + Sidebar Row */}
            <div className="flex flex-1 min-h-0">
                {/* Calendar Grid */}
                <Card className="flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col">
                    {viewMode === "month" && !customDays ? (
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-7 gap-px bg-border/20 rounded-lg overflow-hidden">
                                {Array.from({ length: 7 }, (_, i) => {
                                    const map: Record<string, number> = { sunday: 0, monday: 1, saturday: 6 };
                                    const target = map[startOfWeek] || 0;
                                    return DAYS[(target + i) % 7];
                                }).map(d => (
                                    <div key={d} className="bg-muted/30 p-2 text-center text-[10px] font-semibold text-muted-foreground uppercase">{d}</div>
                                ))}
                                {monthDays.map((day, i) => {
                                    if (!day) return <div key={`empty-${i}`} className="bg-background p-2 min-h-[80px]" />;
                                    const dk = day.toISOString().split("T")[0];
                                    const isToday = dk === today.toISOString().split("T")[0];
                                    const dayEvents = getEventsForDate(day);
                                    return (
                                        <div key={dk} className="bg-background p-2 min-h-[80px] hover:bg-muted/20 cursor-pointer transition-colors"
                                            onClick={e => openCreatePopover(day, 9, 0, e)}>
                                            <span className={cn("text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full",
                                                isToday ? "bg-primary text-primary-foreground" : "text-foreground")}>{day.getDate()}</span>
                                            <div className="mt-1 space-y-0.5">
                                                {dayEvents.slice(0, 2).map(evt => (
                                                    <div key={evt.id} className={cn("text-[9px] truncate px-1 py-0.5 rounded cursor-pointer", evt.color)} onClick={e => openEditPopover(evt, e)}>{evt.title}</div>
                                                ))}
                                                {dayEvents.length > 2 && <div className="text-[9px] text-muted-foreground">+{dayEvents.length - 2} more</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col" ref={scrollRef} onMouseUp={handleMouseUp}>
                            {/* Day columns header */}
                            <div className={`grid border-b border-border/30 sticky top-0 bg-background z-20 flex-shrink-0`}
                                style={{ gridTemplateColumns: `56px repeat(${visibleDays.length}, 1fr)` }}>
                                <div className="p-2" />
                                {visibleDays.map(day => {
                                    const isToday = day.toDateString() === today.toDateString();
                                    return (
                                        <div key={day.toISOString()} className="flex flex-col items-center py-2 border-l border-border/20">
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase">
                                                {day.toLocaleDateString("en-US", { weekday: "short" })}
                                            </span>
                                            <span className={cn("text-sm font-semibold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full",
                                                isToday ? "bg-primary text-primary-foreground" : "text-foreground")}>
                                                {day.getDate()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Time grid */}
                            <div className="relative flex-1" style={{ gridTemplateColumns: `56px repeat(${visibleDays.length}, 1fr)` }}>
                                <div className={`grid`} style={{ gridTemplateColumns: `56px repeat(${visibleDays.length}, 1fr)` }}>
                                    {displayHours.map(hour => (
                                        <div key={hour} className="contents">
                                            <div className="flex items-start justify-end pr-2 border-r border-border/20" style={{ height: HOUR_HEIGHT }}>
                                                <span className="text-[10px] text-muted-foreground -mt-1.5">{hour.toString().padStart(2, "0")}:00</span>
                                            </div>
                                            {visibleDays.map(day => {
                                                return (
                                                    <div key={`${day.toISOString()}-${hour}`}
                                                        className="border-l border-b border-border/15 relative"
                                                        style={{ height: HOUR_HEIGHT }}>
                                                        {[0, 15, 30, 45].map(min => (
                                                            <div
                                                                key={`${hour}-${min}`}
                                                                className="absolute w-full cursor-crosshair hover:bg-primary/[0.04] transition-colors"
                                                                style={{ top: `${(min / 15) * SLOT_HEIGHT}px`, height: `${SLOT_HEIGHT}px` }}
                                                                onClick={e => openCreatePopover(day, hour, min, e)}
                                                                onMouseDown={e => handleMouseDown(day, hour, min, e)}
                                                                onMouseMove={() => handleMouseMove(hour, min)}
                                                            />
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>

                                {/* Events overlay */}
                                {visibleDays.map((day, colIdx) => {
                                    const dayEvents = getEventsForDate(day);
                                    return dayEvents.map(evt => {
                                        const [sH, sM] = evt.startTime.split(":").map(Number);
                                        const [eH, eM] = evt.endTime.split(":").map(Number);
                                        const startMin = sH * 60 + sM;
                                        const endMin = eH * 60 + eM;
                                        const topPx = ((startMin - displayHours[0] * 60) / 15) * SLOT_HEIGHT;
                                        const heightPx = Math.max(((endMin - startMin) / 15) * SLOT_HEIGHT, 24);
                                        return (
                                            <div key={evt.id}
                                                className={cn("absolute rounded-md px-2 py-1 border-l-[3px] overflow-hidden z-10 hover:shadow-md transition-shadow cursor-pointer", evt.color)}
                                                style={{ top: `${topPx}px`, height: `${heightPx}px`, left: `calc(56px + ${colIdx} * ((100% - 56px) / ${visibleDays.length}) + 2px)`, width: `calc((100% - 56px) / ${visibleDays.length} - 4px)` }}
                                                onClick={e => openEditPopover(evt, e)}
                                            >
                                                <p className="text-[11px] font-semibold truncate leading-tight">{evt.title}</p>
                                                {heightPx > 32 && <p className="text-[9px] opacity-70 truncate">{evt.startTime} – {evt.endTime}</p>}
                                                {heightPx > 48 && evt.attendees && evt.attendees.length > 0 && (
                                                    <div className="flex -space-x-1.5 mt-0.5">
                                                        {evt.attendees.slice(0, 3).map(t => (
                                                            <Avatar key={t.id} className="h-4 w-4 border border-background">
                                                                <AvatarImage src={t.avatar} />
                                                                <AvatarFallback className="text-[6px]">{t.name ? t.name.charAt(0) : "?"}</AvatarFallback>
                                                            </Avatar>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    });
                                })}

                                {/* Drag placeholder */}
                                {isDragging && dragStart && dragEnd && (
                                    visibleDays.map((day, colIdx) => {
                                        if (day.toDateString() !== dragStart.date.toDateString()) return null;
                                        const sMin = Math.min(dragStart.hour * 60 + dragStart.minute, dragEnd.hour * 60 + dragEnd.minute);
                                        const eMin = Math.max(dragStart.hour * 60 + dragStart.minute, dragEnd.hour * 60 + dragEnd.minute);
                                        const topPx = ((sMin - displayHours[0] * 60) / 15) * SLOT_HEIGHT;
                                        const heightPx = Math.max(Math.abs((eMin - sMin) / 15 * SLOT_HEIGHT), SLOT_HEIGHT);
                                        return (
                                            <div key="drag" className="absolute rounded-md border-2 border-dashed border-primary/50 bg-primary/10 z-20 pointer-events-none"
                                                style={{ top: `${topPx}px`, height: `${heightPx}px`, left: `calc(56px + ${colIdx} * ((100% - 56px) / ${visibleDays.length}) + 2px)`, width: `calc((100% - 56px) / ${visibleDays.length} - 4px)` }}
                                            />
                                        );
                                    })
                                )}

                                {/* Current time indicator */}
                                {visibleDays.some(d => d.toDateString() === today.toDateString()) && (() => {
                                    const nowMin = today.getHours() * 60 + today.getMinutes();
                                    if (nowMin < displayHours[0] * 60 || nowMin > (displayHours[displayHours.length - 1] + 1) * 60) return null;
                                    const topPx = ((nowMin - displayHours[0] * 60) / 15) * SLOT_HEIGHT;
                                    const nowH = today.getHours();
                                    const nowM = today.getMinutes();
                                    const timeStr = `${nowH.toString().padStart(2, "0")}:${nowM.toString().padStart(2, "0")}`;
                                    return (
                                        <div className="absolute left-0 right-0 z-30 flex items-center pointer-events-none" style={{ top: `${topPx}px` }}>
                                            {/* Time badge */}
                                            <div className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-sm ml-1 whitespace-nowrap w-[40px] flex justify-center items-center">
                                                {timeStr}
                                            </div>
                                            <div className="flex-1 h-[2px] bg-destructive" />
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Right Sidebar */}
                <PlannerRightSidebar
                    isOpen={sidebarOpen}
                    onToggle={() => setSidebarOpen(prev => !prev)}
                    currentDate={currentDate}
                    onDateSelect={date => setCurrentDate(date)}
                    visibleDays={visibleDays}
                />
            </div>

            {/* Quick Event / Edit Popover */}
            {popoverMode && (
                <PlannerQuickEvent
                    mode={popoverMode}
                    data={quickEventData}
                    onChange={setQuickEventData}
                    onSave={handleSaveEvent}
                    onDelete={popoverMode === "edit" ? handleDeleteEvent : undefined}
                    onClose={closePopover}
                    onExpand={expandToFullForm}
                    position={popoverPosition}
                    selectedEvent={selectedEvent}
                />
            )}

            {/* Settings Modal */}
            <PlannerSettingsModal 
                open={showSettings} 
                onClose={() => setShowSettings(false)} 
                showWeekends={showWeekends}
                onShowWeekendsChange={setShowWeekends}
                startOfWeek={startOfWeek}
                onStartOfWeekChange={setStartOfWeek}
            />
        </div>
    );
};

export default Planner;
