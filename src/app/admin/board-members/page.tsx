
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Banknote, PlusCircle, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getAllUsers, updateUser } from "@/services/user-service";
import type { User } from "@/services/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";


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
        const newGroups = member.groups?.filter(g => !Object.keys(groupMapping).includes(g));
        try {
            await updateUser(member.id!, { groups: newGroups });
            toast({
                variant: 'success',
                title: "Member Removed",
                description: `${member.name} has been removed from the board.`,
            });
            onRemove(member);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: `Failed to remove ${member.name}.`,
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
            <DeleteConfirmationDialog
                itemType="board member"
                itemName={member.name}
                onDelete={handleRemove}
            >
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DeleteConfirmationDialog>
        </div>
    );
};

export default function BoardMembersPage() {
    const [boardMembers, setBoardMembers] = useState<Record<string, User[]>>({ founder: [], cofounder: [], finance: [], members: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBoardMembers = async () => {
        try {
            setLoading(true);
            const allUsers = await getAllUsers();
            const categorizedMembers: Record<string, User[]> = { founder: [], cofounder: [], finance: [], members: [] };

            allUsers.forEach(user => {
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
        } catch (e) {
            setError("Failed to fetch board members.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoardMembers();
    }, []);

    const handleRemoveMember = (removedUser: User) => {
        // Re-fetch to get the most up-to-date list
        fetchBoardMembers();
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
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            );
        }

        return (
            <div className="space-y-6">
                 {boardMembers.founder.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Founder</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {boardMembers.founder.map(member => <MemberCard key={member.id} member={member} onRemove={handleRemoveMember} />)}
                        </div>
                    </div>
                )}
                {boardMembers.cofounder.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Co-Founder</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {boardMembers.cofounder.map(member => <MemberCard key={member.id} member={member} onRemove={handleRemoveMember} />)}
                        </div>
                    </div>
                )}
                {boardMembers.finance.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Banknote className="h-5 w-5" /> Finance</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {boardMembers.finance.map(member => <MemberCard key={member.id} member={member} onRemove={handleRemoveMember} />)}
                        </div>
                    </div>
                )}
                {boardMembers.members.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Members</h3>
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
                <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Board Members</h2>
                 <Button asChild>
                    <Link href="/admin/board-members/add">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Member
                    </Link>
                </Button>
            </div>
            <Card id="board-members">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Users className="h-6 w-6 text-primary" />
                        Our Team
                    </CardTitle>
                    <CardDescription>
                        The dedicated individuals leading our organization and its mission.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    );
}
