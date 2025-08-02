
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
import { User } from "@/services/user-service";
import { LeadPurpose } from "@/services/lead-service";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const leadPurposes: LeadPurpose[] = ['Education', 'Medical', 'Relief Fund', 'Deen'];

const subCategoryOptions: Record<LeadPurpose, string[]> = {
    'Education': ['School Fees', 'College Fees', 'Books & Uniforms', 'Other'],
    'Medical': ['Hospital Bill', 'Medication', 'Doctor Consultation', 'Other'],
    'Relief Fund': ['Ration Kit', 'Financial Aid', 'Disaster Relief', 'Other'],
    'Deen': ['Masjid Maintenance', 'Madrasa Support', 'Da\'wah Activities', 'Other'],
};


const formSchema = z.object({
  userType: z.enum(['existing', 'new']).default('existing'),
  beneficiaryId: z.string().optional(),
  
  // New user fields
  newUserName: z.string().optional(),
  newUserPhone: z.string().optional(),
  newUserEmail: z.string().email("Please enter a valid email for the new user.").optional().or(z.literal('')),

  purpose: z.enum(leadPurposes),
  subCategory: z.string().min(1, "Sub-category is required."),
  otherCategoryDetail: z.string().optional(),
  helpRequested: z.coerce.number().min(1, "Amount must be greater than 0."),
  isLoan: z.boolean().default(false),
  caseDetails: z.string().optional(),
  verificationDocument: z.any().optional(),
}).refine(data => {
    if (data.userType === 'existing') {
        return !!data.beneficiaryId && data.beneficiaryId.length > 0;
    }
    return true;
}, {
    message: "Beneficiary is required for an existing user.",
    path: ["beneficiaryId"],
}).refine(data => {
    if (data.userType === 'new') {
        return !!data.newUserName && data.newUserName.length > 0;
    }
    return true;
}, {
    message: "New user's name is required.",
    path: ["newUserName"], 
}).refine(data => {
    if (data.userType === 'new') {
        return !!data.newUserPhone && /^[0-9]{10}$/.test(data.newUserPhone);
    }
    return true;
}, {
    message: "A valid 10-digit phone number is required for a new user.",
    path: ["newUserPhone"], 
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
      userType: 'existing',
      isLoan: false,
      helpRequested: 0,
    },
  });

  const selectedUserType = form.watch("userType");
  const selectedPurpose = form.watch("purpose");
  const selectedSubCategory = form.watch("subCategory");

  async function onSubmit(values: AddLeadFormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("userType", values.userType);
    if (values.userType === 'existing' && values.beneficiaryId) {
        formData.append("beneficiaryId", values.beneficiaryId);
    }
    if (values.userType === 'new') {
        if(values.newUserName) formData.append("newUserName", values.newUserName);
        if(values.newUserPhone) formData.append("newUserPhone", values.newUserPhone);
        if(values.newUserEmail) formData.append("newUserEmail", values.newUserEmail);
    }
    
    formData.append("purpose", values.purpose);
    formData.append("subCategory", values.subCategory);
    if (values.otherCategoryDetail) formData.append("otherCategoryDetail", values.otherCategoryDetail);
    formData.append("helpRequested", String(values.helpRequested));
    formData.append("isLoan", String(values.isLoan));
    if(values.caseDetails) formData.append("caseDetails", values.caseDetails);
    if(values.verificationDocument?.[0]) formData.append("verificationDocument", values.verificationDocument[0]);
    
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        
        <FormField
          control={form.control}
          name="userType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Add Lead for...</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="existing" id="existing" />
                    </FormControl>
                    <Label htmlFor="existing">Existing User</Label>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="new" id="new" />
                    </FormControl>
                    <Label htmlFor="new">New User</Label>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {selectedUserType === 'existing' && (
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
                    <FormDescription>Select the user who will receive the aid.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
        )}

        {selectedUserType === 'new' && (
            <div className="space-y-4 rounded-md border p-4">
                 <h3 className="font-semibold text-foreground">New Beneficiary Details</h3>
                 <FormField
                    control={form.control}
                    name="newUserName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter new user's full name" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="newUserPhone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Phone Number (10 digits)</FormLabel>
                        <FormControl>
                            <Input maxLength={10} placeholder="Enter new user's phone" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="newUserEmail"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email Address (Optional)</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="user@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        )}
        
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
                  onChange={(e) => onChange(e.target.files)}
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
