
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function LeadConfigurationPage() {
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Lead Configuration</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings />
                        Lead Settings
                    </CardTitle>
                    <CardDescription>
                        This page will be used to configure settings related to lead management, such as defining purposes, categories, and verification rules.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Configuration options will be available here in a future update.</p>
                </CardContent>
            </Card>
        </div>
    );
}
