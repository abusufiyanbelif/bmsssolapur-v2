

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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Save, CheckCircle } from "lucide-react";
import { handleUpdateLeadWorkflow } from "./actions";
import type { AppSettings, LeadStatus } from "@/services/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const allLeadStatuses: LeadStatus[] = ["Open", "Pending", "Complete", "On Hold", "Cancelled", "Closed", "Partial"];

const statusDescriptions: Record<LeadStatus, string> = {
    "Open": "A verified case that is published and open for funding.",
    "Pending": "A new lead has been submitted and is awaiting initial review and verification.",
    "Complete": "The lead has been fully funded, but funds are not yet transferred or the case is not formally closed.",
    "On Hold": "The lead is temporarily paused, pending further information or other external factors.",
    "Cancelled": "The lead has been cancelled and is no longer active.",
    "Closed": "The case is fully funded, all actions are complete, and the beneficiary has received the aid.",
    "Partial": "The lead has received some funding but has not yet met its total goal.",
};


// Create a dynamic schema based on the lead statuses
const formSchema = z.object(
  allLeadStatuses.reduce((acc, status) => {
    acc[status] = z.array(z.string());
    return acc;
  }, {} as Record<LeadStatus, z.ZodType<string[], any>>)
);


type FormValues = z.infer<typeof formSchema>;

interface LeadWorkflowFormProps {
    settings: AppSettings;
    onUpdate: () => void;
}

export function LeadWorkflowForm({ settings, onUpdate }: LeadWorkflowFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: settings.leadConfiguration?.workflow || {},
  });

  const { formState: { isDirty } } = form;

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    
    // The values are already in the correct format: Record<LeadStatus, LeadStatus[]>
    const result = await handleUpdateLeadWorkflow(values);

    setIsSubmitting(false);

    if (result.success) {
      toast({
        variant: "success",
        title: "Workflow Saved",
        description: `Lead status workflow has been updated successfully.`,
        icon: <CheckCircle />,
      });
      form.reset(values); // This resets the 'dirty' state of the form
      onUpdate(); // Refresh settings in parent component
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
        <Accordion type="multiple" className="w-full">
             {allLeadStatuses.map((currentStatus) => (
                <AccordionItem key={currentStatus} value={currentStatus}>
                    <AccordionTrigger>
                        <div className="flex-1 text-left">
                            <div className="flex items-center gap-4">
                                <span className="font-semibold text-base">From:</span>
                                <Badge variant="outline">{currentStatus}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2 pr-4">{statusDescriptions[currentStatus]}</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <FormField
                            control={form.control}
                            name={currentStatus}
                            render={() => (
                                <FormItem className="space-y-3 p-4 border rounded-lg bg-muted/40">
                                <div className="mb-4">
                                    <FormLabel className="text-base font-semibold">Allowed Next Statuses</FormLabel>
                                    <FormDescription>
                                        Select all the statuses that a lead can transition to from "{currentStatus}".
                                    </FormDescription>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {allLeadStatuses.filter(s => s !== currentStatus).map((nextStatus) => (
                                    <FormField
                                        key={nextStatus}
                                        control={form.control}
                                        name={currentStatus}
                                        render={({ field }) => {
                                        return (
                                            <FormItem
                                            key={nextStatus}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                            >
                                            <FormControl>
                                                <Checkbox
                                                checked={field.value?.includes(nextStatus)}
                                                onCheckedChange={(checked) => {
                                                    return checked
                                                    ? field.onChange([...(field.value || []), nextStatus])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                            (value) => value !== nextStatus
                                                        )
                                                        )
                                                }}
                                                />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                                {nextStatus}
                                            </FormLabel>
                                            </FormItem>
                                        )
                                        }}
                                    />
                                    ))}
                                </div>
                                </FormItem>
                            )}
                        />
                    </AccordionContent>
                </AccordionItem>
             ))}
        </Accordion>
        
        {isDirty && (
            <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Workflow
            </Button>
        )}
      </form>
    </Form>
  );
}
