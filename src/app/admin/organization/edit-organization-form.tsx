
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

const formSchema = z.object({
  name: z.string().min(1, "Organization name is required."),
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
  qrCodeUrl: z.string().optional(),
  qrCodeFile: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditOrganizationFormProps {
    organization: Organization;
}

export function EditOrganizationForm({ organization }: EditOrganizationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(organization.qrCodeUrl || '');
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: organization.name,
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
    },
  });

  const { formState: { isDirty }, reset } = form;
  
  const handleCancel = () => {
    reset({
      name: organization.name,
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
    });
    setPreviewUrl(organization.qrCodeUrl || '');
    setIsEditing(false);
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
        if (value) {
            formData.append(key, value);
        }
    });
    
    const result = await handleUpdateOrganization(organization.id!, formData);

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Organization Details Saved",
        description: `The organization profile has been updated successfully.`,
      });
      // Reset the form with the new values, which marks it as "not dirty"
      form.reset(values);
      setIsEditing(false);
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
                    <CardTitle>Manage Organization Details</CardTitle>
                    <CardDescription>
                        Update your organization's public information, contact details, and payment settings. These details will be visible on the public-facing pages.
                    </CardDescription>
                </div>
                 {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                )}
            </div>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Organization Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} disabled={!isEditing} />
                                    </FormControl>
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
                                        <Input {...field} disabled={!isEditing} />
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
                                        <Input {...field} disabled={!isEditing} />
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
                                        <Input {...field} disabled={!isEditing} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="md:col-span-1 space-y-4">
                        <Label>QR Code Preview</Label>
                        <div className="relative flex flex-col items-center justify-center gap-4 p-4 border rounded-lg bg-muted/50 h-full">
                            {previewUrl ? (
                                <div className="relative w-48 h-48">
                                    <Image src={previewUrl} alt="UPI QR Code Preview" fill className="object-contain rounded-md" data-ai-hint="qr code" />
                                </div>
                            ): (
                                <p className="text-sm text-muted-foreground text-center p-8">
                                Upload a QR code image below to see a preview.
                                </p>
                            )}
                             {isEditing && previewUrl && (
                                <Button type="button" size="sm" variant="destructive" onClick={() => {
                                    form.setValue('qrCodeFile', null, { shouldDirty: true });
                                    form.setValue('qrCodeUrl', '', { shouldDirty: true });
                                    setPreviewUrl('');
                                }}>
                                    Remove QR Code
                                </Button>
                             )}
                        </div>
                    </div>
                </div>

                <h3 className="text-lg font-semibold border-b pb-2">Contact & Payment Details</h3>

                <div className="grid md:grid-cols-2 gap-8">
                    <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contact Email</FormLabel>
                                <FormControl>
                                    <Input type="email" {...field} disabled={!isEditing} />
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
                                    <Input {...field} disabled={!isEditing} />
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
                                    <Input type="url" {...field} placeholder="https://example.com" disabled={!isEditing} />
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
                                <Input {...field} placeholder="e.g., BAITULMAL SAMAJIK SANSTHA" disabled={!isEditing} />
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
                                    <Input {...field} disabled={!isEditing} />
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
                                    <Input {...field} disabled={!isEditing} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                <h4 className="text-md font-semibold border-b pb-2">UPI / QR Code</h4>
                <div className="grid md:grid-cols-2 gap-8">
                     <FormField
                        control={form.control}
                        name="upiId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>UPI ID</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="yourname@okhdfcbank" disabled={!isEditing} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                    control={form.control}
                    name="qrCodeFile"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Upload New QR Code</FormLabel>
                        <FormControl>
                            <Input 
                            type="file" 
                            accept="image/png, image/jpeg, image/jpg"
                            disabled={!isEditing}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                field.onChange(file);
                                if (file) {
                                    setPreviewUrl(URL.createObjectURL(file));
                                } else {
                                    setPreviewUrl(organization.qrCodeUrl || '');
                                }
                            }}
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

                {isEditing && (
                    <div className="flex gap-4">
                        <Button type="submit" disabled={isSubmitting || !isDirty} size="lg">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCancel} size="lg" disabled={isSubmitting}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                    </div>
                )}
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
