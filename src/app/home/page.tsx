

// In a real app, this would be a server component fetching data for the logged-in user.
// For now, we'll keep it as a client component and simulate the data fetching.
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, HandHeart, FileText, Loader2, AlertCircle, Quote as QuoteIcon } from "lucide-react";
import { getDonationsByUserId } from "@/services/donation-service";
import { getLeadsByBeneficiaryId } from "@/services/lead-service";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getUser } from "@/services/user-service";
import { getRandomQuotes } from "@/services/quotes-service";
import type { User, Donation, Lead, Quote } from "@/services/types";


export default function UserHomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [cases, setCases] = useState<Lead[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quotesLoading, setQuotesLoading] = useState(false);

  useEffect(() => {
    const initializeUser = async () => {
      setLoading(true);
      const storedUserId = localStorage.getItem('userId');
      const storedRole = localStorage.getItem('activeRole');
      
      if (storedUserId) {
          const fetchedUser = await getUser(storedUserId);
          if (fetchedUser) {
            setUser(fetchedUser);
            const currentRole = storedRole || (fetchedUser.roles ? fetchedUser.roles[0] : null)
            setActiveRole(currentRole);

             try {
                if (currentRole === 'Donor') {
                const donorDonations = await getDonationsByUserId(fetchedUser.id!);
                setDonations(donorDonations.slice(0, 3)); // Get latest 3
                } else if (currentRole === 'Beneficiary') {
                const beneficiaryCases = await getLeadsByBeneficiaryId(fetchedUser.id!);
                setCases(beneficiaryCases.slice(0, 3)); // Get latest 3
                }
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
                setError(`Failed to load dashboard data: ${errorMessage}`);
                console.error(e);
            }

          } else {
             setError("User not found.");
          }
      } else {
          setError("No logged in user found.");
      }
       setLoading(false);
    };
    
    const fetchQuotes = async () => {
        setQuotesLoading(true);
        const randomQuotes = await getRandomQuotes(3);
        setQuotes(randomQuotes);
        setQuotesLoading(false);
    }
    
    // Function to handle role changes from other components
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'activeRole') {
        initializeUser();
      }
    };
    
    // Initial load
    initializeUser();
    fetchQuotes();
    
    // Listen for changes in local storage
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };

  }, []);

  const renderContent = () => {
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
    if (!user || !activeRole) {
       return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Logged In</AlertTitle>
          <AlertDescription>Please log in to view your dashboard.</AlertDescription>
        </Alert>
      );
    }

    let dashboardContent;
    if (activeRole === 'Donor') {
      dashboardContent = <DonorDashboard donations={donations} />;
    } else if (activeRole === 'Beneficiary') {
      dashboardContent = <BeneficiaryDashboard cases={cases} />;
    } else if (['Admin', 'Super Admin', 'Finance Admin'].includes(activeRole)) {
        dashboardContent = (
            <Card>
                <CardHeader>
                    <CardTitle>Admin Dashboard</CardTitle>
                    <CardDescription>Welcome to the admin control panel. Use the navigation menu to manage users, donations, and leads.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/admin">Go to Full Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    } else {
        dashboardContent = <p>You do not have a role that has a default dashboard. Please select a role from your profile.</p>;
    }

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                {dashboardContent}
            </div>
            <div className="lg:col-span-1">
                <InspirationalQuotes quotes={quotes} loading={quotesLoading} />
            </div>
        </div>
    )
  };
  
  return (
    <div className="flex-1 space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">
            Welcome{loading ? '' : `, ${user?.name || 'Guest'}`}!
        </h2>
        <p className="text-muted-foreground">
          {activeRole ? (
            <>You are currently viewing the dashboard as a <span className="font-semibold text-primary">{activeRole}</span>.</>
          ) : (
            "Please log in to continue."
          )}
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

function InspirationalQuotes({ quotes, loading }: { quotes: Quote[], loading: boolean }) {
    if (loading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <QuoteIcon className="text-primary" />
                        Food for Thought
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
                <CardTitle className="flex items-center gap-2">
                    <QuoteIcon className="text-primary" />
                    Food for Thought
                </CardTitle>
                <CardDescription>
                    A little inspiration for your journey.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {quotes.map((quote, index) => (
                        <blockquote key={index} className="border-l-2 pl-4 italic text-sm">
                            <p>"{quote.text}"</p>
                            <cite className="block text-right not-italic text-xs text-muted-foreground mt-1">— {quote.source}</cite>
                        </blockquote>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

    