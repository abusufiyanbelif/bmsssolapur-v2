

"use server";

import { doc, writeBatch, getDoc, increment } from "firebase/firestore";
import { db } from "@/services/firebase";
import { revalidatePath } from "next/cache";
import { Lead, FundTransfer } from "@/services/types";

export async function handleBulkDeleteTransfers(uniqueIds: string[]) {
    try {
        if (uniqueIds.length === 0) {
            return { success: false, error: "No transfers selected." };
        }

        const batch = writeBatch(db);
        const leadsToUpdate: Record<string, { lead: Lead, transfersToDeleteIndices: Set<number> }> = {};

        // Step 1: Group transfers by leadId and collect indices to delete
        for (const uniqueId of uniqueIds) {
            const [leadId, transferIndexStr] = uniqueId.split('_');
            const transferIndex = parseInt(transferIndexStr, 10);

            if (!leadsToUpdate[leadId]) {
                const leadDocRef = doc(db, "leads", leadId);
                const leadDoc = await getDoc(leadDocRef);
                if (!leadDoc.exists()) {
                    console.warn(`Lead with ID ${leadId} not found for transfer deletion.`);
                    continue;
                }
                const leadData = leadDoc.data() as Lead;
                leadsToUpdate[leadId] = { lead: leadData, transfersToDeleteIndices: new Set() };
            }
            
            leadsToUpdate[leadId].transfersToDeleteIndices.add(transferIndex);
        }
        
        // Step 2: For each affected lead, calculate updates and add to batch
        for (const leadId in leadsToUpdate) {
            const { lead, transfersToDeleteIndices } = leadsToUpdate[leadId];
            
            if (transfersToDeleteIndices.size === 0) continue;

            const amountToDecrement = Array.from(transfersToDeleteIndices).reduce((sum, index) => {
                const transfer = lead.fundTransfers?.[index];
                return sum + (transfer?.amount || 0);
            }, 0);
            
            // Rebuild the array, excluding the deleted indices.
            const updatedTransfers = (lead.fundTransfers || []).filter(
                (_, index) => !transfersToDeleteIndices.has(index)
            );

            const leadRef = doc(db, "leads", leadId);
            batch.update(leadRef, {
                fundTransfers: updatedTransfers,
                helpGiven: increment(-amountToDecrement)
            });
        }
        
        await batch.commit();
        
        revalidatePath("/admin/transfers");
        revalidatePath("/admin/leads");
        Object.keys(leadsToUpdate).forEach(leadId => revalidatePath(`/admin/leads/${leadId}`));
        revalidatePath("/admin");
        revalidatePath("/");

        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred during bulk deletion.";
        console.error("Error bulk deleting transfers:", error);
        return { success: false, error: `Failed to delete transfers: ${error}` };
    }
}
