import { Search, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-secondary to-primary" />
              <span className="text-xl font-bold">IdeaConnect</span>
            </a>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="/" className="text-sm font-medium hover:text-secondary transition-colors">
                Home
              </a>
              <a href="/browse" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Browse
              </a>
              <a href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 max-w-xs">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search projects..." 
                className="border-0 bg-transparent focus-visible:ring-0 h-6 text-sm"
              />
            </div>
            
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Bell className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
            
            <Button variant="secondary" size="sm" className="hidden md:flex" asChild>
              <a href="/create-project">Start a Project</a>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
