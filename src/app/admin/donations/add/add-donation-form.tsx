

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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { handleAddDonation, handleExtractTextFromImage } from "./actions";
import { useState, useEffect, Suspense, useRef } from "react";
import { Loader2, Info, Image as ImageIcon, CalendarIcon, FileText, Trash2, TextSearch, ChevronsUpDown, Check, X, ScanEye } from "lucide-react";
import type { User, DonationType, DonationPurpose, PaymentMethod } from "@/services/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getUser } from "@/services/user-service";
import { useSearchParams } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { handleScanDonationProof } from "../actions";

const donationTypes = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah'] as const;
const donationPurposes = ['Education', 'Deen', 'Hospital', 'Loan and Relief Fund', 'To Organization Use', 'Loan Repayment'] as const;
const paymentMethods: PaymentMethod[] = ['Online (UPI/Card)', 'Bank Transfer', 'Cash', 'Other'];

const formSchema = z.object({
  donorId: z.string().min(1, "Please select a donor."),
  isAnonymous: z.boolean().default(false),
  amount: z.coerce.number().min(1, "Amount must be greater than 0."),
  donationDate: z.date(),
  type: z.enum(donationTypes),
  purpose: z.enum(donationPurposes).optional(),
  transactionId: z.string().optional(),
  donorUpiId: z.string().optional(),
  donorPhone: z.string().optional(),
  donorBankAccount: z.string().optional(),
  paymentMethod: z.enum(paymentMethods).optional(),
  paymentScreenshots: z.array(z.instanceof(File)).optional(),
  paymentScreenshotDataUrl: z.string().optional(),
  includeTip: z.boolean().default(false),
  tipAmount: z.coerce.number().optional(),
  notes: z.string().optional(),
}).refine(data => {
    if (data.includeTip) {
        return !!data.tipAmount && data.tipAmount > 0;
    }
    return true;
}, {
    message: "Tip amount must be greater than 0.",
    path: ["tipAmount"],
});

type AddDonationFormValues = z.infer<typeof formSchema>;

interface AddDonationFormProps {
  users: User[];
}

interface FilePreview {
    file: File;
    previewUrl: string;
    extractedText?: string;
    isExtracting?: boolean;
    isScanning?: boolean;
}

