
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function DonationConfigurationPage() {
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Donation Configuration</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings />
                        Donation Settings
                    </CardTitle>
                    <CardDescription>
                        Configure settings related to donation types, purposes, and verification workflows.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This page is a placeholder for future donation-level settings.</p>
                </CardContent>
            </Card>
        </div>
    );
}
