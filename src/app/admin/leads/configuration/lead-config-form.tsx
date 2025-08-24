

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
  FormMessage
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Loader2, Save, CheckCircle, Lock, UserCheck, Settings, Workflow } from "lucide-react";
import { AppSettings, UserRole } from "@/services/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
    disabledPurposes: z.array(z.string()),
    approvalProcessDisabled: z.boolean().default(false),
    roleBasedCreationEnabled: z.boolean().default(false),
    leadCreatorRoles: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

interface LeadConfigFormProps {
    allPurposes: string[];
    allRoles: UserRole[];
    currentConfig: AppSettings['leadConfiguration'];
    onUpdate: (newConfig: Partial<AppSettings['leadConfiguration']>) => void;
}

export function LeadConfigForm({ allPurposes, allRoles, currentConfig, onUpdate }: LeadConfigFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      disabledPurposes: currentConfig?.disabledPurposes || [],
      approvalProcessDisabled: currentConfig?.approvalProcessDisabled || false,
      roleBasedCreationEnabled: currentConfig?.roleBasedCreationEnabled || false,
      leadCreatorRoles: currentConfig?.leadCreatorRoles || [],
    },
  });

  const { formState: { isDirty }, watch } = form;
  const roleBasedCreationEnabled = watch("roleBasedCreationEnabled");
  const approvalProcessDisabled = watch("approvalProcessDisabled");

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    onUpdate(values);
    form.reset(values); // This resets the 'dirty' state of the form
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings />
                    General Settings
                </CardTitle>
                <CardDescription>
                    Configure high-level settings for how leads are created and approved.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <FormField
                    control={form.control}
                    name="approvalProcessDisabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Disable Approval Process</FormLabel>
                                <FormDescription>If disabled, all new leads are auto-verified. Only special roles can create leads.</FormDescription>
                            </div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="roleBasedCreationEnabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Enable Role-based Creation</FormLabel>
                                <FormDescription>If enabled, only roles selected below can create leads. Overrides the "Disable Approval" setting.</FormDescription>
                            </div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>

        {roleBasedCreationEnabled && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck />
                        Lead Creator Roles
                    </CardTitle>
                    <CardDescription>
                        Select which roles have permission to create new leads.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <FormField
                        control={form.control}
                        name="leadCreatorRoles"
                        render={() => (
                            <FormItem>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {allRoles.filter(r => r !== 'Guest' && r !== 'Beneficiary').map((role) => (
                                    <FormField
                                    key={role}
                                    control={form.control}
                                    name="leadCreatorRoles"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                            checked={field.value?.includes(role)}
                                            onCheckedChange={(checked) => {
                                                return checked
                                                ? field.onChange([...(field.value || []), role])
                                                : field.onChange(field.value?.filter((value) => value !== role));
                                            }}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal">{role}</FormLabel>
                                        </FormItem>
                                    )}
                                    />
                                ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                </CardContent>
            </Card>
        )}
        
        <Card>
             <CardHeader>
                <CardTitle>Lead Purposes</CardTitle>
                <CardDescription>
                    Enable or disable specific purposes for new lead creation.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                {form.watch('disabledPurposes').map((_, index) => (
                    <FormField
                        key={index}
                        control={form.control}
                        name={`disabledPurposes.${index}`}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">{allPurposes[index]}</FormLabel>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={!field.value} // Visually, "on" means enabled
                                        onCheckedChange={(checked) => {
                                            const currentDisabled = form.getValues('disabledPurposes');
                                            const newDisabled = checked
                                                ? currentDisabled.filter(p => p !== allPurposes[index])
                                                : [...currentDisabled, allPurposes[index]];
                                            form.setValue('disabledPurposes', newDisabled, { shouldDirty: true });
                                        }}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                ))}
            </CardContent>
        </Card>
        
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
