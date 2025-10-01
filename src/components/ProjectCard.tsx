import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Users, TrendingUp, Heart } from "lucide-react";

interface ProjectCardProps {
  title: string;
  description: string;
  founderName: string;
  founderAvatar?: string;
  coverImage?: string;
  tags: string[];
  stage: string;
  contributors: number;
  progress: number;
  daysLeft?: number;
}

const ProjectCard = ({
  title,
  description,
  founderName,
  founderAvatar,
  coverImage,
  tags,
  stage,
  contributors,
  progress,
  daysLeft,
}: ProjectCardProps) => {
  return (
    <Card className="group overflow-hidden border-border hover:shadow-[var(--shadow-medium)] transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden bg-muted">
        {coverImage ? (
          <img 
            src={coverImage} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-accent/20" />
        )}
        
        <div className="absolute top-3 right-3">
          <Button size="icon" variant="ghost" className="h-8 w-8 bg-card/80 backdrop-blur hover:bg-card">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-card/90 backdrop-blur text-foreground border-0">
            {stage}
          </Badge>
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold line-clamp-1 group-hover:text-secondary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6 border-2 border-background">
            <AvatarImage src={founderAvatar} />
            <AvatarFallback className="text-xs">{founderName[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">by {founderName}</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{contributors}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>{progress}%</span>
            </div>
          </div>
          {daysLeft && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{daysLeft}d left</span>
            </div>
          )}
        </div>
        
        <Button className="w-full" variant="outline" asChild>
          <a href="/project/1">View Project</a>
        </Button>
      </div>
    </Card>
  );
};

export default ProjectCard;
