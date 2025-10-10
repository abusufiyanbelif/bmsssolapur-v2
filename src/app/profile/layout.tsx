
"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Settings, ListChecks } from 'lucide-react';
import type { User } from '@/services/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';
import { getCurrentUser } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';


const profileNavItems = [
    { href: "/profile/settings", label: "Account Settings", icon: Settings },
    { href: "/profile/history", label: "Activity History", icon: ListChecks },
];

const ProfileContext = createContext<User | null>(null);

export const useProfileUser = () => {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error("useProfileUser must be used within a ProfileLayout");
    }
    return context;
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                router.push('/login?redirect=/profile/settings');
                return;
            }

            try {
                const fetchedUser = await getCurrentUser(userId);
                if (fetchedUser) {
                    setUser(fetchedUser);
                } else {
                    setError("Could not load your user profile. Please try logging in again.");
                    localStorage.removeItem('userId');
                    router.push('/login');
                }
            } catch (e) {
                setError("An error occurred while fetching your profile.");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [router]);
    
    if (loading) {
        return (
             <div className="flex-1 space-y-4">
                <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">User Profile</h2>
                <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-4">
                    <div className="md:col-span-1">
                        <Card>
                            <CardHeader className="items-center text-center">
                                <Skeleton className="w-24 h-24 rounded-full" />
                                <Skeleton className="h-6 w-3/4 mt-4" />
                                <Skeleton className="h-4 w-1/2 mt-2" />
                            </CardHeader>
                        </Card>
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                        <div className="flex items-center justify-center h-64 border rounded-lg">
                           <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !user) {
         return (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Profile</AlertTitle>
              <AlertDescription>{error || "User data could not be found."}</AlertDescription>
            </Alert>
        );
    }
  
    const userInitials = user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    const uniqueRoles = [...new Set(user.roles)];

    return (
        <ProfileContext.Provider value={user}>
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
        </ProfileContext.Provider>
    );
}
