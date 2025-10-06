
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
import { handleUpdateNotificationSettings, testProviderConnection } from "./actions";
import { useState, useEffect } from "react";
import { Loader2, Save, Wifi, MessageSquare, Smartphone, CheckCircle } from "lucide-react";
import type { AppSettings } from "@/services/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  sms: z.object({
    provider: z.enum(['twilio', 'firebase']).default('firebase'),
    twilio: z.object({
        enabled: z.boolean().default(false),
        accountSid: z.string().optional(),
        authToken: z.string().optional(),
        verifySid: z.string().optional(),
        fromNumber: z.string().optional(),
    })
  }),
  whatsapp: z.object({
    provider: z.literal('twilio'),
    twilio: z.object({
        enabled: z.boolean().default(false),
        fromNumber: z.string().optional(),
    })
  }),
  email: z.object({
    provider: z.literal('nodemailer'),
    nodemailer: z.object({
      enabled: z.boolean().default(false),
      host: z.string().optional(),
      port: z.coerce.number().optional(),
      secure: z.boolean().default(true),
      user: z.string().optional(),
      pass: z.string().optional(),
      from: z.string().optional(),
    }),
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface NotificationSettingsFormProps {
    settings?: AppSettings['notificationSettings'];
}

export function NotificationSettingsForm({ settings }: NotificationSettingsFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sms: settings?.sms || { provider: 'firebase', twilio: { enabled: false } },
      whatsapp: settings?.whatsapp || { provider: 'twilio', twilio: { enabled: false } },
      email: settings?.email || { provider: 'nodemailer', nodemailer: { enabled: false } },
    },
  });
  
  const { formState: { isDirty }, handleSubmit, reset, watch } = form;

  const twilioSmsEnabled = watch('sms.twilio.enabled');
  const whatsappEnabled = watch('whatsapp.twilio.enabled');
  const nodemailerEnabled = watch('email.nodemailer.enabled');

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    const result = await handleUpdateNotificationSettings(values);
    if (result.success) {
      toast({
        variant: 'success',
        title: "Settings Saved",
        description: `Notification settings have been updated successfully.`,
        icon: <CheckCircle />,
      });
      reset(values);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
    setIsSubmitting(false);
  }
  
  const handleTest = async (provider: 'twilio' | 'nodemailer' | 'firebase') => {
    setTestStatus(prev => ({ ...prev, [provider]: 'loading' }));
    const result = await testProviderConnection(provider);
    if(result.success) {
      setTestStatus(prev => ({...prev, [provider]: 'success' }));
      toast({ variant: 'success', title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Test Successful`});
    } else {
      setTestStatus(prev => ({...prev, [provider]: 'error' }));
      toast({ variant: 'destructive', title: `Test Failed`, description: result.error});
    }
     setTimeout(() => setTestStatus(prev => ({...prev, [provider]: 'idle' })), 3000);
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Accordion type="multiple" defaultValue={["otp", "twilio", "email"]} className="w-full space-y-6">
            <AccordionItem value="otp" className="border rounded-lg">
                <AccordionTrigger className="p-4 font-semibold text-primary"><h4 className="flex items-center gap-2"><Smartphone className="h-5 w-5"/>OTP Provider</h4></AccordionTrigger>
                <AccordionContent className="p-6 pt-2 space-y-6">
                    <FormField control={form.control} name="sms.provider" render={({ field }) => (
                        <FormItem className="space-y-3"><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2">
                            <FormItem className="flex items-center space-x-3 space-y-0 rounded-lg border p-4"><FormControl><RadioGroupItem value="firebase" /></FormControl><FormLabel className="font-normal w-full">
                                <div className="flex items-center justify-between"><div className="flex items-center gap-2">Firebase Phone Authentication</div><Badge variant="default">Recommended</Badge></div><FormDescription className="pt-2">Uses Firebase's built-in service. Includes a generous free tier (10,000/month). Requires enabling in the Firebase Console.</FormDescription></FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0 rounded-lg border p-4"><FormControl><RadioGroupItem value="twilio" /></FormControl><FormLabel className="font-normal w-full">
                                <div className="flex items-center gap-2">Twilio SMS</div><FormDescription className="pt-2">Uses your Twilio account. Requires separate billing and credentials below.</FormDescription></FormLabel></FormItem>
                        </RadioGroup></FormControl><FormMessage /></FormItem>
                    )}/>
                </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="twilio" className="border rounded-lg">
                <AccordionTrigger className="p-4 font-semibold text-primary"><h4 className="flex items-center gap-2"><MessageSquare className="h-5 w-5"/>Twilio for SMS & WhatsApp</h4></AccordionTrigger>
                <AccordionContent className="p-6 pt-2 space-y-6">
                    <FormField control={form.control} name="sms.twilio.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Enable Twilio for SMS</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                    <fieldset disabled={!twilioSmsEnabled} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="sms.twilio.accountSid" render={({field}) => (<FormItem><FormLabel>Account SID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="sms.twilio.authToken" render={({field}) => (<FormItem><FormLabel>Auth Token</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="sms.twilio.verifySid" render={({field}) => (<FormItem><FormLabel>Verify Service SID</FormLabel><FormControl><Input {...field} placeholder="VA..." /></FormControl><FormDescription>Found under **Verify &gt; Services** in your Twilio Console.</FormDescription><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="sms.twilio.fromNumber" render={({field}) => (<FormItem><FormLabel>From Phone Number (for OTP)</FormLabel><FormControl><Input {...field} placeholder="+1..." /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </fieldset>
                    <Separator />
                    <FormField control={form.control} name="whatsapp.twilio.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Enable Twilio for WhatsApp</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                     <fieldset disabled={!whatsappEnabled} className="space-y-6">
                         <FormField control={form.control} name="whatsapp.twilio.fromNumber" render={({field}) => (<FormItem><FormLabel>From WhatsApp Number</FormLabel><FormControl><Input {...field} placeholder="whatsapp:+1..." /></FormControl><FormMessage /></FormItem>)} />
                    </fieldset>
                </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="email" className="border rounded-lg">
                 <AccordionTrigger className="p-4 font-semibold text-primary"><h4 className="flex items-center gap-2">Nodemailer for Email</h4></AccordionTrigger>
                 <AccordionContent className="p-6 pt-2 space-y-6">
                     <FormField control={form.control} name="email.nodemailer.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Enable Nodemailer</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                    <fieldset disabled={!nodemailerEnabled} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="email.nodemailer.host" render={({field}) => ( <FormItem><FormLabel>SMTP Host</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="email.nodemailer.port" render={({field}) => ( <FormItem><FormLabel>SMTP Port</FormLabel><FormControl><Input {...field} type="number" /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                        <FormField control={form.control} name="email.nodemailer.secure" render={({field}) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Use SSL/TLS (Secure)</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="email.nodemailer.user" render={({field}) => ( <FormItem><FormLabel>SMTP User</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="email.nodemailer.pass" render={({field}) => ( <FormItem><FormLabel>SMTP Password</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                        <FormField control={form.control} name="email.nodemailer.from" render={({field}) => ( <FormItem><FormLabel>From Email Address</FormLabel><FormControl><Input {...field} placeholder='"Your Org Name" <email@your-domain.com>' /></FormControl><FormMessage /></FormItem> )} />
                    </fieldset>
                    <div className="pt-4 border-t">
                        <Button type="button" variant="secondary" onClick={() => handleTest('nodemailer')} disabled={testStatus['nodemailer'] === 'loading'}>
                            {testStatus['nodemailer'] === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wifi className="mr-2 h-4 w-4"/>} Test Nodemailer Connection
                        </Button>
                    </div>
                 </AccordionContent>
            </AccordionItem>
        </Accordion>
        
        {isDirty && (
            <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save All Changes
                </Button>
            </div>
        )}
      </form>
    </Form>
  );
}
