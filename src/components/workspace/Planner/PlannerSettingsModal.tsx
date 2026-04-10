import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";

interface PlannerSettingsModalProps {
  open: boolean;
  onClose: () => void;
  showWeekends: boolean;
  onShowWeekendsChange: (v: boolean) => void;
  startOfWeek: string;
  onStartOfWeekChange: (v: string) => void;
}

export function PlannerSettingsModal({ 
  open, 
  onClose, 
  showWeekends, 
  onShowWeekendsChange,
  startOfWeek,
  onStartOfWeekChange
}: PlannerSettingsModalProps) {
  const [showWeekNumbers, setShowWeekNumbers] = useState(false);
  const [askTimezone, setAskTimezone] = useState(false);
  const [language, setLanguage] = useState("en");
  const [timeFormat, setTimeFormat] = useState("24h");
  const [theme, setTheme] = useState("auto");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" /> Calendar Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          {/* Calendar View */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Calendar View</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Show weekends</p><p className="text-[11px] text-muted-foreground">Display Sat & Sun columns</p></div>
                <Switch checked={showWeekends} onCheckedChange={onShowWeekendsChange} />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Show week numbers</p><p className="text-[11px] text-muted-foreground">Display week number on the left</p></div>
                <Switch checked={showWeekNumbers} onCheckedChange={setShowWeekNumbers} />
              </div>
            </div>
          </div>
          <div className="h-px bg-border/50" />
          {/* Navigation */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Calendar Navigation</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Start of week</p>
                <Select value={startOfWeek} onValueChange={onStartOfWeekChange}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[10px] text-muted-foreground">💡 Press <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">T</kbd> to go to today</p>
            </div>
          </div>
          <div className="h-px bg-border/50" />
          {/* Meetings */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Meetings</h4>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Ask to change timezone</p><p className="text-[11px] text-muted-foreground">Prompt when timezone differs from calendar</p></div>
              <Checkbox checked={askTimezone} onCheckedChange={(c) => setAskTimezone(!!c)} />
            </div>
          </div>
          <div className="h-px bg-border/50" />
          {/* Language */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Language</h4>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="vi">Tiếng Việt</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="ko">한국어</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-px bg-border/50" />
          {/* Time Format */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Time Format</h4>
            <Select value={timeFormat} onValueChange={setTimeFormat}>
              <SelectTrigger className="w-full h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24-hour (14:00)</SelectItem>
                <SelectItem value="12h">12-hour (2:00 PM)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-px bg-border/50" />
          {/* Theme */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Theme</h4>
            <div className="flex gap-3">
              {(["light", "dark", "auto"] as const).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="theme" value={t} checked={theme === t} onChange={() => setTheme(t)}
                    className="w-4 h-4 accent-[hsl(var(--primary))]" />
                  <span className="text-sm capitalize">{t === "auto" ? "Auto (System)" : t}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
