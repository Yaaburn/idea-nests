import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CommentSection from "@/components/home/CommentSection";
import SaveToFavoritesModal from "@/components/home/SaveToFavoritesModal";
import ShareModal from "@/components/home/ShareModal";

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
    verified?: boolean;
  };
  projectName?: string;
  tags: string[];
  lookingFor?: string[];
  stats: {
    likes: number;
    comments: number;
  };
  timestamp: string;
  stage?: string;
  onMessage?: (userId: string, userName: string, userAvatar: string) => void;
}

const FeedCard = ({
  id,
  type,
  title,
  description,
  image,
  author,
  projectName,
  tags,
  lookingFor,
  stats,
  timestamp,
  stage,
  onMessage,
}: FeedCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(stats.likes);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const handleLike = useCallback(async () => {
    if (likeLoading) return;
    
    setLikeLoading(true);
    
    // Optimistic UI update
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300));
    setLikeLoading(false);
  }, [liked, likeLoading]);

  const handleSave = () => {
    setShowSaveModal(true);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleComment = () => {
    setShowComments((prev) => !prev);
  };

  const shouldTruncate = description.length > 200;
  const displayDescription = shouldTruncate && !isExpanded
    ? description.slice(0, 200) + "..."
    : description;

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group bg-card">
        {/* Header */}
        <div className="p-4 pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 group/author">
              <Link to={`/profile/${author.name}`}>
                <Avatar className="h-11 w-11 border-2 border-primary/10 group-hover/author:border-primary/30 transition-colors">
                  <AvatarImage src={author.avatar} />
                  <AvatarFallback>{author.name[0]}</AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <div className="flex items-center gap-1.5">
                  <Link 
                    to={`/profile/${author.name}`}
                    className="font-semibold text-sm hover:text-primary transition-colors"
                  >
                    {author.name}
                  </Link>
                  {author.verified && (
                    <CheckCircle className="h-4 w-4 text-primary fill-primary/20" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                    {author.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground">• {timestamp}</span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem>Ẩn bài viết</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Báo cáo</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Project context line */}
          {projectName && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Link 
                to={`/project/${id}`}
                className="text-sm text-primary hover:underline font-medium"
              >
                {projectName}
              </Link>
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Looking For */}
          {lookingFor && lookingFor.length > 0 && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Đang tìm:</span>
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
          </Link>
          <p className="text-muted-foreground text-sm mb-2">
            {displayDescription}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              {isExpanded ? (
                <>
                  Thu gọn <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Xem thêm <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          )}

          {/* Image */}
          {image && (
            <Link to={`/project/${id}`} className="block mt-4">
              <div className="relative rounded-lg overflow-hidden aspect-video bg-muted">
                <img 
                  src={image} 
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {stage && (
                  <Badge className="absolute top-3 right-3 gradient-subtle text-primary font-medium">
                    {stage}
                  </Badge>
                )}
              </div>
            </Link>
          )}

          {/* Tags (if no project context shown above) */}
          {!projectName && (
            <div className="flex flex-wrap gap-2 mt-4">
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
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "h-9 px-3 transition-colors",
                liked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-primary"
              )}
              onClick={handleLike}
              disabled={likeLoading}
            >
              <Heart className={cn("h-5 w-5 mr-1.5", liked && "fill-current")} />
              <span className="text-sm font-medium">{likeCount}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "h-9 px-3",
                showComments ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
              onClick={handleComment}
            >
              <MessageCircle className="h-5 w-5 mr-1.5" />
              <span className="text-sm font-medium">{stats.comments}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 px-3 text-muted-foreground hover:text-primary"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "h-9 px-3",
                saved ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
              onClick={handleSave}
            >
              <Bookmark className={cn("h-5 w-5", saved && "fill-current")} />
            </Button>
          </div>
          {onMessage && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary"
              onClick={() => onMessage(id, author.name, author.avatar)}
            >
              Nhắn tin
            </Button>
          )}
        </div>

        {/* Comments Section */}
        <CommentSection 
          postId={id} 
          isExpanded={showComments}
          commentCount={stats.comments}
        />
      </Card>

      {/* Modals */}
      <SaveToFavoritesModal
        open={showSaveModal}
        onOpenChange={setShowSaveModal}
        postTitle={title}
      />
      <ShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        postId={id}
        postTitle={title}
      />
    </>
  );
};

export default FeedCard;
