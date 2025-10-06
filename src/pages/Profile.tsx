import { useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProjectCard from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, 
  Link as LinkIcon, 
  Mail, 
  Calendar,
  Award,
  Users,
  Briefcase,
  MessageCircle
} from "lucide-react";

const Profile = () => {
  const { id } = useParams();
  const [isFollowing, setIsFollowing] = useState(false);

  // Mock user data
  const user = {
    name: "Sarah Chen",
    username: "@sarahchen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    bio: "Climate tech founder | Ex-Stanford researcher | Building sustainable solutions for agriculture",
    location: "San Francisco, CA",
    website: "sarahchen.com",
    email: "sarah@solarsense.io",
    joinedDate: "Jan 2024",
    stats: {
      projects: 3,
      contributions: 12,
      followers: 248,
      following: 156,
    },
    skills: ["IoT", "Agriculture", "Hardware", "Climate Tech", "Product Design", "React"],
    interests: ["Sustainability", "AI/ML", "Open Source"],
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
    verifications: [
      { type: "Institution", name: "Stanford University", verified: true },
      { type: "Mentor", name: "Dr. James Liu", verified: true },
    ],
  };

  const projects = [
    {
      title: "SolarSense - Farm Monitoring",
      description: "Building low-cost solar sensors for farmers to monitor soil conditions.",
      founderName: "Sarah Chen",
      tags: ["IoT", "Agriculture", "Hardware"],
      stage: "Prototype",
      contributors: 8,
      progress: 65,
      daysLeft: 45,
    },
  ];

  const contributions = [
    {
      title: "EcoTrack - Carbon Footprint",
      role: "Frontend Developer",
      period: "Mar 2024 - Present",
      tags: ["React", "Climate Tech"],
    },
    {
      title: "GreenGrid - Energy Management",
      role: "IoT Consultant",
      period: "Jan 2024 - Feb 2024",
      tags: ["IoT", "Hardware"],
    },
  ];

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-background border-b">
          <div className="container mx-auto px-4 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  <span className="text-muted-foreground">{user.username}</span>
                </div>

                <p className="text-lg mb-4 max-w-2xl">{user.bio}</p>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  {user.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {user.location}
                    </div>
                  )}
                  {user.website && (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="h-4 w-4" />
                      <a href={`https://${user.website}`} className="hover:text-secondary transition-colors">
                        {user.website}
                      </a>
                    </div>
                  )}
                  {user.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {user.joinedDate}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {user.verifications.map((verification, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      <Award className="h-3 w-3" />
                      {verification.type} verified by {verification.name}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant={isFollowing ? "outline" : "secondary"}
                    onClick={() => setIsFollowing(!isFollowing)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <Card className="p-4 min-w-[200px]">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{user.stats.projects}</div>
                    <div className="text-xs text-muted-foreground">Projects</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{user.stats.contributions}</div>
                    <div className="text-xs text-muted-foreground">Contributions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{user.stats.followers}</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{user.stats.following}</div>
                    <div className="text-xs text-muted-foreground">Following</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="projects">
                <TabsList className="mb-6">
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="contributions">Contributions</TabsTrigger>
                  <TabsTrigger value="about">About</TabsTrigger>
                </TabsList>

                <TabsContent value="projects" className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {projects.map((project, index) => (
                      <ProjectCard key={index} {...project} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="contributions" className="space-y-4">
                  {contributions.map((contribution, index) => (
                    <Card key={index} className="p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{contribution.title}</h3>
                          <p className="text-sm text-muted-foreground">{contribution.role}</p>
                        </div>
                        <Badge variant="outline">{contribution.period}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {contribution.tags.map(tag => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="about" className="space-y-6">
                  <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Proof of Process</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Verified journey of development and collaboration
                    </p>
                    <Button variant="outline" className="w-full mb-6" asChild>
                      <a href="/process-analyzer">View Full Process Analysis →</a>
                    </Button>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Proof Score</span>
                        <Badge variant="secondary">87/100</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Connected Platforms</span>
                        <Badge variant="secondary">4 active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Total Activities</span>
                        <Badge variant="secondary">342</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Verified Milestones</span>
                        <Badge variant="secondary">18</Badge>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Experience</h3>
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
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map(skill => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Proof of Process</h3>
                <Button variant="outline" className="w-full mb-4" asChild>
                  <a href="/integrations">Connect Platforms →</a>
                </Button>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Proof Score</span>
                    <span className="font-medium">87/100</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Verified by</span>
                    <span className="font-medium">2 mentors</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active integrations</span>
                    <span className="font-medium">4 platforms</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map(interest => (
                    <Badge key={interest} variant="outline">{interest}</Badge>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Activity</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Projects created</span>
                    <span className="font-medium">{user.stats.projects}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Collaborations</span>
                    <span className="font-medium">{user.stats.contributions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verified milestones</span>
                    <span className="font-medium">18</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Profile;
