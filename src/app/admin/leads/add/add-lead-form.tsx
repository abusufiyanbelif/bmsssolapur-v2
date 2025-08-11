

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
import { useState, useEffect, useRef } from "react";
import { Loader2, UserPlus, Users, Info, CalendarIcon, AlertTriangle, ChevronsUpDown, Check } from "lucide-react";
import type { User, LeadPurpose, Campaign, Lead, DonationType, LeadPriority } from "@/services/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";


const allLeadPurposes = ['Education', 'Medical', 'Relief Fund', 'Deen', 'Loan', 'Other'] as const;
const donationTypes: Exclude<DonationType, 'Split'>[] = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah', 'Any'];
const leadPriorities: LeadPriority[] = ['Urgent', 'High', 'Medium', 'Low'];

const categoryOptions: Record<Exclude<LeadPurpose, 'Other' | 'Loan'>, string[]> = {
    'Education': ['School Fees', 'College Fees', 'Tuition Fees', 'Exam Fees', 'Hostel Fees', 'Books & Uniforms', 'Educational Materials', 'Other'],
    'Medical': ['Hospital Bill', 'Medication', 'Doctor Consultation', 'Surgical Procedure', 'Medical Tests', 'Medical Equipment', 'Other'],
    'Relief Fund': ['Ration Kit', 'Financial Aid', 'Disaster Relief', 'Shelter Assistance', 'Utility Bill Payment', 'Other'],
    'Deen': ['Masjid Maintenance', 'Madrasa Support', 'Da\'wah Activities', 'Other'],
};

const loanCategoryOptions = ['Business Loan', 'Emergency Loan', 'Education Loan', 'Personal Loan', 'Other'];


const formSchema = z.object({
  beneficiaryType: z.enum(['existing', 'new']).default('existing'),
  beneficiaryId: z.string().optional(),
  
  // New beneficiary fields
  newBeneficiaryFirstName: z.string().optional(),
  newBeneficiaryMiddleName: z.string().optional(),
  newBeneficiaryLastName: z.string().optional(),
  newBeneficiaryPhone: z.string().optional(),
  newBeneficiaryEmail: z.string().email().optional(),

  campaignId: z.string().optional(),
  campaignName: z.string().optional(),
  referredByUserId: z.string().optional(),
  referredByUserName: z.string().optional(),
  purpose: z.enum(allLeadPurposes),
  otherPurposeDetail: z.string().optional(),
  category: z.string().min(1, "Category is required."),
  otherCategoryDetail: z.string().optional(),
  priority: z.enum(leadPriorities),
  acceptableDonationTypes: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one donation type.",
  }),
  helpRequested: z.coerce.number().min(1, "Amount must be greater than 0."),
  dueDate: z.date().optional(),
  isLoan: z.boolean().default(false),
  caseDetails: z.string().optional(),
  verificationDocument: z.any().optional(),
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
})
.refine(data => {
    if (data.beneficiaryType === 'existing') {
        return !!data.beneficiaryId && data.beneficiaryId.trim() !== '';
    }
    if (data.beneficiaryType === 'new') {
        return !!data.newBeneficiaryFirstName && !!data.newBeneficiaryLastName && !!data.newBeneficiaryPhone;
    }
    return false; // Should be either 'existing' or 'new'
}, {
    message: "Please either select an existing beneficiary or fill out the details for a new one.",
    path: ["beneficiaryId"], // Report error on the most likely field
});


type AddLeadFormValues = z.infer<typeof formSchema>;

interface AddLeadFormProps {
  users: User[];
  campaigns: Campaign[];
  disabledPurposes: string[];
}

