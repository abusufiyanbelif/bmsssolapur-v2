
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Database } from "lucide-react";
import { seedDatabase } from "@/services/seed-service";

export default async function SeedPage() {
    const { userStatus, orgStatus, error } = await seedDatabase();

    const wasSuccessful = !error;

    return (
        <div className="flex-1 space-y-4">
             <h2 className="text-3xl font-bold tracking-tight font-headline">Database Seeding</h2>
             <Card>
                <CardHeader>
                    <CardTitle>Seeding Result</CardTitle>
                    <CardDescription>
                       The database seeding process has been executed. See the results below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {wasSuccessful ? (
                        <Alert variant="default" className="border-green-300 bg-green-50 text-green-800">
                             <CheckCircle className="h-4 w-4 !text-green-600" />
                            <AlertTitle>Seeding Complete</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>User seeding status: {userStatus}</li>
                                    <li>Organization seeding status: {orgStatus}</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    ) : (
                         <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Seeding Failed</AlertTitle>
                            <AlertDescription>
                                An error occurred during the seeding process:
                                <p className="font-mono text-xs bg-red-900/20 p-2 rounded-md mt-2">{error}</p>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
             </Card>
        </div>
    );
}
