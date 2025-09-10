

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { handleUpdateLead } from "./actions";
import { useState, useEffect, useMemo } from "react";
import { Loader2, Info, Edit, Save, X, ChevronsUpDown, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Campaign, getAllCampaigns } from "@/services/campaign-service";
import type { User, Lead, LeadPurpose, LeadStatus, LeadVerificationStatus, DonationType, LeadAction } from "@/services/types";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from "@/components/ui/label";


const leadPurposes = ['Education', 'Medical', 'Relief Fund', 'Deen', 'Loan', 'Other'] as const;
const leadStatuses: LeadStatus[] = ["Open", "Pending", "Complete", "On Hold", "Cancelled", "Closed", "Partial"];
const leadVerificationStatuses: LeadVerificationStatus[] = ["Pending", "Verified", "Rejected", "More Info Required", "Duplicate", "Other"];
const leadActions: LeadAction[] = ["Pending", "Ready For Help", "Publish", "Partial", "Complete", "Closed", "On Hold", "Cancelled"];
const donationTypes: Exclude<DonationType, 'Split'>[] = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah', 'Any'];

const degreeOptions = ['SSC', 'HSC', 'B.A.', 'B.Com', 'B.Sc.', 'B.E.', 'MBBS', 'B.Pharm', 'D.Pharm', 'BUMS', 'BHMS', 'Other'];
const schoolYearOptions = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const collegeYearOptions = ['First Year', 'Second Year', 'Third Year', 'Final Year'];

const categoryOptions: Record<Exclude<LeadPurpose, 'Other' | 'Loan'>, string[]> = {
    'Education': ['School Fees', 'College Fees', 'Tuition Fees', 'Exam Fees', 'Hostel Fees', 'Books & Uniforms', 'Educational Materials', 'Other'],
    'Medical': ['Hospital Bill', 'Medication', 'Doctor Consultation', 'Surgical Procedure', 'Medical Tests', 'Medical Equipment', 'Other'],
    'Relief Fund': ['Ration Kit', 'Financial Aid', 'Disaster Relief', 'Shelter Assistance', 'Utility Bill Payment', 'Other'],
    'Deen': ['Masjid Maintenance', 'Madrasa Support', 'Da\'wah Activities', 'Other'],
};

const loanCategoryOptions = ['Business Loan', 'Emergency Loan', 'Education Loan', 'Personal Loan', 'Other'];


const formSchema = z.object({
  hasReferral: z.boolean().default(false),
  campaignId: z.string().optional(),
  campaignName: z.string().optional(),
  referredByUserId: z.string().optional(),
  referredByUserName: z.string().optional(),
  headline: z.string().min(10, "Headline must be at least 10 characters.").max(100, "Headline cannot exceed 100 characters.").optional().or(z.literal('')),
  story: z.string().optional(),
  purpose: z.enum(leadPurposes),
  otherPurposeDetail: z.string().optional(),
  category: z.string().min(1, "Category is required."),
  otherCategoryDetail: z.string().optional(),
  degree: z.string().optional(),
  year: z.string().optional(),
  acceptableDonationTypes: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one donation type.",
  }),
  helpRequested: z.coerce.number().min(1, "Amount must be greater than 0."),
  fundingGoal: z.coerce.number().optional(),
  dueDate: z.date().optional(),
  verificationDueDate: z.date().optional(),
  caseDetails: z.string().optional(),
  isLoan: z.boolean().default(false),
  status: z.enum(leadStatuses),
  caseAction: z.enum(leadActions),
  verifiedStatus: z.enum(leadVerificationStatuses),
})
.refine(data => {
    if (data.purpose === 'Other') {
        return !!data.otherPurposeDetail && data.otherPurposeDetail.length > 0;
    }
    return true;
}, {
    message: "Please specify details for the 'Other' purpose.",
    path: ["otherPurposeDetail"],
})
.refine(data => {
    if (data.purpose === 'Loan' && data.category === 'Other') {
        return !!data.otherCategoryDetail && data.otherCategoryDetail.length > 0;
    }
    if (data.purpose && categoryOptions[data.purpose as Exclude<LeadPurpose, 'Other' | 'Loan'>] && data.category === 'Other') {
        return !!data.otherCategoryDetail && data.otherCategoryDetail.length > 0;
    }
    return true;
}, {
    message: "Please specify details for the 'Other' category.",
    path: ["otherCategoryDetail"],
});


