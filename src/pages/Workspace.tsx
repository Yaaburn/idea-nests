import { useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Settings, 
  Users,
  LayoutGrid
} from "lucide-react";
import TaskBoard from "@/components/workspace/TaskBoard";
import FileManager from "@/components/workspace/FileManager";
import Discussions from "@/components/workspace/Discussions";
import Meetings from "@/components/workspace/Meetings";

const Workspace = () => {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState("tasks");

  const project = {
    name: "SolarSense - Farm Monitoring",
    stage: "Prototype",
    members: [
      { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", role: "Founder" },
      { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", role: "Developer" },
      { name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", role: "Designer" },
    ],
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <LayoutGrid className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{project.stage}</Badge>
                <span className="text-sm text-muted-foreground">Workspace</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Team Avatars */}
            <div className="flex items-center -space-x-2">
              {project.members.map((member, i) => (
                <Avatar key={i} className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback>{member.name[0]}</AvatarFallback>
                </Avatar>
              ))}
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full ml-2">
                <Users className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="tasks" className="data-[state=active]:gradient-primary data-[state=active]:text-white">
              Tasks
            </TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:gradient-primary data-[state=active]:text-white">
              Files
            </TabsTrigger>
            <TabsTrigger value="discussions" className="data-[state=active]:gradient-primary data-[state=active]:text-white">
              Discussions
            </TabsTrigger>
            <TabsTrigger value="meetings" className="data-[state=active]:gradient-primary data-[state=active]:text-white">
              Meetings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6">
            <TaskBoard />
          </TabsContent>

          <TabsContent value="files" className="mt-6">
            <FileManager />
          </TabsContent>

          <TabsContent value="discussions" className="mt-6">
            <Discussions />
          </TabsContent>

          <TabsContent value="meetings" className="mt-6">
            <Meetings />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Workspace;
