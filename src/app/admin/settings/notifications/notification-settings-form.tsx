
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
import { useState, useMemo } from "react";
import { Loader2, Save, Wifi, MessageSquare, Smartphone, CheckCircle, Edit, X, AlertTriangle } from "lucide-react";
import type { AppSettings } from "@/services/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


// Define Zod schemas for each section
const otpSchema = z.object({ "sms.provider": z.enum(['twilio', 'firebase']) });
const twilioSmsSchema = z.object({
  "sms.twilio.enabled": z.boolean().default(false),
  "sms.twilio.accountSid": z.string().optional(),
  "sms.twilio.authToken": z.string().optional(),
  "sms.twilio.verifySid": z.string().optional(),
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


// A generic component for each settings section
interface SectionFormProps<T extends z.ZodType<any, any>> {
    title: string;
    description?: string;
    schema: T;
    defaultValues: z.infer<T>;
    children: (form: UseFormReturn<z.infer<T>>) => React.ReactNode;
    onSave: (data: z.infer<T>) => Promise<void>;
    testAction?: () => Promise<void>;
    isOtpLoginEnabled?: boolean;
}

function SectionForm<T extends z.ZodType<any, any>>({ title, description, schema, defaultValues, children, onSave, testAction, isOtpLoginEnabled }: SectionFormProps<T>) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    
    const form = useForm<z.infer<T>>({
        resolver: zodResolver(schema),
        defaultValues,
    });
    
    const { formState: { isDirty }, handleSubmit, reset } = form;

    const onSubmit = async (values: z.infer<T>) => {
        setIsSubmitting(true);
        await onSave(values);
        reset(values);
        setIsSubmitting(false);
    };

    const handleTest = async () => {
        if (!testAction) return;
        setIsTesting(true);
        await testAction();
        setIsTesting(false);
    }

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)}>
                 <Card>
                    <CardHeader>
                        <CardTitle>{title}</CardTitle>
                        {description && <CardDescription>{description}</CardDescription>}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Special warning for OTP Provider section */}
                        {title === "OTP Provider" && isOtpLoginEnabled === false && (
                            <Alert variant="warning">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Master Switch Disabled</AlertTitle>
                                <AlertDescription>
                                    The main &quot;OTP (SMS) Login&quot; feature is currently disabled. Your selection here will have no effect until you enable it in <Link href="/admin/settings" className="font-semibold underline">General Settings</Link>.
                                </AlertDescription>
                            </Alert>
                        )}
                        {children(form)}
                    </CardContent>
                    <CardFooter className="gap-2">
                        {isDirty && (
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save {title}
                            </Button>
                        )}
                         {testAction && (
                            <Button type="button" variant="secondary" onClick={handleTest} disabled={isTesting}>
                                {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wifi className="mr-2 h-4 w-4"/>}
                                Test Connection
                            </Button>
                         )}
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
}


interface NotificationSettingsFormProps {
    settings: AppSettings;
}

