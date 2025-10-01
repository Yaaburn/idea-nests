import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/95 to-secondary p-12 lg:p-16">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_70%)]" />
          
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">Join thousands of innovators</span>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-white">
              Ready to turn your idea into reality?
            </h2>
            
            <p className="text-xl text-white/90">
              Start building with the right people today. No credit card required.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="accent" className="group">
                Start Your Project
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20">
                Browse Projects
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-8 pt-4 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No long-term commitment</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Trusted by 500+ projects</span>
              </div>
            </div>
          </div>
          
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
        </div>
      </div>
    </section>
  );
};

export default CTASection;
