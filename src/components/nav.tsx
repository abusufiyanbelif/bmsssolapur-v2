
"use client";

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
    Home, 
    Settings, 
    Share2, 
    ShieldCheck, 
    UserCog, 
    User, 
    HandHeart, 
    Users,
    FileCheck,
    Upload,
    FileText,
    BadgePercent,
    Banknote,
    BarChart,
    UserPlus,
    Lock,
    BookText,
    Wrench,
    Download,
    Eye,
    Megaphone,
    Info,
    LogIn
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
    { href: "/approved-leads", label: "Approved Leads", icon: FileCheck },
    { href: "/my-donations", label: "My Donations", icon: HandHeart },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/reminders", label: "Reminders", icon: BadgePercent },
];

const beneficiaryNavItems: NavItem[] = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/my-cases", label: "My Cases", icon: FileText },
    { href: "/upload-documents", label: "Upload Documents", icon: Upload },
    { href: "/case-status", label: "Case Status", icon: FileCheck },
    { href: "/settings", label: "Settings", icon: Settings },
];

const adminNavItems: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/leads/add", label: "Add Lead", icon: UserPlus },
    { href: "/admin/leads", label: "All Leads", icon: Users },
    { href: "/admin/approvals", label: "Approvals", icon: FileCheck },
    { href: "/admin/verifications", label: "Upload Verifications", icon: Upload },
    { href: "/admin/donations", label: "Donations", icon: Banknote, subRoles: ["Finance Admin"] },
    { href: "/admin/donations/verify", label: "Verify Donation Proofs", icon: ShieldCheck, subRoles: ["Finance Admin"] },
    { href: "/admin/reports/donations", label: "Donation Reports", icon: BarChart, subRoles: ["Finance Admin"] },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart, subRoles: ["Founder", "Co-Founder"] },
    { href: "/admin/reports/cases", label: "Case Reports", icon: FileText, subRoles: ["Founder", "Co-Founder"] },
    { href: "/profile", label: "Settings", icon: Settings },
];

const superAdminNavItems: NavItem[] = [
    ...adminNavItems,
    { href: "/admin/user-management", label: "User Management", icon: UserCog },
    { href: "/admin/role-assignment", label: "Role Assignment", icon: Lock },
    { href: "/admin/logs", label: "All Logs", icon: BookText },
    { href: "/admin/app-settings", label: "App Settings", icon: Settings },
    { href: "/admin/maintenance", label: "Maintenance Toggle", icon: Wrench },
    { href: "/admin/export", label: "Data Export", icon: Download },
    { href: "/admin/module-visibility", label: "Module Visibility", icon: Eye },
];


const allNavItems = {
    'Guest': guestNavItems,
    'Donor': donorNavItems,
    'Beneficiary': beneficiaryNavItems,
    'Admin': adminNavItems,
    'Super Admin': superAdminNavItems,
}

export function Nav() {
    const pathname = usePathname();

    // In a real app, you would get the user's role from your authentication context.
    // We can simulate different roles by changing the value here.
    // e.g., 'Super Admin', 'Admin', 'Donor', 'Beneficiary', 'Guest'
    const userRole: keyof typeof allNavItems = "Guest"; 

    const navItems = allNavItems[userRole] || [];

    const isDonationRoute = pathname.startsWith('/admin/donations');
    const isLeadsRoute = pathname.startsWith('/admin/leads');

    // Special case for root path when user is not a guest
    if (userRole !== 'Guest' && pathname === '/') {
        // In a real app, you might redirect to the user's specific dashboard
        // For now, we do nothing to prevent wrong highlighting.
    }


    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 overflow-y-auto">
            {navItems.map((item) => {
                const isActive = (
                    (item.href !== '/' && pathname.startsWith(item.href)) ||
                    (pathname === item.href)
                );
                
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
