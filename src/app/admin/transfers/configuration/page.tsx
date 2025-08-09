
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function TransferConfigurationPage() {
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Transfer Configuration</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings />
                        Beneficiary Transfer Settings
                    </CardTitle>
                    <CardDescription>
                        Configure settings related to transferring funds to beneficiaries.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This page is a placeholder for future fund transfer settings.</p>
                </CardContent>
            </Card>
        </div>
    );
}
