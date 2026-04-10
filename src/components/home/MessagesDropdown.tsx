import { useState } from "react";
import { MessageSquare, Search, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  user: {
    name: string;
    avatar: string;
    online?: boolean;
  };
  lastMessage: string;
  timestamp: string;
  unread: number;
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    user: {
      name: "Alex Kim",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      online: true,
    },
    lastMessage: "Dự án của bạn rất hay! Mình muốn hợp tác.",
    timestamp: "2 phút",
    unread: 2,
  },
  {
    id: "2",
    user: {
      name: "Maria Lopez",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      online: true,
    },
    lastMessage: "Cảm ơn bạn đã kết nối!",
    timestamp: "1 giờ",
    unread: 0,
  },
  {
    id: "3",
    user: {
      name: "Emily Zhang",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      online: false,
    },
    lastMessage: "Hẹn gặp lại bạn tuần tới nhé.",
    timestamp: "3 giờ",
    unread: 1,
  },
  {
    id: "4",
    user: {
      name: "David Park",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      online: false,
    },
    lastMessage: "Tài liệu đã gửi qua email cho bạn.",
    timestamp: "1 ngày",
    unread: 0,
  },
];

interface MessagesDropdownProps {
  onOpenChat: (conversation: Conversation) => void;
}

const MessagesDropdown = ({ onOpenChat }: MessagesDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const totalUnread = mockConversations.reduce((sum, c) => sum + c.unread, 0);

  const filteredConversations = mockConversations.filter((c) =>
    c.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenConversation = (conversation: Conversation) => {
    setOpen(false);
    onOpenChat(conversation);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageSquare className="h-5 w-5" />
          {totalUnread > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs gradient-accent border-0">
              {totalUnread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[360px] p-0 bg-popover border shadow-xl"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Tin nhắn</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-muted/50 border-0"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="h-[340px]">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm">Không tìm thấy cuộc trò chuyện.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className={cn(
                    "w-full p-3 flex gap-3 hover:bg-muted/50 transition-colors text-left",
                    conversation.unread > 0 && "bg-primary/5"
                  )}
                  onClick={() => handleOpenConversation(conversation)}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.user.avatar} />
                      <AvatarFallback>
                        {conversation.user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.user.online && (
                      <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={cn(
                          "text-sm truncate",
                          conversation.unread > 0 && "font-semibold"
                        )}
                      >
                        {conversation.user.name}
                      </p>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {conversation.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-xs truncate",
                          conversation.unread > 0
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {conversation.lastMessage}
                      </p>
                      {conversation.unread > 0 && (
                        <Badge className="h-5 min-w-[20px] px-1.5 flex-shrink-0 gradient-primary text-xs">
                          {conversation.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default MessagesDropdown;
