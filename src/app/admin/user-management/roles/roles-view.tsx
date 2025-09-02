
"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, UserCog, HandHeart, Users, User, ChevronLeft, ChevronRight, KeySquare, CheckSquare, FileText, UserPlus, Trash2, DollarSign, BarChart2, Download, Settings, Database, Share2, BrainCircuit, Building, Megaphone, UserCheck, Search, Eye, ArrowLeft, Home, FilePlus2, Banknote } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { User as UserType } from "@/services/types";
import { getAllUsers } from "@/services/user-service";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Privilege = {
  name: string;
  description: string;
  icon: React.ElementType;
  roles: Role[];
};

type Role = {
  name: string;
  description: string;
  icon: React.ElementType;
};

const allRoles: Role[] = [
  { name: "Super Admin", description: "Has unrestricted access to all system functionalities, including user management and app settings.", icon: Shield },
  { name: "Admin", description: "Can manage day-to-day operations like handling leads, beneficiaries, and basic user data.", icon: UserCog },
  { name: "Finance Admin", description: "Specifically manages financial records, including verifying and allocating donations.", icon: Banknote },
  { name: "Donor", description: "A registered user who can donate, view their donation history, and manage their profile.", icon: Users },
  { name: "Beneficiary", description: "A registered user who can request help, view their case history, and manage their profile.", icon: User },
  { name: "Referral", description: "A user who can refer potential beneficiaries to the organization.", icon: User },
];

