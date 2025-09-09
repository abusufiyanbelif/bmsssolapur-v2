
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
import { Loader2, Save, CheckCircle, Lock, UserCheck, Settings, Workflow, PlusCircle, Trash2, Edit, BookOpen } from "lucide-react";
import { AppSettings, UserRole } from "@/services/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AddPurposeDialog, DeletePurposeDialog, AddCategoryDialog, DeleteCategoryDialog } from "./purpose-dialogs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";


const formSchema = z.object({
    purposes: z.array(z.object({
        id: z.string(),
        name: z.string(),
        enabled: z.boolean(),
        categories: z.array(z.object({
            id: z.string(),
            name: z.string(),
            enabled: z.boolean(),
        })).optional(),
    })),
    approvalProcessDisabled: z.boolean().default(false),
    roleBasedCreationEnabled: z.boolean().default(false),
    allowBeneficiaryRequests: z.boolean().default(true),
    leadCreatorRoles: z.array(z.string()),
    // New fields for education options
    degreeOptions: z.string().transform(v => v.split(',').map(s => s.trim()).filter(Boolean)),
    schoolYearOptions: z.string().transform(v => v.split(',').map(s => s.trim()).filter(Boolean)),
    collegeYearOptions: z.string().transform(v => v.split(',').map(s => s.trim()).filter(Boolean)),
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
      degreeOptions: leadConfig.degreeOptions?.join(', ') || '',
      schoolYearOptions: leadConfig.schoolYearOptions?.join(', ') || '',
      collegeYearOptions: leadConfig.collegeYearOptions?.join(', ') || '',
    },
  });

  const { formState: { isDirty }, watch, getValues, setValue, handleSubmit } = form;
  const roleBasedCreationEnabled = watch("roleBasedCreationEnabled");

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    onUpdate(values);
    form.reset(values); // This resets the 'dirty' state of the form
    setIsSubmitting(false);
  }

  const handleToggleCategory = (purposeIndex: number, categoryIndex: number, enabled: boolean) => {
    const currentPurposes = getValues('purposes');
    currentPurposes[purposeIndex].categories![categoryIndex].enabled = enabled;
    setValue('purposes', currentPurposes, { shouldDirty: true });
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
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
                                <FormDescription>If enabled, beneficiaries will see a &quot;Request Help&quot; button. Disable this to temporarily stop new requests.</FormDescription>
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
                    <CardTitle>Manage Lead Purposes &amp; Categories</CardTitle>
                    <CardDescription>
                        Add, edit, or delete the purposes and their sub-categories for new leads.
                    </CardDescription>
                </div>
                <AddPurposeDialog />
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                <ScrollArea className="h-96 w-full pr-4">
                    <Accordion type="multiple" className="w-full">
                    {(getValues('purposes') || []).map((purpose, index) => (
                        <AccordionItem key={purpose.id} value={purpose.id}>
                            <div className="flex items-center pr-4">
                                <AccordionTrigger className="flex-grow">
                                    <FormLabel className="text-base">{purpose.name}</FormLabel>
                                </AccordionTrigger>
                                <div className="flex items-center gap-2 pl-4">
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
                                    <AddPurposeDialog purposeToEdit={purpose} />
                                    <DeletePurposeDialog purposeToDelete={purpose} allPurposes={form.getValues('purposes')} />
                                </div>
                            </div>
                            <AccordionContent>
                            <div className="p-4 border bg-muted/50 rounded-lg space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-sm">Sub-Categories for &quot;{purpose.name}&quot;</h4>
                                        <AddCategoryDialog purposeId={purpose.id} />
                                    </div>
                                    {purpose.categories && purpose.categories.length > 0 ? (
                                        <div className="space-y-2">
                                            {purpose.categories.map((category, catIndex) => (
                                                <div key={category.id} className="flex items-center justify-between p-2 border bg-background rounded-md">
                                                    <p className="text-sm">{category.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <AddCategoryDialog purposeId={purpose.id} categoryToEdit={category} />
                                                        <DeleteCategoryDialog purposeId={purpose.id} categoryToDelete={category} allCategories={purpose.categories} />
                                                        <Switch
                                                            checked={category.enabled}
                                                            onCheckedChange={(checked) => handleToggleCategory(index, catIndex, checked)}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-xs text-muted-foreground py-2">No sub-categories defined. Click &quot;Add Category&quot; to create one.</p>
                                    )}
                            </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                    </Accordion>
                </ScrollArea>
                 {getValues('purposes')?.length === 0 && (
                     <p className="text-sm text-muted-foreground text-center py-4">No purposes defined. Click &quot;Create Purpose&quot; to add one.</p>
                )}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                    <BookOpen />
                    Education Field Options
                </CardTitle>
                <CardDescription>
                    Manage the dropdown values for education-specific fields. Enter values separated by commas.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="degreeOptions"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Degree/Class Options</FormLabel>
                            <FormControl>
                                <Input placeholder="SSC, HSC, B.A., B.Com, B.Sc., B.E., MBBS..." {...field} />
                            </FormControl>
                            <FormDescription>These values appear in the "Degree/Class" dropdown for education leads.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="schoolYearOptions"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>School Year/Class Options</FormLabel>
                            <FormControl>
                                <Input placeholder="I, II, III, IV, V, VI, VII, VIII, IX, X" {...field} />
                            </FormControl>
                             <FormDescription>Options for the "Year" dropdown when "School Fees" category is selected.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="collegeYearOptions"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>College Year Options</FormLabel>
                            <FormControl>
                                <Input placeholder="First Year, Second Year, Third Year, Final Year" {...field} />
                            </FormControl>
                             <FormDescription>Options for the "Year" dropdown when "College Fees" category is selected.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
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
