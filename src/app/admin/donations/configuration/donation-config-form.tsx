
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
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleUpdateDonationConfiguration } from "./actions";
import type { AppSettings } from "@/services/types";

const formSchema = z.object({
    allowDonorSelfServiceDonations: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface DonationConfigFormProps {
    settings?: AppSettings['donationConfiguration'];
    onUpdate: () => void;
}

export function DonationConfigForm({ settings, onUpdate }: DonationConfigFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            allowDonorSelfServiceDonations: settings?.allowDonorSelfServiceDonations ?? true,
        },
    });

    const { formState: { isDirty } } = form;

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);
        const result = await handleUpdateDonationConfiguration(values);
        if (result.success) {
            toast({ variant: 'success', title: 'Settings Updated', description: 'Donation configuration has been saved.' });
            onUpdate();
            form.reset(values);
        } else {
            toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
        }
        setIsSubmitting(false);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="allowDonorSelfServiceDonations"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Allow Donors to Add Donations</FormLabel>
                                <FormDescription>
                                    If enabled, donors can manually record donations they have made (e.g., via bank transfer) and upload proof.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {isDirty && (
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Settings
                    </Button>
                )}
            </form>
        </Form>
    );
}
