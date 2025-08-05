
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeySquare, ShieldCheck, UserCog, FileText, CheckSquare, HandCoins, DollarSign, BarChart2, Download, Settings } from "lucide-react";

type Privilege = {
  name: string;
  description: string;
  icon: React.ElementType;
};

const allPrivileges: Privilege[] = [
    { name: "all", description: "Grants unrestricted access to all features and settings.", icon: ShieldCheck },
    { name: "canManageUsers", description: "Allows creating, editing, and deleting user accounts.", icon: UserCog },
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
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allPrivileges.map(privilege => (
                        <div key={privilege.name} className="flex items-start gap-4 rounded-lg border p-4">
                            <privilege.icon className="h-8 w-8 text-accent flex-shrink-0" />
                            <div>
                                <p className="font-semibold">{privilege.name}</p>
                                <p className="text-sm text-muted-foreground">{privilege.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
