
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
  FormMessage
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { handleUpdateNotificationSettings, testProviderConnection } from "./actions";
import { useState, useEffect } from "react";
import { Loader2, Save, Wifi, MessageSquare, Smartphone } from "lucide-react";
import type { AppSettings } from "@/services/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const otpProviderSchema = z.object({
  "sms.provider": z.enum(['twilio', 'firebase']).default('firebase'),
});

const twilioSmsSchema = z.object({
  "sms.twilio.enabled": z.boolean().default(false),
  "sms.twilio.accountSid": z.string().optional(),
  "sms.twilio.authToken": z.string().optional(),
  "sms.twilio.verifySid": z.string().optional(),
  "sms.twilio.fromNumber": z.string().optional(),
});

const twilioWhatsappSchema = z.object({
  "whatsapp.twilio.enabled": z.boolean().default(false),
  "whatsapp.twilio.fromNumber": z.string().optional(),
});

const nodemailerSchema = z.object({
  "email.nodemailer.enabled": z.boolean().default(false),
  "email.nodemailer.host": z.string().optional(),
  "email.nodemailer.port": z.coerce.number().optional(),
  "email.nodemailer.secure": z.boolean().default(true),
  "email.nodemailer.user": z.string().optional(),
  "email.nodemailer.pass": z.string().optional(),
  "email.nodemailer.from": z.string().optional(),
});


interface SectionFormProps<T extends z.ZodType<any, any>> {
    title: string;
    description?: string;
    schema: T;
    defaultValues: z.infer<T>;
    children: (form: UseFormReturn<z.infer<T>>) => React.ReactNode;
    onSave: (data: z.infer<T>) => Promise<void>;
    onTest?: () => void;
    testStatus?: 'idle' | 'loading' | 'success' | 'error';
}

