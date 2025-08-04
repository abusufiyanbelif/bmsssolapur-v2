
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
import { handleUpdateAppSettings } from "./actions";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { AppSettings } from "@/services/app-settings-service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  // Login Methods
  loginPassword: z.boolean().default(false),
  loginOtp: z.boolean().default(false),
  loginGoogle: z.boolean().default(false),

  // Services
  serviceEmail: z.boolean().default(false),
  serviceSms: z.boolean().default(false),
  serviceWhatsapp: z.boolean().default(false),
  
  // Features
  featureDirectPayment: z.boolean().default(false),

  // Payment Methods
  paymentBankTransfer: z.boolean().default(true),
  paymentCash: z.boolean().default(true),
  paymentUpi: z.boolean().default(true),
  paymentOther: z.boolean().default(true),
});

type SettingsFormValues = z.infer<typeof formSchema>;

interface AppSettingsFormProps {
    settings: AppSettings;
}

export function AppSettingsForm({ settings }: AppSettingsFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loginPassword: settings.loginMethods.password.enabled,
      loginOtp: settings.loginMethods.otp.enabled,
      loginGoogle: settings.loginMethods.google.enabled,
      serviceEmail: settings.services.nodemailer.enabled,
      serviceSms: settings.services.twilio.enabled,
      serviceWhatsapp: settings.services.whatsapp.enabled,
      featureDirectPayment: settings.features.directPaymentToBeneficiary.enabled,
      paymentBankTransfer: settings.paymentMethods?.bankTransfer.enabled ?? true,
      paymentCash: settings.paymentMethods?.cash.enabled ?? true,
      paymentUpi: settings.paymentMethods?.upi.enabled ?? true,
      paymentOther: settings.paymentMethods?.other.enabled ?? true,
    },
  });

  const { formState: { isDirty } } = form;

  async function onSubmit(values: SettingsFormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    if(values.loginPassword) formData.append("login.password", "on");
    if(values.loginOtp) formData.append("login.otp", "on");
    if(values.loginGoogle) formData.append("login.google", "on");
    
    if(values.serviceEmail) formData.append("service.email", "on");
    if(values.serviceSms) formData.append("service.sms", "on");
    if(values.serviceWhatsapp) formData.append("service.whatsapp", "on");

    if(values.featureDirectPayment) formData.append("feature.directPayment", "on");
    
    if(values.paymentBankTransfer) formData.append("payment.bankTransfer", "on");
    if(values.paymentCash) formData.append("payment.cash", "on");
    if(values.paymentUpi) formData.append("payment.upi", "on");
    if(values.paymentOther) formData.append("payment.other", "on");
    
    const result = await handleUpdateAppSettings(formData);

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Settings Saved",
        description: `Application settings have been updated successfully.`,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
        <Card>
            <CardHeader>
                <CardTitle>Login Methods</CardTitle>
                <CardDescription>Enable or disable different ways for users to log into the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="loginPassword"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Password Login</FormLabel>
                                <FormDescription>Allow users to log in with a username/email/phone and password.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="loginOtp"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">OTP (SMS) Login</FormLabel>
                                <FormDescription>Allow users to log in using a one-time password sent via SMS.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="loginGoogle"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Google Sign-In</FormLabel>
                                <FormDescription>Allow users to log in using their Google account.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Notification Services</CardTitle>
                <CardDescription>Toggle external notification services on or off. Disabling a service will prevent any notifications of that type from being sent.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="serviceEmail"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Email Notifications (Nodemailer)</FormLabel>
                                <FormDescription>Enable or disable sending emails for alerts and receipts.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="serviceSms"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">SMS Notifications (Twilio)</FormLabel>
                                <FormDescription>Enable or disable sending SMS for OTPs and other alerts.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="serviceWhatsapp"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">WhatsApp Notifications</FormLabel>
                                <FormDescription>Enable or disable sending notifications via WhatsApp (requires separate setup).</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Configure which payment methods are available when admins record a donation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="paymentUpi"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">UPI / QR Code</FormLabel>
                                <FormDescription>Allow recording donations made via UPI.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="paymentBankTransfer"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Bank Transfer</FormLabel>
                                <FormDescription>Allow recording donations made via bank transfer.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="paymentCash"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Cash</FormLabel>
                                <FormDescription>Allow recording cash donations.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="paymentOther"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Other</FormLabel>
                                <FormDescription>Allow recording donations from other methods.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>Enable or disable specific features within the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="featureDirectPayment"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Direct Payment to Beneficiary</FormLabel>
                                <FormDescription>If enabled, donors will see an option to pay a beneficiary directly.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
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
