
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function CommunicationConfigurationPage() {
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Communications Configuration</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Settings />
                        Communications Settings
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Configure settings related to communications, such as message templates and provider settings.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This page is a placeholder for future communications-level settings.</p>
                </CardContent>
            </Card>
        </div>
    );
}
