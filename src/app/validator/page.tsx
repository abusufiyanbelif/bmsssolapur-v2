import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ValidatorForm } from "./validator-form";

export default function ValidatorPage() {
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Configuration Validator</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Validate Configuration</CardTitle>
                    <CardDescription>
                        Use the AI-powered validator to check your configurations for potential misconfigurations or security vulnerabilities.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ValidatorForm />
                </CardContent>
            </Card>
        </div>
    );
}
