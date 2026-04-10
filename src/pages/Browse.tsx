import { useState } from "react";
import { Search, Filter, X, TrendingUp, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProjectCard from "@/components/ProjectCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const Browse = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  const stages = ["Idea", "Prototype", "Alpha", "MVP Ready", "Demo Ready"];
  const domains = ["AI/ML", "Climate Tech", "HealthTech", "FinTech", "EdTech", "IoT", "E-commerce", "Blockchain"];

  const suggestedSearches = [
    "climate AI designer",
    "React + Web3 developer",
    "healthcare mobile app",
    "sustainable agriculture",
  ];

  const matchReasons = [
    { project: "EcoTrack", reason: "Your experience: Climate data + 3 yrs analytics" },
    { project: "CodeMentor AI", reason: "Match: EdTech interest + mentorship background" },
    { project: "HealthSync", reason: "Skills: React + security certifications" },
  ];

  const projects = [
    {
      title: "SolarSense - Farm Monitoring",
      description: "Building low-cost solar sensors for farmers to monitor soil conditions and optimize crop yield.",
      founderName: "Sarah Chen",
      tags: ["IoT", "Agriculture", "Hardware"],
      stage: "Prototype",
      contributors: 8,
      progress: 65,
      daysLeft: 45,
    },
    {
      title: "CodeMentor AI",
      description: "AI-powered mentorship platform connecting junior developers with experienced engineers.",
      founderName: "Marcus Johnson",
      tags: ["EdTech", "AI", "Community"],
      stage: "MVP Ready",
      contributors: 12,
      progress: 80,
      daysLeft: 30,
    },
    // Add more projects...
  ];

  const toggleFilter = (value: string, type: 'stage' | 'domain') => {
    if (type === 'stage') {
      setSelectedStages(prev => 
        prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
      );
    } else {
      setSelectedDomains(prev => 
        prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value]
      );
    }
  };

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-background py-12 border-b">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-secondary" />
                <span>{projects.length} projects looking for collaborators</span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold">
                Discover Your Next Big Opportunity
              </h1>
              
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by skills, domain, or keywords..."
                  className="pl-12 pr-24 h-14 text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button 
                  variant="secondary" 
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  size="sm"
                >
                  Search
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Try:</span>
                {suggestedSearches.map((query) => (
                  <Badge
                    key={query}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => setSearchQuery(query)}
                  >
                    {query}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-12">
          {/* Matching Panel */}
          <Card className="p-6 mb-8 border-secondary/20 bg-gradient-to-r from-secondary/5 to-accent/5">
            <div className="flex items-start gap-3 mb-4">
              <TrendingUp className="h-5 w-5 text-secondary mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Suggested Matches for You</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Based on your skills and interests, we think these projects are a great fit
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              {matchReasons.map((match) => (
                <div key={match.project} className="flex items-center justify-between p-3 bg-background rounded-lg hover:shadow-sm transition-shadow">
                  <div>
                    <span className="font-medium">{match.project}</span>
                    <p className="text-sm text-muted-foreground">{match.reason}</p>
                  </div>
                  <Button size="sm" variant="ghost">
                    View →
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">All Projects</h2>
            
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(selectedStages.length + selectedDomains.length > 0) && (
                <Badge variant="secondary" className="ml-2">
                  {selectedStages.length + selectedDomains.length}
                </Badge>
              )}
            </Button>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            {showFilters && (
              <div className="lg:col-span-1">
                <Card className="p-6 sticky top-24 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Filters</h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedStages([]);
                        setSelectedDomains([]);
                      }}
                    >
                      Clear all
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Project Stage</h4>
                    {stages.map((stage) => (
                      <div key={stage} className="flex items-center space-x-2">
                        <Checkbox
                          id={`stage-${stage}`}
                          checked={selectedStages.includes(stage)}
                          onCheckedChange={() => toggleFilter(stage, 'stage')}
                        />
                        <Label
                          htmlFor={`stage-${stage}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {stage}
                        </Label>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Domain</h4>
                    {domains.map((domain) => (
                      <div key={domain} className="flex items-center space-x-2">
                        <Checkbox
                          id={`domain-${domain}`}
                          checked={selectedDomains.includes(domain)}
                          onCheckedChange={() => toggleFilter(domain, 'domain')}
                        />
                        <Label
                          htmlFor={`domain-${domain}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {domain}
                        </Label>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Projects Grid */}
            <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard key={project.title} {...project} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Browse;
