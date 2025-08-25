
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HandCoins, Target, Scale, IndianRupee, ScanLine, Pencil, Users } from "lucide-react";
import type { Donation, Campaign } from "@/services/types";

interface FinancialPerformanceCardsProps {
    allDonations: Donation[];
    allCampaigns: Campaign[];
}

export function FinancialPerformanceCards({ allDonations, allCampaigns }: FinancialPerformanceCardsProps) {
    const {
        totalRaised,
        totalGoal,
        fundingProgress,
        totalDonationsYTD,
        averageDonationSize,
        manualDonations,
        seededDonations
    } = useMemo(() => {
        const verifiedDonations = allDonations.filter(d => d.status === 'Verified' || d.status === 'Allocated');
        
        const totalRaised = verifiedDonations.reduce((sum, d) => sum + d.amount, 0);
        const totalGoal = allCampaigns.reduce((sum, c) => sum + c.goal, 0);
        const fundingProgress = totalGoal > 0 ? (totalRaised / totalGoal) * 100 : 0;
        
        const currentYear = new Date().getFullYear();
        const ytdDonations = verifiedDonations.filter(d => (d.donationDate as Date).getFullYear() === currentYear);
        const totalDonationsYTD = ytdDonations.reduce((sum, d) => sum + d.amount, 0);
        
        const averageDonationSize = verifiedDonations.length > 0 ? totalRaised / verifiedDonations.length : 0;

        const manualDonations = verifiedDonations.filter(d => d.source === 'Manual Entry').length;
        const seededDonations = verifiedDonations.filter(d => d.source === 'Seeded').length;
        
        return { totalRaised, totalGoal, fundingProgress, totalDonationsYTD, averageDonationSize, manualDonations, seededDonations };
    }, [allDonations, allCampaigns]);

    const financialMetrics = [
        {
            title: "Total Raised vs. Goal",
            icon: Target,
            content: (
                <div>
                    <p className="text-2xl font-bold">₹{totalRaised.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                        of ₹{totalGoal.toLocaleString()} goal
                    </p>
                    <Progress value={fundingProgress} className="mt-2 h-2" />
                </div>
            )
        },
        {
            title: "Total Donations (YTD)",
            icon: HandCoins,
            content: (
                <p className="text-3xl font-bold">₹{totalDonationsYTD.toLocaleString()}</p>
            )
        },
        {
            title: "Average Donation Size",
            icon: Scale,
            content: (
                 <p className="text-3xl font-bold">₹{averageDonationSize.toFixed(2)}</p>
            )
        },
         {
            title: "Donations by Channel",
            icon: ScanLine,
            content: (
                <div className="text-sm space-y-2">
                    <div className="flex justify-between items-center"><Pencil className="mr-2 h-4 w-4 text-muted-foreground"/><span>Manual Entry</span><Badge variant="secondary">{manualDonations}</Badge></div>
                    <div className="flex justify-between items-center"><Users className="mr-2 h-4 w-4 text-muted-foreground"/><span>Seeded Data</span><Badge variant="secondary">{seededDonations}</Badge></div>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4">
             <h3 className="text-xl font-bold tracking-tight font-headline">Fundraising & Financial Performance</h3>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {financialMetrics.map(metric => (
                    <Card key={metric.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                            <metric.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {metric.content}
                        </CardContent>
                    </Card>
                ))}
             </div>
        </div>
    );
}
