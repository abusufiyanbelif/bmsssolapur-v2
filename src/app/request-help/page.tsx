
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { handleRequestHelp } from "./actions";
import { useState, useEffect, useRef } from "react";
import { Loader2, AlertCircle, CheckCircle, HandHeart, XCircle, FileIcon, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Lead, AppSettings } from "@/services/types";
import Link from "next/link";
import { getAppSettings } from "@/app/admin/settings/actions";
import { Progress } from "@/components/ui/progress"; // Import Progress component
import { Label } from "@/components/ui/label";
import Image from "next/image";


const leadCategories = ['Education Fees', 'Medical Bill', 'Ration Kit', 'Zakat', 'Sadaqah', 'Fitr'] as const;

const formSchema = z.object({
  category: z.enum(leadCategories),
  helpRequested: z.coerce.number().min(1, "Amount must be greater than 0."),
  caseDetails: z.string().min(20, "Please provide at least 20 characters of detail about your case."),
  verificationDocument: z.any().optional(),
});

type RequestHelpFormValues = z.infer<typeof formSchema>;

export default function RequestHelpPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string |null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<Lead | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
        setUserId(storedUserId);
    } else {
        setError("You must be logged in to submit a request.");
        setLoading(false);
    }
    
    getAppSettings().then(setSettings).finally(() => setLoading(false));
  }, []);

  const form = useForm<RequestHelpFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      helpRequested: 0,
      caseDetails: "",
      category: undefined,
      verificationDocument: undefined,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    form.setValue('verificationDocument', selectedFile, { shouldValidate: true });
    setFile(selectedFile);
    if(filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(selectedFile ? URL.createObjectURL(selectedFile) : null);
    setZoom(1);
    setRotation(0);
  };

  async function onSubmit(values: RequestHelpFormValues) {
    if (!userId) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in to submit a request." });
        return;
    }
    
    setIsSubmitting(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append("category", values.category);
    formData.append("helpRequested", String(values.helpRequested));
    if(values.caseDetails) formData.append("caseDetails", values.caseDetails);
    if(values.verificationDocument) formData.append("verificationDocument", values.verificationDocument);
    
    // The server action can't stream progress back. This is a simulation.
    // In a real app, a client-side upload function would be used.
    const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    const result = await handleRequestHelp(formData, userId, setUploadProgress);
    
    clearInterval(interval);
    setUploadProgress(100);
    setIsSubmitting(false);

    if (result.success && result.lead) {
      setSubmittedLead(result.lead);
      setShowSuccessDialog(true);
    } else {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  }

  const handleDialogClose = () => {
    setShowSuccessDialog(false);
    form.reset({
        helpRequested: 0,
        caseDetails: '',
        category: undefined,
        verificationDocument: undefined,
    });
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    setSubmittedLead(null);
  }
  
  const allowRequests = settings?.leadConfiguration?.allowBeneficiaryRequests ?? false;

  if (loading) {
    return (
        <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (error || !userId) {
    return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>{error || "Could not identify user."}</AlertDescription>
        </Alert>
    );
  }

  if (!allowRequests) {
        return (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Submissions Temporarily Closed</AlertTitle>
                <AlertDescription>We are not accepting new help requests at this time. Please check back later.</AlertDescription>
            </Alert>
        )
    }

  return (
     <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Request Assistance</h2>
            <Button asChild>
                <Link href="/campaigns">
                    <HandHeart className="mr-2 h-4 w-4" />
                    Donate Now
                </Link>
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Submit a Help Request</CardTitle>
                <CardDescription>
                    Fill out the form below with the details of your case. All submissions will be reviewed by our team.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Category of Need</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {leadCategories.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>The type of aid you are requesting.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="helpRequested"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Amount Requested (INR)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Enter amount" {...field} />
                            </FormControl>
                            <FormDescription>The total amount of funds needed.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>

                    <FormField
                    control={form.control}
                    name="caseDetails"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Case Details</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Please provide a detailed summary of your situation, the reason for the need, and any other relevant information. This will help us verify your case."
                                className="resize-y min-h-[120px]"
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                    control={form.control}
                    name="verificationDocument"
                    render={({ field: { onChange, value, ...rest } }) => (
                        <FormItem>
                        <FormLabel>Verification Document</FormLabel>
                        <FormControl>
                             <div className="relative">
                                <Input 
                                type="file"
                                ref={fileInputRef}
                                accept="image/*,application/pdf"
                                onChange={handleFileChange}
                                className="pr-10"
                                />
                                {file && (
                                     <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute top-1/2 right-1 -translate-y-1/2 h-7 w-7"
                                        onClick={() => {
                                            form.setValue('verificationDocument', null);
                                            setFile(null);
                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                        }}
                                    >
                                        <XCircle className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                )}
                            </div>
                        </FormControl>
                        <FormDescription>
                            (Optional) Upload a supporting document (e.g., ID card, medical report, bill).
                        </FormDescription>
                        {filePreview && (
                            <div className="relative group p-2 border rounded-lg">
                                <div className="relative w-full h-60 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto flex items-center justify-center">
                                    {file?.type.startsWith('image/') ? (
                                        <Image 
                                            src={filePreview} 
                                            alt="Proof preview" 
                                            width={600 * zoom}
                                            height={600 * zoom}
                                            className="object-contain transition-transform duration-100"
                                            style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <FileIcon className="h-16 w-16" />
                                            <span className="text-sm font-semibold">{file?.name}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-md">
                                    <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setZoom(z => z * 1.2)}><ZoomIn className="h-4 w-4"/></Button>
                                    <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setZoom(z => Math.max(0.5, z / 1.2))}><ZoomOut className="h-4 w-4"/></Button>
                                    <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setRotation(r => r + 90)}><RotateCw className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        )}
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    {isSubmitting && (
                        <div className="space-y-2">
                            <Label>Uploading Document...</Label>
                            <Progress value={uploadProgress} />
                            <p className="text-xs text-muted-foreground text-center">{Math.round(uploadProgress)}%</p>
                        </div>
                    )}

                    <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit for Review
                    </Button>
                </form>
                </Form>
            </CardContent>
        </Card>
        
        <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
            <AlertDialogContent>
                 <AlertDialogHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <AlertDialogTitle className="text-center">Request Submitted Successfully</AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                       Your request has been received and is now pending review. Here is a summary of your submission.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {submittedLead && (
                    <div className="text-sm space-y-3 rounded-lg border bg-muted/50 p-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Case ID</span>
                            <span className="font-mono text-xs">{submittedLead.id}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Category</span>
                            <span className="font-semibold">{submittedLead.category}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount Requested</span>
                            <span className="font-semibold">₹{submittedLead.helpRequested.toLocaleString()}</span>
                        </div>
                        <div>
                             <p className="text-muted-foreground mb-1">Details Provided:</p>
                             <p className="p-2 bg-background rounded text-foreground text-xs">{submittedLead.caseDetails}</p>
                        </div>
                    </div>
                )}
                 <AlertDialogFooter>
                    <AlertDialogAction asChild className="w-full">
                        <Link href="/my-cases">OK</Link>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
     </div>
  );
}
