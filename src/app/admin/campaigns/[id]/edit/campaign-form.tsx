

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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Save, X, Edit, ImageIcon, ChevronsUpDown, Check, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { handleUpdateCampaign } from "./actions";
import { useRouter } from "next/navigation";
import { Campaign, CampaignStatus, Lead, User } from "@/services/types";
import type { DonationType } from "@/services/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// All statuses are available when editing
const campaignStatuses: CampaignStatus[] = ['Upcoming', 'Active', 'Completed', 'Cancelled'];
const donationTypes: Exclude<DonationType, 'Split'>[] = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah', 'Any'];

const formSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  goalCalculationMethod: z.enum(['manual', 'auto']).default('manual'),
  goal: z.coerce.number().optional(),
  collectedAmount: z.coerce.number().optional(),
  fixedAmountPerBeneficiary: z.coerce.number().optional(),
  targetBeneficiaries: z.coerce.number().optional(),
  image: z.any().optional(),
  dates: z.object({
    from: z.date({ required_error: "A start date is required."}),
    to: z.date({ required_error: "An end date is required."}),
  }),
  status: z.enum(campaignStatuses),
  acceptableDonationTypes: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one donation type.",
  }),
  linkedCompletedCampaignIds: z.array(z.string()).optional(),
  linkedLeadIds: z.array(z.string()).optional(),
  linkedBeneficiaryIds: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
    if (data.status === 'Completed') {
        if (!data.collectedAmount || data.collectedAmount <= 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Amount Collected is required for 'Completed' campaigns.", path: ["collectedAmount"] });
        }
    }
    if (data.goalCalculationMethod === 'manual' && (!data.goal || data.goal <= 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Goal must be a positive number for manual calculation.", path: ["goal"] });
    }
    if (data.goalCalculationMethod === 'auto') {
        if (!data.fixedAmountPerBeneficiary || data.fixedAmountPerBeneficiary <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Amount per beneficiary must be a positive number.", path: ["fixedAmountPerBeneficiary"] });
        }
        if (!data.targetBeneficiaries || data.targetBeneficiaries <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Number of beneficiaries must be a positive number.", path: ["targetBeneficiaries"] });
        }
    }
});


type CampaignFormValues = z.infer<typeof formSchema>;

interface CampaignFormProps {
    campaign: Campaign & { collectedAmount?: number };
    completedCampaigns: Campaign[];
    unassignedLeads: Lead[];
    beneficiaryUsers: User[];
}

