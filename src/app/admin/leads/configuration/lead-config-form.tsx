
"use client";

import { useForm, useFieldArray } from "react-hook-form";
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
  FormMessage
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Save, CheckCircle } from "lucide-react";
import { handleUpdateLeadConfiguration } from "./actions";

const formSchema = z.object({
    purposes: z.array(z.object({
        name: z.string(),
        enabled: z.boolean(),
    }))
});

type FormValues = z.infer<typeof formSchema>;

interface LeadConfigFormProps {
    allPurposes: string[];
    disabledPurposes: string[];
}

export function LeadConfigForm({ allPurposes, disabledPurposes }: LeadConfigFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purposes: allPurposes.map(name => ({
        name,
        enabled: !disabledPurposes.includes(name),
      }))
    },
  });

  const { formState: { isDirty } } = form;

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    
    const newDisabledPurposes = values.purposes
        .filter(p => !p.enabled)
        .map(p => p.name);

    const result = await handleUpdateLeadConfiguration(newDisabledPurposes);

    setIsSubmitting(false);

    if (result.success) {
      toast({
        variant: "success",
        title: "Settings Saved",
        description: `Lead configuration has been updated successfully.`,
        icon: <CheckCircle />,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-lg">
        <div>
            <h3 className="text-lg font-medium">Lead Purposes</h3>
            <p className="text-sm text-muted-foreground">
                Enable or disable specific purposes for new lead creation.
            </p>
        </div>
        
        <div className="space-y-4">
        {form.watch('purposes').map((purpose, index) => (
             <FormField
                key={purpose.name}
                control={form.control}
                name={`purposes.${index}.enabled`}
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">{purpose.name}</FormLabel>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />
        ))}
        </div>
        
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
