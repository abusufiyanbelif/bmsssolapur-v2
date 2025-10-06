
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
import { useState } from "react";
import { Loader2, Save, Wifi } from "lucide-react";
import type { AppSettings } from "@/services/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


const formSchema = z.object({
  // Twilio SMS
  "sms.twilio.accountSid": z.string().optional(),
  "sms.twilio.authToken": z.string().optional(),
  "sms.twilio.verifySid": z.string().optional(),
  "sms.twilio.fromNumber": z.string().optional(),

  // Twilio WhatsApp
  "whatsapp.twilio.accountSid": z.string().optional(),
  "whatsapp.twilio.authToken": z.string().optional(),
  "whatsapp.twilio.fromNumber": z.string().optional(),
  
  // Nodemailer
  "email.nodemailer.host": z.string().optional(),
  "email.nodemailer.port": z.coerce.number().optional(),
  "email.nodemailer.secure": z.boolean().default(true),
  "email.nodemailer.user": z.string().optional(),
  "email.nodemailer.pass": z.string().optional(),
  "email.nodemailer.from": z.string().optional(),
});

type SettingsFormValues = z.infer<typeof formSchema>;

interface NotificationSettingsFormProps {
    settings?: AppSettings['notificationSettings'];
}

export function NotificationSettingsForm({ settings }: NotificationSettingsFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      "sms.twilio.accountSid": settings?.sms.twilio?.accountSid ?? '',
      "sms.twilio.authToken": settings?.sms.twilio?.authToken ?? '',
      "sms.twilio.verifySid": settings?.sms.twilio?.verifySid ?? '',
      "sms.twilio.fromNumber": settings?.sms.twilio?.fromNumber ?? '',
      "whatsapp.twilio.accountSid": settings?.whatsapp.twilio?.accountSid ?? '',
      "whatsapp.twilio.authToken": settings?.whatsapp.twilio?.authToken ?? '',
      "whatsapp.twilio.fromNumber": settings?.whatsapp.twilio?.fromNumber ?? '',
      "email.nodemailer.host": settings?.email.nodemailer?.host ?? '',
      "email.nodemailer.port": settings?.email.nodemailer?.port ?? 587,
      "email.nodemailer.secure": settings?.email.nodemailer?.secure ?? true,
      "email.nodemailer.user": settings?.email.nodemailer?.user ?? '',
      "email.nodemailer.pass": settings?.email.nodemailer?.pass ?? '',
      "email.nodemailer.from": settings?.email.nodemailer?.from ?? '',
    },
  });

  const { formState: { isDirty }, handleSubmit } = form;

  async function onSubmit(values: SettingsFormValues) {
    setIsSubmitting(true);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (typeof value === 'boolean') {
                 formData.append(key, value ? 'on' : '');
            } else {
                 formData.append(key, String(value));
            }
        }
    });
    
    const result = await handleUpdateNotificationSettings(formData);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Settings Saved",
        description: `Notification settings have been updated successfully.`,
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
  
  const handleTest = async (provider: 'twilio' | 'nodemailer') => {
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
        
        <Accordion type="multiple" defaultValue={['sms', 'email']} className="w-full space-y-6">
            <AccordionItem value="sms" className="border rounded-lg">
                 <AccordionTrigger className="p-4 font-semibold text-primary"><h4 className="flex items-center gap-2">Twilio for SMS (OTP)</h4></AccordionTrigger>
                 <AccordionContent className="p-6 pt-0">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="sms.twilio.accountSid" render={({field}) => (<FormItem><FormLabel>Account SID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="sms.twilio.authToken" render={({field}) => (<FormItem><FormLabel>Auth Token</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="sms.twilio.verifySid" render={({field}) => (<FormItem><FormLabel>Verify Service SID</FormLabel><FormControl><Input {...field} placeholder="VA..." /></FormControl><FormDescription>Where to find this? In your Twilio Console, navigate to **Verify -&gt; Services** and either create a new service or copy the SID (starts with &quot;VA...&quot;) from an existing one.</FormDescription><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="sms.twilio.fromNumber" render={({field}) => (<FormItem><FormLabel>From Phone Number</FormLabel><FormControl><Input {...field} placeholder="+1..." /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <Button type="button" variant="secondary" onClick={() => handleTest('twilio')} disabled={testStatus['twilio'] === 'loading'}>
                            {testStatus['twilio'] === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wifi className="mr-2 h-4 w-4"/>} Test Twilio Connection
                        </Button>
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="whatsapp" className="border rounded-lg">
                 <AccordionTrigger className="p-4 font-semibold text-primary"><h4 className="flex items-center gap-2">Twilio for WhatsApp</h4></AccordionTrigger>
                 <AccordionContent className="p-6 pt-0">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="whatsapp.twilio.accountSid" render={({field}) => (<FormItem><FormLabel>Account SID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="whatsapp.twilio.authToken" render={({field}) => (<FormItem><FormLabel>Auth Token</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="whatsapp.twilio.fromNumber" render={({field}) => (<FormItem><FormLabel>From WhatsApp Number</FormLabel><FormControl><Input {...field} placeholder="whatsapp:+1..." /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="email" className="border rounded-lg">
                 <AccordionTrigger className="p-4 font-semibold text-primary"><h4 className="flex items-center gap-2">Nodemailer for Email</h4></AccordionTrigger>
                 <AccordionContent className="p-6 pt-0">
                    <div className="space-y-6">
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
                        <Button type="button" variant="secondary" onClick={() => handleTest('nodemailer')} disabled={testStatus['nodemailer'] === 'loading'}>
                            {testStatus['nodemailer'] === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wifi className="mr-2 h-4 w-4"/>} Test Nodemailer Connection
                        </Button>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>

        {isDirty && (
            <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Notification Settings
            </Button>
        )}
      </form>
    </Form>
  );
}
