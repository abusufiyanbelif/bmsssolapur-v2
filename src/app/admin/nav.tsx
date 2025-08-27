"use client";

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
    Home, Settings, Share2, ShieldCheck, UserCog, HandHeart, Users,
    FileCheck, FileText, Banknote, UserPlus, BookText,
    Wrench, Download, Eye, Megaphone, Info, LogIn, Server, BrainCircuit, FilePlus2,
    Database, Building, Award, ChevronDown, Shield, KeySquare, Group, BookOpenCheck, ArrowRightLeft, LayoutDashboard, Workflow, UserSearch, CreditCard, BellRing, MessageSquare, Newspaper, Receipt, History
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils"

type NavSubItem = {
    href?: string;
    label: string;
    icon?: React.ElementType;
    subItems?: NavSubItem[]; // For nested collapsibles
    allowedRoles?: string[];
};

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
    { href: "/public-leads", label: "General Cases", icon: Users, allowedRoles: ["Guest"] },
    { href: "/campaigns", label: "Campaigns", icon: Megaphone, allowedRoles: ["Guest"] },
    { href: "/organization", label: "Organization Details", icon: Info, allowedRoles: ["Guest"] },
    
    // Authenticated User Home (common entry point)
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        allowedRoles: ["Donor", "Beneficiary", "Admin", "Super Admin", "Finance Admin", "Referral"],
        subItems: [
            { href: "/home", label: "Overview", icon: Home, allowedRoles: ["Donor", "Beneficiary", "Admin", "Super Admin", "Finance Admin", "Referral"] },
            { href: "/admin/dashboard-settings", label: "Dashboard Settings", icon: Settings, allowedRoles: ["Super Admin"] }
        ]
    },
    
    // Donor
    { href: "/donate", label: "Donate Now", icon: HandHeart, allowedRoles: ["Donor"] },
    { href: "/public-leads", label: "General Cases", icon: Users, allowedRoles: ["Donor"] },
    { href: "/campaigns", label: "Campaigns", icon: Megaphone, allowedRoles: ["Donor"] },
    { href: "/my-donations", label: "My Donations", icon: HandHeart, allowedRoles: ["Donor"] },

    // Beneficiary
    { href: "/my-cases", label: "My Cases", icon: FileText, allowedRoles: ["Beneficiary"] },
    { href: "/request-help", label: "Request Help", icon: FilePlus2, allowedRoles: ["Beneficiary"] },
    
    // Referral
    { href: "/referral/my-beneficiaries", label: "My Referrals", icon: Users, allowedRoles: ["Referral"] },
    
    // Admin - Communications (Collapsible)
    {
        label: "Communications",
        icon: MessageSquare,
        allowedRoles: ["Admin", "Super Admin"],
        subItems: [
            { href: "/admin/communications", label: "Generate Messages", icon: MessageSquare, allowedRoles: ["Admin", "Super Admin"] },
            { href: "/admin/communications/configuration", label: "Configuration", icon: Settings, allowedRoles: ["Super Admin"] },
        ]
    },

    // Admin - Organization (Collapsible)
    {
        label: "Organization",
        icon: Building,
        allowedRoles: ["Admin", "Super Admin", "Finance Admin"],
        subItems: [
            { href: "/admin/organization", label: "Organization Profile", icon: Info, allowedRoles: ["Admin", "Super Admin", "Finance Admin"] },
            { href: "/admin/board-management", label: "Board Members", icon: Users, allowedRoles: ["Admin", "Super Admin", "Finance Admin"] },
            { href: "/admin/organization/letterhead", label: "Letterhead", icon: Newspaper, allowedRoles: ["Admin", "Super Admin", "Finance Admin"] },
            { href: "/admin/organization/expenses", label: "Operational Expenses", icon: Receipt, allowedRoles: ["Admin", "Super Admin", "Finance Admin"] },
        ]
    },
    
    // Admin - Campaigns Management (Collapsible)
    {
        label: "Campaigns Management",
        icon: Megaphone,
        allowedRoles: ["Admin", "Super Admin", "Finance Admin"],
        subItems: [
            { href: "/admin/campaigns", label: "All Campaigns", icon: Megaphone, allowedRoles: ["Admin", "Super Admin", "Finance Admin"] },
        ]
    },


     // Admin - Lead Management (Collapsible)
    {
        label: "Lead Management",
        icon: FileCheck,
        allowedRoles: ["Admin", "Super Admin", "Finance Admin"],
        subItems: [
            { href: "/admin/leads", label: "All Leads", icon: FileText, allowedRoles: ["Admin", "Super Admin", "Finance Admin"] },
            { href: "/admin/leads/configuration", label: "Configuration", icon: BookText, allowedRoles: ["Super Admin"] },
        ]
    },
    
     // Admin - Donations Management (Collapsible)
    {
        label: "Donations Management",
        icon: HandHeart,
        allowedRoles: ["Admin", "Super Admin", "Finance Admin"],
        subItems: [
            { href: "/admin/donations", label: "All Donations", icon: HandHeart, allowedRoles: ["Admin", "Super Admin", "Finance Admin"] },
            { href: "/admin/donations/configuration", label: "Configuration", icon: Banknote, allowedRoles: ["Super Admin"] },
        ]
    },
    
     // Admin - Beneficiaries Transfer Management (Collapsible)
    {
        label: "Transfers Management",
        icon: ArrowRightLeft,
        allowedRoles: ["Admin", "Super Admin", "Finance Admin"],
        subItems: [
            { href: "/admin/transfers", label: "All Transfers", icon: ArrowRightLeft, allowedRoles: ["Admin", "Super Admin", "Finance Admin"] },
            { href: "/admin/transfers/configuration", label: "Configuration", icon: Settings, allowedRoles: ["Super Admin"] },
        ]
    },


    // User Management (Collapsible) - Visible to both Admin and Super Admin
    { 
        label: "User Management", 
        icon: UserCog, 
        allowedRoles: ["Admin", "Super Admin", "Finance Admin"],
        subItems: [
            { href: "/admin/user-management", label: "All Users", icon: Users, allowedRoles: ["Super Admin"] },
            { href: "/admin/donors", label: "All Donors", icon: HandHeart, allowedRoles: ["Admin", "Super Admin", "Finance Admin"] },
            { href: "/admin/beneficiaries", label: "All Beneficiaries", icon: Users, allowedRoles: ["Admin", "Super Admin", "Finance Admin"] },
            { href: "/admin/referrals", label: "All Referrals", icon: UserSearch, allowedRoles: ["Admin", "Super Admin", "Finance Admin"] },
            { 
                label: "Access Management", 
                icon: KeySquare,
                allowedRoles: ["Super Admin"],
                subItems: [
                    { href: "/admin/user-management/roles", label: "User Roles", icon: Shield, allowedRoles: ["Super Admin"] },
                    { href: "/admin/user-management/groups", label: "User Groups", icon: Group, allowedRoles: ["Super Admin"] },
                    { href: "/admin/user-management/privileges", label: "User Privileges", icon: KeySquare, allowedRoles: ["Super Admin"] },
                ]
            },
        ]
    },
    
    // Super Admin - Data Profiling & Analytics (Collapsible)
    { 
        label: "Data Profiling & Analytics", 
        icon: BrainCircuit, 
        allowedRoles: ["Super Admin"],
        subItems: [
            { href: "/admin/data-analytics", label: "Analytics Dashboard", icon: LayoutDashboard },
            { href: "/admin/data-analytics/configuration", label: "Configuration", icon: Settings },
        ]
    },
    
    // Super Admin - App Settings (Collapsible)
    { 
        label: "App Settings", 
        icon: Settings, 
        allowedRoles: ["Super Admin"],
        subItems: [
            { href: "/admin/settings", label: "General Settings" },
            { href: "/admin/payment-gateways", label: "Payment Gateways", icon: CreditCard },
            { href: "/admin/settings/notifications", label: "Notification Settings", icon: BellRing },
            { href: "/admin/seed", label: "Seed Database", icon: Database },
            { href: "/services", label: "Services Summary", icon: Server },
            { href: "/dependencies", label: "Dependency Map", icon: Share2 },
            { href: "/validator", label: "Configuration Validator", icon: ShieldCheck },
            { href: "/personas", label: "AI Personas", icon: BrainCircuit },
            { href: "/admin/audit-trail", label: "Audit Trail", icon: History },
        ]
    },
    
    // Shared / Profile (Visible to all logged-in users)
    { href: "/profile/settings", label: "Profile", icon: UserCog, allowedRoles: ["Donor", "Beneficiary", "Admin", "Super Admin", "Finance Admin", "Referral"] },
];

