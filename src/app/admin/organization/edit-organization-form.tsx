
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
import { Loader2, Save } from "lucide-react";
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
  upiId: z.string().min(1, "UPI ID is required."),
  qrCodeUrl: z.string().url("Please enter a valid URL for the QR code image.").optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface EditOrganizationFormProps {
    organization: Organization;
}

export function EditOrganizationForm({ organization }: EditOrganizationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      upiId: organization.upiId || '',
      qrCodeUrl: organization.qrCodeUrl || '',
    },
  });

  const qrCodeUrl = form.watch("qrCodeUrl");

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
                                <Input {...field} />
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
                <Label>QR Code Preview</Label>
                <div className="flex flex-col items-center justify-center gap-4 p-4 border rounded-lg bg-muted/50 h-full">
                    {qrCodeUrl ? (
                         <div className="relative w-48 h-48">
                                <Image src={qrCodeUrl} alt="UPI QR Code Preview" fill className="object-contain rounded-md" data-ai-hint="qr code" />
                            </div>
                    ): (
                        <p className="text-sm text-muted-foreground text-center p-8">
                            No QR code URL provided. Paste a URL below to see a preview.
                        </p>
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
        </div>
        
        <FormField
            control={form.control}
            name="qrCodeUrl"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>QR Code Image URL</FormLabel>
                    <FormControl>
                        <Input {...field} placeholder="https://.../qr.png" />
                    </FormControl>
                    <FormDescription>
                        Upload your QR code image to a service like Imgur and paste the direct image link here.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />


        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
