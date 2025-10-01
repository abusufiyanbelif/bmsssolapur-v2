
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function CampaignConfigurationPage() {
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Campaign Configuration</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Settings />
                        Campaign Settings
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Configure settings related to campaign types, default goals, and other related parameters.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This page is a placeholder for future campaign-level settings.</p>
                </CardContent>
            </Card>
        </div>
    );
}
