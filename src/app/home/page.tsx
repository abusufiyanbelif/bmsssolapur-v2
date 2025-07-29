

// In a real app, this would be a server component fetching data for the logged-in user.
// For now, we'll keep it as a client component and simulate the data fetching.
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, HandHeart, FileText, Loader2, AlertCircle } from "lucide-react";
import { getDonationsByUserId, Donation } from "@/services/donation-service";
import { getLeadsByBeneficiaryId, Lead } from "@/services/lead-service";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


// Mock user data - in a real app, this would come from an auth context.
const mockUser = {
  id: "user_placeholder_id_12345",
  name: "Aisha Khan",
  activeRole: "Donor", // Can be 'Donor' or 'Beneficiary' to test different views
};
const mockBeneficiaryId = "beneficiary_user_placeholder_id";

export default function UserHomePage() {
  const [user, setUser] = useState(mockUser); // This would be replaced by auth context
  const [donations, setDonations] = useState<Donation[]>([]);
  const [cases, setCases] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (user.activeRole === 'Donor') {
          const donorDonations = await getDonationsByUserId(user.id);
          setDonations(donorDonations.slice(0, 3)); // Get latest 3
        } else if (user.activeRole === 'Beneficiary') {
          // Note: Using a different ID for beneficiary for demonstration
          const beneficiaryCases = await getLeadsByBeneficiaryId(mockBeneficiaryId);
          setCases(beneficiaryCases.slice(0, 3)); // Get latest 3
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
        setError(`Failed to load dashboard data: ${errorMessage}`);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.activeRole, user.id]);

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin" /></div>;
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
    if (user.activeRole === 'Donor') {
      return <DonorDashboard donations={donations} />;
    }
    if (user.activeRole === 'Beneficiary') {
      return <BeneficiaryDashboard cases={cases} />;
    }
    return null;
  };
  
  return (
    <div className="flex-1 space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Welcome, {user.name}!</h2>
        <p className="text-muted-foreground">
          You are currently viewing the dashboard as a <span className="font-semibold text-primary">{user.activeRole}</span>.
        </p>
      </div>
      {renderContent()}
    </div>
  );
}


function DonorDashboard({ donations }: { donations: Donation[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HandHeart className="text-primary" />
          Recent Donations
        </CardTitle>
        <CardDescription>
          Here are your latest contributions. Thank you for your support!
        </CardDescription>
      </CardHeader>
      <CardContent>
        {donations.length > 0 ? (
          <ul className="space-y-4">
            {donations.map(d => (
              <li key={d.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-semibold">₹{d.amount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">To: {d.purpose || d.type}</p>
                </div>
                <div className="text-right">
                    <Badge variant={d.status === 'Verified' ? 'default' : 'secondary'}>{d.status}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{format(d.createdAt.toDate(), "dd MMM yyyy")}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-center py-4">No recent donations found.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/my-donations">
            View All My Donations <ArrowRight className="ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function BeneficiaryDashboard({ cases }: { cases: Lead[] }) {
    return (
     <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="text-primary" />
          Recent Cases
        </CardTitle>
        <CardDescription>
          Here is the latest status of your help requests.
        </CardDescription>
      </CardHeader>
      <CardContent>
         {cases.length > 0 ? (
          <ul className="space-y-4">
            {cases.map(c => (
              <li key={c.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-semibold">For: {c.category}</p>
                  <p className="text-sm text-muted-foreground">Requested: ₹{c.helpRequested.toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <Badge variant={c.status === 'Closed' ? 'default' : 'secondary'}>{c.status}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{format(c.createdAt.toDate(), "dd MMM yyyy")}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-center py-4">No recent cases found.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/my-cases">
            View All My Cases <ArrowRight className="ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
    )
}

    