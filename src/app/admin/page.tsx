

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Users, PiggyBank, Send, TrendingUp, TrendingDown, Hourglass, CheckCircle, HandCoins, AlertTriangle, ArrowRight, Award, UserCheck, HeartHandshake, Baby, PersonStanding, HomeIcon, Wheat, Gift, Building, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllDonations, DonationType } from "@/services/donation-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllUsers } from "@/services/user-service";
import Link from "next/link";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DonationsChart } from "./donations-chart";

export default async function DashboardPage() {

  const [allDonations, allLeads, allUsers] = await Promise.all([
    getAllDonations(),
    getAllLeads(),
    getAllUsers(),
  ]);

  const totalRaised = allDonations.reduce((acc, d) => (d.status === 'Verified' || d.status === 'Allocated') ? acc + d.amount : acc, 0);
  const totalDistributed = allLeads.reduce((acc, l) => acc + l.helpGiven, 0);
  const pendingToDisburse = Math.max(0, totalRaised - totalDistributed);
  
  const helpedBeneficiaryIds = new Set(allLeads.map(l => l.beneficiaryId));
  const helpedBeneficiaries = allUsers.filter(u => helpedBeneficiaryIds.has(u.id!));
  
  const beneficiariesHelpedCount = helpedBeneficiaries.length;
  const adultsHelpedCount = helpedBeneficiaries.filter(u => u.beneficiaryType === 'Adult').length;
  const kidsHelpedCount = helpedBeneficiaries.filter(u => u.beneficiaryType === 'Kid').length;
  const familiesHelpedCount = helpedBeneficiaries.filter(u => u.beneficiaryType === 'Family').length;
  const widowsHelpedCount = helpedBeneficiaries.filter(u => u.isWidow).length;
  
  const casesClosed = allLeads.filter(l => l.status === 'Closed').length;
  const casesPending = allLeads.filter(l => l.status === 'Pending' || l.status === 'Partial').length;

  const pendingVerificationLeads = allLeads
    .filter(lead => lead.verifiedStatus === 'Pending')
    .sort((a, b) => a.dateCreated.toMillis() - b.dateCreated.toMillis());
    
  const donationsByDonor = allDonations
    .filter(d => (d.status === 'Verified' || d.status === 'Allocated') && !d.isAnonymous)
    .reduce((acc, donation) => {
        if (!acc[donation.donorName]) {
            acc[donation.donorName] = { total: 0, count: 0, id: donation.donorId };
        }
        acc[donation.donorName].total += donation.amount;
        acc[donation.donorName].count += 1;
        return acc;
    }, {} as Record<string, { total: number, count: number, id: string }>);

  const topDonors = Object.entries(donationsByDonor)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const mainMetrics = [
    {
      title: "Total Verified Funds",
      value: `₹${totalRaised.toLocaleString()}`,
      icon: TrendingUp,
      description: "Total verified donations received.",
      href: "/admin/donations?status=Verified",
    },
    {
      title: "Total Distributed",
      value: `₹${totalDistributed.toLocaleString()}`,
      icon: HandCoins,
      description: "Total funds given to leads.",
      href: "/admin/leads",
    },
     {
      title: "Total Funds in Hand",
      value: `₹${pendingToDisburse.toLocaleString()}`,
      icon: PiggyBank,
      description: "Verified funds ready to be disbursed.",
      href: "/admin/donations",
    },
     {
      title: "Cases Closed",
      value: casesClosed.toString(),
      icon: CheckCircle,
      description: "Total leads successfully completed.",
      href: "/admin/leads?status=Closed",
    },
     {
      title: "Cases Pending",
      value: casesPending.toString(),
      icon: Hourglass,
      description: "Leads currently open for funding.",
      href: "/admin/leads?status=Pending",
    },
     {
      title: "Beneficiaries Helped",
      value: beneficiariesHelpedCount.toString(),
      icon: Users,
      description: "Total unique beneficiaries supported.",
      href: "/admin/beneficiaries",
    },
  ];
  
  const donationTypeBreakdown = allDonations
    .filter(d => d.status === 'Verified' || d.status === 'Allocated')
    .reduce((acc, donation) => {
      const type = donation.type;
      if (!acc[type]) {
        acc[type] = { total: 0, count: 0 };
      }
      acc[type].total += donation.amount;
      acc[type].count += 1;
      return acc;
    }, {} as Record<DonationType, { total: number, count: number }>);

  const donationTypeIcons: Record<DonationType, React.ElementType> = {
    'Zakat': HandCoins,
    'Sadaqah': Gift,
    'Fitr': Wheat,
    'Lillah': Building,
    'Kaffarah': Shield,
    'Split': DollarSign
  }


  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Dashboard</h2>
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mainMetrics.map((metric) => (
              <Link href={metric.href} key={metric.title}>
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                    <metric.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                    </CardContent>
                </Card>
              </Link>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
           <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-destructive">
                    <AlertTriangle />
                    Action Required: Pending Verifications
                </CardTitle>
                <CardDescription>
                    These leads are awaiting verification from an administrator before they can be funded.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {pendingVerificationLeads.length > 0 ? (
                    <div className="space-y-4">
                        {pendingVerificationLeads.slice(0, 5).map(lead => (
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
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline">
                        <Users />
                        Beneficiaries Breakdown
                    </CardTitle>
                    <CardDescription>
                        A breakdown of the different types of beneficiaries supported.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Link href="/admin/leads?beneficiaryType=Family">
                        <div className="p-3 border rounded-lg flex items-center gap-4 hover:bg-muted transition-colors">
                            <HomeIcon className="h-6 w-6 text-primary" />
                            <div>
                                <p className="font-bold text-lg">{familiesHelpedCount}</p>
                                <p className="text-xs text-muted-foreground">Families Helped</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/admin/leads?beneficiaryType=Adult">
                        <div className="p-3 border rounded-lg flex items-center gap-4 hover:bg-muted transition-colors">
                            <PersonStanding className="h-6 w-6 text-primary" />
                            <div>
                                <p className="font-bold text-lg">{adultsHelpedCount}</p>
                                <p className="text-xs text-muted-foreground">Adults Helped</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/admin/leads?beneficiaryType=Kid">
                        <div className="p-3 border rounded-lg flex items-center gap-4 hover:bg-muted transition-colors">
                            <Baby className="h-6 w-6 text-primary" />
                            <div>
                                <p className="font-bold text-lg">{kidsHelpedCount}</p>
                                <p className="text-xs text-muted-foreground">Kids Helped</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="/admin/leads?beneficiaryType=Widow">
                        <div className="p-3 border rounded-lg flex items-center gap-4 hover:bg-muted transition-colors">
                            <HeartHandshake className="h-6 w-6 text-primary" />
                            <div>
                                <p className="font-bold text-lg">{widowsHelpedCount}</p>
                                <p className="text-xs text-muted-foreground">Widows Helped</p>
                            </div>
                        </div>
                    </Link>
                </CardContent>
            </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
           <DonationsChart donations={allDonations} />
          <Card className="col-span-4 md:col-span-3">
            <CardHeader>
              <CardTitle className="font-headline">Top Donors</CardTitle>
                 <CardDescription>
                    Our most generous supporters. Thank you for your contributions!
                </CardDescription>
            </CardHeader>
            <CardContent>
              {topDonors.length > 0 ? (
                    <div className="space-y-4">
                        {topDonors.map(donor => (
                             <div key={donor.id} className="flex items-center rounded-lg border p-4">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={`https://placehold.co/100x100.png?text=${donor.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}`} alt={donor.name} data-ai-hint="male portrait" />
                                    <AvatarFallback>{donor.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 flex-grow">
                                    <p className="text-sm font-medium leading-none">{donor.name}</p>
                                    <p className="text-sm text-muted-foreground">{donor.count} donations</p>
                                </div>
                                <div className="ml-4 font-semibold text-lg">₹{donor.total.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 h-full flex flex-col items-center justify-center">
                        <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">Awaiting Donations</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Donation data is not yet available.</p>
                    </div>
                )}
            </CardContent>
          </Card>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <DollarSign />
                    Donation Type Breakdown
                </CardTitle>
                <CardDescription>
                    A breakdown of verified funds received by category.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {Object.entries(donationTypeBreakdown).map(([type, data]) => {
                    const Icon = donationTypeIcons[type as DonationType] || DollarSign;
                    return (
                        <Link href={`/admin/donations?type=${type}`} key={type}>
                            <div className="p-4 border rounded-lg flex items-start gap-4 hover:bg-muted transition-colors">
                                <Icon className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-lg">{type}</p>
                                    <p className="text-2xl font-bold text-foreground">₹{data.total.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">{data.count} donations</p>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
