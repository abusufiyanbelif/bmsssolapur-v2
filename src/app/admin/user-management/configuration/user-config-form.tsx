
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
import { Loader2, Save, User, HandHeart, UserSearch, UserPlus, Fingerprint, MapPin, CreditCard } from "lucide-react";
import { UserConfiguration, UserRole } from "@/services/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

const roleRequirementSchema = z.object({
  isAadhaarMandatory: z.boolean().default(false),
  isPanMandatory: z.boolean().default(false),
  isAddressMandatory: z.boolean().default(false),
  isBankAccountMandatory: z.boolean().default(false),
});

const formSchema = z.object({
  Donor: roleRequirementSchema,
  Beneficiary: roleRequirementSchema,
  Referral: roleRequirementSchema,
});

type FormValues = z.infer<typeof formSchema>;

interface UserConfigFormProps {
    settings?: UserConfiguration;
}

const rolesToConfigure: { name: 'Donor' | 'Beneficiary' | 'Referral', icon: React.ElementType, description: string }[] = [
    { name: 'Donor', icon: HandHeart, description: 'Settings for users who donate.' },
    { name: 'Beneficiary', icon: User, description: 'Settings for users who request help.' },
    { name: 'Referral', icon: UserSearch, description: 'Settings for users who refer beneficiaries.' },
];

export function UserConfigForm({ settings }: UserConfigFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Donor: settings?.Donor || { isAadhaarMandatory: false },
      Beneficiary: settings?.Beneficiary || { isAadhaarMandatory: true }, // Default Aadhaar to true for Beneficiaries
      Referral: settings?.Referral || { isAadhaarMandatory: false },
    },
  });

  const { formState: { isDirty }, handleSubmit } = form;

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    Object.entries(values).forEach(([role, config]) => {
      Object.entries(config).forEach(([key, value]) => {
        if (value) formData.append(`${role}.${key}`, "on");
      });
    });

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Accordion type="multiple" defaultValue={["Donor", "Beneficiary", "Referral"]} className="w-full space-y-4">
                {rolesToConfigure.map(role => (
                    <AccordionItem key={role.name} value={role.name}>
                        <AccordionTrigger className="p-4 bg-muted/50 rounded-lg hover:no-underline">
                             <div className="flex items-center gap-3">
                                <role.icon className="h-6 w-6 text-primary" />
                                <div>
                                    <h3 className="font-semibold text-lg">{role.name} Settings</h3>
                                    <p className="text-sm text-muted-foreground text-left">{role.description}</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                             <FormField
                                control={form.control}
                                name={`${role.name}.isAadhaarMandatory`}
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base flex items-center gap-2"><Fingerprint />Make Aadhaar Number Mandatory</FormLabel>
                                            <FormDescription>
                                                If enabled, the Aadhaar number will be a required field for {role.name} users.
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
                            <FormField
                                control={form.control}
                                name={`${role.name}.isPanMandatory`}
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base flex items-center gap-2"><Fingerprint />Make PAN Number Mandatory</FormLabel>
                                            <FormDescription>
                                               If enabled, the PAN card number will be a required field for {role.name} users.
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
                             <FormField
                                control={form.control}
                                name={`${role.name}.isAddressMandatory`}
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base flex items-center gap-2"><MapPin />Make Address Mandatory</FormLabel>
                                            <FormDescription>
                                               If enabled, the full address will be a required field for {role.name} users.
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
                             <FormField
                                control={form.control}
                                name={`${role.name}.isBankAccountMandatory`}
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base flex items-center gap-2"><CreditCard />Make Bank Account Mandatory</FormLabel>
                                            <FormDescription>
                                               If enabled, bank details will be required for {role.name} users.
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
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
            

            {isDirty && (
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save All Settings
                </Button>
            )}
        </form>
    </Form>
  )
}
