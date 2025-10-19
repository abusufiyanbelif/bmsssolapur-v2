
"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { LogIn, LogOut, Menu, Users as UsersIcon, User, Home, Loader2, Bell, AlertTriangle, FileCheck, HandHeart, Megaphone, ArrowRightLeft, Shield, FileText, Edit, Check } from "lucide-react";
import { RoleSwitcherDialog } from "./role-switcher-dialog";
import { useState, useEffect, useCallback, useRef } from "react";
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
import type { User as UserType, Lead as LeadType, Donation as DonationType, Organization, OrganizationFooter } from "@/services/types";
import { formatDistanceToNow } from "date-fns";
import { Logo } from "./logo";
import { getAppSettings, getCurrentOrganization } from "@/app/admin/settings/actions";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { checkDatabaseConnection } from "@/app/services/actions";
import { getCurrentUser, getAdminNotificationData } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";

export const AdminEditButton = ({ editPath }: { editPath: string }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    
    useEffect(() => {
        const role = localStorage.getItem('activeRole');
        if (role && (role === 'Admin' || role === 'Super Admin')) {
            setIsAdmin(true);
        }
    }, []);

    if (!isAdmin) return null;

    return (
        <Button asChild>
            <Link href={editPath}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Page Content
            </Link>
        </Button>
    )
}

const defaultFooter: OrganizationFooter = {
    organizationInfo: { titleLine1: 'Baitul Mal (System Default)', titleLine2: 'Samajik Sanstha (System Default)', titleLine3: '(Solapur) (System Default)', description: 'Default description text. Please seed or create an organization profile to update this.', registrationInfo: 'Reg. No. (System Default)', taxInfo: 'PAN: (System Default)' },
    contactUs: { title: 'Contact Us (System Default)', address: 'Default Address, Solapur', email: 'contact@example.com' },
    keyContacts: { title: 'Key Contacts', contacts: [{name: 'Default Contact', phone: '0000000000'}] },
    connectWithUs: { title: 'Connect With Us (System Default)', socialLinks: [] },
    ourCommitment: { title: 'Our Commitment (System Default)', text: 'Default commitment text. Please update this in the layout settings.', linkText: 'Learn More', linkUrl: '#' },
    copyright: { text: `© ${new Date().getFullYear()} Organization Name. All Rights Reserved. (System Default)` }
};


