
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
import { handleUpdateTheme } from "./actions";
import { useState, useMemo } from "react";
import { Loader2, Save, X, Edit, Palette } from "lucide-react";

const formSchema = z.object({
  primary: z.string().min(1, "Primary color is required."),
  accent: z.string().min(1, "Accent color is required."),
  background: z.string().min(1, "Background color is required."),
  destructive: z.string().min(1, "Destructive color is required."),
});

type FormValues = z.infer<typeof formSchema>;

interface ThemeFormProps {
    currentTheme: {
        primary: string;
        accent: string;
        background: string;
        destructive: string;
    };
}

const colorToHsl = (color: string) => {
    if (!color.startsWith('hsl')) return color;
    const [h, s, l] = color.replace(/hsl\(|\)/g, '').split(' ').map(c => c.trim().replace('%',''));
    return `hsl(${h}, ${s}%, ${l}%)`;
}


export function ThemeForm({ currentTheme }: ThemeFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentTheme
  });
  
  const { formState: { isDirty }, reset, watch } = form;

  const watchedColors = watch();

  const handleCancel = () => {
    reset(currentTheme);
    setIsEditing(false);
  };
  
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value);
    });
    const result = await handleUpdateTheme(formData);
    
    if (result.success) {
        toast({
            variant: "success",
            title: "Theme Updated!",
            description: "Your new color theme has been applied. Please refresh the page to see the full effect."
        });
        reset(values);
        setIsEditing(false);
    } else {
         toast({
            variant: "destructive",
            title: "Update Failed",
            description: result.error
        });
    }

    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
             <div className="flex justify-end mb-6">
                {!isEditing ? (
                    <Button type="button" onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Theme
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handleCancel}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FormField
                        control={form.control}
                        name="primary"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Primary Color</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="e.g., 142.1 76.2% 36.3%" />
                                </FormControl>
                                <FormDescription>The main brand color (buttons, links). Provide HSL values without hsl().</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="accent"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Accent Color</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="e.g., 45 93.4% 47.5%" />
                                </FormControl>
                                <FormDescription>A secondary color for highlights.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="background"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Background Color</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="e.g., 0 0% 100%" />
                                </FormControl>
                                <FormDescription>The main page background.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="destructive"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Destructive Color</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="e.g., 0 84.2% 60.2%" />
                                </FormControl>
                                <FormDescription>Color for delete or error actions.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <div className="space-y-4 rounded-lg border p-6">
                    <h4 className="font-semibold flex items-center gap-2"><Palette/>Live Preview</h4>
                    <div className="p-6 rounded-lg" style={{ backgroundColor: colorToHsl(watchedColors.background)}}>
                        <div className="grid grid-cols-2 gap-4">
                            <Button style={{ backgroundColor: colorToHsl(watchedColors.primary) }}>Primary Button</Button>
                            <Button style={{ backgroundColor: colorToHsl(watchedColors.accent) }}>Accent Button</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="destructive" style={{ backgroundColor: colorToHsl(watchedColors.destructive) }}>Destructive</Button>
                        </div>
                    </div>
                </div>
            </fieldset>
        </form>
    </Form>
  )
}
