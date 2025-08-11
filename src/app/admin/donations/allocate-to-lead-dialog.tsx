
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
import type { Donation, Lead } from "@/services/types";
import { handleAllocateDonation } from "./actions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface AllocateToLeadDialogProps {
    donation: Donation;
    allLeads: Lead[];
    onAllocation: () => void;
}

export function AllocateToLeadDialog({ donation, allLeads, onAllocation }: AllocateToLeadDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const [adminUserId, setAdminUserId] = useState<string | null>(null);
    
    useEffect(() => {
        if(open) {
             const storedUserId = localStorage.getItem('userId');
             setAdminUserId(storedUserId);
        }
    }, [open]);
    
    // Filter for leads that are still open for funding
    const openLeads = allLeads.filter(lead => lead.status !== 'Closed' && lead.status !== 'Cancelled');
    
    const handleAllocate = async () => {
        if (!selectedLeadId) {
            toast({ variant: 'destructive', title: "No lead selected." });
            return;
        }
        if (!adminUserId) {
            toast({ variant: 'destructive', title: "Error", description: "Could not identify administrator. Please log in again."});
            return;
        }

        setIsSubmitting(true);
        const result = await handleAllocateDonation(donation.id!, 'lead', selectedLeadId, adminUserId);
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
                    Allocate to Lead
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Allocate Donation to Lead</DialogTitle>
                    <DialogDescription>
                        Link this donation of <span className="font-bold">₹{donation.amount.toLocaleString()}</span> from <span className="font-bold">{donation.donorName}</span> to a specific help request.
                    </DialogDescription>
                </DialogHeader>
                 <Command>
                    <CommandInput placeholder="Search by name, ID, status, or purpose..." />
                    <CommandList>
                        <CommandEmpty>No open leads found.</CommandEmpty>
                        <CommandGroup>
                        {openLeads.map((lead) => {
                            const pendingAmount = lead.helpRequested - lead.helpGiven;
                            const raisedAmount = lead.helpGiven;
                            const progress = lead.helpRequested > 0 ? (raisedAmount / lead.helpRequested) * 100 : 0;
                            return (
                            <CommandItem
                                key={lead.id}
                                value={`${lead.id} ${lead.name} ${lead.purpose} ${lead.category} ${lead.status}`}
                                onSelect={() => setSelectedLeadId(lead.id)}
                                className="flex justify-between items-start cursor-pointer"
                            >
                                <div className="space-y-2 w-full">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{lead.name}</p>
                                            <p className="font-mono text-xs text-muted-foreground">{lead.id}</p>
                                        </div>
                                         <Badge variant={lead.status === 'Ready For Help' || lead.status === 'Publish' ? 'default' : 'secondary'}>{lead.status}</Badge>
                                    </div>
                                    <div className="space-y-2 text-sm pt-2">
                                        <div className="text-muted-foreground">Purpose: <span className="font-medium text-foreground">{lead.purpose}</span></div>
                                        <div>
                                             <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                <span>Raised: <span className="font-semibold text-foreground">₹{raisedAmount.toLocaleString()}</span> / ₹{lead.helpRequested.toLocaleString()}</span>
                                                <span className="font-semibold">Pending: ₹{pendingAmount.toLocaleString()}</span>
                                            </div>
                                            <Progress value={progress} />
                                        </div>
                                    </div>
                                </div>

                                {selectedLeadId === lead.id && <Check className="ml-4 h-5 w-5 text-primary flex-shrink-0" />}
                            </CommandItem>
                        )})}
                        </CommandGroup>
                    </CommandList>
                </Command>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleAllocate} disabled={isSubmitting || !selectedLeadId}>
                         {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Allocate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