export function AddLeadForm({ users, campaigns, disabledPurposes }: AddLeadFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<Lead[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [referralPopoverOpen, setReferralPopoverOpen] = useState(false);
  
  const potentialBeneficiaries = users.filter(u => u.roles.includes("Beneficiary"));
  const potentialReferrals = users.filter(u => u.roles.includes("Referral"));
  
  const leadPurposes = allLeadPurposes.filter(p => !disabledPurposes.includes(p));

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setAdminUserId(storedUserId);
  }, []);

  const form = useForm<AddLeadFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      beneficiaryType: 'existing',
      isLoan: false,
      helpRequested: 0,
      campaignId: 'none',
      acceptableDonationTypes: [],
      priority: 'Medium',
    },
  });

  const { formState: { isValid } } = form;
  const selectedPurpose = form.watch("purpose");
  const selectedCategory = form.watch("category");
  const beneficiaryType = form.watch("beneficiaryType");

  useEffect(() => {
    if (selectedPurpose === 'Loan') {
        form.setValue('isLoan', true);
    } else {
        form.setValue('isLoan', false);
    }
  }, [selectedPurpose, form]);


  async function onSubmit(values: AddLeadFormValues, forceCreate: boolean = false) {
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
    formData.append("beneficiaryType", values.beneficiaryType);
    if(values.beneficiaryId) formData.append("beneficiaryId", values.beneficiaryId);
    if(values.newBeneficiaryFirstName) formData.append("newBeneficiaryFirstName", values.newBeneficiaryFirstName);
    if(values.newBeneficiaryMiddleName) formData.append("newBeneficiaryMiddleName", values.newBeneficiaryMiddleName);
    if(values.newBeneficiaryLastName) formData.append("newBeneficiaryLastName", values.newBeneficiaryLastName);
    if(values.newBeneficiaryPhone) formData.append("newBeneficiaryPhone", values.newBeneficiaryPhone);
    if(values.newBeneficiaryEmail) formData.append("newBeneficiaryEmail", values.newBeneficiaryEmail);
    if(values.campaignId && values.campaignId !== 'none') formData.append("campaignId", values.campaignId);
    if(values.campaignName) formData.append("campaignName", values.campaignName);
    if(values.referredByUserId) formData.append("referredByUserId", values.referredByUserId);
    if(values.referredByUserName) formData.append("referredByUserName", values.referredByUserName);
    formData.append("purpose", values.purpose);
    if (values.otherPurposeDetail) formData.append("otherPurposeDetail", values.otherPurposeDetail);
    formData.append("category", values.category);
    if (values.otherCategoryDetail) formData.append("otherCategoryDetail", values.otherCategoryDetail);
    formData.append("priority", values.priority);
    values.acceptableDonationTypes.forEach(type => formData.append("acceptableDonationTypes", type));
    formData.append("helpRequested", String(values.helpRequested));
    if (values.dueDate) formData.append("dueDate", values.dueDate.toISOString());
    formData.append("isLoan", values.isLoan ? "on" : "off");
    if(values.caseDetails) formData.append("caseDetails", values.caseDetails);
    if(values.verificationDocument) formData.append("verificationDocument", values.verificationDocument);
    if (forceCreate) {
        formData.append("forceCreate", "true");
    }
    
    const result = await handleAddLead(formData);

    setIsSubmitting(false);
    
    if (result.duplicateLeadWarning) {
        setDuplicateWarning(result.duplicateLeadWarning);
        return;
    }

    if (result.success && result.lead) {
      toast({
        title: "Lead Created",
        description: `Successfully created lead for ${result.lead.name}.`,
      });
      form.reset({
        beneficiaryType: 'existing',
        isLoan: false,
        helpRequested: 0,
        acceptableDonationTypes: [],
        newBeneficiaryFirstName: '',
        newBeneficiaryMiddleName: '',
        newBeneficiaryLastName: '',
        newBeneficiaryPhone: '',
        newBeneficiaryEmail: '',
        beneficiaryId: '',
        caseDetails: '',
        category: '',
        otherCategoryDetail: '',
        otherPurposeDetail: '',
        purpose: undefined,
        priority: 'Medium',
        campaignId: 'none',
        campaignName: '',
        referredByUserId: '',
        referredByUserName: '',
        dueDate: undefined,
        verificationDocument: undefined,
      });
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
    } else {
      toast({
        variant: "destructive",
        title: "Error Creating Lead",
        description: result.error || "An unknown error occurred. Please check the form and try again.",
      });
    }
  }

  return (
    <>
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
                            form.setValue('newBeneficiaryFirstName', '');
                            form.setValue('newBeneficiaryMiddleName', '');
                            form.setValue('newBeneficiaryLastName', '');
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
                    <FormItem className="flex flex-col">
                        <FormLabel>Select Beneficiary</FormLabel>
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
                                ? potentialBeneficiaries.find(
                                    (user) => user.id === field.value
                                  )?.name
                                : "Select a beneficiary"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Search beneficiary..." />
                            <CommandList>
                                <CommandEmpty>No beneficiaries found.</CommandEmpty>
                                <CommandGroup>
                                {potentialBeneficiaries.map((user) => (
                                    <CommandItem
                                    value={user.name}
                                    key={user.id}
                                    onSelect={() => {
                                        form.setValue("beneficiaryId", user.id!);
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
            )}
            
            {beneficiaryType === 'new' && (
                <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-medium">New Beneficiary Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="newBeneficiaryFirstName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl><Input placeholder="First Name" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="newBeneficiaryMiddleName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Middle Name</FormLabel>
                                <FormControl><Input placeholder="Middle Name" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="newBeneficiaryLastName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl><Input placeholder="Last Name" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
            )}
            
             <FormField
                control={form.control}
                name="referredByUserId"
                render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Referred By (Optional)</FormLabel>
                    <Popover open={referralPopoverOpen} onOpenChange={setReferralPopoverOpen}>
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
                            ? potentialReferrals.find(
                                (user) => user.id === field.value
                                )?.name
                            : "Select a referral"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                        <CommandInput placeholder="Search referral..." />
                        <CommandList>
                            <CommandEmpty>No referrals found.</CommandEmpty>
                            <CommandGroup>
                            {potentialReferrals.map((user) => (
                                <CommandItem
                                value={user.name}
                                key={user.id}
                                onSelect={() => {
                                    form.setValue("referredByUserId", user.id!);
                                    form.setValue("referredByUserName", user.name);
                                    setReferralPopoverOpen(false);
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
            name="campaignId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Link to Campaign (Optional)</FormLabel>
                <Select
                    onValueChange={(value) => {
                      const selectedCampaign = campaigns.find(c => c.id === value);
                      field.onChange(value === 'none' ? undefined : value);
                      form.setValue('campaignName', selectedCampaign?.name || '');
                    }}
                    defaultValue={field.value}
                >
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a campaign" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {campaigns.filter(c => c.status !== 'Completed' && c.status !== 'Cancelled').map((campaign) => (
                            <SelectItem key={campaign.id} value={campaign.id!}>
                            {campaign.name} ({campaign.status})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormDescription>Link this lead to a specific fundraising campaign.</FormDescription>
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
                        form.setValue('category', ''); // Reset category on purpose change
                        form.setValue('otherCategoryDetail', '');
                        form.setValue('otherPurposeDetail', '');
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
                {selectedPurpose && selectedPurpose !== 'Other' && (
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
                                    {(selectedPurpose === 'Loan' ? loanCategoryOptions : categoryOptions[selectedPurpose as Exclude<LeadPurpose, 'Other' | 'Loan'>]).map(sub => (
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

            {selectedPurpose === 'Other' && (
                <FormField
                    control={form.control}
                    name="otherPurposeDetail"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Please specify "Other" purpose</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., House Repair" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            
            {selectedCategory === 'Other' && (
                <FormField
                    control={form.control}
                    name="otherCategoryDetail"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Please specify "Other" category details</FormLabel>
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
              name="acceptableDonationTypes"
              render={() => (
                <FormItem className="space-y-3 p-4 border rounded-lg">
                  <div className="mb-4">
                    <FormLabel className="text-base font-semibold">Acceptable Donation Types</FormLabel>
                    <FormDescription>
                      Select which types of donations can be allocated to this lead.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {donationTypes.map((type) => (
                      <FormField
                        key={type}
                        control={form.control}
                        name="acceptableDonationTypes"
                        render={({ field }) => {
                          const allOtherTypes = donationTypes.filter(t => t !== 'Any');
                          const handleAnyChange = (checked: boolean) => {
                             field.onChange(checked ? allOtherTypes : []);
                          }
                          const isAnyChecked = field.value?.includes('Any') || (field.value?.length === allOtherTypes.length);

                          if (type === 'Any') {
                            return (
                                <FormItem
                                key={type}
                                className="flex flex-row items-start space-x-3 space-y-0 font-bold"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={isAnyChecked}
                                    onCheckedChange={(checked) => handleAnyChange(!!checked)}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {type}
                                </FormLabel>
                              </FormItem>
                            )
                          }

                          return (
                            <FormItem
                              key={type}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(type)}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...(field.value || []), type]
                                      : field.value?.filter((value) => value !== type);
                                    
                                    // If all others are checked, check 'Any' as well
                                    if (newValue.length === allOtherTypes.length) {
                                      field.onChange(donationTypes);
                                    } else {
                                      // Remove 'Any' if not all are checked
                                      field.onChange(newValue.filter(v => v !== 'Any'));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                    {type}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
    
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
                </div>
                
                 <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Set a priority level" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {leadPriorities.map(p => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormDescription>Set the urgency of this case.</FormDescription>
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
    
                {selectedPurpose === 'Loan' && (
                     <FormField
                        control={form.control}
                        name="isLoan"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={true}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                Is this a repayable loan?
                                </FormLabel>
                                <FormDescription>
                                This is automatically selected if the purpose is "Loan".
                                </FormDescription>
                            </div>
                            </FormItem>
                        )}
                    />
                )}
    
                <FormField
                control={form.control}
                name="verificationDocument"
                render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                    <FormLabel>Verification Document</FormLabel>
                    <FormControl>
                        <Input 
                        type="file" 
                        ref={fileInputRef}
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
    
                <Button type="submit" disabled={isSubmitting || !isValid}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Lead
                </Button>
            </form>
            </Form>
            <AlertDialog open={!!duplicateWarning} onOpenChange={() => setDuplicateWarning(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-6 w-6 text-amber-500" />
                            Duplicate Lead Warning
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This beneficiary already has {duplicateWarning?.length} open lead(s). Are you sure you want to create another one?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="max-h-60 overflow-y-auto space-y-2 p-2 rounded-md bg-muted">
                        {duplicateWarning?.map(lead => (
                            <div key={lead.id} className="text-sm p-2 border bg-background rounded-md">
                                <p><strong>Purpose:</strong> {lead.purpose}</p>
                                <p><strong>Amount Requested:</strong> ₹{lead.helpRequested.toLocaleString()}</p>
                                <p><strong>Status:</strong> {lead.status}</p>
                            </div>
                        ))}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDuplicateWarning(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            setDuplicateWarning(null);
                            onSubmit(form.getValues(), true);
                        }}>
                            Yes, Create Anyway
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
      );
    }
    
