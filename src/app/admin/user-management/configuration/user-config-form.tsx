
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
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { handleUpdateUserConfiguration } from "./actions";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { UserConfiguration } from "@/services/types";

const formSchema = z.object({
  isAadhaarMandatory: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface UserConfigFormProps {
    settings?: UserConfiguration;
}

export function UserConfigForm({ settings }: UserConfigFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isAadhaarMandatory: settings?.isAadhaarMandatory ?? false,
    },
  });

  const { formState: { isDirty } } = form;

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    if(values.isAadhaarMandatory) formData.append("isAadhaarMandatory", "on");

    const result = await handleUpdateUserConfiguration(formData);
    
    if (result.success) {
      toast({ variant: 'success', title: 'Settings Updated', description: 'User configuration has been saved.' });
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
                name="isAadhaarMandatory"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">Make Aadhaar Number Mandatory</FormLabel>
                            <FormDescription>
                                If enabled, the Aadhaar number will be a required field when creating new users.
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
  )
}
