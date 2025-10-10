
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Settings, ListChecks } from 'lucide-react';
import type { User } from '@/services/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const profileNavItems = [
    { href: "/profile/settings", label: "Account Settings", icon: Settings },
    { href: "/profile/history", label: "Activity History", icon: ListChecks },
]

interface ProfileLayoutClientProps {
    user: User | null;
    children: React.ReactNode;
}

export function ProfileLayoutClient({ user, children }: ProfileLayoutClientProps) {
  const pathname = usePathname();

  if (!user) {
    return (
       <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Could not load user profile.</AlertDescription>
        </Alert>
    );
  }
  
  const userInitials = user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  const uniqueRoles = [...new Set(user.roles)];

  return (
    <div className="flex-1 space-y-4">
        <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">User Profile</h2>
        <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-4">
            <div className="md:col-span-1">
                <Card>
                    <CardHeader className="items-center text-center">
                        <Avatar className="w-24 h-24 mb-4">
                            <AvatarImage src={`https://placehold.co/100x100.png?text=${userInitials}`} alt={user.name} data-ai-hint="female portrait" />
                            <AvatarFallback>{userInitials}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-primary">{user.name}</CardTitle>
                        <CardDescription>{user.userId}</CardDescription>
                        <Badge variant="outline" className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <div className="flex flex-wrap justify-center gap-2 pt-2">
                            {uniqueRoles.map(role => (
                                <Badge key={role} variant="secondary">{role}</Badge>
                            ))}
                        </div>
                    </CardHeader>
                </Card>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
                <nav className="flex border-b">
                    {profileNavItems.map(item => (
                         <Link 
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground -mb-px border-b-2 border-transparent hover:text-primary hover:border-primary/50",
                                pathname === item.href && "text-primary border-primary"
                            )}
                         >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="mt-6">
                    {children}
                </div>
            </div>
        </div>
    </div>
  )
}
