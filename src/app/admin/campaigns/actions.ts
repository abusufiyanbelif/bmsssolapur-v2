
"use server";

import { deleteCampaign as deleteCampaignService } from "@/services/campaign-service";
import { revalidatePath } from "next/cache";
import { writeBatch, doc } from "firebase/firestore";
import { db } from "@/services/firebase";

export async function handleBulkDeleteCampaigns(campaignIds: string[]) {
    try {
        const batch = writeBatch(db);
        for (const id of campaignIds) {
            const campaignDocRef = doc(db, "campaigns", id);
            batch.delete(campaignDocRef);
        }
        await batch.commit();
        
        revalidatePath("/admin/campaigns");
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        return { success: false, error };
    }
}
