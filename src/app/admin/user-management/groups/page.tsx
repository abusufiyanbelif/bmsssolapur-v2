
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Group, Users, ShieldCheck, Banknote } from "lucide-react";

type UserGroup = {
  name: string;
  description: string;
  icon: React.ElementType;
  typicalRoles: string[];
};

const allGroups: UserGroup[] = [
    { 
        name: "Founder / Co-Founder",
        description: "The core leadership and founding members of the organization. They typically have the highest level of administrative access.",
        icon: Users,
        typicalRoles: ["Super Admin"]
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
                    Organize users into groups or teams (e.g., Founders, Finance Team). This is a read-only view of suggested groups based on your application's structure.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Accordion type="single" collapsible className="w-full">
                    {allGroups.map(group => (
                        <AccordionItem value={group.name} key={group.name}>
                            <AccordionTrigger>
                                <div className="flex items-center gap-4">
                                    <group.icon className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-semibold text-base">{group.name}</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                               <div className="pl-12 space-y-3">
                                 <p className="text-muted-foreground">{group.description}</p>
                                 <div className="flex items-center gap-2">
                                     <span className="text-sm font-semibold">Typical Roles:</span>
                                     <div className="flex flex-wrap gap-2">
                                        {group.typicalRoles.map(role => (
                                            <span key={role} className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded-md">{role}</span>
                                        ))}
                                     </div>
                                 </div>
                               </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    </div>
  );
}
