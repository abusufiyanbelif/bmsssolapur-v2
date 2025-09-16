

"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { LogIn, LogOut, Menu, Users as UsersIcon, User, Home, Loader2, Bell, AlertTriangle, FileCheck, HandHeart, Megaphone, ArrowRightLeft, Shield, FileUp, HandCoins } from "lucide-react";
import { RoleSwitcherDialog } from "./role-switcher-dialog";
import { useState, useEffect, Children, cloneElement, isValidElement } from "react";
import { Footer } from "./footer";
import { logActivity } from "@/services/activity-log-service";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Nav } from "../app/nav";
import type { User as UserType, Lead as LeadType, Donation as DonationType, Organization } from "@/services/types";
import { getUser } from "@/services/user-service";
import { getAllLeads } from "@/services/lead-service";
import { getAllDonations } from "@/services/donation-service";
import { formatDistanceToNow } from "date-fns";
import { Logo } from "./logo";
import { AppSettings, getAppSettings, getCurrentOrganization } from "@/app/admin/settings/actions";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { performPermissionCheck } from "@/app/actions";

const PermissionErrorState = ({ error }: { error: string }) => {
    const isPermissionDenied = error === 'permission-denied';

    return (
        <div className="flex flex-col flex-1 items-center justify-center h-full p-4 bg-background">
            <Card className="w-full max-w-2xl text-center shadow-2xl border-destructive">
                <CardHeader>
                    <div className="mx-auto bg-destructive text-destructive-foreground rounded-full p-3 w-fit">
                        <Shield className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-destructive text-2xl pt-4">
                        {isPermissionDenied ? "Action Required: Insufficient Permissions" : "Connection Error"}
                    </CardTitle>
                    <CardDescription className="text-base text-center pt-2">
                        {isPermissionDenied
                            ? "The application cannot connect to the database. This is usually because the server environment does not have the correct IAM permissions."
                            : "The application could not establish a connection to the backend database."
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isPermissionDenied ? (
                        <>
                            <p>To fix this, you need to grant the <strong className="text-primary">&quot;Cloud Datastore User&quot;</strong> role to the correct service account in your Google Cloud project.</p>
                            <div className="p-4 rounded-lg bg-muted text-left text-sm">
                                <p className="font-semibold">Follow these steps:</p>
                                <ol className="list-decimal list-inside space-y-2 mt-2">
                                    <li>Go to the <strong className="text-primary">IAM & Admin</strong> page in your Google Cloud Console.</li>
                                    <li>Find the service account with the name <strong className="text-primary">&quot;Firebase App Hosting compute engine default service account&quot;</strong>.</li>
                                    <li>Click the pencil icon to edit its permissions.</li>
                                    <li>Click <strong className="text-primary">&quot;Add another role&quot;</strong> and search for <strong className="text-primary">&quot;Cloud Datastore User&quot;</strong>.</li>
                                    <li>Select the role and click <strong className="text-primary">&quot;Save&quot;</strong>.</li>
                                </ol>
                            </div>
                        </>
                    ) : (
                        <p>Please check your internet connection and the server logs for more details.</p>
                    )}
                    <p className="text-xs text-muted-foreground pt-2">
                        The specific error message was: <code className="bg-muted px-1 py-0.5 rounded">{error}</code>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};


export function AppShell({ children }: { children: React.ReactNode }) {
    const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
    const [requiredRole, setRequiredRole] = useState<string | null>(null);
    const [isSessionReady, setIsSessionReady] = useState(false);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [pendingLeads, setPendingLeads] = useState<LeadType[]>([]);
    const [readyToPublishLeads, setReadyToPublishLeads] = useState<LeadType[]>([]);
    const [pendingDonations, setPendingDonations] = useState<DonationType[]>([]);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    const guestUser: UserType & { isLoggedIn: boolean; activeRole: string; initials: string; avatar: string; } = {
        isLoggedIn: false,
        id: "guest_user_id",
        name: "Guest",
        phone: '',
        email: '',
        roles: ["Guest"],
        isActive: true,
        activeRole: "Guest",
        initials: "G",
        avatar: "https://placehold.co/100x100.png",
        createdAt: new Date() as any,
    };
    
    const [user, setUser] = useState<UserType & { isLoggedIn: boolean; activeRole: string; initials: string; avatar: string; } | null>(null);
    
    useEffect(() => {
        const initializeSession = async () => {
            const [permissionResult, orgData] = await Promise.all([
                performPermissionCheck(),
                getCurrentOrganization()
            ]);

            setOrganization(orgData);

            if (!permissionResult.success && permissionResult.error) {
                setPermissionError(permissionResult.error);
                setIsSessionReady(true);
                return;
            }

            const storedUserId = localStorage.getItem('userId');
            const shouldShowRoleSwitcher = localStorage.getItem('showRoleSwitcher') === 'true';

            if (storedUserId) {
                let fetchedUser = await getUser(storedUserId);

                if (fetchedUser) {
                    const savedRole = localStorage.getItem('activeRole');
                    const activeRole = (savedRole && fetchedUser.roles.includes(savedRole as any)) ? savedRole : fetchedUser.roles[0];
                    
                    if (localStorage.getItem('activeRole') !== activeRole) {
                        localStorage.setItem('activeRole', activeRole);
                    }
                    
                    const userData = {
                        ...fetchedUser,
                        isLoggedIn: true,
                        activeRole: activeRole,
                        initials: fetchedUser.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase(),
                        avatar: `https://placehold.co/100x100.png?text=${fetchedUser.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}`
                    };
                    setUser(userData);
                    
                    // Always fetch admin notifications if user has any admin role
                    if (fetchedUser.roles.some(r => ['Admin', 'Super Admin', 'Finance Admin'].includes(r))) {
                        const [allLeads, allDonations] = await Promise.all([
                            getAllLeads(),
                            getAllDonations()
                        ]);
                        setPendingLeads(allLeads.filter(l => l.caseVerification === 'Pending'));
                        setReadyToPublishLeads(allLeads.filter(l => l.caseAction === 'Ready For Help'));
                        setPendingDonations(allDonations.filter(d => d.status === 'Pending verification' || d.status === 'Pending'));
                    }

                    if (shouldShowRoleSwitcher && fetchedUser.roles.length > 1) {
                        setIsRoleSwitcherOpen(true);
                        localStorage.removeItem('showRoleSwitcher'); 
                    }
                } else {
                    handleLogout(false); // Don't redirect if user is just invalid
                }
            } else {
                setUser(guestUser);
            }
            setIsSessionReady(true);
        };

        const handleLoginSuccess = () => {
            setIsSessionReady(false); // Force re-initialization
            initializeSession();
        };

        window.addEventListener('loginSuccess', handleLoginSuccess);

        // Call the initialization function
        initializeSession();

        return () => {
            window.removeEventListener('loginSuccess', handleLoginSuccess);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 


    const handleRoleChange = (newRole: string) => {
        if (!user || !user.isLoggedIn) return;

        const previousRole = user.activeRole;
        
        localStorage.setItem('activeRole', newRole);

        if (user.isLoggedIn) {
            logActivity({
                userId: user.id!,
                userName: user.name,
                userEmail: user.email,
                role: newRole,
                activity: "Switched Role",
                details: { from: previousRole, to: newRole },
            });
        }
        
        if(redirectUrl) {
            // If we have a pending redirect, go there after the switch
            window.location.href = redirectUrl;
        } else {
            // Otherwise, go to the standard home/dashboard for that role
            window.location.href = '/home';
        }
    };
    
    const handleLogout = (shouldRedirect = true) => {
        localStorage.removeItem('userId');
        localStorage.removeItem('activeRole');
        setUser(guestUser);
        setIsSessionReady(true);
        if (shouldRedirect) {
             router.push('/');
        }
    }

    const handleOpenRoleSwitcher = (requiredRoleName: string | null = null, redirect?: string) => {
        setRequiredRole(requiredRoleName);
        setRedirectUrl(redirect || null); // Store the URL to redirect to after switch
        setIsRoleSwitcherOpen(true);
    };
    
     const handleNotificationClick = (requiredRole: string, href: string) => {
        if (!user || !user.isLoggedIn) return;
        
        if(user.activeRole === requiredRole) {
            router.push(href);
        } else if (user.roles.includes(requiredRole as any)) {
            handleOpenRoleSwitcher(requiredRole, href);
        } else {
            toast({
                variant: 'destructive',
                title: 'Permission Denied',
                description: `You need the ${requiredRole} role to access this.`,
            });
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (!open && isMandatory) {
            return; 
        }
        setIsRoleSwitcherOpen(open);
        if (!open) {
            setRequiredRole(null);
            if (isMandatory) setIsSessionReady(true);
        }
    };
    
    const isMandatory = !!user && user.isLoggedIn && !isSessionReady && user.roles.length > 1;

    const childrenWithProps = Children.map(children, child => {
        if (isValidElement(child)) {
            // Pass organization data to all direct children of AppShell
            return cloneElement(child as React.ReactElement<any>, { user, activeRole: user?.activeRole, organization });
        }
        return child;
    });
    
    const LoadingState = () => (
        <div className="flex flex-col flex-1 items-center justify-center h-full">
            <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary" />
            <p className="mt-4 text-muted-foreground">Initializing your session...</p>
        </div>
    )

    if (permissionError) {
        return <PermissionErrorState error={permissionError} />;
    }

    if (!user || !isSessionReady) {
        return <LoadingState />
    }

    const activeRole = user.activeRole;
    const isAdmin = ['Admin', 'Super Admin', 'Finance Admin'].includes(activeRole);
    const hasAdminAccess = user.roles.some(r => ['Admin', 'Super Admin', 'Finance Admin'].includes(r));
    const leadsNotificationCount = hasAdminAccess ? (pendingLeads.length + readyToPublishLeads.length) : 0;
    const donationsNotificationCount = hasAdminAccess ? pendingDonations.length : 0;
    const transfersNotificationCount = 0; // Placeholder for now

    const HeaderTitle = () => (
        <Link href="/" className="flex items-center gap-2" title="Baitul Mal Samajik Sanstha (Solapur)">
            <Logo className="h-14 w-14" logoUrl={organization?.logoUrl} />
             <div className="flex flex-col leading-tight">
                <span className="font-bold font-headline text-primary text-sm">{organization?.footer?.organizationInfo.titleLine1 || 'Baitul Mal'}</span>
                <span className="font-bold font-headline text-accent text-sm">{organization?.footer?.organizationInfo.titleLine2 || 'Samajik Sanstha'}</span>
                 <span className="font-bold font-headline text-primary text-xs">{organization?.footer?.organizationInfo.titleLine3 || '(Solapur)'}</span>
            </div>
        </Link>
    );

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-card md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-[72px] items-center border-b px-4 lg:px-6">
                        <HeaderTitle />
                    </div>
                    {isSessionReady && (
                        <div className="flex-1 overflow-y-auto">
                            <Nav 
                                userRoles={user.roles} 
                                activeRole={activeRole}
                                onRoleSwitchRequired={(role) => handleOpenRoleSwitcher(role)}
                            />
                        </div>
                    )}
                </div>
            </div>
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0">
                            <SheetHeader className="h-[72px] items-center border-b px-4 lg:px-6">
                               <HeaderTitle />
                               <SheetTitle className="sr-only">Main Menu</SheetTitle>
                               <SheetDescription className="sr-only">Navigation links for the application.</SheetDescription>
                            </SheetHeader>
                           {isSessionReady && (
                             <div className="flex-1 overflow-y-auto pt-4">
                                <Nav 
                                    userRoles={user.roles} 
                                    activeRole={activeRole}
                                    onRoleSwitchRequired={(role) => handleOpenRoleSwitcher(role)}
                                />
                             </div>
                           )}
                        </SheetContent>
                    </Sheet>
                    <div className="md:hidden">
                        <HeaderTitle />
                    </div>
                     <div className="w-full flex-1 flex justify-end items-center gap-4">
                        {user.isLoggedIn ? (
                            <>
                            {hasAdminAccess && (
                                <>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="relative">
                                            <HandCoins className="h-5 w-5 text-green-600" />
                                            {donationsNotificationCount > 0 && (
                                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                                                    {donationsNotificationCount}
                                                </span>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-80" align="end">
                                        <DropdownMenuLabel>Pending Donations ({donationsNotificationCount})</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {donationsNotificationCount > 0 ? (
                                            pendingDonations.slice(0, 5).map(donation => (
                                                <DropdownMenuItem key={donation.id} onSelect={() => handleNotificationClick('Admin', `/admin/donations/${donation.id!}/edit`)}>
                                                    <p className="font-semibold text-destructive">Verify: ₹{donation.amount.toLocaleString()} from {donation.donorName}</p>
                                                    <p className="text-xs text-muted-foreground ml-4">
                                                        {formatDistanceToNow(donation.createdAt as Date, { addSuffix: true })}
                                                    </p>
                                                </DropdownMenuItem>
                                            ))
                                        ) : (
                                            <div className="px-2 py-4 text-center text-sm text-muted-foreground">No pending donations.</div>
                                        )}
                                        {donationsNotificationCount > 0 && <DropdownMenuSeparator />}
                                        <DropdownMenuItem onSelect={() => handleNotificationClick('Admin', '/admin/donations?status=Pending+verification')}>View All Pending Donations</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="relative">
                                            <FileUp className="h-5 w-5 text-blue-600" />
                                            {leadsNotificationCount > 0 && (
                                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                                                    {leadsNotificationCount}
                                                </span>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-80" align="end">
                                        <DropdownMenuLabel>Pending Lead Actions ({leadsNotificationCount})</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {leadsNotificationCount > 0 ? (
                                            <>
                                                {pendingLeads.slice(0, 3).map(lead => (
                                                    <DropdownMenuItem key={lead.id} onSelect={() => handleNotificationClick('Admin', `/admin/leads/${lead.id}`)}>
                                                        <p className="font-semibold text-destructive">Verify: {lead.name}</p>
                                                    </DropdownMenuItem>
                                                ))}
                                                {readyToPublishLeads.slice(0, 2).map(lead => (
                                                    <DropdownMenuItem key={lead.id} onSelect={() => handleNotificationClick('Admin', `/admin/leads/${lead.id}/edit`)}>
                                                        <p className="font-semibold text-blue-600">Publish: {lead.name}</p>
                                                    </DropdownMenuItem>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="px-2 py-4 text-center text-sm text-muted-foreground">No pending lead actions.</div>
                                        )}
                                        {leadsNotificationCount > 0 && <DropdownMenuSeparator />}
                                        <DropdownMenuItem onSelect={() => handleNotificationClick('Admin', '/admin/leads?verification=Pending')}>View All Pending Leads</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                </>
                            )}
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="female portrait" />
                                            <AvatarFallback>{user.initials}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user.name}</p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                ID: {user.userId}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                     <DropdownMenuItem asChild>
                                        <Link href="/home">
                                            <Home className="mr-2 h-4 w-4" />
                                            <span>Home</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile/settings">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                        </Link>
                                    </DropdownMenuItem>
                                     {user.roles.length > 1 && (
                                        <DropdownMenuItem onClick={() => handleOpenRoleSwitcher()}>
                                            <UsersIcon className="mr-2 h-4 w-4" />
                                            <span>Switch Role ({user.activeRole})</span>
                                        </DropdownMenuItem>
                                     )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleLogout()}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </>
                        ) : (
                             <>
                                {pathname !== '/login' && (
                                     <Button asChild>
                                        <Link href="/login">
                                            <LogIn className="mr-2 h-4 w-4" />
                                            Login
                                        </Link>
                                    </Button>
                                )}
                             </>
                        )}
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {childrenWithProps}
                </main>
                <Footer organization={organization} />
            </div>
            {user.isLoggedIn && (
                 <RoleSwitcherDialog 
                    open={isRoleSwitcherOpen} 
                    onOpenChange={handleOpenChange} 
                    availableRoles={user.roles}
                    onRoleChange={handleRoleChange}
                    currentUserRole={user.activeRole}
                    requiredRole={requiredRole}
                    isMandatory={isMandatory}
                />
            )}
        </div>
    )
}
