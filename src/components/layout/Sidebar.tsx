import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  FolderKanban, 
  Users, 
  Bell,
  Settings,
  BarChart3,
  Lock,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useCallback } from "react";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: FolderKanban, label: "Your Projects", path: "/your-projects" },
  { icon: BarChart3, label: "Dashboard", path: "/dashboard", badge: "Incubator" },
  { icon: Users, label: "People", path: "/people" },
];

const bottomItems = [
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface SidebarProps {
  onExpandChange?: (expanded: boolean) => void;
}

const Sidebar = ({ onExpandChange }: SidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    // Clear any pending leave timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    
    // Delay expand by 80ms to prevent flicker
    hoverTimeoutRef.current = setTimeout(() => {
      setIsExpanded(true);
      onExpandChange?.(true);
    }, 80);
  }, [onExpandChange]);

  const handleMouseLeave = useCallback(() => {
    // Clear any pending hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Delay collapse by 150ms to allow moving to expanded content
    leaveTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
      onExpandChange?.(false);
    }, 150);
  }, [onExpandChange]);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar flex flex-col z-50 transition-all duration-200 ease-in-out border-r border-sidebar-border",
        isExpanded ? "w-60" : "w-16"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Logo */}
      <div className={cn(
        "h-16 flex items-center border-b border-sidebar-border transition-all duration-200",
        isExpanded ? "px-4 gap-3" : "justify-center px-2"
      )}>
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-base">T</span>
        </div>
        {isExpanded && (
          <span className="font-bold text-lg text-sidebar-foreground whitespace-nowrap overflow-hidden animate-fade-in">
            TalentNet
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/" && location.pathname.startsWith(item.path));
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10",
                isActive && "bg-sidebar-primary/20 text-sidebar-foreground font-medium ring-1 ring-purple-400/30",
                !isExpanded && "justify-center px-0 mx-1"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0 transition-colors", 
                isActive && "text-sidebar-primary"
              )} />
              {isExpanded && (
                <span className="whitespace-nowrap overflow-hidden animate-fade-in flex-1">
                  {item.label}
                </span>
              )}
              {isExpanded && (item as any).badge && (
                <Lock className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="py-4 px-2 border-t border-sidebar-border space-y-1">
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10",
                isActive && "bg-sidebar-primary/20 text-sidebar-foreground font-medium ring-1 ring-purple-400/30",
                !isExpanded && "justify-center px-0 mx-1"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0 transition-colors", 
                isActive && "text-sidebar-primary"
              )} />
              {isExpanded && (
                <span className="whitespace-nowrap overflow-hidden animate-fade-in">
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
