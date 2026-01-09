import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Bookmark, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedCardProps {
  id: string;
  type: "project" | "update" | "milestone";
  title: string;
  description: string;
  image?: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  tags: string[];
  lookingFor?: string[];
  stats: {
    likes: number;
    comments: number;
  };
  timestamp: string;
  stage?: string;
}

const FeedCard = ({
  id,
  type,
  title,
  description,
  image,
  author,
  tags,
  lookingFor,
  stats,
  timestamp,
  stage,
}: FeedCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between gap-3">
          <Link to={`/profile/${author.name}`} className="flex items-center gap-3 group/author">
            <Avatar className="h-10 w-10 border-2 border-primary/10 group-hover/author:border-primary/30 transition-colors">
              <AvatarImage src={author.avatar} />
              <AvatarFallback>{author.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm group-hover/author:text-primary transition-colors">
                {author.name}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                  {author.role}
                </Badge>
                <span className="text-xs text-muted-foreground">{timestamp}</span>
              </div>
            </div>
          </Link>
          {stage && (
            <Badge className="gradient-subtle text-primary font-medium">
              {stage}
            </Badge>
          )}
        </div>

        {/* Looking For */}
        {lookingFor && lookingFor.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Looking for:</span>
            {lookingFor.map((role) => (
              <Badge key={role} variant="outline" className="text-xs border-accent/50 text-accent">
                {role}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <Link to={`/project/${id}`}>
          <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
            {description}
          </p>
        </Link>

        {/* Image */}
        {image && (
          <Link to={`/project/${id}`} className="block mb-4">
            <div className="relative rounded-lg overflow-hidden aspect-video">
              <img 
                src={image} 
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 4}
            </Badge>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-primary">
            <Heart className="h-4 w-4 mr-1" />
            <span className="text-xs">{stats.likes}</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-primary">
            <MessageCircle className="h-4 w-4 mr-1" />
            <span className="text-xs">{stats.comments}</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-primary">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-primary">
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="text-primary" asChild>
          <Link to={`/project/${id}`}>
            View project
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
    </Card>
  );
};

export default FeedCard;
