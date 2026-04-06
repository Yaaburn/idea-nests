import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import FeedFilters from "@/components/feed/FeedFilters";
import FeedCard from "@/components/feed/FeedCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, Briefcase, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import ChatDock, { ChatWindow } from "@/components/home/ChatDock";
import { getCreatedProjects } from "@/lib/projectStore";

const feedItems = [
  {
    id: "1",
    type: "project" as const,
    title: "SolarSense - Farm Monitoring",
    description: "Building low-cost solar sensors for farmers to monitor soil conditions and optimize crop yield. Looking for passionate individuals to join our mission. We're currently in prototype phase and have already received interest from agricultural cooperatives in Vietnam.",
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800",
    author: {
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      role: "Founder",
      verified: true,
    },
    projectName: "SolarSense",
    tags: ["IoT", "Agriculture", "Climate Tech", "Hardware"],
    lookingFor: ["Developer", "Designer"],
    stats: { likes: 45, comments: 12 },
    timestamp: "2 giờ trước",
    stage: "Prototype",
  },
  {
    id: "2",
    type: "project" as const,
    title: "EcoTrack - Carbon Footprint Calculator",
    description: "Making sustainability accessible to everyone. Track your carbon footprint and get personalized recommendations to reduce your environmental impact.",
    image: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=800",
    author: {
      name: "Alex Kim",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      role: "Developer",
    },
    projectName: "EcoTrack",
    tags: ["Climate Tech", "Mobile", "React Native"],
    lookingFor: ["Marketing", "Business"],
    stats: { likes: 89, comments: 23 },
    timestamp: "5 giờ trước",
    stage: "Beta",
  },
  {
    id: "3",
    type: "project" as const,
    title: "MindfulAI - Mental Health Assistant",
    description: "AI-powered mental health support that understands context and provides empathetic responses. Currently in research phase with partnerships from leading universities.",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800",
    author: {
      name: "Emily Zhang",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      role: "Researcher",
      verified: true,
    },
    projectName: "MindfulAI",
    tags: ["AI", "HealthTech", "Research", "NLP"],
    lookingFor: ["Researcher", "Developer"],
    stats: { likes: 156, comments: 34 },
    timestamp: "1 ngày trước",
    stage: "Research",
  },
  {
    id: "4",
    type: "project" as const,
    title: "LearnFlow - Adaptive Education Platform",
    description: "Personalized learning paths powered by AI. Helping students learn at their own pace with interactive content.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
    author: {
      name: "Maria Lopez",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      role: "Designer",
    },
    projectName: "LearnFlow",
    tags: ["EdTech", "AI", "UX Design"],
    stats: { likes: 67, comments: 18 },
    timestamp: "2 ngày trước",
    stage: "MVP",
  },
];

