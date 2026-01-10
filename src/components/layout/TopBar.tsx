import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, HelpCircle, Plus } from "lucide-react";
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
import NotificationsDropdown from "@/components/home/NotificationsDropdown";
import MessagesDropdown from "@/components/home/MessagesDropdown";

interface TopBarProps {
  onOpenChat?: (conversation: { id: string; user: { name: string; avatar: string; online?: boolean } }) => void;
}

const TopBar = ({ onOpenChat }: TopBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're in workspace - hide TopBar there
  const isInWorkspace = location.pathname.startsWith("/workspace/");
  
  if (isInWorkspace) {
    return null;
  }

  const handleOpenChatFromDropdown = (conversation: { id: string; user: { name: string; avatar: string; online?: boolean } }) => {
    onOpenChat?.(conversation);
  };

  return (
    <header className="h-16 bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-40">
      <div className="h-full flex items-center justify-between px-6">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm kiếm dự án, người, tags..."
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-primary/50"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          <Button 
            onClick={() => navigate("/create-project")}
            className="gradient-primary text-primary-foreground shadow-md hover:shadow-lg transition-shadow"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo dự án
          </Button>

          <Button variant="ghost" size="icon" className="relative">
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* Messages Dropdown */}
          <MessagesDropdown onOpenChat={handleOpenChatFromDropdown} />

          {/* Notifications Dropdown */}
          <NotificationsDropdown />

          {/* User Menu */}
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
                Hồ sơ
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                Bảng điều khiển
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                Cài đặt
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
