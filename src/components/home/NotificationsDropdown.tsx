import { useState } from "react";
import { Bell, Check, Users, MessageCircle, Briefcase, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "connection" | "mention" | "project" | "system";
  title: string;
  preview: string;
  avatar?: string;
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "connection",
    title: "Alex Kim muốn kết nối với bạn",
    preview: "Thêm vào mạng lưới của bạn",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    timestamp: "5 phút trước",
    read: false,
    actionRequired: true,
  },
  {
    id: "2",
    type: "mention",
    title: "Sarah Chen đã nhắc đến bạn",
    preview: "trong bài viết về SolarSense...",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    timestamp: "1 giờ trước",
    read: false,
  },
  {
    id: "3",
    type: "project",
    title: "EcoTrack cần thêm thành viên",
    preview: "Đang tìm Frontend Developer",
    avatar: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=800",
    timestamp: "3 giờ trước",
    read: true,
  },
  {
    id: "4",
    type: "system",
    title: "Hồ sơ của bạn đã được xem 50 lần",
    preview: "tuần này. Xem chi tiết.",
    timestamp: "1 ngày trước",
    read: true,
  },
];

const NotificationsDropdown = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeTab, setActiveTab] = useState("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleAcceptConnection = (id: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, actionRequired: false, read: true } : n
      )
    );
    // Toast would go here
  };

  const handleDeclineConnection = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "connection":
        return <Users className="h-4 w-4 text-primary" />;
      case "mention":
        return <MessageCircle className="h-4 w-4 text-accent" />;
      case "project":
        return <Briefcase className="h-4 w-4 text-green-500" />;
      case "system":
        return <Settings className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs gradient-primary border-0">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] p-0 bg-popover border shadow-xl"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Thông báo</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-primary"
            >
              <Check className="h-3 w-3 mr-1" />
              Đánh dấu đã đọc
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full rounded-none border-b bg-transparent h-10">
            <TabsTrigger
              value="all"
              className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Tất cả
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Chưa đọc ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className="h-[360px]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <Bell className="h-10 w-10 mb-3 opacity-50" />
                  <p className="text-sm">Không có thông báo mới.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                        !notification.read && "bg-primary/5"
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        {/* Avatar or Icon */}
                        <div className="relative flex-shrink-0">
                          {notification.avatar ? (
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={notification.avatar} />
                              <AvatarFallback>
                                {notification.title[0]}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              {getNotificationIcon(notification.type)}
                            </div>
                          )}
                          {!notification.read && (
                            <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-primary rounded-full border-2 border-background" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm line-clamp-1",
                              !notification.read && "font-semibold"
                            )}
                          >
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {notification.preview}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.timestamp}
                          </p>

                          {/* Connection Request Actions */}
                          {notification.type === "connection" &&
                            notification.actionRequired && (
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  className="h-7 text-xs gradient-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAcceptConnection(notification.id);
                                  }}
                                >
                                  Chấp nhận
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeclineConnection(notification.id);
                                  }}
                                >
                                  Từ chối
                                </Button>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsDropdown;