function SectionForm<T extends z.ZodType<any, any>>({ title, description, schema, defaultValues, children, onSave, onTest, testStatus }: SectionFormProps<T>) {
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
                        {description && <CardDescription>{description}</CardDescription>}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {children(form)}
                    </CardContent>
                    <CardFooter className="gap-2">
                        {isDirty && (
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save {title}
                            </Button>
                        )}
                        {onTest && (
                            <Button type="button" variant="secondary" onClick={onTest} disabled={testStatus === 'loading'}>
                                {testStatus === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wifi className="mr-2 h-4 w-4"/>} Test Connection
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
}

interface NotificationSettingsFormProps {
    settings?: AppSettings['notificationSettings'];
}

export function NotificationSettingsForm({ settings }: NotificationSettingsFormProps) {
  const { toast } = useToast();
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});

  const handleSave = async (values: any) => {
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
    
    if (result.success) {
      toast({
        title: "Settings Saved",
        description: `Notification settings have been updated successfully.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  };
  
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
    <div className="space-y-8">
      <SectionForm
        title="OTP Provider"
        description="Select which service to use for sending One-Time Passwords for phone login."
        schema={otpProviderSchema}
        defaultValues={{ "sms.provider": settings?.sms.provider ?? 'firebase' }}
        onSave={handleSave}
      >
        {(form) => (
            <FormField control={form.control} name="sms.provider" render={({ field }) => (
                <FormItem className="space-y-3"><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-2">
                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-lg border p-4">
                        <FormControl><RadioGroupItem value="firebase" /></FormControl>
                        <FormLabel className="font-normal w-full">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary"/>Firebase Phone Authentication</div>
                                <Badge variant="default">Recommended</Badge>
                            </div>
                            <FormDescription className="pt-2">Uses Firebase's built-in service. Includes a generous free tier (10,000/month). Requires enabling in the Firebase Console.</FormDescription>
                        </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-lg border p-4">
                        <FormControl><RadioGroupItem value="twilio" /></FormControl>
                        <FormLabel className="font-normal w-full">
                            <div className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary"/>Twilio SMS</div>
                            <FormDescription className="pt-2">Uses your Twilio account. Requires separate billing and credentials below.</FormDescription>
                        </FormLabel>
                    </FormItem>
                </RadioGroup></FormControl><FormMessage /></FormItem>
            )}/>
        )}
      </SectionForm>

      <SectionForm
        title="Twilio for SMS & WhatsApp"
        schema={twilioSmsSchema.merge(twilioWhatsappSchema)}
        defaultValues={{
            "sms.twilio.enabled": settings?.sms.twilio?.enabled ?? false,
            "sms.twilio.accountSid": settings?.sms.twilio?.accountSid ?? '',
            "sms.twilio.authToken": settings?.sms.twilio?.authToken ?? '',
            "sms.twilio.verifySid": settings?.sms.twilio?.verifySid ?? '',
            "sms.twilio.fromNumber": settings?.sms.twilio?.fromNumber ?? '',
            "whatsapp.twilio.enabled": settings?.whatsapp?.twilio?.enabled ?? false,
            "whatsapp.twilio.fromNumber": settings?.whatsapp?.twilio?.fromNumber ?? '',
        }}
        onSave={handleSave}
        onTest={() => handleTest('twilio')}
        testStatus={testStatus['twilio']}
      >
        {(form) => (
            <div className="space-y-6">
                <FormField control={form.control} name="sms.twilio.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Enable Twilio for SMS</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                <fieldset disabled={!form.watch('sms.twilio.enabled')} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="sms.twilio.accountSid" render={({field}) => (<FormItem><FormLabel>Account SID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="sms.twilio.authToken" render={({field}) => (<FormItem><FormLabel>Auth Token</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="sms.twilio.verifySid" render={({field}) => (<FormItem><FormLabel>Verify Service SID</FormLabel><FormControl><Input {...field} placeholder="VA..." /></FormControl><FormDescription>Where to find this? In your Twilio Console, navigate to **Verify -&gt; Services** and either create a new service or copy the SID (starts with &quot;VA...&quot;) from an existing one.</FormDescription><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="sms.twilio.fromNumber" render={({field}) => (<FormItem><FormLabel>From Phone Number (for OTP)</FormLabel><FormControl><Input {...field} placeholder="+1..." /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </fieldset>
                <Separator />
                <FormField control={form.control} name="whatsapp.twilio.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Enable Twilio for WhatsApp</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                 <fieldset disabled={!form.watch('whatsapp.twilio.enabled')} className="space-y-6">
                     <FormField control={form.control} name="whatsapp.twilio.fromNumber" render={({field}) => (<FormItem><FormLabel>From WhatsApp Number</FormLabel><FormControl><Input {...field} placeholder="whatsapp:+1..." /></FormControl><FormMessage /></FormItem>)} />
                </fieldset>
            </div>
        )}
      </SectionForm>
      
      <SectionForm
        title="Nodemailer for Email"
        schema={nodemailerSchema}
        defaultValues={{
            "email.nodemailer.enabled": settings?.email?.nodemailer?.enabled ?? false,
            "email.nodemailer.host": settings?.email?.nodemailer?.host ?? '',
            "email.nodemailer.port": settings?.email?.nodemailer?.port ?? 587,
            "email.nodemailer.secure": settings?.email?.nodemailer?.secure ?? true,
            "email.nodemailer.user": settings?.email?.nodemailer?.user ?? '',
            "email.nodemailer.pass": settings?.email?.nodemailer?.pass ?? '',
            "email.nodemailer.from": settings?.email?.nodemailer?.from ?? '',
        }}
        onSave={handleSave}
        onTest={() => handleTest('nodemailer')}
        testStatus={testStatus['nodemailer']}
      >
        {(form) => (
            <div className="space-y-6">
                <FormField control={form.control} name="email.nodemailer.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Enable Nodemailer</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                <fieldset disabled={!form.watch('email.nodemailer.enabled')} className="space-y-6">
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
            </div>
        )}
      </SectionForm>
    </div>
  );
}
