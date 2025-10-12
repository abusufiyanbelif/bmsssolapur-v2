
// src/app/admin/user-management/page.tsx
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { UserManagementPageClient } from "./user-management-client";
import { getAllUsersAction } from "./actions";

// This is now a Server Component that fetches data
async function UsersPageDataLoader() {
  try {
    // This server action now correctly fetches and serializes the user data.
    const allUsers = await getAllUsersAction();
    return <UserManagementPageClient initialUsers={allUsers} />;
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    return <UserManagementPageClient initialUsers={[]} error={error} />;
  }
}

export default function UserManagementPage() {
    return (
        // Use a Suspense boundary to show a loading state while the server fetches data
        <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <UsersPageDataLoader />
        </Suspense>
    )
}
