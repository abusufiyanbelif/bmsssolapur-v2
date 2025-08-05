
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KeySquare, Shield, UserCog, HandCoins, Users, User, CheckSquare, FileText, UserPlus, Trash2, DollarSign, BarChart2, Download, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Role = {
  name: 'Super Admin' | 'Admin' | 'Finance Admin' | 'Donor' | 'Beneficiary';
  icon: React.ElementType;
};

type Privilege = {
  name: string;
  description: string;
  icon: React.ElementType;
  roles: Role[];
};

const allRoles: Record<string, Role> = {
    'Super Admin': { name: 'Super Admin', icon: Shield },
    'Admin': { name: 'Admin', icon: UserCog },
    'Finance Admin': { name: 'Finance Admin', icon: HandCoins },
    'Donor': { name: 'Donor', icon: Users },
    'Beneficiary': { name: 'Beneficiary', icon: User },
};

const allPrivileges: Privilege[] = [
    { name: "all", description: "Grants unrestricted access to all features and settings.", icon: Shield, roles: [allRoles['Super Admin']] },
    { name: "canManageUsers", description: "Allows creating, editing, and deleting all user accounts.", icon: UserCog, roles: [allRoles['Super Admin']] },
    { name: "canAddBeneficiaries", description: "Allows creating new beneficiary profiles.", icon: UserPlus, roles: [allRoles['Super Admin'], allRoles['Admin']] },
    { name: "canEditBeneficiaries", description: "Allows editing existing beneficiary profiles.", icon: User, roles: [allRoles['Super Admin'], allRoles['Admin']] },
    { name: "canDeleteBeneficiaries", description: "Allows deleting beneficiary profiles.", icon: Trash2, roles: [allRoles['Super Admin']] },
    { name: "canAddDonors", description: "Allows creating new donor profiles.", icon: UserPlus, roles: [allRoles['Super Admin'], allRoles['Admin']] },
    { name: "canEditDonors", description: "Allows editing existing donor profiles.", icon: User, roles: [allRoles['Super Admin'], allRoles['Admin']] },
    { name: "canDeleteDonors", description: "Allows deleting donor profiles.", icon: Trash2, roles: [allRoles['Super Admin']] },
    { name: "canManageLeads", description: "Allows creating, editing, and managing help requests (leads).", icon: FileText, roles: [allRoles['Super Admin'], allRoles['Admin']] },
    { name: "canVerifyLeads", description: "Allows verifying or rejecting the authenticity of a lead.", icon: CheckSquare, roles: [allRoles['Super Admin'], allRoles['Admin']] },
    { name: "canManageDonations", description: "Allows recording, editing, and managing all donations.", icon: HandCoins, roles: [allRoles['Super Admin'], allRoles['Finance Admin']] },
    { name: "canVerifyDonations", description: "Allows verifying the authenticity of received donations.", icon: DollarSign, roles: [allRoles['Super Admin'], allRoles['Finance Admin']] },
    { name: "canViewFinancials", description: "Allows viewing financial reports and dashboards.", icon: BarChart2, roles: [allRoles['Super Admin'], allRoles['Finance Admin']] },
    { name: "canExportData", description: "Allows exporting data from the system, like donation or user lists.", icon: Download, roles: [allRoles['Super Admin']] },
    { name: "canManageSettings", description: "Allows changing global application settings.", icon: Settings, roles: [allRoles['Super Admin']] },
];


export default function UserPrivilegesPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const paginatedPrivileges = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return allPrivileges.slice(startIndex, startIndex + itemsPerPage);
    }, [currentPage, itemsPerPage]);

    const totalPages = Math.ceil(allPrivileges.length / itemsPerPage);
    
    const renderPaginationControls = () => (
        <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedPrivileges.length} of {allPrivileges.length} privileges.
            </div>
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                        value={`${itemsPerPage}`}
                        onValueChange={(value) => {
                            setItemsPerPage(Number(value))
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={itemsPerPage} />
                        </SelectTrigger>
                        <SelectContent side="top">
                        {[10, 25, 50].map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next</span>
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Sr. No.</TableHead>
                            <TableHead>Privilege Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Allocated to Roles</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedPrivileges.map((privilege, index) => (
                            <TableRow key={privilege.name}>
                                <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                                <TableCell>
                                    <div className="font-medium flex items-center gap-2">
                                        <privilege.icon className="h-4 w-4 text-accent"/>
                                        {privilege.name}
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{privilege.description}</TableCell>
                                <TableCell>
                                     <div className="flex flex-wrap gap-2">
                                        {privilege.roles.map(role => (
                                            <Badge key={role.name} variant="secondary" className="flex items-center gap-2">
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
            </CardContent>
        </Card>
    </div>
  );
}
