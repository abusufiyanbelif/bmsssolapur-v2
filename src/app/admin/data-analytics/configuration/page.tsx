
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function DataAnalyticsConfigurationPage() {
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Analytics Configuration</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings />
                        Configuration
                    </CardTitle>
                    <CardDescription>
                        Manage settings for the Data Profiling & Analytics module.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Configuration options for analytics will be available here in the future.</p>
                </CardContent>
            </Card>
        </div>
    );
}
