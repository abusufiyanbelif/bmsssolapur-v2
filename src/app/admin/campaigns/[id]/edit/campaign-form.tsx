
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
import { CalendarIcon, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { handleUpdateCampaign } from "./actions";
import { useRouter } from "next/navigation";
import { Campaign, CampaignStatus } from "@/services/campaign-service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";

const campaignStatuses: CampaignStatus[] = ['Upcoming', 'Active', 'Completed', 'Cancelled'];

const formSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  goal: z.coerce.number().min(1, "Goal must be a positive number."),
  dates: z.object({
    from: z.date(),
    to: z.date(),
  }),
  status: z.enum(campaignStatuses),
});

type CampaignFormValues = z.infer<typeof formSchema>;

interface CampaignFormProps {
    campaign: Campaign;
}

export function CampaignForm({ campaign }: CampaignFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: campaign.name,
        description: campaign.description,
        goal: campaign.goal,
        dates: {
            from: campaign.startDate.toDate(),
            to: campaign.endDate.toDate(),
        },
        status: campaign.status,
    },
  });

  async function onSubmit(values: CampaignFormValues) {
    setIsSubmitting(true);
    const result = await handleUpdateCampaign(campaign.id!, {
      name: values.name,
      description: values.description,
      goal: values.goal,
      startDate: values.dates.from,
      endDate: values.dates.to,
      status: values.status,
    });
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Campaign Updated",
        description: `Successfully updated the "${values.name}" campaign.`,
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
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !field.value && "text-muted-foreground"
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
                                mode="range"
                                selected={field.value}
                                onSelect={field.onChange}
                                numberOfMonths={2}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <FormDescription>The start and end date for this campaign.</FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
