
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { getAppSettings } from "@/services/app-settings-service";
import { LeadConfigForm } from "./lead-config-form";

const allPurposes = ['Education', 'Medical', 'Relief Fund', 'Deen', 'Loan', 'Other'];

export default async function LeadConfigurationPage() {
    const settings = await getAppSettings();
    
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
                        Configure settings related to lead management, such as enabling or disabling specific purposes. Changes made here will affect the options available in the "Add Lead" form.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LeadConfigForm 
                        allPurposes={allPurposes} 
                        disabledPurposes={settings.leadConfiguration?.disabledPurposes || []} 
                    />
                </CardContent>
            </Card>
        </div>
    );
}
