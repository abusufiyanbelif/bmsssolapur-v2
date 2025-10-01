

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MainMetricsCard, TopDonorsCard, TopDonationsCard, BeneficiaryBreakdownCard, CampaignBreakdownCard, DonationTypeCard } from "@/app/admin/dashboard-cards";
import { Suspense, useMemo } from "react";
import type { Donation, User, Lead, Campaign } from "@/services/types";
import { RecentCampaignsCard } from "@/app/admin/dashboard-cards";
import { TrendingUp, HandCoins, CheckCircle, Eye, Users } from "lucide-react";
import Link from "next/link";


const CardSkeleton = () => (
    <Card>
        <div className="p-4 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-10 w-full" />
        </div>
    </Card>
);

const TableSkeleton = () => (
    <Card>
        <div className="p-4 space-y-4">
             <Skeleton className="h-6 w-1/4" />
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
        </div>
    </Card>
);

export const PublicMainMetricsCard = ({ allDonations = [], allLeads = [] }: { allDonations: Donation[], allLeads: Lead[] }) => {
    const stats = useMemo(() => {
        const totalRaised = allDonations.reduce((acc, d) => (d.status === 'Verified' || d.status === 'Allocated') ? acc + d.amount : acc, 0);
        const totalDistributed = allLeads.reduce((acc, l) => acc + l.helpGiven, 0);
        const helpedBeneficiaryIds = new Set(allLeads.filter(l => l.helpGiven > 0).map(l => l.beneficiaryId));
        const casesClosed = allLeads.filter(l => l.caseAction === 'Closed').length;
        const casesPublished = allLeads.filter(l => l.caseAction === 'Publish').length;
        
        return {
            totalRaised,
            totalDistributed,
            beneficiariesHelpedCount: helpedBeneficiaryIds.size,
            casesClosed,
            casesPublished,
        };
    }, [allDonations, allLeads]);

    const publicMetrics = [
        { id: "totalRaised", title: "Total Verified Funds", value: `₹${stats.totalRaised.toLocaleString()}`, icon: TrendingUp, href: "/public-leads" },
        { id: "totalDistributed", title: "Total Distributed", value: `₹${stats.totalDistributed.toLocaleString()}`, icon: HandCoins, href: "/public-leads" },
        { id: "casesClosed", title: "Cases Closed", value: stats.casesClosed.toString(), icon: CheckCircle, description: "Total leads successfully completed.", href: "/public-leads" },
        { id: "openLeads", title: "Published Leads", value: stats.casesPublished.toString(), icon: Eye, description: "Cases visible to the public for funding.", href: "/public-leads" },
        { id: "beneficiariesHelped", title: "Beneficiaries Helped", value: stats.beneficiariesHelpedCount.toString(), icon: Users, description: "Total unique beneficiaries supported.", href: "/public-leads" },
    ];
    
     const CardWrapper = ({ children, href, isClickable }: { children: React.ReactNode, href: string, isClickable: boolean }) => {
        if (!isClickable) {
            return <div className="h-full">{children}</div>;
        }
        return <Link href={href}>{children}</Link>;
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {publicMetrics.map((metric) => (
                 <CardWrapper href={metric.href} key={metric.title} isClickable={true}>
                    <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-primary">{metric.title}</CardTitle>
                        <metric.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold">{metric.value}</div>
                        </CardContent>
                    </Card>
                </CardWrapper>
            ))}
        </div>
    )
}

interface PublicDashboardCardsProps {
    allDonations: Donation[];
    allUsers: User[];
    allLeads: Lead[];
    allCampaigns: Campaign[];
}

export function PublicDashboardCards({ allDonations, allUsers, allLeads, allCampaigns }: PublicDashboardCardsProps) {
    
    return (
        <div className="space-y-4">
             <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}>
                <PublicMainMetricsCard allDonations={allDonations} allLeads={allLeads} />
            </Suspense>
            
            <Suspense fallback={<CardSkeleton />}>
                <BeneficiaryBreakdownCard allUsers={allUsers} allLeads={allLeads} isAdmin={false} />
            </Suspense>
            <Suspense fallback={<CardSkeleton />}>
                <DonationTypeCard donations={allDonations} isPublicView={true} />
            </Suspense>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-full lg:col-span-4">
                    <Suspense fallback={<TableSkeleton />}>
                        <TopDonationsCard allDonations={allDonations} isPublicView={true} />
                    </Suspense>
                </div>
                <div className="col-span-full lg:col-span-3">
                    <Suspense fallback={<TableSkeleton />}>
                        <RecentCampaignsCard allCampaigns={allCampaigns} allLeads={allLeads} />
                    </Suspense>
                </div>
            </div>

             <Suspense fallback={<CardSkeleton />}>
                <CampaignBreakdownCard allCampaigns={allCampaigns} />
            </Suspense>
        </div>
    );
}
