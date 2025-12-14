import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Upload, 
  Search, 
  FileText, 
  Image, 
  FileCode, 
  Video,
  MoreHorizontal,
  Download,
  Eye,
  Grid,
  List
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FileItem {
  id: string;
  name: string;
  type: "doc" | "image" | "code" | "video";
  size: string;
  updatedAt: string;
  uploader: {
    name: string;
    avatar: string;
  };
}

const files: FileItem[] = [
  {
    id: "1",
    name: "Product Requirements.docx",
    type: "doc",
    size: "245 KB",
    updatedAt: "2025-01-10",
    uploader: { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
  },
  {
    id: "2",
    name: "app-mockup-v2.fig",
    type: "image",
    size: "12.5 MB",
    updatedAt: "2025-01-12",
    uploader: { name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
  },
  {
    id: "3",
    name: "sensor-firmware.cpp",
    type: "code",
    size: "45 KB",
    updatedAt: "2025-01-11",
    uploader: { name: "Alex Kim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
  },
  {
    id: "4",
    name: "Demo Video.mp4",
    type: "video",
    size: "156 MB",
    updatedAt: "2025-01-09",
    uploader: { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
  },
  {
    id: "5",
    name: "Research Notes.pdf",
    type: "doc",
    size: "890 KB",
    updatedAt: "2025-01-08",
    uploader: { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
  },
  {
    id: "6",
    name: "logo-assets.zip",
    type: "image",
    size: "5.2 MB",
    updatedAt: "2025-01-07",
    uploader: { name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
  },
];

const typeIcons = {
  doc: FileText,
  image: Image,
  code: FileCode,
  video: Video,
};

const typeColors = {
  doc: "text-blue-500 bg-blue-500/10",
  image: "text-pink-500 bg-pink-500/10",
  code: "text-green-500 bg-green-500/10",
  video: "text-purple-500 bg-purple-500/10",
};

const FileManager = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredFiles = files.filter(file => {
    const matchesFilter = filter === "all" || file.type === filter;
    const matchesSearch = file.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All Files</SelectItem>
              <SelectItem value="doc">Documents</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="code">Code</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <div className="flex border rounded-lg p-1">
            <Button 
              variant={viewMode === "grid" ? "secondary" : "ghost"} 
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "secondary" : "ghost"} 
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button className="gradient-primary text-white">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Files Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => {
            const Icon = typeIcons[file.type];
            return (
              <Card key={file.id} className="p-4 hover:shadow-md transition-all group cursor-pointer">
                <div className={`w-12 h-12 rounded-lg ${typeColors[file.type]} flex items-center justify-center mb-3`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h4 className="font-medium text-sm truncate mb-1 group-hover:text-primary transition-colors">
                  {file.name}
                </h4>
                <p className="text-xs text-muted-foreground mb-3">{file.size}</p>
                <div className="flex items-center justify-between">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={file.uploader.avatar} />
                    <AvatarFallback>{file.uploader.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {new Date(file.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="divide-y">
            {filteredFiles.map((file) => {
              const Icon = typeIcons[file.type];
              return (
                <div key={file.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group">
                  <div className={`w-10 h-10 rounded-lg ${typeColors[file.type]} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {file.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">{file.size}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={file.uploader.avatar} />
                      <AvatarFallback>{file.uploader.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(file.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default FileManager;
