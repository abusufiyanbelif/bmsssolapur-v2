
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeForm } from "./theme-form";
import { Palette } from "lucide-react";
import * as fs from 'fs/promises';
import * as path from 'path';

async function getCurrentTheme() {
    try {
        const cssFilePath = path.join(process.cwd(), 'src', 'app', 'globals.css');
        const cssContent = await fs.readFile(cssFilePath, 'utf8');

        const getVariableValue = (variable: string): string => {
            const regex = new RegExp(`${variable}:\\s*([\\d\\s.%]+);`);
            const match = cssContent.match(regex);
            return match ? match[1].trim() : '';
        };

        return {
            primary: getVariableValue('--primary'),
            accent: getVariableValue('--accent'),
            background: getVariableValue('--background'),
            foreground: getVariableValue('--foreground'),
            destructive: getVariableValue('--destructive'),
            success: getVariableValue('--success'),
            warning: getVariableValue('--warning'),
            info: getVariableValue('--info'),
        };

    } catch (error) {
        console.error("Could not read globals.css to get current theme", error);
        return { primary: '', accent: '', background: '', foreground: '', destructive: '', success: '', warning: '', info: '' };
    }
}

export default async function ThemeSettingsPage() {
    const currentTheme = await getCurrentTheme();

    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Theme Settings</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette />
                        Application Theme
                    </CardTitle>
                    <CardDescription>
                       Customize the look and feel of the application. Changes will be applied globally.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ThemeForm currentTheme={currentTheme} />
                </CardContent>
            </Card>
        </div>
    );
}
