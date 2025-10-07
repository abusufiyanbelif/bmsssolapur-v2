// src/app/admin/user-management/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { UserManagementPageClient } from "./user-management-client";
import { getAllUsers } from "@/services/user-service";
import type { User } from "@/services/types";

async function UsersPageDataLoader() {
  try {
    const allUsers = await getAllUsers();
    // The getAllUsers function now correctly converts timestamps.
    return <UserManagementPageClient initialUsers={JSON.parse(JSON.stringify(allUsers))} />;
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    return <UserManagementPageClient initialUsers={[]} error={error} />;
  }
}

export default function UserManagementPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <UsersPageDataLoader />
        </Suspense>
    )
}
