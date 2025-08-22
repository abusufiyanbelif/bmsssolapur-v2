
"use server";

import { getUser, updateUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";
import { arrayUnion } from "firebase/firestore";

interface FormState {
    success: boolean;
    error?: string;
}

export async function handleAddBoardMember(userId: string, role: string): Promise<FormState> {
  try {
    const user = await getUser(userId);
    if (!user) {
        return { success: false, error: "Selected user not found." };
    }
    
    // Use arrayUnion to add the new group without duplicating it
    await updateUser(userId, { groups: arrayUnion(role) as any });
    
    revalidatePath("/admin/board-management");
    revalidatePath("/organization");

    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred while adding the board member.";
    console.error("Error adding board member:", error);
    return {
      success: false,
      error: `Failed to add board member: ${error}`,
    };
  }
}
