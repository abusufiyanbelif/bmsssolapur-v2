
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { User, Lead, Campaign, Donation, DonationType } from "@/services/types";
import { HeartHandshake, Baby, PersonStanding, HomeIcon, Users, Megaphone, DollarSign, Wheat, Gift, Building, Shield } from "lucide-react";
import { getAllLeads } from "@/services/lead-service";
import { getAllUsers } from "@/services/user-service";
import { getAllCampaigns } from "@/services/campaign-service";
import { getAllDonations } from "@/services/donation-service";

export const BeneficiaryBreakdownCard = async ({ isAdmin = true }: { isAdmin?: boolean }) => {
    const [allUsers, allLeads] = await Promise.all([getAllUsers(), getAllLeads()]);
    const helpedBeneficiaryIds = new Set(allLeads.filter(l => l.status === 'Closed' || l.status === 'Complete').map(l => l.beneficiaryId));
    const helpedBeneficiaries = allUsers.filter(u => helpedBeneficiaryIds.has(u.id!));
  
    const familiesHelpedCount = helpedBeneficiaries.filter(u => u.beneficiaryType === 'Family').length;
    const adultsHelpedCount = helpedBeneficiaries.filter(u => u.beneficiaryType === 'Adult').length;
    const kidsHelpedCount = helpedBeneficiaries.filter(u => u.beneficiaryType === 'Kid').length;
    const widowsHelpedCount = helpedBeneficiaries.filter(u => u.isWidow).length;
    
    const Wrapper = ({ children, type }: { children: React.ReactNode, type: string }) => {
        if (!isAdmin) {
            return <div className="p-4 border rounded-lg flex flex-col items-center justify-center gap-2 h-full">{children}</div>;
        }
        
        const queryParam = type === 'Widow' ? 'isWidow=true' : `type=${type}`;
        return (
            <Link href={`/admin/beneficiaries?${queryParam}`}>
                <div className="p-4 border rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-muted transition-colors h-full">
                    {children}
                </div>
            </Link>
        )
    };
  
    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <Users />
                    Beneficiaries Breakdown
                </CardTitle>
                <CardDescription>
                    A breakdown of the different types of beneficiaries supported.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <Wrapper type="Family">
                    <HomeIcon className="h-8 w-8 text-primary" />
                    <p className="font-bold text-2xl">{familiesHelpedCount}</p>
                    <p className="text-sm text-muted-foreground">Families</p>
                </Wrapper>
                <Wrapper type="Adult">
                    <PersonStanding className="h-8 w-8 text-primary" />
                    <p className="font-bold text-2xl">{adultsHelpedCount}</p>
                    <p className="text-sm text-muted-foreground">Adults</p>
                </Wrapper>
                <Wrapper type="Kid">
                    <Baby className="h-8 w-8 text-primary" />
                    <p className="font-bold text-2xl">{kidsHelpedCount}</p>
                    <p className="text-sm text-muted-foreground">Kids</p>
                </Wrapper>
                <Wrapper type="Widow">
                    <HeartHandshake className="h-8 w-8 text-primary" />
                    <p className="font-bold text-2xl">{widowsHelpedCount}</p>
                    <p className="text-sm text-muted-foreground">Widows</p>
                </Wrapper>
            </CardContent>
        </Card>
    );
};


export const CampaignBreakdownCard = async () => {
    const allCampaigns = await getAllCampaigns();
    const completedCampaignsCount = allCampaigns.filter(c => c.status === 'Completed').length;
    const activeCampaignsCount = allCampaigns.filter(c => c.status === 'Active').length;
    const upcomingCampaignsCount = allCampaigns.filter(c => c.status === 'Upcoming').length;
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <Megaphone />
                    Campaigns Breakdown
                </CardTitle>
                <CardDescription>
                    Status of all fundraising campaigns.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Link href="/admin/campaigns?status=Completed">
                    <div className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted transition-colors">
                        <span className="font-medium">Completed</span>
                        <Badge variant="secondary">{completedCampaignsCount}</Badge>
                    </div>
                </Link>
                <Link href="/admin/campaigns?status=Active">
                    <div className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted transition-colors">
                        <span className="font-medium">Active</span>
                        <Badge variant="secondary">{activeCampaignsCount}</Badge>
                    </div>
                </Link>
                <Link href="/admin/campaigns?status=Upcoming">
                    <div className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted transition-colors">
                        <span className="font-medium">Upcoming</span>
                        <Badge variant="secondary">{upcomingCampaignsCount}</Badge>
                    </div>
                </Link>
            </CardContent>
        </Card>
    );
}

const donationTypeIcons: Record<DonationType, React.ElementType> = {
    'Zakat': HeartHandshake,
    'Sadaqah': Gift,
    'Fitr': Wheat,
    'Lillah': Building,
    'Kaffarah': Shield,
    'Split': DollarSign,
    'Any': DollarSign,
}

export const DonationTypeCard = async () => {
    const donations = await getAllDonations();
     const donationTypeBreakdown = donations
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
        
    return (
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
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
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
    )
}
