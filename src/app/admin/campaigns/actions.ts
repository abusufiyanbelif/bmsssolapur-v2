

"use server";

import { deleteCampaign as deleteCampaignService, getCampaign } from "@/services/campaign-service";
import { revalidatePath } from "next/cache";
import { writeBatch, doc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { updatePublicCampaign } from "@/services/public-data-service";
import { getLeadsByCampaignId } from "@/services/lead-service";

export async function handleBulkDeleteCampaigns(campaignIds: string[]) {
    try {
        const batch = writeBatch(db);
        
        for (const id of campaignIds) {
            // Check for linked leads before allowing deletion
            const linkedLeads = await getLeadsByCampaignId(id);
            if (linkedLeads.length > 0) {
                 const campaign = await getCampaign(id);
                 throw new Error(`Campaign "${campaign?.name || id}" cannot be deleted because it has ${linkedLeads.length} lead(s) linked to it. Please reassign or remove the leads first.`);
            }

            const campaignDocRef = doc(db, "campaigns", id);
            batch.delete(campaignDocRef);
            // Also delete from public collection
            await updatePublicCampaign({ id, status: 'Cancelled' } as any, true);
        }
        await batch.commit();
        
        revalidatePath("/admin/campaigns");
        revalidatePath("/campaigns", 'layout');
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred during bulk deletion.";
        console.error("Error bulk deleting campaigns:", error);
        return { success: false, error: `Failed to delete campaigns: ${error}` };
    }
}
