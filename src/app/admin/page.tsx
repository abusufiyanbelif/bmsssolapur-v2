import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, PiggyBank, Send, TrendingUp, TrendingDown, Hourglass, CheckCircle, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllDonations } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";

export default async function DashboardPage() {

  const allDonations = await getAllDonations();
  const allLeads = await getAllLeads();

  const totalRaised = allDonations.reduce((acc, d) => d.status === 'Verified' || d.status === 'Allocated' ? acc + d.amount : acc, 0);
  const totalDistributed = allLeads.reduce((acc, l) => acc + l.helpGiven, 0);
  const pendingToDisburse = totalRaised - totalDistributed;
  const beneficiariesHelped = allLeads.length;
  const casesClosed = allLeads.filter(l => l.status === 'Closed').length;
  const casesPending = allLeads.filter(l => l.status === 'Pending' || l.status === 'Partial').length;

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
        <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
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
