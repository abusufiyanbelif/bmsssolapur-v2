
'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  Loader2,
  Upload,
  Download,
  Scan,
  Bot,
  UserPlus,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { handleAddLead } from '../add/actions';
import { getRawTextFromImage } from '@/app/actions';
import { handleExtractLeadDetailsFromText } from '../add/actions';
import Image from 'next/image';
import type { User, Lead } from '@/services/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  headline: z.string().optional(),
  caseDetails: z.string().optional(),
  helpRequested: z.coerce.number().optional(),
  // Add other relevant lead fields as needed
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateLeadFromDocumentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<Lead[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const { setValue, handleSubmit } = form;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    if (selectedFile) {
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    } else {
        setFile(null);
        setFilePreview(null);
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setIsScanning(true);
    const formData = new FormData();
    formData.append('imageFile', file);

    const result = await getRawTextFromImage(formData);
    if (result.success && result.rawText) {
      setRawText(result.rawText);
      toast({ title: 'Text Extracted', description: 'Raw text has been extracted from the document.' });
    } else {
      toast({ variant: 'destructive', title: 'Extraction Failed', description: result.error });
    }
    setIsScanning(false);
  };

  const handleAnalyze = async () => {
    if (!rawText) return;
    setIsAnalyzing(true);
    const result = await handleExtractLeadDetailsFromText(rawText);
    if (result.success && result.details) {
      const details = result.details;
      // This is where you would map extracted details to your lead creation form
      // For now, let's just populate a few fields as an example
      if (details.headline) setValue('headline', details.headline);
      if (details.caseDetails) setValue('caseDetails', details.caseDetails);
      if (details.amount) setValue('helpRequested', details.amount);

      toast({ title: 'Analysis Complete', description: 'Extracted details have been populated in the form below.' });
    } else {
      toast({ variant: 'destructive', title: 'Analysis Failed', description: result.error });
    }
    setIsAnalyzing(false);
  };

  const handleDownloadText = () => {
    const blob = new Blob([rawText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-text.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onSubmit = async (values: FormValues) => {
    // This is a placeholder for the actual lead creation logic.
    // In a real implementation, you would expand the form and this function.
    setIsSubmitting(true);
    toast({ title: "Form Submission (Placeholder)", description: "Lead creation from this form is not yet fully implemented."});
    console.log("Form submitted with values:", values);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    // After successful submission, you would likely redirect
    // router.push('/admin/leads');
  };

  return (
    <div className="flex-1 space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">
          Create Lead from Document
        </h2>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Left Column: Uploader and Extracted Text */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Upload Document</CardTitle>
              <CardDescription>
                Upload an image of a bill, ID card, or medical report.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                id="document-upload"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              {filePreview && (
                <div className="p-2 border rounded-md bg-muted/50 flex justify-center">
                  <Image
                    src={filePreview}
                    alt="Document Preview"
                    width={250}
                    height={350}
                    className="object-contain rounded-md"
                  />
                </div>
              )}
              <Button onClick={handleScan} disabled={!file || isScanning} className="w-full">
                {isScanning ? <Loader2 className="mr-2 animate-spin" /> : <Scan className="mr-2" />}
                Scan Document for Text
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Review Extracted Text</CardTitle>
              <CardDescription>
                Correct any errors in the extracted text. You can also analyze
                it to auto-fill the lead creation form.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Text from the scanned document will appear here..."
                rows={10}
                className="font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleAnalyze}
                  disabled={!rawText || isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? <Loader2 className="mr-2 animate-spin" /> : <Bot className="mr-2" />}
                  Analyze & Auto-fill
                </Button>
                <Button
                  onClick={handleDownloadText}
                  disabled={!rawText}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2" />
                  Download Text
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Lead Creation Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>3. Create Lead</CardTitle>
              <CardDescription>
                Review the auto-filled details and complete any remaining
                fields to create the new lead.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Example fields that could be auto-filled */}
                  <FormField
                    control={form.control}
                    name="headline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Headline</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Urgent medical assistance needed" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="caseDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case Details</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Details about the case..." rows={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="helpRequested"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount Requested (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 5000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Under Construction</AlertTitle>
                        <AlertDescription>
                         This form is a prototype. Additional fields and the logic to select a beneficiary and save the lead would be added here.
                        </AlertDescription>
                    </Alert>

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <UserPlus className="mr-2" />}
                    Create Lead (Placeholder)
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