function AddDonationFormContent({ users }: AddDonationFormProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [selectedDonor, setSelectedDonor] = useState<User | null>(null);
  const [manualScreenshotPreview, setManualScreenshotPreview] = useState<string | null>(null);
  const [localFiles, setLocalFiles] = useState<FilePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setAdminUserId(storedUserId);
  }, []);
  
  const donorUsers = users.filter(u => u.roles.includes('Donor'));

  const form = useForm<AddDonationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isAnonymous: false,
      amount: 0,
      donationDate: new Date(),
      includeTip: false,
      tipAmount: 0,
      notes: "",
      paymentScreenshots: [],
      paymentScreenshotDataUrl: undefined,
    },
  });
  
  const { watch, setValue, reset, getValues } = form;
  const includeTip = watch("includeTip");
  const amount = watch("amount");
  const tipAmount = watch("tipAmount");
  const isAnonymous = watch("isAnonymous");
  
  const handleCancel = () => {
    reset({
        donorId: '',
        isAnonymous: false,
        amount: 0,
        donationDate: new Date(),
        includeTip: false,
        tipAmount: 0,
        notes: "",
        transactionId: "",
        purpose: undefined,
        type: undefined,
        paymentMethod: undefined,
        donorUpiId: '',
        donorPhone: '',
        donorBankAccount: '',
        paymentScreenshots: [],
        paymentScreenshotDataUrl: undefined,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedDonor(null);
      setManualScreenshotPreview(null);
      setLocalFiles([]);
  }
  
  useEffect(() => {
    const prefillData = async () => {
        const amountParam = searchParams.get('amount');
        const transactionIdParam = searchParams.get('transactionId');
        const donorIdParam = searchParams.get('donorId');
        const notesParam = searchParams.get('notes');
        const dateParam = searchParams.get('date');
        const donorUpiIdParam = searchParams.get('donorUpiId');
        const donorPhoneParam = searchParams.get('donorPhone');
        const donorBankAccountParam = searchParams.get('bankAccountNumber');

        if (amountParam) setValue('amount', parseFloat(amountParam));
        if (transactionIdParam) setValue('transactionId', transactionIdParam);
        if (notesParam) setValue('notes', notesParam);
        if (dateParam) setValue('donationDate', new Date(dateParam));
        if (donorUpiIdParam) setValue('donorUpiId', donorUpiIdParam);
        if (donorPhoneParam) setValue('donorPhone', donorPhoneParam);
        if (donorBankAccountParam) setValue('donorBankAccount', donorBankAccountParam);
        
        let foundUser: User | null = null;
        if(donorIdParam) {
            foundUser = await getUser(donorIdParam);
        }
            
        if (foundUser && foundUser.roles.includes('Donor')) {
            setValue('donorId', foundUser.id!);
            setSelectedDonor(foundUser);
        }
        
        const screenshotData = sessionStorage.getItem('manualDonationScreenshot');
        if (screenshotData) {
            try {
                const { dataUrl } = JSON.parse(screenshotData);
                setManualScreenshotPreview(dataUrl);
                setValue('paymentScreenshotDataUrl', dataUrl);
            } catch (error) {
                console.error("Error processing session screenshot", error);
                toast({ variant: 'destructive', title: "Error", description: "Could not load the screenshot for manual entry." });
            } finally {
                sessionStorage.removeItem('manualDonationScreenshot');
            }
        }
    }
    prefillData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setValue, toast]);

  useEffect(() => {
    if (selectedDonor) {
        setValue('isAnonymous', !!selectedDonor.isAnonymousAsDonor);
        if (selectedDonor.upiIds && selectedDonor.upiIds.length > 0) {
             setValue('donorUpiId', selectedDonor.upiIds[0]);
        }
        if (selectedDonor.phone) setValue('donorPhone', selectedDonor.phone);
        if (selectedDonor.bankAccountNumber) setValue('donorBankAccount', selectedDonor.bankAccountNumber);
    } else {
        setValue('donorUpiId', '');
        setValue('donorPhone', '');
        setValue('donorBankAccount', '');
    }
  }, [selectedDonor, setValue]);
  
  const totalAmount = (amount || 0) + (tipAmount || 0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
        const newFilePreviews = Array.from(files).map(file => ({
            file,
            previewUrl: URL.createObjectURL(file)
        }));
        const allFiles = [...localFiles, ...newFilePreviews];
        setLocalFiles(allFiles);
        setValue('paymentScreenshots', allFiles.map(f => f.file));
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = localFiles.filter((_, i) => i !== index);
    setLocalFiles(updatedFiles);
    setValue('paymentScreenshots', updatedFiles.map(f => f.file));
  }

  const handleGetText = async (index: number) => {
    const filePreview = localFiles[index];
    if (!filePreview || filePreview.isExtracting) return;

    // Set loading state for this specific file
    setLocalFiles(prev => prev.map((fp, i) => i === index ? { ...fp, isExtracting: true } : fp));

    const formData = new FormData();
    formData.append("image", filePreview.file);

    const result = await handleExtractTextFromImage(formData);

    if (result.success && result.text) {
        setLocalFiles(prev => prev.map((fp, i) => i === index ? { ...fp, extractedText: result.text, isExtracting: false } : fp));
        toast({ variant: 'success', title: 'Text Extracted', description: 'Text from the image has been extracted below.' });
    } else {
        setLocalFiles(prev => prev.map((fp, i) => i === index ? { ...fp, isExtracting: false } : fp));
        toast({ variant: 'destructive', title: 'Extraction Failed', description: result.error || 'Could not extract text from this image.' });
    }
  };
  
    const handleScanAndFill = async (index: number) => {
        const filePreview = localFiles[index];
        if (!filePreview || filePreview.isScanning) return;

        setLocalFiles(prev => prev.map((fp, i) => (i === index ? { ...fp, isScanning: true } : fp)));
        
        const formData = new FormData();
        formData.append("paymentScreenshot", filePreview.file);

        const result = await handleScanDonationProof(formData);

        if (result.success && result.details) {
            // Use Object.entries to iterate and set values
            for (const [key, value] of Object.entries(result.details)) {
                if (value !== undefined && value !== null) {
                    setValue(key as any, value, { shouldValidate: true, shouldDirty: true });
                }
            }
             toast({ variant: 'success', title: 'Scan Successful', description: 'Form fields have been auto-filled. Please review.' });
        } else {
             toast({ variant: 'destructive', title: 'Scan Failed', description: result.error || 'Could not extract details from this image.' });
        }

        setLocalFiles(prev => prev.map((fp, i) => (i === index ? { ...fp, isScanning: false } : fp)));
    };


  async function onSubmit(values: AddDonationFormValues) {
    if (!adminUserId) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not identify the logged in administrator. Please log out and back in.",
        });
        return;
    }
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("adminUserId", adminUserId);
    formData.append("donorId", values.donorId!);
    formData.append("isAnonymous", String(values.isAnonymous));
    formData.append("amount", String(values.amount));
    formData.append("donationDate", values.donationDate.toISOString());
    formData.append("type", values.type);
    if(values.purpose) formData.append("purpose", values.purpose);
    if(values.donorUpiId) formData.append("donorUpiId", values.donorUpiId);
    if(values.donorPhone) formData.append("donorPhone", values.donorPhone);
    if(values.donorBankAccount) formData.append("donorBankAccount", values.donorBankAccount);
    if(values.paymentMethod) formData.append("paymentMethod", values.paymentMethod);
    if(values.transactionId) formData.append("transactionId", values.transactionId);
    if(values.tipAmount) formData.append("tipAmount", String(values.tipAmount));
    
    values.paymentScreenshots?.forEach(file => {
        formData.append("paymentScreenshots", file);
    });
    
    if (values.paymentScreenshotDataUrl) {
        formData.append("paymentScreenshotDataUrl", values.paymentScreenshotDataUrl);
    }
    if(values.notes) formData.append("notes", values.notes);
    
    const result = await handleAddDonation(formData);

    setIsSubmitting(false);

    if (result.success && result.donation) {
      toast({
        title: "Donation Added",
        description: `Successfully added donation from ${result.donation.donorName}.`,
      });
      handleCancel();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  }

  return (
    <>
      {manualScreenshotPreview && (
          <div className="mb-8 p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5"/>
                Screenshot for Manual Entry
              </h3>
              <div className="flex justify-center">
                   <div className="relative w-full h-80">
                        <Image src={manualScreenshotPreview} alt="Screenshot Preview" fill className="object-contain rounded-md" data-ai-hint="payment screenshot" />
                    </div>
              </div>
          </div>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
           <FormField
              control={form.control}
              name="donorId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Donor</FormLabel>
                   <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? donorUsers.find(
                                (user) => user.id === field.value
                              )?.name
                            : "Select a donor"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search donor..." />
                        <CommandList>
                            <CommandEmpty>No donors found.</CommandEmpty>
                            <CommandGroup>
                            {donorUsers.map((user) => (
                                <CommandItem
                                value={user.name}
                                key={user.id}
                                onSelect={async () => {
                                    field.onChange(user.id!);
                                    const donor = await getUser(user.id!);
                                    setSelectedDonor(donor);
                                    setPopoverOpen(false);
                                }}
                                >
                                <Check
                                    className={cn(
                                    "mr-2 h-4 w-4",
                                    user.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                />
                                {user.name} ({user.phone})
                                </CommandItem>
                            ))}
                            </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          <FormField
            control={form.control}
            name="isAnonymous"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Mark this Donation as Anonymous
                  </FormLabel>
                  <FormDescription>
                    If checked, the donor's name will be hidden from public view for this specific donation. This is automatically checked if the user's profile is set to anonymous.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          {isAnonymous && selectedDonor && (
              <div className="space-y-2">
                  <FormLabel>Anonymous Donor ID</FormLabel>
                  <Input value={selectedDonor.anonymousDonorId || "Will be generated on save"} disabled />
                  <FormDescription>This ID will be used for public display to protect the donor's privacy.</FormDescription>
              </div>
          )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Primary Donation Amount</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="Enter amount" {...field} />
                </FormControl>
                    <FormDescription>The main amount for the donation's purpose.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="donationDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Donation Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>The date the transaction was made.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
          <FormField
            control={form.control}
            name="includeTip"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Split Transaction with Tip
                  </FormLabel>
                  <FormDescription>
                    Check this if the transaction includes a separate amount for organization expenses.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          {includeTip && (
              <div className="space-y-4">
                  <FormField
                      control={form.control}
                      name="tipAmount"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Tip Amount</FormLabel>
                          <FormControl>
                              <Input type="number" placeholder="Enter tip amount" {...field} />
                          </FormControl>
                          <FormDescription>This amount will be recorded as a separate donation for 'To Organization Use'.</FormDescription>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                  <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Total Transaction Amount</AlertTitle>
                      <AlertDescription>
                          The total amount you should see on the bank statement is <span className="font-bold">₹{totalAmount.toLocaleString()}</span>.
                      </AlertDescription>
                  </Alert>
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Primary Donation Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                      {donationTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                      </SelectContent>
                  </Select>
                  <FormMessage />
                  </FormItem>
              )}
              />
              <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Primary Donation Purpose</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Select a purpose (optional)" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                      {donationPurposes.filter(p => p !== 'To Organization Use').map(purpose => (
                          <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                      ))}
                      </SelectContent>
                  </Select>
                  <FormMessage />
                  </FormItem>
              )}
              />
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {paymentMethods.map(method => (
                                <SelectItem key={method} value={method}>{method}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="transactionId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Transaction ID (Optional)</FormLabel>
                        <FormControl>
                        <Input placeholder="Enter reference number" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <h4 className="font-semibold text-sm">Donor Contact Details (for reference)</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                    control={form.control}
                    name="donorPhone"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Donor Phone</FormLabel>
                        <FormControl>
                            <Input placeholder="10-digit phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="donorUpiId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Donor UPI ID</FormLabel>
                            {(selectedDonor?.upiIds && selectedDonor.upiIds.length > 0) ? (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a UPI ID" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {selectedDonor.upiIds.map((id) => (
                                        <SelectItem key={id} value={id}>{id}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <FormControl>
                                    <Input placeholder="e.g., username@okhdfc" {...field} />
                                </FormControl>
                            )}
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
             <FormField
                    control={form.control}
                    name="donorBankAccount"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Donor Bank Account (Optional)</FormLabel>
                        <FormControl>
                        <Input placeholder="Last 4 digits or full number" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
          
          <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                      <Textarea placeholder="Add any internal notes, or comments from the screenshot." {...field} />
                  </FormControl>
                      <FormDescription>These notes are for internal use only and not visible to the donor.</FormDescription>
                  <FormMessage />
                  </FormItem>
              )}
          />

          {!manualScreenshotPreview && (
              <FormField
              control={form.control}
              name="paymentScreenshots"
              render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Screenshots</FormLabel>
                    <FormControl>
                        <Input 
                            type="file" 
                            accept="image/*,application/pdf"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            multiple
                        />
                    </FormControl>
                    <FormDescription>
                        Upload one or more screenshots of the payment for verification.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
              )}
              />
          )}

          {localFiles.length > 0 && (
            <div className="space-y-4">
                {localFiles.map((fp, index) => (
                    <div key={index} className="p-2 border rounded-md bg-muted/50 space-y-2">
                        <div className="relative group aspect-square">
                            {fp.file.type.startsWith('image/') ? (
                                <Image src={fp.previewUrl} alt={`Preview ${index + 1}`} fill className="object-contain rounded-md" data-ai-hint="payment screenshot" />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full bg-background rounded-md p-2">
                                    <FileText className="h-8 w-8 text-primary" />
                                    <p className="text-xs text-center break-all mt-2">{fp.file.name}</p>
                                </div>
                            )}
                             <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 backdrop-blur-sm p-1 rounded-full">
                                {fp.file.type.startsWith('image/') && (
                                <>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="h-7 w-7 rounded-full"
                                    onClick={() => handleGetText(index)}
                                    disabled={fp.isExtracting}
                                >
                                    {fp.isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <TextSearch className="h-4 w-4" />}
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="h-7 w-7 rounded-full"
                                    onClick={() => handleScanAndFill(index)}
                                    disabled={fp.isScanning}
                                >
                                    {fp.isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanEye className="h-4 w-4" />}
                                </Button>
                                </>
                                )}
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="h-7 w-7 rounded-full"
                                    onClick={() => removeFile(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        {fp.extractedText && (
                            <Textarea readOnly value={fp.extractedText} rows={5} className="text-xs font-mono" />
                        )}
                    </div>
                ))}
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Donation
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                <X className="mr-2 h-4 w-4" />
                Cancel
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}

export function AddDonationForm(props: AddDonationFormProps) {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <AddDonationFormContent {...props} />
        </Suspense>
    )
}
