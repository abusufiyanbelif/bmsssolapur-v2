

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Save, Edit, X } from "lucide-react";
import type { AnalyticsDashboardSettings, UserRole } from "@/services/types";
import { handleUpdateAnalyticsDashboardSettings } from "./actions";
import { Checkbox } from "@/components/ui/checkbox";

const allAppRoles: UserRole[] = ["Super Admin", "Admin", "Finance Admin"];

const cardDefinitions: { id: keyof AnalyticsDashboardSettings, label: string, description: string }[] = [
    { id: 'mainMetrics', label: 'Main Metrics', description: 'Overall stats like Total Raised, Distributed, etc.' },
    { id: 'fundsInHand', label: 'Funds in Hand Card', description: 'A separate card showing available funds.' },
    { id: 'donationsChart', label: 'Donations Overview Chart', description: 'The main bar chart showing monthly donation totals.' },
    { id: 'leadBreakdown', label: 'Lead Purpose Breakdown', description: 'Shows a summary of all leads organized by their primary purpose.' },
    { id: 'beneficiaryBreakdown', label: 'Beneficiaries Breakdown', description: 'Shows counts of different beneficiary types helped.' },
    { id: 'campaignBreakdown', label: 'Campaigns Breakdown', description: 'Shows counts of active, completed, and upcoming campaigns.' },
    { id: 'donationTypeBreakdown', label: 'Donation Type Breakdown', description: 'Shows total amounts received per donation type (Zakat, Sadaqah, etc.).' },
    { id: 'topDonors', label: 'Top Donors List', description: 'Shows a list of the top donors.' },
    { id: 'topDonations', label: 'Top Donations List', description: 'Shows a list of the largest recent donations.' },
    { id: 'recentCampaigns', label: 'Recent Campaigns Table', description: 'A table listing the most recent campaigns.' },
];

const formSchema = z.object({
  cards: z.array(z.object({
    id: z.string(),
    roles: z.array(z.string()),
  })),
});

type SettingsFormValues = z.infer<typeof formSchema>;

interface AnalyticsDashboardSettingsFormProps {
    settings?: AnalyticsDashboardSettings;
}

export function AnalyticsDashboardSettingsForm({ settings }: AnalyticsDashboardSettingsFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cards: cardDefinitions.map(card => ({
        id: card.id,
        roles: settings?.[card.id]?.visibleTo || [],
      }))
    },
  });
  
  const { formState: { isDirty }, reset } = form;

  const handleCancel = () => {
    reset({
      cards: cardDefinitions.map(card => ({
        id: card.id,
        roles: settings?.[card.id]?.visibleTo || [],
      }))
    });
    setIsEditing(false);
  }

  async function onSubmit(values: SettingsFormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    values.cards.forEach(card => {
        card.roles.forEach(role => {
            formData.append(`${card.id}-roles`, role);
        });
    });

    const result = await handleUpdateAnalyticsDashboardSettings(settings, formData);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Settings Saved",
        description: `Analytics Dashboard visibility settings have been updated.`,
      });
      form.reset(values);
      setIsEditing(false);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  }

  return (
    <>
        <div className="flex justify-end mb-6">
            {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Settings
                </Button>
            ) : (
                 <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                        <X className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                     <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting || !isDirty}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            )}
        </div>
        <Form {...form}>
        <form className="space-y-8">
            {cardDefinitions.map((card, index) => (
                <FormField
                    key={card.id}
                    control={form.control}
                    name={`cards.${index}.roles`}
                    render={() => (
                    <FormItem className="space-y-3 p-4 border rounded-lg bg-muted/40">
                        <div className="mb-4">
                            <FormLabel className="text-base font-semibold">{card.label}</FormLabel>
                            <FormDescription>{card.description}</FormDescription>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                                        disabled={!isEditing}
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
                                    <FormLabel className="font-normal">{role}</FormLabel>
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
        </form>
        </Form>
    </>
  );
}
