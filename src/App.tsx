import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ProjectDetail from "./pages/ProjectDetail";
import Browse from "./pages/Browse";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import CreateProject from "./pages/CreateProject";
import Profile from "./pages/Profile";
import InvestorRoom from "./pages/InvestorRoom";
import Settings from "./pages/Settings";
import IntegrationHub from "./pages/IntegrationHub";
import ProcessAnalyzer from "./pages/ProcessAnalyzer";
import Workspace from "./pages/Workspace";
import People from "./pages/People";
import Notifications from "./pages/Notifications";
import ProjectAnalysis from "./pages/ProjectAnalysis";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-project" element={<CreateProject />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/investor-room/:id" element={<InvestorRoom />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/integrations" element={<IntegrationHub />} />
          <Route path="/process-analyzer" element={<ProcessAnalyzer />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/workspace/:projectId" element={<Workspace />} />
          <Route path="/people" element={<People />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/project-analysis/:projectId" element={<ProjectAnalysis />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
