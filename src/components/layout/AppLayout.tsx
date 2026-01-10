import { ReactNode, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

const AppLayout = ({ children, showSidebar = true }: AppLayoutProps) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const location = useLocation();
  
  // Hide TopBar in workspace routes
  const isWorkspace = location.pathname.startsWith("/workspace/");

  const handleExpandChange = useCallback((expanded: boolean) => {
    setSidebarExpanded(expanded);
  }, []);

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen flex w-full overflow-hidden">
      <Sidebar onExpandChange={handleExpandChange} />
      <div 
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out overflow-hidden",
          sidebarExpanded ? "ml-60" : "ml-16"
        )}
      >
        {/* Only show TopBar when NOT in workspace */}
        {!isWorkspace && <TopBar />}
        <main className={cn(
          "flex-1 min-h-0 overflow-auto",
          !isWorkspace && "pt-0"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
