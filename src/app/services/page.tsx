
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
  const totalDocuments = allUsers.length + allLeads.length + allDonations.length;

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
      metric: totalDocuments.toLocaleString(),
      metricLabel: "Total Documents",
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
              <CardFooter className="bg-muted/50 p-4 flex justify-between items-center">
                 <span className="text-sm text-muted-foreground">{service.metricLabel}:</span>
                 <span className="font-bold text-lg">{service.metric}</span>
              </CardFooter>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
