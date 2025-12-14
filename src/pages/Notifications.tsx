import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Bell, 
  MessageSquare, 
  UserPlus, 
  FolderKanban,
  CheckCircle,
  AtSign,
  Heart,
  Settings,
  Check,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Notification {
  id: string;
  type: "follow" | "project" | "invite" | "comment" | "mention" | "milestone";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link: string;
  actor?: {
    name: string;
    avatar: string;
  };
}

interface Conversation {
  id: string;
  participant: {
    name: string;
    avatar: string;
  };
  lastMessage: string;
  timestamp: string;
  unread: number;
}

const notifications: Notification[] = [
  {
    id: "1",
    type: "invite",
    title: "Project Invitation",
    description: "Alex Kim invited you to join EcoTrack as a Frontend Developer",
    timestamp: "5 min ago",
    read: false,
    link: "/project/2",
    actor: { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
  },
  {
    id: "2",
    type: "comment",
    title: "New Comment",
    description: "Maria Lopez commented on your project update",
    timestamp: "1 hour ago",
    read: false,
    link: "/project/1",
    actor: { name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
  },
  {
    id: "3",
    type: "milestone",
    title: "Milestone Completed",
    description: "SolarSense reached 'Prototype v1' milestone",
    timestamp: "3 hours ago",
    read: false,
    link: "/project/1",
  },
  {
    id: "4",
    type: "follow",
    title: "New Follower",
    description: "James Wilson started following you",
    timestamp: "Yesterday",
    read: true,
    link: "/profile/4",
    actor: { name: "James Wilson", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150" },
  },
  {
    id: "5",
    type: "mention",
    title: "Mentioned You",
    description: "Emily Zhang mentioned you in a discussion",
    timestamp: "2 days ago",
    read: true,
    link: "/workspace/1",
    actor: { name: "Emily Zhang", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150" },
  },
  {
    id: "6",
    type: "project",
    title: "Project Update",
    description: "GreenGrid project has a new update",
    timestamp: "3 days ago",
    read: true,
    link: "/project/3",
  },
];

const conversations: Conversation[] = [
  {
    id: "1",
    participant: { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
    lastMessage: "Sounds good! Let's schedule a call tomorrow.",
    timestamp: "10 min ago",
    unread: 2,
  },
  {
    id: "2",
    participant: { name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
    lastMessage: "The new designs are ready for review!",
    timestamp: "1 hour ago",
    unread: 1,
  },
  {
    id: "3",
    participant: { name: "James Wilson", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150" },
    lastMessage: "Thanks for the introduction. I'd love to learn more about the project.",
    timestamp: "Yesterday",
    unread: 0,
  },
  {
    id: "4",
    participant: { name: "Emily Zhang", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150" },
    lastMessage: "The ML model is performing better than expected!",
    timestamp: "3 days ago",
    unread: 0,
  },
];

const notificationIcons = {
  follow: UserPlus,
  project: FolderKanban,
  invite: UserPlus,
  comment: MessageSquare,
  mention: AtSign,
  milestone: CheckCircle,
};

const notificationColors = {
  follow: "bg-blue-500/10 text-blue-500",
  project: "bg-purple-500/10 text-purple-500",
  invite: "bg-green-500/10 text-green-500",
  comment: "bg-yellow-500/10 text-yellow-500",
  mention: "bg-pink-500/10 text-pink-500",
  milestone: "bg-primary/10 text-primary",
};

const Notifications = () => {
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadMessages = conversations.reduce((acc, c) => acc + c.unread, 0);

  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Notifications</h1>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>

          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="notifications" className="data-[state=active]:gradient-primary data-[state=active]:text-white gap-2">
                <Bell className="h-4 w-4" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="gradient-primary border-0 text-xs px-1.5">{unreadCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="messages" className="data-[state=active]:gradient-primary data-[state=active]:text-white gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
                {unreadMessages > 0 && (
                  <Badge className="gradient-accent border-0 text-xs px-1.5">{unreadMessages}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notifications">
              <Card>
                <div className="p-4 border-b flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {unreadCount} unread notifications
                  </span>
                  <Button variant="ghost" size="sm">
                    <Check className="h-4 w-4 mr-1" />
                    Mark all read
                  </Button>
                </div>
                <div className="divide-y">
                  {notifications.map((notification) => {
                    const Icon = notificationIcons[notification.type];
                    return (
                      <Link
                        key={notification.id}
                        to={notification.link}
                        className={cn(
                          "flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors",
                          !notification.read && "bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                          notificationColors[notification.type]
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{notification.title}</span>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {notification.description}
                          </p>
                          <span className="text-xs text-muted-foreground mt-1">
                            {notification.timestamp}
                          </span>
                        </div>
                        {notification.actor && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={notification.actor.avatar} />
                            <AvatarFallback>{notification.actor.name[0]}</AvatarFallback>
                          </Avatar>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="messages">
              <div className="grid md:grid-cols-[320px,1fr] gap-4">
                {/* Conversations List */}
                <Card className="p-2">
                  <div className="space-y-1">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setActiveConversation(conv.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                          activeConversation === conv.id
                            ? "bg-primary/10"
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conv.participant.avatar} />
                            <AvatarFallback>{conv.participant.name[0]}</AvatarFallback>
                          </Avatar>
                          {conv.unread > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-primary flex items-center justify-center text-xs text-white">
                              {conv.unread}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={cn("font-medium text-sm", conv.unread > 0 && "text-foreground")}>
                              {conv.participant.name}
                            </span>
                            <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                          </div>
                          <p className={cn(
                            "text-xs truncate",
                            conv.unread > 0 ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {conv.lastMessage}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Chat Area */}
                <Card className="flex flex-col min-h-[400px]">
                  {activeConversation ? (
                    <>
                      <div className="p-4 border-b flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={conversations.find(c => c.id === activeConversation)?.participant.avatar} />
                          <AvatarFallback>
                            {conversations.find(c => c.id === activeConversation)?.participant.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">
                          {conversations.find(c => c.id === activeConversation)?.participant.name}
                        </span>
                      </div>
                      <div className="flex-1 p-4">
                        {/* Messages would go here */}
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                          Select a conversation to view messages
                        </div>
                      </div>
                      <div className="p-4 border-t">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type a message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                          />
                          <Button className="gradient-primary">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      Select a conversation to start messaging
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default Notifications;
