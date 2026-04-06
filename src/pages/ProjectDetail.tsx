import { useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Play, MapPin, Clock, Users, Share2, Heart, CheckCircle2, Award, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ApplyModal from "@/components/ApplyModal";
import VideoModal from "@/components/VideoModal";
import ProjectTimeline from "@/components/ProjectTimeline";
import ProofScore from "@/components/ProofScore";
import VerificationBadge from "@/components/VerificationBadge";
import { getCreatedProjectById } from "@/lib/projectStore";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [showFounderBio, setShowFounderBio] = useState(false);

  const createdProject = id?.startsWith("user-") ? getCreatedProjectById(id) : null;

  const project = createdProject
    ? {
        title: createdProject.title,
        tagline: createdProject.vision || createdProject.whyDoingThis || "A new project on TalentNet",
        coverImage: createdProject.coverImage || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
        founderName: "You",
        founderTitle: "Founder",
        founderAvatar: createdProject.founderAvatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        founderBio: "",
        location: "Remote",
        stage: "Idea",
        tags: createdProject.tags,
        contributors: 1,
        progress: 0,
        videoUrl: "",
      }
    : {
        title: "SolarSense - Farm Monitoring",
        tagline: "Building low-cost solar sensors for farmers to monitor soil and optimize crop yield",
        coverImage: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200",
        founderName: "Sarah Chen",
        founderTitle: "Former IoT Researcher",
        founderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        founderBio: "10 years in agricultural tech. PhD in IoT systems. Grew up on a farm in California.",
        location: "San Francisco, CA",
        stage: "Prototype",
        tags: ["IoT", "Agriculture", "Hardware", "Climate Tech"],
        contributors: 8,
        progress: 65,
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      };

  const roles = createdProject?.roles?.filter(r => r.title).map(r => ({
    title: r.title,
    type: "Open",
    commitment: "Flexible",
    equity: "TBD",
    description: r.description || "No description provided",
  })) || [
    {
      title: "Embedded Systems Engineer",
      type: "Full-time",
      commitment: "20-30 hrs/week",
      equity: "0.5-1.5%",
      description: "Design and optimize sensor firmware for ultra-low power consumption",
    },
    {
      title: "Field Operations Lead",
      type: "Contract",
      commitment: "10-15 hrs/week",
      equity: "0.3-0.8%",
      description: "Coordinate pilot deployments with partner farms, gather user feedback",
    },
    {
      title: "Product Designer",
      type: "Part-time",
      commitment: "15-20 hrs/week",
      equity: "0.4-1.0%",
      description: "Create intuitive mobile app for farmers to view sensor data and insights",
    },
  ];

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-background">
        {/* Hero Cover */}
        <div className="relative h-[400px] overflow-hidden">
          <img 
            src={project.coverImage} 
            alt={project.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          
          <div className="absolute top-6 left-0 right-0 container mx-auto px-4 lg:px-8">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 -mt-32 relative z-10">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <Card className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge>{project.stage}</Badge>
                      <ProofScore score={75} verifications={3} size="md" />
                      <VerificationBadge type="mentor" verifier="Dr. James Liu" date="2025-09-23" />
                    </div>
                    <h1 className="text-4xl font-bold mb-3">{project.title}</h1>
                    <p className="text-xl text-muted-foreground">{project.tagline}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline">
                      <Heart className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="outline">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{project.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{project.contributors} contributors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Updated 2 days ago</span>
                  </div>
                </div>
              </Card>

              {/* Founder's Stage */}
              <Card className="p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div 
                    className="relative cursor-pointer group"
                    onMouseEnter={() => setShowFounderBio(true)}
                    onMouseLeave={() => setShowFounderBio(false)}
                  >
                    <Avatar className="h-16 w-16 border-4 border-background shadow-lg">
                      <AvatarImage src={project.founderAvatar} />
                      <AvatarFallback>{project.founderName[0]}</AvatarFallback>
                    </Avatar>
                    
                    {showFounderBio && (
                      <div className="absolute top-full left-0 mt-2 w-64 p-4 bg-card border rounded-lg shadow-xl z-50 animate-fade-in">
                        <p className="text-sm font-medium mb-1">{project.founderName}</p>
                        <p className="text-xs text-muted-foreground mb-2">{project.founderTitle}</p>
                        <p className="text-xs">{project.founderBio}</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg">{project.founderName}</h3>
                    <p className="text-sm text-muted-foreground">{project.founderTitle}</p>
                  </div>
                </div>

                <Tabs defaultValue="story" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="story">The Story</TabsTrigger>
                    <TabsTrigger value="how">How We Work</TabsTrigger>
                    <TabsTrigger value="need">What We Need</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="story" className="space-y-4 mt-6">
                    <div className="relative cursor-pointer group" onClick={() => setIsVideoModalOpen(true)}>
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                        <img 
                          src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800" 
                          alt="Project video thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors rounded-lg">
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="h-8 w-8 text-primary ml-1" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 text-foreground/90 leading-relaxed">
                      <h4 className="text-xl font-semibold text-foreground">Why I'm doing this</h4>
                      <p>
                        I grew up watching my parents struggle with unpredictable crop yields. They'd check soil moisture by 
                        hand—literally digging into the earth daily. Meanwhile, industrial farms had expensive sensor systems 
                        that cost $10,000+. This gap bothered me throughout my PhD in IoT systems.
                      </p>
                      
                      <blockquote className="border-l-4 border-secondary pl-4 italic text-muted-foreground">
                        "Small farmers deserve the same technology advantages as large operations. I'm building the future 
                        I wish my parents had access to."
                      </blockquote>

                      <p>
                        After 10 years in agricultural tech research, I've developed a solar-powered sensor that costs under $50 
                        to manufacture. We've tested it on 15 farms across California with incredible results—30% water savings 
                        and 18% yield improvement.
                      </p>

                      <p>
                        But hardware is just the beginning. We're creating a complete platform: sensors + mobile app + predictive 
                        analytics. Farmers get real-time alerts on their phones and AI-powered recommendations for irrigation timing.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="how" className="space-y-4 mt-6">
                    <div className="space-y-4 text-foreground/90 leading-relaxed">
                      <h4 className="text-xl font-semibold text-foreground">Our working style</h4>
                      <p>
                        We're a small, focused team that believes in rapid iteration and direct farmer feedback. Every two weeks, 
                        we deploy updates to our pilot farms and gather real-world data.
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-4 my-6">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-secondary mb-2" />
                          <h5 className="font-semibold mb-1">Remote-first</h5>
                          <p className="text-sm text-muted-foreground">
                            Work from anywhere. Weekly sync meetings, async-friendly communication
                          </p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-secondary mb-2" />
                          <h5 className="font-semibold mb-1">Equity-based</h5>
                          <p className="text-sm text-muted-foreground">
                            Fair compensation tied to our success. Everyone is an owner
                          </p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-secondary mb-2" />
                          <h5 className="font-semibold mb-1">Field-tested</h5>
                          <p className="text-sm text-muted-foreground">
                            We build with farmers, not for them. Regular field visits
                          </p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-secondary mb-2" />
                          <h5 className="font-semibold mb-1">Open source</h5>
                          <p className="text-sm text-muted-foreground">
                            Hardware designs will be open-sourced after product launch
                          </p>
                        </div>
                      </div>

                      <p>
                        Tech stack: C++ for firmware, React Native for mobile, Python/TensorFlow for ML models. 
                        Hardware: ESP32 microcontroller, custom PCB design.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="need" className="space-y-4 mt-6">
                    <h4 className="text-xl font-semibold">Open Positions</h4>
                    <p className="text-muted-foreground">
                      We're looking for passionate individuals who want to make a real impact on sustainable agriculture.
                    </p>

                    <div className="space-y-4">
                      {roles.map((role) => (
                        <Card key={role.title} className="p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h5 className="font-semibold text-lg">{role.title}</h5>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <Badge variant="outline" className="text-xs">{role.type}</Badge>
                                <span>{role.commitment}</span>
                                <span className="text-secondary font-medium">{role.equity}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                          <Button variant="secondary" size="sm">
                            Apply for this role
                          </Button>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>

              {/* Timeline */}
              <Card className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">Progress Timeline</h3>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/integrations">Connect Platforms →</a>
                  </Button>
                </div>
                <div className="mb-4 p-4 bg-secondary/5 border border-secondary/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    This timeline is automatically generated from connected platforms (GitHub, Notion, Figma). 
                    Each milestone can be verified by team members or mentors.
                  </p>
                </div>
                <ProjectTimeline />
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="p-6 space-y-4 sticky top-24">
                <Button 
                  size="lg" 
                  className="w-full" 
                  variant="secondary"
                  onClick={() => setIsApplyModalOpen(true)}
                >
                  I'm Interested
                </Button>
                <Button size="lg" variant="outline" className="w-full">
                  Request Full Access
                </Button>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-secondary to-accent transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <h4 className="font-semibold">Project Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active contributors</span>
                      <span className="font-medium">{project.contributors}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Milestones completed</span>
                      <span className="font-medium">4/7</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Investors watching</span>
                      <span className="font-medium">23</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Proof Score</span>
                      <span className="font-medium">75/100</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <h4 className="font-semibold mb-2">Verifications</h4>
                  <div className="space-y-2">
                    <VerificationBadge 
                      type="mentor" 
                      verifier="Dr. James Liu" 
                      date="2025-09-23" 
                    />
                    <VerificationBadge 
                      type="institution" 
                      verifier="Stanford Innovation Lab" 
                      date="2025-09-15" 
                    />
                    <VerificationBadge 
                      type="auto" 
                      date="2025-10-01" 
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="h-4 w-4 text-secondary" />
                    <span>YC S23 Finalist</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      
      <ApplyModal 
        isOpen={isApplyModalOpen} 
        onClose={() => setIsApplyModalOpen(false)}
        projectTitle={project.title}
      />
      
      <VideoModal 
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl={project.videoUrl}
      />
    </>
  );
};

export default ProjectDetail;
