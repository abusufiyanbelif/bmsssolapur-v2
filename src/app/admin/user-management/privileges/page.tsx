
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeySquare, Shield, UserCog, HandHeart, Users, User, CheckSquare, FileText, UserPlus, Trash2, DollarSign, BarChart2, Download, Settings, ChevronLeft, ChevronRight, FilePlus2 as RequestHelpIcon, Building, Megaphone, FilterX, Search, Database, Share2, BrainCircuit, ArrowUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Role = {
  name: 'Super Admin' | 'Admin' | 'Finance Admin' | 'Donor' | 'Beneficiary' | 'Referral';
  icon: React.ElementType;
};

type PrivilegeType = 'View' | 'Create' | 'Edit' | 'Delete' | 'Manage' | 'Special';

type Privilege = {
  name: string;
  description: string;
  icon: React.ElementType;
  type: PrivilegeType;
  roles: Role[];
};

const allRoles: Record<string, Role> = {
    'Super Admin': { name: 'Super Admin', icon: Shield },
    'Admin': { name: 'Admin', icon: UserCog },
    'Finance Admin': { name: 'Finance Admin', icon: HandHeart },
    'Donor': { name: 'Donor', icon: Users },
    'Beneficiary': { name: 'Beneficiary', icon: User },
    'Referral': { name: 'Referral', icon: User },
};

const allPrivileges: Privilege[] = [
    { name: "all", description: "Grants unrestricted access to all features and settings. The ultimate 'master key'.", icon: Shield, type: 'Special', roles: [allRoles['Super Admin']] },
    { name: "canManageUsers", description: "Allows creating, editing, deactivating, and deleting all user accounts.", icon: UserCog, type: 'Manage', roles: [allRoles['Super Admin']] },
    { name: "canManageRolesAndPrivileges", description: "Allows defining or changing user roles and their associated permissions.", icon: KeySquare, type: 'Manage', roles: [allRoles['Super Admin']] },
    { name: "canViewBoardMembers", description: "Allows viewing the list of board members and their details.", icon: Users, type: 'View', roles: [allRoles['Super Admin'], allRoles['Admin']] },
    { name: "canAddBoardMembers", description: "Allows adding new users to the board member list.", icon: UserPlus, type: 'Create', roles: [allRoles['Super Admin']] },
    { name: "canRemoveBoardMembers", description: "Allows removing members from the board.", icon: Trash2, type: 'Delete', roles: [allRoles['Super Admin']] },
    { name: "canManageOrganizationProfile", description: "Allows editing the organization's public profile, contact, and payment details.", icon: Building, type: 'Edit', roles: [allRoles['Super Admin']] },
    { name: "canManageCampaigns", description: "Allows creating, editing, and deleting fundraising campaigns.", icon: Megaphone, type: 'Manage', roles: [allRoles['Super Admin'], allRoles['Admin']] },
    { name: "canAddBeneficiaries", description: "Allows creating new user profiles with the 'Beneficiary' role.", icon: UserPlus, type: 'Create', roles: [allRoles['Super Admin'], allRoles['Admin']] },
    { name: "canEditBeneficiaries", description: "Allows editing the profiles of existing beneficiaries.", icon: User, type: 'Edit', roles: [allRoles['Super Admin'], allRoles['Admin']] },
    { name: "canDeleteBeneficiaries", description: "Allows permanently deleting beneficiary profiles.", icon: Trash2, type: 'Delete', roles: [allRoles['Super Admin']] },
    { name: "canAddDonors", description: "Allows creating new user profiles with the 'Donor' role.", icon: UserPlus, type: 'Create', roles: [allRoles['Super Admin'], allRoles['Admin']] },
    { name: "canEditDonors", description: "Allows editing the profiles of existing donors.", icon: User, type: 'Edit', roles: [allRoles['Super Admin'], allRoles['Admin']] },
    { name: "canDeleteDonors", description: "Allows permanently deleting donor profiles.", icon: Trash2, type: 'Delete', roles: [allRoles['Super Admin']] },
    { name: "canManageLeads", description: "Allows creating, editing, and managing all help requests (leads).", icon: FileText, type: 'Manage', roles: [allRoles['Super Admin'], allRoles['Admin']] },
    { name: "canVerifyLeads", description: "Allows verifying or rejecting the authenticity of a lead.", icon: CheckSquare, type: 'Edit', roles: [allRoles['Super Admin'], allRoles['Admin']] },
    { name: "canManageDonations", description: "Allows recording, editing, and managing all donation records.", icon: HandHeart, type: 'Manage', roles: [allRoles['Super Admin'], allRoles['Finance Admin']] },
    { name: "canVerifyDonations", description: "Allows changing a donation's status (e.g., from 'Pending' to 'Verified').", icon: DollarSign, type: 'Edit', roles: [allRoles['Super Admin'], allRoles['Finance Admin']] },
    { name: "canViewFinancials", description: "Allows viewing financial reports, dashboards, and analytics.", icon: BarChart2, type: 'View', roles: [allRoles['Super Admin'], allRoles['Finance Admin']] },
    { name: "canExportData", description: "Allows exporting data from the system, like donation or user lists.", icon: Download, type: 'View', roles: [allRoles['Super Admin']] },
    { name: "canManageSettings", description: "Allows changing global application settings, like login methods or feature flags.", icon: Settings, type: 'Edit', roles: [allRoles['Super Admin']] },
    { name: "canSeedDatabase", description: "Allows running the database seeder to populate initial data. This is a destructive action.", icon: Database, type: 'Special', roles: [allRoles['Super Admin']] },
    { name: "canViewSystemInternals", description: "Allows viewing developer-oriented pages like Services Summary and Dependency Map.", icon: Share2, type: 'View', roles: [allRoles['Super Admin']] },
    { name: "canManageAIPersonas", description: "Allows creating and managing AI personas for automated communications.", icon: BrainCircuit, type: 'Manage', roles: [allRoles['Super Admin']] },
    { name: "canManageOwnProfile", description: "Allows a user to edit their own profile information.", icon: UserCog, type: 'Edit', roles: Object.values(allRoles) },
    { name: "canViewOwnDonations", description: "Allows a donor to see their personal donation history.", icon: HandHeart, type: 'View', roles: [allRoles['Donor']] },
    { name: "canRequestHelp", description: "Allows a beneficiary to submit a new help request.", icon: RequestHelpIcon, type: 'Create', roles: [allRoles['Beneficiary']] },
    { name: "canViewOwnCases", description: "Allows a beneficiary to view the status and history of their own cases.", icon: FileText, type: 'View', roles: [allRoles['Beneficiary']] },
];

