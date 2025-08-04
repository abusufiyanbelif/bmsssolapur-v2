

"use client";

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
    Home, Settings, Share2, ShieldCheck, UserCog, HandHeart, Users,
    FileCheck, FileText, Banknote, UserPlus, BookText,
    Wrench, Download, Eye, Megaphone, Info, LogIn, Server, BrainCircuit, FilePlus2,
    Database, Building, Award, ChevronDown, Shield, KeySquare, Group
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils"

type NavSubItem = {
    href: string;
    label: string;
    icon?: React.ElementType;
}

type NavItem = {
  href?: string;
  label: string;
  icon: React.ElementType;
  allowedRoles: string[]; 
  subItems?: NavSubItem[];
};

// A single source of truth for all navigation items
const allNavItems: NavItem[] = [
    // Guest
    { href: "/", label: "Home", icon: Home, allowedRoles: ["Guest"] },
    { href: "/campaigns", label: "Verified Cases", icon: Megaphone, allowedRoles: ["Guest"] },
    { href: "/organization", label: "Organization Details", icon: Info, allowedRoles: ["Guest"] },
    
    // Authenticated User Home (for non-admins)
    { href: "/home", label: "Home", icon: Home, allowedRoles: ["Donor", "Referral"] },
    { href: "/home", label: "Dashboard", icon: Home, allowedRoles: ["Beneficiary"] },
    
    // Donor
    { href: "/campaigns", label: "Verified Cases", icon: FileCheck, allowedRoles: ["Donor"] },
    { href: "/my-donations", label: "My Donations", icon: HandHeart, allowedRoles: ["Donor"] },

    // Beneficiary
    { href: "/my-cases", label: "My Cases", icon: FileText, allowedRoles: ["Beneficiary"] },
    { href: "/campaigns", label: "View Public Cases", icon: Megaphone, allowedRoles: ["Beneficiary"] },
    
    // Admin
    { href: "/admin", label: "Dashboard", icon: Home, allowedRoles: ["Admin", "Super Admin", "Finance Admin"] },
    
    // Admin - Organization (Collapsible)
    {
        label: "Organization",
        icon: Building,
        allowedRoles: ["Admin", "Super Admin", "Finance Admin"],
        subItems: [
            { href: "/admin/organization", label: "Org Profile" },
            { href: "/admin/campaigns", label: "Campaigns" },
            { href: "/admin/leads", label: "All Leads" },
            { href: "/admin/donations", label: "All Donations" },
        ]
    },

    // Super Admin - User Management (Collapsible)
    { 
        label: "User Management", 
        icon: UserCog, 
        allowedRoles: ["Super Admin"],
        subItems: [
            { href: "/admin/user-management", label: "All Users" },
            { href: "/admin/donors", label: "All Donors" },
            { href: "/admin/beneficiaries", label: "All Beneficiaries" },
            { href: "/admin/board-members", label: "Board Members" },
            { href: "/admin/user-management/roles", label: "User Roles", icon: Shield },
            { href: "/admin/user-management/groups", label: "User Groups", icon: Group },
            { href: "/admin/user-management/privileges", label: "User Privileges", icon: KeySquare },
        ]
    },
    
    // Super Admin - App Settings (Collapsible)
    { 
        label: "App Settings", 
        icon: Settings, 
        allowedRoles: ["Super Admin"],
        subItems: [
            { href: "/admin/settings", label: "General Settings" },
            { href: "/admin/seed", label: "Seed Database", icon: Database },
            { href: "/services", label: "Services Summary", icon: Server },
            { href: "/dependencies", label: "Dependency Map", icon: Share2 },
            { href: "/validator", label: "Configuration Validator", icon: ShieldCheck },
            { href: "/personas", label: "AI Personas", icon: BrainCircuit },
        ]
    },
    
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
    const visibleNavItems = allNavItems.filter(item => {
        if (item.label === 'Organization') {
            // Show the Organization menu if user has ANY of the roles that can see its sub-items.
            return userRoles.includes('Admin') || userRoles.includes('Super Admin') || userRoles.includes('Finance Admin');
        }
        return item.allowedRoles.includes(activeRole);
    });

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
    
    const filterSubItems = (item: NavItem) => {
        const adminLinks = ["/admin/leads", "/admin/campaigns"];
        const financeLinks = ["/admin/donations"];
        const superAdminLinks = ["/admin/organization"];

        return item.subItems?.filter(sub => {
             if (activeRole === 'Super Admin') return true;
             if (activeRole === 'Admin' && (adminLinks.includes(sub.href) || financeLinks.includes(sub.href))) return true;
             if (activeRole === 'Finance Admin' && financeLinks.includes(sub.href)) return true;
             return false;
        }) || [];
    }

    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 overflow-y-auto">
            {visibleNavItems.map((item) => {
                const key = item.label + activeRole;
                if (item.subItems) {
                    // For collapsible menus like Organization, we need a different check
                    let subItemsToRender = item.subItems;
                    if (item.label === 'Organization') {
                        subItemsToRender = filterSubItems(item);
                        if(subItemsToRender.length === 0) return null; // Don't render the menu if no sub-items are visible
                    }

                    const isAnySubItemActive = subItemsToRender.some(sub => sub.href && pathname.startsWith(sub.href));

                    return (
                         <Collapsible key={key} defaultOpen={isAnySubItemActive}>
                            <CollapsibleTrigger className="w-full">
                                 <div className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                    isAnySubItemActive && "text-primary"
                                )}>
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                    <ChevronDown className="h-4 w-4 ml-auto transition-transform [&[data-state=open]]:rotate-180" />
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pl-8 pt-2 space-y-1">
                                {subItemsToRender.map(subItem => {
                                    const isSubActive = subItem.href && pathname.startsWith(subItem.href);
                                    return (
                                        <Link
                                            key={subItem.href}
                                            href={subItem.href}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                                isSubActive && "bg-muted text-primary"
                                            )}
                                        >
                                            {subItem.icon && <subItem.icon className="h-3.5 w-3.5" />}
                                            {subItem.label}
                                        </Link>
                                    )
                                })}
                            </CollapsibleContent>
                        </Collapsible>
                    )
                }

                const isActive = (item.href === '/' && pathname === '/') || 
                                 (item.href && item.href !== '/' && pathname.startsWith(item.href));

                return (
                    <Link
                        key={key}
                        href={item.href || '#'}
                        onClick={(e) => handleNavClick(e as any, item)}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                            isActive && "bg-muted text-primary"
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