const trendingPeople = [
  { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", role: "Founder", score: 95 },
  { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", role: "Developer", score: 92 },
  { name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", role: "Designer", score: 88 },
];

const suggestedProjects = [
  { name: "GreenGrid Energy", role: "Frontend Developer", match: 90 },
  { name: "HealthSync", role: "UI Designer", match: 85 },
];

const openRoles = [
  { title: "Full-stack Developer", project: "CleanTech Hub", type: "Full-time", location: "Remote" },
  { title: "UX Researcher", project: "EduStart", type: "Part-time", location: "Hybrid" },
];

const trendingTags = ["AI", "Climate Tech", "EdTech", "HealthTech", "Web3"];

const Index = () => {
  const [filters, setFilters] = useState({ type: "all", role: "all", tags: [] as string[] });

  // Merge published user projects into feed
  const allFeedItems = useMemo(() => {
    const publishedProjects = getCreatedProjects().filter(p => p.publishedToFeed);
    const userFeedItems = publishedProjects.map(p => ({
      id: p.id,
      type: "project" as const,
      title: p.title,
      description: p.vision || p.whyDoingThis || "Một dự án mới trên TalentNet.",
      image: p.coverImage || "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
      author: {
        name: "You",
        avatar: p.founderAvatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        role: "Founder",
        verified: false,
      },
      projectName: p.title,
      tags: p.tags,
      lookingFor: p.roles.map(r => r.title).slice(0, 2),
      stats: { likes: 0, comments: 0 },
      timestamp: "Vừa xong",
      stage: p.category || "Idea",
    }));
    return [...userFeedItems, ...feedItems];
  }, []);

  const [displayedItems, setDisplayedItems] = useState(allFeedItems.slice(0, 3));
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Chat windows state
  const [chatWindows, setChatWindows] = useState<ChatWindow[]>([]);

  // Infinite scroll
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const currentLength = displayedItems.length;
      const nextItems = allFeedItems.slice(currentLength, currentLength + 2);
      
      if (nextItems.length === 0) {
        setHasMore(false);
      } else {
        setDisplayedItems(prev => [...prev, ...nextItems]);
      }
      
      setLoading(false);
    }, 800);
  }, [loading, hasMore, displayedItems.length, allFeedItems]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore]);

  // Chat handlers
  const handleOpenChat = useCallback((conversation: { id: string; user: { name: string; avatar: string; online?: boolean } }) => {
    setChatWindows(prev => {
      const exists = prev.find(w => w.id === conversation.id);
      if (exists) {
        // If minimized, maximize it
        return prev.map(w => w.id === conversation.id ? { ...w, minimized: false } : w);
      }
      // Add new window
      return [...prev, {
        id: conversation.id,
        user: {
          id: conversation.id,
          name: conversation.user.name,
          avatar: conversation.user.avatar,
          online: conversation.user.online,
        },
        minimized: false,
        unread: 0,
      }];
    });
  }, []);

  const handleMessageFromPost = useCallback((userId: string, userName: string, userAvatar: string) => {
    handleOpenChat({
      id: userId,
      user: { name: userName, avatar: userAvatar, online: true },
    });
  }, [handleOpenChat]);

  const handleCloseChat = useCallback((id: string) => {
    setChatWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const handleMinimizeChat = useCallback((id: string) => {
    setChatWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: true } : w));
  }, []);

  const handleMaximizeChat = useCallback((id: string) => {
    setChatWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: false } : w));
  }, []);

  const handleSendMessage = useCallback((windowId: string, message: string) => {
    // In real app, this would send to API
    console.log(`Sending to ${windowId}: ${message}`);
  }, []);

  return (
    <AppLayout onOpenChat={handleOpenChat}>
      <div className="min-h-full">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1">Bảng tin</h1>
            <p className="text-muted-foreground text-sm">Khám phá dự án, cập nhật và cơ hội mới</p>
          </div>

          <div className="grid lg:grid-cols-[1fr,340px] gap-6">
            {/* Main Feed */}
            <div className="space-y-4">
              {/* Sticky Filters */}
              <div className="sticky top-16 z-30 -mx-4 px-4 py-2 bg-background/95 backdrop-blur-sm">
                <FeedFilters onFiltersChange={setFilters} />
              </div>
              
              {/* Feed Items */}
              <div className="space-y-4">
                {displayedItems.map((item) => (
                  <FeedCard 
                    key={item.id} 
                    {...item} 
                    onMessage={handleMessageFromPost}
                  />
                ))}
              </div>

              {/* Loading skeleton */}
              {loading && (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Card key={i} className="p-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-11 w-11 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-48 w-full rounded-lg" />
                    </Card>
                  ))}
                </div>
              )}

              {/* Infinite scroll trigger */}
              <div ref={loadMoreRef} className="h-10" />

              {/* End of feed */}
              {!hasMore && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Bạn đã xem hết bảng tin!</p>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4 hidden lg:block">
              {/* Trending Creators */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Người sáng tạo nổi bật</h3>
                </div>
                <div className="space-y-2">
                  {trendingPeople.map((person, i) => (
                    <Link
                      key={i}
                      to={`/profile/${person.name}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={person.avatar} />
                        <AvatarFallback>{person.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{person.name}</p>
                        <p className="text-xs text-muted-foreground">{person.role}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {person.score}
                      </Badge>
                    </Link>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" asChild>
                  <Link to="/people">
                    Xem tất cả
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </Card>

              {/* Open Roles */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Vị trí đang tuyển</h3>
                </div>
                <div className="space-y-3">
                  {openRoles.map((role, i) => (
                    <div key={i} className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium text-sm mb-1">{role.title}</p>
                      <p className="text-xs text-muted-foreground mb-2">{role.project}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">{role.type}</Badge>
                        <Badge variant="outline" className="text-xs">{role.location}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Suggested Projects */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Dự án phù hợp với bạn</h3>
                </div>
                <div className="space-y-2">
                  {suggestedProjects.map((project, i) => (
                    <div key={i} className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium text-sm mb-1">{project.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">Đang tìm {project.role}</p>
                      <Badge variant="outline" className="text-xs">{project.match}% phù hợp</Badge>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" asChild>
                  <Link to="/browse">
                    Xem thêm dự án
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </Card>

              {/* Trending Tags */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Chủ đề thịnh hành</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingTags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Chat Dock */}
      <ChatDock
        windows={chatWindows}
        onClose={handleCloseChat}
        onMinimize={handleMinimizeChat}
        onMaximize={handleMaximizeChat}
        onSendMessage={handleSendMessage}
      />
    </AppLayout>
  );
};

export default Index;
