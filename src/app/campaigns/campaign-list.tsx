

"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { HandHeart, Target } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import type { Campaign } from '@/services/types';
import { cn } from '@/lib/utils';

interface CampaignListProps {
    campaigns: Campaign[];
}

const statusColors: Record<string, string> = {
    "Active": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Upcoming": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
};


export function CampaignList({ campaigns }: CampaignListProps) {
    const router = useRouter();
    
    const handleDonateClick = (campaignId: string) => {
        // You might want to direct them to a campaign-specific donation page in the future.
        // For now, we'll use the generic donation page.
        sessionStorage.setItem('redirectAfterLogin', '/donate');
        router.push('/login');
    }

    if (campaigns.length === 0) {
        return (
            <div className="text-center py-20 bg-muted/50 rounded-lg">
                <Target className="mx-auto h-12 w-12 text-primary" />
                <h3 className="text-xl font-semibold mt-4">No Active Campaigns</h3>
                <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
                    There are no special fundraising campaigns running at the moment. Please check out our general cases that need support.
                </p>
                 <Button className="mt-6" asChild>
                    <a href="/public-leads">View General Cases</a>
                </Button>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => {
                const isUpcoming = campaign.status === 'Upcoming';
                const daysRemaining = formatDistanceToNowStrict(campaign.endDate, { unit: 'day' });
                return (
                    <Card key={campaign.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start gap-4">
                                <CardTitle>{campaign.name}</CardTitle>
                                 <Badge variant="outline" className={cn("capitalize flex-shrink-0", statusColors[campaign.status])}>
                                    {campaign.status}
                                </Badge>
                            </div>
                            <CardDescription>
                                {format(campaign.startDate, 'dd MMM')} - {format(campaign.endDate, 'dd MMM, yyyy')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{campaign.description || "No details provided."}</p>
                            <div className="text-sm">
                                <span className="font-semibold">Goal: ₹{campaign.goal.toLocaleString()}</span>
                            </div>
                        </CardContent>
                        <CardFooter className='flex-col items-start gap-4'>
                            <p className="text-primary font-bold text-center w-full">
                                {isUpcoming ? `Starts in ${formatDistanceToNowStrict(campaign.startDate)}` : `${daysRemaining} remaining`}
                            </p>
                            <Button onClick={() => handleDonateClick(campaign.id!)} className="w-full" disabled={isUpcoming}>
                                <HandHeart className="mr-2 h-4 w-4" />
                                {isUpcoming ? 'Starting Soon' : 'Donate to Campaign'}
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