const allPrivileges: Privilege[] = [
    { name: "all", description: "Grants unrestricted access to all features and settings. The ultimate 'master key'.", icon: Shield, roles: [{ name: 'Super Admin', description: '', icon: Shield }] },
    { name: "canManageUsers", description: "Allows creating, editing, deactivating, and deleting all user accounts.", icon: UserCog, roles: [{ name: 'Super Admin', description: '', icon: Shield }] },
    { name: "canManageRolesAndPrivileges", description: "Allows defining or changing user roles and their associated permissions.", icon: KeySquare, roles: [{ name: 'Super Admin', description: '', icon: Shield }] },
    { name: "canViewBoardMembers", description: "Allows viewing the list of board members and their details.", icon: Users, roles: [{ name: 'Super Admin', description: '', icon: Shield }, { name: 'Admin', description: '', icon: UserCog }] },
    { name: "canAddBoardMembers", description: "Allows adding new users to the board member list.", icon: UserPlus, roles: [{ name: 'Super Admin', description: '', icon: Shield }] },
    { name: "canRemoveBoardMembers", description: "Allows removing members from the board.", icon: Trash2, roles: [{ name: 'Super Admin', description: '', icon: Shield }] },
    { name: "canManageOrganizationProfile", description: "Allows editing the organization's public profile, contact, and payment details.", icon: Building, roles: [{ name: 'Super Admin', description: '', icon: Shield }] },
    { name: "canManageCampaigns", description: "Allows creating, editing, and deleting fundraising campaigns.", icon: Megaphone, roles: [{ name: 'Super Admin', description: '', icon: Shield }, { name: 'Admin', description: '', icon: UserCog }] },
    { name: "canAddBeneficiaries", description: "Allows creating new user profiles with the 'Beneficiary' role.", icon: UserPlus, roles: [{ name: 'Super Admin', description: '', icon: Shield }, { name: 'Admin', description: '', icon: UserCog }] },
    { name: "canEditBeneficiaries", description: "Allows editing the profiles of existing beneficiaries.", icon: User, roles: [{ name: 'Super Admin', description: '', icon: Shield }, { name: 'Admin', description: '', icon: UserCog }] },
    { name: "canDeleteBeneficiaries", description: "Allows permanently deleting beneficiary profiles.", icon: Trash2, roles: [{ name: 'Super Admin', description: '', icon: Shield }] },
    { name: "canAddDonors", description: "Allows creating new user profiles with the 'Donor' role.", icon: UserPlus, roles: [{ name: 'Super Admin', description: '', icon: Shield }, { name: 'Admin', description: '', icon: UserCog }] },
    { name: "canEditDonors", description: "Allows editing the profiles of existing donors.", icon: User, roles: [{ name: 'Super Admin', description: '', icon: Shield }, { name: 'Admin', description: '', icon: UserCog }] },
    { name: "canDeleteDonors", description: "Allows permanently deleting donor profiles.", icon: Trash2, roles: [{ name: 'Super Admin', description: '', icon: Shield }] },
    { name: "canManageLeads", description: "Allows creating, editing, and managing all help requests (leads).", icon: FileText, roles: [{ name: 'Super Admin', description: '', icon: Shield }, { name: 'Admin', description: '', icon: UserCog }] },
    { name: "canVerifyLeads", description: "Allows verifying or rejecting the authenticity of a lead.", icon: CheckSquare, roles: [{ name: 'Super Admin', description: '', icon: Shield }, { name: 'Admin', description: '', icon: UserCog }] },
    { name: "canManageDonations", description: "Allows recording, editing, and managing all donation records.", icon: HandHeart, roles: [{ name: 'Super Admin', description: '', icon: Shield }, { name: 'Finance Admin', description: '', icon: Banknote }] },
    { name: "canVerifyDonations", description: "Allows changing a donation's status (e.g., from 'Pending' to 'Verified').", icon: DollarSign, roles: [{ name: 'Super Admin', description: '', icon: Shield }, { name: 'Finance Admin', description: '', icon: Banknote }] },
    { name: "canViewFinancials", description: "Allows viewing financial reports, dashboards, and analytics.", icon: BarChart2, roles: [{ name: 'Super Admin', description: '', icon: Shield }, { name: 'Finance Admin', description: '', icon: Banknote }] },
    { name: "canExportData", description: "Allows exporting data from the system, like donation or user lists.", icon: Download, roles: [{ name: 'Super Admin', description: '', icon: Shield }] },
    { name: "canManageSettings", description: "Allows changing global application settings, like login methods or feature flags.", icon: Settings, roles: [{ name: 'Super Admin', description: '', icon: Shield }] },
    { name: "canSeedDatabase", description: "Allows running the database seeder to populate initial data. This is a destructive action.", icon: Database, roles: [{ name: 'Super Admin', description: '', icon: Shield }] },
    { name: "canViewSystemInternals", description: "Allows viewing developer-oriented pages like Services Summary and Dependency Map.", icon: Share2, roles: [{ name: 'Super Admin', description: '', icon: Shield }] },
    { name: "canManageAIPersonas", description: "Allows creating and managing AI personas for automated communications.", icon: BrainCircuit, roles: [{ name: 'Super Admin', description: '', icon: Shield }] },
    { name: "canManageOwnProfile", description: "Allows a user to edit their own profile information.", icon: UserCog, roles: allRoles },
    { name: "canViewOwnDonations", description: "Allows a donor to see their personal donation history.", icon: HandHeart, roles: [allRoles[3]] }, // Donor
    { name: "canRequestHelp", description: "Allows a beneficiary to submit a new help request.", icon: FilePlus2, roles: [allRoles[4]] }, // Beneficiary
    { name: "canViewOwnCases", description: "Allows a beneficiary to view the status and history of their own cases.", icon: FileText, roles: [allRoles[4]] }, // Beneficiary
];

