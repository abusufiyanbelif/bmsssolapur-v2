

"use client";

import { getDonation, type Donation } from "@/services/donation-service";
import { notFound, useRouter } from "next/navigation";
import { EditDonationForm } from "./edit-donation-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function EditDonationPage({ params }: { params: { id: string } }) {
    const [donation, setDonation] = useState<Donation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const fetchDonation = async () => {
        setLoading(true);
        try {
            const fetchedDonation = await getDonation(params.id);
            if (fetchedDonation) {
                setDonation(fetchedDonation);
            } else {
                notFound();
            }
        } catch (e) {
            setError("Failed to load donation details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDonation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    if (loading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    if (error || !donation) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error || "Donation not found."}</AlertDescription>
            </Alert>
        );
    }
    
    return (
        <div className="flex-1 space-y-4">
             <Link href="/admin/donations" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Donations
            </Link>
            
            <EditDonationForm donation={donation} onUpdate={fetchDonation} />
        </div>
    );
}
