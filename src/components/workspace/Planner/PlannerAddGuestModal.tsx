import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (guest: { name: string; email: string }) => void;
}

const PlannerAddGuestModal = ({ open, onClose, onAdd }: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleAdd = () => {
    if (!email.trim()) return;
    onAdd({ name: name.trim() || email.split("@")[0], email: email.trim() });
    setName("");
    setEmail("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add External Guest
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm">Guest Name</Label>
            <Input
              placeholder="e.g. John Doe"
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Email Address *</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="guest@example.com"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleAdd} disabled={!email.trim()}>
            <UserPlus className="h-4 w-4 mr-1" />
            Add Guest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlannerAddGuestModal;
