import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  replies?: Comment[];
}

const mockComments: Comment[] = [
  {
    id: "1",
    author: {
      name: "Alex Kim",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
    content: "Dự án tuyệt vời! Mình rất quan tâm đến phần IoT.",
    timestamp: "2 giờ trước",
    replies: [
      {
        id: "1-1",
        author: {
          name: "Sarah Chen",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        },
        content: "Cảm ơn bạn! Mình có thể chia sẻ thêm nếu bạn quan tâm.",
        timestamp: "1 giờ trước",
      },
    ],
  },
  {
    id: "2",
    author: {
      name: "Maria Lopez",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    },
    content: "Góp ý nhỏ về UI: nên thêm dark mode cho app.",
    timestamp: "3 giờ trước",
  },
];

interface CommentSectionProps {
  postId: string;
  isExpanded: boolean;
  commentCount: number;
}

const CommentSection = ({ postId, isExpanded, commentCount }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  if (!isExpanded) return null;

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: {
        name: "Bạn",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      },
      content: newComment.trim(),
      timestamp: "Vừa xong",
    };

    setComments((prev) => [comment, ...prev]);
    setNewComment("");
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyContent.trim()) return;

    const reply: Comment = {
      id: `${parentId}-${Date.now()}`,
      author: {
        name: "Bạn",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      },
      content: replyContent.trim(),
      timestamp: "Vừa xong",
    };

    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId
          ? { ...c, replies: [...(c.replies || []), reply] }
          : c
      )
    );
    setReplyContent("");
    setReplyingTo(null);
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={cn("flex gap-3", isReply && "ml-10 mt-2")}
    >
      <Avatar className={cn("flex-shrink-0", isReply ? "h-7 w-7" : "h-9 w-9")}>
        <AvatarImage src={comment.author.avatar} />
        <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-muted/50 rounded-xl px-3 py-2">
          <p className="text-sm font-medium">{comment.author.name}</p>
          <p className="text-sm text-foreground">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>{comment.timestamp}</span>
          {!isReply && (
            <button
              className="hover:text-primary transition-colors"
              onClick={() => setReplyingTo(comment.id)}
            >
              Trả lời
            </button>
          )}
        </div>

        {/* Reply input */}
        {replyingTo === comment.id && (
          <div className="flex gap-2 mt-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Viết phản hồi..."
              className="min-h-[60px] text-sm resize-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitReply(comment.id);
                }
                if (e.key === "Escape") {
                  setReplyingTo(null);
                  setReplyContent("");
                }
              }}
            />
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                className="h-7"
                onClick={() => handleSubmitReply(comment.id)}
                disabled={!replyContent.trim()}
              >
                <Send className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent("");
                }}
              >
                Hủy
              </Button>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies?.map((reply) => renderComment(reply, true))}
      </div>
    </div>
  );

  return (
    <div className="border-t px-4 py-3 space-y-4 animate-in slide-in-from-top-2 duration-200">
      {/* New comment input */}
      <div className="flex gap-3">
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" />
          <AvatarFallback>B</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Textarea
            ref={inputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Viết bình luận..."
            className="min-h-[40px] resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
          />
          <Button
            size="icon"
            className="h-10 w-10 flex-shrink-0 gradient-primary"
            onClick={handleSubmitComment}
            disabled={!newComment.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-4">
          Hãy là người đầu tiên bình luận về bài viết này.
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
