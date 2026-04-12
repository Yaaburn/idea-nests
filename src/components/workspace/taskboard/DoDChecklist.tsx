import { useState, memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DoDCriterion } from "./types";

interface DoDChecklistProps {
  open: boolean;
  criteria: DoDCriterion[];
  taskTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DoDChecklist = memo(({ open, criteria, taskTitle, onConfirm, onCancel }: DoDChecklistProps) => {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allChecked = criteria.length > 0 && checked.size === criteria.length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Definition of Done ✅</DialogTitle>
          <DialogDescription className="text-sm">
            Xác nhận tất cả tiêu chí trước khi đánh dấu <strong>"{taskTitle}"</strong> là hoàn thành:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {criteria.map((c) => (
            <label key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <Checkbox checked={checked.has(c.id)} onCheckedChange={() => toggle(c.id)} />
              <span className="text-sm">{c.label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Hủy</Button>
          <Button className="flex-1 gradient-primary text-white" disabled={!allChecked} onClick={() => { setChecked(new Set()); onConfirm(); }}>
            Xác nhận hoàn thành
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

DoDChecklist.displayName = "DoDChecklist";
export default DoDChecklist;
