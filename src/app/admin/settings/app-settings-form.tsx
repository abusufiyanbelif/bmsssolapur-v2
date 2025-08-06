

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
  FormMessage
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { handleUpdateAppSettings } from "./actions";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { AppSettings } from "@/services/app-settings-service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
  
  // Payment Gateway
  gatewayRazorpayEnabled: z.boolean().default(false),
  gatewayRazorpayKeyId: z.string().optional(),
  gatewayRazorpayKeySecret: z.string().optional(),
  
  gatewayPhonePeEnabled: z.boolean().default(false),
  gatewayPhonePeMerchantId: z.string().optional(),
  gatewayPhonePeSaltKey: z.string().optional(),
  gatewayPhonePeSaltIndex: z.coerce.number().optional(),

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
      gatewayRazorpayEnabled: settings.paymentGateway?.razorpay.enabled ?? false,
      gatewayRazorpayKeyId: settings.paymentGateway?.razorpay.keyId ?? '',
      gatewayRazorpayKeySecret: settings.paymentGateway?.razorpay.keySecret ?? '',
      gatewayPhonePeEnabled: settings.paymentGateway?.phonepe.enabled ?? false,
      gatewayPhonePeMerchantId: settings.paymentGateway?.phonepe.merchantId ?? '',
      gatewayPhonePeSaltKey: settings.paymentGateway?.phonepe.saltKey ?? '',
      gatewayPhonePeSaltIndex: settings.paymentGateway?.phonepe.saltIndex ?? 1,
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
    
    if(values.gatewayRazorpayEnabled) formData.append("gateway.razorpay.enabled", "on");
    if(values.gatewayRazorpayKeyId) formData.append("gateway.razorpay.keyId", values.gatewayRazorpayKeyId);
    if(values.gatewayRazorpayKeySecret) formData.append("gateway.razorpay.keySecret", values.gatewayRazorpayKeySecret);

    if(values.gatewayPhonePeEnabled) formData.append("gateway.phonepe.enabled", "on");
    if(values.gatewayPhonePeMerchantId) formData.append("gateway.phonepe.merchantId", values.gatewayPhonePeMerchantId);
    if(values.gatewayPhonePeSaltKey) formData.append("gateway.phonepe.saltKey", values.gatewayPhonePeSaltKey);
    if(values.gatewayPhonePeSaltIndex) formData.append("gateway.phonepe.saltIndex", String(values.gatewayPhonePeSaltIndex));

    
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
                <CardTitle>Manual Payment Methods</CardTitle>
                <CardDescription>Configure which payment methods are available when admins record a donation manually.</CardDescription>
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
                <CardTitle>Payment Gateway Settings</CardTitle>
                <CardDescription>Manage credentials for live payment gateways like Razorpay and PhonePe.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                 <FormField
                    control={form.control}
                    name="gatewayPhonePeEnabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Enable PhonePe Gateway</FormLabel>
                                <FormDescription>Allow users to pay directly via PhonePe.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField control={form.control} name="gatewayPhonePeMerchantId" render={({field}) => (
                        <FormItem><FormLabel>PhonePe Merchant ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                     <FormField control={form.control} name="gatewayPhonePeSaltKey" render={({field}) => (
                        <FormItem><FormLabel>PhonePe Salt Key</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem>
                     )} />
                     <FormField control={form.control} name="gatewayPhonePeSaltIndex" render={({field}) => (
                        <FormItem><FormLabel>PhonePe Salt Index</FormLabel><FormControl><Input {...field} type="number" /></FormControl><FormMessage /></FormItem>
                     )} />
                </div>
                <FormField
                    control={form.control}
                    name="gatewayRazorpayEnabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Enable Razorpay Gateway</FormLabel>
                                <FormDescription>Allow users to pay directly via Razorpay.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField control={form.control} name="gatewayRazorpayKeyId" render={({field}) => (
                        <FormItem><FormLabel>Razorpay Key ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                     <FormField control={form.control} name="gatewayRazorpayKeySecret" render={({field}) => (
                        <FormItem><FormLabel>Razorpay Key Secret</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem>
                     )} />
                </div>
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
