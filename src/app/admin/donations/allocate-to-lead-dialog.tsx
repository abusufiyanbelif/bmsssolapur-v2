
"use client";

import { useState } from "react";
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
    
    // Filter for leads that are still open for funding
    const openLeads = allLeads.filter(lead => lead.status !== 'Closed' && lead.status !== 'Cancelled');
    
    const handleAllocate = async () => {
        if (!selectedLeadId) {
            toast({ variant: 'destructive', title: "No lead selected." });
            return;
        }
        setIsSubmitting(true);
        const result = await handleAllocateDonation(donation.id!, 'lead', selectedLeadId);
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Allocate Donation to Lead</DialogTitle>
                    <DialogDescription>
                        Link this donation of <span className="font-bold">₹{donation.amount.toLocaleString()}</span> from <span className="font-bold">{donation.donorName}</span> to a specific help request.
                    </DialogDescription>
                </DialogHeader>
                 <Command>
                    <CommandInput placeholder="Search for a lead by name or ID..." />
                    <CommandList>
                        <CommandEmpty>No open leads found.</CommandEmpty>
                        <CommandGroup>
                        {openLeads.map((lead) => (
                            <CommandItem
                                key={lead.id}
                                value={`${lead.id} ${lead.name} ${lead.purpose} ${lead.category}`}
                                onSelect={() => setSelectedLeadId(lead.id)}
                                className="flex justify-between items-center"
                            >
                                <div className="space-y-1">
                                    <p>{lead.name}</p>
                                    <p className="font-mono text-xs text-muted-foreground">{lead.id}</p>
                                    <p className="text-xs text-muted-foreground">{lead.purpose} - ₹{lead.helpRequested.toLocaleString()}</p>
                                </div>
                                {selectedLeadId === lead.id && <Check className="h-4 w-4 text-primary" />}
                            </CommandItem>
                        ))}
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
