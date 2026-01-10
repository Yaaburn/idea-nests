import { ReactNode, useState, useCallback } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

const AppLayout = ({ children, showSidebar = true }: AppLayoutProps) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const handleExpandChange = useCallback((expanded: boolean) => {
    setSidebarExpanded(expanded);
  }, []);

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar onExpandChange={handleExpandChange} />
      <div 
        className={cn(
          "flex-1 transition-all duration-200 ease-in-out",
          sidebarExpanded ? "ml-60" : "ml-16"
        )}
      >
        <TopBar />
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
