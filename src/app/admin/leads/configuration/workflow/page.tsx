

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LeadWorkflowPage() {
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Lead Status Workflow</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Workflow />
                        Lead Status Workflow
                    </CardTitle>
                    <CardDescription>
                       Define the allowed transitions between different lead statuses to create a custom workflow.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-8 text-center border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">A simplified lead workflow editor will be available here soon.</p>
                         <Button variant="secondary" disabled className="mt-4">Coming Soon</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
