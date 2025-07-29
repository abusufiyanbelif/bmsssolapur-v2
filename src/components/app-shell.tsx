
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
    const [requiredRole, setRequiredRole] = useState<string | null>(null);

    // In a real app, this would come from your authentication context.
    // We now default to a logged-out 'Guest' user.
    const [user, setUser] = useState({
        isLoggedIn: false, // Set to false to simulate a logged-out user (Guest)
        roles: ["Super Admin", "Admin", "Donor", "Beneficiary"],
        activeRole: "Guest", // Default role is Guest
    });

    const handleRoleChange = (newRole: string) => {
        setUser(currentUser => ({...currentUser, activeRole: newRole}));
        setRequiredRole(null); // Reset required role after switching
    };

    const handleOpenRoleSwitcher = (requiredRoleName: string | null = null) => {
        setRequiredRole(requiredRoleName);
        setIsRoleSwitcherOpen(true);
    };

    const handleOpenChange = (open: boolean) => {
        setIsRoleSwitcherOpen(open);
        if (!open) {
            setRequiredRole(null); // Reset on close
        }
    };

    const activeRole = user.isLoggedIn ? user.activeRole : "Guest";

    // This is a simulation function for logging in, you can trigger it from a button or effect.
    // For demonstration, you might call this from a temporary button or a useEffect hook.
    const simulateLogin = () => {
        setUser({
            isLoggedIn: true,
            roles: ["Super Admin", "Admin", "Donor", "Beneficiary"],
            activeRole: "Super Admin", // Default to Super Admin on login for this demo
        });
    };

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
                        <Nav 
                            userRoles={user.isLoggedIn ? user.roles : ["Guest"]} 
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
                                <a href="/" className="flex items-center gap-2 font-semibold">
                                    <Package2 className="h-6 w-6 text-primary" />
                                    <span className="font-headline">Baitul Mal Samajik Sanstha (Solapur)</span>
                                </a>
                            </div>
                            <Nav 
                                userRoles={user.isLoggedIn ? user.roles : ["Guest"]} 
                                activeRole={activeRole}
                                onRoleSwitchRequired={handleOpenRoleSwitcher}
                            />
                        </SheetContent>
                    </Sheet>
                     <div className="w-full flex-1 flex justify-end gap-2">
                        {/* A temporary button to simulate logging in. You can remove this later. */}
                        {!user.isLoggedIn && <Button onClick={simulateLogin}>Login (Simulated)</Button>}
                        {user.isLoggedIn && user.roles.length > 1 && (
                             <Button variant="outline" onClick={() => handleOpenRoleSwitcher()}>
                                <Users className="mr-2 h-4 w-4" />
                                Switch Role ({user.activeRole})
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
                    currentUserRole={user.activeRole}
                    requiredRole={requiredRole}
                />
            )}
        </div>
    )
}
