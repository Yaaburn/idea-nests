import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DoDItem } from "./taskTypes";
import { cn } from "@/lib/utils";
import { ListChecks } from "lucide-react";

interface DoDChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  dodItems: DoDItem[];
  onConfirm: () => void;
}

const DoDChecklistDialog = ({ open, onOpenChange, taskTitle, dodItems, onConfirm }: DoDChecklistDialogProps) => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const requiredItems = dodItems.filter(d => d.required);
  const allRequiredChecked = requiredItems.every(d => checked[d.id]);

  const toggle = (id: string) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirm = () => {
    onConfirm();
    setChecked({});
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ListChecks className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <AlertDialogTitle className="text-base">Definition of Done</AlertDialogTitle>
              <AlertDialogDescription className="text-xs mt-0.5">
                Confirm criteria for "{taskTitle}"
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          {dodItems.map((item) => (
            <label
              key={item.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                checked[item.id] ? "bg-emerald-500/5 border-emerald-500/30" : "hover:bg-muted/50"
              )}
            >
              <Checkbox checked={!!checked[item.id]} onCheckedChange={() => toggle(item.id)} />
              <span className="flex-1 text-sm">{item.label}</span>
              {item.required && <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">Required</Badge>}
            </label>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!allRequiredChecked}
            className={cn("rounded-xl", allRequiredChecked ? "gradient-primary text-white" : "")}
          >
            Confirm Done
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DoDChecklistDialog;
