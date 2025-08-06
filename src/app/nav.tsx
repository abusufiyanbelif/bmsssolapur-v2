
"use client";

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
    Home, Settings, Share2, ShieldCheck, UserCog, HandHeart, Users,
    FileCheck, FileText, Banknote, UserPlus, BookText,
    Wrench, Download, Eye, Megaphone, Info, LogIn, Server, BrainCircuit, FilePlus2,
    Database, Building
} from "lucide-react"

import { cn } from "@/lib/utils"

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  // Roles that are ALLOWED to see this link.
  // The link will be shown if the user's active role matches one of these.
  allowedRoles: string[]; 
};

// A single source of truth for all navigation items
const allNavItems: NavItem[] = [
    // Guest
    { href: "/", label: "Home", icon: Home, allowedRoles: ["Guest"] },
    { href: "/campaigns", label: "Approved Campaigns", icon: Megaphone, allowedRoles: ["Guest"] },
    { href: "/donate", label: "Donate", icon: HandHeart, allowedRoles: ["Guest"] },
    { href: "/organization", label: "Organization Details", icon: Info, allowedRoles: ["Guest"] },
    
    // Authenticated User Home (for non-admins)
    { href: "/home", label: "Home", icon: Home, allowedRoles: ["Donor", "Beneficiary", "Referral"] },
    
    // Donor
    { href: "/campaigns", label: "Approved Leads", icon: FileCheck, allowedRoles: ["Donor"] },
    { href: "/my-donations", label: "My Donations", icon: HandHeart, allowedRoles: ["Donor"] },

    // Beneficiary
    { href: "/my-cases", label: "My Cases", icon: FileText, allowedRoles: ["Beneficiary"] },
    { href: "/request-help", label: "Request Help", icon: FilePlus2, allowedRoles: ["Beneficiary"] },
    { href: "/campaigns", label: "View Public Campaigns", icon: Megaphone, allowedRoles: ["Beneficiary"] },
    
    // Admin
    { href: "/admin", label: "Dashboard", icon: Home, allowedRoles: ["Admin", "Super Admin", "Finance Admin"] },
    { href: "/admin/leads", label: "All Leads", icon: Users, allowedRoles: ["Admin", "Super Admin"] },
    { href: "/admin/beneficiaries", label: "All Beneficiaries", icon: Users, allowedRoles: ["Admin", "Super Admin"] },
    { href: "/admin/donations", label: "Donations", icon: Banknote, allowedRoles: ["Admin", "Super Admin", "Finance Admin"] },
    
    // Super Admin
    { href: "/admin/user-management", label: "User Management", icon: UserCog, allowedRoles: ["Super Admin"] },
    { href: "/admin/organization", label: "Organization", icon: Building, allowedRoles: ["Super Admin"] },
    { href: "/admin/settings", label: "App Settings", icon: Settings, allowedRoles: ["Super Admin"] },
    { href: "/admin/seed", label: "Seed Database", icon: Database, allowedRoles: ["Super Admin"] },
    { href: "/services", label: "Services Summary", icon: Server, allowedRoles: ["Super Admin"] },
    { href: "/dependencies", label: "Dependency Map", icon: Share2, allowedRoles: ["Super Admin"] },
    { href: "/validator", label: "Configuration Validator", icon: ShieldCheck, allowedRoles: ["Super Admin"] },
    { href: "/personas", label: "AI Personas", icon: BrainCircuit, allowedRoles: ["Super Admin"] },
    
    // Shared / Profile (Visible to all logged-in users)
    { href: "/profile", label: "Profile", icon: UserCog, allowedRoles: ["Donor", "Beneficiary", "Admin", "Super Admin", "Finance Admin", "Referral"] },
];

interface NavProps {
    userRoles: string[];
    activeRole: string;
    onRoleSwitchRequired: (requiredRole: string) => void;
}

export function Nav({ userRoles, activeRole, onRoleSwitchRequired }: NavProps) {
    const pathname = usePathname();
    
    // Filter nav items based on the user's ACTIVE role.
    const visibleNavItems = allNavItems.filter(item => 
        item.allowedRoles.includes(activeRole)
    );

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
        // If the active role can see the link, just navigate.
        if (item.allowedRoles.includes(activeRole)) {
            return;
        }

        // If the active role CANNOT see the link, but the user HAS a role that can...
        const requiredRole = item.allowedRoles.find(role => userRoles.includes(role));
        if (requiredRole) {
            e.preventDefault(); // Stop navigation
            onRoleSwitchRequired(requiredRole); // Prompt to switch
        }
        // If the user doesn't have any role that can access it, the link won't be rendered anyway.
    };

    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 overflow-y-auto">
            {visibleNavItems.map((item) => {
                const isActive = (item.href === '/' && pathname === '/') || 
                                 (item.href !== '/' && pathname.startsWith(item.href));

                return (
                    <Link
                        key={item.href + item.label + activeRole} // Add activeRole to key to force re-render on role change
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
