

"use server";

import { revalidatePath } from "next/cache";
import type { Lead, User } from "@/services/types";
import { getUser } from "@/services/user-service";
import { handleFundTransfer } from "../../leads/[id]/actions";

interface FormState {
    success: boolean;
    error?: string;
    lead?: Lead;
}

export async function handleAddTransfer(
  formData: FormData
): Promise<FormState> {
  const adminUserId = formData.get("adminUserId") as string;
  const leadId = formData.get("leadId") as string;
  
  if (!adminUserId || !leadId) {
    return { success: false, error: "Could not identify the administrator or the selected lead. Please try again." };
  }

  try {
    const result = await handleFundTransfer(leadId, formData);

    if (result.success) {
        revalidatePath("/admin/transfers");
        return { success: true };
    } else {
        // Pass the specific error from the underlying function
        return { success: false, error: result.error };
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Error adding transfer:", error);
    return {
      success: false,
      error: error,
    };
  }
}
