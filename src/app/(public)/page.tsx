'use client';

import { Suspense } from "react";
import { PublicHomePage } from "../home/public-home-page";
import { Loader2 } from "lucide-react";

const LoadingState = () => (
    <div className="flex flex-col flex-1 items-center justify-center h-full">
        <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary" />
        <p className="mt-4 text-muted-foreground">Initializing...</p>
    </div>
);

// This page is now exclusively for guest users.
export default function Page() {
    return (
      <Suspense fallback={<LoadingState />}>
        <PublicHomePage />
      </Suspense>
    );
}
