// src/app/referral/referral-dashboard-content.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, HandHeart, Users, Loader2, AlertCircle, FileText, Quote as QuoteIcon, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { User, Lead, Quote } from "@/services/types";
import { ReferralSummaryCard } from "@/app/admin/dashboard-cards";

function InspirationalQuotes({ quotes, loading }: { quotes: Quote[], loading: boolean }) {
    if (loading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <QuoteIcon />
                        Wisdom & Reflection
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
                </CardContent>
            </Card>
        )
    }

    if (quotes.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <QuoteIcon />
                    Wisdom & Reflection
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {quotes.map((quote, index) => (
                        <blockquote key={index} className="border-l-2 pl-4 italic text-sm text-muted-foreground">
                            <p>&quot;{quote.text}&quot;</p>
                            <cite className="block text-right not-italic text-xs mt-1">— {quote.source}</cite>
                        </blockquote>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

interface ReferralDashboardContentProps {
    user: User | null;
    referredBeneficiaries: User[];
    referredLeads: Lead[];
    quotes: Quote[];
    error?: string;
}

export function ReferralDashboardContent({ user, referredBeneficiaries, referredLeads, quotes, error: initialError }: ReferralDashboardContentProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(initialError || null);

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
    
    if (!user) {
        return <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <div className="flex-1 space-y-6">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">
                    Referral Dashboard
                </h2>
                <p className="text-muted-foreground">
                    Welcome, {user.name}. Manage the beneficiaries you have referred.
                </p>
            </div>
            
            <InspirationalQuotes quotes={quotes} loading={loading} />

            <ReferralSummaryCard 
                allUsers={referredBeneficiaries} 
                allLeads={referredLeads}
                currentUser={user}
            />
            
            <Card>
                 <CardHeader>
                    <div className="flex justify-between items-center">
                         <div>
                            <CardTitle className="text-primary">My Referred Beneficiaries</CardTitle>
                            <CardDescription className="text-muted-foreground">A quick view of your most recently added beneficiaries.</CardDescription>
                         </div>
                         <Button asChild>
                            <Link href="/admin/user-management/add?role=Beneficiary"><PlusCircle className="mr-2 h-4 w-4" />Add Beneficiary</Link>
                         </Button>
                    </div>
                </CardHeader>
                 <CardContent>
                    {referredBeneficiaries.length > 0 ? (
                        <div className="space-y-4">
                            {referredBeneficiaries.slice(0, 5).map(beneficiary => (
                                <div key={beneficiary.id} className="p-4 border rounded-lg flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{beneficiary.name}</p>
                                        <p className="text-sm text-muted-foreground">{beneficiary.phone}</p>
                                        <p className="text-xs text-muted-foreground">Added on {format(beneficiary.createdAt as Date, 'dd MMM yyyy')}</p>
                                    </div>
                                    <Badge variant={beneficiary.isActive ? 'default' : 'destructive'} className={beneficiary.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                        {beneficiary.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-10">
                            <p className="text-muted-foreground">You have not referred any beneficiaries yet.</p>
                             <Button asChild className="mt-4">
                                <Link href="/admin/user-management/add?role=Beneficiary">Add Your First Beneficiary</Link>
                            </Button>
                        </div>
                    )}
                 </CardContent>
                 <CardFooter>
                     <Button asChild className="w-full" variant="secondary">
                        <Link href="/referral/my-beneficiaries">View All My Referrals <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                 </CardFooter>
            </Card>

        </div>
    );
}
