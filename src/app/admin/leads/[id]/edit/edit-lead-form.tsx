
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
import { useState } from "react";
import { Loader2, Info } from "lucide-react";
import { Lead, LeadPurpose, LeadStatus, LeadVerificationStatus, DonationType } from "@/services/lead-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { format } from "date-fns";


const leadPurposes = ['Education', 'Medical', 'Relief Fund', 'Deen'] as const;
const leadStatuses = ["Pending", "Partial", "Closed"] as const;
const leadVerificationStatuses = ["Pending", "Verified", "Rejected"] as const;

const purposeCategoryMap: Record<LeadPurpose, DonationType[]> = {
    'Education': ['Sadaqah', 'Lillah'],
    'Medical': ['Sadaqah', 'Lillah', 'Zakat'],
    'Relief Fund': ['Sadaqah', 'Lillah', 'Zakat', 'Fitr'],
    'Deen': ['Sadaqah', 'Lillah']
};

const subCategoryOptions: Record<LeadPurpose, string[]> = {
    'Education': ['School Fees', 'College Fees', 'Books & Uniforms', 'Other'],
    'Medical': ['Hospital Bill', 'Medication', 'Doctor Consultation', 'Other'],
    'Relief Fund': ['Ration Kit', 'Financial Aid', 'Disaster Relief', 'Other'],
    'Deen': ['Masjid Maintenance', 'Madrasa Support', 'Da\'wah Activities', 'Other'],
};


const formSchema = z.object({
  campaignName: z.string().optional(),
  purpose: z.enum(leadPurposes),
  category: z.string().min(1, "Donation category is required."),
  subCategory: z.string().min(1, "Sub-category is required."),
  otherCategoryDetail: z.string().optional(),
  helpRequested: z.coerce.number().min(1, "Amount must be greater than 0."),
  dueDate: z.date().optional(),
  caseDetails: z.string().optional(),
  isLoan: z.boolean().default(false),
  status: z.enum(leadStatuses),
  verifiedStatus: z.enum(leadVerificationStatuses),
}).refine(data => {
    if (data.subCategory === 'Other') {
        return !!data.otherCategoryDetail && data.otherCategoryDetail.length > 0;
    }
    return true;
}, {
    message: "Please specify details for the 'Other' sub-category.",
    path: ["otherCategoryDetail"],
});


type EditLeadFormValues = z.infer<typeof formSchema>;

interface EditLeadFormProps {
  lead: Lead;
}

export function EditLeadForm({ lead }: EditLeadFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditLeadFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      campaignName: lead.campaignName || '',
      purpose: lead.purpose,
      category: lead.category,
      subCategory: lead.subCategory || '',
      otherCategoryDetail: lead.otherCategoryDetail || '',
      helpRequested: lead.helpRequested,
      dueDate: lead.dueDate ? (lead.dueDate as any).toDate() : undefined,
      caseDetails: lead.caseDetails || '',
      isLoan: lead.isLoan,
      status: lead.status,
      verifiedStatus: lead.verifiedStatus,
    },
  });

  const { formState: { isDirty } } = form;
  const selectedPurpose = form.watch("purpose");
  const selectedSubCategory = form.watch("subCategory");

  async function onSubmit(values: EditLeadFormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    if(values.campaignName) formData.append("campaignName", values.campaignName);
    formData.append("purpose", values.purpose);
    formData.append("category", values.category);
    formData.append("subCategory", values.subCategory);
    if (values.otherCategoryDetail) formData.append("otherCategoryDetail", values.otherCategoryDetail);
    formData.append("helpRequested", String(values.helpRequested));
    if (values.dueDate) formData.append("dueDate", values.dueDate.toISOString());
    if (values.caseDetails) formData.append("caseDetails", values.caseDetails);
    if(values.isLoan) formData.append("isLoan", "on");
    formData.append("status", values.status);
    formData.append("verifiedStatus", values.verifiedStatus);
    
    const result = await handleUpdateLead(lead.id!, formData);

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Lead Updated",
        description: `Successfully updated lead for ${lead.name}.`,
      });
      form.reset(values);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  }

  return (
     <Card>
        <CardHeader>
            <CardTitle>Edit Lead</CardTitle>
            <CardDescription>
                Update the details for the case from <span className="font-semibold">{lead.name}</span>.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">

                <FormField
                  control={form.control}
                  name="campaignName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Ramadan Food Drive 2024" {...field} />
                      </FormControl>
                      <FormDescription>Link this lead to a specific campaign.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <FormField
                        control={form.control}
                        name="purpose"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Lead Purpose</FormLabel>
                            <Select onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue('subCategory', '');
                                form.setValue('otherCategoryDetail', '');
                                form.setValue('category', '');
                            }} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a purpose" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {leadPurposes.map(purpose => (
                                    <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     {selectedPurpose && (
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Donation Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a donation category" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {purposeCategoryMap[selectedPurpose].map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {selectedPurpose && (
                        <FormField
                            control={form.control}
                            name="subCategory"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Sub-Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a sub-category" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {subCategoryOptions[selectedPurpose].map(sub => (
                                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    {selectedSubCategory === 'Other' && (
                        <FormField
                            control={form.control}
                            name="otherCategoryDetail"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Please specify "Other" details</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Specific textbook name" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                 </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                    control={form.control}
                    name="helpRequested"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Amount Requested</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Enter amount" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     {selectedPurpose === 'Education' && (
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
                                    The deadline for when funds are needed (e.g., for fee payment).
                                 </FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                <FormField
                control={form.control}
                name="caseDetails"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Case Details</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Provide a brief summary of the case..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Case Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {leadStatuses.map(status => (
                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="verifiedStatus"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Verification Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a verification status" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {leadVerificationStatuses.map(status => (
                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                 <FormField
                  control={form.control}
                  name="isLoan"
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
                          Is this a repayable loan?
                        </FormLabel>
                        <FormDescription>
                          If checked, this case will be marked as a loan that is expected to be repaid.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
                </Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
