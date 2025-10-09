
"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { HandHeart, Target, CheckCircle, XCircle, Share2, ImageIcon } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import type { Campaign } from '@/services/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface CampaignWithStats extends Campaign {
    raisedAmount: number;
    fundingProgress: number;
}

interface CampaignListProps {
    campaigns: CampaignWithStats[];
}

const statusColors: Record<string, string> = {
    "Active": "bg-green-500/20 text-green-700 border-green-500/30",
    "Upcoming": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
    "Completed": "bg-blue-500/20 text-blue-700 border-blue-500/30",
    "Cancelled": "bg-red-500/20 text-red-700 border-red-500/30",
};


export function CampaignList({ campaigns }: CampaignListProps) {
    const router = useRouter();
    const { toast } = useToast();
    
    const handleDonateClick = (campaignId: string) => {
        const userId = localStorage.getItem('userId');
        if (userId) {
            router.push(`/donate?campaignId=${campaignId}`);
        } else {
            sessionStorage.setItem('redirectAfterLogin', `/donate?campaignId=${campaignId}`);
            router.push('/login');
        }
    }

    const handleShare = (campaign: CampaignWithStats) => {
        const campaignUrl = `${window.location.origin}/campaigns`;
        const message = `*Support Our Campaign: ${campaign.name}*\n\nWe are raising ₹${campaign.goal.toLocaleString()} to ${campaign.description.toLowerCase()}\n\nPlease contribute and share this message. Every bit helps!\n\nView details here:\n${campaignUrl}`;
        
        if (navigator.share) {
             navigator.share({
                title: `Support Our Campaign: ${campaign.name}`,
                text: message,
                url: campaignUrl,
            }).catch((error) => console.log('Error sharing', error));
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(message);
            toast({
                title: "Copied to Clipboard",
                description: "Campaign message copied! You can now paste it to share.",
            });
        } else {
            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }
    };

    if (campaigns.length === 0) {
        return (
            <div className="text-center py-20 bg-muted/50 rounded-lg">
                <Target className="mx-auto h-12 w-12 text-primary" />
                <h3 className="text-xl font-semibold mt-4">No Campaigns Found</h3>
                <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
                    There are no fundraising campaigns to display at the moment. Please check out our general cases that need support.
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
                const isEnded = campaign.status === 'Completed' || campaign.status === 'Cancelled';
                const daysRemaining = !isEnded && !isUpcoming ? formatDistanceToNowStrict(new Date(campaign.endDate), { unit: 'day' }) : null;
                
                let buttonText = 'Donate to Campaign';
                let buttonIcon = <HandHeart className="mr-2 h-4 w-4" />;
                if (isUpcoming) buttonText = 'Starting Soon';
                if (campaign.status === 'Completed') {
                    buttonText = 'Campaign Ended';
                    buttonIcon = <CheckCircle className="mr-2 h-4 w-4" />;
                }
                if (campaign.status === 'Cancelled') {
                    buttonText = 'Campaign Cancelled';
                    buttonIcon = <XCircle className="mr-2 h-4 w-4" />;
                }
                
                return (
                     <Card key={campaign.id} className="flex flex-col h-full overflow-hidden transition-shadow hover:shadow-lg">
                        <div className="relative h-40 w-full bg-muted/50">
                            {campaign.imageUrl ? (
                                <Image src={campaign.imageUrl} alt={campaign.name} fill className="object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                </div>
                            )}
                             <Badge variant="outline" className={cn("absolute top-2 right-2 capitalize backdrop-blur-sm", statusColors[campaign.status])}>
                                {campaign.status}
                            </Badge>
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                            <CardHeader className="p-0">
                                <CardTitle className="text-lg line-clamp-2 text-primary">{campaign.name}</CardTitle>
                                <CardDescription>{format(new Date(campaign.startDate), 'dd MMM')} - {format(new Date(campaign.endDate), 'dd MMM, yyyy')}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow p-0 pt-4 space-y-4">
                                <p className="text-sm text-muted-foreground line-clamp-3 h-[60px]">{campaign.description || "No details provided."}</p>
                                <div>
                                    <div className="text-xs text-muted-foreground flex justify-between mb-1">
                                        <span>
                                            Raised: <span className="font-semibold text-foreground">₹{campaign.raisedAmount.toLocaleString()}</span>
                                        </span>
                                        <span>
                                            Goal: ₹{campaign.goal.toLocaleString()}
                                        </span>
                                    </div>
                                    <Progress value={campaign.fundingProgress} />
                                </div>
                            </CardContent>
                        </div>
                        <CardFooter className='flex-col items-start gap-4'>
                             {!isEnded && (
                                <p className="text-primary font-bold text-center w-full">
                                    {isUpcoming ? `Starts in ${formatDistanceToNowStrict(new Date(campaign.startDate))}` : `${daysRemaining} remaining`}
                                </p>
                             )}
                            <div className="w-full flex gap-2">
                                <Button onClick={() => handleDonateClick(campaign.id!)} className="w-full" disabled={isUpcoming || isEnded}>
                                    {buttonIcon}
                                    {buttonText}
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => handleShare(campaign)}>
                                    <Share2 className="h-4 w-4" />
                                    <span className="sr-only">Share campaign</span>
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