const PaginationControls = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void, itemsPerPage: number, onItemsPerPageChange: (value: number) => void }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-end pt-4 gap-4">
             <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Rows per page</p>
                <Select
                    value={`${itemsPerPage}`}
                    onValueChange={(value) => onItemsPerPageChange(Number(value))}
                >
                    <SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={itemsPerPage} /></SelectTrigger>
                    <SelectContent side="top">
                        {[5, 10, 20].map(pageSize => <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">Page {currentPage} of {totalPages}</div>
            <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(currentPage - 1, 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" /><span className="sr-only">Previous</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages}>
                    <ChevronRight className="h-4 w-4" /><span className="sr-only">Next</span>
                </Button>
            </div>
        </div>
    );
};

export function RolesView() {
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [allUsers, setAllUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination states
    const [usersCurrentPage, setUsersCurrentPage] = useState(1);
    const [usersItemsPerPage, setUsersItemsPerPage] = useState(5);
    const [privilegesCurrentPage, setPrivilegesCurrentPage] = useState(1);
    const [privilegesItemsPerPage, setPrivilegesItemsPerPage] = useState(5);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const users = await getAllUsers();
                setAllUsers(users);
            } catch(e) {
                setError("Failed to load user data.");
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const usersForSelectedRole = useMemo(() => {
        if (!selectedRole) return [];
        return allUsers.filter(user => user.roles.includes(selectedRole.name as any));
    }, [selectedRole, allUsers]);

    const privilegesForSelectedRole = useMemo(() => {
        if (!selectedRole) return [];
        return allPrivileges.filter(privilege => privilege.roles.some(r => r.name === selectedRole.name));
    }, [selectedRole]);

    // Paginated data
    const paginatedUsers = useMemo(() => {
        const startIndex = (usersCurrentPage - 1) * usersItemsPerPage;
        return usersForSelectedRole.slice(startIndex, startIndex + usersItemsPerPage);
    }, [usersForSelectedRole, usersCurrentPage, usersItemsPerPage]);
    const totalUserPages = Math.ceil(usersForSelectedRole.length / usersItemsPerPage);

    const paginatedPrivileges = useMemo(() => {
        const startIndex = (privilegesCurrentPage - 1) * privilegesItemsPerPage;
        return privilegesForSelectedRole.slice(startIndex, startIndex + privilegesItemsPerPage);
    }, [privilegesForSelectedRole, privilegesCurrentPage, privilegesItemsPerPage]);
    const totalPrivilegePages = Math.ceil(privilegesForSelectedRole.length / privilegesItemsPerPage);


    if (loading) {
        return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    }

    if (selectedRole) {
        return (
            <div className="space-y-6">
                <Button variant="outline" onClick={() => setSelectedRole(null)}><ArrowLeft className="mr-2 h-4 w-4" /> Back to All Roles</Button>
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <selectedRole.icon className="h-10 w-10 text-primary" />
                            <div>
                                <CardTitle className="text-2xl">{selectedRole.name}</CardTitle>
                                <CardDescription>{selectedRole.description}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><KeySquare className="h-5 w-5 text-primary" /> Allocated Privileges ({privilegesForSelectedRole.length})</CardTitle>
                        <CardDescription>The specific permissions granted to the {selectedRole.name} role.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader><TableRow><TableHead>Sr. No.</TableHead><TableHead>Privilege</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {paginatedPrivileges.map((privilege, index) => (
                                    <TableRow key={privilege.name}><TableCell>{(privilegesCurrentPage - 1) * privilegesItemsPerPage + index + 1}</TableCell><TableCell className="font-medium flex items-center gap-2"><privilege.icon className="h-4 w-4 text-accent" />{privilege.name}</TableCell><TableCell className="text-muted-foreground">{privilege.description}</TableCell></TableRow>
                                ))}
                            </TableBody>
                         </Table>
                         <PaginationControls currentPage={privilegesCurrentPage} totalPages={totalPrivilegePages} onPageChange={setPrivilegesCurrentPage} itemsPerPage={privilegesItemsPerPage} onItemsPerPageChange={setPrivilegesItemsPerPage} />
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Users with this Role ({usersForSelectedRole.length})</CardTitle>
                        <CardDescription>All users currently assigned the {selectedRole.name} role.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Sr. No.</TableHead><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {paginatedUsers.map((user, index) => (
                                    <TableRow key={user.id}><TableCell>{(usersCurrentPage - 1) * usersItemsPerPage + index + 1}</TableCell><TableCell className="font-medium">{user.name}</TableCell><TableCell>{user.phone}</TableCell><TableCell><Badge variant="outline" className={cn(user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>{user.isActive ? 'Active' : 'Inactive'}</Badge></TableCell><TableCell className="text-right"><Button asChild variant="outline" size="sm"><Link href={`/admin/user-management/${user.id}/edit`}><Eye className="mr-2 h-4 w-4" />View User</Link></Button></TableCell></TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         <PaginationControls currentPage={usersCurrentPage} totalPages={totalUserPages} onPageChange={setUsersCurrentPage} itemsPerPage={usersItemsPerPage} onItemsPerPageChange={setUsersItemsPerPage} />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">User Roles</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-primary" />
                        Manage User Roles
                    </CardTitle>
                    <CardDescription>
                       Click on a role to view its allocated privileges and assigned users.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Sr. No.</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allRoles.map((role, index) => (
                                <TableRow key={role.name} onClick={() => setSelectedRole(role)} className="cursor-pointer">
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="font-semibold text-primary">
                                        <div className="flex items-center gap-3">
                                            <role.icon className="h-5 w-5" />
                                            {role.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{role.description}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
