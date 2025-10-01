
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertCircle, Server } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { listAvailableModels } from "./actions";


interface Model {
    name: string;
    version: string;
    displayName: string;
    description: string;
    inputTokenLimit: number;
    outputTokenLimit: number;
    supportedGenerationMethods: string[];
}

export default function ModelsDiagnosticsPage() {
    const [models, setModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchModels = async () => {
            const result = await listAvailableModels();
            if (result.error) {
                setError(result.error);
            } else {
                setModels(result.models);
            }
            setLoading(false);
        };
        fetchModels();
    }, []);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Fetching available models...</p>
                </div>
            );
        }

        if (error) {
            return (
                <Alert variant="destructive" className="my-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            );
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Display Name</TableHead>
                        <TableHead>Model ID (Name)</TableHead>
                        <TableHead>Supported Methods</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {models.map(model => (
                        <TableRow key={model.name}>
                            <TableCell className="font-semibold">{model.displayName}</TableCell>
                            <TableCell className="font-mono text-xs">{model.name}</TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {model.supportedGenerationMethods.map(method => (
                                        <Badge key={method} variant="outline">{method}</Badge>
                                    ))}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    }

    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Model Diagnostics</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Server />
                        Available Gemini Models
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        This is a live list of the generative AI models available to your application via the provided API key.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    );
}
