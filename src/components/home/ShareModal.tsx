import { useState } from "react";
import { Share2, Link2, Mail, MessageSquare, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postTitle: string;
}

const ShareModal = ({
  open,
  onOpenChange,
  postId,
  postTitle,
}: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/project/${postId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Đã sao chép liên kết");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép liên kết");
    }
  };

  const handleShareViaEmail = () => {
    const subject = encodeURIComponent(`Xem dự án: ${postTitle}`);
    const body = encodeURIComponent(`Mình muốn chia sẻ dự án này với bạn: ${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Chia sẻ
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Post preview */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {postTitle}
          </p>

          {/* Copy link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Liên kết</label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 bg-muted/50 text-sm"
              />
              <Button
                variant={copied ? "default" : "outline"}
                onClick={handleCopyLink}
                className={copied ? "gradient-primary" : ""}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Share options */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Chia sẻ qua</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-12 flex-col gap-1"
                onClick={handleCopyLink}
              >
                <Link2 className="h-5 w-5" />
                <span className="text-xs">Sao chép</span>
              </Button>
              <Button
                variant="outline"
                className="h-12 flex-col gap-1"
                onClick={handleShareViaEmail}
              >
                <Mail className="h-5 w-5" />
                <span className="text-xs">Email</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
