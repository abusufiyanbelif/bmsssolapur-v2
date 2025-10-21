// src/app/admin/seed/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Database, UserCheck, Quote, Users, HandCoins, RefreshCcw, Building, FileText, Trash2, CreditCard, Settings, Fingerprint, UserX as AnonymousUserIcon, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { handleSeedAction, handleEraseAction, getCoreCollectionsList, handleEnsureSingleCollection } from "./actions";
import { useRouter } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";


type SeedStatus = 'idle' | 'loading';
type SeedTask = 'initial' | 'coreTeam' | 'organization' | 'paymentGateways' | 'sampleData' | 'appSettings' | 'syncFirebaseAuth';

type CollectionCheckStatus = {
    name: string;
    status: 'pending' | 'checking' | 'created' | 'exists' | 'error';
    error?: string;
};

export default function SeedPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [statuses, setStatuses] = useState<Record<SeedTask, SeedStatus>>({
        initial: 'idle',
        coreTeam: 'idle',
        organization: 'idle',
        appSettings: 'idle',
        paymentGateways: 'idle',
        sampleData: 'idle',
        syncFirebaseAuth: 'idle',
    });
    const [eraseStatuses, setEraseStatuses] = useState<Record<SeedTask, SeedStatus>>({
        initial: 'idle',
        coreTeam: 'idle',
        organization: 'idle',
        appSettings: 'idle',
        paymentGateways: 'idle',
        sampleData: 'idle',
        syncFirebaseAuth: 'idle',
    });
    
    // New state for collection check progress
    const [isCheckingCollections, setIsCheckingCollections] = useState(false);
    const [collectionCheckProgress, setCollectionCheckProgress] = useState<CollectionCheckStatus[]>([]);

    const handleSeed = async (task: SeedTask) => {
        setStatuses(prev => ({ ...prev, [task]: 'loading' }));
        setEraseStatuses(prev => ({ ...prev, [task]: 'idle' })); 

        try {
            const result = await handleSeedAction(task);
            if(result.success && result.data){
                toast({
                    variant: 'success',
                    title: `Seed Success: ${result.data.message}`,
                    description: (
                        <ul className="mt-2 text-xs list-disc pl-4">
                            {result.data.details?.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                    )
                });
                router.refresh();
            } else {
                 toast({
                    variant: 'destructive',
                    title: "Seeding Failed",
                    description: result.error || 'An unknown error occurred.',
                });
            }
        } catch (e) {
            const error = e instanceof Error ? e.message : "An unexpected error occurred.";
             toast({
                variant: 'destructive',
                title: "Seeding Operation Failed",
                description: error,
            });
        } finally {
            setStatuses(prev => ({...prev, [task]: 'idle' }));
        }
    };
    
    const handleErase = async (task: SeedTask) => {
        setEraseStatuses(prev => ({ ...prev, [task]: 'loading' }));
        setStatuses(prev => ({ ...prev, [task]: 'idle' }));

        try {
            const result = await handleEraseAction(task);
            if (result.success && result.data) {
                toast({
                    variant: 'success',
                    title: `Erase Success: ${result.data.message}`,
                     description: (
                        <ul className="mt-2 text-xs list-disc pl-4">
                            {result.data.details?.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                    )
                });
                router.refresh();
            } else {
                toast({
                    variant: 'destructive',
                    title: "Erase Failed",
                    description: result.error || 'An unknown error occurred.',
                });
            }
        } catch (e) {
            const error = e instanceof Error ? e.message : "An unexpected error occurred.";
             toast({
                variant: 'destructive',
                title: "Erase Operation Failed",
                description: error,
            });
        } finally {
            setEraseStatuses(prev => ({ ...prev, [task]: 'idle' }));
        }
    };

    const handleCollectionCheck = async () => {
        setIsCheckingCollections(true);
        const collections = await getCoreCollectionsList();
        const initialProgress = collections.map(name => ({ name, status: 'pending' as const }));
        setCollectionCheckProgress(initialProgress);

        let createdCount = 0;
        let errorCount = 0;

        for (let i = 0; i < collections.length; i++) {
            const collectionName = collections[i];
            
            // Set current to 'checking'
            setCollectionCheckProgress(prev => prev.map((item, idx) => i === idx ? { ...item, status: 'checking' } : item));
            
            const result = await handleEnsureSingleCollection(collectionName);
            
            setCollectionCheckProgress(prev => prev.map((item, idx) => {
                if (i === idx) {
                    if (result.success) {
                        if (result.created) createdCount++;
                        return { ...item, status: result.created ? 'created' : 'exists' };
                    } else {
                        errorCount++;
                        return { ...item, status: 'error', error: result.error };
                    }
                }
                return item;
            }));
        }

        setIsCheckingCollections(false);
        toast({
            variant: errorCount > 0 ? 'destructive' : 'success',
            title: "Collection Check Complete",
            description: `${createdCount} collections created, ${collections.length - createdCount - errorCount} already existed, ${errorCount} failed.`
        });
    };
    

    return (
        <div className="flex-1 space-y-6">
             <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Database Seeding</h2>
             <Card>
                <CardHeader>
                    <CardTitle className="text-primary">Seed Initial Data</CardTitle>
                    <CardDescription className="text-muted-foreground">
                       Use these actions to populate or clear your Firestore database. Run these in order from top to bottom for best results.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     {/* Ensure Collections */}
                    <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" />Ensure Collections Exist</h3>
                                <p className="text-sm text-muted-foreground mt-1">Checks if essential collections exist and creates them if they don't. This is run automatically on server start but can be triggered manually.</p>
                             </div>
                             <div className="flex items-center gap-2">
                                <Button onClick={handleCollectionCheck} disabled={isCheckingCollections}>
                                    {isCheckingCollections && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Run Check & Create
                                </Button>
                             </div>
                        </div>
                         {isCheckingCollections && (
                            <div className="pt-4 border-t">
                                <h4 className="text-sm font-semibold mb-2">Checking collections...</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
                                    {collectionCheckProgress.map(item => (
                                        <div key={item.name} className="flex items-center gap-2 text-sm">
                                            {item.status === 'pending' && <div className="h-4 w-4" />}
                                            {item.status === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                            {item.status === 'exists' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                            {item.status === 'created' && <PlusCircle className="h-4 w-4 text-blue-500" />}
                                            {item.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                                            <span className={item.status === 'pending' ? 'text-muted-foreground' : ''}>{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Initial Seed */}
                    <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><Quote className="h-5 w-5 text-primary" />Initial Setup</h3>
                                <p className="text-sm text-muted-foreground mt-1">Seeds the Inspirational Quotes. Note: The 'admin' and 'anonymous_donor' users are automatically created on startup.</p>
                             </div>
                             <div className="flex items-center gap-2">
                                <Button variant="destructive" onClick={() => handleErase('initial')} disabled={eraseStatuses.initial === 'loading'}>
                                    {eraseStatuses.initial === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                                    Erase Quotes
                                </Button>
                                <Button onClick={() => handleSeed('initial')} disabled={statuses.initial === 'loading'}>
                                    {statuses.initial === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Seed Quotes
                                </Button>
                             </div>
                        </div>
                    </div>

                    {/* Organization Profile */}
                    <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><Building className="h-5 w-5 text-primary" />Organization Profile</h3>
                                <p className="text-sm text-muted-foreground mt-1">Seeds the main profile for the organization, including contact info, bank details, and footer text.</p>
                             </div>
                             <div className="flex items-center gap-2">
                                <Button variant="destructive" onClick={() => handleErase('organization')} disabled={eraseStatuses.organization === 'loading'}>
                                    {eraseStatuses.organization === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                                    Erase Organization Profile
                                </Button>
                                <Button onClick={() => handleSeed('organization')} disabled={statuses.organization === 'loading'}>
                                    {statuses.organization === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Seed Organization Profile
                                </Button>
                             </div>
                        </div>
                    </div>
                    
                    {/* App Settings */}
                    <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><Settings className="h-5 w-5 text-primary" />Application Settings</h3>
                                <p className="text-sm text-muted-foreground mt-1">Seeds default configurations for lead purposes, user fields, and dashboard visibility. **Run this before creating leads.**</p>
                             </div>
                             <div className="flex items-center gap-2">
                                <Button variant="destructive" onClick={() => handleErase('appSettings')} disabled={eraseStatuses.appSettings === 'loading'}>
                                    {eraseStatuses.appSettings === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                                    Erase & Reset
                                </Button>
                                <Button onClick={() => handleSeed('appSettings')} disabled={statuses.appSettings === 'loading'}>
                                    {statuses.appSettings === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Seed App Settings
                                </Button>
                            </div>
                        </div>
                    </div>

                     {/* Core Team */}
                     <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" />Core Team Members</h3>
                                <p className="text-sm text-muted-foreground mt-1">Seeds the user accounts for the organization's Founders, Co-Founders, and other Admins.</p>
                             </div>
                             <div className="flex items-center gap-2">
                                 <Button variant="destructive" onClick={() => handleErase('coreTeam')} disabled={eraseStatuses.coreTeam === 'loading'}>
                                    {eraseStatuses.coreTeam === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                                    Erase Core Team
                                </Button>
                                <Button onClick={() => handleSeed('coreTeam')} disabled={statuses.coreTeam === 'loading'}>
                                    {statuses.coreTeam === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Seed Core Team
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Payment Gateways */}
                     <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />Payment Gateways</h3>
                                <p className="text-sm text-muted-foreground mt-1">Seeds placeholder credentials for the Razorpay payment gateway to enable online donations in test mode.</p>
                             </div>
                             <div className="flex items-center gap-2">
                                 <Button variant="destructive" onClick={() => handleErase('paymentGateways')} disabled={eraseStatuses.paymentGateways === 'loading'}>
                                    {eraseStatuses.paymentGateways === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                                    Erase Gateways
                                </Button>
                                <Button onClick={() => handleSeed('paymentGateways')} disabled={statuses.paymentGateways === 'loading'}>
                                    {statuses.paymentGateways === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Seed Gateways
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Sync Users to Firebase Auth */}
                    <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><Fingerprint className="h-5 w-5 text-primary" />Sync Users to Firebase Auth</h3>
                                <p className="text-sm text-muted-foreground mt-1">Creates records in Firebase Authentication for users in your database, enabling them for OTP login. This can be run at any time.</p>
                             </div>
                             <div className="flex items-center gap-2">
                                 <Button variant="destructive" onClick={() => handleErase('syncFirebaseAuth')} disabled={eraseStatuses.syncFirebaseAuth === 'loading'}>
                                    {eraseStatuses.syncFirebaseAuth === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                                    Erase All Auth Users
                                </Button>
                                <Button onClick={() => handleSeed('syncFirebaseAuth')} disabled={statuses.syncFirebaseAuth === 'loading'}>
                                    {statuses.syncFirebaseAuth === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Sync Users
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Sample Data */}
                     <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                             <div>
                                <h3 className="font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Sample Campaigns &amp; Leads</h3>
                                <p className="text-sm text-muted-foreground mt-1">Creates sample campaigns, beneficiaries, leads, and donations for demonstration purposes.</p>
                             </div>
                             <div className="flex items-center gap-2">
                                 <Button variant="destructive" onClick={() => handleErase('sampleData')} disabled={eraseStatuses.sampleData === 'loading'}>
                                    {eraseStatuses.sampleData === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                                    Erase Sample Data
                                </Button>
                                <Button onClick={() => handleSeed('sampleData')} disabled={statuses.sampleData === 'loading'}>
                                    {statuses.sampleData === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Seed Sample Data
                                </Button>
                            </div>
                        </div>
                        
                        <Accordion type="single" collapsible>
                            <AccordionItem value="item-1">
                                <AccordionTrigger>View Details of What Will Be Created</AccordionTrigger>
                                <AccordionContent>
                                    <div className="text-sm text-muted-foreground space-y-4 pt-2">
                                        <p>This action will seed a variety of data to showcase the app&apos;s features, including:</p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li>
                                                <strong>General Historical Leads:</strong> 5 closed cases for various purposes like medical, loans, and education.
                                            </li>
                                            <li>
                                                <strong>Ramadan 2025 Campaign (Completed):</strong>
                                                <ul className="list-circle pl-5 mt-1 space-y-1">
                                                    <li>A ₹1,00,000 business loan lead for &quot;Salim Baig&quot;.</li>
                                                    <li>A ₹60,000 medical lead for a surgical operation.</li>
                                                    <li>10 leads for ₹4,000 ration kits.</li>
                                                    <li>7 leads for a ₹50,000 relief effort (shelter, ration kits).</li>
                                                    <li>20 dummy donors and their Zakat donations to cover the relief effort.</li>
                                                </ul>
                                            </li>
                                            <li>
                                                <strong>Winter Relief 2025 Campaign (Active):</strong> 2 open leads for winter kits.
                                             </li>
                                             <li>
                                                <strong>SIO Flood Relief Campaign 2024 (Active):</strong> A campaign for immediate flood relief efforts.
                                             </li>
                                             <li>
                                                <strong>Ramadan 2026 Campaign (Upcoming):</strong> 2 leads for future ration kits.
                                             </li>
                                        </ul>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </CardContent>
             </Card>
        </div>
    );
}