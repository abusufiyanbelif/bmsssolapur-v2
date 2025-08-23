
'use client';

import { Suspense, useEffect, useState } from "react";
import { DonorDashboardContent } from './donor-dashboard-content';
import { Loader2 } from "lucide-react";

export default function DonorDashboardPage() {
  return (
    <Suspense fallback={
        <div className="flex flex-col flex-1 items-center justify-center h-full">
            <Loader2 className="animate-spin rounded-full h-16 w-16 text-primary" />
            <p className="mt-4 text-muted-foreground">Loading Donor Dashboard...</p>
        </div>
    }>
        <DonorDashboardContent />
    </Suspense>
  );
}
