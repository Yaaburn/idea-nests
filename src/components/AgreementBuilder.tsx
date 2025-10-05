import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface AgreementBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  contributorName: string;
}

const AgreementBuilder = ({ isOpen, onClose, projectTitle, contributorName }: AgreementBuilderProps) => {
  const [equity, setEquity] = useState([2]);
  const [vestingMonths, setVestingMonths] = useState([48]);
  const [cliffMonths, setCliffMonths] = useState([12]);
  const [hoursPerWeek, setHoursPerWeek] = useState("15");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showFullContract, setShowFullContract] = useState(false);

  const handleSign = () => {
    if (!agreedToTerms) {
      toast.error("Please agree to the terms to continue");
      return;
    }
    toast.success("Agreement signed successfully!");
    onClose();
  };

  const handleDownload = () => {
    toast.success("Contract downloaded as PDF");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Collaboration Agreement Builder</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {projectTitle} × {contributorName}
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Quick Summary */}
            <Card className="p-4 bg-secondary/5 border-secondary/20">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-secondary" />
                Agreement Summary
              </h4>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Equity: </span>
                  <span className="font-semibold">{equity[0]}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Commitment: </span>
                  <span className="font-semibold">{hoursPerWeek} hrs/week</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Vesting: </span>
                  <span className="font-semibold">{vestingMonths[0]} months</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cliff: </span>
                  <span className="font-semibold">{cliffMonths[0]} months</span>
                </div>
              </div>
            </Card>

            <Separator />

            {/* Equity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Equity Percentage</Label>
                <Badge variant="secondary">{equity[0]}%</Badge>
              </div>
              <Slider
                value={equity}
                onValueChange={setEquity}
                min={0.1}
                max={10}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Percentage of company equity offered for this collaboration
              </p>
            </div>

            {/* Vesting Schedule */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Vesting Period (months)</Label>
                <Badge variant="secondary">{vestingMonths[0]} months</Badge>
              </div>
              <Slider
                value={vestingMonths}
                onValueChange={setVestingMonths}
                min={12}
                max={60}
                step={6}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Total time over which equity vests. Standard is 48 months (4 years)
              </p>
            </div>

            {/* Cliff Period */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Cliff Period (months)</Label>
                <Badge variant="secondary">{cliffMonths[0]} months</Badge>
              </div>
              <Slider
                value={cliffMonths}
                onValueChange={setCliffMonths}
                min={0}
                max={24}
                step={3}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Minimum time before any equity vests. Standard is 12 months (1 year)
              </p>
            </div>

            {/* Commitment */}
            <div className="space-y-3">
              <Label htmlFor="hours">Time Commitment (hours/week)</Label>
              <Input
                id="hours"
                type="number"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(e.target.value)}
                min="1"
                max="60"
              />
              <p className="text-xs text-muted-foreground">
                Expected weekly time commitment for this role
              </p>
            </div>

            <Separator />

            {/* Contract Preview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base">Contract Preview</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullContract(!showFullContract)}
                >
                  {showFullContract ? "Hide" : "Show"} Full Contract
                </Button>
              </div>

              {showFullContract ? (
                <Card className="p-6 bg-muted/30">
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">COLLABORATION AGREEMENT</h4>
                      <p className="text-muted-foreground">
                        This Collaboration Agreement ("Agreement") is entered into as of {new Date().toLocaleDateString()}
                        between <strong>{projectTitle}</strong> ("Company") and <strong>{contributorName}</strong> ("Contributor").
                      </p>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">1. SCOPE OF WORK</h5>
                      <p className="text-muted-foreground">
                        Contributor agrees to provide services to Company for approximately {hoursPerWeek} hours per week
                        as mutually agreed upon by both parties.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">2. EQUITY COMPENSATION</h5>
                      <p className="text-muted-foreground">
                        Company grants Contributor {equity[0]}% equity in the company, subject to vesting over {vestingMonths[0]} months
                        with a {cliffMonths[0]}-month cliff period. No equity vests until the cliff date.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">3. VESTING SCHEDULE</h5>
                      <p className="text-muted-foreground">
                        After the {cliffMonths[0]}-month cliff period, {(equity[0] / vestingMonths[0] * cliffMonths[0]).toFixed(2)}% 
                        will vest immediately. The remaining equity will vest monthly over the remaining {vestingMonths[0] - cliffMonths[0]} months.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">4. INTELLECTUAL PROPERTY</h5>
                      <p className="text-muted-foreground">
                        All work product, inventions, and intellectual property created by Contributor in connection with
                        this collaboration shall be the exclusive property of Company.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">5. CONFIDENTIALITY</h5>
                      <p className="text-muted-foreground">
                        Contributor agrees to maintain confidentiality of all Company proprietary information and trade secrets.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">6. TERMINATION</h5>
                      <p className="text-muted-foreground">
                        Either party may terminate this Agreement with 30 days written notice. Upon termination,
                        unvested equity will be forfeited.
                      </p>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground italic">
                        This is a simplified preview. The full legal contract will include additional standard clauses
                        regarding governing law, dispute resolution, and other terms.
                      </p>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-4 bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    Standard collaboration agreement including equity grant of {equity[0]}%, 
                    vesting over {vestingMonths[0]} months with {cliffMonths[0]}-month cliff, 
                    intellectual property assignment, and confidentiality provisions.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setShowFullContract(true)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Full Contract
                  </Button>
                </Card>
              )}
            </div>

            {/* Agreement Checkbox */}
            <Card className="p-4 border-secondary/20">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agree"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="agree"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    I agree to the terms of this collaboration agreement
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    By checking this box, you electronically sign this agreement and acknowledge
                    that it has the same legal effect as a handwritten signature.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSign} variant="secondary" disabled={!agreedToTerms}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Sign Agreement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgreementBuilder;
