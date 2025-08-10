

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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import type { DashboardSettings, UserRole } from "@/services/types";
import { handleUpdateDashboardSettings } from "./actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  cards: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      roles: z.array(z.string()),
    })
  ),
});

type SettingsFormValues = z.infer<typeof formSchema>;

interface DashboardSettingsFormProps {
    settings?: DashboardSettings;
}

const allAppRoles: UserRole[] = ["Super Admin", "Admin", "Finance Admin", "Donor", "Beneficiary", "Referral"];

const cardDefinitions: { id: keyof DashboardSettings, label: string, description: string }[] = [
    { id: 'mainMetrics', label: 'Main Metrics', description: 'Overall stats like Total Raised, Distributed, etc.' },
    { id: 'monthlyContributors', label: 'Monthly Contributors', description: 'Card showing the status of monthly pledged donations.' },
    { id: 'monthlyPledge', label: 'Total Monthly Pledge', description: 'Card showing the total amount pledged monthly.' },
    { id: 'pendingLeads', label: 'Pending Lead Verifications', description: 'Action Required card for leads needing verification.' },
    { id: 'pendingDonations', label: 'Pending Donation Verifications', description: 'Action Required card for donations needing verification.' },
    { id: 'beneficiaryBreakdown', label: 'Beneficiaries Breakdown', description: 'Shows counts of different beneficiary types helped.' },
    { id: 'campaignBreakdown', label: 'Campaigns Breakdown', description: 'Shows counts of active, completed, and upcoming campaigns.' },
    { id: 'donationsChart', label: 'Donations Overview Chart', description: 'The main bar chart showing monthly donation totals.' },
    { id: 'topDonors', label: 'Top Donors List', description: 'Shows a list of the top 5 donors.' },
    { id: 'recentCampaigns', label: 'Recent Campaigns Table', description: 'A table listing the most recent campaigns.' },
    { id: 'donationTypeBreakdown', label: 'Donation Type Breakdown', description: 'Shows total amounts received per donation type (Zakat, Sadaqah, etc.).' },
];


export function DashboardSettingsForm({ settings }: DashboardSettingsFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cards: cardDefinitions.map(card => ({
        id: card.id,
        label: card.label,
        roles: settings?.[card.id]?.visibleTo || [],
      }))
    },
  });

  const { formState: { isDirty }, reset } = form;

  async function onSubmit(values: SettingsFormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    values.cards.forEach(card => {
        card.roles.forEach(role => {
            formData.append(`${card.id}-roles`, role);
        });
    });

    const result = await handleUpdateDashboardSettings(settings, formData);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Settings Saved",
        description: `Dashboard visibility settings have been updated.`,
      });
      form.reset(values); // This resets the 'dirty' state of the form
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {cardDefinitions.map((card, index) => (
                <FormField
                    key={card.id}
                    control={form.control}
                    name={`cards.${index}.roles`}
                    render={() => (
                    <FormItem className="space-y-3 p-4 border rounded-lg bg-muted/40">
                      <div className="mb-4">
                        <FormLabel className="text-base font-semibold">{card.label}</FormLabel>
                        <FormDescription>
                         {card.description}
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {allAppRoles.map((role) => (
                          <FormField
                            key={role}
                            control={form.control}
                            name={`cards.${index}.roles`}
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={role}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(role)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, role])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== role
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {role}
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
            ))}
        {isDirty && (
            <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
            </Button>
        )}
      </form>
    </Form>
  );
}
