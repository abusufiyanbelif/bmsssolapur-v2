
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Fingerprint,
  Server,
  MessageSquare,
  Mail,
  BrainCircuit,
  Database,
  Users,
  FileText,
  HandHeart,
  ScanEye,
  Component,
  Palette,
  Bot,
  Cloud,
} from "lucide-react";
import { getAllUsers } from "@/services/user-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllDonations } from "@/services/donation-service";

export default async function ServicesPage() {
  // Fetch data to calculate usage metrics
  const [allUsers, allLeads, allDonations] = await Promise.all([
    getAllUsers(),
    getAllLeads(),
    getAllDonations(),
  ]);

  const scannedDonations = allDonations.filter(d => d.source?.includes('Scan')).length;
  
  const services = [
    {
      name: "Firebase Authentication",
      description: "Manages user sign-up, login, and sessions.",
      icon: Fingerprint,
      metric: allUsers.length.toLocaleString(),
      metricLabel: "Total Users",
    },
    {
      name: "Firestore Database",
      description: "Stores all application data like users, leads, and donations.",
      icon: Database,
      metrics: [
        { label: "Users", value: allUsers.length.toLocaleString(), icon: Users },
        { label: "Leads", value: allLeads.length.toLocaleString(), icon: FileText },
        { label: "Donations", value: allDonations.length.toLocaleString(), icon: HandHeart },
      ],
    },
    {
      name: "Gemini LLM",
      description: "Powers AI features like scanning donation proofs.",
      icon: BrainCircuit,
      metric: scannedDonations.toLocaleString(),
      metricLabel: "Scanned Proofs",
    },
     {
      name: "Firebase Hosting",
      description: "Serves the Next.js application to users.",
      icon: Server,
      metric: "Active",
      metricLabel: "Status",
    },
    {
      name: "Twilio",
      description: "Handles sending OTPs via SMS for phone-based login.",
      icon: MessageSquare,
      metric: "Configured",
      metricLabel: "Status",
    },
    {
      name: "Nodemailer",
      description: "Sends emails for notifications and other purposes.",
      icon: Mail,
      metric: "Configured",
      metricLabel: "Status",
    },
  ];

  return (
    <div className="flex-1 space-y-4">
      <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">
        Services Summary
      </h2>

      <Card>
        <CardHeader>
          <CardTitle>Technology Stack</CardTitle>
          <CardDescription>
            This application is built with the following technologies and frameworks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Component className="h-6 w-6 text-primary flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Frontend Framework</p>
                        <p className="text-muted-foreground">Next.js & React</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Palette className="h-6 w-6 text-primary flex-shrink-0" />
                    <div>
                        <p className="font-semibold">UI Components & Styling</p>
                        <p className="text-muted-foreground">ShadCN UI & Tailwind CSS</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Generative AI</p>
                        <p className="text-muted-foreground">Genkit & Google AI</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Cloud className="h-6 w-6 text-primary flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Backend Platform</p>
                        <p className="text-muted-foreground">Firebase</p>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Usage & Configuration Overview</CardTitle>
          <CardDescription>
            An overview of all Firebase and external services used in the
            project, along with their current usage metrics.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.name} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-4">
                    <service.icon className="h-8 w-8 text-primary" />
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </CardContent>
              <CardFooter className="bg-muted/50 p-4">
                {service.metrics ? (
                    <div className="w-full space-y-2">
                        {service.metrics.map(metric => (
                             <div key={metric.label} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <metric.icon className="h-4 w-4" />
                                    <span>{metric.label}</span>
                                </div>
                                <span className="font-semibold">{metric.value}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex justify-between items-center w-full">
                        <span className="text-sm text-muted-foreground">{service.metricLabel}:</span>
                        <span className="font-bold text-lg">{service.metric}</span>
                    </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
