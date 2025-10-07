
'use client';

import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const LoadingState = () => (
    <div className="flex flex-col flex-1 items-center justify-center h-full">
        <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary" />
        <p className="mt-4 text-muted-foreground">Initializing session...</p>
    </div>
);

// This page is now a simple landing spot after login.
// The AppShell is responsible for all redirection logic based on the user's role.
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // If for some reason a guest lands here, send them back to the public page.
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/');
    }
  }, [router]);
  
  return <LoadingState />;
}
