

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { handleUpdateNotificationSettings } from "./actions";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { AppSettings } from "@/services/app-settings-service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


const formSchema = z.object({
  // Twilio SMS
  "sms.twilio.enabled": z.boolean().default(false),
  "sms.twilio.accountSid": z.string().optional(),
  "sms.twilio.authToken": z.string().optional(),
  "sms.twilio.verifySid": z.string().optional(),
  "sms.twilio.fromNumber": z.string().optional(),

  // Twilio WhatsApp
  "whatsapp.twilio.enabled": z.boolean().default(false),
  "whatsapp.twilio.accountSid": z.string().optional(),
  "whatsapp.twilio.authToken": z.string().optional(),
  "whatsapp.twilio.fromNumber": z.string().optional(),
  
  // Nodemailer
  "email.nodemailer.enabled": z.boolean().default(false),
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

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      "sms.twilio.enabled": settings?.sms.twilio?.accountSid ? true : false,
      "sms.twilio.accountSid": settings?.sms.twilio?.accountSid ?? '',
      "sms.twilio.authToken": settings?.sms.twilio?.authToken ?? '',
      "sms.twilio.verifySid": settings?.sms.twilio?.verifySid ?? '',
      "sms.twilio.fromNumber": settings?.sms.twilio?.fromNumber ?? '',
      "whatsapp.twilio.enabled": settings?.whatsapp.twilio?.accountSid ? true : false,
      "whatsapp.twilio.accountSid": settings?.whatsapp.twilio?.accountSid ?? '',
      "whatsapp.twilio.authToken": settings?.whatsapp.twilio?.authToken ?? '',
      "whatsapp.twilio.fromNumber": settings?.whatsapp.twilio?.fromNumber ?? '',
      "email.nodemailer.enabled": settings?.email.nodemailer?.host ? true : false,
      "email.nodemailer.host": settings?.email.nodemailer?.host ?? '',
      "email.nodemailer.port": settings?.email.nodemailer?.port ?? 587,
      "email.nodemailer.secure": settings?.email.nodemailer?.secure ?? true,
      "email.nodemailer.user": settings?.email.nodemailer?.user ?? '',
      "email.nodemailer.pass": settings?.email.nodemailer?.pass ?? '',
      "email.nodemailer.from": settings?.email.nodemailer?.from ?? '',
    },
  });

  const { formState: { isDirty } } = form;

  async function onSubmit(values: SettingsFormValues) {
    setIsSubmitting(true);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            formData.append(key, String(value));
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
        
        <Accordion type="multiple" className="w-full space-y-6">
            <AccordionItem value="sms">
                 <Card className="border-primary/50">
                    <AccordionTrigger className="p-6">
                        <CardTitle>Twilio for SMS (OTP)</CardTitle>
                    </AccordionTrigger>
                    <AccordionContent className="p-6 pt-0">
                        <div className="space-y-6">
                            <FormField control={form.control} name="sms.twilio.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Enable Twilio for SMS</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="sms.twilio.accountSid" render={({field}) => (<FormItem><FormLabel>Account SID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="sms.twilio.authToken" render={({field}) => (<FormItem><FormLabel>Auth Token</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="sms.twilio.verifySid" render={({field}) => (<FormItem><FormLabel>Verify Service SID</FormLabel><FormControl><Input {...field} placeholder="VA..." /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="sms.twilio.fromNumber" render={({field}) => (<FormItem><FormLabel>From Phone Number</FormLabel><FormControl><Input {...field} placeholder="+1..." /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                        </div>
                    </AccordionContent>
                </Card>
            </AccordionItem>
            <AccordionItem value="whatsapp">
                 <Card>
                    <AccordionTrigger className="p-6">
                        <CardTitle>Twilio for WhatsApp</CardTitle>
                    </AccordionTrigger>
                    <AccordionContent className="p-6 pt-0">
                        <div className="space-y-6">
                            <FormField control={form.control} name="whatsapp.twilio.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Enable Twilio for WhatsApp</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="whatsapp.twilio.accountSid" render={({field}) => (<FormItem><FormLabel>Account SID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="whatsapp.twilio.authToken" render={({field}) => (<FormItem><FormLabel>Auth Token</FormLabel><FormControl><Input {...field} type="password" /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="whatsapp.twilio.fromNumber" render={({field}) => (<FormItem><FormLabel>From WhatsApp Number</FormLabel><FormControl><Input {...field} placeholder="whatsapp:+1..." /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                        </div>
                    </AccordionContent>
                </Card>
            </AccordionItem>
             <AccordionItem value="email">
                 <Card>
                    <AccordionTrigger className="p-6">
                        <CardTitle>Nodemailer for Email</CardTitle>
                    </AccordionTrigger>
                    <AccordionContent className="p-6 pt-0">
                        <div className="space-y-6">
                            <FormField control={form.control} name="email.nodemailer.enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Enable Nodemailer for Email</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
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
                        </div>
                    </AccordionContent>
                </Card>
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
