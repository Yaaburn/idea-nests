import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, MessageSquare, Settings, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const TopBar = () => {
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-40">
      <div className="h-full flex items-center justify-between px-6">
        {/* Search - Center */}
        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search projects, people, tags..."
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-primary/50"
            />
          </div>
        </div>

        {/* Actions - Right */}
        <div className="flex items-center gap-2 ml-4">
          {/* New Project - Circular */}
          <Button 
            onClick={() => navigate("/create-project")}
            size="icon"
            className="gradient-primary text-primary-foreground shadow-md hover:shadow-lg transition-shadow rounded-full h-9 w-9"
          >
            <Plus className="h-4 w-4" />
          </Button>

          {/* Messages */}
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link to="/notifications">
              <MessageSquare className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs gradient-accent border-0">
                3
              </Badge>
            </Link>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link to="/notifications">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs gradient-primary border-0">
                5
              </Badge>
            </Link>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon" asChild>
            <Link to="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>

          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-popover" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Sarah Chen</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    sarah@solarsense.io
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile/1")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TopBar;