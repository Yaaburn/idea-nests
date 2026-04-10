import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { X, Minus, Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ChatWindow } from "./ChatDock";

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
}

// Mock messages for demo
const generateMockMessages = (userId: string): Message[] => [
  {
    id: "1",
    content: "Chào bạn! Rất vui được kết nối.",
    senderId: userId,
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: "2",
    content: "Chào bạn! Mình cũng rất vui. Dự án của bạn rất thú vị!",
    senderId: "me",
    timestamp: new Date(Date.now() - 3500000),
  },
  {
    id: "3",
    content: "Cảm ơn bạn. Bạn có muốn tham gia cùng mình không?",
    senderId: userId,
    timestamp: new Date(Date.now() - 3400000),
  },
];

interface FloatingChatWindowProps {
  window: ChatWindow;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onSendMessage: (message: string) => void;
}

const FloatingChatWindow = ({
  window,
  onClose,
  onMinimize,
  onMaximize,
  onSendMessage,
}: FloatingChatWindowProps) => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>(() =>
    generateMockMessages(window.user.id)
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when window opens
  useEffect(() => {
    if (!window.minimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [window.minimized]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      senderId: "me",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    onSendMessage(inputValue.trim());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Minimized state - show compact bar
  if (window.minimized) {
    return (
      <button
        onClick={onMaximize}
        className="flex items-center gap-2 h-12 px-3 bg-card border rounded-full shadow-lg hover:bg-muted transition-colors"
      >
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarImage src={window.user.avatar} />
            <AvatarFallback>{window.user.name[0]}</AvatarFallback>
          </Avatar>
          {window.user.online && (
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-card" />
          )}
        </div>
        <span className="text-sm font-medium max-w-[100px] truncate">
          {window.user.name}
        </span>
        {window.unread > 0 && (
          <Badge className="h-5 min-w-[20px] px-1.5 gradient-primary text-xs">
            {window.unread}
          </Badge>
        )}
      </button>
    );
  }

  // Full chat window
  return (
    <div className="w-[328px] h-[420px] bg-card border rounded-lg shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex-shrink-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={window.user.avatar} />
              <AvatarFallback>{window.user.name[0]}</AvatarFallback>
            </Avatar>
            {window.user.online && (
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-card" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{window.user.name}</p>
            {window.user.online && (
              <p className="text-xs text-green-500">Đang hoạt động</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onMinimize}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((message) => {
            const isMe = message.senderId === "me";
            return (
              <div
                key={message.id}
                className={cn("flex", isMe ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] px-3 py-2 rounded-2xl text-sm",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  )}
                >
                  {message.content}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-2 border-t">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
            <Smile className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Aa"
            className="min-h-[36px] max-h-[100px] resize-none border-0 bg-muted/50 focus-visible:ring-0 py-2"
            rows={1}
          />
          <Button
            size="icon"
            className="h-8 w-8 flex-shrink-0 gradient-primary"
            onClick={handleSend}
            disabled={!inputValue.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FloatingChatWindow;
