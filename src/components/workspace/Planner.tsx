import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon,
  Clock
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
  },
  {
    id: "2",
    title: "Design Review",
    date: "2025-01-14",
    startTime: "14:00",
    endTime: "15:00",
    color: "bg-secondary",
    type: "meeting",
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

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const Planner = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 13)); // Jan 13, 2025

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
      if (days.length > 42) break; // Max 6 weeks
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return mockEvents.filter((e) => e.date === dateStr);
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

  const weekDays = getWeekDays();
  const monthDays = getMonthDays();
  const today = new Date();

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

          <Button className="gradient-primary text-white">
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
                const events = getEventsForDate(date);
                return (
                  <div
                    key={i}
                    className={cn(
                      "min-h-[100px] p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-muted/50 transition-colors",
                      !isCurrentMonth && "bg-muted/30 text-muted-foreground"
                    )}
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
                      {events.slice(0, 2).map((event) => (
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
                      {events.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{events.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week View */}
        {viewMode === "week" && (
          <div>
            {/* Day Headers */}
            <div className="grid grid-cols-8 border-b">
              <div className="p-3 border-r" /> {/* Time column header */}
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
            {/* Time Grid */}
            <div className="max-h-[500px] overflow-y-auto">
              {HOURS.slice(8, 20).map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b">
                  <div className="p-2 text-xs text-muted-foreground text-right pr-3 border-r">
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                  {weekDays.map((date, dayIndex) => {
                    const events = getEventsForDate(date).filter((e) => {
                      const eventHour = parseInt(e.startTime.split(":")[0]);
                      return eventHour === hour;
                    });
                    return (
                      <div
                        key={dayIndex}
                        className="min-h-[60px] p-1 border-r last:border-r-0 hover:bg-muted/30 cursor-pointer"
                      >
                        {events.map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "text-xs px-2 py-1 rounded text-white mb-1",
                              event.color
                            )}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="opacity-80">
                              {event.startTime} - {event.endTime}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day View */}
        {viewMode === "day" && (
          <div>
            <div className="max-h-[600px] overflow-y-auto">
              {HOURS.slice(7, 21).map((hour) => {
                const events = getEventsForDate(currentDate).filter((e) => {
                  const eventHour = parseInt(e.startTime.split(":")[0]);
                  return eventHour === hour;
                });
                return (
                  <div key={hour} className="flex border-b">
                    <div className="w-20 p-3 text-sm text-muted-foreground text-right border-r shrink-0">
                      {hour.toString().padStart(2, "0")}:00
                    </div>
                    <div className="flex-1 min-h-[70px] p-2 hover:bg-muted/30 cursor-pointer">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "px-3 py-2 rounded text-white mb-1",
                            event.color
                          )}
                        >
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm opacity-80 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {event.startTime} - {event.endTime}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Empty State */}
      {viewMode === "day" && getEventsForDate(currentDate).length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No events scheduled for this day</p>
          <Button variant="link" className="mt-2">
            Add an event
          </Button>
        </div>
      )}
    </div>
  );
};

export default Planner;
