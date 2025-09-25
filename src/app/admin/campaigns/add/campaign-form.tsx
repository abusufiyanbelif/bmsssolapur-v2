
// src/app/admin/campaigns/add/campaign-form.tsx

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
import { CalendarIcon, Loader2, X, Check, ChevronsUpDown, XCircle, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { handleCreateCampaign } from "./actions";
import { useRouter } from "next/navigation";
import { CampaignStatus, DonationType, Lead, Donation, Campaign } from "@/services/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

const campaignStatuses = ['Upcoming', 'Active', 'Completed', 'Cancelled'] as const;
const donationTypes: Exclude<DonationType, 'Split'>[] = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah', 'Any'];

const formSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  goal: z.coerce.number().min(1, "Goal must be a positive number."),
  image: z.any().optional(),
  dates: z.object({
    from: z.date({ required_error: "A start date is required."}),
    to: z.date({ required_error: "An end date is required."}),
  }),
  status: z.enum(campaignStatuses),
  acceptableDonationTypes: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one donation type.",
  }),
  collectedAmount: z.coerce.number().optional(),
  linkedLeadIds: z.array(z.string()).optional(),
  linkedDonationIds: z.array(z.string()).optional(),
  linkedCompletedCampaignIds: z.array(z.string()).optional(),
}).refine(data => {
    if (data.status === 'Completed') {
        return !!data.collectedAmount && data.collectedAmount > 0;
    }
    return true;
}, {
    message: "Amount Collected is required and must be greater than 0 for 'Completed' campaigns.",
    path: ["collectedAmount"],
});


type CampaignFormValues = z.infer<typeof formSchema>;

interface CampaignFormProps {
    leads: Lead[];
    donations: Donation[];
    completedCampaigns: Campaign[];
}

export function CampaignForm({ leads, donations, completedCampaigns }: CampaignFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadPopoverOpen, setLeadPopoverOpen] = useState(false);
  const [donationPopoverOpen, setDonationPopoverOpen] = useState(false);
  const [completedCampaignPopoverOpen, setCompletedCampaignPopoverOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: "",
        description: "",
        goal: 0,
        image: null,
        status: "Upcoming",
        acceptableDonationTypes: [],
        collectedAmount: 0,
        linkedLeadIds: [],
        linkedDonationIds: [],
        linkedCompletedCampaignIds: [],
    },
  });
  
  const { watch, setValue } = form;
  const linkedLeadIds = watch('linkedLeadIds') || [];
  const linkedDonationIds = watch('linkedDonationIds') || [];
  const linkedCompletedCampaignIds = watch('linkedCompletedCampaignIds') || [];
  const campaignStatus = watch('status');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setValue('image', file);
        setImagePreview(URL.createObjectURL(file));
    } else {
        setValue('image', null);
        setImagePreview(null);
    }
  };

  
  const handleCancel = () => {
    form.reset({
        name: "",
        description: "",
        goal: 0,
        status: "Upcoming",
        dates: undefined,
        acceptableDonationTypes: [],
        collectedAmount: 0,
        linkedLeadIds: [],
        linkedDonationIds: [],
        linkedCompletedCampaignIds: [],
    });
    setImagePreview(null);
    if (imageInputRef.current) {
        imageInputRef.current.value = "";
    }
  }

  async function onSubmit(values: CampaignFormValues) {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('description', values.description);
    formData.append('goal', String(values.goal));
    formData.append('startDate', values.dates.from.toISOString());
    formData.append('endDate', values.dates.to.toISOString());
    formData.append('status', values.status);
    values.acceptableDonationTypes.forEach(dt => formData.append('acceptableDonationTypes', dt));
    values.linkedLeadIds?.forEach(id => formData.append('linkedLeadIds', id));
    values.linkedDonationIds?.forEach(id => formData.append('linkedDonationIds', id));
    values.linkedCompletedCampaignIds?.forEach(id => formData.append('linkedCompletedCampaignIds', id));
    if (values.image) {
      formData.append('image', values.image);
    }
    if (values.status === 'Completed' && values.collectedAmount) {
        formData.append('collectedAmount', String(values.collectedAmount));
    }

    const result = await handleCreateCampaign(formData);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Campaign Created",
        description: `Successfully created the "${values.name}" campaign.`,
      });
      router.push("/admin/campaigns");
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
                    <FormDescription>Upload a background image for the campaign card.</FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="goal"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Fundraising Goal (₹)</FormLabel>
                <FormControl>
                    <Input type="number" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <FormLabel>Amount Collected (for completed campaigns)</FormLabel>
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
                                    const lead = leads.find(l => l.id === id);
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
                            {leads.map((lead) => (
                            <CommandItem
                                value={`${lead.name} ${lead.id}`}
                                key={lead.id}
                                onSelect={() => {
                                    const isSelected = linkedLeadIds.includes(lead.id!);
                                    if (isSelected) {
                                        setValue('linkedLeadIds', linkedLeadIds.filter(id => id !== lead.id!));
                                    } else {
                                        setValue('linkedLeadIds', [...linkedLeadIds, lead.id!]);
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
            name="linkedDonationIds"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Link Existing Donations (Optional)</FormLabel>
                <Popover open={donationPopoverOpen} onOpenChange={setDonationPopoverOpen}>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant="outline"
                        role="combobox"
                        className={cn("w-full justify-between min-h-10 h-auto", linkedDonationIds.length === 0 && "text-muted-foreground")}
                        >
                        {linkedDonationIds.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {linkedDonationIds.map(id => {
                                    const donation = donations.find(d => d.id === id);
                                    return <Badge key={id} variant="secondary">{donation?.donorName} (₹{donation?.amount})</Badge>
                                })}
                            </div>
                        ) : "Select donations..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Search donation..." />
                        <CommandList>
                        <CommandEmpty>No unassigned, verified donations found.</CommandEmpty>
                        <CommandGroup>
                            {donations.map((donation) => (
                            <CommandItem
                                value={`${donation.donorName} ${donation.id}`}
                                key={donation.id}
                                onSelect={() => {
                                    const isSelected = linkedDonationIds.includes(donation.id!);
                                    if (isSelected) {
                                        setValue('linkedDonationIds', linkedDonationIds.filter(id => id !== donation.id!));
                                    } else {
                                        setValue('linkedDonationIds', [...linkedDonationIds, donation.id!]);
                                    }
                                }}
                            >
                                <Check className={cn("mr-2 h-4 w-4", linkedDonationIds.includes(donation.id!) ? "opacity-100" : "opacity-0")} />
                                <span>{donation.donorName} (₹{donation.amount})</span>
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
                                        setValue('linkedCompletedCampaignIds', linkedCompletedCampaignIds.filter(id => id !== campaign.id!));
                                    } else {
                                        setValue('linkedCompletedCampaignIds', [...linkedCompletedCampaignIds, campaign.id!]);
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
                 <FormDescription>Link to similar, successfully completed campaigns to motivate donors.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
        />

        <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Campaign
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
            </Button>
        </div>
      </form>
    </Form>
  );
}
