import { Lightbulb, Users, TrendingUp, Rocket } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Lightbulb,
      title: "Share Your Vision",
      description: "Tell your story, describe your mission, and showcase what makes your project unique.",
      color: "text-accent",
    },
    {
      icon: Users,
      title: "Get Discovered",
      description: "Our smart matching connects you with contributors, mentors, and investors aligned with your vision.",
      color: "text-secondary",
    },
    {
      icon: TrendingUp,
      title: "Build & Verify",
      description: "Track milestones, verify progress, and build trust through transparent collaboration.",
      color: "text-primary",
    },
    {
      icon: Rocket,
      title: "Scale Together",
      description: "Secure funding, grow your team, and bring your idea to life with the right support.",
      color: "text-accent",
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            From idea to reality in four simple steps. We make discovery, collaboration, and growth seamless.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-secondary/50 to-transparent" />
              )}
              
              <div className="relative bg-card rounded-xl p-6 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all duration-300">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${step.color} from-current/10 to-current/5 mb-4`}>
                  <step.icon className={`h-6 w-6 ${step.color}`} />
                </div>
                
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                
                <h3 className="text-xl font-semibold mb-2">
                  {step.title}
                </h3>
                
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
