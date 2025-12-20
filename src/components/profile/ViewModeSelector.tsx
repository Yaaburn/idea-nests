import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Users, Crown } from "lucide-react";

interface ViewModeSelectorProps {
  viewMode: 'public' | 'member' | 'leader';
  onChange: (mode: 'public' | 'member' | 'leader') => void;
}

const ViewModeSelector = ({ viewMode, onChange }: ViewModeSelectorProps) => {
  const modes = [
    { id: 'public' as const, label: 'Public', icon: Eye, description: 'Investor/Public view' },
    { id: 'member' as const, label: 'Member', icon: Users, description: 'Team member view' },
    { id: 'leader' as const, label: 'Leader', icon: Crown, description: 'Full access' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {modes.map((mode) => (
        <Button
          key={mode.id}
          variant={viewMode === mode.id ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onChange(mode.id)}
          className="gap-1.5 text-xs"
        >
          <mode.icon className="h-3.5 w-3.5" />
          {mode.label}
        </Button>
      ))}
    </div>
  );
};

export default ViewModeSelector;
