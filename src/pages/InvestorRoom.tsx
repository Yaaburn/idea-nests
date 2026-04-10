import { useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Lock, 
  Eye, 
  Download, 
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Users,
  BarChart3,
  MessageCircle,
  Mail
} from "lucide-react";
import { toast } from "sonner";

const InvestorRoom = () => {
  const { id } = useParams();
  const [pledgeAmount, setPledgeAmount] = useState("");
  const [message, setMessage] = useState("");

  // Mock sealed deck data
  const project = {
    title: "SolarSense - Farm Monitoring System",
    tagline: "Revolutionizing agriculture with affordable IoT sensors",
    founder: {
      name: "Sarah Chen",
      email: "sarah@solarsense.io",
      bio: "Former Stanford researcher, 8 years in AgTech",
    },
    status: "Seed Round",
    seeking: "$500K",
    valuation: "$3M pre-money",
    traction: {
      users: "150 pilot farms",
      revenue: "$45K ARR",
      growth: "+40% MoM",
    },
    financials: {
      burn: "$25K/month",
      runway: "18 months",
      projectedRevenue: "$500K Year 1, $2M Year 2",
    },
    team: [
      { name: "Sarah Chen", role: "CEO", linkedin: "#" },
      { name: "Alex Kim", role: "CTO", linkedin: "#" },
      { name: "Maria Garcia", role: "Head of Hardware", linkedin: "#" },
    ],
    metrics: {
      customerAcquisitionCost: "$120",
      lifetimeValue: "$2,400",
      churnRate: "5%/month",
      grossMargin: "75%",
    },
    useOfFunds: [
      { category: "Product Development", amount: 200000, percent: 40 },
      { category: "Sales & Marketing", amount: 150000, percent: 30 },
      { category: "Operations", amount: 100000, percent: 20 },
      { category: "Working Capital", amount: 50000, percent: 10 },
    ],
  };

  const handleRequestMeeting = () => {
    toast.success("Meeting request sent to founder!");
  };

  const handlePledge = () => {
    if (!pledgeAmount) {
      toast.error("Please enter a pledge amount");
      return;
    }
    toast.success(`Pledge of $${pledgeAmount} submitted successfully!`);
  };

  const handleDownload = (docType: string) => {
    toast.success(`${docType} downloaded successfully`);
  };

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-background">
        {/* Sealed Access Banner */}
        <div className="bg-gradient-to-r from-secondary/20 to-accent/20 border-b border-secondary/30">
          <div className="container mx-auto px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-secondary" />
                <div>
                  <p className="font-semibold">Sealed Investor Room</p>
                  <p className="text-sm text-muted-foreground">
                    NDA-protected • Watermarked • Access logged
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                Confidential
              </Badge>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-background border-b">
          <div className="container mx-auto px-4 lg:px-8 py-12">
            <div className="max-w-4xl">
              <Badge variant="outline" className="mb-4">{project.status}</Badge>
              <h1 className="text-4xl font-bold mb-3">{project.title}</h1>
              <p className="text-xl text-muted-foreground mb-6">{project.tagline}</p>

              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Seeking: </span>
                  <span className="font-semibold text-lg">{project.seeking}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Valuation: </span>
                  <span className="font-semibold">{project.valuation}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Revenue: </span>
                  <span className="font-semibold">{project.traction.revenue}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Growth: </span>
                  <span className="font-semibold text-secondary">{project.traction.growth}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview">
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="financials">Financials</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-secondary" />
                      Traction
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Users</p>
                        <p className="text-2xl font-bold">{project.traction.users}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">ARR</p>
                        <p className="text-2xl font-bold">{project.traction.revenue}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">MoM Growth</p>
                        <p className="text-2xl font-bold text-secondary">{project.traction.growth}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-secondary" />
                      Key Metrics
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(project.metrics).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Use of Funds</h3>
                    <div className="space-y-4">
                      {project.useOfFunds.map((item) => (
                        <div key={item.category}>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm">{item.category}</span>
                            <span className="text-sm font-semibold">
                              ${(item.amount / 1000).toFixed(0)}K ({item.percent}%)
                            </span>
                          </div>
                          <Progress value={item.percent} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="financials" className="space-y-6">
                  <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Current Financials</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Burn</span>
                        <span className="font-semibold">{project.financials.burn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Runway</span>
                        <span className="font-semibold">{project.financials.runway}</span>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Revenue Projections</p>
                        <p className="font-semibold">{project.financials.projectedRevenue}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-secondary/5 border-secondary/20">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-secondary mt-1" />
                      <div>
                        <h4 className="font-semibold mb-2">Detailed Financial Model</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Access full 5-year financial projections, cap table, and unit economics breakdown
                        </p>
                        <Button size="sm" variant="outline" onClick={() => handleDownload("Financial Model")}>
                          <Download className="h-4 w-4 mr-2" />
                          Download Excel Model
                        </Button>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="team" className="space-y-4">
                  {project.team.map((member, index) => (
                    <Card key={index} className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">{member.name}</h4>
                          <p className="text-muted-foreground">{member.role}</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                            <Users className="h-4 w-4 mr-2" />
                            LinkedIn
                          </a>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="documents" className="space-y-3">
                  {[
                    { name: "Pitch Deck", icon: FileText, size: "8.2 MB" },
                    { name: "Financial Model", icon: BarChart3, size: "1.5 MB" },
                    { name: "Cap Table", icon: Users, size: "450 KB" },
                    { name: "Product Demo Video", icon: Eye, size: "45 MB" },
                  ].map((doc, index) => (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-secondary/10 flex items-center justify-center">
                            <doc.icon className="h-5 w-5 text-secondary" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">{doc.size}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc.name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - Actions */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6 sticky top-24">
                <h3 className="font-semibold mb-4">Take Action</h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pledge">Pledge Amount</Label>
                    <div className="flex gap-2 mt-2">
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="pledge"
                          type="number"
                          placeholder="50000"
                          value={pledgeAmount}
                          onChange={(e) => setPledgeAmount(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>

                  <Button className="w-full" variant="secondary" onClick={handlePledge}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Submit Pledge
                  </Button>

                  <Separator />

                  <Button className="w-full" variant="outline" onClick={handleRequestMeeting}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Request Meeting
                  </Button>

                  <Button className="w-full" variant="outline" asChild>
                    <a href={`mailto:${project.founder.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Email Founder
                    </a>
                  </Button>
                </div>

                <Separator className="my-6" />

                <div>
                  <Label htmlFor="message" className="mb-2 block">Message to Founder</Label>
                  <Textarea
                    id="message"
                    placeholder="I'm interested in learning more about..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button className="w-full mt-3" variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </Card>

              <Card className="p-4 bg-muted/50">
                <p className="text-xs text-muted-foreground">
                  <Lock className="h-3 w-3 inline mr-1" />
                  This document is watermarked with your email and access is logged for security purposes.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default InvestorRoom;
