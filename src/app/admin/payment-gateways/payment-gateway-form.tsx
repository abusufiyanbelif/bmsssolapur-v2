

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
import { handleUpdateGatewaySettings } from "./actions";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { AppSettings } from "@/services/app-settings-service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  gatewayRazorpayEnabled: z.boolean().default(false),
  gatewayRazorpayKeyId: z.string().optional(),
  gatewayRazorpayKeySecret: z.string().optional(),
  
  gatewayPhonePeEnabled: z.boolean().default(false),
  gatewayPhonePeMerchantId: z.string().optional(),
  gatewayPhonePeSaltKey: z.string().optional(),
  gatewayPhonePeSaltIndex: z.coerce.number().optional(),
});

type SettingsFormValues = z.infer<typeof formSchema>;

interface PaymentGatewayFormProps {
    settings?: AppSettings['paymentGateway'];
}

export function PaymentGatewayForm({ settings }: PaymentGatewayFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gatewayRazorpayEnabled: settings?.razorpay.enabled ?? false,
      gatewayRazorpayKeyId: settings?.razorpay.keyId ?? '',
      gatewayRazorpayKeySecret: settings?.razorpay.keySecret ?? '',
      gatewayPhonePeEnabled: settings?.phonepe.enabled ?? false,
      gatewayPhonePeMerchantId: settings?.phonepe.merchantId ?? '',
      gatewayPhonePeSaltKey: settings?.phonepe.saltKey ?? '',
      gatewayPhonePeSaltIndex: settings?.phonepe.saltIndex ?? 1,
    },
  });

  const { formState: { isDirty } } = form;

  async function onSubmit(values: SettingsFormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    
    if(values.gatewayRazorpayEnabled) formData.append("gateway.razorpay.enabled", "on");
    if(values.gatewayRazorpayKeyId) formData.append("gateway.razorpay.keyId", values.gatewayRazorpayKeyId);
    if(values.gatewayRazorpayKeySecret) formData.append("gateway.razorpay.keySecret", values.gatewayRazorpayKeySecret);

    if(values.gatewayPhonePeEnabled) formData.append("gateway.phonepe.enabled", "on");
    if(values.gatewayPhonePeMerchantId) formData.append("gateway.phonepe.merchantId", values.gatewayPhonePeMerchantId);
    if(values.gatewayPhonePeSaltKey) formData.append("gateway.phonepe.saltKey", values.gatewayPhonePeSaltKey);
    if(values.gatewayPhonePeSaltIndex) formData.append("gateway.phonepe.saltIndex", String(values.gatewayPhonePeSaltIndex));

    const result = await handleUpdateGatewaySettings(formData);

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Settings Saved",
        description: `Payment gateway settings have been updated successfully.`,
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
         <div className="space-y-8">
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
