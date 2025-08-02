
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { handleAddLead } from "./actions";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { User, LeadPurpose } from "@/services/types";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserPlus } from "lucide-react";

const leadPurposes = ['Education', 'Medical', 'Relief Fund', 'Deen'] as const;

const subCategoryOptions: Record<LeadPurpose, string[]> = {
    'Education': ['School Fees', 'College Fees', 'Books & Uniforms', 'Other'],
    'Medical': ['Hospital Bill', 'Medication', 'Doctor Consultation', 'Other'],
    'Relief Fund': ['Ration Kit', 'Financial Aid', 'Disaster Relief', 'Other'],
    'Deen': ['Masjid Maintenance', 'Madrasa Support', 'Da\'wah Activities', 'Other'],
};


const formSchema = z.object({
  beneficiaryId: z.string().min(1, "Beneficiary is required."),
  purpose: z.enum(leadPurposes),
  subCategory: z.string().min(1, "Sub-category is required."),
  otherCategoryDetail: z.string().optional(),
  helpRequested: z.coerce.number().min(1, "Amount must be greater than 0."),
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
      isLoan: false,
      helpRequested: 0,
    },
  });

  const selectedPurpose = form.watch("purpose");
  const selectedSubCategory = form.watch("subCategory");

  async function onSubmit(values: AddLeadFormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("beneficiaryId", values.beneficiaryId);
    formData.append("purpose", values.purpose);
    formData.append("subCategory", values.subCategory);
    if (values.otherCategoryDetail) formData.append("otherCategoryDetail", values.otherCategoryDetail);
    formData.append("helpRequested", String(values.helpRequested));
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
      form.reset();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  }
  
  if(potentialBeneficiaries.length === 0) {
    return (
        <Alert>
            <UserPlus className="h-4 w-4" />
            <AlertTitle>No Beneficiaries Found</AlertTitle>
            <AlertDescription>
                There are no users with the 'Beneficiary' role in the system. You must add a beneficiary user before you can create a lead.
                <Button asChild className="mt-4">
                    <Link href="/admin/user-management/add">Add Beneficiary User</Link>
                </Button>
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        
        <FormField
            control={form.control}
            name="beneficiaryId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Beneficiary</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a beneficiary" />
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
                <FormDescription>Select the user who will receive the aid. If the user is not listed, <Link href="/admin/user-management/add" className="text-primary underline">add them as a new user</Link> first.</FormDescription>
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
                <FormLabel>Purpose</FormLabel>
                <Select onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue('subCategory', ''); // Reset subcategory on purpose change
                    form.setValue('otherCategoryDetail', '');
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
        </div>

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
