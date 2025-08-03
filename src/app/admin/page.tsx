
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Users, PiggyBank, Send, TrendingUp, TrendingDown, Hourglass, CheckCircle, HandCoins, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllDonations } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";
import Link from "next/link";
import { format } from "date-fns";

export default async function DashboardPage() {

  const allDonations = await getAllDonations();
  const allLeads = await getAllLeads();

  const totalRaised = allDonations.reduce((acc, d) => (d.status === 'Verified' || d.status === 'Allocated') ? acc + d.amount : acc, 0);
  const totalDistributed = allLeads.reduce((acc, l) => acc + l.helpGiven, 0);
  const pendingToDisburse = Math.max(0, totalRaised - totalDistributed);
  const beneficiariesHelped = allLeads.length;
  const casesClosed = allLeads.filter(l => l.status === 'Closed').length;
  const casesPending = allLeads.filter(l => l.status === 'Pending' || l.status === 'Partial').length;

  const pendingVerificationLeads = allLeads
    .filter(lead => lead.verifiedStatus === 'Pending')
    .sort((a, b) => a.dateCreated.toMillis() - b.dateCreated.toMillis());


  const metrics = [
    {
      title: "Total Verified Funds",
      value: `₹${totalRaised.toLocaleString()}`,
      icon: TrendingUp,
      description: "Total verified donations received.",
    },
    {
      title: "Total Distributed",
      value: `₹${totalDistributed.toLocaleString()}`,
      icon: HandCoins,
      description: "Total funds given to leads.",
    },
    {
      title: "Available for Disbursement",
      value: `₹${pendingToDisburse.toLocaleString()}`,
      icon: Hourglass,
      description: "Available funds for distribution.",
    },
    {
      title: "Total Beneficiaries",
      value: `${beneficiariesHelped} leads`,
      icon: Users,
      description: "Total number of cases managed.",
    },
    {
      title: "Cases Fully Closed",
      value: casesClosed.toString(),
      icon: CheckCircle,
      description: "Leads where help is complete.",
    },
    {
      title: "Cases Open",
      value: casesPending.toString(),
      icon: PiggyBank,
      description: "Leads awaiting assistance.",
    },
  ];

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Dashboard</h2>
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-1">
           <Card className="col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-destructive">
                    <AlertTriangle />
                    Action Required
                </CardTitle>
                <CardDescription>
                    These leads are awaiting verification from an administrator before they can be funded.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {pendingVerificationLeads.length > 0 ? (
                    <div className="space-y-4">
                        {pendingVerificationLeads.map(lead => (
                            <div key={lead.id} className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <p className="font-semibold">{lead.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Requested <span className="font-medium text-foreground">₹{lead.helpRequested.toLocaleString()}</span> for {lead.purpose}
                                    </p>
                                     <p className="text-xs text-muted-foreground">
                                        Submitted on {format(lead.dateCreated.toDate(), 'dd MMM, yyyy')}
                                    </p>
                                </div>
                                <Button asChild size="sm">
                                    <Link href={`/admin/leads/${lead.id}`}>
                                        Review <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                        <h3 className="mt-4 text-lg font-medium">All Caught Up!</h3>
                        <p className="mt-1 text-sm text-muted-foreground">There are no pending leads that require verification.</p>
                    </div>
                )}
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
           <Card className="col-span-4">
            <CardHeader>
              <CardTitle className="font-headline">Donations Overview (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <p>Donations chart placeholder</p>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-4 md:col-span-3">
            <CardHeader>
              <CardTitle className="font-headline">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <p>Recent activity feed placeholder</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
