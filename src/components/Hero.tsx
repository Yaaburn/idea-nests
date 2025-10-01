import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-collaboration.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-background" />
      
      <div className="container relative mx-auto px-4 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20">
              <Sparkles className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">Connect ideas with the right people</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Make ideas{" "}
              <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                discoverable
              </span>{" "}
              and grow them together
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              A platform where founders tell their story, contributors find meaningful projects, 
              and investors discover the next breakthrough. Built on trust, progress, and collaboration.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button size="lg" variant="secondary" className="group">
                Explore Projects
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline">
                Start Your Journey
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-foreground">500+</div>
                <div className="text-sm text-muted-foreground">Active Projects</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-foreground">2.5K+</div>
                <div className="text-sm text-muted-foreground">Contributors</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-foreground">95%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-secondary/20 to-accent/20 rounded-2xl blur-2xl" />
            <img 
              src={heroImage} 
              alt="Team collaboration" 
              className="relative rounded-2xl shadow-[var(--shadow-strong)] w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
