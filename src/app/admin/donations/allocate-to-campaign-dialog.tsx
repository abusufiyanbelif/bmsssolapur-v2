
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2, Link2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Donation, Campaign } from "@/services/types";
import { handleAllocateDonation } from "./actions";
import { format } from "date-fns";

interface AllocateToCampaignDialogProps {
    donation: Donation;
    allCampaigns: Campaign[];
    onAllocation: () => void;
}

export function AllocateToCampaignDialog({ donation, allCampaigns, onAllocation }: AllocateToCampaignDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const [adminUserId, setAdminUserId] = useState<string | null>(null);
    
    useEffect(() => {
        if(open) {
             const storedUserId = localStorage.getItem('userId');
             setAdminUserId(storedUserId);
        }
    }, [open]);

    const activeCampaigns = allCampaigns.filter(c => c.status === 'Active' || c.status === 'Upcoming');
    
    const handleAllocate = async () => {
        if (!selectedCampaignId) {
            toast({ variant: 'destructive', title: "No campaign selected." });
            return;
        }
         if (!adminUserId) {
            toast({ variant: 'destructive', title: "Error", description: "Could not identify administrator. Please log in again."});
            return;
        }

        setIsSubmitting(true);
        const result = await handleAllocateDonation(donation.id!, 'campaign', selectedCampaignId, adminUserId);
        if (result.success) {
            onAllocation();
            setOpen(false);
        } else {
            toast({ variant: 'destructive', title: "Allocation Failed", description: result.error });
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                 <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    <Link2 className="mr-2 h-3 w-3" />
                    Allocate to Campaign
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Allocate Donation to Campaign</DialogTitle>
                    <DialogDescription>
                        Link this donation to one of the active campaigns.
                    </DialogDescription>
                </DialogHeader>
                 <Command>
                    <CommandInput placeholder="Search for a campaign..." />
                    <CommandList>
                        <CommandEmpty>No active campaigns found.</CommandEmpty>
                        <CommandGroup>
                        {activeCampaigns.map((campaign) => (
                            <CommandItem
                                key={campaign.id}
                                value={campaign.name}
                                onSelect={() => setSelectedCampaignId(campaign.id!)}
                                className="flex justify-between items-center"
                            >
                                <div>
                                    <p>{campaign.name}</p>
                                    <p className="text-xs text-muted-foreground">{format(campaign.startDate, 'dd MMM')} - {format(campaign.endDate, 'dd MMM yyyy')}</p>
                                </div>
                                {selectedCampaignId === campaign.id && <Check className="h-4 w-4 text-primary" />}
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleAllocate} disabled={isSubmitting || !selectedCampaignId}>
                         {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Allocate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