const privilegeTypes: PrivilegeType[] = ['View', 'Create', 'Edit', 'Delete', 'Manage', 'Special'];

const typeColors: Record<PrivilegeType, string> = {
    'View': 'bg-blue-100 text-blue-800',
    'Create': 'bg-green-100 text-green-800',
    'Edit': 'bg-yellow-100 text-yellow-800',
    'Delete': 'bg-red-100 text-red-800',
    'Manage': 'bg-purple-100 text-purple-800',
    'Special': 'bg-gray-200 text-gray-800',
};

type SortableColumn = 'name' | 'type';
type SortDirection = 'asc' | 'desc';

export default function UserPrivilegesPage() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [nameInput, setNameInput] = useState('');
    const [roleInput, setRoleInput] = useState('all');
    const [typeInput, setTypeInput] = useState('all');

    const [sortColumn, setSortColumn] = useState<SortableColumn>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    
    const [appliedFilters, setAppliedFilters] = useState({ name: '', role: 'all', type: 'all' });

    const filteredPrivileges = useMemo(() => {
        let filtered = allPrivileges.filter(privilege => {
            const nameMatch = appliedFilters.name === '' || privilege.name.toLowerCase().includes(appliedFilters.name.toLowerCase());
            const roleMatch = appliedFilters.role === 'all' || privilege.roles.some(r => r.name === appliedFilters.role);
            const typeMatch = appliedFilters.type === 'all' || privilege.type === appliedFilters.type;
            return nameMatch && roleMatch && typeMatch;
        });

        return filtered.sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            let comparison = 0;
            if (aValue > bValue) {
                comparison = 1;
            } else if (aValue < bValue) {
                comparison = -1;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [appliedFilters, sortColumn, sortDirection]);

    const paginatedPrivileges = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredPrivileges.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredPrivileges, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredPrivileges.length / itemsPerPage);

    const handleSearch = () => {
        setCurrentPage(1);
        setAppliedFilters({ name: nameInput, role: roleInput, type: typeInput });
    };

    const handleSort = (column: SortableColumn) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    }

    const resetFilters = () => {
        setNameInput('');
        setRoleInput('all');
        setTypeInput('all');
        setAppliedFilters({ name: '', role: 'all', type: 'all' });
        setCurrentPage(1);
    };
    
    const renderSortIcon = (column: SortableColumn) => {
        if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
        return sortDirection === 'asc' ? <ArrowUpDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />;
    };

    const renderPaginationControls = () => (
        <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedPrivileges.length} of {filteredPrivileges.length} privileges.
            </div>
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                        value={`${itemsPerPage}`}
                        onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1); }}
                    >
                        <SelectTrigger className="h-8 w-[70px]"><SelectValue placeholder={itemsPerPage} /></SelectTrigger>
                        <SelectContent side="top">
                            {[10, 25, 50].map(pageSize => <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">Page {currentPage} of {totalPages}</div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" /><span className="sr-only">Previous</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                        <ChevronRight className="h-4 w-4" /><span className="sr-only">Next</span>
                    </Button>
                </div>
            </div>
        </div>
    );

  return (
    <div className="flex-1 space-y-4">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">User Privileges</h2>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <KeySquare className="h-6 w-6 text-primary" />
                    Manage Privileges
                </CardTitle>
                <CardDescription>
                    Define granular permissions for individual actions within the application. This is a read-only view of the system's intended privilege structure.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2">
                        <Label htmlFor="nameFilter">Privilege Name</Label>
                        <Input id="nameFilter" placeholder="Filter by name..." value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="typeFilter">Privilege Type</Label>
                        <Select value={typeInput} onValueChange={(v) => setTypeInput(v)}>
                            <SelectTrigger id="typeFilter"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {privilegeTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="roleFilter">Assigned Role</Label>
                        <Select value={roleInput} onValueChange={(v) => setRoleInput(v)}>
                            <SelectTrigger id="roleFilter"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                {Object.values(allRoles).map(r => <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end gap-4 lg:col-span-full">
                        <Button onClick={handleSearch} className="w-full"><Search className="mr-2 h-4 w-4" />Apply Filters</Button>
                        <Button variant="outline" onClick={resetFilters} className="w-full"><FilterX className="mr-2 h-4 w-4" />Clear</Button>
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <Button variant="ghost" onClick={() => handleSort('name')}>
                                    Privilege Name {renderSortIcon('name')}
                                </Button>
                            </TableHead>
                            <TableHead>
                                 <Button variant="ghost" onClick={() => handleSort('type')}>
                                    Type {renderSortIcon('type')}
                                </Button>
                            </TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Allocated to Roles</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedPrivileges.map((privilege, index) => (
                            <TableRow key={privilege.name}>
                                <TableCell>
                                    <div className="font-medium flex items-center gap-2">
                                        <privilege.icon className="h-4 w-4 text-accent"/>
                                        {privilege.name}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn(typeColors[privilege.type])}>
                                        {privilege.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{privilege.description}</TableCell>
                                <TableCell>
                                     <div className="flex flex-wrap gap-2">
                                        {privilege.roles.map(role => (
                                             <Badge 
                                                key={role.name}
                                                variant="secondary"
                                                onClick={() => router.push('/admin/user-management/roles')}
                                                className="flex items-center gap-2 hover:bg-primary/20 transition-colors cursor-pointer"
                                            >
                                                <role.icon className="h-3 w-3" />
                                                {role.name}
                                            </Badge>
                                        ))}
                                        {privilege.roles.length === 0 && <span className="text-xs text-muted-foreground">N/A</span>}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {totalPages > 1 && renderPaginationControls()}
                 {filteredPrivileges.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">No privileges match your current filters.</p>
                        <Button variant="outline" onClick={resetFilters} className="mt-4">
                            <FilterX className="mr-2 h-4 w-4" />
                            Clear Filters
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
