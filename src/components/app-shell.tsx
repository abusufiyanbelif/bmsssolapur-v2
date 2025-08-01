
"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogIn, LogOut, Menu, Users, User, Home } from "lucide-react";
import { RoleSwitcherDialog } from "./role-switcher-dialog";
import { useState, useEffect } from "react";
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
import { Nav } from "./nav";
import type { User as UserType } from "@/services/user-service";
import { getUser } from "@/services/user-service";
import { Timestamp } from "firebase/firestore";


export function AppShell({ children }: { children: React.ReactNode }) {
    const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
    const [requiredRole, setRequiredRole] = useState<string | null>(null);
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
    
    const [user, setUser] = useState<UserType & { isLoggedIn: boolean; activeRole: string; initials: string; avatar: string; }>(guestUser);
    
    useEffect(() => {
        const checkUser = async () => {
            const storedUserId = localStorage.getItem('userId');
            const shouldShowRoleSwitcher = localStorage.getItem('showRoleSwitcher') === 'true';

            if (storedUserId && storedUserId !== guestUser.id) {
                const fetchedUser = await getUser(storedUserId);
                if (fetchedUser) {
                    const savedRole = localStorage.getItem('activeRole');
                    // Ensure the saved role is actually one the user has, otherwise default
                    const activeRole = (savedRole && fetchedUser.roles.includes(savedRole as any)) ? savedRole : fetchedUser.roles[0];
                    
                    setUser({
                        ...fetchedUser,
                        isLoggedIn: true,
                        activeRole: activeRole,
                        initials: fetchedUser.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase(),
                        avatar: `https://placehold.co/100x100.png?text=${fetchedUser.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}`
                    });

                    // Show role switcher on first load after login if flag is set
                    if (shouldShowRoleSwitcher && fetchedUser.roles.length > 1) {
                        setIsRoleSwitcherOpen(true);
                        localStorage.removeItem('showRoleSwitcher'); // Consume the flag
                    }
                } else {
                    // If user ID is invalid, log them out.
                    handleLogout();
                }
            } else {
                setUser(guestUser);
            }
        };
        checkUser();
    }, [pathname]); // Rerun on path change to catch login redirects


    const handleRoleChange = (newRole: string) => {
        const previousRole = user.activeRole;
        setUser(currentUser => ({...currentUser, activeRole: newRole}));
        localStorage.setItem('activeRole', newRole);
        setRequiredRole(null); 

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
    };
    
    const handleLogout = () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('activeRole');
        setUser(guestUser);
        router.push('/');
    }

    const handleOpenRoleSwitcher = (requiredRoleName: string | null = null) => {
        setRequiredRole(requiredRoleName);
        setIsRoleSwitcherOpen(true);
    };

    const handleOpenChange = (open: boolean) => {
        setIsRoleSwitcherOpen(open);
        if (!open) {
            setRequiredRole(null);
        }
    };

    const activeRole = user.activeRole;

    const HeaderTitle = () => (
        <a href="/" className="flex items-center gap-2" title="Baitul Mal Samajik Sanstha (Solapur)">
            <Logo className="h-10 w-auto" />
            <div className="font-headline text-sm font-bold whitespace-nowrap">
                <span className="text-primary font-bold">BM</span>{' '}
                <span className="text-accent font-bold">SS</span>{' '}
                 <span className="text-primary font-bold">Solapur</span>
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
                    <div className="flex-1">
                        <Nav 
                            userRoles={user.roles} 
                            activeRole={activeRole}
                            onRoleSwitchRequired={handleOpenRoleSwitcher}
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
                            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                               <HeaderTitle />
                            </div>
                            <Nav 
                                userRoles={user.roles}
                                activeRole={activeRole}
                                onRoleSwitchRequired={handleOpenRoleSwitcher}
                            />
                        </SheetContent>
                    </Sheet>
                     <div className="w-full flex-1 flex justify-end items-center gap-4">
                        {user.isLoggedIn ? (
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
                                                {user.email}
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
                                        <Link href="/profile">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                        </Link>
                                    </DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => handleOpenRoleSwitcher()}>
                                        <Users className="mr-2 h-4 w-4" />
                                        <span>Switch Role ({user.activeRole})</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                             <>
                                {pathname !== '/login' && (
                                     <Button asChild>
                                        <Link href="/login">
                                            <LogIn className="mr-2 h-4 w-4" />
                                            Login / Register
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
                />
            )}
        </div>
    )
}

    