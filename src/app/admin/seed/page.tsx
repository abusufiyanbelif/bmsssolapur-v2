
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Database, UserCheck, UserX } from "lucide-react";
import { seedDatabase } from "@/services/seed-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";

export default async function SeedPage() {
    const { userResults, orgStatus, error } = await seedDatabase();

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
                    {!wasSuccessful ? (
                         <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Seeding Failed</AlertTitle>
                            <AlertDescription>
                                An error occurred during the seeding process:
                                <p className="font-mono text-xs bg-red-900/20 p-2 rounded-md mt-2">{error}</p>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-6">
                            <Alert variant="default" className="border-green-300 bg-green-50 text-green-800">
                                <CheckCircle className="h-4 w-4 !text-green-600" />
                                <AlertTitle>Seeding Complete</AlertTitle>
                                <AlertDescription>
                                    The initial data has been loaded into the database.
                                </AlertDescription>
                            </Alert>
                            
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Database className="h-5 w-5" />
                                        Organization Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{orgStatus}</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <UserCheck className="h-5 w-5" />
                                        User Seeding Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                     <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userResults.map((result) => (
                                                <TableRow key={result.phone}>
                                                    <TableCell className="font-medium">{result.name}</TableCell>
                                                    <TableCell className="font-mono">{result.phone}</TableCell>
                                                    <TableCell>
                                                        {result.status === "Created" ? (
                                                            <Badge variant="default" className="bg-green-100 text-green-800">Created</Badge>
                                                        ) : (
                                                            <Badge variant="secondary">Skipped</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
             </Card>
        </div>
    );
}
