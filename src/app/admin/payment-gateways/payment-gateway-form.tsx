

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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


const formSchema = z.object({
  onlinePaymentsEnabled: z.boolean().default(true),
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

  // Paytm
  "paytm.enabled": z.boolean().default(false),
  "paytm.mode": z.enum(['test', 'live']),
  "paytm.test.merchantId": z.string().optional(),
  "paytm.test.merchantKey": z.string().optional(),
  "paytm.live.merchantId": z.string().optional(),
  "paytm.live.merchantKey": z.string().optional(),

  // Cashfree
  "cashfree.enabled": z.boolean().default(false),
  "cashfree.mode": z.enum(['test', 'live']),
  "cashfree.test.appId": z.string().optional(),
  "cashfree.test.secretKey": z.string().optional(),
  "cashfree.live.appId": z.string().optional(),
  "cashfree.live.secretKey": z.string().optional(),
  
  // Instamojo
  "instamojo.enabled": z.boolean().default(false),
  "instamojo.mode": z.enum(['test', 'live']),
  "instamojo.test.apiKey": z.string().optional(),
  "instamojo.test.authToken": z.string().optional(),
  "instamojo.live.apiKey": z.string().optional(),
  "instamojo.live.authToken": z.string().optional(),

  // Stripe
  "stripe.enabled": z.boolean().default(false),
  "stripe.mode": z.enum(['test', 'live']),
  "stripe.test.publishableKey": z.string().optional(),
  "stripe.test.secretKey": z.string().optional(),
  "stripe.live.publishableKey": z.string().optional(),
  "stripe.live.secretKey": z.string().optional(),
});

type SettingsFormValues = z.infer<typeof formSchema>;

interface PaymentGatewayFormProps {
    settings?: AppSettings['paymentGateway'];
    features?: AppSettings['features'];
}

