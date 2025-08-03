
"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { EnrichedLead } from './actions';

interface CampaignListProps {
    leads: EnrichedLead[];
}

export function CampaignList({ leads }: CampaignListProps) {
    const router = useRouter();
    
    const handleDonateClick = () => {
        sessionStorage.setItem('redirectAfterLogin', '/campaigns');
        router.push('/login');
    }

    if (leads.length === 0) {
        return (
            <div className="text-center py-20 bg-muted/50 rounded-lg">
                <h3 className="text-xl font-semibold">All Cases Fully Funded!</h3>
                <p className="text-muted-foreground mt-2">
                    Thank you for your generosity. There are no open cases at the moment.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {leads.map((lead) => {
                const progress = lead.helpRequested > 0 ? (lead.helpGiven / lead.helpRequested) * 100 : 100;
                const remainingAmount = lead.helpRequested - lead.helpGiven;
                const displayName = lead.beneficiary?.isAnonymous 
                    ? lead.beneficiary?.anonymousId || "Anonymous Beneficiary"
                    : lead.name;

                return (
                    <Card key={lead.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle>{displayName}</CardTitle>
                            <CardDescription>
                                Seeking help for: <span className="font-semibold">{lead.purpose} {lead.subCategory ? `(${lead.subCategory})` : ''}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{lead.caseDetails || "No details provided."}</p>
                            <Progress value={progress} className="mb-2" />
                            <div className="flex justify-between text-sm">
                                <span className="font-semibold">Raised: ₹{lead.helpGiven.toLocaleString()}</span>
                                <span className="text-muted-foreground">Goal: ₹{lead.helpRequested.toLocaleString()}</span>
                            </div>
                        </CardContent>
                        <CardFooter className='flex-col items-start gap-4'>
                            {remainingAmount > 0 && 
                                <p className="text-primary font-bold text-center w-full">
                                    ₹{remainingAmount.toLocaleString()} still needed
                                </p>
                            }
                            <Button onClick={handleDonateClick} className="w-full">
                                Donate Now
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
