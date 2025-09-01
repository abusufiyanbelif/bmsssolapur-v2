

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Group, Users, ShieldCheck, Banknote, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


type UserGroup = {
  name: string;
  description: string;
  icon: React.ElementType;
  typicalRoles: string[];
};

const allGroups: UserGroup[] = [
    { 
        name: "Founder",
        description: "The primary founding members of the organization. They typically have the highest level of administrative access.",
        icon: Users,
        typicalRoles: ["Super Admin"]
    },
    { 
        name: "Co-Founder",
        description: "Core leadership members who were part of the founding team.",
        icon: Users,
        typicalRoles: ["Super Admin", "Admin"]
    },
    { 
        name: "Finance Team",
        description: "A group of users responsible for managing donations, verifying financial transactions, and viewing financial reports.",
        icon: Banknote,
        typicalRoles: ["Finance Admin", "Super Admin"]
    },
    { 
        name: "Member of Organization",
        description: "General members of the core team who are involved in day-to-day operations and decision-making.",
        icon: Group,
        typicalRoles: ["Admin", "Super Admin"]
    },
    { 
        name: "Lead Approver",
        description: "A designated team of trusted individuals responsible for verifying and approving new help requests (leads) before they become active.",
        icon: ShieldCheck,
        typicalRoles: ["Admin", "Super Admin"]
    },
];

export default function UserGroupsPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const paginatedGroups = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return allGroups.slice(startIndex, startIndex + itemsPerPage);
    }, [currentPage, itemsPerPage]);

    const totalPages = Math.ceil(allGroups.length / itemsPerPage);

    const renderPaginationControls = () => (
        <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
                Showing {paginatedGroups.length} of {allGroups.length} groups.
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
                            {[5, 10, 20].map(pageSize => <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>)}
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
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">User Groups</h2>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Group className="h-6 w-6 text-primary" />
                    Manage User Groups
                </CardTitle>
                <CardDescription>
                    Organize users into groups or teams (e.g., Founders, Finance Team). This is a read-only view of suggested groups based on your application&apos;s structure.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Sr. No.</TableHead>
                            <TableHead className="w-[250px]">Group Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Typical Roles</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedGroups.map((group, index) => (
                            <TableRow key={group.name}>
                                <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <group.icon className="h-5 w-5 text-accent" />
                                        {group.name}
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{group.description}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-2">
                                        {group.typicalRoles.map(role => (
                                            <Badge key={role} variant="secondary">{role}</Badge>
                                        ))}
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
