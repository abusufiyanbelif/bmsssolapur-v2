
"use server";

import { deleteCampaign as deleteCampaignService } from "@/services/campaign-service";
import { revalidatePath } from "next/cache";
import { writeBatch, doc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { updatePublicCampaign } from "@/services/public-data-service";

export async function handleBulkDeleteCampaigns(campaignIds: string[]) {
    try {
        const batch = writeBatch(db);
        for (const id of campaignIds) {
            const campaignDocRef = doc(db, "campaigns", id);
            batch.delete(campaignDocRef);
            // Also delete from public collection
            await updatePublicCampaign({ id, status: 'Cancelled' } as any);
        }
        await batch.commit();
        
        revalidatePath("/admin/campaigns");
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred during bulk deletion.";
        console.error("Error bulk deleting campaigns:", error);
        return { success: false, error: `Failed to delete campaigns: ${error}` };
    }
}
