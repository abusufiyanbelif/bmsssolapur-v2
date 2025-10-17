
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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { handleUpdateOrganization } from "./actions";
import { useState } from "react";
import { Loader2, Save, Edit, X } from "lucide-react";
import { Organization } from "@/services/organization-service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  "hero.title": z.string().min(10, "Title is required."),
  "hero.description": z.string().min(10, "Description is required."),
});

type FormValues = z.infer<typeof formSchema>;

interface EditOrganizationFormProps {
    organization: Organization;
    isCreating: boolean;
}

export function EditOrganizationForm({ organization, isCreating: initialIsCreating }: EditOrganizationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrCodePreviewUrl, setQrCodePreviewUrl] = useState(organization.qrCodeUrl || '');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(organization.logoUrl || '');
  const [isEditing, setIsEditing] = useState(initialIsCreating);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: organization.name,
      logoUrl: organization.logoUrl || '',
      logoFile: null,
      address: organization.address,
      city: organization.city,
      registrationNumber: organization.registrationNumber,
      panNumber: organization.panNumber || '',
      contactEmail: organization.contactEmail,
      contactPhone: organization.contactPhone,
      website: organization.website || '',
      bankAccountName: organization.bankAccountName || '',
      bankAccountNumber: organization.bankAccountNumber || '',
      bankIfscCode: organization.bankIfscCode || '',
      upiId: organization.upiId || '',
      qrCodeUrl: organization.qrCodeUrl || '',
      qrCodeFile: null,
      "hero.title": organization.hero?.title || "Empowering Our Community, One Act of Kindness at a Time.",
      "hero.description": organization.hero?.description || "Join BaitulMal Samajik Sanstha (Solapur) to make a lasting impact. Your contribution brings hope, changes lives, and empowers our community."
    },
  });

  const { formState: { isDirty }, reset, watch } = form;
  const qrCodeUrlValue = watch('qrCodeUrl');
  const logoUrlValue = watch('logoUrl');
  
  const handleCancel = () => {
    reset(); // Reset to the original default values
    setQrCodePreviewUrl(organization.qrCodeUrl || '');
    setLogoPreviewUrl(organization.logoUrl || '');
    if (!initialIsCreating) {
        setIsEditing(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
        if (value) {
            formData.append(key, value);
        }
    });
    
    const result = await handleUpdateOrganization(organization.id!, formData, initialIsCreating);

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: initialIsCreating ? "Organization Created" : "Organization Details Saved",
        description: `The organization profile has been updated successfully.`,
      });
      // Reset the form with the new values, which marks it as "not dirty"
      form.reset(values);
      // If we were creating, we are now editing, so we exit editing mode.
      if (initialIsCreating) {
          window.location.reload(); // Easiest way to refetch server props and switch state
      } else {
          setIsEditing(false);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  }

  return (
    <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-primary">Manage Organization Details</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Update your organization's public information, contact details, and payment settings. These details will be visible on the public-facing pages.
                    </CardDescription>
                </div>
                 {!isEditing && !initialIsCreating && (
                    <Button onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                )}
            </div>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
                <fieldset disabled={!isEditing} className="space-y-8">
                    <h3 className="text-lg font-semibold border-b pb-2">Public Profile</h3>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Organization Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="logoFile"
                                render={({ field: { onChange, value, ...rest } }) => (
                                    <FormItem>
                                    <FormLabel>Upload New Logo</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="file" 
                                            accept="image/png, image/jpeg, image/jpg"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                onChange(file);
                                                setLogoPreviewUrl(file ? URL.createObjectURL(file) : (organization.logoUrl || ''));
                                            }}
                                            {...rest}
                                        />
                                    </FormControl>
                                    <FormDescription>Upload a new logo. This will replace the existing one.</FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="registrationNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Registration Number</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="panNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>PAN Number</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="md:col-span-1 space-y-4">
                            <Label>Logo Preview</Label>
                            <div className="relative flex flex-col items-center justify-center gap-4 p-4 border rounded-lg bg-muted/50 h-full">
                                {(logoPreviewUrl || logoUrlValue) ? (
                                    <div className="relative w-48 h-48">
                                        <Image src={logoPreviewUrl || logoUrlValue} alt="Logo Preview" fill className="object-contain rounded-md" data-ai-hint="logo" />
                                    </div>
                                ): (
                                    <p className="text-sm text-muted-foreground text-center p-8">
                                    Upload a logo image to see a preview.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold border-b pb-2">Homepage Settings</h3>
                    <FormField control={form.control} name="hero.title" render={({ field }) => (<FormItem><FormLabel>Hero Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="hero.description" render={({ field }) => (<FormItem><FormLabel>Hero Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />

                    <h3 className="text-lg font-semibold border-b pb-2">Contact & Payment Details</h3>
                    <div className="grid md:grid-cols-2 gap-8">
                        <FormField
                            control={form.control}
                            name="contactEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contactPhone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Phone</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="website"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Website URL</FormLabel>
                                    <FormControl>
                                        <Input type="url" {...field} placeholder="https://example.com" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    
                    <h4 className="text-md font-semibold border-b pb-2">Bank Account</h4>
                    <FormField
                        control={form.control}
                        name="bankAccountName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Account Holder Name</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="e.g., BAITULMAL SAMAJIK SANSTHA" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                        )}
                    />
                    <div className="grid md:grid-cols-2 gap-8">
                        <FormField
                            control={form.control}
                            name="bankAccountNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Account Number</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="bankIfscCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>IFSC Code</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    
                    <h4 className="text-md font-semibold border-b pb-2">UPI / QR Code</h4>
                    <div className="grid md:grid-cols-2 gap-8 items-start">
                        <div className="space-y-8">
                            <FormField
                                control={form.control}
                                name="upiId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>UPI ID</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="yourname@okhdfcbank" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="qrCodeFile"
                                render={({ field: { onChange, value, ...rest } }) => (
                                    <FormItem>
                                    <FormLabel>Upload New QR Code</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="file" 
                                            accept="image/png, image/jpeg, image/jpg"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                onChange(file);
                                                setQrCodePreviewUrl(file ? URL.createObjectURL(file) : (organization.qrCodeUrl || ''));
                                            }}
                                            {...rest}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        This will replace the existing QR code.
                                    </FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <div className="space-y-4">
                            <Label>QR Code Preview</Label>
                            <div className="relative flex flex-col items-center justify-center gap-4 p-4 border rounded-lg bg-muted/50 h-full">
                                {(qrCodePreviewUrl || qrCodeUrlValue) ? (
                                    <div className="relative w-48 h-48">
                                        <Image src={qrCodePreviewUrl || qrCodeUrlValue} alt="UPI QR Code Preview" fill className="object-contain rounded-md" data-ai-hint="qr code" />
                                    </div>
                                ): (
                                    <p className="text-sm text-muted-foreground text-center p-8">
                                    Upload a QR code image to see a preview.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </fieldset>
                 {isEditing && (
                    <div className="flex gap-2 pt-6 border-t">
                        <Button type="submit" disabled={isSubmitting || !isDirty}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {initialIsCreating ? 'Create Profile' : 'Save Changes'}
                        </Button>
                        {!initialIsCreating && (
                            <Button type="button" variant="outline" onClick={handleCancel}>
                                <X className="mr-2 h-4 w-4" /> Cancel
                            </Button>
                        )}
                    </div>
                )}
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
