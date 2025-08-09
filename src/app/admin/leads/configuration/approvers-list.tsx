
"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/services/types";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { handleRemoveApprover } from "./actions";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getAllUsers } from "@/services/user-service";

interface ApproversListProps {
    initialApprovers: User[];
}

export function ApproversList({ initialApprovers }: ApproversListProps) {
    const { toast } = useToast();
    const [approvers, setApprovers] = useState(initialApprovers);

    const onApproverRemoved = async (userId: string) => {
        toast({
            title: "Approver Removed",
            description: "The user has been removed from the Lead Approver group.",
        });
        // Optimistic update
        setApprovers(prev => prev.filter(a => a.id !== userId));
        
        // Or re-fetch from server for consistency
        // const updatedUsers = await getAllUsers();
        // setApprovers(updatedUsers.filter(u => u.groups?.includes('Lead Approver')));
    }
    
    if (approvers.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-4">No users have been assigned as Lead Approvers yet.</p>
        );
    }
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvers.map(approver => {
                const initials = approver.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
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
                                <DeleteConfirmationDialog
                                    itemType="approver"
                                    itemName={approver.name}
                                    onDelete={() => handleRemoveApprover(approver.id!)}
                                    onSuccess={() => onApproverRemoved(approver.id!)}
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

