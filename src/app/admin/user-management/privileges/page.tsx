
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { KeySquare, ShieldCheck, UserCog, FileText, CheckSquare, HandCoins, DollarSign, BarChart2, Download, Settings, Users, UserPlus, Trash2, Shield, User } from "lucide-react";

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
    { name: "all", description: "Grants unrestricted access to all features and settings.", icon: ShieldCheck, roles: [allRoles['Super Admin']] },
    { name: "canManageUsers", description: "Allows creating, editing, and deleting all user accounts.", icon: UserCog, roles: [allRoles['Super Admin']] },
    { name: "canAddBeneficiaries", description: "Allows creating new beneficiary profiles.", icon: UserPlus, roles: [allRoles['Super Admin'], allRoles['Admin']] },
    { name: "canEditBeneficiaries", description: "Allows editing existing beneficiary profiles.", icon: Users, roles: [allRoles['Super Admin'], allRoles['Admin']] },
    { name: "canDeleteBeneficiaries", description: "Allows deleting beneficiary profiles.", icon: Trash2, roles: [allRoles['Super Admin']] },
    { name: "canAddDonors", description: "Allows creating new donor profiles.", icon: UserPlus, roles: [allRoles['Super Admin'], allRoles['Admin']] },
    { name: "canEditDonors", description: "Allows editing existing donor profiles.", icon: Users, roles: [allRoles['Super Admin'], allRoles['Admin']] },
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
                    Define granular permissions for individual actions within the application. Click on a privilege to see which roles it's assigned to.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Accordion type="single" collapsible className="w-full">
                    {allPrivileges.map(privilege => (
                        <AccordionItem value={privilege.name} key={privilege.name}>
                            <AccordionTrigger>
                               <div className="flex items-center gap-4 text-left">
                                    <privilege.icon className="h-5 w-5 text-primary flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-base">{privilege.name}</p>
                                        <p className="text-sm text-muted-foreground">{privilege.description}</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                {privilege.roles.length > 0 ? (
                                    <div className="space-y-3 pl-12">
                                        <h4 className="font-semibold text-sm">Allocated to Roles:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {privilege.roles.map(role => (
                                                <Badge key={role.name} variant="secondary" className="flex items-center gap-2">
                                                    <role.icon className="h-3 w-3" />
                                                    {role.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">This privilege is not currently allocated to any role.</p>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    </div>
  );
}
