
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
import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { DonationType } from "@/services/donation-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


const leadCategories: Exclude<DonationType, 'Split' | 'Lillah' | 'Kaffarah'>[] = ['Zakat', 'Sadaqah', 'Fitr'];

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
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setUserId(storedUserId);
    setLoading(false);
  }, []);

  const form = useForm<RequestHelpFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      helpRequested: 0,
    },
  });

  async function onSubmit(values: RequestHelpFormValues) {
    if (!userId) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in to submit a request." });
        return;
    }
    
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("category", values.category);
    formData.append("helpRequested", String(values.helpRequested));
    if(values.caseDetails) formData.append("caseDetails", values.caseDetails);
    if(values.verificationDocument) formData.append("verificationDocument", values.verificationDocument);
    
    const result = await handleRequestHelp(formData, userId);

    setIsSubmitting(false);

    if (result.success && result.lead) {
      toast({
        title: "Request Submitted",
        description: `Your help request has been successfully submitted for review.`,
      });
      form.reset();
    } else {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (!userId) {
    return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>You must be logged in as a Beneficiary to access this page.</AlertDescription>
        </Alert>
    );
  }

  return (
     <div className="flex-1 space-y-4">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Request Assistance</h2>
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
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Verification Document</FormLabel>
                        <FormControl>
                            <Input 
                            type="file" 
                            accept="image/*,application/pdf"
                            onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                            />
                        </FormControl>
                        <FormDescription>
                            (Optional) Upload a supporting document (e.g., ID card, medical report, bill).
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit for Review
                    </Button>
                </form>
                </Form>
            </CardContent>
        </Card>
     </div>
  );
}
