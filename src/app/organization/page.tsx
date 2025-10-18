// src/app/organization/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Mail, Phone, Globe, Hash, ShieldCheck, CreditCard, Award, Users, Banknote, MapPin, AlertCircle, Edit } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User, Organization } from "@/services/types";
import { OrganizationQrCodeDialog } from "@/components/organization-qr-code-dialog";
import { getAllUsers } from "@/services/user-service";
import { getCurrentOrganization } from "@/app/admin/settings/actions";
import { AppShell, AdminEditButton } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const groupMapping: Record<string, string> = {
    'Founder': 'founder',
    'Co-Founder': 'cofounder',
    'Finance': 'finance',
    'Member of Organization': 'members',
};


export default async function OrganizationPage() {
    let organization: Organization | null = null;
    let boardMembers: Record<string, User[]> = { founder: [], cofounder: [], finance: [], members: [] };
    let error = null;

    try {
        // These can fail if Firebase isn't configured, so we wrap them.
        const [org, allUsers] = await Promise.all([
            getCurrentOrganization(),
            getAllUsers(),
        ]);
        organization = org;
        
        if (allUsers) {
            allUsers.forEach(user => {
                (user.groups || []).forEach(group => {
                    const category = groupMapping[group];
                    if (category) {
                        if (!boardMembers[category]) {
                            boardMembers[category] = [];
                        }
                        boardMembers[category].push(user);
                    }
                });
            });
        }

    } catch(e) {
        error = e instanceof Error ? e.message : "An unknown error occurred while fetching organization details.";
        console.error(e);
    }

    if (error) {
         return (
            <div className="flex-1 space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Page</AlertTitle>
                    <AlertDescription>
                       {error}
                       <p className="text-xs mt-2">This is likely due to a missing or invalid Firebase configuration. Please ensure your environment variables are set correctly.</p>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!organization) {
        return (
             <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">About Our Organization</h2>
                     <AdminEditButton editPath="/admin/organization" />
                </div>
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Organization Details Not Available</AlertTitle>
                    <AlertDescription>
                        The organization&apos;s profile has not been set up yet. An administrator needs to create it in the admin panel.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const details = [
        { icon: Building, label: "Organization Name", value: organization.name },
        { icon: MapPin, label: "Address", value: `${organization.address}, ${organization.city}` },
        { icon: Hash, label: "Registration No.", value: organization.registrationNumber },
        { icon: Mail, label: "Contact Email", value: organization.contactEmail },
        { icon: ShieldCheck, label: "PAN Number", value: organization.panNumber || "Not Available" },
        { icon: Globe, label: "Website", value: organization.website || "Not Available" },
    ];
    
    const paymentDetails = [
        { icon: Banknote, label: "Bank Account Name", value: organization.bankAccountName },
        { icon: CreditCard, label: "Bank Account No.", value: organization.bankAccountNumber },
        { icon: Hash, label: "IFSC Code", value: organization.bankIfscCode },
        { icon: CreditCard, label: "UPI ID", value: organization.upiId },
    ];
    
    const MemberCard = ({ member }: { member: User }) => {
        const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        return (
            <div className="flex items-center gap-4 p-4 border rounded-lg">
                <Avatar>
                    <AvatarImage src={`https://placehold.co/100x100.png?text=${initials}`} alt={member.name} data-ai-hint="male portrait" />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{member.name}</p>
                </div>
            </div>
        );
    };
    
    // Serialize data before passing to client component
    const safeOrganization = JSON.parse(JSON.stringify(organization));
    
    return (
        <div className="flex-1 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">About Our Organization</h2>
                <AdminEditButton editPath="/admin/organization" />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="text-primary">Verifiable Details</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Transparency is important to us. Here are the official details of our organization.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            {details.map(item => (
                                <div key={item.label} className="flex items-start gap-4">
                                    <item.icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">{item.label}</p>
                                        <p className="text-muted-foreground">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                             <div className="flex items-start gap-4">
                                <Phone className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">Contact Phone</p>
                                    <p className="text-muted-foreground">{organization.contactPhone}</p>
                                </div>
                            </div>
                        </div>
                        {organization.qrCodeUrl && (
                             <OrganizationQrCodeDialog organization={safeOrganization}>
                                <div className="flex flex-col items-center justify-center gap-4 p-4 border rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
                                    <div className="relative w-56 h-56">
                                        <Image src={organization.qrCodeUrl} alt="UPI QR Code" fill className="object-contain rounded-md" data-ai-hint="qr code" />
                                    </div>
                                    <p className="text-sm font-bold">{organization.upiId}</p>
                                    <p className="text-sm text-muted-foreground text-center">
                                        Scan with any UPI App or click to view options.
                                    </p>
                                </div>
                            </OrganizationQrCodeDialog>
                        )}
                    </div>
                     <div className="mt-8 pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-4 text-primary">Bank Account Details</h3>
                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                            {paymentDetails.map(item => (
                                <div key={item.label} className="flex items-start gap-4">
                                    <item.icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">{item.label}</p>
                                        <p className="text-muted-foreground font-mono text-sm">{item.value || "Not Available"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card id="board-members">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-primary">
                        <Users className="h-6 w-6" />
                        Our Team
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        The dedicated individuals leading our organization and its mission.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {boardMembers.founder.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-primary">Founder</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {boardMembers.founder.map(member => <MemberCard key={member.id} member={member} />)}
                            </div>
                        </div>
                    )}
                     {boardMembers.cofounder.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-primary">Co-Founder</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {boardMembers.cofounder.map(member => <MemberCard key={member.id} member={member} />)}
                            </div>
                        </div>
                     )}
                      {boardMembers.finance.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary"><Banknote className="h-5 w-5" /> Finance</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {boardMembers.finance.map(member => <MemberCard key={member.id} member={member} />)}
                            </div>
                        </div>
                    )}
                    {boardMembers.members.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-primary">Members</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {boardMembers.members.map(member => <MemberCard key={member.id} member={member} />)}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card id="principles">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-primary">
                        <Award className="h-6 w-6" />
                        Our Guiding Principles
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        To ensure our operations are transparent, fair, and impactful, we adhere to a clear set of guiding principles. These rules govern how we identify beneficiaries, allocate funds, and manage our resources to best serve the community.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3 list-disc pl-5 text-muted-foreground">
                        <li>Trust is focused on assisting educational and health beneficiaries.</li>
                        <li>Priority will be given to males studying in their final year of a course.</li>
                        <li>Assisting orphan girls in all forms except marriage.</li>
                        <li>Providing ration to the most deserving (mustahik) in the last week of each month, depending on available funds.</li>
                        <li>A return agreement will be secured from educational beneficiaries if the amount exceeds ₹25,000.</li>
                        <li>The maximum capital credited will be ₹40,000, but this can be raised in exceptional cases.</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