export function PaymentGatewayForm({ settings, features }: PaymentGatewayFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      onlinePaymentsEnabled: features?.onlinePaymentsEnabled ?? true,
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
      "paytm.enabled": settings?.paytm?.enabled ?? false,
      "paytm.mode": settings?.paytm?.mode ?? 'test',
      "paytm.test.merchantId": settings?.paytm?.test?.merchantId ?? '',
      "paytm.test.merchantKey": settings?.paytm?.test?.merchantKey ?? '',
      "paytm.live.merchantId": settings?.paytm?.live?.merchantId ?? '',
      "paytm.live.merchantKey": settings?.paytm?.live?.merchantKey ?? '',
      "cashfree.enabled": settings?.cashfree?.enabled ?? false,
      "cashfree.mode": settings?.cashfree?.mode ?? 'test',
      "cashfree.test.appId": settings?.cashfree?.test?.appId ?? '',
      "cashfree.test.secretKey": settings?.cashfree?.test?.secretKey ?? '',
      "cashfree.live.appId": settings?.cashfree?.live?.appId ?? '',
      "cashfree.live.secretKey": settings?.cashfree?.live?.secretKey ?? '',
      "instamojo.enabled": settings?.instamojo?.enabled ?? false,
      "instamojo.mode": settings?.instamojo?.mode ?? 'test',
      "instamojo.test.apiKey": settings?.instamojo?.test?.apiKey ?? '',
      "instamojo.test.authToken": settings?.instamojo?.test?.authToken ?? '',
      "instamojo.live.apiKey": settings?.instamojo?.live?.apiKey ?? '',
      "instamojo.live.authToken": settings?.instamojo?.live?.authToken ?? '',
      "stripe.enabled": settings?.stripe?.enabled ?? false,
      "stripe.mode": settings?.stripe?.mode ?? 'test',
      "stripe.test.publishableKey": settings?.stripe?.test?.publishableKey ?? '',
      "stripe.test.secretKey": settings?.stripe?.test?.secretKey ?? '',
      "stripe.live.publishableKey": settings?.stripe?.live?.publishableKey ?? '',
      "stripe.live.secretKey": settings?.stripe?.live?.secretKey ?? '',
    },
  });

  const { formState: { isDirty }, watch } = form;
  const onlinePaymentsEnabled = watch("onlinePaymentsEnabled");

  async function onSubmit(values: SettingsFormValues) {
    setIsSubmitting(true);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
        const typedKey = key as keyof SettingsFormValues;
        if(typedKey.endsWith('enabled') && value) {
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
        
        <FormField
            control={form.control}
            name="onlinePaymentsEnabled"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/30">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Online Payment Gateways</FormLabel>
                        <FormDescription>This is the master switch. If disabled, all online payment options will be hidden from users.</FormDescription>
                    </div>
                    <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                </FormItem>
            )}
        />
        
        <fieldset disabled={!onlinePaymentsEnabled} className="space-y-6">
            <Accordion type="multiple" className="w-full space-y-6">
                <AccordionItem value="razorpay">
                     <Card className="border-primary/50">
                        <AccordionTrigger className="p-6">
                            <CardTitle>Razorpay</CardTitle>
                        </AccordionTrigger>
                        <AccordionContent className="p-6 pt-0">
                            <div className="space-y-6">
                                <FormField control={form.control} name="razorpay.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Enable Razorpay</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="razorpay.mode" render={({ field }) => (<FormItem className="space-y-3"><FormLabel>Active Mode</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="test" /></FormControl><FormLabel className="font-normal">Test</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="live" /></FormControl><FormLabel className="font-normal">Live</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
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
                            </div>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
                <AccordionItem value="phonepe">
                     <Card>
                        <AccordionTrigger className="p-6">
                            <CardTitle>PhonePe</CardTitle>
                        </AccordionTrigger>
                         <AccordionContent className="p-6 pt-0">
                            <div className="space-y-6">
                                <FormField control={form.control} name="phonepe.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Enable PhonePe</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="phonepe.mode" render={({ field }) => (<FormItem className="space-y-3"><FormLabel>Active Mode</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="test" /></FormControl><FormLabel className="font-normal">Test</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="live" /></FormControl><FormLabel className="font-normal">Live</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
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
                            </div>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
                 <AccordionItem value="paytm">
                     <Card>
                        <AccordionTrigger className="p-6">
                            <CardTitle>Paytm</CardTitle>
                        </AccordionTrigger>
                         <AccordionContent className="p-6 pt-0">
                            <div className="space-y-6">
                                <FormField control={form.control} name="paytm.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Enable Paytm</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="paytm.mode" render={({ field }) => (<FormItem className="space-y-3"><FormLabel>Active Mode</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="test" /></FormControl><FormLabel className="font-normal">Test</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="live" /></FormControl><FormLabel className="font-normal">Live</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                                <Separator />
                                <h4 className="font-semibold text-muted-foreground">Test Credentials</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="paytm.test.merchantId" render={({field}) => ( <FormItem><FormLabel>Test Merchant ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="paytm.test.merchantKey" render={({field}) => ( <FormItem><FormLabel>Test Merchant Key</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem> )} />
                                </div>
                                <Separator />
                                <h4 className="font-semibold text-muted-foreground">Live Credentials</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="paytm.live.merchantId" render={({field}) => ( <FormItem><FormLabel>Live Merchant ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="paytm.live.merchantKey" render={({field}) => ( <FormItem><FormLabel>Live Merchant Key</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem> )} />
                                </div>
                            </div>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
                <AccordionItem value="cashfree">
                     <Card>
                        <AccordionTrigger className="p-6">
                            <CardTitle>Cashfree</CardTitle>
                        </AccordionTrigger>
                         <AccordionContent className="p-6 pt-0">
                            <div className="space-y-6">
                                <FormField control={form.control} name="cashfree.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Enable Cashfree</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="cashfree.mode" render={({ field }) => (<FormItem className="space-y-3"><FormLabel>Active Mode</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="test" /></FormControl><FormLabel className="font-normal">Test</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="live" /></FormControl><FormLabel className="font-normal">Live</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                                <Separator />
                                <h4 className="font-semibold text-muted-foreground">Test Credentials</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="cashfree.test.appId" render={({field}) => ( <FormItem><FormLabel>Test App ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="cashfree.test.secretKey" render={({field}) => ( <FormItem><FormLabel>Test Secret Key</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem> )} />
                                </div>
                                <Separator />
                                <h4 className="font-semibold text-muted-foreground">Live Credentials</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="cashfree.live.appId" render={({field}) => ( <FormItem><FormLabel>Live App ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="cashfree.live.secretKey" render={({field}) => ( <FormItem><FormLabel>Live Secret Key</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem> )} />
                                </div>
                            </div>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
                <AccordionItem value="instamojo">
                     <Card>
                        <AccordionTrigger className="p-6">
                            <CardTitle>Instamojo</CardTitle>
                        </AccordionTrigger>
                         <AccordionContent className="p-6 pt-0">
                            <div className="space-y-6">
                                <FormField control={form.control} name="instamojo.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Enable Instamojo</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="instamojo.mode" render={({ field }) => (<FormItem className="space-y-3"><FormLabel>Active Mode</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="test" /></FormControl><FormLabel className="font-normal">Test</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="live" /></FormControl><FormLabel className="font-normal">Live</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                                <Separator />
                                <h4 className="font-semibold text-muted-foreground">Test Credentials</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="instamojo.test.apiKey" render={({field}) => ( <FormItem><FormLabel>Test API Key</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="instamojo.test.authToken" render={({field}) => ( <FormItem><FormLabel>Test Auth Token</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem> )} />
                                </div>
                                <Separator />
                                <h4 className="font-semibold text-muted-foreground">Live Credentials</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="instamojo.live.apiKey" render={({field}) => ( <FormItem><FormLabel>Live API Key</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="instamojo.live.authToken" render={({field}) => ( <FormItem><FormLabel>Live Auth Token</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem> )} />
                                </div>
                            </div>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
                 <AccordionItem value="stripe">
                     <Card>
                        <AccordionTrigger className="p-6">
                            <CardTitle>Stripe</CardTitle>
                        </AccordionTrigger>
                         <AccordionContent className="p-6 pt-0">
                            <div className="space-y-6">
                                <FormField control={form.control} name="stripe.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Enable Stripe</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="stripe.mode" render={({ field }) => (<FormItem className="space-y-3"><FormLabel>Active Mode</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="test" /></FormControl><FormLabel className="font-normal">Test</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="live" /></FormControl><FormLabel className="font-normal">Live</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                                <Separator />
                                <h4 className="font-semibold text-muted-foreground">Test Credentials</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="stripe.test.publishableKey" render={({field}) => ( <FormItem><FormLabel>Test Publishable Key</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="stripe.test.secretKey" render={({field}) => ( <FormItem><FormLabel>Test Secret Key</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem> )} />
                                </div>
                                <Separator />
                                <h4 className="font-semibold text-muted-foreground">Live Credentials</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="stripe.live.publishableKey" render={({field}) => ( <FormItem><FormLabel>Live Publishable Key</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="stripe.live.secretKey" render={({field}) => ( <FormItem><FormLabel>Live Secret Key</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem> )} />
                                </div>
                            </div>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
            </Accordion>
        </fieldset>

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
