
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { handleUpdateFooterSettings } from "./actions";
import { useState } from "react";
import { Loader2, Save, Edit, X, PlusCircle, Trash2 } from "lucide-react";
import type { Organization } from "@/services/types";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

const socialPlatformSchema = z.enum(["Facebook", "Instagram", "Twitter"]);

const formSchema = z.object({
  // Organization Info
  "orgInfo.titleLine1": z.string().min(1, "This field is required."),
  "orgInfo.titleLine2": z.string().min(1, "This field is required."),
  "orgInfo.titleLine3": z.string().min(1, "This field is required."),
  "orgInfo.description": z.string().min(10, "Description is required."),
  "orgInfo.registrationInfo": z.string().min(1, "Registration info is required."),
  "orgInfo.taxInfo": z.string().min(1, "Tax info is required."),
  // Contact Us
  "contactUs.title": z.string().min(1, "This field is required."),
  "contactUs.address": z.string().min(1, "Address is required."),
  "contactUs.email": z.string().email(),
  // Key Contacts
  "keyContacts.title": z.string().min(1, "This field is required."),
  keyContacts: z.array(z.object({
      name: z.string().min(1, "Name is required."),
      phone: z.string().min(10, "Phone number must be at least 10 digits."),
  })),
  // Connect With Us
  "connectWithUs.title": z.string().min(1, "This field is required."),
  socialLinks: z.array(z.object({
      platform: socialPlatformSchema,
      url: z.string().url("Must be a valid URL."),
  })),
  // Our Commitment
  "ourCommitment.title": z.string().min(1, "This field is required."),
  "ourCommitment.text": z.string().min(1, "This field is required."),
  "ourCommitment.linkText": z.string().min(1, "This field is required."),
  "ourCommitment.linkUrl": z.string().min(1, "This field is required."),
  // Copyright
  "copyright.text": z.string().min(1, "This field is required."),
});

type FormValues = z.infer<typeof formSchema>;

interface LayoutSettingsFormProps {
    organization: Organization;
}

