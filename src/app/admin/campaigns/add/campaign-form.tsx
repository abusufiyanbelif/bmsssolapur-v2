

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
import { CalendarIcon, Loader2, X, Check, ChevronsUpDown, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { handleCreateCampaign } from "./actions";
import { useRouter } from "next/navigation";
import { CampaignStatus, DonationType, Lead, Donation } from "@/services/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

const campaignStatuses: CampaignStatus[] = ['Upcoming', 'Active', 'Completed', 'Cancelled'];
const donationTypes: Exclude<DonationType, 'Split'>[] = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah', 'Any'];


const formSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  goal: z.coerce.number().min(1, "Goal must be a positive number."),
  dates: z.object({
    from: z.date({ required_error: "A start date is required."}),
    to: z.date({ required_error: "An end date is required."}),
  }),
  status: z.enum(campaignStatuses),
  acceptableDonationTypes: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one donation type.",
  }),
  linkedLeadIds: z.array(z.string()).optional(),
  linkedDonationIds: z.array(z.string()).optional(),
});

type CampaignFormValues = z.infer<typeof formSchema>;

interface CampaignFormProps {
    leads: Lead[];
    donations: Donation[];
}

export function CampaignForm({ leads, donations }: CampaignFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadPopoverOpen, setLeadPopoverOpen] = useState(false);
  const [donationPopoverOpen, setDonationPopoverOpen] = useState(false);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: "",
        description: "",
        goal: 0,
        status: "Upcoming",
        acceptableDonationTypes: [],
        linkedLeadIds: [],
        linkedDonationIds: [],
    },
  });
  
  const { watch, setValue } = form;
  const linkedLeadIds = watch('linkedLeadIds') || [];
  const linkedDonationIds = watch('linkedDonationIds') || [];

  
  const handleCancel = () => {
    form.reset({
        name: "",
        description: "",
        goal: 0,
        status: "Upcoming",
        dates: undefined,
        acceptableDonationTypes: [],
        linkedLeadIds: [],
        linkedDonationIds: [],
    });
  }

  async function onSubmit(values: CampaignFormValues) {
    setIsSubmitting(true);
    const result = await handleCreateCampaign(values);
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
                        className={cn("w-full justify-between", linkedLeadIds.length === 0 && "text-muted-foreground")}
                        >
                        {linkedLeadIds.length > 0 ? `${linkedLeadIds.length} lead(s) selected` : "Select leads..."}
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
                 {linkedLeadIds.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                        {linkedLeadIds.map(id => {
                            const lead = leads.find(l => l.id === id);
                            return (
                                <Badge key={id} variant="secondary">
                                    {lead?.name}
                                    <button onClick={() => setValue('linkedLeadIds', linkedLeadIds.filter(lid => lid !== id))} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20">
                                        <XCircle className="h-3 w-3" />
                                    </button>
                                </Badge>
                            );
                        })}
                    </div>
                 )}
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
                        className={cn("w-full justify-between", linkedDonationIds.length === 0 && "text-muted-foreground")}
                        >
                        {linkedDonationIds.length > 0 ? `${linkedDonationIds.length} donation(s) selected` : "Select donations..."}
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
                 {linkedDonationIds.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                        {linkedDonationIds.map(id => {
                            const donation = donations.find(d => d.id === id);
                            return (
                                <Badge key={id} variant="secondary">
                                    {donation?.donorName} (₹{donation?.amount})
                                    <button onClick={() => setValue('linkedDonationIds', linkedDonationIds.filter(lid => lid !== id))} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20">
                                        <XCircle className="h-3 w-3" />
                                    </button>
                                </Badge>
                            );
                        })}
                    </div>
                 )}
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
                <X className="mr-2 h-4 w-4" />
                Cancel
            </Button>
        </div>
      </form>
    </Form>
  );
}
