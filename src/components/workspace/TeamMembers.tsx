import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Minus,
  MessageSquare,
  Search,
  Mail,
  Calendar,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  skills: string[];
  email: string;
  joinedAt: string;
  popScore: number;
  isOnline: boolean;
}

const mockMembers: TeamMember[] = [
  {
    id: "1",
    name: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    role: "Founder & Lead",
    skills: ["Product Strategy", "React", "Data Analytics"],
    email: "sarah@talentnet.io",
    joinedAt: "2024-10-15",
    popScore: 92,
    isOnline: true,
  },
  {
    id: "2",
    name: "Alex Kim",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    role: "Lead Developer",
    skills: ["TypeScript", "Node.js", "AWS", "Firmware"],
    email: "alex@talentnet.io",
    joinedAt: "2024-11-01",
    popScore: 88,
    isOnline: true,
  },
  {
    id: "3",
    name: "Maria Lopez",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    role: "UX Designer",
    skills: ["Figma", "User Research", "Prototyping"],
    email: "maria@talentnet.io",
    joinedAt: "2024-11-15",
    popScore: 85,
    isOnline: false,
  },
  {
    id: "4",
    name: "James Wilson",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    role: "Backend Developer",
    skills: ["Python", "PostgreSQL", "Docker"],
    email: "james@talentnet.io",
    joinedAt: "2024-12-01",
    popScore: 78,
    isOnline: false,
  },
  {
    id: "5",
    name: "Emily Watson",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    role: "Marketing Lead",
    skills: ["Content Strategy", "SEO", "Social Media"],
    email: "emily@talentnet.io",
    joinedAt: "2024-12-10",
    popScore: 72,
    isOnline: true,
  },
];

const TeamMembers = () => {
  const [members, setMembers] = useState(mockMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRemoveMember = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const handleAddMember = () => {
    if (newMemberEmail) {
      // In real app, this would send an invite
      setShowAddDialog(false);
      setNewMemberEmail("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Team Members</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {members.length} members in this project
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white">
                <Plus className="h-4 w-4 mr-2" />
                New member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join this project.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Enter email address..."
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMember} className="gradient-primary text-white">
                  Send Invite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="p-5 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              {/* Avatar & Status */}
              <div className="relative">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback>{member.name[0]}</AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background",
                    member.isOnline ? "bg-green-500" : "bg-muted-foreground"
                  )}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold">{member.name}</h3>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      member.isOnline
                        ? "border-green-500 text-green-600"
                        : "border-muted-foreground text-muted-foreground"
                    )}
                  >
                    {member.isOnline ? "Online" : "Offline"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1.5">
                    <div className="text-muted-foreground">
                      <span className="font-medium text-foreground">Role:</span>{" "}
                      {member.role}
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium text-foreground">Skills:</span>{" "}
                      <span className="flex flex-wrap gap-1 mt-1">
                        {member.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        Joined{" "}
                        {new Date(member.joinedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Award className="h-3.5 w-3.5" />
                      <span>
                        PoP Score:{" "}
                        <span
                          className={cn(
                            "font-semibold",
                            member.popScore >= 80
                              ? "text-green-600"
                              : member.popScore >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                          )}
                        >
                          {member.popScore}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 hover:bg-primary/10 hover:text-primary hover:border-primary"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "No members found matching your search."
              : "No team members yet."}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setShowAddDialog(true)}
              className="gradient-primary text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add your first team member
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamMembers;
