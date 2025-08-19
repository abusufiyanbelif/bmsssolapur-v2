

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
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  // Razorpay
  "razorpay.enabled": z.boolean().default(false),
  "razorpay.mode": z.enum(['test', 'live']),
  "razorpay.test.keyId": z.string().optional(),
  "razorpay.test.keySecret": z.string().optional(),
  "razorpay.live.keyId": z.string().optional(),
  "razorpay.live.keySecret": z.string().optional(),
  
  // PhonePe
  "phonepe.enabled": z.boolean().default(false),
  "phonepe.mode": z.enum(['test', 'live']),
  "phonepe.test.merchantId": z.string().optional(),
  "phonepe.test.saltKey": z.string().optional(),
  "phonepe.test.saltIndex": z.coerce.number().optional(),
  "phonepe.live.merchantId": z.string().optional(),
  "phonepe.live.saltKey": z.string().optional(),
  "phonepe.live.saltIndex": z.coerce.number().optional(),
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
      "razorpay.enabled": settings?.razorpay?.enabled ?? false,
      "razorpay.mode": settings?.razorpay?.mode ?? 'test',
      "razorpay.test.keyId": settings?.razorpay?.test?.keyId ?? '',
      "razorpay.test.keySecret": settings?.razorpay?.test?.keySecret ?? '',
      "razorpay.live.keyId": settings?.razorpay?.live?.keyId ?? '',
      "razorpay.live.keySecret": settings?.razorpay?.live?.keySecret ?? '',
      "phonepe.enabled": settings?.phonepe?.enabled ?? false,
      "phonepe.mode": settings?.phonepe?.mode ?? 'test',
      "phonepe.test.merchantId": settings?.phonepe?.test?.merchantId ?? '',
      "phonepe.test.saltKey": settings?.phonepe?.test?.saltKey ?? '',
      "phonepe.test.saltIndex": settings?.phonepe?.test?.saltIndex ?? 1,
      "phonepe.live.merchantId": settings?.phonepe?.live?.merchantId ?? '',
      "phonepe.live.saltKey": settings?.phonepe?.live?.saltKey ?? '',
      "phonepe.live.saltIndex": settings?.phonepe?.live?.saltIndex ?? 1,
    },
  });

  const { formState: { isDirty } } = form;

  async function onSubmit(values: SettingsFormValues) {
    setIsSubmitting(true);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
        if(key.endsWith('enabled') && value) {
            formData.append(key, 'on');
        } else if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    });
    
    const result = await handleUpdateGatewaySettings(formData);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Settings Saved",
        description: `Payment gateway settings have been updated successfully.`,
      });
      form.reset(values);
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
        
        {/* Razorpay Section */}
        <Card className="border-primary/50">
            <CardHeader>
                <CardTitle>Razorpay</CardTitle>
                <CardDescription>Configure credentials for the Razorpay payment gateway.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="razorpay.enabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Enable Razorpay Gateway</FormLabel>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="razorpay.mode"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>Active Mode</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex items-center space-x-4"
                            >
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="test" /></FormControl><FormLabel className="font-normal">Test Mode</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="live" /></FormControl><FormLabel className="font-normal">Live Mode</FormLabel></FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <Separator />
                <h4 className="font-semibold text-muted-foreground">Test Credentials</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="razorpay.test.keyId" render={({field}) => (<FormItem><FormLabel>Test Key ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="razorpay.test.keySecret" render={({field}) => (<FormItem><FormLabel>Test Key Secret</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <Separator />
                <h4 className="font-semibold text-muted-foreground">Live Credentials</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="razorpay.live.keyId" render={({field}) => (<FormItem><FormLabel>Live Key ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="razorpay.live.keySecret" render={({field}) => (<FormItem><FormLabel>Live Key Secret</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem>)} />
                </div>
            </CardContent>
        </Card>

        {/* PhonePe Section */}
        <Card>
            <CardHeader>
                <CardTitle>PhonePe</CardTitle>
                <CardDescription>Configure credentials for the PhonePe payment gateway.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <FormField
                    control={form.control}
                    name="phonepe.enabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5"><FormLabel className="text-base">Enable PhonePe Gateway</FormLabel></div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="phonepe.mode"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>Active Mode</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4">
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="test" /></FormControl><FormLabel className="font-normal">Test Mode</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="live" /></FormControl><FormLabel className="font-normal">Live Mode</FormLabel></FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <Separator />
                <h4 className="font-semibold text-muted-foreground">Test Credentials</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField control={form.control} name="phonepe.test.merchantId" render={({field}) => ( <FormItem><FormLabel>Test Merchant ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                     <FormField control={form.control} name="phonepe.test.saltKey" render={({field}) => ( <FormItem><FormLabel>Test Salt Key</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem> )} />
                     <FormField control={form.control} name="phonepe.test.saltIndex" render={({field}) => ( <FormItem><FormLabel>Test Salt Index</FormLabel><FormControl><Input {...field} type="number" /></FormControl><FormMessage /></FormItem> )} />
                </div>
                 <Separator />
                <h4 className="font-semibold text-muted-foreground">Live Credentials</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="phonepe.live.merchantId" render={({field}) => ( <FormItem><FormLabel>Live Merchant ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="phonepe.live.saltKey" render={({field}) => ( <FormItem><FormLabel>Live Salt Key</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="phonepe.live.saltIndex" render={({field}) => ( <FormItem><FormLabel>Live Salt Index</FormLabel><FormControl><Input {...field} type="number" /></FormControl><FormMessage /></FormItem> )} />
                </div>
            </CardContent>
        </Card>

        {isDirty && (
            <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save All Gateway Settings
            </Button>
        )}
      </form>
    </Form>
  );
}
