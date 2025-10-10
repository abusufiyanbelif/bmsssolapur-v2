
// src/app/profile/layout.tsx
import { getCurrentUser } from '@/app/actions';
import { ProfileLayoutClient } from './profile-layout-client';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cookies } from 'next/headers';
import { cloneElement } from 'react';

// This is now a Server Component that fetches data
export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        return (
            <div className="flex-1 space-y-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Not Authenticated</AlertTitle>
                    <AlertDescription>You must be logged in to view this page.</AlertDescription>
                </Alert>
            </div>
        );
    }
    
    // Fetch user data on the server
    const user = await getCurrentUser(userId);

    // Pass the plain user data to the client component and its children
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return cloneElement(child, { user: user } as any);
        }
        return child;
    });


    return (
        <ProfileLayoutClient user={user}>
            {childrenWithProps}
        </ProfileLayoutClient>
    );
}
