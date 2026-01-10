import { useState } from "react";
import { Bookmark, Plus, Check, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Collection {
  id: string;
  name: string;
  count: number;
}

const mockCollections: Collection[] = [
  { id: "1", name: "Dự án yêu thích", count: 12 },
  { id: "2", name: "Xem sau", count: 5 },
  { id: "3", name: "Cần liên hệ", count: 8 },
];

interface SaveToFavoritesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postTitle: string;
}

const SaveToFavoritesModal = ({
  open,
  onOpenChange,
  postTitle,
}: SaveToFavoritesModalProps) => {
  const [collections, setCollections] = useState(mockCollections);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  const toggleCollection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreateAndSave = () => {
    if (!newCollectionName.trim()) return;

    const newCollection: Collection = {
      id: Date.now().toString(),
      name: newCollectionName.trim(),
      count: 0,
    };

    setCollections((prev) => [...prev, newCollection]);
    setSelectedIds((prev) => [...prev, newCollection.id]);
    setNewCollectionName("");
    setIsCreating(false);
  };

  const handleSave = () => {
    if (selectedIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một danh mục");
      return;
    }

    // Simulate save
    toast.success("Đã lưu vào danh mục yêu thích");
    onOpenChange(false);
    setSelectedIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            Lưu vào yêu thích
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Post preview */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {postTitle}
          </p>

          {/* Collections list */}
          {collections.length > 0 ? (
            <div className="space-y-2">
              {collections.map((collection) => (
                <label
                  key={collection.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <Checkbox
                    checked={selectedIds.includes(collection.id)}
                    onCheckedChange={() => toggleCollection(collection.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {collection.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {collection.count} mục
                    </p>
                  </div>
                  {selectedIds.includes(collection.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <FolderPlus className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Bạn chưa có danh mục yêu thích nào.</p>
            </div>
          )}

          {/* Create new collection */}
          {isCreating ? (
            <div className="flex gap-2">
              <Input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Tên danh mục mới..."
                className="flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateAndSave();
                  if (e.key === "Escape") setIsCreating(false);
                }}
              />
              <Button size="sm" onClick={handleCreateAndSave}>
                Tạo
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo danh mục mới
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            className="flex-1 gradient-primary"
            onClick={handleSave}
            disabled={selectedIds.length === 0}
          >
            Lưu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveToFavoritesModal;
