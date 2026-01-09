import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Clock, 
  MapPin, 
  Briefcase, 
  Upload, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  FileText,
  Link as LinkIcon
} from "lucide-react";

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle?: string;
  roleTitle?: string;
  company?: string;
  location?: string;
  type?: string;
  deadline?: string;
}

type Step = "overview" | "form" | "success";

const ApplyModal = ({ 
  isOpen, 
  onClose, 
  projectTitle = "Project",
  roleTitle = "Team Member",
  company = "TalentNet Project",
  location = "Remote",
  type = "Part-time",
  deadline = "March 30, 2026"
}: ApplyModalProps) => {
  const [step, setStep] = useState<Step>("overview");
  
  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [portfolioLink, setPortfolioLink] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [whyInterested, setWhyInterested] = useState("");
  const [startDate, setStartDate] = useState("");
  const [availability, setAvailability] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleClose = () => {
    setStep("overview");
    onClose();
  };

  const handleContinue = () => {
    setStep("form");
  };

  const handleBack = () => {
    setStep("overview");
  };

  const handleSubmit = () => {
    if (!fullName || !email || !whyInterested) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!agreeTerms) {
      toast.error("Please confirm that your information is accurate");
      return;
    }
    setStep("success");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setCvFile(file);
    }
  };

  const getProgress = () => {
    switch (step) {
      case "overview": return 0;
      case "form": return 50;
      case "success": return 100;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Progress indicator */}
        {step !== "success" && (
          <Progress value={getProgress()} className="h-1 mb-4" />
        )}

        {/* Step 1: Overview */}
        {step === "overview" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Apply for: {roleTitle}</DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Summary Card */}
              <Card className="p-4 bg-muted/30">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Company:</span>
                    <span className="font-medium">{company}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="secondary">{type}</Badge>
                  </div>
                  {deadline && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Deadline:</span>
                      <span className="font-medium">{deadline}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Microcopy */}
              <p className="text-sm text-muted-foreground text-center">
                This application will take about 5–7 minutes.
              </p>
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleContinue} className="gap-2">
                Continue Application
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Application Form */}
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Application Form</DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* A. Basic Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Personal Information
                </h4>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* B. Documents */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Documents
                </h4>

                <div className="space-y-2">
                  <Label>Upload CV (PDF)</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="cv-upload"
                    />
                    <label htmlFor="cv-upload" className="cursor-pointer">
                      {cvFile ? (
                        <div className="flex items-center justify-center gap-2 text-primary">
                          <FileText className="h-5 w-5" />
                          <span className="text-sm font-medium">{cvFile.name}</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Accepted formats: PDF. Max size: 10MB.
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portfolio Link</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="portfolio"
                      type="url"
                      placeholder="https://your-portfolio.com"
                      value={portfolioLink}
                      onChange={(e) => setPortfolioLink(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn / Website (optional)</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={linkedIn}
                    onChange={(e) => setLinkedIn(e.target.value)}
                  />
                </div>
              </div>

              {/* C. Short Questions */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Short Questions
                </h4>

                <div className="space-y-2">
                  <Label htmlFor="whyInterested">
                    Why are you interested in this role? <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="whyInterested"
                    placeholder="Tell us why you're excited about this opportunity..."
                    value={whyInterested}
                    onChange={(e) => setWhyInterested(e.target.value.slice(0, 300))}
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {whyInterested.length}/300 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">When can you start?</Label>
                  <Input
                    id="startDate"
                    placeholder="e.g., Immediately, 2 weeks notice"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availability">Are you available full-time or part-time?</Label>
                  <Input
                    id="availability"
                    placeholder="e.g., Part-time, 15-20 hrs/week"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                  />
                </div>
              </div>

              {/* D. Confirmation */}
              <div className="flex items-start space-x-2 p-4 bg-muted/50 rounded-lg">
                <Checkbox 
                  id="terms" 
                  checked={agreeTerms}
                  onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    I confirm that the information provided is accurate.
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleSubmit}>
                Submit Application
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Success State */}
        {step === "success" && (
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Application Submitted Successfully!</h2>
              <p className="text-muted-foreground">
                Thank you for applying for the <span className="font-medium text-foreground">{roleTitle}</span> position.
              </p>
            </div>

            <Card className="p-4 bg-muted/30 text-left">
              <p className="text-sm text-muted-foreground">
                Our team will review your application and contact you via email within <span className="font-medium text-foreground">7–10 working days</span>.
              </p>
            </Card>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleClose}>
                Back to Project
              </Button>
              <Button onClick={handleClose} variant="secondary">
                View My Applications
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ApplyModal;