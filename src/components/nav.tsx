
"use client";

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
    Home, 
    Settings, 
    Share2, 
    ShieldCheck, 
    UserCog, 
    HandHeart, 
    Users,
    FileCheck,
    Upload,
    FileText,
    BadgePercent,
    Banknote,
    UserPlus,
    Lock,
    BookText,
    Wrench,
    Download,
    Eye,
    Megaphone,
    Info,
    LogIn,
    Server,
    BrainCircuit
} from "lucide-react"

import { cn } from "@/lib/utils"

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  subRoles?: string[];
};

const guestNavItems: NavItem[] = [
    { href: "/", label: "Home", icon: Home },
    { href: "/campaigns", label: "Approved Campaigns", icon: Megaphone },
    { href: "/organization", label: "Organization Details", icon: Info },
    { href: "/login", label: "Login / Register", icon: LogIn },
];

const donorNavItems: NavItem[] = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/campaigns", label: "Approved Leads", icon: FileCheck },
    { href: "/my-donations", label: "My Donations", icon: HandHeart },
    { href: "/profile", label: "Settings", icon: Settings },
    { href: "/reminders", label: "Reminders", icon: BadgePercent },
];

const beneficiaryNavItems: NavItem[] = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/my-cases", label: "My Cases", icon: FileText },
    { href: "/upload-documents", label: "Upload Documents", icon: Upload },
    { href: "/case-status", label: "Case Status", icon: FileCheck },
    { href: "/profile", label: "Settings", icon: Settings },
];

const adminNavItems: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/leads", label: "All Leads", icon: Users },
    { href: "/admin/donations", label: "Donations", icon: Banknote, subRoles: ["Finance Admin"] },
    { href: "/profile", label: "Profile", icon: UserCog },
];

const superAdminNavItems: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/leads", label: "All Leads", icon: Users },
    { href: "/admin/donations", label: "Donations", icon: Banknote },
    { href: "/admin/user-management", label: "User Management", icon: UserPlus },
    { href: "/admin/role-assignment", label: "Role Assignment", icon: Lock },
    { href: "/admin/logs", label: "All Logs", icon: BookText },
    { href: "/admin/app-settings", label: "App Settings", icon: Settings },
    { href: "/admin/maintenance", label: "Maintenance Toggle", icon: Wrench },
    { href: "/admin/export", label: "Data Export", icon: Download },
    { href: "/admin/module-visibility", label: "Module Visibility", icon: Eye },
    { href: "/services", label: "Services Summary", icon: Server },
    { href: "/dependencies", label: "Dependency Map", icon: Share2 },
    { href: "/validator", label: "Configuration Validator", icon: ShieldCheck },
    { href: "/personas", label: "AI Personas", icon: BrainCircuit },
    { href: "/profile", label: "Profile", icon: UserCog },
];


const allNavItems: Record<string, NavItem[]> = {
    'Guest': guestNavItems,
    'Donor': donorNavItems,
    'Beneficiary': beneficiaryNavItems,
    'Admin': adminNavItems,
    'Super Admin': superAdminNavItems,
}

export function Nav({ activeRole }: { activeRole: string }) {
    const pathname = usePathname();
    
    let navItems: NavItem[] = allNavItems[activeRole] || guestNavItems;

    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 overflow-y-auto">
            {navItems.map((item) => {
                // Determine if the link is active
                const isActive = (item.href === '/' && pathname === '/') || 
                                 (item.href !== '/' && pathname.startsWith(item.href));
                
                // A real implementation would also check sub-roles here
                // if (item.subRoles && !currentUser.subRoles.some(r => item.subRoles.includes(r))) {
                //     return null;
                // }

                return (
                    <Link
                        key={item.label}
                        href={item.href}
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
