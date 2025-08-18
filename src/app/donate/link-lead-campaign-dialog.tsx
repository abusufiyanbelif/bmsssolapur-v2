
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogProps,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import type { Lead, Campaign } from "@/services/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface LinkLeadCampaignDialogProps extends DialogProps {
    leads: Lead[];
    campaigns: Campaign[];
    onLink: (selection: { leadId?: string, campaignId?: string }) => void;
}

export function LinkLeadCampaignDialog({ open, onOpenChange, leads, campaigns, onLink }: LinkLeadCampaignDialogProps) {
    const [selectedLeadId, setSelectedLeadId] = useState<string | undefined>();
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>();
    const [leadPopoverOpen, setLeadPopoverOpen] = useState(false);
    const [campaignPopoverOpen, setCampaignPopoverOpen] = useState(false);
    
    const handleApply = () => {
        onLink({ leadId: selectedLeadId, campaignId: selectedCampaignId });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Link to a Cause</DialogTitle>
                    <DialogDescription>
                        Optionally, you can direct your donation to a specific lead or campaign.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="leads" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="leads">Link to Lead</TabsTrigger>
                        <TabsTrigger value="campaigns">Link to Campaign</TabsTrigger>
                    </TabsList>
                    <TabsContent value="leads" className="pt-4">
                        <Popover open={leadPopoverOpen} onOpenChange={setLeadPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                className={cn("w-full justify-between", !selectedLeadId && "text-muted-foreground")}
                                >
                                {selectedLeadId ? leads.find(l => l.id === selectedLeadId)?.name : "Select a lead..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search lead..." />
                                    <CommandList>
                                        <CommandEmpty>No open leads found.</CommandEmpty>
                                        <CommandGroup>
                                        {leads.map((lead) => (
                                            <CommandItem
                                            value={`${lead.name} ${lead.id}`}
                                            key={lead.id}
                                            onSelect={() => {
                                                setSelectedLeadId(lead.id!);
                                                setSelectedCampaignId(undefined); // Clear other selection
                                                setLeadPopoverOpen(false);
                                            }}
                                            >
                                            <Check className={cn("mr-2 h-4 w-4", lead.id === selectedLeadId ? "opacity-100" : "opacity-0")} />
                                            <span>{lead.name} (Req: ₹{lead.helpRequested})</span>
                                            </CommandItem>
                                        ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </TabsContent>
                    <TabsContent value="campaigns" className="pt-4">
                        <Popover open={campaignPopoverOpen} onOpenChange={setCampaignPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                className={cn("w-full justify-between", !selectedCampaignId && "text-muted-foreground")}
                                >
                                {selectedCampaignId ? campaigns.find(c => c.id === selectedCampaignId)?.name : "Select a campaign..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search campaign..." />
                                    <CommandList>
                                        <CommandEmpty>No active campaigns found.</CommandEmpty>
                                        <CommandGroup>
                                        {campaigns.map((campaign) => (
                                            <CommandItem
                                            value={campaign.name}
                                            key={campaign.id}
                                            onSelect={() => {
                                                setSelectedCampaignId(campaign.id!);
                                                setSelectedLeadId(undefined); // Clear other selection
                                                setCampaignPopoverOpen(false);
                                            }}
                                            >
                                            <Check className={cn("mr-2 h-4 w-4", campaign.id === selectedCampaignId ? "opacity-100" : "opacity-0")} />
                                            {campaign.name}
                                            </CommandItem>
                                        ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </TabsContent>
                </Tabs>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleApply}>
                        Apply Selection
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
