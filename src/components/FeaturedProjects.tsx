import ProjectCard from "./ProjectCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FeaturedProjects = () => {
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
      proofScore: 87,
      verifications: 3,
    },
    {
      title: "CodeMentor AI",
      description: "AI-powered mentorship platform connecting junior developers with experienced engineers for personalized learning.",
      founderName: "Marcus Johnson",
      tags: ["EdTech", "AI", "Community"],
      stage: "MVP Ready",
      contributors: 12,
      progress: 80,
      daysLeft: 30,
      proofScore: 92,
      verifications: 5,
    },
    {
      title: "EcoTrack",
      description: "Carbon footprint tracker helping businesses measure and reduce their environmental impact with real-time analytics.",
      founderName: "Nina Patel",
      tags: ["Climate", "SaaS", "Analytics"],
      stage: "Demo Ready",
      contributors: 15,
      progress: 90,
      daysLeft: 20,
      proofScore: 95,
      verifications: 6,
    },
    {
      title: "HealthSync",
      description: "Blockchain-based health records platform enabling secure sharing between patients and healthcare providers.",
      founderName: "David Kim",
      tags: ["HealthTech", "Blockchain", "Security"],
      stage: "Idea",
      contributors: 5,
      progress: 30,
      daysLeft: 60,
      proofScore: 58,
      verifications: 1,
    },
    {
      title: "LocalArtisan",
      description: "Marketplace connecting local artisans with conscious consumers, featuring AR try-before-you-buy.",
      founderName: "Emma Rodriguez",
      tags: ["E-commerce", "AR", "Social Impact"],
      stage: "Alpha",
      contributors: 10,
      progress: 55,
      daysLeft: 40,
      proofScore: 73,
      verifications: 2,
    },
    {
      title: "QuantumLearn",
      description: "Interactive quantum computing education platform making complex concepts accessible to students worldwide.",
      founderName: "Alex Wong",
      tags: ["EdTech", "Quantum", "Innovation"],
      stage: "Prototype",
      contributors: 7,
      progress: 45,
      daysLeft: 50,
      proofScore: 68,
      verifications: 2,
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">
              Featured Projects
            </h2>
            <p className="text-lg text-muted-foreground">
              Discover groundbreaking ideas looking for collaborators
            </p>
          </div>
          
          <Button variant="ghost" className="hidden md:flex group">
            View All
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.title} {...project} />
          ))}
        </div>
        
        <div className="flex justify-center mt-12 md:hidden">
          <Button variant="outline" className="group">
            View All Projects
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProjects;
