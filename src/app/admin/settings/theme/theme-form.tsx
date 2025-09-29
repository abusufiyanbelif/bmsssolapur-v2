
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
import { useState } from "react";
import { Loader2, Save, X, Edit, Palette, Droplets, Type, MessageSquare, Paintbrush } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { isEqual } from 'lodash';

const formSchema = z.object({
  primary: z.string().min(1, "Primary color is required."),
  accent: z.string().min(1, "Accent color is required."),
  background: z.string().min(1, "Background color is required."),
  foreground: z.string().min(1, "Foreground (text) color is required."),
  destructive: z.string().min(1, "Destructive color is required."),
  success: z.string().min(1, "Success color is required."),
  warning: z.string().min(1, "Warning color is required."),
  info: z.string().min(1, "Info color is required."),
});

type FormValues = z.infer<typeof formSchema>;

interface ThemeFormProps {
    currentTheme: FormValues;
}

// --- COLOR CONVERSION HELPERS ---
const hslStringToHex = (hslStr: string): string => {
  if (!hslStr) return '#000000';
  const [h, s, l] = hslStr.split(' ').map(parseFloat);
  const s_norm = s / 100;
  const l_norm = l / 100;
  const c = (1 - Math.abs(2 * l_norm - 1)) * s_norm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l_norm - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { [r, g, b] = [c, x, 0]; }
  else if (60 <= h && h < 120) { [r, g, b] = [x, c, 0]; }
  else if (120 <= h && h < 180) { [r, g, b] = [0, c, x]; }
  else if (180 <= h && h < 240) { [r, g, b] = [0, x, c]; }
  else if (240 <= h && h < 300) { [r, g, b] = [x, 0, c]; }
  else if (300 <= h && h < 360) { [r, g, b] = [c, 0, x]; }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const hexToHslString = (hex: string): string => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  return `${h} ${s}% ${l}%`;
};

const colorToHsl = (color: string) => {
    if (!color) return '';
    if (color.startsWith('hsl')) return color;
    return `hsl(${color})`;
}