export function NotificationSettingsForm({ settings }: NotificationSettingsFormProps) {
  const { toast } = useToast();
  const notificationSettings = settings?.notificationSettings || {};
  const isOtpLoginEnabled = settings?.loginMethods?.otp.enabled;

  const handleSave = async (data: any) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        if (value) formData.append(key, "on");
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const result = await handleUpdateNotificationSettings(formData);
    
    if (result.success) {
      toast({
        variant: "success",
        title: "Settings Saved",
        description: `Settings have been updated successfully.`,
        icon: <CheckCircle />,
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
      const result = await testProviderConnection(provider);
      if(result.success) {
        toast({ variant: 'success', title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Test Successful`});
      } else {
        toast({ variant: 'destructive', title: `Test Failed`, description: result.error});
      }
  }

  return (
    <div className="space-y-12">
        <SectionForm
            title="OTP Provider"
            description="Select which service to use for sending One-Time Passwords for phone logins."
            schema={otpSchema}
            defaultValues={{ "sms.provider": notificationSettings.sms?.provider || 'firebase' }}
            onSave={handleSave}
            isOtpLoginEnabled={isOtpLoginEnabled}
        >
          {(form) => (
            <FormField control={form.control} name="sms.provider" render={({ field }) => (
                <FormItem className="space-y-3"><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2">
                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-lg border p-4"><FormControl><RadioGroupItem value="firebase" /></FormControl><FormLabel className="font-normal w-full">
                        <div className="flex items-center justify-between"><div className="flex items-center gap-2">Firebase Phone Authentication</div><Badge variant="default">Recommended</Badge></div><FormDescription className="pt-2">Uses Firebase's built-in service. Includes a generous free tier (10,000/month). Requires enabling in the Firebase Console.</FormDescription></FormLabel></FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-lg border p-4"><FormControl><RadioGroupItem value="twilio" /></FormControl><FormLabel className="font-normal w-full">
                        <div className="flex items-center gap-2">Twilio SMS</div><FormDescription className="pt-2">Uses your Twilio account. Requires separate billing and credentials below.</FormDescription></FormLabel></FormItem>
                </RadioGroup></FormControl><FormMessage /></FormItem>
            )}/>
          )}
        </SectionForm>

        <SectionForm
            title="Twilio for SMS & WhatsApp"
            schema={twilioSmsSchema.merge(twilioWhatsappSchema)}
            defaultValues={{
                "sms.twilio.enabled": notificationSettings.sms?.twilio?.enabled ?? false,
                "sms.twilio.accountSid": notificationSettings.sms?.twilio?.accountSid ?? '',
                "sms.twilio.authToken": notificationSettings.sms?.twilio?.authToken ?? '',
                "sms.twilio.verifySid": notificationSettings.sms?.twilio?.verifySid ?? '',
                "whatsapp.twilio.enabled": notificationSettings.whatsapp?.twilio?.enabled ?? false,
                "whatsapp.twilio.fromNumber": notificationSettings.whatsapp?.twilio?.fromNumber ?? '',
            }}
            onSave={handleSave}
            testAction={() => handleTest('twilio')}
        >
          {(form) => (
             <>
                 <FormField control={form.control} name="sms.twilio.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Enable Twilio for SMS</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                 <fieldset disabled={!form.watch('sms.twilio.enabled')} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="sms.twilio.accountSid" render={({field}) => (<FormItem><FormLabel>Account SID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="sms.twilio.authToken" render={({field}) => (<FormItem><FormLabel>Auth Token</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="sms.twilio.verifySid" render={({field}) => (<FormItem><FormLabel>Verify Service SID</FormLabel><FormControl><Input {...field} placeholder="VA..." /></FormControl><FormDescription>Found under **Verify &gt; Services** in your Twilio Console.</FormDescription><FormMessage /></FormItem>)} />
                    </div>
                </fieldset>
                <Separator />
                <FormField control={form.control} name="whatsapp.twilio.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Enable Twilio for WhatsApp</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                 <fieldset disabled={!form.watch('whatsapp.twilio.enabled')} className="space-y-6">
                     <FormField control={form.control} name="whatsapp.twilio.fromNumber" render={({field}) => (<FormItem><FormLabel>From WhatsApp Number</FormLabel><FormControl><Input {...field} placeholder="whatsapp:+1..." /></FormControl><FormMessage /></FormItem>)} />
                </fieldset>
             </>
          )}
        </SectionForm>
        
        <SectionForm
            title="Nodemailer for Email"
            schema={nodemailerSchema}
            defaultValues={{
                "email.nodemailer.enabled": notificationSettings.email?.nodemailer?.enabled ?? false,
                "email.nodemailer.host": notificationSettings.email?.nodemailer?.host ?? '',
                "email.nodemailer.port": notificationSettings.email?.nodemailer?.port ?? 587,
                "email.nodemailer.secure": notificationSettings.email?.nodemailer?.secure ?? true,
                "email.nodemailer.user": notificationSettings.email?.nodemailer?.user ?? '',
                "email.nodemailer.pass": notificationSettings.email?.nodemailer?.pass ?? '',
                "email.nodemailer.from": notificationSettings.email?.nodemailer?.from ?? '',
            }}
            onSave={handleSave}
            testAction={() => handleTest('nodemailer')}
        >
            {(form) => (
                <>
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
                </>
            )}
        </SectionForm>
    </div>
  );
}
