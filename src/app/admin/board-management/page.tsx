
import { Suspense } from "react";
import { getAllUsers } from "@/services/user-service";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BoardManagementClient } from "./board-management-client";

// This is now a pure Server Component for fetching data.
async function BoardManagementDataLoader() {
  try {
    const allUsers = await getAllUsers();
    // Ensure data is serializable before passing to client component
    const plainUsers = JSON.parse(JSON.stringify(allUsers));
    return <BoardManagementClient initialUsers={plainUsers} />;
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    return <BoardManagementClient initialUsers={[]} error={error} />;
  }
}

export default function BoardManagementPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <BoardManagementDataLoader />
        </Suspense>
    );
}
