import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye, User, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ActiveProjectCardProps {
  id: string;
  title: string;
  description: string;
  role: string;
  status: 'Ideation' | 'Building' | 'MVP' | 'Shipping';
  tags: string[];
  progress: number;
  daysActive: number;
  onViewContributions: () => void;
}

const ActiveProjectCard = ({
  id,
  title,
  description,
  role,
  status,
  tags,
  progress,
  daysActive,
  onViewContributions,
}: ActiveProjectCardProps) => {
  const navigate = useNavigate();

  const statusColors = {
    Ideation: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    Building: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    MVP: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    Shipping: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  };

  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{title}</h3>
            <Badge className={statusColors[status]}>{status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </div>

      {/* Role & Tags */}
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline" className="gap-1">
          <User className="h-3 w-3" />
          {role}
        </Badge>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {daysActive} days active
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {tags.slice(0, 4).map(tag => (
          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
        ))}
        {tags.length > 4 && (
          <Badge variant="secondary" className="text-xs">+{tags.length - 4}</Badge>
        )}
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* CTAs */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => navigate(`/project/${id}`)}
        >
          <Eye className="h-4 w-4 mr-1.5" />
          View Project
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          className="flex-1"
          onClick={onViewContributions}
        >
          <User className="h-4 w-4 mr-1.5" />
          My Contributions
        </Button>
      </div>
    </Card>
  );
};

export default ActiveProjectCard;
