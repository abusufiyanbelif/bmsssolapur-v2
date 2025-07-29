
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
import { DonationType } from "@/services/donation-service";

const leadCategories: Exclude<DonationType, 'Split'>[] = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah'];


const formSchema = z.object({
  beneficiaryId: z.string().min(1, "Beneficiary is required."),
  category: z.enum(leadCategories),
  helpRequested: z.coerce.number().min(1, "Amount must be greater than 0."),
  isLoan: z.boolean().default(false),
  caseDetails: z.string().optional(),
  verificationDocument: z.any().optional(),
});

type AddLeadFormValues = z.infer<typeof formSchema>;

interface AddLeadFormProps {
  users: User[];
}

export function AddLeadForm({ users }: AddLeadFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Suggest users who are marked as beneficiaries
  const potentialBeneficiaries = users.filter(u => u.roles.includes("Beneficiary"));

  const form = useForm<AddLeadFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isLoan: false,
      helpRequested: 0,
    },
  });

  async function onSubmit(values: AddLeadFormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("beneficiaryId", values.beneficiaryId);
    formData.append("category", values.category);
    formData.append("helpRequested", String(values.helpRequested));
    formData.append("isLoan", String(values.isLoan));
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
                <FormDescription>Select the user who will receive the aid.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Category</FormLabel>
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
                 <FormDescription>The type of aid being requested.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
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
