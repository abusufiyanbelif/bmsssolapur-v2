

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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Save, X, Edit, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { handleUpdateCampaign } from "./actions";
import { useRouter } from "next/navigation";
import { Campaign, CampaignStatus } from "@/services/campaign-service";
import type { DonationType } from "@/services/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";

const campaignStatuses = ['Upcoming', 'Active', 'Completed', 'Cancelled'] as const;
const donationTypes: Exclude<DonationType, 'Split'>[] = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah', 'Any'];

const formSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  goal: z.coerce.number().min(1, "Goal must be a positive number."),
  image: z.any().optional(),
  dates: z.object({
    from: z.date({ required_error: "A start date is required."}),
    to: z.date({ required_error: "An end date is required."}),
  }),
  status: z.enum(campaignStatuses),
  acceptableDonationTypes: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one donation type.",
  }),
});

type CampaignFormValues = z.infer<typeof formSchema>;

interface CampaignFormProps {
    campaign: Campaign;
}

export function CampaignForm({ campaign }: CampaignFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(campaign.imageUrl || null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: campaign.name,
        description: campaign.description,
        goal: campaign.goal,
        image: null,
        dates: {
            from: campaign.startDate,
            to: campaign.endDate,
        },
        status: campaign.status,
        acceptableDonationTypes: campaign.acceptableDonationTypes || [],
    },
  });

  const { formState: { isDirty }, reset, handleSubmit, setValue } = form;

  const handleCancel = () => {
    reset({
        name: campaign.name,
        description: campaign.description,
        goal: campaign.goal,
        image: null,
        dates: {
            from: campaign.startDate,
            to: campaign.endDate,
        },
        status: campaign.status,
        acceptableDonationTypes: campaign.acceptableDonationTypes || [],
    });
    setImagePreview(campaign.imageUrl || null);
    setIsEditing(false);
  }
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setValue('image', file);
        setImagePreview(URL.createObjectURL(file));
    } else {
        setValue('image', null);
        setImagePreview(campaign.imageUrl || null);
    }
  };

  async function onSubmit(values: CampaignFormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('description', values.description);
    formData.append('goal', String(values.goal));
    formData.append('startDate', values.dates.from.toISOString());
    formData.append('endDate', values.dates.to.toISOString());
    formData.append('status', values.status);
    values.acceptableDonationTypes.forEach(dt => formData.append('acceptableDonationTypes', dt));
    if (values.image) {
      formData.append('image', values.image);
    }
    if (campaign.imageUrl) {
        formData.append('existingImageUrl', campaign.imageUrl);
    }

    const result = await handleUpdateCampaign(campaign.id!, formData);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Campaign Updated",
        description: `Successfully updated the "${values.name}" campaign.`,
      });
      router.push("/admin/campaigns");
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
                    <CardTitle>Edit Campaign</CardTitle>
                    <CardDescription>
                        Update the details for the &quot;{campaign.name}&quot; campaign.
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Ramadan 2025 Zakat Drive" {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormDescription>A short, descriptive name for the campaign.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="Describe the purpose and goals of this campaign."
                        className="resize-y min-h-[100px]"
                        {...field}
                        disabled={!isEditing}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                    control={form.control}
                    name="image"
                    render={() => (
                        <FormItem>
                            <FormLabel>Campaign Image</FormLabel>
                            <FormControl>
                                <Input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageChange} disabled={!isEditing} />
                            </FormControl>
                            {imagePreview && (
                                <div className="mt-4 relative w-full h-48">
                                    <Image src={imagePreview} alt="Campaign image preview" fill className="rounded-md object-cover" />
                                </div>
                            )}
                            <FormDescription>Upload a new background image to replace the current one.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                    control={form.control}
                    name="goal"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Fundraising Goal (₹)</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {campaignStatuses.map(status => (
                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="dates"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Campaign Dates</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            id="date"
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !field.value?.from && "text-muted-foreground"
                                            )}
                                            disabled={!isEditing}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value?.from ? (
                                                field.value.to ? (
                                                    <>
                                                        {format(field.value.from, "LLL dd, y")} -{" "}
                                                        {format(field.value.to, "LLL dd, y")}
                                                    </>
                                                ) : (
                                                    format(field.value.from, "LLL dd, y")
                                                )
                                            ) : (
                                                <span>Pick a start and end date</span>
                                            )}
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={field.value?.from}
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormDescription>The start and end date for this campaign.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="acceptableDonationTypes"
                    render={() => (
                        <FormItem className="space-y-3 p-4 border rounded-lg">
                        <div className="mb-4">
                            <FormLabel className="text-base font-semibold">Acceptable Donation Types</FormLabel>
                            <FormDescription>
                                Select which types of donations can be allocated to this campaign.
                            </FormDescription>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {donationTypes.map((type) => (
                            <FormField
                                key={type}
                                control={form.control}
                                name="acceptableDonationTypes"
                                render={({ field }) => {
                                return (
                                    <FormItem
                                    key={type}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value?.includes(type)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...field.value, type])
                                            : field.onChange(
                                                field.value?.filter(
                                                    (value) => value !== type
                                                )
                                                )
                                        }}
                                        disabled={!isEditing}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        {type}
                                    </FormLabel>
                                    </FormItem>
                                )
                                }}
                            />
                            ))}
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                {isEditing && (
                     <div className="flex gap-4">
                        <Button type="submit" disabled={isSubmitting || !isDirty}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                         <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
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