const PermissionErrorState = ({ error }: { error: string }) => {
    const isPermissionDenied = error === 'permission-denied';

    return (
        <div className="flex flex-col flex-1 items-center justify-center h-screen p-4 bg-background">
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

const loadingSteps = [
  "Initializing Next.js server",
  "Connecting to Firebase services",
  "Authenticating user session",
  "Loading organization profile",
  "Fetching dashboard data",
  "Rendering dashboard",
];

const LoadingState = () => {
    const [stepTimings, setStepTimings] = useState<number[]>([]);
    const [allStepsComplete, setAllStepsComplete] = useState(false);
    const startTimeRef = useRef(performance.now());
  
    useEffect(() => {
      const timers = loadingSteps.map((_, index) =>
        setTimeout(() => {
          setStepTimings(prev => {
            const newTimings = [...prev];
            newTimings[index] = performance.now() - startTimeRef.current;
            return newTimings;
          });
          if (index === loadingSteps.length - 1) {
              setAllStepsComplete(true);
          }
        }, (index + 1) * 400 + index * 50)
      );
  
      return () => timers.forEach(clearTimeout);
    }, []);
  
    const getStepStatus = (index: number) => {
        if (stepTimings[index] !== undefined) return 'completed';
        if (stepTimings[index - 1] !== undefined || (index === 0 && stepTimings[0] === undefined)) return 'loading';
        return 'pending';
    };
    
    const totalDuration = stepTimings.length > 0 ? stepTimings[stepTimings.length - 1] : 0;

    return (
        <div className="flex flex-col flex-1 items-center justify-center h-screen bg-background">
        <div className="w-full max-w-lg p-8">
            <div className="flex justify-center items-center gap-4 mb-8">
            <Loader2 className="animate-spin rounded-full h-12 w-12 text-primary" />
            <div>
                <h2 className="text-2xl font-bold tracking-tight font-headline text-primary">Initializing Application</h2>
                <p className="text-muted-foreground">Please wait a moment...</p>
            </div>
            </div>
            <div className="space-y-3">
            {loadingSteps.map((step, index) => {
                const status = getStepStatus(index);
                const duration = index > 0 
                    ? (stepTimings[index] - stepTimings[index - 1])
                    : stepTimings[index];
                
                return (
                    <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                            {status === 'completed' ? (
                                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                            ) : status === 'loading' ? (
                                <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                            ) : (
                                <div className="h-5 w-5 border-2 border-muted-foreground/30 rounded-full flex-shrink-0" />
                            )}
                            <span className={cn(
                                "transition-colors duration-300",
                                status === 'completed' ? "text-foreground" : "text-muted-foreground"
                            )}>
                                {step}
                            </span>
                        </div>
                        {duration !== undefined && (
                             <span className="font-mono text-xs text-muted-foreground">{duration.toFixed(0)}ms</span>
                        )}
                    </div>
                )
            })}
            </div>
            {allStepsComplete && (
                <div className="text-center text-sm font-semibold text-primary mt-8 border-t pt-4">
                    Total Load Time: {(totalDuration / 1000).toFixed(2)} seconds
                </div>
            )}
        </div>
        </div>
    );
};


const allowedGuestPaths = ['/', '/login', '/register', '/public-leads', '/campaigns', '/organization'];

export function AppShell({ children }: { children: React.ReactNode }) {
    const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
    const [requiredRole, setRequiredRole] = useState<string | null>(null);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [pendingLeads, setPendingLeads] = useState<LeadType[]>([]);
    const [readyToPublishLeads, setReadyToPublishLeads] = useState<LeadType[]>([]);
    const [pendingDonations, setPendingDonations] = useState<DonationType[]>([]);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();

    const [sessionState, setSessionState] = useState<'loading' | 'ready' | 'error'>('loading');
    const [sessionUser, setSessionUser] = useState<UserType & { isLoggedIn: boolean; activeRole: string; initials: string; avatar: string; } | null>(null);

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
    
    // Function to fetch organization data, memoized with useCallback
    const fetchOrganizationData = useCallback(async () => {
        try {
            const orgData = await getCurrentOrganization();
            setOrganization(orgData);
        } catch (e) {
            console.error("Failed to fetch organization data in AppShell", e);
        }
    }, []);

    // This is the core session initialization and redirection logic.
    useEffect(() => {
        const initializeSession = async () => {
            setSessionState('loading');
            
            // The database initialization now handles its own checks.
            // We only need to fetch org data.
            await fetchOrganizationData();

            const storedUserId = localStorage.getItem('userId');
            const isGuestPath = allowedGuestPaths.some(p => pathname === p || (p !== '/' && pathname.startsWith(p)));

            if (!storedUserId) {
                setSessionUser(guestUser);
                setSessionState('ready');
                 if (!isGuestPath) {
                    router.push('/');
                }
                return;
            } 
            
            let fetchedUser: UserType | null = null;
            try {
                fetchedUser = await getCurrentUser(storedUserId);
            } catch (e) {
                 const err = e as Error;
                 if (err.message.includes('permission-denied') || err.message.includes('UNAUTHENTICATED')) {
                    setPermissionError('permission-denied');
                 } else {
                    setPermissionError(err.message);
                 }
                 setSessionState('error');
                 return;
            }


            if (!fetchedUser) {
                // If user ID is in storage but user not found in DB, it's a stale session.
                console.log("Stale session found. Logging out.");
                handleLogout(true); // This will reload the page as a guest.
                return;
            }

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
            setSessionUser(userData);
            
            // --- REDIRECTION LOGIC ---
            if (isGuestPath) {
                router.push('/home');
                return;
            }
            
            if (pathname === '/home') {
                const shouldShowRoleSwitcher = localStorage.getItem('showRoleSwitcher') === 'true';
                if (shouldShowRoleSwitcher && fetchedUser.roles.length > 1) {
                    setIsRoleSwitcherOpen(true);
                    localStorage.removeItem('showRoleSwitcher'); 
                }
            }
            
            setSessionState('ready');
        };

        initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, fetchOrganizationData]); // Add fetchOrganizationData to dependency array

    useEffect(() => {
        if (sessionUser?.isLoggedIn && sessionUser.roles.some(r => ['Admin', 'Super Admin', 'Finance Admin'].includes(r))) {
            const fetchNotifications = async () => {
                const { pendingLeads, readyToPublishLeads, pendingDonations } = await getAdminNotificationData();
                setPendingLeads(pendingLeads);
                setReadyToPublishLeads(readyToPublishLeads);
                setPendingDonations(pendingDonations);
            };
            fetchNotifications();
        }
    }, [sessionUser]);


    const handleRoleChange = (newRole: string) => {
        if (!sessionUser || !sessionUser.isLoggedIn) return;
        const previousRole = sessionUser.activeRole;
        localStorage.setItem('activeRole', newRole);

        if (sessionUser.isLoggedIn) {
            logActivity({
                userId: sessionUser.id!,
                userName: sessionUser.name,
                userEmail: sessionUser.email,
                role: newRole,
                activity: "Switched Role",
                details: { from: previousRole, to: newRole },
            });
        }
        window.location.href = redirectUrl || '/home';
    };
    
    const handleLogout = (shouldRedirect = true) => {
        localStorage.removeItem('userId');
        localStorage.removeItem('activeRole');
        setSessionUser(guestUser);
        if (shouldRedirect) {
             window.location.href = '/';
        }
    }

    const handleOpenRoleSwitcher = (requiredRole: string | null = null, redirect?: string) => {
        setRequiredRole(requiredRole);
        setRedirectUrl(redirect || null);
        setIsRoleSwitcherOpen(true);
    };
    
    const handleNotificationClick = (requiredRole: string, href: string) => {
        if (!sessionUser || !sessionUser.isLoggedIn) return;
        const hasSufficientRole = ['Admin', 'Super Admin', 'Finance Admin'].includes(sessionUser.activeRole);

        if(hasSufficientRole) {
            router.push(href);
        } else if (sessionUser.roles.includes(requiredRole as any)) {
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
        setIsRoleSwitcherOpen(open);
        if (!open) {
            setRequiredRole(null);
        }
    };
    
    const HeaderTitle = () => {
        const orgData = organization || { name: 'Baitul Mal Samajik Sanstha', footer: defaultFooter };
        const orgInfo = orgData.footer?.organizationInfo;
        
        return (
            <Link href="/" className="flex items-center gap-3" title={orgData.name}>
                <Logo className="h-10 w-10" logoUrl={organization?.logoUrl} />
                 <div className="flex flex-col leading-tight">
                    <span className="font-bold font-headline text-primary text-sm">{orgInfo?.titleLine1 || orgData.name}</span>
                    {orgInfo?.titleLine2 && <span className="font-bold font-headline text-accent text-sm">{orgInfo.titleLine2}</span>}
                    {orgInfo?.titleLine3 && <span className="font-bold font-headline text-primary text-xs">{orgInfo.titleLine3}</span>}
                </div>
            </Link>
        )
    };

    if (permissionError) return <PermissionErrorState error={permissionError} />;
    if (sessionState === 'loading' || !sessionUser) return <LoadingState />;

    const activeRole = sessionUser.activeRole;
    const hasAdminAccess = sessionUser.roles.some(r => ['Admin', 'Super Admin', 'Finance Admin'].includes(r));
    const leadsNotificationCount = hasAdminAccess ? (pendingLeads.length + readyToPublishLeads.length) : 0;
    const donationsNotificationCount = hasAdminAccess ? pendingDonations.length : 0;

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-card md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-16 items-center border-b px-4 lg:px-6">
                        <HeaderTitle />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <Nav 
                            userRoles={sessionUser.roles} 
                            userPrivileges={sessionUser.privileges || []}
                            activeRole={activeRole}
                            onRoleSwitchRequired={(role) => handleOpenRoleSwitcher(role)}
                        />
                    </div>
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
                            <SheetHeader className="h-16 items-center border-b px-4 lg:px-6">
                               <HeaderTitle />
                               <SheetTitle className="sr-only">Main Menu</SheetTitle>
                               <SheetDescription className="sr-only">Navigation links for the application.</SheetDescription>
                            </SheetHeader>
                             <div className="flex-1 overflow-y-auto pt-4">
                                <Nav 
                                    userRoles={sessionUser.roles} 
                                    userPrivileges={sessionUser.privileges || []}
                                    activeRole={activeRole}
                                    onRoleSwitchRequired={(role) => handleOpenRoleSwitcher(role)}
                                />
                             </div>
                        </SheetContent>
                    </Sheet>
                    <div className="md:hidden">
                        <HeaderTitle />
                    </div>
                     <div className="w-full flex-1 flex justify-end items-center gap-4">
                        {sessionUser.isLoggedIn ? (
                            <>
                            {hasAdminAccess && (
                                <>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="relative">
                                            <HandHeart className="h-5 w-5 text-green-600" />
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
                                            <FileText className="h-5 w-5 text-blue-600" />
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
                                            <AvatarImage src={sessionUser.avatar} alt={sessionUser.name} data-ai-hint="female portrait" />
                                            <AvatarFallback>{sessionUser.initials}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{sessionUser.name}</p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                ID: {sessionUser.userId}
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
                                     {sessionUser.roles.length > 1 && (
                                        <DropdownMenuItem onClick={() => handleOpenRoleSwitcher()}>
                                            <UsersIcon className="mr-2 h-4 w-4" />
                                            <span>Switch Role ({sessionUser.activeRole})</span>
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
                    {children}
                </main>
                <Footer organization={organization} />
            </div>
            {sessionUser.isLoggedIn && (
                 <RoleSwitcherDialog 
                    open={isRoleSwitcherOpen} 
                    onOpenChange={handleOpenChange} 
                    availableRoles={sessionUser.roles}
                    onRoleChange={handleRoleChange}
                    currentUserRole={sessionUser.activeRole}
                    requiredRole={requiredRole}
                />
            )}
        </div>
    );
}