const themeSuggestions = [
    { name: 'Forest Green (Default)', colors: { primary: '142.1 76.2% 36.3%', accent: '45 93.4% 47.5%', background: '0 0% 100%', foreground: '224 71.4% 4.1%', destructive: '0 84.2% 60.2%', success: '142.1 76.2% 36.3%', warning: '38.8 92.3% 50.2%', info: '217.2 91.2% 59.8%' } },
    { name: 'Ramadan Green & Gold', colors: { primary: '142.1 76.2% 36.3%', accent: '47.9 95.8% 53.1%', background: '45 60% 98%', foreground: '142.1 25% 15%', destructive: '0 84.2% 60.2%', success: '142.1 76.2% 36.3%', warning: '38.8 92.3% 50.2%', info: '217.2 91.2% 59.8%' } },
    { name: 'Ocean Blue', colors: { primary: '217.2 91.2% 59.8%', accent: '210 40% 96.1%', background: '0 0% 100%', foreground: '224 71.4% 4.1%', destructive: '0 84.2% 60.2%', success: '148.8 61.6% 41.6%', warning: '45 93.4% 47.5%', info: '217.2 91.2% 59.8%' } },
    { name: 'Eid Mubarak', colors: { primary: '210 40% 96.1%', accent: '217.2 91.2% 59.8%', background: '0 0% 100%', foreground: '224 71.4% 4.1%', destructive: '0 84.2% 60.2%', success: '148.8 61.6% 41.6%', warning: '45 93.4% 47.5%', info: '217.2 91.2% 59.8%' } },
    { name: 'Sunset Orange', colors: { primary: '24.6 95% 53.1%', accent: '20.5 90.2% 48.2%', background: '0 0% 100%', foreground: '20 14.3% 4.1%', destructive: '0 84.2% 60.2%', success: '133.3 54.3% 43.1%', warning: '38.8 92.3% 50.2%', info: '217.2 91.2% 59.8%' } },
    { name: 'Royal Purple', colors: { primary: '262.1 83.3% 57.8%', accent: '221.2 83.2% 53.3%', background: '0 0% 100%', foreground: '224 71.4% 4.1%', destructive: '0 84.2% 60.2%', success: '148.8 61.6% 41.6%', warning: '45 93.4% 47.5%', info: '262.1 83.3% 57.8%' } },
    { name: 'Teal & Coral', colors: { primary: '173.5 80.5% 35.1%', accent: '0 84.2% 60.2%', background: '180 20% 98%', foreground: '174 24.3% 14.1%', destructive: '0 84.2% 60.2%', success: '142.1 76.2% 36.3%', warning: '38.8 92.3% 50.2%', info: '197.8 89.8% 48.6%' } },
    { name: 'Minty Fresh', colors: { primary: '160 70% 40%', accent: '160 50% 90%', background: '0 0% 100%', foreground: '160 20% 10%', destructive: '0 84.2% 60.2%', success: '142.1 76.2% 36.3%', warning: '38.8 92.3% 50.2%', info: '217.2 91.2% 59.8%' } },
    { name: 'Cherry Blossom', colors: { primary: '340 82% 52%', accent: '340 20% 92%', background: '0 0% 100%', foreground: '340 10% 20%', destructive: '0 84.2% 60.2%', success: '142.1 76.2% 36.3%', warning: '38.8 92.3% 50.2%', info: '217.2 91.2% 59.8%' } },
    { name: 'Earth Tones', colors: { primary: '25 50% 35%', accent: '35 40% 80%', background: '35 20% 95%', foreground: '25 30% 15%', destructive: '0 84.2% 60.2%', success: '142.1 76.2% 36.3%', warning: '38.8 92.3% 50.2%', info: '217.2 91.2% 59.8%' } },
    { name: 'Professional Navy', colors: { primary: '221.2 83.2% 53.3%', accent: '210 40% 96.1%', background: '0 0% 100%', foreground: '224 71.4% 4.1%', destructive: '0 84.2% 60.2%', success: '148.8 61.6% 41.6%', warning: '45 93.4% 47.5%', info: '217.2 91.2% 59.8%' } },
    { name: 'Lavender & Sage', colors: { primary: '255 47% 51%', accent: '120 22% 85%', background: '255 10% 97%', foreground: '255 10% 20%', destructive: '0 84.2% 60.2%', success: '142.1 76.2% 36.3%', warning: '38.8 92.3% 50.2%', info: '217.2 91.2% 59.8%' } },

    // Dark Modes
    { name: 'Midnight Ramadan (Dark)', colors: { primary: '47.9 95.8% 53.1%', accent: '142.1 70.6% 45.3%', background: '220 13% 18%', foreground: '210 40% 98%', destructive: '0 72.2% 50.6%', success: '142.1 70.6% 35.3%', warning: '45 93.4% 47.5%', info: '217.2 91.2% 59.8%' } },
    { name: 'Slate & Lime (Dark)', colors: { primary: '83.7 87.5% 54.1%', accent: '83.7 87.5% 54.1%', background: '215 28% 17%', foreground: '210 40% 98%', destructive: '0 62.8% 30.6%', success: '142.1 70.6% 35.3%', warning: '45 93.4% 47.5%', info: '217.2 91.2% 59.8%' } },
    { name: 'Charcoal & Gold (Dark)', colors: { primary: '45 93.4% 47.5%', accent: '45 93.4% 47.5%', background: '20 14.3% 4.1%', foreground: '60 9.1% 97.8%', destructive: '0 72.2% 50.6%', success: '142.1 70.6% 35.3%', warning: '38.8 92.3% 50.2%', info: '217.2 91.2% 59.8%' } },
    { name: 'Crimson Night (Dark)', colors: { primary: '346.8 77.2% 49.8%', accent: '35.5 91.7% 54.9%', background: '20 14.3% 4.1%', foreground: '60 9.1% 97.8%', destructive: '0 62.8% 30.6%', success: '133.3 54.3% 43.1%', warning: '38.8 92.3% 50.2%', info: '217.2 91.2% 59.8%' } },
    { name: 'Espresso & Mint (Dark)', colors: { primary: '150 54% 42%', accent: '30 20% 90%', background: '25 25% 15%', foreground: '30 20% 90%', destructive: '0 84.2% 60.2%', success: '142.1 76.2% 36.3%', warning: '38.8 92.3% 50.2%', info: '197.8 89.8% 48.6%' } },
    { name: 'Cyberpunk (Dark)', colors: { primary: '312 100% 50%', accent: '182 100% 50%', background: '240 10% 4%', foreground: '210 40% 98%', destructive: '0 100% 50%', success: '120 100% 50%', warning: '60 100% 50%', info: '182 100% 50%' } },
    { name: 'Deep Sea (Dark)', colors: { primary: '197.8 89.8% 48.6%', accent: '180 20% 98%', background: '210 30% 12%', foreground: '210 40% 98%', destructive: '0 84.2% 60.2%', success: '142.1 76.2% 36.3%', warning: '38.8 92.3% 50.2%', info: '197.8 89.8% 48.6%' } },
    { name: 'Vampire (Dark)', colors: { primary: '0 100% 50%', accent: '0 0% 80%', background: '0 0% 5%', foreground: '0 0% 98%', destructive: '0 100% 50%', success: '120 100% 25%', warning: '60 100% 50%', info: '240 100% 50%' } },
    { name: 'Matrix (Dark)', colors: { primary: '120 100% 50%', accent: '120 100% 80%', background: '0 0% 0%', foreground: '120 100% 50%', destructive: '0 100% 50%', success: '120 100% 50%', warning: '60 100% 50%', info: '180 100% 50%' } },
    { name: 'Dracula (Dark)', colors: { primary: '271 91% 65%', accent: '50 100% 50%', background: '231 15% 18%', foreground: '60 30% 96%', destructive: '0 100% 67%', success: '129 70% 55%', warning: '50 100% 50%', info: '217 91% 60%' } },
];


