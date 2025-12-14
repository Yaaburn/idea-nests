import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Hash, 
  Send, 
  Paperclip, 
  Smile, 
  AtSign,
  MessageSquare,
  Pin,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  author: {
    name: string;
    avatar: string;
  };
  timestamp: string;
  isPinned?: boolean;
  reactions?: { emoji: string; count: number }[];
}

interface Channel {
  id: string;
  name: string;
  unread: number;
}

const channels: Channel[] = [
  { id: "1", name: "project-general", unread: 3 },
  { id: "2", name: "design-feedback", unread: 0 },
  { id: "3", name: "development", unread: 1 },
  { id: "4", name: "testing", unread: 0 },
];

const messages: Message[] = [
  {
    id: "1",
    content: "Hey team! I just pushed the latest firmware update. Please review when you get a chance. 🚀",
    author: { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
    timestamp: "10:30 AM",
    reactions: [{ emoji: "🔥", count: 2 }, { emoji: "👍", count: 3 }],
  },
  {
    id: "2",
    content: "Great work! I'll take a look at the sensor calibration logic this afternoon.",
    author: { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
    timestamp: "10:45 AM",
  },
  {
    id: "3",
    content: "The new mobile app wireframes are ready for review. I've uploaded them to the Files section. Let me know your thoughts!",
    author: { name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
    timestamp: "11:15 AM",
    isPinned: true,
    reactions: [{ emoji: "❤️", count: 4 }],
  },
  {
    id: "4",
    content: "@maria The dashboard looks amazing! Just one suggestion - can we make the data visualization section more prominent?",
    author: { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
    timestamp: "11:30 AM",
  },
  {
    id: "5",
    content: "Sure thing! I'll update it and share a new version by EOD.",
    author: { name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
    timestamp: "11:35 AM",
    reactions: [{ emoji: "👍", count: 1 }],
  },
];

const Discussions = () => {
  const [activeChannel, setActiveChannel] = useState("1");
  const [newMessage, setNewMessage] = useState("");

  return (
    <div className="flex gap-6 h-[600px]">
      {/* Channels Sidebar */}
      <Card className="w-64 p-4 flex-shrink-0">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Channels
        </h3>
        <div className="space-y-1">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                activeChannel === channel.id 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Hash className="h-4 w-4 flex-shrink-0" />
              <span className="truncate flex-1">{channel.name}</span>
              {channel.unread > 0 && (
                <Badge className="gradient-primary text-xs px-1.5 h-5">
                  {channel.unread}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Messages Area */}
      <Card className="flex-1 flex flex-col">
        {/* Channel Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">
              {channels.find(c => c.id === activeChannel)?.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pin className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={cn(
                "flex gap-3 group",
                message.isPinned && "bg-primary/5 -mx-4 px-4 py-2 rounded-lg"
              )}
            >
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarImage src={message.author.avatar} />
                <AvatarFallback>{message.author.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{message.author.name}</span>
                  <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                  {message.isPinned && (
                    <Badge variant="secondary" className="text-xs">
                      <Pin className="h-3 w-3 mr-1" />
                      Pinned
                    </Badge>
                  )}
                </div>
                <p className="text-sm">{message.content}</p>
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {message.reactions.map((reaction, i) => (
                      <button
                        key={i}
                        className="flex items-center gap-1 px-2 py-0.5 bg-muted rounded-full text-xs hover:bg-muted/80 transition-colors"
                      >
                        <span>{reaction.emoji}</span>
                        <span>{reaction.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
              <Paperclip className="h-4 w-4" />
            </Button>
            <div className="flex-1 relative">
              <Input 
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <AtSign className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button size="icon" className="gradient-primary h-9 w-9 flex-shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Discussions;