export function LayoutSettingsForm({ organization }: LayoutSettingsFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const defaultFooter = organization.footer || {
      organizationInfo: { titleLine1: '', titleLine2: '', titleLine3: '', description: '', registrationInfo: '', taxInfo: '' },
      contactUs: { title: '', address: '', email: '' },
      keyContacts: { title: '', contacts: [] },
      connectWithUs: { title: '', socialLinks: [] },
      ourCommitment: { title: '', text: '', linkText: '', linkUrl: '' },
      copyright: { text: '' }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      "orgInfo.titleLine1": defaultFooter.organizationInfo.titleLine1,
      "orgInfo.titleLine2": defaultFooter.organizationInfo.titleLine2,
      "orgInfo.titleLine3": defaultFooter.organizationInfo.titleLine3,
      "orgInfo.description": defaultFooter.organizationInfo.description,
      "orgInfo.registrationInfo": defaultFooter.organizationInfo.registrationInfo,
      "orgInfo.taxInfo": defaultFooter.organizationInfo.taxInfo,
      "contactUs.title": defaultFooter.contactUs.title,
      "contactUs.address": defaultFooter.contactUs.address,
      "contactUs.email": defaultFooter.contactUs.email,
      "keyContacts.title": defaultFooter.keyContacts.title,
      keyContacts: defaultFooter.keyContacts.contacts,
      "connectWithUs.title": defaultFooter.connectWithUs.title,
      socialLinks: defaultFooter.connectWithUs.socialLinks,
      "ourCommitment.title": defaultFooter.ourCommitment.title,
      "ourCommitment.text": defaultFooter.ourCommitment.text,
      "ourCommitment.linkText": defaultFooter.ourCommitment.linkText,
      "ourCommitment.linkUrl": defaultFooter.ourCommitment.linkUrl,
      "copyright.text": defaultFooter.copyright.text,
    },
  });

  const { formState: { isDirty }, reset, control } = form;
  const { fields: keyContactFields, append: appendKeyContact, remove: removeKeyContact } = useFieldArray({ control, name: "keyContacts" });
  const { fields: socialLinkFields, append: appendSocialLink, remove: removeSocialLink } = useFieldArray({ control, name: "socialLinks" });

  const handleCancel = () => {
    reset(); // Reset to default values
    setIsEditing(false);
  };
  
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    const formData = new FormData();
    // Flatten the values to FormData
    Object.entries(values).forEach(([key, value]) => {
        if (key === 'keyContacts' || key === 'socialLinks') {
            formData.append(key, JSON.stringify(value));
        } else {
             formData.append(key, String(value));
        }
    });

    const result = await handleUpdateFooterSettings(organization.id!, formData);
    
    if (result.success) {
      toast({ title: "Settings Saved", description: "The footer layout has been updated." });
      setIsEditing(false);
      reset(values); // Reset to new values to make form not dirty
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
             <div className="flex justify-end mb-6">
                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Layout
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCancel}>
                            <X className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !isDirty}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </div>
                )}
            </div>
            
            <fieldset disabled={!isEditing} className="space-y-8">
                <Accordion type="multiple" defaultValue={["org-info", "contact-us", "key-contacts", "connect-with-us", "commitment", "copyright"]} className="w-full">
                    <AccordionItem value="org-info">
                        <AccordionTrigger className="text-lg font-semibold text-primary">Organization Info</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                            <FormField control={form.control} name="orgInfo.titleLine1" render={({ field }) => (<FormItem><FormLabel>Title Line 1</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="orgInfo.titleLine2" render={({ field }) => (<FormItem><FormLabel>Title Line 2</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="orgInfo.titleLine3" render={({ field }) => (<FormItem><FormLabel>Title Line 3</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="orgInfo.description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="orgInfo.registrationInfo" render={({ field }) => (<FormItem><FormLabel>Registration Info</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="orgInfo.taxInfo" render={({ field }) => (<FormItem><FormLabel>Tax Info</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="contact-us">
                         <AccordionTrigger className="text-lg font-semibold text-primary">Contact Us</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                            <FormField control={form.control} name="contactUs.title" render={({ field }) => (<FormItem><FormLabel>Section Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="contactUs.address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="contactUs.email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="key-contacts">
                         <AccordionTrigger className="text-lg font-semibold text-primary">Key Contacts</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                             <FormField control={form.control} name="keyContacts.title" render={({ field }) => (<FormItem><FormLabel>Section Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            {keyContactFields.map((field, index) => (
                                <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md">
                                    <FormField control={form.control} name={`keyContacts.${index}.name`} render={({ field }) => (<FormItem className="flex-grow"><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name={`keyContacts.${index}.phone`} render={({ field }) => (<FormItem className="flex-grow"><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <Button type="button" variant="destructive" size="icon" onClick={() => removeKeyContact(index)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => appendKeyContact({ name: '', phone: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Key Contact</Button>
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="connect-with-us">
                         <AccordionTrigger className="text-lg font-semibold text-primary">Connect With Us</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                            <FormField control={form.control} name="connectWithUs.title" render={({ field }) => (<FormItem><FormLabel>Section Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            {socialLinkFields.map((field, index) => (
                                <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md">
                                     <FormField control={form.control} name={`socialLinks.${index}.platform`} render={({ field }) => (<FormItem className="w-1/3"><FormLabel>Platform</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Facebook">Facebook</SelectItem><SelectItem value="Instagram">Instagram</SelectItem><SelectItem value="Twitter">Twitter</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name={`socialLinks.${index}.url`} render={({ field }) => (<FormItem className="flex-grow"><FormLabel>URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <Button type="button" variant="destructive" size="icon" onClick={() => removeSocialLink(index)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                             <Button type="button" variant="outline" size="sm" onClick={() => appendSocialLink({ platform: 'Facebook', url: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Social Link</Button>
                        </AccordionContent>
                    </AccordionItem>
                    
                     <AccordionItem value="commitment">
                         <AccordionTrigger className="text-lg font-semibold text-primary">Our Commitment</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                            <FormField control={form.control} name="ourCommitment.title" render={({ field }) => (<FormItem><FormLabel>Section Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="ourCommitment.text" render={({ field }) => (<FormItem><FormLabel>Text</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="ourCommitment.linkText" render={({ field }) => (<FormItem><FormLabel>Link Text</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="ourCommitment.linkUrl" render={({ field }) => (<FormItem><FormLabel>Link URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="copyright">
                         <AccordionTrigger className="text-lg font-semibold text-primary">Copyright Notice</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                             <FormField control={form.control} name="copyright.text" render={({ field }) => (<FormItem><FormLabel>Copyright Text</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </AccordionContent>
                    </AccordionItem>

                </Accordion>
            </fieldset>
        </form>
    </Form>
  )
}
