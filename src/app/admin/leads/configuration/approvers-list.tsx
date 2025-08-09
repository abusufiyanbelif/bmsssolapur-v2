

"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/services/types";
import { MoreHorizontal, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { handleRemoveApprover, handleMakeMandatory, handleMakeOptional } from "./actions";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface ApproversListProps {
    initialApprovers: User[];
    group: 'Mandatory Lead Approver' | 'Lead Approver';
    onUpdate: () => void; // Callback to refresh the parent component
}

export function ApproversList({ initialApprovers, group, onUpdate }: ApproversListProps) {
    const { toast } = useToast();
    
    if (initialApprovers.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-4">No users assigned to this group yet.</p>
        );
    }
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialApprovers.map(approver => {
                const initials = approver.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                const onActionSuccess = (message: string) => {
                    toast({
                        variant: 'success',
                        title: "Success",
                        description: message,
                    });
                    onUpdate();
                }

                return (
                    <div key={approver.id} className="flex items-center justify-between gap-4 p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={`https://placehold.co/100x100.png?text=${initials}`} alt={approver.name} data-ai-hint="male portrait" />
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{approver.name}</p>
                                <p className="text-sm text-muted-foreground">{approver.phone}</p>
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {group === 'Mandatory Lead Approver' ? (
                                    <DropdownMenuItem onSelect={async () => {
                                        const result = await handleMakeOptional(approver.id!);
                                        if (result.success) onActionSuccess(`${approver.name} is now an Optional Approver.`);
                                    }}>
                                        <ArrowDownCircle className="mr-2 h-4 w-4" /> Make Optional
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onSelect={async () => {
                                        const result = await handleMakeMandatory(approver.id!);
                                        if (result.success) onActionSuccess(`${approver.name} is now a Mandatory Approver.`);
                                    }}>
                                        <ArrowUpCircle className="mr-2 h-4 w-4" /> Make Mandatory
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DeleteConfirmationDialog
                                    itemType="approver"
                                    itemName={approver.name}
                                    onDelete={() => handleRemoveApprover(approver.id!, group)}
                                    onSuccess={() => onActionSuccess(`${approver.name} has been removed from the group.`)}
                                >
                                     <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Remove from Group
                                    </DropdownMenuItem>
                                </DeleteConfirmationDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            })}
        </div>
    );
}
