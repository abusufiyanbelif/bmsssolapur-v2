
"use server";

import { deleteLead } from "@/services/lead-service";
import { revalidatePath } from "next/cache";

export async function handleDeleteLead(leadId: string) {
    try {
        await deleteLead(leadId);
        revalidatePath("/admin/leads");
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred";
        return { success: false, error };
    }
}
