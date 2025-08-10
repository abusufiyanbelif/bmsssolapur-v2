"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getUser } from '@/services/user-service';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      const storedUserId = localStorage.getItem('userId');
      const activeRole = localStorage.getItem('activeRole');

      if (!storedUserId || !activeRole) {
        // Not logged in or no role selected, redirect to public home
        router.replace('/');
        return;
      }
      
      let redirectTo = '/'; // Default fallback

      if (activeRole === 'Donor') {
        redirectTo = '/donor';
      } else if (activeRole === 'Beneficiary') {
        redirectTo = '/beneficiary';
      } else if (['Admin', 'Super Admin', 'Finance Admin'].includes(activeRole)) {
        redirectTo = '/admin';
      } else {
         // Fallback for any other roles, or if activeRole is 'Guest'
         // This logic is for safety but the specific checks above should handle most cases.
         const user = await getUser(storedUserId);
         if (user) {
            const primaryRole = user.roles[0];
            if (primaryRole === 'Donor') redirectTo = '/donor';
            else if (primaryRole === 'Beneficiary') redirectTo = '/beneficiary';
            else if (['Admin', 'Super Admin', 'Finance Admin'].includes(primaryRole)) redirectTo = '/admin';
            else redirectTo = '/'; // Public home
         }
      }
      
      router.replace(redirectTo);
    };

    checkRoleAndRedirect();
  }, [router]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
    </div>
  );
}
