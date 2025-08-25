

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
import { Loader2, Save, CheckCircle, Lock, UserCheck, Settings, Workflow, PlusCircle, Trash2, Edit } from "lucide-react";
import { AppSettings, UserRole } from "@/services/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { AddPurposeDialog, DeletePurposeDialog } from "./purpose-dialogs";


const formSchema = z.object({
    purposes: z.array(z.object({
        id: z.string(),
        name: z.string(),
        enabled: z.boolean(),
    })),
    approvalProcessDisabled: z.boolean().default(false),
    roleBasedCreationEnabled: z.boolean().default(false),
    allowBeneficiaryRequests: z.boolean().default(true),
    leadCreatorRoles: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

interface LeadConfigFormProps {
    settings: AppSettings;
    onUpdate: (newConfig: Partial<AppSettings['leadConfiguration']>) => void;
}

export function LeadConfigForm({ settings, onUpdate }: LeadConfigFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const leadConfig = settings.leadConfiguration || {};

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purposes: leadConfig.purposes || [],
      approvalProcessDisabled: leadConfig.approvalProcessDisabled || false,
      roleBasedCreationEnabled: leadConfig.roleBasedCreationEnabled || false,
      allowBeneficiaryRequests: leadConfig.allowBeneficiaryRequests ?? true,
      leadCreatorRoles: leadConfig.leadCreatorRoles || [],
    },
  });

  const { formState: { isDirty }, watch } = form;
  const roleBasedCreationEnabled = watch("roleBasedCreationEnabled");

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
                    name="allowBeneficiaryRequests"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Allow Beneficiaries to Request Help</FormLabel>
                                <FormDescription>If enabled, beneficiaries will see a "Request Help" button. Disable this to temporarily stop new requests.</FormDescription>
                            </div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )}
                />
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
                                <FormDescription>If enabled, only roles selected below can create new leads.</FormDescription>
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
                                {(['Super Admin', 'Admin', 'Finance Admin', 'Referral'] as UserRole[]).map((role) => (
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
             <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Manage Lead Purposes</CardTitle>
                    <CardDescription>
                        Add, edit, or delete the purposes available for new lead creation.
                    </CardDescription>
                </div>
                <AddPurposeDialog />
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                {(form.getValues('purposes') || []).map((purpose, index) => (
                    <div key={purpose.id} className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">{purpose.name}</FormLabel>
                        </div>
                        <div className="flex items-center gap-2">
                            <AddPurposeDialog purposeToEdit={purpose} />
                            <DeletePurposeDialog purposeToDelete={purpose} allPurposes={form.getValues('purposes')} />
                            <FormField
                                control={form.control}
                                name={`purposes.${index}.enabled`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                ))}
                 {form.getValues('purposes')?.length === 0 && (
                     <p className="text-sm text-muted-foreground text-center py-4">No purposes defined. Click "Create Purpose" to add one.</p>
                )}
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
