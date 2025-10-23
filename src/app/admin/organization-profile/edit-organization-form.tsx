// src/app/admin/organization/edit-organization-form.tsx

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
import { handleUpdateOrganization } from "./actions";
import { useState, useEffect } from "react";
import { Loader2, Save, Edit, X, PlusCircle, Trash2, Layout, Award } from "lucide-react";
import { Organization } from "@/services/organization-service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";


const socialPlatformSchema = z.enum(["Facebook", "Instagram", "Twitter"]);

const formSchema = z.object({
  name: z.string().min(1, "Organization name is required."),
  logoUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  logoFile: z.any().optional(),
  address: z.string().min(1, "Address is required."),
  city: z.string().min(1, "City is required."),
  registrationNumber: z.string().min(1, "Registration number is required."),
  panNumber: z.string().optional(),
  contactEmail: z.string().email("Please enter a valid email."),
  contactPhone: z.string().min(1, "Phone number is required."),
  website: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
  upiId: z.string().min(1, "UPI ID is required."),
  qrCodeUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  qrCodeFile: z.any().optional(),
  guidingPrinciples: z.array(z.object({ value: z.string().min(1, "Principle cannot be empty.") })),
  "hero.title": z.string().min(10, "Title is required."),
  "hero.description": z.string().min(10, "Description is required."),
   // Footer fields
  "footer.organizationInfo.titleLine1": z.string().min(1, "This field is required."),
  "footer.organizationInfo.titleLine2": z.string().min(1, "This field is required."),
  "footer.organizationInfo.titleLine3": z.string().min(1, "This field is required."),
  "footer.organizationInfo.description": z.string().min(10, "Description is required."),
  "footer.organizationInfo.registrationInfo": z.string().min(1, "Registration info is required."),
  "footer.organizationInfo.taxInfo": z.string().min(1, "Tax info is required."),
  "footer.contactUs.title": z.string().min(1, "This field is required."),
  "footer.contactUs.address": z.string().min(1, "Address is required."),
  "footer.contactUs.email": z.string().email(),
  "footer.keyContacts.title": z.string().min(1, "This field is required."),
  keyContacts: z.array(z.object({
      name: z.string().min(1, "Name is required."),
      phone: z.string().min(10, "Phone number must be at least 10 digits."),
  })),
  "footer.connectWithUs.title": z.string().min(1, "This field is required."),
  socialLinks: z.array(z.object({
      platform: socialPlatformSchema,
      url: z.string().url("Must be a valid URL."),
  })),
  "footer.ourCommitment.title": z.string().min(1, "This field is required."),
  "footer.ourCommitment.commitmentDescription": z.string().min(1, "This field is required."),
  "footer.ourCommitment.text": z.string().min(1, "This field is required."),
  "footer.ourCommitment.linkText": z.string().min(1, "This field is required."),
  "footer.ourCommitment.linkUrl": z.string().min(1, "This field is required."),
  "footer.copyright.text": z.string().min(1, "This field is required."),
});

type FormValues = z.infer<typeof formSchema>;

interface EditOrganizationFormProps {
    organization: Organization;
    isCreating: boolean;
}

