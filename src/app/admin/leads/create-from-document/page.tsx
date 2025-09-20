// src/app/admin/leads/create-from-document/page.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  Form,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, UserPlus, Info, CalendarIcon, AlertTriangle, ChevronsUpDown, Check, Banknote, X, Lock, Clipboard, Text, Bot, FileUp, ZoomIn, ZoomOut, FileIcon, ScanSearch, UserSearch, UserRoundPlus, XCircle, PlusCircle, Paperclip, RotateCw, RefreshCw as RefreshIcon, BookOpen, Sparkles, CreditCard, Fingerprint, MapPin, Trash2, ArrowLeft } from "lucide-react";
import type { User, LeadPurpose, Campaign, Lead, DonationType, LeadPriority, AppSettings, ExtractLeadDetailsOutput, ExtractBeneficiaryDetailsOutput, GenerateSummariesOutput } from "@/services/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getRawTextFromImage } from '@/app/actions';
import Image from "next/image";
import { AddLeadForm } from "../add/add-lead-form";
import { getAllUsers, getAllCampaigns } from "@/services/lead-service"; // These might not exist, need to check
import { getAppSettings } from "@/app/admin/settings/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";


export default function CreateFromDocumentPage() {
    const { toast } = useToast();
    const [rawText, setRawText] = useState<string>('');
    const [isScanning, setIsScanning] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [prefilledData, setPrefilledData] = useState<Partial<Lead & { beneficiaryDetails: Partial<User> }>>({});
    const [view, setView] = useState<'upload' | 'form'>('upload');
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        const fetchData = async () => {
            try {
                const [s, u, c] = await Promise.all([getAppSettings(), getAllUsers(), getAllCampaigns()]);
                setSettings(s);
                setUsers(u);
                setCampaigns(c);
            } catch (e) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load initial page data.' });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [toast]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
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
            // This is where you would call the AI to parse the rawText
            // For now, we'll just switch to the form view
            setView('form');
             toast({ variant: 'success', title: 'Scan Complete', description: 'Document text extracted. Please review the form.' });
        } else {
            toast({ variant: 'destructive', title: 'Scan Failed', description: result.error });
        }
        setIsScanning(false);
    };
    
    if(loading || !settings) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div>
    }

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
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="documents">Select Files</Label>
                            <Input id="documents" type="file" multiple onChange={handleFileChange} />
                        </div>

                         {files.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {files.map((file, index) => (
                                    <div key={index} className="relative group p-2 border rounded-lg">
                                        {file.type.startsWith('image/') ? (
                                            <Image src={URL.createObjectURL(file)} alt={`Preview ${index}`} width={150} height={100} className="object-contain w-full h-24" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-24"><FileIcon className="w-10 h-10 text-muted-foreground" /><p className="text-xs text-muted-foreground truncate">{file.name}</p></div>
                                        )}
                                    </div>
                                ))}
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
