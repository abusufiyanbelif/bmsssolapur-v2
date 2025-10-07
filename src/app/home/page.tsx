

'use client';

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { Loader2 } from "lucide-react";
import { RoleSwitcherDialog } from "@/components/role-switcher-dialog";
import { getUser, User } from "@/services/user-service";

// This is now the central "router" page after login.
// It decides whether to show the role switcher or redirect to a dashboard.
export default function HomePage() {
    const router = useRouter();
    const [status, setStatus] = useState("Initializing session...");
    const [user, setUser] = useState<User | null>(null);
    const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

    useEffect(() => {
        const initialize = async () => {
            const userId = localStorage.getItem('userId');
            const shouldShowSwitcher = localStorage.getItem('showRoleSwitcher') === 'true';

            if (!userId) {
                setStatus("No session found. Redirecting to public home page...");
                router.push('/');
                return;
            }

            try {
                const fetchedUser = await getUser(userId);
                if (!fetchedUser) {
                    setStatus("User not found. Logging out...");
                    localStorage.clear();
                    router.push('/');
                    return;
                }
                
                setUser(fetchedUser);
                const activeRole = localStorage.getItem('activeRole') || fetchedUser.roles[0];
                if (!localStorage.getItem('activeRole')) {
                    localStorage.setItem('activeRole', activeRole);
                }

                if (shouldShowSwitcher && fetchedUser.roles.length > 1) {
                    setStatus("Please select a role to continue.");
                    setShowRoleSwitcher(true);
                } else {
                    // Redirect to the correct dashboard based on the active role
                    setStatus(`Redirecting to ${activeRole} dashboard...`);
                    switch (activeRole) {
                        case 'Donor': router.push('/donor'); break;
                        case 'Beneficiary': router.push('/beneficiary'); break;
                        case 'Referral': router.push('/referral'); break;
                        case 'Admin':
                        case 'Super Admin':
                        case 'Finance Admin':
                            router.push('/admin'); break;
                        default: router.push('/'); break;
                    }
                }
            } catch (e) {
                setStatus("Error initializing session. Logging out.");
                localStorage.clear();
                router.push('/');
            }
        };

        initialize();
    }, [router]);

    const handleRoleChange = (newRole: string) => {
        localStorage.setItem('activeRole', newRole);
        localStorage.removeItem('showRoleSwitcher'); // Clear the flag
        setShowRoleSwitcher(false);
        // Force a reload of the app shell to pick up the new role
        window.location.href = '/home'; 
    };

    if (showRoleSwitcher && user) {
        return (
             <RoleSwitcherDialog 
                open={true} 
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        // If user tries to close mandatory dialog, keep it open
                         setShowRoleSwitcher(true);
                    }
                }}
                availableRoles={user.roles}
                onRoleChange={handleRoleChange}
                currentUserRole={user.roles[0]}
                isMandatory={true}
            />
        )
    }

    return (
        <div className="flex flex-col flex-1 items-center justify-center h-full">
            <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary" />
            <p className="mt-4 text-muted-foreground">{status}</p>
        </div>
    );
}

