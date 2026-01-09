import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import FeedFilters from "@/components/feed/FeedFilters";
import FeedCard from "@/components/feed/FeedCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const feedItems = [
  {
    id: "1",
    type: "project" as const,
    title: "SolarSense - Farm Monitoring",
    description: "Building low-cost solar sensors for farmers to monitor soil conditions and optimize crop yield. Looking for passionate individuals to join our mission.",
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800",
    author: {
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      role: "Founder",
    },
    tags: ["IoT", "Agriculture", "Climate Tech", "Hardware"],
    lookingFor: ["Developer", "Designer"],
    stats: { likes: 45, comments: 12 },
    timestamp: "2 hours ago",
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
    tags: ["Climate Tech", "Mobile", "React Native"],
    lookingFor: ["Marketing", "Business"],
    stats: { likes: 89, comments: 23 },
    timestamp: "5 hours ago",
    stage: "Beta",
  },
  {
    id: "3",
    type: "project" as const,
    title: "MindfulAI - Mental Health Assistant",
    description: "AI-powered mental health support that understands context and provides empathetic responses. Currently in research phase.",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800",
    author: {
      name: "Emily Zhang",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      role: "Researcher",
    },
    tags: ["AI", "HealthTech", "Research", "NLP"],
    lookingFor: ["Researcher", "Developer"],
    stats: { likes: 156, comments: 34 },
    timestamp: "1 day ago",
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
    tags: ["EdTech", "AI", "UX Design"],
    stats: { likes: 67, comments: 18 },
    timestamp: "2 days ago",
    stage: "MVP",
  },
];

const trendingPeople = [
  { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", role: "Founder", score: 95 },
  { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", role: "Developer", score: 92 },
  { name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", role: "Designer", score: 88 },
];

const Index = () => {
  const [filters, setFilters] = useState({ type: "all", role: "all", tags: [] as string[] });

  return (
    <AppLayout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Discovery Feed</h1>
            <p className="text-muted-foreground">Explore projects, updates, and opportunities</p>
          </div>

          <div className="grid lg:grid-cols-[1fr,320px] gap-6">
            {/* Main Feed - Continuous scroll (no Load More) */}
            <div className="space-y-6">
              <FeedFilters onFiltersChange={setFilters} />
              
              <div className="space-y-6">
                {feedItems.map((item) => (
                  <FeedCard key={item.id} {...item} />
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Trending People */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Trending Creators</h3>
                </div>
                <div className="space-y-3">
                  {trendingPeople.map((person, i) => (
                    <Link
                      key={i}
                      to={`/profile/${person.name}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={person.avatar} />
                        <AvatarFallback>{person.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{person.name}</p>
                        <p className="text-xs text-muted-foreground">{person.role}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {person.score}
                      </Badge>
                    </Link>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-3" asChild>
                  <Link to="/people">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </Card>

              {/* Suggested Projects */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Projects Looking for You</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-sm mb-1">GreenGrid Energy</p>
                    <p className="text-xs text-muted-foreground mb-2">Looking for Frontend Developer</p>
                    <Badge variant="outline" className="text-xs">90% match</Badge>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-sm mb-1">HealthSync</p>
                    <p className="text-xs text-muted-foreground mb-2">Looking for UI Designer</p>
                    <Badge variant="outline" className="text-xs">85% match</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-3" asChild>
                  <Link to="/browse">
                    Browse All Projects
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;