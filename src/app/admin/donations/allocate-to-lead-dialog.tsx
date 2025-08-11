
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
import { Loader2, Link2, Check, AlertTriangle, PlusCircle, MinusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Donation, Lead } from "@/services/types";
import { handleAllocateDonation } from "./actions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle } from "@/components/ui/alert";

interface AllocateToLeadDialogProps {
    donation: Donation;
    allLeads: Lead[];
    onAllocation: () => void;
}

interface SelectedLead {
    id: string;
    name: string;
    pendingAmount: number;
    amountToAllocate: number;
}

export function AllocateToLeadDialog({ donation, allLeads, onAllocation }: AllocateToLeadDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedLeads, setSelectedLeads] = useState<SelectedLead[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const [adminUserId, setAdminUserId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    useEffect(() => {
        if(open) {
             const storedUserId = localStorage.getItem('userId');
             setAdminUserId(storedUserId);
             // Reset state when dialog opens
             setSelectedLeads([]);
             setSearchTerm('');
        }
    }, [open]);
    
    const openLeads = useMemo(() => {
        return allLeads.filter(lead => 
            lead.status !== 'Closed' && 
            lead.status !== 'Cancelled' &&
            lead.helpGiven < lead.helpRequested
        );
    }, [allLeads]);
    
    const filteredLeads = useMemo(() => {
        if (!searchTerm) return openLeads;
        return openLeads.filter(lead => 
            lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.purpose.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [openLeads, searchTerm]);
    
    const totalAllocated = selectedLeads.reduce((sum, lead) => sum + lead.amountToAllocate, 0);
    const remainingToAllocate = donation.amount - totalAllocated;

    const handleSelectLead = (lead: Lead) => {
        const pendingAmount = lead.helpRequested - lead.helpGiven;
        setSelectedLeads(prev => {
            if (prev.some(l => l.id === lead.id)) {
                return prev.filter(l => l.id !== lead.id); // Deselect
            } else {
                // Add new selection
                return [...prev, {
                    id: lead.id,
                    name: lead.name,
                    pendingAmount: pendingAmount,
                    amountToAllocate: 0
                }];
            }
        });
    };
    
    const handleAmountChange = (leadId: string, newAmount: number) => {
        const lead = selectedLeads.find(l => l.id === leadId);
        if (!lead) return;

        const clampedAmount = Math.max(0, Math.min(newAmount, lead.pendingAmount, donation.amount));

        setSelectedLeads(prev => 
            prev.map(l => l.id === leadId ? { ...l, amountToAllocate: clampedAmount } : l)
        );
    };
    
    const handleAllocate = async () => {
        if (selectedLeads.length === 0) {
            toast({ variant: 'destructive', title: "No leads selected." });
            return;
        }
        if (!adminUserId) {
            toast({ variant: 'destructive', title: "Error", description: "Could not identify administrator. Please log in again."});
            return;
        }
        if (totalAllocated > donation.amount) {
            toast({ variant: 'destructive', title: "Error", description: "Total allocated amount cannot exceed donation amount." });
            return;
        }
        if (totalAllocated <= 0) {
            toast({ variant: 'destructive', title: "Error", description: "Please allocate a positive amount to at least one lead." });
            return;
        }
        
        const validAllocations = selectedLeads
            .filter(l => l.amountToAllocate > 0)
            .map(l => ({ leadId: l.id, amount: l.amountToAllocate }));

        setIsSubmitting(true);
        const result = await handleAllocateDonation(donation.id!, validAllocations, adminUserId);
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
                    Allocate to Lead(s)
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Allocate Donation to Leads</DialogTitle>
                    <DialogDescription>
                        Select one or more leads to allocate this donation of <span className="font-bold">₹{donation.amount.toLocaleString()}</span> from <span className="font-bold">{donation.donorName}</span>.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Lead Selection */}
                    <div className="space-y-4">
                        <Input 
                            placeholder="Search by name, ID, or purpose..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                         <ScrollArea className="h-96 border rounded-lg">
                            <div className="p-2 space-y-1">
                                {filteredLeads.length > 0 ? filteredLeads.map((lead) => {
                                    const isSelected = selectedLeads.some(l => l.id === lead.id);
                                    return (
                                        <div 
                                            key={lead.id}
                                            className={cn("p-2 rounded-md cursor-pointer flex items-center gap-4", isSelected ? "bg-primary/10" : "hover:bg-muted/50")}
                                            onClick={() => handleSelectLead(lead)}
                                        >
                                            <div className="flex-grow">
                                                <p className="font-semibold">{lead.name}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{lead.id}</p>
                                            </div>
                                            {isSelected && <Check className="h-5 w-5 text-primary" />}
                                        </div>
                                    )
                                }) : <p className="text-center text-sm text-muted-foreground p-4">No open leads found.</p>}
                            </div>
                         </ScrollArea>
                    </div>

                    {/* Right Column: Allocation Details */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Selected Leads for Allocation</h3>
                        <ScrollArea className="h-96 border rounded-lg">
                            <div className="p-4 space-y-4">
                                {selectedLeads.length > 0 ? selectedLeads.map(lead => (
                                    <div key={lead.id} className="p-3 border rounded-md space-y-2 relative">
                                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => handleSelectLead({id: lead.id} as Lead)}>
                                            <MinusCircle className="h-4 w-4 text-destructive" />
                                        </Button>
                                        <p className="font-medium pr-8">{lead.name}</p>
                                        <p className="text-xs text-muted-foreground">Pending: ₹{lead.pendingAmount.toLocaleString()}</p>
                                        <div>
                                            <Label htmlFor={`amount-${lead.id}`} className="text-xs">Amount to Allocate</Label>
                                            <Input
                                                id={`amount-${lead.id}`}
                                                type="number"
                                                value={lead.amountToAllocate}
                                                onChange={(e) => handleAmountChange(lead.id, Number(e.target.value))}
                                                max={Math.min(lead.pendingAmount, donation.amount)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                )) : <p className="text-center text-sm text-muted-foreground p-4">Select leads from the left to allocate funds.</p>}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center gap-4">
                    <Alert className={cn(
                        "text-left",
                        remainingToAllocate < 0 ? "border-destructive text-destructive" : "border-primary/50"
                    )}>
                        <AlertTriangle className={cn("h-4 w-4", remainingToAllocate < 0 ? "!text-destructive" : "!text-primary")} />
                        <AlertTitle className="text-lg font-bold">
                            ₹{remainingToAllocate.toLocaleString()}
                        </AlertTitle>
                        <DialogDescription>
                            Remaining to allocate from this donation.
                        </DialogDescription>
                    </Alert>
                    <div className="flex gap-2">
                         <DialogClose asChild>
                            <Button variant="ghost">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleAllocate} disabled={isSubmitting || selectedLeads.length === 0 || totalAllocated <= 0 || totalAllocated > donation.amount}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Allocate ₹{totalAllocated.toLocaleString()}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
