
"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogIn, LogOut, Menu, Users, User, Home, Loader2, Bell, AlertTriangle } from "lucide-react";
import { RoleSwitcherDialog } from "./role-switcher-dialog";
import { useState, useEffect, Children, cloneElement, isValidElement } from "react";
import { Footer } from "./footer";
import { logActivity } from "@/services/activity-log-service";
import { Logo } from "./logo";
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
import type { User as UserType, Lead as LeadType } from "@/services/types";
import { getUser } from "@/services/user-service";
import { getAllLeads } from "@/services/lead-service";
import { formatDistanceToNow } from "date-fns";


export function AppShell({ children }: { children: React.ReactNode }) {
    const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
    const [requiredRole, setRequiredRole] = useState<string | null>(null);
    const [isSessionReady, setIsSessionReady] = useState(false);
    const [pendingLeads, setPendingLeads] = useState<LeadType[]>([]);
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
        const checkUser = async () => {
            setIsSessionReady(false); // Start session check
            const storedUserId = localStorage.getItem('userId');
            const shouldShowRoleSwitcher = localStorage.getItem('showRoleSwitcher') === 'true';

            if (storedUserId) {
                const fetchedUser = await getUser(storedUserId);
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
                    
                    if (userData.roles.includes("Admin") || userData.roles.includes("Super Admin")) {
                        const allLeads = await getAllLeads();
                        setPendingLeads(allLeads.filter(l => l.verifiedStatus === 'Pending'));
                    }

                    if (shouldShowRoleSwitcher && fetchedUser.roles.length > 1) {
                        setIsRoleSwitcherOpen(true);
                        localStorage.removeItem('showRoleSwitcher'); 
                        // Session is not ready until role is confirmed
                    } else {
                        setIsSessionReady(true);
                    }
                } else {
                    handleLogout();
                }
            } else {
                setUser(guestUser);
                setIsSessionReady(true);
            }
        };
        checkUser();
    }, []); 


    const handleRoleChange = (newRole: string) => {
        if (!user || !user.isLoggedIn) return;

        const previousRole = user.activeRole;
        if (previousRole === newRole && isSessionReady) {
            setIsRoleSwitcherOpen(false);
            return;
        }
        
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
        
        window.location.reload();
    };
    
    const handleLogout = () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('activeRole');
        setUser(guestUser);
        setIsSessionReady(true);
        router.push('/');
    }

    const handleOpenRoleSwitcher = (requiredRoleName: string | null = null) => {
        setRequiredRole(requiredRoleName);
        setIsRoleSwitcherOpen(true);
    };

    const handleOpenChange = (open: boolean) => {
        // Prevent closing the dialog if a role selection is mandatory
        if (!open && isMandatory) {
            return; 
        }
        setIsRoleSwitcherOpen(open);
        if (!open) {
            setRequiredRole(null);
            // If the role switcher was mandatory, confirm session is ready now.
            if (isMandatory) setIsSessionReady(true);
        }
    };
    
    // Derived state to check if the role switcher is mandatory
    const isMandatory = !!user && user.isLoggedIn && !isSessionReady && user.roles.length > 1;

    const childrenWithProps = Children.map(children, child => {
        if (isValidElement(child)) {
            return cloneElement(child as React.ReactElement<any>, { user, activeRole: user?.activeRole });
        }
        return child;
    });
    
    const LoadingState = () => (
        <div className="flex flex-col flex-1 items-center justify-center h-full">
            <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary" />
            <p className="mt-4 text-muted-foreground">Initializing your session...</p>
        </div>
    )

    if (!user) {
        return <LoadingState />
    }

    const activeRole = user.activeRole;
    const notificationCount = pendingLeads.length; // Can be expanded for other roles

    const HeaderTitle = () => (
        <a href="/" className="flex items-center gap-2" title="Baitul Mal Samajik Sanstha (Solapur)">
            <Logo className="h-8 w-auto" />
             <div className="flex flex-col leading-tight">
                <span className="font-bold font-headline text-primary">Baitul Mal</span>
                <span className="font-bold font-headline text-accent">Samajik Sanstha</span>
                 <span className="font-bold font-headline text-primary">(Solapur)</span>
            </div>
        </a>
    );

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-card md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <HeaderTitle />
                    </div>
                    {isSessionReady && (
                        <div className="flex-1 overflow-y-auto">
                            <Nav 
                                userRoles={user.roles} 
                                activeRole={activeRole}
                                onRoleSwitchRequired={handleOpenRoleSwitcher}
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
                            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                               <HeaderTitle />
                            </div>
                           {isSessionReady && (
                             <Nav 
                                userRoles={user.roles}
                                activeRole={activeRole}
                                onRoleSwitchRequired={handleOpenRoleSwitcher}
                            />
                           )}
                        </SheetContent>
                    </Sheet>
                     <div className="w-full flex-1 flex justify-end items-center gap-4">
                        {user.isLoggedIn ? (
                            <>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <Bell className="h-5 w-5" />
                                        {notificationCount > 0 && (
                                            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                                                {notificationCount}
                                            </span>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-80" align="end">
                                    <DropdownMenuLabel>Pending Actions ({notificationCount})</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {notificationCount > 0 ? (
                                        <>
                                            {pendingLeads.slice(0, 5).map(lead => (
                                                <DropdownMenuItem key={lead.id} asChild>
                                                     <Link href={`/admin/leads/${lead.id}`} className="flex flex-col items-start">
                                                        <p className="font-semibold text-destructive">Verify: {lead.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Requested ₹{lead.helpRequested.toLocaleString()} &middot; {formatDistanceToNow(lead.dateCreated.toDate(), { addSuffix: true })}
                                                        </p>
                                                     </Link>
                                                </DropdownMenuItem>
                                            ))}
                                             {notificationCount > 5 && (
                                                <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild>
                                                    <Link href="/admin/leads?verification=Pending">View All Pending Leads</Link>
                                                </DropdownMenuItem>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                                            No pending actions.
                                        </div>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

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
                                            <Users className="mr-2 h-4 w-4" />
                                            <span>Switch Role ({user.activeRole})</span>
                                        </DropdownMenuItem>
                                     )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout}>
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
                    {!isSessionReady ? <LoadingState /> : childrenWithProps}
                </main>
                <Footer />
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
