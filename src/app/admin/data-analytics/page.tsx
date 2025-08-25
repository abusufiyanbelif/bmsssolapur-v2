
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DataAnalyticsPage() {
  return (
    <div className="flex-1 space-y-6">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Data Profiling & Analytics</h2>
        <Card>
          <CardHeader>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>
              This space is reserved for future data profiling and analytics dashboards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Analytics components will be added here.</p>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
