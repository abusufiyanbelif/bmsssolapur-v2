

'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { User, Lead, Campaign, Donation, DonationType } from "@/services/types";
import { HeartHandshake, Baby, PersonStanding, HomeIcon, Users, Megaphone, DollarSign, Wheat, Gift, Building, Shield, UserSearch } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export const BeneficiaryBreakdownCard = ({ allUsers, allLeads, isAdmin = true, isPublicView = false }: { allUsers: User[], allLeads: Lead[], isAdmin?: boolean, isPublicView?: boolean }) => {
    const helpedBeneficiaryIds = new Set(allLeads.filter(l => l.status === 'Closed' || l.status === 'Complete').map(l => l.beneficiaryId));
    const helpedBeneficiaries = allUsers.filter(u => helpedBeneficiaryIds.has(u.id!));
  
    const familiesHelpedCount = helpedBeneficiaries.filter(u => u.beneficiaryType === 'Family').length;
    const adultsHelpedCount = helpedBeneficiaries.filter(u => u.beneficiaryType === 'Adult').length;
    const kidsHelpedCount = helpedBeneficiaries.filter(u => u.beneficiaryType === 'Kid').length;
    const widowsHelpedCount = helpedBeneficiaries.filter(u => u.isWidow).length;
    
    const Wrapper = ({ children, type }: { children: React.ReactNode, type: string }) => {
        if (isPublicView) {
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


export const CampaignBreakdownCard = ({ allCampaigns }: { allCampaigns: Campaign[] }) => {
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
    'Interest': DollarSign,
    'Split': DollarSign,
    'Any': DollarSign,
}

export const DonationTypeCard = ({ donations, isPublicView = false }: { donations: Donation[], isPublicView?: boolean }) => {
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
                    const content = (
                        <div className="p-4 border rounded-lg flex items-start gap-4 hover:bg-muted transition-colors">
                            <Icon className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                            <div>
                                <p className="font-semibold text-lg">{type}</p>
                                <p className="text-2xl font-bold text-foreground">₹{data.total.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">{data.count} donations</p>
                            </div>
                        </div>
                    );

                    if (isPublicView) {
                        return <div key={type}>{content}</div>;
                    }

                    return (
                        <Link href={`/admin/donations?type=${type}`} key={type}>
                           {content}
                        </Link>
                    )
                })}
            </CardContent>
        </Card>
    )
}

export const ReferralSummaryCard = ({ allUsers, allLeads, currentUser }: { allUsers: User[], allLeads: Lead[], currentUser?: User }) => {
    // If a currentUser is passed, we are on the referral's dashboard.
    // Otherwise, we are on the admin dashboard.
    const isReferralView = !!currentUser;

    const referralStats = allUsers
        .filter(u => u.roles.includes('Referral'))
        .map(referral => {
            const referredBeneficiaryIds = allUsers
                .filter(u => u.referredByUserId === referral.id)
                .map(u => u.id!);
            
            const leadsForReferral = allLeads.filter(l => referredBeneficiaryIds.includes(l.beneficiaryId));
            
            const leadCount = leadsForReferral.length;
            const totalRequested = leadsForReferral.reduce((sum, l) => sum + l.helpRequested, 0);

            return {
                ...referral,
                leadCount,
                totalRequested
            }
        })
        .sort((a, b) => b.leadCount - a.leadCount);

    if (isReferralView && currentUser) {
        const myStats = referralStats.find(r => r.id === currentUser.id);
        const myReferredBeneficiariesCount = allUsers.filter(u => u.referredByUserId === currentUser.id).length;
        
        return (
             <Card>
                <CardHeader>
                    <CardTitle>My Referrals Summary</CardTitle>
                    <CardDescription>An overview of the beneficiaries you've introduced to the organization.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="p-4 border rounded-lg"><p className="text-sm font-medium">Beneficiaries Referred</p><p className="text-2xl font-bold">{myReferredBeneficiariesCount}</p></div>
                    <div className="p-4 border rounded-lg"><p className="text-sm font-medium">Total Leads Created</p><p className="text-2xl font-bold">{myStats?.leadCount || 0}</p></div>
                    <div className="p-4 border rounded-lg"><p className="text-sm font-medium">Total Aid Requested</p><p className="text-2xl font-bold">₹{(myStats?.totalRequested || 0).toLocaleString()}</p></div>
                </CardContent>
            </Card>
        )
    }

    // Admin view
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <UserSearch />
                    Top Referrals
                </CardTitle>
                <CardDescription>
                    Users who have referred the most beneficiaries and leads.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {referralStats.slice(0, 3).map(referral => (
                     <div key={referral.id} className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                             <Avatar className="h-10 w-10">
                                <AvatarFallback>{referral.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <Link href={`/admin/user-management/${referral.id}/edit`} className="font-semibold hover:underline">{referral.name}</Link>
                                <p className="text-xs text-muted-foreground">{referral.phone}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="font-bold text-lg">{referral.leadCount} <span className="font-normal text-sm text-muted-foreground">leads</span></p>
                             <p className="text-xs text-muted-foreground">Req: ₹{referral.totalRequested.toLocaleString()}</p>
                        </div>
                    </div>
                ))}
                {referralStats.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No referral data available yet.</p>}
            </CardContent>
             <CardFooter>
                <Link href="/admin/referrals" className="w-full">
                    <Button variant="secondary" className="w-full">View All Referrals</Button>
                </Link>
            </CardFooter>
        </Card>
    );
};