export function CampaignForm({ campaign, completedCampaigns, unassignedLeads, beneficiaryUsers }: CampaignFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(campaign.imageUrl || null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [completedCampaignPopoverOpen, setCompletedCampaignPopoverOpen] = useState(false);
  const [leadPopoverOpen, setLeadPopoverOpen] = useState(false);
  const [beneficiaryPopoverOpen, setBeneficiaryPopoverOpen] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setAdminUserId(storedUserId);
  }, []);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: campaign.name,
        description: campaign.description,
        goalCalculationMethod: campaign.fixedAmountPerBeneficiary ? 'auto' : 'manual',
        goal: campaign.goal,
        collectedAmount: campaign.collectedAmount || 0,
        fixedAmountPerBeneficiary: campaign.fixedAmountPerBeneficiary || 0,
        targetBeneficiaries: campaign.targetBeneficiaries || 0,
        image: null,
        dates: {
            from: new Date(campaign.startDate),
            to: new Date(campaign.endDate),
        },
        status: campaign.status,
        acceptableDonationTypes: campaign.acceptableDonationTypes || [],
        linkedCompletedCampaignIds: campaign.linkedCompletedCampaignIds || [],
        linkedLeadIds: campaign.leads || [], // Assuming leads are linked via an array of IDs on the campaign
        linkedBeneficiaryIds: [], // This would need to be populated if campaigns directly link beneficiaries
    },
  });

  const { formState: { isDirty }, reset, handleSubmit, setValue, watch, control } = form;
  const linkedCompletedCampaignIds = watch('linkedCompletedCampaignIds') || [];
  const linkedLeadIds = watch('linkedLeadIds') || [];
  const linkedBeneficiaryIds = watch('linkedBeneficiaryIds') || [];
  const goalCalculationMethod = watch('goalCalculationMethod');
  const fixedAmount = watch('fixedAmountPerBeneficiary');
  const targetBeneficiaries = watch('targetBeneficiaries');
  const campaignStatus = watch('status');

  useEffect(() => {
    if (goalCalculationMethod === 'auto' && fixedAmount && targetBeneficiaries) {
        setValue('goal', fixedAmount * targetBeneficiaries, { shouldDirty: true });
    }
  }, [goalCalculationMethod, fixedAmount, targetBeneficiaries, setValue]);

  const handleCancel = () => {
    reset(); // Resets to the initial default values
    setImagePreview(campaign.imageUrl || null);
    setIsEditing(false);
  }
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setValue('image', file, { shouldDirty: true });
        setImagePreview(URL.createObjectURL(file));
    } else {
        setValue('image', null, { shouldDirty: true });
        setImagePreview(campaign.imageUrl || null);
    }
  };

  async function onSubmit(values: CampaignFormValues) {
    if (!adminUserId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Admin user not found. Please log in again.' });
        return;
    }
    setIsSubmitting(true);
    
    const formData = new FormData();
    // Append all form values
    for (const key in values) {
      const formKey = key as keyof CampaignFormValues;
      const value = values[formKey] as any;
      if (value !== null && value !== undefined) {
        if (key === 'dates' && typeof value === 'object') {
            formData.append('startDate', value.from.toISOString());
            formData.append('endDate', value.to.toISOString());
        }
        else if (Array.isArray(value)) {
            value.forEach(v => formData.append(key, v));
        } else {
            formData.append(key, String(value));
        }
      }
    }

    if (values.image) {
      formData.append('image', values.image);
    }
    if (campaign.imageUrl) {
        formData.append('existingImageUrl', campaign.imageUrl);
    }

    formData.append('adminUserId', adminUserId);

    const result = await handleUpdateCampaign(campaign.id!, formData);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Campaign Updated",
        description: `Successfully updated the "${values.name}" campaign.`,
      });
      setIsEditing(false);
      router.refresh(); // Refresh to get latest data
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  }
  
  const progress = campaign.goal > 0 ? ((campaign.collectedAmount || 0) / campaign.goal) * 100 : 0;

  return (
     <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Edit Campaign</CardTitle>
                    <CardDescription>
                        Update the details for the &quot;{campaign.name}&quot; campaign.
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
            <div className="space-y-2 mb-6">
                <h3 className="font-semibold">Funding Progress</h3>
                    <Progress value={progress} className="w-full" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                        <span className="font-bold text-foreground">₹{(campaign.collectedAmount || 0).toLocaleString()}</span> collected
                    </span>
                    <span>
                        Goal: <span className="font-bold text-foreground">₹{campaign.goal.toLocaleString()}</span>
                    </span>
                    </div>
            </div>
            <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
                <fieldset disabled={!isEditing} className="space-y-8">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Campaign Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Ramadan 2025 Zakat Drive" {...field} />
                        </FormControl>
                        <FormDescription>A short, descriptive name for the campaign.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Describe the purpose and goals of this campaign."
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
                        name="image"
                        render={() => (
                            <FormItem>
                                <FormLabel>Campaign Image</FormLabel>
                                <FormControl>
                                    <Input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageChange} />
                                </FormControl>
                                {imagePreview && (
                                    <div className="mt-4 relative w-full h-48">
                                        <Image src={imagePreview} alt="Campaign image preview" fill className="rounded-md object-cover" />
                                    </div>
                                )}
                                <FormDescription>Upload a new background image to replace the current one.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="goalCalculationMethod"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Fundraising Goal Method</FormLabel>
                                <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex space-x-4"
                                >
                                    <FormItem className="flex items-center space-x-2">
                                    <FormControl><RadioGroupItem value="manual" /></FormControl>
                                    <FormLabel className="font-normal">Manual Goal</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2">
                                    <FormControl><RadioGroupItem value="auto" /></FormControl>
                                    <FormLabel className="font-normal">Calculate from Fixed Amount</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    
                    {goalCalculationMethod === 'auto' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end p-4 border rounded-lg">
                            <FormField control={form.control} name="fixedAmountPerBeneficiary" render={({ field }) => ( <FormItem><FormLabel>Amount Per Beneficiary (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="targetBeneficiaries" render={({ field }) => ( <FormItem><FormLabel>Number of Beneficiaries</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                        control={form.control}
                        name="goal"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Fundraising Goal (₹)</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} disabled={goalCalculationMethod === 'auto'} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} >
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {campaignStatuses.map(status => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    
                    {campaignStatus === 'Completed' && (
                         <FormField
                            control={form.control}
                            name="collectedAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount Collected</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormDescription>Enter the total amount that was collected for this past campaign.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="dates"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Campaign Dates</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                id="date"
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !field.value?.from && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value?.from ? (
                                                    field.value.to ? (
                                                        <>
                                                            {format(field.value.from, "LLL dd, y")} -{" "}
                                                            {format(field.value.to, "LLL dd, y")}
                                                        </>
                                                    ) : (
                                                        format(field.value.from, "LLL dd, y")
                                                    )
                                                ) : (
                                                    <span>Pick a start and end date</span>
                                                )}
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={field.value?.from}
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormDescription>The start and end date for this campaign.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="acceptableDonationTypes"
                        render={() => (
                            <FormItem className="space-y-3 p-4 border rounded-lg">
                            <div className="mb-4">
                                <FormLabel className="text-base font-semibold">Acceptable Donation Types</FormLabel>
                                <FormDescription>
                                    Select which types of donations can be allocated to this campaign.
                                </FormDescription>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {donationTypes.map((type) => (
                                <FormField
                                    key={type}
                                    control={form.control}
                                    name="acceptableDonationTypes"
                                    render={({ field }) => {
                                    return (
                                        <FormItem
                                        key={type}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                        <FormControl>
                                            <Checkbox
                                            checked={field.value?.includes(type)}
                                            onCheckedChange={(checked) => {
                                                return checked
                                                ? field.onChange([...(field.value || []), type])
                                                : field.onChange(
                                                    field.value?.filter(
                                                        (value) => value !== type
                                                    )
                                                    )
                                            }}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            {type}
                                        </FormLabel>
                                        </FormItem>
                                    )
                                    }}
                                />
                                ))}
                            </div>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="linkedBeneficiaryIds"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Link Existing Beneficiaries (Optional)</FormLabel>
                            <Popover open={beneficiaryPopoverOpen} onOpenChange={setBeneficiaryPopoverOpen}>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn("w-full justify-between min-h-10 h-auto", linkedBeneficiaryIds.length === 0 && "text-muted-foreground")}
                                    >
                                    {linkedBeneficiaryIds.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                        {linkedBeneficiaryIds.map(id => {
                                            const user = beneficiaryUsers.find(u => u.id === id);
                                            return <Badge key={id} variant="secondary">{user?.name}</Badge>
                                        })}
                                        </div>
                                    ) : "Select beneficiaries..."}
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
                                        {beneficiaryUsers.map((user) => (
                                        <CommandItem
                                            value={`${user.name} ${user.id}`}
                                            key={user.id}
                                            onSelect={() => {
                                                const isSelected = linkedBeneficiaryIds.includes(user.id!);
                                                if (isSelected) {
                                                    setValue('linkedBeneficiaryIds', linkedBeneficiaryIds.filter(id => id !== user.id!), { shouldDirty: true });
                                                } else {
                                                    setValue('linkedBeneficiaryIds', [...linkedBeneficiaryIds, user.id!], { shouldDirty: true });
                                                }
                                            }}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", linkedBeneficiaryIds.includes(user.id!) ? "opacity-100" : "opacity-0")} />
                                            <span>{user.name} ({user.phone})</span>
                                        </CommandItem>
                                        ))}
                                    </CommandGroup>
                                    </CommandList>
                                </Command>
                                </PopoverContent>
                            </Popover>
                             <FormDescription>Automatically creates a new lead for each selected beneficiary and links it to this campaign.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                     <FormField
                        control={form.control}
                        name="linkedLeadIds"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Link Existing Leads (Optional)</FormLabel>
                            <Popover open={leadPopoverOpen} onOpenChange={setLeadPopoverOpen}>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn("w-full justify-between min-h-10 h-auto", linkedLeadIds.length === 0 && "text-muted-foreground")}
                                    >
                                    {linkedLeadIds.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                        {linkedLeadIds.map(id => {
                                            const lead = unassignedLeads.find(l => l.id === id);
                                            return <Badge key={id} variant="secondary">{lead?.name}</Badge>
                                        })}
                                        </div>
                                    ) : "Select leads..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search lead..." />
                                    <CommandList>
                                    <CommandEmpty>No unassigned leads found.</CommandEmpty>
                                    <CommandGroup>
                                        {unassignedLeads.map((lead) => (
                                        <CommandItem
                                            value={`${lead.name} ${lead.id}`}
                                            key={lead.id}
                                            onSelect={() => {
                                                const isSelected = linkedLeadIds.includes(lead.id!);
                                                if (isSelected) {
                                                    setValue('linkedLeadIds', linkedLeadIds.filter(id => id !== lead.id!), { shouldDirty: true });
                                                } else {
                                                    setValue('linkedLeadIds', [...linkedLeadIds, lead.id!], { shouldDirty: true });
                                                }
                                            }}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", linkedLeadIds.includes(lead.id!) ? "opacity-100" : "opacity-0")} />
                                            <span>{lead.name} (Req: ₹{lead.helpRequested})</span>
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
                        name="linkedCompletedCampaignIds"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Link Past Successes (Optional)</FormLabel>
                            <Popover open={completedCampaignPopoverOpen} onOpenChange={setCompletedCampaignPopoverOpen}>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn("w-full justify-between min-h-10 h-auto", linkedCompletedCampaignIds.length === 0 && "text-muted-foreground")}
                                    >
                                    {linkedCompletedCampaignIds.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                        {linkedCompletedCampaignIds.map(id => {
                                            const campaign = completedCampaigns.find(c => c.id === id);
                                            return <Badge key={id} variant="secondary">{campaign?.name}</Badge>
                                        })}
                                        </div>
                                    ) : "Select completed campaigns..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search campaign..." />
                                    <CommandList>
                                    <CommandEmpty>No completed campaigns found.</CommandEmpty>
                                    <CommandGroup>
                                        {completedCampaigns.map((campaign) => (
                                        <CommandItem
                                            value={campaign.name}
                                            key={campaign.id}
                                            onSelect={() => {
                                                const isSelected = linkedCompletedCampaignIds.includes(campaign.id!);
                                                if (isSelected) {
                                                    setValue('linkedCompletedCampaignIds', linkedCompletedCampaignIds.filter(id => id !== campaign.id!), { shouldDirty: true });
                                                } else {
                                                    setValue('linkedCompletedCampaignIds', [...linkedCompletedCampaignIds, campaign.id!], { shouldDirty: true });
                                                }
                                            }}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", linkedCompletedCampaignIds.includes(campaign.id!) ? "opacity-100" : "opacity-0")} />
                                            <span>{campaign.name} (Goal: ₹{campaign.goal})</span>
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
                </fieldset>
                
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
