
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Loader2, Link2, Check, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Donation, Lead } from "@/services/types";
import { handleAllocateDonationsToLead } from "./actions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { format } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";

interface AllocateDonationsDialogProps {
    lead: Lead;
    allDonations: Donation[];
}

interface SelectedDonation {
    id: string;
    availableAmount: number;
}

export function AllocateDonationsDialog({ lead, allDonations }: AllocateDonationsDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedDonations, setSelectedDonations] = useState<SelectedDonation[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const [adminUserId, setAdminUserId] = useState<string | null>(null);
    const router = useRouter();
    
    useEffect(() => {
        if(open) {
             const storedUserId = localStorage.getItem('userId');
             setAdminUserId(storedUserId);
             setSelectedDonations([]);
        }
    }, [open]);
    
    const allocatableDonations = useMemo(() => {
        return allDonations.filter(d => 
            (d.status === 'Verified' || d.status === 'Partially Allocated')
        ).map(d => {
            const allocatedAmount = d.allocations?.reduce((sum, alloc) => sum + alloc.amount, 0) || 0;
            return {
                ...d,
                availableAmount: d.amount - allocatedAmount,
            };
        }).filter(d => d.availableAmount > 0);
    }, [allDonations]);

    const totalSelectedToAllocate = selectedDonations.reduce((sum, donation) => sum + donation.availableAmount, 0);
    const neededAmount = lead.helpRequested - lead.helpGiven;
    const finalAllocationAmount = Math.min(totalSelectedToAllocate, neededAmount);

    const handleSelectDonation = (donation: Donation & { availableAmount: number }) => {
        setSelectedDonations(prev => {
            const isSelected = prev.some(d => d.id === donation.id);
            if (isSelected) {
                return prev.filter(d => d.id !== donation.id);
            } else {
                return [...prev, { id: donation.id!, availableAmount: donation.availableAmount }];
            }
        });
    };
    
    const handleAllocate = async () => {
        if (selectedDonations.length === 0) {
            toast({ variant: 'destructive', title: "No donations selected." });
            return;
        }
         if (!adminUserId) {
            toast({ variant: 'destructive', title: "Error", description: "Could not identify administrator. Please log in again."});
            return;
        }
        
        setIsSubmitting(true);
        const result = await handleAllocateDonationsToLead(lead.id, selectedDonations.map(d => d.id), adminUserId);
        if (result.success) {
            toast({ variant: 'success', title: 'Allocation Successful', description: `Successfully allocated funds to ${lead.name}.` });
            router.refresh();
            setOpen(false);
        } else {
            toast({ variant: 'destructive', title: "Allocation Failed", description: result.error });
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Banknote className="mr-2 h-4 w-4" />
                    Allocate Donations
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Allocate Donations to &quot;{lead.name}&quot;</DialogTitle>
                    <DialogDescription>
                        Select one or more available donations to fund this lead. The system will pull funds until the lead&apos;s requirement of <span className="font-bold">₹{neededAmount.toLocaleString()}</span> is met.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                     <ScrollArea className="h-80 border rounded-lg p-2">
                        <div className="space-y-2">
                             {allocatableDonations.length > 0 ? allocatableDonations.map((donation) => {
                                const isSelected = selectedDonations.some(d => d.id === donation.id);
                                return (
                                    <div 
                                        key={donation.id}
                                        className={cn("p-3 rounded-md cursor-pointer flex items-center gap-4", isSelected ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted/50 border")}
                                        onClick={() => handleSelectDonation(donation)}
                                    >
                                        <Checkbox checked={isSelected} onCheckedChange={() => handleSelectDonation(donation)} />
                                        <div className="flex-grow space-y-1">
                                            <p className="font-semibold">{donation.donorName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(donation.donationDate, 'dd MMM yyyy')} &middot; Transaction ID: {donation.transactionId || 'N/A'}
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="flex-shrink-0">
                                            Available: ₹{donation.availableAmount.toLocaleString()}
                                        </Badge>
                                    </div>
                                )
                             }) : <p className="text-center text-sm text-muted-foreground p-4">No donations are currently available for allocation.</p>}
                        </div>
                     </ScrollArea>
                    
                    <Alert>
                        <Banknote className="h-4 w-4" />
                        <AlertTitle>Allocation Summary</AlertTitle>
                        <AlertDescription>
                            You have selected <span className="font-bold">{selectedDonations.length}</span> donation(s) with a total available amount of <span className="font-bold">₹{totalSelectedToAllocate.toLocaleString()}</span>.
                            A total of <span className="font-bold text-primary">₹{finalAllocationAmount.toLocaleString()}</span> will be allocated to this lead.
                        </AlertDescription>
                    </Alert>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleAllocate} disabled={isSubmitting || selectedDonations.length === 0 || finalAllocationAmount <= 0}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Allocate ₹{finalAllocationAmount.toLocaleString()}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
