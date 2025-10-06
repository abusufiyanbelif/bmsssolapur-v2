

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, UseFormReturn } from "react-hook-form";
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
import { handleUpdateAppSettings } from "./actions";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { AppSettings } from "@/services/app-settings-service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";


const loginSchema = z.object({
  loginPassword: z.boolean().default(false),
  loginOtp: z.boolean().default(false),
  loginGoogle: z.boolean().default(false),
});

const paymentMethodsSchema = z.object({
  paymentBankTransfer: z.boolean().default(true),
  paymentCash: z.boolean().default(true),
  paymentUpi: z.boolean().default(true),
  paymentOther: z.boolean().default(true),
});

const featuresSchema = z.object({
    featureDirectPayment: z.boolean().default(false),
    onlinePaymentsEnabled: z.boolean().default(false),
});


interface AppSettingsFormProps {
    settings: AppSettings;
}

interface SectionFormProps<T extends z.ZodType<any, any>> {
    title: string;
    description: string;
    schema: T;
    defaultValues: z.infer<T>;
    children: (form: UseFormReturn<z.infer<T>>) => React.ReactNode;
    onSave: (data: z.infer<T>) => Promise<void>;
}

function SectionForm<T extends z.ZodType<any, any>>({ title, description, schema, defaultValues, children, onSave }: SectionFormProps<T>) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const form = useForm<z.infer<T>>({
        resolver: zodResolver(schema),
        defaultValues,
    });
    
    const { formState: { isDirty }, handleSubmit, reset } = form;

    const onSubmit = async (values: z.infer<T>) => {
        setIsSubmitting(true);
        await onSave(values);
        reset(values); // Reset dirty state after successful save
        setIsSubmitting(false);
    };

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)}>
                 <Card>
                    <CardHeader>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {children(form)}
                    </CardContent>
                    {isDirty && (
                        <CardFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save {title}
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </form>
        </Form>
    );
}


export function AppSettingsForm({ settings }: AppSettingsFormProps) {
  const { toast } = useToast();

  const handleSave = async (section: 'login' | 'payment' | 'feature', values: any) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      const formKey = key.replace(/([A-Z])/g, (g) => `.${g[0].toLowerCase()}`);
      if (value) formData.append(formKey, "on");
    });

    const result = await handleUpdateAppSettings(formData);
    
    if (result.success) {
      toast({
        title: "Settings Saved",
        description: `Your settings have been updated successfully.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  };

  return (
    <div className="space-y-12">
        <SectionForm
            title="Login Methods"
            description="Enable or disable different ways for users to log into the application."
            schema={loginSchema}
            defaultValues={{
                loginPassword: settings.loginMethods.password.enabled,
                loginOtp: settings.loginMethods.otp.enabled,
                loginGoogle: settings.loginMethods.google.enabled,
            }}
            onSave={(data) => handleSave('login', data)}
        >
          {(form) => (
            <>
              <FormField control={form.control} name="loginPassword" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Password Login</FormLabel><FormDescription>Allow users to log in with a username/email/phone and password.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
              <FormField control={form.control} name="loginOtp" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">OTP (SMS) Login</FormLabel><FormDescription>Allow users to log in using a one-time password sent via SMS.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
              <FormField control={form.control} name="loginGoogle" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Google Sign-In</FormLabel><FormDescription>Allow users to log in using their Google account.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
            </>
          )}
        </SectionForm>
        
        <SectionForm
            title="Manual Payment Methods"
            description="Configure which payment methods are available when admins record a donation manually."
            schema={paymentMethodsSchema}
            defaultValues={{
                paymentBankTransfer: settings.paymentMethods?.bankTransfer.enabled ?? true,
                paymentCash: settings.paymentMethods?.cash.enabled ?? true,
                paymentUpi: settings.paymentMethods?.upi.enabled ?? true,
                paymentOther: settings.paymentMethods?.other.enabled ?? true,
            }}
            onSave={(data) => handleSave('payment', data)}
        >
           {(form) => (
            <>
              <FormField control={form.control} name="paymentUpi" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">UPI / QR Code</FormLabel><FormDescription>Allow recording donations made via UPI.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
              <FormField control={form.control} name="paymentBankTransfer" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Bank Transfer</FormLabel><FormDescription>Allow recording donations made via bank transfer.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
              <FormField control={form.control} name="paymentCash" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Cash</FormLabel><FormDescription>Allow recording cash donations.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
              <FormField control={form.control} name="paymentOther" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Other</FormLabel><FormDescription>Allow recording donations from other methods.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
            </>
           )}
        </SectionForm>

        <SectionForm
            title="Feature Flags"
            description="Enable or disable specific features within the application."
            schema={featuresSchema}
            defaultValues={{
                featureDirectPayment: settings.features.directPaymentToBeneficiary.enabled,
                onlinePaymentsEnabled: settings.features.onlinePaymentsEnabled,
            }}
            onSave={(data) => handleSave('feature', data)}
        >
           {(form) => (
            <>
              <FormField control={form.control} name="onlinePaymentsEnabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Online Payment Gateways</FormLabel><FormDescription>This is a master switch for all online payment gateways (e.g., Razorpay).</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
              <FormField control={form.control} name="featureDirectPayment" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Direct Payment to Beneficiary</FormLabel><FormDescription>If enabled, donors will see an option to pay a beneficiary directly.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)}/>
            </>
           )}
        </SectionForm>
    </div>
  );
}
