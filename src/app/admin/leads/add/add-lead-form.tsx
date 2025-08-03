
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { handleAddLead } from "./actions";
import { useState } from "react";
import { Loader2, UserPlus, Users, Info, CalendarIcon } from "lucide-react";
import type { User, LeadPurpose, DonationType } from "@/services/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { format } from "date-fns";


const leadPurposes = ['Education', 'Medical', 'Relief Fund', 'Deen'] as const;

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
  beneficiaryType: z.enum(['existing', 'new']).default('existing'),
  beneficiaryId: z.string().optional(),
  
  // New beneficiary fields
  newBeneficiaryName: z.string().optional(),
  newBeneficiaryPhone: z.string().optional(),
  newBeneficiaryEmail: z.string().email().optional(),

  campaignName: z.string().optional(),
  purpose: z.enum(leadPurposes),
  category: z.string().min(1, "Donation category is required."),
  subCategory: z.string().min(1, "Sub-category is required."),
  otherCategoryDetail: z.string().optional(),
  helpRequested: z.coerce.number().min(1, "Amount must be greater than 0."),
  dueDate: z.date().optional(),
  isLoan: z.boolean().default(false),
  caseDetails: z.string().optional(),
  verificationDocument: z.any().optional(),
}).refine(data => {
    if (data.subCategory === 'Other') {
        return !!data.otherCategoryDetail && data.otherCategoryDetail.length > 0;
    }
    return true;
}, {
    message: "Please specify details for the 'Other' sub-category.",
    path: ["otherCategoryDetail"],
}).refine(data => {
    if (data.beneficiaryType === 'existing') {
        return !!data.beneficiaryId;
    }
    return true;
}, {
    message: "Please select an existing beneficiary.",
    path: ["beneficiaryId"],
}).refine(data => {
    if (data.beneficiaryType === 'new') {
        return !!data.newBeneficiaryName && !!data.newBeneficiaryPhone;
    }
    return true;
}, {
    message: "New beneficiary name and phone are required.",
    path: ["newBeneficiaryName"], // Report error on one of the fields
});


type AddLeadFormValues = z.infer<typeof formSchema>;

interface AddLeadFormProps {
  users: User[];
}

export function AddLeadForm({ users }: AddLeadFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const potentialBeneficiaries = users.filter(u => u.roles.includes("Beneficiary"));

  const form = useForm<AddLeadFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      beneficiaryType: 'existing',
      isLoan: false,
      helpRequested: 0,
    },
  });

  const selectedPurpose = form.watch("purpose");
  const selectedSubCategory = form.watch("subCategory");
  const beneficiaryType = form.watch("beneficiaryType");


  async function onSubmit(values: AddLeadFormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("beneficiaryType", values.beneficiaryType);
    if(values.beneficiaryId) formData.append("beneficiaryId", values.beneficiaryId);
    if(values.newBeneficiaryName) formData.append("newBeneficiaryName", values.newBeneficiaryName);
    if(values.newBeneficiaryPhone) formData.append("newBeneficiaryPhone", values.newBeneficiaryPhone);
    if(values.newBeneficiaryEmail) formData.append("newBeneficiaryEmail", values.newBeneficiaryEmail);
    if(values.campaignName) formData.append("campaignName", values.campaignName);
    formData.append("purpose", values.purpose);
    formData.append("category", values.category);
    formData.append("subCategory", values.subCategory);
    if (values.otherCategoryDetail) formData.append("otherCategoryDetail", values.otherCategoryDetail);
    formData.append("helpRequested", String(values.helpRequested));
    if (values.dueDate) formData.append("dueDate", values.dueDate.toISOString());
    formData.append("isLoan", values.isLoan ? "on" : "off");
    if(values.caseDetails) formData.append("caseDetails", values.caseDetails);
    if(values.verificationDocument) formData.append("verificationDocument", values.verificationDocument);
    
    const result = await handleAddLead(formData);

    setIsSubmitting(false);

    if (result.success && result.lead) {
      toast({
        title: "Lead Created",
        description: `Successfully created lead for ${result.lead.name}.`,
      });
      form.reset({
        beneficiaryType: 'existing',
        isLoan: false,
        helpRequested: 0,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        
         <FormField
            control={form.control}
            name="beneficiaryType"
            render={({ field }) => (
                <FormItem className="space-y-3">
                <FormLabel>Beneficiary</FormLabel>
                <FormControl>
                    <RadioGroup
                    onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('beneficiaryId', undefined);
                        form.setValue('newBeneficiaryName', '');
                        form.setValue('newBeneficiaryPhone', '');
                        form.setValue('newBeneficiaryEmail', '');
                    }}
                    defaultValue={field.value}
                    className="grid grid-cols-2 gap-4"
                    >
                        <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                            <FormControl>
                                <RadioGroupItem value="existing" className="sr-only" />
                            </FormControl>
                            <Users className="mb-3 h-6 w-6" />
                            Existing Beneficiary
                        </Label>
                         <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                            <FormControl>
                                <RadioGroupItem value="new" className="sr-only" />
                            </FormControl>
                            <UserPlus className="mb-3 h-6 w-6" />
                            New Beneficiary
                        </Label>
                    </RadioGroup>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

        {beneficiaryType === 'existing' && (
            <FormField
                control={form.control}
                name="beneficiaryId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Select Beneficiary</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an existing beneficiary" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {potentialBeneficiaries.map(user => (
                            <SelectItem key={user.id} value={user.id!}>
                                {user.name} ({user.phone})
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
        )}
        
        {beneficiaryType === 'new' && (
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-medium">New Beneficiary Details</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="newBeneficiaryName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter beneficiary's full name" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="newBeneficiaryPhone"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                                <Input type="tel" maxLength={10} placeholder="Enter 10-digit phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="newBeneficiaryEmail"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="beneficiary@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        )}

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
                    form.setValue('subCategory', ''); // Reset subcategory on purpose change
                    form.setValue('otherCategoryDetail', '');
                    form.setValue('category', ''); // Reset category as well
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
                 <FormDescription>The main reason for the help request.</FormDescription>
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
                        <FormDescription>The type of fund this lead falls under.</FormDescription>
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
                <FormDescription>The total amount of funds needed.</FormDescription>
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
                            The deadline for when funds are needed.
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
                <Textarea
                    placeholder="Provide a brief summary of the case, the reason for the need, and any other relevant information."
                    className="resize-y min-h-[100px]"
                    {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <FormField
          control={form.control}
          name="verificationDocument"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormLabel>Verification Document</FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                  {...rest}
                />
              </FormControl>
              <FormDescription>
                (Optional) Upload a document for verification purposes (e.g., ID card, medical report).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Lead
        </Button>
      </form>
    </Form>
  );
}
