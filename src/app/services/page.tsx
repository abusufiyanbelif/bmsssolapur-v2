

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
  ArrowUpCircle,
  Package,
  CreditCard,
} from "lucide-react";
import { getAllUsers } from "@/services/user-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllDonations } from "@/services/donation-service";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { checkDatabaseConnection, testTwilioConnection, testNodemailerConnection, testGeminiConnection, testGatewayConnection } from "./actions";
import packageJson from '../../../package.json';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


type StatusTuple = { status: 'idle' | 'loading' | 'success' | 'error', message: string };
const initialStatus: StatusTuple = { status: 'idle', message: '' };

type VersionStatus = 'checking' | 'uptodate' | 'stale' | 'error';


const ServiceCard = ({ service, loading }: { service: any, loading: boolean }) => {
    const [status, setStatus] = useState<StatusTuple>(initialStatus);
    const [latestVersion, setLatestVersion] = useState<string | null>(null);
    const [versionStatus, setVersionStatus] = useState<VersionStatus>('checking');
    
    const packageName = service.version?.split(' v')[0];
    const currentVersion = service.version?.split(' v')[1];

    useEffect(() => {
        if (!packageName) {
            setVersionStatus('error');
            return;
        }

        const getLatestVersion = async () => {
            try {
                setVersionStatus('checking');
                const response = await fetch(`https://registry.npmjs.org/${packageName}`);
                if (!response.ok) {
                    throw new Error('NPM registry request failed');
                }
                const data = await response.json();
                const latest = data['dist-tags'].latest;
                setLatestVersion(latest);
                
                // Basic semver comparison (could be more robust)
                if (latest === currentVersion) {
                    setVersionStatus('uptodate');
                } else {
                    setVersionStatus('stale');
                }
            } catch (error) {
                console.error(`Failed to fetch latest version for ${packageName}`, error);
                setVersionStatus('error');
            }
        };

        getLatestVersion();
    }, [packageName, currentVersion]);


    const handleTest = async () => {
        if (!service.action) return;
        setStatus({ status: 'loading', message: '' });
        const result = await service.action();
        if (result.success) {
        setStatus({ status: 'success', message: `Successfully connected to ${service.name}.` });
        } else {
        setStatus({ status: 'error', message: result.error || 'An unknown error occurred.' });
        }
    };

    const VersionInfo = () => {
        switch (versionStatus) {
            case 'checking':
                return <Loader2 className="h-4 w-4 animate-spin" />;
            case 'uptodate':
                return <Badge variant="success" className="text-xs">Up to date</Badge>;
            case 'stale':
                return (
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Badge variant="warning" className="text-xs cursor-help">
                                    <ArrowUpCircle className="mr-1 h-3 w-3" />
                                    Update Available
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Latest version: {latestVersion}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            case 'error':
            default:
                return null;
        }
    }


    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <service.icon className="h-8 w-8 text-primary" />
                        <CardTitle className="text-lg text-primary">{service.name}</CardTitle>
                    </div>
                    {service.version && (
                         <div className="flex items-center gap-2">
                             <VersionInfo />
                            <div className="text-xs font-mono text-muted-foreground">{service.version}</div>
                         </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <p className="text-sm text-muted-foreground">{service.description}</p>
                 {status.status !== 'idle' && (
                    <div className={`p-3 rounded-md text-sm ${status.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-destructive/10 text-destructive'}`}>
                        <div className="flex items-center gap-2 font-semibold">
                        {status.status === 'success' ? <CheckCircle className="h-4 w-4" /> : status.status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin"/> : <AlertCircle className="h-4 w-4" />}
                        <p>
                            {status.status === 'success' ? 'Connection Successful' :
                            status.status === 'loading' ? 'Testing...' :
                            'Connection Failed'}
                        </p>
                        </div>
                        <p className="text-xs mt-1 pl-1">{status.message}</p>
                    </div>
                 )}
            </CardContent>
            <CardFooter className="bg-muted/50 p-4">
                {service.action ? (
                    <Button onClick={handleTest} disabled={status.status === 'loading'} className="w-full">
                        {status.status === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4" />}
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
                          service.metrics.map((metric: any) => (
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
    );
};


export default function ServicesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const scannedDonations = donations.filter(d => d.source?.includes('Scan')).length;
  
  const services = [
    {
      name: "Firebase Authentication",
      description: "Manages user sign-up, login, and sessions.",
      icon: Fingerprint,
      metric: users.length.toLocaleString(),
      metricLabel: "Total Users",
      version: `firebase v${packageJson.dependencies.firebase}`,
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
      action: () => checkDatabaseConnection(),
      status: null,
      version: `firebase v${packageJson.dependencies.firebase}`,
    },
    {
      name: "Gemini LLM",
      description: "Powers AI features like scanning donation proofs.",
      icon: BrainCircuit,
      metric: scannedDonations.toLocaleString(),
      metricLabel: "Scanned Proofs",
      action: () => testGeminiConnection(),
      status: null,
      version: `genkit v${packageJson.dependencies.genkit}`,
    },
     {
      name: "Firebase Hosting",
      description: "Serves the Next.js application to users.",
      icon: Server,
      metric: "Active",
      metricLabel: "Status",
      version: `next v${packageJson.dependencies.next}`,
    },
    {
      name: "Twilio",
      description: "Handles sending OTPs via SMS for phone-based login.",
      icon: MessageSquare,
      metric: "Configured",
      metricLabel: "Status",
      action: () => testTwilioConnection(),
      status: null,
      version: `twilio v${packageJson.dependencies.twilio}`,
    },
    {
      name: "Nodemailer",
      description: "Sends emails for notifications and other purposes.",
      icon: Mail,
      metric: "Configured",
      metricLabel: "Status",
      action: () => testNodemailerConnection(),
      status: null,
      version: `nodemailer v${packageJson.dependencies.nodemailer}`,
    },
     {
      name: "Razorpay",
      description: "An external payment gateway for processing online donations.",
      icon: CreditCard,
      metric: "Configured",
      metricLabel: "Status",
      action: () => testGatewayConnection('razorpay'),
      status: null,
      version: `razorpay v${packageJson.dependencies.razorpay}`,
    },
  ];

  return (
    <div className="flex-1 space-y-4">
      <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">
        Services Summary
      </h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Technology Stack</CardTitle>
          <CardDescription className="text-muted-foreground">
            This application is built with the following technologies and frameworks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Package className="h-6 w-6 text-primary flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Frontend Framework</p>
                        <p className="text-muted-foreground">Next.js & React v{packageJson.dependencies.react}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Palette className="h-6 w-6 text-primary flex-shrink-0" />
                    <div>
                        <p className="font-semibold">UI Components & Styling</p>
                        <p className="text-muted-foreground">ShadCN UI & Tailwind CSS v{packageJson.devDependencies.tailwindcss}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Generative AI</p>
                        <p className="text-muted-foreground">Genkit v{packageJson.dependencies.genkit} & Google AI</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Cloud className="h-6 w-6 text-primary flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Backend Platform</p>
                        <p className="text-muted-foreground">Firebase v{packageJson.dependencies.firebase}</p>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Usage & Configuration Overview</CardTitle>
          <CardDescription className="text-muted-foreground">
            An overview of all Firebase and external services used in the
            project, along with their current usage metrics.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.name} service={{...service, loading}} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Data & Logs Location</CardTitle>
          <CardDescription className="text-muted-foreground">
            Your application&apos;s data and logs are securely managed by Google Cloud and Firebase. Here’s where to find them.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Database className="text-primary" /> Firestore Database</CardTitle>
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
                    <CardTitle className="flex items-center gap-2"><Server className="text-primary" /> Application Logs</CardTitle>
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
                    <CardTitle className="flex items-center gap-2"><Cloud className="text-primary" /> File Storage</CardTitle>
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

    
