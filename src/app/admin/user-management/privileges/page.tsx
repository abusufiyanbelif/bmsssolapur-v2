
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KeySquare, ShieldCheck, UserCog, FileText, CheckSquare, HandCoins, DollarSign, BarChart2, Download, Settings, Users, UserPlus, Trash2 } from "lucide-react";

type Privilege = {
  name: string;
  description: string;
  icon: React.ElementType;
};

const allPrivileges: Privilege[] = [
    { name: "all", description: "Grants unrestricted access to all features and settings.", icon: ShieldCheck },
    { name: "canManageUsers", description: "Allows creating, editing, and deleting all user accounts.", icon: UserCog },
    { name: "canAddBeneficiaries", description: "Allows creating new beneficiary profiles.", icon: UserPlus },
    { name: "canEditBeneficiaries", description: "Allows editing existing beneficiary profiles.", icon: Users },
    { name: "canDeleteBeneficiaries", description: "Allows deleting beneficiary profiles.", icon: Trash2 },
    { name: "canManageLeads", description: "Allows creating, editing, and managing help requests (leads).", icon: FileText },
    { name: "canVerifyLeads", description: "Allows verifying or rejecting the authenticity of a lead.", icon: CheckSquare },
    { name: "canManageDonations", description: "Allows recording, editing, and managing all donations.", icon: HandCoins },
    { name: "canVerifyDonations", description: "Allows verifying the authenticity of received donations.", icon: DollarSign },
    { name: "canViewFinancials", description: "Allows viewing financial reports and dashboards.", icon: BarChart2 },
    { name: "canExportData", description: "Allows exporting data from the system, like donation or user lists.", icon: Download },
    { name: "canManageSettings", description: "Allows changing global application settings.", icon: Settings },
];


export default function UserPrivilegesPage() {
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
                    Define granular permissions for individual actions within the application. This page is a read-only view of the system's available privileges.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Sr. No.</TableHead>
                            <TableHead>Privilege</TableHead>
                            <TableHead>Description</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allPrivileges.map((privilege, index) => (
                            <TableRow key={privilege.name}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <privilege.icon className="h-4 w-4 text-muted-foreground" />
                                        <span>{privilege.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{privilege.description}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
