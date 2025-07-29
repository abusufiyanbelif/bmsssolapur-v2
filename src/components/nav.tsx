"use client";

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Settings, Share2, ShieldCheck, Package2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/services", label: "Services Summary", icon: Settings },
    { href: "/dependencies", label: "Dependency Map", icon: Share2 },
    { href: "/validator", label: "Configuration Validator", icon: ShieldCheck },
];

export function Nav() {
    const pathname = usePathname();

    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => (
                <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        {
                            "bg-muted text-primary": pathname === item.href,
                        }
                    )}
                >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}