interface NavProps {
    userRoles: string[];
    activeRole: string;
    onRoleSwitchRequired: (requiredRole: string) => void;
}

const NavLink = ({ item, isActive, onClick, paddingLeft }: { item: NavItem | NavSubItem, isActive: boolean, onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void, paddingLeft?: string }) => {
    const Icon = item.icon;
    return (
        <Link
            href={item.href || '#'}
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                isActive && "bg-muted text-primary",
                paddingLeft
            )}
        >
            {Icon && <Icon className="h-4 w-4" />}
            {item.label}
        </Link>
    );
};

const NavCollapsible = ({ item, pathname, level = 0, userRoles, activeRole, onRoleSwitchRequired }: { item: NavItem | NavSubItem, pathname: string, level?: number, userRoles: string[], activeRole: string, onRoleSwitchRequired: (requiredRole: string) => void }) => {
    const Icon = item.icon;
    const isAnySubItemActive = item.subItems?.some(sub => sub.href && pathname.startsWith(sub.href)) || 
                               item.subItems?.some(sub => sub.subItems?.some(s => s.href && pathname.startsWith(s.href))) ||
                               (item.href && pathname.startsWith(item.href));

    const paddingLeft = level > 0 ? `pl-${level * 4}` : '';
    
    // Filter sub-items based on the active role
    const visibleSubItems = item.subItems?.filter(subItem => {
        if (!subItem.allowedRoles) return true; // if no roles specified, it's visible to all parent roles
        return subItem.allowedRoles.includes(activeRole);
    }) || [];

    if(visibleSubItems.length === 0) return null;
    
    const TriggerContent = (
        <div className={cn(
            "flex items-center w-full gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
            isAnySubItemActive && "text-primary"
        )}>
            {Icon && <Icon className="h-4 w-4" />}
            {item.label}
            <ChevronDown className="h-4 w-4 ml-auto transition-transform [&[data-state=open]]:rotate-180" />
        </div>
    );

    return (
        <Collapsible key={item.label} defaultOpen={isAnySubItemActive} className={paddingLeft}>
            <CollapsibleTrigger asChild>
                {item.href ? (
                    <Link href={item.href}>{TriggerContent}</Link>
                ) : (
                    <div className="w-full cursor-pointer">{TriggerContent}</div>
                )}
            </CollapsibleTrigger>
            <CollapsibleContent className={cn("pt-1 space-y-1", `pl-${(level + 1) * 4}`)}>
                {visibleSubItems.map(subItem => {
                    if (subItem.subItems) {
                        return <NavCollapsible key={subItem.label} item={subItem} pathname={pathname} level={level + 1} userRoles={userRoles} activeRole={activeRole} onRoleSwitchRequired={onRoleSwitchRequired} />
                    }
                    const isSubActive = subItem.href ? pathname.startsWith(subItem.href) : false;
                    return <NavLink key={subItem.href} item={subItem} isActive={isSubActive} />
                })}
            </CollapsibleContent>
        </Collapsible>
    )
}


export function Nav({ userRoles, activeRole, onRoleSwitchRequired }: NavProps) {
    const pathname = usePathname();
    
    const visibleNavItems = allNavItems.filter(item => {
        if ('allowedRoles' in item) {
            return item.allowedRoles.includes(activeRole);
        }
        return true;
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
    };
    
    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {visibleNavItems.map((item) => {
                const key = item.label + activeRole;
                 if (item.subItems) {
                    return <NavCollapsible key={key} item={item} pathname={pathname} userRoles={userRoles} activeRole={activeRole} onRoleSwitchRequired={onRoleSwitchRequired} />;
                }
                const isActive = (item.href === '/' && pathname === '/') || 
                                 (item.href && item.href !== '/' && pathname.startsWith(item.href));
                return (
                    <NavLink 
                        key={key} 
                        item={item} 
                        isActive={isActive} 
                        onClick={(e) => handleNavClick(e, item)}
                    />
                );
            })}
        </nav>
    );
}
