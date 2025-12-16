import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DayData {
  date: Date;
  count: number;
  events?: string[];
}

interface CalendarHeatmapProps {
  data: DayData[];
  startDate: Date;
  endDate: Date;
}

const getIntensityClass = (count: number) => {
  if (count === 0) return "bg-muted/50";
  if (count <= 2) return "bg-primary/20";
  if (count <= 5) return "bg-primary/40";
  if (count <= 10) return "bg-primary/60";
  return "bg-primary";
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const CalendarHeatmap = ({ data, startDate, endDate }: CalendarHeatmapProps) => {
  // Create a map for quick lookup
  const dataMap = new Map<string, DayData>();
  data.forEach((d) => {
    const key = d.date.toISOString().split("T")[0];
    dataMap.set(key, d);
  });

  // Generate all days in range
  const days: (DayData | null)[][] = [];
  let currentDate = new Date(startDate);
  let currentWeek: (DayData | null)[] = [];

  // Pad the first week
  const firstDayOfWeek = currentDate.getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }

  while (currentDate <= endDate) {
    const key = currentDate.toISOString().split("T")[0];
    const dayData = dataMap.get(key) || { date: new Date(currentDate), count: 0 };
    currentWeek.push(dayData);

    if (currentDate.getDay() === 6) {
      days.push(currentWeek);
      currentWeek = [];
    }

    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  }

  // Pad the last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    days.push(currentWeek);
  }

  // Calculate total activities and streak
  const totalActivities = data.reduce((sum, d) => sum + d.count, 0);
  const activeDays = data.filter((d) => d.count > 0).length;
  
  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let checkDate = new Date(today);
  
  while (true) {
    const key = checkDate.toISOString().split("T")[0];
    const dayData = dataMap.get(key);
    if (dayData && dayData.count > 0) {
      currentStreak++;
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }

  // Get month labels
  const monthLabels: { month: string; position: number }[] = [];
  let lastMonth = -1;
  days.forEach((week, weekIndex) => {
    const firstDay = week.find((d) => d !== null);
    if (firstDay) {
      const month = firstDay.date.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ month: MONTHS[month], position: weekIndex });
        lastMonth = month;
      }
    }
  });

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Activity Streak</h3>
          <p className="text-sm text-muted-foreground">Verified proof events over time</p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-2xl font-bold text-foreground">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">day streak</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{activeDays}</p>
            <p className="text-xs text-muted-foreground">active days</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{totalActivities}</p>
            <p className="text-xs text-muted-foreground">total events</p>
          </div>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex ml-8 mb-1">
        {monthLabels.map(({ month, position }) => (
          <span
            key={`${month}-${position}`}
            className="text-xs text-muted-foreground"
            style={{ marginLeft: position === 0 ? 0 : `${(position - (monthLabels[monthLabels.indexOf({ month, position }) - 1]?.position || 0)) * 14 - 24}px` }}
          >
            {month}
          </span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {DAYS.map((day, i) => (
            <span
              key={day}
              className={cn(
                "text-xs text-muted-foreground h-3 flex items-center",
                i % 2 === 1 ? "opacity-100" : "opacity-0"
              )}
            >
              {day}
            </span>
          ))}
        </div>

        {/* Weeks */}
        <div className="flex gap-1">
          {days.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <Tooltip key={dayIndex}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "w-3 h-3 rounded-sm transition-colors",
                        day ? getIntensityClass(day.count) : "bg-transparent"
                      )}
                    />
                  </TooltipTrigger>
                  {day && (
                    <TooltipContent>
                      <p className="font-medium">
                        {day.date.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {day.count} {day.count === 1 ? "event" : "events"}
                      </p>
                      {day.events && day.events.length > 0 && (
                        <ul className="text-xs mt-1 space-y-0.5">
                          {day.events.slice(0, 3).map((event, i) => (
                            <li key={i}>• {event}</li>
                          ))}
                          {day.events.length > 3 && (
                            <li className="text-muted-foreground">
                              +{day.events.length - 3} more
                            </li>
                          )}
                        </ul>
                      )}
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <span className="text-xs text-muted-foreground">Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-muted/50" />
          <div className="w-3 h-3 rounded-sm bg-primary/20" />
          <div className="w-3 h-3 rounded-sm bg-primary/40" />
          <div className="w-3 h-3 rounded-sm bg-primary/60" />
          <div className="w-3 h-3 rounded-sm bg-primary" />
        </div>
        <span className="text-xs text-muted-foreground">More</span>
      </div>
    </div>
  );
};