type EditLeadFormValues = z.infer<typeof formSchema>;

interface EditLeadFormProps {
  lead: Lead;
  campaigns: Campaign[];
  users: User[];
}

export function EditLeadForm({ lead, campaigns, users }: EditLeadFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [referralPopoverOpen, setReferralPopoverOpen] = useState(false);
  const [selectedReferralDetails, setSelectedReferralDetails] = useState<User | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setAdminUserId(storedUserId);
    if (lead.referredByUserId) {
        const referralUser = users.find(u => u.id === lead.referredByUserId);
        if (referralUser) setSelectedReferralDetails(referralUser);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const potentialReferrals = users.filter(u => u.roles.includes("Referral"));

  const form = useForm<EditLeadFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hasReferral: !!lead.referredByUserId,
      campaignId: lead.campaignId || 'none',
      campaignName: lead.campaignName || '',
      referredByUserId: lead.referredByUserId || '',
      referredByUserName: lead.referredByUserName || '',
      headline: lead.headline || '',
      story: lead.story || '',
      purpose: lead.purpose,
      otherPurposeDetail: lead.otherPurposeDetail || '',
      category: lead.category || '',
      otherCategoryDetail: lead.otherCategoryDetail || '',
      degree: lead.degree || '',
      year: lead.year || '',
      acceptableDonationTypes: lead.acceptableDonationTypes || [],
      helpRequested: lead.helpRequested,
      fundingGoal: lead.fundingGoal || lead.helpRequested,
      dueDate: lead.dueDate ? lead.dueDate : undefined,
      verificationDueDate: lead.verificationDueDate ? lead.verificationDueDate : undefined,
      caseDetails: lead.caseDetails || '',
      isLoan: lead.isLoan,
      status: lead.caseStatus,
      caseAction: lead.caseAction,
      verifiedStatus: lead.caseVerification,
    },
  });

  const { formState: { isDirty }, reset, watch } = form;
  const selectedPurpose = watch("purpose");
  const selectedCategory = watch("category");
  const hasReferral = watch("hasReferral");
  const caseAction = watch("caseAction");
  const caseVerification = watch("verifiedStatus");
  const selectedDegree = watch("degree");
  
  const handleCancel = () => {
    reset({
        hasReferral: !!lead.referredByUserId,
        campaignId: lead.campaignId || 'none',
        campaignName: lead.campaignName || '',
        referredByUserId: lead.referredByUserId || '',
        referredByUserName: lead.referredByUserName || '',
        headline: lead.headline || '',
        story: lead.story || '',
        purpose: lead.purpose,
        otherPurposeDetail: lead.otherPurposeDetail || '',
        category: lead.category || '',
        otherCategoryDetail: lead.otherCategoryDetail || '',
        degree: lead.degree || '',
        year: lead.year || '',
        acceptableDonationTypes: lead.acceptableDonationTypes || [],
        helpRequested: lead.helpRequested,
        fundingGoal: lead.fundingGoal || lead.helpRequested,
        dueDate: lead.dueDate ? lead.dueDate : undefined,
        verificationDueDate: lead.verificationDueDate ? lead.verificationDueDate : undefined,
        caseDetails: lead.caseDetails || '',
        isLoan: lead.isLoan,
        status: lead.caseStatus,
        caseAction: lead.caseAction,
        verifiedStatus: lead.caseVerification,
    });
    if (lead.referredByUserId) {
        const referralUser = users.find(u => u.id === lead.referredByUserId);
        if (referralUser) setSelectedReferralDetails(referralUser);
    } else {
        setSelectedReferralDetails(null);
    }
    setIsEditing(false);
  }

  useEffect(() => {
    if (selectedPurpose === 'Loan') {
        form.setValue('isLoan', true, { shouldDirty: true });
    } else {
        form.setValue('isLoan', false, { shouldDirty: true });
    }
  }, [selectedPurpose, form]);

  async function onSubmit(values: EditLeadFormValues) {
    if (!adminUserId) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not identify the admin performing the update. Please log out and back in.",
        });
        return;
    }

    setIsSubmitting(true);
    
    const formData = new FormData();
    if(values.campaignId && values.campaignId !== 'none') formData.append("campaignId", values.campaignId);
    if(values.campaignName) formData.append("campaignName", values.campaignName);
    if(values.hasReferral && values.referredByUserId) {
        formData.append("referredByUserId", values.referredByUserId);
        formData.append("referredByUserName", values.referredByUserName || '');
    } else {
        formData.append("referredByUserId", "");
        formData.append("referredByUserName", "");
    }
    if(values.headline) formData.append("headline", values.headline);
    if(values.story) formData.append("story", values.story);
    formData.append("purpose", values.purpose);
    if (values.otherPurposeDetail) formData.append("otherPurposeDetail", values.otherPurposeDetail);
    formData.append("category", values.category);
    if (values.otherCategoryDetail) formData.append("otherCategoryDetail", values.otherCategoryDetail);
    values.acceptableDonationTypes.forEach(type => formData.append("acceptableDonationTypes", type));
    formData.append("helpRequested", String(values.helpRequested));
    if (values.fundingGoal) formData.append("fundingGoal", String(values.fundingGoal));
    if (values.dueDate) formData.append("dueDate", values.dueDate.toISOString());
    if (values.verificationDueDate) formData.append("verificationDueDate", values.verificationDueDate.toISOString());
    if(values.isLoan) formData.append("isLoan", "on");
    formData.append("status", values.status);
    formData.append("caseAction", values.caseAction || 'Pending');
    formData.append("verifiedStatus", values.verifiedStatus);
    if (values.caseDetails) formData.append("caseDetails", values.caseDetails);
    if (values.degree) formData.append("degree", values.degree);
    if (values.year) formData.append("year", values.year);
    
    const result = await handleUpdateLead(lead.id!, formData, adminUserId);

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Lead Updated",
        description: `Successfully updated lead for ${lead.name}.`,
      });
      form.reset(values);
      setIsEditing(false);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  }
  
  const showEducationFields = selectedPurpose === 'Education' && (selectedCategory === 'College Fees' || selectedCategory === 'School Fees');
  const showYearField = showEducationFields && selectedDegree && !['SSC'].includes(selectedDegree);
  const yearOptions = selectedCategory === 'School Fees' ? schoolYearOptions : collegeYearOptions;

  return (
     <Card>
        <CardHeader>
             <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Edit Lead</CardTitle>
                    <CardDescription>
                        Update the details for the case from <span className="font-semibold">{lead.name}</span>.
                    </CardDescription>
                </div>
                 {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                )}
            </div>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
                <FormField
                    control={form.control}
                    name="helpRequested"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Amount Requested</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Enter amount" {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                 <FormField
                    control={form.control}
                    name="fundingGoal"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Fundraising Goal (Target)</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Enter amount" {...field} disabled={!isEditing} />
                        </FormControl>
                         <FormDescription>The amount to be displayed on the public page for this case.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Due Date (Optional)</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    disabled={!isEditing}
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
                                    disabled={(date) =>
                                    date < new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                                <FormDescription>
                                The deadline for when funds are needed.
                                </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {isEditing && (
                    <div className="flex gap-4">
                        <Button type="submit" disabled={isSubmitting || !isDirty}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                             <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                    </div>
                )}
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
