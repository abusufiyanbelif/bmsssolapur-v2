// src/app/services/page.tsx
"use client";

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
  Component,
  Palette,
  Bot,
  Cloud,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { getAllUsers } from "@/services/user-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllDonations } from "@/services/donation-service";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { checkDatabaseConnection, testTwilioConnection, testNodemailerConnection, testGeminiConnection } from "./actions";


type StatusTuple = { status: 'idle' | 'loading' | 'success' | 'error', message: string };

const initialStatus: StatusTuple = { status: 'idle', message: '' };

export default function ServicesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [dbStatus, setDbStatus] = useState<StatusTuple>(initialStatus);
  const [twilioStatus, setTwilioStatus] = useState<StatusTuple>(initialStatus);
  const [nodemailerStatus, setNodemailerStatus] = useState<StatusTuple>(initialStatus);
  const [geminiStatus, setGeminiStatus] = useState<StatusTuple>(initialStatus);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fetchedUsers, fetchedLeads, fetchedDonations] = await Promise.all([
          getAllUsers(),
          getAllLeads(),
          getAllDonations(),
        ]);
        setUsers(fetchedUsers);
        setLeads(fetchedLeads);
        setDonations(fetchedDonations);
      } catch (e) {
        console.error("Failed to fetch initial data for services page", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTestConnection = async (
      action: () => Promise<{success: boolean, error?: string}>,
      setStatus: React.Dispatch<React.SetStateAction<StatusTuple>>,
      serviceName: string
  ) => {
    setStatus({ status: 'loading', message: '' });
    const result = await action();
    if (result.success) {
      setStatus({ status: 'success', message: `Successfully connected to ${serviceName}.` });
    } else {
      setStatus({ status: 'error', message: result.error || 'An unknown error occurred.' });
    }
  };

  const scannedDonations = donations.filter(d => d.source?.includes('Scan')).length;
  
  const services = [
    {
      name: "Firebase Authentication",
      description: "Manages user sign-up, login, and sessions.",
      icon: Fingerprint,
      metric: users.length.toLocaleString(),
      metricLabel: "Total Users",
    },
    {
      name: "Firestore Database",
      description: "Stores all application data like users, leads, and donations.",
      icon: Database,
      metrics: [
        { label: "Users", value: users.length.toLocaleString(), icon: Users },
        { label: "Leads", value: leads.length.toLocaleString(), icon: FileText },
        { label: "Donations", value: donations.length.toLocaleString(), icon: HandHeart },
      ],
      action: () => handleTestConnection(checkDatabaseConnection, setDbStatus, "the database"),
      status: dbStatus,
    },
    {
      name: "Gemini LLM",
      description: "Powers AI features like scanning donation proofs.",
      icon: BrainCircuit,
      metric: scannedDonations.toLocaleString(),
      metricLabel: "Scanned Proofs",
      action: () => handleTestConnection(testGeminiConnection, setGeminiStatus, "Gemini"),
      status: geminiStatus,
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
      action: () => handleTestConnection(testTwilioConnection, setTwilioStatus, "Twilio"),
      status: twilioStatus,
    },
    {
      name: "Nodemailer",
      description: "Sends emails for notifications and other purposes.",
      icon: Mail,
      metric: "Configured",
      metricLabel: "Status",
      action: () => handleTestConnection(testNodemailerConnection, setNodemailerStatus, "Nodemailer"),
      status: nodemailerStatus,
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
              <CardContent className="flex-grow space-y-4">
                <p className="text-sm text-muted-foreground">{service.description}</p>
                 {service.status && service.status.status !== 'idle' && (
                  <div className={`p-3 rounded-md text-sm ${service.status.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-destructive/10 text-destructive'}`}>
                    <div className="flex items-center gap-2 font-semibold">
                      {service.status.status === 'success' ? <CheckCircle className="h-4 w-4" /> : service.status.status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin"/> : <AlertCircle className="h-4 w-4" />}
                      <p>
                        {service.status.status === 'success' ? 'Connection Successful' :
                         service.status.status === 'loading' ? 'Testing...' :
                         'Connection Failed'}
                      </p>
                    </div>
                    <p className="text-xs mt-1 pl-1">{service.status.message}</p>
                  </div>
                 )}
              </CardContent>
              <CardFooter className="bg-muted/50 p-4">
                {service.action ? (
                    <Button onClick={service.action} disabled={service.status.status === 'loading'} className="w-full">
                      {service.status.status === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4" />}
                      Test Connection
                    </Button>
                ) : service.metrics ? (
                    <div className="w-full space-y-2">
                        {loading ? (
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        ) : (
                          service.metrics.map(metric => (
                              <div key={metric.label} className="flex justify-between items-center text-sm">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                      <metric.icon className="h-4 w-4" />
                                      <span>{metric.label}</span>
                                  </div>
                                  <span className="font-semibold">{metric.value}</span>
                              </div>
                          ))
                        )}
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

      <Card>
        <CardHeader>
          <CardTitle>Data & Logs Location</CardTitle>
          <CardDescription>
            Your application&apos;s data and logs are securely managed by Google Cloud and Firebase. Here’s where to find them.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Database /> Firestore Database</CardTitle>
                </CardHeader>
                 <CardContent>
                    <p className="text-sm text-muted-foreground">
                        All your application data (Users, Leads, Donations, etc.) is stored in Firestore. You can browse, edit, and manage this data directly in the Firebase Console.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                        <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">
                            Go to Firebase Console <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Server /> Application Logs</CardTitle>
                </CardHeader>
                 <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Server-side logs from Firebase Hosting and Genkit AI flows are centralized in Google Cloud Logging. Use these logs to debug issues and monitor activity.
                    </p>
                </CardContent>
                 <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                        <a href="https://console.cloud.google.com/logs" target="_blank" rel="noopener noreferrer">
                            Go to Cloud Logging <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                </CardFooter>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Cloud /> File Storage</CardTitle>
                </CardHeader>
                 <CardContent>
                    <p className="text-sm text-muted-foreground">
                       Any files uploaded by users, such as donation proofs or verification documents, are stored securely in Cloud Storage for Firebase.
                    </p>
                </CardContent>
                 <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                        <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">
                            Go to Firebase Storage <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                </CardFooter>
            </Card>
        </CardContent>
      </Card>

    </div>
  );
}