export function EditOrganizationForm({ organization, isCreating }: EditOrganizationFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrCodePreviewUrl, setQrCodePreviewUrl] = useState(organization.qrCodeUrl || '');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(organization.logoUrl || '');
  const [isEditing, setIsEditing] = useState(isCreating);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  useEffect(() => {
    setAdminUserId(localStorage.getItem('userId'));
  }, []);
  
  const defaultFooter = organization.footer || {
      organizationInfo: { titleLine1: '', titleLine2: '', titleLine3: '', description: '', registrationInfo: '', taxInfo: '' },
      contactUs: { title: '', address: '', email: '' },
      keyContacts: { title: '', contacts: [] },
      connectWithUs: { title: '', socialLinks: [] },
      ourCommitment: { title: '', commitmentDescription: '', text: '', linkText: '', linkUrl: '' },
      copyright: { text: '' }
  };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: organization.name || '',
      logoUrl: organization.logoUrl || '',
      logoFile: null,
      address: organization.address || '',
      city: organization.city || '',
      registrationNumber: organization.registrationNumber || '',
      panNumber: organization.panNumber || '',
      contactEmail: organization.contactEmail || '',
      contactPhone: organization.contactPhone || '',
      website: organization.website || '',
      bankAccountName: organization.bankAccountName || '',
      bankAccountNumber: organization.bankAccountNumber || '',
      bankIfscCode: organization.bankIfscCode || '',
      upiId: organization.upiId || '',
      qrCodeUrl: organization.qrCodeUrl || '',
      qrCodeFile: null,
      guidingPrinciples: (organization.guidingPrinciples || []).map(p => ({ value: p })),
      "hero.title": organization.hero?.title || "Empowering Our Community, One Act of Kindness at a Time.",
      "hero.description": organization.hero?.description || "Join BaitulMal Samajik Sanstha (Solapur) to make a lasting impact. Your contribution brings hope, changes lives, and empowers our community.",
      "footer.organizationInfo.titleLine1": defaultFooter.organizationInfo.titleLine1 || '',
      "footer.organizationInfo.titleLine2": defaultFooter.organizationInfo.titleLine2 || '',
      "footer.organizationInfo.titleLine3": defaultFooter.organizationInfo.titleLine3 || '',
      "footer.organizationInfo.description": defaultFooter.organizationInfo.description || '',
      "footer.organizationInfo.registrationInfo": defaultFooter.organizationInfo.registrationInfo || '',
      "footer.organizationInfo.taxInfo": defaultFooter.organizationInfo.taxInfo || '',
      "footer.contactUs.title": defaultFooter.contactUs.title || '',
      "footer.contactUs.address": defaultFooter.contactUs.address || '',
      "footer.contactUs.email": defaultFooter.contactUs.email || '',
      "footer.keyContacts.title": defaultFooter.keyContacts.title || '',
      keyContacts: defaultFooter.keyContacts.contacts || [],
      "footer.connectWithUs.title": defaultFooter.connectWithUs.title || '',
      socialLinks: defaultFooter.connectWithUs.socialLinks || [],
      "footer.ourCommitment.title": defaultFooter.ourCommitment.title || '',
      "footer.ourCommitment.commitmentDescription": defaultFooter.ourCommitment.commitmentDescription || '',
      "footer.ourCommitment.text": defaultFooter.ourCommitment.text || '',
      "footer.ourCommitment.linkText": defaultFooter.ourCommitment.linkText || '',
      "footer.ourCommitment.linkUrl": defaultFooter.ourCommitment.linkUrl || '',
      "footer.copyright.text": defaultFooter.copyright.text || '',
    },
  });

  const { formState: { isDirty }, reset, control, handleSubmit } = form;
  const { fields: keyContactFields, append: appendKeyContact, remove: removeKeyContact } = useFieldArray({ control, name: "keyContacts" });
  const { fields: socialLinkFields, append: appendSocialLink, remove: removeSocialLink } = useFieldArray({ control, name: "socialLinks" });
  const { fields: guidingPrincipleFields, append: appendGuidingPrinciple, remove: removeGuidingPrinciple } = useFieldArray({ control, name: "guidingPrinciples" });
  
  const handleCancel = () => {
    reset(); // Reset to the original default values
    setQrCodePreviewUrl(organization.qrCodeUrl || '');
    setLogoPreviewUrl(organization.logoUrl || '');
    if(!isCreating) {
        setIsEditing(false);
    }
  }

  async function onSubmit(values: FormValues) {
    if (!adminUserId) {
        toast({ variant: "destructive", title: "Error", description: "Could not identify administrator." });
        return;
    }
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("adminUserId", adminUserId);
    
    // This helper now correctly handles nested and array data for FormData
    const appendObjectToForm = (obj: any, prefix = '') => {
        Object.entries(obj).forEach(([key, value]) => {
            const newPrefix = prefix ? `${prefix}.${key}` : key;
            if (value instanceof File) {
                 formData.append(key, value); // Use original key for files
            } else if (key === 'keyContacts' || key === 'socialLinks' || key === 'guidingPrinciples') {
                formData.append(key, JSON.stringify(value));
            }
            else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                appendObjectToForm(value, newPrefix);
            }
            else if (value !== null && value !== undefined) {
                formData.append(newPrefix, String(value));
            }
        });
    };
    
    appendObjectToForm(values);

    const result = await handleUpdateOrganization(organization.id!, formData, isCreating);

    if (result.success) {
      toast({
        title: isCreating ? "Organization Created" : "Organization Details Saved",
        description: `The organization profile has been updated successfully.`,
      });
      // If we were creating, refresh the page to get the new server props
      if (isCreating) {
          router.refresh();
      }
      setIsEditing(false);
      reset(values); // Reset dirty state
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
    setIsSubmitting(false);
  }

  return (
    <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-primary">{isCreating ? "Create Organization Profile" : "Manage Organization Profile & Layout"}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        {isCreating ? "Fill out your organization's public information to get started." : "Update your organization's public information, contact details, and layout settings."}
                    </CardDescription>
                </div>
                 {!isEditing ? (
                    <Button type="button" onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handleCancel}>
                            <X className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                        <Button type="submit" onClick={handleSubmit(onSubmit)} disabled={isSubmitting || !isDirty}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isCreating ? 'Create Profile' : 'Save Changes'}
                        </Button>
                    </div>
                )}
            </div>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form className="space-y-8">
                <fieldset disabled={!isEditing} className="space-y-8">
                    <Accordion type="multiple" defaultValue={["profile", "homepage", "footer", "principles"]} className="w-full space-y-4">
                        {/* Profile Section */}
                        <AccordionItem value="profile" className="border rounded-lg">
                            <AccordionTrigger className="p-4 font-semibold text-primary"><h4 className="flex items-center gap-2">Public Profile</h4></AccordionTrigger>
                            <AccordionContent className="p-6 pt-2 space-y-6">
                                <div className="grid md:grid-cols-3 gap-8">
                                    <div className="md:col-span-2 space-y-8">
                                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Organization Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={form.control} name="logoFile" render={({ field: { onChange, value, ...rest } }) => (<FormItem><FormLabel>Upload New Logo</FormLabel><FormControl><Input type="file" accept="image/png, image/jpeg, image/jpg" onChange={(e) => { const file = e.target.files?.[0]; onChange(file); setLogoPreviewUrl(file ? URL.createObjectURL(file) : (organization.logoUrl || '')); }} {...rest} /></FormControl><FormDescription>Upload a new logo. This will replace the existing one.</FormDescription><FormMessage /></FormItem>)}/>
                                        <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={form.control} name="registrationNumber" render={({ field }) => (<FormItem><FormLabel>Registration Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={form.control} name="panNumber" render={({ field }) => (<FormItem><FormLabel>PAN Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    </div>
                                    <div className="md:col-span-1 space-y-4">
                                        <Label>Logo Preview</Label>
                                        <div className="relative flex flex-col items-center justify-center gap-4 p-4 border rounded-lg bg-muted/50 h-full">
                                            {(logoPreviewUrl || form.watch('logoUrl')) && (<div className="relative w-48 h-48"><Image src={logoPreviewUrl || form.watch('logoUrl')} alt="Logo Preview" fill className="object-contain rounded-md" data-ai-hint="logo" /></div>)}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-8 pt-4 border-t">
                                    <FormField control={form.control} name="contactEmail" render={({ field }) => (<FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    <FormField control={form.control} name="contactPhone" render={({ field }) => (<FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    <FormField control={form.control} name="website" render={({ field }) => (<FormItem><FormLabel>Website URL</FormLabel><FormControl><Input type="url" {...field} placeholder="https://example.com" /></FormControl><FormMessage /></FormItem>)}/>
                                </div>
                                <h4 className="text-md font-semibold border-b pb-2 pt-4">Bank & UPI Details</h4>
                                <FormField control={form.control} name="bankAccountName" render={({ field }) => (<FormItem><FormLabel>Account Holder Name</FormLabel><FormControl><Input {...field} placeholder="e.g., BAITULMAL SAMAJIK SANSTHA" /></FormControl><FormMessage /></FormItem>)}/>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <FormField control={form.control} name="bankAccountNumber" render={({ field }) => (<FormItem><FormLabel>Bank Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    <FormField control={form.control} name="bankIfscCode" render={({ field }) => (<FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                </div>
                                 <div className="grid md:grid-cols-2 gap-8 items-start">
                                    <div className="space-y-8">
                                        <FormField control={form.control} name="upiId" render={({ field }) => (<FormItem><FormLabel>UPI ID</FormLabel><FormControl><Input {...field} placeholder="yourname@okhdfcbank" /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={form.control} name="qrCodeFile" render={({ field: { onChange, value, ...rest } }) => (<FormItem><FormLabel>Upload New QR Code</FormLabel><FormControl><Input type="file" accept="image/png, image/jpeg, image/jpg" onChange={(e) => { const file = e.target.files?.[0]; onChange(file); setQrCodePreviewUrl(file ? URL.createObjectURL(file) : (organization.qrCodeUrl || ''));}} {...rest}/></FormControl><FormDescription>This will replace the existing QR code.</FormDescription><FormMessage /></FormItem>)}/>
                                    </div>
                                    <div className="space-y-4">
                                        <Label>QR Code Preview</Label>
                                        <div className="relative flex flex-col items-center justify-center gap-4 p-4 border rounded-lg bg-muted/50 h-full">
                                            {(qrCodePreviewUrl || form.watch('qrCodeUrl')) ? (<div className="relative w-48 h-48"><Image src={qrCodePreviewUrl || form.watch('qrCodeUrl')} alt="UPI QR Code Preview" fill className="object-contain rounded-md" data-ai-hint="qr code" /></div>) : (<p className="text-sm text-muted-foreground text-center p-8">Upload a QR code image to see a preview.</p>)}
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        
                         {/* Homepage Section */}
                        <AccordionItem value="homepage" className="border rounded-lg">
                            <AccordionTrigger className="p-4 font-semibold text-primary"><h4 className="flex items-center gap-2">Homepage Hero Section</h4></AccordionTrigger>
                            <AccordionContent className="p-6 pt-2 space-y-6">
                               <FormField control={form.control} name="hero.title" render={({ field }) => (<FormItem><FormLabel>Hero Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                               <FormField control={form.control} name="hero.description" render={({ field }) => (<FormItem><FormLabel>Hero Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </AccordionContent>
                        </AccordionItem>
                        
                        {/* Guiding Principles Section */}
                        <AccordionItem value="principles" className="border rounded-lg">
                           <AccordionTrigger className="p-4 font-semibold text-primary"><h4 className="flex items-center gap-2"><Award /> Guiding Principles</h4></AccordionTrigger>
                            <AccordionContent className="p-6 pt-2 space-y-4">
                                <FormField control={form.control} name="footer.ourCommitment.commitmentDescription" render={({ field }) => (<FormItem><FormLabel>Commitment Section Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                                 <Separator />
                                 {guidingPrincipleFields.map((field, index) => (
                                    <FormField
                                        key={field.id}
                                        control={form.control}
                                        name={`guidingPrinciples.${index}.value`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Principle #{index + 1}</FormLabel>
                                                <div className="flex items-center gap-2">
                                                    <FormControl><Textarea {...field} /></FormControl>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeGuidingPrinciple(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => appendGuidingPrinciple({ value: '' })}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Principle
                                </Button>
                            </AccordionContent>
                        </AccordionItem>

                         {/* Footer Section */}
                         <AccordionItem value="footer" className="border rounded-lg">
                             <AccordionTrigger className="p-4 font-semibold text-primary"><h4 className="flex items-center gap-2"><Layout className="h-5 w-5"/>Footer Content</h4></AccordionTrigger>
                             <AccordionContent className="p-6 pt-2 space-y-6">
                                <Accordion type="multiple" defaultValue={["org-info-footer", "contact-us-footer"]} className="w-full space-y-4">
                                    <AccordionItem value="org-info-footer" className="border rounded-lg px-4 bg-muted/20">
                                        <AccordionTrigger>Organization Info in Footer</AccordionTrigger>
                                        <AccordionContent className="space-y-4 pt-4">
                                            <FormField control={form.control} name="footer.organizationInfo.titleLine1" render={({ field }) => (<FormItem><FormLabel>Title Line 1</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="footer.organizationInfo.titleLine2" render={({ field }) => (<FormItem><FormLabel>Title Line 2</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="footer.organizationInfo.titleLine3" render={({ field }) => (<FormItem><FormLabel>Title Line 3</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="footer.organizationInfo.description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="footer.organizationInfo.registrationInfo" render={({ field }) => (<FormItem><FormLabel>Registration Info</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="footer.organizationInfo.taxInfo" render={({ field }) => (<FormItem><FormLabel>Tax Info</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="contact-us-footer" className="border rounded-lg px-4 bg-muted/20">
                                        <AccordionTrigger>Contact Us Section</AccordionTrigger>
                                        <AccordionContent className="space-y-4 pt-4">
                                            <FormField control={form.control} name="footer.contactUs.title" render={({ field }) => (<FormItem><FormLabel>Section Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="footer.contactUs.address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="footer.contactUs.email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        </AccordionContent>
                                    </AccordionItem>
                                     <AccordionItem value="key-contacts-footer" className="border rounded-lg px-4 bg-muted/20">
                                        <AccordionTrigger>Key Contacts Section</AccordionTrigger>
                                        <AccordionContent className="space-y-4 pt-4">
                                            <FormField control={form.control} name="footer.keyContacts.title" render={({ field }) => (<FormItem><FormLabel>Section Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            {keyContactFields.map((field, index) => (
                                                <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md bg-background"><FormField control={form.control} name={`keyContacts.${index}.name`} render={({ field }) => (<FormItem className="flex-grow"><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name={`keyContacts.${index}.phone`} render={({ field }) => (<FormItem className="flex-grow"><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /><Button type="button" variant="destructive" size="icon" onClick={() => removeKeyContact(index)}><Trash2 className="h-4 w-4" /></Button></div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" onClick={() => appendKeyContact({ name: '', phone: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Key Contact</Button>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="social-links-footer" className="border rounded-lg px-4 bg-muted/20">
                                         <AccordionTrigger>Connect With Us Section</AccordionTrigger>
                                         <AccordionContent className="space-y-4 pt-4">
                                             <FormField control={form.control} name="footer.connectWithUs.title" render={({ field }) => (<FormItem><FormLabel>Section Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                             {socialLinkFields.map((field, index) => (
                                                 <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md bg-background"><FormField control={form.control} name={`socialLinks.${index}.platform`} render={({ field }) => (<FormItem className="w-1/3"><FormLabel>Platform</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Facebook">Facebook</SelectItem><SelectItem value="Instagram">Instagram</SelectItem><SelectItem value="Twitter">Twitter</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} /><FormField control={form.control} name={`socialLinks.${index}.url`} render={({ field }) => (<FormItem className="flex-grow"><FormLabel>URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} /><Button type="button" variant="destructive" size="icon" onClick={() => removeSocialLink(index)}><Trash2 className="h-4 w-4" /></Button></div>
                                             ))}
                                             <Button type="button" variant="outline" size="sm" onClick={() => appendSocialLink({ platform: 'Facebook', url: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Social Link</Button>
                                         </AccordionContent>
                                     </AccordionItem>
                                     <AccordionItem value="commitment-footer" className="border rounded-lg px-4 bg-muted/20">
                                         <AccordionTrigger>Our Commitment Section</AccordionTrigger>
                                         <AccordionContent className="space-y-4 pt-4">
                                            <FormField control={form.control} name="footer.ourCommitment.title" render={({ field }) => (<FormItem><FormLabel>Section Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="footer.ourCommitment.text" render={({ field }) => (<FormItem><FormLabel>Text</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="footer.ourCommitment.linkText" render={({ field }) => (<FormItem><FormLabel>Link Text</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="footer.ourCommitment.linkUrl" render={({ field }) => (<FormItem><FormLabel>Link URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                         </AccordionContent>
                                     </AccordionItem>
                                     <AccordionItem value="copyright-footer" className="border rounded-lg px-4 bg-muted/20">
                                         <AccordionTrigger>Copyright Notice</AccordionTrigger>
                                         <AccordionContent className="space-y-4 pt-4">
                                             <FormField control={form.control} name="footer.copyright.text" render={({ field }) => (<FormItem><FormLabel>Copyright Text</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                         </AccordionContent>
                                     </AccordionItem>

                                </Accordion>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </fieldset>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
