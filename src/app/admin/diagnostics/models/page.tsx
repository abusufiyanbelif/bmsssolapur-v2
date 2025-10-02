
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
    const [models, setModels = useState([]);
    const [loading, setLoading = useState(true);
    const [error, setError = useState(null);

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
                 
                    
                    Fetching available models...
                
            );
        }

        if (error) {
            return (
                 
                    
                    Error
                    {error}
                
            );
        }

        return (
            
                
                    
                        Display Name
                        Model ID (Name)
                        Supported Methods
                    
                
                
                    {models.map(model => (
                         
                            
                                {model.displayName}
                            
                            
                                {model.name}
                            
                            
                                {model.supportedGenerationMethods.map(method => (
                                    {method}
                                ))}
                            
                        
                    ))}
                
            
        );
    }

    return (
         
             
                Model Diagnostics
            
             
                
                    
                        
                        Available Gemini Models
                    
                     
                        This is a live list of the generative AI models available to your application via the provided API key.
                    
                
                 
                    {renderContent()}
                
            
        
    );
}

    