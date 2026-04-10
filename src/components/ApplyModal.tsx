import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
}

const ApplyModal = ({ isOpen, onClose, projectTitle }: ApplyModalProps) => {
  const [pitch, setPitch] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [availability, setAvailability] = useState("");
  const [agreeNDA, setAgreeNDA] = useState(false);

  const handleSubmit = () => {
    if (!pitch || !availability) {
      toast.error("Please fill in all required fields");
      return;
    }

    toast.success("Application submitted! The founder will review and respond within 48 hours.");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply to {projectTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pitch">
              Your pitch <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="pitch"
              placeholder="Tell us in one line why you're a great fit for this project..."
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">Be specific about your relevant skills and experience</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolio">Portfolio / LinkedIn / GitHub</Label>
            <Input
              id="portfolio"
              type="url"
              placeholder="https://..."
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability">
              Availability <span className="text-destructive">*</span>
            </Label>
            <Input
              id="availability"
              placeholder="e.g., 15-20 hrs/week starting next month"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            />
          </div>

          <div className="flex items-start space-x-2 p-4 bg-muted/50 rounded-lg">
            <Checkbox 
              id="nda" 
              checked={agreeNDA}
              onCheckedChange={(checked) => setAgreeNDA(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="nda"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Sign NDA to view full project details
              </Label>
              <p className="text-xs text-muted-foreground">
                Standard mutual non-disclosure agreement. Estimated time: 30 seconds.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="secondary">
            Submit Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyModal;
