// src/app/admin/leads/create-from-document/page.tsx

import { Suspense } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { CreateFromDocumentClient } from "./create-from-document-client";
import { getAllUsers, getAllCampaigns, getAppSettings } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

async function CreateFromDocumentDataLoader() {
    try {
        const [users, campaigns, settings] = await Promise.all([
            getAllUsers(),
            getAllCampaigns(),
            getAppSettings(),
        ]);
        
        return <CreateFromDocumentClient users={users} campaigns={campaigns} settings={settings} />;
    } catch(e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred.";
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Page</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
}

export default function CreateFromDocumentPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <CreateFromDocumentDataLoader />
        </Suspense>
    );
}
