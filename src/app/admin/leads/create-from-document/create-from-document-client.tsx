// src/app/admin/leads/create-from-document/create-from-document-client.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { Loader2, ArrowLeft, ScanSearch, XCircle, PlusCircle, FileIcon, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import type { User, Campaign, AppSettings } from "@/services/types";
import { getRawTextFromImage } from '@/app/actions';
import Image from "next/image";
import { AddLeadForm } from "../add/add-lead-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface CreateFromDocumentClientProps {
    users: User[];
    campaigns: Campaign[];
    settings: AppSettings;
}

export function CreateFromDocumentClient({ users, campaigns, settings }: CreateFromDocumentClientProps) {
    const { toast } = useToast();
    const [rawText, setRawText] = useState<string>('');
    const [isScanning, setIsScanning] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [view, setView] = useState<'upload' | 'form'>('upload');
    const [zoomLevels, setZoomLevels] = useState<Record<number, number>>({});
    const [rotation, setRotation] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
            setZoomLevels({});
            setRotation(0);
        }
    };

    const handleScan = async () => {
        if (files.length === 0) {
            toast({ variant: 'destructive', title: 'No files selected' });
            return;
        }
        setIsScanning(true);
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        
        const result = await getRawTextFromImage(formData);
        if (result.success && result.rawText) {
            setRawText(result.rawText);
            setView('form');
            toast({ variant: 'success', title: 'Scan Complete', description: 'Document text extracted. Please review the form.' });
        } else {
            toast({ variant: 'destructive', title: 'Scan Failed', description: result.error });
        }
        setIsScanning(false);
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        setZoomLevels(prev => ({...prev, [index]: Math.max(0.5, Math.min((prev[index] || 1) - e.deltaY * 0.001, 5))}));
    };

    const handleRemoveFile = (indexToRemove: number) => {
        setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="flex-1 space-y-4">
             <Link href="/admin/leads" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Leads
            </Link>
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Create Lead from Document</h2>
            
            {view === 'upload' && (
                <Card>
                    <CardHeader>
                        <CardTitle>1. Upload Documents</CardTitle>
                        <CardDescription>Upload one or more documents (ID cards, medical bills, applications) for a single case. The AI will scan them to create a new lead.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="documents">Select Files</Label>
                            <Input id="documents" type="file" multiple onChange={handleFileChange} ref={fileInputRef} />
                        </div>

                         {files.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {files.map((file, index) => (
                                    <div key={index} className="relative group p-2 border rounded-lg bg-background space-y-2">
                                        <div className="w-full h-40 overflow-auto flex items-center justify-center">
                                            {file.type.startsWith('image/') ? (
                                                <div className="relative w-full h-full" onWheel={(e) => handleWheel(e, index)}>
                                                    <Image src={URL.createObjectURL(file)} alt={`Preview ${index}`} fill className="object-contain transition-transform duration-300" style={{ transform: `scale(${zoomLevels[index] || 1}) rotate(${rotation}deg)` }} />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                                    <FileIcon className="h-12 w-12" />
                                                    <span className="text-xs font-semibold mt-2">{file.name}</span>
                                                </div>
                                            )}
                                        </div>
                                         <p className="text-xs text-muted-foreground truncate">{file.name}</p>
                                         <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-md">
                                            <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setZoomLevels(z => ({...z, [index]: (z[index] || 1) * 1.2}))}><ZoomIn className="h-4 w-4"/></Button>
                                            <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setZoomLevels(z => ({...z, [index]: Math.max(0.5, (z[index] || 1) / 1.2)}))}><ZoomOut className="h-4 w-4"/></Button>
                                            <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setRotation(r => r + 90)}><RotateCw className="h-4 w-4" /></Button>
                                            <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveFile(index)}><XCircle className="h-4 w-4"/></Button>
                                        </div>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" className="h-full flex-col gap-2 border-dashed" onClick={() => fileInputRef.current?.click()}><PlusCircle className="h-8 w-8 text-muted-foreground" /><span className="text-muted-foreground">Add More Files</span></Button>
                            </div>
                        )}

                        <Button onClick={handleScan} disabled={files.length === 0 || isScanning}>
                            {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ScanSearch className="mr-2 h-4 w-4"/>}
                            Scan Documents & Proceed
                        </Button>
                    </CardContent>
                </Card>
            )}

            {view === 'form' && (
                <Card>
                    <CardHeader>
                        <CardTitle>2. Review & Create Lead</CardTitle>
                        <CardDescription>The AI has scanned your document. Please review the auto-filled details below, make any necessary corrections, and create the lead.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AddLeadForm
                            settings={settings}
                            users={users}
                            campaigns={campaigns}
                            prefilledRawText={rawText}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
