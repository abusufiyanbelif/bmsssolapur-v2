
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

export default function DataAnalyticsPage() {
    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Data Profiling & Analytics</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LayoutDashboard />
                        Analytics Dashboard
                    </CardTitle>
                    <CardDescription>
                        This is the central hub for data profiling and analytics. Charts and data summaries will be added here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Analytics components and data visualizations will be displayed on this page.</p>
                </CardContent>
            </Card>
        </div>
    );
}
