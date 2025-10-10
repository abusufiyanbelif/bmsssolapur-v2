
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Banknote, PlusCircle, Loader2, AlertCircle, Trash2, MoreHorizontal, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { User } from "@/services/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { handleRemoveApprover, handleMakeMandatory, handleMakeOptional } from "@/app/admin/leads/configuration/actions";


const groupMapping: Record<string, string> = {
    'Founder': 'founder',
    'Co-Founder': 'cofounder',
    'Finance': 'finance',
    'Member of Organization': 'members',
};

const MemberCard = ({ member, onRemove }: { member: User; onRemove: (user: User) => void }) => {
    const { toast } = useToast();
    const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const handleRemove = async () => {
        const groupToRemove = member.groups?.find(g => Object.keys(groupMapping).includes(g));
        if (!groupToRemove) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not determine group to remove.' });
            return;
        }
        const result = await handleRemoveApprover(member.id!, groupToRemove);
        if (result.success) {
            toast({
                variant: 'success',
                title: "Member Removed",
                description: `${member.name} has been removed from the board group.`,
            });
            onRemove(member);
        } else {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: result.error || `Failed to remove ${member.name}.`,
            });
        }
    };

    return (
        <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="flex items-center gap-4">
                <Avatar>
                    <AvatarImage src={`https://placehold.co/100x100.png?text=${initials}`} alt={member.name} data-ai-hint="male portrait" />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.phone}</p>
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
                        itemType="board member"
                        itemName={member.name}
                        onDelete={handleRemove}
                    >
                         <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Remove from Group
                        </DropdownMenuItem>
                    </DeleteConfirmationDialog>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

interface BoardManagementClientProps {
    initialUsers: User[];
    error?: string;
}

export function BoardManagementClient({ initialUsers, error: initialError }: BoardManagementClientProps) {
    const [boardMembers, setBoardMembers] = useState<Record<string, User[]>>({ founder: [], cofounder: [], finance: [], members: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(initialError || null);
    const router = useRouter();

    const categorizeMembers = (users: User[]) => {
        const categorizedMembers: Record<string, User[]> = { founder: [], cofounder: [], finance: [], members: [] };
        users.forEach(user => {
            if (user.userId === 'admin') return;
            user.groups?.forEach(group => {
                const category = groupMapping[group];
                if (category) {
                    if (!categorizedMembers[category]) {
                        categorizedMembers[category] = [];
                    }
                    categorizedMembers[category].push(user);
                }
            });
        });
        setBoardMembers(categorizedMembers);
    };

    useEffect(() => {
        categorizeMembers(initialUsers);
        setLoading(false);
    }, [initialUsers]);

    const handleRemoveMember = () => {
        // Refresh the page data from the server to ensure consistency
        router.refresh();
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Loading board members...</p>
                </div>
            );
        }

        if (error) {
            return (
                <Alert variant="destructive" className="my-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Board Members</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            );
        }

        return (
            <div className="space-y-6">
                 {boardMembers.founder.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-primary">Founder</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {boardMembers.founder.map(member => <MemberCard key={member.id} member={member} onRemove={handleRemoveMember} />)}
                        </div>
                    </div>
                )}
                {boardMembers.cofounder.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-primary">Co-Founder</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {boardMembers.cofounder.map(member => <MemberCard key={member.id} member={member} onRemove={handleRemoveMember} />)}
                        </div>
                    </div>
                )}
                {boardMembers.finance.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary"><Banknote className="h-5 w-5" /> Finance</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {boardMembers.finance.map(member => <MemberCard key={member.id} member={member} onRemove={handleRemoveMember} />)}
                        </div>
                    </div>
                )}
                {boardMembers.members.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-primary">Members</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {boardMembers.members.map(member => <MemberCard key={member.id} member={member} onRemove={handleRemoveMember} />)}
                        </div>
                    </div>
                )}
            </div>
        )
    };


    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Board Management</h2>
                 <Button asChild>
                    <Link href="/admin/board-management/add">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Member to Group
                    </Link>
                </Button>
            </div>
            <Card id="board-members">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-primary">
                        <Users className="h-6 w-6" />
                        Our Team
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        The dedicated individuals leading our organization and its mission, organized by groups.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    );
}
