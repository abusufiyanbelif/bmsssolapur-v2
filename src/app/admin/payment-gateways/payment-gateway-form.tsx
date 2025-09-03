
'use client';

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
import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { AppSettings } from "@/services/app-settings-service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Base schema for a single gateway's settings
const gatewaySchema = z.object({
  enabled: z.boolean().default(false),
  mode: z.enum(['test', 'live']),
  test: z.object({
    keyId: z.string().optional(),
    keySecret: z.string().optional(),
    merchantId: z.string().optional(),
    merchantKey: z.string().optional(),
    saltKey: z.string().optional(),
    saltIndex: z.coerce.number().optional(),
    appId: z.string().optional(),
    secretKey: z.string().optional(),
    apiKey: z.string().optional(),
    authToken: z.string().optional(),
    publishableKey: z.string().optional(),
  }),
  live: z.object({
    keyId: z.string().optional(),
    keySecret: z.string().optional(),
    merchantId: z.string().optional(),
    merchantKey: z.string().optional(),
    saltKey: z.string().optional(),
    saltIndex: z.coerce.number().optional(),
    appId: z.string().optional(),
    secretKey: z.string().optional(),
    apiKey: z.string().optional(),
    authToken: z.string().optional(),
    publishableKey: z.string().optional(),
  }),
});

type GatewayFormValues = z.infer<typeof gatewaySchema>;

interface GatewayFormProps {
    gatewayName: string;
    gatewayTitle: string;
    settings?: AppSettings['paymentGateway'][keyof AppSettings['paymentGateway']];
}

function GatewayForm({ gatewayName, gatewayTitle, settings }: GatewayFormProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<GatewayFormValues>({
        resolver: zodResolver(gatewaySchema),
        defaultValues: {
            enabled: settings?.enabled ?? false,
            mode: settings?.mode ?? 'test',
            test: settings?.test ?? {},
            live: settings?.live ?? {},
        },
    });

    async function onSubmit(values: GatewayFormValues) {
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('gatewayName', gatewayName);
        formData.append(`${gatewayName}.enabled`, values.enabled ? 'on' : '');
        formData.append(`${gatewayName}.mode`, values.mode);
        // Add all test and live keys
        Object.entries(values.test).forEach(([key, value]) => value && formData.append(`${gatewayName}.test.${key}`, String(value)));
        Object.entries(values.live).forEach(([key, value]) => value && formData.append(`${gatewayName}.live.${key}`, String(value)));
        
        const result = await handleUpdateGatewaySettings(formData);
        if (result.success) {
            toast({ title: "Settings Saved", description: `${gatewayTitle} settings have been updated.` });
            form.reset(values);
        } else {
            toast({ variant: "destructive", title: "Error", description: result.error });
        }
        setIsSubmitting(false);
    }
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Enable {gatewayTitle}</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                <fieldset disabled={!form.watch('enabled')} className="space-y-6">
                    <FormField control={form.control} name="mode" render={({ field }) => (<FormItem className="space-y-3"><FormLabel>Active Mode</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="test" /></FormControl><FormLabel className="font-normal">Test</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="live" /></FormControl><FormLabel className="font-normal">Live</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                    <Separator />
                    <h4 className="font-semibold text-muted-foreground">Test Credentials</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="test.keyId" render={({field}) => (<FormItem><FormLabel>Test Key ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="test.keySecret" render={({field}) => (<FormItem><FormLabel>Test Key Secret</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <Separator />
                    <h4 className="font-semibold text-muted-foreground">Live Credentials</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="live.keyId" render={({field}) => (<FormItem><FormLabel>Live Key ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="live.keySecret" render={({field}) => (<FormItem><FormLabel>Live Key Secret</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </fieldset>
                 {form.formState.isDirty && (
                     <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save {gatewayTitle} Settings
                    </Button>
                )}
            </form>
        </Form>
    );
}

interface PaymentGatewayFormProps {
    settings?: AppSettings['paymentGateway'];
    features?: AppSettings['features'];
}

export function PaymentGatewayForm({ settings, features }: PaymentGatewayFormProps) {
  const { toast } = useToast();
  const [isMasterSwitchSubmitting, setIsMasterSwitchSubmitting] = useState(false);
  const [onlinePaymentsEnabled, setOnlinePaymentsEnabled] = useState(features?.onlinePaymentsEnabled ?? true);
  
  const handleMasterSwitchSave = async () => {
    setIsMasterSwitchSubmitting(true);
    const formData = new FormData();
    formData.append('onlinePaymentsEnabled', onlinePaymentsEnabled ? 'on' : '');
    const result = await handleUpdateGatewaySettings(formData);
    if (result.success) {
      toast({ title: "Master Switch Updated", description: `Online payments are now ${onlinePaymentsEnabled ? 'enabled' : 'disabled'}.` });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
    setIsMasterSwitchSubmitting(false);
  };
  
  const gateways: {name: string; title: string; settings: any;}[] = [
    { name: 'razorpay', title: 'Razorpay', settings: settings?.razorpay },
    { name: 'phonepe', title: 'PhonePe', settings: settings?.phonepe },
    { name: 'paytm', title: 'Paytm', settings: settings?.paytm },
    { name: 'cashfree', title: 'Cashfree', settings: settings?.cashfree },
    { name: 'instamojo', title: 'Instamojo', settings: settings?.instamojo },
    { name: 'stripe', title: 'Stripe', settings: settings?.stripe },
  ];

  return (
    <div className="space-y-12">
        <Card className="bg-muted/30">
            <CardHeader>
                <CardTitle>Master Control</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Online Payment Gateways</FormLabel>
                        <FormDescription>This is the master switch. If disabled, all online payment options will be hidden from users.</FormDescription>
                    </div>
                    <Switch checked={onlinePaymentsEnabled} onCheckedChange={setOnlinePaymentsEnabled} />
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleMasterSwitchSave} disabled={isMasterSwitchSubmitting}>
                    {isMasterSwitchSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Master Switch
                </Button>
            </CardFooter>
        </Card>
        
        <fieldset disabled={!onlinePaymentsEnabled} className="space-y-6">
            <Accordion type="single" collapsible className="w-full space-y-6">
                {gateways.map(gateway => (
                    <AccordionItem key={gateway.name} value={gateway.name}>
                        <Card className="border-primary/50">
                            <AccordionTrigger className="p-6 hover:no-underline">
                                <CardTitle>{gateway.title}</CardTitle>
                            </AccordionTrigger>
                            <AccordionContent className="p-6 pt-0">
                                <GatewayForm gatewayName={gateway.name} gatewayTitle={gateway.title} settings={gateway.settings} />
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                ))}
            </Accordion>
        </fieldset>
    </div>
  );
}
