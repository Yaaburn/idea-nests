import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MoreVertical,
  CheckCircle2,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Reminder, SmartSuggestion } from "./PlannerTypes";
import { DAYS } from "./PlannerTypes";

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  visibleDays?: Date[];
}

const mockSuggestions: SmartSuggestion[] = [
  { id: "1", tag: "Deep Work", time: "Today, 2PM", description: "Schedule 2 hours for Project Nebula Design System", type: "primary" },
  { id: "2", tag: "Meeting Buffer", time: "Wed, 11AM", description: "Add a 15m gap after the Board Meeting.", type: "secondary" },
];

const mockReminders: Reminder[] = [
  { id: "1", title: "Submit Quarterly Report", time: "In 2 hours", status: "urgent" },
  { id: "2", title: "Order Team Lunch", time: "Today, 11:30 AM", status: "normal" },
  { id: "3", title: "Review Mockups", time: "Completed", status: "completed" },
];

const PlannerRightSidebar = ({ isOpen, onToggle, currentDate, onDateSelect, visibleDays = [] }: Props) => {
  const [miniCalMonth, setMiniCalMonth] = useState(new Date(currentDate));

  useEffect(() => {
    setMiniCalMonth(new Date(currentDate));
  }, [currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
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

  const miniDays = getDaysInMonth(miniCalMonth);
  const today = new Date();

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="flex-shrink-0 w-10 border-l border-border bg-muted/30 flex items-start justify-center pt-4 hover:bg-muted/50 transition-colors"
      >
        <PanelRightOpen className="h-4 w-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <aside className="w-72 border-l border-border bg-muted/20 flex flex-col flex-shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Navigation</span>
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>

      {/* Mini Calendar */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {miniCalMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setMiniCalMonth(prev => { const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d; })}
              className="p-0.5 rounded hover:bg-muted"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setMiniCalMonth(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d; })}
              className="p-0.5 rounded hover:bg-muted"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-0">
          {DAYS.map(d => (
            <div key={d} className="text-[10px] text-center text-muted-foreground font-medium py-1">
              {d[0]}
            </div>
          ))}
          {miniDays.map((date, i) => {
            const isCurrentMonth = date.getMonth() === miniCalMonth.getMonth();
            const isToday = date.toDateString() === today.toDateString();
            
            let isSelected = false;
            let isSelectionStart = false;
            let isSelectionEnd = false;
            
            if (visibleDays.length > 0) {
               const startDay = new Date(visibleDays[0].toDateString()).getTime();
               const endDay = new Date(visibleDays[visibleDays.length - 1].toDateString()).getTime();
               const currDay = new Date(date.toDateString()).getTime();
               isSelected = currDay >= startDay && currDay <= endDay;
               isSelectionStart = currDay === startDay;
               isSelectionEnd = currDay === endDay;
            } else {
               isSelected = date.toDateString() === currentDate.toDateString();
               isSelectionStart = isSelected;
               isSelectionEnd = isSelected;
            }

            return (
              <div key={i} className="py-0.5">
                <button
                  onClick={() => onDateSelect(date)}
                  className={cn(
                    "text-[11px] w-full h-7 flex items-center justify-center transition-colors relative z-10",
                    // Apply rounded corners strictly to start/end of selection to form a block
                    (isSelectionStart || !isSelected) && "rounded-l-full",
                    (isSelectionEnd || !isSelected) && "rounded-r-full",
                    // Not in month styling
                    !isCurrentMonth && !isSelected && "text-muted-foreground/40",
                    isCurrentMonth && !isSelected && "text-foreground hover:bg-muted/50",
                    // Selected state: Gray block (if not strictly today-only)
                    isSelected && !isToday && "bg-muted text-foreground font-semibold hover:bg-muted/80",
                    // Today + Selected: keeps the solid active block, but makes today font primary
                    isSelected && isToday && visibleDays.length > 1 && "bg-muted text-primary font-bold hover:bg-muted/80",
                    // Today isolated logic 
                    isToday && (!isSelected || visibleDays.length <= 1) && "bg-primary text-primary-foreground font-bold"
                  )}
                >
                  {/* For isolated currently selected day that is not today, we can just use the gray block logic above */}
                  {date.getDate()}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Smart Suggestions */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Smart Suggestions</span>
        </div>
        <div className="space-y-2">
          {mockSuggestions.map(s => (
            <div
              key={s.id}
              className={cn(
                "rounded-lg p-3 space-y-2",
                s.type === "primary" ? "bg-primary/10 border border-primary/20" : "bg-card border border-border"
              )}
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className={cn(
                  "text-[10px]",
                  s.type === "primary" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {s.tag}
                </Badge>
                <span className={cn(
                  "text-[10px] font-medium",
                  s.type === "primary" ? "text-primary" : "text-muted-foreground"
                )}>
                  {s.time}
                </span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{s.description}</p>
              {s.type === "primary" && (
                <Button size="sm" className="w-full text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground">
                  Accept Suggestion
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reminders */}
      <div className="px-4 pb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">Reminders</span>
        <div className="space-y-1">
          {mockReminders.map(r => (
            <div key={r.id} className="flex items-center gap-3 py-2 group">
              <div className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                r.status === "urgent" && "bg-red-500",
                r.status === "normal" && "bg-primary",
                r.status === "completed" && "bg-muted-foreground/40"
              )} />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm truncate",
                  r.status === "completed" && "line-through text-muted-foreground"
                )}>
                  {r.title}
                </p>
                <p className="text-[10px] text-muted-foreground">{r.time}</p>
              </div>
              {r.status === "completed" ? (
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
              ) : (
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default PlannerRightSidebar;
