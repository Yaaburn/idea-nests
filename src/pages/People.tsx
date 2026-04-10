import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  MapPin, 
  Briefcase, 
  FolderKanban,
  Award,
  UserPlus,
  MessageCircle
} from "lucide-react";
import { Link } from "react-router-dom";

interface Person {
  id: string;
  name: string;
  avatar: string;
  tagline: string;
  role: string;
  location: string;
  skills: string[];
  projectsCount: number;
  milestonesCount: number;
  proofScore: number;
  availability: "available" | "busy" | "unavailable";
}

const people: Person[] = [
  {
    id: "1",
    name: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    tagline: "Climate tech founder | Ex-Stanford researcher",
    role: "Founder",
    location: "San Francisco, CA",
    skills: ["IoT", "Hardware", "Climate Tech", "Product"],
    projectsCount: 3,
    milestonesCount: 18,
    proofScore: 87,
    availability: "busy",
  },
  {
    id: "2",
    name: "Alex Kim",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    tagline: "Full-stack developer | Open source contributor",
    role: "Developer",
    location: "Seattle, WA",
    skills: ["React", "Node.js", "Python", "AWS"],
    projectsCount: 5,
    milestonesCount: 32,
    proofScore: 92,
    availability: "available",
  },
  {
    id: "3",
    name: "Maria Lopez",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    tagline: "Product designer | Creating delightful experiences",
    role: "Designer",
    location: "Austin, TX",
    skills: ["UI/UX", "Figma", "Design Systems", "Research"],
    projectsCount: 7,
    milestonesCount: 45,
    proofScore: 95,
    availability: "available",
  },
  {
    id: "4",
    name: "James Wilson",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    tagline: "Business strategist | Ex-McKinsey consultant",
    role: "Business",
    location: "New York, NY",
    skills: ["Strategy", "Finance", "Operations", "Growth"],
    projectsCount: 4,
    milestonesCount: 24,
    proofScore: 78,
    availability: "busy",
  },
  {
    id: "5",
    name: "Emily Zhang",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    tagline: "AI researcher | PhD Stanford | Building the future",
    role: "Researcher",
    location: "Palo Alto, CA",
    skills: ["Machine Learning", "NLP", "Python", "Research"],
    projectsCount: 2,
    milestonesCount: 15,
    proofScore: 88,
    availability: "available",
  },
  {
    id: "6",
    name: "David Brown",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    tagline: "Growth marketer | Scaled 3 startups to Series B",
    role: "Marketing",
    location: "Los Angeles, CA",
    skills: ["Growth", "SEO", "Content", "Analytics"],
    projectsCount: 6,
    milestonesCount: 38,
    proofScore: 82,
    availability: "unavailable",
  },
];

const availabilityColors = {
  available: "bg-green-500",
  busy: "bg-yellow-500",
  unavailable: "bg-muted",
};

const availabilityLabels = {
  available: "Available",
  busy: "Limited",
  unavailable: "Unavailable",
};

const People = () => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const filteredPeople = people.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(search.toLowerCase()) ||
      person.tagline.toLowerCase().includes(search.toLowerCase()) ||
      person.skills.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === "all" || person.role.toLowerCase() === roleFilter;
    const matchesAvailability = availabilityFilter === "all" || person.availability === availabilityFilter;
    return matchesSearch && matchesRole && matchesAvailability;
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Discover People</h1>
          <p className="text-muted-foreground">Find collaborators, mentors, and team members for your projects</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, skills, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="founder">Founder</SelectItem>
              <SelectItem value="developer">Developer</SelectItem>
              <SelectItem value="designer">Designer</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="researcher">Researcher</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Any</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">Limited</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* People Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPeople.map((person) => (
            <Card key={person.id} className="p-5 hover:shadow-lg transition-all group">
              <div className="flex items-start gap-4 mb-4">
                <div className="relative">
                  <Avatar className="h-14 w-14 border-2 border-primary/10">
                    <AvatarImage src={person.avatar} />
                    <AvatarFallback>{person.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${availabilityColors[person.availability]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${person.id}`}>
                    <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                      {person.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground truncate">{person.tagline}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{person.role}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {person.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {person.skills.slice(0, 4).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <FolderKanban className="h-4 w-4" />
                  <span>{person.projectsCount} projects</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  <span>{person.proofScore} score</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link to={`/profile/${person.id}`}>
                    View Profile
                  </Link>
                </Button>
                <Button size="sm" className="gradient-primary text-white">
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredPeople.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No people found matching your criteria</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default People;
