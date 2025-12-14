import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

const AppLayout = ({ children, showSidebar = true }: AppLayoutProps) => {
  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar />
      <div className="flex-1 ml-64 transition-all duration-300">
        <TopBar />
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
