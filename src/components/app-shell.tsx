
"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Package2, Users } from "lucide-react";
import { Nav } from "./nav";
import { RoleSwitcherDialog } from "./role-switcher-dialog";
import { useState } from "react";
import { Footer } from "./footer";

export function AppShell({ children }: { children: React.ReactNode }) {
    const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);

    // In a real app, this would come from your authentication context.
    // For now, we simulate a user who is logged in and has an active role.
    // To simulate a guest user, set isLoggedIn to false.
    const [user, setUser] = useState({
        isLoggedIn: false, // Default to logged-out state
        roles: ["Super Admin", "Admin", "Donor", "Beneficiary"],
        activeRole: "Super Admin", // Change this to test different roles
    });

    const handleOpenRoleSwitcher = () => setIsRoleSwitcherOpen(true);
    
    const handleRoleChange = (newRole: string) => {
        setUser(currentUser => ({...currentUser, activeRole: newRole}));
    };

    const handleOpenChange = (open: boolean) => {
        setIsRoleSwitcherOpen(open);
    };

    // To test the logged-in view, you can manually change isLoggedIn to true here.
    // In a real app, a login function would update this state.
    const activeRole = user.isLoggedIn ? user.activeRole : "Guest";

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-card md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <a href="/" className="flex items-center gap-2 font-semibold">
                            <Package2 className="h-6 w-6 text-primary" />
                            <span className="font-headline">Baitul Mal Samajik Sanstha (Solapur)</span>
                        </a>
                    </div>
                    <div className="flex-1">
                        <Nav activeRole={activeRole} />
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
                                <a href="/" className="flex items-center gap-2 font-semibold">
                                    <Package2 className="h-6 w-6 text-primary" />
                                    <span className="font-headline">Baitul Mal Samajik Sanstha (Solapur)</span>
                                </a>
                            </div>
                            <Nav activeRole={activeRole} />
                        </SheetContent>
                    </Sheet>
                     <div className="w-full flex-1 flex justify-end">
                        {user.isLoggedIn && user.roles.length > 1 && (
                             <Button variant="outline" onClick={handleOpenRoleSwitcher}>
                                <Users className="mr-2 h-4 w-4" />
                                Switch Role
                            </Button>
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
                />
            )}
        </div>
    )
}
