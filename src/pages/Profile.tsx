import { useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Link as LinkIcon, 
  Mail, 
  Calendar,
  Award,
  Users,
  MessageCircle,
  UserPlus,
  Briefcase
} from "lucide-react";

// Profile Components
import PersonalAnalyticsDashboard from "@/components/profile/PersonalAnalyticsDashboard";
import ActiveProjectCard from "@/components/profile/ActiveProjectCard";
import ContributionsDrawer from "@/components/profile/ContributionsDrawer";
import PersonalPoPTimeline from "@/components/profile/PersonalPoPTimeline";
import SkillsBreakdown from "@/components/profile/SkillsBreakdown";
import RegionalRankCard from "@/components/profile/RegionalRankCard";
import ViewModeSelector from "@/components/profile/ViewModeSelector";

const Profile = () => {
  const { id } = useParams();
  const [isFollowing, setIsFollowing] = useState(false);
  const [viewMode, setViewMode] = useState<'public' | 'member' | 'leader'>('public');
  const [contributionsOpen, setContributionsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');

  // Mock user data
  const user = {
    name: "Sarah Chen",
    username: "@sarahchen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    headline: "Climate tech founder | Building sustainable solutions for agriculture",
    location: "Biên Hòa",
    website: "sarahchen.com",
    email: "sarah@solarsense.io",
    joinedDate: "Jan 2024",
    stats: {
      projects: 3,
      contributions: 12,
      followers: 248,
      following: 156,
    },
    roles: ["Founder", "Designer", "Researcher"],
    verifications: [
      { type: "Identity", verified: true },
      { type: "Education", name: "Stanford University", verified: true },
      { type: "Project", name: "SolarSense", verified: true },
    ],
    experience: [
      {
        title: "Founder & CEO",
        company: "SolarSense",
        period: "2024 - Present",
        description: "Building low-cost solar sensors for farmers"
      },
      {
        title: "Research Scientist",
        company: "Stanford IoT Lab",
        period: "2021 - 2024",
        description: "Agricultural sensor systems research"
      },
    ],
  };

  const activeProjects = [
    {
      id: 'solarsense',
      title: "SolarSense - Farm Monitoring",
      description: "Building low-cost solar sensors for farmers to monitor soil conditions and optimize irrigation.",
      role: "Founder",
      status: 'Building' as const,
      tags: ["IoT", "Agriculture", "Hardware", "Climate Tech"],
      progress: 65,
      daysActive: 120,
    },
    {
      id: 'ecotrack',
      title: "EcoTrack - Carbon Footprint",
      description: "Platform for tracking and reducing personal carbon footprint with gamification.",
      role: "Frontend Lead",
      status: 'MVP' as const,
      tags: ["React", "Climate Tech", "Mobile"],
      progress: 85,
      daysActive: 45,
    },
  ];

  const handleViewContributions = (projectId: string, projectTitle: string) => {
    setSelectedProject(projectTitle);
    setContributionsOpen(true);
  };

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-background">
        {/* View Mode Selector (for demo) */}
        <div className="bg-muted/50 border-b py-2">
          <div className="container mx-auto px-4 lg:px-8 flex justify-end">
            <ViewModeSelector viewMode={viewMode} onChange={setViewMode} />
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* LEFT SIDEBAR (Sticky) */}
            <aside className="lg:w-72 flex-shrink-0">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Profile Card */}
                <Card className="p-6">
                  {/* Avatar */}
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Name & Headline */}
                  <div className="text-center mb-4">
                    <h1 className="text-xl font-bold mb-1">{user.name}</h1>
                    <p className="text-sm text-muted-foreground mb-2">{user.username}</p>
                    <p className="text-sm">{user.headline}</p>
                  </div>

                  {/* Location */}
                  <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4" />
                    <span>{user.location}</span>
                  </div>

                  {/* Role Tags */}
                  <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                    {user.roles.map(role => (
                      <Badge key={role} variant="secondary" className="text-xs">{role}</Badge>
                    ))}
                  </div>

                  {/* Verification Badges */}
                  <div className="space-y-2 mb-4">
                    {user.verifications.filter(v => v.verified).map((verification, index) => (
                      <Badge key={index} variant="outline" className="w-full justify-start gap-1.5 py-1.5">
                        <Award className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-xs">
                          {verification.type} {verification.name && `• ${verification.name}`}
                        </span>
                      </Badge>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* CTAs */}
                  <div className="space-y-2">
                    <Button 
                      variant={isFollowing ? "outline" : "secondary"}
                      className="w-full"
                      onClick={() => setIsFollowing(!isFollowing)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm">
                        <UserPlus className="h-4 w-4 mr-1" />
                        Invite
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold">{user.stats.projects}</div>
                      <div className="text-xs text-muted-foreground">Projects</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{user.stats.contributions}</div>
                      <div className="text-xs text-muted-foreground">Contributions</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{user.stats.followers}</div>
                      <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{user.stats.following}</div>
                      <div className="text-xs text-muted-foreground">Following</div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Links */}
                  <div className="space-y-2 text-sm">
                    {user.website && (
                      <a 
                        href={`https://${user.website}`} 
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <LinkIcon className="h-4 w-4" />
                        {user.website}
                      </a>
                    )}
                    {user.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Joined {user.joinedDate}
                    </div>
                  </div>
                </Card>

                {/* Regional Rank Card */}
                <RegionalRankCard isOwner={true} />
              </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 space-y-10">
              {/* 1. Personal Analytics Dashboard (ALWAYS VISIBLE) */}
              <section>
                <PersonalAnalyticsDashboard viewMode={viewMode} />
              </section>

              {/* 2. Active Projects */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Active Projects</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {activeProjects.map((project) => (
                    <ActiveProjectCard
                      key={project.id}
                      {...project}
                      onViewContributions={() => handleViewContributions(project.id, project.title)}
                    />
                  ))}
                </div>
              </section>

              {/* 3. Personal PoP Timeline */}
              <section>
                <PersonalPoPTimeline viewMode={viewMode} />
              </section>

              {/* 4. Skills & Capability Breakdown */}
              <section>
                <SkillsBreakdown />
              </section>

              {/* 5. Experience (condensed for non-leaders) */}
              {(viewMode === 'member' || viewMode === 'leader') && (
                <section>
                  <h2 className="text-xl font-semibold mb-4">Experience</h2>
                  <Card className="p-6">
                    <div className="space-y-6">
                      {user.experience.map((exp, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded bg-secondary/10 flex items-center justify-center">
                              <Briefcase className="h-5 w-5 text-secondary" />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium">{exp.title}</h4>
                            <p className="text-sm text-muted-foreground">{exp.company}</p>
                            <p className="text-xs text-muted-foreground mb-2">{exp.period}</p>
                            <p className="text-sm">{exp.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </section>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Contributions Drawer */}
      <ContributionsDrawer 
        open={contributionsOpen} 
        onClose={() => setContributionsOpen(false)}
        projectTitle={selectedProject}
      />

      <Footer />
    </>
  );
};

export default Profile;
