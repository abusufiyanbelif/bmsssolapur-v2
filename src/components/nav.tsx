
"use client";

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
    Home, Settings, Share2, ShieldCheck, UserCog, HandHeart, Users,
    FileCheck, FileText, Banknote, UserPlus, Lock, BookText,
    Wrench, Download, Eye, Megaphone, Info, LogIn, Server, BrainCircuit
} from "lucide-react"

import { cn } from "@/lib/utils"

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[]; // Roles that can see and access this link
  subRoles?: string[];
};

// A single source of truth for all navigation items
const allNavItems: NavItem[] = [
    // Guest
    { href: "/", label: "Home", icon: Home, roles: ["Guest"] },
    { href: "/campaigns", label: "Approved Campaigns", icon: Megaphone, roles: ["Guest"] },
    { href: "/organization", label: "Organization Details", icon: Info, roles: ["Guest"] },
    { href: "/login", label: "Login / Register", icon: LogIn, roles: ["Guest"] },
    
    // Authenticated User Home
    { href: "/home", label: "Home", icon: Home, roles: ["Donor", "Beneficiary"] },
    
    // Donor
    { href: "/campaigns", label: "Approved Leads", icon: FileCheck, roles: ["Donor"] },
    { href: "/my-donations", label: "My Donations", icon: HandHeart, roles: ["Donor"] },

    // Beneficiary
    { href: "/my-cases", label: "My Cases", icon: FileText, roles: ["Beneficiary"] },
    { href: "/campaigns", label: "View Public Campaigns", icon: Megaphone, roles: ["Beneficiary"] },
    
    // Admin
    { href: "/admin", label: "Dashboard", icon: Home, roles: ["Admin", "Super Admin"] },
    { href: "/admin/leads", label: "All Leads", icon: Users, roles: ["Admin", "Super Admin"] },
    { href: "/admin/donations", label: "Donations", icon: Banknote, roles: ["Admin", "Super Admin"], subRoles: ["Finance Admin", "Super Admin"] },
    
    // Super Admin
    { href: "/admin/user-management", label: "User Management", icon: UserPlus, roles: ["Super Admin"] },
    { href: "/admin/role-assignment", label: "Role Assignment", icon: Lock, roles: ["Super Admin"] },
    { href: "/admin/logs", label: "All Logs", icon: BookText, roles: ["Super Admin"] },
    { href: "/admin/app-settings", label: "App Settings", icon: Settings, roles: ["Super Admin"] },
    { href: "/admin/maintenance", label: "Maintenance Toggle", icon: Wrench, roles: ["Super Admin"] },
    { href: "/admin/export", label: "Data Export", icon: Download, roles: ["Super Admin"] },
    { href: "/admin/module-visibility", label: "Module Visibility", icon: Eye, roles: ["Super Admin"] },
    
    // Shared / Profile
    { href: "/profile", label: "Profile", icon: UserCog, roles: ["Donor", "Beneficiary", "Admin", "Super Admin"] },

    // Super Admin Dev/Debug Tools
    { href: "/services", label: "Services Summary", icon: Server, roles: ["Super Admin"] },
    { href: "/dependencies", label: "Dependency Map", icon: Share2, roles: ["Super Admin"] },
    { href: "/validator", label: "Configuration Validator", icon: ShieldCheck, roles: ["Super Admin"] },
    { href: "/personas", label: "AI Personas", icon: BrainCircuit, roles: ["Super Admin"] },
];

interface NavProps {
    userRoles: string[];
    activeRole: string;
    onRoleSwitchRequired: (requiredRole: string) => void;
}

export function Nav({ userRoles, activeRole, onRoleSwitchRequired }: NavProps) {
    const pathname = usePathname();
    const router = useRouter();
    
    // Filter nav items based on ALL roles the user possesses
    const visibleNavItems = allNavItems.filter(item => 
        item.roles.some(role => userRoles.includes(role))
    );

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
        // Find the first role from the item's roles that the user actually has
        const requiredRoleForLink = item.roles.find(r => userRoles.includes(r));
        
        // Check if the user's active role is sufficient. Guests are a special case.
        if (activeRole === "Guest" || item.roles.includes(activeRole)) {
            // If role is sufficient, navigate normally
            return;
        }

        // If the role is NOT sufficient
        e.preventDefault(); // Stop navigation
        if (requiredRoleForLink) {
            onRoleSwitchRequired(requiredRoleForLink);
        }
    };

    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 overflow-y-auto">
            {visibleNavItems.map((item) => {
                const isActive = (item.href === '/' && pathname === '/') || 
                                 (item.href !== '/' && pathname.startsWith(item.href));
                
                // In a real implementation, you would also check sub-roles here
                // if (item.subRoles && !currentUser.subRoles.some(r => item.subRoles.includes(r))) {
                //     return null;
                // }

                return (
                    <Link
                        key={item.href + item.label}
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item)}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                            {
                                "bg-muted text-primary": isActive,
                            }
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
