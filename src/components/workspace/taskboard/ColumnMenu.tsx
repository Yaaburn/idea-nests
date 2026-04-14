import { memo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Plus,
  Pencil,
  ArrowDownWideNarrow,
  Trash2,
  XCircle,
} from "lucide-react";

interface ColumnMenuProps {
  columnId: string;
  onAddTask: () => void;
  onRenameColumn: () => void;
  onSortByPriority: () => void;
  onClearTasks: () => void;
  onDeleteColumn: () => void;
}

const ColumnMenu = memo(({ onAddTask, onRenameColumn, onSortByPriority, onClearTasks, onDeleteColumn }: ColumnMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl bg-popover">
        <DropdownMenuItem onClick={onAddTask} className="gap-2 cursor-pointer">
          <Plus className="h-4 w-4" /> Add new task
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onRenameColumn} className="gap-2 cursor-pointer">
          <Pencil className="h-4 w-4" /> Edit column
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSortByPriority} className="gap-2 cursor-pointer">
          <ArrowDownWideNarrow className="h-4 w-4" /> Sort by priority
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onClearTasks} className="gap-2 cursor-pointer text-amber-600 focus:text-amber-600">
          <XCircle className="h-4 w-4" /> Clear all tasks
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDeleteColumn} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4" /> Delete column
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

ColumnMenu.displayName = "ColumnMenu";
export default ColumnMenu;