export function ThemeForm({ currentTheme }: ThemeFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentTheme
  });
  
  const { formState: { isDirty }, reset, watch, setValue } = form;

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

  const applyTheme = (colors: FormValues) => {
    Object.entries(colors).forEach(([key, value]) => {
      setValue(key as keyof FormValues, value, { shouldDirty: true });
    });
    setIsEditing(true);
  }

  const ColorInput = ({ name, label }: { name: keyof FormValues, label: string }) => {
    const value = watch(name);
    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <div className="flex items-center gap-2">
                        <FormControl>
                            <Input {...field} placeholder="e.g., 142.1 76.2% 36.3%" disabled={!isEditing} />
                        </FormControl>
                        <Input
                            type="color"
                            className="w-12 h-10 p-1"
                            value={hslStringToHex(value)}
                            onChange={(e) => field.onChange(hexToHslString(e.target.value))}
                            disabled={!isEditing}
                        />
                    </div>
                    <FormMessage />
                </FormItem>
            )}
        />
    )
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
                <div className="space-y-4 rounded-lg border p-6">
                    <h4 className="font-semibold flex items-center gap-2"><Droplets/> Theme Suggestions</h4>
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {themeSuggestions.map(theme => {
                            const isSelected = isEqual(theme.colors, watchedColors);
                            return (
                                <Button key={theme.name} type="button" variant={isSelected ? 'default' : 'outline'} onClick={() => applyTheme(theme.colors as FormValues)}>
                                    {theme.name}
                                </Button>
                            )
                        })}
                    </div>
                </div>

                <Accordion type="multiple" defaultValue={["branding", "text", "notifications"]} className="w-full space-y-4">
                    <AccordionItem value="branding" className="border rounded-lg">
                        <AccordionTrigger className="p-4"><h4 className="font-semibold flex items-center gap-2"><Paintbrush /> Branding & UI Colors</h4></AccordionTrigger>
                        <AccordionContent className="p-6 pt-2 space-y-6">
                            <ColorInput name="primary" label="Primary Color" />
                            <ColorInput name="accent" label="Accent Color" />
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="text" className="border rounded-lg">
                        <AccordionTrigger className="p-4"><h4 className="font-semibold flex items-center gap-2"><Type /> Text & Background Colors</h4></AccordionTrigger>
                        <AccordionContent className="p-6 pt-2 space-y-6">
                            <ColorInput name="background" label="Background Color" />
                            <ColorInput name="foreground" label="Foreground (Text) Color" />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="notifications" className="border rounded-lg">
                        <AccordionTrigger className="p-4"><h4 className="font-semibold flex items-center gap-2"><MessageSquare /> Notification & Status Colors</h4></AccordionTrigger>
                        <AccordionContent className="p-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ColorInput name="success" label="Success Color" />
                            <ColorInput name="warning" label="Warning Color" />
                            <ColorInput name="info" label="Info Color" />
                            <ColorInput name="destructive" label="Destructive/Error Color" />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                

                 <div className="space-y-4 rounded-lg border p-6">
                    <h4 className="font-semibold flex items-center gap-2"><Palette/>Live Preview</h4>
                    <div className="p-6 rounded-lg" style={{ backgroundColor: colorToHsl(watchedColors.background)}}>
                         <h3 className="text-2xl font-bold mb-4" style={{ color: colorToHsl(watchedColors.primary) }}>Preview Heading</h3>
                        <p className="mb-6 text-sm" style={{ color: colorToHsl(watchedColors.foreground) }}>This is a sample paragraph to demonstrate the foreground (text) color on the selected background.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <Button style={{ backgroundColor: colorToHsl(watchedColors.primary), color: 'hsl(var(--primary-foreground))' }}>Primary Button</Button>
                            <Button style={{ backgroundColor: colorToHsl(watchedColors.accent), color: 'hsl(var(--accent-foreground))' }}>Accent Button</Button>
                            <Button style={{ backgroundColor: colorToHsl(watchedColors.success), color: 'hsl(var(--success-foreground))' }}>Success</Button>
                            <Button style={{ backgroundColor: colorToHsl(watchedColors.warning), color: 'hsl(var(--warning-foreground))' }}>Warning</Button>
                            <Button style={{ backgroundColor: colorToHsl(watchedColors.info), color: 'hsl(var(--info-foreground))' }}>Info</Button>
                            <Button variant="destructive" style={{ backgroundColor: colorToHsl(watchedColors.destructive) }}>Destructive</Button>
                        </div>
                    </div>
                </div>
            </fieldset>
        </form>
    </Form>
  )
}
