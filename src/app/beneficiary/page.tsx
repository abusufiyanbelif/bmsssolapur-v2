
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, HandHeart, FileText, Loader2, AlertCircle, Quote as QuoteIcon, Search, FilterX, Target, ChevronLeft, ChevronRight, Check, Save, FilePlus2, Baby, PersonStanding, HomeIcon, DollarSign, Wheat, Gift, Building, Shield, Banknote, PackageOpen, History, Megaphone, Users as UsersIcon, TrendingUp, CheckCircle, HandCoins, Hourglass, Eye } from "lucide-react";
import { getLeadsByBeneficiaryId } from "@/services/lead-service";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getRandomQuotes } from "@/services/quotes-service";
import type { User, Lead, Quote, LeadStatus, Campaign, Donation } from "@/services/types";
import { getUser } from "@/services/user-service";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BeneficiaryDashboardContent } from './beneficiary-dashboard-content';

export default function BeneficiaryDashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [cases, setCases] = useState<Lead[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            const storedUserId = localStorage.getItem('userId');
            if (!storedUserId) {
                setError("No user session found. Please log in.");
                setLoading(false);
                return;
            }
            
            try {
                const fetchedUser = await getUser(storedUserId);
                if (!fetchedUser || !fetchedUser.roles.includes('Beneficiary')) {
                    setError("You do not have permission to view this page.");
                    setLoading(false);
                    return;
                }
                setUser(fetchedUser);

                const [beneficiaryCases, randomQuotes] = await Promise.all([
                    getLeadsByBeneficiaryId(storedUserId),
                    getRandomQuotes(3),
                ]);
                setCases(beneficiaryCases);
                setQuotes(randomQuotes);

            } catch (e) {
                setError("Failed to load dashboard data.");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

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
      return null;
  }

  return (
    <div className="flex-1 space-y-6">
       <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">
                Beneficiary Dashboard
            </h2>
            <p className="text-muted-foreground">
              Welcome back, {user.name}. Manage your help requests here.
            </p>
        </div>
      <BeneficiaryDashboardContent cases={cases} quotes={quotes} />
    </div>
  );
}
