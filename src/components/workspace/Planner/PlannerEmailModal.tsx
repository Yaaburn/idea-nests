import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Send, CheckCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Attendee } from "./PlannerTypes";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  attendees: Attendee[];
  eventTitle: string;
}

const PlannerEmailModal = ({ open, onClose, attendees, eventTitle }: Props) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleAll = () => {
    if (selected.size === attendees.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(attendees.map(a => a.id)));
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleSend = () => {
    toast.success(`Email notification sent to ${selected.size} participant(s) for "${eventTitle}"`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Send Email Notification
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Select participants to notify about <strong>"{eventTitle}"</strong>
        </p>

        <div className="space-y-1 max-h-60 overflow-y-auto">
          {attendees.map(a => (
            <label
              key={a.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={selected.has(a.id)}
                onCheckedChange={() => toggle(a.id)}
              />
              <Avatar className="h-7 w-7">
                <AvatarImage src={a.avatar} />
                <AvatarFallback className="text-[10px]">{a.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{a.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{a.email || "No email"}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={toggleAll}>
            <CheckCheck className="h-4 w-4 mr-1" />
            {selected.size === attendees.length ? "Deselect All" : "Select All"}
          </Button>
          <Button size="sm" onClick={handleSend} disabled={selected.size === 0}>
            <Send className="h-4 w-4 mr-1" />
            Send ({selected.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlannerEmailModal;
