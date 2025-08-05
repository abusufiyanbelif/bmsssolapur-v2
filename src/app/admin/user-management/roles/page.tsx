
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Shield, KeySquare, HandHeart, User, UserCog, Users } from "lucide-react";

type Privilege = {
  name: string;
  description: string;
};

type Role = {
  name: string;
  description: string;
  icon: React.ElementType;
  privileges: Privilege[];
};

const allPrivileges: Record<string, Privilege> = {
  all: { name: "All Privileges", description: "Grants unrestricted access to all features and settings." },
  canManageUsers: { name: "Manage Users", description: "Can create, edit, and delete user accounts." },
  canManageLeads: { name: "Manage Leads", description: "Can create, edit, and manage help requests (leads)." },
  canVerifyLeads: { name: "Verify Leads", description: "Can verify or reject the authenticity of a lead." },
  canManageDonations: { name: "Manage Donations", description: "Can record, edit, and manage all donations." },
  canViewFinancials: { name: "View Financials", description: "Can view financial reports and dashboards." },
};

const allRoles: Role[] = [
  {
    name: "Super Admin",
    icon: Shield,
    description: "Has unrestricted access to all system functionalities, including user management and app settings.",
    privileges: [allPrivileges.all],
  },
  {
    name: "Admin",
    icon: UserCog,
    description: "Can manage day-to-day operations like handling leads, beneficiaries, and basic user data.",
    privileges: [allPrivileges.canManageLeads, allPrivileges.canVerifyLeads],
  },
  {
    name: "Finance Admin",
    icon: HandHeart,
    description: "Specifically manages financial records, including verifying and allocating donations.",
    privileges: [allPrivileges.canManageDonations, allPrivileges.canViewFinancials],
  },
  {
    name: "Donor",
    icon: Users,
    description: "A registered user who can donate, view their donation history, and manage their profile.",
    privileges: [],
  },
  {
    name: "Beneficiary",
    icon: User,
    description: "A registered user who can request help, view their case history, and manage their profile.",
    privileges: [],
  },
  {
    name: "Referral",
    icon: User,
    description: "A user who can refer potential beneficiaries to the organization.",
    privileges: [],
  },
];


export default function UserRolesPage() {
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
                    Define roles and assign a collection of privileges to them. This page is currently a read-only view of the system's intended role structure.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {allRoles.map(role => (
                        <AccordionItem value={role.name} key={role.name}>
                            <AccordionTrigger>
                                <div className="flex items-center gap-4">
                                    <role.icon className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-semibold text-base">{role.name}</p>
                                        <p className="text-sm text-muted-foreground text-left">{role.description}</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                {role.privileges.length > 0 ? (
                                    <div className="space-y-3 pl-12">
                                        <h4 className="font-semibold flex items-center gap-2"><KeySquare className="h-4 w-4 text-accent" /> Allocated Privileges</h4>
                                        <ul className="list-disc pl-5 space-y-2">
                                            {role.privileges.map(privilege => (
                                                <li key={privilege.name}>
                                                    <span className="font-medium">{privilege.name}:</span>
                                                    <span className="text-muted-foreground ml-2">{privilege.description}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">This role has no special system privileges.</p>
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
