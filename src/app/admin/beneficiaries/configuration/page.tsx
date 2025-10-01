
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function BeneficiaryConfigurationPage() {
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Beneficiary Configuration</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Settings />
                        Beneficiary Settings
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Configure settings related to beneficiary types and their management.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This page is a placeholder for future beneficiary-level settings.</p>
                </CardContent>
            </Card>
        </div>
    );
}
